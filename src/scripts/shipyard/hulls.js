// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines, { rect: [x1, y1, x2, y2] } or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// rcs:       where manoeuvring jets sit (nose x, tail x, half width)
// shield:    shield bubble ellipse

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);
const rect = (x1, y1, x2, y2) => ({ rect: [x1, y1, x2, y2] });
const line = (x1, y1, x2, y2) => ({ pts: [[x1, y1], [x2, y2]] });
const mirrorRect = (x1, y1, x2, y2) => [rect(x1, y1, x2, y2), rect(x1, -y1, x2, -y2)];
const mirrorLine = (x1, y1, x2, y2) => [line(x1, y1, x2, y2), line(x1, -y1, x2, -y2)];
const row = (xs, y, r) => xs.map(x => [x, y, r]);

const HULLS = {
    x302: {
        id: 'x302',
        name: 'X-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter. Few mounts, tiny cargo hold, very agile.',
        cost: 0,
        color: '225,235,255',
        mass: 1,
        hull: 60,
        baseShield: 0,
        cargo: 12,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 20,
        art: [
            { closed: true, pts: [[20, 0], [15, -3], [-14, -3], [-16, -2], [-16, 2], [-14, 3], [15, 3]] },
            { closed: true, pts: [[6, -3], [-5, -14], [-12, -14], [-10, -3]] },
            { closed: true, pts: mirror([[6, -3], [-5, -14], [-12, -14], [-10, -3]]) },
            rect(12, -1.5, 6, 1.5),
            line(-2, -3, -2, 3),
            ...mirrorRect(2, -3, -9, -5),
            ...mirrorLine(-6, -9, -11, -9)
        ],
        slots: [
            { id: 'c', x: -8, y: 0 },
            { id: 'wl', x: -7, y: -10 },
            { id: 'wr', x: -7, y: 10 }
        ],
        engines: [{ x: -16, y: -1.5, size: 0.6 }, { x: -16, y: 1.5, size: 0.6 }],
        colliders: [[10, 0, 6], [-4, 0, 7], [-8, -9, 6], [-8, 9, 6]],
        rcs: { nose: 14, tail: -13, half: 9 },
        shield: { x: -1, rx: 24, ry: 20 }
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser. Boxy hull, raised bridge and twin engine pods.',
        cost: 2500,
        color: '205,225,255',
        mass: 3,
        hull: 160,
        baseShield: 0,
        cargo: 45,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 50,
        art: [
            { closed: true, pts: [[46, -3], [40, -10], [-36, -10], [-36, 10], [40, 10], [46, 3]] },
            ...mirrorRect(-12, -14, -46, -21),
            ...mirrorRect(-18, -10, -24, -14),
            ...mirrorRect(-34, -10, -40, -14),
            ...mirrorRect(-46, -15.5, -49, -19.5),
            rect(-36, -5, -41, 5),
            rect(12, -5, -6, 5),
            rect(8, -2.5, -2, 2.5),
            line(34, -10, 34, 10), line(20, -10, 20, 10), line(-20, -10, -20, 10),
            ...mirrorLine(40, -6, 22, -6),
            ...mirrorLine(-14, -17.5, -44, -17.5)
        ],
        slots: [
            { id: 'bow', x: 28, y: 0 },
            { id: 'bridge', x: 3, y: 0 },
            { id: 'ml', x: -14, y: -5 },
            { id: 'mr', x: -14, y: 5 },
            { id: 'nl', x: -29, y: -17.5 },
            { id: 'nr', x: -29, y: 17.5 }
        ],
        engines: [{ x: -49, y: -17.5, size: 1 }, { x: -49, y: 17.5, size: 1 }, { x: -41, y: 0, size: 0.8 }],
        colliders: row([40, 26, 12, -2, -16, -30], 0, 10)
            .concat(row([-18, -30, -42], -17.5, 5), row([-18, -30, -42], 17.5, 5)),
        rcs: { nose: 42, tail: -42, half: 22 },
        shield: { x: -1, rx: 58, ry: 34 }
    },

    x304: {
        id: 'x304',
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space carrier: twin hangar bays (big cargo hold) and Asgard shielding.',
        cost: 6000,
        color: '210,230,255',
        mass: 5,
        hull: 260,
        baseShield: 30,
        cargo: 90,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 64,
        art: [
            { closed: true, pts: [[50, -3], [46, -9], [-50, -9], [-50, 9], [46, 9], [50, 3]] },
            { closed: true, pts: [[60, -13], [64, -17], [64, -21], [60, -25], [-32, -25], [-32, -13]] },
            { closed: true, pts: mirror([[60, -13], [64, -17], [64, -21], [60, -25], [-32, -25], [-32, -13]]) },
            { pts: [[58, -15], [44, -15], [44, -23], [58, -23]] },
            { pts: mirror([[58, -15], [44, -15], [44, -23], [58, -23]]) },
            ...mirrorLine(24, -13, 24, -25), ...mirrorLine(4, -13, 4, -25), ...mirrorLine(-16, -13, -16, -25),
            ...mirrorRect(28, -9, 20, -13),
            ...mirrorRect(-10, -9, -18, -13),
            rect(-18, -5, -34, 5),
            line(-21, -3, -21, 3),
            line(38, -9, 38, 9), line(14, -9, 14, 9), line(-6, -9, -6, 9),
            rect(-50, -6, -55, -1), rect(-50, 1, -55, 6),
            ...mirrorRect(-32, -16, -36, -22)
        ],
        slots: [
            { id: 'bl1', x: 34, y: -19 },
            { id: 'br1', x: 34, y: 19 },
            { id: 'bl2', x: -6, y: -19 },
            { id: 'br2', x: -6, y: 19 },
            { id: 'nose', x: 28, y: 0 },
            { id: 'mid', x: 4, y: 0 },
            { id: 'bridge', x: -26, y: 0 },
            { id: 'aft', x: -43, y: 0 }
        ],
        engines: [{ x: -55, y: -3.5, size: 1.1 }, { x: -55, y: 3.5, size: 1.1 }, { x: -36, y: -19, size: 0.9 }, { x: -36, y: 19, size: 0.9 }],
        colliders: row([42, 28, 14, 0, -14, -28, -42], 0, 9)
            .concat(row([56, 40, 24, 8, -8, -24], -19, 7), row([56, 40, 24, 8, -8, -24], 19, 7)),
        rcs: { nose: 56, tail: -52, half: 26 },
        shield: { x: 2, rx: 72, ry: 40 }
    },

    hatak: {
        id: 'hatak',
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Massive pyramid warship. Huge hold, tough and shielded, slow to turn.',
        cost: 5000,
        color: '255,205,110',
        mass: 7,
        hull: 380,
        baseShield: 50,
        cargo: 140,
        thrust: 900,
        torque: 2.2,
        maxTurn: 1.6,
        moduleScale: 1.1,
        radius: 60,
        art: [
            { closed: true, pts: [[46, -18], [18, -46], [-18, -46], [-46, -18], [-46, 18], [-18, 46], [18, 46], [46, 18]] },
            { closed: true, pts: [[46, -10], [58, -6], [58, 6], [46, 10]] },
            rect(28, -28, -28, 28),
            rect(16, -16, -16, 16),
            line(16, -16, -16, 16), line(-16, -16, 16, 16),
            line(28, 0, 46, 0), line(0, -28, 0, -46), line(-28, 0, -46, 0), line(0, 28, 0, 46),
            line(28, -28, 32, -32), line(-28, -28, -32, -32), line(-28, 28, -32, 32), line(28, 28, 32, 32),
            ...mirrorRect(-46, -12, -51, -4),
            ...mirrorRect(36, -40, 26, -32)
        ],
        slots: [
            { id: 'top', x: 0, y: 0 },
            { id: 'fl', x: 37, y: -11 },
            { id: 'fr', x: 37, y: 11 },
            { id: 'pl', x: 12, y: -37 },
            { id: 'pr', x: 12, y: 37 },
            { id: 'al', x: -22, y: -36 },
            { id: 'ar', x: -22, y: 36 },
            { id: 'sl', x: -37, y: -11 },
            { id: 'sr', x: -37, y: 11 }
        ],
        engines: [{ x: -51, y: -8, size: 1.3 }, { x: -51, y: 8, size: 1.3 }],
        colliders: [[0, 0, 30], [36, 0, 13], [26, -26, 13], [0, -36, 13], [-26, -26, 13], [-36, 0, 13],
            [-26, 26, 13], [0, 36, 13], [26, 26, 13], [54, 0, 6]],
        rcs: { nose: 50, tail: -48, half: 44 },
        shield: { x: 2, rx: 64, ry: 58 }
    },

    asgard: {
        id: 'asgard',
        name: 'Asgard',
        className: "O'Neill-class",
        faction: 'Asgard',
        description: 'Pinnacle of Asgard engineering. Fast, strong shields, many mounts.',
        cost: 12000,
        color: '170,240,255',
        mass: 5,
        hull: 300,
        baseShield: 100,
        cargo: 80,
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 80,
        art: [
            { closed: true, pts: [[80, 0], [66, -10], [60, -30], [40, -30], [34, -8], [-24, -8], [-44, -36], [-66, -36],
                [-60, -8], [-74, -8], [-74, 8], [-60, 8], [-66, 36], [-44, 36], [-24, 8], [34, 8],
                [40, 30], [60, 30], [66, 10]] },
            rect(66, -4, 46, 4),
            ...mirrorLine(40, -30, 44, -8),
            ...mirrorLine(60, -30, 56, -10),
            line(20, -8, 20, 8), line(-12, -8, -12, 8),
            rect(10, -5, -8, 5),
            { circle: [1, 0, 2.5] },
            ...mirrorLine(-30, -8, -48, -32),
            ...mirrorLine(-60, -8, -62, -30),
            ...mirrorRect(-74, -6, -78, -1)
        ],
        slots: [
            { id: 'nose', x: 56, y: 0 },
            { id: 'hl', x: 50, y: -20 },
            { id: 'hr', x: 50, y: 20 },
            { id: 'fwd', x: 27, y: 0 },
            { id: 'core', x: 1, y: 0 },
            { id: 'aft', x: -24, y: 0 },
            { id: 'fl', x: -52, y: -24 },
            { id: 'fr', x: -52, y: 24 },
            { id: 'tail', x: -66, y: 0 }
        ],
        engines: [{ x: -78, y: -3.5, size: 1.2 }, { x: -78, y: 3.5, size: 1.2 }, { x: -64, y: -33, size: 0.8 }, { x: -64, y: 33, size: 0.8 }],
        colliders: row([70, 56, 42, 28, 14, 0, -14, -28, -42, -56, -70], 0, 9)
            .concat([[50, -20, 10], [50, 20, 10], [-52, -24, 10], [-52, 24, 10]]),
        rcs: { nose: 72, tail: -72, half: 32 },
        shield: { x: 2, rx: 90, ry: 46 }
    }
};

export const HULL_ORDER = ['x302', 'x303', 'x304', 'hatak', 'asgard'];

const partPoints = (part) => {
    if(part.rect) {
        const r = part.rect;
        return [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
    }
    return part.pts;
};

export const hullBounds = (hull) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    hull.art.forEach(part => {
        const pts = part.circle
            ? [[part.circle[0] - part.circle[2], part.circle[1] - part.circle[2]], [part.circle[0] + part.circle[2], part.circle[1] + part.circle[2]]]
            : partPoints(part);
        pts.forEach(p => {
            minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};

// Draws the hull's line art in local ship coordinates (caller sets the transform).
export const drawHullArt = (ctx, hull, options) => {
    const opts = options || {};
    const color = opts.color || hull.color;
    const alpha = opts.alpha === undefined ? 1 : opts.alpha;

    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.lineWidth = opts.lineWidth || 1.1;
    ctx.strokeStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.shadowBlur = opts.glow === undefined ? 5 : opts.glow;
    ctx.shadowColor = 'rgba(' + color + ',' + (0.7 * alpha) + ')';

    hull.art.forEach(part => {
        ctx.beginPath();
        if(part.circle) {
            ctx.arc(part.circle[0], part.circle[1], part.circle[2], 0, Math.PI * 2);
        } else {
            const pts = partPoints(part);
            ctx.moveTo(pts[0][0], pts[0][1]);
            for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            if(part.closed || part.rect) ctx.closePath();
        }
        // Closed sections are filled dark so the line art reads against space.
        if(part.closed || part.rect) {
            ctx.fillStyle = 'rgba(8, 13, 24, ' + (0.85 * alpha) + ')';
            ctx.fill();
        }
        ctx.stroke();
    });

    ctx.restore();
};

export default HULLS;
