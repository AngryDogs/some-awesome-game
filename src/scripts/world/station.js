// Home base at the centre of the map: an Atlantis-style six-armed city-ship.
// Fly inside the docking ring and press B to dock with the shipyard.
//
// Performance: the city's line art (hundreds of glowing strokes) and the shield dome
// gradient are rendered once into sprites; each frame just stamps them.

import { createSprite, glowSprite, stamp } from '../render/sprites';

export const STATION = {
    x: 0,
    y: 0,
    dockRadius: 420,
    maxDockSpeed: 140,
    shieldRadius: 380,     // city shield: blocks asteroids, lets ships, shots and ore through
    impacts: []            // { angle, life, strength } ripples on the city shield
};

const LINE = 'rgba(200, 225, 255, 0.95)';
const FILL = 'rgba(8, 16, 30, 0.88)';

const poly = (ctx, pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if(fill !== false) ctx.fill();
    ctx.stroke();
};

const line = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

const hexagon = (r, offset) => {
    const pts = [];
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (offset || 0);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
};

// One arm along +x. Main piers are long with a broad, angled end platform;
// the others are shorter with a compact platform.
const drawArm = (ctx, main, index) => {
    const length = main ? 270 : 215;
    const half = main ? 22 : 18;

    // Pier.
    poly(ctx, [[70, -half], [length, -half], [length, half], [70, half]]);
    line(ctx, 80, 0, length - 10, 0);
    line(ctx, 80, -half * 0.5, length - 10, -half * 0.5);
    line(ctx, 80, half * 0.5, length - 10, half * 0.5);
    for(let x = 95; x < length - 10; x += 22) line(ctx, x, -half, x, half);

    // End platform.
    if(main) {
        poly(ctx, [[length, -half], [length + 18, -58], [length + 78, -58], [length + 96, -26],
            [length + 96, 26], [length + 78, 58], [length + 18, 58], [length, half]]);
        poly(ctx, [[length + 26, -40], [length + 70, -40], [length + 80, 0], [length + 70, 40], [length + 26, 40], [length + 16, 0]]);
        // Tower blocks seen from above.
        [[length + 36, -18], [length + 56, 14], [length + 44, 26], [length + 62, -26]].forEach(t => {
            ctx.strokeRect(t[0] - 6, t[1] - 6, 12, 12);
            ctx.strokeRect(t[0] - 3, t[1] - 3, 6, 6);
        });
        // Side jetty.
        poly(ctx, [[length - 70, half], [length - 40, half + 34], [length - 20, half + 34], [length - 36, half]]);
    } else {
        poly(ctx, [[length, -half], [length + 20, -38], [length + 52, -30], [length + 62, 0],
            [length + 52, 30], [length + 20, 38], [length, half]]);
        ctx.strokeRect(length + 16, -12, 24, 24);
        ctx.beginPath();
        ctx.arc(length + 28, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Window lights along the pier.
    ctx.save();
    ctx.fillStyle = 'rgba(255, 230, 160, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 210, 120, 0.9)';
    for(let x = 90; x < length; x += 11) {
        const on = Math.sin(x * 0.37 + index * 1.7) > -0.3;
        if(!on) continue;
        ctx.fillRect(x, -half * 0.75, 2, 2);
        ctx.fillRect(x + 4, half * 0.7, 2, 2);
    }
    ctx.restore();
};

const EXTENT = 460;
const sprites = {};

// City, shield dome and docking ring baked together: one straight image copy per frame.
// Two variants: normal, and with the docking ring lit when the player can dock.
const buildCity = (canDock) => createSprite(EXTENT * 2, EXTENT * 2, ctx => {
    ctx.translate(EXTENT, EXTENT);

    ctx.setLineDash([12, 14]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const R = STATION.shieldRadius;
    const dome = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
    dome.addColorStop(0, 'rgba(120, 190, 255, 0)');
    dome.addColorStop(0.85, 'rgba(120, 190, 255, 0.05)');
    dome.addColorStop(1, 'rgba(140, 205, 255, 0.15)');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 210, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = LINE;
    ctx.fillStyle = FILL;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(150, 200, 255, 0.7)';

    for(let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 3 - Math.PI / 2);
        ctx.strokeStyle = LINE;
        ctx.fillStyle = FILL;
        drawArm(ctx, i % 2 === 0, i);
        ctx.restore();
    }

    poly(ctx, hexagon(92, Math.PI / 6));
    poly(ctx, hexagon(70, 0));
    poly(ctx, hexagon(48, Math.PI / 6));
    const star = hexagon(40, 0);
    [[0, 2], [2, 4], [4, 0], [1, 3], [3, 5], [5, 1]].forEach(pair => {
        line(ctx, star[pair[0]][0], star[pair[0]][1], star[pair[1]][0], star[pair[1]][1]);
    });
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        line(ctx, Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a) * 92, Math.sin(a) * 92);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
});

export const drawStation = (ctx, time, canDock) => {
    const key = canDock ? 'dock' : 'idle';
    if(!sprites[key]) sprites[key] = buildCity(canDock);
    const R = STATION.shieldRadius;

    ctx.save();
    ctx.translate(STATION.x, STATION.y);
    ctx.drawImage(sprites[key].canvas, -EXTENT, -EXTENT, EXTENT * 2, EXTENT * 2);

    // Impact ripples and flares (only while something has just hit).
    if(STATION.impacts.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        STATION.impacts.forEach(impact => {
            const ix = Math.cos(impact.angle) * R;
            const iy = Math.sin(impact.angle) * R;
            const size = (60 + 100 * impact.strength) * impact.life;
            ctx.globalAlpha = impact.life;
            stamp(ctx, glowSprite('140,200,255'), ix, iy, size, size);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(150, 215, 255, ' + (0.6 * impact.life) + ')';
            ctx.lineWidth = 2.5 * impact.life + 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, R, impact.angle - 0.25 * impact.strength - (1 - impact.life) * 0.4,
                impact.angle + 0.25 * impact.strength + (1 - impact.life) * 0.4);
            ctx.stroke();
        });
        ctx.restore();
    }

    // Gate room glow.
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    ctx.globalAlpha = 0.8 * pulse;
    stamp(ctx, glowSprite('80,150,255'), 0, 0, 40, 40);

    // Beacons on the main pier tips.
    const blink = Math.sin(time * 4) > 0;
    if(blink) {
        ctx.globalAlpha = 1;
        const color = canDock ? '140,255,160' : '255,120,100';
        for(let i = 0; i < 6; i += 2) {
            const angle = i * Math.PI / 3 - Math.PI / 2;
            stamp(ctx, glowSprite(color), Math.cos(angle) * 372, Math.sin(angle) * 372, 22, 22);
        }
    }
    ctx.restore();

    ctx.save();
    ctx.font = '16px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
    ctx.fillText('ATLANTIS · SHIPYARD', STATION.x, STATION.y - STATION.dockRadius - 14);
    ctx.restore();
};
