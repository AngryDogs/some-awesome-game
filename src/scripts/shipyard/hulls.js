// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines, { rect: [x1, y1, x2, y2] } or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// jets:      manoeuvring jet positions on the hull edges (mirrored to both sides)
// The shield bubble is computed from the line art so it always encloses the whole ship.

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


// Closed polygon approximating an ellipse.
const ellipse = (cx, cy, rx, ry, steps) => {
    const pts = [];
    const n = steps || 20;
    for(let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return { closed: true, pts: pts };
};
// Thick bent leg through `points` with half-width `w`, squared off at both ends.
const leg = (points, w) => {
    const left = [];
    const right = [];
    points.forEach((p, i) => {
        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(points.length - 1, i + 1)];
        let dx = next[0] - prev[0];
        let dy = next[1] - prev[1];
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len;
        dy /= len;
        left.push([p[0] - dy * w, p[1] + dx * w]);
        right.push([p[0] + dy * w, p[1] - dx * w]);
    });
    return { closed: true, pts: left.concat(right.reverse()) };
};
const mirrorPart = (part) => ({ closed: part.closed, pts: mirror(part.pts) });

const HULLS = {
    x302: {
        id: 'x302',
        name: 'F-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter: big swept wings, twin main engines and two nacelles. Tiny cargo hold.',
        cost: 0,
        color: '225,235,255',
        exhaust: '255,160,80',
        mass: 1,
        hull: 60,
        baseShield: 0,
        cargo: 12,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 32,
        art: [
            // Wings: straight leading edge out to a squared tip, long diagonal trailing edge.
            { closed: true, pts: [[11, -4], [14, -31.5], [5, -31.5], [-12.5, -9.5], [-12.5, -4]] },
            mirrorPart({ closed: true, pts: [[11, -4], [14, -31.5], [5, -31.5], [-12.5, -9.5], [-12.5, -4]] }),
            ...mirrorRect(13.4, -31.5, 6, -30.4),
            ...mirrorLine(9, -6, 12.4, -28), ...mirrorLine(3, -28, -8, -11),
            // Engine nacelles beside the body.
            ...mirrorRect(-2.5, -8.5, -15.5, -5.8), ...mirrorRect(-15.5, -8.2, -17.5, -6.1),
            // Fuselage, cockpit and the twin main engine block.
            { closed: true, pts: symmetric([[18, 0], [14, -2], [10, -2.6], [5.5, -2.6], [4, -4], [-8.5, -4], [-8.5, 0]]) },
            rect(-6.5, -3, -14.5, 3),
            rect(-14.5, -2.8, -16.5, -0.4), rect(-14.5, 0.4, -16.5, 2.8),
            { closed: true, pts: symmetric([[16, 0], [13, -1.5], [7, -1.5]]) },
            line(4, -4, 4, 4), line(-2, -4, -2, 4)
        ],
        slots: [
            { id: 'c', x: -1, y: 0 },
            { id: 'wl', x: 2, y: -18 },
            { id: 'wr', x: 2, y: 18 }
        ],
        engines: [{ x: -16.5, y: -1.6, size: 0.6 }, { x: -16.5, y: 1.6, size: 0.6 }, { x: -17.5, y: -7.2, size: 0.45 }, { x: -17.5, y: 7.2, size: 0.45 }],
        colliders: [[14, 0, 4], [5, 0, 5], [-6, 0, 6], [-14, 0, 4], [4, -14, 6], [4, 14, 6], [8, -24, 5], [8, 24, 5], [-4, -12, 5], [-4, 12, 5]],
        jets: { retro: [[14, 2.5]], side: [[9, 31.5]], bow: [16, 2], stern: [-17, 8.5] },
        jetScale: 0.9
    },

    jumper: {
        id: 'jumper',
        name: 'Puddle Jumper',
        className: 'Gateship',
        faction: 'Ancient',
        description: 'Lantean gateship: boxy hull, D-shaped windscreen and drive pods on both flanks. Small enough for the Stargate.',
        cost: 1800,
        color: '205,232,255',
        exhaust: '150,210,255',
        mass: 1.4,
        hull: 90,
        baseShield: 20,
        cargo: 24,
        thrust: 340,
        torque: 8,
        maxTurn: 4.2,
        moduleScale: 0.6,
        radius: 24,
        art: [
            // Drive pods along the flanks, with the hourglass drive cores at the back.
            { closed: true, pts: [[1, -7], [1, -11], [-15.5, -11], [-17.5, -10.2], [-17.5, -7.6], [-15.5, -7]] },
            mirrorPart({ closed: true, pts: [[1, -7], [1, -11], [-15.5, -11], [-17.5, -10.2], [-17.5, -7.6], [-15.5, -7]] }),
            ...mirrorLine(-9, -10.2, -14, -7.8), ...mirrorLine(-9, -7.8, -14, -10.2),
            ...mirrorLine(-3, -9, -8, -9), ...mirrorRect(-14.6, -10.4, -15.5, -7.6),
            // Main hull: blunt front with chamfered corners, rounded stern.
            { closed: true, pts: symmetric([[20, 0], [20, -6.4], [17.8, -7], [12.5, -7], [11, -7.7], [0, -7.7], [-18.5, -7], [-20, -6], [-20, 0]]) },
            // Windscreen: flat front edge, rounded behind.
            { closed: true, pts: symmetric([[13, 0], [13, -4.6], [11.5, -5.2], [8, -5.2], [6.2, -4.2], [5.5, -2.4], [5.5, 0]]) },
            // Panel lines and the rear ramp.
            ...mirrorLine(4, -6, -17, -6),
            ...mirrorLine(-1, -2.6, -18, -2.6),
            line(-1, -2.6, -1, 2.6),
            rect(-18, -4.6, -20, 4.6),
            ...mirrorLine(17, -4.5, 15, -4.5)
        ],
        slots: [
            { id: 'c', x: 2, y: 0 },
            { id: 'pl', x: -6, y: -9 },
            { id: 'pr', x: -6, y: 9 },
            { id: 'rear', x: -11, y: 0 }
        ],
        engines: [{ x: -17.5, y: -8.9, size: 0.55 }, { x: -17.5, y: 8.9, size: 0.55 }],
        colliders: [[17, 0, 7], [9, 0, 7.5], [1, 0, 7.5], [-7, 0, 7.5], [-15, 0, 7], [-4, -9, 3], [-12, -9, 3], [-4, 9, 3], [-12, 9, 3]],
        jets: { retro: [[19, 6]], side: [[4, 8]], bow: [20, 5], stern: [-18, 10] },
        jetScale: 0.9
    },

    glider: {
        id: 'glider',
        name: 'Death Glider',
        className: 'Goa\'uld fighter',
        faction: "Goa'uld",
        description: 'Jaffa attack fighter: a slender pod between great crescent wings that curve forward. Fast, fragile, almost no hold.',
        cost: 1200,
        color: '255,205,110',
        exhaust: '255,190,90',
        mass: 0.9,
        hull: 45,
        baseShield: 0,
        cargo: 8,
        thrust: 300,
        torque: 10,
        maxTurn: 5.5,
        moduleScale: 0.55,
        radius: 34,
        art: [
            // Crescent wings: tips curve forward, the convex edge faces aft.
            { closed: true, pts: [[8.7, -7.3], [9.8, -11.6], [10.9, -20.3], [11.9, -30], [12.8, -35.2], [10, -35.6], [4.3, -30.5],
                [-4.3, -23], [-10.9, -15.4], [-14.7, -8.6], [-15.4, -4], [-8, -6.8]] },
            mirrorPart({ closed: true, pts: [[8.7, -7.3], [9.8, -11.6], [10.9, -20.3], [11.9, -30], [12.8, -35.2], [10, -35.6], [4.3, -30.5],
                [-4.3, -23], [-10.9, -15.4], [-14.7, -8.6], [-15.4, -4], [-8, -6.8]] }),
            // Wing ribs.
            ...mirrorLine(11.5, -27, 3, -29.8), ...mirrorLine(10.6, -16, -7, -19.2), ...mirrorLine(9.6, -10, -12.6, -12),
            // Weapon housings inside the wings.
            { closed: true, pts: [[3.3, -23.6], [-11, -11.2], [2.7, -11.2]] },
            mirrorPart({ closed: true, pts: [[3.3, -23.6], [-11, -11.2], [2.7, -11.2]] }),
            // Central pod with the canopy.
            { closed: true, pts: symmetric([[15.5, 0], [12.5, -3], [8, -6], [0, -7.3], [-8, -7], [-13, -5], [-15.4, 0]]) },
            { closed: true, pts: symmetric([[12.8, 0], [10, -2.2], [4, -3], [-1.6, -2.6], [-1.6, 0]]) },
            line(-1.6, 0, -13, 0)
        ],
        slots: [
            { id: 'c', x: -6, y: 0 },
            { id: 'wl', x: -1, y: -16 },
            { id: 'wr', x: -1, y: 16 }
        ],
        engines: [{ x: -15.5, y: -2, size: 0.5 }, { x: -15.5, y: 2, size: 0.5 }],
        colliders: [[12, 0, 5], [4, 0, 7], [-5, 0, 7], [-12, 0, 5], [10, -30, 4], [10, 30, 4], [6, -22, 5], [6, 22, 5],
            [-2, -20, 5], [-2, 20, 5], [-9, -13, 5], [-9, 13, 5]],
        jets: { retro: [[13, 34]], side: [[0, 29]], bow: [15, 3], stern: [-15, 8] },
        jetScale: 0.9
    },

    alkesh: {
        id: 'alkesh',
        hyperdrive: 1.0,          // built-in hyperdrive speed
        name: "Al'kesh",
        className: 'Goa\'uld bomber',
        faction: "Goa'uld",
        description: 'Mid-range bomber: arrowhead hull with a raised dorsal wedge and four engines aft. Sturdy, with a slow hyperdrive.',
        cost: 3500,
        color: '255,205,110',
        exhaust: '170,210,255',
        mass: 3.2,
        hull: 190,
        baseShield: 30,
        cargo: 70,
        thrust: 640,
        torque: 4.2,
        maxTurn: 2.6,
        moduleScale: 0.85,
        radius: 40,
        art: [
            // Arrowhead hull with a broad, rounded stern.
            { closed: true, pts: symmetric([[34, 0], [24, -6], [10, -14], [-6, -21], [-17, -25], [-23, -24.5], [-27, -20], [-28.5, -10], [-28.5, 0]]) },
            // Raised dorsal wedge pointing forward.
            { closed: true, pts: [[30, 0], [-16, -12], [-20, 0], [-16, 12]] },
            line(30, 0, -20, 0),
            ...mirrorLine(18, -4, -8, -10.5),
            // Side window bands.
            ...mirrorLine(16, -9, 4, -14.5), ...mirrorLine(1, -16, -12, -21),
            // Engine housings and nozzles across the stern.
            ...mirrorRect(-22, -20.5, -28.5, -8),
            { circle: [-27, -17, 2.4] }, { circle: [-27, -11.3, 2.4] }, { circle: [-27, 11.3, 2.4] }, { circle: [-27, 17, 2.4] },
            // Bow gun.
            line(34, 0, 39, 0)
        ],
        slots: [
            { id: 'nose', x: 22, y: 0 },
            { id: 'top', x: 2, y: 0 },
            { id: 'wl', x: -6, y: -15 },
            { id: 'wr', x: -6, y: 15 },
            { id: 'rl', x: -18, y: -6 },
            { id: 'rr', x: -18, y: 6 }
        ],
        engines: [{ x: -28.5, y: -17, size: 0.75 }, { x: -28.5, y: -11.3, size: 0.75 }, { x: -28.5, y: 11.3, size: 0.75 }, { x: -28.5, y: 17, size: 0.75 }],
        colliders: [[28, 0, 6], [20, 0, 8], [10, 0, 10], [-1, 0, 11], [-13, 0, 12], [-22, 0, 9],
            [4, -12, 6], [4, 12, 6], [-8, -17, 7], [-8, 17, 7], [-20, -19, 7], [-20, 19, 7]],
        jets: { retro: [[30, 4]], side: [[-8, 22]], bow: [33, 2], stern: [-27, 23] },
        jetScale: 1.3
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser: U-shaped engineering section, long neck and a squared bow.',
        cost: 2500,
        color: '205,225,255',
        exhaust: '255,160,80',
        mass: 3,
        hull: 160,
        baseShield: 0,
        cargo: 45,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 54,
        art: [
            // Arms of the U running forward either side of the hull.
            ...mirrorRect(-32.6, -22.9, -1.5, -14),
            ...mirrorRect(-12, -22.9, -1.5, -14),
            ...mirrorLine(-28, -18.5, -12, -18.5),
            // Rear block with chamfered corners and the engine row.
            { closed: true, pts: symmetric([[-32.6, -22.9], [-43.4, -22.9], [-50, -16.3], [-50, 0]]) },
            // Central hull plate between the arms.
            { closed: true, pts: symmetric([[-1.5, -8.8], [-40, -8.8], [-44.5, -4.4], [-44.5, 0]]) },
            // Raised superstructure and hangar.
            { closed: true, pts: symmetric([[10.5, -5.5], [-12, -5.5], [-20, -3], [-32.6, -3], [-32.6, 0]]) },
            rect(-14, -2, -28, 2),
            // Neck.
            rect(-1.5, -6.6, 29, 6.6),
            line(8, -6.6, 8, 6.6), line(18, -6.6, 18, 6.6),
            ...mirrorLine(0, -3.3, 28, -3.3),
            // Forward section with intakes.
            { closed: true, pts: symmetric([[50, -6.6], [46.7, -10.6], [29, -10.6], [29, 0]]) },
            ...mirrorRect(31, -9, 36, -5.5),
            line(40, -10.6, 40, 10.6),
            // Turret blisters on the arms.
            { circle: [-26, -17.6, 2] }, { circle: [-26, 17.6, 2] },
            // Engine nozzles across the stern.
            { circle: [-48, -11, 1.6] }, { circle: [-48, -14.5, 1.6] }, { circle: [-48, -18, 1.6] },
            { circle: [-48, 11, 1.6] }, { circle: [-48, 14.5, 1.6] }, { circle: [-48, 18, 1.6] }
        ],
        slots: [
            { id: 'bow', x: 40, y: 0 },
            { id: 'bridge', x: 14, y: 0 },
            { id: 'ml', x: -22, y: -5.5 },
            { id: 'mr', x: -22, y: 5.5 },
            { id: 'nl', x: -16, y: -18.5 },
            { id: 'nr', x: -16, y: 18.5 }
        ],
        engines: [-18, -14.5, -11, 11, 14.5, 18].map(y => ({ x: -50, y: y, size: 0.7 })),
        colliders: [[46, 0, 8], [37, 0, 10], [24, 0, 7], [14, 0, 7], [4, 0, 7]]
            .concat(row([-6, -18, -30, -42], 0, 9), row([-6, -18, -30, -42], -17, 7), row([-6, -18, -30, -42], 17, 7)),
        jets: { retro: [[48, 9], [-2, 18.5]], side: [[38, 10.6], [-20, 22.9]], bow: [46, 8], stern: [-48, 22] },
        jetScale: 1.3
    },

    x304: {
        id: 'x304',
        hyperdrive: 1.4,          // built-in hyperdrive speed
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
    },

    hatak: {
        id: 'hatak',
        hyperdrive: 1.2,          // built-in hyperdrive speed
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Pyramid warship with six great legs. Huge hold, tough and shielded, slow to turn.',
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
        radius: 72,
        art: [
            // Eight legs, as in the top-down blueprint: two narrow forward prongs, two arms
            // angled forward, two arms out to the sides and two legs angled back.
            // Solid central hull the legs grow out of.
            { closed: true, pts: symmetric([[40, 0], [38, -11], [24, -21], [6, -29], [-12, -34], [-26, -28], [-27, -14], [-24, 0]]) },
            leg([[18, -6], [40, -9.5], [62, -12]], 5.5), mirrorPart(leg([[18, -6], [40, -9.5], [62, -12]], 5.5)),
            leg([[12, -14], [32, -28], [50, -42]], 6.5), mirrorPart(leg([[12, -14], [32, -28], [50, -42]], 6.5)),
            leg([[-6, -20], [-1, -44], [4, -67]], 7), mirrorPart(leg([[-6, -20], [-1, -44], [4, -67]], 7)),
            leg([[-16, -14], [-40, -19], [-66, -26]], 7), mirrorPart(leg([[-16, -14], [-40, -19], [-66, -26]], 7)),
            // Hull plates joining the side arms to the rear legs.
            { closed: true, pts: [[-4, -20], [-16, -38], [-32, -30], [-16, -13]] },
            mirrorPart({ closed: true, pts: [[-4, -20], [-16, -38], [-32, -30], [-16, -13]] }),
            // Squared feet.
            { closed: true, pts: [[60, -16], [67, -15], [66, -8], [59, -8.5]] },
            mirrorPart({ closed: true, pts: [[60, -16], [67, -15], [66, -8], [59, -8.5]] }),
            { closed: true, pts: [[45, -47], [53, -50], [56, -40], [49, -37]] },
            mirrorPart({ closed: true, pts: [[45, -47], [53, -50], [56, -40], [49, -37]] }),
            ...mirrorRect(-3, -64, 11, -71),
            ...mirrorRect(-63, -32, -70, -20),
            // Hangar rings at the hubs.
            { circle: [38, -8, 3] }, { circle: [38, 8, 3] },
            { circle: [-19, -36, 4] }, { circle: [-19, 36, 4] },
            { circle: [-31, -29, 3.5] }, { circle: [-31, 29, 3.5] },
            // Central pyramid: nested triangles pointing forward, and the spine between the prongs.
            { closed: true, pts: [[30, 0], [-18, -24], [-18, 24]] },
            { closed: true, pts: [[20, 0], [-11, -16], [-11, 16]] },
            { closed: true, pts: [[9, 0], [-4, -7], [-4, 7]] },
            line(30, 0, 9, 0), line(-18, -24, -4, -7), line(-18, 24, -4, 7),
            line(30, 0, 38, 0),
            ...mirrorRect(-18, -13, -22, -4)
        ],
        slots: [
            { id: 'top', x: 3, y: 0 },
            { id: 'fl', x: 50, y: -10.5 },
            { id: 'fr', x: 50, y: 10.5 },
            { id: 'pl', x: 0, y: -52 },
            { id: 'pr', x: 0, y: 52 },
            { id: 'al', x: -50, y: -22 },
            { id: 'ar', x: -50, y: 22 },
            { id: 'sl', x: -11, y: -10 },
            { id: 'sr', x: -11, y: 10 }
        ],
        engines: [{ x: -22, y: -8, size: 1.3 }, { x: -22, y: 8, size: 1.3 }, { x: -70, y: -26, size: 0.8 }, { x: -70, y: 26, size: 0.8 }],
        colliders: [[4, 0, 17], [20, 0, 9], [-12, -16, 8], [-12, 16, 8],
            [30, -8, 5], [30, 8, 5], [46, -10, 5], [46, 10, 5], [62, -12, 5], [62, 12, 5],
            [24, -22, 6], [24, 22, 6], [38, -33, 6], [38, 33, 6], [50, -43, 6], [50, 43, 6],
            [-3, -32, 8], [-3, 32, 8], [0, -50, 8], [0, 50, 8], [4, -66, 7], [4, 66, 7],
            [-20, -30, 9], [-20, 30, 9], [-34, -19, 8], [-34, 19, 8], [-50, -22, 8], [-50, 22, 8], [-65, -26, 7], [-65, 26, 7]],
        jets: { retro: [[66, 14]], side: [[4, 70]], bow: [64, 13], stern: [-68, 30] },
        jetScale: 1.8,
        exhaust: '255,190,90',
        shieldColor: '255,200,120'
    },

    asgard: {
        id: 'asgard',
        hyperdrive: 3,          // built-in hyperdrive speed
        name: 'Asgard',
        className: "O'Neill-class",
        faction: 'Asgard',
        description: 'Pinnacle of Asgard engineering: pointed head, slender neck and vast crescent wings.',
        cost: 12000,
        color: '170,240,255',
        exhaust: '140,220,255',
        shieldColor: '150,230,255',
        mass: 5,
        hull: 300,
        baseShield: 100,
        cargo: 80,
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 92,
        art: [
            // Crescent wings with curved ribs, sweeping out from the rear body.
            { closed: true, pts: [[-20, -20], [-19.5, -32], [-20.5, -44], [-23.5, -56], [-28.5, -68], [-34, -78], [-37.5, -84],
                [-40.5, -82], [-44, -74], [-48.5, -63], [-53, -51], [-57.5, -39], [-61.5, -28], [-64, -19]] },
            mirrorPart({ closed: true, pts: [[-20, -20], [-19.5, -32], [-20.5, -44], [-23.5, -56], [-28.5, -68], [-34, -78], [-37.5, -84],
                [-40.5, -82], [-44, -74], [-48.5, -63], [-53, -51], [-57.5, -39], [-61.5, -28], [-64, -19]] }),
            { pts: [[-24, -24], [-24.5, -40], [-27, -54], [-32, -66], [-37, -76]] },
            { pts: mirror([[-24, -24], [-24.5, -40], [-27, -54], [-32, -66], [-37, -76]]) },
            { pts: [[-30, -28], [-34, -46], [-39, -62], [-41, -72]] },
            { pts: mirror([[-30, -28], [-34, -46], [-39, -62], [-41, -72]]) },
            { pts: [[-38, -26], [-45, -42], [-50, -56]] },
            { pts: mirror([[-38, -26], [-45, -42], [-50, -56]]) },
            // Engine pods and forward-pointing cannons on the wings.
            { closed: true, pts: [[-17, -37], [-26, -35.5], [-36, -36.5], [-38, -38.5], [-27, -40.5], [-17, -39]] },
            mirrorPart({ closed: true, pts: [[-17, -37], [-26, -35.5], [-36, -36.5], [-38, -38.5], [-27, -40.5], [-17, -39]] }),
            ...mirrorRect(-26, -56.8, -3, -55.2),
            { circle: [-2, -56, 1.4] }, { circle: [-2, 56, 1.4] },
            // Rear body: outer hull, collar, inner bay with cells.
            ellipse(-44, 0, 31, 24, 36),
            ellipse(-46, 0, 26, 20, 32),
            ellipse(-40, 0, 19, 14, 28),
            ...grid(-55, -8.5, 4, 2, 5.5, 7.5, 1.5),
            line(-60, 0, -21, 0),
            // Neck lined with window rows and ribbing.
            rect(17, -12, -15, 12),
            ...grid(-12, -11, 7, 1, 3, 3, 1.4), ...grid(-12, 8, 7, 1, 3, 3, 1.4),
            line(-14, -6, 16, -6), line(-14, 6, 16, 6),
            ...[-11, -8, -5, -2, 1, 4, 7, 10, 13].map(x => line(x, -6, x, 6)),
            // Head: hexagonal hull, inset deck, bat-wing chevrons and side vents.
            { closed: true, pts: symmetric([[78, -3], [76, -6], [45, -28], [24, -28], [17, -13], [17, 0]]) },
            { closed: true, pts: symmetric([[72, -2.5], [44, -23], [27, -23], [22, -12], [22, 0]]) },
            { pts: [[28, -19], [44, -12], [38, 0], [44, 12], [28, 19]] },
            { pts: [[64, -8], [53, 0], [64, 8]] },
            ...mirrorRect(34, -25.5, 26, -21.5),
            rect(78, -1.5, 80.5, 1.5)
        ],
        slots: [
            { id: 'nose', x: 58, y: 0 },
            { id: 'hl', x: 34, y: -18 },
            { id: 'hr', x: 34, y: 18 },
            { id: 'fwd', x: 2, y: 0 },
            { id: 'core', x: -33, y: 0 },
            { id: 'aft', x: -50, y: 0 },
            { id: 'fl', x: -36, y: -62 },
            { id: 'fr', x: -36, y: 62 },
            { id: 'tail', x: -68, y: 0 }
        ],
        engines: [{ x: -75, y: -7, size: 1.2 }, { x: -75, y: 7, size: 1.2 }, { x: -63, y: -22, size: 0.8 }, { x: -63, y: 22, size: 0.8 }],
        colliders: [[58, 0, 12], [40, -12, 11], [40, 12, 11], [26, 0, 12], [8, 0, 13], [-6, 0, 13],
            [-24, 0, 20], [-44, 0, 24], [-62, 0, 16],
            [-28, -40, 9], [-28, 40, 9], [-32, -58, 9], [-32, 58, 9], [-38, -74, 7], [-38, 74, 7],
            [-48, -52, 8], [-48, 52, 8], [-56, -34, 8], [-56, 34, 8]],
        jets: { retro: [[42, 27], [-36, 80]], side: [[30, 28], [-48, 66]], bow: [62, 12], stern: [-70, 22] },
        jetScale: 1.6
    },

    aurora: {
        id: 'aurora',
        hyperdrive: 2.2,          // built-in hyperdrive speed
        name: 'Aurora',
        className: 'Ancient warship',
        faction: 'Ancient',
        description: 'Lantean battleship: pointed bow, blocky drone module and broad rear wings. Fastest drive, ten mounts.',
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
        radius: 92,
        art: [
            // Broad rear wing blocks.
            { closed: true, pts: [[-58, -9], [-60, -28], [-66, -30], [-82, -30], [-85, -26], [-85, -9]] },
            { closed: true, pts: mirror([[-58, -9], [-60, -28], [-66, -30], [-82, -30], [-85, -26], [-85, -9]]) },
            ...mirrorRect(-64, -26, -80, -13),
            ...mirrorLine(-64, -19.5, -80, -19.5),
            ...mirrorRect(-85, -26, -87.5, -20),
            // Fins on the spine.
            { closed: true, pts: [[-37, -8], [-39, -24], [-44, -25], [-46, -8]] },
            { closed: true, pts: mirror([[-37, -8], [-39, -24], [-44, -25], [-46, -8]]) },
            ...mirrorLine(-40, -12, -42, -22),
            // Main hull: bow, forward module, mid-body, spine and stern.
            { closed: true, pts: symmetric([[88, 0], [80, -3], [56, -10], [50, -12], [48, -23], [44, -24], [22, -24], [19, -19.5], [-12, -19.5],
                [-17, -15], [-17, -8], [-58, -8], [-60, -9], [-87, -9], [-89, -5], [-89, 0]]) },
            ...mirrorRect(44, -22, 24, -17),
            line(80, 0, 50, 0), line(-17, 0, -84, 0),
            ...mirrorLine(80, -3, 50, -3),
            line(48, -12, 48, 12), line(22, -19.5, 22, 19.5),
            ...mirrorRect(42, -14, 26, -8),
            rect(14, -15, -12, 15),
            line(14, -15, -12, 15), line(-12, -15, 14, 15),
            { circle: [1, 0, 5] },
            ...mirrorLine(-40, -8, -40, -3), ...mirrorLine(-50, -8, -50, -3),
            rect(-89, -5, -92, -1), rect(-89, 1, -92, 5)
        ],
        slots: [
            { id: 'nose', x: 66, y: 0 },
            { id: 'fwd', x: 34, y: 0 },
            { id: 'pl', x: 34, y: -11 },
            { id: 'pr', x: 34, y: 11 },
            { id: 'core', x: 1, y: 0 },
            { id: 'mid', x: -26, y: 0 },
            { id: 'aft', x: -48, y: 0 },
            { id: 'fl', x: -72, y: -20 },
            { id: 'fr', x: -72, y: 20 },
            { id: 'tail', x: -78, y: 0 }
        ],
        engines: [{ x: -92, y: -3, size: 1.1 }, { x: -92, y: 3, size: 1.1 }, { x: -87.5, y: -23, size: 0.9 }, { x: -87.5, y: 23, size: 0.9 }],
        colliders: row([80, 68, 56, 44, 32, 20, 8, -4, -16, -28, -40, -52, -64, -76, -86], 0, 8)
            .concat([[34, -14, 9], [34, 14, 9], [6, -12, 8], [6, 12, 8], [-72, -20, 9], [-72, 20, 9], [-42, -16, 6], [-42, 16, 6]]),
        jets: { retro: [[48, 22], [-60, 26]], side: [[34, 24], [-74, 30]], bow: [72, 4.5], stern: [-86, 28] },
        jetScale: 1.6
    }
};

// Relative sizes: the line art above is drawn at a convenient size per ship; these factors
// rescale every hull so fighters are small and cruisers / motherships are properly big
// (not to true scale, a Ha'tak would fill the screen, but in proportion).
const SIZE = { x302: 0.75, glider: 0.75, jumper: 0.75, alkesh: 1.45, x303: 2, x304: 2.2, hatak: 2.6, asgard: 2.4, aurora: 2.4 };

const scalePoint = (p, k) => [p[0] * k, p[1] * k];
const scaleHull = (hull, k) => {
    hull.art = hull.art.map(part => {
        if(part.rect) return { rect: part.rect.map(v => v * k) };
        if(part.circle) return { circle: part.circle.map(v => v * k) };
        return { closed: part.closed, pts: part.pts.map(p => scalePoint(p, k)) };
    });
    hull.slots = hull.slots.map(slot => Object.assign({}, slot, { x: slot.x * k, y: slot.y * k }));
    hull.engines = hull.engines.map(e => ({ x: e.x * k, y: e.y * k, size: e.size * k }));
    hull.colliders = hull.colliders.map(c => [c[0] * k, c[1] * k, c[2] * k]);
    const jets = hull.jets;
    hull.jets = {
        retro: jets.retro.map(p => scalePoint(p, k)),
        side: jets.side.map(p => scalePoint(p, k)),
        bow: scalePoint(jets.bow, k),
        stern: scalePoint(jets.stern, k)
    };
    hull.radius *= k;
    hull.moduleScale *= k;
    hull.jetScale = (hull.jetScale || 1) * k;
    hull.sizeScale = k;
};
Object.keys(SIZE).forEach(id => { if(HULLS[id]) scaleHull(HULLS[id], SIZE[id]); });

export const HULL_ORDER = ['x302', 'glider', 'jumper', 'x303', 'alkesh', 'x304', 'hatak', 'asgard', 'aurora'];

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

// Smallest ellipse (with the hull's aspect ratio) that encloses every point of the
// line art, plus padding, so the shield never clips through the ship.
export const shieldFor = (hull) => {
    if(hull._shield) return hull._shield;
    const b = hullBounds(hull);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const hw = (b.maxX - b.minX) / 2;
    const hh = (b.maxY - b.minY) / 2;
    let scale = 0;
    hull.art.forEach(part => {
        const pts = part.circle ? [[part.circle[0] + part.circle[2], part.circle[1]], [part.circle[0], part.circle[1] + part.circle[2]]] : partPoints(part);
        pts.forEach(p => {
            const nx = (p[0] - cx) / hw;
            const ny = (p[1] - cy) / hh;
            scale = Math.max(scale, Math.sqrt(nx * nx + ny * ny));
        });
    });
    const padding = 4 + hull.radius * 0.06;
    hull._shield = { x: cx, y: cy, rx: hw * scale + padding, ry: hh * scale + padding };
    return hull._shield;
};

export default HULLS;
