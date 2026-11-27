// GPU particles and tracers for the 3D game: sparks, fire, plasma, engine exhaust, dust and
// smoke, shockwaves, and the minigun tracer lines. Particles live in big preallocated
// buffers (no allocation per particle) and are drawn as soft round points that shrink with
// distance like real objects.

const MAX_GLOW = 6000;
const MAX_DUST = 2500;
const MAX_TRACERS = 3000;

const VERTEX = [
    'attribute float size;',
    'attribute float alpha;',
    'attribute vec3 tint;',
    'uniform float uScale;',
    'varying float vAlpha;',
    'varying vec3 vTint;',
    'void main() {',
    '    vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '    gl_PointSize = clamp(size * uScale / max(1.0, -mv.z), 0.0, 512.0);',
    '    vAlpha = alpha;',
    '    vTint = tint;',
    '    gl_Position = projectionMatrix * mv;',
    '}'
].join('\n');

const FRAGMENT = [
    'uniform sampler2D uMap;',
    'varying float vAlpha;',
    'varying vec3 vTint;',
    'void main() {',
    '    vec4 t = texture2D(uMap, gl_PointCoord);',
    '    gl_FragColor = vec4(vTint * t.rgb, t.a * vAlpha);',
    '}'
].join('\n');

export const glowTexture = (THREE) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
};

class ParticlePool {

    constructor(THREE, scene, max, additive, texture) {
        this.max = max;
        this.count = 0;
        this.px = new Float32Array(max);
        this.py = new Float32Array(max);
        this.pz = new Float32Array(max);
        this.vx = new Float32Array(max);
        this.vy = new Float32Array(max);
        this.vz = new Float32Array(max);
        this.life = new Float32Array(max);
        this.maxLife = new Float32Array(max);
        this.size0 = new Float32Array(max);
        this.grow = new Float32Array(max);
        this.alpha0 = new Float32Array(max);
        this.drag = new Float32Array(max);
        this.cr = new Float32Array(max);
        this.cg = new Float32Array(max);
        this.cb = new Float32Array(max);

        this.positions = new Float32Array(max * 3);
        this.sizes = new Float32Array(max);
        this.alphas = new Float32Array(max);
        this.tints = new Float32Array(max * 3);
        const geometry = new THREE.BufferGeometry();
        this.positionAttr = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
        this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage);
        this.alphaAttr = new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage);
        this.tintAttr = new THREE.BufferAttribute(this.tints, 3).setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position', this.positionAttr);
        geometry.setAttribute('size', this.sizeAttr);
        geometry.setAttribute('alpha', this.alphaAttr);
        geometry.setAttribute('tint', this.tintAttr);
        geometry.setDrawRange(0, 0);
        this.geometry = geometry;
        this.material = new THREE.ShaderMaterial({
            uniforms: { uMap: { value: texture }, uScale: { value: 500 } },
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
            depthWrite: false,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        this.points = new THREE.Points(geometry, this.material);
        this.points.frustumCulled = false;
        this.points.renderOrder = additive ? 5 : 4;
        scene.add(this.points);
    }

    spawn(o) {
        let i = this.count;
        if(i >= this.max) i = Math.floor(Math.random() * this.max);   // full: recycle one
        else this.count++;
        this.px[i] = o.x; this.py[i] = o.y; this.pz[i] = o.z;
        this.vx[i] = o.vx || 0; this.vy[i] = o.vy || 0; this.vz[i] = o.vz || 0;
        this.life[i] = this.maxLife[i] = o.life;
        this.size0[i] = o.size;
        this.grow[i] = o.grow || 0;
        this.alpha0[i] = o.alpha === undefined ? 1 : o.alpha;
        this.drag[i] = o.drag || 0;
        this.cr[i] = o.color[0]; this.cg[i] = o.color[1]; this.cb[i] = o.color[2];
    }

    update(dt) {
        let n = this.count;
        for(let i = 0; i < n; i++) {
            this.life[i] -= dt;
            if(this.life[i] <= 0) {
                // Swap the last live particle into this slot.
                n--;
                this.copy(n, i);
                i--;
                continue;
            }
            const d = this.drag[i];
            if(d > 0) {
                const k = Math.max(0, 1 - d * dt);
                this.vx[i] *= k; this.vy[i] *= k; this.vz[i] *= k;
            }
            this.px[i] += this.vx[i] * dt;
            this.py[i] += this.vy[i] * dt;
            this.pz[i] += this.vz[i] * dt;
            this.size0[i] += this.grow[i] * dt;
        }
        this.count = n;
        for(let i = 0; i < n; i++) {
            const t = this.life[i] / this.maxLife[i];
            this.positions[i * 3] = this.px[i];
            this.positions[i * 3 + 1] = this.py[i];
            this.positions[i * 3 + 2] = this.pz[i];
            this.sizes[i] = this.size0[i];
            this.alphas[i] = this.alpha0[i] * Math.min(1, t * 1.6);
            this.tints[i * 3] = this.cr[i];
            this.tints[i * 3 + 1] = this.cg[i];
            this.tints[i * 3 + 2] = this.cb[i];
        }
        this.geometry.setDrawRange(0, n);
        this.positionAttr.needsUpdate = true;
        this.sizeAttr.needsUpdate = true;
        this.alphaAttr.needsUpdate = true;
        this.tintAttr.needsUpdate = true;
    }

    copy(from, to) {
        const arrays = [this.px, this.py, this.pz, this.vx, this.vy, this.vz, this.life, this.maxLife, this.size0,
            this.grow, this.alpha0, this.drag, this.cr, this.cg, this.cb];
        for(let k = 0; k < arrays.length; k++) arrays[k][to] = arrays[k][from];
    }

    clear() {
        this.count = 0;
        this.geometry.setDrawRange(0, 0);
    }
}

const rgb = (text) => {
    const parts = text.split(',');
    return [parseFloat(parts[0]) / 255, parseFloat(parts[1]) / 255, parseFloat(parts[2]) / 255];
};

class Effects3D {

    constructor(THREE, scene) {
        this.THREE = THREE;
        this.texture = glowTexture(THREE);
        this.glow = new ParticlePool(THREE, scene, MAX_GLOW, true, this.texture);
        this.dust = new ParticlePool(THREE, scene, MAX_DUST, false, this.texture);

        // Tracers: one line segment per kinetic round (tail -> head), additive.
        this.tracerPositions = new Float32Array(MAX_TRACERS * 6);
        this.tracerColors = new Float32Array(MAX_TRACERS * 6);
        const geometry = new THREE.BufferGeometry();
        this.tracerPosAttr = new THREE.BufferAttribute(this.tracerPositions, 3).setUsage(THREE.DynamicDrawUsage);
        this.tracerColAttr = new THREE.BufferAttribute(this.tracerColors, 3).setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position', this.tracerPosAttr);
        geometry.setAttribute('color', this.tracerColAttr);
        geometry.setDrawRange(0, 0);
        this.tracerGeometry = geometry;
        this.tracers = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        }));
        this.tracers.frustumCulled = false;
        this.tracers.renderOrder = 6;
        scene.add(this.tracers);
    }

    // Point size scale so `size` is in world units at any distance.
    resize(viewportHeight, fovDegrees) {
        const scale = viewportHeight / (2 * Math.tan(fovDegrees * Math.PI / 360));
        this.glow.material.uniforms.uScale.value = scale;
        this.dust.material.uniforms.uScale.value = scale;
    }

    // One particle. `color` is 'r,g,b' (0-255) or an [r, g, b] array in 0-1.
    spawn(o, dusty) {
        const color = typeof o.color === 'string' ? rgb(o.color) : o.color;
        (dusty ? this.dust : this.glow).spawn(Object.assign({}, o, { color: color }));
    }

    // A spray of particles from `p` (Vector3) carrying base velocity `v` (Vector3 or null).
    burst(p, v, count, o) {
        const color = typeof o.color === 'string' ? rgb(o.color) : o.color;
        const pool = o.dust ? this.dust : this.glow;
        for(let i = 0; i < count; i++) {
            // Random direction on a sphere (or within a cone around o.dir).
            let dx, dy, dz;
            do {
                dx = Math.random() * 2 - 1;
                dy = Math.random() * 2 - 1;
                dz = Math.random() * 2 - 1;
            } while(dx * dx + dy * dy + dz * dz > 1 || dx * dx + dy * dy + dz * dz < 0.01);
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            dx /= len; dy /= len; dz /= len;
            if(o.dir) {
                const c = o.cone === undefined ? 0.6 : o.cone;
                dx = o.dir.x + dx * c; dy = o.dir.y + dy * c; dz = o.dir.z + dz * c;
                const l2 = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                dx /= l2; dy /= l2; dz /= l2;
            }
            const speed = o.minSpeed + Math.random() * (o.maxSpeed - o.minSpeed);
            pool.spawn({
                x: p.x, y: p.y, z: p.z,
                vx: (v ? v.x : 0) + dx * speed, vy: (v ? v.y : 0) + dy * speed, vz: (v ? v.z : 0) + dz * speed,
                life: o.minLife + Math.random() * (o.maxLife - o.minLife),
                size: o.size * (0.7 + Math.random() * 0.6),
                grow: o.grow || 0,
                alpha: o.alpha === undefined ? 1 : o.alpha,
                drag: o.drag || 0,
                color: color
            });
        }
    }

    // Fiery explosion with sparks, a flash, smoke and an expanding shockwave.
    explosion(p, v, size, color) {
        const c = color || '255,170,90';
        this.burst(p, v, Math.round(12 + size * 0.6), { minSpeed: 30, maxSpeed: 60 + size * 5, minLife: 0.3, maxLife: 0.9, size: 6 + size * 0.12, color: c, drag: 1.2 });
        this.burst(p, v, Math.round(10 + size * 0.4), { minSpeed: 80, maxSpeed: 180 + size * 6, minLife: 0.3, maxLife: 1, size: 2.2, color: '255,220,160', drag: 0.6 });
        this.spawn({ x: p.x, y: p.y, z: p.z, life: 0.35, size: size * 1.6 + 20, grow: size * 2, color: '255,240,215', alpha: 0.9 });
        this.spawn({ x: p.x, y: p.y, z: p.z, life: 0.6, size: size * 0.6, grow: size * 5, color: c, alpha: 0.35 });
        this.burst(p, v, Math.round(4 + size * 0.15), { minSpeed: 5, maxSpeed: 40, minLife: 1.4, maxLife: 2.6, size: 14 + size * 0.25, grow: 12, color: '110,104,100', alpha: 0.35, drag: 0.5, dust: true });
    }

    // Kinetic rounds as glowing streaks behind each bullet.
    setTracers(bullets) {
        let n = 0;
        const P = this.tracerPositions;
        const C = this.tracerColors;
        for(let i = 0; i < bullets.length && n < MAX_TRACERS; i++) {
            const b = bullets[i];
            if(b.dead || b.kind !== 'bullet') continue;
            const k = Math.min(1, (b.age || 0) * 14) * 0.028;
            const o = n * 6;
            P[o] = b.x - b.vx * k; P[o + 1] = b.y - b.vy * k; P[o + 2] = b.z - b.vz * k;
            P[o + 3] = b.x; P[o + 4] = b.y; P[o + 5] = b.z;
            const enemy = b.side === 'enemy';
            C[o] = 0.6; C[o + 1] = enemy ? 0.25 : 0.32; C[o + 2] = enemy ? 0.2 : 0.08;
            C[o + 3] = 1; C[o + 4] = enemy ? 0.75 : 0.92; C[o + 5] = enemy ? 0.7 : 0.6;
            n++;
        }
        this.tracerGeometry.setDrawRange(0, n * 2);
        this.tracerPosAttr.needsUpdate = true;
        this.tracerColAttr.needsUpdate = true;
    }

    update(dt) {
        this.glow.update(dt);
        this.dust.update(dt);
    }

    clear() {
        this.glow.clear();
        this.dust.clear();
        this.tracerGeometry.setDrawRange(0, 0);
    }
}

export default Effects3D;
