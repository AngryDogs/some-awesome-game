// 3D models for the fixed scenery: Atlantis with its city shield, the Stargate and DHD,
// the system's planet (and moon), and the ore crystals.
//
// Everything sits at or below the play plane (z <= 0), so ships, which fly on the plane,
// always pass over the city and the gate. Game (x, y) -> Three.js (x, -y, z).

const v2 = (THREE, p) => new THREE.Vector2(p[0], -p[1]);

// A flat-topped prism from a polygon in game coordinates, top face at `top`.
const prism = (THREE, pts, top, depth, bevel) => {
    const shape = new THREE.Shape(pts.map(p => v2(THREE, p)));
    const b = bevel === undefined ? Math.min(2, depth * 0.25) : bevel;
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(0.5, depth - b), steps: 1, bevelEnabled: b > 0, bevelThickness: b,
        bevelSize: b, bevelOffset: -b, bevelSegments: 2
    });
    geometry.translate(0, 0, top - depth);
    return geometry;
};

// A box standing on the deck: footprint centre (x, y), size w x d, from `bottom` up to `top`.
const tower = (THREE, x, y, w, d, bottom, top, angle) => {
    const geometry = new THREE.BoxGeometry(w, d, top - bottom);
    if(angle) geometry.rotateZ(-angle);
    geometry.translate(x, -y, (top + bottom) / 2);
    return geometry;
};

const rotatePts = (pts, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return pts.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c]);
};

const hexagon = (r, offset) => {
    const pts = [];
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (offset || 0);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
};

// Lit windows: a dark facade with rows of warm and cool lights (shared by all towers).
const windowTexture = (THREE) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a2230';
    ctx.fillRect(0, 0, 64, 128);
    for(let y = 4; y < 128; y += 8) {
        for(let x = 3; x < 64; x += 7) {
            const r = Math.random();
            if(r < 0.45) continue;
            ctx.fillStyle = r < 0.8 ? 'rgba(255, 225, 160, 0.95)' : 'rgba(170, 215, 255, 0.95)';
            ctx.fillRect(x, y, 4, 4);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
};

// Fresnel glow: bright where the surface turns away from the camera (shield domes, atmospheres).
const glowMaterial = (THREE, color, strength, power, backSide) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255) }, uStrength: { value: strength } },
    vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vView;',
        'void main() {',
        '    vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '    vNormal = normalize(normalMatrix * normal);',
        '    vView = normalize(-mv.xyz);',
        '    gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n'),
    fragmentShader: [
        'uniform vec3 uColor;',
        'uniform float uStrength;',
        'varying vec3 vNormal;',
        'varying vec3 vView;',
        'void main() {',
        '    float rim = pow(1.0 - abs(dot(vNormal, vView)), ' + power.toFixed(1) + ');',
        '    gl_FragColor = vec4(uColor * rim * uStrength, rim * uStrength);',
        '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: backSide ? THREE.BackSide : THREE.FrontSide
});

// ------------------------------------------------------------ Atlantis

// The city sits below the flight plane: deck at DECK, the central spire reaching up to
// just under the plane.
const DECK = -70;

export const buildAtlantis = (THREE, station) => {
    const group = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 0.55, roughness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a5a70, metalness: 0.6, roughness: 0.5 });
    const windows = windowTexture(THREE);
    const buildings = new THREE.MeshStandardMaterial({
        color: 0xb8c6da, metalness: 0.4, roughness: 0.45, map: windows,
        emissive: 0xffffff, emissiveMap: windows, emissiveIntensity: 0.85
    });
    const glass = new THREE.MeshStandardMaterial({ color: 0x6fa8ff, metalness: 0.3, roughness: 0.15, emissive: 0x2a5cff, emissiveIntensity: 0.6 });
    const add = (geometry, material) => group.add(new THREE.Mesh(geometry, material));

    // Central hub: stepped hexagonal tiers.
    add(prism(THREE, hexagon(92, Math.PI / 6), DECK + 8, 22), metal);
    add(prism(THREE, hexagon(70, 0), DECK + 20, 12), dark);
    add(prism(THREE, hexagon(48, Math.PI / 6), DECK + 32, 12), metal);
    // The central tower: a tall tapering spire with a glowing crown.
    const spire = new THREE.CylinderGeometry(7, 18, 62, 12);
    spire.rotateX(Math.PI / 2);
    spire.translate(0, 0, DECK + 32 + 31);
    add(spire, buildings);
    const crown = new THREE.ConeGeometry(7, 16, 12);
    crown.rotateX(Math.PI / 2);
    crown.translate(0, 0, DECK + 32 + 62 + 7);
    add(crown, glass);
    // Ring of secondary towers around the spire.
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const h = 22 + (i % 2) * 14;
        add(tower(THREE, Math.cos(a) * 62, Math.sin(a) * 62, 11, 11, DECK + 8, DECK + 8 + h, a), buildings);
    }

    // Six piers: three long main piers with big platforms, three shorter ones.
    for(let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 - Math.PI / 2;
        const main = i % 2 === 0;
        const length = main ? 270 : 215;
        const half = main ? 22 : 18;
        const P = (pts) => rotatePts(pts, angle);
        const at = (x, y) => rotatePts([[x, y]], angle)[0];

        add(prism(THREE, P([[70, -half], [length, -half], [length, half], [70, half]]), DECK + 4, 10), metal);
        // Raised spine along the pier.
        add(prism(THREE, P([[80, -half * 0.35], [length - 10, -half * 0.35], [length - 10, half * 0.35], [80, half * 0.35]]), DECK + 9, 5), dark);
        if(main) {
            add(prism(THREE, P([[length, -half], [length + 18, -58], [length + 78, -58], [length + 96, -26],
                [length + 96, 26], [length + 78, 58], [length + 18, 58], [length, half]]), DECK + 6, 14), metal);
            add(prism(THREE, P([[length + 26, -40], [length + 70, -40], [length + 80, 0], [length + 70, 40], [length + 26, 40], [length + 16, 0]]), DECK + 12, 6), dark);
            [[36, -18, 34], [56, 14, 48], [44, 26, 26], [62, -26, 40], [30, 30, 20], [70, 0, 30]].forEach((t, k) => {
                const p = at(length + t[0], t[1]);
                add(tower(THREE, p[0], p[1], 12, 12, DECK + 12, DECK + 12 + t[2], angle + k * 0.3), buildings);
            });
            add(prism(THREE, P([[length - 70, half], [length - 40, half + 34], [length - 20, half + 34], [length - 36, half]]), DECK + 2, 6), metal);
        } else {
            add(prism(THREE, P([[length, -half], [length + 20, -38], [length + 52, -30], [length + 62, 0],
                [length + 52, 30], [length + 20, 38], [length, half]]), DECK + 6, 12), metal);
            const p = at(length + 28, 0);
            add(tower(THREE, p[0], p[1], 24, 24, DECK + 6, DECK + 30, angle), buildings);
            const mast = new THREE.CylinderGeometry(4, 5, 18, 10);
            mast.rotateX(Math.PI / 2);
            mast.translate(p[0], -p[1], DECK + 30 + 9);
            add(mast, glass);
        }
    }

    // City shield: a shallow dome glowing at its rim.
    const R = station.shieldRadius;
    const domeGeometry = new THREE.SphereGeometry(R, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeometry.rotateX(Math.PI / 2);
    const dome = new THREE.Mesh(domeGeometry, glowMaterial(THREE, [140, 205, 255], 0.75, 2.5, false));
    dome.scale.set(1, 1, 0.4);
    dome.position.z = DECK;
    dome.renderOrder = 2;
    group.add(dome);

    group.position.set(station.x, -station.y, 0);
    return group;
};

// ------------------------------------------------------------ Stargate and DHD

const GATE_TOP = -4;

export const buildGate = (THREE, gateRadius, gateInner, symbolSprite, chevronAngles) => {
    const group = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0x8c8e98, metalness: 0.65, roughness: 0.45 });

    // Outer ring.
    const ring = new THREE.Shape();
    ring.absarc(0, 0, gateRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, gateInner, 0, Math.PI * 2, true);
    ring.holes.push(hole);
    const ringGeometry = new THREE.ExtrudeGeometry(ring, {
        depth: 8, steps: 1, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.5, bevelOffset: -2.5, bevelSegments: 3, curveSegments: 72
    });
    ringGeometry.translate(0, 0, GATE_TOP - 11);
    group.add(new THREE.Mesh(ringGeometry, stone));

    // The rotating inner ring of symbols, set slightly into the outer ring.
    const inner = new THREE.RingGeometry(gateInner + 5, gateRadius - 6, 96, 1);
    const uv = inner.attributes.uv;
    const pos = inner.attributes.position;
    for(let i = 0; i < pos.count; i++) {
        uv.setXY(i, 0.5 + pos.getX(i) / (2 * gateRadius), 0.5 + pos.getY(i) / (2 * gateRadius));
    }
    const symbols = new THREE.CanvasTexture(symbolSprite.canvas);
    symbols.colorSpace = THREE.SRGBColorSpace;
    const symbolRing = new THREE.Mesh(inner, new THREE.MeshStandardMaterial({ map: symbols, metalness: 0.5, roughness: 0.5 }));
    symbolRing.position.z = GATE_TOP + 0.6;
    group.add(symbolRing);

    // Nine chevrons; their lamps light up as they lock.
    const chevrons = [];
    const chevronShape = [[-8, -4], [8, -4], [4, 7], [0, 9], [-4, 7]];
    const lampShape = [[-4, -1], [4, -1], [0, 6]];
    chevronAngles.forEach(a => {
        const place = (pts) => pts.map(p => {
            // Same placement as the 2D drawing: rotate(a + PI/2), then translate(0, -R + 2).
            const x = p[0];
            const y = p[1] - gateRadius + 2;
            const r = a + Math.PI / 2;
            return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
        });
        group.add(new THREE.Mesh(prism(THREE, place(chevronShape), GATE_TOP + 2, 6, 1), stone));
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0x502820, emissive: 0x000000, metalness: 0.2, roughness: 0.4 });
        group.add(new THREE.Mesh(prism(THREE, place(lampShape), GATE_TOP + 3, 2, 0.4), lampMaterial));
        chevrons.push(lampMaterial);
    });

    return { group: group, symbolRing: symbolRing, chevrons: chevrons };
};

export const buildDHD = (THREE) => {
    const group = new THREE.Group();
    const base = new THREE.MeshStandardMaterial({ color: 0x5a5753, metalness: 0.45, roughness: 0.6 });
    const keys = new THREE.MeshStandardMaterial({ color: 0x9a948a, metalness: 0.3, roughness: 0.5 });
    const octagon = [];
    for(let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + Math.PI / 8;
        octagon.push([Math.cos(a) * 30, Math.sin(a) * 30]);
    }
    group.add(new THREE.Mesh(prism(THREE, octagon, -6, 18, 3), base));
    [[24, 19], [16, 20]].forEach(ring => {
        for(let i = 0; i < ring[1]; i++) {
            const a = i * Math.PI * 2 / ring[1];
            group.add(new THREE.Mesh(tower(THREE, Math.cos(a) * ring[0], Math.sin(a) * ring[0], 4, 4, -6, -3.5, a), keys));
        }
    });
    const domeMaterial = new THREE.MeshStandardMaterial({ color: 0x8a1a12, emissive: 0x501008, metalness: 0.1, roughness: 0.2 });
    const domeGeometry = new THREE.SphereGeometry(9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeometry.rotateX(Math.PI / 2);
    domeGeometry.translate(0, 0, -6);
    group.add(new THREE.Mesh(domeGeometry, domeMaterial));
    return { group: group, dome: domeMaterial };
};

// ------------------------------------------------------------ planets

// Seamless 3D value noise sampled on the sphere, for procedural planet surfaces.
const makeNoise = (seed) => {
    const perm = new Uint8Array(512);
    let s = seed >>> 0;
    for(let i = 0; i < 256; i++) perm[i] = i;
    for(let i = 255; i > 0; i--) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const j = s % (i + 1);
        const t = perm[i];
        perm[i] = perm[j];
        perm[j] = t;
    }
    for(let i = 0; i < 256; i++) perm[256 + i] = perm[i];
    const values = new Float32Array(256);
    for(let i = 0; i < 256; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        values[i] = s / 4294967296;
    }
    const fade = t => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;
    const at = (x, y, z) => values[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]];
    const noise = (x, y, z) => {
        const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
        const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
        return lerp(
            lerp(lerp(at(xi, yi, zi), at(xi + 1, yi, zi), xf), lerp(at(xi, yi + 1, zi), at(xi + 1, yi + 1, zi), xf), yf),
            lerp(lerp(at(xi, yi, zi + 1), at(xi + 1, yi, zi + 1), xf), lerp(at(xi, yi + 1, zi + 1), at(xi + 1, yi + 1, zi + 1), xf), yf),
            zf);
    };
    return (x, y, z, octaves) => {
        let total = 0;
        let amp = 0.5;
        let freq = 1;
        for(let o = 0; o < octaves; o++) {
            total += noise(x * freq, y * freq, z * freq) * amp;
            amp *= 0.5;
            freq *= 2.1;
        }
        return total;
    };
};

// How much of the surface is "land" (vs. the base colour) for each planet type.
const LAND_LEVEL = { ocean: 0.62, earth: 0.52, desert: 0.47, jungle: 0.4, rocky: 0.5, industrial: 0.5, ice: 0.55 };
const CLOUDS = { ocean: 0.55, earth: 0.55, jungle: 0.5, ice: 0.6, industrial: 0.62, desert: 0.72, rocky: 0.75 };

const planetTextures = (THREE, type, palette, seed) => {
    const w = 512;
    const h = 256;
    const noise = makeNoise(seed);
    const surface = document.createElement('canvas');
    surface.width = w;
    surface.height = h;
    const clouds = document.createElement('canvas');
    clouds.width = w;
    clouds.height = h;
    const sctx = surface.getContext('2d');
    const cctx = clouds.getContext('2d');
    const simg = sctx.createImageData(w, h);
    const cimg = cctx.createImageData(w, h);
    const land = LAND_LEVEL[type] || 0.5;
    const cloudLevel = CLOUDS[type] || 0.6;
    for(let y = 0; y < h; y++) {
        const lat = (y / (h - 1) - 0.5) * Math.PI;
        const cl = Math.cos(lat);
        const sl = Math.sin(lat);
        for(let x = 0; x < w; x++) {
            const lon = (x / w) * Math.PI * 2;
            const px = Math.cos(lon) * cl * 2.2 + 10;
            const py = sl * 2.2 + 10;
            const pz = Math.sin(lon) * cl * 2.2 + 10;
            const n = noise(px, py, pz, 5);
            const detail = noise(px * 4, py * 4, pz * 4, 3);
            let c;
            if(n > land) {
                const k = Math.min(1, (n - land) * 3);
                c = palette.land.map((v, i) => v * (0.85 + detail * 0.3) * (1 - k * 0.25) + palette.dark[i] * k * 0.25);
            } else {
                const k = Math.min(1, (land - n) * 2.5);
                c = palette.base.map((v, i) => v * (1 - k * 0.45) + palette.dark[i] * k * 0.45);
            }
            // Ice caps near the poles for most worlds.
            // Ice caps near the poles for most worlds, with a soft, ragged edge.
            if(type !== 'desert' && type !== 'industrial') {
                const cap = Math.max(0, Math.min(1, (Math.abs(sl) - 0.84 + (n - 0.5) * 0.25) * 12));
                if(cap > 0) c = c.map((v, i) => v * (1 - cap) + [235, 242, 250][i] * cap);
            }
            const o = (y * w + x) * 4;
            simg.data[o] = c[0];
            simg.data[o + 1] = c[1];
            simg.data[o + 2] = c[2];
            simg.data[o + 3] = 255;
            const cn = noise(px * 1.7 + 30, py * 3 + 30, pz * 1.7 + 30, 5);
            const a = Math.max(0, Math.min(1, (cn - cloudLevel) * 5));
            cimg.data[o] = palette.cloud[0];
            cimg.data[o + 1] = palette.cloud[1];
            cimg.data[o + 2] = palette.cloud[2];
            cimg.data[o + 3] = Math.round(a * 230);
        }
    }
    sctx.putImageData(simg, 0, 0);
    cctx.putImageData(cimg, 0, 0);
    const map = new THREE.CanvasTexture(surface);
    map.colorSpace = THREE.SRGBColorSpace;
    const cloudMap = new THREE.CanvasTexture(clouds);
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    return { map: map, clouds: cloudMap };
};

// Planet far below the play plane (so it drifts past slowly with real parallax), with a
// cloud layer, an atmosphere glow and sometimes a moon.
export const PLANET_DEPTH = 9000;

export const buildPlanet = (THREE, system, palette) => {
    const p = system.planet;
    const group = new THREE.Group();
    const radius = p.radius * 2.2;
    let seed = 0;
    for(let i = 0; i < system.id.length; i++) seed = (seed * 31 + system.id.charCodeAt(i)) >>> 0;
    const textures = planetTextures(THREE, p.type, palette, seed);

    const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32),
        new THREE.MeshStandardMaterial({ map: textures.map, roughness: 0.85, metalness: 0 }));
    group.add(body);
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 64, 32),
        new THREE.MeshStandardMaterial({ map: textures.clouds, transparent: true, depthWrite: false, roughness: 1 }));
    group.add(clouds);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.1, 48, 24),
        glowMaterial(THREE, palette.atmosphere.split(',').map(Number), 1.4, 3.0, true));
    group.add(atmosphere);
    // Tilt the axis a little so the cloud bands and caps read as a globe.
    group.rotation.z = 0.25;
    group.rotation.x = 0.35;

    let moon = null;
    if(p.moon) {
        const moonTextures = planetTextures(THREE, 'rocky', { base: [150, 150, 155], dark: [60, 60, 70], land: [120, 120, 128], cloud: [0, 0, 0] }, seed + 7);
        moon = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.24, 32, 16),
            new THREE.MeshStandardMaterial({ map: moonTextures.map, roughness: 0.95 }));
        moonTextures.clouds.dispose();
    }

    const holder = new THREE.Group();
    holder.add(group);
    if(moon) {
        moon.position.set(radius * 1.9, radius * 0.7, radius * 0.3);
        holder.add(moon);
    }
    holder.position.set(p.x, -p.y, -PLANET_DEPTH);
    return { holder: holder, body: body, clouds: clouds, textures: textures };
};

// ------------------------------------------------------------ ore crystals

export const ORE_LIMIT = 800;

export const buildOreCrystals = (THREE) => {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    geometry.scale(1, 1, 0.7);
    const material = new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.3, flatShading: true, emissive: 0x111111 });
    const mesh = new THREE.InstancedMesh(geometry, material, ORE_LIMIT);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false;
    return mesh;
};
