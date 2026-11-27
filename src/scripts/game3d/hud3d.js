// Heads-up display for the 3D game, drawn on a 2D canvas over the 3D view: crosshair, nose
// marker, target brackets, edge arrows, a 3D radar, the weapons panel and messages.

const RADAR_RANGE = 3500;

export const drawCrosshair = (ctx, x, y, steering, onTarget) => {
    ctx.save();
    ctx.strokeStyle = onTarget ? 'rgba(255, 110, 90, 0.95)' : 'rgba(255, 140, 120, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, onTarget ? 10 : 8, 0, Math.PI * 2);
    ctx.moveTo(x - 16, y); ctx.lineTo(x - 5, y);
    ctx.moveTo(x + 5, y); ctx.lineTo(x + 16, y);
    ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 5);
    ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 16);
    ctx.stroke();
    if(!steering) {
        ctx.font = '9px Bungee, sans-serif';
        ctx.fillStyle = 'rgba(255, 180, 150, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('FREE AIM', x, y + 30);
    }
    ctx.restore();
};

// Where the ship's nose points, and the dead zone of mouse steering around the centre.
export const drawNose = (ctx, w, h, nose, deadZone) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 200, 255, 0.25)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, deadZone, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if(nose && !nose.behind) {
        ctx.strokeStyle = 'rgba(170, 220, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nose.x - 7, nose.y); ctx.lineTo(nose.x - 2, nose.y);
        ctx.moveTo(nose.x + 2, nose.y); ctx.lineTo(nose.x + 7, nose.y);
        ctx.moveTo(nose.x, nose.y + 2); ctx.lineTo(nose.x, nose.y + 6);
        ctx.stroke();
    }
    ctx.restore();
};

// A marked object: brackets (with optional bars and label) when on screen, otherwise an
// arrow at the screen edge pointing towards it.
//   m: { p: projected {x, y, behind}, size, color, label, distance, hull, shield, shape }
export const drawMarker = (ctx, w, h, m) => {
    const margin = 36;
    const p = m.p;
    const onScreen = !p.behind && p.x > -20 && p.x < w + 20 && p.y > -20 && p.y < h + 20;
    ctx.save();
    ctx.strokeStyle = 'rgba(' + m.color + ', 0.9)';
    ctx.fillStyle = 'rgba(' + m.color + ', 0.9)';
    ctx.lineWidth = 1.4;
    ctx.font = '10px Bungee, sans-serif';
    ctx.textAlign = 'center';
    if(onScreen) {
        const r = Math.max(10, Math.min(220, m.size));
        if(m.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const c = r * 0.4;
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(k => {
                ctx.beginPath();
                ctx.moveTo(p.x + k[0] * r, p.y + k[1] * (r - c));
                ctx.lineTo(p.x + k[0] * r, p.y + k[1] * r);
                ctx.lineTo(p.x + k[0] * (r - c), p.y + k[1] * r);
                ctx.stroke();
            });
        }
        let y = p.y - r - 8;
        if(m.hull !== undefined) {
            const bw = Math.max(36, r * 1.4);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(p.x - bw / 2, y - 3, bw, 3.5);
            ctx.fillStyle = 'rgb(255, 110, 80)';
            ctx.fillRect(p.x - bw / 2, y - 3, bw * Math.max(0, m.hull), 3.5);
            if(m.shield !== undefined) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.fillRect(p.x - bw / 2, y - 8.5, bw, 3.5);
                ctx.fillStyle = 'rgb(110, 200, 255)';
                ctx.fillRect(p.x - bw / 2, y - 8.5, bw * Math.max(0, m.shield), 3.5);
                y -= 6;
            }
            y -= 7;
        }
        ctx.fillStyle = 'rgba(' + m.color + ', 0.9)';
        if(m.label) ctx.fillText(m.label, p.x, y);
        if(m.distance !== undefined) ctx.fillText((m.distance / 1000).toFixed(1) + 'k', p.x, p.y + r + 14);
    } else {
        // Direction on screen (flipped when behind the camera).
        let dx = p.x - w / 2;
        let dy = p.y - h / 2;
        if(p.behind) { dx = -dx; dy = -dy; }
        const angle = Math.atan2(dy, dx);
        const scale = Math.min(Math.abs((w / 2 - margin) / Math.cos(angle) || Infinity), Math.abs((h / 2 - margin) / Math.sin(angle) || Infinity));
        ctx.translate(w / 2 + Math.cos(angle) * scale, h / 2 + Math.sin(angle) * scale);
        if(m.distance !== undefined) ctx.fillText((m.label ? m.label + ' ' : '') + (m.distance / 1000).toFixed(1) + 'k', -Math.cos(angle) * 30, -Math.sin(angle) * 30 + 4);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
};

// 3D radar: contacts relative to the ship, seen from above its own deck (forward = up on
// the scope). A stalk shows how far above (solid) or below (dashed) each contact is.
//   contacts: [{ local: {x, y, z} (ship frame: x forward, y port, z up), color, size }]
export const drawRadar = (ctx, w, h, contacts, compact) => {
    const size = compact ? 120 : 190;
    const cx = w - size / 2 - 16;
    const cy = h - size / 2 - 16;
    const r = size / 2;
    const scale = r / RADAR_RANGE;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.88)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.15)';
    [0.33, 0.66].forEach(k => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * k, r * 0.62 * k, 0, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r * 0.62); ctx.lineTo(cx, cy + r * 0.62);
    ctx.stroke();
    contacts.forEach(c => {
        const l = c.local;
        const d = Math.sqrt(l.x * l.x + l.y * l.y + l.z * l.z);
        let k = scale;
        if(d * scale > r * 0.95) k = r * 0.95 / d;
        // Plane position (tilted ellipse) and height stalk.
        const px = cx - l.y * k;
        const py = cy - l.x * k * 0.62;
        const top = py - l.z * k * 0.62;
        ctx.strokeStyle = 'rgba(' + c.color + ', 0.6)';
        ctx.lineWidth = 1;
        if(l.z < 0) ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, top);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgb(' + c.color + ')';
        const s = c.size || 2;
        if(c.triangle) {
            ctx.beginPath();
            ctx.moveTo(px, top - s * 1.4); ctx.lineTo(px - s, top + s); ctx.lineTo(px + s, top + s);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(px - s / 2, top - s / 2, s, s);
        }
    });
    // The ship itself.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('RADAR ' + (RADAR_RANGE / 1000).toFixed(1) + 'k', cx - r + 6, cy - r * 0.62 - 6);
    ctx.restore();
};

const LABELS = { ready: 'READY', hot: 'HOT', overheated: 'OVERHEAT', firing: 'FIRING', charging: 'CHARGING', reloading: 'RELOAD', off: 'OFF' };

// Weapons panel (bottom left). Returns the clickable row rectangles.
export const drawWeapons = (ctx, w, h, weapons) => {
    const rows = [];
    if(!weapons.length) return rows;
    const rowHeight = 22;
    const left = 16;
    const top = h - 16 - weapons.length * rowHeight - 18;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.85)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.4)';
    ctx.fillRect(left, top, 230, weapons.length * rowHeight + 22);
    ctx.strokeRect(left, top, 230, weapons.length * rowHeight + 22);
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('WEAPONS', left + 8, top + 14);
    weapons.forEach((wp, i) => {
        const y = top + 22 + i * rowHeight;
        rows.push({ x: left, y: y, w: 230, h: rowHeight, kind: wp.kind });
        ctx.globalAlpha = wp.off ? 0.4 : 1;
        ctx.fillStyle = 'rgb(' + wp.color + ')';
        ctx.font = '11px Bungee, sans-serif';
        ctx.fillText((i < 5 ? (i + 1) + ' ' : '') + wp.name + (wp.count > 1 ? ' x' + wp.count : ''), left + 8, y + 11);
        const barX = left + 108;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(barX, y + 3, 70, 8);
        const warn = wp.state === 'overheated' || wp.state === 'hot';
        ctx.fillStyle = warn ? (wp.state === 'overheated' ? 'rgb(255, 80, 60)' : 'rgb(255, 170, 70)') : 'rgb(' + wp.color + ')';
        ctx.fillRect(barX + 1, y + 4, 68 * wp.ready, 6);
        ctx.globalAlpha = 1;
        ctx.font = '9px Bungee, sans-serif';
        ctx.fillStyle = wp.off ? 'rgba(255, 110, 90, 0.95)' : wp.state === 'ready' ? 'rgba(140, 255, 160, 0.9)' : (warn ? 'rgba(255, 140, 100, 0.95)' : 'rgba(200, 220, 255, 0.8)');
        ctx.fillText(LABELS[wp.state], barX + 76, y + 11);
    });
    ctx.restore();
    return rows;
};

export const drawText = (ctx, text, x, y, size, color, align) => {
    ctx.save();
    ctx.font = size + 'px Bungee, sans-serif';
    ctx.textAlign = align || 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x, y);
    ctx.restore();
};
