// WebGL (Three.js) layer that draws the world in 3D on the graphics card.
//
// The game itself stays on a flat plane: physics, collisions and aiming are unchanged. A
// perspective camera looks straight down at that plane, so a point on the plane lands on
// exactly the same pixel as in the 2D view. That lets the 2D canvas above keep drawing
// effects (particles, shots, beams, shields, line art, HUD) perfectly lined up, while
// asteroids, ship hulls and the starfield underneath are real lit 3D geometry with depth
// and parallax.
//
// Coordinates: game (x, y) with y pointing down the screen becomes Three.js (x, -y, z) with
// z towards the camera. A game angle `a` becomes a rotation of -a about z.

import { buildAtlantis, buildGate, buildDHD, buildPlanet, buildOreCrystals, ORE_LIMIT } from './world3d';
import { gateSymbolSprite, CHEVRON_ANGLES, GATE_RADIUS, GATE_INNER } from '../world/stargate';
import { PALETTES } from '../render/planets';
import MATERIALS from '../world/materials';

const FOV = 35;
const TAN_HALF_FOV = Math.tan(FOV * Math.PI / 360);

// Same light direction the asteroid surface art is painted with (upper left), lifted up.
const LIGHT = { x: -0.55, y: 0.65, z: 0.85 };

// Checked once, and the probe context is released straight away: browsers (Safari above
// all) only allow a few live WebGL contexts and start killing them when there are more.
let webglChecked = null;
export const webglAvailable = () => {
    if(webglChecked !== null) return webglChecked;
    webglChecked = false;
    if(!window.THREE) return false;
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        webglChecked = !!gl;
        const lose = gl && gl.getExtension('WEBGL_lose_context');
        if(lose) lose.loseContext();
    } catch(e) {
        webglChecked = false;
    }
    return webglChecked;
};

const parseRgb = (text) => text.split(',').map(v => parseFloat(v) / 255);

// Small deterministic noise for lumps on the asteroid surfaces.
const hash = (a, b, seed) => {
    let h = (a * 374761393 + b * 668265263 + seed * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ------------------------------------------------------------ asteroids

// Rings of latitude for the rock body, from the bottom pole to the top pole.
const LATITUDES = [-0.82, -0.55, -0.27, 0, 0.27, 0.55, 0.82];

// A lumpy rock body built from the asteroid's own outline (so chipping, carving and splits
// show in 3D), unit radius. UVs map the asteroid's painted surface straight down onto it.
const buildRockGeometry = (THREE, rock) => {
    const shape = rock.shape;
    const n = shape.length;
    const thickness = 0.5 + hash(rock.id, 1, 7) * 0.25;
    const k = rock.spriteRadius / (2 * rock.spriteExtent);   // unit radius -> sprite UV
    const positions = [];
    const uvs = [];
    const indices = [];

    const push = (x, y, z) => {
        positions.push(x, -y, z);
        uvs.push(0.5 + x * k, 0.5 - y * k);
    };

    LATITUDES.forEach((lat, j) => {
        const phi = lat * Math.PI / 2;
        const ring = Math.cos(phi);
        const z = Math.sin(phi) * thickness;
        for(let i = 0; i < n; i++) {
            const a = i * Math.PI * 2 / n;
            const lump = 1 + (hash(rock.id, i * 16 + j, 3) - 0.5) * 0.12 * (j === 3 ? 0.3 : 1);
            const r = shape[i] * ring * lump;
            push(Math.cos(a) * r, Math.sin(a) * r, z * (0.9 + hash(rock.id, i + j * 64, 11) * 0.2));
        }
    });
    const bottom = positions.length / 3;
    push(0, 0, -thickness);
    const top = positions.length / 3;
    push(0, 0, thickness * (0.95 + hash(rock.id, 5, 5) * 0.1));

    for(let j = 0; j < LATITUDES.length - 1; j++) {
        for(let i = 0; i < n; i++) {
            const a = j * n + i;
            const b = j * n + (i + 1) % n;
            const c = (j + 1) * n + i;
            const d = (j + 1) * n + (i + 1) % n;
            indices.push(a, c, b, b, c, d);
        }
    }
    const last = (LATITUDES.length - 1) * n;
    for(let i = 0; i < n; i++) {
        indices.push(bottom, i, (i + 1) % n);
        indices.push(top, last + (i + 1) % n, last + i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
};

// ------------------------------------------------------------ ship hulls

const partPoints = (part) => {
    if(part.rect) {
        const r = part.rect;
        return [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
    }
    return part.pts;
};

const polygonArea = (pts) => {
    let area = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        area += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(area) / 2;
};

// Every closed piece of the hull's line art extruded into a solid plate, its top face on
// the game plane (where the 2D line art is drawn) and its sides going down into depth.
// Later pieces (details) sit a hair higher so they never flicker against the plates.
export const buildHullGeometries = (THREE, hull) => {
    const parts = [];
    const maxDepth = Math.max(2.5, hull.radius * 0.22);
    hull.art.forEach((part, index) => {
        const lift = index * 0.02 * Math.max(1, hull.radius / 40);
        if(part.circle) {
            const c = part.circle;
            const depth = Math.min(maxDepth, Math.max(0.8, c[2] * 0.6));
            const geometry = new THREE.CylinderGeometry(c[2], c[2], depth, 18);
            geometry.rotateX(Math.PI / 2);
            geometry.translate(c[0], -c[1], lift - depth / 2);
            parts.push(geometry);
            return;
        }
        if(!(part.closed || part.rect)) return;
        const pts = partPoints(part);
        if(pts.length < 3) return;
        const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], -p[1])));
        const area = polygonArea(pts);
        let perimeter = 0;
        for(let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            perimeter += Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
        }
        const inradius = perimeter > 0 ? 2 * area / perimeter : 1;
        const depth = Math.min(maxDepth, Math.max(0.8, Math.sqrt(area) * 0.3));
        // A rounded, inward bevel so plate edges catch the light (the outline stays exactly
        // on the line art; the bevel slopes in from it).
        const bevelSize = Math.max(0.2, Math.min(inradius * 0.45, depth * 1.1));
        const bevelThickness = depth * 0.7;
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: depth * 0.3, steps: 1, bevelEnabled: true, bevelThickness: bevelThickness,
            bevelSize: bevelSize, bevelOffset: -bevelSize, bevelSegments: 3
        });
        geometry.translate(0, 0, lift - depth * 0.3 - bevelThickness);
        parts.push(geometry);
    });
    return parts;
};

// ------------------------------------------------------------ stars

// Star layers at increasing depth below the play plane. The vertex shader wraps each star
// into a tile around the camera, so the field is endless; perspective gives the parallax.
const STAR_LAYERS = [
    { count: 900, minDepth: 400, maxDepth: 1600, tile: 5000, size: [1.2, 2.4] },
    { count: 1200, minDepth: 1600, maxDepth: 5000, tile: 11000, size: [1, 2] },
    { count: 1800, minDepth: 5000, maxDepth: 14000, tile: 24000, size: [0.8, 1.6] }
];

const STAR_VERTEX = [
    'attribute float size;',
    'attribute vec3 tint;',
    'uniform vec2 uCamera;',
    'uniform float uTile;',
    'uniform float uPixelRatio;',
    'varying vec3 vTint;',
    'void main() {',
    '    vec3 p = position;',
    '    vec2 origin = uCamera - vec2(uTile * 0.5);',
    '    p.xy = origin + mod(p.xy - origin, uTile);',
    '    vTint = tint;',
    '    gl_PointSize = size * uPixelRatio;',
    '    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
    '}'
].join('\n');

const STAR_FRAGMENT = [
    'varying vec3 vTint;',
    'void main() {',
    '    vec2 d = gl_PointCoord - vec2(0.5);',
    '    float falloff = 1.0 - smoothstep(0.15, 0.5, length(d));',
    '    gl_FragColor = vec4(vTint * falloff, falloff);',
    '}'
].join('\n');

// ------------------------------------------------------------ scene

class Scene3D {

    // `requireHardware`: refuse to start (throw) when the browser would only give us slow
    // software rendering, so the game uses its 2D view instead of crawling.
    constructor(container, requireHardware) {
        const THREE = window.THREE;
        this.THREE = THREE;
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, alpha: true,
            failIfMajorPerformanceCaveat: !!requireHardware
        });
        this.renderer.setClearColor(0x000000, 0);
        this.canvas = this.renderer.domElement;
        this.canvas.className = 'gl-layer';
        container.appendChild(this.canvas);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(FOV, 1, 10, 40000);

        this.scene.add(new THREE.AmbientLight(0x8a96b0, 0.45));
        this.scene.add(new THREE.HemisphereLight(0xb8c8e8, 0x1a1c24, 0.55));
        const sun = new THREE.DirectionalLight(0xfff0dc, 3.4);
        sun.position.set(LIGHT.x, LIGHT.y, LIGHT.z);
        this.scene.add(sun);
        this.scene.add(sun.target);
        // A faint cool rim light from the opposite side so dark faces keep some shape.
        const rim = new THREE.DirectionalLight(0x6f8cff, 0.6);
        rim.position.set(-LIGHT.x, -LIGHT.y, 0.3);
        this.scene.add(rim);

        this.rockEntries = new Map();
        this.shipEntries = new Map();
        this.hullCache = {};
        this.buildStars();
        this.ores = buildOreCrystals(THREE);
        this.scene.add(this.ores);
        this.oreMatrix = new THREE.Matrix4();
        this.oreQuat = new THREE.Quaternion();
        this.oreEuler = new THREE.Euler();
        this.oreColor = new THREE.Color();
        this.oreScale = new THREE.Vector3();
        this.orePos = new THREE.Vector3();
        this.visible = true;
    }

    // ------------------------------------------------------------ scenery

    // Atlantis, the gate, the DHD and the planet belong to the current star system.
    syncSystem(view) {
        const THREE = this.THREE;
        if(this.systemId === view.system.id && this.gateRef === view.gate) return;
        this.systemId = view.system.id;
        this.gateRef = view.gate;
        ['stationGroup', 'gateGroup', 'dhdGroup', 'planetHolder'].forEach(key => {
            if(this[key]) {
                this.scene.remove(this[key]);
                this[key] = null;
            }
        });
        if(this.planet) {
            this.planet.textures.map.dispose();
            this.planet.textures.clouds.dispose();
            this.planet = null;
        }
        if(view.station) {
            if(!this.atlantis) this.atlantis = buildAtlantis(THREE, view.station);
            this.stationGroup = this.atlantis;
            this.scene.add(this.stationGroup);
        }
        if(!this.gateModel) {
            this.gateModel = buildGate(THREE, GATE_RADIUS, GATE_INNER, gateSymbolSprite(), CHEVRON_ANGLES);
            this.dhdModel = buildDHD(THREE);
        }
        this.gateGroup = this.gateModel.group;
        this.gateGroup.position.set(view.gate.x, -view.gate.y, 0);
        this.scene.add(this.gateGroup);
        const dhd = view.gate.dhd;
        this.dhdGroup = this.dhdModel.group;
        this.dhdGroup.position.set(dhd.x, -dhd.y, 0);
        this.scene.add(this.dhdGroup);
        const palette = PALETTES[view.system.planet.type] || PALETTES.rocky;
        this.planet = buildPlanet(THREE, view.system, palette);
        this.planetHolder = this.planet.holder;
        this.scene.add(this.planetHolder);
    }

    syncScenery(view) {
        this.syncSystem(view);
        const gate = view.gate;
        if(this.stationGroup) this.stationGroup.visible = view.isVisible(view.station.x, view.station.y, 520);
        const gateOn = view.isVisible(gate.x, gate.y, 320);
        this.gateGroup.visible = gateOn;
        this.dhdGroup.visible = gateOn;
        if(gateOn) {
            this.gateModel.symbolRing.rotation.z = -gate.spin;
            this.gateModel.chevrons.forEach((material, i) => {
                const lit = gate.chevronLit(i);
                material.emissive.setRGB(lit ? 1 : 0, lit ? 0.45 : 0, lit ? 0.12 : 0);
                material.color.setRGB(lit ? 1 : 0.31, lit ? 0.55 : 0.16, lit ? 0.25 : 0.12);
            });
            const glow = gate.busy ? 1 : view.nearDHD ? 0.55 + 0.25 * Math.sin(view.time * 3) : 0.3;
            this.dhdModel.dome.emissive.setRGB(glow, glow * 0.25, glow * 0.12);
        }
        // Slow planet spin and drifting clouds.
        if(this.planet) {
            this.planet.body.rotation.y = view.time * 0.01;
            this.planet.clouds.rotation.y = view.time * 0.016;
        }
    }

    // ------------------------------------------------------------ ore

    syncOres(ores, isVisible) {
        const mesh = this.ores;
        let count = 0;
        for(let i = 0; i < ores.length && count < ORE_LIMIT; i++) {
            const ore = ores[i];
            if(ore.dead || !isVisible(ore.x, ore.y, 10)) continue;
            const size = ore.radius * 1.35;
            this.orePos.set(ore.x, -ore.y, 1);
            this.oreEuler.set(ore.angle * 0.7 + ore.phase, ore.phase, -ore.angle);
            this.oreQuat.setFromEuler(this.oreEuler);
            this.oreScale.set(size, size, size);
            this.oreMatrix.compose(this.orePos, this.oreQuat, this.oreScale);
            mesh.setMatrixAt(count, this.oreMatrix);
            const color = (MATERIALS[ore.material] || MATERIALS.rock).color.split(',');
            this.oreColor.setRGB(color[0] / 255, color[1] / 255, color[2] / 255, this.THREE.SRGBColorSpace);
            mesh.setColorAt(count, this.oreColor);
            count++;
        }
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
        if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    buildStars() {
        const THREE = this.THREE;
        this.starMaterials = [];
        STAR_LAYERS.forEach(layer => {
            const positions = new Float32Array(layer.count * 3);
            const sizes = new Float32Array(layer.count);
            const tints = new Float32Array(layer.count * 3);
            for(let i = 0; i < layer.count; i++) {
                positions[i * 3] = Math.random() * layer.tile;
                positions[i * 3 + 1] = Math.random() * layer.tile;
                positions[i * 3 + 2] = -(layer.minDepth + Math.random() * (layer.maxDepth - layer.minDepth));
                sizes[i] = layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]);
                const warm = Math.random();
                const b = 0.5 + Math.random() * 0.5;
                tints[i * 3] = b * (warm < 0.2 ? 1 : 0.85);
                tints[i * 3 + 1] = b * 0.9;
                tints[i * 3 + 2] = b * (warm > 0.7 ? 1 : 0.9);
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            geometry.setAttribute('tint', new THREE.BufferAttribute(tints, 3));
            const material = new THREE.ShaderMaterial({
                uniforms: { uCamera: { value: new THREE.Vector2() }, uTile: { value: layer.tile }, uPixelRatio: { value: 1 } },
                vertexShader: STAR_VERTEX,
                fragmentShader: STAR_FRAGMENT,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const points = new THREE.Points(geometry, material);
            points.frustumCulled = false;
            this.scene.add(points);
            this.starMaterials.push(material);
        });
    }

    resize(width, height, pixelRatio) {
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(width, height, false);
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.width = width;
        this.height = height;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.starMaterials.forEach(m => { m.uniforms.uPixelRatio.value = pixelRatio; });
    }

    setVisible(visible) {
        if(this.visible === visible) return;
        this.visible = visible;
        this.canvas.style.display = visible ? '' : 'none';
    }

    // Camera straight above (cx, cy) at the height where the game plane appears at `zoom`
    // screen pixels per world unit.
    placeCamera(cx, cy, zoom) {
        const height = (this.height / 2) / (zoom * TAN_HALF_FOV);
        const camera = this.camera;
        camera.position.set(cx, -cy, height);
        camera.lookAt(cx, -cy, 0);
        camera.near = Math.max(5, height * 0.3);
        camera.far = height + 16000;
        camera.updateProjectionMatrix();
        this.starMaterials.forEach(m => { m.uniforms.uCamera.value.set(cx, -cy); });
    }

    // ------------------------------------------------------------ asteroids

    syncRocks(rocks, isVisible) {
        const THREE = this.THREE;
        const seen = new Set();
        rocks.forEach(rock => {
            if(rock.dead) return;
            seen.add(rock);
            let entry = this.rockEntries.get(rock);
            const visible = isVisible(rock.x, rock.y, rock.radius * 1.6);
            if(!visible) {
                if(entry) {
                    entry.mesh.visible = false;
                    // Well off screen: let go of the texture and its canvas (Safari caps
                    // total canvas memory); it is rebuilt when the rock comes back.
                    if(entry.texture && !isVisible(rock.x, rock.y, 900)) {
                        entry.texture.dispose();
                        entry.texture = null;
                        entry.canvas = null;
                        entry.material.map = null;
                        entry.material.needsUpdate = true;
                        entry.version = -1;
                    }
                }
                return;
            }
            rock.ensureSprite(true);
            if(!rock.sprite) return;
            if(!entry) {
                const material = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.06 });
                const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
                this.scene.add(mesh);
                entry = { mesh: mesh, material: material, texture: null, version: -1, canvas: null };
                this.rockEntries.set(rock, entry);
            }
            // The painted surface (craters, ore, scars) is the texture; rebuild the body
            // whenever that art is redrawn (after chipping, carving or merging).
            if(entry.version !== rock.spriteVersion) {
                entry.version = rock.spriteVersion;
                entry.mesh.geometry.dispose();
                entry.mesh.geometry = buildRockGeometry(THREE, rock);
                if(entry.canvas !== rock.sprite.canvas) {
                    if(entry.texture) entry.texture.dispose();
                    entry.texture = new THREE.CanvasTexture(rock.sprite.canvas);
                    entry.texture.colorSpace = THREE.SRGBColorSpace;
                    entry.texture.anisotropy = 2;
                    entry.material.map = entry.texture;
                    entry.material.needsUpdate = true;
                    entry.canvas = rock.sprite.canvas;
                } else {
                    entry.texture.needsUpdate = true;
                }
            }
            const mesh = entry.mesh;
            const scale = rock.radius * rock.renderScale;
            mesh.visible = scale > 0.5;
            mesh.position.set(rock.x, -rock.y, 0);
            mesh.rotation.z = -rock.angle;
            mesh.scale.set(scale, scale, scale);
            const fading = rock.renderAlpha < 0.999;
            if(entry.material.transparent !== fading) {
                entry.material.transparent = fading;
                entry.material.needsUpdate = true;
            }
            entry.material.opacity = rock.renderAlpha;
            entry.material.emissive.setScalar(rock.flash > 0 ? 0.22 : 0);
        });
        // Forget asteroids that were destroyed or streamed out.
        this.rockEntries.forEach((entry, rock) => {
            if(seen.has(rock)) return;
            this.scene.remove(entry.mesh);
            entry.mesh.geometry.dispose();
            entry.material.dispose();
            if(entry.texture) entry.texture.dispose();
            this.rockEntries.delete(rock);
        });
    }

    // ------------------------------------------------------------ ships

    hullParts(hull) {
        const key = hull.id;
        if(!this.hullCache[key]) this.hullCache[key] = buildHullGeometries(this.THREE, hull);
        return this.hullCache[key];
    }

    syncShips(ships, isVisible) {
        const THREE = this.THREE;
        const seen = new Set();
        ships.forEach(ship => {
            seen.add(ship);
            let entry = this.shipEntries.get(ship);
            if(entry && entry.hull !== ship.hullDef) {
                this.removeShip(ship, entry);
                entry = null;
            }
            if(!entry) {
                const color = parseRgb(ship.hullDef.color);
                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(0.08 + color[0] * 0.3, 0.09 + color[1] * 0.3, 0.11 + color[2] * 0.32),
                    metalness: 0.35,
                    roughness: 0.42,
                    emissive: new THREE.Color(color[0] * 0.03, color[1] * 0.03, color[2] * 0.035)
                });
                const group = new THREE.Group();
                this.hullParts(ship.hullDef).forEach(geometry => group.add(new THREE.Mesh(geometry, material)));
                this.scene.add(group);
                entry = { group: group, material: material, hull: ship.hullDef, baseEmissive: material.emissive.clone() };
                this.shipEntries.set(ship, entry);
            }
            const blink = ship.immunity > 0 && Math.floor(ship.immunity * 10) % 2 === 0;
            const visible = ship.alive && !ship.hidden && !blink && isVisible(ship.x, ship.y, ship.radius * 2);
            entry.group.visible = visible;
            if(!visible) return;
            entry.group.position.set(ship.x, -ship.y, 0);
            entry.group.rotation.z = -ship.angle;
            if(ship.hullFlash > 0) entry.material.emissive.setRGB(0.5, 0.08, 0.06);
            else entry.material.emissive.copy(entry.baseEmissive);
        });
        this.shipEntries.forEach((entry, ship) => {
            if(!seen.has(ship)) this.removeShip(ship, entry);
        });
    }

    removeShip(ship, entry) {
        this.scene.remove(entry.group);
        entry.material.dispose();
        this.shipEntries.delete(ship);
    }

    // ------------------------------------------------------------ frame

    render(view) {
        if(!this.visible) return;
        this.placeCamera(view.cameraX, view.cameraY, view.zoom);
        this.syncScenery(view);
        this.syncOres(view.ores, view.isVisible);
        this.syncRocks(view.rocks, view.isVisible);
        this.syncShips(view.ships, view.isVisible);
        this.renderer.render(this.scene, this.camera);
    }

    // Drop everything (new game / new star system).
    clear() {
        this.syncRocks([], () => false);
        this.syncShips([], () => false);
    }
}

export default Scene3D;
