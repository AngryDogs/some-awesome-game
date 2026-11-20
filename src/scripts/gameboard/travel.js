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

// Hyperspace: a deep blue tunnel with streaming light clouds and star streaks.
export const drawHyperspace = (ctx, w, h, time, progress, label) => {
    const cx = w / 2;
    const cy = h / 2;
    const max = Math.sqrt(w * w + h * h) * 0.6;

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, max);
    bg.addColorStop(0, 'rgb(200, 225, 255)');
    bg.addColorStop(0.12, 'rgb(60, 110, 220)');
    bg.addColorStop(0.5, 'rgb(15, 35, 110)');
    bg.addColorStop(1, 'rgb(5, 10, 40)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Light clouds rushing past.
    for(let i = 0; i < 24; i++) {
        const z = ((i / 24) + time * 0.7) % 1;
        const a = i * 2.4 + time * 0.3;
        const r = Math.pow(z, 2) * max;
        const size = 40 + z * 380;
        ctx.globalAlpha = 0.12 + 0.25 * z;
        stamp(ctx, glowSprite(i % 2 ? '120,170,255' : '180,210,255'), cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, size * 0.6);
    }
    ctx.globalAlpha = 1;
    // Long star streaks.
    ctx.lineCap = 'round';
    STREAKS.forEach(s => {
        const z = (s.depth + time * s.speed * 1.4) % 1;
        const r1 = Math.pow(z, 2.6) * max;
        const r2 = Math.pow(Math.min(1, z + 0.1), 2.6) * max;
        ctx.strokeStyle = 'rgba(235, 245, 255, ' + (0.1 + 0.8 * z) + ')';
        ctx.lineWidth = s.width * (0.4 + z * 1.6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.angle) * r1, cy + Math.sin(s.angle) * r1);
        ctx.lineTo(cx + Math.cos(s.angle) * r2, cy + Math.sin(s.angle) * r2);
        ctx.stroke();
    });
    ctx.restore();

    // Progress and destination.
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230, 240, 255, 0.9)';
    ctx.fillText(label, cx, h - 80);
    ctx.strokeStyle = 'rgba(230, 240, 255, 0.6)';
    ctx.strokeRect(cx - 150, h - 64, 300, 8);
    ctx.fillStyle = 'rgba(160, 210, 255, 0.9)';
    ctx.fillRect(cx - 149, h - 63, 298 * progress, 6);
    ctx.restore();
};

// Hyperspace window: a swirling blue-white vortex disc with a bright rim, in world space.
// `open` 0..1 is how far it has opened.
export const drawHyperWindow = (ctx, x, y, radius, time, open) => {
    if(open <= 0) return;
    const r = radius * open;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, open * 1.5);
    stamp(ctx, glowSprite('120,170,255'), 0, 0, r * 3.2, r * 3.2);
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    core.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
    core.addColorStop(0.4, 'rgba(120, 170, 255, 0.7)');
    core.addColorStop(1, 'rgba(40, 80, 220, 0.1)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    // Swirl arms.
    ctx.lineCap = 'round';
    for(let i = 0; i < 7; i++) {
        const a0 = i * Math.PI * 2 / 7 + time * 3;
        ctx.strokeStyle = 'rgba(220, 235, 255, 0.55)';
        ctx.lineWidth = 2 + r * 0.02;
        ctx.beginPath();
        for(let s = 0; s <= 14; s++) {
            const rr = r * (1 - s / 14);
            const aa = a0 + s * 0.32;
            if(s === 0) ctx.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
            else ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
        }
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200, 225, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};
