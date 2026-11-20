// The home shipyard station at the centre of the map. Fly close and press B to dock.

export const STATION = {
    x: 0,
    y: 0,
    dockRadius: 260,
    maxDockSpeed: 140,
    spin: 0.03
};

const rect = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    ctx.fill();
    ctx.stroke();
};

const line = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

export const drawStation = (ctx, time, canDock) => {
    ctx.save();
    ctx.translate(STATION.x, STATION.y);

    // Docking zone.
    ctx.setLineDash([10, 12]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.rotate(time * STATION.spin);
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.95)';
    ctx.fillStyle = 'rgba(8, 14, 28, 0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(160, 200, 255, 0.8)';

    // Four construction arms with gantry frames and dock blocks.
    for(let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 2);
        rect(ctx, 40, -12, 150, 12);
        for(let x = 55; x < 150; x += 20) line(ctx, x, -12, x + 10, 12);
        rect(ctx, 150, -30, 190, 30);
        rect(ctx, 158, -22, 182, 22);
        // Slipway: open frame where ships are built.
        ctx.beginPath();
        ctx.moveTo(60, -12); ctx.lineTo(60, -60); ctx.lineTo(140, -60); ctx.lineTo(140, -12);
        ctx.stroke();
        line(ctx, 60, -36, 140, -36);
        ctx.restore();
    }

    // Central hub.
    rect(ctx, -44, -44, 44, 44);
    rect(ctx, -30, -30, 30, 30);
    line(ctx, -30, -30, 30, 30);
    line(ctx, -30, 30, 30, -30);
    rect(ctx, -10, -10, 10, 10);

    // Blinking beacons on the arm tips.
    const blink = Math.sin(time * 4) > 0;
    ctx.shadowBlur = 12;
    for(let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        const color = blink ? (canDock ? '140,255,160' : '255,120,100') : '80,90,110';
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 196, Math.sin(angle) * 196, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Label (not rotated).
    ctx.save();
    ctx.font = '14px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('SHIPYARD', STATION.x, STATION.y - STATION.dockRadius - 12);
    ctx.restore();
};
