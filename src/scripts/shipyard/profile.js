// Persistent player profile: credits, owned hulls and the module loadout of each hull.

import HULLS from './hulls';
import MODULES, { moduleStats, upgradeCost, sellValue, MAX_LEVEL } from './modules';
import MATERIALS from '../world/materials';

const BASE_MAGNET_RANGE = 90;
export const REPAIR_COST_PER_HP = 2;

const STORAGE_KEY = 'awesome-game-shipyard-v1';

const defaultProfile = () => ({
    credits: 0,
    bestScore: 0,
    seed: Math.floor(Math.random() * 4294967295),
    cargo: {},
    hull: 'x302',
    ownedHulls: ['x302'],
    loadouts: {
        x302: { c: { type: 'minigun', level: 1 } }
    }
});

const load = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if(!raw) return defaultProfile();
        const data = JSON.parse(raw);
        const profile = Object.assign(defaultProfile(), data);
        if(!HULLS[profile.hull] || profile.ownedHulls.indexOf(profile.hull) === -1) profile.hull = 'x302';
        return profile;
    } catch(e) {
        return defaultProfile();
    }
};

const profile = load();
const listeners = [];

const save = () => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch(e) {
        // Storage unavailable (private mode etc.): keep playing from memory.
    }
    listeners.forEach(fn => fn(profile));
};

export const onProfileChange = (fn) => listeners.push(fn);

export const getProfile = () => profile;

export const loadoutFor = (hullId) => {
    if(!profile.loadouts[hullId]) profile.loadouts[hullId] = {};
    return profile.loadouts[hullId];
};

export const addCredits = (amount) => {
    profile.credits += amount;
    save();
};

export const recordScore = (score) => {
    if(score > profile.bestScore) {
        profile.bestScore = score;
        save();
    }
};

export const ownsHull = (hullId) => profile.ownedHulls.indexOf(hullId) !== -1;

export const selectHull = (hullId) => {
    if(!ownsHull(hullId)) return false;
    profile.hull = hullId;
    save();
    return true;
};

export const buyHull = (hullId) => {
    const hull = HULLS[hullId];
    if(ownsHull(hullId) || profile.credits < hull.cost) return false;
    profile.credits -= hull.cost;
    profile.ownedHulls.push(hullId);
    profile.hull = hullId;
    save();
    return true;
};

export const installModule = (hullId, slotId, type) => {
    const loadout = loadoutFor(hullId);
    if(loadout[slotId] || profile.credits < MODULES[type].cost) return false;
    profile.credits -= MODULES[type].cost;
    loadout[slotId] = { type: type, level: 1 };
    save();
    return true;
};

export const upgradeModule = (hullId, slotId) => {
    const module = loadoutFor(hullId)[slotId];
    if(!module || module.level >= MAX_LEVEL) return false;
    const cost = upgradeCost(module.type, module.level);
    if(profile.credits < cost) return false;
    profile.credits -= cost;
    module.level++;
    save();
    return true;
};

export const sellModule = (hullId, slotId) => {
    const loadout = loadoutFor(hullId);
    const module = loadout[slotId];
    if(!module) return false;
    profile.credits += sellValue(module.type, module.level);
    delete loadout[slotId];
    save();
    return true;
};

// Combine hull + modules into the numbers the ship flies with.
export const computeShipStats = (hullId) => {
    const hull = HULLS[hullId];
    const loadout = loadoutFor(hullId);

    const stats = {
        hull: hull,
        mass: hull.mass,
        maxHull: hull.hull,
        maxShield: hull.baseShield,
        shieldRegen: hull.baseShield > 0 ? hull.baseShield * 0.15 : 0,
        thrustForce: hull.thrust,
        cargo: hull.cargo,
        magnetRange: BASE_MAGNET_RANGE,
        torqueForce: hull.torque * hull.mass,
        guidance: null,
        modules: []
    };

    hull.slots.forEach(slot => {
        const module = loadout[slot.id];
        if(!module) return;
        const s = moduleStats(module.type, module.level);
        stats.modules.push({ slot: slot, type: module.type, level: module.level, stats: s });

        if(module.type === 'engine') {
            stats.thrustForce += s.thrust;
            stats.torqueForce += s.torque;
        }
        if(module.type === 'shield') {
            stats.maxShield += s.capacity;
            stats.shieldRegen += s.regen;
        }
        if(module.type === 'armor') {
            stats.maxHull += s.hull;
            stats.mass += s.mass;
        }
        if(module.type === 'cargo') stats.cargo += s.capacity;
        if(module.type === 'magnet') stats.magnetRange = Math.max(stats.magnetRange, s.range);
        if(module.type === 'guidance') {
            if(!stats.guidance || s.range > stats.guidance.range) stats.guidance = s;
        }
    });

    stats.acceleration = stats.thrustForce / stats.mass;
    stats.angularAcceleration = stats.torqueForce / stats.mass;
    stats.maxTurn = hull.maxTurn * Math.min(1.6, Math.sqrt(stats.angularAcceleration / hull.torque));
    stats.weapons = stats.modules.filter(m => ['minigun', 'missile', 'staff', 'beam', 'drones'].indexOf(m.type) !== -1).length;

    return stats;
};

// ------------------------------------------------------------ cargo & market

export const cargoUsed = () => Object.keys(profile.cargo).reduce((sum, id) => sum + profile.cargo[id], 0);

// Adds one unit of ore if it fits. Returns true when stored.
export const storeOre = (material, capacity) => {
    if(cargoUsed() >= capacity) return false;
    profile.cargo[material] = (profile.cargo[material] || 0) + 1;
    save();
    return true;
};

export const cargoValue = () => Object.keys(profile.cargo)
    .reduce((sum, id) => sum + profile.cargo[id] * MATERIALS[id].price, 0);

export const sellCargo = (material) => {
    const ids = material ? [material] : Object.keys(profile.cargo);
    let earned = 0;
    ids.forEach(id => {
        earned += (profile.cargo[id] || 0) * MATERIALS[id].price;
        delete profile.cargo[id];
    });
    profile.credits += earned;
    save();
    return earned;
};

export const loseCargo = () => {
    profile.cargo = {};
    save();
};

export const spendCredits = (amount) => {
    if(profile.credits < amount) return false;
    profile.credits -= amount;
    save();
    return true;
};
