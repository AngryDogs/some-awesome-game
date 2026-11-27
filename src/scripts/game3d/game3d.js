// The 3D game: free six-degrees-of-freedom flight through endless 3D asteroid fields,
// mining, combat, Atlantis, the Stargate and hyperspace, all rendered with WebGL.
//
// It shares everything that isn't tied to a flat map with the classic 2D game: hulls,
// modules and stats, the shipyard and market, star systems, the DHD and starmap, gate
// dialling, sounds, enemy fits and damage rules.

import Ship3D from './ship3d';
import Effects3D from './effects3d';
import { Field3D, RockRenderer, Rock3D } from './rocks3d';
import { createEnemy3D, updateEnemyAI3D } from './ai3d';
import { drawCrosshair, drawNose, drawMarker, drawRadar, drawWeapons, drawText } from './hud3d';
import { buildAtlantis, buildGate, buildDHD, buildPlanet, buildOreCrystals, ORE_LIMIT } from '../render3d/world3d';
import { webglAvailable } from '../render3d/scene3d';
import { DAMAGE_TYPE, SHIP_DAMAGE, TARGET_MODE_LABEL } from '../components/ship/ship';
import { enemyConfig, pickEnemyHull } from '../components/ship/enemy';
import Stargate, { GATE_INNER, GATE_RADIUS, gateSymbolSprite, CHEVRON_ANGLES, DHD_RANGE } from '../world/stargate';
import { STATION } from '../world/station';
import { SYSTEMS, systemById, distanceBetween } from '../world/systems';
import MATERIALS from '../world/materials';
import { PALETTES } from '../render/planets';
import { drawWormhole, drawHyperspace } from '../gameboard/travel';
import { getDHD, isDHDOpen } from '../ui/dhd';
import { getStarmap, isStarmapOpen, hyperTravelTime } from '../ui/starmap';
import { getShipyard, isShipyardOpen } from '../shipyard/shipyard';
import { computeShipStats, getProfile, storeOre, cargoUsed, loseCargo, addCredits, isDebug } from '../shipyard/profile';
import sounds from '../audio/audio';

const STEP = 1 / 90;
const MAX_STEPS = 4;
const FOV = 62;
const VIEW_DISTANCE = 6000;
const ORE_LIFETIME = 90;
const GAME_OVER_DELAY = 2.6;
const STEER_DEAD_ZONE = 0.08;     // fraction of the screen where the mouse only aims

export const can3D = () => webglAvailable() && !/[?&]2d\b/.test(window.location.search);

let T = null;            // THREE
let renderer = null;
let scene = null;
let camera = null;
let hudCanvas = null;
let hud = null;
let effects = null;
let rockRenderer = null;
let oreMesh = null;
let sky = null;
let state = null;
let frameId = null;
let lastTime = 0;
let accumulator = 0;
let fps = 60;
let width = 0;
let height = 0;
let pixelRatio = 1;
let initialized = false;
let onExit = null;
let onFallback = null;
let glLost = false;
let glLostAt = 0;
let glErrors = 0;
const mouse = { x: 0, y: 0, left: false, right: false };
const keys = {};
const domHud = {};

// ------------------------------------------------------------ setup

const systemSeed = (id) => {
    let h = getProfile().seed || 1;
    for(let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
};

const initialize = () => {
    initialized = true;
    T = window.THREE;
    const board = document.getElementById('gameboard');
    // No 'high-performance' GPU request: on Macs with two GPUs Safari may switch GPUs for
    // it and lose the WebGL context.
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'game3d-layer';
    // If the browser takes the graphics context away, wait for it to come back instead of
    // failing every frame (Three.js rebuilds everything when it is restored).
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        glLost = true;
        glLostAt = performance.now();
        if(state) banner('Graphics reset by the browser: restoring...', 3);
    }, false);
    renderer.domElement.addEventListener('webglcontextrestored', () => {
        glLost = false;
        glErrors = 0;
        if(state) banner('Graphics restored', 1.5);
    }, false);
    board.appendChild(renderer.domElement);
    hudCanvas = document.createElement('canvas');
    hudCanvas.className = 'game3d-hud';
    board.appendChild(hudCanvas);
    hud = hudCanvas.getContext('2d');

    scene = new T.Scene();
    scene.fog = new T.FogExp2(0x04070f, 0.00016);
    camera = new T.PerspectiveCamera(FOV, 1, 1, 150000);
    scene.add(new T.AmbientLight(0x8a96b0, 0.5));
    scene.add(new T.HemisphereLight(0xb8c8e8, 0x1a1c24, 0.6));
    const sun = new T.DirectionalLight(0xfff0dc, 3.2);
    sun.position.set(-0.55, 0.65, 0.85);
    scene.add(sun);
    const rim = new T.DirectionalLight(0x6f8cff, 0.7);
    rim.position.set(0.5, -0.6, -0.5);
    scene.add(rim);

    effects = new Effects3D(T, scene);
    rockRenderer = new RockRenderer(T, scene);
    oreMesh = buildOreCrystals(T);
    scene.add(oreMesh);
    buildSky();
    buildGateEffects();
    buildLines();

    ['shieldButton', 'cargoButton', 'starmapButton', 'credits', 'location', 'targeting', 'fps', 'hullBar', 'hullText',
        'shieldBar', 'shieldText', 'cargoBar', 'cargoText'].forEach(id => { domHud[id] = document.getElementById(id); });
    window.addEventListener('resize', resize);
    bindInput();
    document.getElementById('shieldButton').addEventListener('click', () => { if(state && !state.paused) toggleShields(); });
    document.getElementById('starmapButton').addEventListener('click', () => { if(state && !state.paused) openStarmap(); });
    document.getElementById('resumeGame').addEventListener('click', () => { if(state) setPaused(false); });
    document.getElementById('abandonGame').addEventListener('click', () => { if(state) endGame('Returned to base. Cargo in the hold is kept.'); });
};

// Stars on a huge sphere that travels with the camera (they never get closer).
const buildSky = () => {
    sky = new T.Group();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for(let i = 0; i < count; i++) {
        let x, y, z, l;
        do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; l = x * x + y * y + z * z; } while(l > 1 || l < 0.01);
        l = Math.sqrt(l);
        positions[i * 3] = x / l * 60000; positions[i * 3 + 1] = y / l * 60000; positions[i * 3 + 2] = z / l * 60000;
        const b = 0.45 + Math.random() * 0.55;
        const warm = Math.random();
        colors[i * 3] = b * (warm < 0.2 ? 1 : 0.85); colors[i * 3 + 1] = b * 0.9; colors[i * 3 + 2] = b * (warm > 0.7 ? 1 : 0.9);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    const stars = new T.Points(geometry, new T.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false }));
    stars.renderOrder = -2;
    sky.add(stars);
    scene.add(sky);
};

// The event horizon (a rippling pool) and the kawoosh (a vortex bursting out of the gate).
const HORIZON_FRAGMENT = [
    'uniform float uTime;',
    'uniform float uAlpha;',
    'uniform float uHole;',
    'varying vec2 vUv;',
    'void main() {',
    '    vec2 p = vUv * 2.0 - 1.0;',
    '    float r = length(p);',
    '    if(r > 1.0 || r < uHole) discard;',
    '    float ripple = sin(r * 30.0 - uTime * 5.0) * 0.5 + 0.5;',
    '    float swirl = sin(atan(p.y, p.x) * 5.0 + r * 9.0 - uTime * 1.7) * 0.5 + 0.5;',
    '    float foam = uHole > 0.0 ? smoothstep(uHole + 0.25, uHole, r) * 0.8 : 0.0;',
    '    vec3 deep = vec3(0.08, 0.22, 0.68);',
    '    vec3 bright = vec3(0.78, 0.9, 1.0);',
    '    vec3 color = mix(deep, bright, clamp(pow(1.0 - r, 1.4) * 0.75 + ripple * 0.22 + swirl * 0.1 + foam, 0.0, 1.0));',
    '    gl_FragColor = vec4(color, uAlpha * smoothstep(1.0, 0.92, r));',
    '}'
].join('\n');

let horizon = null;
let kawoosh = null;

const buildGateEffects = () => {
    horizon = new T.Mesh(new T.CircleGeometry(GATE_INNER, 72), new T.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uHole: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: HORIZON_FRAGMENT,
        transparent: true, side: T.DoubleSide, depthWrite: false
    }));
    horizon.visible = false;
    scene.add(horizon);
    const cone = new T.ConeGeometry(GATE_INNER * 0.95, 1, 40, 1, true);
    cone.rotateX(-Math.PI / 2);
    cone.translate(0, 0, 0.5);
    kawoosh = new T.Mesh(cone, new T.MeshBasicMaterial({ color: 0xa8d0ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    kawoosh.visible = false;
    scene.add(kawoosh);
};

// Beam weapons and tractor beams as glowing lines.
let beamLines = null;
const MAX_BEAMS = 64;
const buildLines = () => {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(MAX_BEAMS * 6), 3).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('color', new T.BufferAttribute(new Float32Array(MAX_BEAMS * 6), 3).setUsage(T.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);
    beamLines = new T.LineSegments(geometry, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    beamLines.frustumCulled = false;
    scene.add(beamLines);
};

const resize = () => {
    if(!renderer) return;
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = width + 'px';
    renderer.domElement.style.height = height + 'px';
    hudCanvas.width = Math.floor(width * pixelRatio);
    hudCanvas.height = Math.floor(height * pixelRatio);
    hudCanvas.style.width = width + 'px';
    hudCanvas.style.height = height + 'px';
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    effects.resize(height * pixelRatio, FOV);
};

// ------------------------------------------------------------ input

const bindInput = () => {
    window.addEventListener('keydown', (event) => {
        if(!state) return;
        if(isDHDOpen() || isStarmapOpen() || isShipyardOpen()) return;
        const code = event.code;
        if(code === 'Escape') {
            if(!state.docked && !state.transition && state.ship.alive) setPaused(!state.paused);
            event.preventDefault();
            return;
        }
        if(state.paused) return;
        if(!keys[code] && !event.repeat) pressed(code);
        keys[code] = true;
        if(['Space', 'Tab'].indexOf(code) !== -1 || code.indexOf('Arrow') === 0) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => { keys[event.code] = false; });
    window.addEventListener('blur', () => { Object.keys(keys).forEach(k => { keys[k] = false; }); mouse.left = mouse.right = false; });
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });
    window.addEventListener('mousedown', (event) => {
        if(!state || state.paused) return;
        if(event.target !== hudCanvas) return;
        if(weaponPanelClick(event.clientX, event.clientY)) return;
        if(event.button === 0) mouse.left = true;
        if(event.button === 2) mouse.right = true;
    });
    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) mouse.left = false;
        if(event.button === 2) mouse.right = false;
    });
    window.addEventListener('contextmenu', (event) => { if(state) event.preventDefault(); });
    window.addEventListener('wheel', (event) => {
        if(!state || state.paused) return;
        state.cameraDistance = Math.max(0.5, Math.min(4, state.cameraDistance * Math.exp(event.deltaY * 0.0012)));
    }, { passive: true });
};

const pressed = (code) => {
    const ship = state.ship;
    if(!ship.alive || state.transition) return;
    if(code === 'KeyX') {
        ship.stabilizer = !ship.stabilizer;
        sounds.toggle(ship.stabilizer);
        banner('Stabilizer ' + (ship.stabilizer ? 'ON: cancelling drift' : 'OFF: free drift'));
    } else if(code === 'KeyH') toggleShields();
    else if(code === 'KeyG' && ship.guidance) {
        ship.autoTarget = !ship.autoTarget;
        banner('Auto-targeting ' + (ship.autoTarget ? 'ON' : 'OFF'));
    } else if(code === 'KeyT') {
        if(!ship.guidance) banner('Fit a targeting computer to choose targets');
        else {
            sounds.toggle(true);
            banner('Targeting: ' + TARGET_MODE_LABEL[ship.cycleTargetMode()]);
        }
    } else if(code === 'KeyV') {
        state.freeAim = !state.freeAim;
        banner(state.freeAim ? 'Free aim: the mouse aims without steering' : 'Mouse steering ON');
    } else if(code === 'KeyB') interact();
    else if(code === 'KeyM' || code === 'KeyJ') openStarmap();
    else if(code === 'KeyN' && isDebug()) spawnEnemy(null, null, true);
    else if(/^Digit[1-5]$/.test(code)) {
        const weapons = ship.weaponStatus();
        const w = weapons[parseInt(code.slice(5), 10) - 1];
        if(w) toggleWeapon(w.kind);
    }
};

const toggleShields = () => {
    const ship = state.ship;
    if(!ship.alive) return;
    if(ship.maxShield <= 0) {
        banner('No shield emitter fitted');
        return;
    }
    ship.toggleShields();
    banner(ship.shieldsEnabled ? 'Shields raised' : 'Shields lowered: ore collection enabled');
};

const toggleWeapon = (kind) => {
    const on = state.ship.toggleWeapon(kind);
    const row = state.ship.weaponStatus().filter(w => w.kind === kind)[0];
    sounds.toggle(on);
    banner((row ? row.name : kind) + (on ? ' ON' : ' OFF'));
};

const weaponPanelClick = (x, y) => {
    if(!state || !state.weaponRows) return false;
    const row = state.weaponRows.filter(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)[0];
    if(!row) return false;
    toggleWeapon(row.kind);
    return true;
};

// Keyboard + mouse to flight controls: the mouse both aims and (outside a small dead zone
// in the middle) steers the nose; W/S thrust, A/D strafe, R/F up/down, Q/E roll.
const playerControls = () => {
    const k = (code) => !!keys[code];
    const c = state.controls;
    c.thrust = (k('KeyW') ? 1 : 0) - (k('KeyS') ? 1 : 0);
    c.strafe = (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0);
    c.lift = (k('KeyR') || k('Space') ? 1 : 0) - (k('KeyF') || k('ControlLeft') ? 1 : 0);
    c.roll = (k('KeyE') ? 1 : 0) - (k('KeyQ') ? 1 : 0);
    const half = Math.min(width, height) * 0.42;
    let dx = (mouse.x - width / 2) / half;
    let dy = (mouse.y - height / 2) / half;
    const d = Math.sqrt(dx * dx + dy * dy);
    if(state.freeAim || d < STEER_DEAD_ZONE) {
        c.yaw = c.pitch = 0;
    } else {
        const k2 = Math.min(1, (d - STEER_DEAD_ZONE) / (1 - STEER_DEAD_ZONE)) / d;
        c.yaw = Math.max(-1, Math.min(1, dx * k2));
        c.pitch = Math.max(-1, Math.min(1, -dy * k2));
    }
    // Arrow keys steer too.
    if(k('ArrowLeft')) c.yaw = -1;
    if(k('ArrowRight')) c.yaw = 1;
    if(k('ArrowUp')) c.pitch = -1;
    if(k('ArrowDown')) c.pitch = 1;
    c.fire = mouse.left;
    c.missiles = mouse.right || k('ShiftLeft');
    // Aim along the ray from the camera through the mouse.
    const aim = aimRay();
    c.aimPoint = aim.point;
    c.aimTarget = aim.object;
};

const raycaster = () => state.raycaster || (state.raycaster = new T.Raycaster());

const aimRay = () => {
    const ndc = new T.Vector2((mouse.x / width) * 2 - 1, -(mouse.y / height) * 2 + 1);
    const rc = raycaster();
    rc.setFromCamera(ndc, camera);
    const origin = rc.ray.origin;
    const dir = rc.ray.direction;
    let best = null;
    let bestT = 4000;
    const test = (obj, r) => {
        const ox = obj.x - origin.x, oy = obj.y - origin.y, oz = obj.z - origin.z;
        const along = ox * dir.x + oy * dir.y + oz * dir.z;
        if(along < 0 || along - r > bestT) return;
        const d2 = ox * ox + oy * oy + oz * oz - along * along;
        if(d2 > r * r) return;
        const t = along - Math.sqrt(r * r - d2);
        if(t < bestT && t > 0) {
            bestT = t;
            best = obj;
        }
    };
    state.enemies.forEach(e => { if(e.alive) test(e, e.radius * 0.9); });
    state.rocks.forEach(r => { if(!r.dead) test(r, r.radius * 0.85); });
    const point = origin.clone().addScaledVector(dir, best ? bestT : 1600);
    return { point: point, object: best };
};

// ------------------------------------------------------------ state

const createState = () => {
    const stats = computeShipStats(getProfile().hull);
    const ship = new Ship3D(T, stats, 'player', effects.texture);
    scene.add(ship.group);
    return {
        ship: ship, enemies: [], rocks: [], ores: [], bullets: [], missiles: [], beamHits: [], floats: [],
        controls: { thrust: 0, strafe: 0, lift: 0, pitch: 0, yaw: 0, roll: 0, fire: false, missiles: false, aimPoint: null },
        combat: makeCombat(), time: 0, paused: false, docked: false, transition: null, freeAim: false,
        cameraDistance: 1, bannerText: '', bannerTimer: 0, enemyTimer: 25 + Math.random() * 15, fieldTimer: 0,
        gameOverTimer: 0, tractorCount: 0
    };
};

const makeCombat = () => ({
    enemies: [], player: [], missiles: { player: [], enemy: [] },
    refresh() {
        this.enemies = state.enemies.filter(e => e.alive);
        const ship = state.ship;
        this.player = ship.alive && !ship.hidden && !state.transition ? [ship] : [];
        this.missiles.player = state.missiles.filter(m => !m.dead && m.side === 'player');
        this.missiles.enemy = state.missiles.filter(m => !m.dead && m.side === 'enemy');
    },
    hostileShips(side) { return side === 'player' ? this.enemies : this.player; },
    hostileMissiles(side, kind) {
        const list = side === 'player' ? this.missiles.enemy : this.missiles.player;
        return kind ? list.filter(m => m.kind === kind && !m.dead) : list;
    }
});

// Load a star system: its asteroid fields, Atlantis (Lantea), the gate, DHD and planet.
const enterSystem = (system, how) => {
    clearSystem();
    state.system = system;
    state.gate = new Stargate(system.gate.x, system.gate.y);
    state.gatePos = new T.Vector3(system.gate.x, system.gate.y, 0);
    state.dhdPos = new T.Vector3(system.gate.x + 260, system.gate.y, -20);
    state.stationPos = system.station ? new T.Vector3(STATION.x, STATION.y, 0) : null;
    const safe = [{ x: state.gatePos.x, y: state.gatePos.y, z: 0 }];
    if(state.stationPos) safe.push({ x: 0, y: 0, z: 0 });
    state.field = new Field3D(systemSeed(system.id), system.materials, safe);

    if(system.station) {
        state.station = buildAtlantis(T, STATION);
        scene.add(state.station);
    }
    state.gateModel = buildGate(T, GATE_RADIUS, GATE_INNER, gateSymbolSprite(), CHEVRON_ANGLES);
    state.gateModel.group.position.copy(state.gatePos);
    scene.add(state.gateModel.group);
    horizon.position.set(state.gatePos.x, state.gatePos.y, -9);
    kawoosh.position.set(state.gatePos.x, state.gatePos.y, -9);
    state.dhd = buildDHD(T);
    state.dhd.group.position.copy(state.dhdPos);
    scene.add(state.dhd.group);
    const planet = buildPlanet(T, system, PALETTES[system.planet.type] || PALETTES.rocky);
    planet.holder.traverse(o => { if(o.material) o.material.fog = false; });
    const dir = new T.Vector3(system.planet.x, -system.planet.y, -14000).normalize();
    planet.holder.position.copy(dir.multiplyScalar(42000));
    planet.holder.scale.setScalar(4);
    sky.add(planet.holder);
    state.planet = planet;

    const ship = state.ship;
    ship.velocity.set(0, 0, 0);
    ship.angular.set(0, 0, 0);
    if(how === 'gate') {
        ship.position.copy(state.gatePos).add(new T.Vector3(0, 0, 30));
        ship.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), new T.Vector3(0, 0, 1));
        ship.velocity.set(0, 0, 160);
        state.gate.incoming();
    } else if(how === 'hyper') {
        const a = Math.random() * Math.PI * 2;
        ship.position.set(state.gatePos.x + Math.cos(a) * 1400, state.gatePos.y + Math.sin(a) * 1400, 200);
        const toward = state.gatePos.clone().sub(ship.position).normalize();
        ship.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), toward);
        ship.velocity.copy(toward).multiplyScalar(240);
    } else {
        // Launch from Atlantis.
        ship.position.set(STATION.x + 520, STATION.y, 60);
        ship.quaternion.identity();
    }
    state.rocks = state.field.update(ship.x, ship.y, ship.z, []);
    state.enemyTimer = 20 + Math.random() * 15;
    banner(how ? 'Arrived at ' + system.name : 'Undocked from Atlantis. Happy mining!', 2.5);
};

const clearSystem = () => {
    ['station'].forEach(key => { if(state[key]) { scene.remove(state[key]); state[key] = null; } });
    if(state.gateModel) scene.remove(state.gateModel.group);
    if(state.dhd) scene.remove(state.dhd.group);
    if(state.planet) {
        sky.remove(state.planet.holder);
        state.planet.textures.map.dispose();
        state.planet.textures.clouds.dispose();
        state.planet = null;
    }
    state.enemies.forEach(e => scene.remove(e.group));
    state.enemies = [];
    state.rocks = [];
    state.ores = [];
    state.bullets = [];
    state.missiles = [];
    effects.clear();
};

// ------------------------------------------------------------ helpers

const banner = (text, duration) => {
    state.bannerText = text;
    state.bannerTimer = duration || 1.6;
};

const floatText = (p, text, color) => {
    state.floats.push({ p: new T.Vector3(p.x, p.y, p.z), text: text, color: color || '255,225,120', life: 1.4 });
};

const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z));

// First point along segment a->b inside a sphere (center c, radius r): 0..1, or -1.
const segmentSphere = (ax, ay, az, bx, by, bz, cx, cy, cz, r) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const fx = ax - cx, fy = ay - cy, fz = az - cz;
    const a = dx * dx + dy * dy + dz * dz;
    const b = 2 * (fx * dx + fy * dy + fz * dz);
    const c = fx * fx + fy * fy + fz * fz - r * r;
    if(c < 0) return 0;
    const disc = b * b - 4 * a * c;
    if(disc < 0 || a === 0) return -1;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    return t >= 0 && t <= 1 ? t : -1;
};

// Does a point touch a ship (its shield bubble when raised, otherwise its hull)?
const shipHit = (ship, p, pad) => {
    const broad = ship.radius * 1.6 + pad;
    if(dist(ship, p) > broad) return null;
    if(ship.shieldUp) return ship.shieldContact(p, pad) ? { shield: true } : null;
    const colliders = ship.worldColliders();
    for(let i = 0; i < colliders.length; i++) {
        if(colliders[i].p.distanceTo(p) < colliders[i].r + pad) return { shield: false };
    }
    return null;
};

// Beam / ray against asteroids and hostile ships.
const raycast = (origin, dir, range, side) => {
    let best = null;
    let bestT = range;
    const test = (obj, r) => {
        const ox = obj.x - origin.x, oy = obj.y - origin.y, oz = obj.z - origin.z;
        const along = ox * dir.x + oy * dir.y + oz * dir.z;
        if(along < 0 || along - r > bestT) return;
        const d2 = ox * ox + oy * oy + oz * oz - along * along;
        if(d2 > r * r) return;
        const t = Math.max(0, along - Math.sqrt(r * r - d2));
        if(t < bestT) {
            bestT = t;
            best = obj;
        }
    };
    state.rocks.forEach(r => { if(!r.dead) test(r, r.radius * 0.85); });
    state.combat.hostileShips(side).forEach(s => test(s, s.shieldUp ? Math.max(s.shieldShape.rx, s.shieldShape.ry) * 0.9 : s.radius * 0.7));
    return { distance: bestT, object: best };
};

// ------------------------------------------------------------ mining

const spawnOre = (p, material, vx, vy, vz) => {
    state.ores.push({ x: p.x, y: p.y, z: p.z, vx: vx, vy: vy, vz: vz, material: material, life: ORE_LIFETIME,
        angle: Math.random() * 6, spin: (Math.random() - 0.5) * 4, phase: Math.random() * 6,
        radius: material === 'rock' ? 2.8 : 3.4, dead: false, eject: 0 });
};

// A hit on an asteroid: dust and sparks, ore knocked loose, the rock worn down, and big
// rocks split in two once they've taken enough.
const hitRock = (rock, damage, point, dir, kind) => {
    if(rock.dead) return;
    rock.flash = 0.08;
    const tint = (rock.tint || [0.5, 0.48, 0.45]).map(v => Math.round(v * 255)).join(',');
    const out = new T.Vector3(point.x - rock.x, point.y - rock.y, point.z - rock.z).normalize();
    const rv = new T.Vector3(rock.vx, rock.vy, rock.vz);
    effects.burst(point, rv, Math.min(10, 2 + Math.round(damage)), { minSpeed: 10, maxSpeed: 60, minLife: 0.8, maxLife: 1.8, size: 7 + damage * 0.4, grow: 6, color: tint, alpha: 0.45, drag: 0.8, dust: true, dir: out, cone: 0.9 });
    effects.burst(point, rv, kind === 'plasma' ? 14 : 3, { minSpeed: 60, maxSpeed: 220, minLife: 0.15, maxLife: 0.5, size: kind === 'plasma' ? 4 : 2, color: kind === 'plasma' ? '255,170,60' : '255,220,160', drag: 1, dir: out, cone: 1 });
    if(kind === 'plasma') sounds.plasmaImpact();
    else if(kind !== 'beam') sounds.rockHit(rock.radius < 40);

    rock.oreProgress += damage / (6 + rock.radius * 0.12);
    while(rock.oreProgress >= 1) {
        rock.oreProgress -= 1;
        const speed = 30 + Math.random() * 60;
        spawnOre(point, rock.pickOre(), rock.vx + out.x * speed + (Math.random() - 0.5) * 30,
            rock.vy + out.y * speed + (Math.random() - 0.5) * 30, rock.vz + out.z * speed + (Math.random() - 0.5) * 30);
    }

    // Wear the rock down (more material comes off big rocks per hit, like chipping a face).
    const volume = rock.radius * rock.radius * rock.radius - damage * (30 + rock.radius * 6);
    rock.wear += damage;
    if(volume <= 7 * 7 * 7) {
        rock.dead = true;
        effects.burst(new T.Vector3(rock.x, rock.y, rock.z), rv, 18, { minSpeed: 10, maxSpeed: 70, minLife: 1, maxLife: 2.4, size: 12, grow: 8, color: tint, alpha: 0.4, drag: 0.6, dust: true });
        spawnOre(point, rock.pickOre(), rock.vx, rock.vy, rock.vz);
        sounds.rockCrack();
        return;
    }
    rock.radius = Math.cbrt(volume);
    if(rock.radius > 28 && rock.wear > rock.radius * 2.5) splitRock(rock, out);
};

const splitRock = (rock, hitDir) => {
    rock.dead = true;
    sounds.rockCrack();
    const pieces = rock.radius > 90 ? 3 : 2;
    const r = rock.radius * Math.cbrt(1 / pieces);
    // Pieces drift apart sideways from the line of the cut.
    const side = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(hitDir).normalize();
    for(let i = 0; i < pieces; i++) {
        const a = (i / pieces) * Math.PI * 2;
        const offset = side.clone().applyAxisAngle(hitDir, a).multiplyScalar(r * 0.9);
        const speed = 18 + Math.random() * 18;
        state.rocks.push(new Rock3D({
            x: rock.x + offset.x, y: rock.y + offset.y, z: rock.z + offset.z,
            vx: rock.vx + offset.x / r * speed, vy: rock.vy + offset.y / r * speed, vz: rock.vz + offset.z / r * speed,
            radius: r, composition: rock.composition, grace: 0.6
        }));
    }
    effects.burst(new T.Vector3(rock.x, rock.y, rock.z), null, 22, { minSpeed: 10, maxSpeed: 80, minLife: 1, maxLife: 2.5, size: 14, grow: 10, color: '150,140,130', alpha: 0.35, drag: 0.6, dust: true });
};

const updateOres = (dt) => {
    const ship = state.ship;
    let tractored = 0;
    const canCollect = ship.alive && !ship.hidden && !state.transition;
    state.ores.forEach(ore => {
        ore.life -= dt;
        if(ore.life <= 0) ore.dead = true;
        if(ore.eject > 0) ore.eject -= dt;
        ore.tractored = false;
        if(canCollect && ore.eject <= 0) {
            const dx = ship.x - ore.x, dy = ship.y - ore.y, dz = ship.z - ore.z;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            if(ship.shieldUp && ship.shieldContact(new T.Vector3(ore.x, ore.y, ore.z), 2)) {
                // Ore burns up on raised shields.
                ore.dead = true;
                ship.shield = Math.max(0, ship.shield - 0.25);
                effects.burst(new T.Vector3(ore.x, ore.y, ore.z), ship.velocity, 5, { minSpeed: 20, maxSpeed: 80, minLife: 0.15, maxLife: 0.4, size: 3, color: ship.hullDef.shieldColor || '120,210,255' });
                sounds.shieldHit(0.3);
            } else if(!ship.shieldUp && d < ship.magnetRange) {
                tractored++;
                ore.tractored = true;
                const pull = 260 + (1 - d / ship.magnetRange) * 500;
                ore.vx += (dx / d * pull + (ship.vx - ore.vx) * 3) * dt;
                ore.vy += (dy / d * pull + (ship.vy - ore.vy) * 3) * dt;
                ore.vz += (dz / d * pull + (ship.vz - ore.vz) * 3) * dt;
                if(d < ship.collectRadius) {
                    if(storeOre(ore.material, ship.cargoCapacity)) {
                        ore.dead = true;
                        sounds.pickup(MATERIALS[ore.material].price);
                        floatText(ore, '+' + MATERIALS[ore.material].name, MATERIALS[ore.material].color);
                    } else if(!state.holdFullWarned) {
                        state.holdFullWarned = true;
                        banner('Cargo hold full: sell at Atlantis');
                    }
                }
            }
        }
        ore.x += ore.vx * dt; ore.y += ore.vy * dt; ore.z += ore.vz * dt;
        ore.angle += ore.spin * dt;
    });
    if(cargoUsed() < ship.cargoCapacity) state.holdFullWarned = false;
    state.tractorCount = tractored;
    state.ores = state.ores.filter(o => !o.dead);
};

// ------------------------------------------------------------ combat

const updateBullets = (dt) => {
    const combat = state.combat;
    state.bullets.forEach(b => {
        if(b.dead) return;
        const ax = b.x, ay = b.y, az = b.z;
        b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
        b.age += dt;
        b.life -= dt;
        if(b.life <= 0) {
            b.dead = true;
            return;
        }
        // Hostile ships first.
        const targets = combat.hostileShips(b.side);
        const p = new T.Vector3(b.x, b.y, b.z);
        for(let i = 0; i < targets.length; i++) {
            const ship = targets[i];
            const hit = shipHit(ship, p, b.kind === 'plasma' ? Math.max(8, (b.splash || 30) * 0.4) : 3);
            if(!hit) continue;
            b.dead = true;
            ship.takeDamage(b.damage * SHIP_DAMAGE[b.kind], DAMAGE_TYPE[b.kind]);
            const dir = new T.Vector3(b.vx, b.vy, b.vz).normalize();
            ship.velocity.addScaledVector(dir, b.mass * 6 / ship.stats.mass);
            effects.burst(p, ship.velocity, b.kind === 'plasma' ? 16 : 5, { minSpeed: 40, maxSpeed: b.kind === 'plasma' ? 220 : 160, minLife: 0.15, maxLife: 0.45, size: b.kind === 'plasma' ? 4 : 2.2,
                color: hit.shield ? (ship.hullDef.shieldColor || '120,210,255') : (b.kind === 'plasma' ? '255,170,60' : '255,220,160'), drag: 0.8 });
            if(b.kind === 'plasma') sounds.plasmaImpact();
            return;
        }
        // Asteroids (swept, so fast rounds don't skip through small rocks).
        for(let i = 0; i < state.rocks.length; i++) {
            const rock = state.rocks[i];
            if(rock.dead) continue;
            const r = rock.radius * 0.85;
            if(Math.abs(rock.x - b.x) > r + 30 || Math.abs(rock.y - b.y) > r + 30 || Math.abs(rock.z - b.z) > r + 30) continue;
            const t = segmentSphere(ax, ay, az, b.x, b.y, b.z, rock.x, rock.y, rock.z, r);
            if(t < 0) continue;
            b.dead = true;
            const hp = new T.Vector3(ax + (b.x - ax) * t, ay + (b.y - ay) * t, az + (b.z - az) * t);
            const dir = new T.Vector3(b.vx, b.vy, b.vz).normalize();
            const kick = Math.min(20, 1100 * b.mass / rock.mass);
            rock.vx += dir.x * kick; rock.vy += dir.y * kick; rock.vz += dir.z * kick;
            hitRock(rock, b.damage, hp, dir, b.kind);
            if(b.kind === 'plasma') {
                state.rocks.forEach(other => {
                    if(other === rock || other.dead) return;
                    if(dist(other, hp) < (b.splash || 30) + other.radius) hitRock(other, b.damage * 0.5, hp, dir, 'plasma');
                });
            }
            return;
        }
        // Kinetic rounds can shoot down missiles (never drones).
        if(b.kind === 'bullet') {
            const incoming = combat.hostileMissiles(b.side, 'missile');
            for(let i = 0; i < incoming.length; i++) {
                const m = incoming[i];
                if(m.dead) continue;
                if(segmentSphere(ax, ay, az, b.x, b.y, b.z, m.x, m.y, m.z, 12) < 0) continue;
                b.dead = true;
                m.damage *= 0.3;
                detonate(m);
                return;
            }
        }
    });
    state.bullets = state.bullets.filter(b => !b.dead);
};

const MISSILE_PROFILE = {
    missile: { accel: 560, max: 680, trail: '255,150,70' },
    drone: { accel: 950, max: 820, trail: '255,220,120' }
};

const updateMissiles = (dt) => {
    const combat = state.combat;
    state.missiles.forEach(m => {
        if(m.dead) return;
        m.life -= dt;
        if(m.life <= 0) {
            detonate(m);
            return;
        }
        const profile = MISSILE_PROFILE[m.kind];
        // Targets: drones hunt hostile drones first; then ships (unless set to asteroids).
        m.retarget = (m.retarget || 0) - dt;
        if(m.homing > 0 && (m.retarget <= 0 || !m.target || m.target.dead)) {
            m.retarget = 0.25;
            const near = (list, range) => {
                let best = null;
                let bestD = range;
                list.forEach(o => {
                    if(o.dead) return;
                    const d = dist(o, m);
                    if(d < bestD) { bestD = d; best = o; }
                });
                return best;
            };
            const drone = m.kind === 'drone' ? near(combat.hostileMissiles(m.side, 'drone'), 1000) : null;
            if(drone) m.target = drone;
            else if(!m.target || m.target.dead || (!m.target.hullDef && m.targetMode !== 'asteroids')) {
                const ship = m.targetMode !== 'asteroids' ? near(combat.hostileShips(m.side), 1400) : null;
                if(ship) m.target = ship;
                else if(!m.target || m.target.dead) m.target = m.targetMode !== 'ships' ? near(state.rocks, 700) : null;
            }
        }
        if(m.homing > 0 && m.target && !m.target.dead) {
            const want = new T.Vector3(m.target.x - m.x, m.target.y - m.y, m.target.z - m.z);
            const d = want.length();
            want.normalize();
            const terminal = d < 320 ? 1 + 2.5 * (1 - d / 320) : 1;
            const angle = m.dir.angleTo(want);
            const maxTurn = m.homing * terminal * dt;
            if(angle > 1e-4) {
                const axis = new T.Vector3().crossVectors(m.dir, want).normalize();
                if(axis.lengthSq() > 0) m.dir.applyAxisAngle(axis, Math.min(angle, maxTurn)).normalize();
            }
        }
        m.vx += m.dir.x * profile.accel * dt; m.vy += m.dir.y * profile.accel * dt; m.vz += m.dir.z * profile.accel * dt;
        if(m.homing > 0) {
            // Side thrust bleeds off drift so it flies where it points.
            const forward = m.vx * m.dir.x + m.vy * m.dir.y + m.vz * m.dir.z;
            const k = Math.min(1, m.homing * 0.8 * dt);
            m.vx += (m.dir.x * forward - m.vx) * k; m.vy += (m.dir.y * forward - m.vy) * k; m.vz += (m.dir.z * forward - m.vz) * k;
        }
        const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy + m.vz * m.vz);
        if(speed > profile.max) { m.vx *= profile.max / speed; m.vy *= profile.max / speed; m.vz *= profile.max / speed; }
        m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
        m.trail = (m.trail || 0) - dt;
        if(m.trail <= 0) {
            m.trail = 0.02;
            effects.spawn({ x: m.x - m.dir.x * 4, y: m.y - m.dir.y * 4, z: m.z - m.dir.z * 4, vx: m.vx * 0.15, vy: m.vy * 0.15, vz: m.vz * 0.15,
                life: 0.35, size: m.kind === 'drone' ? 4 : 5, color: profile.trail, alpha: 0.8 });
            if(m.kind === 'missile' && Math.random() < 0.5) {
                effects.spawn({ x: m.x - m.dir.x * 6, y: m.y - m.dir.y * 6, z: m.z - m.dir.z * 6, life: 1.2, size: 7, grow: 8, color: '190,185,180', alpha: 0.25 }, true);
            }
        }
        // Contact or proximity fuse.
        const p = new T.Vector3(m.x, m.y, m.z);
        const ships = combat.hostileShips(m.side);
        for(let i = 0; i < ships.length; i++) {
            if(shipHit(ships[i], p, Math.max(4, m.blast * 0.45))) {
                detonate(m);
                return;
            }
        }
        for(let i = 0; i < state.rocks.length; i++) {
            const rock = state.rocks[i];
            if(!rock.dead && dist(rock, m) < rock.radius * 0.85 + 3) {
                detonate(m);
                return;
            }
        }
        if(m.kind === 'drone') {
            const drones = combat.hostileMissiles(m.side, 'drone');
            for(let i = 0; i < drones.length; i++) {
                if(!drones[i].dead && dist(drones[i], m) < 16) {
                    detonate(m);
                    detonate(drones[i]);
                    return;
                }
            }
        }
    });
    state.missiles = state.missiles.filter(m => !m.dead);
};

// Explosion: damage to asteroids and ships of the other side, and missile blasts stop
// missiles, drone blasts stop drones.
const detonate = (m) => {
    if(m.handled) return;
    m.handled = true;
    m.dead = true;
    const p = new T.Vector3(m.x, m.y, m.z);
    const drone = m.kind === 'drone';
    effects.explosion(p, new T.Vector3(m.vx * 0.1, m.vy * 0.1, m.vz * 0.1), m.blast, drone ? '255,220,140' : '255,170,90');
    if(drone) sounds.droneImpact();
    else sounds.missileExplosion();
    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const d = dist(rock, p);
        const reach = m.blast + rock.radius;
        if(d > reach) return;
        const falloff = 1 - d / reach;
        const dir = new T.Vector3(rock.x - p.x, rock.y - p.y, rock.z - p.z).normalize();
        const push = Math.min(50, 60000 * falloff / rock.mass);
        rock.vx += dir.x * push; rock.vy += dir.y * push; rock.vz += dir.z * push;
        hitRock(rock, m.damage * (0.35 + 0.65 * falloff), new T.Vector3(rock.x, rock.y, rock.z).addScaledVector(dir, -rock.radius * 0.8), dir, m.kind);
    });
    const type = DAMAGE_TYPE[m.kind];
    state.combat.hostileShips(m.side).forEach(ship => {
        const d = dist(ship, p);
        const reach = m.blast + ship.radius * 0.8;
        if(d > reach) return;
        const falloff = 1 - d / reach;
        ship.takeDamage(m.damage * SHIP_DAMAGE[m.kind] * (0.4 + 0.6 * falloff), type);
        const dir = new T.Vector3(ship.x - p.x, ship.y - p.y, ship.z - p.z).normalize();
        ship.velocity.addScaledVector(dir, Math.min(40, 24000 * falloff / ship.mass));
    });
    state.combat.hostileMissiles(m.side, m.kind).forEach(other => {
        if(other.dead || dist(other, p) > m.blast * 1.1) return;
        other.damage *= 0.3;
        detonate(other);
    });
};

const applyBeamHits = () => {
    state.beamHits.forEach(h => {
        if(h.object.hullDef) {
            h.object.takeDamage(h.damage * SHIP_DAMAGE.beam, 'energy', true);
        } else {
            h.object.vx += h.dir.x * 0.4; h.object.vy += h.dir.y * 0.4; h.object.vz += h.dir.z * 0.4;
            hitRock(h.object, h.damage, h.point, h.dir, 'beam');
        }
        if(Math.random() < 0.4) effects.burst(h.point, null, 1, { minSpeed: 40, maxSpeed: 160, minLife: 0.15, maxLife: 0.4, size: 3, color: '190,230,255' });
        if(Math.random() < 0.3) sounds.beamImpact();
    });
    state.beamHits = [];
};

// Ships against asteroids (shield bubble or hull), and against each other.
const collide = (ship) => {
    if(!ship.alive || ship.hidden) return;
    state.rocks.forEach(rock => {
        if(rock.dead || rock.grace > 0) return;
        const d = dist(ship, rock);
        if(d > ship.radius * 1.6 + rock.radius) return;
        const rp = new T.Vector3(rock.x, rock.y, rock.z);
        let normal = null;
        let overlap = 0;
        if(ship.shieldUp) {
            const c = ship.shieldContact(rp, rock.radius * 0.8);
            if(c) { normal = c.normal; overlap = c.overlap; }
        } else {
            const colliders = ship.worldColliders();
            for(let i = 0; i < colliders.length; i++) {
                const cd = colliders[i].p.distanceTo(rp);
                const o = colliders[i].r + rock.radius * 0.8 - cd;
                if(o > 0) {
                    normal = rp.clone().sub(colliders[i].p).normalize();
                    overlap = o;
                    break;
                }
            }
        }
        if(!normal) return;
        // Push apart and bounce (by mass).
        const inv1 = 1 / ship.mass, inv2 = 1 / rock.mass;
        const total = inv1 + inv2;
        ship.position.addScaledVector(normal, -overlap * inv1 / total);
        rock.x += normal.x * overlap * inv2 / total; rock.y += normal.y * overlap * inv2 / total; rock.z += normal.z * overlap * inv2 / total;
        const rel = (rock.vx - ship.vx) * normal.x + (rock.vy - ship.vy) * normal.y + (rock.vz - ship.vz) * normal.z;
        if(rel >= 0) return;
        const impulse = -1.3 * rel / total;
        ship.velocity.addScaledVector(normal, -impulse * inv1);
        rock.vx += normal.x * impulse * inv2; rock.vy += normal.y * impulse * inv2; rock.vz += normal.z * impulse * inv2;
        if(-rel > 20) {
            ship.takeDamage(3 + (-rel) * rock.mass / 60000);
            effects.burst(rp.clone().addScaledVector(normal, -rock.radius * 0.8), ship.velocity, 8, { minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2.5, color: ship.shieldUp ? (ship.hullDef.shieldColor || '120,210,255') : '255,200,140' });
            if(!ship.shieldUp) sounds.explosion(0.5);
        }
    });
};

const shipBumps = () => {
    const ships = state.combat.player.concat(state.combat.enemies);
    for(let i = 0; i < ships.length; i++) {
        for(let j = i + 1; j < ships.length; j++) {
            const a = ships[i], b = ships[j];
            const n = b.position.clone().sub(a.position);
            const d = n.length() || 0.001;
            const overlap = (a.radius + b.radius) * 0.7 - d;
            if(overlap <= 0) continue;
            n.divideScalar(d);
            const total = 1 / a.mass + 1 / b.mass;
            a.position.addScaledVector(n, -overlap * (1 / a.mass) / total);
            b.position.addScaledVector(n, overlap * (1 / b.mass) / total);
            const rel = b.velocity.clone().sub(a.velocity).dot(n);
            if(rel < 0) {
                const impulse = -1.3 * rel / total;
                a.velocity.addScaledVector(n, -impulse / a.mass);
                b.velocity.addScaledVector(n, impulse / b.mass);
            }
        }
    }
};

// ------------------------------------------------------------ enemies

const spawnEnemy = (hullId, level, near) => {
    const ship = state.ship;
    for(let attempt = 0; attempt < 12; attempt++) {
        const dir = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, (Math.random() - 0.5) * 0.6).normalize();
        const p = ship.position.clone().addScaledVector(dir, near ? 800 + Math.random() * 300 : 2200 + Math.random() * 700);
        if(state.stationPos && p.distanceTo(state.stationPos) < 3200 && !near) continue;
        const id = hullId || pickEnemyHull(state.system.id);
        const enemy = createEnemy3D(T, id, level || (Math.random() < 0.35 ? 3 : 2), p, effects.texture);
        enemy.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), ship.position.clone().sub(p).normalize());
        state.enemies.push(enemy);
        scene.add(enemy.group);
        if(id === 'glider' && !hullId) {
            const wing = createEnemy3D(T, 'glider', enemy.level, p.clone().add(new T.Vector3(80, 60, 40)), effects.texture);
            wing.quaternion.copy(enemy.quaternion);
            state.enemies.push(wing);
            scene.add(wing.group);
        }
        banner('Hostile ' + enemy.hullDef.name + (id === 'glider' && !hullId ? ' pair' : '') + ' detected (Mk ' + (enemy.level === 3 ? 'III' : 'II') + ')', 2.5);
        sounds.scanPing();
        return enemy;
    }
    return null;
};

const updateEnemies = (dt) => {
    const ship = state.ship;
    if(!state.transition) {
        state.enemyTimer -= dt;
        if(state.enemyTimer <= 0) {
            state.enemyTimer = 35 + Math.random() * 35;
            if(state.enemies.length < enemyConfig(state.system.id).max) spawnEnemy();
        }
    }
    const target = state.combat.player[0] || null;
    const avoid = state.stationPos ? { position: state.stationPos, radius: STATION.shieldRadius + 260 } : null;
    state.enemies.forEach(enemy => {
        const inRange = target && enemy.position.distanceTo(ship.position) < 4000;
        updateEnemyAI3D(T, enemy, dt, { target: inRange ? target : null, rocks: state.rocks, incoming: state.combat.missiles.player,
            friends: state.combat.enemies, avoid: avoid });
        enemy.update(dt, enemy.ai.controls, world());
    });
};

const updateEnemyLosses = () => {
    state.enemies.forEach(enemy => {
        if(enemy.alive || enemy.counted) return;
        enemy.counted = true;
        addCredits(enemy.bounty);
        floatText(enemy, '+' + enemy.bounty + ' cr', '255,215,120');
        banner(enemy.hullDef.name + ' destroyed  +' + enemy.bounty + ' credits', 2.2);
        effects.explosion(enemy.position, enemy.velocity, enemy.radius * 2.2, '255,180,110');
        sounds.missileExplosion();
        scene.remove(enemy.group);
    });
    state.enemies = state.enemies.filter(e => {
        if(!e.alive) return false;
        if(e.position.distanceTo(state.ship.position) > 8000) {
            scene.remove(e.group);
            return false;
        }
        return true;
    });
};

// What ships see of the world when they update.
const world = () => ({
    combat: state.combat, rocks: state.rocks, bullets: state.bullets, missiles: state.missiles,
    beamHits: state.beamHits, effects: effects, raycast: raycast
});

// ------------------------------------------------------------ places

const stationDistance = () => (state.stationPos ? state.ship.position.distanceTo(state.stationPos) : Infinity);

const interact = () => {
    const ship = state.ship;
    if(state.canDock) {
        if(ship.velocity.length() > STATION.maxDockSpeed) banner('Too fast to dock: slow down (X stabilizer)');
        else dock();
        return;
    }
    if(state.nearDHD) openDHD();
};

const dock = () => {
    const ship = state.ship;
    state.paused = true;
    state.docked = true;
    freeze(true);
    ship.velocity.set(0, 0, 0);
    ship.angular.set(0, 0, 0);
    sounds.dock();
    getShipyard().open({
        tab: cargoUsed() > 0 ? 'market' : 'ship',
        closeLabel: 'Undock',
        canTrade: true,
        hullStatus: () => ({ hp: ship.hp, max: Math.round(ship.maxHull) }),
        repair: (points) => { ship.hp = Math.min(ship.maxHull, ship.hp + points); },
        onClose: () => {
            if(!state) return;
            scene.remove(ship.group);
            ship.applyStats(computeShipStats(getProfile().hull));
            scene.add(ship.group);
            ship.shield = ship.maxShield;
            ship.immunity = 1.5;
            ship.position.set(STATION.x + 520, STATION.y, 60);
            ship.quaternion.identity();
            state.paused = false;
            state.docked = false;
            freeze(false);
            banner('Undocked', 1.2);
        }
    });
};

const openDHD = () => {
    const gate = state.gate;
    state.paused = true;
    freeze(true);
    getDHD().open({
        systemId: state.system.id,
        systemName: state.system.name,
        originIndex: SYSTEMS.indexOf(state.system),
        originName: state.system.origin,
        busy: gate.busy,
        onDial: (target, symbols) => {
            gate.dial(target.id, symbols);
            banner('Dialling ' + target.name + '...', 2.5);
        },
        onCancel: () => {
            gate.close();
            banner('Stargate shut down', 1.5);
        },
        onClose: () => {
            if(!state) return;
            state.paused = false;
            freeze(false);
        }
    });
};

const openStarmap = () => {
    if(!state || state.transition || state.docked || isDHDOpen() || isStarmapOpen()) return;
    state.paused = true;
    freeze(true);
    let engageTarget = null;
    getStarmap().open({
        systemId: state.system.id,
        originIndex: SYSTEMS.indexOf(state.system),
        hyperdrive: state.ship.hyperdrive,
        onEngage: (target) => { engageTarget = target; },
        onClose: () => {
            if(!state) return;
            state.paused = false;
            freeze(false);
            if(engageTarget) startHyperjump(engageTarget);
        }
    });
};

const startHyperjump = (target) => {
    const ship = state.ship;
    const distance = distanceBetween(state.system.id, target.id);
    const duration = hyperTravelTime(distance, ship.hyperdrive.speed);
    state.transition = { type: 'hyper', phase: 'window', t: 0, target: target, duration: duration, distance: distance,
        window: ship.position.clone().addScaledVector(ship.forward(), ship.radius * 3 + 150) };
    sounds.hyperOpen();
    banner('Hyperdrive engaged: ' + target.name, 2);
};

const startGateTravel = () => {
    state.transition = { type: 'gate', phase: 'tunnel', t: 0, target: systemById(state.gate.target) };
    sounds.gateEnter();
    sounds.stopAll();
    state.gate.close(true);
    sounds.wormhole();
    state.ship.hidden = true;
};

const updateTransition = (dt) => {
    const tr = state.transition;
    const ship = state.ship;
    tr.t += dt;
    if(tr.type === 'gate') {
        if(tr.t >= 3.4) {
            ship.hidden = false;
            state.transition = null;
            enterSystem(tr.target, 'gate');
            sounds.startEngine();
            sounds.gateArrive();
            sounds.horizon(true);
        }
        return tr.t < 3.4;
    }
    // Hyperspace: a window opens ahead, the ship is pulled in, then the tunnel.
    if(tr.phase === 'window') {
        const glow = Math.min(1, tr.t);
        for(let i = 0; i < 3; i++) {
            effects.spawn({ x: tr.window.x + (Math.random() - 0.5) * 120 * glow, y: tr.window.y + (Math.random() - 0.5) * 120 * glow, z: tr.window.z + (Math.random() - 0.5) * 120 * glow,
                life: 0.4, size: 60 + 120 * glow, color: Math.random() < 0.5 ? '170,225,235' : '220,245,250', alpha: 0.25 });
        }
        if(tr.t > 1) {
            const pull = tr.window.clone().sub(ship.position);
            ship.velocity.addScaledVector(pull.normalize(), 900 * dt);
            if(ship.position.distanceTo(tr.window) < ship.radius + 40 || tr.t > 3) {
                tr.phase = 'travel';
                tr.t = 0;
                ship.hidden = true;
                sounds.hyperTravel(true);
            }
        }
        return false;
    }
    if(tr.phase === 'travel' && tr.t >= tr.duration) {
        sounds.hyperTravel(false);
        sounds.hyperExit();
        ship.hidden = false;
        state.transition = null;
        enterSystem(tr.target, 'hyper');
        return false;
    }
    return tr.phase === 'travel';
};

// The ship passing through an open, outgoing event horizon.
const checkGateTravel = (prevZ) => {
    const gate = state.gate;
    const ship = state.ship;
    if(state.transition || !ship.alive || !gate.isOpen || !gate.outgoing) return;
    const planeZ = state.gatePos.z - 9;
    if((prevZ - planeZ) * (ship.z - planeZ) > 0) return;
    const dx = ship.x - state.gatePos.x, dy = ship.y - state.gatePos.y;
    if(Math.sqrt(dx * dx + dy * dy) > GATE_INNER * 0.85) return;
    if(ship.radius > GATE_INNER * 0.95) {
        banner('Ship too large for the Stargate: use a hyperdrive.', 2.5);
        return;
    }
    startGateTravel();
};

// ------------------------------------------------------------ loop

const step = (dt) => {
    const ship = state.ship;
    state.time += dt;
    state.combat.refresh();
    const prevZ = ship.z;
    if(!state.transition || state.transition.type === 'hyper') {
        playerControls();
        if(state.transition) {
            state.controls.fire = state.controls.missiles = false;
            state.controls.thrust = 0;
        }
        ship.update(dt, state.controls, world());
    }
    updateEnemies(dt);
    applyBeamHits();
    state.rocks.forEach(r => r.update(dt));
    updateBullets(dt);
    updateMissiles(dt);
    updateOres(dt);
    state.combat.refresh();
    collide(ship);
    state.enemies.forEach(e => collide(e));
    shipBumps();
    updateEnemyLosses();
    // Atlantis city shield keeps asteroids out.
    if(state.stationPos) {
        state.rocks.forEach(r => {
            const d = dist(r, state.stationPos);
            const R = STATION.shieldRadius + 60 + r.radius;
            if(d < R) {
                const n = new T.Vector3(r.x, r.y, r.z).sub(state.stationPos).normalize();
                r.x = state.stationPos.x + n.x * R; r.y = state.stationPos.y + n.y * R; r.z = state.stationPos.z + n.z * R;
                const vn = r.vx * n.x + r.vy * n.y + r.vz * n.z;
                if(vn < 0) { r.vx -= 1.6 * vn * n.x; r.vy -= 1.6 * vn * n.y; r.vz -= 1.6 * vn * n.z; }
            }
        });
    }
    state.rocks = state.rocks.filter(r => !r.dead);
    state.gate.update(dt);
    checkGateTravel(prevZ);
    state.fieldTimer -= dt;
    if(state.fieldTimer <= 0) {
        state.fieldTimer = 0.5;
        state.rocks = state.field.update(ship.x, ship.y, ship.z, state.rocks);
        state.ores = state.ores.filter(o => dist(o, ship) < 6000);
    }
    state.canDock = !!state.stationPos && ship.alive && stationDistance() < STATION.dockRadius;
    state.nearDHD = ship.alive && ship.position.distanceTo(state.dhdPos) < DHD_RANGE * 1.4;
    state.floats.forEach(f => { f.life -= dt; f.p.z += 20 * dt; });
    state.floats = state.floats.filter(f => f.life > 0);
    if(state.bannerTimer > 0) state.bannerTimer -= dt;
    if(!ship.alive) {
        if(state.gameOverTimer === 0) effects.explosion(ship.position, ship.velocity, ship.radius * 2.5, '255,180,110');
        state.gameOverTimer += dt;
    }
};

const updateCamera = (dt) => {
    const ship = state.ship;
    const back = ship.radius * 3.2 + 60;
    const k = state.cameraDistance;
    const forward = ship.forward();
    const up = ship.up();
    const want = ship.position.clone().addScaledVector(forward, -back * k).addScaledVector(up, (ship.radius * 0.85 + 18) * k);
    const look = ship.position.clone().addScaledVector(forward, ship.radius * 4 + 200);
    const follow = 1 - Math.exp(-dt * 7);
    camera.position.lerp(want, state.cameraSnap ? 1 : follow);
    const m = new T.Matrix4().lookAt(camera.position, look, up);
    const q = new T.Quaternion().setFromRotationMatrix(m);
    if(state.cameraSnap) camera.quaternion.copy(q);
    else camera.quaternion.slerp(q, 1 - Math.exp(-dt * 9));
    state.cameraSnap = false;
    sky.position.copy(camera.position);
};

const project = (p) => {
    const v = new T.Vector3(p.x, p.y, p.z);
    const toP = v.clone().sub(camera.position);
    const camDir = new T.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const behind = toP.dot(camDir) < 0;
    v.project(camera);
    return { x: (v.x + 1) / 2 * width, y: (1 - v.y) / 2 * height, behind: behind };
};

// Screen size of a sphere of radius r at p.
const screenSize = (p, r) => {
    const d = Math.max(1, camera.position.distanceTo(new T.Vector3(p.x, p.y, p.z)));
    return r / (d * Math.tan(FOV * Math.PI / 360)) * height / 2;
};

const render = (frameDt) => {
    const ship = state.ship;
    updateCamera(frameDt);
    ship.syncModel();
    state.enemies.forEach(e => e.syncModel());

    // Plasma bolts and missile heads glow; beams and tractor lines.
    state.bullets.forEach(b => {
        if(b.kind !== 'plasma') return;
        effects.spawn({ x: b.x, y: b.y, z: b.z, life: 0.04, size: 20, color: '255,150,50', alpha: 0.9 });
        effects.spawn({ x: b.x, y: b.y, z: b.z, life: 0.25, size: 9, color: '255,200,110', alpha: 0.6, vx: b.vx * 0.05, vy: b.vy * 0.05, vz: b.vz * 0.05 });
    });
    state.missiles.forEach(m => {
        effects.spawn({ x: m.x, y: m.y, z: m.z, life: 0.04, size: m.kind === 'drone' ? 14 : 9, color: m.kind === 'drone' ? '255,210,100' : '255,240,220', alpha: 1 });
    });
    // Engine exhaust.
    [ship].concat(state.enemies).forEach(s => {
        if(!s.alive || s.hidden || s.thrustLevel < 0.1 || Math.random() > 0.6) return;
        const back = s.forward().multiplyScalar(-1);
        s.hullDef.engines.forEach(e => {
            const p = s.localToWorld(new T.Vector3(e.x - 2 * e.size, -e.y, s.radius * 0.08));
            effects.spawn({ x: p.x, y: p.y, z: p.z, vx: s.vx + back.x * 120, vy: s.vy + back.y * 120, vz: s.vz + back.z * 120,
                life: 0.25 + Math.random() * 0.2, size: 5 * e.size * s.thrustLevel + 2, color: s.hullDef.exhaust || '255,150,60', alpha: 0.6 });
        });
    });
    const P = beamLines.geometry.attributes.position.array;
    const C = beamLines.geometry.attributes.color.array;
    let n = 0;
    [ship].concat(state.enemies).forEach(s => {
        s.turrets.forEach(t => {
            if(!t.beam || n >= MAX_BEAMS) return;
            P.set([t.beam.from.x, t.beam.from.y, t.beam.from.z, t.beam.to.x, t.beam.to.y, t.beam.to.z], n * 6);
            C.set([0.6, 0.85, 1, 0.9, 0.97, 1], n * 6);
            n++;
            // Glowing energy along the beam.
            const steps = Math.min(30, Math.ceil(t.beam.from.distanceTo(t.beam.to) / 30));
            for(let i = 0; i <= steps; i++) {
                const k = i / steps;
                effects.spawn({ x: t.beam.from.x + (t.beam.to.x - t.beam.from.x) * k, y: t.beam.from.y + (t.beam.to.y - t.beam.from.y) * k,
                    z: t.beam.from.z + (t.beam.to.z - t.beam.from.z) * k, life: 0.03, size: 10, color: '120,190,255', alpha: 0.7 });
            }
        });
    });
    if(ship.alive && state.tractorCount) {
        const p = ship.position;
        state.ores.forEach(o => {
            if(!o.tractored || n >= MAX_BEAMS) return;
            P.set([p.x, p.y, p.z, o.x, o.y, o.z], n * 6);
            C.set([0.1, 0.5, 0.45, 0.45, 1, 0.9], n * 6);
            n++;
        });
    }
    beamLines.geometry.setDrawRange(0, n * 2);
    beamLines.geometry.attributes.position.needsUpdate = true;
    beamLines.geometry.attributes.color.needsUpdate = true;

    effects.setTracers(state.bullets);
    effects.update(frameDt);
    rockRenderer.render(state.rocks, camera.position, VIEW_DISTANCE);
    renderOres();
    renderGate();
    if(state.planet) {
        state.planet.body.rotation.y = state.time * 0.01;
        state.planet.clouds.rotation.y = state.time * 0.016;
    }
    renderer.render(scene, camera);
    drawHud();
};

const renderOres = () => {
    let count = 0;
    const m = new T.Matrix4();
    const q = new T.Quaternion();
    const e = new T.Euler();
    const p = new T.Vector3();
    const s = new T.Vector3();
    const c = new T.Color();
    state.ores.forEach(o => {
        if(count >= ORE_LIMIT) return;
        p.set(o.x, o.y, o.z);
        e.set(o.angle * 0.7 + o.phase, o.phase, o.angle);
        q.setFromEuler(e);
        s.setScalar(o.radius * 1.5);
        m.compose(p, q, s);
        oreMesh.setMatrixAt(count, m);
        const col = MATERIALS[o.material].color.split(',');
        c.setRGB(col[0] / 255, col[1] / 255, col[2] / 255, T.SRGBColorSpace);
        oreMesh.setColorAt(count, c);
        count++;
    });
    oreMesh.count = count;
    oreMesh.instanceMatrix.needsUpdate = true;
    if(oreMesh.instanceColor) oreMesh.instanceColor.needsUpdate = true;
};

const renderGate = () => {
    const gate = state.gate;
    const model = state.gateModel;
    model.symbolRing.rotation.z = -gate.spin;
    model.chevrons.forEach((mat, i) => {
        const lit = gate.chevronLit(i);
        mat.emissive.setRGB(lit ? 1 : 0, lit ? 0.45 : 0, lit ? 0.12 : 0);
        mat.color.setRGB(lit ? 1 : 0.31, lit ? 0.55 : 0.16, lit ? 0.25 : 0.12);
    });
    const glow = gate.busy ? 1 : state.nearDHD ? 0.55 + 0.25 * Math.sin(state.time * 3) : 0.3;
    state.dhd.dome.emissive.setRGB(glow, glow * 0.25, glow * 0.12);
    const u = horizon.material.uniforms;
    u.uTime.value = state.time;
    let alpha = 0;
    let hole = 0;
    if(gate.state === 'opening') {
        alpha = 0.9;
        hole = Math.max(0, gate.timer / 0.8) * 0.95;
    } else if(gate.state === 'kawoosh') alpha = 0.95;
    else if(gate.state === 'open') alpha = 0.95;
    else if(gate.state === 'closing' && gate.wasOpen) alpha = 0.95 * Math.max(0, gate.timer / 0.9);
    u.uAlpha.value = alpha;
    u.uHole.value = hole;
    horizon.visible = alpha > 0.01;
    if(gate.state === 'kawoosh') {
        const burst = Math.sin(Math.min(1, gate.kawoosh / 0.75) * Math.PI);
        kawoosh.visible = burst > 0.02;
        kawoosh.scale.set(1 + burst * 0.4, 1 + burst * 0.4, Math.max(1, GATE_INNER * 3 * burst));
        kawoosh.material.opacity = 0.75 * burst;
    } else kawoosh.visible = false;
};

// ------------------------------------------------------------ HUD

const drawHud = () => {
    const ctx = hud;
    const ship = state.ship;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const tr = state.transition;
    if(tr && tr.type === 'gate') {
        drawWormhole(ctx, width, height, state.time, Math.min(1, tr.t / 3.4));
        updateDomHud();
        return;
    }
    if(tr && tr.type === 'hyper' && tr.phase === 'travel') {
        drawHyperspace(ctx, width, height, state.time, Math.min(1, tr.t / tr.duration),
            'Hyperspace · ' + tr.target.name + ' · ' + Math.round(tr.distance).toLocaleString('en-US') + ' ly · ' + Math.max(0, tr.duration - tr.t).toFixed(1) + ' s');
        updateDomHud();
        return;
    }

    // Markers: enemies, Atlantis, the gate and DHD.
    state.enemies.forEach(e => {
        if(!e.alive) return;
        drawMarker(ctx, width, height, { p: project(e.position), size: screenSize(e.position, e.radius) + 6, color: '255,90,70',
            label: e.hullDef.name + ' Mk ' + (e.level === 3 ? 'III' : 'II'), distance: e.position.distanceTo(ship.position),
            hull: e.hp / e.maxHull, shield: e.maxShield > 0 ? e.shield / e.maxShield : undefined });
    });
    if(state.stationPos) {
        drawMarker(ctx, width, height, { p: project(state.stationPos), size: screenSize(state.stationPos, STATION.dockRadius), color: state.canDock ? '140,255,160' : '140,200,255',
            label: 'ATLANTIS', distance: stationDistance(), shape: 'circle' });
    }
    drawMarker(ctx, width, height, { p: project(state.gatePos), size: screenSize(state.gatePos, GATE_RADIUS) + 4, color: '255,170,110',
        label: 'GATE', distance: ship.position.distanceTo(state.gatePos), shape: 'circle' });
    if(state.nearDHD || ship.position.distanceTo(state.dhdPos) < 900) {
        drawMarker(ctx, width, height, { p: project(state.dhdPos), size: screenSize(state.dhdPos, 34), color: state.nearDHD ? '140,255,160' : '200,210,230',
            label: state.nearDHD ? 'DHD · press B' : 'DHD', shape: 'circle' });
    }
    // Missile lock.
    if(ship.missileLock && !ship.missileLock.dead && ship.guidance) {
        const p = project(ship.missileLock);
        if(!p.behind) {
            ctx.save();
            ctx.strokeStyle = 'rgba(140, 255, 160, 0.9)';
            ctx.lineWidth = 1.5;
            const r = screenSize(ship.missileLock, ship.missileLock.radius || 10) + 10;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r, p.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    }
    state.floats.forEach(f => {
        const p = project(f.p);
        if(!p.behind) drawText(ctx, f.text, p.x, p.y, 12, 'rgba(' + f.color + ',' + Math.min(1, f.life) + ')');
    });

    // Radar contacts in the ship's frame.
    const inv = ship.invQuat();
    const local = (o) => new T.Vector3(o.x - ship.x, o.y - ship.y, o.z - ship.z).applyQuaternion(inv);
    const contacts = [];
    state.rocks.forEach(r => {
        if(r.radius > 35 && dist(r, ship) < 3000) contacts.push({ local: local(r), color: '150,150,160', size: r.radius > 80 ? 3 : 2 });
    });
    state.enemies.forEach(e => contacts.push({ local: local(e), color: '255,80,60', size: 3.5, triangle: true }));
    state.missiles.forEach(m => { if(m.side === 'enemy') contacts.push({ local: local(m), color: '255,160,80', size: 2 }); });
    if(state.stationPos) contacts.push({ local: local(state.stationPos), color: '140,200,255', size: 5 });
    contacts.push({ local: local(state.gatePos), color: '255,170,110', size: 4 });
    drawRadar(ctx, width, height, contacts);

    state.weaponRows = drawWeapons(ctx, width, height, ship.weaponStatus());
    // Speed and prompts.
    drawText(ctx, Math.round(ship.velocity.length()) + ' m/s' + (ship.stabilizer ? '  STAB' : ''), width / 2, height - 24, 13, 'rgba(200, 220, 255, 0.85)');
    if(state.canDock) {
        drawText(ctx, ship.velocity.length() > STATION.maxDockSpeed ? 'Slow down to dock (X: stabilizer)' : 'Press B to dock at Atlantis', width / 2, height - 60, 16, 'rgba(140, 255, 160, 0.95)');
    }
    if(tr && tr.type === 'hyper' && tr.phase === 'window') {
        const p = project(tr.window);
        if(!p.behind) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const r = screenSize(tr.window, 40 + 140 * Math.min(1, tr.t));
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            g.addColorStop(0, 'rgba(240, 252, 255, 0.95)');
            g.addColorStop(0.4, 'rgba(170, 225, 235, 0.5)');
            g.addColorStop(1, 'rgba(90, 150, 160, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
            ctx.restore();
        }
    }
    if(!state.paused && ship.alive) {
        drawNose(ctx, width, height, project(ship.position.clone().addScaledVector(ship.forward(), 2000)), Math.min(width, height) * 0.42 * STEER_DEAD_ZONE);
        drawCrosshair(ctx, mouse.x, mouse.y, !state.freeAim, !!(state.controls.aimTarget && state.controls.aimTarget.hullDef));
    }
    if(state.bannerTimer > 0) {
        drawText(ctx, state.bannerText, width / 2, height * 0.24, 22, 'rgba(255, 255, 255, ' + Math.min(1, state.bannerTimer) + ')');
    }
    updateDomHud();
};

const setText = (id, text) => {
    const el = domHud[id];
    if(el && el.textContent !== text) el.textContent = text;
};

const setBar = (id, fraction) => {
    const el = domHud[id];
    const w = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
    if(el && el.style.width !== w) el.style.width = w;
};

const updateDomHud = () => {
    const ship = state.ship;
    const used = cargoUsed();
    setText('credits', 'Credits: ' + Math.round(getProfile().credits).toLocaleString('en-US'));
    setText('location', state.system.name + (state.stationPos ? ' · Atlantis ' + (stationDistance() / 1000).toFixed(1) + 'k' : '') + ' · 3D');
    setText('fps', 'Fps: ' + Math.round(fps) + ' (3D)');
    setText('targeting', 'Stabilizer: ' + (ship.stabilizer ? 'ON' : 'OFF') + ' (X)' +
        (ship.guidance ? ' · Auto-target: ' + (ship.autoTarget ? 'ON' : 'OFF') + ' (G) · Targets: ' + TARGET_MODE_LABEL[ship.targetMode] + ' (T)' : ''));
    setBar('hullBar', ship.hp / ship.maxHull);
    setText('hullText', Math.ceil(ship.hp) + ' / ' + Math.round(ship.maxHull));
    setBar('shieldBar', ship.maxShield ? ship.shield / ship.maxShield : 0);
    setText('shieldText', ship.maxShield ? Math.ceil(ship.shield) + ' / ' + Math.round(ship.maxShield) : 'none');
    setBar('cargoBar', used / ship.cargoCapacity);
    setText('cargoText', used + ' / ' + ship.cargoCapacity);
    const sb = domHud.shieldButton;
    const label = ship.maxShield <= 0 ? 'No shields' : ship.shieldsEnabled ? (ship.shieldUp ? 'Shields: UP (H)' : 'Shields: DEPLETED') : 'Shields: DOWN (H)';
    if(sb && sb.textContent !== label) {
        sb.textContent = label;
        sb.className = 'shield-button ' + (ship.maxShield <= 0 ? 'none' : ship.shieldsEnabled ? (ship.shieldUp ? 'up' : 'depleted') : 'down');
    }
};

// ------------------------------------------------------------ game flow

const freeze = (frozen) => {
    document.body.classList.toggle('playing', !frozen);
    Object.keys(keys).forEach(k => { keys[k] = false; });
    mouse.left = mouse.right = false;
    domHud.shieldButton.style.display = !frozen ? '' : 'none';
    domHud.starmapButton.style.display = !frozen ? '' : 'none';
    domHud.cargoButton.style.display = 'none';
    if(frozen) sounds.stopAll();
    else {
        sounds.startEngine();
        lastTime = performance.now();
        accumulator = 0;
    }
};

const setPaused = (paused) => {
    state.paused = paused;
    document.getElementById('pauseMenu').style.visibility = paused ? 'visible' : 'hidden';
    freeze(paused);
};

const endGame = (message) => {
    cancelAnimationFrame(frameId);
    frameId = null;
    freeze(true);
    clearSystem();
    scene.remove(state.ship.group);
    state = null;
    renderer.domElement.style.display = 'none';
    hudCanvas.style.display = 'none';
    document.getElementById('pauseMenu').style.visibility = 'hidden';
    const menuMessage = document.getElementById('menuMessage');
    if(menuMessage) menuMessage.textContent = message || '';
    document.getElementById('menu').style.visibility = 'visible';
    if(onExit) onExit();
};

const frame = (now) => {
    let elapsed = Math.min(0.25, (now - lastTime) / 1000);
    lastTime = now;
    if(elapsed > 0) fps += (1 / elapsed - fps) * 0.05;
    try {
        let tunnel = false;
        if(state.transition && !state.paused) tunnel = updateTransition(elapsed);
        if(!state.paused) {
            accumulator += elapsed;
            let steps = 0;
            while(accumulator >= STEP && steps < MAX_STEPS) {
                step(STEP);
                accumulator -= STEP;
                steps++;
            }
            if(steps === MAX_STEPS) accumulator = 0;
            const ship = state.ship;
            sounds.setThrust(ship.alive && ship.thrusting && !tunnel);
            sounds.setFiring(ship.alive && ship.minigunFiring);
            sounds.setBeam(ship.alive && ship.beaming);
            sounds.setTractor(ship.alive && state.tractorCount > 0, Math.min(1, state.tractorCount / 6));
        } else {
            elapsed = 0;
        }
        if(glLost) {
            // Still gone after a few seconds: give up on 3D and switch to the classic game.
            if(performance.now() - glLostAt > 4000) {
                fallBackTo2D('The 3D view lost its graphics context');
                return;
            }
        } else {
            render(elapsed);
            glErrors = 0;
        }
        if(state.gameOverTimer >= GAME_OVER_DELAY) {
            loseCargo();
            endGame('Ship destroyed! The cargo was lost. Your credits and ship are safe at the shipyard.');
            return;
        }
    } catch(error) {
        if(window.console) console.error('3D frame error:', error);
        glErrors++;
        // Graphics errors that keep coming (e.g. a lost WebGL context): use the 2D game.
        if(glErrors >= 3 || (renderer.getContext().isContextLost && renderer.getContext().isContextLost())) {
            fallBackTo2D((error && error.message) || String(error));
            return;
        }
        if(state) banner('Error: ' + ((error && error.message) || error), 4);
    }
    if(state) frameId = requestAnimationFrame(frame);
};

const fallBackTo2D = (reason) => {
    if(window.console) console.warn('3D game stopped, switching to classic 2D:', reason);
    if(!state) return;
    endGame('');
    document.getElementById('menu').style.visibility = 'hidden';
    if(onFallback) onFallback();
};

// Launch the 3D game from the menu. `exit` is called when it returns to the menu.
// `fallback` starts the classic 2D game if the 3D view can't run on this browser.
export const start3D = (exit, fallback) => {
    onExit = exit || null;
    onFallback = fallback || null;
    glErrors = 0;
    if(!initialized) initialize();
    sounds.unlock();
    renderer.domElement.style.display = '';
    hudCanvas.style.display = '';
    resize();
    state = createState();
    state.system = systemById('lantea');
    enterSystem(state.system, null);
    state.cameraSnap = true;
    mouse.x = width / 2;
    mouse.y = height / 2;
    document.getElementById('pauseMenu').style.visibility = 'hidden';
    freeze(false);
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
};

// For tests and debugging.
export const game3dState = () => state;
export const game3dProject = (p) => project(p);
export const spawnEnemy3D = (hullId, level) => (state ? spawnEnemy(hullId, level, true) : null);
