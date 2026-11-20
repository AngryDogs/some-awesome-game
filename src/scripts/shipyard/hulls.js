// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// rcs:       where manoeuvring jets sit (nose x, tail x, half width)
// shield:    shield bubble ellipse

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);

const HULLS = {
    x302: {
        id: 'x302',
        name: 'X-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter. Few mounts, very agile.',
        cost: 0,
        color: '225,235,255',
        mass: 1,
        hull: 60,
        baseShield: 0,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 18,
        art: [
            { closed: true, pts: [[18, 0], [8, -3], [-2, -4], [-6, -14], [-12, -15], [-11, -5], [-15, -4],
                [-15, 4], [-11, 5], [-12, 15], [-6, 14], [-2, 4], [8, 3]] },
            { closed: true, pts: [[11, 0], [6, -2], [2, -2], [2, 2], [6, 2]] },
            { pts: [[-4, -8], [-10, -9]] },
            { pts: [[-4, 8], [-10, 9]] }
        ],
        slots: [
            { id: 'c', x: -5, y: 0 },
            { id: 'wl', x: -7, y: -10 },
            { id: 'wr', x: -7, y: 10 }
        ],
        engines: [{ x: -15, y: 0, size: 0.8 }],
        colliders: [[4, 0, 8], [-8, -9, 6], [-8, 9, 6]],
        rcs: { nose: 12, tail: -12, half: 8 },
        shield: { x: -1, rx: 22, ry: 20 }
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser. Balanced, with twin engine nacelles.',
        cost: 2500,
        color: '205,225,255',
        mass: 3,
        hull: 160,
        baseShield: 0,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 46,
        art: [
            { closed: true, pts: [[45, 0], [34, -7], [-28, -11], [-38, -8], [-38, 8], [-28, 11], [34, 7]] },
            { closed: true, pts: [[-6, -15], [-40, -15], [-44, -19], [-40, -23], [-10, -23]] },
            { closed: true, pts: mirror([[-6, -15], [-40, -15], [-44, -19], [-40, -23], [-10, -23]]) },
            { pts: [[-14, -10], [-14, -15]] }, { pts: [[-30, -11], [-30, -15]] },
            { pts: [[-14, 10], [-14, 15]] }, { pts: [[-30, 11], [-30, 15]] },
            { closed: true, pts: [[14, 0], [8, -4], [-4, -4], [-4, 4], [8, 4]] },
            { pts: [[32, 0], [18, 0]] },
            { pts: [[-8, 0], [-34, 0]] }
        ],
        slots: [
            { id: 'bow', x: 26, y: 0 },
            { id: 'bridge', x: 4, y: 0 },
            { id: 'ml', x: -18, y: -6 },
            { id: 'mr', x: -18, y: 6 },
            { id: 'nl', x: -26, y: -19 },
            { id: 'nr', x: -26, y: 19 }
        ],
        engines: [{ x: -44, y: -19, size: 1 }, { x: -44, y: 19, size: 1 }, { x: -38, y: 0, size: 0.8 }],
        colliders: [[34, 0, 7], [18, 0, 9], [0, 0, 10], [-20, 0, 11], [-26, -19, 6], [-26, 19, 6], [-38, -19, 5], [-38, 19, 5]],
        rcs: { nose: 40, tail: -40, half: 22 },
        shield: { x: -1, rx: 56, ry: 34 }
    },

    x304: {
        id: 'x304',
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space carrier with twin hangar bays and Asgard shielding.',
        cost: 6000,
        color: '210,230,255',
        mass: 5,
        hull: 260,
        baseShield: 30,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 62,
        art: [
            { closed: true, pts: [[44, 0], [34, -8], [-42, -9], [-58, -6], [-58, 6], [-42, 9], [34, 8]] },
            { closed: true, pts: [[62, -12], [58, -25], [-26, -25], [-34, -18], [-26, -12]] },
            { closed: true, pts: mirror([[62, -12], [58, -25], [-26, -25], [-34, -18], [-26, -12]]) },
            { pts: [[56, -18.5], [-24, -18.5]] },
            { pts: [[56, 18.5], [-24, 18.5]] },
            { pts: [[22, -8.5], [22, -12]] }, { pts: [[-20, -9], [-20, -12]] },
            { pts: [[22, 8.5], [22, 12]] }, { pts: [[-20, 9], [-20, 12]] },
            { closed: true, pts: [[2, 0], [-4, -5], [-20, -5], [-24, 0], [-20, 5], [-4, 5]] },
            { pts: [[-58, -3], [-62, -3]] }, { pts: [[-58, 3], [-62, 3]] }
        ],
        slots: [
            { id: 'bl1', x: 46, y: -18.5 },
            { id: 'br1', x: 46, y: 18.5 },
            { id: 'bl2', x: -8, y: -18.5 },
            { id: 'br2', x: -8, y: 18.5 },
            { id: 'nose', x: 32, y: 0 },
            { id: 'mid', x: 14, y: 0 },
            { id: 'bridge', x: -12, y: 0 },
            { id: 'aft', x: -46, y: 0 }
        ],
        engines: [{ x: -62, y: -3, size: 1.1 }, { x: -62, y: 3, size: 1.1 }, { x: -34, y: -18, size: 0.9 }, { x: -34, y: 18, size: 0.9 }],
        colliders: [[32, 0, 8], [8, 0, 9], [-18, 0, 9], [-44, 0, 8],
            [50, -18, 7], [25, -18, 7], [0, -18, 7], [-24, -18, 7],
            [50, 18, 7], [25, 18, 7], [0, 18, 7], [-24, 18, 7]],
        rcs: { nose: 55, tail: -55, half: 26 },
        shield: { x: 0, rx: 72, ry: 40 }
    },

    hatak: {
        id: 'hatak',
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Massive pyramid warship. Slow to turn, but tough and well shielded.',
        cost: 5000,
        color: '255,205,110',
        mass: 7,
        hull: 380,
        baseShield: 50,
        thrust: 900,
        torque: 2.2,
        maxTurn: 1.6,
        moduleScale: 1.1,
        radius: 56,
        art: [
            { closed: true, pts: [[48, 0], [38, -14], [24, -32], [0, -40], [-24, -34], [-40, -22], [-46, 0],
                [-40, 22], [-24, 34], [0, 40], [24, 32], [38, 14]] },
            { closed: true, pts: [[30, 0], [24, -9], [15, -20], [0, -25], [-15, -21], [-25, -14], [-29, 0],
                [-25, 14], [-15, 21], [0, 25], [15, 20], [24, 9]] },
            { closed: true, pts: [[16, 0], [0, -16], [-16, 0], [0, 16]] },
            { pts: [[16, 0], [-16, 0]] }, { pts: [[0, -16], [0, 16]] },
            { pts: [[30, 0], [48, 0]] }, { pts: [[0, -25], [0, -40]] }, { pts: [[0, 25], [0, 40]] },
            { pts: [[-29, 0], [-46, 0]] },
            { pts: [[15, -20], [24, -32]] }, { pts: [[15, 20], [24, 32]] },
            { pts: [[-15, -21], [-24, -34]] }, { pts: [[-15, 21], [-24, 34]] },
            { pts: [[38, -14], [56, -8], [46, -3]] },
            { pts: [[38, 14], [56, 8], [46, 3]] }
        ],
        slots: [
            { id: 'top', x: 0, y: 0 },
            { id: 'fl', x: 34, y: -9 },
            { id: 'fr', x: 34, y: 9 },
            { id: 'pl', x: 10, y: -32 },
            { id: 'pr', x: 10, y: 32 },
            { id: 'al', x: -20, y: -28 },
            { id: 'ar', x: -20, y: 28 },
            { id: 'sl', x: -37, y: -10 },
            { id: 'sr', x: -37, y: 10 }
        ],
        engines: [{ x: -46, y: 0, size: 1.4 }, { x: -42, y: -15, size: 1 }, { x: -42, y: 15, size: 1 }],
        colliders: [[0, 0, 28], [36, 0, 12], [24, -24, 12], [0, -33, 10], [-26, -26, 12], [-38, 0, 10],
            [-26, 26, 12], [0, 33, 10], [24, 24, 12], [50, -8, 5], [50, 8, 5]],
        rcs: { nose: 46, tail: -44, half: 40 },
        shield: { x: 2, rx: 62, ry: 52 }
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
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 76,
        art: [
            { closed: true, pts: [[76, 0], [50, -26], [34, -28], [30, -10], [-30, -10], [-52, -34], [-64, -34],
                [-56, -10], [-74, -6], [-74, 6], [-56, 10], [-64, 34], [-52, 34], [-30, 10], [30, 10],
                [34, 28], [50, 26]] },
            { pts: [[64, 0], [-66, 0]] },
            { pts: [[50, -26], [42, -8]] }, { pts: [[50, 26], [42, 8]] },
            { pts: [[34, -28], [38, -10]] }, { pts: [[34, 28], [38, 10]] },
            { pts: [[-36, -10], [-56, -30]] }, { pts: [[-36, 10], [-56, 30]] },
            { circle: [0, 0, 8] },
            { circle: [0, 0, 4] }
        ],
        slots: [
            { id: 'nose', x: 58, y: 0 },
            { id: 'hl', x: 46, y: -17 },
            { id: 'hr', x: 46, y: 17 },
            { id: 'fwd', x: 20, y: 0 },
            { id: 'core', x: 0, y: 0 },
            { id: 'aft', x: -20, y: 0 },
            { id: 'fl', x: -48, y: -24 },
            { id: 'fr', x: -48, y: 24 },
            { id: 'tail', x: -60, y: 0 }
        ],
        engines: [{ x: -74, y: -3, size: 1.2 }, { x: -74, y: 3, size: 1.2 }, { x: -64, y: -32, size: 0.8 }, { x: -64, y: 32, size: 0.8 }],
        colliders: [[64, 0, 9], [48, 0, 10], [32, 0, 10], [16, 0, 10], [0, 0, 10], [-16, 0, 10], [-32, 0, 10],
            [-48, 0, 10], [-64, 0, 9], [46, -18, 10], [46, 18, 10], [-50, -24, 9], [-50, 24, 9]],
        rcs: { nose: 70, tail: -70, half: 30 },
        shield: { x: 0, rx: 86, ry: 44 }
    }
};

export const HULL_ORDER = ['x302', 'x303', 'x304', 'hatak', 'asgard'];

// Draws the hull's line art in local ship coordinates (caller sets the transform).
export const drawHullArt = (ctx, hull, options) => {
    const opts = options || {};
    const color = opts.color || hull.color;
    const alpha = opts.alpha === undefined ? 1 : opts.alpha;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = opts.lineWidth || 1.2;
    ctx.strokeStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.fillStyle = 'rgba(5, 10, 20, ' + (0.55 * alpha) + ')';
    ctx.shadowBlur = opts.glow === undefined ? 6 : opts.glow;
    ctx.shadowColor = 'rgba(' + color + ',' + (0.8 * alpha) + ')';

    hull.art.forEach((part, index) => {
        ctx.beginPath();
        if(part.circle) {
            ctx.arc(part.circle[0], part.circle[1], part.circle[2], 0, Math.PI * 2);
        } else {
            ctx.moveTo(part.pts[0][0], part.pts[0][1]);
            for(let i = 1; i < part.pts.length; i++) ctx.lineTo(part.pts[i][0], part.pts[i][1]);
            if(part.closed) ctx.closePath();
        }
        // Darken the main silhouette so the line art reads against the background.
        if(index === 0 && part.closed) ctx.fill();
        ctx.stroke();
    });

    ctx.restore();
};

export default HULLS;
