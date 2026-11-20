// Shipyard overlay: buy hulls, drag modules onto mounts, upgrade and sell them.

import HULLS, { HULL_ORDER, drawHullArt, hullBounds } from './hulls';
import MATERIALS, { MATERIAL_ORDER } from '../world/materials';
import MODULES, { MODULE_ORDER, MAX_LEVEL, drawModule, moduleStats, upgradeCost, sellValue } from './modules';
import {
    getProfile, loadoutFor, ownsHull, selectHull, buyHull,
    installModule, upgradeModule, sellModule, computeShipStats,
    cargoUsed, cargoValue, sellCargo, spendCredits, REPAIR_COST_PER_HP, isDebug, setDebug, priceOf
} from './profile';

const SLOT_HIT_RADIUS = 16;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

const formatCredits = (value) => Math.round(value).toLocaleString('en-US') + ' cr';
// Prices read "FREE" in debug mode.
const formatPrice = (value) => (isDebug() ? 'FREE' : formatCredits(value));

const setupCanvas = (canvas, width, height) => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
};

const drawHullPreview = (ctx, hull, width, height, padding, maxScale) => {
    const b = hullBounds(hull);
    const scale = Math.min((width - padding * 2) / (b.maxX - b.minX), (height - padding * 2) / (b.maxY - b.minY),
        maxScale || Infinity);
    const offsetX = width / 2 - ((b.minX + b.maxX) / 2) * scale;
    const offsetY = height / 2 - ((b.minY + b.maxY) / 2) * scale;
    return { scale: scale, offsetX: offsetX, offsetY: offsetY };
};

class Shipyard {

    constructor() {
        this.isOpen = false;
        this.selectedSlot = null;
        this.armedModule = null;
        this.hoverSlot = null;
        this.drag = null;
        this.frameId = null;
        this.messageTimer = null;
        this.build();
    }

    build() {
        const root = el('div', 'shipyard');
        root.id = 'shipyard';

        const header = el('div', 'shipyard-header');
        header.appendChild(el('h1', '', 'Shipyard'));
        const tabs = el('div', 'shipyard-tabs');
        this.tabButtons = {};
        [['ship', 'Ship'], ['market', 'Market']].forEach(tab => {
            const button = el('button', 'sy-tab', tab[1]);
            button.addEventListener('click', () => this.showTab(tab[0]));
            tabs.appendChild(button);
            this.tabButtons[tab[0]] = button;
        });
        header.appendChild(tabs);
        this.debugButton = el('button', 'sy-tab debug-toggle', 'Debug');
        this.debugButton.title = 'Debug mode: unlock everything and make it free';
        this.debugButton.addEventListener('click', () => {
            setDebug(!isDebug());
            this.flash(isDebug() ? 'Debug mode ON: everything unlocked and free' : 'Debug mode OFF');
            this.refresh();
        });
        header.appendChild(this.debugButton);
        this.creditsLabel = el('div', 'shipyard-credits');
        header.appendChild(this.creditsLabel);
        this.closeButton = el('button', 'sy-button primary', 'Launch');
        this.closeButton.addEventListener('click', () => this.close());
        header.appendChild(this.closeButton);
        root.appendChild(header);

        const body = el('div', 'shipyard-body');

        const hullColumn = el('div', 'shipyard-panel hull-list');
        hullColumn.appendChild(el('h3', '', 'Hulls'));
        this.hullList = el('div', 'hull-cards');
        hullColumn.appendChild(this.hullList);
        body.appendChild(hullColumn);

        const center = el('div', 'shipyard-panel hull-view');
        this.hullTitle = el('div', 'hull-title');
        center.appendChild(this.hullTitle);
        this.canvasWrap = el('div', 'hull-canvas-wrap');
        this.canvas = el('canvas', 'hull-canvas');
        this.canvasWrap.appendChild(this.canvas);
        center.appendChild(this.canvasWrap);
        this.hint = el('div', 'shipyard-hint');
        center.appendChild(this.hint);
        this.statsBox = el('div', 'ship-stats');
        center.appendChild(this.statsBox);
        body.appendChild(center);

        const moduleColumn = el('div', 'shipyard-panel module-panel');
        moduleColumn.appendChild(el('h3', '', 'Modules'));
        this.palette = el('div', 'module-palette');
        moduleColumn.appendChild(this.palette);
        moduleColumn.appendChild(el('h3', '', 'Selected mount'));
        this.inspector = el('div', 'inspector');
        moduleColumn.appendChild(this.inspector);
        body.appendChild(moduleColumn);

        root.appendChild(body);
        this.shipBody = body;

        this.marketBody = el('div', 'shipyard-market');
        root.appendChild(this.marketBody);

        this.message = el('div', 'shipyard-message');
        root.appendChild(this.message);

        this.root = root;
        document.body.appendChild(root);

        this.buildPalette();
        this.bindCanvas();

        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if(this.armedModule) {
                    this.armedModule = null;
                    this.refresh();
                } else {
                    this.close();
                }
            }
        }, true);

        window.addEventListener('resize', () => { if(this.isOpen) this.resizeCanvas(); });
    }

    get hull() {
        return HULLS[getProfile().hull];
    }

    open(options) {
        this.options = options || {};
        this.isOpen = true;
        this.selectedSlot = null;
        this.armedModule = null;
        this.closeButton.textContent = this.options.closeLabel || 'Launch';
        this.root.classList.add('open');
        this.tab = this.options.tab || 'ship';
        this.refresh();
        this.resizeCanvas();
        const loop = () => {
            this.renderCanvas();
            this.frameId = requestAnimationFrame(loop);
        };
        loop();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        cancelAnimationFrame(this.frameId);
        this.endDrag();
        if(this.options.onClose) this.options.onClose();
    }

    flash(text) {
        this.message.textContent = text;
        this.message.classList.add('visible');
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => this.message.classList.remove('visible'), 2200);
    }

    // ------------------------------------------------------------ panels

    showTab(tab) {
        this.tab = tab;
        this.armedModule = null;
        this.refresh();
    }

    refresh() {
        const profile = getProfile();
        this.creditsLabel.textContent = isDebug() ? 'DEBUG · everything free' : formatCredits(profile.credits);
        this.debugButton.textContent = isDebug() ? 'Debug: ON' : 'Debug: OFF';
        this.debugButton.classList.toggle('active', isDebug());
        Object.keys(this.tabButtons).forEach(key => this.tabButtons[key].classList.toggle('active', key === this.tab));
        this.shipBody.style.display = this.tab === 'ship' ? '' : 'none';
        this.marketBody.style.display = this.tab === 'market' ? '' : 'none';
        this.renderMarket();
        this.renderHullList();
        this.renderTitle();
        this.renderStats();
        this.renderPalette();
        this.renderInspector();
        this.renderHint();
    }

    renderMarket() {
        const box = this.marketBody;
        const profile = getProfile();
        const capacity = computeShipStats(this.hull.id).cargo;
        box.innerHTML = '';

        const panel = el('div', 'shipyard-panel market-panel');
        panel.appendChild(el('h3', '', 'Ore exchange'));
        const canTrade = !!(this.options && this.options.canTrade);
        if(!canTrade) panel.appendChild(el('p', 'market-warning', 'Fly to the shipyard station and dock (B) to sell ore.'));
        panel.appendChild(el('p', 'muted', 'Cargo hold: ' + cargoUsed() + ' / ' + capacity +
            ' units. Prices are per unit; metals found further from base are worth more.'));

        const table = el('table', 'market-table');
        const head = el('tr');
        ['Material', 'Price', 'In hold', 'Value', ''].forEach(h => head.appendChild(el('th', '', h)));
        table.appendChild(head);

        MATERIAL_ORDER.forEach(id => {
            const material = MATERIALS[id];
            const amount = profile.cargo[id] || 0;
            const tr = el('tr', amount ? '' : 'empty');
            const name = el('td', 'material-name');
            const swatch = el('span', 'swatch');
            swatch.style.background = 'rgb(' + material.color + ')';
            swatch.style.boxShadow = '0 0 6px rgb(' + material.color + ')';
            name.appendChild(swatch);
            name.appendChild(document.createTextNode(material.name));
            tr.appendChild(name);
            tr.appendChild(el('td', '', formatCredits(material.price)));
            tr.appendChild(el('td', '', String(amount)));
            tr.appendChild(el('td', '', formatCredits(amount * material.price)));
            const cell = el('td');
            const sell = el('button', 'sy-button small', 'Sell');
            sell.disabled = amount === 0 || !canTrade;
            sell.addEventListener('click', () => {
                const earned = sellCargo(id);
                this.flash('Sold ' + material.name + ' for ' + formatCredits(earned));
                this.refresh();
            });
            cell.appendChild(sell);
            tr.appendChild(cell);
            table.appendChild(tr);
        });
        panel.appendChild(table);

        const total = cargoValue();
        const sellAll = el('button', 'sy-button buy', 'Sell all cargo  +' + formatCredits(total));
        sellAll.disabled = total === 0 || !canTrade;
        sellAll.addEventListener('click', () => {
            const earned = sellCargo();
            this.flash('Cargo sold for ' + formatCredits(earned));
            this.refresh();
        });
        panel.appendChild(sellAll);

        // Repairs are only offered when docked with a damaged ship.
        const status = this.options && this.options.hullStatus ? this.options.hullStatus() : null;
        if(status) {
            panel.appendChild(el('h3', 'market-section', 'Repairs'));
            const missing = Math.ceil(status.max - status.hp);
            if(missing <= 0) {
                panel.appendChild(el('p', 'muted', 'Hull at full strength.'));
            } else {
                const cost = priceOf(missing * REPAIR_COST_PER_HP);
                const affordable = isDebug() ? missing : Math.min(missing, Math.floor(profile.credits / REPAIR_COST_PER_HP));
                panel.appendChild(el('p', '', 'Hull ' + Math.ceil(status.hp) + ' / ' + status.max +
                    ' · ' + REPAIR_COST_PER_HP + ' cr per point'));
                const repair = el('button', 'sy-button', affordable < missing
                    ? 'Repair ' + affordable + ' points  ' + formatPrice(affordable * REPAIR_COST_PER_HP)
                    : 'Full repair  ' + formatPrice(cost));
                repair.disabled = affordable <= 0;
                repair.addEventListener('click', () => {
                    if(spendCredits(affordable * REPAIR_COST_PER_HP)) {
                        this.options.repair(affordable);
                        this.flash('Hull repaired.');
                    }
                    this.refresh();
                });
                panel.appendChild(repair);
            }
        }

        box.appendChild(panel);
    }

    renderHullList() {
        const profile = getProfile();
        this.hullList.innerHTML = '';

        HULL_ORDER.forEach(id => {
            const hull = HULLS[id];
            const owned = ownsHull(id);
            const active = profile.hull === id;
            const card = el('div', 'hull-card' + (active ? ' active' : '') + (owned ? ' owned' : ''));

            const thumb = el('canvas', 'hull-thumb');
            const ctx = setupCanvas(thumb, 120, 64);
            const fit = drawHullPreview(ctx, hull, 120, 64, 8);
            ctx.translate(fit.offsetX, fit.offsetY);
            ctx.scale(fit.scale, fit.scale);
            drawHullArt(ctx, hull, { lineWidth: 1.2 / fit.scale, glow: 4 });
            card.appendChild(thumb);

            const info = el('div', 'hull-info');
            info.appendChild(el('div', 'hull-name', hull.name));
            info.appendChild(el('div', 'hull-class', hull.className + ' · ' + hull.faction));
            info.appendChild(el('div', 'hull-meta', hull.slots.length + ' mounts · ' + hull.cargo + ' cargo · ' + hull.hull + ' hull' +
                (hull.baseShield ? ' · ' + hull.baseShield + ' shield' : '')));

            let action;
            if(active) {
                action = el('div', 'hull-state', 'Active');
            } else if(owned) {
                action = el('button', 'sy-button small', 'Fly this');
                action.addEventListener('click', () => {
                    selectHull(id);
                    this.selectedSlot = null;
                    this.refresh();
                });
            } else {
                action = el('button', 'sy-button small buy', 'Buy ' + formatPrice(hull.cost));
                action.disabled = profile.credits < priceOf(hull.cost);
                action.addEventListener('click', () => {
                    if(buyHull(id)) {
                        this.selectedSlot = null;
                        this.flash(hull.name + ' purchased!');
                    }
                    this.refresh();
                });
            }
            info.appendChild(action);
            card.appendChild(info);
            card.title = hull.description;
            this.hullList.appendChild(card);
        });
    }

    renderTitle() {
        const hull = this.hull;
        this.hullTitle.innerHTML = '';
        this.hullTitle.appendChild(el('span', 'title-name', hull.name + ' ' + hull.className));
        this.hullTitle.appendChild(el('span', 'title-desc', hull.description));
    }

    renderStats() {
        const stats = computeShipStats(this.hull.id);
        const rows = [
            ['Hull', Math.round(stats.maxHull)],
            ['Shield', stats.maxShield ? Math.round(stats.maxShield) + ' (+' + Math.round(stats.shieldRegen) + '/s)' : 'none'],
            ['Acceleration', Math.round(stats.acceleration)],
            ['Turn rate', stats.maxTurn.toFixed(1)],

            ['Weapons', stats.weapons],
            ['Guidance', stats.guidance ? stats.guidance.range + 'px' : 'none'],
            ['Cargo hold', stats.cargo],
            ['Tractor', stats.magnetRange + 'px'],
            ['Scanner', stats.scanner ? stats.scanner.range + 'px' : 'none'],
            ['Hyperdrive', stats.hyperdrive ? 'x' + stats.hyperdrive.speed : 'none'],
            ['Mounts', stats.modules.length + ' / ' + this.hull.slots.length]
        ];
        this.statsBox.innerHTML = '';
        rows.forEach(row => {
            const item = el('div', 'stat');
            item.appendChild(el('span', 'stat-label', row[0]));
            item.appendChild(el('span', 'stat-value', String(row[1])));
            this.statsBox.appendChild(item);
        });
    }

    buildPalette() {
        this.paletteItems = {};
        MODULE_ORDER.forEach(type => {
            const def = MODULES[type];
            const item = el('div', 'module-item');
            item.dataset.type = type;

            const icon = el('canvas', 'module-icon');
            const ctx = setupCanvas(icon, 40, 40);
            ctx.translate(20, 20);
            drawModule(ctx, type, 1, { scale: 2.6, lineWidth: 1.4 });
            item.appendChild(icon);

            const info = el('div', 'module-info');
            info.appendChild(el('div', 'module-name', def.name));
            info.appendChild(el('div', 'module-desc', def.description));
            const price = el('div', 'module-price', formatCredits(def.cost));
            info.appendChild(price);
            item.appendChild(info);

            item.addEventListener('pointerdown', (event) => this.startDrag(event, type));
            this.palette.appendChild(item);
            this.paletteItems[type] = { item: item, price: price };
        });
    }

    renderPalette() {
        const credits = getProfile().credits;
        MODULE_ORDER.forEach(type => {
            const entry = this.paletteItems[type];
            entry.item.classList.toggle('armed', this.armedModule === type);
            entry.item.classList.toggle('unaffordable', credits < priceOf(MODULES[type].cost));
            entry.price.textContent = formatPrice(MODULES[type].cost);
        });
    }

    renderInspector() {
        const hull = this.hull;
        const box = this.inspector;
        box.innerHTML = '';

        if(!this.selectedSlot) {
            box.appendChild(el('p', 'muted', 'Click a mount on the ship to inspect it.'));
            return;
        }

        const module = loadoutFor(hull.id)[this.selectedSlot];
        if(!module) {
            box.appendChild(el('p', '', 'Empty mount'));
            box.appendChild(el('p', 'muted', this.armedModule
                ? 'Click the mount again to install the ' + MODULES[this.armedModule].short + '.'
                : 'Drag a module here, or pick one from the list and click the mount.'));
            return;
        }

        const def = MODULES[module.type];
        const stats = moduleStats(module.type, module.level);
        box.appendChild(el('div', 'inspector-name', def.name + ' Mk ' + ['I', 'II', 'III'][module.level - 1]));
        box.appendChild(el('div', 'inspector-stats', def.describe(stats)));

        const cost = upgradeCost(module.type, module.level);
        const actions = el('div', 'inspector-actions');
        if(cost !== null) {
            const next = moduleStats(module.type, module.level + 1);
            box.appendChild(el('div', 'inspector-next', 'Next: ' + def.describe(next)));
            const upgrade = el('button', 'sy-button small', 'Upgrade ' + formatPrice(cost));
            upgrade.disabled = getProfile().credits < priceOf(cost);
            upgrade.addEventListener('click', () => {
                if(upgradeModule(hull.id, this.selectedSlot)) this.flash(def.short + ' upgraded!');
                this.refresh();
            });
            actions.appendChild(upgrade);
        } else {
            box.appendChild(el('div', 'inspector-next', 'Max level (Mk ' + ['I', 'II', 'III'][MAX_LEVEL - 1] + ')'));
        }

        const sell = el('button', 'sy-button small danger', isDebug() ? 'Remove' : 'Sell +' + formatCredits(sellValue(module.type, module.level)));
        sell.addEventListener('click', () => {
            sellModule(hull.id, this.selectedSlot);
            this.refresh();
        });
        actions.appendChild(sell);
        box.appendChild(actions);
    }

    renderHint() {
        this.hint.textContent = this.armedModule
            ? 'Placing ' + MODULES[this.armedModule].name + ': click an empty mount (Esc to cancel)'
            : 'Drag modules from the right onto the ship\'s mounts. Mine ore and sell it in the Market tab.';
    }

    // ------------------------------------------------------------ hull canvas

    resizeCanvas() {
        const rect = this.canvasWrap.getBoundingClientRect();
        this.canvasWidth = Math.max(200, Math.floor(rect.width));
        this.canvasHeight = Math.max(160, Math.floor(rect.height));
        this.ctx = setupCanvas(this.canvas, this.canvasWidth, this.canvasHeight);
    }

    layout() {
        const hull = this.hull;
        const fit = drawHullPreview(this.ctx, hull, this.canvasWidth, this.canvasHeight, 40, 14);
        const slots = hull.slots.map(slot => ({
            slot: slot,
            x: fit.offsetX + slot.x * fit.scale,
            y: fit.offsetY + slot.y * fit.scale
        }));
        return { fit: fit, slots: slots };
    }

    slotAt(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const layout = this.layout();
        let best = null;
        let bestDist = SLOT_HIT_RADIUS * SLOT_HIT_RADIUS * 2.5;
        layout.slots.forEach(s => {
            const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
            if(d < bestDist) {
                bestDist = d;
                best = s.slot.id;
            }
        });
        return best;
    }

    bindCanvas() {
        this.canvas.addEventListener('pointermove', (event) => {
            if(this.drag) return;
            this.hoverSlot = this.slotAt(event.clientX, event.clientY);
            this.canvas.style.cursor = this.hoverSlot ? 'pointer' : 'default';
        });
        this.canvas.addEventListener('pointerleave', () => { if(!this.drag) this.hoverSlot = null; });
        this.canvas.addEventListener('click', (event) => {
            const slotId = this.slotAt(event.clientX, event.clientY);
            if(!slotId) {
                this.selectedSlot = null;
                this.refresh();
                return;
            }
            const occupied = !!loadoutFor(this.hull.id)[slotId];
            if(this.armedModule && !occupied) {
                this.install(slotId, this.armedModule);
            } else {
                this.selectedSlot = slotId;
                this.refresh();
            }
        });
    }

    install(slotId, type) {
        const hull = this.hull;
        if(loadoutFor(hull.id)[slotId]) {
            this.flash('That mount is taken. Sell its module first.');
            return;
        }
        if(MODULES[type].minHullMass && hull.mass < MODULES[type].minHullMass) {
            this.flash('The ' + hull.name + ' is too small for a ' + MODULES[type].name + '. Use the Stargate instead.');
            return;
        }
        if(getProfile().credits < priceOf(MODULES[type].cost)) {
            this.flash('Not enough credits for ' + MODULES[type].name + '.');
            return;
        }
        installModule(hull.id, slotId, type);
        this.selectedSlot = slotId;
        this.flash(MODULES[type].name + ' installed.');
        if(getProfile().credits < priceOf(MODULES[type].cost)) this.armedModule = null;
        this.refresh();
    }

    // Pointer drag from palette onto a mount. A press without movement arms the module instead.
    startDrag(event, type) {
        event.preventDefault();
        this.drag = { type: type, startX: event.clientX, startY: event.clientY, moved: false, ghost: null };

        this.onDragMove = (e) => {
            const drag = this.drag;
            if(!drag) return;
            if(!drag.moved && Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 6) {
                drag.moved = true;
                drag.ghost = el('canvas', 'drag-ghost');
                const ctx = setupCanvas(drag.ghost, 48, 48);
                ctx.translate(24, 24);
                drawModule(ctx, type, 1, { scale: 3, lineWidth: 1.5 });
                document.body.appendChild(drag.ghost);
            }
            if(drag.ghost) {
                drag.ghost.style.left = (e.clientX - 24) + 'px';
                drag.ghost.style.top = (e.clientY - 24) + 'px';
                this.hoverSlot = this.slotAt(e.clientX, e.clientY);
            }
        };

        this.onDragEnd = (e) => {
            const drag = this.drag;
            this.endDrag();
            if(!drag) return;
            if(drag.moved) {
                const slotId = this.slotAt(e.clientX, e.clientY);
                if(slotId) this.install(slotId, drag.type);
            } else {
                this.armedModule = this.armedModule === drag.type ? null : drag.type;
                this.refresh();
            }
        };

        window.addEventListener('pointermove', this.onDragMove);
        window.addEventListener('pointerup', this.onDragEnd);
    }

    endDrag() {
        if(this.drag && this.drag.ghost) this.drag.ghost.remove();
        this.drag = null;
        if(this.onDragMove) window.removeEventListener('pointermove', this.onDragMove);
        if(this.onDragEnd) window.removeEventListener('pointerup', this.onDragEnd);
        this.onDragMove = null;
        this.onDragEnd = null;
    }

    renderCanvas() {
        const rect = this.canvasWrap.getBoundingClientRect();
        if(Math.abs(rect.width - this.canvasWidth) > 1 || Math.abs(rect.height - this.canvasHeight) > 1) {
            this.resizeCanvas();
        }
        const ctx = this.ctx;
        if(!ctx) return;
        const hull = this.hull;
        const layout = this.layout();
        const fit = layout.fit;
        const loadout = loadoutFor(hull.id);
        const time = performance.now() / 1000;
        const placing = !!(this.armedModule || (this.drag && this.drag.moved));

        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Blueprint grid.
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 170, 255, 0.07)';
        ctx.lineWidth = 1;
        for(let x = 0; x < this.canvasWidth; x += 24) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvasHeight); ctx.stroke();
        }
        for(let y = 0; y < this.canvasHeight; y += 24) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvasWidth, y); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(fit.offsetX, fit.offsetY);
        ctx.scale(fit.scale, fit.scale);
        drawHullArt(ctx, hull, { lineWidth: 1.6 / fit.scale, glow: 8 });
        ctx.restore();

        layout.slots.forEach(s => {
            const module = loadout[s.slot.id];
            const hovered = this.hoverSlot === s.slot.id;
            const selected = this.selectedSlot === s.slot.id;
            const iconScale = Math.max(1.6, Math.min(4, hull.moduleScale * fit.scale * 0.9));
            const radius = iconScale * 5.5;

            ctx.save();
            ctx.translate(s.x, s.y);

            if(module) {
                drawModule(ctx, module.type, module.level, { scale: iconScale, lineWidth: 1.5 });
            } else {
                const pulse = placing ? 0.5 + 0.5 * Math.sin(time * 6) : 0;
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = placing
                    ? 'rgba(140, 255, 160, ' + (0.5 + pulse * 0.5) + ')'
                    : 'rgba(200, 220, 255, 0.55)';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.stroke();
            }

            if(hovered || selected) {
                ctx.strokeStyle = selected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = selected ? 2 : 1.2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        });
    }
}

let instance = null;

export const getShipyard = () => {
    if(!instance) instance = new Shipyard();
    return instance;
};

export const isShipyardOpen = () => !!(instance && instance.isOpen);
