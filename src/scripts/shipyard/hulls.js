// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines, { rect: [x1, y1, x2, y2] } or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// jets:      manoeuvring jet positions on the hull edges (mirrored to both sides)
// shield:    shield bubble ellipse

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);
const rect = (x1, y1, x2, y2) => ({ rect: [x1, y1, x2, y2] });
const line = (x1, y1, x2, y2) => ({ pts: [[x1, y1], [x2, y2]] });
const mirrorRect = (x1, y1, x2, y2) => [rect(x1, y1, x2, y2), rect(x1, -y1, x2, -y2)];
const mirrorLine = (x1, y1, x2, y2) => [line(x1, y1, x2, y2), line(x1, -y1, x2, -y2)];
const row = (xs, y, r) => xs.map(x => [x, y, r]);
// Closed outline from its top half (bow to stern, negative y), mirrored onto the bottom half.
const symmetric = (half) => half.concat(half.slice().reverse().filter(p => p[1] !== 0).map(p => [p[0], -p[1]]));
const grid = (x0, y0, cols, rows, w, h, gap) => {
    const parts = [];
    for(let c = 0; c < cols; c++) {
        for(let r = 0; r < rows; r++) {
            const x = x0 + c * (w + gap);
            const y = y0 + r * (h + gap);
            parts.push(rect(x, y, x + w, y + h));
        }
    }
    return parts;
};

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
        jets: { retro: [[12, 2.6]], side: [[-8, 14]], bow: [15, 2.5], stern: [-14, 3] },
        jetScale: 0.9,
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
        jets: { retro: [[40, 9]], side: [[26, 10], [-30, 21]], bow: [42, 6], stern: [-44, 21] },
        jetScale: 1.3,
        shield: { x: -1, rx: 58, ry: 34 }
    },

    x304: {
        id: 'x304',
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space battlecruiser: long forward hull, wide engineering section and twin hangar pods.',
        cost: 6000,
        color: '210,230,255',
        exhaust: '255,160,80',
        mass: 5,
        hull: 260,
        baseShield: 30,
        cargo: 90,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 70,
        art: [
            // Hangar pods either side of the engineering section.
            { closed: true, pts: [[-8, -22], [-8, -33], [-13, -38], [-62, -38], [-64, -36], [-64, -22]] },
            { closed: true, pts: mirror([[-8, -22], [-8, -33], [-13, -38], [-62, -38], [-64, -36], [-64, -22]]) },
            ...mirrorRect(-14, -25, -58, -35),
            ...mirrorLine(-27, -25, -27, -35), ...mirrorLine(-42, -25, -42, -35),
            // Engineering section.
            { closed: true, pts: symmetric([[-8, -16], [-14, -22], [-58, -22], [-64, -16]]) },
            rect(-14, -16, -58, 16),
            line(-14, -8, -58, -8), line(-14, 8, -58, 8),
            ...mirrorRect(-20, -13, -28, -10), ...mirrorRect(-44, -13, -52, -10),
            rect(-30, -4, -42, 4),
            // Forward hull, neck and nose.
            { closed: true, pts: symmetric([[66, -6], [64, -8], [42, -8], [37, -12], [8, -12], [6, -9.5], [-9, -9.5]]) },
            { closed: true, pts: symmetric([[60, -4], [42, -5], [38, -9], [12, -9]]) },
            ...grid(14, -7, 5, 2, 3.4, 5, 1.2),
            // Bridge superstructure on the neck.
            { closed: true, pts: symmetric([[6, -5], [-6, -6]]) },
            line(3, -3.5, 3, 3.5),
            line(66, 4, 80, 4),
            // Engine nozzles: three centre, three per pod.
            rect(-64, -13, -67, -7), rect(-64, -3, -67, 3), rect(-64, 7, -67, 13),
            ...mirrorRect(-64, -27, -66.5, -23), ...mirrorRect(-64, -32, -66.5, -28), ...mirrorRect(-64, -37, -66.5, -33)
        ],
        slots: [
            { id: 'nose', x: 52, y: 0 },
            { id: 'mid', x: 25, y: 0 },
            { id: 'bridge', x: 0, y: 0 },
            { id: 'aft', x: -36, y: 0 },
            { id: 'cl', x: -50, y: -14 },
            { id: 'cr', x: -50, y: 14 },
            { id: 'bl1', x: -20, y: -30 },
            { id: 'br1', x: -20, y: 30 },
            { id: 'bl2', x: -48, y: -30 },
            { id: 'br2', x: -48, y: 30 }
        ],
        engines: [{ x: -67, y: -10, size: 0.9 }, { x: -67, y: 0, size: 0.9 }, { x: -67, y: 10, size: 0.9 },
            { x: -66.5, y: -25, size: 0.6 }, { x: -66.5, y: -30, size: 0.6 }, { x: -66.5, y: -35, size: 0.6 },
            { x: -66.5, y: 25, size: 0.6 }, { x: -66.5, y: 30, size: 0.6 }, { x: -66.5, y: 35, size: 0.6 }],
        colliders: [[58, 0, 7], [46, 0, 8], [32, 0, 11], [18, 0, 11], [4, 0, 9]]
            .concat(row([-16, -30, -44, -57], -11, 11), row([-16, -30, -44, -57], 11, 11))
            .concat(row([-14, -28, -42, -56], -30, 8), row([-14, -28, -42, -56], 30, 8)),
        jets: { retro: [[40, 11], [-8, 30]], side: [[22, 12], [-36, 38]], bow: [56, 7], stern: [-60, 38] },
        jetScale: 1.5,
        shield: { x: -2, rx: 78, ry: 50 }
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
        jets: { retro: [[46, 12]], side: [[-2, 46]], bow: [34, 30], stern: [-34, 30] },
        jetScale: 1.8,
        exhaust: '255,190,90',
        shieldColor: '255,200,120',
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
        jets: { retro: [[60, 28]], side: [[30, 8], [-56, 34]], bow: [64, 18], stern: [-66, 34] },
        jetScale: 1.5,
        exhaust: '140,220,255',
        shieldColor: '150,230,255',
        shield: { x: 2, rx: 90, ry: 46 }
    },
    aurora: {
        id: 'aurora',
        name: 'Aurora',
        className: 'Ancient warship',
        faction: 'Ancient',
        description: 'Lantean battleship. Fastest drive, powerful shields and ten mounts. Built for drone weapons.',
        cost: 25000,
        color: '240,220,160',
        exhaust: '130,200,255',
        shieldColor: '255,230,160',
        mass: 6,
        hull: 420,
        baseShield: 160,
        cargo: 110,
        thrust: 1900,
        torque: 3.4,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 90,
        art: [
            { closed: true, pts: symmetric([[88, 0], [72, -9], [44, -14], [26, -30], [-6, -30], [-16, -12],
                [-56, -12], [-74, -26], [-86, -26], [-80, -9], [-88, -6], [-88, 0]]) },
            { closed: true, pts: symmetric([[40, -11], [24, -25], [-4, -25], [-10, -11]]) },
            line(80, 0, 40, 0), line(-10, 0, -84, 0),
            ...mirrorLine(72, -9, 44, -9),
            ...mirrorLine(-56, -12, -76, -23),
            ...mirrorRect(10, -21, -2, -14),
            ...mirrorLine(-20, -12, -20, -6), ...mirrorLine(-36, -12, -36, -6),
            { circle: [16, 0, 6] },
            { circle: [16, 0, 2.5] },
            rect(-88, -6, -91, -2), rect(-88, 2, -91, 6),
            ...mirrorRect(-86, -25, -89, -19)
        ],
        slots: [
            { id: 'nose', x: 64, y: 0 },
            { id: 'fwd', x: 40, y: 0 },
            { id: 'pl', x: 14, y: -18 },
            { id: 'pr', x: 14, y: 18 },
            { id: 'core', x: 0, y: 0 },
            { id: 'mid', x: -28, y: 0 },
            { id: 'aft', x: -50, y: 0 },
            { id: 'fl', x: -74, y: -19 },
            { id: 'fr', x: -74, y: 19 },
            { id: 'tail', x: -76, y: 0 }
        ],
        engines: [{ x: -91, y: -4, size: 1.1 }, { x: -91, y: 4, size: 1.1 }, { x: -89, y: -22, size: 0.8 }, { x: -89, y: 22, size: 0.8 }],
        colliders: row([80, 66, 52, 38, 24, 10, -4, -18, -32, -46, -60, -74, -86], 0, 8)
            .concat([[14, -20, 10], [14, 20, 10], [32, -12, 8], [32, 12, 8], [-76, -20, 7], [-76, 20, 7]]),
        jets: { retro: [[44, 14], [-6, 30]], side: [[10, 30], [-80, 26]], bow: [70, 9], stern: [-84, 24] },
        jetScale: 1.6,
        shield: { x: 0, rx: 98, ry: 42 }
    }
};

export const HULL_ORDER = ['x302', 'x303', 'x304', 'hatak', 'asgard', 'aurora'];

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
