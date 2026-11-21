// Starmap: a rotatable 3D map of the constellations (gate symbols) and known worlds.
// Selecting a world draws the three lines of its gate address meeting at it, and shows
// the address (plus your current gate's point of origin), the distance and, if your ship
// has a hyperdrive, the travel time and an "Engage hyperdrive" button.

import { CONSTELLATIONS, SYSTEMS, systemById, constellationPosition, addressOf, addressLines, distanceBetween } from '../world/systems';
import { drawGlyph, drawConstellation } from '../render/glyphs';

const LINE_COLORS = ['255,140,90', '120,220,255', '190,255,140'];
const PLANET_COLORS = { ocean: '90,150,255', earth: '110,170,255', desert: '235,190,120', jungle: '120,210,140',
    rocky: '230,130,100', industrial: '200,170,230', ice: '170,235,255' };

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

// Hyperspace travel time in seconds for a distance (light years) and drive speed.
export const hyperTravelTime = (distance, speed) => Math.max(5, Math.min(45, distance / (90 * speed)));

class Starmap {

    constructor() {
        this.isOpen = false;
        this.yaw = 0.6;
        this.pitch = 0.35;
        this.zoom = 1;
        this.selected = null;
        this.build();
        // Decorative background stars on a far sphere.
        this.stars = [];
        for(let i = 0; i < 500; i++) {
            const y = Math.random() * 2 - 1;
            const r = Math.sqrt(1 - y * y);
            const a = Math.random() * Math.PI * 2;
            this.stars.push([Math.cos(a) * r * 5200, y * 5200, Math.sin(a) * r * 5200, Math.random()]);
        }
    }

    build() {
        const root = el('div', 'starmap-overlay');
        this.canvas = el('canvas', 'starmap-canvas');
        root.appendChild(this.canvas);

        const side = el('div', 'starmap-side');
        side.appendChild(el('div', 'starmap-title', 'Starmap'));
        side.appendChild(el('div', 'starmap-hint', (('ontouchstart' in window) ? 'Drag to rotate, pinch to zoom, tap a world to see its gate address.' : 'Drag to rotate, wheel to zoom, click a world to see its gate address.')));
        this.info = el('div', 'starmap-info');
        side.appendChild(this.info);
        const close = el('button', 'sy-button small', 'Close (M / Esc)');
        close.addEventListener('click', () => this.close());
        side.appendChild(close);
        root.appendChild(side);

        document.body.appendChild(root);
        this.root = root;
        this.ctx = this.canvas.getContext('2d');

        // Pointer events cover mouse and touch: one pointer drags to rotate (a tap picks a
        // world), two pointers pinch to zoom.
        let drag = null;
        const pointers = {};
        let pinch = null;
        const pinchDistance = () => {
            const ids = Object.keys(pointers);
            const a = pointers[ids[0]], b = pointers[ids[1]];
            return Math.hypot(a.x - b.x, a.y - b.y) || 1;
        };
        this.canvas.style.touchAction = 'none';
        this.canvas.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
            if(this.canvas.setPointerCapture) {
                try { this.canvas.setPointerCapture(event.pointerId); } catch(e) { /* ignore */ }
            }
            if(Object.keys(pointers).length === 2) {
                drag = null;
                pinch = { distance: pinchDistance(), zoom: this.zoom };
            } else if(!pinch) {
                drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: this.yaw, pitch: this.pitch, moved: false };
            }
        });
        this.canvas.addEventListener('pointermove', (event) => {
            if(!this.isOpen || !pointers[event.pointerId]) return;
            pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
            if(pinch && Object.keys(pointers).length >= 2) {
                this.zoom = Math.max(0.5, Math.min(3, pinch.zoom * pinchDistance() / pinch.distance));
                return;
            }
            if(!drag || drag.id !== event.pointerId) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if(Math.abs(dx) + Math.abs(dy) > (event.pointerType === 'mouse' ? 4 : 10)) drag.moved = true;
            this.yaw = drag.yaw + dx * 0.008;
            this.pitch = Math.max(-1.4, Math.min(1.4, drag.pitch + dy * 0.008));
        });
        const release = (event) => {
            if(drag && drag.id === event.pointerId && !drag.moved && this.isOpen && event.type === 'pointerup') this.pick(event);
            if(drag && drag.id === event.pointerId) drag = null;
            delete pointers[event.pointerId];
            if(Object.keys(pointers).length === 0) pinch = null;
        };
        this.canvas.addEventListener('pointerup', release);
        this.canvas.addEventListener('pointercancel', release);
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.zoom = Math.max(0.5, Math.min(3, this.zoom * Math.exp(-event.deltaY * 0.0012)));
        }, { passive: false });
        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'KeyJ') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.engage();
                return;
            }
            if(event.code === 'Escape' || event.code === 'KeyM') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.close();
            }
        }, true);
        window.addEventListener('resize', () => { if(this.isOpen) this.resize(); });
    }

    // options: { systemId, originIndex, hyperdrive: { speed } | null, onEngage(system), onClose }
    open(options) {
        this.options = options;
        this.isOpen = true;
        this.root.classList.add('open');
        if(!this.selected || this.selected === options.systemId) this.selected = null;
        this.resize();
        this.renderInfo();
        const loop = () => {
            if(!this.isOpen) return;
            this.render();
            this.frame = requestAnimationFrame(loop);
        };
        loop();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        cancelAnimationFrame(this.frame);
        if(this.options.onClose) this.options.onClose();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = rect.width * ratio;
        this.canvas.height = rect.height * ratio;
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    project(p) {
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        const cp = Math.cos(this.pitch);
        const sp = Math.sin(this.pitch);
        const x1 = p[0] * cy - p[2] * sy;
        const z1 = p[0] * sy + p[2] * cy;
        const y2 = p[1] * cp - z1 * sp;
        const z2 = p[1] * sp + z1 * cp;
        const camera = 9000 / this.zoom;
        const scale = Math.min(this.width, this.height) * 0.9 / (camera + z2) * this.zoom * 0.95;
        return { x: this.width / 2 + x1 * scale, y: this.height / 2 + y2 * scale, depth: z2, scale: scale };
    }

    pick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let best = null;
        const reach = event.pointerType && event.pointerType !== 'mouse' ? 34 : 22;
        let bestDist = reach * reach;
        SYSTEMS.forEach(system => {
            const p = this.project(system.map);
            const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
            if(d < bestDist) {
                bestDist = d;
                best = system.id;
            }
        });
        if(best) {
            this.selected = best;
            this.renderInfo();
        }
    }

    renderInfo() {
        const box = this.info;
        box.innerHTML = '';
        const here = systemById(this.options.systemId);
        box.appendChild(el('div', 'starmap-here', 'You are at ' + here.name + ' (' + here.galaxy + ')'));
        if(!this.selected) {
            box.appendChild(el('p', 'muted', 'Select a world on the map.'));
            return;
        }
        const target = systemById(this.selected);
        box.appendChild(el('div', 'starmap-name', target.name));
        box.appendChild(el('div', 'starmap-galaxy', target.galaxy + ' galaxy'));
        box.appendChild(el('p', '', target.description));
        if(target.id === here.id) {
            box.appendChild(el('p', 'muted', 'This is your current location.'));
            return;
        }

        box.appendChild(el('div', 'starmap-label', 'Gate address (dial at the DHD)'));
        const glyphs = addressOf(target.id).concat(['origin:' + this.options.originIndex]);
        const strip = el('canvas', 'starmap-glyphs');
        const ratio = window.devicePixelRatio || 1;
        strip.width = 7 * 40 * ratio;
        strip.height = 58 * ratio;
        strip.style.width = 7 * 40 + 'px';
        strip.style.height = '58px';
        const sctx = strip.getContext('2d');
        sctx.scale(ratio, ratio);
        glyphs.forEach((g, i) => {
            const color = i < 6 ? 'rgb(' + LINE_COLORS[Math.floor(i / 2)] + ')' : 'rgb(255, 140, 120)';
            sctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            sctx.strokeRect(i * 40 + 2, 2, 36, 36);
            drawGlyph(sctx, g, i * 40 + 20, 20, 28, color, 2.6, 'rgba(10, 20, 50, 0.9)');
            sctx.font = '7px sans-serif';
            sctx.textAlign = 'center';
            sctx.fillStyle = 'rgba(220, 230, 255, 0.8)';
            const name = i < 6 ? CONSTELLATIONS[g] : here.origin;
            sctx.fillText(name.length > 10 ? name.slice(0, 9) + '.' : name, i * 40 + 20, 50);
        });
        box.appendChild(strip);
        box.appendChild(el('p', 'muted', 'Symbols 1-2, 3-4 and 5-6 are the three lines meeting at ' + target.name +
            '. The last is the point of origin of the gate you dial from (' + here.origin + ').'));

        const distance = Math.round(distanceBetween(here.id, target.id));
        box.appendChild(el('div', 'starmap-label', 'Distance: ' + distance.toLocaleString('en-US') + ' light years'));
        const drive = this.options.hyperdrive;
        if(drive) {
            const time = hyperTravelTime(distance, drive.speed);
            box.appendChild(el('p', '', 'Hyperspace travel time: ' + time.toFixed(1) + ' s'));
            const engage = el('button', 'sy-button primary', 'Engage hyperdrive (J)');
            engage.addEventListener('click', () => this.engage());
            box.appendChild(engage);
        } else {
            box.appendChild(el('p', 'muted', 'No hyperdrive fitted: use the Stargate. Fly to the DHD and press B.'));
        }
    }

    engage() {
        if(!this.selected || !this.options.hyperdrive || this.selected === this.options.systemId) return;
        const target = systemById(this.selected);
        this.options.onEngage(target);
        this.close();
    }

    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        ctx.fillStyle = 'rgb(3, 6, 14)';
        ctx.fillRect(0, 0, w, h);
        this.yaw += 0.0008;

        // Background stars.
        this.stars.forEach(s => {
            const p = this.project(s);
            if(p.scale <= 0) return;
            ctx.fillStyle = 'rgba(200, 215, 255, ' + (0.15 + s[3] * 0.4) + ')';
            ctx.fillRect(p.x, p.y, 1.2, 1.2);
        });

        const selectedGlyphs = this.selected && this.selected !== this.options.systemId ? addressOf(this.selected) : [];

        // Address lines for the selected world.
        if(selectedGlyphs.length) {
            addressLines(this.selected).forEach((line, i) => {
                const a = this.project(line[0]);
                const b = this.project(line[1]);
                ctx.strokeStyle = 'rgba(' + LINE_COLORS[i] + ', 0.75)';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            });
        }

        // Constellations.
        CONSTELLATIONS.forEach((name, i) => {
            const p = this.project(constellationPosition(i));
            const inAddress = selectedGlyphs.indexOf(i);
            const near = Math.max(0.25, Math.min(1, 0.65 - p.depth / 8000));
            const color = inAddress !== -1 ? 'rgba(' + LINE_COLORS[Math.floor(inAddress / 2)] + ', 1)' : 'rgba(170, 190, 230, ' + near + ')';
            // The constellation's star figure; constellations in the selected address also
            // show their gate glyph beside it.
            const size = (inAddress !== -1 ? 40 : 26) * Math.max(0.7, Math.min(1.4, p.scale * 12));
            drawConstellation(ctx, i, p.x, p.y, size, inAddress !== -1 ? color : 'rgba(150, 175, 230, ' + (near * 0.55) + ')',
                inAddress !== -1 ? '#fff' : 'rgba(225, 235, 255, ' + near + ')');
            if(inAddress !== -1) drawGlyph(ctx, i, p.x + size * 0.75, p.y - size * 0.45, 20, color, 2.4, 'rgba(5, 10, 30, 0.9)');
            ctx.font = (inAddress !== -1 ? '11px' : '9px') + ' sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = color;
            ctx.fillText(name, p.x, p.y + size * 0.5 + (inAddress !== -1 ? 13 : 10));
        });

        // Worlds.
        SYSTEMS.forEach(system => {
            const p = this.project(system.map);
            const color = PLANET_COLORS[system.planet.type];
            const current = system.id === this.options.systemId;
            const selected = system.id === this.selected;
            ctx.fillStyle = 'rgb(' + color + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, selected ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();
            if(current || selected) {
                ctx.strokeStyle = current ? 'rgba(140, 255, 160, 0.9)' : 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.font = '12px Bungee, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgb(' + color + ')';
            ctx.fillText(system.name + (current ? ' (you)' : ''), p.x + 14, p.y + 4);
        });

        // Hyperspace route from here to the selection.
        if(this.selected && this.selected !== this.options.systemId) {
            const a = this.project(systemById(this.options.systemId).map);
            const b = this.project(systemById(this.selected).map);
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

let instance = null;
export const getStarmap = () => {
    if(!instance) instance = new Starmap();
    return instance;
};
export const isStarmapOpen = () => !!(instance && instance.isOpen);
