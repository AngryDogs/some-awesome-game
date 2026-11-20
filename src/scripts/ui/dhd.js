// DHD (dial-home device) panel: enter six constellation symbols and this gate's point of
// origin, then press the dome to dial.

import { CONSTELLATIONS, systemForAddress } from '../world/systems';
import { drawGlyph } from '../render/glyphs';
import sounds from '../audio/audio';

const SIZE = 520;
const OUTER = [205, 250];   // inner / outer radius of the outer key ring
const INNER = [140, 200];
const DOME = 75;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

// Key layout: 19 outer constellations, 19 inner constellations + the point of origin.
const KEYS = [];
for(let i = 0; i < 19; i++) KEYS.push({ glyph: i, ring: OUTER, slot: i, count: 19 });
for(let i = 0; i < 20; i++) KEYS.push({ glyph: i < 19 ? 19 + i : 'origin', ring: INNER, slot: i, count: 20 });

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
        actions.appendChild(el('span', 'dhd-hint', 'Enter 6 symbols, then the point of origin, then press the dome. Addresses are on the starmap (M).'));
        panel.appendChild(actions);

        root.appendChild(panel);
        document.body.appendChild(root);
        this.root = root;

        const ratio = window.devicePixelRatio || 1;
        this.canvas.width = SIZE * ratio;
        this.canvas.height = SIZE * ratio;
        this.canvas.style.width = SIZE + 'px';
        this.canvas.style.height = SIZE + 'px';
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

    keyGeometry(key) {
        const step = Math.PI * 2 / key.count;
        const a1 = -Math.PI / 2 + key.slot * step - step / 2 + 0.01;
        const a2 = a1 + step - 0.02;
        return { a1: a1, a2: a2, mid: (a1 + a2) / 2, r1: key.ring[0], r2: key.ring[1] };
    }

    keyAt(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - SIZE / 2;
        const y = event.clientY - rect.top - SIZE / 2;
        const r = Math.sqrt(x * x + y * y);
        if(r < DOME) return 'dome';
        let a = Math.atan2(y, x);
        for(let i = 0; i < KEYS.length; i++) {
            const g = this.keyGeometry(KEYS[i]);
            if(r < g.r1 || r > g.r2) continue;
            let rel = a - g.a1;
            while(rel < 0) rel += Math.PI * 2;
            while(rel > Math.PI * 2) rel -= Math.PI * 2;
            if(rel <= g.a2 - g.a1) return i;
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
        const c = SIZE / 2;
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.save();
        ctx.translate(c, c);

        // Base.
        ctx.fillStyle = 'rgb(58, 55, 52)';
        ctx.beginPath();
        for(let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4 + Math.PI / 8;
            if(i === 0) ctx.moveTo(Math.cos(a) * 258, Math.sin(a) * 258);
            else ctx.lineTo(Math.cos(a) * 258, Math.sin(a) * 258);
        }
        ctx.closePath();
        ctx.fill();

        KEYS.forEach((key, i) => {
            const g = this.keyGeometry(key);
            const glyph = this.glyphOf(key);
            const lit = this.entered.indexOf(glyph) !== -1;
            const hovered = this.hover === i;
            ctx.beginPath();
            ctx.arc(0, 0, g.r2, g.a1, g.a2);
            ctx.arc(0, 0, g.r1, g.a2, g.a1, true);
            ctx.closePath();
            ctx.fillStyle = lit ? 'rgb(240, 140, 50)' : hovered ? 'rgb(150, 140, 125)' : 'rgb(115, 108, 98)';
            ctx.fill();
            ctx.strokeStyle = 'rgb(35, 32, 30)';
            ctx.lineWidth = 2;
            ctx.stroke();
            const r = (g.r1 + g.r2) / 2;
            drawGlyph(ctx, glyph, Math.cos(g.mid) * r, Math.sin(g.mid) * r, key.ring === OUTER ? 26 : 30,
                lit ? 'rgb(255, 245, 220)' : 'rgb(40, 36, 32)', 2.2);
        });

        // Dome.
        const ready = this.entered.length === 7;
        const dome = ctx.createRadialGradient(-20, -25, 5, 0, 0, DOME);
        dome.addColorStop(0, ready ? 'rgb(255, 170, 130)' : 'rgb(230, 110, 90)');
        dome.addColorStop(0.6, ready ? 'rgb(230, 60, 30)' : 'rgb(170, 35, 25)');
        dome.addColorStop(1, 'rgb(90, 15, 10)');
        ctx.fillStyle = dome;
        ctx.beginPath();
        ctx.arc(0, 0, DOME, 0, Math.PI * 2);
        ctx.fill();
        if(this.hover === 'dome' || ready) {
            ctx.strokeStyle = 'rgba(255, 200, 150, 0.7)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();

        // Hovered key name.
        if(typeof this.hover === 'number' && this.hover >= 0) {
            const key = KEYS[this.hover];
            const name = key.glyph === 'origin' ? 'Point of origin · ' + this.options.originName : CONSTELLATIONS[key.glyph];
            ctx.font = '14px Bungee, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(name, c, SIZE - 6);
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
            if(i < this.entered.length) drawGlyph(bar, this.entered[i], x + 28, 36, 36, 'rgb(255, 225, 190)', 2.4);
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


