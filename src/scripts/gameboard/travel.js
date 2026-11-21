// Visuals for travelling between star systems: the wormhole ride through a Stargate,
// the hyperspace window that opens in front of a ship, and the hyperspace tunnel.

import { glowSprite, stamp } from '../render/sprites';

// Streaks for the tunnels, created once.
const STREAKS = [];
for(let i = 0; i < 160; i++) {
    STREAKS.push({ angle: Math.random() * Math.PI * 2, depth: Math.random(), speed: 0.6 + Math.random() * 0.8, width: 0.5 + Math.random() * 2 });
}

// Wormhole: a rushing, twisting tunnel of blue-white bands. `progress` 0..1 over the trip.
export const drawWormhole = (ctx, w, h, time, progress) => {
    const cx = w / 2 + Math.sin(time * 1.7) * w * 0.06;
    const cy = h / 2 + Math.cos(time * 1.3) * h * 0.05;
    const max = Math.sqrt(w * w + h * h) * 0.6;

    ctx.fillStyle = 'rgb(4, 10, 30)';
    ctx.fillRect(0, 0, w, h);

    // Banded walls rushing past.
    for(let i = 14; i >= 0; i--) {
        const z = ((i / 14) + time * 1.6) % 1;
        const r = Math.pow(z, 2.2) * max;
        const twist = time * 2 + i * 0.4;
        const g = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
        const hue = i % 3 === 0 ? '170,210,255' : i % 3 === 1 ? '80,130,255' : '140,110,255';
        g.addColorStop(0, 'rgba(' + hue + ', 0)');
        g.addColorStop(1, 'rgba(' + hue + ', ' + (0.12 + 0.1 * z) + ')');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * (0.85 + 0.1 * Math.sin(twist)), twist * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Streaks spiralling outwards.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    STREAKS.forEach(s => {
        const z = (s.depth + time * s.speed * 0.9) % 1;
        const a = s.angle + time * 1.2 + z * 1.5;
        const r1 = Math.pow(z, 2.4) * max;
        const r2 = Math.pow(Math.min(1, z + 0.05), 2.4) * max;
        ctx.strokeStyle = 'rgba(210, 230, 255, ' + (0.15 + 0.7 * z) + ')';
        ctx.lineWidth = s.width * (0.5 + z * 2);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a + 0.08) * r2, cy + Math.sin(a + 0.08) * r2);
        ctx.stroke();
    });
    // Bright light at the end of the tunnel, growing as you arrive.
    const end = 60 + progress * 260;
    stamp(ctx, glowSprite('190,220,255'), cx, cy, end, end);
    ctx.restore();

    // Flash in and out.
    const flash = Math.max(0, 1 - progress * 6) + Math.max(0, (progress - 0.85) / 0.15);
    if(flash > 0) {
        ctx.fillStyle = 'rgba(230, 240, 255, ' + Math.min(1, flash) + ')';
        ctx.fillRect(0, 0, w, h);
    }
};

// Hyperspace, as in the show: soft, blurred blue-white rays streaming out of a bright,
// crystalline vanishing point, with dark bands between them, and the ship flying in the
// middle. The rays are drawn into a small offscreen canvas and scaled up, which blurs them
// cheaply.
let rayCanvas = null;
const RAYS = [];
for(let i = 0; i < 46; i++) {
    RAYS.push({ angle: Math.random() * Math.PI * 2, width: 0.05 + Math.random() * 0.16, light: Math.random() < 0.55,
        speed: 0.6 + Math.random() * 1.4, phase: Math.random() * 10, drift: (Math.random() - 0.5) * 0.06 });
}

export const hyperVanishingPoint = (w, h, time) => ({
    x: w * (0.3 + Math.sin(time * 0.31) * 0.025),
    y: h * (0.24 + Math.cos(time * 0.27) * 0.025)
});

// `drawShip(ctx, x, y, angle, scale)` draws the player's ship in the tunnel (optional).
export const drawHyperspace = (ctx, w, h, time, progress, label, drawShip) => {
    const vp = hyperVanishingPoint(w, h, time);
    const scale = 8;
    const sw = Math.max(32, Math.ceil(w / scale));
    const sh = Math.max(24, Math.ceil(h / scale));
    if(!rayCanvas) rayCanvas = document.createElement('canvas');
    if(rayCanvas.width !== sw || rayCanvas.height !== sh) {
        rayCanvas.width = sw;
        rayCanvas.height = sh;
    }
    const r = rayCanvas.getContext('2d');
    const vx = vp.x / scale;
    const vy = vp.y / scale;
    const far = Math.sqrt(sw * sw + sh * sh) * 1.2;

    // Pale blue base, brighter towards the vanishing point.
    const base = r.createRadialGradient(vx, vy, 0, vx, vy, far);
    base.addColorStop(0, 'rgb(235, 245, 255)');
    base.addColorStop(0.2, 'rgb(165, 200, 240)');
    base.addColorStop(0.6, 'rgb(110, 150, 210)');
    base.addColorStop(1, 'rgb(70, 100, 165)');
    r.fillStyle = base;
    r.fillRect(0, 0, sw, sh);

    // Wedge-shaped rays: light streams and dark bands, slowly turning and pulsing.
    RAYS.forEach(ray => {
        const a = ray.angle + time * ray.drift;
        const pulse = 0.5 + 0.5 * Math.sin(time * ray.speed + ray.phase);
        const half = ray.width * (0.7 + 0.5 * pulse);
        r.fillStyle = ray.light ? 'rgba(235, 245, 255, ' + (0.18 + 0.3 * pulse) + ')' : 'rgba(8, 16, 40, ' + (0.2 + 0.35 * pulse) + ')';
        r.beginPath();
        r.moveTo(vx, vy);
        r.lineTo(vx + Math.cos(a - half) * far, vy + Math.sin(a - half) * far);
        r.lineTo(vx + Math.cos(a + half) * far, vy + Math.sin(a + half) * far);
        r.closePath();
        r.fill();
    });

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(rayCanvas, 0, 0, sw * scale, sh * scale);

    // Light streaming outwards along the rays.
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const max = Math.sqrt(w * w + h * h);
    STREAKS.forEach(st => {
        const z = (st.depth + time * st.speed * 0.8) % 1;
        const r1 = Math.pow(z, 2.2) * max;
        const r2 = Math.pow(Math.min(1, z + 0.12), 2.2) * max;
        ctx.strokeStyle = 'rgba(225, 240, 255, ' + (0.02 + 0.08 * z) + ')';
        ctx.lineWidth = st.width * (4 + z * 16);
        ctx.beginPath();
        ctx.moveTo(vp.x + Math.cos(st.angle) * r1, vp.y + Math.sin(st.angle) * r1);
        ctx.lineTo(vp.x + Math.cos(st.angle) * r2, vp.y + Math.sin(st.angle) * r2);
        ctx.stroke();
    });

    // The crystalline glare at the vanishing point: overlapping flickering glows and
    // fine facets.
    for(let i = 0; i < 7; i++) {
        const a = i * 0.9 + time * 0.7;
        const d = 18 + 14 * Math.sin(time * 1.3 + i);
        const size = 90 + 50 * Math.sin(time * 2 + i * 1.7);
        ctx.globalAlpha = 0.45;
        stamp(ctx, glowSprite(i % 2 ? '200,225,255' : '240,248,255'), vp.x + Math.cos(a) * d, vp.y + Math.sin(a) * d, size, size);
    }
    ctx.globalAlpha = 0.9;
    stamp(ctx, glowSprite('250,252,255'), vp.x, vp.y, 120, 120);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(240, 248, 255, 0.35)';
    ctx.lineWidth = 1;
    for(let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5 + time * 0.4;
        const len = 20 + 18 * Math.sin(time * 3 + i * 2.1);
        ctx.beginPath();
        ctx.moveTo(vp.x + Math.cos(a) * 6, vp.y + Math.sin(a) * 6);
        ctx.lineTo(vp.x + Math.cos(a + 0.4) * len, vp.y + Math.sin(a + 0.4) * len);
        ctx.lineTo(vp.x + Math.cos(a - 0.3) * len * 0.6, vp.y + Math.sin(a - 0.3) * len * 0.6);
        ctx.stroke();
    }
    ctx.restore();

    // The ship, flying away from the camera towards the vanishing point.
    if(drawShip) {
        const sx = w * 0.52 + Math.sin(time * 0.9) * 6;
        const sy = h * 0.58 + Math.cos(time * 1.1) * 5;
        drawShip(ctx, sx, sy, Math.atan2(vp.y - sy, vp.x - sx), Math.min(w, h) / 520);
    }

    // Progress and destination.
    const cx = w / 2;
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10, 20, 50, 0.85)';
    ctx.fillText(label, cx, h - 80);
    ctx.strokeStyle = 'rgba(10, 20, 50, 0.6)';
    ctx.strokeRect(cx - 150, h - 64, 300, 8);
    ctx.fillStyle = 'rgba(20, 50, 120, 0.9)';
    ctx.fillRect(cx - 149, h - 63, 298 * progress, 6);
    ctx.restore();
};

// Hyperspace window, in world space: a swirling, wispy cloud of pale blue-white light with
// a bright heart (no hard edge). `open` 0..1 is how far it has opened.
const WISPS = [];
for(let i = 0; i < 14; i++) {
    WISPS.push({ angle: Math.random() * Math.PI * 2, dist: 0.15 + Math.random() * 0.55, size: 0.5 + Math.random() * 0.9,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9), phase: Math.random() * 10 });
}

export const drawHyperWindow = (ctx, x, y, radius, time, open) => {
    if(open <= 0) return;
    const r = radius * open;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    // Faint outer haze.
    ctx.globalAlpha = Math.min(1, open * 1.2) * 0.35;
    stamp(ctx, glowSprite('90,150,150'), 0, 0, r * 2.6, r * 2.4);
    // Cloudy, turning wisps.
    WISPS.forEach(wisp => {
        const a = wisp.angle + time * wisp.spin;
        const d = r * wisp.dist * (0.85 + 0.15 * Math.sin(time * 1.7 + wisp.phase));
        const size = r * wisp.size * (0.8 + 0.25 * Math.sin(time * 2.3 + wisp.phase));
        ctx.globalAlpha = Math.min(1, open * 1.5) * (0.14 + 0.1 * Math.sin(time * 3 + wisp.phase));
        stamp(ctx, glowSprite(wisp.spin > 0 ? '150,215,215' : '190,235,235'), Math.cos(a) * d, Math.sin(a) * d, size * 1.4, size * 0.8);
    });
    // Bright heart.
    ctx.globalAlpha = Math.min(1, open * 2);
    const flicker = 0.85 + 0.15 * Math.sin(time * 9) * Math.sin(time * 5.3);
    stamp(ctx, glowSprite('210,245,240'), r * 0.05, -r * 0.04, r * 0.75 * flicker, r * 0.65 * flicker);
    stamp(ctx, glowSprite('255,255,255'), 0, 0, r * 0.3, r * 0.3);
    ctx.restore();
};
