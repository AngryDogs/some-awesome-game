// Background planets and nebula tint for each star system, rendered once into sprites.

import { createSprite } from './sprites';

const cache = {};

export const PALETTES = {
    ocean: { base: [40, 90, 170], dark: [10, 30, 70], land: [70, 140, 120], cloud: [235, 245, 255], atmosphere: '120,180,255' },
    earth: { base: [40, 80, 160], dark: [10, 25, 60], land: [70, 130, 70], cloud: [245, 248, 255], atmosphere: '130,180,255' },
    desert: { base: [200, 160, 100], dark: [90, 60, 30], land: [170, 120, 70], cloud: [240, 225, 200], atmosphere: '240,200,140' },
    jungle: { base: [60, 120, 70], dark: [15, 40, 20], land: [110, 100, 60], cloud: [235, 245, 235], atmosphere: '150,220,170' },
    rocky: { base: [150, 80, 60], dark: [50, 20, 15], land: [110, 60, 45], cloud: [220, 190, 170], atmosphere: '230,150,120' },
    industrial: { base: [110, 100, 110], dark: [30, 25, 35], land: [80, 70, 80], cloud: [200, 195, 210], atmosphere: '190,170,220' },
    ice: { base: [180, 220, 235], dark: [50, 80, 110], land: [140, 190, 215], cloud: [250, 252, 255], atmosphere: '170,230,255' }
};

const rgb = (c, a) => 'rgba(' + c.map(v => Math.round(v)).join(',') + ',' + (a === undefined ? 1 : a) + ')';

const rnd = (seed) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// A lit sphere with surface patches, cloud bands, a terminator and an atmosphere glow.
export const planetSprite = (system) => {
    if(cache[system.id]) return cache[system.id];
    const p = system.planet;
    const pal = PALETTES[p.type];
    const R = 220;
    const size = R * 2 + 80;
    const r = rnd(system.id.length * 977 + p.radius);

    cache[system.id] = createSprite(size, size, ctx => {
        ctx.translate(size / 2, size / 2);

        // Atmosphere halo.
        const halo = ctx.createRadialGradient(0, 0, R * 0.95, 0, 0, R + 38);
        halo.addColorStop(0, 'rgba(' + pal.atmosphere + ', 0.35)');
        halo.addColorStop(1, 'rgba(' + pal.atmosphere + ', 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, R + 38, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = rgb(pal.base);
        ctx.fill();
        ctx.save();
        ctx.clip();

        // Land / surface patches.
        for(let i = 0; i < 26; i++) {
            const a = r() * Math.PI * 2;
            const d = Math.sqrt(r()) * R;
            ctx.fillStyle = rgb(pal.land, 0.5 + r() * 0.4);
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, 20 + r() * 70, 12 + r() * 40, r() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        // Dune / band texture for desert and gas-like worlds.
        if(p.type === 'desert' || p.type === 'industrial') {
            ctx.strokeStyle = rgb(pal.dark, 0.15);
            ctx.lineWidth = 3;
            for(let y = -R; y < R; y += 14) {
                ctx.beginPath();
                ctx.moveTo(-R, y);
                ctx.quadraticCurveTo(0, y + (r() - 0.5) * 30, R, y + (r() - 0.5) * 20);
                ctx.stroke();
            }
        }
        // City lights on industrial worlds.
        if(p.type === 'industrial') {
            for(let i = 0; i < 80; i++) {
                ctx.fillStyle = 'rgba(255, 190, 110, ' + (0.4 + r() * 0.5) + ')';
                ctx.fillRect(-R * 0.2 + r() * R * 1.1, (r() - 0.5) * R * 1.6, 2, 2);
            }
        }
        // Clouds.
        for(let i = 0; i < 18; i++) {
            const y = (r() - 0.5) * R * 1.8;
            ctx.fillStyle = rgb(pal.cloud, 0.12 + r() * 0.25);
            ctx.beginPath();
            ctx.ellipse((r() - 0.5) * R, y, 60 + r() * 120, 6 + r() * 14, (r() - 0.5) * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        // Terminator: night side towards the bottom right.
        const night = ctx.createLinearGradient(-R * 0.6, -R * 0.7, R * 0.8, R * 0.9);
        night.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        night.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
        night.addColorStop(0.75, 'rgba(0, 0, 10, 0.7)');
        night.addColorStop(1, 'rgba(0, 0, 10, 0.92)');
        ctx.fillStyle = night;
        ctx.fillRect(-R, -R, R * 2, R * 2);
        ctx.restore();

        // Thin bright rim on the lit side.
        ctx.strokeStyle = 'rgba(' + pal.atmosphere + ', 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, R - 1, Math.PI * 0.85, Math.PI * 1.75);
        ctx.stroke();

        // Moon.
        if(p.moon) {
            const mx = -R * 1.05;
            const my = R * 0.85;
            const mr = 26;
            ctx.fillStyle = 'rgb(170, 168, 160)';
            ctx.beginPath();
            ctx.arc(mx, my, mr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 10, 0.6)';
            ctx.beginPath();
            ctx.arc(mx + 9, my + 8, mr, 0, Math.PI * 2);
            ctx.fill();
        }
    }, 1);
    cache[system.id].R = R;
    return cache[system.id];
};

// Very soft coloured nebula wash for the system's background.
export const nebulaSprite = (system) => {
    const key = 'nebula:' + system.id;
    if(cache[key]) return cache[key];
    const r = rnd(system.id.length * 131 + 7);
    cache[key] = createSprite(512, 512, ctx => {
        for(let i = 0; i < 7; i++) {
            const x = 80 + r() * 352;
            const y = 80 + r() * 352;
            const rad = 90 + r() * 160;
            const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
            g.addColorStop(0, 'rgba(' + system.tint + ', ' + (0.12 + r() * 0.1) + ')');
            g.addColorStop(1, 'rgba(' + system.tint + ', 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 512, 512);
        }
    }, 1);
    return cache[key];
};
