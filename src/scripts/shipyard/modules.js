// Module definitions. Each stat array is indexed by module level - 1 (Mk I..III).

export const MAX_LEVEL = 3;

const MODULES = {
    minigun: {
        id: 'minigun',
        name: 'Minigun turret',
        short: 'Minigun',
        description: 'Rapid-fire turret. Aims at the cursor, or auto-targets with a targeting computer.',
        cost: 250,
        color: '255,200,120',
        stats: { fireRate: [12, 16, 21], damage: [1, 1.3, 1.7], heatShots: [60, 85, 120] },
        describe: (s) => s.fireRate + ' rounds/s, ' + s.damage + ' dmg, overheats after ' + s.heatShots + ' rounds'
    },
    staff: {
        id: 'staff',
        name: 'Staff cannon',
        short: 'Staff',
        description: "Goa'uld plasma cannon. Slow, heavy energy bolts that splash on impact.",
        cost: 900,
        color: '255,175,70',
        stats: { fireRate: [1.5, 1.9, 2.4], damage: [8, 11, 15], splash: [28, 34, 42] },
        describe: (s) => s.damage + ' dmg bolts, ' + s.fireRate + '/s, ' + s.splash + 'px splash'
    },
    beam: {
        id: 'beam',
        name: 'Asgard ion beam',
        short: 'Ion beam',
        description: 'Instant-hit energy beam that carves through rock. Fires in bursts, then recharges.',
        cost: 2200,
        color: '140,215,255',
        stats: { dps: [28, 40, 56], range: [600, 700, 820], burst: [1.2, 1.4, 1.7], cooldown: [2.6, 2.2, 1.8] },
        describe: (s) => s.dps + ' dmg/s, ' + s.burst + 's burst, recharge ' + s.cooldown + 's'
    },
    drones: {
        id: 'drones',
        name: 'Drone launcher',
        short: 'Drones',
        description: 'Ancient drone weapons (F / right click). Fires a salvo of five self-guided drones in a row; each detonates in a big energy blast.',
        cost: 2800,
        color: '255,225,130',
        stats: { count: [5, 5, 6], damage: [24, 32, 42], blast: [36, 44, 54], cooldown: [5, 4.2, 3.4] },
        describe: (s) => s.count + '-drone salvo, ' + s.damage + ' dmg, ' + s.blast + 'px blast, reload ' + s.cooldown + 's'
    },
    scanner: {
        id: 'scanner',
        name: 'Ore scanner',
        short: 'Scanner',
        description: 'Scans asteroids for metals: colours the scanner map by ore, pings the area and guides you to the richest asteroid nearby.',
        cost: 800,
        color: '190,255,140',
        stats: { range: [2000, 2700, 3400], interval: [5, 4, 3] },
        describe: (s) => s.range + 'px scan range, ping every ' + s.interval + 's'
    },
    missile: {
        id: 'missile',
        name: 'Missile pod',
        short: 'Missiles',
        description: 'Fires explosive missiles (F / right click). Home in on targets with a targeting computer.',
        cost: 600,
        color: '255,130,110',
        stats: { cooldown: [1.6, 1.2, 0.85], damage: [14, 20, 28], blast: [45, 55, 68] },
        describe: (s) => s.damage + ' dmg, ' + s.blast + 'px blast, reload ' + s.cooldown + 's'
    },
    engine: {
        id: 'engine',
        name: 'Sublight engine',
        short: 'Engine',
        description: 'Extra thrust and manoeuvring power.',
        cost: 400,
        color: '255,215,140',
        stats: { thrust: [220, 320, 440], torque: [1.2, 1.8, 2.5] },
        describe: (s) => '+' + s.thrust + ' thrust, +' + s.torque + ' turn'
    },
    shield: {
        id: 'shield',
        name: 'Shield emitter',
        short: 'Shield',
        description: 'Energy shield absorbs impacts and recharges when not hit.',
        cost: 700,
        color: '120,210,255',
        stats: { capacity: [40, 65, 95], regen: [8, 12, 18] },
        describe: (s) => '+' + s.capacity + ' shield, ' + s.regen + '/s recharge'
    },
    guidance: {
        id: 'guidance',
        name: 'Targeting computer',
        short: 'Guidance',
        description: 'Turrets lock on and fire automatically (toggle with G). Missiles become homing.',
        cost: 900,
        color: '140,255,160',
        stats: { range: [350, 480, 620], homing: [3, 4.5, 6] },
        describe: (s) => s.range + 'px lock range, homing ' + s.homing
    },
    cargo: {
        id: 'cargo',
        name: 'Cargo pod',
        short: 'Cargo',
        description: 'Extra hold space for ore.',
        cost: 350,
        color: '200,170,255',
        stats: { capacity: [20, 35, 55] },
        describe: (s) => '+' + s.capacity + ' cargo'
    },
    magnet: {
        id: 'magnet',
        name: 'Ore tractor',
        short: 'Tractor',
        description: 'Tractor beam that pulls in floating ore from further away.',
        cost: 450,
        color: '120,255,230',
        stats: { range: [160, 230, 320] },
        describe: (s) => s.range + 'px pickup range'
    },
    armor: {
        id: 'armor',
        name: 'Trinium armor',
        short: 'Armor',
        description: 'Reinforced plating. More hull, a little more mass.',
        cost: 300,
        color: '200,200,215',
        stats: { hull: [30, 50, 75], mass: [0.3, 0.3, 0.3] },
        describe: (s) => '+' + s.hull + ' hull'
    }
};

export const MODULE_ORDER = ['minigun', 'staff', 'beam', 'missile', 'drones', 'engine', 'shield', 'guidance', 'scanner', 'cargo', 'magnet', 'armor'];

export const moduleStats = (type, level) => {
    const def = MODULES[type];
    const stats = {};
    Object.keys(def.stats).forEach(key => { stats[key] = def.stats[key][level - 1]; });
    return stats;
};

export const upgradeCost = (type, level) => {
    if(level >= MAX_LEVEL) return null;
    return Math.round(MODULES[type].cost * (level === 1 ? 1 : 1.8));
};

export const totalSpent = (type, level) => {
    let total = MODULES[type].cost;
    for(let l = 1; l < level; l++) total += upgradeCost(type, l);
    return total;
};

export const sellValue = (type, level) => Math.round(totalSpent(type, level) * 0.5);

// Line-art icon for a module, centred on (0, 0) in the current transform.
// `aim` is the local angle a turret barrel points at; `u` scales the drawing.
export const drawModule = (ctx, type, level, options) => {
    const opts = options || {};
    const u = opts.scale || 1;
    const color = MODULES[type].color;
    const aim = opts.aim || 0;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = opts.lineWidth || 1.2;
    ctx.strokeStyle = 'rgb(' + color + ')';
    ctx.fillStyle = 'rgba(5, 10, 20, 0.85)';
    ctx.shadowBlur = opts.glow === undefined ? 5 : opts.glow;
    ctx.shadowColor = 'rgb(' + color + ')';

    const shape = (pts) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * u, pts[0][1] * u);
        for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * u, pts[i][1] * u);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };
    const line = (x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1 * u, y1 * u);
        ctx.lineTo(x2 * u, y2 * u);
        ctx.stroke();
    };
    const circle = (r, fill) => {
        ctx.beginPath();
        ctx.arc(0, 0, r * u, 0, Math.PI * 2);
        if(fill) ctx.fill();
        ctx.stroke();
    };

    if(type === 'minigun') {
        // One barrel per Mk level.
        ctx.save();
        ctx.rotate(aim);
        const offsets = level === 1 ? [0] : level === 2 ? [-1.3, 1.3] : [-2, 0, 2];
        if(opts.heat > 0.5) {
            ctx.strokeStyle = 'rgb(255,' + Math.round(200 - (opts.heat - 0.5) * 300) + ',' + Math.round(120 - (opts.heat - 0.5) * 200) + ')';
        }
        offsets.forEach(o => line(0, o, 9, o));
        ctx.strokeStyle = 'rgb(' + color + ')';
        ctx.restore();
        circle(3.6, true);
        circle(1.2);
    }

    if(type === 'staff') {
        // Long ribbed plasma cannon on a disc mount.
        ctx.save();
        ctx.rotate(aim);
        shape([[0, -1.6], [10, -1], [10, 1], [0, 1.6]]);
        for(let i = 0; i < level + 1; i++) line(3 + i * 2, -1.4, 3 + i * 2, 1.4);
        ctx.restore();
        shape([[0, -4], [3.5, -2], [3.5, 2], [0, 4], [-3.5, 2], [-3.5, -2]]);
    }

    if(type === 'beam') {
        // Asgard emitter: crystal dish with a focusing prong.
        ctx.save();
        ctx.rotate(aim);
        line(0, 0, 8, 0);
        line(5, -2, 8, 0); line(5, 2, 8, 0);
        ctx.restore();
        circle(4, true);
        ctx.beginPath();
        ctx.arc(0, 0, 2.2 * u, 0, Math.PI * 2);
        ctx.stroke();
        for(let i = 1; i < level; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (4 + i * 1.4) * u, Math.PI * 0.6, Math.PI * 1.4);
            ctx.stroke();
        }
    }

    if(type === 'drones') {
        // Hexagonal drone bay with glowing drone cells.
        shape([[4.5, 0], [2.2, -4], [-2.2, -4], [-4.5, 0], [-2.2, 4], [2.2, 4]]);
        const cells = level + 2;
        for(let i = 0; i < cells; i++) {
            const a = (i / cells) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 2.2 * u, Math.sin(a) * 2.2 * u, 0.7 * u, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    if(type === 'missile') {
        shape([[-4, -4], [4, -4], [5, 0], [4, 4], [-4, 4]]);
        const tubes = level + 1;
        for(let i = 0; i < tubes; i++) {
            const y = -2.5 + (5 / (tubes - 1)) * i;
            line(-2.5, y, 3, y);
        }
    }

    if(type === 'engine') {
        shape([[3, -3], [3, 3], [-4, 4.5], [-4, -4.5]]);
        for(let i = 0; i < level; i++) line(1 - i * 2, -2.5, 1 - i * 2, 2.5);
    }

    if(type === 'shield') {
        const hex = (r) => {
            const pts = [];
            for(let i = 0; i < 6; i++) pts.push([Math.cos(i * Math.PI / 3) * r, Math.sin(i * Math.PI / 3) * r]);
            return pts;
        };
        shape(hex(4.5));
        if(level >= 2) shape(hex(3));
        if(level >= 3) shape(hex(1.5));
    }

    if(type === 'guidance') {
        circle(3.8, true);
        line(-5.5, 0, -2, 0); line(2, 0, 5.5, 0);
        line(0, -5.5, 0, -2); line(0, 2, 0, 5.5);
        for(let i = 1; i < level; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (3.8 + i * 1.6) * u, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();
        }
    }

    if(type === 'cargo') {
        shape([[-4.5, -4], [4.5, -4], [4.5, 4], [-4.5, 4]]);
        line(-4.5, 0, 4.5, 0);
        for(let i = 0; i < level; i++) line(-2 + i * 2, -4, -2 + i * 2, 4);
    }

    if(type === 'magnet') {
        // Horseshoe magnet, one field arc per level.
        ctx.beginPath();
        ctx.arc(-1 * u, 0, 3.5 * u, Math.PI / 2, Math.PI * 1.5);
        ctx.lineTo(3 * u, -3.5 * u);
        ctx.moveTo(-1 * u, 3.5 * u);
        ctx.lineTo(3 * u, 3.5 * u);
        ctx.stroke();
        for(let i = 0; i < level; i++) {
            ctx.beginPath();
            ctx.arc(3 * u, 0, (2 + i * 1.6) * u, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
        }
    }

    if(type === 'scanner') {
        // Radar dish with sweep arcs (one per level).
        circle(3.4, true);
        line(0, 0, 3, -3);
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.stroke();
        for(let i = 0; i < level; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (4.8 + i * 1.5) * u, -Math.PI * 0.45, Math.PI * 0.05);
            ctx.stroke();
        }
    }

    if(type === 'armor') {
        shape([[0, -4.5], [4.5, 0], [0, 4.5], [-4.5, 0]]);
        for(let i = 0; i < level; i++) {
            const o = -1.5 + i * 1.5;
            line(-2 + o, -1, 1 + o, 2);
        }
    }

    ctx.restore();
};

export default MODULES;
