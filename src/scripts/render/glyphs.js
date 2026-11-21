// Stargate symbols, traced after the Milky Way glyph chart (glyphs 1-39). Each glyph is a
// few polylines in a -1..1 box (y down); they're drawn as thick strokes, optionally with a
// darker outline like the chart's embossed symbols.
//
// Glyph 1 (the pyramid with the sun above it) is Earth's point of origin; other gates get
// variants of the same motif.
//
// The same shapes double as the constellations' star figures on the starmap: in the show
// the glyphs are stylised constellations, so each polyline vertex becomes a star.

import { CONSTELLATIONS } from '../world/systems';

// Shapes by constellation name, in chart order (glyph number in the comment).
const SHAPES = {
    'Crater':            [[[-0.6, -0.8], [-0.3, -0.45], [-0.3, 0.1], [0.3, 0.1], [0.3, -0.45], [0.6, -0.8]], [[0, 0.1], [0, 0.5]], [[-0.45, 0.82], [0, 0.5], [0.45, 0.82]]],        // 2
    'Virgo':             [[[-0.45, -0.3], [-0.45, -0.8], [0.3, -0.8], [0.0, -0.2], [0.45, 0.1], [-0.1, 0.45], [0.15, 0.85]]],                                                   // 3
    'Bootes':            [[[0.6, -0.8], [0.25, -0.8], [-0.15, -0.45], [0.3, -0.05], [-0.25, 0.35], [0.1, 0.85]]],                                                                // 4
    'Centaurus':         [[[-0.65, -0.6], [-0.1, -0.1]], [[0.65, -0.65], [0.15, -0.15], [0.2, 0.25]], [[-0.55, 0.35], [-0.05, 0.25], [-0.25, 0.8]]],                            // 5
    'Libra':             [[[-0.65, -0.65], [0.5, -0.65], [0.55, 0.15], [0.0, 0.45], [-0.25, 0.85]], [[-0.65, -0.65], [-0.5, -0.25]]],                                           // 6
    'Serpens Caput':     [[[0.35, -0.85], [-0.2, -0.6], [-0.35, 0.35], [0.05, 0.65], [0.5, 0.45]], [[0.35, -0.85], [0.45, -0.55]]],                                             // 7
    'Norma':             [[[-0.65, -0.5], [0.15, -0.55], [-0.3, 0.15], [-0.65, -0.5]], [[0.25, 0.15], [0.65, 0.55]]],                                                           // 8
    'Scorpius':          [[[-0.75, 0.55], [0.35, 0.55], [0.7, 0.2], [0.55, -0.3]], [[-0.4, 0.55], [0.1, -0.15], [0.45, -0.6]]],                                                 // 9
    'Corona Australis':  [[[0.55, -0.7], [-0.4, -0.7], [-0.65, 0.0], [-0.25, 0.65], [0.55, 0.6]], [[0.1, -0.25], [0.5, 0.15]]],                                                 // 10
    'Scutum':            [[[-0.75, 0.6], [0.6, -0.6], [0.6, 0.55], [-0.2, 0.15]], [[0.6, -0.6], [0.8, -0.8]]],                                                                  // 11
    'Sagittarius':       [[[-0.75, -0.35], [-0.25, -0.75], [0.15, -0.25], [0.7, -0.55]], [[0.15, -0.25], [-0.05, 0.4], [0.55, 0.75]], [[-0.5, 0.15], [-0.05, 0.4]], [[0.35, 0.1], [0.65, 0.2]]], // 12
    'Aquila':            [[[-0.75, -0.5], [-0.15, 0.65], [0.2, -0.2], [0.75, -0.6]], [[0.2, -0.2], [0.55, 0.15]]],                                                              // 13
    'Microscopium':      [[[-0.3, -0.75], [-0.6, 0.5], [0.75, 0.25]], [[-0.45, -0.1], [0.3, -0.45]]],                                                                           // 14
    'Capricornus':       [[[-0.75, 0.6], [0.55, -0.6], [0.5, 0.6], [-0.75, 0.6]], [[0.55, -0.6], [0.8, -0.85]]],                                                                // 15
    'Piscis Austrinus':  [[[0.3, -0.85], [-0.3, -0.5], [-0.35, 0.45], [0.25, 0.85]], [[-0.3, -0.5], [0.05, -0.35]]],                                                            // 16
    'Equuleus':          [[[-0.75, -0.3], [0.3, -0.35], [0.55, 0.0], [0.3, 0.45]], [[-0.2, -0.32], [-0.45, 0.35]]],                                                             // 17
    'Aquarius':          [[[-0.65, 0.55], [-0.5, -0.4], [0.45, -0.5], [0.65, 0.3]], [[-0.05, -0.45], [0.1, 0.15]]],                                                             // 18
    'Pegasus':           [[[0.5, -0.85], [0.0, -0.2], [0.35, 0.1], [-0.4, 0.85]], [[0.0, -0.2], [-0.35, -0.45]]],                                                               // 19
    'Sculptor':          [[[-0.5, -0.65], [0.05, -0.65], [-0.2, 0.0], [0.55, 0.65]], [[0.55, 0.65], [0.35, 0.2]]],                                                              // 20
    'Pisces':            [[[-0.5, -0.75], [0.0, 0.1], [0.5, -0.45]], [[0.0, 0.1], [-0.2, 0.85]]],                                                                               // 21
    'Andromeda':         [[[0.0, -0.85], [0.2, -0.35], [-0.12, 0.0], [0.12, 0.4], [0.0, 0.85]]],                                                                                // 22
    'Triangulum':        [[[-0.75, -0.4], [0.75, -0.4], [-0.1, 0.4], [-0.75, -0.4]]],                                                                                           // 23
    'Aries':             [[[0.5, -0.75], [0.1, -0.2], [-0.45, 0.75]]],                                                                                                          // 24
    'Perseus':           [[[0.3, -0.85], [-0.2, -0.45], [-0.2, 0.2], [0.2, 0.6], [0.0, 0.85]]],                                                                                 // 25
    'Cetus':             [[[-0.65, -0.4], [0.5, -0.4], [0.65, 0.1], [0.0, 0.45]], [[-0.65, -0.4], [-0.3, 0.35]]],                                                               // 26
    'Taurus':            [[[-0.85, 0.05], [0.85, 0.0]], [[0.2, 0.02], [0.6, -0.4]], [[-0.45, 0.04], [-0.75, -0.3]]],                                                            // 27
    'Auriga':            [[[-0.4, -0.75], [-0.5, 0.35], [0.0, 0.7], [0.5, 0.35], [0.4, -0.75]], [[-0.15, -0.35], [0.15, -0.35]]],                                               // 28
    'Eridanus':          [[[0.45, -0.85], [0.1, -0.3], [0.45, 0.0], [-0.35, 0.85]]],                                                                                            // 29
    'Orion':             [[[-0.5, -0.75], [0.5, -0.75], [-0.5, 0.75], [0.5, 0.75], [-0.5, -0.75]]],                                                                             // 30
    'Canis Minor':       [[[-0.45, -0.75], [0.45, -0.05], [-0.45, 0.15], [0.45, 0.8]]],                                                                                         // 31
    'Monoceros':         [[[-0.6, -0.2], [-0.6, -0.6], [0.2, -0.6], [0.2, 0.2], [0.65, 0.75]], [[0.2, -0.15], [-0.25, 0.25]]],                                                  // 32
    'Gemini':            [[[-0.3, -0.85], [0.3, -0.85], [0.3, 0.85], [-0.3, 0.85], [-0.3, -0.85]], [[-0.3, 0.0], [0.3, 0.0]]],                                                  // 33
    'Hydra':             [[[-0.2, -0.85], [0.2, -0.5], [-0.2, -0.1], [0.2, 0.3], [-0.1, 0.85]]],                                                                                // 34
    'Lynx':              [[[-0.5, -0.75], [0.2, -0.2], [0.5, 0.75]]],                                                                                                           // 35
    'Cancer':            [[[-0.65, -0.65], [0.05, 0.2]], [[0.45, 0.6]]],                                                                                                        // 36
    'Sextans':           [[[-0.7, -0.55], [-0.3, -0.4]], [[-0.05, 0.0], [0.35, 0.2]], [[0.65, 0.6]]],                                                                           // 37
    'Leo Minor':         [[[-0.6, -0.75], [0.1, 0.1], [0.5, 0.75]], [[0.1, 0.1], [0.45, -0.15]]],                                                                               // 38
    'Leo':               [[[0.3, -0.85], [0.55, -0.5], [0.0, 0.2], [0.1, 0.85]], [[0.0, 0.2], [-0.45, -0.05]]]                                                                  // 39
};

// Chart order (glyphs 2-39), used to lay out the DHD keys.
export const GLYPH_ORDER = Object.keys(SHAPES).map(name => CONSTELLATIONS.indexOf(name));

// Glyph 1: the pyramid with the sun above it. Other gates' points of origin vary the crown.
const origin = (index) => {
    const shape = [
        [[-0.75, 0.8], [-0.1, -0.35]],
        [[0.75, 0.8], [0.1, -0.35]],
        [[-0.3, 0.8], [0.0, 0.35], [0.3, 0.8]]
    ];
    const variant = index % 4;
    if(variant === 1) shape.push([[-0.45, -0.75], [0.45, -0.75]]);
    if(variant === 2) shape.push([[-0.4, -0.5], [0, -0.85], [0.4, -0.5]]);
    if(variant === 3) shape.push([[-0.75, 0.8], [0.75, 0.8]]);
    return { lines: shape, sun: variant === 0 || variant === 3 ? [0, -0.62, 0.2] : null };
};

const cache = {};
const shapeOf = (id) => {
    if(cache[id]) return cache[id];
    let shape;
    if(typeof id === 'string') shape = origin(parseInt(id.split(':')[1], 10) || 0);
    else shape = { lines: SHAPES[CONSTELLATIONS[id]] || [[[0, -0.8], [0, 0.8]]], sun: null };
    cache[id] = shape;
    return shape;
};

const tracePath = (ctx, shape, s) => {
    ctx.beginPath();
    shape.lines.forEach(line => {
        if(line.length === 1) {
            // A lone dot.
            ctx.moveTo(line[0][0] * s + 0.01, line[0][1] * s);
            ctx.lineTo(line[0][0] * s, line[0][1] * s);
            return;
        }
        line.forEach((p, i) => {
            if(i === 0) ctx.moveTo(p[0] * s, p[1] * s);
            else ctx.lineTo(p[0] * s, p[1] * s);
        });
    });
    if(shape.sun) {
        ctx.moveTo(shape.sun[0] * s + shape.sun[2] * s, shape.sun[1] * s);
        ctx.arc(shape.sun[0] * s, shape.sun[1] * s, shape.sun[2] * s, 0, Math.PI * 2);
    }
};

// Draw glyph `id` (a constellation index, or 'origin:<n>') centred at (x, y). With an
// `outline` colour the stroke gets a darker rim, like the glyph chart.
export const drawGlyph = (ctx, id, x, y, size, color, lineWidth, outline) => {
    const shape = shapeOf(id);
    const s = size / 2;
    const width = lineWidth || Math.max(1, size * 0.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tracePath(ctx, shape, s * 0.92);
    if(outline) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = width * 1.9;
        ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
};

// The constellation as a star figure: stars at the glyph's vertices joined by faint lines.
export const drawConstellation = (ctx, id, x, y, size, color, starColor) => {
    const shape = shapeOf(id);
    const s = size / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    shape.lines.forEach(line => line.forEach((p, i) => {
        if(i === 0) ctx.moveTo(p[0] * s, p[1] * s);
        else ctx.lineTo(p[0] * s, p[1] * s);
    }));
    ctx.stroke();
    ctx.fillStyle = starColor || color;
    shape.lines.forEach(line => line.forEach((p, i) => {
        // Line ends are the brighter stars.
        const r = (i === 0 || i === line.length - 1) ? 1.9 : 1.4;
        ctx.beginPath();
        ctx.arc(p[0] * s, p[1] * s, r, 0, Math.PI * 2);
        ctx.fill();
    }));
    ctx.restore();
};
