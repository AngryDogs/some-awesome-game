// The Stargate in each system, and the DHD (dial-home device) next to it.
//
// Dialling follows the Carter Addon Pack's DHD ("fast") dial of a Milky Way gate, so its
// sounds line up exactly: the ring starts rolling, chevrons 1-6 encode at slightly random
// intervals while it turns, the ring stops, chevron 7 locks, and 1.2 s later the gate opens
// with the kawoosh (7 s from pressing the dome), settling into a rippling event horizon.
// Small ships can fly through an outgoing wormhole; it closes after a while.

import { createSprite, glowSprite, stamp } from '../render/sprites';
import { drawGlyph, GLYPH_NAMES } from '../render/glyphs';
import sounds from '../audio/audio';

export const GATE_RADIUS = 78;        // outer ring
export const GATE_INNER = 58;         // event horizon radius (ships bigger than this can't pass)
export const DHD_OFFSET = { x: 0, y: 220 };
export const DHD_RANGE = 170;         // how close to the DHD you need to be to use it

// DHD dial timeline (seconds after the dome is pressed), from CAP's stargate_sg1 sequence.
const RING_START = 0.1;               // ring starts rolling
const FIRST_CHEVRON = 1.0;            // chevron 1 encodes
const CHEVRONS_SPAN = 4.0;            // chevrons 1-6 and the ring stopping take this long
const RING_STOP_TO_LOCK = 0.8;        // ring stops, then chevron 7 locks
const LOCK_TO_OPEN = 1.2;             // chevron 7 lock to the gate opening
const FORM_TIME = 0.8;                // horizon water rushing in from the rim before the burst

// Churning foam blobs for the horizon forming (fixed layout, animated).
const FOAM = [];
for(let i = 0; i < 46; i++) {
    FOAM.push({ angle: Math.random() * Math.PI * 2, depth: Math.random(), size: 0.5 + Math.random(),
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.6), phase: Math.random() * 10 });
}
const KAWOOSH_TIME = 1.3;
const OPEN_TIME = 38;                 // wormholes stay open this long (outgoing)
const INCOMING_OPEN_TIME = 4;         // after arriving through a gate
const CLOSE_TIME = 0.9;
const SYMBOLS = 39;

const CHEVRON_ANGLES = [];
for(let i = 0; i < 9; i++) CHEVRON_ANGLES.push(-Math.PI / 2 + i * Math.PI * 2 / 9);
// Order in which chevrons light: chevrons 1-6 around the gate, then the top one (7).
const LOCK_ORDER = [1, 2, 3, 6, 7, 8, 0];

let ringSprite = null;
let symbolSprite = null;

// Outer ring body (cached).
const buildRing = () => createSprite(GATE_RADIUS * 2 + 20, GATE_RADIUS * 2 + 20, ctx => {
    const c = GATE_RADIUS + 10;
    ctx.translate(c, c);
    ctx.beginPath();
    ctx.arc(0, 0, GATE_RADIUS, 0, Math.PI * 2);
    ctx.arc(0, 0, GATE_INNER, 0, Math.PI * 2, true);
    const metal = ctx.createRadialGradient(-20, -25, GATE_INNER * 0.6, 0, 0, GATE_RADIUS);
    metal.addColorStop(0, 'rgb(150, 150, 158)');
    metal.addColorStop(0.6, 'rgb(95, 96, 104)');
    metal.addColorStop(1, 'rgb(55, 56, 64)');
    ctx.fillStyle = metal;
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(20, 20, 26, 0.9)';
    ctx.lineWidth = 1.5;
    [GATE_RADIUS, GATE_INNER, GATE_RADIUS - 6, GATE_INNER + 5].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
    });
    // Segment seams.
    for(let i = 0; i < 36; i++) {
        const a = i * Math.PI * 2 / 36;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (GATE_RADIUS - 6), Math.sin(a) * (GATE_RADIUS - 6));
        ctx.lineTo(Math.cos(a) * GATE_RADIUS, Math.sin(a) * GATE_RADIUS);
        ctx.stroke();
    }
}, 2);

// Inner symbol ring with all 39 glyphs (cached; rotated when spinning).
const buildSymbols = () => createSprite(GATE_RADIUS * 2, GATE_RADIUS * 2, ctx => {
    ctx.translate(GATE_RADIUS, GATE_RADIUS);
    const mid = (GATE_INNER + 5 + GATE_RADIUS - 6) / 2;
    ctx.beginPath();
    ctx.arc(0, 0, GATE_RADIUS - 6, 0, Math.PI * 2);
    ctx.arc(0, 0, GATE_INNER + 5, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgb(70, 72, 80)';
    ctx.fill('evenodd');
    for(let i = 0; i < SYMBOLS; i++) {
        const a = i * Math.PI * 2 / SYMBOLS;
        ctx.save();
        ctx.rotate(a);
        // Slot 38 holds the point of origin (where the ring comes to rest after a dial).
        if(i < GLYPH_NAMES.length) drawGlyph(ctx, GLYPH_NAMES[i], 0, -mid, 7, 'rgba(200, 205, 215, 0.85)', 0.9);
        else if(i === SYMBOLS - 1) drawGlyph(ctx, 'origin:0', 0, -mid, 7, 'rgba(200, 205, 215, 0.85)', 0.9);
        ctx.restore();
    }
}, 2);

class Stargate {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.state = 'idle';
        this.timer = 0;
        this.locked = 0;
        this.spin = 0;
        this.spinFrom = 0;
        this.spinTo = 0;
        this.phase = 'spin';
        this.outgoing = false;
        this.target = null;
        this.kawoosh = 0;
        this.time = 0;
    }

    get dhd() {
        return { x: this.x + DHD_OFFSET.x, y: this.y + DHD_OFFSET.y };
    }

    get isOpen() {
        return this.state === 'open';
    }

    get busy() {
        return this.state !== 'idle';
    }

    // Start dialling `targetId`; `symbols` are the 7 dialled glyphs (for the spin targets).
    dial(targetId, symbols) {
        // A gate that is still shutting down can be dialled again straight away.
        if(this.busy && this.state !== 'closing') return false;
        if(this.state === 'closing') sounds.horizon(false);
        this.wasOpen = false;
        this.state = 'dialing';
        this.outgoing = true;
        this.target = targetId;
        this.symbols = symbols;
        this.locked = 0;
        this.phase = 'spin';
        this.clock = 0;
        this.ringOn = false;
        // Chevrons 1-6 at random-ish intervals (CAP: 0.3-1.0 s each plus an even share, the
        // last gap always the longest) that together span CHEVRONS_SPAN.
        const gaps = [];
        for(let i = 0; i < 5; i++) gaps.push(0.3 + Math.random() * 0.7);
        gaps.push(1);
        const total = gaps.reduce((a, b) => a + b, 0);
        const delta = (CHEVRONS_SPAN - total) / 6;
        this.chevronTimes = [];
        let t = FIRST_CHEVRON;
        for(let i = 0; i < 6; i++) {
            this.chevronTimes.push(t);
            t += gaps[i] + delta;
        }
        this.ringStop = t;
        this.lockTime = t + RING_STOP_TO_LOCK;
        this.openTime = this.lockTime + LOCK_TO_OPEN;
        // The ring turns one way for the whole dial and comes to rest with the point of
        // origin under the top chevron.
        this.spinFrom = this.spin;
        const finalAngle = -Math.PI / 2 + Math.PI / 2 - 38 * Math.PI * 2 / SYMBOLS;
        let to = finalAngle;
        while(to < this.spin + Math.PI * 4) to += Math.PI * 2;
        this.spinTo = to;
        return true;
    }

    // A wormhole arriving here (after travelling through it).
    incoming() {
        this.state = 'open';
        this.outgoing = false;
        this.locked = 7;
        this.timer = INCOMING_OPEN_TIME;
        this.kawoosh = 0;
        sounds.horizon(true);
    }

    // `silent`: shut down without the closing sound (the ship has just gone through).
    close(silent) {
        if(this.state === 'idle' || this.state === 'closing') return;
        // Only an established wormhole fades its horizon out; a cancelled dial just stops.
        this.wasOpen = this.state === 'open' || (this.state === 'kawoosh' && this.kawoosh > 0.45);
        this.ringOn = false;
        this.state = 'closing';
        this.timer = CLOSE_TIME;
        sounds.gateSpin(false);
        sounds.horizon(false);
        sounds.gateClose(silent);
    }

    update(dt) {
        this.time += dt;
        if(this.state === 'idle') return;
        this.timer -= dt;

        if(this.state === 'dialing') {
            const t = (this.clock += dt);
            if(!this.ringOn && t >= RING_START && t < this.ringStop) {
                this.ringOn = true;
                sounds.gateSpin(true);
            }
            // Ring: ease in, roll, ease out to a stop at ringStop.
            const span = this.ringStop - RING_START;
            const u = Math.max(0, Math.min(1, (t - RING_START) / span));
            const ease = u < 0.12 ? (u * u) / (2 * 0.12 * 0.88) :
                u > 0.88 ? 1 - ((1 - u) * (1 - u)) / (2 * 0.12 * 0.88) :
                (u - 0.06) / 0.88;
            this.spin = this.spinFrom + (this.spinTo - this.spinFrom) * ease;
            // Chevrons 1-6 encode while the ring turns.
            while(this.locked < 6 && t >= this.chevronTimes[this.locked]) {
                this.locked++;
                this.phase = 'encode';
                this.lockFlash = 0.3;
                sounds.chevronLock(false);
            }
            // Ring stopped: its sound stops as chevron 7 locks.
            if(this.locked === 6 && t >= this.lockTime) {
                this.locked = 7;
                this.phase = 'lock';
                this.lockFlash = 0.6;
                sounds.gateSpin(false);
                this.ringOn = false;
                sounds.chevronLock(true);
            }
            if(this.lockFlash > 0) this.lockFlash -= dt;
            if(t >= this.openTime) {
                this.state = 'opening';
                this.timer = FORM_TIME;
                sounds.kawoosh();
            }
        } else if(this.state === 'opening') {
            if(this.timer <= 0) {
                this.state = 'kawoosh';
                this.timer = KAWOOSH_TIME;
            }
        } else if(this.state === 'kawoosh') {
            this.kawoosh = 1 - Math.max(0, this.timer) / KAWOOSH_TIME;
            if(this.timer <= 0) {
                this.state = 'open';
                this.timer = OPEN_TIME;
                sounds.horizon(true);
            }
        } else if(this.state === 'open') {
            if(this.timer <= 0) this.close();
        } else if(this.state === 'closing') {
            if(this.timer <= 0) {
                this.state = 'idle';
                this.locked = 0;
                this.target = null;
            }
        }
    }

    draw(ctx, time) {
        if(!ringSprite) ringSprite = buildRing();
        if(!symbolSprite) symbolSprite = buildSymbols();
        const R = GATE_RADIUS;

        ctx.save();
        ctx.translate(this.x, this.y);

        // The horizon forming: water rushing in from the rim (and still there under the
        // first moments of the kawoosh).
        if(this.state === 'opening') this.drawForming(ctx, time, 1 - Math.max(0, this.timer) / FORM_TIME);
        if(this.state === 'kawoosh' && this.kawoosh <= 0.45) this.drawForming(ctx, time, 1);

        // Event horizon behind the ring.
        if(this.state === 'open' || (this.state === 'closing' && this.wasOpen) || (this.state === 'kawoosh' && this.kawoosh > 0.45)) {
            const fade = this.state === 'closing' ? Math.max(0, this.timer / CLOSE_TIME) : 1;
            this.drawHorizon(ctx, time, fade);
        }

        ctx.save();
        ctx.rotate(this.spin);
        ctx.drawImage(symbolSprite.canvas, -R, -R, R * 2, R * 2);
        ctx.restore();
        ctx.drawImage(ringSprite.canvas, -R - 10, -R - 10, R * 2 + 20, R * 2 + 20);

        // Chevrons: locked ones glow.
        CHEVRON_ANGLES.forEach((a, i) => {
            const order = LOCK_ORDER.indexOf(i);
            const lit = order !== -1 && order < this.locked;
            const engaging = this.state === 'dialing' && this.lockFlash > 0 && order === this.locked - 1;
            ctx.save();
            ctx.rotate(a + Math.PI / 2);
            ctx.translate(0, -R + 2);
            ctx.fillStyle = 'rgb(120, 118, 125)';
            ctx.strokeStyle = 'rgb(35, 35, 42)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-8, -4); ctx.lineTo(8, -4); ctx.lineTo(4, 7); ctx.lineTo(0, 9); ctx.lineTo(-4, 7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = lit ? 'rgb(255, 140, 60)' : 'rgb(80, 40, 30)';
            ctx.beginPath();
            ctx.moveTo(-4, -1); ctx.lineTo(4, -1); ctx.lineTo(0, 6 + (engaging ? 2 : 0));
            ctx.closePath();
            ctx.fill();
            if(lit) {
                ctx.globalCompositeOperation = 'lighter';
                stamp(ctx, glowSprite('255,120,40'), 0, 2, 26, 26);
            }
            ctx.restore();
        });

        // The kawoosh: the unstable vortex bursting out and collapsing back.
        if(this.state === 'kawoosh') {
            const k = this.kawoosh;
            const burst = Math.sin(Math.min(1, k / 0.75) * Math.PI);
            const radius = GATE_INNER * (0.6 + 1.9 * burst);
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            g.addColorStop(0, 'rgba(240, 250, 255, ' + (0.9 * burst) + ')');
            g.addColorStop(0.5, 'rgba(110, 170, 255, ' + (0.75 * burst) + ')');
            g.addColorStop(1, 'rgba(60, 110, 255, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            // Spiralling vortex streaks.
            ctx.strokeStyle = 'rgba(220, 240, 255, ' + (0.6 * burst) + ')';
            ctx.lineWidth = 2;
            for(let i = 0; i < 6; i++) {
                const a0 = i * Math.PI / 3 + time * 6;
                ctx.beginPath();
                for(let s = 0; s <= 10; s++) {
                    const rr = radius * s / 10;
                    const aa = a0 + s * 0.35;
                    if(s === 0) ctx.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
                    else ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    // The event horizon forming, as seen in the show: churning icy white-blue water rushes in
    // from the rim while the middle is still see-through. `f` 0..1 is how far it has closed.
    drawForming(ctx, time, f) {
        const r = GATE_INNER;
        const e = f * f * (3 - 2 * f);
        const inner = r * (1 - e) * 0.95;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();
        // Translucent watery band, brightest and thickest at the rim.
        const g = ctx.createRadialGradient(0, 0, Math.max(0, inner * 0.85), 0, 0, r);
        g.addColorStop(0, 'rgba(150, 190, 240, 0)');
        g.addColorStop(0.2, 'rgba(170, 205, 250, ' + (0.35 + 0.3 * e) + ')');
        g.addColorStop(0.65, 'rgba(215, 235, 255, ' + (0.7 + 0.2 * e) + ')');
        g.addColorStop(1, 'rgba(150, 195, 250, 0.95)');
        ctx.fillStyle = g;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        // Churning foam swirling around in the band.
        ctx.globalCompositeOperation = 'lighter';
        FOAM.forEach(blob => {
            const a = blob.angle + time * blob.spin;
            const d = inner + (r - inner) * (0.15 + 0.85 * blob.depth) + Math.sin(time * 6 + blob.phase) * 2;
            const size = (6 + 12 * blob.size) * (0.6 + 0.4 * Math.sin(time * 7 + blob.phase));
            ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 9 + blob.phase);
            stamp(ctx, glowSprite(blob.spin > 0 ? '230,242,255' : '185,215,255'), Math.cos(a) * d, Math.sin(a) * d, size * 1.6, size);
        });
        // Ripple lines racing round the band.
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = 'rgb(235, 245, 255)';
        ctx.lineWidth = 1.2;
        for(let i = 0; i < 7; i++) {
            const rr = inner + (r - inner) * ((i + 0.5) / 7);
            const a0 = time * (i % 2 ? 3 : -2.4) + i;
            ctx.beginPath();
            ctx.arc(0, 0, rr, a0, a0 + 0.8 + 0.5 * Math.sin(time * 4 + i));
            ctx.stroke();
        }
        ctx.restore();
    }

    // Rippling, shimmering pool of the event horizon.
    drawHorizon(ctx, time, fade) {
        const r = GATE_INNER;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();
        const pool = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r);
        pool.addColorStop(0, 'rgba(200, 230, 255, ' + (0.95 * fade) + ')');
        pool.addColorStop(0.5, 'rgba(70, 140, 240, ' + (0.9 * fade) + ')');
        pool.addColorStop(1, 'rgba(25, 60, 170, ' + (0.95 * fade) + ')');
        ctx.fillStyle = pool;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1.5;
        for(let i = 0; i < 6; i++) {
            const t = (time * 0.45 + i / 6) % 1;
            ctx.strokeStyle = 'rgba(210, 235, 255, ' + (0.35 * (1 - t) * fade) + ')';
            ctx.beginPath();
            ctx.arc(Math.sin(time * 0.7 + i) * 4, Math.cos(time * 0.6 + i) * 4, r * t, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Caustic shimmer.
        for(let i = 0; i < 10; i++) {
            const a = time * 0.8 + i * 0.63;
            const d = (0.2 + 0.7 * ((i * 0.37 + time * 0.1) % 1)) * r;
            ctx.globalAlpha = 0.25 * fade;
            stamp(ctx, glowSprite('170,210,255'), Math.cos(a) * d, Math.sin(a * 1.3) * d, 22, 10);
        }
        ctx.restore();
    }

    // DHD pedestal: octagonal base, two rings of keys, red dome. Glows when you're in range.
    drawDHD(ctx, time, inRange) {
        const d = this.dhd;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.fillStyle = 'rgb(70, 68, 66)';
        ctx.strokeStyle = 'rgb(30, 28, 26)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for(let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4 + Math.PI / 8;
            if(i === 0) ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
            else ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        [[24, 19], [16, 20]].forEach(ring => {
            for(let i = 0; i < ring[1]; i++) {
                const a = i * Math.PI * 2 / ring[1];
                ctx.fillStyle = 'rgb(150, 145, 135)';
                ctx.fillRect(Math.cos(a) * ring[0] - 2, Math.sin(a) * ring[0] - 2, 4, 4);
            }
        });
        const pulse = 0.6 + 0.4 * Math.sin(time * 3);
        ctx.fillStyle = this.busy ? 'rgb(255, 90, 50)' : 'rgb(150, 40, 30)';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        if(this.busy || inRange) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = this.busy ? 1 : pulse * 0.6;
            stamp(ctx, glowSprite('255,90,50'), 0, 0, 40, 40);
        }
        ctx.restore();

        ctx.save();
        ctx.font = '11px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = inRange ? 'rgba(140, 255, 160, 0.95)' : 'rgba(200, 210, 230, 0.6)';
        ctx.fillText(inRange ? 'DHD · press B' : 'DHD', d.x, d.y + 46);
        ctx.restore();
    }
}

export default Stargate;
