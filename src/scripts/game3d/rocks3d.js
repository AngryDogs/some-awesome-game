// Asteroids in 3D: faceted rock bodies tumbling through space, generated in endless cubic
// sectors around the ship. Mining chips them smaller and splits the big ones; ore is
// spawned by the game when they are hit.

import MATERIALS, { rollMaterial, pickFromComposition, dominantMaterial } from '../world/materials';
import { makeNoise } from '../render3d/world3d';

export const SECTOR = 2000;
const ACTIVE = 1;                // sectors in each direction that are simulated
const SAFE_RADIUS = 1100;        // no asteroids this close to the station or the gate
const VARIANTS = 18;
const CAPACITY = 500;            // instances per shape variant

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

let nextId = 1;

export class Rock3D {

    constructor(o) {
        this.id = nextId++;
        this.x = o.x; this.y = o.y; this.z = o.z;
        this.vx = o.vx || 0; this.vy = o.vy || 0; this.vz = o.vz || 0;
        this.radius = o.radius;
        this.variant = o.variant === undefined ? Math.floor(Math.random() * VARIANTS) : o.variant;
        this.composition = o.composition || { rock: 1 };
        this.material = dominantMaterial(this.composition);
        const rnd = o.random || Math.random;
        // Tumbling: a random axis and a spin rate that is slower for bigger rocks.
        let ax = rnd() * 2 - 1, ay = rnd() * 2 - 1, az = rnd() * 2 - 1;
        const l = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
        this.axis = [ax / l, ay / l, az / l];
        this.spin = (rnd() - 0.5) * 30 / (this.radius + 10);
        this.angle = rnd() * Math.PI * 2;
        this.wear = 0;               // damage absorbed since the last split
        this.oreProgress = 0;
        this.flash = 0;
        this.grace = o.grace || 0;   // fresh fragments don't collide straight away
        this.dead = false;
    }

    get mass() {
        return this.radius * this.radius * this.radius * 0.05;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;
        this.angle += this.spin * dt;
        if(this.flash > 0) this.flash -= dt;
        if(this.grace > 0) this.grace -= dt;
    }

    // Material that comes off when mined.
    pickOre() {
        return pickFromComposition(this.composition, Math.random);
    }
}

// ------------------------------------------------------------ sectors

const sectorKey = (sx, sy, sz) => sx + ',' + sy + ',' + sz;
export const sectorOf3 = (x, y, z) => ({ sx: Math.floor(x / SECTOR), sy: Math.floor(y / SECTOR), sz: Math.floor(z / SECTOR) });

export class Field3D {

    constructor(seed, bias, safePoints) {
        this.seed = seed;
        this.bias = bias || {};
        this.safePoints = safePoints || [];
        this.dormant = {};
        this.seen = {};
        this.active = {};
    }

    generate(sx, sy, sz) {
        const rnd = random((this.seed * 73856093) ^ (sx * 19349663) ^ (sy * 83492791) ^ (sz * 50331653));
        const distance = Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz));
        const rocks = [];
        // Some sectors hold a dense cluster, some are almost empty.
        const dense = rnd() < 0.18;
        const count = dense ? 9 + Math.floor(rnd() * 8) : 2 + Math.floor(rnd() * 6);
        const cx = (sx + 0.2 + rnd() * 0.6) * SECTOR;
        const cy = (sy + 0.2 + rnd() * 0.6) * SECTOR;
        const cz = (sz + 0.2 + rnd() * 0.6) * SECTOR;
        for(let i = 0; i < count; i++) {
            const spread = dense ? 450 : SECTOR * 0.5;
            const x = dense ? cx + (rnd() - 0.5) * 2 * spread : (sx + rnd()) * SECTOR;
            const y = dense ? cy + (rnd() - 0.5) * 2 * spread : (sy + rnd()) * SECTOR;
            const z = dense ? cz + (rnd() - 0.5) * 2 * spread : (sz + rnd()) * SECTOR;
            if(this.safePoints.some(p => Math.sqrt((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) + (z - p.z) * (z - p.z)) < SAFE_RADIUS)) continue;
            const giant = rnd() < 0.05;
            const radius = giant ? 110 + rnd() * 110 : 14 + rnd() * rnd() * 95;
            const main = rollMaterial(rnd, distance, this.bias);
            const composition = main === 'rock' ? { rock: 1 } : { rock: 0.45 + rnd() * 0.25 };
            if(main !== 'rock') composition[main] = 1 - composition.rock;
            rocks.push(new Rock3D({
                x: x, y: y, z: z,
                vx: (rnd() - 0.5) * 16, vy: (rnd() - 0.5) * 16, vz: (rnd() - 0.5) * 16,
                radius: radius, variant: Math.floor(rnd() * VARIANTS), composition: composition, random: rnd
            }));
        }
        return rocks;
    }

    // Wake the sectors around (x, y, z) and put far ones to sleep. Returns the active rocks.
    update(x, y, z, rocks) {
        const c = sectorOf3(x, y, z);
        const wanted = {};
        for(let dx = -ACTIVE; dx <= ACTIVE; dx++) {
            for(let dy = -ACTIVE; dy <= ACTIVE; dy++) {
                for(let dz = -ACTIVE; dz <= ACTIVE; dz++) {
                    wanted[sectorKey(c.sx + dx, c.sy + dy, c.sz + dz)] = [c.sx + dx, c.sy + dy, c.sz + dz];
                }
            }
        }
        const keep = [];
        rocks.forEach(rock => {
            if(rock.dead) return;
            const s = sectorOf3(rock.x, rock.y, rock.z);
            const key = sectorKey(s.sx, s.sy, s.sz);
            if(wanted[key]) keep.push(rock);
            else (this.dormant[key] = this.dormant[key] || []).push(rock);
        });
        Object.keys(this.active).forEach(key => { if(!wanted[key]) delete this.active[key]; });
        Object.keys(wanted).forEach(key => {
            if(this.active[key]) return;
            this.active[key] = true;
            if(!this.seen[key]) {
                this.seen[key] = true;
                const s = wanted[key];
                this.generate(s[0], s[1], s[2]).forEach(r => keep.push(r));
            }
            if(this.dormant[key]) {
                this.dormant[key].forEach(r => keep.push(r));
                delete this.dormant[key];
            }
        });
        return keep;
    }
}

// ------------------------------------------------------------ rendering

// Faceted rock shapes: a subdivided icosahedron pushed in and out by noise and craters,
// squashed a little, with darker cavities and lighter ridges.
const buildVariant = (THREE, index) => {
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const noise = makeNoise(9000 + index * 131);
    const rnd = random(4000 + index * 977);
    const squash = [0.75 + rnd() * 0.3, 0.75 + rnd() * 0.3, 0.7 + rnd() * 0.3];
    const craters = [];
    for(let i = 0; i < 5 + Math.floor(rnd() * 5); i++) {
        let cx = rnd() * 2 - 1, cy = rnd() * 2 - 1, cz = rnd() * 2 - 1;
        const l = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
        craters.push({ x: cx / l, y: cy / l, z: cz / l, r: 0.25 + rnd() * 0.35, depth: 0.06 + rnd() * 0.12 });
    }
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for(let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const l = Math.sqrt(x * x + y * y + z * z) || 1;
        x /= l; y /= l; z /= l;
        let r = 0.82 + noise(x * 1.4 + 5, y * 1.4 + 5, z * 1.4 + 5, 4) * 0.45;
        craters.forEach(c => {
            const d = Math.sqrt((x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) + (z - c.z) * (z - c.z));
            if(d < c.r) r -= c.depth * (1 - (d / c.r) * (d / c.r));
        });
        pos.setXYZ(i, x * r * squash[0], y * r * squash[1], z * r * squash[2]);
        const shade = Math.max(0.45, Math.min(1.15, 0.55 + (r - 0.8) * 1.4));
        colors[i * 3] = shade;
        colors[i * 3 + 1] = shade * 0.96;
        colors[i * 3 + 2] = shade * 0.9;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
};

const BASE_ROCK = [0.55, 0.5, 0.46];

// Rock colour from its composition: dusty grey-brown tinted towards its metals.
const rockTint = (composition) => {
    let c = BASE_ROCK.slice();
    Object.keys(composition).forEach(id => {
        if(id === 'rock' || !MATERIALS[id]) return;
        const t = MATERIALS[id].color.split(',').map(v => parseFloat(v) / 255);
        const share = composition[id] * 0.55;
        c = c.map((v, i) => v * (1 - share) + t[i] * share);
    });
    return c;
};

export class RockRenderer {

    constructor(THREE, scene) {
        this.THREE = THREE;
        const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0.08, flatShading: true });
        this.meshes = [];
        for(let i = 0; i < VARIANTS; i++) {
            const mesh = new THREE.InstancedMesh(buildVariant(THREE, i), material, CAPACITY);
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.count = 0;
            mesh.frustumCulled = false;
            scene.add(mesh);
            this.meshes.push(mesh);
        }
        this.matrix = new THREE.Matrix4();
        this.quat = new THREE.Quaternion();
        this.pos = new THREE.Vector3();
        this.scale = new THREE.Vector3();
        this.axis = new THREE.Vector3();
        this.color = new THREE.Color();
    }

    render(rocks, camera, maxDistance) {
        const counts = new Array(VARIANTS).fill(0);
        const max2 = maxDistance * maxDistance;
        rocks.forEach(rock => {
            if(rock.dead) return;
            const dx = rock.x - camera.x, dy = rock.y - camera.y, dz = rock.z - camera.z;
            if(dx * dx + dy * dy + dz * dz > max2) return;
            const v = rock.variant;
            if(counts[v] >= CAPACITY) return;
            const mesh = this.meshes[v];
            this.axis.set(rock.axis[0], rock.axis[1], rock.axis[2]);
            this.quat.setFromAxisAngle(this.axis, rock.angle);
            this.pos.set(rock.x, rock.y, rock.z);
            this.scale.setScalar(rock.radius);
            this.matrix.compose(this.pos, this.quat, this.scale);
            mesh.setMatrixAt(counts[v], this.matrix);
            if(!rock.tint) rock.tint = rockTint(rock.composition);
            const f = rock.flash > 0 ? 1.6 : 1;
            this.color.setRGB(rock.tint[0] * f, rock.tint[1] * f, rock.tint[2] * f);
            mesh.setColorAt(counts[v], this.color);
            counts[v]++;
        });
        this.meshes.forEach((mesh, i) => {
            mesh.count = counts[i];
            mesh.instanceMatrix.needsUpdate = true;
            if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        });
    }
}
