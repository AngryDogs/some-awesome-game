// What asteroids are made of. Prices are credits per unit of ore sold at the station.
// `minSector` is how many sectors from base a material starts appearing;
// `weight` and `growth` control how common it is (growing with distance).

const MATERIALS = {
    rock: { id: 'rock', name: 'Rock', color: '150,150,160', price: 1, minSector: 0, weight: 60, growth: 0 },
    iron: { id: 'iron', name: 'Iron', color: '205,120,90', price: 6, minSector: 0, weight: 30, growth: 0 },
    copper: { id: 'copper', name: 'Copper', color: '235,150,70', price: 10, minSector: 1, weight: 14, growth: 1.5 },
    titanium: { id: 'titanium', name: 'Titanium', color: '170,205,240', price: 18, minSector: 2, weight: 8, growth: 2 },
    gold: { id: 'gold', name: 'Gold', color: '255,215,80', price: 40, minSector: 4, weight: 3, growth: 1.2 },
    naquadah: { id: 'naquadah', name: 'Naquadah', color: '110,255,170', price: 100, minSector: 7, weight: 1, growth: 0.6 }
};

export const MATERIAL_ORDER = ['rock', 'iron', 'copper', 'titanium', 'gold', 'naquadah'];

// Main material of an asteroid at a given distance (in sectors) from base.
export const rollMaterial = (rng, sectorDistance) => {
    const options = MATERIAL_ORDER
        .map(id => MATERIALS[id])
        .filter(m => sectorDistance >= m.minSector)
        .map(m => ({ id: m.id, weight: m.weight + m.growth * (sectorDistance - m.minSector) }));

    const total = options.reduce((sum, o) => sum + o.weight, 0);
    let roll = rng() * total;
    for(let i = 0; i < options.length; i++) {
        roll -= options[i].weight;
        if(roll <= 0) return options[i].id;
    }
    return 'rock';
};

// Pick a material id from a composition like { rock: 0.4, gold: 0.6 }.
export const pickFromComposition = (composition, random) => {
    let roll = (random || Math.random)();
    const keys = Object.keys(composition);
    for(let i = 0; i < keys.length; i++) {
        roll -= composition[keys[i]];
        if(roll <= 0) return keys[i];
    }
    return keys[keys.length - 1];
};

export const dominantMaterial = (composition) => {
    let best = 'rock';
    let bestShare = -1;
    Object.keys(composition).forEach(id => {
        // Prefer showing the metal over plain rock when it's a decent share.
        const share = composition[id] * (id === 'rock' ? 0.6 : 1);
        if(share > bestShare) {
            bestShare = share;
            best = id;
        }
    });
    return best;
};

export default MATERIALS;
