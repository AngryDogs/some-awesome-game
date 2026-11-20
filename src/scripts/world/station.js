// Home base at the centre of the map: an Atlantis-style six-armed city-ship.
// Fly inside the docking ring and press B to dock with the shipyard.

export const STATION = {
    x: 0,
    y: 0,
    dockRadius: 400,
    maxDockSpeed: 140,
    spin: 0.012
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
const drawArm = (ctx, main, time, index) => {
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

    // Window lights along the pier, twinkling slowly.
    ctx.save();
    ctx.fillStyle = 'rgba(255, 230, 160, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 210, 120, 0.9)';
    for(let x = 90; x < length; x += 11) {
        const on = Math.sin(time * 0.7 + x * 0.37 + index * 1.7) > -0.3;
        if(!on) continue;
        ctx.fillRect(x, -half * 0.75, 2, 2);
        ctx.fillRect(x + 4, half * 0.7, 2, 2);
    }
    ctx.restore();
};

export const drawStation = (ctx, time, canDock) => {
    ctx.save();
    ctx.translate(STATION.x, STATION.y);

    // Docking ring.
    ctx.setLineDash([12, 14]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint city shield dome.
    const dome = ctx.createRadialGradient(0, 0, 200, 0, 0, 380);
    dome.addColorStop(0, 'rgba(120, 190, 255, 0)');
    dome.addColorStop(0.9, 'rgba(120, 190, 255, 0.05)');
    dome.addColorStop(1, 'rgba(120, 190, 255, 0.12)');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(0, 0, 380, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(time * STATION.spin);
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
        drawArm(ctx, i % 2 === 0, time, i);
        ctx.restore();
    }

    // Central hub: layered hexagons, the star-shaped gate room and the central tower.
    poly(ctx, hexagon(92, Math.PI / 6));
    poly(ctx, hexagon(70, 0));
    poly(ctx, hexagon(48, Math.PI / 6));
    const star = hexagon(40, 0);
    line(ctx, star[0][0], star[0][1], star[2][0], star[2][1]);
    line(ctx, star[2][0], star[2][1], star[4][0], star[4][1]);
    line(ctx, star[4][0], star[4][1], star[0][0], star[0][1]);
    line(ctx, star[1][0], star[1][1], star[3][0], star[3][1]);
    line(ctx, star[3][0], star[3][1], star[5][0], star[5][1]);
    line(ctx, star[5][0], star[5][1], star[1][0], star[1][1]);
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        line(ctx, Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a) * 92, Math.sin(a) * 92);
    }

    // Gate room glow.
    ctx.shadowBlur = 0;
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    const gate = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
    gate.addColorStop(0, 'rgba(160, 220, 255, ' + (0.8 * pulse) + ')');
    gate.addColorStop(1, 'rgba(80, 150, 255, 0)');
    ctx.fillStyle = gate;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Beacons on the main pier tips.
    const blink = Math.sin(time * 4) > 0;
    ctx.shadowBlur = 12;
    for(let i = 0; i < 6; i += 2) {
        const angle = i * Math.PI / 3 - Math.PI / 2;
        const color = blink ? (canDock ? '140,255,160' : '255,120,100') : '80,90,110';
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 372, Math.sin(angle) * 372, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.font = '16px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
    ctx.fillText('ATLANTIS · SHIPYARD', STATION.x, STATION.y - STATION.dockRadius - 14);
    ctx.restore();
};
