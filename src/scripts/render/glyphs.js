// Stargate symbols. Each of the 38 constellations gets its own glyph, generated from its
// index out of a few stroke primitives (lines between grid points, arcs, dots), so every
// symbol is distinct and stable. Each gate also has a point-of-origin glyph: a pyramid
// motif with a varying crown.

const rng = (seed) => {
    let a = (seed * 2654435761) >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// 3x3 grid of anchor points in a unit box (-1..1).
const GRID = [];
for(let y = -1; y <= 1; y++) for(let x = -1; x <= 1; x++) GRID.push([x * 0.8, y * 0.8]);

const cache = {};

const buildGlyph = (index) => {
    const r = rng(index + 11);
    const strokes = [];
    const count = 2 + Math.floor(r() * 3);
    for(let i = 0; i < count; i++) {
        const kind = r();
        if(kind < 0.55) {
            // Polyline through 2-3 grid points.
            const pts = [];
            const n = 2 + Math.floor(r() * 2);
            for(let k = 0; k < n; k++) pts.push(GRID[Math.floor(r() * GRID.length)]);
            strokes.push({ type: 'line', pts: pts });
        } else if(kind < 0.85) {
            const c = GRID[Math.floor(r() * GRID.length)];
            const start = Math.floor(r() * 4) * Math.PI / 2;
            strokes.push({ type: 'arc', x: c[0] * 0.6, y: c[1] * 0.6, r: 0.35 + r() * 0.4, a1: start, a2: start + Math.PI * (0.5 + Math.floor(r() * 3) * 0.5) });
        } else {
            const c = GRID[Math.floor(r() * GRID.length)];
            strokes.push({ type: 'dot', x: c[0], y: c[1] });
        }
    }
    return strokes;
};

const buildOrigin = (index) => {
    // Pyramid (triangle) with a varying crown: sun disc, bar, chevron, ring...
    const strokes = [{ type: 'line', pts: [[-0.85, 0.75], [0, -0.55], [0.85, 0.75], [-0.85, 0.75]] }];
    const crown = index % 4;
    if(crown === 0) strokes.push({ type: 'arc', x: 0, y: -0.82, r: 0.18, a1: 0, a2: Math.PI * 2 });
    if(crown === 1) strokes.push({ type: 'line', pts: [[-0.4, -0.85], [0.4, -0.85]] });
    if(crown === 2) strokes.push({ type: 'line', pts: [[-0.35, -0.65], [0, -0.95], [0.35, -0.65]] });
    if(crown === 3) strokes.push({ type: 'dot', x: 0, y: -0.85 });
    if(index >= 4) strokes.push({ type: 'line', pts: [[0, 0.75], [0, 0.15]] });
    return strokes;
};

// Draw glyph `id` (a constellation index, or 'origin:<n>') centred at (x, y).
export const drawGlyph = (ctx, id, x, y, size, color, lineWidth) => {
    if(!cache[id]) cache[id] = typeof id === 'string' ? buildOrigin(parseInt(id.split(':')[1], 10)) : buildGlyph(id);
    const strokes = cache[id];
    const s = size / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth || Math.max(1, size * 0.09);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach(stroke => {
        ctx.beginPath();
        if(stroke.type === 'line') {
            stroke.pts.forEach((p, i) => {
                if(i === 0) ctx.moveTo(p[0] * s, p[1] * s);
                else ctx.lineTo(p[0] * s, p[1] * s);
            });
            ctx.stroke();
        } else if(stroke.type === 'arc') {
            ctx.arc(stroke.x * s, stroke.y * s, stroke.r * s, stroke.a1, stroke.a2);
            ctx.stroke();
        } else {
            ctx.arc(stroke.x * s, stroke.y * s, Math.max(1, s * 0.12), 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.restore();
};
