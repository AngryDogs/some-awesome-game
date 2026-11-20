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
        stats: { fireRate: [12, 16, 21], damage: [1, 1.3, 1.7] },
        describe: (s) => s.fireRate + ' rounds/s, ' + s.damage + ' dmg'
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

export const MODULE_ORDER = ['minigun', 'missile', 'engine', 'shield', 'guidance', 'armor'];

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
        offsets.forEach(o => line(0, o, 9, o));
        ctx.restore();
        circle(3.6, true);
        circle(1.2);
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
