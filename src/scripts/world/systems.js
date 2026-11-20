// Star systems you can travel between, the constellations used as Stargate symbols, and
// the gate addresses.
//
// Gate addresses work like coordinates: six constellation symbols form three pairs, and
// the line between each pair passes through the destination; where the three lines meet
// is the destination world. The seventh symbol is the point of origin of the gate you
// dial from. Addresses here are generated from that geometry (constellations sit on a
// large sphere around the map), so the starmap can draw the three lines meeting exactly
// at the world.

export const CONSTELLATIONS = [
    'Andromeda', 'Aquarius', 'Aries', 'Auriga', 'Bootes', 'Cancer', 'Canis Minor', 'Capricornus',
    'Centaurus', 'Cetus', 'Corona Australis', 'Crater', 'Equuleus', 'Eridanus', 'Gemini', 'Hydra',
    'Leo', 'Leo Minor', 'Libra', 'Lynx', 'Microscopium', 'Monoceros', 'Norma', 'Orion',
    'Pegasus', 'Perseus', 'Pisces', 'Piscis Austrinus', 'Sagittarius', 'Scorpius', 'Sculptor', 'Scutum',
    'Serpens Caput', 'Sextans', 'Taurus', 'Triangulum', 'Virgo', 'Aquila'
];

// Map units: 1 unit = 1 light year. Constellations sit on a sphere around everything.
const SPHERE_RADIUS = 3600;

export const SYSTEMS = [
    {
        id: 'lantea', name: 'Lantea', galaxy: 'Pegasus', origin: 'Lantean',
        description: 'Ocean world of Atlantis. Shipyard and ore market.',
        map: [1700, -380, 900],
        station: true, gate: { x: 760, y: -620 },
        planet: { x: -2600, y: -1900, radius: 900, type: 'ocean' },
        tint: '60,120,200', materials: {}
    },
    {
        id: 'earth', name: 'Earth', galaxy: 'Milky Way', origin: "Tau'ri",
        description: 'Home of the SGC. Iron and copper rich belts.',
        map: [-420, 120, -260],
        gate: { x: 0, y: 0 },
        planet: { x: 2400, y: -2100, radius: 950, type: 'earth', moon: true },
        tint: '70,110,170', materials: { iron: 1.6, copper: 1.8, gold: 0.6 }
    },
    {
        id: 'abydos', name: 'Abydos', galaxy: 'Milky Way', origin: 'Abydonian',
        description: 'Desert world with naquadah mines. Rich in naquadah.',
        map: [-180, -340, 110],
        gate: { x: 0, y: 0 },
        planet: { x: -2200, y: 2000, radius: 1000, type: 'desert', moon: true },
        tint: '170,130,70', materials: { naquadah: 4, gold: 1.4, iron: 0.7 }
    },
    {
        id: 'chulak', name: 'Chulak', galaxy: 'Milky Way', origin: 'Chulakian',
        description: "Jaffa homeworld under Apophis. Titanium-heavy asteroids.",
        map: [260, 300, -520],
        gate: { x: 0, y: 0 },
        planet: { x: 2600, y: 1800, radius: 850, type: 'jungle' },
        tint: '80,140,90', materials: { titanium: 2.5, copper: 1.2 }
    },
    {
        id: 'dakara', name: 'Dakara', galaxy: 'Milky Way', origin: 'Dakaran',
        description: 'Ancient temple world. Gold-veined asteroids.',
        map: [520, -120, 340],
        gate: { x: 0, y: 0 },
        planet: { x: -2500, y: -2000, radius: 900, type: 'rocky' },
        tint: '170,90,70', materials: { gold: 2.6, titanium: 1.2 }
    },
    {
        id: 'langara', name: 'Langara', galaxy: 'Milky Way', origin: 'Langaran',
        description: 'Industrial world of Kelowna. Dense, metal-rich fields.',
        map: [-640, -60, 480],
        gate: { x: 0, y: 0 },
        planet: { x: 2300, y: 2200, radius: 880, type: 'industrial' },
        tint: '130,110,150', materials: { naquadah: 2, iron: 1.3, titanium: 1.4 }
    },
    {
        id: 'othala', name: 'Othala', galaxy: 'Ida', origin: 'Asgard',
        description: 'Asgard homeworld, far from the Milky Way. Pristine titanium and gold.',
        map: [-1900, 520, -1100],
        gate: { x: 0, y: 0 },
        planet: { x: -2300, y: 2100, radius: 920, type: 'ice' },
        tint: '120,200,220', materials: { titanium: 2.4, gold: 1.8, naquadah: 1.5 }
    }
];

export const systemById = (id) => SYSTEMS.filter(s => s.id === id)[0] || SYSTEMS[0];

// ------------------------------------------------------------ address geometry

const random = (seed) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (a) => scale(a, 1 / (Math.sqrt(dot(a, a)) || 1));

// Constellation positions and addresses, built once from a fixed seed so every player
// has the same addresses.
const build = () => {
    const rnd = random(1994);
    const positions = new Array(CONSTELLATIONS.length);
    const anchorCount = CONSTELLATIONS.length - SYSTEMS.length * 3;   // 17 anchors, 21 line ends

    // Anchors: evenly spread over the sphere.
    for(let i = 0; i < anchorCount; i++) {
        const y = 1 - (i + 0.5) / anchorCount * 2;
        const r = Math.sqrt(1 - y * y);
        const phi = i * 2.399963 + rnd() * 0.2;
        positions[i] = [Math.cos(phi) * r * SPHERE_RADIUS, y * SPHERE_RADIUS, Math.sin(phi) * r * SPHERE_RADIUS];
    }

    // For each world, draw three lines from anchors through the world to the far side of
    // the sphere; the far ends become the remaining constellations.
    let next = anchorCount;
    const addresses = {};
    SYSTEMS.forEach((system, index) => {
        const d = system.map;
        const used = {};
        const glyphs = [];
        for(let line = 0; line < 3; line++) {
            let a;
            do { a = Math.floor(rnd() * anchorCount); } while(used[a]);
            used[a] = true;
            const u = normalize(sub(d, positions[a]));
            // Solve |d + u t| = R for t > 0.
            const b = dot(d, u);
            const c = dot(d, d) - SPHERE_RADIUS * SPHERE_RADIUS;
            const t = -b + Math.sqrt(b * b - c);
            positions[next] = add(d, scale(u, t));
            glyphs.push(a, next);
            next++;
        }
        // Mix the order a little so pairs aren't always anchor-first.
        if(index % 2) glyphs.reverse();
        addresses[system.id] = glyphs;
    });

    return { positions: positions, addresses: addresses };
};

const geometry = build();

export const constellationPosition = (index) => geometry.positions[index];

// Six constellation indices for a destination.
export const addressOf = (systemId) => geometry.addresses[systemId].slice();

// Which system (if any) a 6-symbol address leads to.
export const systemForAddress = (glyphs) => {
    const key = glyphs.join(',');
    const match = SYSTEMS.filter(s => geometry.addresses[s.id].join(',') === key)[0];
    return match || null;
};

// The three lines of an address, as pairs of 3D points (for the starmap).
export const addressLines = (systemId) => {
    const g = geometry.addresses[systemId];
    return [[g[0], g[1]], [g[2], g[3]], [g[4], g[5]]].map(pair => [geometry.positions[pair[0]], geometry.positions[pair[1]]]);
};

export const distanceBetween = (a, b) => {
    const d = sub(systemById(a).map, systemById(b).map);
    return Math.sqrt(dot(d, d));
};
