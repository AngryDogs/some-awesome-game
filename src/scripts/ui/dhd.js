// DHD (dial-home device) panel, laid out as the hexagon of triangular constellation tiles:
// 36 constellations, each tile showing its star figure. The grey triangle in the middle is
// the dial button (the "dome"), and this gate's point of origin has its own tile in the
// top-left corner. Enter six constellations and the point of origin, then press the
// centre to dial.

import { CONSTELLATIONS, systemForAddress } from '../world/systems';
import { drawGlyph, drawConstellation, GLYPH_ORDER } from '../render/glyphs';
import sounds from '../audio/audio';

const SIDE = 104;                       // triangle side
const ROW = SIDE * Math.sqrt(3) / 2;    // row height
const WIDTH = SIDE * 5;
const HEIGHT = Math.round(ROW * 5);
const CX = WIDTH / 2;
// Hexagon width (in triangle bases) at each row boundary, top to bottom.
const BOUNDARY_WIDTHS = [2, 3, 4, 5, 4, 3];

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

// Build the triangles row by row: "up" triangles stand on the row's bottom edge, "down"
// triangles hang from its top edge.
const CELLS = [];
for(let row = 0; row < 5; row++) {
    const top = BOUNDARY_WIDTHS[row];
    const bottom = BOUNDARY_WIDTHS[row + 1];
    const y0 = row * ROW;
    const y1 = (row + 1) * ROW;
    const xTop = CX - top * SIDE / 2;
    const xBottom = CX - bottom * SIDE / 2;
    const rowCells = [];
    for(let i = 0; i < bottom; i++) {
        const x = xBottom + i * SIDE;
        rowCells.push({ points: [[x, y1], [x + SIDE, y1], [x + SIDE / 2, y0]], up: true });
    }
    for(let i = 0; i < top; i++) {
        const x = xTop + i * SIDE;
        rowCells.push({ points: [[x, y0], [x + SIDE, y0], [x + SIDE / 2, y1]], up: false });
    }
    rowCells.sort((a, b) => (a.points[0][0] + a.points[1][0] + a.points[2][0]) - (b.points[0][0] + b.points[1][0] + b.points[2][0]));
    rowCells.forEach(cell => CELLS.push(cell));
}
CELLS.forEach(cell => {
    cell.cx = (cell.points[0][0] + cell.points[1][0] + cell.points[2][0]) / 3;
    cell.cy = (cell.points[0][1] + cell.points[1][1] + cell.points[2][1]) / 3;
});

// The centre "up" triangle of the middle row is the dial button; the others get the
// constellations in glyph-chart order.
const DIAL_CELL = CELLS.filter(c => c.up && Math.abs(c.cx - CX) < 1 && c.cy > 2 * ROW && c.cy < 3 * ROW)[0];
const KEYS = [];
let next = 0;
CELLS.forEach(cell => {
    if(cell === DIAL_CELL) return;
    KEYS.push({ glyph: GLYPH_ORDER[next++], cell: cell });
});
// Point of origin: a tile of its own in the free top-left corner.
const ORIGIN_CELL = { points: [[8, 92], [96, 92], [52, 16]], up: true };
ORIGIN_CELL.cx = 52;
ORIGIN_CELL.cy = (92 * 2 + 16) / 3;
KEYS.push({ glyph: 'origin', cell: ORIGIN_CELL });

const inTriangle = (x, y, p) => {
    const sign = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
    const pt = [x, y];
    const d1 = sign(pt, p[0], p[1]);
    const d2 = sign(pt, p[1], p[2]);
    const d3 = sign(pt, p[2], p[0]);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
};

const tracePath = (ctx, points) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.lineTo(points[1][0], points[1][1]);
    ctx.lineTo(points[2][0], points[2][1]);
    ctx.closePath();
};

class DHD {

    constructor() {
        this.isOpen = false;
        this.entered = [];
        this.hover = -1;
        this.build();
    }

    build() {
        const root = el('div', 'dhd-overlay');
        const panel = el('div', 'dhd-panel');
        const header = el('div', 'dhd-header');
        this.title = el('div', 'dhd-title', 'Dial-home device');
        header.appendChild(this.title);
        const close = el('button', 'sy-button small', 'Close (Esc)');
        close.addEventListener('click', () => this.close());
        header.appendChild(close);
        panel.appendChild(header);

        this.addressBar = el('canvas', 'dhd-address');
        panel.appendChild(this.addressBar);

        this.canvas = el('canvas', 'dhd-canvas');
        panel.appendChild(this.canvas);

        this.status = el('div', 'dhd-status');
        panel.appendChild(this.status);

        const actions = el('div', 'dhd-actions');
        const clear = el('button', 'sy-button small', 'Clear');
        clear.addEventListener('click', () => {
            this.entered = [];
            this.say('Address cleared.');
            this.render();
        });
        actions.appendChild(clear);
        actions.appendChild(el('span', 'dhd-hint', 'Enter the 6 constellations of an address, then the point of origin (top left), then press the centre to dial. Addresses are on the starmap (M).'));
        panel.appendChild(actions);

        root.appendChild(panel);
        document.body.appendChild(root);
        this.root = root;

        const ratio = window.devicePixelRatio || 1;
        this.canvas.width = WIDTH * ratio;
        this.canvas.height = (HEIGHT + 4) * ratio;
        this.canvas.style.width = WIDTH + 'px';
        this.canvas.style.height = (HEIGHT + 4) + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(ratio, ratio);
        this.addressBar.width = 520 * ratio;
        this.addressBar.height = 70 * ratio;
        this.addressBar.style.width = '520px';
        this.addressBar.style.height = '70px';
        this.barCtx = this.addressBar.getContext('2d');
        this.barCtx.scale(ratio, ratio);

        this.canvas.addEventListener('mousemove', (event) => {
            const k = this.keyAt(event);
            if(k !== this.hover) {
                this.hover = k;
                this.render();
            }
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.hover = -1;
            this.render();
        });
        this.canvas.addEventListener('click', (event) => this.click(event));
        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.close();
            }
        }, true);
    }

    // options: { originIndex, originName, systemId, onDial(targetSystem, symbols), onClose }
    open(options) {
        this.options = options;
        this.entered = [];
        this.isOpen = true;
        this.root.classList.add('open');
        this.title.textContent = 'Dial-home device · ' + options.systemName;
        this.say(options.busy ? 'The gate is already active.' : 'Ready.');
        this.render();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        if(this.options && this.options.onClose) this.options.onClose();
    }

    say(text, error) {
        this.status.textContent = text;
        this.status.classList.toggle('error', !!error);
    }

    keyAt(event) {
        const rect = this.canvas.getBoundingClientRect();
        // The canvas may be scaled down by CSS on small screens.
        const x = (event.clientX - rect.left) * WIDTH / (rect.width || WIDTH);
        const y = (event.clientY - rect.top) * (HEIGHT + 4) / (rect.height || HEIGHT + 4);
        if(inTriangle(x, y, DIAL_CELL.points)) return 'dome';
        for(let i = 0; i < KEYS.length; i++) {
            if(inTriangle(x, y, KEYS[i].cell.points)) return i;
        }
        return -1;
    }

    glyphOf(key) {
        return key.glyph === 'origin' ? 'origin:' + this.options.originIndex : key.glyph;
    }

    click(event) {
        const k = this.keyAt(event);
        if(k === -1) return;
        if(k === 'dome') {
            this.pressDome();
            return;
        }
        if(this.options.busy) {
            this.say('The gate is already active.', true);
            return;
        }
        const glyph = this.glyphOf(KEYS[k]);
        if(this.entered.indexOf(glyph) !== -1) return;
        if(this.entered.length >= 7) {
            this.say('Seven symbols entered. Press the dome to dial.');
            return;
        }
        this.entered.push(glyph);
        sounds.dhdPress(k);
        this.say(this.entered.length < 7 ? 'Symbol ' + this.entered.length + ' entered.' : 'Address complete. Press the dome.');
        this.render();
    }

    pressDome() {
        if(this.options.busy) {
            this.say('The gate is already active.', true);
            return;
        }
        sounds.dhdDome();
        const origin = 'origin:' + this.options.originIndex;
        const symbols = this.entered.slice(0, 6);
        const fail = (message) => {
            setTimeout(() => sounds.dialFail(), 250);
            this.say(message, true);
            this.entered = [];
            this.render();
        };
        if(this.entered.length < 7) return fail('Incomplete address: enter six symbols and the point of origin.');
        if(this.entered[6] !== origin || symbols.some(g => typeof g === 'string')) return fail('The seventh symbol must be this gate\'s point of origin.');
        const target = systemForAddress(symbols);
        if(!target) return fail('Dialling failed: no Stargate at that address.');
        if(target.id === this.options.systemId) return fail('You cannot dial the gate you are standing at.');
        this.options.onDial(target, this.entered.slice());
        this.close();
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, WIDTH, HEIGHT + 4);
        ctx.save();
        ctx.translate(0, 2);
        ctx.lineJoin = 'round';

        const tile = (cell, fill) => {
            tracePath(ctx, cell.points);
            ctx.fillStyle = fill;
            ctx.fill();
        };

        KEYS.forEach((key, i) => {
            const cell = key.cell;
            const glyph = this.glyphOf(key);
            const lit = this.entered.indexOf(glyph) !== -1;
            const hovered = this.hover === i;
            if(lit) {
                const g = ctx.createRadialGradient(cell.cx, cell.cy, 4, cell.cx, cell.cy, SIDE * 0.6);
                g.addColorStop(0, 'rgb(255, 214, 150)');
                g.addColorStop(1, 'rgb(235, 130, 45)');
                tile(cell, g);
            } else {
                tile(cell, hovered ? 'rgb(214, 228, 248)' : 'rgb(246, 244, 238)');
            }
            const ink = lit ? 'rgb(70, 25, 0)' : 'rgb(10, 10, 12)';
            if(key.glyph === 'origin') {
                drawGlyph(ctx, glyph, cell.cx, cell.cy + 2, 34, ink, 3);
            } else {
                drawConstellation(ctx, key.glyph, cell.cx, cell.cy + (cell.up ? 3 : -3), SIDE * 0.42, ink, ink, 1.35);
            }
        });

        // Dial button: the grey centre triangle, glowing red once the address is complete.
        const ready = this.entered.length === 7;
        if(ready) {
            const g = ctx.createRadialGradient(DIAL_CELL.cx, DIAL_CELL.cy - 6, 3, DIAL_CELL.cx, DIAL_CELL.cy, SIDE * 0.6);
            g.addColorStop(0, 'rgb(255, 190, 160)');
            g.addColorStop(0.5, 'rgb(230, 50, 30)');
            g.addColorStop(1, 'rgb(130, 15, 10)');
            ctx.shadowColor = 'rgba(255, 60, 30, 0.9)';
            ctx.shadowBlur = 22;
            tile(DIAL_CELL, g);
            ctx.shadowBlur = 0;
        } else {
            tile(DIAL_CELL, this.hover === 'dome' ? 'rgb(150, 150, 150)' : 'rgb(128, 128, 128)');
        }

        // Thick black borders, like the chart.
        ctx.strokeStyle = 'rgb(12, 12, 14)';
        ctx.lineWidth = 2.6;
        CELLS.forEach(cell => {
            tracePath(ctx, cell.points);
            ctx.stroke();
        });
        tracePath(ctx, ORIGIN_CELL.points);
        ctx.stroke();
        ctx.font = '9px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(240, 225, 205, 0.85)';
        ctx.fillText('ORIGIN', ORIGIN_CELL.cx, ORIGIN_CELL.points[0][1] + 13);
        ctx.restore();

        // Hovered key name.
        if(typeof this.hover === 'number' && this.hover >= 0) {
            const key = KEYS[this.hover];
            const name = key.glyph === 'origin' ? 'Point of origin · ' + this.options.originName : CONSTELLATIONS[key.glyph];
            ctx.font = '14px Bungee, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.fillText(name, WIDTH - 6, HEIGHT - 6);
        } else if(this.hover === 'dome') {
            ctx.font = '14px Bungee, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.fillText('Dial', WIDTH - 6, HEIGHT - 6);
        }

        // Address bar: seven slots.
        const bar = this.barCtx;
        bar.clearRect(0, 0, 520, 70);
        for(let i = 0; i < 7; i++) {
            const x = 30 + i * 70;
            bar.fillStyle = i < this.entered.length ? 'rgba(240, 140, 50, 0.25)' : 'rgba(255, 255, 255, 0.06)';
            bar.strokeStyle = i === 6 ? 'rgba(255, 120, 90, 0.7)' : 'rgba(200, 210, 230, 0.4)';
            bar.lineWidth = 1.5;
            bar.fillRect(x, 8, 56, 56);
            bar.strokeRect(x, 8, 56, 56);
            if(i < this.entered.length) drawGlyph(bar, this.entered[i], x + 28, 36, 38, 'rgb(255, 214, 160)', 3, 'rgba(150, 60, 15, 0.9)');
            else {
                bar.font = '10px Bungee, sans-serif';
                bar.textAlign = 'center';
                bar.fillStyle = 'rgba(200, 210, 230, 0.5)';
                bar.fillText(i === 6 ? 'ORIGIN' : String(i + 1), x + 28, 40);
            }
        }
    }
}

let instance = null;
export const getDHD = () => {
    if(!instance) instance = new DHD();
    return instance;
};
export const isDHDOpen = () => !!(instance && instance.isOpen);


