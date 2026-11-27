/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 24);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Pre-rendered images. Glows, gradients and detailed line art are expensive to draw
// on a canvas every frame, so anything that doesn't change is drawn once into an
// offscreen canvas and then stamped with drawImage (a cheap bitmap copy).

const cache = {};

// Safari has much tighter limits on total canvas memory (especially on iPhone / iPad) and a
// slower 2D canvas, so it gets lighter settings.
const isSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent || '');
/* harmony export (immutable) */ __webpack_exports__["f"] = isSafari;


// Sprites are drawn magnified by the camera zoom, so render them a bit sharper.
const spriteResolution = () => Math.min(isSafari() ? 2 : 3, (window.devicePixelRatio || 1) * (isSafari() ? 1.25 : 2));
/* harmony export (immutable) */ __webpack_exports__["h"] = spriteResolution;


// Draws `draw(ctx)` into an offscreen canvas of `width` x `height` world pixels.
// Pass a previous sprite as `reuse` to redraw into its canvas when the size still fits
// (allocating canvases is slow; reusing one is just a clear).
const createSprite = (width, height, draw, resolution, reuse) => {
    const res = resolution || spriteResolution();
    const w = Math.max(1, Math.ceil(width * res));
    const h = Math.max(1, Math.ceil(height * res));
    let canvas;
    if(reuse && reuse.canvas.width >= w && reuse.canvas.height >= h &&
        reuse.canvas.width < w * 1.25 && reuse.canvas.height < h * 1.25) {
        canvas = reuse.canvas;
    } else {
        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Map world units so the drawing fills the (possibly slightly larger) canvas exactly.
    ctx.scale(canvas.width / width, canvas.height / height);
    draw(ctx);
    return { canvas: canvas, width: width, height: height };
};
/* harmony export (immutable) */ __webpack_exports__["a"] = createSprite;


// Shared fine-grain dust texture (light and dark specks) used as a fill pattern.
const grainTexture = () => {
    if(!cache.grain) {
        cache.grain = createSprite(128, 128, ctx => {
            for(let i = 0; i < 900; i++) {
                const light = Math.random() < 0.5;
                const a = 0.1 + Math.random() * 0.28;
                ctx.fillStyle = light ? 'rgba(255, 245, 225, ' + a + ')' : 'rgba(30, 25, 20, ' + a + ')';
                const size = 0.5 + Math.random() * 1.3;
                ctx.fillRect(Math.random() * 128, Math.random() * 128, size, size);
            }
        }, 1);
    }
    return cache.grain.canvas;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = grainTexture;


// Soft round glow, white-hot centre fading to `color` then transparent.
const glowSprite = (color) => {
    const key = 'glow:' + color;
    if(!cache[key]) {
        cache[key] = createSprite(64, 64, ctx => {
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255, 250, 235, 1)');
            g.addColorStop(0.25, 'rgba(' + color + ', 0.8)');
            g.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }, 1);
    }
    return cache[key];
};
/* harmony export (immutable) */ __webpack_exports__["d"] = glowSprite;


// Flame/jet pointing along +x from its left-middle edge (draw it rotated and stretched).
const flameSprite = (color, core) => {
    const key = 'flame:' + color + ':' + core;
    if(!cache[key]) {
        cache[key] = createSprite(128, 32, ctx => {
            const g = ctx.createLinearGradient(0, 0, 128, 0);
            g.addColorStop(0, 'rgba(' + core + ', 0.95)');
            g.addColorStop(0.35, 'rgba(' + color + ', 0.8)');
            g.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, 2);
            ctx.lineTo(128, 16);
            ctx.lineTo(0, 30);
            ctx.closePath();
            ctx.fill();
            const inner = ctx.createLinearGradient(0, 0, 70, 0);
            inner.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
            inner.addColorStop(1, 'rgba(255, 255, 240, 0)');
            ctx.fillStyle = inner;
            ctx.beginPath();
            ctx.moveTo(0, 9);
            ctx.lineTo(70, 16);
            ctx.lineTo(0, 23);
            ctx.closePath();
            ctx.fill();
        }, 1);
    }
    return cache[key];
};
/* harmony export (immutable) */ __webpack_exports__["c"] = flameSprite;


// Muzzle flash: a hot core with a long forward spike and short side spikes (pointing +x).
const muzzleSprite = (color) => {
    const key = 'muzzle:' + color;
    if(!cache[key]) {
        cache[key] = createSprite(64, 32, ctx => {
            ctx.translate(16, 16);
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
            glow.addColorStop(0, 'rgba(255, 255, 240, 1)');
            glow.addColorStop(0.4, 'rgba(' + color + ', 0.7)');
            glow.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(-16, -16, 32, 32);
            ctx.fillStyle = 'rgba(255, 250, 230, 0.95)';
            ctx.beginPath();
            ctx.moveTo(-2, -2.5); ctx.lineTo(46, 0); ctx.lineTo(-2, 2.5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(' + color + ', 0.8)';
            [[0, -14], [0, 14], [10, -9], [10, 9]].forEach(p => {
                ctx.beginPath();
                ctx.moveTo(-1, 0); ctx.lineTo(p[0], p[1]); ctx.lineTo(3, 0);
                ctx.closePath();
                ctx.fill();
            });
        }, 1);
    }
    return cache[key];
};
/* harmony export (immutable) */ __webpack_exports__["g"] = muzzleSprite;


// Soft feathered puff for dust clouds (no hard edge, unlike a filled circle).
const dustSprite = (color) => {
    const key = 'dust:' + color;
    if(!cache[key]) {
        cache[key] = createSprite(48, 48, ctx => {
            const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
            g.addColorStop(0, 'rgba(' + color + ', 0.9)');
            g.addColorStop(0.5, 'rgba(' + color + ', 0.45)');
            g.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 48, 48);
        }, 1);
    }
    return cache[key];
};
/* harmony export (immutable) */ __webpack_exports__["b"] = dustSprite;


// Stamp a sprite centred at (x, y) with the given size.
const stamp = (ctx, sprite, x, y, width, height) => {
    ctx.drawImage(sprite.canvas, x - width / 2, y - height / 2, width, height);
};
/* harmony export (immutable) */ __webpack_exports__["i"] = stamp;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
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

const MATERIAL_ORDER = ['rock', 'iron', 'copper', 'titanium', 'gold', 'naquadah'];
/* harmony export (immutable) */ __webpack_exports__["a"] = MATERIAL_ORDER;


// Main material of an asteroid at a given distance (in sectors) from base.
// `bias` multiplies material weights (each star system has its own ore mix).
const rollMaterial = (rng, sectorDistance, bias) => {
    // Materials a system is rich in (2x or more) start appearing 4 sectors closer in.
    const minSector = (m) => Math.max(0, m.minSector - (bias && bias[m.id] >= 2 ? 4 : 0));
    const options = MATERIAL_ORDER
        .map(id => MATERIALS[id])
        .filter(m => sectorDistance >= minSector(m))
        .map(m => ({ id: m.id, weight: (m.weight + m.growth * (sectorDistance - minSector(m))) * ((bias && bias[m.id]) || 1) }));

    const total = options.reduce((sum, o) => sum + o.weight, 0);
    let roll = rng() * total;
    for(let i = 0; i < options.length; i++) {
        roll -= options[i].weight;
        if(roll <= 0) return options[i].id;
    }
    return 'rock';
};
/* harmony export (immutable) */ __webpack_exports__["e"] = rollMaterial;


// Pick a material id from a composition like { rock: 0.4, gold: 0.6 }.
const pickFromComposition = (composition, random) => {
    let roll = (random || Math.random)();
    const keys = Object.keys(composition);
    for(let i = 0; i < keys.length; i++) {
        roll -= composition[keys[i]];
        if(roll <= 0) return keys[i];
    }
    return keys[keys.length - 1];
};
/* harmony export (immutable) */ __webpack_exports__["d"] = pickFromComposition;


const dominantMaterial = (composition) => {
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
/* harmony export (immutable) */ __webpack_exports__["c"] = dominantMaterial;


/* harmony default export */ __webpack_exports__["b"] = (MATERIALS);


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines, { rect: [x1, y1, x2, y2] } or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// jets:      manoeuvring jet positions on the hull edges (mirrored to both sides)
// The shield bubble is computed from the line art so it always encloses the whole ship.

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);
const rect = (x1, y1, x2, y2) => ({ rect: [x1, y1, x2, y2] });
const line = (x1, y1, x2, y2) => ({ pts: [[x1, y1], [x2, y2]] });
const mirrorRect = (x1, y1, x2, y2) => [rect(x1, y1, x2, y2), rect(x1, -y1, x2, -y2)];
const mirrorLine = (x1, y1, x2, y2) => [line(x1, y1, x2, y2), line(x1, -y1, x2, -y2)];
const row = (xs, y, r) => xs.map(x => [x, y, r]);
// Closed outline from its top half (bow to stern, negative y), mirrored onto the bottom half.
const symmetric = (half) => half.concat(half.slice().reverse().filter(p => p[1] !== 0).map(p => [p[0], -p[1]]));
const grid = (x0, y0, cols, rows, w, h, gap) => {
    const parts = [];
    for(let c = 0; c < cols; c++) {
        for(let r = 0; r < rows; r++) {
            const x = x0 + c * (w + gap);
            const y = y0 + r * (h + gap);
            parts.push(rect(x, y, x + w, y + h));
        }
    }
    return parts;
};


// Closed polygon approximating an ellipse.
const ellipse = (cx, cy, rx, ry, steps) => {
    const pts = [];
    const n = steps || 20;
    for(let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return { closed: true, pts: pts };
};
// Thick bent leg through `points` with half-width `w`, squared off at both ends.
const leg = (points, w) => {
    const left = [];
    const right = [];
    points.forEach((p, i) => {
        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(points.length - 1, i + 1)];
        let dx = next[0] - prev[0];
        let dy = next[1] - prev[1];
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len;
        dy /= len;
        left.push([p[0] - dy * w, p[1] + dx * w]);
        right.push([p[0] + dy * w, p[1] - dx * w]);
    });
    return { closed: true, pts: left.concat(right.reverse()) };
};
const mirrorPart = (part) => ({ closed: part.closed, pts: mirror(part.pts) });

const HULLS = {
    x302: {
        id: 'x302',
        name: 'F-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter: big swept wings, twin main engines and two nacelles. Tiny cargo hold.',
        cost: 0,
        color: '225,235,255',
        exhaust: '255,160,80',
        mass: 1,
        hull: 60,
        baseShield: 0,
        cargo: 12,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 32,
        art: [
            // Wings: straight leading edge out to a squared tip, long diagonal trailing edge.
            { closed: true, pts: [[11, -4], [14, -31.5], [5, -31.5], [-12.5, -9.5], [-12.5, -4]] },
            mirrorPart({ closed: true, pts: [[11, -4], [14, -31.5], [5, -31.5], [-12.5, -9.5], [-12.5, -4]] }),
            ...mirrorRect(13.4, -31.5, 6, -30.4),
            ...mirrorLine(9, -6, 12.4, -28), ...mirrorLine(3, -28, -8, -11),
            // Engine nacelles beside the body.
            ...mirrorRect(-2.5, -8.5, -15.5, -5.8), ...mirrorRect(-15.5, -8.2, -17.5, -6.1),
            // Fuselage, cockpit and the twin main engine block.
            { closed: true, pts: symmetric([[18, 0], [14, -2], [10, -2.6], [5.5, -2.6], [4, -4], [-8.5, -4], [-8.5, 0]]) },
            rect(-6.5, -3, -14.5, 3),
            rect(-14.5, -2.8, -16.5, -0.4), rect(-14.5, 0.4, -16.5, 2.8),
            { closed: true, pts: symmetric([[16, 0], [13, -1.5], [7, -1.5]]) },
            line(4, -4, 4, 4), line(-2, -4, -2, 4)
        ],
        slots: [
            { id: 'c', x: -1, y: 0 },
            { id: 'wl', x: 2, y: -18 },
            { id: 'wr', x: 2, y: 18 }
        ],
        engines: [{ x: -16.5, y: -1.6, size: 0.6 }, { x: -16.5, y: 1.6, size: 0.6 }, { x: -17.5, y: -7.2, size: 0.45 }, { x: -17.5, y: 7.2, size: 0.45 }],
        colliders: [[14, 0, 4], [5, 0, 5], [-6, 0, 6], [-14, 0, 4], [4, -14, 6], [4, 14, 6], [8, -24, 5], [8, 24, 5], [-4, -12, 5], [-4, 12, 5]],
        jets: { retro: [[14, 2.5]], side: [[9, 31.5]], bow: [16, 2], stern: [-17, 8.5] },
        jetScale: 0.9
    },

    jumper: {
        id: 'jumper',
        name: 'Puddle Jumper',
        className: 'Gateship',
        faction: 'Ancient',
        description: 'Lantean gateship: boxy hull, D-shaped windscreen and drive pods on both flanks. Small enough for the Stargate.',
        cost: 1800,
        color: '205,232,255',
        exhaust: '150,210,255',
        mass: 1.4,
        hull: 90,
        baseShield: 20,
        cargo: 24,
        thrust: 340,
        torque: 8,
        maxTurn: 4.2,
        moduleScale: 0.6,
        radius: 24,
        art: [
            // Drive pods along the flanks, with the hourglass drive cores at the back.
            { closed: true, pts: [[1, -7], [1, -11], [-15.5, -11], [-17.5, -10.2], [-17.5, -7.6], [-15.5, -7]] },
            mirrorPart({ closed: true, pts: [[1, -7], [1, -11], [-15.5, -11], [-17.5, -10.2], [-17.5, -7.6], [-15.5, -7]] }),
            ...mirrorLine(-9, -10.2, -14, -7.8), ...mirrorLine(-9, -7.8, -14, -10.2),
            ...mirrorLine(-3, -9, -8, -9), ...mirrorRect(-14.6, -10.4, -15.5, -7.6),
            // Main hull: blunt front with chamfered corners, rounded stern.
            { closed: true, pts: symmetric([[20, 0], [20, -6.4], [17.8, -7], [12.5, -7], [11, -7.7], [0, -7.7], [-18.5, -7], [-20, -6], [-20, 0]]) },
            // Windscreen: flat front edge, rounded behind.
            { closed: true, pts: symmetric([[13, 0], [13, -4.6], [11.5, -5.2], [8, -5.2], [6.2, -4.2], [5.5, -2.4], [5.5, 0]]) },
            // Panel lines and the rear ramp.
            ...mirrorLine(4, -6, -17, -6),
            ...mirrorLine(-1, -2.6, -18, -2.6),
            line(-1, -2.6, -1, 2.6),
            rect(-18, -4.6, -20, 4.6),
            ...mirrorLine(17, -4.5, 15, -4.5)
        ],
        slots: [
            { id: 'c', x: 2, y: 0 },
            { id: 'pl', x: -6, y: -9 },
            { id: 'pr', x: -6, y: 9 },
            { id: 'rear', x: -11, y: 0 }
        ],
        engines: [{ x: -17.5, y: -8.9, size: 0.55 }, { x: -17.5, y: 8.9, size: 0.55 }],
        colliders: [[17, 0, 7], [9, 0, 7.5], [1, 0, 7.5], [-7, 0, 7.5], [-15, 0, 7], [-4, -9, 3], [-12, -9, 3], [-4, 9, 3], [-12, 9, 3]],
        jets: { retro: [[19, 6]], side: [[4, 8]], bow: [20, 5], stern: [-18, 10] },
        jetScale: 0.9
    },

    glider: {
        id: 'glider',
        name: 'Death Glider',
        className: 'Goa\'uld fighter',
        faction: "Goa'uld",
        description: 'Jaffa attack fighter: a slender pod between great crescent wings that curve forward. Fast, fragile, almost no hold.',
        cost: 1200,
        color: '255,205,110',
        exhaust: '255,190,90',
        mass: 0.9,
        hull: 45,
        baseShield: 0,
        cargo: 8,
        thrust: 300,
        torque: 10,
        maxTurn: 5.5,
        moduleScale: 0.55,
        radius: 34,
        art: [
            // Crescent wings: tips curve forward, the convex edge faces aft.
            { closed: true, pts: [[8.7, -7.3], [9.8, -11.6], [10.9, -20.3], [11.9, -30], [12.8, -35.2], [10, -35.6], [4.3, -30.5],
                [-4.3, -23], [-10.9, -15.4], [-14.7, -8.6], [-15.4, -4], [-8, -6.8]] },
            mirrorPart({ closed: true, pts: [[8.7, -7.3], [9.8, -11.6], [10.9, -20.3], [11.9, -30], [12.8, -35.2], [10, -35.6], [4.3, -30.5],
                [-4.3, -23], [-10.9, -15.4], [-14.7, -8.6], [-15.4, -4], [-8, -6.8]] }),
            // Wing ribs.
            ...mirrorLine(11.5, -27, 3, -29.8), ...mirrorLine(10.6, -16, -7, -19.2), ...mirrorLine(9.6, -10, -12.6, -12),
            // Weapon housings inside the wings.
            { closed: true, pts: [[3.3, -23.6], [-11, -11.2], [2.7, -11.2]] },
            mirrorPart({ closed: true, pts: [[3.3, -23.6], [-11, -11.2], [2.7, -11.2]] }),
            // Central pod with the canopy.
            { closed: true, pts: symmetric([[15.5, 0], [12.5, -3], [8, -6], [0, -7.3], [-8, -7], [-13, -5], [-15.4, 0]]) },
            { closed: true, pts: symmetric([[12.8, 0], [10, -2.2], [4, -3], [-1.6, -2.6], [-1.6, 0]]) },
            line(-1.6, 0, -13, 0)
        ],
        slots: [
            { id: 'c', x: -6, y: 0 },
            { id: 'wl', x: -1, y: -16 },
            { id: 'wr', x: -1, y: 16 }
        ],
        engines: [{ x: -15.5, y: -2, size: 0.5 }, { x: -15.5, y: 2, size: 0.5 }],
        colliders: [[12, 0, 5], [4, 0, 7], [-5, 0, 7], [-12, 0, 5], [10, -30, 4], [10, 30, 4], [6, -22, 5], [6, 22, 5],
            [-2, -20, 5], [-2, 20, 5], [-9, -13, 5], [-9, 13, 5]],
        jets: { retro: [[13, 34]], side: [[0, 29]], bow: [15, 3], stern: [-15, 8] },
        jetScale: 0.9
    },

    alkesh: {
        id: 'alkesh',
        hyperdrive: 1.0,          // built-in hyperdrive speed
        name: "Al'kesh",
        className: 'Goa\'uld bomber',
        faction: "Goa'uld",
        description: 'Mid-range bomber: arrowhead hull with a raised dorsal wedge and four engines aft. Sturdy, with a slow hyperdrive.',
        cost: 3500,
        color: '255,205,110',
        exhaust: '170,210,255',
        mass: 3.2,
        hull: 190,
        baseShield: 30,
        cargo: 70,
        thrust: 640,
        torque: 4.2,
        maxTurn: 2.6,
        moduleScale: 0.85,
        radius: 40,
        art: [
            // Arrowhead hull with a broad, rounded stern.
            { closed: true, pts: symmetric([[34, 0], [24, -6], [10, -14], [-6, -21], [-17, -25], [-23, -24.5], [-27, -20], [-28.5, -10], [-28.5, 0]]) },
            // Raised dorsal wedge pointing forward.
            { closed: true, pts: [[30, 0], [-16, -12], [-20, 0], [-16, 12]] },
            line(30, 0, -20, 0),
            ...mirrorLine(18, -4, -8, -10.5),
            // Side window bands.
            ...mirrorLine(16, -9, 4, -14.5), ...mirrorLine(1, -16, -12, -21),
            // Engine housings and nozzles across the stern.
            ...mirrorRect(-22, -20.5, -28.5, -8),
            { circle: [-27, -17, 2.4] }, { circle: [-27, -11.3, 2.4] }, { circle: [-27, 11.3, 2.4] }, { circle: [-27, 17, 2.4] },
            // Bow gun.
            line(34, 0, 39, 0)
        ],
        slots: [
            { id: 'nose', x: 22, y: 0 },
            { id: 'top', x: 2, y: 0 },
            { id: 'wl', x: -6, y: -15 },
            { id: 'wr', x: -6, y: 15 },
            { id: 'rl', x: -18, y: -6 },
            { id: 'rr', x: -18, y: 6 }
        ],
        engines: [{ x: -28.5, y: -17, size: 0.75 }, { x: -28.5, y: -11.3, size: 0.75 }, { x: -28.5, y: 11.3, size: 0.75 }, { x: -28.5, y: 17, size: 0.75 }],
        colliders: [[28, 0, 6], [20, 0, 8], [10, 0, 10], [-1, 0, 11], [-13, 0, 12], [-22, 0, 9],
            [4, -12, 6], [4, 12, 6], [-8, -17, 7], [-8, 17, 7], [-20, -19, 7], [-20, 19, 7]],
        jets: { retro: [[30, 4]], side: [[-8, 22]], bow: [33, 2], stern: [-27, 23] },
        jetScale: 1.3
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser: U-shaped engineering section, long neck and a squared bow.',
        cost: 2500,
        color: '205,225,255',
        exhaust: '255,160,80',
        mass: 3,
        hull: 160,
        baseShield: 0,
        cargo: 45,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 54,
        art: [
            // Arms of the U running forward either side of the hull.
            ...mirrorRect(-32.6, -22.9, -1.5, -14),
            ...mirrorRect(-12, -22.9, -1.5, -14),
            ...mirrorLine(-28, -18.5, -12, -18.5),
            // Rear block with chamfered corners and the engine row.
            { closed: true, pts: symmetric([[-32.6, -22.9], [-43.4, -22.9], [-50, -16.3], [-50, 0]]) },
            // Central hull plate between the arms.
            { closed: true, pts: symmetric([[-1.5, -8.8], [-40, -8.8], [-44.5, -4.4], [-44.5, 0]]) },
            // Raised superstructure and hangar.
            { closed: true, pts: symmetric([[10.5, -5.5], [-12, -5.5], [-20, -3], [-32.6, -3], [-32.6, 0]]) },
            rect(-14, -2, -28, 2),
            // Neck.
            rect(-1.5, -6.6, 29, 6.6),
            line(8, -6.6, 8, 6.6), line(18, -6.6, 18, 6.6),
            ...mirrorLine(0, -3.3, 28, -3.3),
            // Forward section with intakes.
            { closed: true, pts: symmetric([[50, -6.6], [46.7, -10.6], [29, -10.6], [29, 0]]) },
            ...mirrorRect(31, -9, 36, -5.5),
            line(40, -10.6, 40, 10.6),
            // Turret blisters on the arms.
            { circle: [-26, -17.6, 2] }, { circle: [-26, 17.6, 2] },
            // Engine nozzles across the stern.
            { circle: [-48, -11, 1.6] }, { circle: [-48, -14.5, 1.6] }, { circle: [-48, -18, 1.6] },
            { circle: [-48, 11, 1.6] }, { circle: [-48, 14.5, 1.6] }, { circle: [-48, 18, 1.6] }
        ],
        slots: [
            { id: 'bow', x: 40, y: 0 },
            { id: 'bridge', x: 14, y: 0 },
            { id: 'ml', x: -22, y: -5.5 },
            { id: 'mr', x: -22, y: 5.5 },
            { id: 'nl', x: -16, y: -18.5 },
            { id: 'nr', x: -16, y: 18.5 }
        ],
        engines: [-18, -14.5, -11, 11, 14.5, 18].map(y => ({ x: -50, y: y, size: 0.7 })),
        colliders: [[46, 0, 8], [37, 0, 10], [24, 0, 7], [14, 0, 7], [4, 0, 7]]
            .concat(row([-6, -18, -30, -42], 0, 9), row([-6, -18, -30, -42], -17, 7), row([-6, -18, -30, -42], 17, 7)),
        jets: { retro: [[48, 9], [-2, 18.5]], side: [[38, 10.6], [-20, 22.9]], bow: [46, 8], stern: [-48, 22] },
        jetScale: 1.3
    },

    x304: {
        id: 'x304',
        hyperdrive: 1.4,          // built-in hyperdrive speed
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space battlecruiser: long forward hull, wide engineering section and twin hangar pods.',
        cost: 6000,
        color: '210,230,255',
        exhaust: '255,160,80',
        mass: 5,
        hull: 260,
        baseShield: 30,
        cargo: 90,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 70,
        art: [
            // Hangar pods either side of the engineering section.
            { closed: true, pts: [[-8, -22], [-8, -33], [-13, -38], [-62, -38], [-64, -36], [-64, -22]] },
            { closed: true, pts: mirror([[-8, -22], [-8, -33], [-13, -38], [-62, -38], [-64, -36], [-64, -22]]) },
            ...mirrorRect(-14, -25, -58, -35),
            ...mirrorLine(-27, -25, -27, -35), ...mirrorLine(-42, -25, -42, -35),
            // Engineering section.
            { closed: true, pts: symmetric([[-8, -16], [-14, -22], [-58, -22], [-64, -16]]) },
            rect(-14, -16, -58, 16),
            line(-14, -8, -58, -8), line(-14, 8, -58, 8),
            ...mirrorRect(-20, -13, -28, -10), ...mirrorRect(-44, -13, -52, -10),
            rect(-30, -4, -42, 4),
            // Forward hull, neck and nose.
            { closed: true, pts: symmetric([[66, -6], [64, -8], [42, -8], [37, -12], [8, -12], [6, -9.5], [-9, -9.5]]) },
            { closed: true, pts: symmetric([[60, -4], [42, -5], [38, -9], [12, -9]]) },
            ...grid(14, -7, 5, 2, 3.4, 5, 1.2),
            // Bridge superstructure on the neck.
            { closed: true, pts: symmetric([[6, -5], [-6, -6]]) },
            line(3, -3.5, 3, 3.5),
            line(66, 4, 80, 4),
            // Engine nozzles: three centre, three per pod.
            rect(-64, -13, -67, -7), rect(-64, -3, -67, 3), rect(-64, 7, -67, 13),
            ...mirrorRect(-64, -27, -66.5, -23), ...mirrorRect(-64, -32, -66.5, -28), ...mirrorRect(-64, -37, -66.5, -33)
        ],
        slots: [
            { id: 'nose', x: 52, y: 0 },
            { id: 'mid', x: 25, y: 0 },
            { id: 'bridge', x: 0, y: 0 },
            { id: 'aft', x: -36, y: 0 },
            { id: 'cl', x: -50, y: -14 },
            { id: 'cr', x: -50, y: 14 },
            { id: 'bl1', x: -20, y: -30 },
            { id: 'br1', x: -20, y: 30 },
            { id: 'bl2', x: -48, y: -30 },
            { id: 'br2', x: -48, y: 30 }
        ],
        engines: [{ x: -67, y: -10, size: 0.9 }, { x: -67, y: 0, size: 0.9 }, { x: -67, y: 10, size: 0.9 },
            { x: -66.5, y: -25, size: 0.6 }, { x: -66.5, y: -30, size: 0.6 }, { x: -66.5, y: -35, size: 0.6 },
            { x: -66.5, y: 25, size: 0.6 }, { x: -66.5, y: 30, size: 0.6 }, { x: -66.5, y: 35, size: 0.6 }],
        colliders: [[58, 0, 7], [46, 0, 8], [32, 0, 11], [18, 0, 11], [4, 0, 9]]
            .concat(row([-16, -30, -44, -57], -11, 11), row([-16, -30, -44, -57], 11, 11))
            .concat(row([-14, -28, -42, -56], -30, 8), row([-14, -28, -42, -56], 30, 8)),
        jets: { retro: [[40, 11], [-8, 30]], side: [[22, 12], [-36, 38]], bow: [56, 7], stern: [-60, 38] },
        jetScale: 1.5,
    },

    hatak: {
        id: 'hatak',
        hyperdrive: 1.2,          // built-in hyperdrive speed
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Pyramid warship with six great legs. Huge hold, tough and shielded, slow to turn.',
        cost: 5000,
        color: '255,205,110',
        mass: 7,
        hull: 380,
        baseShield: 50,
        cargo: 140,
        thrust: 900,
        torque: 2.2,
        maxTurn: 1.6,
        moduleScale: 1.1,
        radius: 72,
        art: [
            // Eight legs, as in the top-down blueprint: two narrow forward prongs, two arms
            // angled forward, two arms out to the sides and two legs angled back.
            // Solid central hull the legs grow out of.
            { closed: true, pts: symmetric([[40, 0], [38, -11], [24, -21], [6, -29], [-12, -34], [-26, -28], [-27, -14], [-24, 0]]) },
            leg([[18, -6], [40, -9.5], [62, -12]], 5.5), mirrorPart(leg([[18, -6], [40, -9.5], [62, -12]], 5.5)),
            leg([[12, -14], [32, -28], [50, -42]], 6.5), mirrorPart(leg([[12, -14], [32, -28], [50, -42]], 6.5)),
            leg([[-6, -20], [-1, -44], [4, -67]], 7), mirrorPart(leg([[-6, -20], [-1, -44], [4, -67]], 7)),
            leg([[-16, -14], [-40, -19], [-66, -26]], 7), mirrorPart(leg([[-16, -14], [-40, -19], [-66, -26]], 7)),
            // Hull plates joining the side arms to the rear legs.
            { closed: true, pts: [[-4, -20], [-16, -38], [-32, -30], [-16, -13]] },
            mirrorPart({ closed: true, pts: [[-4, -20], [-16, -38], [-32, -30], [-16, -13]] }),
            // Squared feet.
            { closed: true, pts: [[60, -16], [67, -15], [66, -8], [59, -8.5]] },
            mirrorPart({ closed: true, pts: [[60, -16], [67, -15], [66, -8], [59, -8.5]] }),
            { closed: true, pts: [[45, -47], [53, -50], [56, -40], [49, -37]] },
            mirrorPart({ closed: true, pts: [[45, -47], [53, -50], [56, -40], [49, -37]] }),
            ...mirrorRect(-3, -64, 11, -71),
            ...mirrorRect(-63, -32, -70, -20),
            // Hangar rings at the hubs.
            { circle: [38, -8, 3] }, { circle: [38, 8, 3] },
            { circle: [-19, -36, 4] }, { circle: [-19, 36, 4] },
            { circle: [-31, -29, 3.5] }, { circle: [-31, 29, 3.5] },
            // Central pyramid: nested triangles pointing forward, and the spine between the prongs.
            { closed: true, pts: [[30, 0], [-18, -24], [-18, 24]] },
            { closed: true, pts: [[20, 0], [-11, -16], [-11, 16]] },
            { closed: true, pts: [[9, 0], [-4, -7], [-4, 7]] },
            line(30, 0, 9, 0), line(-18, -24, -4, -7), line(-18, 24, -4, 7),
            line(30, 0, 38, 0),
            ...mirrorRect(-18, -13, -22, -4)
        ],
        slots: [
            { id: 'top', x: 3, y: 0 },
            { id: 'fl', x: 50, y: -10.5 },
            { id: 'fr', x: 50, y: 10.5 },
            { id: 'pl', x: 0, y: -52 },
            { id: 'pr', x: 0, y: 52 },
            { id: 'al', x: -50, y: -22 },
            { id: 'ar', x: -50, y: 22 },
            { id: 'sl', x: -11, y: -10 },
            { id: 'sr', x: -11, y: 10 }
        ],
        engines: [{ x: -22, y: -8, size: 1.3 }, { x: -22, y: 8, size: 1.3 }, { x: -70, y: -26, size: 0.8 }, { x: -70, y: 26, size: 0.8 }],
        colliders: [[4, 0, 17], [20, 0, 9], [-12, -16, 8], [-12, 16, 8],
            [30, -8, 5], [30, 8, 5], [46, -10, 5], [46, 10, 5], [62, -12, 5], [62, 12, 5],
            [24, -22, 6], [24, 22, 6], [38, -33, 6], [38, 33, 6], [50, -43, 6], [50, 43, 6],
            [-3, -32, 8], [-3, 32, 8], [0, -50, 8], [0, 50, 8], [4, -66, 7], [4, 66, 7],
            [-20, -30, 9], [-20, 30, 9], [-34, -19, 8], [-34, 19, 8], [-50, -22, 8], [-50, 22, 8], [-65, -26, 7], [-65, 26, 7]],
        jets: { retro: [[66, 14]], side: [[4, 70]], bow: [64, 13], stern: [-68, 30] },
        jetScale: 1.8,
        exhaust: '255,190,90',
        shieldColor: '255,200,120'
    },

    asgard: {
        id: 'asgard',
        hyperdrive: 3,          // built-in hyperdrive speed
        name: 'Asgard',
        className: "O'Neill-class",
        faction: 'Asgard',
        description: 'Pinnacle of Asgard engineering: pointed head, slender neck and vast crescent wings.',
        cost: 12000,
        color: '170,240,255',
        exhaust: '140,220,255',
        shieldColor: '150,230,255',
        mass: 5,
        hull: 300,
        baseShield: 100,
        cargo: 80,
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 92,
        art: [
            // Crescent wings with curved ribs, sweeping out from the rear body.
            { closed: true, pts: [[-20, -20], [-19.5, -32], [-20.5, -44], [-23.5, -56], [-28.5, -68], [-34, -78], [-37.5, -84],
                [-40.5, -82], [-44, -74], [-48.5, -63], [-53, -51], [-57.5, -39], [-61.5, -28], [-64, -19]] },
            mirrorPart({ closed: true, pts: [[-20, -20], [-19.5, -32], [-20.5, -44], [-23.5, -56], [-28.5, -68], [-34, -78], [-37.5, -84],
                [-40.5, -82], [-44, -74], [-48.5, -63], [-53, -51], [-57.5, -39], [-61.5, -28], [-64, -19]] }),
            { pts: [[-24, -24], [-24.5, -40], [-27, -54], [-32, -66], [-37, -76]] },
            { pts: mirror([[-24, -24], [-24.5, -40], [-27, -54], [-32, -66], [-37, -76]]) },
            { pts: [[-30, -28], [-34, -46], [-39, -62], [-41, -72]] },
            { pts: mirror([[-30, -28], [-34, -46], [-39, -62], [-41, -72]]) },
            { pts: [[-38, -26], [-45, -42], [-50, -56]] },
            { pts: mirror([[-38, -26], [-45, -42], [-50, -56]]) },
            // Engine pods and forward-pointing cannons on the wings.
            { closed: true, pts: [[-17, -37], [-26, -35.5], [-36, -36.5], [-38, -38.5], [-27, -40.5], [-17, -39]] },
            mirrorPart({ closed: true, pts: [[-17, -37], [-26, -35.5], [-36, -36.5], [-38, -38.5], [-27, -40.5], [-17, -39]] }),
            ...mirrorRect(-26, -56.8, -3, -55.2),
            { circle: [-2, -56, 1.4] }, { circle: [-2, 56, 1.4] },
            // Rear body: outer hull, collar, inner bay with cells.
            ellipse(-44, 0, 31, 24, 36),
            ellipse(-46, 0, 26, 20, 32),
            ellipse(-40, 0, 19, 14, 28),
            ...grid(-55, -8.5, 4, 2, 5.5, 7.5, 1.5),
            line(-60, 0, -21, 0),
            // Neck lined with window rows and ribbing.
            rect(17, -12, -15, 12),
            ...grid(-12, -11, 7, 1, 3, 3, 1.4), ...grid(-12, 8, 7, 1, 3, 3, 1.4),
            line(-14, -6, 16, -6), line(-14, 6, 16, 6),
            ...[-11, -8, -5, -2, 1, 4, 7, 10, 13].map(x => line(x, -6, x, 6)),
            // Head: hexagonal hull, inset deck, bat-wing chevrons and side vents.
            { closed: true, pts: symmetric([[78, -3], [76, -6], [45, -28], [24, -28], [17, -13], [17, 0]]) },
            { closed: true, pts: symmetric([[72, -2.5], [44, -23], [27, -23], [22, -12], [22, 0]]) },
            { pts: [[28, -19], [44, -12], [38, 0], [44, 12], [28, 19]] },
            { pts: [[64, -8], [53, 0], [64, 8]] },
            ...mirrorRect(34, -25.5, 26, -21.5),
            rect(78, -1.5, 80.5, 1.5)
        ],
        slots: [
            { id: 'nose', x: 58, y: 0 },
            { id: 'hl', x: 34, y: -18 },
            { id: 'hr', x: 34, y: 18 },
            { id: 'fwd', x: 2, y: 0 },
            { id: 'core', x: -33, y: 0 },
            { id: 'aft', x: -50, y: 0 },
            { id: 'fl', x: -36, y: -62 },
            { id: 'fr', x: -36, y: 62 },
            { id: 'tail', x: -68, y: 0 }
        ],
        engines: [{ x: -75, y: -7, size: 1.2 }, { x: -75, y: 7, size: 1.2 }, { x: -63, y: -22, size: 0.8 }, { x: -63, y: 22, size: 0.8 }],
        colliders: [[58, 0, 12], [40, -12, 11], [40, 12, 11], [26, 0, 12], [8, 0, 13], [-6, 0, 13],
            [-24, 0, 20], [-44, 0, 24], [-62, 0, 16],
            [-28, -40, 9], [-28, 40, 9], [-32, -58, 9], [-32, 58, 9], [-38, -74, 7], [-38, 74, 7],
            [-48, -52, 8], [-48, 52, 8], [-56, -34, 8], [-56, 34, 8]],
        jets: { retro: [[42, 27], [-36, 80]], side: [[30, 28], [-48, 66]], bow: [62, 12], stern: [-70, 22] },
        jetScale: 1.6
    },

    aurora: {
        id: 'aurora',
        hyperdrive: 2.2,          // built-in hyperdrive speed
        name: 'Aurora',
        className: 'Ancient warship',
        faction: 'Ancient',
        description: 'Lantean battleship: pointed bow, blocky drone module and broad rear wings. Fastest drive, ten mounts.',
        cost: 25000,
        color: '240,220,160',
        exhaust: '130,200,255',
        shieldColor: '255,230,160',
        mass: 6,
        hull: 420,
        baseShield: 160,
        cargo: 110,
        thrust: 1900,
        torque: 3.4,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 92,
        art: [
            // Broad rear wing blocks.
            { closed: true, pts: [[-58, -9], [-60, -28], [-66, -30], [-82, -30], [-85, -26], [-85, -9]] },
            { closed: true, pts: mirror([[-58, -9], [-60, -28], [-66, -30], [-82, -30], [-85, -26], [-85, -9]]) },
            ...mirrorRect(-64, -26, -80, -13),
            ...mirrorLine(-64, -19.5, -80, -19.5),
            ...mirrorRect(-85, -26, -87.5, -20),
            // Fins on the spine.
            { closed: true, pts: [[-37, -8], [-39, -24], [-44, -25], [-46, -8]] },
            { closed: true, pts: mirror([[-37, -8], [-39, -24], [-44, -25], [-46, -8]]) },
            ...mirrorLine(-40, -12, -42, -22),
            // Main hull: bow, forward module, mid-body, spine and stern.
            { closed: true, pts: symmetric([[88, 0], [80, -3], [56, -10], [50, -12], [48, -23], [44, -24], [22, -24], [19, -19.5], [-12, -19.5],
                [-17, -15], [-17, -8], [-58, -8], [-60, -9], [-87, -9], [-89, -5], [-89, 0]]) },
            ...mirrorRect(44, -22, 24, -17),
            line(80, 0, 50, 0), line(-17, 0, -84, 0),
            ...mirrorLine(80, -3, 50, -3),
            line(48, -12, 48, 12), line(22, -19.5, 22, 19.5),
            ...mirrorRect(42, -14, 26, -8),
            rect(14, -15, -12, 15),
            line(14, -15, -12, 15), line(-12, -15, 14, 15),
            { circle: [1, 0, 5] },
            ...mirrorLine(-40, -8, -40, -3), ...mirrorLine(-50, -8, -50, -3),
            rect(-89, -5, -92, -1), rect(-89, 1, -92, 5)
        ],
        slots: [
            { id: 'nose', x: 66, y: 0 },
            { id: 'fwd', x: 34, y: 0 },
            { id: 'pl', x: 34, y: -11 },
            { id: 'pr', x: 34, y: 11 },
            { id: 'core', x: 1, y: 0 },
            { id: 'mid', x: -26, y: 0 },
            { id: 'aft', x: -48, y: 0 },
            { id: 'fl', x: -72, y: -20 },
            { id: 'fr', x: -72, y: 20 },
            { id: 'tail', x: -78, y: 0 }
        ],
        engines: [{ x: -92, y: -3, size: 1.1 }, { x: -92, y: 3, size: 1.1 }, { x: -87.5, y: -23, size: 0.9 }, { x: -87.5, y: 23, size: 0.9 }],
        colliders: row([80, 68, 56, 44, 32, 20, 8, -4, -16, -28, -40, -52, -64, -76, -86], 0, 8)
            .concat([[34, -14, 9], [34, 14, 9], [6, -12, 8], [6, 12, 8], [-72, -20, 9], [-72, 20, 9], [-42, -16, 6], [-42, 16, 6]]),
        jets: { retro: [[48, 22], [-60, 26]], side: [[34, 24], [-74, 30]], bow: [72, 4.5], stern: [-86, 28] },
        jetScale: 1.6
    }
};

// Relative sizes: the line art above is drawn at a convenient size per ship; these factors
// rescale every hull so fighters are small and cruisers / motherships are properly big
// (not to true scale, a Ha'tak would fill the screen, but in proportion).
const SIZE = { x302: 0.75, glider: 0.75, jumper: 0.75, alkesh: 1.45, x303: 2, x304: 2.2, hatak: 2.6, asgard: 2.4, aurora: 2.4 };

const scalePoint = (p, k) => [p[0] * k, p[1] * k];
const scaleHull = (hull, k) => {
    hull.art = hull.art.map(part => {
        if(part.rect) return { rect: part.rect.map(v => v * k) };
        if(part.circle) return { circle: part.circle.map(v => v * k) };
        return { closed: part.closed, pts: part.pts.map(p => scalePoint(p, k)) };
    });
    hull.slots = hull.slots.map(slot => Object.assign({}, slot, { x: slot.x * k, y: slot.y * k }));
    hull.engines = hull.engines.map(e => ({ x: e.x * k, y: e.y * k, size: e.size * k }));
    hull.colliders = hull.colliders.map(c => [c[0] * k, c[1] * k, c[2] * k]);
    const jets = hull.jets;
    hull.jets = {
        retro: jets.retro.map(p => scalePoint(p, k)),
        side: jets.side.map(p => scalePoint(p, k)),
        bow: scalePoint(jets.bow, k),
        stern: scalePoint(jets.stern, k)
    };
    hull.radius *= k;
    hull.moduleScale *= k;
    hull.jetScale = (hull.jetScale || 1) * k;
    hull.sizeScale = k;
};
Object.keys(SIZE).forEach(id => { if(HULLS[id]) scaleHull(HULLS[id], SIZE[id]); });

const HULL_ORDER = ['x302', 'glider', 'jumper', 'x303', 'alkesh', 'x304', 'hatak', 'asgard', 'aurora'];
/* harmony export (immutable) */ __webpack_exports__["a"] = HULL_ORDER;


const partPoints = (part) => {
    if(part.rect) {
        const r = part.rect;
        return [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
    }
    return part.pts;
};

const hullBounds = (hull) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    hull.art.forEach(part => {
        const pts = part.circle
            ? [[part.circle[0] - part.circle[2], part.circle[1] - part.circle[2]], [part.circle[0] + part.circle[2], part.circle[1] + part.circle[2]]]
            : partPoints(part);
        pts.forEach(p => {
            minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};
/* harmony export (immutable) */ __webpack_exports__["d"] = hullBounds;


// Draws the hull's line art in local ship coordinates (caller sets the transform).
const drawHullArt = (ctx, hull, options) => {
    const opts = options || {};
    const color = opts.color || hull.color;
    const alpha = opts.alpha === undefined ? 1 : opts.alpha;

    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.lineWidth = opts.lineWidth || 1.1;
    ctx.strokeStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.shadowBlur = opts.glow === undefined ? 5 : opts.glow;
    ctx.shadowColor = 'rgba(' + color + ',' + (0.7 * alpha) + ')';

    hull.art.forEach(part => {
        ctx.beginPath();
        if(part.circle) {
            ctx.arc(part.circle[0], part.circle[1], part.circle[2], 0, Math.PI * 2);
        } else {
            const pts = partPoints(part);
            ctx.moveTo(pts[0][0], pts[0][1]);
            for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            if(part.closed || part.rect) ctx.closePath();
        }
        // Closed sections are filled dark so the line art reads against space (unless the
        // 3D view supplies a solid hull underneath).
        if((part.closed || part.rect) && opts.fill !== false) {
            ctx.fillStyle = 'rgba(8, 13, 24, ' + (0.85 * alpha) + ')';
            ctx.fill();
        }
        ctx.stroke();
    });

    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["c"] = drawHullArt;


// Smallest ellipse (with the hull's aspect ratio) that encloses every point of the
// line art, plus padding, so the shield never clips through the ship.
const shieldFor = (hull) => {
    if(hull._shield) return hull._shield;
    const b = hullBounds(hull);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const hw = (b.maxX - b.minX) / 2;
    const hh = (b.maxY - b.minY) / 2;
    let scale = 0;
    hull.art.forEach(part => {
        const pts = part.circle ? [[part.circle[0] + part.circle[2], part.circle[1]], [part.circle[0], part.circle[1] + part.circle[2]]] : partPoints(part);
        pts.forEach(p => {
            const nx = (p[0] - cx) / hw;
            const ny = (p[1] - cy) / hh;
            scale = Math.max(scale, Math.sqrt(nx * nx + ny * ny));
        });
    });
    const padding = 4 + hull.radius * 0.06;
    hull._shield = { x: cx, y: cy, rx: hw * scale + padding, ry: hh * scale + padding };
    return hull._shield;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = shieldFor;


/* harmony default export */ __webpack_exports__["b"] = (HULLS);


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// All game sounds. The engine and thruster loops use the recorded samples; weapons,
// impacts and effects are synthesized with the Web Audio API.
//
// Every sound is layered (a sub-bass "body", a mid punch and a noisy transient) and
// runs through a compressor; heavy weapons also send into a generated reverb so shots
// and explosions have a big, rolling tail instead of a thin "toy" blip.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.5);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.18);
const explosionSound = new Audio('./assets/sounds/explosion2.mp3');

// play() returns a promise that rejects when autoplay is blocked; ignore it.
const safePlay = (audio) => {
    const result = audio.play();
    if(result && result.catch) result.catch(() => {});
};

const setLooping = (audio, on) => {
    if(on && audio.paused) safePlay(audio);
    if(!on && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
    }
};

const playOneShot = (audio, volume) => {
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    safePlay(audio);
};

// ------------------------------------------------------------ Web Audio graph

let ac = null;
let master = null;      // dry bus -> compressor -> speakers
let reverb = null;      // wet bus -> convolver -> compressor
let drive = null;       // weapon bus -> saturation -> bass boost -> master (aggressive, heavy)
let noiseBuffer = null;
const lastPlayed = {};

// Decaying stereo noise: a cheap but convincing "big hangar / space" reverb.
const createImpulse = (c, seconds, decay) => {
    const length = Math.floor(c.sampleRate * seconds);
    const impulse = c.createBuffer(2, length, c.sampleRate);
    for(let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for(let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return impulse;
};

const context = () => {
    if(ac) return ac;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();

        const compressor = ac.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 12;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        const output = ac.createGain();
        output.gain.value = 0.9;
        compressor.connect(output);
        output.connect(ac.destination);

        master = ac.createGain();
        master.gain.value = 0.7;
        master.connect(compressor);

        // Weapon bus: soft-clipping saturation thickens and roughens everything, and a
        // low-shelf boost adds chest-thumping weight.
        const shaper = ac.createWaveShaper();
        const curve = new Float32Array(2048);
        for(let i = 0; i < curve.length; i++) {
            const x = i / (curve.length - 1) * 2 - 1;
            curve[i] = Math.tanh(x * 3.2) / Math.tanh(3.2);
        }
        shaper.curve = curve;
        shaper.oversample = '2x';
        const lowShelf = ac.createBiquadFilter();
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = 140;
        lowShelf.gain.value = 7;
        const tame = ac.createBiquadFilter();
        tame.type = 'lowpass';
        tame.frequency.value = 7000;
        drive = ac.createGain();
        drive.gain.value = 0.9;
        drive.connect(shaper);
        shaper.connect(lowShelf);
        lowShelf.connect(tame);
        tame.connect(master);

        const convolver = ac.createConvolver();
        convolver.buffer = createImpulse(ac, 2.4, 3);
        reverb = ac.createGain();
        reverb.gain.value = 0.55;
        reverb.connect(convolver);
        convolver.connect(compressor);

        noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        loadSamples(ac);
    } catch(e) {
        ac = null;
    }
    return ac;
};

// Limits how often one effect can retrigger, so rapid events don't turn into noise.
const throttle = (name, seconds) => {
    const c = context();
    if(!c) return null;
    if(lastPlayed[name] && c.currentTime - lastPlayed[name] < seconds) return null;
    lastPlayed[name] = c.currentTime;
    return c;
};

// Gain envelope feeding the dry bus, plus an optional reverb send (`wet` 0..1).
// Gain envelope feeding the dry bus (or the weapon `drive` bus when `driven`), plus an
// optional reverb send (`wet` 0..1).
const envelope = (c, peak, attack, decay, wet, driven) => {
    const gain = c.createGain();
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    gain.connect(driven ? drive : master);
    if(wet) {
        const send = c.createGain();
        send.gain.value = wet;
        gain.connect(send);
        send.connect(reverb);
    }
    return gain;
};

// Shorthand for weapon layers: always through the saturating drive bus.
const heavy = (c, peak, attack, decay, wet) => envelope(c, peak, attack, decay, wet, true);

const tone = (c, type, from, to, duration, output) => {
    const osc = c.createOscillator();
    const now = c.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    osc.connect(output);
    osc.start(now);
    osc.stop(now + duration + 0.05);
    return osc;
};

const noise = (c, duration, filterType, from, to, output, q) => {
    const source = c.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    const now = c.currentTime;
    filter.type = filterType;
    filter.Q.value = q || 1;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
    source.connect(filter);
    filter.connect(output);
    source.start(now, Math.random() * 0.5);
    source.stop(now + duration + 0.05);
};

// Deep layered detonation used by missiles, drones and big impacts.
const boom = (c, size, wet) => {
    tone(c, 'sine', 80 + 20 / size, 24, 1.3 * size, heavy(c, 0.7, 0.003, 1.3 * size, wet));
    tone(c, 'sawtooth', 120, 32, 0.5 * size, heavy(c, 0.25, 0.002, 0.5 * size, wet * 0.5));
    noise(c, 1.5 * size, 'lowpass', 1800, 50, heavy(c, 0.6, 0.002, 1.5 * size, wet));
    noise(c, 0.35, 'bandpass', 2500, 500, envelope(c, 0.12, 0.002, 0.3, wet), 1.2);
};

// Random pitch variation so rapid fire never sounds like the same sample repeating.
const vary = (amount) => 1 + (Math.random() - 0.5) * 2 * amount;

// Ring-modulated tone: a carrier multiplied by a modulator gives the buzzing,
// electric timbre of energy weapons (instead of a clean "beep").
const ringTone = (c, type, from, to, modFrequency, duration, output) => {
    const carrier = c.createOscillator();
    const modulator = c.createOscillator();
    const ring = c.createGain();
    const now = c.currentTime;
    carrier.type = type;
    carrier.frequency.setValueAtTime(from, now);
    carrier.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    modulator.type = 'square';
    modulator.frequency.value = modFrequency;
    ring.gain.value = 0;
    modulator.connect(ring.gain);
    carrier.connect(ring);
    ring.connect(output);
    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + duration + 0.05);
    modulator.stop(now + duration + 0.05);
};

// Band-passed noise whose centre frequency sweeps: whooshes and "tsew" sounds.
const sweep = (c, duration, from, to, q, output) => noise(c, duration, 'bandpass', from, to, output, q);

// Short metallic "tang": two inharmonic partials through a resonant band-pass.
const metal = (c, base, duration, output) => {
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = base * 1.3;
    filter.Q.value = 9;
    filter.connect(output);
    tone(c, 'square', base, base * 0.97, duration, filter);
    tone(c, 'square', base * 1.37, base * 1.33, duration, filter);
};

// ------------------------------------------------------------ sustained voices

const createVoice = (build) => {
    let voice = null;
    return {
        start(level) {
            const c = context();
            if(!c) return;
            if(!voice) voice = build(c);
            const target = Math.max(0.0001, level === undefined ? 1 : level) * voice.peak;
            voice.gain.gain.cancelScheduledValues(c.currentTime);
            voice.gain.gain.setTargetAtTime(target, c.currentTime, 0.08);
        },
        stop() {
            if(!voice || !ac) return;
            const v = voice;
            voice = null;
            const now = ac.currentTime;
            v.gain.gain.cancelScheduledValues(now);
            v.gain.gain.setTargetAtTime(0.0001, now, 0.06);
            v.nodes.forEach(n => n.stop(now + 0.4));
        }
    };
};

// Asgard beam: detuned saws through a wobbling band-pass, a sub-bass drone and crackle.
const beamVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);
    const send = c.createGain();
    send.gain.value = 0.3;
    gain.connect(send);
    send.connect(reverb);

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2.5;
    filter.connect(gain);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 7.5;
    lfoGain.gain.value = 520;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = b.type = 'sawtooth';
    a.frequency.value = 146;
    b.frequency.value = 148.6;
    a.connect(filter);
    b.connect(filter);

    const sub = c.createOscillator();
    const subGain = c.createGain();
    sub.type = 'sine';
    sub.frequency.value = 55;
    subGain.gain.value = 0.9;
    sub.connect(subGain);
    subGain.connect(gain);

    const crackle = c.createBufferSource();
    crackle.buffer = noiseBuffer;
    crackle.loop = true;
    const crackleFilter = c.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 3500;
    const crackleGain = c.createGain();
    crackleGain.gain.value = 0.25;
    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(gain);

    const nodes = [a, b, lfo, sub, crackle];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.2 };
});

// Minigun "BRRRT": a low, distorted growl chopped at the rate of fire, layered under
// the individual rounds while the guns are firing.
const minigunVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);

    const chop = c.createGain();
    chop.gain.value = 0.5;
    chop.connect(gain);
    const rate = c.createOscillator();
    const depth = c.createGain();
    rate.type = 'square';
    rate.frequency.value = 17;
    depth.gain.value = 0.5;
    rate.connect(depth);
    depth.connect(chop.gain);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 2;
    filter.connect(chop);
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = 'sawtooth';
    b.type = 'square';
    a.frequency.value = 48;
    b.frequency.value = 97;
    a.connect(filter);
    b.connect(filter);

    const rumble = c.createBufferSource();
    rumble.buffer = noiseBuffer;
    rumble.loop = true;
    const rumbleFilter = c.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 300;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(chop);

    const nodes = [a, b, rate, rumble];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.28 };
});

// Tractor beam: a soft shimmering chord over a breathy, slowly sweeping "air" layer.
const tractorVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.4;
    gain.connect(send);
    send.connect(reverb);

    const tremolo = c.createGain();
    tremolo.gain.value = 0.7;
    tremolo.connect(gain);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);

    const nodes = [lfo];
    [[220, 0.5], [330, 0.35], [440.8, 0.25], [659, 0.12]].forEach(pair => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = pair[0];
        g.gain.value = pair[1];
        osc.connect(g);
        g.connect(tremolo);
        nodes.push(osc);
    });

    const air = c.createBufferSource();
    air.buffer = noiseBuffer;
    air.loop = true;
    const airFilter = c.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.Q.value = 6;
    airFilter.frequency.value = 900;
    const sweep = c.createOscillator();
    const sweepGain = c.createGain();
    sweep.frequency.value = 0.7;
    sweepGain.gain.value = 500;
    sweep.connect(sweepGain);
    sweepGain.connect(airFilter.frequency);
    const airGain = c.createGain();
    airGain.gain.value = 0.35;
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(gain);
    nodes.push(air, sweep);

    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.09 };
});

// ------------------------------------------------------------ public API

// ------------------------------------------------------------ recorded samples
//
// Stargate, weapon and ship sounds from the Stargate Carter Addon Pack (CAP) resources
// (https://github.com/RafaelDeJongh/cap_resources, CC BY-NC-SA 4.0, see
// assets/sounds/cap/CREDITS.txt). Until a sample has been decoded (or if it fails to),
// the synthesized version plays.

const SAMPLE_FILES = {
    dhd_press: ['stargate/dhd/sg1/press.mp3', 'stargate/dhd/sg1/press_2.mp3', 'stargate/dhd/sg1/press_3.mp3',
        'stargate/dhd/sg1/press_4.mp3', 'stargate/dhd/sg1/press_5.mp3', 'stargate/dhd/sg1/press_6.mp3', 'stargate/dhd/sg1/press_7.mp3'],
    dhd_dome: ['stargate/stargate/dhd/dhd_usual_dial.mp3'],
    dial_fail: ['stargate/dial_fail_sg1.mp3'],
    // Same files CAP's Milky Way gate uses for a DHD dial (stargate_sg1, event_horizon).
    gate_spin: ['alexalx/stargate/gate_roll_long.mp3'],
    chevron: ['stargate/chevron_dhd.mp3'],
    chevron_lock: ['stargate/chevron_lock.mp3'],
    kawoosh: ['stargate/sg1/open.mp3'],
    horizon: ['stargate/wormhole_loop.wav'],
    gate_enter: ['stargate/teleport.mp3', 'stargate/teleport_2.mp3', 'stargate/teleport_3.mp3', 'stargate/teleport_4.mp3'],
    wormhole: ['stargate/gate_travel.mp3'],
    gate_close: ['stargate/gate_close.mp3'],
    hyper_window: ['tech/hyperwindow.mp3'],
    railgun: ['weapons/railgun_shoot.wav'],
    staff: ['pulse_weapon/staff_weapon.mp3'],
    missile: ['f302/missilefire.mp3'],
    drone: ['weapons/drone_shot.mp3'],
    asgard_beam: ['weapons/asgard_beam.mp3'],
    // Ship shield impacts: CAP's ship-shield crackle for light knocks, the deep gate-shield
    // impacts for weapon hits and heavy blows.
    shield_hit: ['shields/shield_hit.mp3'],
    shield_hit_heavy: ['stargate/shield/hit.mp3', 'stargate/shield/hit_2.mp3'],
    shield_up: ['shields/shield_engage.mp3'],
    shield_down: ['shields/shield_disengage.mp3'],
    door: ['door/atlantis_door_open.mp3'],
    button: ['button/ancient_button1.wav', 'button/ancient_button2.wav'],
    scan: ['glebqip/tracking.wav'],
    ship_explosion: ['jumper/jumperexplosion.mp3']
};
const LOOPING_SAMPLES = { gate_spin: true, horizon: true };
const buffers = {};
const loops = {};
const lastShots = {};
let samplesRequested = false;

// The sound files are packed into assets/sounds/cap-sounds.js (tools/pack-sounds.js), a
// local script that sets window.CAP_SOUNDS, so nothing is fetched and it also works when
// index.html is opened from disk. Each sound is decoded once into a Web Audio buffer, which
// is cheap to play any number of times.
const toArrayBuffer = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

function loadSamples(c) {
    if(samplesRequested) return;
    const packed = window.CAP_SOUNDS;
    if(!packed) {
        // The sound script is still loading: try again shortly.
        setTimeout(() => loadSamples(c), 300);
        return;
    }
    samplesRequested = true;
    // Decode one file at a time so starting the game doesn't stall.
    const queue = [];
    Object.keys(SAMPLE_FILES).forEach(name => {
        buffers[name] = [];
        SAMPLE_FILES[name].forEach((file, i) => { if(packed[file]) queue.push([name, i, file]); });
    });
    const next = () => {
        const item = queue.shift();
        if(!item) {
            window.CAP_SOUNDS = null;   // free the encoded copies
            return;
        }
        const done = (buffer) => {
            if(buffer) buffers[item[0]][item[1]] = buffer;
            setTimeout(next, 0);
        };
        try {
            // Callback form: older Safari has no promise-returning decodeAudioData.
            c.decodeAudioData(toArrayBuffer(packed[item[2]]), done, () => done(null));
        } catch(e) {
            done(null);
        }
    };
    next();
}

// Play sample `name` (a random variant, or options.variant). Returns false if it isn't
// loaded yet so the caller can fall back to the synthesized sound.
//   options: { variant, rate, wet (reverb send 0..1) }
const playSample = (name, volume, options) => {
    const list = buffers[name];
    if(!ac || !list) return false;
    const opts = options || {};
    const count = SAMPLE_FILES[name].length;
    const index = opts.variant !== undefined ? Math.abs(opts.variant) % count : Math.floor(Math.random() * count);
    const buffer = list[index] || list.filter(Boolean)[0];
    const level = volume === undefined ? 0.9 : volume;
    if(!buffer) return false;

    if(LOOPING_SAMPLES[name]) {
        const playing = loops[name];
        if(playing) {
            playing.gain.gain.setTargetAtTime(level, ac.currentTime, 0.05);
            return true;
        }
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = opts.rate || 1;
    const gain = ac.createGain();
    gain.gain.value = level;
    source.connect(gain);
    gain.connect(master);
    if(opts.wet) {
        const send = ac.createGain();
        send.gain.value = opts.wet;
        gain.connect(send);
        send.connect(reverb);
    }
    if(LOOPING_SAMPLES[name]) {
        source.loop = true;
        loops[name] = { source: source, gain: gain };
    } else {
        lastShots[name] = { source: source, gain: gain };
    }
    source.start();
    return true;
};

// Fade out the most recent one-shot of `name` (e.g. the wormhole ride on arrival).
const cutSample = (name, fade) => {
    const shot = lastShots[name];
    if(!shot || !ac) return;
    delete lastShots[name];
    shot.gain.gain.setTargetAtTime(0.0001, ac.currentTime, fade || 0.15);
    try { shot.source.stop(ac.currentTime + (fade || 0.15) * 6); } catch(e) { /* already stopped */ }
};

const stopSample = (name) => {
    const playing = loops[name];
    if(!playing || !ac) return;
    delete loops[name];
    playing.gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.08);
    try { playing.source.stop(ac.currentTime + 0.5); } catch(e) { /* already stopped */ }
};

// Grinding rumble of the inner ring turning.
const gateSpinVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);
    const grind = c.createBufferSource();
    grind.buffer = noiseBuffer;
    grind.loop = true;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 220;
    band.Q.value = 1.5;
    grind.connect(band);
    band.connect(gain);
    const motor = c.createOscillator();
    const motorGain = c.createGain();
    motor.type = 'sawtooth';
    motor.frequency.value = 46;
    motorGain.gain.value = 0.35;
    motor.connect(motorGain);
    motorGain.connect(gain);
    const wobble = c.createOscillator();
    const wobbleGain = c.createGain();
    wobble.frequency.value = 7;
    wobbleGain.gain.value = 60;
    wobble.connect(wobbleGain);
    wobbleGain.connect(band.frequency);
    const nodes = [grind, motor, wobble];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.35 };
});

// Deep, watery hum of an open event horizon.
const horizonVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.5;
    gain.connect(send);
    send.connect(reverb);
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = 'sine';
    b.type = 'triangle';
    a.frequency.value = 62;
    b.frequency.value = 93.5;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.8;
    lfoGain.gain.value = 0.35;
    const mod = c.createGain();
    mod.gain.value = 0.65;
    lfo.connect(lfoGain);
    lfoGain.connect(mod.gain);
    a.connect(mod);
    b.connect(mod);
    mod.connect(gain);
    const water = c.createBufferSource();
    water.buffer = noiseBuffer;
    water.loop = true;
    const waterFilter = c.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 500;
    waterFilter.Q.value = 4;
    const sweep2 = c.createOscillator();
    const sweepGain = c.createGain();
    sweep2.frequency.value = 0.35;
    sweepGain.gain.value = 250;
    sweep2.connect(sweepGain);
    sweepGain.connect(waterFilter.frequency);
    const waterGain = c.createGain();
    waterGain.gain.value = 0.25;
    water.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(gain);
    const nodes = [a, b, lfo, water, sweep2];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.3 };
});

// Roaring rumble while travelling in hyperspace.
const hyperVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);
    const roar = c.createBufferSource();
    roar.buffer = noiseBuffer;
    roar.loop = true;
    const low = c.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 380;
    roar.connect(low);
    low.connect(gain);
    const tone1 = c.createOscillator();
    const toneGain = c.createGain();
    tone1.type = 'sine';
    tone1.frequency.value = 55;
    toneGain.gain.value = 0.5;
    tone1.connect(toneGain);
    toneGain.connect(gain);
    const nodes = [roar, tone1];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.3 };
});

const gateSounds = {
    // DHD key: a soft electronic "bwoop", pitched by the key's position on the ring.
    dhdPress(index) {
        if(playSample('dhd_press', 0.9, { rate: 0.97 + Math.random() * 0.06 })) return;
        const c = context();
        if(!c) return;
        const f = 520 + (index % 13) * 22;
        tone(c, 'sine', f * 1.25, f, 0.18, envelope(c, 0.16, 0.004, 0.18, 0.3));
        tone(c, 'triangle', f * 0.5, f * 0.48, 0.12, envelope(c, 0.08, 0.002, 0.12, 0.2));
        noise(c, 0.02, 'highpass', 5000, 4000, envelope(c, 0.05, 0.001, 0.02));
    },

    // Pressing the big dome: a heavy, rising activation tone.
    dhdDome() {
        if(playSample('dhd_dome', 0.9)) return;
        const c = context();
        if(!c) return;
        tone(c, 'sine', 140, 320, 0.5, heavy(c, 0.4, 0.01, 0.5, 0.5));
        tone(c, 'triangle', 560, 880, 0.4, envelope(c, 0.08, 0.01, 0.4, 0.5));
        noise(c, 0.08, 'lowpass', 1200, 300, heavy(c, 0.25, 0.001, 0.08));
    },

    dialFail() {
        if(playSample('dial_fail', 0.9)) return;
        const c = context();
        if(!c) return;
        tone(c, 'square', 160, 150, 0.45, heavy(c, 0.18, 0.005, 0.45, 0.3));
        tone(c, 'square', 113, 110, 0.45, heavy(c, 0.14, 0.005, 0.45, 0.3));
    },

    gateSpin(on) {
        if(!on) {
            stopSample('gate_spin');
            gateSpinVoice.stop();
            return;
        }
        if(!playSample('gate_spin', 0.9, { rate: 0.97 })) gateSpinVoice.start();
    },

    // Chevron locking: a heavy mechanical "ka-chunk" with a resonant metal clang.
    chevronLock(final) {
        // CAP plays each with a random pitch of 97-104%.
        if(playSample(final ? 'chevron_lock' : 'chevron', 1, { rate: 0.97 + Math.random() * 0.07 })) return;
        const c = context();
        if(!c) return;
        noise(c, 0.08, 'lowpass', 2500, 400, heavy(c, 0.5, 0.001, 0.08, 0.3));
        tone(c, 'sine', 120, 45, 0.35, heavy(c, 0.7, 0.002, 0.35, 0.4));
        [310, 467, 692, 1010].forEach((f, i) => {
            tone(c, 'sine', f, f * 0.995, 0.9 - i * 0.15, envelope(c, 0.06 / (i + 1), 0.003, 0.9 - i * 0.15, 0.6));
        });
        setTimeout(() => {
            if(!ac) return;
            noise(ac, 0.06, 'lowpass', 1800, 300, heavy(ac, 0.35, 0.001, 0.06, 0.3));
            tone(ac, 'sine', 95, 40, 0.25, heavy(ac, 0.5, 0.002, 0.25, 0.3));
        }, 140);
        if(final) tone(c, 'sine', 70, 35, 0.9, heavy(c, 0.6, 0.01, 0.9, 0.6));
    },

    // The kawoosh: a huge rushing surge that splashes out and is sucked back in.
    kawoosh() {
        if(playSample('kawoosh', 1, { rate: 0.98 + Math.random() * 0.04 })) return;
        const c = context();
        if(!c) return;
        sweep(c, 1.4, 150, 2200, 1.2, heavy(c, 0.55, 0.12, 1.3, 0.7));
        noise(c, 1.6, 'lowpass', 900, 120, heavy(c, 0.5, 0.25, 1.4, 0.7));
        tone(c, 'sine', 55, 30, 1.5, heavy(c, 0.7, 0.2, 1.4, 0.6));
        for(let i = 0; i < 14; i++) {
            setTimeout(() => {
                if(!ac) return;
                const f = 200 + Math.random() * 700;
                tone(ac, 'sine', f, f * (0.4 + Math.random() * 0.4), 0.12, envelope(ac, 0.05, 0.005, 0.12, 0.6));
            }, 300 + i * 55);
        }
    },

    horizon(on) {
        if(!on) {
            stopSample('horizon');
            horizonVoice.stop();
            return;
        }
        if(!playSample('horizon', 0.7)) horizonVoice.start();
    },

    // Riding the wormhole: a long, roaring, flanging rush.
    wormhole() {
        if(playSample('wormhole', 1)) return;
        const c = context();
        if(!c) return;
        sweep(c, 3.4, 300, 2600, 1.5, heavy(c, 0.45, 0.3, 3.1, 0.6));
        sweep(c, 3.4, 2400, 400, 2, envelope(c, 0.18, 0.4, 3, 0.6));
        noise(c, 3.4, 'lowpass', 600, 150, heavy(c, 0.45, 0.2, 3.2, 0.5));
        tone(c, 'sine', 48, 70, 3.2, heavy(c, 0.5, 0.3, 3, 0.4));
    },

    // Something passing through the event horizon (CAP's teleport splash).
    gateEnter() {
        playSample('gate_enter', 1, { rate: 0.9 + Math.random() * 0.2 });
    },

    // Arriving: cut the wormhole ride short and splash out of the horizon.
    gateArrive() {
        cutSample('wormhole', 0.12);
        playSample('gate_enter', 1, { rate: 0.9 + Math.random() * 0.2 });
    },

    gateClose(silent) {
        if(silent) return;
        if(playSample('gate_close', 1, { rate: 0.97 + Math.random() * 0.06 })) return;
        const c = context();
        if(!c) return;
        sweep(c, 0.8, 1800, 200, 2, envelope(c, 0.25, 0.01, 0.8, 0.6));
        tone(c, 'sine', 180, 40, 0.7, heavy(c, 0.35, 0.005, 0.7, 0.5));
    },

    // Hyperspace window opening: a deep "whoomph" and a swirling rising rush.
    hyperOpen() {
        if(playSample('hyper_window', 1, { wet: 0.2 })) return;
        const c = context();
        if(!c) return;
        tone(c, 'sine', 70, 28, 1.2, heavy(c, 0.8, 0.01, 1.2, 0.6));
        sweep(c, 1.5, 200, 3000, 1.3, heavy(c, 0.45, 0.2, 1.3, 0.7));
        ringTone(c, 'sawtooth', 120, 600, 40, 1.2, heavy(c, 0.18, 0.2, 1, 0.6));
    },

    hyperTravel(on) {
        if(!on) {
            hyperVoice.stop();
            return;
        }
        hyperVoice.start();
    },

    hyperExit() {
        if(playSample('hyper_window', 1, { rate: 1.08, wet: 0.2 })) return;
        const c = context();
        if(!c) return;
        noise(c, 0.1, 'lowpass', 3000, 800, heavy(c, 0.4, 0.001, 0.1));
        tone(c, 'sine', 90, 30, 1, heavy(c, 0.7, 0.005, 1, 0.6));
        sweep(c, 1, 2500, 250, 1.5, heavy(c, 0.3, 0.01, 1, 0.6));
    }
};

let beamOn = false;

const sounds = {
    // Must be called from a user gesture (e.g. the launch click) so audio can start.
    unlock() {
        const c = context();
        if(c && c.state === 'suspended') c.resume();
    },

    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    // Minigun growl underneath the per-round shots.
    setFiring(on) { if(on) minigunVoice.start(); else minigunVoice.stop(); },
    setBeam(on) {
        if(on && !beamOn) sounds.beamCharge();
        beamOn = on;
        if(on) beamVoice.start(); else beamVoice.stop();
    },

    // Asgard ion cannon spinning up as the beam fires: a fast, distorted rising roar.
    beamCharge() {
        const c = throttle('beamCharge', 0.2);
        if(!c) return;
        if(playSample('asgard_beam', 0.85, { wet: 0.2 })) return;
        ringTone(c, 'sawtooth', 90, 600, 60, 0.22, heavy(c, 0.35, 0.01, 0.22, 0.4));
        tone(c, 'sine', 70, 38, 0.5, heavy(c, 0.7, 0.002, 0.5, 0.4));
        noise(c, 0.15, 'lowpass', 3000, 600, heavy(c, 0.25, 0.001, 0.15, 0.3));
    },
    // `level` 0..1 grows with the number of ore pieces held.
    setTractor(on, level) { if(on) tractorVoice.start(0.5 + 0.5 * (level || 0)); else tractorVoice.stop(); },

    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },
    // The player's ship blowing up.
    shipExplosion() {
        if(!playSample('ship_explosion', 1, { wet: 0.3 })) sounds.explosion(1);
    },
    // Console button (stabilizer and other toggles).
    toggle(on) {
        if(playSample('button', 0.6, { variant: on ? 0 : 1 })) return;
        const c = context();
        if(c) tone(c, 'sine', on ? 700 : 500, on ? 900 : 380, 0.12, envelope(c, 0.08, 0.003, 0.12));
    },

    // Heavy minigun round: a deep chest-punch thump, a gritty saturated body and a
    // low-mid crack (no thin high tones), randomised so the stream sounds like a growl.
    minigunShot() {
        const c = throttle('minigun', 0.035);
        if(!c) return;
        const v = vary(0.08);
        // Recorded railgun round with a sub-bass thump underneath for weight.
        if(playSample('railgun', 0.5, { rate: vary(0.06) })) {
            tone(c, 'sine', 95 * v, 34, 0.13, heavy(c, 0.45, 0.001, 0.13, 0.12));
            return;
        }
        tone(c, 'sine', 95 * v, 34, 0.13, heavy(c, 0.75, 0.001, 0.13, 0.12));
        tone(c, 'sawtooth', 170 * v, 55, 0.07, heavy(c, 0.32, 0.001, 0.07, 0.1));
        noise(c, 0.06, 'lowpass', 3200 * v, 500, heavy(c, 0.45, 0.0008, 0.06, 0.15));
        noise(c, 0.03, 'bandpass', 1400 * v, 700, heavy(c, 0.2, 0.0005, 0.03), 1.4);
    },

    // Round striking an asteroid: dull dusty thud on the outside, harder crunch on the core.
    rockHit(hard) {
        const c = throttle('rockHit', 0.03);
        if(!c) return;
        const v = vary(0.1);
        tone(c, 'sine', 110 * v, 40, 0.1, heavy(c, 0.3, 0.001, 0.1));
        if(hard) noise(c, 0.08, 'bandpass', 2200 * v, 900, heavy(c, 0.18, 0.001, 0.08, 0.15), 1.2);
        else noise(c, 0.14, 'lowpass', 1000 * v, 200, heavy(c, 0.25, 0.002, 0.14, 0.1));
    },

    // Goa'uld staff weapon: a snarling, distorted "tsew" sweeping down into a deep
    // concussion, with crackling plasma and a long rolling tail.
    staffShot() {
        const c = throttle('staff', 0.08);
        if(!c) return;
        const v = vary(0.05);
        if(playSample('staff', 0.85, { rate: vary(0.04), wet: 0.25 })) {
            tone(c, 'sine', 120 * v, 28, 0.6, heavy(c, 0.5, 0.002, 0.6, 0.3));
            return;
        }
        ringTone(c, 'sawtooth', 1100 * v, 120, 58, 0.36, heavy(c, 0.38, 0.002, 0.36, 0.5));
        sweep(c, 0.32, 3200 * v, 300, 3, heavy(c, 0.35, 0.001, 0.32, 0.45));
        tone(c, 'sine', 120 * v, 28, 0.7, heavy(c, 0.8, 0.002, 0.7, 0.4));
        tone(c, 'square', 70 * v, 30, 0.3, heavy(c, 0.2, 0.002, 0.3, 0.3));
        noise(c, 0.2, 'highpass', 4000, 2000, envelope(c, 0.06, 0.001, 0.2, 0.3));
    },

    // Staff blast hitting: a crackling, distorted plasma burst over a deep boom.
    plasmaImpact() {
        const c = throttle('plasmaImpact', 0.06);
        if(!c) return;
        boom(c, 0.75, 0.45);
        ringTone(c, 'sawtooth', 600, 70, 45, 0.4, heavy(c, 0.22, 0.002, 0.4, 0.5));
    },

    // Tau'ri missile: a hard ignition punch, then a roaring, distorted rocket that climbs away.
    missileLaunch() {
        const c = throttle('missile', 0.05);
        if(!c) return;
        if(playSample('missile', 0.9, { rate: vary(0.04), wet: 0.2 })) return;
        tone(c, 'sine', 100, 30, 0.4, heavy(c, 0.7, 0.002, 0.4, 0.3));
        noise(c, 0.06, 'lowpass', 3000, 800, heavy(c, 0.3, 0.001, 0.06));
        sweep(c, 1.2, 250, 1600, 0.8, heavy(c, 0.4, 0.04, 1.15, 0.45));
        noise(c, 1, 'lowpass', 700, 120, heavy(c, 0.35, 0.02, 0.95, 0.4));
    },

    missileExplosion() {
        const c = throttle('boom', 0.05);
        if(!c) return;
        noise(c, 0.08, 'lowpass', 3000, 900, heavy(c, 0.35, 0.001, 0.08));
        boom(c, 1.2, 0.6);
    },

    // Ancient drone: a deep, menacing rush of air with a low hum and a growling whistle,
    // rather than a thin high whine.
    droneLaunch() {
        const c = throttle('drones', 0.07);
        if(!c) return;
        const v = vary(0.06);
        if(playSample('drone', 0.75, { rate: v, wet: 0.25 })) return;
        sweep(c, 0.75, 250 * v, 1400, 2.2, heavy(c, 0.45, 0.02, 0.72, 0.5));
        tone(c, 'sawtooth', 110 * v, 220, 0.6, heavy(c, 0.22, 0.03, 0.58, 0.5));
        tone(c, 'sine', 380 * v, 720, 0.55, heavy(c, 0.12, 0.03, 0.52, 0.6));
        tone(c, 'sine', 70 * v, 45, 0.5, heavy(c, 0.5, 0.01, 0.5, 0.3));
    },

    // Drone detonation: a hard energy crack into a deep, rolling, distorted blast.
    droneImpact() {
        const c = throttle('droneImpact', 0.05);
        if(!c) return;
        ringTone(c, 'sawtooth', 900, 90, 70, 0.3, heavy(c, 0.3, 0.001, 0.3, 0.6));
        boom(c, 1.05, 0.6);
    },

    beamImpact() {
        const c = throttle('beamImpact', 0.09);
        if(!c) return;
        noise(c, 0.1, 'bandpass', 3000, 1500, envelope(c, 0.08, 0.002, 0.1), 2);
    },

    overheat() {
        const c = throttle('overheat', 0.5);
        if(!c) return;
        tone(c, 'square', 880, 880, 0.08, envelope(c, 0.08, 0.002, 0.08));
        setTimeout(() => { if(ac) tone(ac, 'square', 660, 660, 0.12, envelope(ac, 0.08, 0.002, 0.12)); }, 120);
        noise(c, 0.7, 'highpass', 3000, 1200, envelope(c, 0.07, 0.05, 0.7, 0.3));
    },

    // Something striking raised shields: an electric zap with a resonant hum.
    // Like CAP's shields: at most one impact sound every 0.25 s, pitch 90-110%.
    shieldHit(strength) {
        const c = throttle('shield', 0.25);
        if(!c) return;
        const s = Math.max(0.3, Math.min(1.5, strength || 1));
        const rate = 0.9 + Math.random() * 0.2;
        if(s >= 0.9 && playSample('shield_hit_heavy', 0.55 + 0.3 * Math.min(1, s - 0.9), { rate: rate })) return;
        if(playSample('shield_hit', 0.45 + 0.4 * s, { rate: rate })) return;
        tone(c, 'sine', 1500, 260, 0.35, envelope(c, 0.2 * s, 0.002, 0.35, 0.4));
        tone(c, 'sawtooth', 120, 70, 0.3, envelope(c, 0.12 * s, 0.002, 0.3, 0.3));
        noise(c, 0.2, 'highpass', 5000, 2000, envelope(c, 0.08 * s, 0.001, 0.2, 0.3));
    },

    shieldUp() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        if(playSample('shield_up', 0.8)) return;
        tone(c, 'sine', 160, 900, 0.55, envelope(c, 0.2, 0.02, 0.55, 0.5));
        tone(c, 'triangle', 320, 1800, 0.5, envelope(c, 0.07, 0.02, 0.5, 0.5));
    },

    shieldDown() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        if(playSample('shield_down', 0.8)) return;
        tone(c, 'sine', 900, 110, 0.5, envelope(c, 0.18, 0.01, 0.5, 0.5));
        noise(c, 0.45, 'bandpass', 2000, 300, envelope(c, 0.06, 0.01, 0.45, 0.3), 2);
    },

    hullHit() {
        const c = throttle('hull', 0.1);
        if(!c) return;
        boom(c, 0.5, 0.25);
        tone(c, 'square', 90, 40, 0.25, envelope(c, 0.15, 0.002, 0.25));
    },

    rockCrack() {
        const c = throttle('crack', 0.06);
        if(!c) return;
        noise(c, 0.35, 'bandpass', 1500, 250, envelope(c, 0.4, 0.001, 0.35, 0.35), 0.8);
        tone(c, 'triangle', 200, 55, 0.3, envelope(c, 0.22, 0.001, 0.3, 0.3));
    },

    // Deep rumble as asteroids grind together and merge.
    merge(size) {
        const c = throttle('merge', 0.15);
        if(!c) return;
        const volume = Math.min(0.5, 0.15 + size / 200);
        noise(c, 1.4, 'lowpass', 400, 60, envelope(c, volume, 0.15, 1.3, 0.4));
        tone(c, 'sine', 70, 40, 1.2, envelope(c, volume * 0.6, 0.1, 1.2, 0.3));
    },

    // Asteroid glancing off the Atlantis city shield.
    cityShield(volume) {
        const c = throttle('cityShield', 0.12);
        if(!c) return;
        const v = Math.max(0.02, Math.min(0.3, volume));
        tone(c, 'sine', 700, 160, 0.7, envelope(c, v, 0.004, 0.7, 0.6));
        tone(c, 'triangle', 1400, 480, 0.45, envelope(c, v * 0.4, 0.004, 0.45, 0.6));
        noise(c, 0.3, 'highpass', 4000, 1800, envelope(c, v * 0.3, 0.002, 0.3, 0.4));
    },

    // Tractor beam latching onto a new piece of ore.
    tractorLock() {
        const c = throttle('tractorLock', 0.06);
        if(!c) return;
        tone(c, 'sine', 700, 1150, 0.14, envelope(c, 0.07, 0.005, 0.14, 0.4));
    },

    // Ore stowed in the hold: a little two-note chime, higher for valuable ore.
    pickup(value) {
        const c = throttle('pickup', 0.05);
        if(!c) return;
        const f = 620 + Math.min(600, value * 6);
        tone(c, 'triangle', f, f, 0.09, envelope(c, 0.09, 0.002, 0.09, 0.3));
        setTimeout(() => { if(ac) tone(ac, 'sine', f * 1.5, f * 1.5, 0.16, envelope(ac, 0.07, 0.002, 0.16, 0.3)); }, 60);
    },

    // Scanner sweep ping.
    scanPing() {
        const c = throttle('scan', 0.5);
        if(!c) return;
        if(playSample('scan', 0.35)) return;
        tone(c, 'sine', 1320, 1240, 0.5, envelope(c, 0.08, 0.004, 0.5, 0.7));
        tone(c, 'sine', 660, 640, 0.6, envelope(c, 0.05, 0.004, 0.6, 0.7));
    },

    dock() {
        const c = context();
        if(!c) return;
        if(playSample('door', 0.8)) return;
        tone(c, 'sine', 660, 660, 0.25, envelope(c, 0.15, 0.01, 0.25, 0.4));
        setTimeout(() => { if(ac) tone(ac, 'sine', 990, 990, 0.4, envelope(ac, 0.15, 0.01, 0.4, 0.4)); }, 160);
    },

    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        beamVoice.stop();
        tractorVoice.stop();
        minigunVoice.stop();
        gateSpinVoice.stop();
        horizonVoice.stop();
        hyperVoice.stop();
        Object.keys(loops).forEach(stopSample);
    }
};

Object.assign(sounds, gateSounds);

/* harmony default export */ __webpack_exports__["a"] = (sounds);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__modules__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__world_materials__ = __webpack_require__(1);
// Persistent player profile: credits, owned hulls and the module loadout of each hull.





const BASE_MAGNET_RANGE = 90;
const REPAIR_COST_PER_HP = 2;
/* harmony export (immutable) */ __webpack_exports__["a"] = REPAIR_COST_PER_HP;


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
        if(!__WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][profile.hull] || (!profile.debug && profile.ownedHulls.indexOf(profile.hull) === -1)) profile.hull = 'x302';
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

const onProfileChange = (fn) => listeners.push(fn);
/* harmony export (immutable) */ __webpack_exports__["l"] = onProfileChange;


const getProfile = () => profile;
/* harmony export (immutable) */ __webpack_exports__["g"] = getProfile;


const loadoutFor = (hullId) => {
    if(!profile.loadouts[hullId]) profile.loadouts[hullId] = {};
    return profile.loadouts[hullId];
};
/* harmony export (immutable) */ __webpack_exports__["j"] = loadoutFor;


const addCredits = (amount) => {
    profile.credits += amount;
    save();
};
/* harmony export (immutable) */ __webpack_exports__["b"] = addCredits;


const recordScore = (score) => {
    if(score > profile.bestScore) {
        profile.bestScore = score;
        save();
    }
};
/* unused harmony export recordScore */


// ------------------------------------------------------------ debug mode
// Debug mode unlocks every hull and makes every purchase, upgrade and repair free.
// Selling gives nothing back while it's on, so it can't be used to farm credits.

const isDebug = () => !!profile.debug;
/* harmony export (immutable) */ __webpack_exports__["i"] = isDebug;


const setDebug = (on) => {
    profile.debug = !!on;
    save();
};
/* harmony export (immutable) */ __webpack_exports__["s"] = setDebug;


// What something costs right now (0 in debug mode).
const priceOf = (cost) => (profile.debug ? 0 : cost);
/* harmony export (immutable) */ __webpack_exports__["n"] = priceOf;


const ownsHull = (hullId) => !!profile.debug || profile.ownedHulls.indexOf(hullId) !== -1;
/* harmony export (immutable) */ __webpack_exports__["m"] = ownsHull;


const selectHull = (hullId) => {
    if(!ownsHull(hullId)) return false;
    profile.hull = hullId;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["p"] = selectHull;


const buyHull = (hullId) => {
    const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][hullId];
    if(ownsHull(hullId) || profile.credits < priceOf(hull.cost)) return false;
    profile.credits -= priceOf(hull.cost);
    profile.ownedHulls.push(hullId);
    profile.hull = hullId;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["c"] = buyHull;


const installModule = (hullId, slotId, type) => {
    const loadout = loadoutFor(hullId);
    if(__WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].minHullMass && __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][hullId].mass < __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].minHullMass) return false;
    if(loadout[slotId] || profile.credits < priceOf(__WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost)) return false;
    profile.credits -= priceOf(__WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost);
    loadout[slotId] = { type: type, level: 1 };
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["h"] = installModule;


const upgradeModule = (hullId, slotId) => {
    const module = loadoutFor(hullId)[slotId];
    if(!module || module.level >= __WEBPACK_IMPORTED_MODULE_1__modules__["a" /* MAX_LEVEL */]) return false;
    const cost = priceOf(Object(__WEBPACK_IMPORTED_MODULE_1__modules__["g" /* upgradeCost */])(module.type, module.level));
    if(profile.credits < cost) return false;
    profile.credits -= cost;
    module.level++;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["v"] = upgradeModule;


const sellModule = (hullId, slotId) => {
    const loadout = loadoutFor(hullId);
    const module = loadout[slotId];
    if(!module) return false;
    profile.credits += priceOf(Object(__WEBPACK_IMPORTED_MODULE_1__modules__["f" /* sellValue */])(module.type, module.level));
    delete loadout[slotId];
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["r"] = sellModule;


// Combine hull + modules into the numbers the ship flies with.
// `loadoutOverride` builds stats for a loadout that isn't the player's (enemy ships).
const computeShipStats = (hullId, loadoutOverride) => {
    const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][hullId];
    const loadout = loadoutOverride || loadoutFor(hullId);

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
        scanner: null,
        // Some hulls come with a hyperdrive built in.
        hyperdrive: hull.hyperdrive ? { speed: hull.hyperdrive } : null,
        modules: []
    };

    hull.slots.forEach(slot => {
        const module = loadout[slot.id];
        if(!module) return;
        const s = Object(__WEBPACK_IMPORTED_MODULE_1__modules__["e" /* moduleStats */])(module.type, module.level);
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
        if(module.type === 'hyperdrive') {
            if(!stats.hyperdrive || s.speed > stats.hyperdrive.speed) stats.hyperdrive = s;
        }
        if(module.type === 'scanner') {
            if(!stats.scanner || s.range > stats.scanner.range) stats.scanner = s;
        }
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
/* harmony export (immutable) */ __webpack_exports__["f"] = computeShipStats;


// ------------------------------------------------------------ cargo & market

const cargoUsed = () => Object.keys(profile.cargo).reduce((sum, id) => sum + profile.cargo[id], 0);
/* harmony export (immutable) */ __webpack_exports__["d"] = cargoUsed;


// Adds one unit of ore if it fits. Returns true when stored.
const storeOre = (material, capacity) => {
    if(cargoUsed() >= capacity) return false;
    profile.cargo[material] = (profile.cargo[material] || 0) + 1;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["u"] = storeOre;


const cargoValue = () => Object.keys(profile.cargo)
    .reduce((sum, id) => sum + profile.cargo[id] * __WEBPACK_IMPORTED_MODULE_2__world_materials__["b" /* default */][id].price, 0);
/* harmony export (immutable) */ __webpack_exports__["e"] = cargoValue;


const sellCargo = (material) => {
    const ids = material ? [material] : Object.keys(profile.cargo);
    let earned = 0;
    ids.forEach(id => {
        earned += (profile.cargo[id] || 0) * __WEBPACK_IMPORTED_MODULE_2__world_materials__["b" /* default */][id].price;
        delete profile.cargo[id];
    });
    profile.credits += earned;
    save();
    return earned;
};
/* harmony export (immutable) */ __webpack_exports__["q"] = sellCargo;


// Jettison ore from the hold. Returns how many units were removed.
const removeCargo = (material, count) => {
    const have = profile.cargo[material] || 0;
    const removed = Math.min(have, count);
    if(removed <= 0) return 0;
    if(have - removed > 0) profile.cargo[material] = have - removed;
    else delete profile.cargo[material];
    save();
    return removed;
};
/* harmony export (immutable) */ __webpack_exports__["o"] = removeCargo;


const loseCargo = () => {
    profile.cargo = {};
    save();
};
/* harmony export (immutable) */ __webpack_exports__["k"] = loseCargo;


const spendCredits = (amount) => {
    if(profile.credits < priceOf(amount)) return false;
    profile.credits -= priceOf(amount);
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["t"] = spendCredits;



/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Star systems you can travel between, the constellations used as Stargate symbols, and
// the gate addresses.
//
// Gate addresses work like coordinates: six constellation symbols form three pairs, and
// the line between each pair passes through the destination; where the three lines meet
// is the destination world. The seventh symbol is the point of origin of the gate you
// dial from. Addresses here are generated from that geometry (constellations sit on a
// large sphere around the map), so the starmap can draw the three lines meeting exactly
// at the world.

const CONSTELLATIONS = [
    'Andromeda', 'Aquarius', 'Aries', 'Auriga', 'Bootes', 'Cancer', 'Canis Minor', 'Capricornus',
    'Centaurus', 'Cetus', 'Corona Australis', 'Crater', 'Equuleus', 'Eridanus', 'Gemini', 'Hydra',
    'Leo', 'Leo Minor', 'Libra', 'Lynx', 'Microscopium', 'Monoceros', 'Norma', 'Orion',
    'Pegasus', 'Perseus', 'Pisces', 'Piscis Austrinus', 'Sagittarius', 'Scorpius', 'Sculptor', 'Scutum',
    'Serpens Caput', 'Sextans', 'Taurus', 'Triangulum', 'Virgo', 'Aquila'
];
/* harmony export (immutable) */ __webpack_exports__["a"] = CONSTELLATIONS;


// Map units: 1 unit = 1 light year. Constellations sit on a sphere around everything.
const SPHERE_RADIUS = 3600;

const SYSTEMS = [
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
/* harmony export (immutable) */ __webpack_exports__["b"] = SYSTEMS;


const systemById = (id) => SYSTEMS.filter(s => s.id === id)[0] || SYSTEMS[0];
/* harmony export (immutable) */ __webpack_exports__["g"] = systemById;


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

const constellationPosition = (index) => geometry.positions[index];
/* harmony export (immutable) */ __webpack_exports__["e"] = constellationPosition;


// Six constellation indices for a destination.
const addressOf = (systemId) => geometry.addresses[systemId].slice();
/* harmony export (immutable) */ __webpack_exports__["d"] = addressOf;


// Which system (if any) a 6-symbol address leads to.
const systemForAddress = (glyphs) => {
    const key = glyphs.join(',');
    const match = SYSTEMS.filter(s => geometry.addresses[s.id].join(',') === key)[0];
    return match || null;
};
/* harmony export (immutable) */ __webpack_exports__["h"] = systemForAddress;


// The three lines of an address, as pairs of 3D points (for the starmap).
const addressLines = (systemId) => {
    const g = geometry.addresses[systemId];
    return [[g[0], g[1]], [g[2], g[3]], [g[4], g[5]]].map(pair => [geometry.positions[pair[0]], geometry.positions[pair[1]]]);
};
/* harmony export (immutable) */ __webpack_exports__["c"] = addressLines;


const distanceBetween = (a, b) => {
    const d = sub(systemById(a).map, systemById(b).map);
    return Math.sqrt(dot(d, d));
};
/* harmony export (immutable) */ __webpack_exports__["f"] = distanceBetween;



/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__missile_missile__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particle_particle__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__render_sprites__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__shipyard_modules__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__physics_physics__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__audio_audio__ = __webpack_require__(3);









// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or switching on the X stabilizer).
const SECONDARY_THRUST = 0.55;    // retro / strafe thrust relative to main engines
const MAX_SPEED = 600;            // px/s, safety cap only
const MASS_UNIT = 300;            // physics mass per hull mass point

const BULLET_SPEED = 1100;
const BULLET_SPREAD = 0.022;
const PLASMA_SPEED = 520;
const RECOIL = 0.8;               // px/s per round for a mass-1 hull (a gentle zero-g nudge)
const TURRET_TURN_RATE = 14;      // rad/s
const SALVO_GAP = 0.12;           // s between launchers firing
const SHIELD_FLASH_TIME = 0.35;   // s the whole shield bubble glows after a hit
const MISSILE_LOCK_RADIUS = 150;  // px around the cursor
const HEAT_COOLING = 0.35;        // minigun heat lost per second
const HEAT_RESUME = 0.3;          // overheated guns resume below this heat

// Damage types: shields shrug off kinetic rounds and missiles but are drained fast by
// energy weapons; bare hull is the opposite (armour soaks energy, kinetic punches through).
const SHIELD_FACTOR = { kinetic: 0.5, energy: 1.5 };
const HULL_FACTOR = { kinetic: 1.25, energy: 0.6 };
const DAMAGE_TYPE = { bullet: 'kinetic', missile: 'kinetic', plasma: 'energy', beam: 'energy', drone: 'energy' };
/* harmony export (immutable) */ __webpack_exports__["a"] = DAMAGE_TYPE;

// Weapon effectiveness against ships (asteroid damage is unchanged): rapid-fire guns and
// beams are tuned for mining, heavy ordnance for fighting.
const SHIP_DAMAGE = { bullet: 0.5, plasma: 1, beam: 0.35, missile: 1.15, drone: 1.3 };
/* harmony export (immutable) */ __webpack_exports__["b"] = SHIP_DAMAGE;

// Auto-targeting modes (with a targeting computer), cycled with T.
const TARGET_MODES = ['both', 'ships', 'asteroids'];
/* harmony export (immutable) */ __webpack_exports__["c"] = TARGET_MODES;

const TARGET_MODE_LABEL = { both: 'Ships + asteroids', ships: 'Ships', asteroids: 'Asteroids' };
/* harmony export (immutable) */ __webpack_exports__["d"] = TARGET_MODE_LABEL;


const HIT_COOLDOWN = 0.25;
const SHIELD_REGEN_DELAY = 2;
const SPAWN_IMMUNITY = 2;

const TURRET_TYPES = ['minigun', 'staff', 'beam'];
const LAUNCHER_TYPES = ['missile', 'drones'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

// Distance along a ray to the first asteroid outline it hits.
const raycastRocks = (x, y, dirX, dirY, range, rocks) => {
    let best = null;
    let bestDistance = range;
    rocks.forEach(rock => {
        if(rock.dead) return;
        const hit = rock.raycast(x, y, dirX, dirY, bestDistance);
        if(hit !== null && hit < bestDistance) {
            bestDistance = hit;
            best = rock;
        }
    });
    return { rock: best, distance: bestDistance };
};

// Hull line art with its glow, rendered once per hull and colour.
const hullSprite = (hull, color, linesOnly) => {
    hull._sprites = hull._sprites || {};
    const key = (color || 'base') + (linesOnly ? ':lines' : '');
    if(!hull._sprites[key]) {
        const b = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["d" /* hullBounds */])(hull);
        const pad = 8;
        const w = b.maxX - b.minX + pad * 2;
        const h = b.maxY - b.minY + pad * 2;
        // Keep very large hull sprites to a sensible size in memory.
        const res = Math.min(Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["h" /* spriteResolution */])(), 2048 / Math.max(w, h));
        const sprite = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["a" /* createSprite */])(w, h, ctx => {
            ctx.translate(pad - b.minX, pad - b.minY);
            Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["c" /* drawHullArt */])(ctx, hull, { color: color, fill: !linesOnly });
        }, res);
        sprite.x = b.minX - pad;
        sprite.y = b.minY - pad;
        hull._sprites[key] = sprite;
    }
    return hull._sprites[key];
};

// Shield bubble (soft edge, hexagon lattice and glowing rim) rendered once per hull.
const shieldSprite = (hull) => {
    if(hull._shieldSprite) return hull._shieldSprite;
    const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(hull);
    const color = hull.shieldColor || '120,210,255';
    const pad = 6;
    const shieldRes = Math.min(Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["h" /* spriteResolution */])(), 2048 / (Math.max(s.rx, s.ry) * 2 + pad * 2));
    hull._shieldSprite = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["a" /* createSprite */])(s.rx * 2 + pad * 2, s.ry * 2 + pad * 2, ctx => {
        ctx.translate(s.rx + pad, s.ry + pad);
        ctx.scale(1, s.ry / s.rx);
        const rx = s.rx;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        const body = ctx.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
        body.addColorStop(0, 'rgba(' + color + ', 0)');
        body.addColorStop(0.8, 'rgba(' + color + ', 0.05)');
        body.addColorStop(1, 'rgba(' + color + ', 0.22)');
        ctx.fillStyle = body;
        ctx.fill();
        ctx.save();
        ctx.clip();
        const lattice = new Path2D();
        const size = 7;
        const w = size * Math.sqrt(3);
        for(let row = -Math.ceil(rx / (size * 1.5)); row <= Math.ceil(rx / (size * 1.5)); row++) {
            for(let col = -Math.ceil(rx / w) - 1; col <= Math.ceil(rx / w) + 1; col++) {
                const cx = col * w + (row % 2 ? w / 2 : 0);
                const cy = row * size * 1.5;
                if(cx * cx + cy * cy > (rx + size) * (rx + size)) continue;
                for(let i = 0; i < 6; i++) {
                    const a1 = Math.PI / 6 + i * Math.PI / 3;
                    lattice.moveTo(cx + Math.cos(a1) * size, cy + Math.sin(a1) * size);
                    lattice.lineTo(cx + Math.cos(a1 + Math.PI / 3) * size, cy + Math.sin(a1 + Math.PI / 3) * size);
                }
            }
        }
        // Lattice is brighter towards the rim.
        const fade = ctx.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx);
        fade.addColorStop(0, 'rgba(' + color + ', 0.03)');
        fade.addColorStop(1, 'rgba(' + color + ', 0.2)');
        ctx.strokeStyle = fade;
        ctx.lineWidth = 0.6;
        ctx.stroke(lattice);
        ctx.restore();
        ctx.strokeStyle = 'rgba(' + color + ', 0.55)';
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.stroke();
    }, shieldRes);
    hull._shieldSprite.pad = pad;
    return hull._shieldSprite;
};

class Ship {

    constructor(x, y, stats) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.angularVelocity = 0;
        this.alive = true;
        this.stabilizer = false;   // toggled with X / the Stabilizer button
        this.weaponsOff = {};      // weapon kinds switched off by the pilot (1-5 / weapon panel)
        this.side = 'player';      // 'player' or 'enemy': who its shots can hurt
        this.targetMode = 'both';  // what auto-targeting goes for (see TARGET_MODES)
        this.damageScale = 1;      // multiplier on the damage its weapons deal
        this.autoTarget = true;
        this.time = 0;
        this.exhaustTimer = 0;
        this.firing = false;
        this.minigunFiring = false;
        this.beaming = false;
        this.hitCooldown = 0;
        this.immunity = SPAWN_IMMUNITY;
        this.sinceHit = SHIELD_REGEN_DELAY;
        this.shieldFlash = 0;
        this.hullFlash = 0;
        this.salvoCooldown = 0;
        this.nextLauncher = 0;
        this.missileLock = null;
        this.shieldsEnabled = true;
        this.shieldLevel = 0;         // animated 0..1 power level of the bubble
        this.shieldImpacts = [];

        // Animated thruster output levels (0..1), eased towards their targets.
        this.thrusters = { main: 0, retro: 0, left: 0, right: 0, spinCW: 0, spinCCW: 0 };

        this.applyStats(stats);
        this.hp = this.maxHull;
        this.shield = this.maxShield;
    }

    // (Re)build the ship from shipyard stats. Keeps current damage proportionally.
    applyStats(stats) {
        const hullFraction = this.maxHull ? this.hp / this.maxHull : 1;
        const hull = stats.hull;

        this.stats = stats;
        this.hullDef = hull;
        this.mass = stats.mass * MASS_UNIT;
        this.radius = hull.radius;
        this.maxHull = stats.maxHull;
        this.hp = this.maxHull * hullFraction;
        this.maxShield = stats.maxShield;
        this.shield = Math.min(this.shield || 0, this.maxShield);
        this.guidance = stats.guidance;
        this.scanner = stats.scanner;
        this.hyperdrive = stats.hyperdrive;
        this.cargoCapacity = stats.cargo;
        // Big hulls reach further with the tractor (it starts from the hull's edge).
        this.magnetRange = stats.magnetRange + Math.max(0, hull.radius - 30) * 0.8;
        this.collectRadius = hull.radius * 0.55 + 8;

        const u = hull.moduleScale;
        this.turrets = stats.modules.filter(m => TURRET_TYPES.indexOf(m.type) !== -1).map(m => ({
            module: m,
            kind: m.type,
            aim: this.angle,
            cooldown: 0,
            target: null,
            flash: 0,
            heat: 0,
            overheated: false,
            beamTime: 0,
            beam: null
        }));
        this.launchers = stats.modules.filter(m => LAUNCHER_TYPES.indexOf(m.type) !== -1)
            .map(m => ({ module: m, kind: m.type, cooldown: 0 }));
        this.engines = hull.engines.concat(stats.modules
            .filter(m => m.type === 'engine')
            .map(m => ({ x: m.slot.x - 4 * u, y: m.slot.y, size: (0.45 + m.level * 0.15) * u * 1.6 })));
        this.jetList = this.buildJets();
    }

    // Manoeuvring jet positions from the hull definition: [x, y, dirX, dirY].
    buildJets() {
        const j = this.hullDef.jets;
        const both = (points, dirX) => {
            const list = [];
            points.forEach(p => {
                list.push([p[0], p[1], dirX, 0]);
                list.push([p[0], -p[1], dirX, 0]);
            });
            return list;
        };
        return {
            retro: both(j.retro, 1),
            left: j.side.map(p => [p[0], Math.abs(p[1]), 0, 1]),
            right: j.side.map(p => [p[0], -Math.abs(p[1]), 0, -1]),
            spinCW: [[j.bow[0], -j.bow[1], 0, -1], [j.stern[0], j.stern[1], 0, 1]],
            spinCCW: [[j.bow[0], j.bow[1], 0, 1], [j.stern[0], -j.stern[1], 0, -1]]
        };
    }

    // Lets homing missiles and drones track ships the same way as asteroids.
    get dead() {
        return !this.alive;
    }

    get shieldUp() {
        return this.shieldsEnabled && this.alive && this.maxShield > 0 && this.shield > 0.5;
    }

    toggleShields() {
        if(this.maxShield <= 0) return false;
        this.shieldsEnabled = !this.shieldsEnabled;
        if(this.shieldsEnabled) __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldUp();
        else __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldDown();
        return true;
    }

    // Converts a world point into shield-ellipse space.
    shieldLocal(worldX, worldY) {
        const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(this.hullDef);
        const cos = Math.cos(-this.angle);
        const sin = Math.sin(-this.angle);
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        return { x: dx * cos - dy * sin - s.x, y: dx * sin + dy * cos - s.y, s: s };
    }

    // Circle vs shield-ellipse contact. Returns the outward normal (world space),
    // overlap depth and contact point, or null when not touching.
    shieldContact(worldX, worldY, radius) {
        const l = this.shieldLocal(worldX, worldY);
        const s = l.s;
        const k = Math.sqrt((l.x / s.rx) * (l.x / s.rx) + (l.y / s.ry) * (l.y / s.ry)) || 0.0001;
        const length = Math.sqrt(l.x * l.x + l.y * l.y) || 0.0001;
        const gap = length * (1 - 1 / k);
        const overlap = radius - gap;
        if(overlap <= 0) return null;

        const px = l.x / k;
        const py = l.y / k;
        let nx = px / (s.rx * s.rx);
        let ny = py / (s.ry * s.ry);
        const n = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= n;
        ny /= n;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const contact = this.localToWorld(px + s.x, py + s.y);
        return {
            nx: nx * cos - ny * sin,
            ny: nx * sin + ny * cos,
            overlap: overlap,
            x: contact.x,
            y: contact.y
        };
    }

    // Ripple on the shield where something struck it.
    shieldImpact(worldX, worldY, strength) {
        const l = this.shieldLocal(worldX, worldY);
        const k = Math.sqrt((l.x / l.s.rx) * (l.x / l.s.rx) + (l.y / l.s.ry) * (l.y / l.s.ry)) || 1;
        this.shieldImpacts.push({ x: l.x / k, y: l.y / k, life: 1, strength: Math.min(1.5, strength) });
        if(this.shieldImpacts.length > 12) this.shieldImpacts.shift();
        // The whole bubble lights up, brighter for harder hits.
        this.shieldFlash = Math.max(this.shieldFlash, SHIELD_FLASH_TIME * (0.6 + 0.4 * Math.min(1, strength)));
    }

    // Ore that hits raised shields burns up and costs a sliver of shield energy.
    absorbOre(worldX, worldY) {
        this.shield = Math.max(0, this.shield - 0.25);
        this.sinceHit = 0;
        this.shieldImpact(worldX, worldY, 0.8);
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldHit(0.5);
    }

    // Where the tractor beam comes from: the ore tractor module if fitted, else the hull centre.
    tractorEmitter() {
        const module = this.stats.modules.filter(m => m.type === 'magnet')[0];
        return module ? this.localToWorld(module.slot.x, module.slot.y) : { x: this.x, y: this.y };
    }

    get thrusting() {
        const t = this.thrusters;
        return t.main > 0.2 || t.retro > 0.2 || t.left > 0.2 || t.right > 0.2 ||
            t.spinCW > 0.2 || t.spinCCW > 0.2;
    }

    localToWorld(lx, ly) {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return { x: this.x + lx * cos - ly * sin, y: this.y + lx * sin + ly * cos };
    }

    worldColliders() {
        return this.hullDef.colliders.map(c => {
            const p = this.localToWorld(c[0], c[1]);
            return { x: p.x, y: p.y, r: c[2] };
        });
    }

    update(dt, input, world) {
        if(!this.alive) {
            this.firing = false;
            this.minigunFiring = false;
            this.beaming = false;
            return;
        }

        this.time += dt;
        if(this.hitCooldown > 0) this.hitCooldown -= dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.shieldFlash > 0) this.shieldFlash -= dt;
        if(this.hullFlash > 0) this.hullFlash -= dt;
        if(this.salvoCooldown > 0) this.salvoCooldown -= dt;
        this.sinceHit += dt;

        if(this.sinceHit > SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.stats.shieldRegen * dt);
        }
        const targetLevel = this.shieldUp ? 1 : 0;
        this.shieldLevel += (targetLevel - this.shieldLevel) * Math.min(1, dt * (targetLevel ? 3 : 5));
        this.shieldImpacts.forEach(impact => { impact.life -= dt * 1.4; });
        this.shieldImpacts = this.shieldImpacts.filter(impact => impact.life > 0);

        this.fly(dt, input, world.particles);
        this.updateTargeting(input, world);
        this.updateTurrets(dt, input, world);
        this.updateLaunchers(dt, input, world);
    }

    fly(dt, input, particles) {
        const stats = this.stats;
        const mainThrust = stats.acceleration;
        const secondaryThrust = mainThrust * SECONDARY_THRUST;
        const angularThrust = stats.angularAcceleration;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Desired force in the ship's local frame (+x forward, +y right) and torque.
        let localX = 0;
        let localY = 0;
        let torque = 0;

        if(input.forward) localX += mainThrust;
        if(input.backward) localX -= secondaryThrust;
        if(input.strafeLeft) localY -= secondaryThrust;
        if(input.strafeRight) localY += secondaryThrust;
        if(input.rotateRight) torque += angularThrust;
        if(input.rotateLeft) torque -= angularThrust;

        // Stabilizer (toggled on/off): fires whatever thrusters are needed to cancel drift
        // and spin that the pilot isn't asking for. With no thrust input it brakes to a
        // stop; while thrusting it only cancels sideways drift, so the ship flies where it
        // points. Spin is cancelled whenever the pilot isn't turning.
        if(this.stabilizer) {
            let driftX = this.vx;
            let driftY = this.vy;
            const commanded = Math.sqrt(localX * localX + localY * localY);
            if(commanded > 0) {
                // Keep the velocity along the commanded direction (if moving that way).
                const dirX = (localX * cos - localY * sin) / commanded;
                const dirY = (localX * sin + localY * cos) / commanded;
                const along = Math.max(0, this.vx * dirX + this.vy * dirY);
                driftX -= dirX * along;
                driftY -= dirY * along;
            }
            const drift = Math.sqrt(driftX * driftX + driftY * driftY);
            if(drift > 1) {
                const brake = Math.min(secondaryThrust, drift / dt);
                const worldX = -driftX / drift * brake;
                const worldY = -driftY / drift * brake;
                localX += worldX * cos + worldY * sin;
                localY += -worldX * sin + worldY * cos;
            }
            if(!input.rotateLeft && !input.rotateRight && Math.abs(this.angularVelocity) > 0.01) {
                torque -= clamp(this.angularVelocity / dt, -angularThrust, angularThrust);
            }
        }

        this.vx += (localX * cos - localY * sin) * dt;
        this.vy += (localX * sin + localY * cos) * dt;
        this.angularVelocity = clamp(this.angularVelocity + torque * dt, -stats.maxTurn, stats.maxTurn);

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > MAX_SPEED) {
            this.vx *= MAX_SPEED / speed;
            this.vy *= MAX_SPEED / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.angularVelocity * dt;

        this.animateThrusters(dt, localX / mainThrust, localY / secondaryThrust, torque / angularThrust);
        this.emitExhaust(dt, particles);
    }

    animateThrusters(dt, forward, side, spin) {
        const t = this.thrusters;
        const targets = {
            main: clamp(forward, 0, 1),
            retro: clamp(-forward / SECONDARY_THRUST, 0, 1),
            left: clamp(-side, 0, 1),
            right: clamp(side, 0, 1),
            spinCW: clamp(spin, 0, 1),
            spinCCW: clamp(-spin, 0, 1)
        };
        // Quick spool-up, slightly slower cut-off.
        Object.keys(targets).forEach(key => {
            const rate = targets[key] > t[key] ? 18 : 10;
            t[key] += (targets[key] - t[key]) * Math.min(1, rate * dt);
        });
    }

    // Spits hot exhaust particles out of the engines (and puffs from the jets).
    emitExhaust(dt, particles) {
        const t = this.thrusters;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        this.exhaustTimer -= dt;
        if(this.exhaustTimer > 0) return;
        this.exhaustTimer = 1 / 90;

        if(t.main > 0.15) {
            this.engines.forEach(engine => {
                const nozzle = this.localToWorld(engine.x, engine.y);
                const spread = (Math.random() - 0.5) * 0.3;
                const speed = (160 + Math.random() * 120) * Math.sqrt(engine.size);
                particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                    x: nozzle.x,
                    y: nozzle.y,
                    vx: this.vx - Math.cos(this.angle + spread) * speed * t.main,
                    vy: this.vy - Math.sin(this.angle + spread) * speed * t.main,
                    life: 0.2 + Math.random() * 0.2,
                    size: (2 + Math.random() * 2) * Math.sqrt(engine.size),
                    color: this.hullDef.exhaust || '255,150,60'
                }));
                if(Math.random() < 0.35 * t.main) {
                    particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                        x: nozzle.x, y: nozzle.y,
                        vx: this.vx - Math.cos(this.angle + spread * 2) * speed * 1.2,
                        vy: this.vy - Math.sin(this.angle + spread * 2) * speed * 1.2,
                        life: 0.3 + Math.random() * 0.4, size: 1.6, color: '255,220,160', pixel: true, glow: true
                    }));
                }
            });
        }

        const jets = this.jetList;
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.2 || Math.random() > 0.5) return;
            jets[key].forEach(jet => {
                const p = this.localToWorld(jet[0], jet[1]);
                const dx = jet[2] * cos - jet[3] * sin;
                const dy = jet[2] * sin + jet[3] * cos;
                const speed = 60 + Math.random() * 60;
                particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                    x: p.x, y: p.y,
                    vx: this.vx + dx * speed, vy: this.vy + dy * speed,
                    life: 0.15 + Math.random() * 0.15,
                    size: 2,
                    color: '200,225,255'
                }));
            });
        });
    }

    nearestRock(x, y, rocks, range) {
        let best = null;
        let bestDist = range * range;
        const from = { x: x, y: y };
        rocks.forEach(rock => {
            if(rock.dead) return;
            const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(from, rock);
            const distSq = d.x * d.x + d.y * d.y;
            if(distSq < bestDist) {
                bestDist = distSq;
                best = rock;
            }
        });
        return best;
    }

    // Nearest of `list` (ships, missiles or rocks) within `range` of (x, y). Ships count
    // from their hull edge, so big ships are in reach as soon as any part of them is.
    nearestOf(x, y, list, range) {
        let best = null;
        let bestDist = Infinity;
        list.forEach(item => {
            if(item.dead) return;
            const dx = item.x - x;
            const dy = item.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy) - (item.hullDef ? item.radius * 0.8 : 0);
            if(dist < range && dist < bestDist) {
                bestDist = dist;
                best = item;
            }
        });
        return best;
    }

    // Guidance: pick turret targets and the missile lock. Kinetic turrets shoot down
    // incoming missiles first, then hostile ships, then asteroids.
    updateTargeting(input, world) {
        const rocks = world.rocks;
        if(!this.guidance) {
            this.missileLock = null;
            this.turrets.forEach(turret => { turret.target = null; });
            return;
        }

        const range = this.guidance.range + this.radius;
        const combat = world.combat;
        const ships = combat && this.targetMode !== 'asteroids' ? combat.hostileShips(this.side) : [];
        const rockList = this.targetMode === 'ships' ? [] : rocks;
        // Point defence only bothers with missiles actually closing in.
        const incoming = combat ? combat.hostileMissiles(this.side, 'missile').filter(m => {
            const dx = this.x - m.x;
            const dy = this.y - m.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            return d < 400 + this.radius && (m.vx * dx + m.vy * dy) / (d || 1) > 100;
        }) : [];
        this.missileLock = this.nearestOf(input.aimX, input.aimY, ships, MISSILE_LOCK_RADIUS * 1.5)
            || this.nearestRock(input.aimX, input.aimY, rockList, MISSILE_LOCK_RADIUS)
            || this.nearestOf(this.x, this.y, ships, range * 1.6)
            || this.nearestRock(this.x, this.y, rockList, range);

        this.turrets.forEach(turret => {
            if(!this.autoTarget) {
                turret.target = null;
                return;
            }
            const p = this.localToWorld(turret.module.slot.x, turret.module.slot.y);
            // Turrets reach a little past the targeting computer's range for ships.
            const reach = turret.kind === 'beam' ? Math.min(range, turret.module.stats.range) : range;
            const shipReach = turret.kind === 'beam' ? turret.module.stats.range : Math.max(range, 700);
            turret.target = (turret.kind === 'minigun' && this.nearestOf(p.x, p.y, incoming, reach))
                || this.nearestOf(p.x, p.y, ships, shipReach)
                || this.nearestRock(p.x, p.y, rockList, reach);
        });
    }

    updateTurrets(dt, input, world) {
        this.firing = false;
        this.minigunFiring = false;
        this.beaming = false;

        this.turrets.forEach(turret => {
            const stats = turret.module.stats;
            const p = this.localToWorld(turret.module.slot.x, turret.module.slot.y);
            if(turret.cooldown > 0) turret.cooldown -= dt;
            if(turret.flash > 0) turret.flash -= dt;
            turret.beam = null;

            // Minigun heat bleeds off continuously.
            if(turret.kind === 'minigun') {
                turret.heat = Math.max(0, turret.heat - HEAT_COOLING * dt);
                if(turret.overheated && turret.heat <= HEAT_RESUME) turret.overheated = false;
            }

            // Manual fire always aims at the cursor; otherwise the guidance computer
            // leads the locked target.
            let desired = Math.atan2(input.aimY - p.y, input.aimX - p.x);
            const enabled = !this.weaponsOff[turret.kind];
            let shouldFire = input.firing && enabled;

            if(!input.firing && turret.target && enabled) {
                const target = turret.target;
                let d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(p, target);
                const speed = turret.kind === 'staff' ? PLASMA_SPEED : BULLET_SPEED;
                const time = turret.kind === 'beam' ? 0 : Math.sqrt(d.x * d.x + d.y * d.y) / speed;
                d = { x: d.x + target.vx * time, y: d.y + target.vy * time };
                desired = Math.atan2(d.y, d.x);
                shouldFire = true;
            }

            const diff = angleDifference(turret.aim, desired);
            const maxTurn = TURRET_TURN_RATE * dt;
            turret.aim += clamp(diff, -maxTurn, maxTurn);
            const aimed = Math.abs(diff) < 0.2;

            if(turret.kind === 'beam') {
                this.updateBeam(dt, turret, p, shouldFire && aimed, world);
                return;
            }

            if(!shouldFire || !aimed || turret.overheated) return;
            this.firing = true;
            if(turret.kind === 'minigun') this.minigunFiring = true;
            if(turret.cooldown > 0) return;

            if(turret.kind === 'minigun') this.fireMinigun(turret, p, stats, world);
            if(turret.kind === 'staff') this.fireStaff(turret, p, stats, world);
        });
    }

    fireMinigun(turret, p, stats, world) {
        turret.cooldown = Math.max(0, turret.cooldown) + 1 / stats.fireRate;

        const angle = turret.aim + (Math.random() - 0.5) * 2 * BULLET_SPREAD;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const barrel = 9 * this.hullDef.moduleScale;

        // Bullets inherit the ship's speed along the line of fire, but not its
        // sideways drift, so they travel where the turret points.
        const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
        const speed = BULLET_SPEED + inherited;
        const round = new __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__["a" /* default */](
            p.x + Math.cos(turret.aim) * barrel,
            p.y + Math.sin(turret.aim) * barrel,
            dirX * speed,
            dirY * speed,
            stats.damage * this.damageScale
        );
        round.side = this.side;
        world.bullets.push(round);

        // Equal and opposite reaction.
        const recoil = RECOIL / this.stats.mass;
        this.vx -= dirX * recoil;
        this.vy -= dirY * recoil;
        turret.flash = 0.04;
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].minigunShot();
        if(Math.random() < 0.35) {
            world.particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                x: p.x + Math.cos(turret.aim) * barrel, y: p.y + Math.sin(turret.aim) * barrel,
                vx: this.vx + dirX * 30 + (Math.random() - 0.5) * 20, vy: this.vy + dirY * 30 + (Math.random() - 0.5) * 20,
                life: 0.4 + Math.random() * 0.3, size: 3, color: '230,225,215', dust: true, alpha: 0.08
            }));
        }

        // Each round adds enough heat to outpace cooling, so sustained fire
        // overheats after `heatShots` rounds.
        turret.heat += 1 / stats.heatShots + HEAT_COOLING / stats.fireRate;
        if(turret.heat >= 1) {
            turret.heat = 1;
            turret.overheated = true;
            __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].overheat();
        }
    }

    fireStaff(turret, p, stats, world) {
        turret.cooldown = 1 / stats.fireRate;
        const dirX = Math.cos(turret.aim);
        const dirY = Math.sin(turret.aim);
        const barrel = 8 * this.hullDef.moduleScale;
        const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
        const speed = PLASMA_SPEED + inherited;

        const bolt = new __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__["a" /* default */](
            p.x + dirX * barrel, p.y + dirY * barrel,
            dirX * speed, dirY * speed,
            stats.damage * this.damageScale, 'plasma', stats.splash
        );
        bolt.side = this.side;
        world.bullets.push(bolt);
        this.vx -= dirX * RECOIL * 6 / this.stats.mass;
        this.vy -= dirY * RECOIL * 6 / this.stats.mass;
        turret.flash = 0.14;
        // Plasma vented from the muzzle.
        for(let i = 0; i < 8; i++) {
            const a = turret.aim + (Math.random() - 0.5) * 1.2;
            const v = 60 + Math.random() * 140;
            world.particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                x: p.x + dirX * barrel, y: p.y + dirY * barrel,
                vx: this.vx + Math.cos(a) * v, vy: this.vy + Math.sin(a) * v,
                life: 0.15 + Math.random() * 0.2, size: 3, color: i % 2 ? '255,200,90' : '255,120,40'
            }));
        }
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].staffShot();
    }

    // Asgard beam: fires a burst for a few seconds, then must recharge.
    updateBeam(dt, turret, p, trigger, world) {
        const stats = turret.module.stats;

        if(turret.beamTime > 0 && !trigger) {
            // Released early: recharge for the part of the burst that was used.
            turret.cooldown = stats.cooldown * (1 - turret.beamTime / stats.burst);
            turret.beamTime = 0;
        }
        if(trigger && turret.beamTime <= 0 && turret.cooldown <= 0) turret.beamTime = stats.burst;
        if(turret.beamTime <= 0) return;

        turret.beamTime -= dt;
        if(turret.beamTime <= 0) {
            turret.beamTime = 0;
            turret.cooldown = stats.cooldown;
        }

        const dirX = Math.cos(turret.aim);
        const dirY = Math.sin(turret.aim);
        const startX = p.x + dirX * 6 * this.hullDef.moduleScale;
        const startY = p.y + dirY * 6 * this.hullDef.moduleScale;
        const hit = raycastRocks(startX, startY, dirX, dirY, stats.range, world.rocks);
        // Hostile ships in the way (approximated by a circle) stop the beam first.
        let shipHit = null;
        if(world.combat) {
            world.combat.hostileShips(this.side).forEach(ship => {
                const r = ship.shieldUp ? Math.max(Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(ship.hullDef).rx, Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(ship.hullDef).ry) * 0.9 : ship.radius * 0.7;
                const ox = ship.x - startX;
                const oy = ship.y - startY;
                const along = ox * dirX + oy * dirY;
                if(along < 0 || along > hit.distance) return;
                const side = ox * dirY - oy * dirX;
                if(Math.abs(side) > r) return;
                const distance = Math.max(0, along - Math.sqrt(r * r - side * side));
                if(distance < hit.distance) {
                    hit.distance = distance;
                    hit.rock = null;
                    shipHit = ship;
                }
            });
        }
        const endX = startX + dirX * hit.distance;
        const endY = startY + dirY * hit.distance;

        turret.beam = { x1: startX, y1: startY, x2: endX, y2: endY, hit: !!(hit.rock || shipHit) };
        this.firing = true;
        this.beaming = true;

        if(hit.rock) {
            world.beamHits.push({ rock: hit.rock, damage: stats.dps * dt, x: endX, y: endY, dirX: dirX, dirY: dirY });
        }
        if(shipHit) {
            world.beamHits.push({ ship: shipHit, damage: stats.dps * dt * this.damageScale, x: endX, y: endY, dirX: dirX, dirY: dirY });
        }
    }

    pickLauncherTarget(input, rocks) {
        if(this.guidance) return this.missileLock;
        return null;
    }

    updateLaunchers(dt, input, world) {
        this.launchers.forEach(launcher => {
            if(launcher.cooldown > 0) launcher.cooldown -= dt;
            if(launcher.salvo) this.continueSalvo(launcher, input, world, dt);
        });

        if(!input.firingMissiles || this.salvoCooldown > 0 || this.launchers.length === 0) return;

        for(let i = 0; i < this.launchers.length; i++) {
            const index = (this.nextLauncher + i) % this.launchers.length;
            const launcher = this.launchers[index];
            if(launcher.cooldown > 0 || this.weaponsOff[launcher.kind]) continue;

            if(launcher.kind === 'missile') this.fireMissile(launcher, input, world);
            if(launcher.kind === 'drones') this.fireDrones(launcher, input, world);

            this.salvoCooldown = SALVO_GAP;
            this.nextLauncher = index + 1;
            return;
        }
    }

    fireMissile(launcher, input, world) {
        const stats = launcher.module.stats;
        const p = this.localToWorld(launcher.module.slot.x, launcher.module.slot.y);
        // Enemy pilots always lock their missiles onto their target.
        const target = this.guidance ? this.missileLock : (input.lockTarget || null);
        const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
        const angle = Math.atan2(aimAt.y, aimAt.x);

        world.missiles.push(new __WEBPACK_IMPORTED_MODULE_1__missile_missile__["a" /* default */]({
            x: p.x,
            y: p.y,
            vx: this.vx + Math.cos(angle) * 120,
            vy: this.vy + Math.sin(angle) * 120,
            angle: angle,
            damage: stats.damage * this.damageScale,
            blast: stats.blast,
            target: target,
            homing: this.guidance ? this.guidance.homing : (input.lockTarget ? 2.4 : 0),
            side: this.side,
            targetMode: this.targetMode
        }));
        launcher.cooldown = stats.cooldown;
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].missileLaunch();
    }

    // Ancient drones: a salvo of drones launched one after another in a stream.
    fireDrones(launcher, input, world) {
        const stats = launcher.module.stats;
        // Drones go for hostile drones first (only drones can stop drones), then the lock.
        const combat = world.combat;
        const drones = combat ? combat.hostileMissiles(this.side, 'drone') : [];
        const ships = combat && this.targetMode !== 'asteroids' ? combat.hostileShips(this.side) : [];
        const rockList = this.targetMode === 'ships' ? [] : world.rocks;
        const lock = this.missileLock && (this.missileLock.hullDef ? ships.length : rockList.length) ? this.missileLock : null;
        const target = this.nearestOf(this.x, this.y, drones, 900) || input.lockTarget
            || this.nearestOf(input.aimX, input.aimY, ships, 400)
            || (lock && lock.hullDef ? lock : null)
            || this.nearestOf(this.x, this.y, ships, 1300)
            || lock
            || this.nearestRock(input.aimX, input.aimY, rockList, 450);
        launcher.salvo = { remaining: stats.count, timer: 0, target: target, index: 0 };
        launcher.cooldown = stats.cooldown;
    }

    continueSalvo(launcher, input, world, dt) {
        const salvo = launcher.salvo;
        salvo.timer -= dt;
        if(salvo.timer > 0) return;
        if(!this.alive || salvo.remaining <= 0) {
            launcher.salvo = null;
            return;
        }

        const stats = launcher.module.stats;
        const p = this.localToWorld(launcher.module.slot.x, launcher.module.slot.y);
        const target = salvo.target && !salvo.target.dead ? salvo.target : null;
        const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
        // Each drone leaves on a slightly different heading, weaving towards the target.
        const weave = [0, -0.35, 0.35, -0.6, 0.6, 0][salvo.index % 6];
        const angle = Math.atan2(aimAt.y, aimAt.x) + weave;

        world.missiles.push(new __WEBPACK_IMPORTED_MODULE_1__missile_missile__["a" /* default */]({
            kind: 'drone',
            x: p.x,
            y: p.y,
            vx: this.vx + Math.cos(angle) * 220,
            vy: this.vy + Math.sin(angle) * 220,
            angle: angle,
            damage: stats.damage * this.damageScale,
            blast: stats.blast,
            target: target,
            homing: 7,
            side: this.side,
            targetMode: this.targetMode
        }));
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].droneLaunch();

        salvo.remaining--;
        salvo.index++;
        salvo.timer = 0.11;
        if(salvo.remaining <= 0) launcher.salvo = null;
    }

    // Readiness of each weapon group for the HUD: 1 = ready.
    weaponStatus() {
        const groups = {};
        this.turrets.concat(this.launchers).forEach(w => {
            const def = __WEBPACK_IMPORTED_MODULE_5__shipyard_modules__["c" /* default */][w.kind];
            if(!groups[w.kind]) groups[w.kind] = { name: def.short, color: def.color, ready: 0, count: 0, state: 'ready' };
            const g = groups[w.kind];
            const stats = w.module.stats;
            let ready = 1;
            let state = 'ready';

            if(w.kind === 'minigun') {
                ready = 1 - w.heat;
                state = w.overheated ? 'overheated' : (w.heat > 0.6 ? 'hot' : 'ready');
            } else if(w.kind === 'beam') {
                if(w.beamTime > 0) { ready = w.beamTime / stats.burst; state = 'firing'; }
                else if(w.cooldown > 0) { ready = 1 - w.cooldown / stats.cooldown; state = 'charging'; }
            } else if(w.cooldown > 0) {
                const total = w.kind === 'staff' ? 1 / stats.fireRate : stats.cooldown;
                ready = 1 - w.cooldown / total;
                state = 'reloading';
            }

            g.ready += clamp(ready, 0, 1);
            g.count++;
            if(state !== 'ready') g.state = state;
        });
        return Object.keys(groups).map(kind => {
            const g = groups[kind];
            const off = !!this.weaponsOff[kind];
            return { kind: kind, name: g.name, color: g.color, ready: g.ready / g.count, count: g.count, state: off ? 'off' : g.state, off: off };
        });
    }

    // Next auto-targeting mode (ships + asteroids -> ships -> asteroids).
    cycleTargetMode() {
        this.targetMode = TARGET_MODES[(TARGET_MODES.indexOf(this.targetMode) + 1) % TARGET_MODES.length];
        return this.targetMode;
    }

    // Switch a weapon type on or off. Returns the new state (true = on).
    toggleWeapon(kind) {
        this.weaponsOff[kind] = !this.weaponsOff[kind];
        return !this.weaponsOff[kind];
    }

    // Returns true if damage was applied.
    // Returns true if damage was applied. `type` ('kinetic' / 'energy') marks a weapon hit:
    // weapons ignore the short knock cooldown used for collisions, and shields / hull resist
    // them differently. `quiet` skips the per-hit debris and sounds (continuous beams).
    takeDamage(amount, particles, hitX, hitY, type, quiet) {
        if(!this.alive || this.immunity > 0) return false;
        if(!type && this.hitCooldown > 0) return false;
        if(!type) this.hitCooldown = HIT_COOLDOWN;
        this.sinceHit = 0;

        const shieldFactor = type ? SHIELD_FACTOR[type] : 1;
        const hullFactor = type ? HULL_FACTOR[type] : 1;
        // Lowered shields don't absorb anything. The shield pays `shieldFactor` per point.
        let remaining = amount;
        if(this.shieldUp) {
            const absorbed = Math.min(amount, this.shield / shieldFactor);
            this.shield = Math.max(0, this.shield - absorbed * shieldFactor);
            remaining = amount - absorbed;
            if(absorbed > 0) {
                this.shieldFlash = SHIELD_FLASH_TIME;
                if(!quiet || Math.random() < 0.08) {
                    if(hitX !== undefined) this.shieldImpact(hitX, hitY, 1 + absorbed / 20);
                    __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldHit(type ? 1 + absorbed / 25 : 0.4 + absorbed / 25);
                }
            }
        }

        if(remaining > 0) {
            this.hp -= remaining * hullFactor;
            this.hullFlash = 0.15;
            if(!quiet || Math.random() < 0.08) {
                this.explode(particles, Math.min(30, 6 + Math.round(remaining / 2)));
                __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].hullHit();
            }
        }

        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.explode(particles, 40 + this.radius * 2);
            __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shipExplosion();
        }
        return true;
    }

    explode(particles, count) {
        const spread = this.radius * 0.5;
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 180;
            particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                x: this.x + (Math.random() - 0.5) * spread,
                y: this.y + (Math.random() - 0.5) * spread,
                vx: this.vx + Math.cos(angle) * speed,
                vy: this.vy + Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.8,
                size: 3 * (0.6 + Math.random() * 0.8),
                color: '255,200,120'
            }));
        }
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 260;
            particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                x: this.x + (Math.random() - 0.5) * spread,
                y: this.y + (Math.random() - 0.5) * spread,
                vx: this.vx + Math.cos(angle) * speed,
                vy: this.vy + Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.9,
                size: 1.8,
                color: i % 3 ? '255,170,80' : '200,210,230',
                pixel: true,
                glow: i % 3 !== 0,
                drag: 0.6
            }));
        }
    }

    drawThrusters(ctx) {
        const t = this.thrusters;
        const jetScale = this.hullDef.jetScale || 1;
        const exhaust = this.hullDef.exhaust || '255,150,60';
        const plume = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["c" /* flameSprite */])(exhaust, '255,235,190');
        const jetFlame = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["c" /* flameSprite */])('170,210,255', '255,255,255');
        const glow = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])(exhaust);
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        this.engines.forEach(engine => {
            const size = engine.size;
            // Nozzle glow, pulsing even when idle.
            const glowSize = (2.5 + pulse + t.main * 3) * size * 3.2;
            ctx.globalAlpha = 0.55 + t.main * 0.45;
            Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, glow, engine.x, engine.y, glowSize, glowSize);

            // Plume straight out of the nozzle, as wide as the nozzle.
            if(t.main > 0.03) {
                const length = t.main * (14 + Math.random() * 8) * size * 1.4;
                const width = 5.2 * size * (0.85 + Math.random() * 0.3);
                ctx.globalAlpha = 1;
                ctx.save();
                ctx.translate(engine.x, engine.y);
                ctx.rotate(Math.PI);
                ctx.drawImage(plume.canvas, 0, -width / 2, length, width);
                ctx.restore();
            }
        });

        // Manoeuvring jets on the hull edges: retro, strafe and attitude control.
        ctx.globalAlpha = 1;
        const jets = this.jetList;
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.02) return;
            const length = t[key] * 7 * jetScale;
            jets[key].forEach(jet => {
                ctx.save();
                ctx.translate(jet[0], jet[1]);
                ctx.rotate(Math.atan2(jet[3], jet[2]));
                ctx.drawImage(jetFlame.canvas, 0, -1.3 * jetScale, length * (0.8 + Math.random() * 0.4), 2.6 * jetScale);
                ctx.restore();
            });
        });

        ctx.restore();
    }

    drawShield(ctx) {
        const level = this.shieldLevel;
        if(this.maxShield <= 0 || level < 0.01) return;

        const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(this.hullDef);
        const sprite = shieldSprite(this.hullDef);
        const color = this.hullDef.shieldColor || '120,210,255';
        const strength = Math.max(0.15, this.shield / this.maxShield);
        // Bubble expands outwards when powering up and collapses when lowered.
        const grow = 0.7 + 0.3 * (1 - Math.pow(1 - level, 3));
        const flash = Math.max(0, this.shieldFlash) / SHIELD_FLASH_TIME;
        const shimmer = 0.85 + 0.15 * Math.sin(this.time * 3);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = Math.min(1, level * (0.35 + 0.65 * strength) * shimmer + flash);
        const w = sprite.width * grow;
        const h = sprite.height * grow;
        ctx.drawImage(sprite.canvas, -w / 2, -h / 2, w, h);

        // Hit: the entire shield frame lights up (hex pattern and rim) and fades out.
        if(flash > 0) {
            const f = Math.min(1, flash);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = f * 0.9;
            ctx.drawImage(sprite.canvas, -w / 2, -h / 2, w, h);
            ctx.globalAlpha = f * 0.35;
            Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])(color), 0, 0, w * 1.15, h * 1.15);
            ctx.globalAlpha = f;
            ctx.strokeStyle = 'rgb(' + color + ')';
            ctx.lineWidth = 2 + 2.5 * f;
            ctx.beginPath();
            ctx.ellipse(0, 0, s.rx * grow, s.ry * grow, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = f * 0.8;
            ctx.strokeStyle = 'rgb(235, 248, 255)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }

        // Impact ripples: a flare at the hit point and a ring spreading over the bubble.
        if(this.shieldImpacts.length) {
            ctx.globalCompositeOperation = 'lighter';
            const glow = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])(color);
            this.shieldImpacts.forEach(impact => {
                const ix = impact.x * grow;
                const iy = impact.y * grow;
                const size = (20 + 50 * impact.strength) * impact.life;
                ctx.globalAlpha = Math.min(1, impact.life * impact.strength);
                Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, glow, ix, iy, size, size);
                ctx.globalAlpha = 0.7 * impact.life;
                ctx.strokeStyle = 'rgb(' + color + ')';
                ctx.lineWidth = 2 * impact.life + 0.5;
                ctx.beginPath();
                ctx.ellipse(ix, iy, 4 + (1 - impact.life) * s.rx * 0.6, 4 + (1 - impact.life) * s.ry * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
        ctx.restore();
    }

    // Beams are drawn in world space (after the ship transform is restored).
    drawBeams(ctx) {
        this.turrets.forEach(turret => {
            const beam = turret.beam;
            if(!beam) return;
            const flicker = 0.75 + Math.random() * 0.25;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            [[9, 'rgba(90, 170, 255, 0.18)'], [4, 'rgba(140, 210, 255, 0.55)'], [1.6, 'rgba(240, 250, 255, 0.95)']].forEach(layer => {
                ctx.lineWidth = layer[0] * flicker * this.hullDef.moduleScale;
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(beam.x1, beam.y1);
                ctx.lineTo(beam.x2, beam.y2);
                ctx.stroke();
            });
            // Energy pulses racing down the beam.
            ctx.setLineDash([6, 14]);
            ctx.lineDashOffset = -this.time * 900;
            ctx.lineWidth = 3 * this.hullDef.moduleScale;
            ctx.strokeStyle = 'rgba(220, 245, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(beam.x1, beam.y1);
            ctx.lineTo(beam.x2, beam.y2);
            ctx.stroke();
            ctx.setLineDash([]);
            Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])('140,210,255'), beam.x1, beam.y1, 16 * flicker, 16 * flicker);
            if(beam.hit) {
                // Molten contact point.
                Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])('120,190,255'), beam.x2, beam.y2, 40 * flicker, 40 * flicker);
                Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])('255,190,120'), beam.x2, beam.y2, 18 * flicker, 18 * flicker);
            }
            ctx.restore();
        });
    }

    // `hull3d`: the 3D view draws the solid hull, so only the glowing line art goes here.
    draw(ctx, hull3d) {
        if(!this.alive || this.hidden) return;
        // Blink while invulnerable after launch.
        if(this.immunity > 0 && Math.floor(this.immunity * 10) % 2 === 0) return;

        const u = this.hullDef.moduleScale;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        this.drawThrusters(ctx);
        const hull = hullSprite(this.hullDef, this.hullFlash > 0 ? '255,120,120' : undefined, !!hull3d);
        ctx.drawImage(hull.canvas, hull.x, hull.y, hull.width, hull.height);

        this.stats.modules.forEach(module => {
            if(TURRET_TYPES.indexOf(module.type) !== -1) return;
            ctx.save();
            ctx.translate(module.slot.x, module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_5__shipyard_modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: u, glow: 0 });
            ctx.restore();
        });

        this.turrets.forEach(turret => {
            ctx.save();
            ctx.translate(turret.module.slot.x, turret.module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_5__shipyard_modules__["d" /* drawModule */])(ctx, turret.kind, turret.module.level, {
                scale: u,
                glow: 0,
                aim: turret.aim - this.angle,
                heat: turret.kind === 'minigun' ? turret.heat : 0
            });
            if(turret.flash > 0) {
                const tip = 9 * u;
                const color = turret.kind === 'staff' ? '255, 190, 90' : '255, 230, 150';
                if(turret.kind === 'staff') {
                    // Large plasma bloom at the cannon mouth.
                    const fx = Math.cos(turret.aim - this.angle) * tip;
                    const fy = Math.sin(turret.aim - this.angle) * tip;
                    ctx.globalCompositeOperation = 'lighter';
                    const bloom = 16 + 20 * turret.flash / 0.14;
                    Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["d" /* glowSprite */])('255,150,50'), fx, fy, bloom, bloom);
                }
                // Star-shaped muzzle flash pointing down the barrel, flickering in size.
                ctx.globalCompositeOperation = 'lighter';
                ctx.rotate(turret.aim - this.angle);
                const flashSize = (turret.kind === 'staff' ? 30 : 18 + Math.random() * 10) * Math.max(0.8, u);
                ctx.drawImage(Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["g" /* muzzleSprite */])(color.replace(/ /g, '')).canvas, tip - flashSize * 0.25, -flashSize * 0.25, flashSize, flashSize * 0.5);
            }
            ctx.restore();
        });

        this.drawShield(ctx);
        ctx.restore();

        this.drawBeams(ctx);
    }
}

/* harmony default export */ __webpack_exports__["e"] = (Ship);


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Shared physics helpers for an open, endless zero-gravity world.
// Units: pixels and seconds. World coordinates are unbounded; the camera follows the ship.

// Gravitational constant, tuned for gameplay. Mass of an asteroid is its area (r^2),
// so a large asteroid pulls noticeably harder than a small one.
const G = 150;
/* harmony export (immutable) */ __webpack_exports__["a"] = G;


// Beyond this distance gravity is negligible and skipped for performance.
const GRAVITY_CUTOFF_SQ = 1300 * 1300;

// Viewport size (the camera's view of the world).
const world = {
    width: window.innerWidth,
    height: window.innerHeight,

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
};
/* harmony export (immutable) */ __webpack_exports__["d"] = world;


const delta = (from, to) => ({ x: to.x - from.x, y: to.y - from.y });
/* harmony export (immutable) */ __webpack_exports__["b"] = delta;


// Gravitational acceleration that `attractors` exert on `body`.
// Softened by the attractor's radius so nothing gets flung to infinity.
const gravityAt = (body, attractors) => {
    let ax = 0;
    let ay = 0;

    for(let i = 0; i < attractors.length; i++) {
        const other = attractors[i];
        if(other === body || other.dead) continue;

        const dx = other.x - body.x;
        const dy = other.y - body.y;
        const distSq = dx * dx + dy * dy;
        if(distSq < 0.0001 || distSq > GRAVITY_CUTOFF_SQ) continue;

        const dist = Math.sqrt(distSq);
        const accel = G * other.mass / (distSq + other.radius * other.radius);

        ax += dx / dist * accel;
        ay += dy / dist * accel;
    }

    return { x: ax, y: ay };
};
/* harmony export (immutable) */ __webpack_exports__["c"] = gravityAt;



/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Module definitions. Each stat array is indexed by module level - 1 (Mk I..III).

const MAX_LEVEL = 3;
/* harmony export (immutable) */ __webpack_exports__["a"] = MAX_LEVEL;


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
    hyperdrive: {
        id: 'hyperdrive',
        name: 'Hyperdrive',
        short: 'Hyperdrive',
        description: 'Opens a hyperspace window to travel between star systems (starmap, M). Needs a ship of at least cruiser size: fighters must use the Stargate.',
        cost: 4000,
        color: '150,190,255',
        minHullMass: 3,
        stats: { speed: [1, 1.6, 2.4] },
        describe: (s) => 'hyperspace speed x' + s.speed
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

const MODULE_ORDER = ['minigun', 'staff', 'beam', 'missile', 'drones', 'engine', 'shield', 'guidance', 'hyperdrive', 'scanner', 'cargo', 'magnet', 'armor'];
/* harmony export (immutable) */ __webpack_exports__["b"] = MODULE_ORDER;


const moduleStats = (type, level) => {
    const def = MODULES[type];
    const stats = {};
    Object.keys(def.stats).forEach(key => { stats[key] = def.stats[key][level - 1]; });
    return stats;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = moduleStats;


const upgradeCost = (type, level) => {
    if(level >= MAX_LEVEL) return null;
    return Math.round(MODULES[type].cost * (level === 1 ? 1 : 1.8));
};
/* harmony export (immutable) */ __webpack_exports__["g"] = upgradeCost;


const totalSpent = (type, level) => {
    let total = MODULES[type].cost;
    for(let l = 1; l < level; l++) total += upgradeCost(type, l);
    return total;
};
/* unused harmony export totalSpent */


const sellValue = (type, level) => Math.round(totalSpent(type, level) * 0.5);
/* harmony export (immutable) */ __webpack_exports__["f"] = sellValue;


// Line-art icon for a module, centred on (0, 0) in the current transform.
// `aim` is the local angle a turret barrel points at; `u` scales the drawing.
const drawModule = (ctx, type, level, options) => {
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

    if(type === 'hyperdrive') {
        // Hyperdrive core: a ring with a swirl and chevron fins.
        circle(4.2, true);
        ctx.beginPath();
        for(let i = 0; i <= 12; i++) {
            const a = i / 12 * Math.PI * 2.2;
            const r = (0.6 + i * 0.25) * u;
            if(i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();
        for(let i = 0; i < level; i++) line(-6 + i * 1.6, -2.5, -4.5 + i * 1.6, 0);
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
/* harmony export (immutable) */ __webpack_exports__["d"] = drawModule;


/* harmony default export */ __webpack_exports__["c"] = (MODULES);


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);


// Small glowing sparks, plus soft dust that can be drawn into an asteroid
// (used when asteroids merge: the dust cloud spirals in and settles on the surface).

// Colour strings are cached per colour and fade step, so drawing hundreds of particles
// doesn't build (and garbage-collect) a new 'rgba(...)' string for each one every frame.
const STEPS = 12;
const styleCache = {};
const style = (color, alpha) => {
    let row = styleCache[color];
    if(!row) {
        row = styleCache[color] = [];
        for(let i = 0; i <= STEPS; i++) row.push('rgba(' + color + ',' + (i / STEPS).toFixed(3) + ')');
    }
    return row[Math.max(0, Math.min(STEPS, Math.round(alpha * STEPS)))];
};

class Particle {

    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.life = options.life;
        this.maxLife = options.life;
        this.size = options.size || 2;
        this.color = options.color || '255,255,255';
        this.shrink = options.shrink !== false;
        this.dust = !!options.dust;
        this.solid = !!options.solid;      // rock debris: drawn as a small unlit chip
        this.pixel = !!options.pixel;      // crisp square pixel with stepped fade and flicker
        this.glow = !!options.glow;        // pixel drawn additively (sparks, embers)
        this.drag = options.drag || 0;     // optional slow-down (dust settling, grit losing speed)
        this.alpha = options.alpha === undefined ? 1 : options.alpha;
        this.attractor = options.attractor || null;
        this.swirl = options.swirl || 0;
        this.dead = false;
    }

    static burst(target, x, y, baseVx, baseVy, count, options) {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = options.minSpeed + Math.random() * (options.maxSpeed - options.minSpeed);
            target.push(new Particle({
                x: x,
                y: y,
                vx: baseVx + Math.cos(angle) * speed,
                vy: baseVy + Math.sin(angle) * speed,
                life: options.minLife + Math.random() * (options.maxLife - options.minLife),
                size: options.size * (0.6 + Math.random() * 0.8),
                color: options.color,
                dust: options.dust,
                solid: options.solid,
                pixel: options.pixel,
                glow: options.glow,
                drag: options.drag,
                alpha: options.alpha
            }));
        }
    }

    // A ring of dust around (x, y) that swirls inwards onto `attractor`.
    static mergeCloud(target, x, y, attractor, count, spread, color) {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = spread * (0.3 + Math.random() * 0.9);
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            const out = 15 + Math.random() * 35;
            target.push(new Particle({
                x: px,
                y: py,
                vx: attractor.vx + Math.cos(angle) * out,
                vy: attractor.vy + Math.sin(angle) * out,
                life: 1.6 + Math.random() * 1.4,
                size: 5 + Math.random() * 9,
                color: color,
                dust: true,
                alpha: 0.18 + Math.random() * 0.14,
                attractor: attractor,
                swirl: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6)
            }));
        }
    }

    update(dt) {
        const a = this.attractor;
        if(a && !a.dead) {
            const dx = a.x - this.x;
            const dy = a.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
            // Fall inwards with a tangential swirl, matching the asteroid's drift.
            const pull = 160 + 3000 / (distance + 20);
            this.vx += (dx / distance * pull - dy / distance * pull * this.swirl) * dt;
            this.vy += (dy / distance * pull + dx / distance * pull * this.swirl) * dt;
            this.vx += (a.vx - this.vx) * Math.min(1, dt * 1.5);
            this.vy += (a.vy - this.vy) * Math.min(1, dt * 1.5);
            if(distance < a.radius * 0.75) this.life = Math.min(this.life, 0.25);
        }

        if(this.drag) {
            const keep = Math.max(0, 1 - this.drag * dt);
            this.vx *= keep;
            this.vy *= keep;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const t = Math.max(this.life / this.maxLife, 0);
        if(this.dust) {
            // Soft puff: fades in quickly, swells, then thins out.
            const fade = Math.min(1, (1 - t) * 6) * Math.min(1, t * 3);
            const size = this.size * 2.4 * (0.7 + 0.5 * (1 - t));
            ctx.globalAlpha = Math.min(1, this.alpha * fade * 1.6);
            ctx.drawImage(Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["b" /* dustSprite */])(this.color).canvas, this.x - size / 2, this.y - size / 2, size, size);
            ctx.globalAlpha = 1;
            return;
        }
        if(this.pixel) {
            // Pixel look: whole-pixel size and position, fading in steps, flickering out.
            if(t < 0.35 && Math.random() < 0.35) return;
            const stepped = Math.ceil(t * 4) / 4;
            const s = Math.max(1, Math.round(this.size * (this.shrink ? 0.5 + 0.5 * t : 1)));
            ctx.fillStyle = style(this.color, stepped * this.alpha);
            ctx.fillRect(Math.round(this.x - s / 2), Math.round(this.y - s / 2), s, s);
            return;
        }
        if(this.solid) {
            ctx.fillStyle = style(this.color, Math.min(1, t * 2));
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            return;
        }
        const size = this.shrink ? this.size * (0.3 + 0.7 * t) : this.size;
        ctx.fillStyle = style(this.color, t * this.alpha);
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Particle);


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ship__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shipyard_hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shipyard_profile__ = __webpack_require__(4);
// Enemy ships: the same hulls the player can fly, fitted out at mid level (Mk II) or fully
// upgraded (Mk III), flown by a simple AI pilot that feeds the ship the same kind of input
// the player's keyboard and mouse do.





// Weapons and systems each faction fits, in order; slots are filled cycling through it.
const FACTION_FIT = {
    "Goa'uld": ['staff', 'staff', 'missile', 'shield', 'staff', 'engine', 'armor', 'staff', 'shield'],
    "Tau'ri": ['minigun', 'missile', 'shield', 'guidance', 'minigun', 'missile', 'engine', 'armor', 'shield', 'minigun'],
    Asgard: ['beam', 'shield', 'beam', 'missile', 'engine', 'shield', 'beam', 'armor', 'shield'],
    Ancient: ['drones', 'shield', 'minigun', 'drones', 'engine', 'shield', 'beam', 'armor', 'drones']
};
// Small craft keep a mount free for an engine instead of a second heavy system.
const FIGHTER_FIT = {
    glider: ['staff', 'staff', 'engine'],
    x302: ['minigun', 'missile', 'missile'],
    jumper: ['drones', 'shield', 'engine', 'minigun']
};

// Enemy weapons hit a little softer than the player's, so a fair fight is winnable.
const ENEMY_DAMAGE = 0.75;
/* harmony export (immutable) */ __webpack_exports__["a"] = ENEMY_DAMAGE;


const enemyLoadout = (hull, level) => {
    const fit = FIGHTER_FIT[hull.id] || FACTION_FIT[hull.faction] || FACTION_FIT["Tau'ri"];
    const loadout = {};
    hull.slots.forEach((slot, i) => {
        loadout[slot.id] = { type: fit[i % fit.length], level: level };
    });
    return loadout;
};
/* harmony export (immutable) */ __webpack_exports__["d"] = enemyLoadout;


const createEnemy = (hullId, level, x, y) => {
    const hull = __WEBPACK_IMPORTED_MODULE_1__shipyard_hulls__["b" /* default */][hullId];
    const ship = new __WEBPACK_IMPORTED_MODULE_0__ship__["e" /* default */](x, y, Object(__WEBPACK_IMPORTED_MODULE_2__shipyard_profile__["f" /* computeShipStats */])(hullId, enemyLoadout(hull, level)));
    ship.side = 'enemy';
    ship.damageScale = ENEMY_DAMAGE;
    ship.autoTarget = false;
    ship.stabilizer = true;   // keeps the AI's flying under control in zero-g
    ship.immunity = 0.6;
    ship.level = level;
    ship.angle = Math.random() * Math.PI * 2;
    ship.ai = {
        input: {
            forward: false, backward: false, rotateLeft: false, rotateRight: false,
            strafeLeft: false, strafeRight: false, firing: false, firingMissiles: false,
            aimX: x, aimY: y, lockTarget: null
        },
        orbit: Math.random() < 0.5 ? 1 : -1,
        orbitTimer: 2 + Math.random() * 3,
        missileTimer: 1.5 + Math.random() * 2,
        aimError: 0
    };
    // Preferred fighting distance from its weapons.
    const kinds = ship.turrets.map(t => t.kind).concat(ship.launchers.map(l => l.kind));
    ship.ai.range = kinds.indexOf('beam') !== -1 ? 380 : kinds.indexOf('staff') !== -1 || kinds.indexOf('minigun') !== -1 ? 430 : 650;
    ship.ai.range += hull.radius * 1.2;
    // How far its guns are worth firing (bolts and rounds lose accuracy beyond this).
    ship.ai.gunReach = kinds.indexOf('beam') !== -1 ? 650 : kinds.indexOf('staff') !== -1 ? 700 : 750;
    ship.ai.gunReach += hull.radius * 0.5;
    // Bounty paid when destroyed.
    ship.bounty = Math.round((150 + hull.cost * 0.12) * (level === 3 ? 1.5 : 1));
    return ship;
};
/* harmony export (immutable) */ __webpack_exports__["b"] = createEnemy;


const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

// Turn towards `desired` without overshooting (zero-g: counter the spin in time).
const steer = (ship, input, desired) => {
    const error = angleDifference(ship.angle, desired);
    const wanted = Math.max(-ship.stats.maxTurn, Math.min(ship.stats.maxTurn, error * 2.5));
    input.rotateRight = ship.angularVelocity < wanted - 0.05;
    input.rotateLeft = ship.angularVelocity > wanted + 0.05;
    return error;
};

// One AI tick: decide how to fly and when to shoot.
//   target:   the player ship (or null)
//   rocks:    asteroids to steer around
//   incoming: the player's missiles and drones (to dodge or shoot down)
//   friends:  the other enemy ships (to keep formation spacing)
//   avoid:    optional { x, y, radius } to stay out of (the Atlantis city shield)
//
// Fighters make attack runs: charge in firing, break away past the target, swing round and
// come again, jinking away from missiles. Capital ships hold a standoff distance, circle
// slowly and let their turrets work. Anyone badly hurt withdraws to recharge shields and
// comes back.
const updateEnemyAI = (ship, dt, target, rocks, incoming, friends, avoid) => {
    const ai = ship.ai;
    const input = ai.input;
    input.forward = input.backward = input.strafeLeft = input.strafeRight = false;
    input.firing = input.firingMissiles = false;
    input.lockTarget = null;
    if(!ship.alive) return;

    const fighter = ship.radius < 45;
    ai.mode = ai.mode || 'attack';
    ai.modeTimer = (ai.modeTimer || 0) - dt;
    ai.evadeTimer = (ai.evadeTimer || 0) - dt;
    ai.orbitTimer -= dt;
    if(ai.orbitTimer <= 0) {
        ai.orbit = -ai.orbit;
        ai.orbitTimer = 3 + Math.random() * 4;
        ai.aimError = (Math.random() - 0.5) * 0.06;
    }

    // Keep clear of the city shield.
    if(avoid) {
        const ax = ship.x - avoid.x;
        const ay = ship.y - avoid.y;
        const ad = Math.sqrt(ax * ax + ay * ay) || 1;
        if(ad < avoid.radius + ship.radius) {
            steer(ship, input, Math.atan2(ay, ax));
            input.forward = true;
            return;
        }
    }

    if(!target) {
        ai.mode = 'attack';
        input.forward = Math.random() < 0.02;
        return;
    }

    const dx = target.x - ship.x;
    const dy = target.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const toTarget = Math.atan2(dy, dx);
    const range = ai.range;

    // Badly damaged: withdraw until the shields are back up (or a while has passed).
    const health = ship.hp / ship.maxHull;
    if(ai.mode !== 'retreat' && health < 0.3 && ship.maxShield > 0 && !ai.retreated) {
        ai.mode = 'retreat';
        ai.modeTimer = 8 + Math.random() * 4;
        ai.retreated = true;
    }
    if(ai.mode === 'retreat') {
        if(ai.modeTimer <= 0 || (ship.shield > ship.maxShield * 0.8 && distance > 1600)) {
            ai.mode = 'attack';
        } else {
            steer(ship, input, toTarget + Math.PI + ai.orbit * 0.4);
            input.forward = true;
            input.firing = distance < range * 1.5;
            aimAt(ship, ai, input, target);
            return;
        }
    }

    // Dodge: a hostile missile or drone closing in fast makes fighters jink sideways.
    let threat = null;
    let threatDistance = Infinity;
    for(let i = 0; i < incoming.length; i++) {
        const m = incoming[i];
        if(m.dead) continue;
        const mx = ship.x - m.x;
        const my = ship.y - m.y;
        const d = Math.sqrt(mx * mx + my * my);
        if(d > 420 + ship.radius) continue;
        const closing = (m.vx * mx + m.vy * my) / (d || 1);
        if(closing > 120 && d < threatDistance) {
            threat = m;
            threatDistance = d;
        }
    }
    if(threat && fighter && ai.evadeTimer <= 0) {
        ai.evadeTimer = 0.7;
        ai.evadeSide = (threat.vx * (ship.y - threat.y) - threat.vy * (ship.x - threat.x)) > 0 ? 1 : -1;
    }

    // Aim: gun ships shoot close missiles down, otherwise lead the target.
    const shootDown = threat && threat.kind === 'missile' && threatDistance < 320 && ship.turrets.some(t => t.kind === 'minigun');
    aimAt(ship, ai, input, shootDown ? threat : target);

    if(fighter) {
        // Attack run: charge, break off past the target, swing back round.
        if(ai.mode === 'attack') {
            const facing = steer(ship, input, toTarget);
            input.forward = Math.abs(facing) < 0.8;
            if(distance < Math.max(160, range * 0.45)) {
                ai.mode = 'break';
                ai.modeTimer = 1.1 + Math.random() * 0.8;
                ai.breakAngle = toTarget + ai.orbit * (0.9 + Math.random() * 0.5);
            }
        } else if(ai.mode === 'break') {
            steer(ship, input, ai.breakAngle);
            input.forward = true;
            if(ai.modeTimer <= 0 && distance > range * 0.9) ai.mode = 'attack';
            if(ai.modeTimer < -3) ai.mode = 'attack';
        }
    } else {
        // Capital ship: hold the standoff distance and circle slowly.
        ai.mode = 'attack';
        const far = distance > range * 1.25;
        const facing = steer(ship, input, toTarget + (far ? 0 : ai.orbit * 0.35));
        if(distance > range * 1.05 && Math.abs(facing) < 1.2) input.forward = true;
        if(distance < range * 0.7) input.backward = true;
        if(distance < range * 1.2) {
            if(ai.orbit > 0) input.strafeRight = true;
            else input.strafeLeft = true;
        }
    }

    if(ai.evadeTimer > 0) {
        input.strafeLeft = ai.evadeSide < 0;
        input.strafeRight = ai.evadeSide > 0;
    }

    // Spacing: don't pile into other enemy ships.
    for(let i = 0; i < friends.length; i++) {
        const other = friends[i];
        if(other === ship || !other.alive) continue;
        const ox = other.x - ship.x;
        const oy = other.y - ship.y;
        const reach = other.radius + ship.radius + 70;
        if(ox * ox + oy * oy > reach * reach) continue;
        const side = Math.cos(ship.angle) * oy - Math.sin(ship.angle) * ox;
        input.strafeLeft = side > 0;
        input.strafeRight = side <= 0;
        break;
    }

    // Dodge asteroids in the way.
    for(let i = 0; i < rocks.length; i++) {
        const rock = rocks[i];
        if(rock.dead) continue;
        const rx = rock.x - ship.x;
        const ry = rock.y - ship.y;
        const reach = rock.radius + ship.radius + 60;
        if(rx * rx + ry * ry > reach * reach) continue;
        const side = Math.cos(ship.angle) * ry - Math.sin(ship.angle) * rx;
        input.strafeLeft = side > 0;
        input.strafeRight = side <= 0;
        if(fighter) input.forward = false;
        break;
    }

    // Guns only within their real reach (turrets swing to the aim point by themselves).
    input.firing = !!shootDown || distance - target.radius * 0.8 < ai.gunReach;

    // Missiles and drones in volleys, locked onto the target. Drones are held back for
    // the player's drones when those are in the air.
    ai.missileTimer -= dt;
    const playerDrones = incoming.some(m => m.kind === 'drone' && !m.dead);
    if(ship.launchers.length && (ai.missileTimer <= 0 || playerDrones) && distance < 1400 && distance > 140) {
        input.firingMissiles = true;
        input.lockTarget = target;
        if(ship.launchers.every(l => l.cooldown > 0) || Math.random() < 0.02) {
            ai.missileTimer = 2 + Math.random() * 3;
        }
    }
};
/* harmony export (immutable) */ __webpack_exports__["f"] = updateEnemyAI;


// Aim with lead for the travel time of its shots, plus a little error.
const aimAt = (ship, ai, input, target) => {
    const projectileSpeed = ship.turrets.some(t => t.kind === 'staff') ? 520 : 1100;
    const ex = target.x - ship.x;
    const ey = target.y - ship.y;
    const t = Math.sqrt(ex * ex + ey * ey) / projectileSpeed;
    // Shots don't inherit the shooter's sideways drift, so lead by the target's own motion.
    const lx = target.x + (target.vx || 0) * t;
    const ly = target.y + (target.vy || 0) * t;
    const aimAngle = Math.atan2(ly - ship.y, lx - ship.x) + ai.aimError;
    const aimDist = Math.sqrt((lx - ship.x) * (lx - ship.x) + (ly - ship.y) * (ly - ship.y));
    input.aimX = ship.x + Math.cos(aimAngle) * aimDist;
    input.aimY = ship.y + Math.sin(aimAngle) * aimDist;
};

// Which hulls turn up in each star system (weights), and how many at most at once.
const SYSTEM_ENEMIES = {
    lantea: { max: 2, hulls: { glider: 4, jumper: 2, alkesh: 1 } },
    earth: { max: 2, hulls: { glider: 3, alkesh: 2, x303: 1, jumper: 1 } },
    abydos: { max: 3, hulls: { glider: 5, alkesh: 2, hatak: 1 } },
    chulak: { max: 3, hulls: { glider: 5, alkesh: 3, hatak: 1 } },
    dakara: { max: 3, hulls: { glider: 4, alkesh: 3, hatak: 1, x302: 1 } },
    langara: { max: 2, hulls: { x302: 3, x303: 2, alkesh: 1 } },
    othala: { max: 3, hulls: { alkesh: 2, x304: 1, hatak: 1, aurora: 1, asgard: 1 } }
};

const enemyConfig = (systemId) => SYSTEM_ENEMIES[systemId] || SYSTEM_ENEMIES.lantea;
/* harmony export (immutable) */ __webpack_exports__["c"] = enemyConfig;


const pickEnemyHull = (systemId) => {
    const hulls = enemyConfig(systemId).hulls;
    const total = Object.keys(hulls).reduce((sum, id) => sum + hulls[id], 0);
    let roll = Math.random() * total;
    const ids = Object.keys(hulls);
    for(let i = 0; i < ids.length; i++) {
        roll -= hulls[ids[i]];
        if(roll <= 0) return ids[i];
    }
    return ids[0];
};
/* harmony export (immutable) */ __webpack_exports__["e"] = pickEnemyHull;



/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__modules__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__profile__ = __webpack_require__(4);
// Shipyard overlay: buy hulls, drag modules onto mounts, upgrade and sell them.






const SLOT_HIT_RADIUS = 16;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

const formatCredits = (value) => Math.round(value).toLocaleString('en-US') + ' cr';
// Prices read "FREE" in debug mode.
const formatPrice = (value) => (Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? 'FREE' : formatCredits(value));

const setupCanvas = (canvas, width, height) => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
};

const drawHullPreview = (ctx, hull, width, height, padding, maxScale) => {
    const b = Object(__WEBPACK_IMPORTED_MODULE_0__hulls__["d" /* hullBounds */])(hull);
    const scale = Math.min((width - padding * 2) / (b.maxX - b.minX), (height - padding * 2) / (b.maxY - b.minY),
        maxScale || Infinity);
    const offsetX = width / 2 - ((b.minX + b.maxX) / 2) * scale;
    const offsetY = height / 2 - ((b.minY + b.maxY) / 2) * scale;
    return { scale: scale, offsetX: offsetX, offsetY: offsetY };
};

class Shipyard {

    constructor() {
        this.isOpen = false;
        this.selectedSlot = null;
        this.armedModule = null;
        this.hoverSlot = null;
        this.drag = null;
        this.frameId = null;
        this.messageTimer = null;
        this.build();
    }

    build() {
        const root = el('div', 'shipyard');
        root.id = 'shipyard';

        const header = el('div', 'shipyard-header');
        header.appendChild(el('h1', '', 'Shipyard'));
        const tabs = el('div', 'shipyard-tabs');
        this.tabButtons = {};
        [['ship', 'Ship'], ['market', 'Market']].forEach(tab => {
            const button = el('button', 'sy-tab', tab[1]);
            button.addEventListener('click', () => this.showTab(tab[0]));
            tabs.appendChild(button);
            this.tabButtons[tab[0]] = button;
        });
        header.appendChild(tabs);
        this.debugButton = el('button', 'sy-tab debug-toggle', 'Debug');
        this.debugButton.title = 'Debug mode: unlock everything and make it free';
        this.debugButton.addEventListener('click', () => {
            Object(__WEBPACK_IMPORTED_MODULE_3__profile__["s" /* setDebug */])(!Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])());
            this.flash(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? 'Debug mode ON: everything unlocked and free' : 'Debug mode OFF');
            this.refresh();
        });
        header.appendChild(this.debugButton);
        this.creditsLabel = el('div', 'shipyard-credits');
        header.appendChild(this.creditsLabel);
        this.closeButton = el('button', 'sy-button primary', 'Launch');
        this.closeButton.addEventListener('click', () => this.close());
        header.appendChild(this.closeButton);
        root.appendChild(header);

        const body = el('div', 'shipyard-body');

        const hullColumn = el('div', 'shipyard-panel hull-list');
        hullColumn.appendChild(el('h3', '', 'Hulls'));
        this.hullList = el('div', 'hull-cards');
        hullColumn.appendChild(this.hullList);
        body.appendChild(hullColumn);

        const center = el('div', 'shipyard-panel hull-view');
        this.hullTitle = el('div', 'hull-title');
        center.appendChild(this.hullTitle);
        this.canvasWrap = el('div', 'hull-canvas-wrap');
        this.canvas = el('canvas', 'hull-canvas');
        this.canvasWrap.appendChild(this.canvas);
        this.buildPopover();
        center.appendChild(this.canvasWrap);
        this.hint = el('div', 'shipyard-hint');
        center.appendChild(this.hint);
        this.statsBox = el('div', 'ship-stats');
        center.appendChild(this.statsBox);
        body.appendChild(center);

        const moduleColumn = el('div', 'shipyard-panel module-panel');
        moduleColumn.appendChild(el('h3', '', 'Modules'));
        this.palette = el('div', 'module-palette');
        moduleColumn.appendChild(this.palette);
        moduleColumn.appendChild(el('h3', '', 'Selected mount'));
        this.inspector = el('div', 'inspector');
        moduleColumn.appendChild(this.inspector);
        body.appendChild(moduleColumn);

        root.appendChild(body);
        this.shipBody = body;

        this.marketBody = el('div', 'shipyard-market');
        root.appendChild(this.marketBody);

        this.message = el('div', 'shipyard-message');
        root.appendChild(this.message);

        this.root = root;
        document.body.appendChild(root);

        this.buildPalette();
        this.bindCanvas();

        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if(this.armedModule) {
                    this.armedModule = null;
                    this.refresh();
                } else {
                    this.close();
                }
            }
        }, true);

        window.addEventListener('resize', () => { if(this.isOpen) this.resizeCanvas(); });
    }

    get hull() {
        return __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])().hull];
    }

    open(options) {
        this.options = options || {};
        this.isOpen = true;
        this.selectedSlot = null;
        this.armedModule = null;
        this.closeButton.textContent = this.options.closeLabel || 'Launch';
        this.root.classList.add('open');
        this.tab = this.options.tab || 'ship';
        this.refresh();
        this.resizeCanvas();
        const loop = () => {
            this.renderCanvas();
            this.frameId = requestAnimationFrame(loop);
        };
        loop();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        cancelAnimationFrame(this.frameId);
        this.endDrag();
        if(this.options.onClose) this.options.onClose();
    }

    flash(text) {
        this.message.textContent = text;
        this.message.classList.add('visible');
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => this.message.classList.remove('visible'), 2200);
    }

    // ------------------------------------------------------------ panels

    showTab(tab) {
        this.tab = tab;
        this.armedModule = null;
        this.refresh();
    }

    refresh() {
        const profile = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])();
        this.creditsLabel.textContent = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? 'DEBUG · everything free' : formatCredits(profile.credits);
        this.debugButton.textContent = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? 'Debug: ON' : 'Debug: OFF';
        this.debugButton.classList.toggle('active', Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])());
        Object.keys(this.tabButtons).forEach(key => this.tabButtons[key].classList.toggle('active', key === this.tab));
        this.shipBody.style.display = this.tab === 'ship' ? '' : 'none';
        this.marketBody.style.display = this.tab === 'market' ? '' : 'none';
        this.renderMarket();
        this.renderHullList();
        this.renderTitle();
        this.renderStats();
        this.renderPalette();
        this.renderInspector();
        this.renderPopover();
        this.renderHint();
    }

    renderMarket() {
        const box = this.marketBody;
        const profile = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])();
        const capacity = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* computeShipStats */])(this.hull.id).cargo;
        box.innerHTML = '';

        const panel = el('div', 'shipyard-panel market-panel');
        panel.appendChild(el('h3', '', 'Ore exchange'));
        const canTrade = !!(this.options && this.options.canTrade);
        if(!canTrade) panel.appendChild(el('p', 'market-warning', 'Fly to the shipyard station and dock (B) to sell ore.'));
        panel.appendChild(el('p', 'muted', 'Cargo hold: ' + Object(__WEBPACK_IMPORTED_MODULE_3__profile__["d" /* cargoUsed */])() + ' / ' + capacity +
            ' units. Prices are per unit; metals found further from base are worth more.'));

        const table = el('table', 'market-table');
        const head = el('tr');
        ['Material', 'Price', 'In hold', 'Value', ''].forEach(h => head.appendChild(el('th', '', h)));
        table.appendChild(head);

        __WEBPACK_IMPORTED_MODULE_1__world_materials__["a" /* MATERIAL_ORDER */].forEach(id => {
            const material = __WEBPACK_IMPORTED_MODULE_1__world_materials__["b" /* default */][id];
            const amount = profile.cargo[id] || 0;
            const tr = el('tr', amount ? '' : 'empty');
            const name = el('td', 'material-name');
            const swatch = el('span', 'swatch');
            swatch.style.background = 'rgb(' + material.color + ')';
            swatch.style.boxShadow = '0 0 6px rgb(' + material.color + ')';
            name.appendChild(swatch);
            name.appendChild(document.createTextNode(material.name));
            tr.appendChild(name);
            tr.appendChild(el('td', '', formatCredits(material.price)));
            tr.appendChild(el('td', '', String(amount)));
            tr.appendChild(el('td', '', formatCredits(amount * material.price)));
            const cell = el('td');
            const sell = el('button', 'sy-button small', 'Sell');
            sell.disabled = amount === 0 || !canTrade;
            sell.addEventListener('click', () => {
                const earned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["q" /* sellCargo */])(id);
                this.flash('Sold ' + material.name + ' for ' + formatCredits(earned));
                this.refresh();
            });
            cell.appendChild(sell);
            tr.appendChild(cell);
            table.appendChild(tr);
        });
        panel.appendChild(table);

        const total = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["e" /* cargoValue */])();
        const sellAll = el('button', 'sy-button buy', 'Sell all cargo  +' + formatCredits(total));
        sellAll.disabled = total === 0 || !canTrade;
        sellAll.addEventListener('click', () => {
            const earned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["q" /* sellCargo */])();
            this.flash('Cargo sold for ' + formatCredits(earned));
            this.refresh();
        });
        panel.appendChild(sellAll);

        // Repairs are only offered when docked with a damaged ship.
        const status = this.options && this.options.hullStatus ? this.options.hullStatus() : null;
        if(status) {
            panel.appendChild(el('h3', 'market-section', 'Repairs'));
            const missing = Math.ceil(status.max - status.hp);
            if(missing <= 0) {
                panel.appendChild(el('p', 'muted', 'Hull at full strength.'));
            } else {
                const cost = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* priceOf */])(missing * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */]);
                const affordable = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? missing : Math.min(missing, Math.floor(profile.credits / __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */]));
                panel.appendChild(el('p', '', 'Hull ' + Math.ceil(status.hp) + ' / ' + status.max +
                    ' · ' + __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */] + ' cr per point'));
                const repair = el('button', 'sy-button', affordable < missing
                    ? 'Repair ' + affordable + ' points  ' + formatPrice(affordable * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */])
                    : 'Full repair  ' + formatPrice(cost));
                repair.disabled = affordable <= 0;
                repair.addEventListener('click', () => {
                    if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["t" /* spendCredits */])(affordable * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */])) {
                        this.options.repair(affordable);
                        this.flash('Hull repaired.');
                    }
                    this.refresh();
                });
                panel.appendChild(repair);
            }
        }

        box.appendChild(panel);
    }

    renderHullList() {
        const profile = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])();
        this.hullList.innerHTML = '';

        __WEBPACK_IMPORTED_MODULE_0__hulls__["a" /* HULL_ORDER */].forEach(id => {
            const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][id];
            const owned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["m" /* ownsHull */])(id);
            const active = profile.hull === id;
            const card = el('div', 'hull-card' + (active ? ' active' : '') + (owned ? ' owned' : ''));

            const thumb = el('canvas', 'hull-thumb');
            const ctx = setupCanvas(thumb, 120, 64);
            const fit = drawHullPreview(ctx, hull, 120, 64, 8);
            ctx.translate(fit.offsetX, fit.offsetY);
            ctx.scale(fit.scale, fit.scale);
            Object(__WEBPACK_IMPORTED_MODULE_0__hulls__["c" /* drawHullArt */])(ctx, hull, { lineWidth: 1.2 / fit.scale, glow: 4 });
            card.appendChild(thumb);

            const info = el('div', 'hull-info');
            info.appendChild(el('div', 'hull-name', hull.name));
            info.appendChild(el('div', 'hull-class', hull.className + ' · ' + hull.faction));
            info.appendChild(el('div', 'hull-meta', hull.slots.length + ' mounts · ' + hull.cargo + ' cargo · ' + hull.hull + ' hull' +
                (hull.baseShield ? ' · ' + hull.baseShield + ' shield' : '')));

            let action;
            if(active) {
                action = el('div', 'hull-state', 'Active');
            } else if(owned) {
                action = el('button', 'sy-button small', 'Fly this');
                action.addEventListener('click', () => {
                    Object(__WEBPACK_IMPORTED_MODULE_3__profile__["p" /* selectHull */])(id);
                    this.selectedSlot = null;
                    this.refresh();
                });
            } else {
                action = el('button', 'sy-button small buy', 'Buy ' + formatPrice(hull.cost));
                action.disabled = profile.credits < Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* priceOf */])(hull.cost);
                action.addEventListener('click', () => {
                    if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["c" /* buyHull */])(id)) {
                        this.selectedSlot = null;
                        this.flash(hull.name + ' purchased!');
                    }
                    this.refresh();
                });
            }
            info.appendChild(action);
            card.appendChild(info);
            card.title = hull.description;
            this.hullList.appendChild(card);
        });
    }

    renderTitle() {
        const hull = this.hull;
        this.hullTitle.innerHTML = '';
        this.hullTitle.appendChild(el('span', 'title-name', hull.name + ' ' + hull.className));
        this.hullTitle.appendChild(el('span', 'title-desc', hull.description));
    }

    renderStats() {
        const stats = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* computeShipStats */])(this.hull.id);
        const rows = [
            ['Hull', Math.round(stats.maxHull)],
            ['Shield', stats.maxShield ? Math.round(stats.maxShield) + ' (+' + Math.round(stats.shieldRegen) + '/s)' : 'none'],
            ['Acceleration', Math.round(stats.acceleration)],
            ['Turn rate', stats.maxTurn.toFixed(1)],

            ['Weapons', stats.weapons],
            ['Guidance', stats.guidance ? stats.guidance.range + 'px' : 'none'],
            ['Cargo hold', stats.cargo],
            ['Tractor', stats.magnetRange + 'px'],
            ['Scanner', stats.scanner ? stats.scanner.range + 'px' : 'none'],
            ['Hyperdrive', stats.hyperdrive ? 'x' + stats.hyperdrive.speed : 'none'],
            ['Mounts', stats.modules.length + ' / ' + this.hull.slots.length]
        ];
        this.statsBox.innerHTML = '';
        rows.forEach(row => {
            const item = el('div', 'stat');
            item.appendChild(el('span', 'stat-label', row[0]));
            item.appendChild(el('span', 'stat-value', String(row[1])));
            this.statsBox.appendChild(item);
        });
    }

    buildPalette() {
        this.paletteItems = {};
        __WEBPACK_IMPORTED_MODULE_2__modules__["b" /* MODULE_ORDER */].forEach(type => {
            const def = __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type];
            const item = el('div', 'module-item');
            item.dataset.type = type;

            const icon = el('canvas', 'module-icon');
            const ctx = setupCanvas(icon, 40, 40);
            ctx.translate(20, 20);
            Object(__WEBPACK_IMPORTED_MODULE_2__modules__["d" /* drawModule */])(ctx, type, 1, { scale: 2.6, lineWidth: 1.4 });
            item.appendChild(icon);

            const info = el('div', 'module-info');
            info.appendChild(el('div', 'module-name', def.name));
            info.appendChild(el('div', 'module-desc', def.description));
            const price = el('div', 'module-price', formatCredits(def.cost));
            info.appendChild(price);
            item.appendChild(info);

            item.addEventListener('pointerdown', (event) => this.startDrag(event, type));
            this.palette.appendChild(item);
            this.paletteItems[type] = { item: item, price: price };
        });
    }

    renderPalette() {
        const credits = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])().credits;
        __WEBPACK_IMPORTED_MODULE_2__modules__["b" /* MODULE_ORDER */].forEach(type => {
            const entry = this.paletteItems[type];
            entry.item.classList.toggle('armed', this.armedModule === type);
            entry.item.classList.toggle('unaffordable', credits < Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* priceOf */])(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost));
            entry.price.textContent = formatPrice(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost);
        });
    }

    renderInspector() {
        const hull = this.hull;
        const box = this.inspector;
        box.innerHTML = '';

        if(!this.selectedSlot) {
            box.appendChild(el('p', 'muted', 'Click a mount on the ship to inspect it.'));
            return;
        }

        const module = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(hull.id)[this.selectedSlot];
        if(!module) {
            box.appendChild(el('p', '', 'Empty mount'));
            box.appendChild(el('p', 'muted', this.armedModule
                ? 'Click the mount again to install the ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][this.armedModule].short + '.'
                : 'Drag a module here, or pick one from the list and click the mount.'));
            return;
        }

        const def = __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][module.type];
        const stats = Object(__WEBPACK_IMPORTED_MODULE_2__modules__["e" /* moduleStats */])(module.type, module.level);
        box.appendChild(el('div', 'inspector-name', def.name + ' Mk ' + ['I', 'II', 'III'][module.level - 1]));
        box.appendChild(el('div', 'inspector-stats', def.describe(stats)));

        if(Object(__WEBPACK_IMPORTED_MODULE_2__modules__["g" /* upgradeCost */])(module.type, module.level) !== null) {
            box.appendChild(el('div', 'inspector-next', 'Next: ' + def.describe(Object(__WEBPACK_IMPORTED_MODULE_2__modules__["e" /* moduleStats */])(module.type, module.level + 1))));
        } else {
            box.appendChild(el('div', 'inspector-next', 'Max level (Mk ' + ['I', 'II', 'III'][__WEBPACK_IMPORTED_MODULE_2__modules__["a" /* MAX_LEVEL */] - 1] + ')'));
        }
        box.appendChild(el('p', 'muted', 'Upgrade or remove it with the buttons next to the module on the ship.'));
    }

    // ------------------------------------------------------------ module popover
    //
    // Clicking a fitted module on the ship opens a small popover right next to it with
    // icon buttons to upgrade it and to sell / remove it.

    buildPopover() {
        const pop = el('div', 'module-popover');
        this.popName = el('div', 'popover-name');
        pop.appendChild(this.popName);
        const row = el('div', 'popover-actions');
        const iconButton = (className, svg) => {
            const wrap = el('div', 'popover-action');
            const button = el('button', 'icon-button ' + className);
            button.innerHTML = svg;
            const caption = el('span', 'popover-caption');
            wrap.appendChild(button);
            wrap.appendChild(caption);
            row.appendChild(wrap);
            return { button: button, caption: caption };
        };
        this.popUpgrade = iconButton('upgrade',
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 11h-5v9H9v-9H4z"/></svg>');
        this.popSell = iconButton('danger',
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6l1 2h5v2H3V4h5zM5 8h14l-1.2 14H6.2zm4 3v8h2v-8zm4 0v8h2v-8z"/></svg>');
        pop.appendChild(row);
        this.popUpgrade.button.addEventListener('click', (event) => {
            event.stopPropagation();
            const module = this.selectedSlot && Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(this.hull.id)[this.selectedSlot];
            if(!module) return;
            if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["v" /* upgradeModule */])(this.hull.id, this.selectedSlot)) this.flash(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][module.type].short + ' upgraded!');
            this.refresh();
        });
        this.popSell.button.addEventListener('click', (event) => {
            event.stopPropagation();
            if(!this.selectedSlot || !Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(this.hull.id)[this.selectedSlot]) return;
            Object(__WEBPACK_IMPORTED_MODULE_3__profile__["r" /* sellModule */])(this.hull.id, this.selectedSlot);
            this.refresh();
        });
        pop.addEventListener('pointerdown', (event) => event.stopPropagation());
        this.canvasWrap.appendChild(pop);
        this.popover = pop;
        this.popover.style.display = 'none';
    }

    renderPopover() {
        const module = this.selectedSlot && Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(this.hull.id)[this.selectedSlot];
        if(!module) {
            this.popover.style.display = 'none';
            return;
        }
        const def = __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][module.type];
        this.popover.style.display = '';
        this.popName.textContent = def.short + ' Mk ' + ['I', 'II', 'III'][module.level - 1];

        // Upgrade: always shown; disabled at max level or when unaffordable.
        const cost = Object(__WEBPACK_IMPORTED_MODULE_2__modules__["g" /* upgradeCost */])(module.type, module.level);
        const up = this.popUpgrade;
        if(cost === null) {
            up.button.disabled = true;
            up.button.title = 'Max level';
            up.caption.textContent = 'MAX';
        } else {
            up.button.disabled = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])().credits < Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* priceOf */])(cost);
            up.button.title = 'Upgrade to Mk ' + ['I', 'II', 'III'][module.level] + ' (' + formatPrice(cost) + ')';
            up.caption.textContent = formatPrice(cost);
        }
        const sellLabel = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? 'Remove' : 'Sell +' + formatCredits(Object(__WEBPACK_IMPORTED_MODULE_2__modules__["f" /* sellValue */])(module.type, module.level));
        this.popSell.button.title = sellLabel;
        this.popSell.caption.textContent = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["i" /* isDebug */])() ? 'Remove' : '+' + formatCredits(Object(__WEBPACK_IMPORTED_MODULE_2__modules__["f" /* sellValue */])(module.type, module.level));
        this.positionPopover();
    }

    // Keep the popover beside the selected mount (and inside the view).
    positionPopover() {
        if(!this.popover || this.popover.style.display === 'none' || !this.ctx) return;
        const spot = this.layout().slots.filter(sl => sl.slot.id === this.selectedSlot)[0];
        if(!spot) return;
        const w = this.popover.offsetWidth;
        const h = this.popover.offsetHeight;
        let x = spot.x + 22;
        let y = spot.y - h / 2;
        if(x + w > this.canvasWidth - 4) x = spot.x - 22 - w;
        x = Math.max(4, Math.min(this.canvasWidth - w - 4, x));
        y = Math.max(4, Math.min(this.canvasHeight - h - 4, y));
        const key = Math.round(x) + ',' + Math.round(y);
        if(key !== this.popoverKey) {
            this.popoverKey = key;
            this.popover.style.left = Math.round(x) + 'px';
            this.popover.style.top = Math.round(y) + 'px';
        }
    }

    renderHint() {
        this.hint.textContent = this.armedModule
            ? 'Placing ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][this.armedModule].name + ': click an empty mount (Esc to cancel)'
            : 'Drag modules from the right onto the ship\'s mounts. Mine ore and sell it in the Market tab.';
    }

    // ------------------------------------------------------------ hull canvas

    resizeCanvas() {
        const rect = this.canvasWrap.getBoundingClientRect();
        this.canvasWidth = Math.max(200, Math.floor(rect.width));
        this.canvasHeight = Math.max(160, Math.floor(rect.height));
        this.ctx = setupCanvas(this.canvas, this.canvasWidth, this.canvasHeight);
    }

    layout() {
        const hull = this.hull;
        const fit = drawHullPreview(this.ctx, hull, this.canvasWidth, this.canvasHeight, 40, 14);
        const slots = hull.slots.map(slot => ({
            slot: slot,
            x: fit.offsetX + slot.x * fit.scale,
            y: fit.offsetY + slot.y * fit.scale
        }));
        return { fit: fit, slots: slots };
    }

    slotAt(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const layout = this.layout();
        let best = null;
        let bestDist = SLOT_HIT_RADIUS * SLOT_HIT_RADIUS * 2.5;
        layout.slots.forEach(s => {
            const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
            if(d < bestDist) {
                bestDist = d;
                best = s.slot.id;
            }
        });
        return best;
    }

    bindCanvas() {
        this.canvas.addEventListener('pointermove', (event) => {
            if(this.drag) return;
            this.hoverSlot = this.slotAt(event.clientX, event.clientY);
            this.canvas.style.cursor = this.hoverSlot ? 'pointer' : 'default';
        });
        this.canvas.addEventListener('pointerleave', () => { if(!this.drag) this.hoverSlot = null; });
        this.canvas.addEventListener('click', (event) => {
            const slotId = this.slotAt(event.clientX, event.clientY);
            if(!slotId) {
                this.selectedSlot = null;
                this.refresh();
                return;
            }
            const occupied = !!Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(this.hull.id)[slotId];
            if(this.armedModule && !occupied) {
                this.install(slotId, this.armedModule);
            } else {
                this.selectedSlot = slotId;
                this.refresh();
            }
        });
    }

    install(slotId, type) {
        const hull = this.hull;
        if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(hull.id)[slotId]) {
            this.flash('That mount is taken. Sell its module first.');
            return;
        }
        if(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].minHullMass && hull.mass < __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].minHullMass) {
            this.flash('The ' + hull.name + ' is too small for a ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].name + '. Use the Stargate instead.');
            return;
        }
        if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])().credits < Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* priceOf */])(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost)) {
            this.flash('Not enough credits for ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].name + '.');
            return;
        }
        Object(__WEBPACK_IMPORTED_MODULE_3__profile__["h" /* installModule */])(hull.id, slotId, type);
        this.selectedSlot = slotId;
        this.flash(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].name + ' installed.');
        if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* getProfile */])().credits < Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* priceOf */])(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost)) this.armedModule = null;
        this.refresh();
    }

    // Pointer drag from palette onto a mount. A press without movement arms the module instead.
    startDrag(event, type) {
        event.preventDefault();
        this.drag = { type: type, startX: event.clientX, startY: event.clientY, moved: false, ghost: null };

        this.onDragMove = (e) => {
            const drag = this.drag;
            if(!drag) return;
            if(!drag.moved && Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 6) {
                drag.moved = true;
                drag.ghost = el('canvas', 'drag-ghost');
                const ctx = setupCanvas(drag.ghost, 48, 48);
                ctx.translate(24, 24);
                Object(__WEBPACK_IMPORTED_MODULE_2__modules__["d" /* drawModule */])(ctx, type, 1, { scale: 3, lineWidth: 1.5 });
                document.body.appendChild(drag.ghost);
            }
            if(drag.ghost) {
                drag.ghost.style.left = (e.clientX - 24) + 'px';
                drag.ghost.style.top = (e.clientY - 24) + 'px';
                this.hoverSlot = this.slotAt(e.clientX, e.clientY);
            }
        };

        this.onDragEnd = (e) => {
            const drag = this.drag;
            this.endDrag();
            if(!drag) return;
            if(drag.moved) {
                const slotId = this.slotAt(e.clientX, e.clientY);
                if(slotId) this.install(slotId, drag.type);
            } else {
                this.armedModule = this.armedModule === drag.type ? null : drag.type;
                this.refresh();
            }
        };

        window.addEventListener('pointermove', this.onDragMove);
        window.addEventListener('pointerup', this.onDragEnd);
    }

    endDrag() {
        if(this.drag && this.drag.ghost) this.drag.ghost.remove();
        this.drag = null;
        if(this.onDragMove) window.removeEventListener('pointermove', this.onDragMove);
        if(this.onDragEnd) window.removeEventListener('pointerup', this.onDragEnd);
        this.onDragMove = null;
        this.onDragEnd = null;
    }

    renderCanvas() {
        const rect = this.canvasWrap.getBoundingClientRect();
        if(Math.abs(rect.width - this.canvasWidth) > 1 || Math.abs(rect.height - this.canvasHeight) > 1) {
            this.resizeCanvas();
        }
        const ctx = this.ctx;
        if(!ctx) return;
        this.positionPopover();
        const hull = this.hull;
        const layout = this.layout();
        const fit = layout.fit;
        const loadout = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["j" /* loadoutFor */])(hull.id);
        const time = performance.now() / 1000;
        const placing = !!(this.armedModule || (this.drag && this.drag.moved));

        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Blueprint grid.
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 170, 255, 0.07)';
        ctx.lineWidth = 1;
        for(let x = 0; x < this.canvasWidth; x += 24) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvasHeight); ctx.stroke();
        }
        for(let y = 0; y < this.canvasHeight; y += 24) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvasWidth, y); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(fit.offsetX, fit.offsetY);
        ctx.scale(fit.scale, fit.scale);
        Object(__WEBPACK_IMPORTED_MODULE_0__hulls__["c" /* drawHullArt */])(ctx, hull, { lineWidth: 1.6 / fit.scale, glow: 8 });
        ctx.restore();

        layout.slots.forEach(s => {
            const module = loadout[s.slot.id];
            const hovered = this.hoverSlot === s.slot.id;
            const selected = this.selectedSlot === s.slot.id;
            const iconScale = Math.max(1.6, Math.min(4, hull.moduleScale * fit.scale * 0.9));
            const radius = iconScale * 5.5;

            ctx.save();
            ctx.translate(s.x, s.y);

            if(module) {
                Object(__WEBPACK_IMPORTED_MODULE_2__modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: iconScale, lineWidth: 1.5 });
            } else {
                const pulse = placing ? 0.5 + 0.5 * Math.sin(time * 6) : 0;
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = placing
                    ? 'rgba(140, 255, 160, ' + (0.5 + pulse * 0.5) + ')'
                    : 'rgba(200, 220, 255, 0.55)';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.stroke();
            }

            if(hovered || selected) {
                ctx.strokeStyle = selected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = selected ? 2 : 1.2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        });
    }
}

let instance = null;

const getShipyard = () => {
    if(!instance) instance = new Shipyard();
    return instance;
};
/* harmony export (immutable) */ __webpack_exports__["a"] = getShipyard;


const isShipyardOpen = () => !!(instance && instance.isOpen);
/* harmony export (immutable) */ __webpack_exports__["b"] = isShipyardOpen;



/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CHEVRON_ANGLES; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__render_glyphs__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__audio_audio__ = __webpack_require__(3);
// The Stargate in each system, and the DHD (dial-home device) next to it.
//
// Dialling follows the Carter Addon Pack's DHD ("fast") dial of a Milky Way gate, so its
// sounds line up exactly: the ring starts rolling, chevrons 1-6 encode at slightly random
// intervals while it turns, the ring stops, chevron 7 locks, and 1.2 s later the gate opens
// with the kawoosh (7 s from pressing the dome), settling into a rippling event horizon.
// Small ships can fly through an outgoing wormhole; it closes after a while.





const GATE_RADIUS = 78;
/* harmony export (immutable) */ __webpack_exports__["d"] = GATE_RADIUS;
        // outer ring
const GATE_INNER = 58;
/* harmony export (immutable) */ __webpack_exports__["c"] = GATE_INNER;
         // event horizon radius (ships bigger than this can't pass)
const DHD_OFFSET = { x: 0, y: 220 };
/* unused harmony export DHD_OFFSET */

const DHD_RANGE = 170;
/* harmony export (immutable) */ __webpack_exports__["b"] = DHD_RANGE;
         // how close to the DHD you need to be to use it

// DHD dial timeline (seconds after the dome is pressed), from CAP's stargate_sg1 sequence.
const RING_START = 0.1;               // ring starts rolling
const FIRST_CHEVRON = 1.0;            // chevron 1 encodes
const CHEVRONS_SPAN = 4.0;            // chevrons 1-6 and the ring stopping take this long
const RING_STOP_TO_LOCK = 0.8;        // ring stops, then chevron 7 locks
const LOCK_TO_OPEN = 1.2;             // chevron 7 lock to the gate opening
const FORM_TIME = 0.8;                // horizon water rushing in from the rim before the burst

// Churning foam blobs for the horizon forming (fixed layout, animated).
const FOAM = [];
for(let i = 0; i < 46; i++) {
    FOAM.push({ angle: Math.random() * Math.PI * 2, depth: Math.random(), size: 0.5 + Math.random(),
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.6), phase: Math.random() * 10 });
}
const KAWOOSH_TIME = 1.3;
const OPEN_TIME = 38;                 // wormholes stay open this long (outgoing)
const INCOMING_OPEN_TIME = 4;         // after arriving through a gate
const CLOSE_TIME = 0.9;
const SYMBOLS = 39;

const CHEVRON_ANGLES = [];
for(let i = 0; i < 9; i++) CHEVRON_ANGLES.push(-Math.PI / 2 + i * Math.PI * 2 / 9);
// Order in which chevrons light: chevrons 1-6 around the gate, then the top one (7).
const LOCK_ORDER = [1, 2, 3, 6, 7, 8, 0];

let ringSprite = null;
let symbolSprite = null;

// Outer ring body (cached).
const buildRing = () => Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["a" /* createSprite */])(GATE_RADIUS * 2 + 20, GATE_RADIUS * 2 + 20, ctx => {
    const c = GATE_RADIUS + 10;
    ctx.translate(c, c);
    ctx.beginPath();
    ctx.arc(0, 0, GATE_RADIUS, 0, Math.PI * 2);
    ctx.arc(0, 0, GATE_INNER, 0, Math.PI * 2, true);
    const metal = ctx.createRadialGradient(-20, -25, GATE_INNER * 0.6, 0, 0, GATE_RADIUS);
    metal.addColorStop(0, 'rgb(150, 150, 158)');
    metal.addColorStop(0.6, 'rgb(95, 96, 104)');
    metal.addColorStop(1, 'rgb(55, 56, 64)');
    ctx.fillStyle = metal;
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(20, 20, 26, 0.9)';
    ctx.lineWidth = 1.5;
    [GATE_RADIUS, GATE_INNER, GATE_RADIUS - 6, GATE_INNER + 5].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
    });
    // Segment seams.
    for(let i = 0; i < 36; i++) {
        const a = i * Math.PI * 2 / 36;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (GATE_RADIUS - 6), Math.sin(a) * (GATE_RADIUS - 6));
        ctx.lineTo(Math.cos(a) * GATE_RADIUS, Math.sin(a) * GATE_RADIUS);
        ctx.stroke();
    }
}, 2);

// Inner symbol ring with all 39 glyphs (cached; rotated when spinning).
const buildSymbols = () => Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["a" /* createSprite */])(GATE_RADIUS * 2, GATE_RADIUS * 2, ctx => {
    ctx.translate(GATE_RADIUS, GATE_RADIUS);
    const mid = (GATE_INNER + 5 + GATE_RADIUS - 6) / 2;
    ctx.beginPath();
    ctx.arc(0, 0, GATE_RADIUS - 6, 0, Math.PI * 2);
    ctx.arc(0, 0, GATE_INNER + 5, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgb(70, 72, 80)';
    ctx.fill('evenodd');
    for(let i = 0; i < SYMBOLS; i++) {
        const a = i * Math.PI * 2 / SYMBOLS;
        ctx.save();
        ctx.rotate(a);
        // Slot 38 holds the point of origin (where the ring comes to rest after a dial).
        if(i < __WEBPACK_IMPORTED_MODULE_1__render_glyphs__["a" /* GLYPH_NAMES */].length) Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(ctx, __WEBPACK_IMPORTED_MODULE_1__render_glyphs__["a" /* GLYPH_NAMES */][i], 0, -mid, 7, 'rgba(200, 205, 215, 0.85)', 0.9);
        else if(i === SYMBOLS - 1) Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(ctx, 'origin:0', 0, -mid, 7, 'rgba(200, 205, 215, 0.85)', 0.9);
        ctx.restore();
    }
}, 2);



// The inner symbol ring image (also used as the 3D ring's texture).
const gateSymbolSprite = () => {
    if(!symbolSprite) symbolSprite = buildSymbols();
    return symbolSprite;
};
/* harmony export (immutable) */ __webpack_exports__["f"] = gateSymbolSprite;


class Stargate {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.state = 'idle';
        this.timer = 0;
        this.locked = 0;
        this.spin = 0;
        this.spinFrom = 0;
        this.spinTo = 0;
        this.phase = 'spin';
        this.outgoing = false;
        this.target = null;
        this.kawoosh = 0;
        this.time = 0;
    }

    get dhd() {
        return { x: this.x + DHD_OFFSET.x, y: this.y + DHD_OFFSET.y };
    }

    get isOpen() {
        return this.state === 'open';
    }

    get busy() {
        return this.state !== 'idle';
    }

    // Start dialling `targetId`; `symbols` are the 7 dialled glyphs (for the spin targets).
    dial(targetId, symbols) {
        // A gate that is still shutting down can be dialled again straight away.
        if(this.busy && this.state !== 'closing') return false;
        if(this.state === 'closing') __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].horizon(false);
        this.wasOpen = false;
        this.state = 'dialing';
        this.outgoing = true;
        this.target = targetId;
        this.symbols = symbols;
        this.locked = 0;
        this.phase = 'spin';
        this.clock = 0;
        this.ringOn = false;
        // Chevrons 1-6 at random-ish intervals (CAP: 0.3-1.0 s each plus an even share, the
        // last gap always the longest) that together span CHEVRONS_SPAN.
        const gaps = [];
        for(let i = 0; i < 5; i++) gaps.push(0.3 + Math.random() * 0.7);
        gaps.push(1);
        const total = gaps.reduce((a, b) => a + b, 0);
        const delta = (CHEVRONS_SPAN - total) / 6;
        this.chevronTimes = [];
        let t = FIRST_CHEVRON;
        for(let i = 0; i < 6; i++) {
            this.chevronTimes.push(t);
            t += gaps[i] + delta;
        }
        this.ringStop = t;
        this.lockTime = t + RING_STOP_TO_LOCK;
        this.openTime = this.lockTime + LOCK_TO_OPEN;
        // The ring turns one way for the whole dial and comes to rest with the point of
        // origin under the top chevron.
        this.spinFrom = this.spin;
        const finalAngle = -Math.PI / 2 + Math.PI / 2 - 38 * Math.PI * 2 / SYMBOLS;
        let to = finalAngle;
        while(to < this.spin + Math.PI * 4) to += Math.PI * 2;
        this.spinTo = to;
        return true;
    }

    // A wormhole arriving here (after travelling through it).
    incoming() {
        this.state = 'open';
        this.outgoing = false;
        this.locked = 7;
        this.timer = INCOMING_OPEN_TIME;
        this.kawoosh = 0;
        __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].horizon(true);
    }

    // `silent`: shut down without the closing sound (the ship has just gone through).
    close(silent) {
        if(this.state === 'idle' || this.state === 'closing') return;
        // Only an established wormhole fades its horizon out; a cancelled dial just stops.
        this.wasOpen = this.state === 'open' || (this.state === 'kawoosh' && this.kawoosh > 0.45);
        this.ringOn = false;
        this.state = 'closing';
        this.timer = CLOSE_TIME;
        __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].gateSpin(false);
        __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].horizon(false);
        __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].gateClose(silent);
    }

    update(dt) {
        this.time += dt;
        if(this.state === 'idle') return;
        this.timer -= dt;

        if(this.state === 'dialing') {
            const t = (this.clock += dt);
            if(!this.ringOn && t >= RING_START && t < this.ringStop) {
                this.ringOn = true;
                __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].gateSpin(true);
            }
            // Ring: ease in, roll, ease out to a stop at ringStop.
            const span = this.ringStop - RING_START;
            const u = Math.max(0, Math.min(1, (t - RING_START) / span));
            const ease = u < 0.12 ? (u * u) / (2 * 0.12 * 0.88) :
                u > 0.88 ? 1 - ((1 - u) * (1 - u)) / (2 * 0.12 * 0.88) :
                (u - 0.06) / 0.88;
            this.spin = this.spinFrom + (this.spinTo - this.spinFrom) * ease;
            // Chevrons 1-6 encode while the ring turns.
            while(this.locked < 6 && t >= this.chevronTimes[this.locked]) {
                this.locked++;
                this.phase = 'encode';
                this.lockFlash = 0.3;
                __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].chevronLock(false);
            }
            // Ring stopped: its sound stops as chevron 7 locks.
            if(this.locked === 6 && t >= this.lockTime) {
                this.locked = 7;
                this.phase = 'lock';
                this.lockFlash = 0.6;
                __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].gateSpin(false);
                this.ringOn = false;
                __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].chevronLock(true);
            }
            if(this.lockFlash > 0) this.lockFlash -= dt;
            if(t >= this.openTime) {
                this.state = 'opening';
                this.timer = FORM_TIME;
                __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].kawoosh();
            }
        } else if(this.state === 'opening') {
            if(this.timer <= 0) {
                this.state = 'kawoosh';
                this.timer = KAWOOSH_TIME;
            }
        } else if(this.state === 'kawoosh') {
            this.kawoosh = 1 - Math.max(0, this.timer) / KAWOOSH_TIME;
            if(this.timer <= 0) {
                this.state = 'open';
                this.timer = OPEN_TIME;
                __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].horizon(true);
            }
        } else if(this.state === 'open') {
            if(this.timer <= 0) this.close();
        } else if(this.state === 'closing') {
            if(this.timer <= 0) {
                this.state = 'idle';
                this.locked = 0;
                this.target = null;
            }
        }
    }

    // `effectsOnly`: the 3D view draws the ring, symbols and chevrons; only the event
    // horizon, kawoosh and chevron glow are drawn here.
    draw(ctx, time, effectsOnly) {
        if(!ringSprite) ringSprite = buildRing();
        if(!symbolSprite) symbolSprite = buildSymbols();
        const R = GATE_RADIUS;

        ctx.save();
        ctx.translate(this.x, this.y);

        // The horizon forming: water rushing in from the rim (and still there under the
        // first moments of the kawoosh).
        if(this.state === 'opening') this.drawForming(ctx, time, 1 - Math.max(0, this.timer) / FORM_TIME);
        if(this.state === 'kawoosh' && this.kawoosh <= 0.45) this.drawForming(ctx, time, 1);

        // Event horizon behind the ring.
        if(this.state === 'open' || (this.state === 'closing' && this.wasOpen) || (this.state === 'kawoosh' && this.kawoosh > 0.45)) {
            const fade = this.state === 'closing' ? Math.max(0, this.timer / CLOSE_TIME) : 1;
            this.drawHorizon(ctx, time, fade);
        }

        if(!effectsOnly) {
            ctx.save();
            ctx.rotate(this.spin);
            ctx.drawImage(symbolSprite.canvas, -R, -R, R * 2, R * 2);
            ctx.restore();
            ctx.drawImage(ringSprite.canvas, -R - 10, -R - 10, R * 2 + 20, R * 2 + 20);
        }

        // Chevrons: locked ones glow.
        CHEVRON_ANGLES.forEach((a, i) => {
            const order = LOCK_ORDER.indexOf(i);
            const lit = order !== -1 && order < this.locked;
            const engaging = this.state === 'dialing' && this.lockFlash > 0 && order === this.locked - 1;
            if(effectsOnly && !lit) return;
            ctx.save();
            ctx.rotate(a + Math.PI / 2);
            ctx.translate(0, -R + 2);
            if(effectsOnly) {
                ctx.globalCompositeOperation = 'lighter';
                Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('255,120,40'), 0, 2, 26, 26);
                ctx.restore();
                return;
            }
            ctx.fillStyle = 'rgb(120, 118, 125)';
            ctx.strokeStyle = 'rgb(35, 35, 42)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-8, -4); ctx.lineTo(8, -4); ctx.lineTo(4, 7); ctx.lineTo(0, 9); ctx.lineTo(-4, 7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = lit ? 'rgb(255, 140, 60)' : 'rgb(80, 40, 30)';
            ctx.beginPath();
            ctx.moveTo(-4, -1); ctx.lineTo(4, -1); ctx.lineTo(0, 6 + (engaging ? 2 : 0));
            ctx.closePath();
            ctx.fill();
            if(lit) {
                ctx.globalCompositeOperation = 'lighter';
                Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('255,120,40'), 0, 2, 26, 26);
            }
            ctx.restore();
        });

        // The kawoosh: the unstable vortex bursting out and collapsing back.
        if(this.state === 'kawoosh') {
            const k = this.kawoosh;
            const burst = Math.sin(Math.min(1, k / 0.75) * Math.PI);
            const radius = GATE_INNER * (0.6 + 1.9 * burst);
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            g.addColorStop(0, 'rgba(240, 250, 255, ' + (0.9 * burst) + ')');
            g.addColorStop(0.5, 'rgba(110, 170, 255, ' + (0.75 * burst) + ')');
            g.addColorStop(1, 'rgba(60, 110, 255, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            // Spiralling vortex streaks.
            ctx.strokeStyle = 'rgba(220, 240, 255, ' + (0.6 * burst) + ')';
            ctx.lineWidth = 2;
            for(let i = 0; i < 6; i++) {
                const a0 = i * Math.PI / 3 + time * 6;
                ctx.beginPath();
                for(let s = 0; s <= 10; s++) {
                    const rr = radius * s / 10;
                    const aa = a0 + s * 0.35;
                    if(s === 0) ctx.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
                    else ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    // The event horizon forming, as seen in the show: churning icy white-blue water rushes in
    // from the rim while the middle is still see-through. `f` 0..1 is how far it has closed.
    drawForming(ctx, time, f) {
        const r = GATE_INNER;
        const e = f * f * (3 - 2 * f);
        const inner = r * (1 - e) * 0.95;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();
        // Translucent watery band, brightest and thickest at the rim.
        const g = ctx.createRadialGradient(0, 0, Math.max(0, inner * 0.85), 0, 0, r);
        g.addColorStop(0, 'rgba(150, 190, 240, 0)');
        g.addColorStop(0.2, 'rgba(170, 205, 250, ' + (0.35 + 0.3 * e) + ')');
        g.addColorStop(0.65, 'rgba(215, 235, 255, ' + (0.7 + 0.2 * e) + ')');
        g.addColorStop(1, 'rgba(150, 195, 250, 0.95)');
        ctx.fillStyle = g;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        // Churning foam swirling around in the band.
        ctx.globalCompositeOperation = 'lighter';
        FOAM.forEach(blob => {
            const a = blob.angle + time * blob.spin;
            const d = inner + (r - inner) * (0.15 + 0.85 * blob.depth) + Math.sin(time * 6 + blob.phase) * 2;
            const size = (6 + 12 * blob.size) * (0.6 + 0.4 * Math.sin(time * 7 + blob.phase));
            ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 9 + blob.phase);
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])(blob.spin > 0 ? '230,242,255' : '185,215,255'), Math.cos(a) * d, Math.sin(a) * d, size * 1.6, size);
        });
        // Ripple lines racing round the band.
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = 'rgb(235, 245, 255)';
        ctx.lineWidth = 1.2;
        for(let i = 0; i < 7; i++) {
            const rr = inner + (r - inner) * ((i + 0.5) / 7);
            const a0 = time * (i % 2 ? 3 : -2.4) + i;
            ctx.beginPath();
            ctx.arc(0, 0, rr, a0, a0 + 0.8 + 0.5 * Math.sin(time * 4 + i));
            ctx.stroke();
        }
        ctx.restore();
    }

    // Rippling, shimmering pool of the event horizon.
    drawHorizon(ctx, time, fade) {
        const r = GATE_INNER;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();
        const pool = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r);
        pool.addColorStop(0, 'rgba(200, 230, 255, ' + (0.95 * fade) + ')');
        pool.addColorStop(0.5, 'rgba(70, 140, 240, ' + (0.9 * fade) + ')');
        pool.addColorStop(1, 'rgba(25, 60, 170, ' + (0.95 * fade) + ')');
        ctx.fillStyle = pool;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1.5;
        for(let i = 0; i < 6; i++) {
            const t = (time * 0.45 + i / 6) % 1;
            ctx.strokeStyle = 'rgba(210, 235, 255, ' + (0.35 * (1 - t) * fade) + ')';
            ctx.beginPath();
            ctx.arc(Math.sin(time * 0.7 + i) * 4, Math.cos(time * 0.6 + i) * 4, r * t, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Caustic shimmer.
        for(let i = 0; i < 10; i++) {
            const a = time * 0.8 + i * 0.63;
            const d = (0.2 + 0.7 * ((i * 0.37 + time * 0.1) % 1)) * r;
            ctx.globalAlpha = 0.25 * fade;
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('170,210,255'), Math.cos(a) * d, Math.sin(a * 1.3) * d, 22, 10);
        }
        ctx.restore();
    }

    // DHD pedestal: octagonal base, two rings of keys, red dome. Glows when you're in range.
    // `effectsOnly`: the 3D view draws the pedestal; only the glow and label are drawn here.
    drawDHD(ctx, time, inRange, effectsOnly) {
        const d = this.dhd;
        ctx.save();
        ctx.translate(d.x, d.y);
        if(effectsOnly) {
            if(this.busy || inRange) {
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = this.busy ? 1 : (0.6 + 0.4 * Math.sin(time * 3)) * 0.6;
                Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('255,90,50'), 0, 0, 40, 40);
            }
            ctx.restore();
            this.drawDHDLabel(ctx, inRange);
            return;
        }
        ctx.fillStyle = 'rgb(70, 68, 66)';
        ctx.strokeStyle = 'rgb(30, 28, 26)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for(let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4 + Math.PI / 8;
            if(i === 0) ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
            else ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        [[24, 19], [16, 20]].forEach(ring => {
            for(let i = 0; i < ring[1]; i++) {
                const a = i * Math.PI * 2 / ring[1];
                ctx.fillStyle = 'rgb(150, 145, 135)';
                ctx.fillRect(Math.cos(a) * ring[0] - 2, Math.sin(a) * ring[0] - 2, 4, 4);
            }
        });
        const pulse = 0.6 + 0.4 * Math.sin(time * 3);
        ctx.fillStyle = this.busy ? 'rgb(255, 90, 50)' : 'rgb(150, 40, 30)';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        if(this.busy || inRange) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = this.busy ? 1 : pulse * 0.6;
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('255,90,50'), 0, 0, 40, 40);
        }
        ctx.restore();
        this.drawDHDLabel(ctx, inRange);
    }

    drawDHDLabel(ctx, inRange) {
        const d = this.dhd;
        ctx.save();
        ctx.font = '11px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = inRange ? 'rgba(140, 255, 160, 0.95)' : 'rgba(200, 210, 230, 0.6)';
        ctx.fillText(inRange ? 'DHD · press B' : 'DHD', d.x, d.y + 46);
        ctx.restore();
    }

    // Which chevrons are lit (for the 3D view), by chevron index 0-8.
    chevronLit(index) {
        const order = LOCK_ORDER.indexOf(index);
        return order !== -1 && order < this.locked;
    }
}

/* harmony default export */ __webpack_exports__["e"] = (Stargate);


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_systems__ = __webpack_require__(5);
// Stargate symbols, traced after the Milky Way glyph chart (glyphs 1-39). Each glyph is a
// few polylines in a -1..1 box (y down); they're drawn as thick strokes, optionally with a
// darker outline like the chart's embossed symbols.
//
// Glyph 1 (the pyramid with the sun above it) is Earth's point of origin; other gates get
// variants of the same motif.
//
// The same shapes double as the constellations' star figures on the starmap: in the show
// the glyphs are stylised constellations, so each polyline vertex becomes a star.



// Shapes by constellation name, in chart order (glyph number in the comment).
const SHAPES = {
    'Crater':            [[[-0.6, -0.8], [-0.3, -0.45], [-0.3, 0.1], [0.3, 0.1], [0.3, -0.45], [0.6, -0.8]], [[0, 0.1], [0, 0.5]], [[-0.45, 0.82], [0, 0.5], [0.45, 0.82]]],        // 2
    'Virgo':             [[[-0.45, -0.3], [-0.45, -0.8], [0.3, -0.8], [0.0, -0.2], [0.45, 0.1], [-0.1, 0.45], [0.15, 0.85]]],                                                   // 3
    'Bootes':            [[[0.6, -0.8], [0.25, -0.8], [-0.15, -0.45], [0.3, -0.05], [-0.25, 0.35], [0.1, 0.85]]],                                                                // 4
    'Centaurus':         [[[-0.65, -0.6], [-0.1, -0.1]], [[0.65, -0.65], [0.15, -0.15], [0.2, 0.25]], [[-0.55, 0.35], [-0.05, 0.25], [-0.25, 0.8]]],                            // 5
    'Libra':             [[[-0.65, -0.65], [0.5, -0.65], [0.55, 0.15], [0.0, 0.45], [-0.25, 0.85]], [[-0.65, -0.65], [-0.5, -0.25]]],                                           // 6
    'Serpens Caput':     [[[0.35, -0.85], [-0.2, -0.6], [-0.35, 0.35], [0.05, 0.65], [0.5, 0.45]], [[0.35, -0.85], [0.45, -0.55]]],                                             // 7
    'Norma':             [[[-0.65, -0.5], [0.15, -0.55], [-0.3, 0.15], [-0.65, -0.5]], [[0.25, 0.15], [0.65, 0.55]]],                                                           // 8
    'Scorpius':          [[[-0.75, 0.55], [0.35, 0.55], [0.7, 0.2], [0.55, -0.3]], [[-0.4, 0.55], [0.1, -0.15], [0.45, -0.6]]],                                                 // 9
    'Corona Australis':  [[[0.55, -0.7], [-0.4, -0.7], [-0.65, 0.0], [-0.25, 0.65], [0.55, 0.6]], [[0.1, -0.25], [0.5, 0.15]]],                                                 // 10
    'Scutum':            [[[-0.75, 0.6], [0.6, -0.6], [0.6, 0.55], [-0.2, 0.15]], [[0.6, -0.6], [0.8, -0.8]]],                                                                  // 11
    'Sagittarius':       [[[-0.75, -0.35], [-0.25, -0.75], [0.15, -0.25], [0.7, -0.55]], [[0.15, -0.25], [-0.05, 0.4], [0.55, 0.75]], [[-0.5, 0.15], [-0.05, 0.4]], [[0.35, 0.1], [0.65, 0.2]]], // 12
    'Aquila':            [[[-0.75, -0.5], [-0.15, 0.65], [0.2, -0.2], [0.75, -0.6]], [[0.2, -0.2], [0.55, 0.15]]],                                                              // 13
    'Microscopium':      [[[-0.3, -0.75], [-0.6, 0.5], [0.75, 0.25]], [[-0.45, -0.1], [0.3, -0.45]]],                                                                           // 14
    'Capricornus':       [[[-0.75, 0.6], [0.55, -0.6], [0.5, 0.6], [-0.75, 0.6]], [[0.55, -0.6], [0.8, -0.85]]],                                                                // 15
    'Piscis Austrinus':  [[[0.3, -0.85], [-0.3, -0.5], [-0.35, 0.45], [0.25, 0.85]], [[-0.3, -0.5], [0.05, -0.35]]],                                                            // 16
    'Equuleus':          [[[-0.75, -0.3], [0.3, -0.35], [0.55, 0.0], [0.3, 0.45]], [[-0.2, -0.32], [-0.45, 0.35]]],                                                             // 17
    'Aquarius':          [[[-0.65, 0.55], [-0.5, -0.4], [0.45, -0.5], [0.65, 0.3]], [[-0.05, -0.45], [0.1, 0.15]]],                                                             // 18
    'Pegasus':           [[[0.5, -0.85], [0.0, -0.2], [0.35, 0.1], [-0.4, 0.85]], [[0.0, -0.2], [-0.35, -0.45]]],                                                               // 19
    'Sculptor':          [[[-0.5, -0.65], [0.05, -0.65], [-0.2, 0.0], [0.55, 0.65]], [[0.55, 0.65], [0.35, 0.2]]],                                                              // 20
    'Pisces':            [[[-0.5, -0.75], [0.0, 0.1], [0.5, -0.45]], [[0.0, 0.1], [-0.2, 0.85]]],                                                                               // 21
    'Andromeda':         [[[0.0, -0.85], [0.2, -0.35], [-0.12, 0.0], [0.12, 0.4], [0.0, 0.85]]],                                                                                // 22
    'Triangulum':        [[[-0.75, -0.4], [0.75, -0.4], [-0.1, 0.4], [-0.75, -0.4]]],                                                                                           // 23
    'Aries':             [[[0.5, -0.75], [0.1, -0.2], [-0.45, 0.75]]],                                                                                                          // 24
    'Perseus':           [[[0.3, -0.85], [-0.2, -0.45], [-0.2, 0.2], [0.2, 0.6], [0.0, 0.85]]],                                                                                 // 25
    'Cetus':             [[[-0.65, -0.4], [0.5, -0.4], [0.65, 0.1], [0.0, 0.45]], [[-0.65, -0.4], [-0.3, 0.35]]],                                                               // 26
    'Taurus':            [[[-0.85, 0.05], [0.85, 0.0]], [[0.2, 0.02], [0.6, -0.4]], [[-0.45, 0.04], [-0.75, -0.3]]],                                                            // 27
    'Auriga':            [[[-0.4, -0.75], [-0.5, 0.35], [0.0, 0.7], [0.5, 0.35], [0.4, -0.75]], [[-0.15, -0.35], [0.15, -0.35]]],                                               // 28
    'Eridanus':          [[[0.45, -0.85], [0.1, -0.3], [0.45, 0.0], [-0.35, 0.85]]],                                                                                            // 29
    'Orion':             [[[-0.5, -0.75], [0.5, -0.75], [-0.5, 0.75], [0.5, 0.75], [-0.5, -0.75]]],                                                                             // 30
    'Canis Minor':       [[[-0.45, -0.75], [0.45, -0.05], [-0.45, 0.15], [0.45, 0.8]]],                                                                                         // 31
    'Monoceros':         [[[-0.6, -0.2], [-0.6, -0.6], [0.2, -0.6], [0.2, 0.2], [0.65, 0.75]], [[0.2, -0.15], [-0.25, 0.25]]],                                                  // 32
    'Gemini':            [[[-0.3, -0.85], [0.3, -0.85], [0.3, 0.85], [-0.3, 0.85], [-0.3, -0.85]], [[-0.3, 0.0], [0.3, 0.0]]],                                                  // 33
    'Hydra':             [[[-0.2, -0.85], [0.2, -0.5], [-0.2, -0.1], [0.2, 0.3], [-0.1, 0.85]]],                                                                                // 34
    'Lynx':              [[[-0.5, -0.75], [0.2, -0.2], [0.5, 0.75]]],                                                                                                           // 35
    'Cancer':            [[[-0.65, -0.65], [0.05, 0.2]], [[0.45, 0.6]]],                                                                                                        // 36
    'Sextans':           [[[-0.7, -0.55], [-0.3, -0.4]], [[-0.05, 0.0], [0.35, 0.2]], [[0.65, 0.6]]],                                                                           // 37
    'Leo Minor':         [[[-0.6, -0.75], [0.1, 0.1], [0.5, 0.75]], [[0.1, 0.1], [0.45, -0.15]]],                                                                               // 38
    'Leo':               [[[0.3, -0.85], [0.55, -0.5], [0.0, 0.2], [0.1, 0.85]], [[0.0, 0.2], [-0.45, -0.05]]]                                                                  // 39
};

// All chart glyphs 2-39 by name (the gate's ring shows every one), and the constellations
// used for addresses in chart order (the DHD's tiles).
const GLYPH_NAMES = Object.keys(SHAPES);
/* harmony export (immutable) */ __webpack_exports__["a"] = GLYPH_NAMES;

const GLYPH_ORDER = GLYPH_NAMES.map(name => __WEBPACK_IMPORTED_MODULE_0__world_systems__["a" /* CONSTELLATIONS */].indexOf(name)).filter(i => i !== -1);
/* harmony export (immutable) */ __webpack_exports__["b"] = GLYPH_ORDER;


// Glyph 1: the pyramid with the sun above it. Other gates' points of origin vary the crown.
const origin = (index) => {
    const shape = [
        [[-0.75, 0.8], [-0.1, -0.35]],
        [[0.75, 0.8], [0.1, -0.35]],
        [[-0.3, 0.8], [0.0, 0.35], [0.3, 0.8]]
    ];
    const variant = index % 4;
    if(variant === 1) shape.push([[-0.45, -0.75], [0.45, -0.75]]);
    if(variant === 2) shape.push([[-0.4, -0.5], [0, -0.85], [0.4, -0.5]]);
    if(variant === 3) shape.push([[-0.75, 0.8], [0.75, 0.8]]);
    return { lines: shape, sun: variant === 0 || variant === 3 ? [0, -0.62, 0.2] : null };
};

const cache = {};
const shapeOf = (id) => {
    if(cache[id]) return cache[id];
    let shape;
    if(typeof id === 'string' && id.indexOf('origin:') === 0) shape = origin(parseInt(id.split(':')[1], 10) || 0);
    else if(typeof id === 'string') shape = { lines: SHAPES[id] || [[[0, -0.8], [0, 0.8]]], sun: null };
    else shape = { lines: SHAPES[__WEBPACK_IMPORTED_MODULE_0__world_systems__["a" /* CONSTELLATIONS */][id]] || [[[0, -0.8], [0, 0.8]]], sun: null };
    cache[id] = shape;
    return shape;
};

const tracePath = (ctx, shape, s) => {
    ctx.beginPath();
    shape.lines.forEach(line => {
        if(line.length === 1) {
            // A lone dot.
            ctx.moveTo(line[0][0] * s + 0.01, line[0][1] * s);
            ctx.lineTo(line[0][0] * s, line[0][1] * s);
            return;
        }
        line.forEach((p, i) => {
            if(i === 0) ctx.moveTo(p[0] * s, p[1] * s);
            else ctx.lineTo(p[0] * s, p[1] * s);
        });
    });
    if(shape.sun) {
        ctx.moveTo(shape.sun[0] * s + shape.sun[2] * s, shape.sun[1] * s);
        ctx.arc(shape.sun[0] * s, shape.sun[1] * s, shape.sun[2] * s, 0, Math.PI * 2);
    }
};

// Draw glyph `id` (a constellation index, or 'origin:<n>') centred at (x, y). With an
// `outline` colour the stroke gets a darker rim, like the glyph chart.
const drawGlyph = (ctx, id, x, y, size, color, lineWidth, outline) => {
    const shape = shapeOf(id);
    const s = size / 2;
    const width = lineWidth || Math.max(1, size * 0.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tracePath(ctx, shape, s * 0.92);
    if(outline) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = width * 1.9;
        ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["d"] = drawGlyph;


// Star figure of a constellation: the glyph's vertices are its main stars, plus a few
// fainter stars branching off them (fixed per constellation), like a star chart.
const figures = {};
const figureOf = (id) => {
    if(figures[id]) return figures[id];
    const shape = shapeOf(id);
    let seed = (typeof id === 'number' ? id + 1 : 99) * 2654435761 >>> 0;
    const rand = () => {
        seed = (seed + 0x6D2B79F5) >>> 0;
        let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const stars = [];
    const links = [];
    shape.lines.forEach(line => {
        line.forEach((p, i) => {
            stars.push({ x: p[0], y: p[1], big: i === 0 || i === line.length - 1 });
            if(i > 0) links.push([stars.length - 2, stars.length - 1]);
        });
    });
    const main = stars.length;
    const extra = 2 + Math.floor(rand() * 3);
    for(let i = 0; i < extra; i++) {
        const from = stars[Math.floor(rand() * main)];
        const a = rand() * Math.PI * 2;
        const d = 0.25 + rand() * 0.3;
        const x = Math.max(-0.95, Math.min(0.95, from.x + Math.cos(a) * d));
        const y = Math.max(-0.95, Math.min(0.95, from.y + Math.sin(a) * d));
        stars.push({ x: x, y: y, big: false });
        if(rand() < 0.75) links.push([stars.indexOf(from), stars.length - 1]);
    }
    figures[id] = { stars: stars, links: links };
    return figures[id];
};

// The constellation as a star figure (dots joined by thin lines), centred at (x, y).
const drawConstellation = (ctx, id, x, y, size, color, starColor, dotScale) => {
    const figure = figureOf(id);
    const s = size / 2;
    const k = dotScale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.8, 0.8 * k);
    ctx.beginPath();
    figure.links.forEach(link => {
        const a = figure.stars[link[0]];
        const b = figure.stars[link[1]];
        ctx.moveTo(a.x * s, a.y * s);
        ctx.lineTo(b.x * s, b.y * s);
    });
    ctx.stroke();
    ctx.fillStyle = starColor || color;
    figure.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x * s, star.y * s, (star.big ? 1.9 : 1.4) * k, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["c"] = drawConstellation;



/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__sprites__ = __webpack_require__(0);
// Background planets and nebula tint for each star system, rendered once into sprites.



const cache = {};

const PALETTES = {
    ocean: { base: [40, 90, 170], dark: [10, 30, 70], land: [70, 140, 120], cloud: [235, 245, 255], atmosphere: '120,180,255' },
    earth: { base: [40, 80, 160], dark: [10, 25, 60], land: [70, 130, 70], cloud: [245, 248, 255], atmosphere: '130,180,255' },
    desert: { base: [200, 160, 100], dark: [90, 60, 30], land: [170, 120, 70], cloud: [240, 225, 200], atmosphere: '240,200,140' },
    jungle: { base: [60, 120, 70], dark: [15, 40, 20], land: [110, 100, 60], cloud: [235, 245, 235], atmosphere: '150,220,170' },
    rocky: { base: [150, 80, 60], dark: [50, 20, 15], land: [110, 60, 45], cloud: [220, 190, 170], atmosphere: '230,150,120' },
    industrial: { base: [110, 100, 110], dark: [30, 25, 35], land: [80, 70, 80], cloud: [200, 195, 210], atmosphere: '190,170,220' },
    ice: { base: [180, 220, 235], dark: [50, 80, 110], land: [140, 190, 215], cloud: [250, 252, 255], atmosphere: '170,230,255' }
};
/* harmony export (immutable) */ __webpack_exports__["a"] = PALETTES;


const rgb = (c, a) => 'rgba(' + c.map(v => Math.round(v)).join(',') + ',' + (a === undefined ? 1 : a) + ')';

const rnd = (seed) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// A lit sphere with surface patches, cloud bands, a terminator and an atmosphere glow.
const planetSprite = (system) => {
    if(cache[system.id]) return cache[system.id];
    const p = system.planet;
    const pal = PALETTES[p.type];
    const R = 220;
    const size = R * 2 + 80;
    const r = rnd(system.id.length * 977 + p.radius);

    cache[system.id] = Object(__WEBPACK_IMPORTED_MODULE_0__sprites__["a" /* createSprite */])(size, size, ctx => {
        ctx.translate(size / 2, size / 2);

        // Atmosphere halo.
        const halo = ctx.createRadialGradient(0, 0, R * 0.95, 0, 0, R + 38);
        halo.addColorStop(0, 'rgba(' + pal.atmosphere + ', 0.35)');
        halo.addColorStop(1, 'rgba(' + pal.atmosphere + ', 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, R + 38, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = rgb(pal.base);
        ctx.fill();
        ctx.save();
        ctx.clip();

        // Land / surface patches.
        for(let i = 0; i < 26; i++) {
            const a = r() * Math.PI * 2;
            const d = Math.sqrt(r()) * R;
            ctx.fillStyle = rgb(pal.land, 0.5 + r() * 0.4);
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, 20 + r() * 70, 12 + r() * 40, r() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        // Dune / band texture for desert and gas-like worlds.
        if(p.type === 'desert' || p.type === 'industrial') {
            ctx.strokeStyle = rgb(pal.dark, 0.15);
            ctx.lineWidth = 3;
            for(let y = -R; y < R; y += 14) {
                ctx.beginPath();
                ctx.moveTo(-R, y);
                ctx.quadraticCurveTo(0, y + (r() - 0.5) * 30, R, y + (r() - 0.5) * 20);
                ctx.stroke();
            }
        }
        // City lights on industrial worlds.
        if(p.type === 'industrial') {
            for(let i = 0; i < 80; i++) {
                ctx.fillStyle = 'rgba(255, 190, 110, ' + (0.4 + r() * 0.5) + ')';
                ctx.fillRect(-R * 0.2 + r() * R * 1.1, (r() - 0.5) * R * 1.6, 2, 2);
            }
        }
        // Clouds.
        for(let i = 0; i < 18; i++) {
            const y = (r() - 0.5) * R * 1.8;
            ctx.fillStyle = rgb(pal.cloud, 0.12 + r() * 0.25);
            ctx.beginPath();
            ctx.ellipse((r() - 0.5) * R, y, 60 + r() * 120, 6 + r() * 14, (r() - 0.5) * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        // Terminator: night side towards the bottom right.
        const night = ctx.createLinearGradient(-R * 0.6, -R * 0.7, R * 0.8, R * 0.9);
        night.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        night.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
        night.addColorStop(0.75, 'rgba(0, 0, 10, 0.7)');
        night.addColorStop(1, 'rgba(0, 0, 10, 0.92)');
        ctx.fillStyle = night;
        ctx.fillRect(-R, -R, R * 2, R * 2);
        ctx.restore();

        // Thin bright rim on the lit side.
        ctx.strokeStyle = 'rgba(' + pal.atmosphere + ', 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, R - 1, Math.PI * 0.85, Math.PI * 1.75);
        ctx.stroke();

        // Moon.
        if(p.moon) {
            const mx = -R * 1.05;
            const my = R * 0.85;
            const mr = 26;
            ctx.fillStyle = 'rgb(170, 168, 160)';
            ctx.beginPath();
            ctx.arc(mx, my, mr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 10, 0.6)';
            ctx.beginPath();
            ctx.arc(mx + 9, my + 8, mr, 0, Math.PI * 2);
            ctx.fill();
        }
    }, 1);
    cache[system.id].R = R;
    return cache[system.id];
};
/* harmony export (immutable) */ __webpack_exports__["b"] = planetSprite;


// Very soft coloured nebula wash for the system's background.
const nebulaSprite = (system) => {
    const key = 'nebula:' + system.id;
    if(cache[key]) return cache[key];
    const r = rnd(system.id.length * 131 + 7);
    cache[key] = Object(__WEBPACK_IMPORTED_MODULE_0__sprites__["a" /* createSprite */])(512, 512, ctx => {
        for(let i = 0; i < 7; i++) {
            const x = 80 + r() * 352;
            const y = 80 + r() * 352;
            const rad = 90 + r() * 160;
            const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
            g.addColorStop(0, 'rgba(' + system.tint + ', ' + (0.12 + r() * 0.1) + ')');
            g.addColorStop(1, 'rgba(' + system.tint + ', 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 512, 512);
        }
    }, 1);
    return cache[key];
};
/* unused harmony export nebulaSprite */



/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world3d__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__world_stargate__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render_planets__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__world_materials__ = __webpack_require__(1);
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






const FOV = 35;
const TAN_HALF_FOV = Math.tan(FOV * Math.PI / 360);

// Same light direction the asteroid surface art is painted with (upper left), lifted up.
const LIGHT = { x: -0.55, y: 0.65, z: 0.85 };

const webglAvailable = () => {
    if(!window.THREE) return false;
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch(e) {
        return false;
    }
};
/* harmony export (immutable) */ __webpack_exports__["c"] = webglAvailable;


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
const buildHullGeometries = (THREE, hull) => {
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
/* harmony export (immutable) */ __webpack_exports__["a"] = buildHullGeometries;


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
            antialias: true, alpha: true, powerPreference: 'high-performance',
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
        this.ores = Object(__WEBPACK_IMPORTED_MODULE_0__world3d__["e" /* buildOreCrystals */])(THREE);
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
            if(!this.atlantis) this.atlantis = Object(__WEBPACK_IMPORTED_MODULE_0__world3d__["b" /* buildAtlantis */])(THREE, view.station);
            this.stationGroup = this.atlantis;
            this.scene.add(this.stationGroup);
        }
        if(!this.gateModel) {
            this.gateModel = Object(__WEBPACK_IMPORTED_MODULE_0__world3d__["d" /* buildGate */])(THREE, __WEBPACK_IMPORTED_MODULE_1__world_stargate__["d" /* GATE_RADIUS */], __WEBPACK_IMPORTED_MODULE_1__world_stargate__["c" /* GATE_INNER */], Object(__WEBPACK_IMPORTED_MODULE_1__world_stargate__["f" /* gateSymbolSprite */])(), __WEBPACK_IMPORTED_MODULE_1__world_stargate__["a" /* CHEVRON_ANGLES */]);
            this.dhdModel = Object(__WEBPACK_IMPORTED_MODULE_0__world3d__["c" /* buildDHD */])(THREE);
        }
        this.gateGroup = this.gateModel.group;
        this.gateGroup.position.set(view.gate.x, -view.gate.y, 0);
        this.scene.add(this.gateGroup);
        const dhd = view.gate.dhd;
        this.dhdGroup = this.dhdModel.group;
        this.dhdGroup.position.set(dhd.x, -dhd.y, 0);
        this.scene.add(this.dhdGroup);
        const palette = __WEBPACK_IMPORTED_MODULE_2__render_planets__["a" /* PALETTES */][view.system.planet.type] || __WEBPACK_IMPORTED_MODULE_2__render_planets__["a" /* PALETTES */].rocky;
        this.planet = Object(__WEBPACK_IMPORTED_MODULE_0__world3d__["f" /* buildPlanet */])(THREE, view.system, palette);
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
        for(let i = 0; i < ores.length && count < __WEBPACK_IMPORTED_MODULE_0__world3d__["a" /* ORE_LIMIT */]; i++) {
            const ore = ores[i];
            if(ore.dead || !isVisible(ore.x, ore.y, 10)) continue;
            const size = ore.radius * 1.35;
            this.orePos.set(ore.x, -ore.y, 1);
            this.oreEuler.set(ore.angle * 0.7 + ore.phase, ore.phase, -ore.angle);
            this.oreQuat.setFromEuler(this.oreEuler);
            this.oreScale.set(size, size, size);
            this.oreMatrix.compose(this.orePos, this.oreQuat, this.oreScale);
            mesh.setMatrixAt(count, this.oreMatrix);
            const color = (__WEBPACK_IMPORTED_MODULE_3__world_materials__["b" /* default */][ore.material] || __WEBPACK_IMPORTED_MODULE_3__world_materials__["b" /* default */].rock).color.split(',');
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

/* harmony default export */ __webpack_exports__["b"] = (Scene3D);


/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
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

const buildAtlantis = (THREE, station) => {
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
/* harmony export (immutable) */ __webpack_exports__["b"] = buildAtlantis;


// ------------------------------------------------------------ Stargate and DHD

const GATE_TOP = -4;

const buildGate = (THREE, gateRadius, gateInner, symbolSprite, chevronAngles) => {
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
/* harmony export (immutable) */ __webpack_exports__["d"] = buildGate;


const buildDHD = (THREE) => {
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
/* harmony export (immutable) */ __webpack_exports__["c"] = buildDHD;


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
/* harmony export (immutable) */ __webpack_exports__["g"] = makeNoise;


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
const PLANET_DEPTH = 9000;
/* unused harmony export PLANET_DEPTH */


const buildPlanet = (THREE, system, palette) => {
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
/* harmony export (immutable) */ __webpack_exports__["f"] = buildPlanet;


// ------------------------------------------------------------ ore crystals

const ORE_LIMIT = 800;
/* harmony export (immutable) */ __webpack_exports__["a"] = ORE_LIMIT;


const buildOreCrystals = (THREE) => {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    geometry.scale(1, 1, 0.7);
    const material = new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.3, flatShading: true, emissive: 0x111111 });
    const mesh = new THREE.InstancedMesh(geometry, material, ORE_LIMIT);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false;
    return mesh;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = buildOreCrystals;



/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render_sprites__ = __webpack_require__(0);




// Asteroids have two layers:
//  - a soft, dusty outer layer (regolith): easy to carve, kicks up dust, mostly plain rock
//  - a hard inner core: slow to cut, throws sparks, and holds most of the metal
//
// Both layers are outlines of SHAPE_POINTS radii at evenly spaced angles (`shape` for the
// surface, `core` for the core boundary). Weapon hits carve a groove into the surface;
// once the groove cuts through, the asteroid splits in two along that cut line.

const CHIP_AREA_PER_DAMAGE = 14;  // area removed per point of weapon damage (core rate)
const SOFT_AREA_FACTOR = 1.8;     // the dusty outside comes away faster...
const HARD_AREA_FACTOR = 0.5;     // ...the core much slower
const GROOVE_PER_DAMAGE = 1.6;    // px of groove per damage point (scaled by hardness and size)
const SOFT_GROOVE_FACTOR = 1.7;
const HARD_GROOVE_FACTOR = 0.35;
const ORE_AREA = 120;             // area of rock that yields one ore piece
const MIN_RADIUS = 8;             // smaller than this and the asteroid crumbles
const MIN_SPLIT_RADIUS = 14;      // smaller asteroids are ground down instead of splitting
const CUT_THROUGH = 0.18;         // groove depth (outline factor) that counts as cut through
const SPLIT_GRACE = 2.5;          // seconds new halves won't merge again
const MAX_SPLIT_SPEED = 55;       // px/s, halves drift apart gently
const MAX_SCARS = 12;
const SHAPE_POINTS = 32;
const SPRITE_REBUILD_INTERVAL = 0.12;
const LIGHT_REFRESH_ANGLE = 0.45;  // re-bake lighting after the rock turns ~25 degrees
const MAX_MERGE_RADIUS = 170;
/* harmony export (immutable) */ __webpack_exports__["a"] = MAX_MERGE_RADIUS;

const VISUAL_RADIUS = 0.88;
/* harmony export (immutable) */ __webpack_exports__["b"] = VISUAL_RADIUS;
   // average outline radius relative to `radius`

// Light comes from the top-left of the screen for every asteroid.
const LIGHT_X = -0.55;
const LIGHT_Y = -0.65;
const BASE_ROCK = [128, 118, 106];
const STEP = Math.PI * 2 / SHAPE_POINTS;

let nextId = 1;

// Sprite rebuilds are spread out: at most this many per frame (the rest wait a frame or
// two, showing their previous image). The game resets the budget every frame.
const REBUILDS_PER_FRAME = 4;
let rebuildBudget = REBUILDS_PER_FRAME;
const resetRebuildBudget = () => { rebuildBudget = REBUILDS_PER_FRAME; };
/* harmony export (immutable) */ __webpack_exports__["d"] = resetRebuildBudget;


// Lumpy outline from a few layered sine "octaves" (smooth, rock-like, not spiky).
const lumpyShape = (rnd, base, spread, min, max) => {
    const octaves = [[2, 0.09], [3, 0.07], [5, 0.04], [9, 0.025]].map(o => ({ freq: o[0], amp: o[1] * spread, phase: rnd() * Math.PI * 2 }));
    const factors = [];
    for(let i = 0; i < SHAPE_POINTS; i++) {
        const angle = i * STEP;
        let factor = base;
        octaves.forEach(o => { factor += Math.sin(angle * o.freq + o.phase) * o.amp; });
        factor += (rnd() - 0.5) * 0.03;
        factors.push(Math.min(max, Math.max(min, factor)));
    }
    return factors;
};

const normalizeComposition = (composition) => {
    const total = Object.keys(composition).reduce((sum, id) => sum + composition[id], 0) || 1;
    const result = {};
    Object.keys(composition).forEach(id => {
        if(composition[id] / total > 0.001) result[id] = composition[id] / total;
    });
    return result;
};

const parseColor = (color) => color.split(',').map(Number);
const rgb = (c, alpha) => 'rgba(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ',' + (alpha === undefined ? 1 : alpha) + ')';
const shade = (c, f) => c.map(v => v * f);
const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
const wrapAngle = (a) => {
    a %= Math.PI * 2;
    return a < 0 ? a + Math.PI * 2 : a;
};

// Signed area and centroid of a polygon.
const polygonInfo = (pts) => {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const cross = a[0] * b[1] - b[0] * a[1];
        area += cross;
        cx += (a[0] + b[0]) * cross;
        cy += (a[1] + b[1]) * cross;
    }
    area /= 2;
    if(Math.abs(area) < 1e-6) return { area: 0, x: 0, y: 0 };
    return { area: Math.abs(area), x: cx / (6 * area), y: cy / (6 * area) };
};

// Keep the part of a polygon on one side of the line through the origin along (ux, uy).
const clipHalf = (pts, ux, uy, sign) => {
    const side = (p) => sign * (ux * p[1] - uy * p[0]);
    const out = [];
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const sa = side(a);
        const sb = side(b);
        if(sa >= 0) out.push(a);
        if((sa >= 0) !== (sb >= 0)) {
            const t = sa / (sa - sb);
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
    }
    return out;
};

// Distance from the origin to the polygon edge along a ray (furthest crossing).
const rayToPolygon = (pts, dx, dy) => {
    let best = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const ex = b[0] - a[0];
        const ey = b[1] - a[1];
        const denom = dx * ey - dy * ex;
        if(Math.abs(denom) < 1e-9) continue;
        const t = (a[0] * ey - a[1] * ex) / denom;
        const s = (a[0] * dy - a[1] * dx) / denom;
        if(t > 0 && s >= 0 && s <= 1 && t > best) best = t;
    }
    return best;
};

// Resample a polygon (already centred on its centroid) as SHAPE_POINTS radius factors.
const resample = (local, radius, min, max) => {
    const factors = [];
    for(let k = 0; k < SHAPE_POINTS; k++) {
        const d = rayToPolygon(local, Math.cos(k * STEP), Math.sin(k * STEP));
        factors.push(Math.max(min, Math.min(max, d / radius)));
    }
    return factors;
};

class Rock {

    constructor(options) {
        const rnd = options.random || Math.random;
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.setArea(options.radius * options.radius);
        this.composition = normalizeComposition(options.composition || { rock: 1 });
        this.angle = options.angle !== undefined ? options.angle : rnd() * Math.PI * 2;
        this.spin = options.spin !== undefined ? options.spin : (rnd() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.renderScale = 1;
        this.renderAlpha = 1;
        this.merging = null;          // active merge link while two asteroids fuse
        this.scars = [];
        this.shape = options.shape || lumpyShape(rnd, 0.86, 1, 0.62, 1);
        // The core sits well inside the surface, with its own lumpy outline.
        this.core = options.core || lumpyShape(rnd, 0.52, 0.8, 0.36, 0.66).map((f, i) => Math.min(f, this.shape[i] - 0.12));
        this.sprite = null;
        this.spriteDirty = true;
        this.spriteAge = 0;
        this.createSurface(rnd);
        this.updateLook(rnd);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    get maxFactor() {
        let max = 0;
        for(let i = 0; i < this.shape.length; i++) max = Math.max(max, this.shape[i]);
        return max;
    }

    // Radius used for quick "could these touch?" checks.
    get boundRadius() {
        return this.radius * this.maxFactor;
    }

    // Surface details in unit coordinates (scaled by radius when drawn).
    createSurface(rnd) {
        this.craters = [];
        const craterCount = 4 + Math.floor(rnd() * 6);
        for(let i = 0; i < craterCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = Math.sqrt(rnd()) * 0.62;
            this.craters.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                r: 0.05 + rnd() * rnd() * 0.22,
                squash: 0.7 + rnd() * 0.3,
                tilt: rnd() * Math.PI
            });
        }
        this.grainOffset = rnd();
        // Boulders resting in the dust.
        this.boulders = [];
        const boulderCount = 3 + Math.floor(rnd() * 6);
        for(let i = 0; i < boulderCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = 0.2 + rnd() * 0.65;
            this.boulders.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, r: 0.02 + rnd() * 0.035 });
        }
        // Strata lines across the core.
        this.strata = [];
        const strataAngle = rnd() * Math.PI;
        for(let i = 0; i < 4; i++) {
            this.strata.push({ offset: -0.4 + i * 0.27 + (rnd() - 0.5) * 0.08, bend: (rnd() - 0.5) * 0.2, angle: strataAngle });
        }
        this.cracks = [];
        const crackCount = 1 + Math.floor(rnd() * 3);
        for(let i = 0; i < crackCount; i++) {
            const points = [];
            let x = (rnd() - 0.5) * 0.3;
            let y = (rnd() - 0.5) * 0.3;
            const heading = rnd() * Math.PI * 2;
            points.push([x, y]);
            for(let s = 0; s < 4; s++) {
                const angle = heading + (rnd() - 0.5) * 1.2;
                x += Math.cos(angle) * 0.13;
                y += Math.sin(angle) * 0.13;
                points.push([x, y]);
            }
            this.cracks.push(points);
        }
        // Loose dust drifting just off the surface.
        this.motes = [];
        for(let i = 0; i < 14; i++) {
            this.motes.push({ angle: rnd() * Math.PI * 2, out: 1.02 + rnd() * 0.1, s: 0.6 + rnd() * 1.2 });
        }
    }

    // Colours and metal crystals from the composition.
    updateLook(random) {
        const rnd = random || Math.random;
        this.material = Object(__WEBPACK_IMPORTED_MODULE_0__world_materials__["c" /* dominantMaterial */])(this.composition);

        let tinted = BASE_ROCK.slice();
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const tint = parseColor(__WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color);
            const share = this.composition[id] * 0.25;
            tinted = tinted.map((v, i) => v * (1 - share) + tint[i] * 0.6 * share);
        });
        // Dusty regolith is paler and warmer; the core is darker and denser.
        this.dustColor = mix(tinted, [175, 160, 140], 0.25);
        this.coreColor = mix(shade(tinted, 0.6), [70, 75, 85], 0.3);
        this.baseColor = tinted;

        this.crystals = [];
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const clusters = Math.round(2 + this.composition[id] * 7);
            for(let c = 0; c < clusters; c++) {
                // Metal concentrates in the core.
                const angle = rnd() * Math.PI * 2;
                const inCore = rnd() < 0.75;
                const distance = inCore ? Math.sqrt(rnd()) * 0.42 : 0.45 + rnd() * 0.4;
                const cx = Math.cos(angle) * distance;
                const cy = Math.sin(angle) * distance;
                const shards = 2 + Math.floor(rnd() * 4);
                for(let s = 0; s < shards; s++) {
                    this.crystals.push({
                        x: cx + (rnd() - 0.5) * 0.12,
                        y: cy + (rnd() - 0.5) * 0.12,
                        size: 0.03 + rnd() * 0.05,
                        angle: rnd() * Math.PI,
                        color: parseColor(__WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color)
                    });
                }
            }
        });
        this.spriteDirty = true;
    }

    // ------------------------------------------------------------ outline geometry

    factorAt(factors, localAngle) {
        const a = wrapAngle(localAngle) / STEP;
        const i = Math.floor(a) % SHAPE_POINTS;
        const j = (i + 1) % SHAPE_POINTS;
        const t = a - Math.floor(a);
        return factors[i] * (1 - t) + factors[j] * t;
    }

    // Outline radius (world px) in the asteroid's local direction `localAngle`.
    outlineAt(localAngle) {
        return this.factorAt(this.shape, localAngle) * this.radius;
    }

    // Is the surface in this direction already cut down to the hard core?
    isCoreExposed(localAngle) {
        return this.factorAt(this.shape, localAngle) <= this.factorAt(this.core, localAngle) + 0.02;
    }

    containsPoint(x, y, padding) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distSq = dx * dx + dy * dy;
        const bound = this.boundRadius + (padding || 0);
        if(distSq > bound * bound) return false;
        const r = this.outlineAt(Math.atan2(dy, dx) - this.angle) + (padding || 0);
        return distSq <= r * r;
    }

    // Outline as world-space points.
    worldOutline() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return this.shape.map((f, i) => {
            const lx = Math.cos(i * STEP) * f * this.radius;
            const ly = Math.sin(i * STEP) * f * this.radius;
            return [this.x + lx * cos - ly * sin, this.y + lx * sin + ly * cos];
        });
    }

    // Distance along a ray to where it first meets the visible outline, or null.
    raycast(ox, oy, dirX, dirY, maxDistance) {
        const mx = this.x - ox;
        const my = this.y - oy;
        const along = mx * dirX + my * dirY;
        const bound = this.boundRadius;
        if(along < -bound || along - bound > maxDistance) return null;
        const closestSq = mx * mx + my * my - along * along;
        if(closestSq > bound * bound) return null;

        if(this.containsPoint(ox, oy)) return 0;
        const pts = this.worldOutline();
        let best = null;
        for(let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const ex = b[0] - a[0];
            const ey = b[1] - a[1];
            const denom = dirX * ey - dirY * ex;
            if(Math.abs(denom) < 1e-9) continue;
            const ax = a[0] - ox;
            const ay = a[1] - oy;
            const t = (ax * ey - ay * ex) / denom;
            const s = (ax * dirY - ay * dirX) / denom;
            if(t >= 0 && s >= 0 && s <= 1 && t <= maxDistance && (best === null || t < best)) best = t;
        }
        return best;
    }

    // Outward surface normal (world space) at the outline in direction `localAngle`.
    normalAt(localAngle) {
        const d = 0.05;
        const r1 = this.outlineAt(localAngle - d);
        const r2 = this.outlineAt(localAngle + d);
        const p1x = Math.cos(localAngle - d) * r1;
        const p1y = Math.sin(localAngle - d) * r1;
        const p2x = Math.cos(localAngle + d) * r2;
        const p2y = Math.sin(localAngle + d) * r2;
        let nx = p2y - p1y;
        let ny = -(p2x - p1x);
        const length = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= length;
        ny /= length;
        // Make sure it points outwards.
        if(nx * Math.cos(localAngle) + ny * Math.sin(localAngle) < 0) {
            nx = -nx;
            ny = -ny;
        }
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return { x: nx * cos - ny * sin, y: nx * sin + ny * cos };
    }

    // ------------------------------------------------------------ damage

    // Weapon hit at a world point. Returns
    // { ore: [...materialIds], pieces: [a, b] | null, crumbled, hard }.
    chip(damage, hitX, hitY) {
        const result = { ore: [], pieces: null, crumbled: false, hard: false };
        if(this.dead) return result;

        const localAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        const hard = this.isCoreExposed(localAngle);
        result.hard = hard;

        // The dusty outside comes off easily (mostly plain rock); the core resists but
        // is where the metal is.
        const removed = Math.min(this.area, damage * CHIP_AREA_PER_DAMAGE * (hard ? HARD_AREA_FACTOR : SOFT_AREA_FACTOR));
        this.setArea(this.area - removed);
        this.oreProgress += removed;
        this.flash = 0.05;

        const groove = damage * GROOVE_PER_DAMAGE / this.radius;
        this.carve(localAngle, groove * SOFT_GROOVE_FACTOR, groove * HARD_GROOVE_FACTOR);
        this.addScar(localAngle, damage, hard);

        while(this.oreProgress >= ORE_AREA) {
            this.oreProgress -= ORE_AREA;
            result.ore.push(this.pickMaterial(hard ? 1.8 : 0.35));
        }

        if(this.radius < MIN_RADIUS) {
            this.dead = true;
            result.crumbled = true;
            result.ore.push(this.pickMaterial(1.5));
            return result;
        }

        // Cut through? Split into two along the deepest groove.
        let deepest = 0;
        for(let i = 1; i < SHAPE_POINTS; i++) if(this.shape[i] < this.shape[deepest]) deepest = i;
        if(this.shape[deepest] <= CUT_THROUGH) {
            if(this.radius >= MIN_SPLIT_RADIUS) result.pieces = this.splitAlong(deepest * STEP);
            if(!result.pieces) {
                // Too small to split cleanly: it falls apart.
                this.dead = true;
                result.crumbled = true;
                const left = Math.max(1, Math.round(this.area / ORE_AREA));
                for(let i = 0; i < left; i++) result.ore.push(this.pickMaterial(1.5));
            }
        }
        return result;
    }

    // Narrow groove: the hit point goes deepest, immediate neighbours a little.
    // Soft regolith carves at `softDepth`; once the core is reached it slows to `hardDepth`.
    carve(localAngle, softDepth, hardDepth) {
        const a = wrapAngle(localAngle) / STEP;
        const i = Math.round(a) % SHAPE_POINTS;
        const offset = a - Math.round(a);
        [[0, 1], [-1, 0.45 - offset * 0.3], [1, 0.45 + offset * 0.3], [-2, 0.12], [2, 0.12]].forEach(pair => {
            const k = (i + pair[0] + SHAPE_POINTS) % SHAPE_POINTS;
            const weight = Math.max(0, pair[1]);
            let soft = softDepth * weight;
            const regolith = Math.max(0, this.shape[k] - this.core[k]);
            const taken = Math.min(regolith, soft);
            soft -= taken;
            const hardCut = soft * (hardDepth / softDepth);
            this.shape[k] = Math.max(0.05, this.shape[k] - taken - hardCut);
            if(this.core[k] > this.shape[k]) this.core[k] = this.shape[k];
        });
        this.spriteDirty = true;
    }

    addScar(localAngle, damage, hard) {
        const last = this.scars[this.scars.length - 1];
        if(last && Math.abs(last.angle - localAngle) < 0.25 && last.hard === hard) {
            last.size = Math.min(0.3, last.size + 0.01 * damage);
            return;
        }
        this.scars.push({ angle: localAngle, size: 0.06 + 0.015 * damage, hard: hard });
        if(this.scars.length > MAX_SCARS) this.scars.shift();
    }

    // Random material weighted by composition; `metalBias` > 1 favours metals (core).
    pickMaterial(metalBias) {
        const bias = metalBias || 1;
        const keys = Object.keys(this.composition);
        const weights = keys.map(id => this.composition[id] * (id === 'rock' ? 1 : bias));
        const total = weights.reduce((a, b) => a + b, 0) || 1;
        let roll = Math.random() * total;
        for(let i = 0; i < keys.length; i++) {
            roll -= weights[i];
            if(roll <= 0) return keys[i];
        }
        return keys[keys.length - 1];
    }

    // Splits the surface (and core) into two halves along the line from the cut (at
    // `localAngle`) through the centre. Each half becomes its own asteroid with a correctly
    // clipped outline; they drift apart sideways (perpendicular to the cut).
    splitAlong(localAngle) {
        const toPoints = (factors) => factors.map((f, i) => [Math.cos(i * STEP) * f * this.radius, Math.sin(i * STEP) * f * this.radius]);
        const pts = toPoints(this.shape);
        const corePts = toPoints(this.core);
        const ux = Math.cos(localAngle);
        const uy = Math.sin(localAngle);
        const halves = [1, -1]
            .map(sign => {
                const poly = clipHalf(pts, ux, uy, sign);
                return { poly: poly, core: clipHalf(corePts, ux, uy, sign), info: polygonInfo(poly), sign: sign };
            })
            .filter(h => h.poly.length >= 3 && h.info.area > 4);
        if(halves.length < 2) return null;

        const total = halves[0].info.area + halves[1].info.area;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const centroidGap = Math.sqrt(Math.pow(halves[0].info.x - halves[1].info.x, 2) + Math.pow(halves[0].info.y - halves[1].info.y, 2)) || 1;
        // Just over escape velocity so mutual gravity doesn't immediately pull them back.
        const relative = Math.min(MAX_SPLIT_SPEED * 2, 1.15 * Math.sqrt(2 * __WEBPACK_IMPORTED_MODULE_1__physics_physics__["a" /* G */] * this.area / centroidGap));

        const pieces = halves.map(h => {
            const share = h.info.area / total;
            const radius = Math.sqrt(this.area * share);

            // Resample the clipped half (and its share of the core) around its own centroid.
            const shape = resample(h.poly.map(p => [p[0] - h.info.x, p[1] - h.info.y]), radius, 0.05, 1.6);
            const coreLocal = h.core.length >= 3 ? h.core.map(p => [p[0] - h.info.x, p[1] - h.info.y]) : null;
            const core = (coreLocal ? resample(coreLocal, radius, 0, 1.6) : shape.map(() => 0))
                .map((f, i) => Math.min(f || shape[i] * 0.4, shape[i]));

            // Sideways separation: each half moves away from the cut line.
            const nx = -uy * h.sign;
            const ny = ux * h.sign;
            const speed = relative * (1 - share);
            const worldNx = nx * cos - ny * sin;
            const worldNy = nx * sin + ny * cos;

            const piece = new Rock({
                x: this.x + h.info.x * cos - h.info.y * sin,
                y: this.y + h.info.x * sin + h.info.y * cos,
                vx: this.vx + worldNx * speed,
                vy: this.vy + worldNy * speed,
                radius: radius,
                composition: Object.assign({}, this.composition),
                shape: shape,
                core: core,
                angle: this.angle,
                spin: this.spin * (0.8 + Math.random() * 0.4),
                grace: SPLIT_GRACE
            });
            piece.oreProgress = this.oreProgress * share;
            return piece;
        });

        this.dead = true;
        return pieces;
    }

    // Completes a merge after `guest` has fully sunk in: blend composition by the
    // original masses and reshape the outline so the result reads as one lumpy body.
    finishMerge(guest, hostArea, guestArea, contactWorldAngle) {
        const total = hostArea + guestArea;
        const wa = hostArea / total;
        const wb = guestArea / total;

        const composition = {};
        [[this, wa], [guest, wb]].forEach(pair => {
            Object.keys(pair[0].composition).forEach(id => {
                composition[id] = (composition[id] || 0) + pair[0].composition[id] * pair[1];
            });
        });
        this.composition = normalizeComposition(composition);
        this.oreProgress += guest.oreProgress;
        this.spin = this.spin * wa + guest.spin * wb;

        // Bulge where the guest joined, with a flattened seam either side; the core grows too.
        const contact = contactWorldAngle - this.angle;
        const bulge = Math.min(0.35, Math.sqrt(wb) * 0.45);
        this.shape = this.shape.map((f, i) => {
            let diff = Math.abs(i * STEP - wrapAngle(contact));
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < 0.9) {
                const w = Math.cos(diff / 0.9 * Math.PI / 2);
                return Math.min(1.08, Math.max(f, 0.6) + bulge * w * w);
            }
            if(diff < 1.4) return Math.max(0.6, f - bulge * 0.25);
            return f;
        });
        this.core = this.core.map((f, i) => Math.min(this.shape[i] - 0.1, Math.max(f, 0.45) + bulge * 0.3));

        guest.craters.slice(0, 3).forEach(c => {
            this.craters.push({
                x: Math.cos(contact) * 0.55 + c.x * Math.sqrt(wb) * 0.6,
                y: Math.sin(contact) * 0.55 + c.y * Math.sqrt(wb) * 0.6,
                r: c.r * Math.sqrt(wb), squash: c.squash, tilt: c.tilt
            });
        });
        this.cracks.push([[Math.cos(contact + 0.6) * 0.5, Math.sin(contact + 0.6) * 0.5],
            [Math.cos(contact) * 0.45, Math.sin(contact) * 0.45],
            [Math.cos(contact - 0.6) * 0.5, Math.sin(contact - 0.6) * 0.5]]);
        if(this.craters.length > 16) this.craters.splice(0, this.craters.length - 16);
        if(this.cracks.length > 6) this.cracks.shift();
        this.updateLook();
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
        this.spriteAge += dt;
    }

    // ------------------------------------------------------------ rendering

    path(ctx, factors, r) {
        ctx.beginPath();
        for(let i = 0; i < SHAPE_POINTS; i++) {
            const x = Math.cos(i * STEP) * r * factors[i];
            const y = Math.sin(i * STEP) * r * factors[i];
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    outline(ctx, r) {
        this.path(ctx, this.shape, r);
    }

    // Everything is rendered once into a sprite (rebuilt only when damaged, reshaped or
    // after turning ~15 degrees so the baked lighting stays correct).
    buildSprite() {
        const r = this.radius;
        const extent = r * Math.max(1, this.maxFactor) * 1.1 + 2;
        const dust = this.dustColor;
        const core = this.coreColor;

        // Light direction in the rock's local frame.
        const cosA = Math.cos(-this.angle);
        const sinA = Math.sin(-this.angle);
        const lx = LIGHT_X * cosA - LIGHT_Y * sinA;
        const ly = LIGHT_X * sinA + LIGHT_Y * cosA;

        this.sprite = Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["a" /* createSprite */])(extent * 2, extent * 2, ctx => {
            ctx.translate(extent, extent);

            // Loose dust hanging just off the surface.
            ctx.fillStyle = rgb(dust, 0.18);
            this.motes.forEach(m => {
                const d = this.outlineAt(m.angle) * m.out;
                ctx.beginPath();
                ctx.arc(Math.cos(m.angle) * d, Math.sin(m.angle) * d, m.s, 0, Math.PI * 2);
                ctx.fill();
            });
            this.path(ctx, this.shape.map(f => f * 1.035), r);
            ctx.fillStyle = rgb(dust, 0.12);
            ctx.fill();

            // Dusty regolith body.
            this.outline(ctx, r);
            ctx.fillStyle = rgb(dust);
            ctx.fill();
            ctx.save();
            ctx.clip();

            // Dense core showing through the thinner dust towards the centre.
            this.path(ctx, this.core, r);
            ctx.fillStyle = rgb(core, 0.75);
            ctx.fill();
            ctx.lineWidth = Math.max(1, r * 0.08);
            ctx.strokeStyle = rgb(mix(core, dust, 0.5), 0.55);
            ctx.stroke();
            ctx.save();
            this.path(ctx, this.core, r);
            ctx.clip();
            ctx.strokeStyle = rgb(shade(core, 0.7), 0.6);
            ctx.lineWidth = Math.max(0.6, r * 0.015);
            this.strata.forEach(s => {
                ctx.save();
                ctx.rotate(s.angle);
                ctx.beginPath();
                ctx.moveTo(-r, s.offset * r);
                ctx.quadraticCurveTo(0, (s.offset + s.bend) * r, r, s.offset * r);
                ctx.stroke();
                ctx.restore();
            });
            ctx.restore();

            // Dust grain: one fill with the shared speck texture, offset per asteroid.
            ctx.save();
            ctx.translate(this.grainOffset * 128, this.grainOffset * 64);
            ctx.fillStyle = ctx.createPattern(Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["e" /* grainTexture */])(), 'repeat');
            ctx.fillRect(-extent - 128, -extent - 128, extent * 2 + 256, extent * 2 + 256);
            ctx.restore();

            // Craters: shadowed bowl on the lit side, bright rim opposite, ejecta ring.
            this.craters.forEach(c => {
                const cx = c.x * r;
                const cy = c.y * r;
                const cr = Math.max(1, c.r * r);
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(c.tilt);
                ctx.scale(1, c.squash);
                ctx.fillStyle = rgb(shade(dust, 0.78), 0.8);
                ctx.beginPath();
                ctx.arc(0, 0, cr, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Shadow crescent towards the light, highlight away from it.
                ctx.fillStyle = 'rgba(20, 15, 10, 0.35)';
                ctx.beginPath();
                ctx.arc(cx + lx * cr * 0.25, cy + ly * cr * 0.25, cr * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = rgb(shade(dust, 1.35), 0.6);
                ctx.lineWidth = Math.max(0.7, cr * 0.18);
                const rimAngle = Math.atan2(-ly, -lx);
                ctx.beginPath();
                ctx.arc(cx, cy, cr, rimAngle - 1.2, rimAngle + 1.2);
                ctx.stroke();
                ctx.fillStyle = rgb(shade(dust, 1.25), 0.25);
                for(let i = 0; i < 6; i++) {
                    const a = i * 1.05 + c.tilt;
                    ctx.fillRect(cx + Math.cos(a) * cr * 1.5, cy + Math.sin(a) * cr * 1.5, 1.2, 1.2);
                }
            });

            // Boulders with a lit side and a cast shadow.
            this.boulders.forEach(b => {
                const bx = b.x * r;
                const by = b.y * r;
                const br = Math.max(0.8, b.r * r);
                ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
                ctx.beginPath();
                ctx.arc(bx - lx * br * 0.8, by - ly * br * 0.8, br, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = rgb(shade(dust, 1.15));
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fill();
            });

            // Cracks.
            ctx.strokeStyle = rgb(shade(core, 0.5), 0.7);
            ctx.lineWidth = Math.max(0.7, r * 0.022);
            ctx.lineJoin = 'round';
            this.cracks.forEach(points => {
                ctx.beginPath();
                points.forEach((p, i) => {
                    if(i === 0) ctx.moveTo(p[0] * r, p[1] * r);
                    else ctx.lineTo(p[0] * r, p[1] * r);
                });
                ctx.stroke();
            });

            // Metal crystals.
            this.crystals.forEach(c => {
                const s = Math.max(1, c.size * r);
                ctx.save();
                ctx.translate(c.x * r, c.y * r);
                ctx.rotate(c.angle);
                ctx.fillStyle = rgb(shade(c.color, 0.5));
                ctx.beginPath();
                ctx.moveTo(s, 0); ctx.lineTo(0, s * 0.6); ctx.lineTo(-s, 0); ctx.lineTo(0, -s * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = rgb(c.color, 0.95);
                ctx.beginPath();
                ctx.moveTo(s * 0.8, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // Freshly exposed material where it was hit: pale dust, or dark core.
            this.scars.forEach(scar => {
                const d = this.outlineAt(scar.angle) * 0.88;
                ctx.fillStyle = scar.hard ? rgb(shade(core, 1.3), 0.6) : rgb(shade(dust, 1.35), 0.45);
                ctx.beginPath();
                ctx.arc(Math.cos(scar.angle) * d, Math.sin(scar.angle) * d, scar.size * r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Lighting, baked for the current orientation (light is fixed on screen).
            const light = ctx.createLinearGradient(lx * r, ly * r, -lx * r, -ly * r);
            light.addColorStop(0, 'rgba(255, 245, 230, 0.26)');
            light.addColorStop(0.42, 'rgba(0, 0, 0, 0)');
            light.addColorStop(1, 'rgba(0, 0, 0, 0.66)');
            ctx.fillStyle = light;
            ctx.fillRect(-extent, -extent, extent * 2, extent * 2);
            ctx.restore();

            // Where grooves have cut down to the core, the rim shows dark, hard rock.
            ctx.lineWidth = Math.max(1.5, r * 0.05);
            ctx.strokeStyle = rgb(shade(core, 0.9));
            ctx.beginPath();
            for(let i = 0; i < SHAPE_POINTS; i++) {
                const j = (i + 1) % SHAPE_POINTS;
                if(this.shape[i] > this.core[i] + 0.02 || this.shape[j] > this.core[j] + 0.02) continue;
                ctx.moveTo(Math.cos(i * STEP) * r * this.shape[i], Math.sin(i * STEP) * r * this.shape[i]);
                ctx.lineTo(Math.cos(j * STEP) * r * this.shape[j], Math.sin(j * STEP) * r * this.shape[j]);
            }
            ctx.stroke();

            // Rim light on the lit edge, soft dark edge elsewhere.
            this.outline(ctx, r);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(10, 8, 6, 0.5)';
            ctx.stroke();
            const rim = ctx.createLinearGradient(lx * r, ly * r, 0, 0);
            rim.addColorStop(0, 'rgba(255, 240, 215, 0.55)');
            rim.addColorStop(1, 'rgba(255, 240, 215, 0)');
            ctx.strokeStyle = rim;
            ctx.lineWidth = Math.max(1, r * 0.03);
            ctx.stroke();
        }, Math.min(1.5, Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["h" /* spriteResolution */])()), this.sprite);
        this.spriteAngle = this.angle;
        this.spriteVersion = (this.spriteVersion || 0) + 1;   // tells the 3D view to refresh
        this.spriteExtent = extent;
        this.spriteRadius = r;
        this.spriteDirty = false;
        this.spriteAge = 0;
    }

    releaseSprite() {
        this.sprite = null;
    }

    // Make sure the painted surface is up to date (rebuilt within the per-frame budget).
    // In the 3D view this paints the asteroid's texture; lighting comes from the 3D scene,
    // so it doesn't need re-baking as the rock turns.
    ensureSprite(lit3d) {
        let turned = Math.abs(this.angle - (this.spriteAngle || 0)) % (Math.PI * 2);
        if(turned > Math.PI) turned = Math.PI * 2 - turned;
        const stale = (this.spriteDirty && this.spriteAge > SPRITE_REBUILD_INTERVAL) ||
            (!lit3d && turned > LIGHT_REFRESH_ANGLE) || Math.abs(this.radius - (this.spriteRadius || 0)) > (this.spriteRadius || 0) * 0.05;
        if(!this.sprite || (stale && rebuildBudget > 0)) {
            rebuildBudget--;
            this.buildSprite();
        }
    }

    draw(ctx) {
        const r = this.radius * this.renderScale;
        if(r < 0.5) return;
        this.ensureSprite(false);

        // One image stamp per frame: surface, lighting and outline are all in the sprite.
        const scale = r / this.spriteRadius;
        const extent = this.spriteExtent * scale;
        ctx.save();
        ctx.globalAlpha = this.renderAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.sprite.canvas, -extent, -extent, extent * 2, extent * 2);
        if(this.flash > 0) {
            // Hit flash: brighten by stamping the sprite again additively.
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.3;
            ctx.drawImage(this.sprite.canvas, -extent, -extent, extent * 2, extent * 2);
        }
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["c"] = (Rock);


/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);
// Home base at the centre of the map: an Atlantis-style six-armed city-ship.
// Fly inside the docking ring and press B to dock with the shipyard.
//
// Performance: the city's line art (hundreds of glowing strokes) and the shield dome
// gradient are rendered once into sprites; each frame just stamps them.



const STATION = {
    x: 0,
    y: 0,
    dockRadius: 420,
    maxDockSpeed: 140,
    shieldRadius: 380,     // city shield: blocks asteroids, lets ships, shots and ore through
    impacts: []            // { angle, life, strength } ripples on the city shield
};
/* harmony export (immutable) */ __webpack_exports__["a"] = STATION;


const LINE = 'rgba(200, 225, 255, 0.95)';
const FILL = 'rgba(8, 16, 30, 0.88)';

const poly = (ctx, pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if(fill !== false) ctx.fill();
    ctx.stroke();
};

const line = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

const hexagon = (r, offset) => {
    const pts = [];
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (offset || 0);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
};

// One arm along +x. Main piers are long with a broad, angled end platform;
// the others are shorter with a compact platform.
const drawArm = (ctx, main, index) => {
    const length = main ? 270 : 215;
    const half = main ? 22 : 18;

    // Pier.
    poly(ctx, [[70, -half], [length, -half], [length, half], [70, half]]);
    line(ctx, 80, 0, length - 10, 0);
    line(ctx, 80, -half * 0.5, length - 10, -half * 0.5);
    line(ctx, 80, half * 0.5, length - 10, half * 0.5);
    for(let x = 95; x < length - 10; x += 22) line(ctx, x, -half, x, half);

    // End platform.
    if(main) {
        poly(ctx, [[length, -half], [length + 18, -58], [length + 78, -58], [length + 96, -26],
            [length + 96, 26], [length + 78, 58], [length + 18, 58], [length, half]]);
        poly(ctx, [[length + 26, -40], [length + 70, -40], [length + 80, 0], [length + 70, 40], [length + 26, 40], [length + 16, 0]]);
        // Tower blocks seen from above.
        [[length + 36, -18], [length + 56, 14], [length + 44, 26], [length + 62, -26]].forEach(t => {
            ctx.strokeRect(t[0] - 6, t[1] - 6, 12, 12);
            ctx.strokeRect(t[0] - 3, t[1] - 3, 6, 6);
        });
        // Side jetty.
        poly(ctx, [[length - 70, half], [length - 40, half + 34], [length - 20, half + 34], [length - 36, half]]);
    } else {
        poly(ctx, [[length, -half], [length + 20, -38], [length + 52, -30], [length + 62, 0],
            [length + 52, 30], [length + 20, 38], [length, half]]);
        ctx.strokeRect(length + 16, -12, 24, 24);
        ctx.beginPath();
        ctx.arc(length + 28, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Window lights along the pier.
    ctx.save();
    ctx.fillStyle = 'rgba(255, 230, 160, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 210, 120, 0.9)';
    for(let x = 90; x < length; x += 11) {
        const on = Math.sin(x * 0.37 + index * 1.7) > -0.3;
        if(!on) continue;
        ctx.fillRect(x, -half * 0.75, 2, 2);
        ctx.fillRect(x + 4, half * 0.7, 2, 2);
    }
    ctx.restore();
};

const EXTENT = 460;
const sprites = {};

// City, shield dome and docking ring baked together: one straight image copy per frame.
// Two variants: normal, and with the docking ring lit when the player can dock.
const buildCity = (canDock) => Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["a" /* createSprite */])(EXTENT * 2, EXTENT * 2, ctx => {
    ctx.translate(EXTENT, EXTENT);

    ctx.setLineDash([12, 14]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // City shield styled like the ship shields: soft edge, hexagon lattice, glowing rim.
    const R = STATION.shieldRadius;
    const dome = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
    dome.addColorStop(0, 'rgba(120, 190, 255, 0)');
    dome.addColorStop(0.8, 'rgba(120, 190, 255, 0.04)');
    dome.addColorStop(1, 'rgba(140, 205, 255, 0.2)');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    const size = 16;
    const w = size * Math.sqrt(3);
    const lattice = new Path2D();
    for(let row = -Math.ceil(R / (size * 1.5)); row <= Math.ceil(R / (size * 1.5)); row++) {
        for(let col = -Math.ceil(R / w) - 1; col <= Math.ceil(R / w) + 1; col++) {
            const cx = col * w + (row % 2 ? w / 2 : 0);
            const cy = row * size * 1.5;
            if(cx * cx + cy * cy > (R + size) * (R + size)) continue;
            for(let i = 0; i < 6; i++) {
                const a1 = Math.PI / 6 + i * Math.PI / 3;
                lattice.moveTo(cx + Math.cos(a1) * size, cy + Math.sin(a1) * size);
                lattice.lineTo(cx + Math.cos(a1 + Math.PI / 3) * size, cy + Math.sin(a1 + Math.PI / 3) * size);
            }
        }
    }
    const fade = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R);
    fade.addColorStop(0, 'rgba(140, 205, 255, 0.02)');
    fade.addColorStop(1, 'rgba(140, 205, 255, 0.22)');
    ctx.strokeStyle = fade;
    ctx.lineWidth = 0.8;
    ctx.stroke(lattice);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(150, 215, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgb(120, 200, 255)';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = LINE;
    ctx.fillStyle = FILL;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(150, 200, 255, 0.7)';

    for(let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 3 - Math.PI / 2);
        ctx.strokeStyle = LINE;
        ctx.fillStyle = FILL;
        drawArm(ctx, i % 2 === 0, i);
        ctx.restore();
    }

    poly(ctx, hexagon(92, Math.PI / 6));
    poly(ctx, hexagon(70, 0));
    poly(ctx, hexagon(48, Math.PI / 6));
    const star = hexagon(40, 0);
    [[0, 2], [2, 4], [4, 0], [1, 3], [3, 5], [5, 1]].forEach(pair => {
        line(ctx, star[pair[0]][0], star[pair[0]][1], star[pair[1]][0], star[pair[1]][1]);
    });
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        line(ctx, Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a) * 92, Math.sin(a) * 92);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
}, Math.min(2, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["h" /* spriteResolution */])()));

// `effectsOnly`: the 3D view draws the city and its shield dome; only the docking ring,
// shield impacts, lights and label are drawn here.
const drawStation = (ctx, time, canDock, effectsOnly) => {
    const key = canDock ? 'dock' : 'idle';
    const R = STATION.shieldRadius;

    ctx.save();
    ctx.translate(STATION.x, STATION.y);
    if(effectsOnly) {
        ctx.setLineDash([12, 14]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        if(!sprites[key]) sprites[key] = buildCity(canDock);
        ctx.drawImage(sprites[key].canvas, -EXTENT, -EXTENT, EXTENT * 2, EXTENT * 2);
    }

    // Impact ripples and flares, like the ship shields (only while something has just hit).
    if(STATION.impacts.length) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R + 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        STATION.impacts.forEach(impact => {
            const ix = Math.cos(impact.angle) * R;
            const iy = Math.sin(impact.angle) * R;
            const age = 1 - impact.life;
            const size = (50 + 90 * impact.strength) * impact.life;
            ctx.globalAlpha = Math.min(1, impact.life * impact.strength + 0.2);
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('140,200,255'), ix, iy, size, size);
            ctx.globalAlpha = 0.7 * impact.life;
            ctx.strokeStyle = 'rgb(150, 215, 255)';
            ctx.lineWidth = 2.5 * impact.life + 0.5;
            ctx.beginPath();
            ctx.arc(ix, iy, 6 + age * R * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.9 * impact.life;
            ctx.lineWidth = 3 * impact.life;
            ctx.beginPath();
            ctx.arc(0, 0, R, impact.angle - 0.2 * impact.strength, impact.angle + 0.2 * impact.strength);
            ctx.stroke();
        });
        ctx.restore();
    }

    // Gate room glow.
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    ctx.globalAlpha = 0.8 * pulse;
    Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('80,150,255'), 0, 0, 40, 40);

    // Beacons on the main pier tips.
    const blink = Math.sin(time * 4) > 0;
    if(blink) {
        ctx.globalAlpha = 1;
        const color = canDock ? '140,255,160' : '255,120,100';
        for(let i = 0; i < 6; i += 2) {
            const angle = i * Math.PI / 3 - Math.PI / 2;
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])(color), Math.cos(angle) * 372, Math.sin(angle) * 372, 22, 22);
        }
    }
    ctx.restore();

    ctx.save();
    ctx.font = '16px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
    ctx.fillText('ATLANTIS · SHIPYARD', STATION.x, STATION.y - STATION.dockRadius - 14);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["b"] = drawStation;



/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_systems__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__render_glyphs__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__audio_audio__ = __webpack_require__(3);
// DHD (dial-home device) panel: enter six constellation symbols and this gate's point of
// origin, then press the dome to dial.





const SIZE = 520;
const OUTER = [205, 250];   // inner / outer radius of the outer key ring
const INNER = [140, 200];
const DOME = 75;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

// Key layout in glyph-chart order: glyphs 2-20 on the outer ring, 21-39 and the point of
// origin on the inner ring.
const KEYS = [];
for(let i = 0; i < 19; i++) KEYS.push({ glyph: __WEBPACK_IMPORTED_MODULE_1__render_glyphs__["b" /* GLYPH_ORDER */][i], ring: OUTER, slot: i, count: 19 });
for(let i = 0; i < 20; i++) KEYS.push({ glyph: i < 19 ? __WEBPACK_IMPORTED_MODULE_1__render_glyphs__["b" /* GLYPH_ORDER */][19 + i] : 'origin', ring: INNER, slot: i, count: 20 });

class DHD {

    constructor() {
        this.isOpen = false;
        this.entered = [];
        this.hover = -1;
        this.build();
    }

    build() {
        const root = el('div', 'dhd-overlay');
        const panel = el('div', 'dhd-panel');
        const header = el('div', 'dhd-header');
        this.title = el('div', 'dhd-title', 'Dial-home device');
        header.appendChild(this.title);
        const close = el('button', 'sy-button small', 'Close (Esc)');
        close.addEventListener('click', () => this.close());
        header.appendChild(close);
        panel.appendChild(header);

        this.addressBar = el('canvas', 'dhd-address');
        panel.appendChild(this.addressBar);

        this.canvas = el('canvas', 'dhd-canvas');
        panel.appendChild(this.canvas);

        this.status = el('div', 'dhd-status');
        panel.appendChild(this.status);

        const actions = el('div', 'dhd-actions');
        const clear = el('button', 'sy-button small', 'Clear');
        clear.addEventListener('click', () => {
            this.entered = [];
            this.say('Address cleared.');
            this.render();
        });
        actions.appendChild(clear);
        actions.appendChild(el('span', 'dhd-hint', 'Enter 6 symbols, then the point of origin, then press the dome. Addresses are on the starmap (M).'));
        panel.appendChild(actions);

        root.appendChild(panel);
        document.body.appendChild(root);
        this.root = root;

        const ratio = window.devicePixelRatio || 1;
        this.canvas.width = SIZE * ratio;
        this.canvas.height = SIZE * ratio;
        this.canvas.style.width = SIZE + 'px';
        this.canvas.style.height = SIZE + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(ratio, ratio);
        this.addressBar.width = 520 * ratio;
        this.addressBar.height = 70 * ratio;
        this.addressBar.style.width = '520px';
        this.addressBar.style.height = '70px';
        this.barCtx = this.addressBar.getContext('2d');
        this.barCtx.scale(ratio, ratio);

        this.canvas.addEventListener('mousemove', (event) => {
            const k = this.keyAt(event);
            if(k !== this.hover) {
                this.hover = k;
                this.render();
            }
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.hover = -1;
            this.render();
        });
        this.canvas.addEventListener('click', (event) => this.click(event));
        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.close();
            }
        }, true);
    }

    // options: { originIndex, originName, systemId, onDial(targetSystem, symbols), onClose }
    open(options) {
        this.options = options;
        this.entered = [];
        this.isOpen = true;
        this.root.classList.add('open');
        this.title.textContent = 'Dial-home device · ' + options.systemName;
        this.say(options.busy ? 'The gate is active. Press the dome to shut it down.' : 'Ready.');
        this.render();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        if(this.options && this.options.onClose) this.options.onClose();
    }

    say(text, error) {
        this.status.textContent = text;
        this.status.classList.toggle('error', !!error);
    }

    keyGeometry(key) {
        const step = Math.PI * 2 / key.count;
        const a1 = -Math.PI / 2 + key.slot * step - step / 2 + 0.01;
        const a2 = a1 + step - 0.02;
        return { a1: a1, a2: a2, mid: (a1 + a2) / 2, r1: key.ring[0], r2: key.ring[1] };
    }

    keyAt(event) {
        const rect = this.canvas.getBoundingClientRect();
        // The canvas may be scaled down by CSS on small screens.
        const sx = SIZE / (rect.width || SIZE);
        const sy = SIZE / (rect.height || SIZE);
        const x = (event.clientX - rect.left) * sx - SIZE / 2;
        const y = (event.clientY - rect.top) * sy - SIZE / 2;
        const r = Math.sqrt(x * x + y * y);
        if(r < DOME) return 'dome';
        let a = Math.atan2(y, x);
        for(let i = 0; i < KEYS.length; i++) {
            const g = this.keyGeometry(KEYS[i]);
            if(r < g.r1 || r > g.r2) continue;
            let rel = a - g.a1;
            while(rel < 0) rel += Math.PI * 2;
            while(rel > Math.PI * 2) rel -= Math.PI * 2;
            if(rel <= g.a2 - g.a1) return i;
        }
        return -1;
    }

    glyphOf(key) {
        return key.glyph === 'origin' ? 'origin:' + this.options.originIndex : key.glyph;
    }

    click(event) {
        const k = this.keyAt(event);
        if(k === -1) return;
        if(k === 'dome') {
            this.pressDome();
            return;
        }
        if(this.options.busy) {
            this.say('The gate is active. Press the dome to shut it down first.', true);
            return;
        }
        const glyph = this.glyphOf(KEYS[k]);
        if(this.entered.indexOf(glyph) !== -1) return;
        if(this.entered.length >= 7) {
            this.say('Seven symbols entered. Press the dome to dial.');
            return;
        }
        this.entered.push(glyph);
        __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].dhdPress(k);
        this.say(this.entered.length < 7 ? 'Symbol ' + this.entered.length + ' entered.' : 'Address complete. Press the dome.');
        this.render();
    }

    pressDome() {
        // With the gate dialling or open, the dome shuts it down so a new address can be
        // entered.
        if(this.options.busy) {
            __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].dhdDome();
            if(this.options.onCancel) this.options.onCancel();
            this.options.busy = false;
            this.entered = [];
            this.say('Gate shut down. Enter a new address.');
            this.render();
            return;
        }
        __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].dhdDome();
        const origin = 'origin:' + this.options.originIndex;
        const symbols = this.entered.slice(0, 6);
        const fail = (message) => {
            setTimeout(() => __WEBPACK_IMPORTED_MODULE_2__audio_audio__["a" /* default */].dialFail(), 250);
            this.say(message, true);
            this.entered = [];
            this.render();
        };
        if(this.entered.length < 7) return fail('Incomplete address: enter six symbols and the point of origin.');
        if(this.entered[6] !== origin || symbols.some(g => typeof g === 'string')) return fail('The seventh symbol must be this gate\'s point of origin.');
        const target = Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["h" /* systemForAddress */])(symbols);
        if(!target) return fail('Dialling failed: no Stargate at that address.');
        if(target.id === this.options.systemId) return fail('You cannot dial the gate you are standing at.');
        this.options.onDial(target, this.entered.slice());
        this.close();
    }

    render() {
        const ctx = this.ctx;
        const c = SIZE / 2;
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.save();
        ctx.translate(c, c);

        // Pedestal: weathered stone-grey metal with a raised rim between the rings.
        const base = ctx.createRadialGradient(-60, -80, 20, 0, 0, 262);
        base.addColorStop(0, 'rgb(96, 92, 86)');
        base.addColorStop(0.7, 'rgb(62, 59, 55)');
        base.addColorStop(1, 'rgb(34, 32, 30)');
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.arc(0, 0, 258, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 18, 16, 0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
        [OUTER[0] - 2.5, INNER[0] - 2.5, DOME + 9].forEach(r => {
            ctx.strokeStyle = 'rgba(150, 142, 130, 0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        });
        // Collar around the dome.
        const collar = ctx.createRadialGradient(0, 0, DOME, 0, 0, DOME + 16);
        collar.addColorStop(0, 'rgb(30, 28, 26)');
        collar.addColorStop(1, 'rgb(80, 76, 70)');
        ctx.fillStyle = collar;
        ctx.beginPath();
        ctx.arc(0, 0, DOME + 14, 0, Math.PI * 2);
        ctx.fill();

        KEYS.forEach((key, i) => {
            const g = this.keyGeometry(key);
            const glyph = this.glyphOf(key);
            const lit = this.entered.indexOf(glyph) !== -1;
            const hovered = this.hover === i;
            const r = (g.r1 + g.r2) / 2;
            const kx = Math.cos(g.mid) * r;
            const ky = Math.sin(g.mid) * r;
            ctx.beginPath();
            ctx.arc(0, 0, g.r2, g.a1, g.a2);
            ctx.arc(0, 0, g.r1, g.a2, g.a1, true);
            ctx.closePath();
            // Each key is a slightly domed tile lit from the top-left.
            const tile = ctx.createRadialGradient(kx - 10, ky - 12, 2, kx, ky, 40);
            if(lit) {
                tile.addColorStop(0, 'rgb(255, 214, 150)');
                tile.addColorStop(0.5, 'rgb(240, 130, 40)');
                tile.addColorStop(1, 'rgb(150, 60, 15)');
            } else {
                tile.addColorStop(0, hovered ? 'rgb(176, 168, 152)' : 'rgb(150, 143, 130)');
                tile.addColorStop(1, hovered ? 'rgb(110, 104, 94)' : 'rgb(88, 83, 76)');
            }
            ctx.fillStyle = tile;
            if(lit) {
                ctx.shadowColor = 'rgba(255, 150, 50, 0.9)';
                ctx.shadowBlur = 14;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgb(28, 25, 22)';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Engraved glyph: dark groove with a light lower edge (or glowing when lit).
            const size = key.ring === OUTER ? 30 : 34;
            if(lit) {
                ctx.shadowColor = 'rgba(255, 240, 200, 0.9)';
                ctx.shadowBlur = 8;
                Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(ctx, glyph, kx, ky, size, 'rgb(255, 250, 230)', 2.6, 'rgba(170, 70, 10, 0.9)');
                ctx.shadowBlur = 0;
            } else {
                Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(ctx, glyph, kx + 0.8, ky + 1, size, 'rgba(210, 200, 180, 0.35)', 3);
                Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(ctx, glyph, kx, ky, size, 'rgb(38, 34, 30)', 2.4);
            }
        });

        // Dome: the big red crystal. It glows once a full address is entered.
        const ready = this.entered.length === 7;
        const dome = ctx.createRadialGradient(-22, -26, 4, 0, 0, DOME);
        dome.addColorStop(0, ready ? 'rgb(255, 210, 170)' : 'rgb(240, 130, 110)');
        dome.addColorStop(0.35, ready ? 'rgb(255, 80, 40)' : 'rgb(200, 40, 30)');
        dome.addColorStop(0.85, ready ? 'rgb(190, 30, 15)' : 'rgb(120, 18, 12)');
        dome.addColorStop(1, 'rgb(60, 8, 6)');
        if(ready) {
            ctx.shadowColor = 'rgba(255, 70, 30, 0.9)';
            ctx.shadowBlur = 30;
        }
        ctx.fillStyle = dome;
        ctx.beginPath();
        ctx.arc(0, 0, DOME, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Facets inside the crystal.
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, DOME - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255, 190, 170, 0.18)';
        ctx.lineWidth = 1.2;
        for(let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
            ctx.lineTo(Math.cos(a) * DOME, Math.sin(a) * DOME);
            ctx.stroke();
        }
        [18, 42].forEach(rr => {
            ctx.beginPath();
            ctx.arc(0, 0, rr, 0, Math.PI * 2);
            ctx.stroke();
        });
        // Specular highlight.
        const shine = ctx.createRadialGradient(-26, -30, 0, -26, -30, 30);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.fillRect(-60, -64, 70, 70);
        ctx.restore();
        if(this.hover === 'dome' || ready) {
            ctx.strokeStyle = 'rgba(255, 200, 150, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, DOME, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // Hovered key name.
        if(typeof this.hover === 'number' && this.hover >= 0) {
            const key = KEYS[this.hover];
            const name = key.glyph === 'origin' ? 'Point of origin · ' + this.options.originName : __WEBPACK_IMPORTED_MODULE_0__world_systems__["a" /* CONSTELLATIONS */][key.glyph];
            ctx.font = '14px Bungee, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(name, c, SIZE - 6);
        }

        // Address bar: seven slots.
        const bar = this.barCtx;
        bar.clearRect(0, 0, 520, 70);
        for(let i = 0; i < 7; i++) {
            const x = 30 + i * 70;
            bar.fillStyle = i < this.entered.length ? 'rgba(240, 140, 50, 0.25)' : 'rgba(255, 255, 255, 0.06)';
            bar.strokeStyle = i === 6 ? 'rgba(255, 120, 90, 0.7)' : 'rgba(200, 210, 230, 0.4)';
            bar.lineWidth = 1.5;
            bar.fillRect(x, 8, 56, 56);
            bar.strokeRect(x, 8, 56, 56);
            if(i < this.entered.length) Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(bar, this.entered[i], x + 28, 36, 38, 'rgb(255, 214, 160)', 3, 'rgba(150, 60, 15, 0.9)');
            else {
                bar.font = '10px Bungee, sans-serif';
                bar.textAlign = 'center';
                bar.fillStyle = 'rgba(200, 210, 230, 0.5)';
                bar.fillText(i === 6 ? 'ORIGIN' : String(i + 1), x + 28, 40);
            }
        }
    }
}

let instance = null;
const getDHD = () => {
    if(!instance) instance = new DHD();
    return instance;
};
/* harmony export (immutable) */ __webpack_exports__["a"] = getDHD;

const isDHDOpen = () => !!(instance && instance.isOpen);
/* harmony export (immutable) */ __webpack_exports__["b"] = isDHDOpen;





/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_systems__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__render_glyphs__ = __webpack_require__(13);
// Starmap: a rotatable 3D map of the constellations (gate symbols) and known worlds.
// Selecting a world draws the three lines of its gate address meeting at it, and shows
// the address (plus your current gate's point of origin), the distance and, if your ship
// has a hyperdrive, the travel time and an "Engage hyperdrive" button.




const LINE_COLORS = ['255,140,90', '120,220,255', '190,255,140'];
const PLANET_COLORS = { ocean: '90,150,255', earth: '110,170,255', desert: '235,190,120', jungle: '120,210,140',
    rocky: '230,130,100', industrial: '200,170,230', ice: '170,235,255' };

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

// Hyperspace travel time in seconds for a distance (light years) and drive speed.
const hyperTravelTime = (distance, speed) => Math.max(5, Math.min(45, distance / (90 * speed)));
/* harmony export (immutable) */ __webpack_exports__["b"] = hyperTravelTime;


class Starmap {

    constructor() {
        this.isOpen = false;
        this.yaw = 0.6;
        this.pitch = 0.35;
        this.zoom = 1;
        this.selected = null;
        this.build();
        // Decorative background stars on a far sphere.
        this.stars = [];
        for(let i = 0; i < 500; i++) {
            const y = Math.random() * 2 - 1;
            const r = Math.sqrt(1 - y * y);
            const a = Math.random() * Math.PI * 2;
            this.stars.push([Math.cos(a) * r * 5200, y * 5200, Math.sin(a) * r * 5200, Math.random()]);
        }
    }

    build() {
        const root = el('div', 'starmap-overlay');
        this.canvas = el('canvas', 'starmap-canvas');
        root.appendChild(this.canvas);

        const side = el('div', 'starmap-side');
        side.appendChild(el('div', 'starmap-title', 'Starmap'));
        side.appendChild(el('div', 'starmap-hint', (('ontouchstart' in window) ? 'Drag to rotate, pinch to zoom, tap a world to see its gate address.' : 'Drag to rotate, wheel to zoom, click a world to see its gate address.')));
        this.info = el('div', 'starmap-info');
        side.appendChild(this.info);
        const close = el('button', 'sy-button small', 'Close (M / Esc)');
        close.addEventListener('click', () => this.close());
        side.appendChild(close);
        root.appendChild(side);

        document.body.appendChild(root);
        this.root = root;
        this.ctx = this.canvas.getContext('2d');

        // Pointer events cover mouse and touch: one pointer drags to rotate (a tap picks a
        // world), two pointers pinch to zoom.
        let drag = null;
        const pointers = {};
        let pinch = null;
        const pinchDistance = () => {
            const ids = Object.keys(pointers);
            const a = pointers[ids[0]], b = pointers[ids[1]];
            return Math.hypot(a.x - b.x, a.y - b.y) || 1;
        };
        this.canvas.style.touchAction = 'none';
        this.canvas.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
            if(this.canvas.setPointerCapture) {
                try { this.canvas.setPointerCapture(event.pointerId); } catch(e) { /* ignore */ }
            }
            if(Object.keys(pointers).length === 2) {
                drag = null;
                pinch = { distance: pinchDistance(), zoom: this.zoom };
            } else if(!pinch) {
                drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: this.yaw, pitch: this.pitch, moved: false };
            }
        });
        this.canvas.addEventListener('pointermove', (event) => {
            if(!this.isOpen || !pointers[event.pointerId]) return;
            pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
            if(pinch && Object.keys(pointers).length >= 2) {
                this.zoom = Math.max(0.5, Math.min(3, pinch.zoom * pinchDistance() / pinch.distance));
                return;
            }
            if(!drag || drag.id !== event.pointerId) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if(Math.abs(dx) + Math.abs(dy) > (event.pointerType === 'mouse' ? 4 : 10)) drag.moved = true;
            this.yaw = drag.yaw + dx * 0.008;
            this.pitch = Math.max(-1.4, Math.min(1.4, drag.pitch + dy * 0.008));
        });
        const release = (event) => {
            if(drag && drag.id === event.pointerId && !drag.moved && this.isOpen && event.type === 'pointerup') this.pick(event);
            if(drag && drag.id === event.pointerId) drag = null;
            delete pointers[event.pointerId];
            if(Object.keys(pointers).length === 0) pinch = null;
        };
        this.canvas.addEventListener('pointerup', release);
        this.canvas.addEventListener('pointercancel', release);
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.zoom = Math.max(0.5, Math.min(3, this.zoom * Math.exp(-event.deltaY * 0.0012)));
        }, { passive: false });
        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'KeyJ') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.engage();
                return;
            }
            if(event.code === 'Escape' || event.code === 'KeyM') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.close();
            }
        }, true);
        window.addEventListener('resize', () => { if(this.isOpen) this.resize(); });
    }

    // options: { systemId, originIndex, hyperdrive: { speed } | null, onEngage(system), onClose }
    open(options) {
        this.options = options;
        this.isOpen = true;
        this.root.classList.add('open');
        if(!this.selected || this.selected === options.systemId) this.selected = null;
        this.resize();
        this.renderInfo();
        const loop = () => {
            if(!this.isOpen) return;
            this.render();
            this.frame = requestAnimationFrame(loop);
        };
        loop();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        cancelAnimationFrame(this.frame);
        if(this.options.onClose) this.options.onClose();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = rect.width * ratio;
        this.canvas.height = rect.height * ratio;
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    project(p) {
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        const cp = Math.cos(this.pitch);
        const sp = Math.sin(this.pitch);
        const x1 = p[0] * cy - p[2] * sy;
        const z1 = p[0] * sy + p[2] * cy;
        const y2 = p[1] * cp - z1 * sp;
        const z2 = p[1] * sp + z1 * cp;
        const camera = 9000 / this.zoom;
        const scale = Math.min(this.width, this.height) * 0.9 / (camera + z2) * this.zoom * 0.95;
        return { x: this.width / 2 + x1 * scale, y: this.height / 2 + y2 * scale, depth: z2, scale: scale };
    }

    pick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let best = null;
        const reach = event.pointerType && event.pointerType !== 'mouse' ? 34 : 22;
        let bestDist = reach * reach;
        __WEBPACK_IMPORTED_MODULE_0__world_systems__["b" /* SYSTEMS */].forEach(system => {
            const p = this.project(system.map);
            const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
            if(d < bestDist) {
                bestDist = d;
                best = system.id;
            }
        });
        if(best) {
            this.selected = best;
            this.renderInfo();
        }
    }

    renderInfo() {
        const box = this.info;
        box.innerHTML = '';
        const here = Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["g" /* systemById */])(this.options.systemId);
        box.appendChild(el('div', 'starmap-here', 'You are at ' + here.name + ' (' + here.galaxy + ')'));
        if(!this.selected) {
            box.appendChild(el('p', 'muted', 'Select a world on the map.'));
            return;
        }
        const target = Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["g" /* systemById */])(this.selected);
        box.appendChild(el('div', 'starmap-name', target.name));
        box.appendChild(el('div', 'starmap-galaxy', target.galaxy + ' galaxy'));
        box.appendChild(el('p', '', target.description));
        if(target.id === here.id) {
            box.appendChild(el('p', 'muted', 'This is your current location.'));
            return;
        }

        box.appendChild(el('div', 'starmap-label', 'Gate address (dial at the DHD)'));
        const glyphs = Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["d" /* addressOf */])(target.id).concat(['origin:' + this.options.originIndex]);
        const strip = el('canvas', 'starmap-glyphs');
        const ratio = window.devicePixelRatio || 1;
        strip.width = 7 * 40 * ratio;
        strip.height = 58 * ratio;
        strip.style.width = 7 * 40 + 'px';
        strip.style.height = '58px';
        const sctx = strip.getContext('2d');
        sctx.scale(ratio, ratio);
        glyphs.forEach((g, i) => {
            const color = i < 6 ? 'rgb(' + LINE_COLORS[Math.floor(i / 2)] + ')' : 'rgb(255, 140, 120)';
            sctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            sctx.strokeRect(i * 40 + 2, 2, 36, 36);
            Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(sctx, g, i * 40 + 20, 20, 28, color, 2.6, 'rgba(10, 20, 50, 0.9)');
            sctx.font = '7px sans-serif';
            sctx.textAlign = 'center';
            sctx.fillStyle = 'rgba(220, 230, 255, 0.8)';
            const name = i < 6 ? __WEBPACK_IMPORTED_MODULE_0__world_systems__["a" /* CONSTELLATIONS */][g] : here.origin;
            sctx.fillText(name.length > 10 ? name.slice(0, 9) + '.' : name, i * 40 + 20, 50);
        });
        box.appendChild(strip);
        box.appendChild(el('p', 'muted', 'Symbols 1-2, 3-4 and 5-6 are the three lines meeting at ' + target.name +
            '. The last is the point of origin of the gate you dial from (' + here.origin + ').'));

        const distance = Math.round(Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["f" /* distanceBetween */])(here.id, target.id));
        box.appendChild(el('div', 'starmap-label', 'Distance: ' + distance.toLocaleString('en-US') + ' light years'));
        const drive = this.options.hyperdrive;
        if(drive) {
            const time = hyperTravelTime(distance, drive.speed);
            box.appendChild(el('p', '', 'Hyperspace travel time: ' + time.toFixed(1) + ' s'));
            const engage = el('button', 'sy-button primary', 'Engage hyperdrive (J)');
            engage.addEventListener('click', () => this.engage());
            box.appendChild(engage);
        } else {
            box.appendChild(el('p', 'muted', 'No hyperdrive fitted: use the Stargate. Fly to the DHD and press B.'));
        }
    }

    engage() {
        if(!this.selected || !this.options.hyperdrive || this.selected === this.options.systemId) return;
        const target = Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["g" /* systemById */])(this.selected);
        this.options.onEngage(target);
        this.close();
    }

    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        ctx.fillStyle = 'rgb(3, 6, 14)';
        ctx.fillRect(0, 0, w, h);
        this.yaw += 0.0008;

        // Background stars.
        this.stars.forEach(s => {
            const p = this.project(s);
            if(p.scale <= 0) return;
            ctx.fillStyle = 'rgba(200, 215, 255, ' + (0.15 + s[3] * 0.4) + ')';
            ctx.fillRect(p.x, p.y, 1.2, 1.2);
        });

        const selectedGlyphs = this.selected && this.selected !== this.options.systemId ? Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["d" /* addressOf */])(this.selected) : [];

        // Address lines for the selected world.
        if(selectedGlyphs.length) {
            Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["c" /* addressLines */])(this.selected).forEach((line, i) => {
                const a = this.project(line[0]);
                const b = this.project(line[1]);
                ctx.strokeStyle = 'rgba(' + LINE_COLORS[i] + ', 0.75)';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            });
        }

        // Constellations.
        __WEBPACK_IMPORTED_MODULE_0__world_systems__["a" /* CONSTELLATIONS */].forEach((name, i) => {
            const p = this.project(Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["e" /* constellationPosition */])(i));
            const inAddress = selectedGlyphs.indexOf(i);
            const near = Math.max(0.25, Math.min(1, 0.65 - p.depth / 8000));
            const color = inAddress !== -1 ? 'rgba(' + LINE_COLORS[Math.floor(inAddress / 2)] + ', 1)' : 'rgba(170, 190, 230, ' + near + ')';
            // The constellation's star figure; constellations in the selected address also
            // show their gate glyph beside it.
            const size = (inAddress !== -1 ? 40 : 26) * Math.max(0.7, Math.min(1.4, p.scale * 12));
            Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["c" /* drawConstellation */])(ctx, i, p.x, p.y, size, inAddress !== -1 ? color : 'rgba(150, 175, 230, ' + (near * 0.55) + ')',
                inAddress !== -1 ? '#fff' : 'rgba(225, 235, 255, ' + near + ')');
            if(inAddress !== -1) Object(__WEBPACK_IMPORTED_MODULE_1__render_glyphs__["d" /* drawGlyph */])(ctx, i, p.x + size * 0.75, p.y - size * 0.45, 20, color, 2.4, 'rgba(5, 10, 30, 0.9)');
            ctx.font = (inAddress !== -1 ? '11px' : '9px') + ' sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = color;
            ctx.fillText(name, p.x, p.y + size * 0.5 + (inAddress !== -1 ? 13 : 10));
        });

        // Worlds.
        __WEBPACK_IMPORTED_MODULE_0__world_systems__["b" /* SYSTEMS */].forEach(system => {
            const p = this.project(system.map);
            const color = PLANET_COLORS[system.planet.type];
            const current = system.id === this.options.systemId;
            const selected = system.id === this.selected;
            ctx.fillStyle = 'rgb(' + color + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, selected ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();
            if(current || selected) {
                ctx.strokeStyle = current ? 'rgba(140, 255, 160, 0.9)' : 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.font = '12px Bungee, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgb(' + color + ')';
            ctx.fillText(system.name + (current ? ' (you)' : ''), p.x + 14, p.y + 4);
        });

        // Hyperspace route from here to the selection.
        if(this.selected && this.selected !== this.options.systemId) {
            const a = this.project(Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["g" /* systemById */])(this.options.systemId).map);
            const b = this.project(Object(__WEBPACK_IMPORTED_MODULE_0__world_systems__["g" /* systemById */])(this.selected).map);
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

let instance = null;
const getStarmap = () => {
    if(!instance) instance = new Starmap();
    return instance;
};
/* harmony export (immutable) */ __webpack_exports__["a"] = getStarmap;

const isStarmapOpen = () => !!(instance && instance.isOpen);
/* harmony export (immutable) */ __webpack_exports__["c"] = isStarmapOpen;



/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);
// Visuals for travelling between star systems: the wormhole ride through a Stargate,
// the hyperspace window that opens in front of a ship, and the hyperspace tunnel.



// Streaks for the tunnels, created once.
const STREAKS = [];
for(let i = 0; i < 160; i++) {
    STREAKS.push({ angle: Math.random() * Math.PI * 2, depth: Math.random(), speed: 0.6 + Math.random() * 0.8, width: 0.5 + Math.random() * 2 });
}

// Wormhole: a rushing, twisting tunnel of blue-white bands. `progress` 0..1 over the trip.
const drawWormhole = (ctx, w, h, time, progress) => {
    const cx = w / 2 + Math.sin(time * 1.7) * w * 0.06;
    const cy = h / 2 + Math.cos(time * 1.3) * h * 0.05;
    const max = Math.sqrt(w * w + h * h) * 0.6;

    ctx.fillStyle = 'rgb(4, 10, 30)';
    ctx.fillRect(0, 0, w, h);

    // Banded walls rushing past.
    for(let i = 14; i >= 0; i--) {
        const z = ((i / 14) + time * 1.6) % 1;
        const r = Math.pow(z, 2.2) * max;
        const twist = time * 2 + i * 0.4;
        const g = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
        const hue = i % 3 === 0 ? '170,210,255' : i % 3 === 1 ? '80,130,255' : '140,110,255';
        g.addColorStop(0, 'rgba(' + hue + ', 0)');
        g.addColorStop(1, 'rgba(' + hue + ', ' + (0.12 + 0.1 * z) + ')');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * (0.85 + 0.1 * Math.sin(twist)), twist * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Streaks spiralling outwards.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    STREAKS.forEach(s => {
        const z = (s.depth + time * s.speed * 0.9) % 1;
        const a = s.angle + time * 1.2 + z * 1.5;
        const r1 = Math.pow(z, 2.4) * max;
        const r2 = Math.pow(Math.min(1, z + 0.05), 2.4) * max;
        ctx.strokeStyle = 'rgba(210, 230, 255, ' + (0.15 + 0.7 * z) + ')';
        ctx.lineWidth = s.width * (0.5 + z * 2);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a + 0.08) * r2, cy + Math.sin(a + 0.08) * r2);
        ctx.stroke();
    });
    // Bright light at the end of the tunnel, growing as you arrive.
    const end = 60 + progress * 260;
    Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('190,220,255'), cx, cy, end, end);
    ctx.restore();

    // Flash in and out.
    const flash = Math.max(0, 1 - progress * 6) + Math.max(0, (progress - 0.85) / 0.15);
    if(flash > 0) {
        ctx.fillStyle = 'rgba(230, 240, 255, ' + Math.min(1, flash) + ')';
        ctx.fillRect(0, 0, w, h);
    }
};
/* harmony export (immutable) */ __webpack_exports__["c"] = drawWormhole;


// Hyperspace: a deep blue tunnel with streaming light clouds and star streaks.
const drawHyperspace = (ctx, w, h, time, progress, label) => {
    const cx = w / 2;
    const cy = h / 2;
    const max = Math.sqrt(w * w + h * h) * 0.6;

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, max);
    bg.addColorStop(0, 'rgb(200, 225, 255)');
    bg.addColorStop(0.12, 'rgb(60, 110, 220)');
    bg.addColorStop(0.5, 'rgb(15, 35, 110)');
    bg.addColorStop(1, 'rgb(5, 10, 40)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Light clouds rushing past.
    for(let i = 0; i < 24; i++) {
        const z = ((i / 24) + time * 0.7) % 1;
        const a = i * 2.4 + time * 0.3;
        const r = Math.pow(z, 2) * max;
        const size = 40 + z * 380;
        ctx.globalAlpha = 0.12 + 0.25 * z;
        Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])(i % 2 ? '120,170,255' : '180,210,255'), cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, size * 0.6);
    }
    ctx.globalAlpha = 1;
    // Long star streaks.
    ctx.lineCap = 'round';
    STREAKS.forEach(s => {
        const z = (s.depth + time * s.speed * 1.4) % 1;
        const r1 = Math.pow(z, 2.6) * max;
        const r2 = Math.pow(Math.min(1, z + 0.1), 2.6) * max;
        ctx.strokeStyle = 'rgba(235, 245, 255, ' + (0.1 + 0.8 * z) + ')';
        ctx.lineWidth = s.width * (0.4 + z * 1.6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.angle) * r1, cy + Math.sin(s.angle) * r1);
        ctx.lineTo(cx + Math.cos(s.angle) * r2, cy + Math.sin(s.angle) * r2);
        ctx.stroke();
    });
    ctx.restore();

    // Progress and destination.
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230, 240, 255, 0.9)';
    ctx.fillText(label, cx, h - 80);
    ctx.strokeStyle = 'rgba(230, 240, 255, 0.6)';
    ctx.strokeRect(cx - 150, h - 64, 300, 8);
    ctx.fillStyle = 'rgba(160, 210, 255, 0.9)';
    ctx.fillRect(cx - 149, h - 63, 298 * progress, 6);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["b"] = drawHyperspace;


// Hyperspace window, in world space: a swirling, wispy cloud of pale blue-white light with
// a bright heart (no hard edge). `open` 0..1 is how far it has opened.
const WISPS = [];
for(let i = 0; i < 14; i++) {
    WISPS.push({ angle: Math.random() * Math.PI * 2, dist: 0.15 + Math.random() * 0.55, size: 0.5 + Math.random() * 0.9,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9), phase: Math.random() * 10 });
}

const drawHyperWindow = (ctx, x, y, radius, time, open) => {
    if(open <= 0) return;
    const r = radius * open;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    // Faint outer haze.
    ctx.globalAlpha = Math.min(1, open * 1.2) * 0.35;
    Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('90,150,150'), 0, 0, r * 2.6, r * 2.4);
    // Cloudy, turning wisps.
    WISPS.forEach(wisp => {
        const a = wisp.angle + time * wisp.spin;
        const d = r * wisp.dist * (0.85 + 0.15 * Math.sin(time * 1.7 + wisp.phase));
        const size = r * wisp.size * (0.8 + 0.25 * Math.sin(time * 2.3 + wisp.phase));
        ctx.globalAlpha = Math.min(1, open * 1.5) * (0.14 + 0.1 * Math.sin(time * 3 + wisp.phase));
        Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])(wisp.spin > 0 ? '150,215,215' : '190,235,235'), Math.cos(a) * d, Math.sin(a) * d, size * 1.4, size * 0.8);
    });
    // Bright heart.
    ctx.globalAlpha = Math.min(1, open * 2);
    const flicker = 0.85 + 0.15 * Math.sin(time * 9) * Math.sin(time * 5.3);
    Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('210,245,240'), r * 0.05, -r * 0.04, r * 0.75 * flicker, r * 0.65 * flicker);
    Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('255,255,255'), 0, 0, r * 0.3, r * 0.3);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["a"] = drawHyperWindow;



/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Touch controls for phones and tablets.
//
//  - Left: a virtual joystick. Push towards where you want to go: an autopilot turns the
//    ship to face that way (countering spin, since this is zero-g) and thrusts once lined up.
//  - Right: touch and hold anywhere on the right part of the screen to aim the guns at that
//    point and fire.
//  - Buttons: missiles (hold), stabilizer (tap on/off), a context button (Dock / DHD),
//    auto-target, zoom and pause.
//
// The controls write into the same `input` object the keyboard and mouse use, so the rest
// of the game doesn't need to know where the input came from.

const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
/* harmony export (immutable) */ __webpack_exports__["b"] = isTouchDevice;


const JOYSTICK_RADIUS = 60;
const TURN_DEADZONE = 0.08;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class TouchControls {

    // actions: { interact(), pause(), toggleAuto(), toggleStabilizer(), zoom(factor) }
    constructor(input, canvas, actions) {
        this.input = input;
        this.canvas = canvas;
        this.actions = actions;
        this.stick = null;      // { id, cx, cy, x, y }
        this.aim = null;        // pointer id aiming/firing
        this.build();
        this.bindCanvas();
    }

    build() {
        const root = el('div', 'touch-ui');

        this.base = el('div', 'touch-stick');
        this.knob = el('div', 'touch-knob');
        this.base.appendChild(this.knob);
        root.appendChild(this.base);

        const cluster = el('div', 'touch-buttons');
        const hold = (label, className, key) => {
            const button = el('button', 'touch-button ' + className, label);
            const set = (on) => (event) => {
                event.preventDefault();
                this.input[key] = on;
                button.classList.toggle('pressed', on);
            };
            button.addEventListener('pointerdown', set(true));
            button.addEventListener('pointerup', set(false));
            button.addEventListener('pointercancel', set(false));
            button.addEventListener('pointerleave', set(false));
            return button;
        };
        const tap = (label, className, action) => {
            const button = el('button', 'touch-button ' + className, label);
            button.addEventListener('pointerdown', (event) => {
                event.preventDefault();
                action();
            });
            return button;
        };

        this.interactButton = tap('Dock', 'interact', () => this.actions.interact());
        this.autoButton = tap('Auto', 'auto', () => this.actions.toggleAuto());
        cluster.appendChild(this.interactButton);
        cluster.appendChild(this.autoButton);
        this.modeButton = tap('Targets', 'auto', () => this.actions.cycleTargets());
        cluster.appendChild(this.modeButton);
        this.stabButton = tap('Stabilize', 'brake', () => this.actions.toggleStabilizer());
        cluster.appendChild(this.stabButton);
        cluster.appendChild(hold('Missile', 'missile', 'missileKey'));
        root.appendChild(cluster);

        const corner = el('div', 'touch-corner');
        corner.appendChild(tap('+', 'small', () => this.actions.zoom(1.25)));
        corner.appendChild(tap('-', 'small', () => this.actions.zoom(0.8)));
        corner.appendChild(tap('II', 'small', () => this.actions.pause()));
        root.appendChild(corner);

        this.rotateHint = el('div', 'touch-rotate', 'Turn your phone sideways for the best view');
        root.appendChild(this.rotateHint);

        document.body.appendChild(root);
        this.root = root;
        this.show(false);
    }

    bindCanvas() {
        const target = this.canvas;
        target.style.touchAction = 'none';

        target.addEventListener('pointerdown', (event) => {
            if(event.pointerType === 'mouse' || !this.visible) return;
            event.preventDefault();
            // Taps on the game's own canvas UI (the weapon panel) aren't steering or firing.
            if(this.actions.uiTap && this.actions.uiTap(event.clientX, event.clientY)) return;
            const leftSide = event.clientX < window.innerWidth * 0.45;
            // A second finger on the same side as an active control is a pinch-zoom: let go
            // of that control so pinching doesn't steer or shoot.
            const stickSide = this.stick && this.stick.left === leftSide;
            const aimSide = this.aim !== null && this.aimLeft === leftSide;
            if(stickSide || aimSide) {
                if(stickSide) { this.stick = null; this.placeStick(); }
                if(aimSide) { this.aim = null; this.input.mouseDown = false; }
                return;
            }
            if(leftSide && !this.stick) {
                // Joystick appears where the thumb lands (within the left side).
                this.stick = { left: true, id: event.pointerId, cx: event.clientX, cy: event.clientY, x: event.clientX, y: event.clientY };
                this.placeStick();
            } else if(!this.aim) {
                this.aim = event.pointerId;
                this.aimLeft = leftSide;
                this.input.mouseX = event.clientX;
                this.input.mouseY = event.clientY;
                this.input.mouseDown = true;
            }
        });
        target.addEventListener('pointermove', (event) => {
            if(event.pointerType === 'mouse') return;
            if(this.stick && event.pointerId === this.stick.id) {
                this.stick.x = event.clientX;
                this.stick.y = event.clientY;
                this.placeStick();
            } else if(event.pointerId === this.aim) {
                this.input.mouseX = event.clientX;
                this.input.mouseY = event.clientY;
            }
        });
        const release = (event) => {
            if(this.stick && event.pointerId === this.stick.id) {
                this.stick = null;
                this.placeStick();
            }
            if(event.pointerId === this.aim) {
                this.aim = null;
                this.input.mouseDown = false;
            }
        };
        target.addEventListener('pointerup', release);
        target.addEventListener('pointercancel', release);
    }

    placeStick() {
        const stick = this.stick;
        if(!stick) {
            this.base.classList.remove('active');
            this.knob.style.transform = 'translate(-50%, -50%)';
            return;
        }
        this.base.classList.add('active');
        this.base.style.left = stick.cx + 'px';
        this.base.style.top = stick.cy + 'px';
        let dx = stick.x - stick.cx;
        let dy = stick.y - stick.cy;
        const length = Math.sqrt(dx * dx + dy * dy);
        if(length > JOYSTICK_RADIUS) {
            dx *= JOYSTICK_RADIUS / length;
            dy *= JOYSTICK_RADIUS / length;
        }
        this.knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }

    show(visible) {
        this.visible = visible;
        this.root.style.display = visible ? '' : 'none';
        if(!visible) {
            this.stick = null;
            this.aim = null;
            this.placeStick();
        }
    }

    // Called every frame while playing: turns the joystick into thrust and turning, and
    // updates the context buttons.
    update(ship, context) {
        const input = this.input;
        this.rotateHint.style.display = window.innerHeight > window.innerWidth ? '' : 'none';

        this.interactButton.style.display = context.interactLabel ? '' : 'none';
        this.interactButton.textContent = context.interactLabel || '';
        this.autoButton.style.display = ship.guidance ? '' : 'none';
        this.modeButton.style.display = ship.guidance ? '' : 'none';
        const modeLabel = { both: 'Ships+ Rocks', ships: 'Ships', asteroids: 'Rocks' }[ship.targetMode];
        if(this.modeButton.textContent !== modeLabel) this.modeButton.textContent = modeLabel;
        this.autoButton.classList.toggle('pressed', !!ship.autoTarget);
        this.stabButton.classList.toggle('pressed', !!ship.stabilizer);

        const stick = this.stick;
        if(!stick || !ship.alive) {
            input.forward = false;
            input.rotateLeft = false;
            input.rotateRight = false;
            return;
        }
        const dx = stick.x - stick.cx;
        const dy = stick.y - stick.cy;
        const push = Math.min(1, Math.sqrt(dx * dx + dy * dy) / JOYSTICK_RADIUS);
        if(push < 0.15) {
            input.forward = false;
            input.rotateLeft = false;
            input.rotateRight = false;
            return;
        }

        // Steer: aim for an angular velocity proportional to the heading error, so the
        // ship turns briskly and settles without overshooting.
        const desired = Math.atan2(dy, dx);
        const error = angleDifference(ship.angle, desired);
        const maxTurn = ship.stats.maxTurn;
        const wanted = Math.max(-maxTurn, Math.min(maxTurn, error * 3));
        input.rotateRight = Math.abs(error) > TURN_DEADZONE && ship.angularVelocity < wanted - 0.05;
        input.rotateLeft = Math.abs(error) > TURN_DEADZONE && ship.angularVelocity > wanted + 0.05;
        if(Math.abs(error) <= TURN_DEADZONE) {
            // Lined up: cancel leftover spin.
            input.rotateRight = ship.angularVelocity < -0.1;
            input.rotateLeft = ship.angularVelocity > 0.1;
        }
        // Thrust once roughly facing the stick direction; harder push = thrust sooner.
        input.forward = push > 0.35 && Math.abs(error) < 0.35 + push * 0.4;
    }
}

/* harmony default export */ __webpack_exports__["a"] = (TouchControls);


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__shipyard_modules__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shipyard_hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render3d_scene3d__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ship_ship__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__audio_audio__ = __webpack_require__(3);
/* unused harmony reexport DAMAGE_TYPE */
// A ship flying freely in 3D (six degrees of freedom): the same hulls, modules and stats as
// the shipyard, with zero-g Newtonian flight, an optional stabilizer, turrets that aim
// anywhere around the ship, missiles and drones, and shields that soak kinetic hits.
//
// Ship-local frame (matches the hull models): +X forward (bow), +Z up, -Y starboard.
// Hull line art (x, y) maps to local (x, -y).







const SECONDARY = 0.6;          // retro / strafe / lift thrust relative to the main engines
const MAX_SPEED = 700;
const MASS_UNIT = 300;
const BULLET_SPEED = 1400;
/* harmony export (immutable) */ __webpack_exports__["a"] = BULLET_SPEED;

const PLASMA_SPEED = 650;
/* harmony export (immutable) */ __webpack_exports__["b"] = PLASMA_SPEED;

const SPREAD = 0.012;
const HEAT_COOLING = 0.35;
const HEAT_RESUME = 0.3;
const HIT_COOLDOWN = 0.25;
const SHIELD_REGEN_DELAY = 2;
const SHIELD_FLASH_TIME = 0.35;
const SHIELD_FACTOR = { kinetic: 0.5, energy: 1.5 };
const HULL_FACTOR = { kinetic: 1.25, energy: 0.6 };
const TURRET_TYPES = ['minigun', 'staff', 'beam'];
const LAUNCHER_TYPES = ['missile', 'drones'];
const SALVO_GAP = 0.12;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Hull models are shared by every ship of a type.
const hullGeometryCache = {};
const hullEdgeCache = {};

const shieldShader = (THREE, color) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255) }, uLevel: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vView;',
        'varying vec3 vPos;',
        'void main() {',
        '    vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '    vNormal = normalize(normalMatrix * normal);',
        '    vView = normalize(-mv.xyz);',
        '    vPos = position;',
        '    gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n'),
    fragmentShader: [
        'uniform vec3 uColor;',
        'uniform float uLevel;',
        'uniform float uFlash;',
        'varying vec3 vNormal;',
        'varying vec3 vView;',
        'varying vec3 vPos;',
        'void main() {',
        '    float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.2);',
        // Faint hexagonal-ish lattice from the surface position.
        '    vec3 p = vPos * 0.18;',
        '    float lattice = smoothstep(0.92, 1.0, max(abs(sin(p.x * 3.1 + p.y * 1.8)), abs(sin(p.y * 3.1 - p.z * 1.8))));',
        '    float a = (rim * 0.55 + lattice * 0.08) * uLevel + uFlash * (0.35 + rim * 0.65);',
        '    gl_FragColor = vec4(uColor * a, a);',
        '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});

class Ship3D {

    constructor(THREE, stats, side, glowTexture) {
        this.THREE = THREE;
        this.side = side || 'player';
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.angular = new THREE.Vector3();      // local angular velocity (roll, about Y, about Z)
        this.alive = true;
        this.hidden = false;
        this.stabilizer = side === 'player';
        this.shieldsEnabled = true;
        this.weaponsOff = {};
        this.autoTarget = true;
        this.targetMode = 'both';
        this.damageScale = 1;
        this.immunity = 1.5;
        this.hitCooldown = 0;
        this.sinceHit = SHIELD_REGEN_DELAY;
        this.shieldFlash = 0;
        this.hullFlash = 0;
        this.salvoCooldown = 0;
        this.nextLauncher = 0;
        this.missileLock = null;
        this.time = 0;
        this.thrustLevel = 0;
        this.firing = false;
        this.minigunFiring = false;
        this.beaming = false;
        this.glowTexture = glowTexture;
        this.tmp = new THREE.Vector3();
        this.tmp2 = new THREE.Vector3();
        this.applyStats(stats);
        this.hp = this.maxHull;
        this.shield = this.maxShield;
    }

    get x() { return this.position.x; }
    get y() { return this.position.y; }
    get z() { return this.position.z; }
    get vx() { return this.velocity.x; }
    get vy() { return this.velocity.y; }
    get vz() { return this.velocity.z; }
    get dead() { return !this.alive; }
    get shieldUp() { return this.shieldsEnabled && this.alive && this.maxShield > 0 && this.shield > 0.5; }
    get thrusting() { return this.thrustLevel > 0.15; }

    applyStats(stats) {
        const THREE = this.THREE;
        const hullFraction = this.maxHull ? this.hp / this.maxHull : 1;
        const hull = stats.hull;
        this.stats = stats;
        this.hullDef = hull;
        this.mass = stats.mass * MASS_UNIT;
        this.radius = hull.radius;
        this.maxHull = stats.maxHull;
        this.hp = this.maxHull * hullFraction;
        this.maxShield = stats.maxShield;
        this.shield = Math.min(this.shield || 0, this.maxShield);
        this.guidance = stats.guidance;
        this.scanner = stats.scanner;
        this.hyperdrive = stats.hyperdrive;
        this.cargoCapacity = stats.cargo;
        this.magnetRange = stats.magnetRange + Math.max(0, hull.radius - 30) * 0.8 + 40;
        this.collectRadius = hull.radius * 0.6 + 12;
        const s = Object(__WEBPACK_IMPORTED_MODULE_1__shipyard_hulls__["e" /* shieldFor */])(hull);
        this.shieldShape = { x: s.x, y: -s.y, rx: s.rx, ry: s.ry, rz: Math.max(8, Math.min(s.rx, s.ry) * 0.7) };
        this.turrets = stats.modules.filter(m => TURRET_TYPES.indexOf(m.type) !== -1).map(m => ({
            module: m, kind: m.type, local: new THREE.Vector3(m.slot.x, -m.slot.y, 2 * hull.moduleScale),
            aim: new THREE.Vector3(1, 0, 0), cooldown: 0, target: null, heat: 0, overheated: false, beamTime: 0, beam: null
        }));
        this.launchers = stats.modules.filter(m => LAUNCHER_TYPES.indexOf(m.type) !== -1)
            .map(m => ({ module: m, kind: m.type, local: new THREE.Vector3(m.slot.x, -m.slot.y, 1), cooldown: 0, salvo: null }));
        this.colliders = hull.colliders.map(c => ({ local: new THREE.Vector3(c[0], -c[1], 0), r: c[2] }));
        this.buildModel();
    }

    // ------------------------------------------------------------ model

    buildModel() {
        const THREE = this.THREE;
        const hull = this.hullDef;
        if(this.group && this.group.parent) this.group.parent.remove(this.group);
        const group = new THREE.Group();
        if(!hullGeometryCache[hull.id]) {
            hullGeometryCache[hull.id] = Object(__WEBPACK_IMPORTED_MODULE_2__render3d_scene3d__["a" /* buildHullGeometries */])(THREE, hull);
            hullEdgeCache[hull.id] = hullGeometryCache[hull.id].map(g => new THREE.EdgesGeometry(g, 35));
        }
        const color = hull.color.split(',').map(v => parseFloat(v) / 255);
        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.1 + color[0] * 0.32, 0.11 + color[1] * 0.32, 0.13 + color[2] * 0.34),
            metalness: 0.4, roughness: 0.42, emissive: new THREE.Color(0, 0, 0)
        });
        this.edgeMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(color[0], color[1], color[2]), transparent: true, opacity: 0.85 });
        const model = new THREE.Group();
        hullGeometryCache[hull.id].forEach(g => model.add(new THREE.Mesh(g, this.bodyMaterial)));
        hullEdgeCache[hull.id].forEach(g => model.add(new THREE.LineSegments(g, this.edgeMaterial)));
        // The hull models are built "top down"; centre them vertically around the ship.
        model.position.z = hull.radius * 0.08;
        group.add(model);

        // Modules: turrets with barrels that swing to their target, other modules as blocks.
        const u = hull.moduleScale;
        this.turretPivots = [];
        this.stats.modules.forEach(m => {
            const mc = __WEBPACK_IMPORTED_MODULE_0__shipyard_modules__["c" /* default */][m.type].color.split(',').map(v => parseFloat(v) / 255);
            const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mc[0] * 0.6, mc[1] * 0.6, mc[2] * 0.6), emissive: new THREE.Color(mc[0] * 0.35, mc[1] * 0.35, mc[2] * 0.35), metalness: 0.5, roughness: 0.4 });
            const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2 * u, 3.8 * u, 2.2 * u, 10), mat);
            base.rotation.x = Math.PI / 2;
            base.position.set(m.slot.x, -m.slot.y, 1.5 * u + model.position.z);
            group.add(base);
            const turret = this.turrets.filter(t => t.module === m)[0];
            if(turret) {
                const pivot = new THREE.Object3D();
                pivot.position.copy(base.position);
                pivot.position.z += 1.6 * u;
                const barrel = new THREE.Mesh(new THREE.BoxGeometry(9 * u, (m.type === 'minigun' ? 1.6 : 2.4) * u, 1.6 * u), mat);
                barrel.position.x = 4.5 * u;
                pivot.add(barrel);
                group.add(pivot);
                turret.pivot = pivot;
                turret.local.copy(pivot.position);
            }
        });

        // Engine glows (bigger and brighter with thrust).
        this.engineGlows = [];
        const exhaust = (hull.exhaust || '255,150,60').split(',').map(v => parseFloat(v) / 255);
        hull.engines.forEach(e => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.glowTexture, color: new THREE.Color(exhaust[0], exhaust[1], exhaust[2]),
                blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
            }));
            sprite.position.set(e.x - 2 * e.size, -e.y, model.position.z);
            sprite.userData.size = e.size;
            group.add(sprite);
            this.engineGlows.push(sprite);
        });

        // Shield bubble.
        const shieldColor = (hull.shieldColor || '120,210,255').split(',').map(Number);
        this.shieldMaterial = shieldShader(THREE, shieldColor);
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 20), this.shieldMaterial);
        bubble.scale.set(this.shieldShape.rx, this.shieldShape.ry, this.shieldShape.rz);
        bubble.position.set(this.shieldShape.x, this.shieldShape.y, model.position.z);
        bubble.renderOrder = 3;
        group.add(bubble);
        this.bubble = bubble;
        this.group = group;
    }

    syncModel() {
        const g = this.group;
        const blink = this.immunity > 0 && this.side === 'player' && Math.floor(this.immunity * 10) % 2 === 0;
        g.visible = this.alive && !this.hidden && !blink;
        g.position.copy(this.position);
        g.quaternion.copy(this.quaternion);
        this.shieldLevel = (this.shieldLevel || 0) + ((this.shieldUp ? 1 : 0) - (this.shieldLevel || 0)) * 0.15;
        this.shieldMaterial.uniforms.uLevel.value = this.shieldLevel * (0.4 + 0.6 * Math.max(0.2, this.shield / (this.maxShield || 1)));
        this.shieldMaterial.uniforms.uFlash.value = Math.max(0, this.shieldFlash / SHIELD_FLASH_TIME) * (this.shieldUp ? 1 : 0.3);
        this.bubble.visible = this.shieldLevel > 0.02 || this.shieldFlash > 0;
        this.bodyMaterial.emissive.setRGB(this.hullFlash > 0 ? 0.6 : 0, this.hullFlash > 0 ? 0.08 : 0, this.hullFlash > 0 ? 0.05 : 0);
        const flicker = 0.85 + Math.random() * 0.3;
        this.engineGlows.forEach(s => {
            const k = (0.25 + this.thrustLevel * 1.1) * flicker;
            const size = s.userData.size * 18 * k;
            s.scale.set(size, size, size);
            s.material.opacity = Math.min(1, 0.35 + this.thrustLevel);
        });
        this.turrets.forEach(t => {
            if(!t.pivot) return;
            // Barrel direction in ship-local space.
            this.tmp.copy(t.aim).applyQuaternion(this.invQuat());
            t.pivot.quaternion.setFromUnitVectors(this.tmp2.set(1, 0, 0), this.tmp.normalize());
        });
    }

    invQuat() {
        if(!this._inv) this._inv = new this.THREE.Quaternion();
        return this._inv.copy(this.quaternion).invert();
    }

    // ------------------------------------------------------------ frame of reference

    localToWorld(local, out) {
        return (out || new this.THREE.Vector3()).copy(local).applyQuaternion(this.quaternion).add(this.position);
    }

    axis(x, y, z, out) {
        return (out || new this.THREE.Vector3()).set(x, y, z).applyQuaternion(this.quaternion);
    }

    forward(out) { return this.axis(1, 0, 0, out); }
    up(out) { return this.axis(0, 0, 1, out); }
    right(out) { return this.axis(0, -1, 0, out); }

    worldColliders() {
        return this.colliders.map(c => ({ p: this.localToWorld(c.local), r: c.r }));
    }

    // Point (radius r) against the shield ellipsoid. Returns contact info or null.
    shieldContact(point, r) {
        const THREE = this.THREE;
        const local = this.tmp.copy(point).sub(this.position).applyQuaternion(this.invQuat());
        const s = this.shieldShape;
        const lx = (local.x - s.x) / s.rx;
        const ly = (local.y - s.y) / s.ry;
        const lz = local.z / s.rz;
        const k = Math.sqrt(lx * lx + ly * ly + lz * lz) || 0.0001;
        const scale = (s.rx + s.ry + s.rz) / 3;
        const gap = (k - 1) * scale;
        if(gap > r) return null;
        const normal = new THREE.Vector3(lx / (s.rx * k), ly / (s.ry * k), lz / (s.rz * k)).normalize().applyQuaternion(this.quaternion);
        return { normal: normal, overlap: r - gap };
    }

    // ------------------------------------------------------------ flight

    // controls: { thrust, strafe, lift, pitch, yaw, roll } each -1..1, plus weapons:
    // { fire, missiles, aimPoint (world Vector3), lockTarget }.
    update(dt, controls, world) {
        if(!this.alive) {
            this.firing = this.minigunFiring = this.beaming = false;
            return;
        }
        this.time += dt;
        if(this.hitCooldown > 0) this.hitCooldown -= dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.shieldFlash > 0) this.shieldFlash -= dt;
        if(this.hullFlash > 0) this.hullFlash -= dt;
        if(this.salvoCooldown > 0) this.salvoCooldown -= dt;
        this.sinceHit += dt;
        if(this.sinceHit > SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.stats.shieldRegen * dt);
        }
        this.fly(dt, controls);
        this.updateTargeting(controls, world);
        this.updateTurrets(dt, controls, world);
        this.updateLaunchers(dt, controls, world);
    }

    fly(dt, c) {
        const stats = this.stats;
        const THREE = this.THREE;
        const maxTurn = stats.maxTurn;
        const accel = stats.angularAcceleration * 1.2;
        // Rotation: the controls set a wanted turn rate, the thrusters chase it.
        const want = [clamp(c.roll || 0, -1, 1) * maxTurn * 1.3, -clamp(c.pitch || 0, -1, 1) * maxTurn, -clamp(c.yaw || 0, -1, 1) * maxTurn];
        const w = this.angular;
        ['x', 'y', 'z'].forEach((k, i) => {
            const diff = want[i] - w[k];
            w[k] += clamp(diff, -accel * dt, accel * dt);
        });
        const angle = w.length() * dt;
        if(angle > 1e-6) {
            const dq = this.dq || (this.dq = new THREE.Quaternion());
            dq.setFromAxisAngle(this.tmp.copy(w).normalize(), angle);
            this.quaternion.multiply(dq).normalize();
        }

        // Thrust in the ship's frame.
        const main = stats.acceleration;
        const side = main * SECONDARY;
        const thrust = clamp(c.thrust || 0, -1, 1);
        const lx = thrust > 0 ? thrust * main : thrust * side;
        const ly = -clamp(c.strafe || 0, -1, 1) * side;
        const lz = clamp(c.lift || 0, -1, 1) * side;
        const force = this.tmp.set(lx, ly, lz).applyQuaternion(this.quaternion);
        this.thrustLevel += ((thrust > 0 ? thrust : 0) - this.thrustLevel) * Math.min(1, dt * 8);

        // Stabilizer: cancel any drift the pilot isn't asking for (and brake to a stop with
        // no input), like the flight assist of a real spacecraft.
        if(this.stabilizer) {
            const drift = this.tmp2.copy(this.velocity);
            const commanded = force.length();
            if(commanded > 0) {
                const dir = force.clone().divideScalar(commanded);
                const along = Math.max(0, drift.dot(dir));
                drift.addScaledVector(dir, -along);
            }
            const d = drift.length();
            if(d > 1) force.addScaledVector(drift, -Math.min(side, d / dt) / d);
        }
        this.velocity.addScaledVector(force, dt);
        const speed = this.velocity.length();
        if(speed > MAX_SPEED) this.velocity.multiplyScalar(MAX_SPEED / speed);
        this.position.addScaledVector(this.velocity, dt);
    }

    // ------------------------------------------------------------ weapons

    nearestOf(point, list, range) {
        let best = null;
        let bestDist = Infinity;
        for(let i = 0; i < list.length; i++) {
            const item = list[i];
            if(item.dead) continue;
            const dx = item.x - point.x, dy = item.y - point.y, dz = item.z - point.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) - (item.hullDef ? item.radius * 0.8 : item.radius || 0);
            if(dist < range && dist < bestDist) {
                bestDist = dist;
                best = item;
            }
        }
        return best;
    }

    // Guidance: turret targets and the missile lock. Point defence first, then ships, then
    // asteroids, following the targeting mode.
    updateTargeting(c, world) {
        if(!this.guidance) {
            this.missileLock = null;
            this.turrets.forEach(t => { t.target = null; });
            return;
        }
        const range = this.guidance.range + this.radius;
        const combat = world.combat;
        const ships = this.targetMode !== 'asteroids' ? combat.hostileShips(this.side) : [];
        const rocks = this.targetMode === 'ships' ? [] : world.rocks;
        const incoming = combat.hostileMissiles(this.side, 'missile').filter(m => {
            const dx = this.x - m.x, dy = this.y - m.y, dz = this.z - m.z;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return d < 450 + this.radius && (m.vx * dx + m.vy * dy + m.vz * dz) / (d || 1) > 100;
        });
        const aim = c.aimPoint || this.position;
        this.missileLock = (c.aimTarget && c.aimTarget.hullDef && ships.indexOf(c.aimTarget) !== -1 ? c.aimTarget : null)
            || this.nearestOf(aim, ships, 250)
            || (c.aimTarget && !c.aimTarget.hullDef && rocks.length ? c.aimTarget : null)
            || this.nearestOf(this.position, ships, range * 1.8)
            || this.nearestOf(this.position, rocks, range);
        this.turrets.forEach(t => {
            if(!this.autoTarget) {
                t.target = null;
                return;
            }
            const p = this.localToWorld(t.local, this.tmp);
            const reach = t.kind === 'beam' ? Math.min(range, t.module.stats.range) : range;
            const shipReach = t.kind === 'beam' ? t.module.stats.range : Math.max(range, 800);
            t.target = (t.kind === 'minigun' && this.nearestOf(p, incoming, reach))
                || this.nearestOf(p, ships, shipReach)
                || this.nearestOf(p, rocks, reach);
        });
    }

    updateTurrets(dt, c, world) {
        const THREE = this.THREE;
        this.firing = this.minigunFiring = this.beaming = false;
        this.turrets.forEach(t => {
            if(t.cooldown > 0) t.cooldown -= dt;
            t.beam = null;
            if(t.kind === 'minigun') {
                t.heat = Math.max(0, t.heat - HEAT_COOLING * dt);
                if(t.overheated && t.heat <= HEAT_RESUME) t.overheated = false;
            }
            const enabled = !this.weaponsOff[t.kind];
            const p = this.localToWorld(t.local);
            let aimPoint = c.aimPoint;
            let shouldFire = !!c.fire && enabled;
            if(!c.fire && t.target && enabled) {
                // Lead the target for the shot's travel time.
                const target = t.target;
                const speed = t.kind === 'staff' ? PLASMA_SPEED : BULLET_SPEED;
                const d = Math.sqrt((target.x - p.x) * (target.x - p.x) + (target.y - p.y) * (target.y - p.y) + (target.z - p.z) * (target.z - p.z));
                const time = t.kind === 'beam' ? 0 : d / speed;
                aimPoint = new THREE.Vector3(target.x + (target.vx || 0) * time, target.y + (target.vy || 0) * time, target.z + (target.vz || 0) * time);
                shouldFire = true;
            }
            if(aimPoint) t.aim.copy(aimPoint).sub(p).normalize();
            else t.aim.copy(this.forward(this.tmp2));
            if(t.kind === 'beam') {
                this.updateBeam(dt, t, p, shouldFire && !!aimPoint, world);
                return;
            }
            if(!shouldFire || !aimPoint || t.overheated) return;
            this.firing = true;
            if(t.kind === 'minigun') this.minigunFiring = true;
            if(t.cooldown > 0) return;
            if(t.kind === 'minigun') this.fireMinigun(t, p, world);
            else this.fireStaff(t, p, world);
        });
    }

    shotVelocity(dir, speed) {
        // Shots inherit the ship's speed along the line of fire, not its sideways drift.
        const inherited = Math.max(0, this.velocity.dot(dir));
        return dir.clone().multiplyScalar(speed + inherited);
    }

    jitter(dir, amount) {
        const THREE = this.THREE;
        const d = dir.clone();
        d.x += (Math.random() - 0.5) * 2 * amount;
        d.y += (Math.random() - 0.5) * 2 * amount;
        d.z += (Math.random() - 0.5) * 2 * amount;
        return d.normalize();
    }

    fireMinigun(t, p, world) {
        const stats = t.module.stats;
        t.cooldown = Math.max(0, t.cooldown) + 1 / stats.fireRate;
        const dir = this.jitter(t.aim, SPREAD);
        const barrel = 9 * this.hullDef.moduleScale;
        const v = this.shotVelocity(dir, BULLET_SPEED);
        world.bullets.push({ kind: 'bullet', x: p.x + dir.x * barrel, y: p.y + dir.y * barrel, z: p.z + dir.z * barrel,
            vx: v.x, vy: v.y, vz: v.z, damage: stats.damage * this.damageScale, side: this.side, life: 1.6, age: 0, mass: 1.2 });
        this.velocity.addScaledVector(dir, -0.8 / this.stats.mass);
        world.effects.spawn({ x: p.x + dir.x * barrel, y: p.y + dir.y * barrel, z: p.z + dir.z * barrel,
            vx: this.vx, vy: this.vy, vz: this.vz, life: 0.05, size: 7 * this.hullDef.moduleScale, color: '255,220,150' });
        if(this.side === 'player' || Math.random() < 0.3) __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].minigunShot();
        t.heat += 1 / stats.heatShots + HEAT_COOLING / stats.fireRate;
        if(t.heat >= 1) {
            t.heat = 1;
            t.overheated = true;
            if(this.side === 'player') __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].overheat();
        }
    }

    fireStaff(t, p, world) {
        const stats = t.module.stats;
        t.cooldown = 1 / stats.fireRate;
        const dir = t.aim.clone();
        const barrel = 8 * this.hullDef.moduleScale;
        const v = this.shotVelocity(dir, PLASMA_SPEED);
        world.bullets.push({ kind: 'plasma', x: p.x + dir.x * barrel, y: p.y + dir.y * barrel, z: p.z + dir.z * barrel,
            vx: v.x, vy: v.y, vz: v.z, damage: stats.damage * this.damageScale, splash: stats.splash, side: this.side, life: 2.4, age: 0, mass: 30 });
        this.velocity.addScaledVector(dir, -4.8 / this.stats.mass);
        world.effects.burst(p, this.velocity, 6, { minSpeed: 40, maxSpeed: 140, minLife: 0.12, maxLife: 0.3, size: 4, color: '255,170,60', dir: dir, cone: 0.7 });
        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].staffShot();
    }

    updateBeam(dt, t, p, trigger, world) {
        const stats = t.module.stats;
        if(t.beamTime > 0 && !trigger) {
            t.cooldown = stats.cooldown * (1 - t.beamTime / stats.burst);
            t.beamTime = 0;
        }
        if(trigger && t.beamTime <= 0 && t.cooldown <= 0) t.beamTime = stats.burst;
        if(t.beamTime <= 0) return;
        t.beamTime -= dt;
        if(t.beamTime <= 0) {
            t.beamTime = 0;
            t.cooldown = stats.cooldown;
        }
        const hit = world.raycast(p, t.aim, stats.range, this.side);
        const end = p.clone().addScaledVector(t.aim, hit.distance);
        t.beam = { from: p.clone(), to: end, hit: !!hit.object };
        this.firing = this.beaming = true;
        if(hit.object) world.beamHits.push({ object: hit.object, damage: stats.dps * dt * this.damageScale, point: end, dir: t.aim.clone() });
    }

    updateLaunchers(dt, c, world) {
        this.launchers.forEach(l => {
            if(l.cooldown > 0) l.cooldown -= dt;
            if(l.salvo) this.continueSalvo(l, c, world, dt);
        });
        if(!c.missiles || this.salvoCooldown > 0 || !this.launchers.length) return;
        for(let i = 0; i < this.launchers.length; i++) {
            const index = (this.nextLauncher + i) % this.launchers.length;
            const l = this.launchers[index];
            if(l.cooldown > 0 || this.weaponsOff[l.kind]) continue;
            if(l.kind === 'missile') this.fireMissile(l, c, world);
            else this.fireDrones(l, c, world);
            this.salvoCooldown = SALVO_GAP;
            this.nextLauncher = index + 1;
            return;
        }
    }

    missileTarget(c, world) {
        if(c.lockTarget) return c.lockTarget;
        if(this.guidance) return this.missileLock;
        // Without a targeting computer, missiles go for whatever is under the crosshair.
        return c.aimTarget || null;
    }

    fireMissile(l, c, world) {
        const stats = l.module.stats;
        const p = this.localToWorld(l.local);
        const target = this.missileTarget(c, world);
        const dir = target ? new this.THREE.Vector3(target.x - p.x, target.y - p.y, target.z - p.z).normalize()
            : (c.aimPoint ? c.aimPoint.clone().sub(p).normalize() : this.forward());
        const v = this.velocity.clone().addScaledVector(dir, 140);
        world.missiles.push({ kind: 'missile', x: p.x, y: p.y, z: p.z, vx: v.x, vy: v.y, vz: v.z, dir: dir,
            damage: stats.damage * this.damageScale, blast: stats.blast, target: target,
            homing: this.guidance ? this.guidance.homing : (target ? 2.6 : 0), side: this.side, life: 5, targetMode: this.targetMode });
        l.cooldown = stats.cooldown;
        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].missileLaunch();
    }

    fireDrones(l, c, world) {
        const stats = l.module.stats;
        const drones = world.combat.hostileMissiles(this.side, 'drone');
        const target = this.nearestOf(this.position, drones, 1000) || this.missileTarget(c, world)
            || (this.targetMode !== 'asteroids' ? this.nearestOf(this.position, world.combat.hostileShips(this.side), 1500) : null);
        l.salvo = { remaining: stats.count, timer: 0, target: target, index: 0 };
        l.cooldown = stats.cooldown;
    }

    continueSalvo(l, c, world, dt) {
        const s = l.salvo;
        s.timer -= dt;
        if(s.timer > 0) return;
        if(!this.alive || s.remaining <= 0) {
            l.salvo = null;
            return;
        }
        const stats = l.module.stats;
        const p = this.localToWorld(l.local);
        const target = s.target && !s.target.dead ? s.target : null;
        // Drones leave in a spread around the launch direction and weave in.
        const base = target ? new this.THREE.Vector3(target.x - p.x, target.y - p.y, target.z - p.z).normalize() : this.forward();
        const dir = this.jitter(base, 0.45);
        const v = this.velocity.clone().addScaledVector(dir, 240);
        world.missiles.push({ kind: 'drone', x: p.x, y: p.y, z: p.z, vx: v.x, vy: v.y, vz: v.z, dir: dir,
            damage: stats.damage * this.damageScale, blast: stats.blast, target: target, homing: 7, side: this.side, life: 7, targetMode: this.targetMode });
        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].droneLaunch();
        s.remaining--;
        s.index++;
        s.timer = 0.11;
        if(s.remaining <= 0) l.salvo = null;
    }

    weaponStatus() {
        const groups = {};
        this.turrets.concat(this.launchers).forEach(w => {
            const def = __WEBPACK_IMPORTED_MODULE_0__shipyard_modules__["c" /* default */][w.kind];
            if(!groups[w.kind]) groups[w.kind] = { name: def.short, color: def.color, ready: 0, count: 0, state: 'ready' };
            const g = groups[w.kind];
            const stats = w.module.stats;
            let ready = 1;
            let state = 'ready';
            if(w.kind === 'minigun') {
                ready = 1 - w.heat;
                state = w.overheated ? 'overheated' : (w.heat > 0.6 ? 'hot' : 'ready');
            } else if(w.kind === 'beam') {
                if(w.beamTime > 0) { ready = w.beamTime / stats.burst; state = 'firing'; }
                else if(w.cooldown > 0) { ready = 1 - w.cooldown / stats.cooldown; state = 'charging'; }
            } else if(w.cooldown > 0) {
                const total = w.kind === 'staff' ? 1 / stats.fireRate : stats.cooldown;
                ready = 1 - w.cooldown / total;
                state = 'reloading';
            }
            g.ready += clamp(ready, 0, 1);
            g.count++;
            if(state !== 'ready') g.state = state;
        });
        return Object.keys(groups).map(kind => {
            const g = groups[kind];
            const off = !!this.weaponsOff[kind];
            return { kind: kind, name: g.name, color: g.color, ready: g.ready / g.count, count: g.count, state: off ? 'off' : g.state, off: off };
        });
    }

    toggleWeapon(kind) {
        this.weaponsOff[kind] = !this.weaponsOff[kind];
        return !this.weaponsOff[kind];
    }

    cycleTargetMode() {
        this.targetMode = __WEBPACK_IMPORTED_MODULE_3__components_ship_ship__["c" /* TARGET_MODES */][(__WEBPACK_IMPORTED_MODULE_3__components_ship_ship__["c" /* TARGET_MODES */].indexOf(this.targetMode) + 1) % __WEBPACK_IMPORTED_MODULE_3__components_ship_ship__["c" /* TARGET_MODES */].length];
        return this.targetMode;
    }

    toggleShields() {
        this.shieldsEnabled = !this.shieldsEnabled;
        if(this.shieldsEnabled) __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].shieldUp();
        else __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].shieldDown();
    }

    // ------------------------------------------------------------ damage

    // `type` ('kinetic' / 'energy') marks a weapon hit (no knock cooldown, resistances
    // apply); `quiet` skips sounds for continuous beams. Returns { shield, hull } absorbed.
    takeDamage(amount, type, quiet) {
        if(!this.alive || this.immunity > 0) return null;
        if(!type && this.hitCooldown > 0) return null;
        if(!type) this.hitCooldown = HIT_COOLDOWN;
        this.sinceHit = 0;
        const shieldFactor = type ? SHIELD_FACTOR[type] : 1;
        const hullFactor = type ? HULL_FACTOR[type] : 1;
        let remaining = amount;
        let onShield = 0;
        if(this.shieldUp) {
            onShield = Math.min(amount, this.shield / shieldFactor);
            this.shield = Math.max(0, this.shield - onShield * shieldFactor);
            remaining = amount - onShield;
            if(onShield > 0) {
                this.shieldFlash = SHIELD_FLASH_TIME;
                if(!quiet || Math.random() < 0.08) __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].shieldHit(type ? 1 + onShield / 25 : 0.4 + onShield / 25);
            }
        }
        if(remaining > 0) {
            this.hp -= remaining * hullFactor;
            this.hullFlash = 0.15;
            if(!quiet || Math.random() < 0.08) __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].hullHit();
        }
        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].shipExplosion();
        }
        return { shield: onShield, hull: remaining };
    }
}
/* harmony export (immutable) */ __webpack_exports__["c"] = Ship3D;





/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scripts_game3d_game3d__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_shipyard__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__styles_main_css__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__styles_main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__styles_main_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__scripts_ui_touch__ = __webpack_require__(22);







if(Object(__WEBPACK_IMPORTED_MODULE_5__scripts_ui_touch__["b" /* isTouchDevice */])()) document.body.classList.add('touch');

const startGame = document.getElementById('startGame');
const openShipyard = document.getElementById('openShipyard');
const menu = document.getElementById('menu');
const menuCredits = document.getElementById('menuCredits');

const renderMenuCredits = () => {
    const profile = Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["g" /* getProfile */])();
    const cargo = Object.keys(profile.cargo).reduce((sum, id) => sum + profile.cargo[id], 0);
    menuCredits.textContent = 'Credits: ' + Math.round(profile.credits).toLocaleString('en-US') +
        (cargo ? ' · Ore in hold: ' + cargo : '');
};

const debugToggle = document.getElementById('debugToggle');
const renderDebug = () => {
    debugToggle.textContent = Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["i" /* isDebug */])() ? 'Debug mode: ON (everything unlocked and free)' : 'Debug mode: OFF';
    debugToggle.classList.toggle('on', Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["i" /* isDebug */])());
};
debugToggle.addEventListener('click', () => Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["s" /* setDebug */])(!Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["i" /* isDebug */])()));

// Debug mode can also be switched on from the address bar: index.html?debug
if(/[?&]debug\b/.test(window.location.search) && !Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["i" /* isDebug */])()) Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["s" /* setDebug */])(true);

renderMenuCredits();
renderDebug();
Object(__WEBPACK_IMPORTED_MODULE_3__scripts_shipyard_profile__["l" /* onProfileChange */])(() => {
    renderMenuCredits();
    renderDebug();
});

// On phones, go full screen in landscape when launching so the browser bars don't eat
// the view. Both calls may be refused (iOS Safari has no fullscreen API); that's fine.
const goFullscreen = () => {
    if(!Object(__WEBPACK_IMPORTED_MODULE_5__scripts_ui_touch__["b" /* isTouchDevice */])()) return;
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if(!request || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
        const result = request.call(root, { navigationUI: 'hide' });
        if(result && result.then) {
            result.then(() => {
                if(screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
            }).catch(() => {});
        }
    } catch(e) { /* not allowed */ }
};

// The full 3D game on computers with WebGL; phones (touch controls) and browsers without
// WebGL get the classic 2D game, which is always available from the menu too.
const use3D = () => Object(__WEBPACK_IMPORTED_MODULE_1__scripts_game3d_game3d__["a" /* can3D */])() && !Object(__WEBPACK_IMPORTED_MODULE_5__scripts_ui_touch__["b" /* isTouchDevice */])();

startGame.addEventListener('click', () => {
    goFullscreen();
    menu.style.visibility = 'hidden';
    if(use3D()) Object(__WEBPACK_IMPORTED_MODULE_1__scripts_game3d_game3d__["b" /* start3D */])();
    else Object(__WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__["a" /* default */])();
});

document.getElementById('classicGame').addEventListener('click', () => {
    goFullscreen();
    menu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__["a" /* default */])();
});
if(!use3D()) document.getElementById('classicGame').style.display = 'none';

openShipyard.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_shipyard__["a" /* getShipyard */])().open({
        closeLabel: 'Done',
        onClose: () => { menu.style.visibility = 'visible'; }
    });
});


/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_ship_enemy__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_ore_ore__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__audio_audio__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__physics_physics__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__world_sectors__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__world_station__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__shipyard_profile__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__shipyard_shipyard__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__world_systems__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__world_stargate__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__ui_dhd__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__ui_starmap__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__render_planets__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__travel__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__render_sprites__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__render3d_scene3d__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21__ui_touch__ = __webpack_require__(22);























const STEP = 1 / 120;             // fixed physics timestep (frame-rate independent)
const MAX_STEPS_PER_FRAME = 4;   // on slow frames, slow the game slightly rather than spiral
const MAX_PARTICLES = 1400;     // pixel particles are cheap (one small fillRect each)
const MAX_DUST = 320;              // soft dust puffs are large; keep only the newest
const GAME_OVER_DELAY = 2.5;
const SHIP_RESTITUTION = 0.4;
const ROCK_BOUNCE = 0.2;
const MISSILE_PUSH = 60000;
const SECTOR_UPDATE_INTERVAL = 0.5;
const MINIMAP_SIZE = 180;

// Phones and tablets get on-screen controls and a layout that keeps the thumbs' areas clear.
const TOUCH = Object(__WEBPACK_IMPORTED_MODULE_21__ui_touch__["b" /* isTouchDevice */])();
let touchControls = null;
const hint = (key) => TOUCH ? '' : ' (' + key + ')';
const MINIMAP_RANGE = 3500;

const gameboard = document.getElementById('gameboard');
const menu = document.getElementById('menu');
const menuMessage = document.getElementById('menuMessage');
const pauseMenu = document.getElementById('pauseMenu');
const shieldButton = document.getElementById('shieldButton');
const cargoButton = document.getElementById('cargoButton');
const starmapButton = document.getElementById('starmapButton');
const cargoPanel = document.getElementById('cargoPanel');
const hudElements = {
    credits: document.getElementById('credits'),
    location: document.getElementById('location'),
    targeting: document.getElementById('targeting'),
    fps: document.getElementById('fps'),
    hullBar: document.getElementById('hullBar'),
    hullText: document.getElementById('hullText'),
    shieldBar: document.getElementById('shieldBar'),
    shieldText: document.getElementById('shieldText'),
    cargoBar: document.getElementById('cargoBar'),
    cargoText: document.getElementById('cargoText'),
    cargoButton: document.getElementById('cargoButton')
};

const canvas = document.createElement('canvas');
canvas.className = 'main-layer';
const ctx = canvas.getContext('2d');

// 3D view (WebGL on the graphics card) when available: asteroids, ship hulls, ore, Atlantis,
// the Stargate, the planet and the starfield are drawn by `scene3d` underneath this canvas;
// effects and the HUD stay on this canvas on top, lined up exactly. Without WebGL the whole
// game is drawn on this canvas as before.
let scene3d = null;
let slow3dTime = 0;
let frameErrors = 0;
let pixelRatio = 1;

let state = null;
let frameId = null;
let lastFrameTime = 0;
let accumulator = 0;
let fps = 60;
const hud = {};

// Each star system has its own asteroid fields: seed derived from the profile seed and
// the system id, ore mix from the system, and the station/gate kept clear of rocks.
const systemSeed = (id) => {
    let h = 2166136261;
    for(let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    return (Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["g" /* getProfile */])().seed ^ h) >>> 0;
};
const makeSectors = (system) => new __WEBPACK_IMPORTED_MODULE_9__world_sectors__["a" /* SectorManager */](systemSeed(system.id), system.materials, [{ x: 0, y: 0 }, system.gate]);
const originIndex = (system) => __WEBPACK_IMPORTED_MODULE_13__world_systems__["b" /* SYSTEMS */].indexOf(system);

const createState = () => {
    const system = Object(__WEBPACK_IMPORTED_MODULE_13__world_systems__["g" /* systemById */])('lantea');
    const ship = new __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["e" /* default */](__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x + __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].dockRadius + 80, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y, Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["f" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["g" /* getProfile */])().hull));
    ship.angle = 0;
    return {
        system: system,
        gate: new __WEBPACK_IMPORTED_MODULE_14__world_stargate__["e" /* default */](system.gate.x, system.gate.y),
        transition: null,
        tooBigTimer: 0,
        ship: ship,
        rocks: [],
        newRocks: [],
        bullets: [],
        missiles: [],
        enemies: [],
        combat: combat,
        enemyTimer: 20 + Math.random() * 15,
        particles: [],
        ores: [],
        beamHits: [],
        shockwaves: [],
        flashes: [],
        scan: { timer: 1, target: null, value: 0, pings: [] },
        mergeLinks: [],
        floatingTexts: [],
        sectors: makeSectors(system),
        sectorTimer: 0,
        camera: { x: ship.x, y: ship.y },
        time: 0,
        bannerText: 'Undocked. Happy mining!',
        bannerTimer: 2.5,
        cargoFullTimer: 0,
        shieldHintTimer: 0,
        canDock: false,
        gameOverTimer: 0,
        paused: false,
        docked: false
    };
};

// Render resolution cap: starts at the screen's pixel ratio (max 2) and drops to 1
// automatically if the game can't hold a smooth frame rate on this computer.
// Safari starts at standard resolution (4x fewer pixels on Retina screens).
let resolutionCap = Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["f" /* isSafari */])() ? 1 : 2;

// Camera zoom: a little closer than 1:1 so ships and asteroids read clearly.
// Mouse wheel or +/- keys change it between MIN_ZOOM (wide tactical view) and
// MAX_ZOOM (close-up); 0 resets. The view eases smoothly towards the target.
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.6;
const DEFAULT_ZOOM = 1.3;
let zoom = DEFAULT_ZOOM;
let targetZoom = DEFAULT_ZOOM;
const zoomKeys = { in: false, out: false };
const clampZoom = (value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
// Default view for the current hull: big ships start zoomed out so they fit nicely.
const shipZoom = () => {
    const r = state ? state.ship.radius : 30;
    return clampZoom(r <= 45 ? DEFAULT_ZOOM : DEFAULT_ZOOM * Math.pow(45 / r, 0.75));
};
// When zoomed far out, keep a wider ring of asteroid sectors loaded so the view is filled.
const sectorRadius = () => (Math.min(zoom, targetZoom) < 0.4 ? 3 : 2);
let slowTime = 0;

const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, resolutionCap);
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if(scene3d) scene3d.resize(window.innerWidth, window.innerHeight, pixelRatio);
    __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].resize(window.innerWidth, window.innerHeight);
};

const setText = (key, text) => {
    if(hud[key] !== text) {
        hud[key] = text;
        hudElements[key].textContent = text;
    }
};

const setBar = (key, fraction) => {
    const width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
    if(hud[key] !== width) {
        hud[key] = width;
        hudElements[key].style.width = width;
    }
};

const distanceToStation = () => {
    const dx = state.ship.x - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x;
    const dy = state.ship.y - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y;
    return Math.sqrt(dx * dx + dy * dy);
};

const renderInfo = () => {
    const ship = state.ship;
    const used = Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["d" /* cargoUsed */])();
    const sector = Object(__WEBPACK_IMPORTED_MODULE_9__world_sectors__["b" /* sectorOf */])(ship.x, ship.y);
    setText('credits', 'Credits: ' + Math.round(Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["g" /* getProfile */])().credits).toLocaleString('en-US'));
    setText('location', state.system.name + ' · sector ' + sector.sx + ', ' + sector.sy +
        (state.system.station ? ' · base ' + (distanceToStation() / 1000).toFixed(1) + 'k' : ''));
    setText('fps', 'Fps: ' + Math.round(fps) + (scene3d ? ' (3D)' : ' (2D)'));
    setText('targeting', 'Stabilizer: ' + (ship.stabilizer ? 'ON' : 'OFF') + hint('X') +
        (ship.guidance ? ' · Auto-target: ' + (ship.autoTarget ? 'ON' : 'OFF') + hint('G') +
            ' · Targets: ' + __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["d" /* TARGET_MODE_LABEL */][ship.targetMode] + hint('T') : ''));
    setBar('hullBar', ship.hp / ship.maxHull);
    setText('hullText', Math.ceil(ship.hp) + ' / ' + Math.round(ship.maxHull));
    setBar('shieldBar', ship.maxShield ? ship.shield / ship.maxShield : 0);
    setText('shieldText', ship.maxShield ? Math.ceil(ship.shield) + ' / ' + Math.round(ship.maxShield) : 'none');
    const shieldState = ship.maxShield <= 0 ? 'none' : (ship.shieldsEnabled ? (ship.shieldUp ? 'up' : 'depleted') : 'down');
    if(hud.shieldState !== shieldState) {
        hud.shieldState = shieldState;
        shieldButton.className = 'shield-button ' + shieldState;
        shieldButton.textContent = {
            none: 'No shields', up: 'Shields: UP' + hint('H'), depleted: 'Shields: DEPLETED', down: 'Shields: DOWN' + hint('H')
        }[shieldState];
    }
    setBar('cargoBar', used / ship.cargoCapacity);
    setText('cargoButton', 'Cargo ' + used + '/' + ship.cargoCapacity + hint('C'));
    setText('cargoText', used + ' / ' + ship.cargoCapacity);
};

const floatText = (x, y, text, color) => {
    state.floatingTexts.push({ x: x, y: y, text: text, color: color || '255,225,120', life: 1.2 });
};

const banner = (text, duration) => {
    state.bannerText = text;
    state.bannerTimer = duration || 2;
};

// ---------------------------------------------------------------- physics

// Gravity changes slowly, so the expensive all-pairs sum is refreshed GRAVITY_INTERVAL
// times less often than the physics step and the cached accelerations reused in between.
const GRAVITY_INTERVAL = 4;
let gravityCounter = 0;

const applyGravity = (dt) => {
    const { rocks, ship, bullets, missiles, ores } = state;
    const refresh = gravityCounter++ % GRAVITY_INTERVAL === 0;

    const pull = (body) => {
        if(refresh || !body.gravity) body.gravity = Object(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["c" /* gravityAt */])(body, rocks);
        body.vx += body.gravity.x * dt;
        body.vy += body.gravity.y * dt;
    };

    // Rocks: compute every acceleration before changing any velocity.
    if(refresh) rocks.forEach(rock => { rock.gravityNext = Object(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["c" /* gravityAt */])(rock, rocks); });
    rocks.forEach(rock => {
        if(refresh || !rock.gravity) rock.gravity = rock.gravityNext || Object(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["c" /* gravityAt */])(rock, rocks);
        rock.vx += rock.gravity.x * dt;
        rock.vy += rock.gravity.y * dt;
    });

    if(ship.alive) pull(ship);
    bullets.forEach(pull);
    missiles.forEach(pull);
    ores.forEach(pull);
};

// Weapon damage chips the asteroid: area turns into ore, stress cracks chunks off.
const colorString = (c) => c.map(v => Math.round(v)).join(',');
const shadeString = (c, f) => c.map(v => Math.round(Math.max(0, Math.min(255, v * f)))).join(',');

// Dust, debris chips and unlit pixels are drawn normally; sparks and glowing pixels add light.
const isUnlit = (particle) => particle.dust || particle.solid || (particle.pixel && !particle.glow);

// Spawn particles in a cone around (dirX, dirY).
const spray = (x, y, baseVx, baseVy, dirX, dirY, cone, count, options) => {
    const angle = Math.atan2(dirY, dirX);
    for(let i = 0; i < count; i++) {
        const a = angle + (Math.random() - 0.5) * 2 * cone;
        const speed = options.minSpeed + Math.random() * (options.maxSpeed - options.minSpeed);
        state.particles.push(new __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */]({
            x: x, y: y,
            vx: baseVx + Math.cos(a) * speed,
            vy: baseVy + Math.sin(a) * speed,
            life: options.minLife + Math.random() * (options.maxLife - options.minLife),
            size: options.size * (0.6 + Math.random() * 0.8),
            color: options.color,
            dust: options.dust,
            solid: options.solid,
            pixel: options.pixel,
            glow: options.glow,
            drag: options.drag,
            alpha: options.alpha
        }));
    }
};

const flash = (x, y, size, color, life) => {
    state.flashes.push({ x: x, y: y, size: size, color: color, life: life || 0.12, maxLife: life || 0.12 });
};

// Weapon damage on an asteroid. The impact looks different on the soft dusty outside
// (dust plume, grit, debris) and on the hard core (ricocheting sparks, hot fragments).
// `inX, inY` is the incoming direction of the shot, `kind` the weapon type.
const hitRock = (rock, damage, hitX, hitY, inX, inY, kind) => {
    if(rock.dead) return;
    const localAngle = Math.atan2(hitY - rock.y, hitX - rock.x) - rock.angle;
    const normal = rock.normalAt(localAngle);
    const result = rock.chip(damage, hitX, hitY);
    const dust = colorString(rock.dustColor);
    const intensity = Math.min(1.5, 0.4 + damage * 0.25);

    // Incoming direction (default: straight into the surface) and its reflection.
    let dx = inX === undefined ? -normal.x : inX;
    let dy = inY === undefined ? -normal.y : inY;
    const dl = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= dl;
    dy /= dl;
    const dot = dx * normal.x + dy * normal.y;
    const rx = dx - 2 * dot * normal.x;
    const ry = dy - 2 * dot * normal.y;
    const continuous = kind === 'beam';

    const light = shadeString(rock.dustColor, 1.25);
    const darkDust = shadeString(rock.dustColor, 0.7);
    const coreColor = colorString(rock.coreColor);

    if(result.hard) {
        // Hard core: a shower of spark pixels skipping off the surface, glowing embers,
        // shards of dark core rock, a puff of pulverised stone and a bright flash.
        if(!continuous || Math.random() < 0.55) {
            spray(hitX, hitY, rock.vx, rock.vy, rx, ry, 0.55, continuous ? 3 : Math.round(8 + 6 * intensity), {
                minSpeed: 160, maxSpeed: 420, minLife: 0.12, maxLife: 0.4, size: 1.6, color: '255,235,180', pixel: true, glow: true
            });
            spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 1, continuous ? 1 : Math.round(2 + 2 * intensity), {
                minSpeed: 40, maxSpeed: 140, minLife: 0.35, maxLife: 0.9, size: 2.2, color: '255,140,50', pixel: true, glow: true, drag: 1.5
            });
            spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.9, continuous ? 1 : Math.round(3 + 3 * intensity), {
                minSpeed: 50, maxSpeed: 170, minLife: 0.4, maxLife: 1, size: 2, color: coreColor, pixel: true, drag: 0.6
            });
            spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.6, continuous ? 0 : 1, {
                minSpeed: 10, maxSpeed: 40, minLife: 0.8, maxLife: 1.6, size: 5, color: darkDust, dust: true, alpha: 0.3, drag: 0.8
            });
            flash(hitX, hitY, continuous ? 16 : 20 + 12 * intensity, '255,220,160', 0.09);
        }
    } else if(!continuous || Math.random() < 0.7) {
        // Soft regolith: a billowing plume of dust, a spray of grit pixels in light and
        // dark shades, a few bigger clods, and a dim flash.
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.8, continuous ? 1 : Math.round(2 + intensity * 2), {
            minSpeed: 15, maxSpeed: 70, minLife: 1, maxLife: 2.2, size: 8, color: dust, dust: true, alpha: 0.32, drag: 0.7
        });
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 1.1, continuous ? 3 : Math.round(6 + 6 * intensity), {
            minSpeed: 40, maxSpeed: 200, minLife: 0.35, maxLife: 1, size: 1.4, color: light, pixel: true, drag: 0.5
        });
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 1.1, continuous ? 2 : Math.round(4 + 4 * intensity), {
            minSpeed: 30, maxSpeed: 150, minLife: 0.4, maxLife: 1.1, size: 1.4, color: darkDust, pixel: true, drag: 0.5
        });
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.7, continuous ? 0 : Math.round(1 + intensity), {
            minSpeed: 30, maxSpeed: 90, minLife: 0.6, maxLife: 1.4, size: 3, color: dust, solid: true
        });
        flash(hitX, hitY, continuous ? 9 : 12 + 6 * intensity, '255,230,200', 0.06);
    }

    // Ore pops out of the hole, flashing in its metal colour with a burst of glinting pixels.
    result.ore.forEach(material => {
        const color = __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][material].color;
        const a = Math.atan2(normal.y, normal.x) + (Math.random() - 0.5) * 1.1;
        const speed = 50 + Math.random() * 70;
        const ore = new __WEBPACK_IMPORTED_MODULE_4__components_ore_ore__["a" /* default */](
            hitX + normal.x * 3,
            hitY + normal.y * 3,
            rock.vx + Math.cos(a) * speed,
            rock.vy + Math.sin(a) * speed,
            material
        );
        ore.trail = 0.8;
        state.ores.push(ore);
        flash(hitX, hitY, 32, color, 0.22);
        spray(hitX, hitY, rock.vx, rock.vy, Math.cos(a), Math.sin(a), 0.6, 10, {
            minSpeed: 60, maxSpeed: 200, minLife: 0.25, maxLife: 0.6, size: 1.6, color: color, pixel: true, glow: true
        });
        spray(hitX, hitY, rock.vx, rock.vy, Math.cos(a), Math.sin(a), 0.5, 2, {
            minSpeed: 10, maxSpeed: 40, minLife: 0.8, maxLife: 1.4, size: 5, color: dust, dust: true, alpha: 0.25
        });
    });

    if(result.pieces) {
        // Cut clean through: the halves replace the asteroid, with a long dust cloud and a
        // spray of rubble pixels along the cut, plus a crack of sparks from the core.
        result.pieces.forEach(piece => state.newRocks.push(piece));
        const a = result.pieces[0];
        const b = result.pieces[1];
        const cutX = -(b.y - a.y);
        const cutY = b.x - a.x;
        const cutLength = Math.sqrt(cutX * cutX + cutY * cutY) || 1;
        for(let i = 0; i < 16; i++) {
            const t = (Math.random() - 0.5) * 1.6;
            const x = rock.x + cutX / cutLength * rock.radius * t;
            const y = rock.y + cutY / cutLength * rock.radius * t;
            __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, x, y, rock.vx, rock.vy, 1, {
                minSpeed: 5, maxSpeed: 35, minLife: 1.2, maxLife: 2.6, size: 9, color: dust, dust: true, alpha: 0.26
            });
            __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, x, y, rock.vx, rock.vy, 3, {
                minSpeed: 20, maxSpeed: 110, minLife: 0.5, maxLife: 1.3, size: 1.8, color: i % 2 ? light : coreColor, pixel: true
            });
        }
        __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, hitX, hitY, rock.vx, rock.vy, 16, {
            minSpeed: 60, maxSpeed: 260, minLife: 0.2, maxLife: 0.6, size: 1.6, color: '255,230,170', pixel: true, glow: true
        });
        flash(rock.x, rock.y, rock.radius * 1.6, '255,225,190', 0.25);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].rockCrack();
    }

    if(result.crumbled) {
        // Falls apart into a cloud of rubble pixels and dust.
        __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 24, {
            minSpeed: 20, maxSpeed: 140, minLife: 0.5, maxLife: 1.3, size: 1.8, color: light, pixel: true, drag: 0.4
        });
        __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 14, {
            minSpeed: 20, maxSpeed: 120, minLife: 0.5, maxLife: 1.3, size: 2, color: coreColor, pixel: true, drag: 0.4
        });
        __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 10, {
            minSpeed: 5, maxSpeed: 45, minLife: 1.2, maxLife: 2.4, size: 8, color: dust, dust: true, alpha: 0.26, drag: 0.5
        });
        flash(rock.x, rock.y, rock.radius * 2.2, '255,225,190', 0.2);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].rockCrack();
    }
};

// Bounce two bodies off each other along the contact normal and push them apart.
const resolveImpact = (a, b, normalX, normalY, overlap, restitution) => {
    const inverseA = 1 / a.mass;
    const inverseB = 1 / b.mass;
    const totalInverse = inverseA + inverseB;

    a.x -= normalX * overlap * (inverseA / totalInverse);
    a.y -= normalY * overlap * (inverseA / totalInverse);
    b.x += normalX * overlap * (inverseB / totalInverse);
    b.y += normalY * overlap * (inverseB / totalInverse);

    const relativeSpeed = (b.vx - a.vx) * normalX + (b.vy - a.vy) * normalY;
    if(relativeSpeed >= 0) return 0;

    const impulse = -(1 + restitution) * relativeSpeed / totalInverse;
    a.vx -= impulse * inverseA * normalX;
    a.vy -= impulse * inverseA * normalY;
    b.vx += impulse * inverseB * normalX;
    b.vy += impulse * inverseB * normalY;
    return -relativeSpeed;
};

const bulletCollisions = () => {
    const { bullets, rocks } = state;

    bullets.forEach(bullet => {
        if(bullet.dead) return;
        for(let i = 0; i < rocks.length; i++) {
            const rock = rocks[i];
            if(rock.dead || !rock.containsPoint(bullet.x, bullet.y)) continue;

            // Find where the round actually crossed the visible outline this step.
            const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) || 1;
            const dirX = bullet.vx / speed;
            const dirY = bullet.vy / speed;
            const travel = speed * STEP + 2;
            const startX = bullet.x - dirX * travel;
            const startY = bullet.y - dirY * travel;
            const entry = rock.raycast(startX, startY, dirX, dirY, travel);
            bullet.x = entry === null ? bullet.x : startX + dirX * entry;
            bullet.y = entry === null ? bullet.y : startY + dirY * entry;

            bullet.dead = true;
            // Projectiles carry momentum and nudge the rock (capped so small chunks don't rocket off).
            const kick = Math.min(30, speed * bullet.mass / rock.mass);
            rock.vx += dirX * kick;
            rock.vy += dirY * kick;
            hitRock(rock, bullet.damage, bullet.x, bullet.y, dirX, dirY, bullet.kind);

            if(bullet.kind === 'plasma') {
                // Staff blast: fiery splash that also scorches nearby rocks.
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 26, {
                    minSpeed: 40, maxSpeed: 220, minLife: 0.25, maxLife: 0.7, size: 3.5, color: '255,170,60'
                });
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 10, {
                    minSpeed: 10, maxSpeed: 80, minLife: 0.15, maxLife: 0.35, size: 7, color: '255,240,200'
                });
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 20, {
                    minSpeed: 60, maxSpeed: 260, minLife: 0.25, maxLife: 0.7, size: 1.8, color: '255,180,70', pixel: true, glow: true, drag: 0.8
                });
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 5, {
                    minSpeed: 5, maxSpeed: 35, minLife: 1, maxLife: 2, size: 9, color: '120,100,90', dust: true, alpha: 0.25
                });
                rocks.forEach(other => {
                    if(other === rock || other.dead) return;
                    const ox = other.x - bullet.x;
                    const oy = other.y - bullet.y;
                    const reach = bullet.splash + other.radius;
                    if(ox * ox + oy * oy < reach * reach) hitRock(other, bullet.damage * 0.5, bullet.x, bullet.y, undefined, undefined, 'plasma');
                });
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].plasmaImpact();
            } else {
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].rockHit(rock.isCoreExposed(Math.atan2(bullet.y - rock.y, bullet.x - rock.x) - rock.angle));
            }
            return;
        }
    });
};

const explodeMissile = (missile) => {
    const drone = missile.kind === 'drone';
    const color = drone ? '255,225,140' : '255,160,80';
    // Hot sparks, a white flash, slow dust, and a shockwave ring sized to the blast.
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.15, missile.vy * 0.15, drone ? 34 : 30, {
        minSpeed: 40, maxSpeed: missile.blast * 4 + 80, minLife: 0.25, maxLife: 0.8, size: drone ? 3 : 3, color: color
    });
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, 0, 0, 8, {
        minSpeed: 5, maxSpeed: 60, minLife: 0.12, maxLife: 0.3, size: drone ? 10 : 8, color: '255,250,225'
    });
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, drone ? 8 : 6, {
        minSpeed: 10, maxSpeed: 50, minLife: 1, maxLife: 2, size: 11, color: '150,140,130', dust: true, alpha: 0.2
    });
    state.shockwaves.push({ x: missile.x, y: missile.y, radius: 4, maxRadius: missile.blast * 1.6, life: 1, color: drone ? '255,220,140' : '255,170,90' });
    // Pixel shrapnel and glowing embers flung out of the blast, plus a lingering smoke cloud.
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, drone ? 34 : 28, {
        minSpeed: 80, maxSpeed: missile.blast * 6 + 120, minLife: 0.3, maxLife: 0.9, size: 1.8, color: color, pixel: true, glow: true, drag: 0.8
    });
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, 14, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.6, maxLife: 1.4, size: 2.4, color: '255,120,40', pixel: true, glow: true, drag: 1.2
    });
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, 0, 0, 6, {
        minSpeed: 5, maxSpeed: 30, minLife: 1.5, maxLife: 2.8, size: 12, color: '110,100,95', dust: true, alpha: 0.22, drag: 0.6
    });
    if(drone) __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].droneImpact();
    else __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].missileExplosion();

    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const d = Object(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["b" /* delta */])(missile, rock);
        const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
        const reach = missile.blast + rock.radius;
        if(distance > reach) return;

        const falloff = 1 - distance / reach;
        const push = Math.min(70, MISSILE_PUSH * falloff / rock.mass);
        rock.vx += d.x / distance * push;
        rock.vy += d.y / distance * push;
        // Damage lands on the face of the rock nearest the blast.
        hitRock(rock, missile.damage * (0.35 + 0.65 * falloff),
            rock.x - d.x / distance * rock.radius, rock.y - d.y / distance * rock.radius);
    });
    blastCombat(missile);
};

const missileCollisions = () => {
    const { missiles, rocks } = state;

    missiles.forEach(missile => {
        if(!missile.dead) {
            for(let i = 0; i < rocks.length; i++) {
                const rock = rocks[i];
                if(rock.dead) continue;
                if(!rock.containsPoint(missile.x, missile.y, 3)) continue;
                missile.dead = true;
                missile.exploded = true;
                break;
            }
        }
        if(missile.dead && missile.exploded && !missile.handled) {
            missile.handled = true;
            explodeMissile(missile);
        }
    });
};

// Asteroids pulled together by gravity fuse when they touch: they lock together,
// share momentum, and the smaller one gradually sinks into the bigger one.
const startMerge = (a, b) => {
    const host = a.area >= b.area ? a : b;
    const guest = host === a ? b : a;

    const total = a.mass + b.mass;
    const vx = (a.vx * a.mass + b.vx * b.mass) / total;
    const vy = (a.vy * a.mass + b.vy * b.mass) / total;
    a.vx = b.vx = vx;
    a.vy = b.vy = vy;
    guest.spin = host.spin;

    const link = {
        host: host,
        guest: guest,
        t: 0,
        duration: 1.1 + guest.radius * 0.02,
        hostArea: host.area,
        guestArea: guest.area,
        offsetX: guest.x - host.x,
        offsetY: guest.y - host.y,
        dustTimer: 0
    };
    host.merging = link;
    guest.merging = link;
    state.mergeLinks.push(link);

    const distance = Math.sqrt(link.offsetX * link.offsetX + link.offsetY * link.offsetY) || 1;
    const contactX = host.x + link.offsetX / distance * host.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
    const contactY = host.y + link.offsetY / distance * host.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].mergeCloud(state.particles, contactX, contactY, host,
        Math.round(12 + guest.radius), guest.radius * 1.1, colorString(host.dustColor));
    flash(contactX, contactY, 30 + guest.radius, '255,220,180', 0.25);
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, contactX, contactY, host.vx, host.vy, 22, {
        minSpeed: 20, maxSpeed: 110, minLife: 0.6, maxLife: 1.5, size: 1.8, color: shadeString(host.dustColor, 1.2), pixel: true, drag: 0.4
    });
    const nx = link.offsetX / distance;
    const ny = link.offsetY / distance;
    spray(contactX, contactY, host.vx, host.vy, -ny, nx, 0.6, 8, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.4, maxLife: 1, size: 2, color: colorString(host.dustColor), solid: true
    });
    spray(contactX, contactY, host.vx, host.vy, ny, -nx, 0.6, 8, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.4, maxLife: 1, size: 2, color: colorString(host.dustColor), solid: true
    });
    __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].merge(Math.sqrt(host.area + guest.area));
};

const updateMerges = (dt) => {
    state.mergeLinks.forEach(link => {
        const host = link.host;
        const guest = link.guest;
        if(host.dead || guest.dead) {
            host.merging = null;
            guest.merging = null;
            link.done = true;
            return;
        }

        link.t += dt;
        const p = Math.min(1, link.t / link.duration);
        const k = p * p * (3 - 2 * p);   // smoothstep

        // Stay attached while the pair tumbles together.
        const turn = host.spin * dt;
        const cos = Math.cos(turn);
        const sin = Math.sin(turn);
        const ox = link.offsetX * cos - link.offsetY * sin;
        const oy = link.offsetX * sin + link.offsetY * cos;
        link.offsetX = ox;
        link.offsetY = oy;

        guest.x = host.x + ox * (1 - 0.85 * k);
        guest.y = host.y + oy * (1 - 0.85 * k);
        guest.vx = host.vx;
        guest.vy = host.vy;

        // Mass flows from the guest into the host.
        const target = link.guestArea * (1 - k);
        const moved = Math.max(0, guest.area - target);
        guest.setArea(Math.min(guest.area, target));
        host.setArea(host.area + moved);

        // Dust squeezed out along the seam, drawn back onto the surface.
        link.dustTimer -= dt;
        if(link.dustTimer <= 0 && p < 0.9) {
            link.dustTimer = 0.06;
            const distance = Math.sqrt(ox * ox + oy * oy) || 1;
            const along = (Math.random() - 0.5) * 1.2;
            const angle = Math.atan2(oy, ox) + along;
            const seamX = host.x + Math.cos(angle) * host.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
            const seamY = host.y + Math.sin(angle) * host.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
            __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].mergeCloud(state.particles, seamX, seamY, host, 2, guest.radius * 0.4 + 4, '170,160,148');
            if(distance < 1) link.dustTimer = 1;
        }

        if(p >= 1) {
            host.finishMerge(guest, link.hostArea, link.guestArea, Math.atan2(oy, ox));
            guest.dead = true;
            host.merging = null;
            link.done = true;
        }
    });
    state.mergeLinks = state.mergeLinks.filter(link => !link.done);
};

const rockCollisions = () => {
    const { rocks } = state;

    for(let i = 0; i < rocks.length; i++) {
        const a = rocks[i];
        if(a.dead) continue;

        for(let j = i + 1; j < rocks.length; j++) {
            const b = rocks[j];
            if(b.dead) continue;
            if(a.merging && a.merging === b.merging) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const reach = (a.radius + b.radius) * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
            const distSq = dx * dx + dy * dy;
            if(distSq > reach * reach) continue;

            const distance = Math.sqrt(distSq) || 0.001;
            const normalX = dx / distance;
            const normalY = dy / distance;
            const combinedRadius = Math.sqrt(a.area + b.area);

            // Fresh fragments, busy pairs and oversized bodies just rest against each other.
            if(a.grace > 0 || b.grace > 0 || a.merging || b.merging || combinedRadius > __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["a" /* MAX_MERGE_RADIUS */]) {
                const impact = resolveImpact(a, b, normalX, normalY, reach - distance, ROCK_BOUNCE);
                if(impact > 30) {
                    // Grinding knock: grit and dust thrown out sideways from the contact.
                    const cx = a.x + normalX * a.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
                    const cy = a.y + normalY * a.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
                    const dust = colorString(a.dustColor);
                    spray(cx, cy, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2, -normalY, normalX, 0.5, 4, {
                        minSpeed: 20, maxSpeed: 40 + impact, minLife: 0.3, maxLife: 0.8, size: 1.8, color: dust, solid: true
                    });
                    spray(cx, cy, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2, normalY, -normalX, 0.5, 4, {
                        minSpeed: 20, maxSpeed: 40 + impact, minLife: 0.3, maxLife: 0.8, size: 1.8, color: dust, solid: true
                    });
                    spray(cx, cy, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2, -normalY, normalX, Math.PI, 3, {
                        minSpeed: 5, maxSpeed: 25, minLife: 1, maxLife: 2, size: 9, color: dust, dust: true, alpha: 0.22
                    });
                    flash(cx, cy, 20 + impact * 0.3, '255,225,190', 0.12);
                }
                continue;
            }

            startMerge(a, b);
            break;
        }
    }
};

const shipCollisions = (ship) => {
    const { rocks, particles } = state;
    if(!ship.alive || (ship === state.ship && state.transition)) return;

    rocks.forEach(rock => {
        if(rock.dead) return;
        const rockRadius = rock.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];

        // Broad phase against the whole ship first.
        const center = Object(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["b" /* delta */])(ship, rock);
        const reach = ship.radius * 1.5 + rockRadius;
        if(center.x * center.x + center.y * center.y > reach * reach) return;

        // Raised shields: asteroids bounce off the bubble, never reaching the hull.
        if(ship.shieldUp) {
            const contact = ship.shieldContact(rock.x, rock.y, rockRadius);
            if(!contact) return;
            const impactSpeed = resolveImpact(ship, rock, contact.nx, contact.ny, contact.overlap, SHIP_RESTITUTION);
            if(impactSpeed > 15) {
                const damage = 2 + impactSpeed * rock.mass / 6000;
                ship.takeDamage(damage, particles, contact.x, contact.y);
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(particles, contact.x, contact.y, rock.vx, rock.vy, 6, {
                    minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2,
                    color: ship.hullDef.shieldColor || '120,210,255'
                });
            }
            return;
        }

        const colliders = ship.worldColliders();
        for(let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const d = Object(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["b" /* delta */])(c, rock);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = c.r + rockRadius - distance;
            if(overlap <= 0) continue;

            const impactSpeed = resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);
            const damage = 4 + impactSpeed * rock.mass / 6000;

            if(impactSpeed > 25 && ship.takeDamage(damage, particles)) {
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].explosion(0.6);
                // Ramming chips the asteroid too.
                hitRock(rock, 1 + impactSpeed * ship.mass / 30000, c.x + d.x / distance * c.r, c.y + d.y / distance * c.r);
            }
            return;
        }
    });
};


// ---------------------------------------------------------------- combat

// Who can be shot at, refreshed once per physics step. Ships ask `state.combat` for their
// targets: the player's weapons go for enemy ships, enemy weapons for the player.
const combat = {
    enemies: [],
    player: [],
    missiles: { player: [], enemy: [] },
    refresh() {
        this.enemies = state.enemies.filter(e => e.alive);
        const ship = state.ship;
        this.player = ship.alive && !ship.hidden && !state.transition ? [ship] : [];
        this.missiles.player = state.missiles.filter(m => !m.dead && m.side === 'player');
        this.missiles.enemy = state.missiles.filter(m => !m.dead && m.side === 'enemy');
    },
    hostileShips(side) {
        return side === 'player' ? this.enemies : this.player;
    },
    // Missiles / drones fired by the other side (optionally only one kind).
    hostileMissiles(side, kind) {
        const list = side === 'player' ? this.missiles.enemy : this.missiles.player;
        return kind ? list.filter(m => m.kind === kind && !m.dead) : list;
    }
};

// Does a point (with radius `pad`) touch a ship: its shield bubble when raised, otherwise
// its hull colliders? Returns the contact point or null.
const shipHitAt = (ship, x, y, pad) => {
    const dx = x - ship.x;
    const dy = y - ship.y;
    const broad = ship.radius * 1.7 + pad;
    if(dx * dx + dy * dy > broad * broad) return null;
    if(ship.shieldUp) {
        const contact = ship.shieldContact(x, y, pad);
        return contact ? { x: x, y: y, shield: true } : null;
    }
    const colliders = ship.worldColliders();
    for(let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        const cx = x - c.x;
        const cy = y - c.y;
        if(cx * cx + cy * cy < (c.r + pad) * (c.r + pad)) return { x: x, y: y, shield: false };
    }
    return null;
};

const impactSparks = (x, y, ship, kind, shield) => {
    const color = shield ? (ship.hullDef.shieldColor || '120,210,255') : kind === 'plasma' ? '255,170,60' : '255,220,160';
    __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, x, y, ship.vx, ship.vy, kind === 'plasma' ? 16 : 5, {
        minSpeed: 40, maxSpeed: kind === 'plasma' ? 220 : 160, minLife: 0.15, maxLife: 0.45, size: 1.8, color: color, pixel: true, glow: true, drag: 0.8
    });
    if(kind === 'plasma') {
        __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, x, y, ship.vx, ship.vy, 6, {
            minSpeed: 10, maxSpeed: 70, minLife: 0.12, maxLife: 0.3, size: 7, color: '255,240,200'
        });
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].plasmaImpact();
    }
};

// Blow a missile / drone up right away (it is removed at the end of this step).
const detonate = (missile) => {
    if(missile.handled) return;
    missile.dead = true;
    missile.exploded = true;
    missile.handled = true;
    explodeMissile(missile);
};

// Shots against ships, guns shooting down missiles, and missiles/drones meeting their targets.
const combatCollisions = () => {
    const { bullets, missiles, particles } = state;
    combat.refresh();
    if(!combat.enemies.length && !combat.missiles.enemy.length) return;

    // Ships bump off each other instead of overlapping.
    const ships = combat.player.concat(combat.enemies);
    for(let i = 0; i < ships.length; i++) {
        for(let j = i + 1; j < ships.length; j++) {
            const a = ships[i];
            const b = ships[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
            const overlap = (a.radius + b.radius) * 0.7 - distance;
            if(overlap > 0) resolveImpact(a, b, dx / distance, dy / distance, overlap, 0.3);
        }
    }

    bullets.forEach(bullet => {
        if(bullet.dead) return;
        const targets = combat.hostileShips(bullet.side);
        for(let i = 0; i < targets.length; i++) {
            const ship = targets[i];
            // Staff bolts burst on proximity, so they also catch slim hulls.
            const hit = shipHitAt(ship, bullet.x, bullet.y, bullet.kind === 'plasma' ? Math.max(8, bullet.splash * 0.4) : 2);
            if(!hit) continue;
            bullet.dead = true;
            ship.takeDamage(bullet.damage * __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["b" /* SHIP_DAMAGE */][bullet.kind], particles, hit.x, hit.y, __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* DAMAGE_TYPE */][bullet.kind]);
            const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) || 1;
            const kick = bullet.mass * 6 / ship.stats.mass;
            ship.vx += bullet.vx / speed * kick;
            ship.vy += bullet.vy / speed * kick;
            impactSparks(hit.x, hit.y, ship, bullet.kind, hit.shield);
            return;
        }
        // Kinetic rounds can shoot down missiles (never drones).
        if(bullet.kind !== 'bullet') return;
        const incoming = combat.hostileMissiles(bullet.side, 'missile');
        for(let i = 0; i < incoming.length; i++) {
            const missile = incoming[i];
            if(missile.dead) continue;
            const mx = missile.x - bullet.x;
            const my = missile.y - bullet.y;
            if(mx * mx + my * my > 11 * 11) continue;
            bullet.dead = true;
            missile.damage *= 0.3;     // shot down early: only a weak blast
            detonate(missile);
            return;
        }
    });

    missiles.forEach(missile => {
        if(missile.dead || missile.launchDelay > 0) return;
        // Contact, or the proximity fuse: detonate once inside part of the blast radius.
        const targets = combat.hostileShips(missile.side);
        for(let i = 0; i < targets.length; i++) {
            if(shipHitAt(targets[i], missile.x, missile.y, Math.max(4, missile.blast * 0.45))) {
                detonate(missile);
                return;
            }
        }
        // Drones intercept drones head-on.
        if(missile.kind === 'drone') {
            const drones = combat.hostileMissiles(missile.side, 'drone');
            for(let i = 0; i < drones.length; i++) {
                const other = drones[i];
                if(other.dead) continue;
                const dx = other.x - missile.x;
                const dy = other.y - missile.y;
                if(dx * dx + dy * dy < 14 * 14) {
                    detonate(missile);
                    detonate(other);
                    return;
                }
            }
        }
    });
};

// Blast damage to ships of the other side, and blasts destroying the other side's missiles
// (missile blasts stop missiles, drone blasts stop drones).
const blastCombat = (missile) => {
    const type = __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* DAMAGE_TYPE */][missile.kind];
    combat.hostileShips(missile.side).forEach(ship => {
        const dx = ship.x - missile.x;
        const dy = ship.y - missile.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const reach = missile.blast + ship.radius * 0.8;
        if(distance > reach) return;
        const falloff = 1 - distance / reach;
        ship.takeDamage(missile.damage * __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["b" /* SHIP_DAMAGE */][missile.kind] * (0.4 + 0.6 * falloff), state.particles,
            missile.x + dx / distance * Math.min(distance, 6), missile.y + dy / distance * Math.min(distance, 6), type);
        const push = Math.min(40, MISSILE_PUSH * 0.4 * falloff / ship.mass);
        ship.vx += dx / distance * push;
        ship.vy += dy / distance * push;
    });
    combat.hostileMissiles(missile.side, missile.kind).forEach(other => {
        if(other.dead) return;
        const dx = other.x - missile.x;
        const dy = other.y - missile.y;
        const reach = missile.blast * 1.1;
        if(dx * dx + dy * dy > reach * reach) return;
        other.dead = true;
        other.exploded = true;
        other.damage *= 0.3;
        other.handled = true;
        explodeMissile(other);
    });
};

// Homing missiles and drones pick ship targets: drones always hunt hostile drones first.
const retargetMissiles = (dt) => {
    state.missiles.forEach(missile => {
        if(missile.dead || missile.homing <= 0) return;
        missile.retargetTimer = (missile.retargetTimer || 0) - dt;
        if(missile.retargetTimer > 0 && missile.target && !missile.target.dead) return;
        missile.retargetTimer = 0.25;
        const near = (list, range) => {
            let best = null;
            let bestDist = range * range;
            list.forEach(item => {
                if(item.dead) return;
                const d = (item.x - missile.x) * (item.x - missile.x) + (item.y - missile.y) * (item.y - missile.y);
                if(d < bestDist) {
                    bestDist = d;
                    best = item;
                }
            });
            return best;
        };
        if(missile.kind === 'drone') {
            const drone = near(combat.hostileMissiles(missile.side, 'drone'), 900);
            if(drone) {
                missile.target = drone;
                return;
            }
        }
        // Hostile ships take priority over asteroids (unless set to asteroids only).
        if(missile.targetMode !== 'asteroids' && (!missile.target || missile.target.dead || !missile.target.hullDef)) {
            const ship = near(combat.hostileShips(missile.side), missile.kind === 'drone' ? 1300 : 900);
            if(ship) missile.target = ship;
            else if(missile.target && missile.target.dead) missile.target = null;
        }
    });
};

// Enemy ships: spawning, AI and clean-up.
const spawnEnemy = (hullId, level, near) => {
    const ship = state.ship;
    for(let attempt = 0; attempt < 12; attempt++) {
        const a = Math.random() * Math.PI * 2;
        const d = near ? 700 + Math.random() * 300 : 2100 + Math.random() * 600;
        const x = ship.x + Math.cos(a) * d;
        const y = ship.y + Math.sin(a) * d;
        if(state.system.station && Math.sqrt((x - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x) * (x - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x) + (y - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y) * (y - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y)) < 3200 && !near) continue;
        const enemy = Object(__WEBPACK_IMPORTED_MODULE_1__components_ship_enemy__["b" /* createEnemy */])(hullId || Object(__WEBPACK_IMPORTED_MODULE_1__components_ship_enemy__["e" /* pickEnemyHull */])(state.system.id), level || (Math.random() < 0.35 ? 3 : 2), x, y);
        enemy.angle = Math.atan2(ship.y - y, ship.x - x);
        state.enemies.push(enemy);
        // Death Gliders fly as a pair.
        if(enemy.hullDef.id === 'glider' && !hullId) {
            const wing = Object(__WEBPACK_IMPORTED_MODULE_1__components_ship_enemy__["b" /* createEnemy */])('glider', enemy.level, x + 90, y + 60);
            wing.angle = enemy.angle;
            state.enemies.push(wing);
        }
        banner('Hostile ' + enemy.hullDef.name + (enemy.hullDef.id === 'glider' && !hullId ? ' pair' : '') + ' detected (Mk ' + (enemy.level === 3 ? 'III' : 'II') + ')', 2.5);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].scanPing();
        return enemy;
    }
    return null;
};

const updateEnemies = (dt) => {
    const ship = state.ship;
    // New contacts turn up every so often, up to the system's limit.
    if(!state.transition) {
        state.enemyTimer -= dt;
        if(state.enemyTimer <= 0) {
            state.enemyTimer = 35 + Math.random() * 35;
            if(state.enemies.length < Object(__WEBPACK_IMPORTED_MODULE_1__components_ship_enemy__["c" /* enemyConfig */])(state.system.id).max) spawnEnemy();
        }
    }
    const target = combat.player[0] || null;
    const avoid = state.system.station ? { x: __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x, y: __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y, radius: __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].shieldRadius + 260 } : null;
    state.enemies.forEach(enemy => {
        const dx = ship.x - enemy.x;
        const dy = ship.y - enemy.y;
        const inRange = target && dx * dx + dy * dy < 3600 * 3600;
        Object(__WEBPACK_IMPORTED_MODULE_1__components_ship_enemy__["f" /* updateEnemyAI */])(enemy, dt, inRange ? target : null, state.rocks, combat.missiles.player, combat.enemies, avoid);
        enemy.update(dt, enemy.ai.input, state);
    });
};

// Destroyed enemies pay their bounty; ones left far behind are dropped.
const updateEnemyLosses = () => {
    const ship = state.ship;
    state.enemies.forEach(enemy => {
        if(enemy.alive || enemy.counted) return;
        enemy.counted = true;
        Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["b" /* addCredits */])(enemy.bounty);
        floatText(enemy.x, enemy.y - enemy.radius, '+' + enemy.bounty + ' cr', '255,215,120');
        banner(enemy.hullDef.name + ' destroyed  +' + enemy.bounty + ' credits', 2.2);
        state.shockwaves.push({ x: enemy.x, y: enemy.y, radius: 6, maxRadius: 90 + enemy.radius * 2.5, life: 1, color: '255,190,110' });
        flash(enemy.x, enemy.y, 120 + enemy.radius * 3, '255,220,170', 0.4);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].missileExplosion();
    });
    state.enemies = state.enemies.filter(enemy => {
        if(!enemy.alive) return false;
        const dx = enemy.x - ship.x;
        const dy = enemy.y - ship.y;
        return dx * dx + dy * dy < 7000 * 7000;
    });
};

// Atlantis city shield: asteroids bounce off it, ships, shots and ore pass through.
const cityShield = (dt) => {
    const R = __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].shieldRadius;
    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const dx = rock.x - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x;
        const dy = rock.y - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const r = rock.radius * __WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["b" /* VISUAL_RADIUS */];
        if(distance > R + r || distance < R - r - 40) return;

        const nx = dx / distance;
        const ny = dy / distance;
        rock.x = __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x + nx * (R + r);
        rock.y = __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y + ny * (R + r);
        const inward = rock.vx * nx + rock.vy * ny;
        if(inward < 0) {
            rock.vx -= 1.6 * inward * nx;
            rock.vy -= 1.6 * inward * ny;
            const strength = Math.min(1.5, 0.3 + -inward / 80 + r / 60);
            __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts.push({ angle: Math.atan2(ny, nx), life: 1, strength: strength });
            if(__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts.length > 10) __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts.shift();
            __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x + nx * R, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y + ny * R, rock.vx * 0.3, rock.vy * 0.3, 10, {
                minSpeed: 30, maxSpeed: 140, minLife: 0.2, maxLife: 0.6, size: 2.5, color: '170,220,255'
            });
            const sdx = state.ship.x - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x - nx * R;
            const sdy = state.ship.y - __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y - ny * R;
            const near = 1 - Math.min(1, Math.sqrt(sdx * sdx + sdy * sdy) / 1400);
            if(near > 0) __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].cityShield(0.25 * near * strength);
        }
    });
    __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts.forEach(impact => { impact.life -= dt * 0.8; });
    __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts = __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts.filter(impact => impact.life > 0);
};

const collectOre = (dt) => {
    const ship = state.ship;
    const cargoFull = Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["d" /* cargoUsed */])() >= ship.cargoCapacity;
    if(state.cargoFullTimer > 0) state.cargoFullTimer -= dt;
    if(state.shieldHintTimer > 0) state.shieldHintTimer -= dt;

    const shielded = ship.shieldUp;

    state.ores.forEach(ore => {
        if(ore.dead) return;

        if(shielded) {
            // Raised shields block the tractor beam and vaporise ore that touches them.
            ore.update(dt, ship, false);
            const contact = ore.ejectTimer <= 0 && ship.shieldContact(ore.x, ore.y, ore.radius);
            if(contact) {
                ore.dead = true;
                ship.absorbOre(contact.x, contact.y);
                // Same impact as an asteroid striking the shield, just smaller.
                const shieldColor = ship.hullDef.shieldColor || '120,210,255';
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 6, {
                    minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2, color: shieldColor
                });
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 4, {
                    minSpeed: 20, maxSpeed: 80, minLife: 0.2, maxLife: 0.45, size: 2, color: __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][ore.material].color
                });
                if(state.shieldHintTimer <= 0) {
                    state.shieldHintTimer = 8;
                    banner('Shields up: ore burns up! Lower shields (H) to collect.', 2.5);
                }
            }
            return;
        }

        const wasHeld = ore.tractored;
        const collected = ore.update(dt, ship, !cargoFull);
        if(ore.tractored && !wasHeld) __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].tractorLock();
        if(!collected) return;

        if(Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["u" /* storeOre */])(ore.material, ship.cargoCapacity)) {
            ore.dead = true;
            const material = __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][ore.material];
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].pickup(material.price);
            floatText(ship.x, ship.y - ship.radius - 6, '+1 ' + material.name, material.color);
        } else if(state.cargoFullTimer <= 0) {
            state.cargoFullTimer = 4;
            banner('Cargo hold full! Return to the shipyard to sell.', 2.5);
        }
    });

    if(cargoFull && state.cargoFullTimer <= 0 && state.ores.some(o => !o.dead)) {
        state.cargoFullTimer = 6;
        banner('Cargo hold full! Return to the shipyard to sell.', 2.5);
    }
};

const step = (dt) => {
    const { ship, bullets, missiles, particles } = state;
    state.time += dt;

    // Mouse is in screen space; turrets need it in world space.
    __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].aimX = (__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].mouseX - __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2) / zoom + state.camera.x;
    __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].aimY = (__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].mouseY - __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2) / zoom + state.camera.y;

    combat.refresh();
    ship.update(dt, __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */], state);
    updateEnemies(dt);
    retargetMissiles(dt);
    state.beamHits.forEach(hit => {
        if(hit.ship) {
            hit.ship.takeDamage(hit.damage * __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["b" /* SHIP_DAMAGE */].beam, state.particles, hit.x, hit.y, 'energy', true);
            if(Math.random() < 0.3) {
                __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, hit.x, hit.y, hit.ship.vx, hit.ship.vy, 1, {
                    minSpeed: 40, maxSpeed: 160, minLife: 0.15, maxLife: 0.4, size: 2, color: '190,230,255'
                });
            }
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].beamImpact();
            return;
        }
        const push = Math.min(0.6, 900 * hit.damage / hit.rock.mass);
        hit.rock.vx += hit.dirX * push;
        hit.rock.vy += hit.dirY * push;
        hitRock(hit.rock, hit.damage, hit.x, hit.y, hit.dirX, hit.dirY, 'beam');
        if(Math.random() < 0.35) {
            __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */].burst(state.particles, hit.x, hit.y, hit.rock.vx - hit.dirX * 60, hit.rock.vy - hit.dirY * 60, 1, {
                minSpeed: 40, maxSpeed: 160, minLife: 0.15, maxLife: 0.4, size: 2, color: '190,230,255'
            });
        }
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].beamImpact();
    });
    state.beamHits = [];
    applyGravity(dt);

    state.rocks.forEach(rock => rock.update(dt));
    updateMerges(dt);
    state.shockwaves.forEach(wave => {
        wave.life -= dt * 2.2;
        wave.radius += (wave.maxRadius - wave.radius) * Math.min(1, dt * 9);
    });
    state.shockwaves = state.shockwaves.filter(wave => wave.life > 0);
    state.flashes.forEach(f => { f.life -= dt; });
    state.flashes = state.flashes.filter(f => f.life > 0);
    state.ores.forEach(ore => {
        if(ore.trail > 0) {
            ore.trail -= dt;
            if(Math.random() < 0.7) {
                state.particles.push(new __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */]({
                    x: ore.x, y: ore.y, vx: ore.vx * 0.2, vy: ore.vy * 0.2,
                    life: 0.25 + Math.random() * 0.2, size: 2, color: __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][ore.material].color
                }));
            }
        }
    });
    updateScanner(dt);
    if(state.system.station) cityShield(dt);
    state.gate.update(dt);
    checkGateTravel(dt);
    bullets.forEach(bullet => {
        if(bullet.kind === 'plasma' && Math.random() < 0.6) {
            state.particles.push(new __WEBPACK_IMPORTED_MODULE_3__components_particle_particle__["a" /* default */]({
                x: bullet.x, y: bullet.y,
                vx: bullet.vx * 0.15 + (Math.random() - 0.5) * 40, vy: bullet.vy * 0.15 + (Math.random() - 0.5) * 40,
                life: 0.2 + Math.random() * 0.25, size: 3, color: Math.random() < 0.5 ? '255,140,40' : '255,210,110'
            }));
        }
    });
    bullets.forEach(bullet => bullet.update(dt));
    missiles.forEach(missile => missile.update(dt, state.rocks, particles));
    particles.forEach(particle => particle.update(dt));
    collectOre(dt);
    state.floatingTexts.forEach(text => {
        text.life -= dt;
        text.y -= 30 * dt;
    });

    bulletCollisions();
    missileCollisions();
    rockCollisions();
    shipCollisions(ship);
    state.enemies.forEach(enemy => shipCollisions(enemy));
    combatCollisions();
    updateEnemyLosses();

    // Remove dead objects only after all iteration is done (no splicing mid-loop).
    state.rocks = state.rocks.filter(rock => !rock.dead).concat(state.newRocks);
    state.newRocks = [];
    state.bullets = bullets.filter(bullet => !bullet.dead);
    state.missiles = missiles.filter(missile => !missile.dead);
    state.particles = particles.filter(particle => !particle.dead);
    state.ores = state.ores.filter(ore => !ore.dead);
    state.floatingTexts = state.floatingTexts.filter(text => text.life > 0);
    let dustCount = 0;
    state.particles.forEach(particle => { if(particle.dust) dustCount++; });
    if(dustCount > MAX_DUST) {
        let excess = dustCount - MAX_DUST;
        state.particles = state.particles.filter(particle => !(particle.dust && excess-- > 0));
    }
    // On slower computers the cap shrinks with the frame rate, thinning effects instead of stuttering.
    const particleCap = fps < 30 ? 800 : fps < 45 ? 1100 : MAX_PARTICLES;
    if(state.particles.length > particleCap) {
        state.particles = state.particles.slice(state.particles.length - particleCap);
    }

    // Stream the endless map in and out around the ship.
    state.sectorTimer -= dt;
    if(state.sectorTimer <= 0) {
        state.sectorTimer = SECTOR_UPDATE_INTERVAL;
        state.rocks = state.sectors.update(ship.x, ship.y, state.rocks, sectorRadius());
        state.ores = state.ores.filter(ore => Math.abs(ore.x - ship.x) < 5000 && Math.abs(ore.y - ship.y) < 5000);
    }

    // Camera leads slightly in the direction of travel.
    const followRate = Math.min(1, dt * 4);
    state.camera.x += (ship.x + ship.vx * 0.25 - state.camera.x) * followRate;
    state.camera.y += (ship.y + ship.vy * 0.25 - state.camera.y) * followRate;

    state.canDock = !!state.system.station && ship.alive && distanceToStation() < __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].dockRadius;
    const dhd = state.gate.dhd;
    state.nearDHD = ship.alive && Math.sqrt((ship.x - dhd.x) * (ship.x - dhd.x) + (ship.y - dhd.y) * (ship.y - dhd.y)) < __WEBPACK_IMPORTED_MODULE_14__world_stargate__["b" /* DHD_RANGE */];
    if(state.bannerTimer > 0) state.bannerTimer -= dt;
    if(!ship.alive) state.gameOverTimer += dt;
};

// ---------------------------------------------------------------- star systems & travel

// Load a star system: new fields, gate and backdrop. `how` is 'gate' (emerge from the
// destination gate) or 'hyper' (drop out of hyperspace near the gate).
const enterSystem = (system, how) => {
    state.system = system;
    state.gate = new __WEBPACK_IMPORTED_MODULE_14__world_stargate__["e" /* default */](system.gate.x, system.gate.y);
    state.sectors = makeSectors(system);
    ['rocks', 'newRocks', 'bullets', 'missiles', 'particles', 'ores', 'mergeLinks', 'flashes', 'shockwaves', 'beamHits', 'floatingTexts', 'enemies']
        .forEach(key => { state[key] = []; });
    state.scan.target = null;
    state.scan.pings = [];
    state.enemyTimer = 20 + Math.random() * 15;
    __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].impacts = [];

    const ship = state.ship;
    const gate = state.gate;
    if(how === 'gate') {
        ship.x = gate.x;
        ship.y = gate.y;
        ship.angle = -Math.PI / 2;
        ship.vx = 0;
        ship.vy = -150;
        gate.incoming();
    } else {
        const a = Math.random() * Math.PI * 2;
        ship.x = gate.x + Math.cos(a) * 1300;
        ship.y = gate.y + Math.sin(a) * 1300;
        ship.angle = a + Math.PI;
        ship.vx = Math.cos(ship.angle) * 220;
        ship.vy = Math.sin(ship.angle) * 220;
    }
    ship.angularVelocity = 0;
    state.camera.x = ship.x;
    state.camera.y = ship.y;
    state.rocks = state.sectors.update(ship.x, ship.y, [], sectorRadius());
    banner('Arrived at ' + system.name, 2.5);
};

// Flying into an open, outgoing wormhole starts the trip (if the ship fits).
const checkGateTravel = (dt) => {
    const ship = state.ship;
    const gate = state.gate;
    if(state.tooBigTimer > 0) state.tooBigTimer -= dt;
    if(state.transition || !ship.alive || !gate.isOpen || !gate.outgoing) return;
    const dx = ship.x - gate.x;
    const dy = ship.y - gate.y;
    if(dx * dx + dy * dy > Math.pow(__WEBPACK_IMPORTED_MODULE_14__world_stargate__["c" /* GATE_INNER */] * 0.8, 2)) return;
    if(ship.radius > __WEBPACK_IMPORTED_MODULE_14__world_stargate__["c" /* GATE_INNER */] * 0.95) {
        if(state.tooBigTimer <= 0) {
            state.tooBigTimer = 3;
            banner('Ship too large for the Stargate: use a hyperdrive.', 2.5);
        }
        return;
    }
    startTransition({ type: 'gate', phase: 'enter', t: 0, target: Object(__WEBPACK_IMPORTED_MODULE_13__world_systems__["g" /* systemById */])(gate.target) });
    __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].gateEnter();
};

const startTransition = (transition) => {
    state.transition = transition;
    __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].enabled = false;
    if(transition.type === 'hyper') __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].hyperOpen();
};

const startHyperjump = (target) => {
    const ship = state.ship;
    const distance = Object(__WEBPACK_IMPORTED_MODULE_13__world_systems__["f" /* distanceBetween */])(state.system.id, target.id);
    const duration = Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["b" /* hyperTravelTime */])(distance, ship.hyperdrive.speed);
    startTransition({
        type: 'hyper', phase: 'window', t: 0, target: target, duration: duration, distance: distance,
        wx: ship.x + Math.cos(ship.angle) * (ship.radius + 260),
        wy: ship.y + Math.sin(ship.angle) * (ship.radius + 260),
        size: Math.max(90, ship.radius * 2.4)
    });
    banner('Hyperdrive engaged: ' + target.name, 2);
};

const TUNNEL_PHASES = { tunnel: true, travel: true };

// Advance a gate trip or hyperspace jump. Returns true while the world is hidden.
const updateTransition = (dt) => {
    const tr = state.transition;
    const ship = state.ship;
    tr.t += dt;

    if(tr.type === 'gate') {
        if(tr.phase === 'enter') {
            // Pulled into the horizon.
            ship.vx += (state.gate.x - ship.x) * dt * 6;
            ship.vy += (state.gate.y - ship.y) * dt * 6;
            if(tr.t > 0.25) ship.hidden = true;
            if(tr.t >= 0.5) {
                tr.phase = 'tunnel';
                tr.t = 0;
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].stopAll();
                state.gate.close(true);
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].wormhole();
            }
        } else if(tr.phase === 'tunnel' && tr.t >= 3.4) {
            enterSystem(tr.target, 'gate');
            ship.hidden = false;
            tr.phase = 'exit';
            tr.t = 0;
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].startEngine();
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].gateArrive();
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].horizon(true);
        } else if(tr.phase === 'exit' && tr.t >= 0.8) {
            state.transition = null;
            __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].enabled = true;
        }
    } else {
        if(tr.phase === 'window') {
            // The window opens ahead; the ship surges into it.
            tr.open = Math.min(1, tr.t / 1);
            if(tr.t > 0.7) {
                const dx = tr.wx - ship.x;
                const dy = tr.wy - ship.y;
                const d = Math.sqrt(dx * dx + dy * dy) || 1;
                ship.vx += dx / d * 900 * dt;
                ship.vy += dy / d * 900 * dt;
                if(d < tr.size * 0.4) ship.hidden = true;
            }
            if(tr.t >= 2.2) {
                ship.hidden = true;
                tr.phase = 'travel';
                tr.t = 0;
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].stopAll();
                __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].hyperTravel(true);
            }
        } else if(tr.phase === 'travel' && tr.t >= tr.duration) {
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].hyperTravel(false);
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].hyperExit();
            enterSystem(tr.target, 'hyper');
            tr.phase = 'exit';
            tr.t = 0;
            tr.wx = ship.x - Math.cos(ship.angle) * 30;
            tr.wy = ship.y - Math.sin(ship.angle) * 30;
            ship.hidden = false;
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].startEngine();
        } else if(tr.phase === 'exit') {
            tr.open = Math.max(0, 1 - tr.t / 1.6);
            if(tr.t >= 1.6) {
                state.transition = null;
                __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].enabled = true;
            }
        }
    }
    return !!TUNNEL_PHASES[tr.phase];
};

// ---------------------------------------------------------------- render

const hash = (x, y, salt) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const STAR_LAYERS = [
    { factor: 0.1, cell: 180, size: 1, alpha: 0.45 },
    { factor: 0.3, cell: 240, size: 1.4, alpha: 0.65 },
    { factor: 0.6, cell: 320, size: 2, alpha: 0.9 }
];

// Parallax starfield generated from the camera position, so it never runs out.
const drawStarfield = () => {
    const w = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width;
    const h = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height;
    STAR_LAYERS.forEach((layer, index) => {
        const offsetX = state.camera.x * layer.factor;
        const offsetY = state.camera.y * layer.factor;
        const startX = Math.floor((offsetX - w / 2) / layer.cell);
        const startY = Math.floor((offsetY - h / 2) / layer.cell);
        const endX = Math.floor((offsetX + w / 2) / layer.cell);
        const endY = Math.floor((offsetY + h / 2) / layer.cell);
        ctx.fillStyle = 'rgba(220, 230, 255, ' + layer.alpha + ')';
        for(let cx = startX; cx <= endX; cx++) {
            for(let cy = startY; cy <= endY; cy++) {
                for(let s = 0; s < 2; s++) {
                    const x = (cx + hash(cx, cy, index * 7 + s)) * layer.cell - offsetX + w / 2;
                    const y = (cy + hash(cy, cx, index * 13 + s + 3)) * layer.cell - offsetY + h / 2;
                    ctx.fillRect(x, y, layer.size, layer.size);
                }
            }
        }
    });
};

const isVisible = (x, y, r) => {
    const halfW = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / (2 * zoom) + r;
    const halfH = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / (2 * zoom) + r;
    return Math.abs(x - state.camera.x) < halfW && Math.abs(y - state.camera.y) < halfH;
};

const drawCrosshair = () => {
    const x = __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].mouseX;
    const y = __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].mouseY;
    ctx.strokeStyle = 'rgba(255, 90, 90, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.moveTo(x - 13, y); ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4, y); ctx.lineTo(x + 13, y);
    ctx.moveTo(x, y - 13); ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 13);
    ctx.stroke();
};

// Guidance overlay: green brackets on turret targets, red diamond on the missile lock.
const drawTargeting = (time) => {
    const ship = state.ship;
    if(!ship.alive || !ship.guidance) return;

    ctx.save();
    ctx.lineWidth = 1.5;

    const targets = [];
    ship.turrets.forEach(turret => {
        if(turret.target && targets.indexOf(turret.target) === -1) targets.push(turret.target);
    });

    ctx.strokeStyle = 'rgba(140, 255, 160, 0.85)';
    targets.forEach(rock => {
        const r = rock.radius + 6;
        const c = r * 0.45;
        ctx.beginPath();
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(corner => {
            const x = rock.x + corner[0] * r;
            const y = rock.y + corner[1] * r;
            ctx.moveTo(x - corner[0] * c, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y - corner[1] * c);
        });
        ctx.stroke();
    });

    const lock = ship.missileLock;
    if(lock && ship.launchers.length > 0) {
        const r = lock.radius + 12;
        ctx.strokeStyle = 'rgba(255, 110, 110, 0.9)';
        ctx.translate(lock.x, lock.y);
        ctx.rotate(time * 2);
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.lineTo(0, -r);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
};

// Tractor beam: a soft cone from the emitter to each ore piece it holds, with energy
// rings travelling down the beam, glowing motes flowing in, a spinning containment
// ring around the ore, and a pulsing aura and scan arcs around the ship.
const TRACTOR = '120,255,230';

const drawTractor = (time) => {
    const ship = state.ship;
    const held = state.ores.filter(ore => ore.tractored && !ore.dead);
    state.tractorActive = held.length > 0;
    state.tractorCount = held.length;
    if(!held.length || !ship.alive) return;

    const emitter = ship.tractorEmitter();
    const glow = Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["d" /* glowSprite */])(TRACTOR);
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Range ring with rotating scan arcs.
    ctx.strokeStyle = 'rgba(' + TRACTOR + ', ' + (0.08 + 0.06 * pulse) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.magnetRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.35)';
    ctx.lineWidth = 2;
    for(let i = 0; i < 3; i++) {
        const a = time * 1.4 + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.magnetRange, a, a + 0.5);
        ctx.stroke();
    }

    held.forEach(ore => {
        const dx = ore.x - emitter.x;
        const dy = ore.y - emitter.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const nx = -uy;
        const ny = ux;
        const angle = Math.atan2(dy, dx);
        const wide = 9;

        // Cone.
        const cone = ctx.createLinearGradient(emitter.x, emitter.y, ore.x, ore.y);
        cone.addColorStop(0, 'rgba(' + TRACTOR + ', 0.4)');
        cone.addColorStop(1, 'rgba(' + TRACTOR + ', 0.06)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(emitter.x + nx * 2, emitter.y + ny * 2);
        ctx.lineTo(ore.x + nx * wide, ore.y + ny * wide);
        ctx.lineTo(ore.x - nx * wide, ore.y - ny * wide);
        ctx.lineTo(emitter.x - nx * 2, emitter.y - ny * 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(emitter.x + nx * 2, emitter.y + ny * 2);
        ctx.lineTo(ore.x + nx * wide, ore.y + ny * wide);
        ctx.moveTo(emitter.x - nx * 2, emitter.y - ny * 2);
        ctx.lineTo(ore.x - nx * wide, ore.y - ny * wide);
        ctx.stroke();

        // Energy rings travelling towards the ship.
        ctx.strokeStyle = 'rgba(200, 255, 245, 0.55)';
        ctx.lineWidth = 1.2;
        for(let i = 0; i < 3; i++) {
            const t = 1 - ((time * 1.6 + i / 3 + ore.angle) % 1);
            const x = emitter.x + dx * t;
            const y = emitter.y + dy * t;
            const r = 2 + (wide - 2) * t;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, 1.6, r, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Motes flowing inwards with a slight weave.
        ctx.fillStyle = 'rgba(220, 255, 250, 0.9)';
        for(let i = 0; i < 5; i++) {
            const t = 1 - ((time * 2.3 + i / 5 + ore.angle * 0.5) % 1);
            const weave = Math.sin(time * 9 + i * 2) * (wide * 0.5) * t;
            ctx.fillRect(emitter.x + dx * t + nx * weave - 1, emitter.y + dy * t + ny * weave - 1, 2, 2);
        }

        // Containment field around the captured ore.
        ctx.globalAlpha = 0.5 + 0.3 * pulse;
        Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["i" /* stamp */])(ctx, glow, ore.x, ore.y, 26, 26);
        ctx.globalAlpha = 1;
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -time * 20;
        ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ore.x, ore.y, 7 + pulse * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // Emitter aura.
    ctx.globalAlpha = 0.7 + 0.3 * pulse;
    Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["i" /* stamp */])(ctx, glow, emitter.x, emitter.y, 30 + pulse * 10, 30 + pulse * 10);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(emitter.x, emitter.y, 9, time * 3, time * 3 + Math.PI * 1.2);
    ctx.stroke();
    ctx.restore();
};

// ---------------------------------------------------------------- ore scanner

// Estimated sale value of everything an asteroid would yield.
const rockValue = (rock) => {
    let perArea = 0;
    Object.keys(rock.composition).forEach(id => { perArea += rock.composition[id] * __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][id].price; });
    return Math.round(rock.area / 120 * perArea);
};

// Periodic scan: ping, then lock onto the richest asteroid in range (value vs. distance).
const updateScanner = (dt) => {
    const ship = state.ship;
    const scan = state.scan;
    scan.pings.forEach(ping => {
        ping.life -= dt / 1.4;
        ping.radius = ping.range * (1 - ping.life);
    });
    scan.pings = scan.pings.filter(ping => ping.life > 0);
    if(!ship.scanner || !ship.alive) {
        scan.target = null;
        return;
    }

    if(scan.target && scan.target.dead) scan.target = null;
    scan.timer -= dt;
    if(scan.timer > 0 && scan.target) return;
    if(scan.timer > 0) return;
    scan.timer = ship.scanner.interval;

    const range = ship.scanner.range;
    let best = null;
    let bestScore = 0;
    state.rocks.forEach(rock => {
        if(rock.dead || rock.merging) return;
        const dx = rock.x - ship.x;
        const dy = rock.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if(distance > range) return;
        const value = rockValue(rock);
        const score = value / (1 + distance / 1200);
        if(score > bestScore) {
            bestScore = score;
            best = rock;
        }
    });
    scan.target = best;
    scan.value = best ? rockValue(best) : 0;
    scan.pings.push({ x: ship.x, y: ship.y, range: range, radius: 0, life: 1 });
    __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].scanPing();
};

// World-space: ping rings, target brackets with a label, and a dashed guide line.
const drawScanner = (time) => {
    const ship = state.ship;
    const scan = state.scan;
    ctx.save();
    scan.pings.forEach(ping => {
        ctx.strokeStyle = 'rgba(190, 255, 140, ' + (0.35 * ping.life) + ')';
        ctx.lineWidth = 2 / zoom + 3 * ping.life;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
        ctx.stroke();
    });

    const target = scan.target;
    if(target && ship.alive) {
        const color = __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][target.material].color;
        const r = target.boundRadius + 10;
        // Rotating corner brackets.
        ctx.strokeStyle = 'rgba(' + color + ', 0.95)';
        ctx.lineWidth = 2;
        for(let i = 0; i < 4; i++) {
            const a = time * 0.8 + i * Math.PI / 2;
            ctx.beginPath();
            ctx.arc(target.x, target.y, r, a, a + 0.6);
            ctx.stroke();
        }
        ctx.font = '12px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(' + color + ', 0.95)';
        ctx.fillText(__WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][target.material].name.toUpperCase() + ' · ~' + scan.value.toLocaleString('en-US') + ' cr',
            target.x, target.y - r - 8);

        // Guide line from the ship.
        const dx = target.x - ship.x;
        const dy = target.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        if(distance > r + ship.radius) {
            ctx.setLineDash([8, 10]);
            ctx.lineDashOffset = -time * 40;
            ctx.strokeStyle = 'rgba(' + color + ', 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ship.x + dx / distance * (ship.radius + 10), ship.y + dy / distance * (ship.radius + 10));
            ctx.lineTo(target.x - dx / distance * r, target.y - dy / distance * r);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    ctx.restore();
};

// Screen-space arrow to the scanner target when it's off screen.
const drawScannerPointer = () => {
    const target = state.scan.target;
    if(!target || !state.ship.alive) return;
    const sx = (target.x - state.camera.x) * zoom + __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const sy = (target.y - state.camera.y) * zoom + __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    if(sx > 0 && sx < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width && sy > 0 && sy < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height) return;

    const margin = 46;
    const cx = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(Math.abs((cx - margin) / Math.cos(angle) || Infinity), Math.abs((cy - margin) / Math.sin(angle) || Infinity));
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;
    const color = __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][target.material].color;
    const distance = Math.sqrt(Math.pow(target.x - state.ship.x, 2) + Math.pow(target.y - state.ship.y, 2));

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(' + color + ', 0.95)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(__WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][target.material].name.toUpperCase() + ' ' + (distance / 1000).toFixed(1) + 'k',
        -Math.cos(angle) * 30, -Math.sin(angle) * 30 + 4);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

const drawFlashes = () => {
    if(!state.flashes.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.flashes.forEach(f => {
        const t = f.life / f.maxLife;
        ctx.globalAlpha = t;
        Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["d" /* glowSprite */])(f.color), f.x, f.y, f.size * (0.6 + 0.4 * t), f.size * (0.6 + 0.4 * t));
    });
    ctx.restore();
};

const drawShockwaves = () => {
    if(!state.shockwaves.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.shockwaves.forEach(wave => {
        const glow = wave.maxRadius * 1.6 * wave.life;
        ctx.globalAlpha = wave.life * 0.8;
        Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_19__render_sprites__["d" /* glowSprite */])(wave.color), wave.x, wave.y, glow, glow);
        ctx.globalAlpha = wave.life;
        ctx.strokeStyle = 'rgb(' + wave.color + ')';
        ctx.lineWidth = 1 + 4 * wave.life;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.restore();
};

const drawFloatingTexts = () => {
    ctx.save();
    ctx.font = '12px Bungee, sans-serif';
    ctx.textAlign = 'center';
    state.floatingTexts.forEach(text => {
        ctx.fillStyle = 'rgba(' + text.color + ',' + Math.min(1, text.life).toFixed(2) + ')';
        ctx.fillText(text.text, text.x, text.y);
    });
    ctx.restore();
};

const drawBanner = () => {
    if(state.bannerTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.bannerTimer);
    ctx.font = '30px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeText(state.bannerText, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(state.bannerText, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 4);
    ctx.restore();
};

const drawDockPrompt = () => {
    if(!state.canDock) return;
    const ship = state.ship;
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    const text = speed > __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].maxDockSpeed ? (TOUCH ? 'Slow down to dock (turn on Stabilizer)' : 'Slow down to dock (X: stabilizer)')
        : (TOUCH ? 'Tap Dock to enter the shipyard' : 'Press B to dock at the shipyard');
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = speed > __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].maxDockSpeed ? 'rgba(255, 200, 120, 0.95)' : 'rgba(140, 255, 160, 0.95)';
    ctx.fillText(text, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height - 60);
    ctx.restore();
};

// Edge-of-screen pointer to the shipyard when it's out of view.
const drawStationPointer = () => {
    const sx = (__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x - state.camera.x) * zoom + __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const sy = (__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y - state.camera.y) * zoom + __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    const margin = 40;
    if(sx > -100 && sx < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width + 100 && sy > -100 && sy < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height + 100) return;

    const cx = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(
        Math.abs((cx - margin) / Math.cos(angle) || Infinity),
        Math.abs((cy - margin) / Math.sin(angle) || Infinity)
    );
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(140, 200, 255, 0.9)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BASE ' + (distanceToStation() / 1000).toFixed(1) + 'k', -Math.cos(angle) * 26, -Math.sin(angle) * 26 + 4);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2, 0); ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

// Weapon readiness: heat for miniguns, recharge for beams, reload for launchers.
// Screen rectangles of the weapon panel rows (for clicking/tapping a weapon on or off).
let weaponRows = [];

const toggleWeapon = (kind) => {
    if(!state || state.paused || !state.ship.alive) return;
    const ship = state.ship;
    const on = ship.toggleWeapon(kind);
    const row = ship.weaponStatus().filter(w => w.kind === kind)[0];
    __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].toggle(on);
    banner((row ? row.name : kind) + (on ? ' ON' : ' OFF'), 1.1);
};

// A click/tap on the weapon panel toggles that weapon (and doesn't fire).
const weaponPanelClick = (x, y) => {
    if(!state || state.paused) return false;
    const row = weaponRows.filter(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)[0];
    if(!row) return false;
    toggleWeapon(row.kind);
    return true;
};

const drawWeaponPanel = () => {
    weaponRows = [];
    const weapons = state.ship.weaponStatus();
    if(!weapons.length) return;
    // On touch screens the bottom corners belong to the thumbs: a compact panel sits left
    // of the minimap instead.
    const rowHeight = TOUCH ? 16 : 22;
    const header = TOUCH ? 6 : 22;
    const width = TOUCH ? 196 : 230;
    const barOffset = TOUCH ? 86 : 108;
    const barW = TOUCH ? 50 : 70;
    const left = TOUCH ? __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width - Math.min(120, Math.round(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height * 0.28)) - 20 - width : 16;
    const top = TOUCH ? 10 : __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height - 16 - weapons.length * rowHeight - 18;
    const height = weapons.length * rowHeight + header + (TOUCH ? 2 : 0);

    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.85)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.4)';
    ctx.fillRect(left, top, width, height);
    ctx.strokeRect(left, top, width, height);
    if(!TOUCH) {
        ctx.font = '10px Bungee, sans-serif';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
        ctx.fillText('WEAPONS', left + 8, top + 14);
    }

    const labels = { ready: 'READY', hot: 'HOT', overheated: 'OVERHEAT', firing: 'FIRING', charging: 'CHARGING', reloading: 'RELOAD', off: 'OFF' };
    weapons.forEach((w, i) => {
        const y = top + header + i * rowHeight - (TOUCH ? 2 : 0);
        weaponRows.push({ x: left, y: y, w: width, h: rowHeight, kind: w.kind });
        ctx.globalAlpha = w.off ? 0.4 : 1;
        ctx.fillStyle = 'rgb(' + w.color + ')';
        ctx.font = (TOUCH ? '9px' : '11px') + ' Bungee, sans-serif';
        // The number key that switches this weapon on/off.
        ctx.fillText((i < 5 && !TOUCH ? (i + 1) + ' ' : '') + w.name + (w.count > 1 ? ' x' + w.count : ''), left + (TOUCH ? 6 : 8), y + 11);

        const barX = left + barOffset;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(barX, y + 3, barW, 8);
        const warn = w.state === 'overheated' || w.state === 'hot';
        ctx.fillStyle = warn ? (w.state === 'overheated' ? 'rgb(255, 80, 60)' : 'rgb(255, 170, 70)') : 'rgb(' + w.color + ')';
        ctx.fillRect(barX + 1, y + 4, (barW - 2) * w.ready, 6);

        ctx.font = (TOUCH ? '8px' : '9px') + ' Bungee, sans-serif';
        ctx.globalAlpha = 1;
        ctx.fillStyle = w.off ? 'rgba(255, 110, 90, 0.95)' : w.state === 'ready' ? 'rgba(140, 255, 160, 0.9)' : (warn ? 'rgba(255, 140, 100, 0.95)' : 'rgba(200, 220, 255, 0.8)');
        ctx.fillText(labels[w.state], barX + barW + 5, y + 11);
    });
    ctx.restore();
};

// Distant planet and coloured nebula for the current system (slow parallax). These live
// in a layer behind the game canvas: the nebula is a CSS gradient and the planet a
// pre-rendered canvas moved with a CSS transform, so the browser composites them on the
// GPU instead of the game repainting large images every frame.
const backdrop = document.createElement('div');
backdrop.className = 'backdrop';
let backdropSystem = null;
let planetEl = null;

const setBackdrop = (system) => {
    if(backdropSystem === system.id) return;
    backdropSystem = system.id;
    backdrop.style.background = 'radial-gradient(ellipse at 30% 35%, rgba(' + system.tint + ', 0.22), transparent 60%), ' +
        'radial-gradient(ellipse at 75% 70%, rgba(' + system.tint + ', 0.16), transparent 55%)';
    if(planetEl) planetEl.remove();
    planetEl = Object(__WEBPACK_IMPORTED_MODULE_17__render_planets__["b" /* planetSprite */])(system).canvas;
    planetEl.className = 'backdrop-planet';
    backdrop.appendChild(planetEl);
};

const drawBackdrop = () => {
    const system = state.system;
    setBackdrop(system);
    const w = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width;
    const h = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height;
    // In 3D the planet is a real sphere in the scene.
    if(planetEl) planetEl.style.display = scene3d ? 'none' : '';
    if(scene3d) return;
    const planet = Object(__WEBPACK_IMPORTED_MODULE_17__render_planets__["b" /* planetSprite */])(system);
    const parallax = 0.12;
    const px = w / 2 + (system.planet.x - state.camera.x) * parallax;
    const py = h / 2 + (system.planet.y - state.camera.y) * parallax;
    const size = system.planet.radius * 0.55 * (0.8 + 0.2 * zoom);
    const full = size * planet.width / (planet.R * 2);
    planetEl.style.width = full + 'px';
    planetEl.style.height = full + 'px';
    planetEl.style.transform = 'translate3d(' + (px - full / 2).toFixed(1) + 'px, ' + (py - full / 2).toFixed(1) + 'px, 0)';
};

// Full-screen wormhole or hyperspace tunnel while travelling.
// Everything the 3D view needs for one frame.
const view3d = (time) => ({
    cameraX: state.camera.x, cameraY: state.camera.y, zoom: zoom, time: time,
    rocks: state.rocks, ships: [state.ship].concat(state.enemies), ores: state.ores,
    system: state.system, gate: state.gate, station: state.system.station ? __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */] : null,
    canDock: state.canDock, nearDHD: state.nearDHD, isVisible: isVisible
});

const hide3d = () => {
    if(scene3d) scene3d.setVisible(false);
};

const renderTunnel = () => {
    hide3d();
    const tr = state.transition;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const time = state.transitionClock || 0;
    if(tr.type === 'gate') Object(__WEBPACK_IMPORTED_MODULE_18__travel__["c" /* drawWormhole */])(ctx, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height, time, Math.min(1, tr.t / 3.4));
    else {
        const remaining = Math.max(0, tr.duration - tr.t);
        Object(__WEBPACK_IMPORTED_MODULE_18__travel__["b" /* drawHyperspace */])(ctx, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height, time, Math.min(1, tr.t / tr.duration),
            'Hyperspace · ' + tr.target.name + ' · ' + Math.round(tr.distance).toLocaleString('en-US') + ' ly · ' + remaining.toFixed(1) + ' s');
    }
};

// White flash entering and leaving a wormhole.
const drawTravelOverlay = () => {
    const tr = state.transition;
    if(!tr || tr.type !== 'gate') return;
    let flash = 0;
    if(tr.phase === 'enter') flash = Math.max(0, (tr.t - 0.2) / 0.3);
    if(tr.phase === 'exit') flash = Math.max(0, 1 - tr.t / 0.8);
    if(flash <= 0) return;
    ctx.fillStyle = 'rgba(225, 238, 255, ' + Math.min(1, flash) + ')';
    ctx.fillRect(0, 0, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height);
};

// Edge-of-screen pointer to this system's Stargate.
const drawGatePointer = () => {
    const gate = state.gate;
    const sx = (gate.x - state.camera.x) * zoom + __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const sy = (gate.y - state.camera.y) * zoom + __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    if(sx > -60 && sx < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width + 60 && sy > -60 && sy < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height + 60) return;
    const margin = 40;
    const cx = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(Math.abs((cx - margin) / Math.cos(angle) || Infinity), Math.abs((cy - margin) / Math.sin(angle) || Infinity));
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;
    const distance = Math.sqrt(Math.pow(gate.x - state.ship.x, 2) + Math.pow(gate.y - state.ship.y, 2));
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(255, 170, 110, 0.95)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GATE ' + (distance / 1000).toFixed(1) + 'k', -Math.cos(angle) * 26, -Math.sin(angle) * 26 + 18);
    ctx.strokeStyle = 'rgba(255, 170, 110, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

// Red brackets with hull / shield bars over enemy ships.
const drawEnemyBars = () => {
    ctx.save();
    state.enemies.forEach(enemy => {
        if(!enemy.alive || !isVisible(enemy.x, enemy.y, enemy.radius * 2)) return;
        const r = enemy.radius * 1.05 + 6;
        const w = Math.max(36, enemy.radius * 1.6);
        const x = enemy.x - w / 2;
        const y = enemy.y - r - 14 / zoom;
        const h = 3.5 / zoom;
        ctx.lineWidth = 1.2 / zoom;
        // Corner brackets.
        ctx.strokeStyle = 'rgba(255, 90, 70, 0.85)';
        const c = r * 0.35;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(k => {
            ctx.beginPath();
            ctx.moveTo(enemy.x + k[0] * r, enemy.y + k[1] * (r - c));
            ctx.lineTo(enemy.x + k[0] * r, enemy.y + k[1] * r);
            ctx.lineTo(enemy.x + k[0] * (r - c), enemy.y + k[1] * r);
            ctx.stroke();
        });
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgb(255, 110, 80)';
        ctx.fillRect(x, y, w * Math.max(0, enemy.hp / enemy.maxHull), h);
        if(enemy.maxShield > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(x, y - h - 1.5 / zoom, w, h);
            ctx.fillStyle = 'rgb(110, 200, 255)';
            ctx.fillRect(x, y - h - 1.5 / zoom, w * Math.max(0, enemy.shield / enemy.maxShield), h);
        }
        ctx.font = (10 / zoom) + 'px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 150, 130, 0.9)';
        ctx.fillText(enemy.hullDef.name + ' Mk ' + (enemy.level === 3 ? 'III' : 'II'), enemy.x, y - h - 5 / zoom);
    });
    ctx.restore();
};

// Edge-of-screen arrows towards enemies that are off screen.
const drawEnemyPointers = () => {
    const margin = 34;
    const cx = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2;
    state.enemies.forEach(enemy => {
        if(!enemy.alive) return;
        const sx = (enemy.x - state.camera.x) * zoom + cx;
        const sy = (enemy.y - state.camera.y) * zoom + cy;
        if(sx > -20 && sx < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width + 20 && sy > -20 && sy < __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height + 20) return;
        const angle = Math.atan2(sy - cy, sx - cx);
        const scale = Math.min(Math.abs((cx - margin) / Math.cos(angle) || Infinity), Math.abs((cy - margin) / Math.sin(angle) || Infinity));
        const distance = Math.sqrt(Math.pow(enemy.x - state.ship.x, 2) + Math.pow(enemy.y - state.ship.y, 2));
        ctx.save();
        ctx.translate(cx + Math.cos(angle) * scale, cy + Math.sin(angle) * scale);
        ctx.fillStyle = 'rgba(255, 90, 70, 0.95)';
        ctx.font = '10px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((distance / 1000).toFixed(1) + 'k', -Math.cos(angle) * 22, -Math.sin(angle) * 22 + 4);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(9, 0); ctx.lineTo(-5, -6); ctx.lineTo(-2, 0); ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
};

const drawMinimap = () => {
    const size = TOUCH ? Math.min(120, Math.round(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height * 0.28)) : MINIMAP_SIZE;
    const left = __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width - size - (TOUCH ? 10 : 16);
    const top = TOUCH ? 10 : __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height - size - 16;
    const scale = (size / 2) / MINIMAP_RANGE;
    const cx = left + size / 2;
    const cy = top + size / 2;
    const ship = state.ship;

    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.94)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.fillRect(left, top, size, size);
    ctx.strokeRect(left, top, size, size);
    ctx.beginPath();
    ctx.rect(left, top, size, size);
    ctx.clip();

    // Range rings.
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.15)';
    [1000, 2000, 3000].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
    });

    // Without an ore scanner asteroids are just grey contacts; with one they're
    // coloured by their main metal and the scanner's pick is highlighted.
    const scanning = !!ship.scanner;
    if(scanning) {
        ctx.strokeStyle = 'rgba(190, 255, 140, 0.35)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, ship.scanner.range * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    state.rocks.forEach(rock => {
        const x = cx + (rock.x - ship.x) * scale;
        const y = cy + (rock.y - ship.y) * scale;
        ctx.fillStyle = scanning ? 'rgb(' + __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][rock.material].color + ')' : 'rgb(140, 140, 150)';
        const r = Math.max(1.2, rock.radius * scale * 1.5);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    const target = state.scan.target;
    if(target && Math.sin(state.time * 6) > -0.3) {
        ctx.strokeStyle = 'rgb(' + __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][target.material].color + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + (target.x - ship.x) * scale, cy + (target.y - ship.y) * scale, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Missiles (orange-red darts) and drones (gold diamonds), each with a short tail
    // showing which way it's heading.
    state.missiles.forEach(missile => {
        const x = cx + (missile.x - ship.x) * scale;
        const y = cy + (missile.y - ship.y) * scale;
        if(x < left || x > left + size || y < top || y > top + size) return;
        const drone = missile.kind === 'drone';
        const color = drone ? '255, 215, 110' : '255, 120, 80';
        const speed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy) || 1;
        ctx.strokeStyle = 'rgba(' + color + ', 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - missile.vx / speed * 6, y - missile.vy / speed * 6);
        ctx.stroke();
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(missile.angle);
        ctx.beginPath();
        if(drone) {
            ctx.moveTo(2.6, 0); ctx.lineTo(0, -1.8); ctx.lineTo(-2.6, 0); ctx.lineTo(0, 1.8);
        } else {
            ctx.moveTo(3.2, 0); ctx.lineTo(-2.2, -1.8); ctx.lineTo(-2.2, 1.8);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    // Station (Lantea only) and Stargate, clamped to the edge when far away.
    const limit = size / 2 - 6;
    // Enemy ships: red arrowheads, pinned to the edge when out of range.
    state.enemies.forEach(enemy => {
        if(!enemy.alive) return;
        let mx = (enemy.x - ship.x) * scale;
        let my = (enemy.y - ship.y) * scale;
        const furthest = Math.max(Math.abs(mx), Math.abs(my));
        if(furthest > limit) {
            mx *= limit / furthest;
            my *= limit / furthest;
        }
        ctx.save();
        ctx.translate(cx + mx, cy + my);
        ctx.rotate(enemy.angle);
        ctx.fillStyle = 'rgb(255, 80, 60)';
        const k = enemy.radius > 50 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(5 * k, 0); ctx.lineTo(-3.5 * k, -3.5 * k); ctx.lineTo(-3.5 * k, 3.5 * k);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
    const marker = (x, y) => {
        let mx = (x - ship.x) * scale;
        let my = (y - ship.y) * scale;
        const furthest = Math.max(Math.abs(mx), Math.abs(my));
        if(furthest > limit) {
            mx *= limit / furthest;
            my *= limit / furthest;
        }
        return { x: cx + mx, y: cy + my };
    };
    ctx.lineWidth = 1.5;
    if(state.system.station) {
        const st = marker(__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y);
        ctx.strokeStyle = 'rgb(140, 200, 255)';
        ctx.strokeRect(st.x - 4, st.y - 4, 8, 8);
    }
    const gm = marker(state.gate.x, state.gate.y);
    ctx.strokeStyle = 'rgb(255, 170, 110)';
    ctx.beginPath();
    ctx.arc(gm.x, gm.y, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.translate(cx, cy);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-2, 0); ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText(ship.scanner ? 'ORE SCANNER ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k' : 'SENSORS ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k',
        left + 6, top + 14);
    ctx.restore();
};

const render = () => {
    const time = state.time;
    Object(__WEBPACK_IMPORTED_MODULE_2__components_rock_rock__["d" /* resetRebuildBudget */])();
    const use3d = !!scene3d;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height);
    drawBackdrop();
    if(!use3d) drawStarfield();

    const toWorld = (c) => {
        c.save();
        c.translate(__WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_7__physics_physics__["d" /* world */].height / 2);
        c.scale(zoom, zoom);
        c.translate(-state.camera.x, -state.camera.y);
    };

    // Station, gate and DHD. In 3D they are models in the scene, and only their effects
    // (docking ring, shield impacts, event horizon, glows, labels) are drawn here.
    const stationVisible = state.system.station && isVisible(__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y, 460);
    const gateVisible = isVisible(state.gate.x, state.gate.y, 300);
    toWorld(ctx);
    if(stationVisible) Object(__WEBPACK_IMPORTED_MODULE_10__world_station__["b" /* drawStation */])(ctx, time, state.canDock, use3d);
    if(gateVisible) {
        state.gate.draw(ctx, time, use3d);
        state.gate.drawDHD(ctx, time, state.nearDHD, use3d);
    }
    const visibleRocks = state.rocks.filter(rock => {
        if(isVisible(rock.x, rock.y, rock.radius * 1.3)) return true;
        // Free the cached image of rocks well off screen.
        if(rock.sprite && !isVisible(rock.x, rock.y, 900)) rock.releaseSprite();
        return false;
    });
    if(!use3d) {
        // Merging guests are drawn first so they sink beneath their host.
        visibleRocks.forEach(rock => { if(rock.merging && rock.merging.guest === rock) rock.draw(ctx, time); });
        visibleRocks.forEach(rock => { if(!(rock.merging && rock.merging.guest === rock)) rock.draw(ctx, time); });
    }
    state.particles.forEach(particle => { if(isUnlit(particle) && isVisible(particle.x, particle.y, 20)) particle.draw(ctx); });
    drawTractor(time);
    if(!use3d) state.ores.forEach(ore => { if(isVisible(ore.x, ore.y, 10)) ore.draw(ctx, time); });
    drawTargeting(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.particles.forEach(particle => { if(!isUnlit(particle) && isVisible(particle.x, particle.y, 10)) particle.draw(ctx); });
    ctx.restore();

    // Kinetic tracers: a long faint orange tail, a yellow body and a short white-hot
    // head, each batched into one path (cheap even with hundreds of rounds in flight).
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    [[0.034, 3.4, 'rgba(255, 140, 50, 0.22)'], [0.018, 2.2, 'rgba(255, 210, 120, 0.6)'], [0.007, 1.5, 'rgba(255, 255, 240, 1)']].forEach(layer => {
        ctx.beginPath();
        state.bullets.forEach(bullet => {
            if(bullet.kind !== 'bullet') return;
            const age = Math.min(1, (1.4 - bullet.life) * 12);   // tracer grows out of the muzzle
            ctx.moveTo(bullet.x - bullet.vx * layer[0] * age, bullet.y - bullet.vy * layer[0] * age);
            ctx.lineTo(bullet.x, bullet.y);
        });
        ctx.lineWidth = layer[1];
        ctx.strokeStyle = layer[2];
        ctx.stroke();
    });
    ctx.restore();
    state.bullets.forEach(bullet => { if(bullet.kind !== 'bullet') bullet.draw(ctx); });

    state.missiles.forEach(missile => missile.draw(ctx));
    drawShockwaves();
    drawFlashes();
    drawScanner(time);
    const tr = state.transition;
    if(tr && tr.type === 'hyper' && tr.open > 0) Object(__WEBPACK_IMPORTED_MODULE_18__travel__["a" /* drawHyperWindow */])(ctx, tr.wx, tr.wy, tr.size, time, tr.open);
    state.enemies.forEach(enemy => {
        if(isVisible(enemy.x, enemy.y, enemy.radius * 2 + 40)) enemy.draw(ctx, use3d);
    });
    state.ship.draw(ctx, use3d);
    drawEnemyBars();
    drawFloatingTexts();
    ctx.restore();

    if(use3d) {
        try {
            scene3d.setVisible(true);
            scene3d.render(view3d(time));
        } catch(error) {
            disable3d(error);
        }
    }

    if(state.system.station) drawStationPointer();
    drawGatePointer();
    drawEnemyPointers();
    drawTravelOverlay();
    drawMinimap();
    drawScannerPointer();
    drawWeaponPanel();
    drawDockPrompt();
    if(!state.paused && (!TOUCH || __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].mouseDown)) drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- cargo hold panel

const ejectOre = (material, count) => {
    if(!state || !state.ship.alive) return;
    const ship = state.ship;
    const removed = Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["o" /* removeCargo */])(material, count);
    const cos = Math.cos(ship.angle);
    const sin = Math.sin(ship.angle);
    const stern = ship.localToWorld(-ship.radius * 0.7, 0);
    for(let i = 0; i < removed; i++) {
        const spread = (Math.random() - 0.5) * 1.4;
        const speed = 60 + Math.random() * 60;
        const ore = new __WEBPACK_IMPORTED_MODULE_4__components_ore_ore__["a" /* default */](stern.x + (Math.random() - 0.5) * 8, stern.y + (Math.random() - 0.5) * 8,
            ship.vx - Math.cos(ship.angle + spread) * speed, ship.vy - Math.sin(ship.angle + spread) * speed, material);
        ore.ejectTimer = 3;
        state.ores.push(ore);
    }
    if(removed) {
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].pickup(1);
        floatText(stern.x - cos * 10, stern.y - sin * 10, '-' + removed + ' ' + __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][material].name, '255,170,140');
    }
};

const renderCargoPanel = () => {
    if(!cargoPanel || cargoPanel.style.display === 'none') return;
    const profile = Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["g" /* getProfile */])();
    const capacity = state ? state.ship.cargoCapacity : 0;
    const used = Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["d" /* cargoUsed */])();
    let value = 0;

    let html = '<div class="cargo-header"><span>Cargo hold</span><button data-close="1">×</button></div>' +
        '<div class="cargo-capacity"><div class="cargo-capacity-fill" style="width:' +
        Math.round(Math.min(1, used / Math.max(1, capacity)) * 100) + '%"></div></div>' +
        '<div class="cargo-sub">' + used + ' / ' + capacity + ' units</div><table>';
    __WEBPACK_IMPORTED_MODULE_8__world_materials__["a" /* MATERIAL_ORDER */].forEach(id => {
        const amount = profile.cargo[id] || 0;
        if(!amount) return;
        const material = __WEBPACK_IMPORTED_MODULE_8__world_materials__["b" /* default */][id];
        value += amount * material.price;
        html += '<tr><td><span class="swatch" style="background:rgb(' + material.color + ');box-shadow:0 0 6px rgb(' + material.color + ')"></span>' +
            material.name + '</td><td>' + amount + '</td><td>' + (amount * material.price) + ' cr</td>' +
            '<td><button data-eject="' + id + '" data-count="1">Eject 1</button>' +
            '<button data-eject="' + id + '" data-count="all">All</button></td></tr>';
    });
    html += '</table>';
    html += used ? '<div class="cargo-sub">Value at Atlantis: ' + value.toLocaleString('en-US') + ' cr</div>' +
        '<button class="cargo-eject-all" data-eject="*">Eject everything</button>'
        : '<div class="cargo-sub">The hold is empty. Lower shields (H) and fly near ore to collect it.</div>';
    cargoPanel.innerHTML = html;
};

const toggleCargoPanel = (show) => {
    if(!cargoPanel) return;
    const visible = show === undefined ? cargoPanel.style.display === 'none' : show;
    cargoPanel.style.display = visible ? '' : 'none';
    renderCargoPanel();
};

// ---------------------------------------------------------------- DHD & starmap

const openDHD = () => {
    const gate = state.gate;
    state.paused = true;
    freeze(true);
    Object(__WEBPACK_IMPORTED_MODULE_15__ui_dhd__["a" /* getDHD */])().open({
        systemId: state.system.id,
        systemName: state.system.name,
        originIndex: originIndex(state.system),
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
    state.paused = true;
    freeze(true);
    let engageTarget = null;
    Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["a" /* getStarmap */])().open({
        systemId: state.system.id,
        originIndex: originIndex(state.system),
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

// ---------------------------------------------------------------- loop & menus

const freeze = (frozen) => {
    __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */].enabled = !frozen;
    document.body.classList.toggle('playing', !frozen);
    shieldButton.style.display = state && !frozen ? '' : 'none';
    cargoButton.style.display = state && !frozen ? '' : 'none';
    starmapButton.style.display = state && !frozen ? '' : 'none';
    backdrop.style.display = state ? '' : 'none';
    if(touchControls) touchControls.show(!!state && !frozen);
    if(frozen) toggleCargoPanel(false);
    if(frozen) {
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].stopAll();
    } else {
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].startEngine();
        lastFrameTime = performance.now();
        accumulator = 0;
    }
};

const setPaused = (paused) => {
    if(!state) return;
    state.paused = paused;
    pauseMenu.style.visibility = paused ? 'visible' : 'hidden';
    freeze(paused);
};

const dock = () => {
    const ship = state.ship;
    state.paused = true;
    state.docked = true;
    freeze(true);
    ship.vx = 0;
    ship.vy = 0;
    ship.angularVelocity = 0;

    __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].dock();
    Object(__WEBPACK_IMPORTED_MODULE_12__shipyard_shipyard__["a" /* getShipyard */])().open({
        tab: Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["d" /* cargoUsed */])() > 0 ? 'market' : 'ship',
        closeLabel: 'Undock',
        canTrade: true,
        hullStatus: () => ({ hp: state.ship.hp, max: Math.round(state.ship.maxHull) }),
        repair: (points) => { state.ship.hp = Math.min(state.ship.maxHull, state.ship.hp + points); },
        onClose: () => {
            if(!state) return;
            ship.applyStats(Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["f" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["g" /* getProfile */])().hull));
            targetZoom = shipZoom();
            ship.shield = ship.maxShield;
            ship.immunity = 1.5;
            state.paused = false;
            state.docked = false;
            freeze(false);
            banner('Undocked', 1.2);
        }
    });
};

const endGame = (message) => {
    cancelAnimationFrame(frameId);
    frameId = null;
    freeze(true);
    pauseMenu.style.visibility = 'hidden';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hide3d();
    if(scene3d) scene3d.clear();

    if(menuMessage) menuMessage.textContent = message || '';
    menu.style.visibility = 'visible';
    state = null;
    backdrop.style.display = 'none';
};

const frameStep = (now) => {
    const elapsed = Math.min((now - lastFrameTime) / 1000, 0.25);
    lastFrameTime = now;
    if(elapsed > 0) fps += (1 / elapsed - fps) * 0.05;
    if(zoomKeys.in) targetZoom = clampZoom(targetZoom * Math.exp(elapsed * 1.6));
    if(zoomKeys.out) targetZoom = clampZoom(targetZoom * Math.exp(-elapsed * 1.6));
    zoom += (targetZoom - zoom) * Math.min(1, elapsed * 10);
    // A 3D view that can't keep up first drops to normal resolution, then to the 2D view.
    if(scene3d && !state.transition && !state.paused) {
        if(fps < 20) {
            slow3dTime += elapsed;
            if(slow3dTime > 4) {
                slow3dTime = 0;
                if(resolutionCap > 1 && (window.devicePixelRatio || 1) > 1) {
                    resolutionCap = 1;
                    resize();
                } else if(!/[?&]3d\b/.test(window.location.search)) {
                    disable3d('frame rate too low');
                }
            }
        } else {
            slow3dTime = 0;
        }
    }
    if(fps < 45 && resolutionCap > 1 && (window.devicePixelRatio || 1) > 1) {
        slowTime += elapsed;
        if(slowTime > 2) {
            resolutionCap = 1;
            resize();
        }
    } else {
        slowTime = 0;
    }

    // Travelling between systems: the world is hidden during the tunnel phases.
    let inTunnel = false;
    if(state.transition && !state.paused) {
        state.transitionClock = (state.transitionClock || 0) + elapsed;
        inTunnel = updateTransition(elapsed);
        if(inTunnel) accumulator = 0;
    }

    if(touchControls && !state.paused) {
        touchControls.update(state.ship, {
            interactLabel: state.transition ? '' : state.canDock ? 'Dock' : state.nearDHD ? 'DHD' : ''
        });
    }

    if(!state.paused && !inTunnel) {
        accumulator += elapsed;
        let steps = 0;
        while(accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
            step(STEP);
            accumulator -= STEP;
            steps++;
        }
        if(steps === MAX_STEPS_PER_FRAME) accumulator = 0;

        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].setThrust(state.ship.alive && state.ship.thrusting);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].setFiring(state.ship.alive && state.ship.minigunFiring);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].setBeam(state.ship.alive && state.ship.beaming);
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].setTractor(state.ship.alive && !!state.tractorActive, Math.min(1, (state.tractorCount || 0) / 6));
    }

    if(inTunnel) renderTunnel();
    else render();
    renderInfo();

    if(state.gameOverTimer >= GAME_OVER_DELAY) {
        Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["k" /* loseCargo */])();
        endGame('Ship destroyed! The cargo was lost. Your credits and ship are safe at the shipyard.');
        return false;
    }
    return true;
};

// Switch to the 2D view for good (no WebGL, or the 3D view hit an error on this computer).
const disable3d = (reason) => {
    if(!scene3d) return;
    try {
        scene3d.setVisible(false);
        scene3d.clear();
    } catch(e) { /* already broken */ }
    if(scene3d.canvas && scene3d.canvas.parentNode) scene3d.canvas.parentNode.removeChild(scene3d.canvas);
    scene3d = null;
    if(planetEl) planetEl.style.display = '';
    if(state) banner('3D view unavailable on this computer: using 2D', 3);
    if(window.console) console.warn('3D view disabled:', reason);
};

// The game loop never stops on an error: a failure in the 3D view drops back to 2D, and
// anything else is reported while the game keeps running.
const frame = (now) => {
    let keepGoing = true;
    try {
        keepGoing = frameStep(now);
    } catch(error) {
        if(window.console) console.error('Frame error:', error);
        if(scene3d) disable3d(error);
        else if(state) {
            // Show what went wrong instead of silently freezing.
            frameErrors++;
            if(frameErrors < 5 || frameErrors % 120 === 0) banner('Error: ' + ((error && error.message) || error), 4);
        }
    }
    if(keepGoing && state) frameId = requestAnimationFrame(frame);
};

let initialized = false;

const initialize = () => {
    initialized = true;
    gameboard.appendChild(backdrop);
    // 3D unless asked for 2D (?2d). Without real graphics-card acceleration the browser
    // refuses the 3D view and the game stays 2D; ?3d forces 3D anyway.
    if(Object(__WEBPACK_IMPORTED_MODULE_20__render3d_scene3d__["c" /* webglAvailable */])() && !/[?&]2d\b/.test(window.location.search)) {
        try {
            scene3d = new __WEBPACK_IMPORTED_MODULE_20__render3d_scene3d__["b" /* default */](gameboard, !/[?&]3d\b/.test(window.location.search));
        } catch(e) {
            scene3d = null;
            if(window.console) console.warn('3D view not started:', e && e.message);
        }
    }
    gameboard.appendChild(canvas);
    window.addEventListener('resize', resize);
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["a" /* default */])();

    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('Escape', () => {
        if(!state || state.docked || !state.ship.alive || state.transition || Object(__WEBPACK_IMPORTED_MODULE_15__ui_dhd__["b" /* isDHDOpen */])() || Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["c" /* isStarmapOpen */])()) return false;
        setPaused(!state.paused);
        return true;
    });

    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyG', () => {
        if(!state || state.paused || !state.ship.guidance) return false;
        state.ship.autoTarget = !state.ship.autoTarget;
        banner('Auto-targeting ' + (state.ship.autoTarget ? 'ON' : 'OFF'), 1.2);
        return true;
    });

    const toggleShields = () => {
        if(!state || state.paused || !state.ship.alive) return false;
        if(state.ship.maxShield <= 0) {
            banner('No shield emitter fitted', 1.2);
            return true;
        }
        state.ship.toggleShields();
        banner(state.ship.shieldsEnabled ? 'Shields raised' : 'Shields lowered: ore collection enabled', 1.4);
        return true;
    };
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyH', toggleShields);

    // 1-5: switch the weapons in the weapon panel on/off; clicking a row does the same.
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].forEach((code, i) => {
        Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])(code, () => {
            if(!state || state.paused || !state.ship.alive) return false;
            const weapons = state.ship.weaponStatus();
            if(!weapons[i]) return false;
            toggleWeapon(weapons[i].kind);
            return true;
        });
    });
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["d" /* setClickFilter */])(weaponPanelClick);

    // T: what auto-targeting goes for (needs a targeting computer).
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyT', () => {
        if(!state || state.paused || !state.ship.alive) return false;
        if(!state.ship.guidance) {
            banner('Fit a targeting computer to choose targets', 1.6);
            return true;
        }
        const mode = state.ship.cycleTargetMode();
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].toggle(true);
        banner('Targeting: ' + __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["d" /* TARGET_MODE_LABEL */][mode], 1.4);
        return true;
    });

    // N (debug mode only): spawn an enemy ship nearby, for testing.
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyN', () => {
        if(!state || state.paused || state.transition || !Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["i" /* isDebug */])()) return false;
        spawnEnemy(null, null, true);
        return true;
    });

    // X: stabilizer on/off.
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyX', () => {
        if(!state || state.paused || !state.ship.alive) return false;
        state.ship.stabilizer = !state.ship.stabilizer;
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].toggle(state.ship.stabilizer);
        banner('Stabilizer ' + (state.ship.stabilizer ? 'ON: cancelling drift and spin' : 'OFF: free drift'), 1.4);
        return true;
    });

    const zoomKey = (event, down) => {
        if(event.code === 'Equal' || event.code === 'NumpadAdd') zoomKeys.in = down;
        if(event.code === 'Minus' || event.code === 'NumpadSubtract') zoomKeys.out = down;
        if(down && (event.code === 'Digit0' || event.code === 'Numpad0') && state && !state.paused) targetZoom = shipZoom();
    };
    window.addEventListener('keydown', (event) => zoomKey(event, true));
    window.addEventListener('keyup', (event) => zoomKey(event, false));

    window.addEventListener('wheel', (event) => {
        if(!state || state.paused) return;
        event.preventDefault();
        targetZoom = clampZoom(targetZoom * Math.exp(-event.deltaY * 0.0015));
    }, { passive: false });

    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyC', () => {
        if(!state || state.paused) return false;
        toggleCargoPanel();
        return true;
    });
    cargoButton.addEventListener('click', () => { if(state && !state.paused) toggleCargoPanel(); });
    cargoPanel.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if(!button) return;
        if(button.dataset.close) toggleCargoPanel(false);
        const material = button.dataset.eject;
        if(material === '*') {
            Object.keys(Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["g" /* getProfile */])().cargo).forEach(id => ejectOre(id, Infinity));
        } else if(material) {
            ejectOre(material, button.dataset.count === 'all' ? Infinity : 1);
        }
    });
    Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_profile__["l" /* onProfileChange */])(() => renderCargoPanel());
    shieldButton.addEventListener('click', () => toggleShields());

    // B: dock at Atlantis, or use the DHD when standing next to it.
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyB', () => {
        if(!state || state.paused || state.transition) return false;
        if(state.canDock) {
            const ship = state.ship;
            const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
            if(speed > __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].maxDockSpeed) banner('Too fast to dock', 1.2);
            else dock();
            return true;
        }
        if(state.nearDHD) {
            openDHD();
            return true;
        }
        return false;
    });

    // M: starmap. J: open the starmap to pick a hyperspace destination.
    const toggleStarmap = () => {
        if(!state || state.transition || state.docked || Object(__WEBPACK_IMPORTED_MODULE_15__ui_dhd__["b" /* isDHDOpen */])()) return false;
        if(Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["c" /* isStarmapOpen */])()) return false;
        if(state.paused) return false;
        openStarmap();
        return true;
    };
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyM', toggleStarmap);
    Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["c" /* onKeyPress */])('KeyJ', toggleStarmap);
    starmapButton.addEventListener('click', () => toggleStarmap());

    if(TOUCH) {
        document.body.classList.add('touch');
        starmapButton.textContent = 'Starmap';
        touchControls = new __WEBPACK_IMPORTED_MODULE_21__ui_touch__["a" /* default */](__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["b" /* input */], canvas, {
            interact: () => Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["e" /* triggerKey */])('KeyB'),
            toggleAuto: () => Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["e" /* triggerKey */])('KeyG'),
            cycleTargets: () => Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["e" /* triggerKey */])('KeyT'),
            toggleStabilizer: () => Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["e" /* triggerKey */])('KeyX'),
            uiTap: weaponPanelClick,
            pause: () => Object(__WEBPACK_IMPORTED_MODULE_5__components_ship_handlers__["e" /* triggerKey */])('Escape'),
            zoom: (factor) => { if(state && !state.paused) targetZoom = clampZoom(targetZoom * factor); }
        });
        // Two-finger pinch on the play area zooms the view.
        const pinch = {};
        canvas.addEventListener('touchstart', (event) => {
            if(event.touches.length === 2) {
                const a = event.touches[0], b = event.touches[1];
                pinch.distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                pinch.zoom = targetZoom;
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', (event) => {
            // Only when neither finger is steering or shooting would pinch be unambiguous;
            // with the stick + aim split, a pinch is two fingers on the same side.
            if(event.touches.length !== 2 || !pinch.distance || !state || state.paused) return;
            const a = event.touches[0], b = event.touches[1];
            const sameSide = (a.clientX < window.innerWidth * 0.45) === (b.clientX < window.innerWidth * 0.45);
            if(!sameSide) return;
            const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            targetZoom = clampZoom(pinch.zoom * d / pinch.distance);
        }, { passive: true });
    }

    document.getElementById('resumeGame').addEventListener('click', () => setPaused(false));
    document.getElementById('abandonGame').addEventListener('click', () => {
        if(state) endGame('Returned to base. Cargo in the hold is kept.');
    });
};

const constructGameBoard = () => {
    if(!initialized) initialize();
    if(frameId) cancelAnimationFrame(frameId);

    __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].unlock();
    resize();
    state = createState();
    targetZoom = shipZoom();
    zoom = targetZoom;
    state.rocks = state.sectors.update(state.ship.x, state.ship.y, [], sectorRadius());
    pauseMenu.style.visibility = 'hidden';
    freeze(false);
    frameId = requestAnimationFrame(frame);
};

/* harmony default export */ __webpack_exports__["a"] = (constructGameBoard);


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);


const LIFETIME = { bullet: 1.4, plasma: 2.2 };

// Kinetic minigun rounds ('bullet') and Goa'uld staff plasma bolts ('plasma').
class Bullet {

    constructor(x, y, vx, vy, damage, kind, splash) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage || 1;
        this.kind = kind || 'bullet';
        this.splash = splash || 0;
        this.mass = this.kind === 'plasma' ? 30 : 1.2;
        this.side = 'player';    // set by the firing ship
        this.life = LIFETIME[this.kind];
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        if(this.kind === 'plasma') {
            // Big staff-weapon bolt: a white-hot head inside an orange plasma envelope,
            // stretched along its flight path and flickering.
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
            const dx = this.vx / speed;
            const dy = this.vy / speed;
            const flicker = 0.85 + Math.random() * 0.3;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0;
            [[16, 'rgba(255, 90, 20, 0.22)', 30], [10, 'rgba(255, 140, 40, 0.55)', 22], [5, 'rgba(255, 210, 120, 0.9)', 14],
                [2.4, 'rgba(255, 255, 235, 1)', 8]].forEach(layer => {
                ctx.lineWidth = layer[0] * flicker;
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(this.x - dx * layer[2], this.y - dy * layer[2]);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            });
            const head = 28 * flicker;
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* glowSprite */])('255,140,40'), this.x, this.y, head, head);
            ctx.restore();
            return;
        }
        // Short tracer streak behind the bullet, along its actual velocity
        // (so you can see it bend in an asteroid's gravity well).
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 0.012, this.y - this.vy * 0.012);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Bullet);


/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__particle_particle__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render_sprites__ = __webpack_require__(0);




// Tau'ri missiles ('missile') and Ancient drones ('drone').
const PROFILES = {
    missile: { acceleration: 520, maxSpeed: 620, lifetime: 4, retarget: 320, trail: '255,150,70', trailRate: 0.02 },
    drone: { acceleration: 900, maxSpeed: 760, lifetime: 6, retarget: 650, trail: '255,220,120', trailRate: 0.015 }
};

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class Missile {

    constructor(options) {
        this.kind = options.kind || 'missile';
        this.profile = PROFILES[this.kind];
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.angle = options.angle;
        this.damage = options.damage;
        this.blast = options.blast;
        this.target = options.target || null;
        this.homing = options.homing || 0;   // 0 = dumb-fire
        this.side = options.side || 'player';  // whose weapon it is
        this.targetMode = options.targetMode || 'both';
        this.launchDelay = options.launchDelay || 0;
        this.life = this.profile.lifetime;
        this.trailTimer = 0;
        this.time = Math.random() * 10;
        this.dead = false;
        this.exploded = false;
    }

    update(dt, rocks, particles) {
        this.life -= dt;
        this.time += dt;
        if(this.life <= 0) {
            this.dead = true;
            this.exploded = true;
            return;
        }

        const profile = this.profile;
        const armed = this.launchDelay <= 0;
        if(!armed) this.launchDelay -= dt;

        if(this.homing > 0 && armed) {
            if(!this.target || this.target.dead) this.target = this.findTarget(rocks);
            if(this.target) {
                const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["b" /* delta */])(this, this.target);
                const desired = Math.atan2(d.y, d.x);
                // Turn harder on the final approach so it doesn't circle its target.
                const distance = Math.sqrt(d.x * d.x + d.y * d.y);
                const terminal = distance < 320 ? 1 + 2.5 * (1 - distance / 320) : 1;
                const rate = this.homing * terminal * dt;
                const turn = Math.max(-rate, Math.min(rate, angleDifference(this.angle, desired)));
                this.angle += turn;
            }
        }

        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);
        const thrust = armed ? profile.acceleration : profile.acceleration * 0.3;
        this.vx += dirX * thrust * dt;
        this.vy += dirY * thrust * dt;

        // Guided weapons use side thrust to bleed off sideways drift.
        if(this.homing > 0) {
            const forward = this.vx * dirX + this.vy * dirY;
            const damp = Math.min(1, this.homing * 0.8 * dt);
            this.vx += (dirX * forward - this.vx) * damp;
            this.vy += (dirY * forward - this.vy) * damp;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > profile.maxSpeed) {
            this.vx *= profile.maxSpeed / speed;
            this.vy *= profile.maxSpeed / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.trailTimer -= dt;
        if(this.trailTimer <= 0) {
            this.trailTimer = profile.trailRate;
            particles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */]({
                x: this.x - dirX * 4, y: this.y - dirY * 4,
                vx: this.vx * 0.2 - dirX * 50, vy: this.vy * 0.2 - dirY * 50,
                life: 0.25 + Math.random() * 0.2, size: this.kind === 'drone' ? 2 : 2.5, color: profile.trail
            }));
            // Glittering pixel sparks shed along the trail.
            if(Math.random() < 0.5) {
                particles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */]({
                    x: this.x - dirX * 4, y: this.y - dirY * 4,
                    vx: this.vx * 0.3 + (Math.random() - 0.5) * 80, vy: this.vy * 0.3 + (Math.random() - 0.5) * 80,
                    life: 0.3 + Math.random() * 0.3, size: 1.4, color: profile.trail, pixel: true, glow: true
                }));
            }
            // Missiles also leave a thin smoke trail.
            if(this.kind === 'missile' && Math.random() < 0.4) {
                particles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */]({
                    x: this.x - dirX * 6, y: this.y - dirY * 6, vx: this.vx * 0.05, vy: this.vy * 0.05,
                    life: 0.8 + Math.random() * 0.6, size: 4, color: '190,185,180', dust: true, alpha: 0.14
                }));
            }
        }
    }

    findTarget(rocks) {
        if(this.targetMode === 'ships') return null;
        let best = null;
        let bestDist = this.profile.retarget * this.profile.retarget;
        rocks.forEach(rock => {
            if(rock.dead) return;
            const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["b" /* delta */])(this, rock);
            const distSq = d.x * d.x + d.y * d.y;
            if(distSq < bestDist) {
                bestDist = distSq;
                best = rock;
            }
        });
        return best;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if(this.kind === 'drone') {
            // Golden squid-like drone with a pulsing glow.
            const pulse = 0.7 + 0.3 * Math.sin(this.time * 20);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = pulse;
            Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["i" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["d" /* glowSprite */])('255,200,80'), 0, 0, 18, 18);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255, 235, 170, 0.95)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(4, 0); ctx.lineTo(-1, -2); ctx.lineTo(-4, -1.2);
            ctx.moveTo(4, 0); ctx.lineTo(-1, 2); ctx.lineTo(-4, 1.2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.strokeStyle = 'rgb(255, 160, 140)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 0);
        ctx.moveTo(-4, -2.5);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-4, 2.5);
        ctx.stroke();
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Missile);


/***/ }),
/* 28 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__render_sprites__ = __webpack_require__(0);



const ORE_LIFETIME = 90;

// A floating chunk of ore that the ship can scoop into its cargo hold.
class Ore {

    constructor(x, y, vx, vy, material) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.material = material;
        this.life = ORE_LIFETIME;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 4;
        this.radius = material === 'rock' ? 2.8 : 3.4;
        this.trail = 0;
        this.phase = Math.random() * Math.PI * 2;
        // Irregular faceted nugget outline.
        this.facets = [];
        for(let i = 0; i < 6; i++) this.facets.push(0.7 + Math.random() * 0.45);
        this.ejectTimer = 0;      // freshly jettisoned ore can't be re-collected for a moment
        this.tractored = false;   // currently held by the tractor beam (for the beam animation)
        this.dead = false;
    }

    // Tractor pull towards the ship when in range. Returns true when collected.
    update(dt, ship, canCollect) {
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
        if(this.ejectTimer > 0) this.ejectTimer -= dt;
        this.tractored = false;

        if(ship && ship.alive && canCollect && this.ejectTimer <= 0) {
            const dx = ship.x - this.x;
            const dy = ship.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;

            if(distance < ship.collectRadius) return true;

            if(distance < ship.magnetRange) {
                this.tractored = true;
                // Steer towards the ship, matching its velocity as it closes in.
                const pull = 900 * (1 - distance / ship.magnetRange) + 200;
                this.vx += (dx / distance * pull + (ship.vx - this.vx) * 3) * dt;
                this.vy += (dy / distance * pull + (ship.vy - this.vy) * 3) * dt;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        return false;
    }

    draw(ctx, time) {
        const color = __WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][this.material].color;
        const rgb = color.split(',').map(Number);
        const r = this.radius;
        const sparkle = Math.sin(time * 3 + this.phase);

        ctx.save();
        ctx.translate(this.x, this.y);

        // Soft glow in the metal colour.
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.15 * sparkle;
        ctx.drawImage(Object(__WEBPACK_IMPORTED_MODULE_1__render_sprites__["d" /* glowSprite */])(color).canvas, -r * 3, -r * 3, r * 6, r * 6);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        // Faceted nugget: dark body, lit facet, bright edge.
        ctx.rotate(this.angle);
        ctx.beginPath();
        this.facets.forEach((f, i) => {
            const a = i / 6 * Math.PI * 2;
            if(i === 0) ctx.moveTo(Math.cos(a) * r * f, Math.sin(a) * r * f);
            else ctx.lineTo(Math.cos(a) * r * f, Math.sin(a) * r * f);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgb(' + rgb.map(v => Math.round(v * 0.55)).join(',') + ')';
        ctx.fill();
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.moveTo(Math.cos(0) * r * this.facets[0], 0);
        ctx.lineTo(Math.cos(Math.PI / 3) * r * this.facets[1], Math.sin(Math.PI / 3) * r * this.facets[1]);
        ctx.lineTo(0, 0);
        ctx.lineTo(Math.cos(-Math.PI / 3) * r * this.facets[5], Math.sin(-Math.PI / 3) * r * this.facets[5]);
        ctx.closePath();
        ctx.fill();

        // Occasional glint.
        if(sparkle > 0.85) {
            const s = (sparkle - 0.85) / 0.15 * r * 2.2;
            ctx.rotate(-this.angle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
            ctx.moveTo(0, -s); ctx.lineTo(0, s);
            ctx.stroke();
        }
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ore);


/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Keyboard + mouse input. Listeners are attached once; the game reads `input`
// every physics step instead of mutating ship state from a separate interval.

const KEY_MAP = {
    KeyW: 'forward',
    KeyS: 'backward',
    KeyA: 'rotateLeft',
    KeyD: 'rotateRight',
    KeyQ: 'strafeLeft',
    KeyE: 'strafeRight',
    KeyF: 'missileKey',
    Space: 'fire'
};

// One-shot key presses (toggle auto-targeting, pause).
const pressHandlers = {};

const input = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
    strafeLeft: false,
    strafeRight: false,
    fire: false,
    missileKey: false,
    mouseDown: false,
    rightMouseDown: false,
    mouseX: window.innerWidth / 2,
    mouseY: 0,
    aimX: 0,             // mouse position in world space (set by the game each step)
    aimY: 0,
    enabled: false,

    get firing() {
        return this.fire || this.mouseDown;
    },

    get firingMissiles() {
        return this.missileKey || this.rightMouseDown;
    },

    reset() {
        Object.keys(KEY_MAP).forEach(code => { this[KEY_MAP[code]] = false; });
        this.mouseDown = false;
        this.rightMouseDown = false;
    }
};
/* harmony export (immutable) */ __webpack_exports__["b"] = input;


const onKeyPress = (code, handler) => {
    pressHandlers[code] = handler;
};
/* harmony export (immutable) */ __webpack_exports__["c"] = onKeyPress;


// Lets the game claim a click on its own canvas UI (e.g. the weapon panel) so it doesn't
// also fire the guns: `filter(x, y)` returns true if it handled the click.
let clickFilter = null;
const setClickFilter = (filter) => { clickFilter = filter; };
/* harmony export (immutable) */ __webpack_exports__["d"] = setClickFilter;


// Runs the same action a key press would (used by the on-screen touch buttons).
const triggerKey = (code) => !!(pressHandlers[code] && pressHandlers[code]({ code: code }));
/* harmony export (immutable) */ __webpack_exports__["e"] = triggerKey;


let initialized = false;

const loadInputHandlers = () => {
    if(initialized) return;
    initialized = true;

    window.addEventListener('keydown', (event) => {
        if(pressHandlers[event.code] && !event.repeat && pressHandlers[event.code](event)) {
            event.preventDefault();
            return;
        }
        const action = KEY_MAP[event.code];
        if(!action || !input.enabled) return;
        event.preventDefault();
        input[action] = true;
    });

    window.addEventListener('keyup', (event) => {
        const action = KEY_MAP[event.code];
        if(action) input[action] = false;
    });

    window.addEventListener('mousemove', (event) => {
        input.mouseX = event.clientX;
        input.mouseY = event.clientY;
    });

    window.addEventListener('mousedown', (event) => {
        if(!input.enabled) return;
        // Clicking HUD buttons shouldn't fire the guns.
        if(event.target && event.target.closest && event.target.closest('button, .cargo-panel')) return;
        if(clickFilter && clickFilter(event.clientX, event.clientY)) return;
        if(event.button === 0) input.mouseDown = true;
        if(event.button === 2) input.rightMouseDown = true;
    });

    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) input.mouseDown = false;
        if(event.button === 2) input.rightMouseDown = false;
    });

    window.addEventListener('contextmenu', (event) => {
        if(input.enabled) event.preventDefault();
    });

    // Releasing keys while the window is unfocused would otherwise leave them stuck.
    window.addEventListener('blur', () => input.reset());
};

/* harmony default export */ __webpack_exports__["a"] = (loadInputHandlers);


/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__materials__ = __webpack_require__(1);
// Endless asteroid fields. Space is divided into square sectors that are generated
// deterministically from a seed the first time the ship comes near. Sectors that
// fall out of range are put to sleep (their asteroids stored) and woken on return,
// so the map is endless while only nearby asteroids are simulated.




const SECTOR_SIZE = 1400;
/* unused harmony export SECTOR_SIZE */

const ACTIVE_RADIUS = 2;          // sectors around the ship that are simulated
const SAFE_RADIUS = 700;          // no asteroids spawn this close to the station or the gate

// Small deterministic PRNG (mulberry32).
const createRandom = (seed) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const hashSector = (seed, sx, sy) => {
    let h = seed ^ Math.imul(sx, 374761393) ^ Math.imul(sy, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
};

const sectorOf = (x, y) => ({
    sx: Math.floor(x / SECTOR_SIZE),
    sy: Math.floor(y / SECTOR_SIZE)
});
/* harmony export (immutable) */ __webpack_exports__["b"] = sectorOf;


// Distance from base measured in sectors (Chebyshev-ish, rounded).
const sectorDistance = (sx, sy) => {
    const cx = sx + 0.5;
    const cy = sy + 0.5;
    return Math.floor(Math.sqrt(cx * cx + cy * cy));
};
/* unused harmony export sectorDistance */


const generateSector = (seed, sx, sy, bias, safePoints) => {
    const random = createRandom(hashSector(seed, sx, sy));
    const distance = sectorDistance(sx, sy);
    const rocks = [];

    // Some sectors are dense fields, most are sparse, a few are empty.
    const roll = random();
    let count;
    if(roll < 0.12) count = 0;
    else if(roll < 0.8) count = 2 + Math.floor(random() * 4);
    else count = 7 + Math.floor(random() * 6 + distance * 0.5);

    // Fields cluster around a centre.
    const fieldX = (sx + 0.2 + random() * 0.6) * SECTOR_SIZE;
    const fieldY = (sy + 0.2 + random() * 0.6) * SECTOR_SIZE;

    for(let i = 0; i < count; i++) {
        const spread = SECTOR_SIZE * (count > 6 ? 0.3 : 0.5);
        const x = fieldX + (random() - 0.5) * 2 * spread;
        const y = fieldY + (random() - 0.5) * 2 * spread;
        if(safePoints.some(p => Math.sqrt((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y)) < SAFE_RADIUS)) continue;

        const giant = random() < 0.04 + distance * 0.004;
        const radius = giant ? 60 + random() * 35 : 14 + random() * 38;
        const main = Object(__WEBPACK_IMPORTED_MODULE_1__materials__["e" /* rollMaterial */])(random, distance, bias);
        const purity = main === 'rock' ? 1 : 0.45 + random() * 0.45;
        const composition = { rock: 1 - purity };
        composition[main] = (composition[main] || 0) + purity;

        // Sometimes a trace of a second metal.
        const trace = Object(__WEBPACK_IMPORTED_MODULE_1__materials__["e" /* rollMaterial */])(random, distance, bias);
        if(trace !== main && trace !== 'rock') {
            const share = 0.05 + random() * 0.15;
            composition[trace] = (composition[trace] || 0) + share;
            composition.rock = Math.max(0, composition.rock - share);
        }

        const angle = random() * Math.PI * 2;
        const speed = random() * 22;
        rocks.push(new __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__["c" /* default */]({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            composition: composition,
            random: random
        }));
    }
    return rocks;
};

class SectorManager {

    // `bias`: per-material weight multipliers for this star system; `safePoints`: places
    // (station, gate) kept clear of asteroids.
    constructor(seed, bias, safePoints) {
        this.seed = seed;
        this.bias = bias || {};
        this.safePoints = safePoints || [{ x: 0, y: 0 }];
        this.dormant = {};    // key -> sleeping rocks
        this.active = {};     // key -> true
        this.seen = {};       // key -> true once generated
    }

    // Returns the new active rock list for the ship's position.
    update(shipX, shipY, rocks, radius) {
        const center = sectorOf(shipX, shipY);
        const wanted = {};
        const r = radius || ACTIVE_RADIUS;
        for(let dx = -r; dx <= r; dx++) {
            for(let dy = -r; dy <= r; dy++) {
                wanted[(center.sx + dx) + ',' + (center.sy + dy)] = [center.sx + dx, center.sy + dy];
            }
        }

        // Put asteroids that drifted out of range to sleep in whatever sector they're in now.
        const keep = [];
        rocks.forEach(rock => {
            if(rock.dead) return;
            const s = sectorOf(rock.x, rock.y);
            const key = s.sx + ',' + s.sy;
            if(wanted[key]) {
                keep.push(rock);
            } else {
                if(!this.dormant[key]) this.dormant[key] = [];
                rock.releaseSprite();
                this.dormant[key].push(rock);
            }
        });

        Object.keys(this.active).forEach(key => {
            if(!wanted[key]) delete this.active[key];
        });

        Object.keys(wanted).forEach(key => {
            if(this.active[key]) return;
            this.active[key] = true;
            if(this.dormant[key]) {
                this.dormant[key].forEach(rock => keep.push(rock));
                delete this.dormant[key];
            } else if(!this.seen[key]) {
                this.seen[key] = true;
                generateSector(this.seed, wanted[key][0], wanted[key][1], this.bias, this.safePoints).forEach(rock => keep.push(rock));
            }
        });

        return keep;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = SectorManager;



/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ship3d__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__effects3d__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__rocks3d__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ai3d__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__hud3d__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__render3d_world3d__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__render3d_scene3d__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__components_ship_enemy__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__world_stargate__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__world_station__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__world_systems__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__render_planets__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__gameboard_travel__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__ui_dhd__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__ui_starmap__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__shipyard_shipyard__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__shipyard_profile__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__audio_audio__ = __webpack_require__(3);
// The 3D game: free six-degrees-of-freedom flight through endless 3D asteroid fields,
// mining, combat, Atlantis, the Stargate and hyperspace, all rendered with WebGL.
//
// It shares everything that isn't tied to a flat map with the classic 2D game: hulls,
// modules and stats, the shipyard and market, star systems, the DHD and starmap, gate
// dialling, sounds, enemy fits and damage rules.






















const STEP = 1 / 90;
const MAX_STEPS = 4;
const FOV = 62;
const VIEW_DISTANCE = 6000;
const ORE_LIFETIME = 90;
const GAME_OVER_DELAY = 2.6;
const STEER_DEAD_ZONE = 0.08;     // fraction of the screen where the mouse only aims

const can3D = () => Object(__WEBPACK_IMPORTED_MODULE_6__render3d_scene3d__["c" /* webglAvailable */])() && !/[?&]2d\b/.test(window.location.search);
/* harmony export (immutable) */ __webpack_exports__["a"] = can3D;


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
const mouse = { x: 0, y: 0, left: false, right: false };
const keys = {};
const domHud = {};

// ------------------------------------------------------------ setup

const systemSeed = (id) => {
    let h = Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["g" /* getProfile */])().seed || 1;
    for(let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
};

const initialize = () => {
    initialized = true;
    T = window.THREE;
    const board = document.getElementById('gameboard');
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'game3d-layer';
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

    effects = new __WEBPACK_IMPORTED_MODULE_1__effects3d__["a" /* default */](T, scene);
    rockRenderer = new __WEBPACK_IMPORTED_MODULE_2__rocks3d__["c" /* RockRenderer */](T, scene);
    oreMesh = Object(__WEBPACK_IMPORTED_MODULE_5__render3d_world3d__["e" /* buildOreCrystals */])(T);
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
    horizon = new T.Mesh(new T.CircleGeometry(__WEBPACK_IMPORTED_MODULE_9__world_stargate__["c" /* GATE_INNER */], 72), new T.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uHole: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: HORIZON_FRAGMENT,
        transparent: true, side: T.DoubleSide, depthWrite: false
    }));
    horizon.visible = false;
    scene.add(horizon);
    const cone = new T.ConeGeometry(__WEBPACK_IMPORTED_MODULE_9__world_stargate__["c" /* GATE_INNER */] * 0.95, 1, 40, 1, true);
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
        if(Object(__WEBPACK_IMPORTED_MODULE_15__ui_dhd__["b" /* isDHDOpen */])() || Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["c" /* isStarmapOpen */])() || Object(__WEBPACK_IMPORTED_MODULE_17__shipyard_shipyard__["b" /* isShipyardOpen */])()) return;
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
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].toggle(ship.stabilizer);
        banner('Stabilizer ' + (ship.stabilizer ? 'ON: cancelling drift' : 'OFF: free drift'));
    } else if(code === 'KeyH') toggleShields();
    else if(code === 'KeyG' && ship.guidance) {
        ship.autoTarget = !ship.autoTarget;
        banner('Auto-targeting ' + (ship.autoTarget ? 'ON' : 'OFF'));
    } else if(code === 'KeyT') {
        if(!ship.guidance) banner('Fit a targeting computer to choose targets');
        else {
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].toggle(true);
            banner('Targeting: ' + __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["d" /* TARGET_MODE_LABEL */][ship.cycleTargetMode()]);
        }
    } else if(code === 'KeyV') {
        state.freeAim = !state.freeAim;
        banner(state.freeAim ? 'Free aim: the mouse aims without steering' : 'Mouse steering ON');
    } else if(code === 'KeyB') interact();
    else if(code === 'KeyM' || code === 'KeyJ') openStarmap();
    else if(code === 'KeyN' && Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["i" /* isDebug */])()) spawnEnemy(null, null, true);
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
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].toggle(on);
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
    const stats = Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["f" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["g" /* getProfile */])().hull);
    const ship = new __WEBPACK_IMPORTED_MODULE_0__ship3d__["c" /* default */](T, stats, 'player', effects.texture);
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
    state.gate = new __WEBPACK_IMPORTED_MODULE_9__world_stargate__["e" /* default */](system.gate.x, system.gate.y);
    state.gatePos = new T.Vector3(system.gate.x, system.gate.y, 0);
    state.dhdPos = new T.Vector3(system.gate.x + 260, system.gate.y, -20);
    state.stationPos = system.station ? new T.Vector3(__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y, 0) : null;
    const safe = [{ x: state.gatePos.x, y: state.gatePos.y, z: 0 }];
    if(state.stationPos) safe.push({ x: 0, y: 0, z: 0 });
    state.field = new __WEBPACK_IMPORTED_MODULE_2__rocks3d__["a" /* Field3D */](systemSeed(system.id), system.materials, safe);

    if(system.station) {
        state.station = Object(__WEBPACK_IMPORTED_MODULE_5__render3d_world3d__["b" /* buildAtlantis */])(T, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */]);
        scene.add(state.station);
    }
    state.gateModel = Object(__WEBPACK_IMPORTED_MODULE_5__render3d_world3d__["d" /* buildGate */])(T, __WEBPACK_IMPORTED_MODULE_9__world_stargate__["d" /* GATE_RADIUS */], __WEBPACK_IMPORTED_MODULE_9__world_stargate__["c" /* GATE_INNER */], Object(__WEBPACK_IMPORTED_MODULE_9__world_stargate__["f" /* gateSymbolSprite */])(), __WEBPACK_IMPORTED_MODULE_9__world_stargate__["a" /* CHEVRON_ANGLES */]);
    state.gateModel.group.position.copy(state.gatePos);
    scene.add(state.gateModel.group);
    horizon.position.set(state.gatePos.x, state.gatePos.y, -9);
    kawoosh.position.set(state.gatePos.x, state.gatePos.y, -9);
    state.dhd = Object(__WEBPACK_IMPORTED_MODULE_5__render3d_world3d__["c" /* buildDHD */])(T);
    state.dhd.group.position.copy(state.dhdPos);
    scene.add(state.dhd.group);
    const planet = Object(__WEBPACK_IMPORTED_MODULE_5__render3d_world3d__["f" /* buildPlanet */])(T, system, __WEBPACK_IMPORTED_MODULE_13__render_planets__["a" /* PALETTES */][system.planet.type] || __WEBPACK_IMPORTED_MODULE_13__render_planets__["a" /* PALETTES */].rocky);
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
        ship.position.set(__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x + 520, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y, 60);
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
    if(kind === 'plasma') __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].plasmaImpact();
    else if(kind !== 'beam') __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].rockHit(rock.radius < 40);

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
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].rockCrack();
        return;
    }
    rock.radius = Math.cbrt(volume);
    if(rock.radius > 28 && rock.wear > rock.radius * 2.5) splitRock(rock, out);
};

const splitRock = (rock, hitDir) => {
    rock.dead = true;
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].rockCrack();
    const pieces = rock.radius > 90 ? 3 : 2;
    const r = rock.radius * Math.cbrt(1 / pieces);
    // Pieces drift apart sideways from the line of the cut.
    const side = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(hitDir).normalize();
    for(let i = 0; i < pieces; i++) {
        const a = (i / pieces) * Math.PI * 2;
        const offset = side.clone().applyAxisAngle(hitDir, a).multiplyScalar(r * 0.9);
        const speed = 18 + Math.random() * 18;
        state.rocks.push(new __WEBPACK_IMPORTED_MODULE_2__rocks3d__["b" /* Rock3D */]({
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
                __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].shieldHit(0.3);
            } else if(!ship.shieldUp && d < ship.magnetRange) {
                tractored++;
                ore.tractored = true;
                const pull = 260 + (1 - d / ship.magnetRange) * 500;
                ore.vx += (dx / d * pull + (ship.vx - ore.vx) * 3) * dt;
                ore.vy += (dy / d * pull + (ship.vy - ore.vy) * 3) * dt;
                ore.vz += (dz / d * pull + (ship.vz - ore.vz) * 3) * dt;
                if(d < ship.collectRadius) {
                    if(Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["u" /* storeOre */])(ore.material, ship.cargoCapacity)) {
                        ore.dead = true;
                        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].pickup(__WEBPACK_IMPORTED_MODULE_12__world_materials__["b" /* default */][ore.material].price);
                        floatText(ore, '+' + __WEBPACK_IMPORTED_MODULE_12__world_materials__["b" /* default */][ore.material].name, __WEBPACK_IMPORTED_MODULE_12__world_materials__["b" /* default */][ore.material].color);
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
    if(Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["d" /* cargoUsed */])() < ship.cargoCapacity) state.holdFullWarned = false;
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
            ship.takeDamage(b.damage * __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["b" /* SHIP_DAMAGE */][b.kind], __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["a" /* DAMAGE_TYPE */][b.kind]);
            const dir = new T.Vector3(b.vx, b.vy, b.vz).normalize();
            ship.velocity.addScaledVector(dir, b.mass * 6 / ship.stats.mass);
            effects.burst(p, ship.velocity, b.kind === 'plasma' ? 16 : 5, { minSpeed: 40, maxSpeed: b.kind === 'plasma' ? 220 : 160, minLife: 0.15, maxLife: 0.45, size: b.kind === 'plasma' ? 4 : 2.2,
                color: hit.shield ? (ship.hullDef.shieldColor || '120,210,255') : (b.kind === 'plasma' ? '255,170,60' : '255,220,160'), drag: 0.8 });
            if(b.kind === 'plasma') __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].plasmaImpact();
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
    if(drone) __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].droneImpact();
    else __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].missileExplosion();
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
    const type = __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["a" /* DAMAGE_TYPE */][m.kind];
    state.combat.hostileShips(m.side).forEach(ship => {
        const d = dist(ship, p);
        const reach = m.blast + ship.radius * 0.8;
        if(d > reach) return;
        const falloff = 1 - d / reach;
        ship.takeDamage(m.damage * __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["b" /* SHIP_DAMAGE */][m.kind] * (0.4 + 0.6 * falloff), type);
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
            h.object.takeDamage(h.damage * __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["b" /* SHIP_DAMAGE */].beam, 'energy', true);
        } else {
            h.object.vx += h.dir.x * 0.4; h.object.vy += h.dir.y * 0.4; h.object.vz += h.dir.z * 0.4;
            hitRock(h.object, h.damage, h.point, h.dir, 'beam');
        }
        if(Math.random() < 0.4) effects.burst(h.point, null, 1, { minSpeed: 40, maxSpeed: 160, minLife: 0.15, maxLife: 0.4, size: 3, color: '190,230,255' });
        if(Math.random() < 0.3) __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].beamImpact();
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
            if(!ship.shieldUp) __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].explosion(0.5);
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
        const id = hullId || Object(__WEBPACK_IMPORTED_MODULE_8__components_ship_enemy__["e" /* pickEnemyHull */])(state.system.id);
        const enemy = Object(__WEBPACK_IMPORTED_MODULE_3__ai3d__["a" /* createEnemy3D */])(T, id, level || (Math.random() < 0.35 ? 3 : 2), p, effects.texture);
        enemy.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), ship.position.clone().sub(p).normalize());
        state.enemies.push(enemy);
        scene.add(enemy.group);
        if(id === 'glider' && !hullId) {
            const wing = Object(__WEBPACK_IMPORTED_MODULE_3__ai3d__["a" /* createEnemy3D */])(T, 'glider', enemy.level, p.clone().add(new T.Vector3(80, 60, 40)), effects.texture);
            wing.quaternion.copy(enemy.quaternion);
            state.enemies.push(wing);
            scene.add(wing.group);
        }
        banner('Hostile ' + enemy.hullDef.name + (id === 'glider' && !hullId ? ' pair' : '') + ' detected (Mk ' + (enemy.level === 3 ? 'III' : 'II') + ')', 2.5);
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].scanPing();
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
            if(state.enemies.length < Object(__WEBPACK_IMPORTED_MODULE_8__components_ship_enemy__["c" /* enemyConfig */])(state.system.id).max) spawnEnemy();
        }
    }
    const target = state.combat.player[0] || null;
    const avoid = state.stationPos ? { position: state.stationPos, radius: __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].shieldRadius + 260 } : null;
    state.enemies.forEach(enemy => {
        const inRange = target && enemy.position.distanceTo(ship.position) < 4000;
        Object(__WEBPACK_IMPORTED_MODULE_3__ai3d__["b" /* updateEnemyAI3D */])(T, enemy, dt, { target: inRange ? target : null, rocks: state.rocks, incoming: state.combat.missiles.player,
            friends: state.combat.enemies, avoid: avoid });
        enemy.update(dt, enemy.ai.controls, world());
    });
};

const updateEnemyLosses = () => {
    state.enemies.forEach(enemy => {
        if(enemy.alive || enemy.counted) return;
        enemy.counted = true;
        Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["b" /* addCredits */])(enemy.bounty);
        floatText(enemy, '+' + enemy.bounty + ' cr', '255,215,120');
        banner(enemy.hullDef.name + ' destroyed  +' + enemy.bounty + ' credits', 2.2);
        effects.explosion(enemy.position, enemy.velocity, enemy.radius * 2.2, '255,180,110');
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].missileExplosion();
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
        if(ship.velocity.length() > __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].maxDockSpeed) banner('Too fast to dock: slow down (X stabilizer)');
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
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].dock();
    Object(__WEBPACK_IMPORTED_MODULE_17__shipyard_shipyard__["a" /* getShipyard */])().open({
        tab: Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["d" /* cargoUsed */])() > 0 ? 'market' : 'ship',
        closeLabel: 'Undock',
        canTrade: true,
        hullStatus: () => ({ hp: ship.hp, max: Math.round(ship.maxHull) }),
        repair: (points) => { ship.hp = Math.min(ship.maxHull, ship.hp + points); },
        onClose: () => {
            if(!state) return;
            scene.remove(ship.group);
            ship.applyStats(Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["f" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["g" /* getProfile */])().hull));
            scene.add(ship.group);
            ship.shield = ship.maxShield;
            ship.immunity = 1.5;
            ship.position.set(__WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].x + 520, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].y, 60);
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
    Object(__WEBPACK_IMPORTED_MODULE_15__ui_dhd__["a" /* getDHD */])().open({
        systemId: state.system.id,
        systemName: state.system.name,
        originIndex: __WEBPACK_IMPORTED_MODULE_11__world_systems__["b" /* SYSTEMS */].indexOf(state.system),
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
    if(!state || state.transition || state.docked || Object(__WEBPACK_IMPORTED_MODULE_15__ui_dhd__["b" /* isDHDOpen */])() || Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["c" /* isStarmapOpen */])()) return;
    state.paused = true;
    freeze(true);
    let engageTarget = null;
    Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["a" /* getStarmap */])().open({
        systemId: state.system.id,
        originIndex: __WEBPACK_IMPORTED_MODULE_11__world_systems__["b" /* SYSTEMS */].indexOf(state.system),
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
    const distance = Object(__WEBPACK_IMPORTED_MODULE_11__world_systems__["f" /* distanceBetween */])(state.system.id, target.id);
    const duration = Object(__WEBPACK_IMPORTED_MODULE_16__ui_starmap__["b" /* hyperTravelTime */])(distance, ship.hyperdrive.speed);
    state.transition = { type: 'hyper', phase: 'window', t: 0, target: target, duration: duration, distance: distance,
        window: ship.position.clone().addScaledVector(ship.forward(), ship.radius * 3 + 150) };
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].hyperOpen();
    banner('Hyperdrive engaged: ' + target.name, 2);
};

const startGateTravel = () => {
    state.transition = { type: 'gate', phase: 'tunnel', t: 0, target: Object(__WEBPACK_IMPORTED_MODULE_11__world_systems__["g" /* systemById */])(state.gate.target) };
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].gateEnter();
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].stopAll();
    state.gate.close(true);
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].wormhole();
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
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].startEngine();
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].gateArrive();
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].horizon(true);
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
                __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].hyperTravel(true);
            }
        }
        return false;
    }
    if(tr.phase === 'travel' && tr.t >= tr.duration) {
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].hyperTravel(false);
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].hyperExit();
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
    if(Math.sqrt(dx * dx + dy * dy) > __WEBPACK_IMPORTED_MODULE_9__world_stargate__["c" /* GATE_INNER */] * 0.85) return;
    if(ship.radius > __WEBPACK_IMPORTED_MODULE_9__world_stargate__["c" /* GATE_INNER */] * 0.95) {
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
            const R = __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].shieldRadius + 60 + r.radius;
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
    state.canDock = !!state.stationPos && ship.alive && stationDistance() < __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].dockRadius;
    state.nearDHD = ship.alive && ship.position.distanceTo(state.dhdPos) < __WEBPACK_IMPORTED_MODULE_9__world_stargate__["b" /* DHD_RANGE */] * 1.4;
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
        if(count >= __WEBPACK_IMPORTED_MODULE_5__render3d_world3d__["a" /* ORE_LIMIT */]) return;
        p.set(o.x, o.y, o.z);
        e.set(o.angle * 0.7 + o.phase, o.phase, o.angle);
        q.setFromEuler(e);
        s.setScalar(o.radius * 1.5);
        m.compose(p, q, s);
        oreMesh.setMatrixAt(count, m);
        const col = __WEBPACK_IMPORTED_MODULE_12__world_materials__["b" /* default */][o.material].color.split(',');
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
        kawoosh.scale.set(1 + burst * 0.4, 1 + burst * 0.4, Math.max(1, __WEBPACK_IMPORTED_MODULE_9__world_stargate__["c" /* GATE_INNER */] * 3 * burst));
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
        Object(__WEBPACK_IMPORTED_MODULE_14__gameboard_travel__["c" /* drawWormhole */])(ctx, width, height, state.time, Math.min(1, tr.t / 3.4));
        updateDomHud();
        return;
    }
    if(tr && tr.type === 'hyper' && tr.phase === 'travel') {
        Object(__WEBPACK_IMPORTED_MODULE_14__gameboard_travel__["b" /* drawHyperspace */])(ctx, width, height, state.time, Math.min(1, tr.t / tr.duration),
            'Hyperspace · ' + tr.target.name + ' · ' + Math.round(tr.distance).toLocaleString('en-US') + ' ly · ' + Math.max(0, tr.duration - tr.t).toFixed(1) + ' s');
        updateDomHud();
        return;
    }

    // Markers: enemies, Atlantis, the gate and DHD.
    state.enemies.forEach(e => {
        if(!e.alive) return;
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["b" /* drawMarker */])(ctx, width, height, { p: project(e.position), size: screenSize(e.position, e.radius) + 6, color: '255,90,70',
            label: e.hullDef.name + ' Mk ' + (e.level === 3 ? 'III' : 'II'), distance: e.position.distanceTo(ship.position),
            hull: e.hp / e.maxHull, shield: e.maxShield > 0 ? e.shield / e.maxShield : undefined });
    });
    if(state.stationPos) {
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["b" /* drawMarker */])(ctx, width, height, { p: project(state.stationPos), size: screenSize(state.stationPos, __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].dockRadius), color: state.canDock ? '140,255,160' : '140,200,255',
            label: 'ATLANTIS', distance: stationDistance(), shape: 'circle' });
    }
    Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["b" /* drawMarker */])(ctx, width, height, { p: project(state.gatePos), size: screenSize(state.gatePos, __WEBPACK_IMPORTED_MODULE_9__world_stargate__["d" /* GATE_RADIUS */]) + 4, color: '255,170,110',
        label: 'GATE', distance: ship.position.distanceTo(state.gatePos), shape: 'circle' });
    if(state.nearDHD || ship.position.distanceTo(state.dhdPos) < 900) {
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["b" /* drawMarker */])(ctx, width, height, { p: project(state.dhdPos), size: screenSize(state.dhdPos, 34), color: state.nearDHD ? '140,255,160' : '200,210,230',
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
        if(!p.behind) Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["e" /* drawText */])(ctx, f.text, p.x, p.y, 12, 'rgba(' + f.color + ',' + Math.min(1, f.life) + ')');
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
    Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["d" /* drawRadar */])(ctx, width, height, contacts);

    state.weaponRows = Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["f" /* drawWeapons */])(ctx, width, height, ship.weaponStatus());
    // Speed and prompts.
    Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["e" /* drawText */])(ctx, Math.round(ship.velocity.length()) + ' m/s' + (ship.stabilizer ? '  STAB' : ''), width / 2, height - 24, 13, 'rgba(200, 220, 255, 0.85)');
    if(state.canDock) {
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["e" /* drawText */])(ctx, ship.velocity.length() > __WEBPACK_IMPORTED_MODULE_10__world_station__["a" /* STATION */].maxDockSpeed ? 'Slow down to dock (X: stabilizer)' : 'Press B to dock at Atlantis', width / 2, height - 60, 16, 'rgba(140, 255, 160, 0.95)');
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
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["c" /* drawNose */])(ctx, width, height, project(ship.position.clone().addScaledVector(ship.forward(), 2000)), Math.min(width, height) * 0.42 * STEER_DEAD_ZONE);
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["a" /* drawCrosshair */])(ctx, mouse.x, mouse.y, !state.freeAim, !!(state.controls.aimTarget && state.controls.aimTarget.hullDef));
    }
    if(state.bannerTimer > 0) {
        Object(__WEBPACK_IMPORTED_MODULE_4__hud3d__["e" /* drawText */])(ctx, state.bannerText, width / 2, height * 0.24, 22, 'rgba(255, 255, 255, ' + Math.min(1, state.bannerTimer) + ')');
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
    const used = Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["d" /* cargoUsed */])();
    setText('credits', 'Credits: ' + Math.round(Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["g" /* getProfile */])().credits).toLocaleString('en-US'));
    setText('location', state.system.name + (state.stationPos ? ' · Atlantis ' + (stationDistance() / 1000).toFixed(1) + 'k' : '') + ' · 3D');
    setText('fps', 'Fps: ' + Math.round(fps) + ' (3D)');
    setText('targeting', 'Stabilizer: ' + (ship.stabilizer ? 'ON' : 'OFF') + ' (X)' +
        (ship.guidance ? ' · Auto-target: ' + (ship.autoTarget ? 'ON' : 'OFF') + ' (G) · Targets: ' + __WEBPACK_IMPORTED_MODULE_7__components_ship_ship__["d" /* TARGET_MODE_LABEL */][ship.targetMode] + ' (T)' : ''));
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
    if(frozen) __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].stopAll();
    else {
        __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].startEngine();
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
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].setThrust(ship.alive && ship.thrusting && !tunnel);
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].setFiring(ship.alive && ship.minigunFiring);
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].setBeam(ship.alive && ship.beaming);
            __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].setTractor(ship.alive && state.tractorCount > 0, Math.min(1, state.tractorCount / 6));
        } else {
            elapsed = 0;
        }
        render(elapsed);
        if(state.gameOverTimer >= GAME_OVER_DELAY) {
            Object(__WEBPACK_IMPORTED_MODULE_18__shipyard_profile__["k" /* loseCargo */])();
            endGame('Ship destroyed! The cargo was lost. Your credits and ship are safe at the shipyard.');
            return;
        }
    } catch(error) {
        if(window.console) console.error('3D frame error:', error);
        if(state) banner('Error: ' + ((error && error.message) || error), 4);
    }
    if(state) frameId = requestAnimationFrame(frame);
};

// Launch the 3D game from the menu. `exit` is called when it returns to the menu.
const start3D = (exit) => {
    onExit = exit || null;
    if(!initialized) initialize();
    __WEBPACK_IMPORTED_MODULE_19__audio_audio__["a" /* default */].unlock();
    renderer.domElement.style.display = '';
    hudCanvas.style.display = '';
    resize();
    state = createState();
    state.system = Object(__WEBPACK_IMPORTED_MODULE_11__world_systems__["g" /* systemById */])('lantea');
    enterSystem(state.system, null);
    state.cameraSnap = true;
    mouse.x = width / 2;
    mouse.y = height / 2;
    document.getElementById('pauseMenu').style.visibility = 'hidden';
    freeze(false);
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
};
/* harmony export (immutable) */ __webpack_exports__["b"] = start3D;


// For tests and debugging.
const game3dState = () => state;
/* unused harmony export game3dState */

const game3dProject = (p) => project(p);
/* unused harmony export game3dProject */

const spawnEnemy3D = (hullId, level) => (state ? spawnEnemy(hullId, level, true) : null);
/* unused harmony export spawnEnemy3D */



/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
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

const glowTexture = (THREE) => {
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
/* unused harmony export glowTexture */


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

/* harmony default export */ __webpack_exports__["a"] = (Effects3D);


/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__render3d_world3d__ = __webpack_require__(16);
// Asteroids in 3D: faceted rock bodies tumbling through space, generated in endless cubic
// sectors around the ship. Mining chips them smaller and splits the big ones; ore is
// spawned by the game when they are hit.




const SECTOR = 2000;
/* unused harmony export SECTOR */

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

class Rock3D {

    constructor(o) {
        this.id = nextId++;
        this.x = o.x; this.y = o.y; this.z = o.z;
        this.vx = o.vx || 0; this.vy = o.vy || 0; this.vz = o.vz || 0;
        this.radius = o.radius;
        this.variant = o.variant === undefined ? Math.floor(Math.random() * VARIANTS) : o.variant;
        this.composition = o.composition || { rock: 1 };
        this.material = Object(__WEBPACK_IMPORTED_MODULE_0__world_materials__["c" /* dominantMaterial */])(this.composition);
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
        return Object(__WEBPACK_IMPORTED_MODULE_0__world_materials__["d" /* pickFromComposition */])(this.composition, Math.random);
    }
}
/* harmony export (immutable) */ __webpack_exports__["b"] = Rock3D;


// ------------------------------------------------------------ sectors

const sectorKey = (sx, sy, sz) => sx + ',' + sy + ',' + sz;
const sectorOf3 = (x, y, z) => ({ sx: Math.floor(x / SECTOR), sy: Math.floor(y / SECTOR), sz: Math.floor(z / SECTOR) });
/* unused harmony export sectorOf3 */


class Field3D {

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
            const main = Object(__WEBPACK_IMPORTED_MODULE_0__world_materials__["e" /* rollMaterial */])(rnd, distance, this.bias);
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
/* harmony export (immutable) */ __webpack_exports__["a"] = Field3D;


// ------------------------------------------------------------ rendering

// Faceted rock shapes: a subdivided icosahedron pushed in and out by noise and craters,
// squashed a little, with darker cavities and lighter ridges.
const buildVariant = (THREE, index) => {
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const noise = Object(__WEBPACK_IMPORTED_MODULE_1__render3d_world3d__["g" /* makeNoise */])(9000 + index * 131);
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
        if(id === 'rock' || !__WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id]) return;
        const t = __WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color.split(',').map(v => parseFloat(v) / 255);
        const share = composition[id] * 0.55;
        c = c.map((v, i) => v * (1 - share) + t[i] * share);
    });
    return c;
};

class RockRenderer {

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
/* harmony export (immutable) */ __webpack_exports__["c"] = RockRenderer;



/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ship3d__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shipyard_hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shipyard_profile__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ship_enemy__ = __webpack_require__(10);
// Enemy ships in 3D: the same hulls and faction fits as before, flown by an AI pilot that
// steers in all three dimensions.






const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const createEnemy3D = (THREE, hullId, level, position, glowTexture) => {
    const hull = __WEBPACK_IMPORTED_MODULE_1__shipyard_hulls__["b" /* default */][hullId];
    const ship = new __WEBPACK_IMPORTED_MODULE_0__ship3d__["c" /* default */](THREE, Object(__WEBPACK_IMPORTED_MODULE_2__shipyard_profile__["f" /* computeShipStats */])(hullId, Object(__WEBPACK_IMPORTED_MODULE_3__components_ship_enemy__["d" /* enemyLoadout */])(hull, level)), 'enemy', glowTexture);
    ship.position.copy(position);
    ship.damageScale = __WEBPACK_IMPORTED_MODULE_3__components_ship_enemy__["a" /* ENEMY_DAMAGE */];
    ship.autoTarget = false;
    ship.stabilizer = true;
    ship.immunity = 0.6;
    ship.level = level;
    const kinds = ship.turrets.map(t => t.kind).concat(ship.launchers.map(l => l.kind));
    ship.ai = {
        controls: { thrust: 0, strafe: 0, lift: 0, pitch: 0, yaw: 0, roll: 0, fire: false, missiles: false, aimPoint: null, lockTarget: null },
        mode: 'attack', modeTimer: 0, orbit: Math.random() < 0.5 ? 1 : -1, orbitTimer: 3 + Math.random() * 3,
        missileTimer: 1.5 + Math.random() * 2, evadeTimer: 0, aimError: new THREE.Vector3(),
        range: (kinds.indexOf('beam') !== -1 ? 380 : kinds.indexOf('staff') !== -1 || kinds.indexOf('minigun') !== -1 ? 450 : 700) + hull.radius * 1.2,
        gunReach: (kinds.indexOf('beam') !== -1 ? 650 : kinds.indexOf('staff') !== -1 ? 750 : 850) + hull.radius * 0.5,
        projectileSpeed: kinds.indexOf('staff') !== -1 ? __WEBPACK_IMPORTED_MODULE_0__ship3d__["b" /* PLASMA_SPEED */] : __WEBPACK_IMPORTED_MODULE_0__ship3d__["a" /* BULLET_SPEED */]
    };
    ship.bounty = Math.round((150 + hull.cost * 0.12) * (level === 3 ? 1.5 : 1));
    return ship;
};
/* harmony export (immutable) */ __webpack_exports__["a"] = createEnemy3D;


// Turn towards world direction `dir`: yaw / pitch controls proportional to the error in the
// ship's own frame (the flight model turns them into turn rates). Returns the angle off.
const steer = (ship, c, dir) => {
    const local = dir.clone().applyQuaternion(ship.invQuat());
    const yawError = Math.atan2(-local.y, local.x);
    const pitchError = Math.atan2(local.z, Math.sqrt(local.x * local.x + local.y * local.y));
    c.yaw = clamp(yawError * 2.2, -1, 1);
    c.pitch = clamp(pitchError * 2.2, -1, 1);
    c.roll = 0;
    return Math.acos(clamp(local.x / (local.length() || 1), -1, 1));
};

// One AI tick. `world` gives the target (player or null), rocks, the player's missiles,
// the other enemies and an optional { position, radius } to keep out of (Atlantis).
const updateEnemyAI3D = (THREE, ship, dt, world) => {
    const ai = ship.ai;
    const c = ai.controls;
    c.thrust = c.strafe = c.lift = 0;
    c.fire = c.missiles = false;
    c.lockTarget = null;
    if(!ship.alive) return;
    const target = world.target;
    const fighter = ship.radius < 45;
    ai.modeTimer -= dt;
    ai.evadeTimer -= dt;
    ai.orbitTimer -= dt;
    if(ai.orbitTimer <= 0) {
        ai.orbit = -ai.orbit;
        ai.orbitTimer = 3 + Math.random() * 4;
        ai.aimError.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05);
    }

    if(world.avoid) {
        const away = ship.position.clone().sub(world.avoid.position);
        if(away.length() < world.avoid.radius + ship.radius) {
            steer(ship, c, away.normalize());
            c.thrust = 1;
            return;
        }
    }
    if(!target) {
        c.yaw = c.pitch = c.roll = 0;
        return;
    }

    const toTarget = new THREE.Vector3(target.x - ship.x, target.y - ship.y, target.z - ship.z);
    const distance = toTarget.length() || 1;
    const dir = toTarget.clone().divideScalar(distance);
    const range = ai.range;

    // Badly damaged: withdraw until the shields are back.
    if(ai.mode !== 'retreat' && ship.hp / ship.maxHull < 0.3 && ship.maxShield > 0 && !ai.retreated) {
        ai.mode = 'retreat';
        ai.modeTimer = 8 + Math.random() * 4;
        ai.retreated = true;
    }
    if(ai.mode === 'retreat') {
        if(ai.modeTimer <= 0 || (ship.shield > ship.maxShield * 0.8 && distance > 1600)) ai.mode = 'attack';
        else {
            steer(ship, c, dir.clone().negate());
            c.thrust = 1;
            return;
        }
    }

    // Threats: the player's missiles and drones closing in.
    let threat = null;
    let threatDistance = Infinity;
    world.incoming.forEach(m => {
        if(m.dead) return;
        const mx = ship.x - m.x, my = ship.y - m.y, mz = ship.z - m.z;
        const d = Math.sqrt(mx * mx + my * my + mz * mz);
        if(d > 450 + ship.radius) return;
        if((m.vx * mx + m.vy * my + m.vz * mz) / (d || 1) > 120 && d < threatDistance) {
            threat = m;
            threatDistance = d;
        }
    });
    if(threat && fighter && ai.evadeTimer <= 0) {
        ai.evadeTimer = 0.7;
        ai.evadeSide = Math.random() < 0.5 ? 1 : -1;
        ai.evadeLift = Math.random() < 0.5 ? 1 : -1;
    }

    // Aim: shoot close missiles down if it has guns, otherwise lead the target.
    const shootDown = threat && threat.kind === 'missile' && threatDistance < 350 && ship.turrets.some(t => t.kind === 'minigun');
    const aimAt = shootDown ? threat : target;
    const t = Math.sqrt((aimAt.x - ship.x) * (aimAt.x - ship.x) + (aimAt.y - ship.y) * (aimAt.y - ship.y) + (aimAt.z - ship.z) * (aimAt.z - ship.z)) / ai.projectileSpeed;
    const lead = new THREE.Vector3(aimAt.x + (aimAt.vx || 0) * t, aimAt.y + (aimAt.vy || 0) * t, aimAt.z + (aimAt.vz || 0) * t);
    const leadDir = lead.clone().sub(ship.position);
    const leadDistance = leadDir.length();
    leadDir.normalize().add(ai.aimError).normalize();
    c.aimPoint = ship.position.clone().addScaledVector(leadDir, leadDistance);

    if(fighter) {
        // Attack runs: charge in, break off past the target, swing back round.
        if(ai.mode === 'attack') {
            const off = steer(ship, c, lead.clone().sub(ship.position).normalize());
            c.thrust = off < 0.7 ? 1 : 0.2;
            if(distance < Math.max(180, range * 0.45)) {
                ai.mode = 'break';
                ai.modeTimer = 1.2 + Math.random() * 0.8;
                // Break away at an angle to the attack line.
                const side = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(dir).normalize();
                ai.breakDir = dir.clone().multiplyScalar(0.4).add(side).normalize();
            }
        } else {
            steer(ship, c, ai.breakDir);
            c.thrust = 1;
            if((ai.modeTimer <= 0 && distance > range * 0.9) || ai.modeTimer < -3) ai.mode = 'attack';
        }
    } else {
        // Capital ships hold their standoff distance and circle slowly.
        ai.mode = 'attack';
        const off = steer(ship, c, dir);
        if(distance > range * 1.05 && off < 1.2) c.thrust = 1;
        if(distance < range * 0.7) c.thrust = -1;
        if(distance < range * 1.2) c.strafe = ai.orbit;
    }
    if(ai.evadeTimer > 0) {
        c.strafe = ai.evadeSide;
        c.lift = ai.evadeLift;
    }

    // Spacing from the other enemies, and asteroids in the way.
    world.friends.forEach(other => {
        if(other === ship || !other.alive) return;
        const reach = other.radius + ship.radius + 70;
        if(other.position.distanceToSquared(ship.position) < reach * reach) {
            c.lift = other.z > ship.z ? -1 : 1;
        }
    });
    const ahead = ship.forward().multiplyScalar(ship.radius + 120).add(ship.position);
    for(let i = 0; i < world.rocks.length; i++) {
        const rock = world.rocks[i];
        if(rock.dead) continue;
        const reach = rock.radius + ship.radius + 60;
        const dx = rock.x - ahead.x, dy = rock.y - ahead.y, dz = rock.z - ahead.z;
        if(dx * dx + dy * dy + dz * dz > reach * reach) continue;
        const local = new THREE.Vector3(dx, dy, dz).applyQuaternion(ship.invQuat());
        c.strafe = local.y > 0 ? 1 : -1;     // rock to port: slide to starboard, and vice versa
        c.lift = local.z > 0 ? -1 : 1;
        if(fighter) c.thrust = Math.min(c.thrust, 0.3);
        break;
    }

    c.fire = !!shootDown || distance - (target.radius || 0) * 0.8 < ai.gunReach;
    ai.missileTimer -= dt;
    const playerDrones = world.incoming.some(m => m.kind === 'drone' && !m.dead);
    if(ship.launchers.length && (ai.missileTimer <= 0 || playerDrones) && distance < 1500 && distance > 150) {
        c.missiles = true;
        c.lockTarget = target;
        if(ship.launchers.every(l => l.cooldown > 0) || Math.random() < 0.02) ai.missileTimer = 2 + Math.random() * 3;
    }
};
/* harmony export (immutable) */ __webpack_exports__["b"] = updateEnemyAI3D;



/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Heads-up display for the 3D game, drawn on a 2D canvas over the 3D view: crosshair, nose
// marker, target brackets, edge arrows, a 3D radar, the weapons panel and messages.

const RADAR_RANGE = 3500;

const drawCrosshair = (ctx, x, y, steering, onTarget) => {
    ctx.save();
    ctx.strokeStyle = onTarget ? 'rgba(255, 110, 90, 0.95)' : 'rgba(255, 140, 120, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, onTarget ? 10 : 8, 0, Math.PI * 2);
    ctx.moveTo(x - 16, y); ctx.lineTo(x - 5, y);
    ctx.moveTo(x + 5, y); ctx.lineTo(x + 16, y);
    ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 5);
    ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 16);
    ctx.stroke();
    if(!steering) {
        ctx.font = '9px Bungee, sans-serif';
        ctx.fillStyle = 'rgba(255, 180, 150, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('FREE AIM', x, y + 30);
    }
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["a"] = drawCrosshair;


// Where the ship's nose points, and the dead zone of mouse steering around the centre.
const drawNose = (ctx, w, h, nose, deadZone) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 200, 255, 0.25)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, deadZone, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if(nose && !nose.behind) {
        ctx.strokeStyle = 'rgba(170, 220, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nose.x - 7, nose.y); ctx.lineTo(nose.x - 2, nose.y);
        ctx.moveTo(nose.x + 2, nose.y); ctx.lineTo(nose.x + 7, nose.y);
        ctx.moveTo(nose.x, nose.y + 2); ctx.lineTo(nose.x, nose.y + 6);
        ctx.stroke();
    }
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["c"] = drawNose;


// A marked object: brackets (with optional bars and label) when on screen, otherwise an
// arrow at the screen edge pointing towards it.
//   m: { p: projected {x, y, behind}, size, color, label, distance, hull, shield, shape }
const drawMarker = (ctx, w, h, m) => {
    const margin = 36;
    const p = m.p;
    const onScreen = !p.behind && p.x > -20 && p.x < w + 20 && p.y > -20 && p.y < h + 20;
    ctx.save();
    ctx.strokeStyle = 'rgba(' + m.color + ', 0.9)';
    ctx.fillStyle = 'rgba(' + m.color + ', 0.9)';
    ctx.lineWidth = 1.4;
    ctx.font = '10px Bungee, sans-serif';
    ctx.textAlign = 'center';
    if(onScreen) {
        const r = Math.max(10, Math.min(220, m.size));
        if(m.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const c = r * 0.4;
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(k => {
                ctx.beginPath();
                ctx.moveTo(p.x + k[0] * r, p.y + k[1] * (r - c));
                ctx.lineTo(p.x + k[0] * r, p.y + k[1] * r);
                ctx.lineTo(p.x + k[0] * (r - c), p.y + k[1] * r);
                ctx.stroke();
            });
        }
        let y = p.y - r - 8;
        if(m.hull !== undefined) {
            const bw = Math.max(36, r * 1.4);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(p.x - bw / 2, y - 3, bw, 3.5);
            ctx.fillStyle = 'rgb(255, 110, 80)';
            ctx.fillRect(p.x - bw / 2, y - 3, bw * Math.max(0, m.hull), 3.5);
            if(m.shield !== undefined) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.fillRect(p.x - bw / 2, y - 8.5, bw, 3.5);
                ctx.fillStyle = 'rgb(110, 200, 255)';
                ctx.fillRect(p.x - bw / 2, y - 8.5, bw * Math.max(0, m.shield), 3.5);
                y -= 6;
            }
            y -= 7;
        }
        ctx.fillStyle = 'rgba(' + m.color + ', 0.9)';
        if(m.label) ctx.fillText(m.label, p.x, y);
        if(m.distance !== undefined) ctx.fillText((m.distance / 1000).toFixed(1) + 'k', p.x, p.y + r + 14);
    } else {
        // Direction on screen (flipped when behind the camera).
        let dx = p.x - w / 2;
        let dy = p.y - h / 2;
        if(p.behind) { dx = -dx; dy = -dy; }
        const angle = Math.atan2(dy, dx);
        const scale = Math.min(Math.abs((w / 2 - margin) / Math.cos(angle) || Infinity), Math.abs((h / 2 - margin) / Math.sin(angle) || Infinity));
        ctx.translate(w / 2 + Math.cos(angle) * scale, h / 2 + Math.sin(angle) * scale);
        if(m.distance !== undefined) ctx.fillText((m.label ? m.label + ' ' : '') + (m.distance / 1000).toFixed(1) + 'k', -Math.cos(angle) * 30, -Math.sin(angle) * 30 + 4);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["b"] = drawMarker;


// 3D radar: contacts relative to the ship, seen from above its own deck (forward = up on
// the scope). A stalk shows how far above (solid) or below (dashed) each contact is.
//   contacts: [{ local: {x, y, z} (ship frame: x forward, y port, z up), color, size }]
const drawRadar = (ctx, w, h, contacts, compact) => {
    const size = compact ? 120 : 190;
    const cx = w - size / 2 - 16;
    const cy = h - size / 2 - 16;
    const r = size / 2;
    const scale = r / RADAR_RANGE;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.88)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.15)';
    [0.33, 0.66].forEach(k => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * k, r * 0.62 * k, 0, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r * 0.62); ctx.lineTo(cx, cy + r * 0.62);
    ctx.stroke();
    contacts.forEach(c => {
        const l = c.local;
        const d = Math.sqrt(l.x * l.x + l.y * l.y + l.z * l.z);
        let k = scale;
        if(d * scale > r * 0.95) k = r * 0.95 / d;
        // Plane position (tilted ellipse) and height stalk.
        const px = cx - l.y * k;
        const py = cy - l.x * k * 0.62;
        const top = py - l.z * k * 0.62;
        ctx.strokeStyle = 'rgba(' + c.color + ', 0.6)';
        ctx.lineWidth = 1;
        if(l.z < 0) ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, top);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgb(' + c.color + ')';
        const s = c.size || 2;
        if(c.triangle) {
            ctx.beginPath();
            ctx.moveTo(px, top - s * 1.4); ctx.lineTo(px - s, top + s); ctx.lineTo(px + s, top + s);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(px - s / 2, top - s / 2, s, s);
        }
    });
    // The ship itself.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('RADAR ' + (RADAR_RANGE / 1000).toFixed(1) + 'k', cx - r + 6, cy - r * 0.62 - 6);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["d"] = drawRadar;


const LABELS = { ready: 'READY', hot: 'HOT', overheated: 'OVERHEAT', firing: 'FIRING', charging: 'CHARGING', reloading: 'RELOAD', off: 'OFF' };

// Weapons panel (bottom left). Returns the clickable row rectangles.
const drawWeapons = (ctx, w, h, weapons) => {
    const rows = [];
    if(!weapons.length) return rows;
    const rowHeight = 22;
    const left = 16;
    const top = h - 16 - weapons.length * rowHeight - 18;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.85)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.4)';
    ctx.fillRect(left, top, 230, weapons.length * rowHeight + 22);
    ctx.strokeRect(left, top, 230, weapons.length * rowHeight + 22);
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('WEAPONS', left + 8, top + 14);
    weapons.forEach((wp, i) => {
        const y = top + 22 + i * rowHeight;
        rows.push({ x: left, y: y, w: 230, h: rowHeight, kind: wp.kind });
        ctx.globalAlpha = wp.off ? 0.4 : 1;
        ctx.fillStyle = 'rgb(' + wp.color + ')';
        ctx.font = '11px Bungee, sans-serif';
        ctx.fillText((i < 5 ? (i + 1) + ' ' : '') + wp.name + (wp.count > 1 ? ' x' + wp.count : ''), left + 8, y + 11);
        const barX = left + 108;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(barX, y + 3, 70, 8);
        const warn = wp.state === 'overheated' || wp.state === 'hot';
        ctx.fillStyle = warn ? (wp.state === 'overheated' ? 'rgb(255, 80, 60)' : 'rgb(255, 170, 70)') : 'rgb(' + wp.color + ')';
        ctx.fillRect(barX + 1, y + 4, 68 * wp.ready, 6);
        ctx.globalAlpha = 1;
        ctx.font = '9px Bungee, sans-serif';
        ctx.fillStyle = wp.off ? 'rgba(255, 110, 90, 0.95)' : wp.state === 'ready' ? 'rgba(140, 255, 160, 0.9)' : (warn ? 'rgba(255, 140, 100, 0.95)' : 'rgba(200, 220, 255, 0.8)');
        ctx.fillText(LABELS[wp.state], barX + 76, y + 11);
    });
    ctx.restore();
    return rows;
};
/* harmony export (immutable) */ __webpack_exports__["f"] = drawWeapons;


const drawText = (ctx, text, x, y, size, color, align) => {
    ctx.save();
    ctx.font = size + 'px Bungee, sans-serif';
    ctx.textAlign = align || 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x, y);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["e"] = drawText;



/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(37);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(39)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./main.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./main.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(38)(undefined);
// imports


// module
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n\ncanvas {\n    position: fixed;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\nbody.playing canvas {\n    cursor: none;\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 5;\n    pointer-events: none;\n    user-select: none;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    min-height: 250px;\n    padding-bottom: 20px;\n    z-index: 10;\n    user-select: none;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu-message {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}\n.menu-action {\n    display: inline-block;\n    padding: 2px 10px;\n}\n\n.menu h2.menu-action {\n    display: block;\n    margin: 4px 0;\n}\n\n.menu-credits {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.pause-menu {\n    visibility: hidden;\n    min-height: 0;\n}\n\n.pause-menu h1 {\n    margin-top: 30px;\n}\n\n/* ---------------------------------------------------------------- HUD bars */\n\n.hud-bar-row {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    margin: 2px 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n    font-size: 13px;\n}\n\n.hud-bar-label {\n    width: 52px;\n}\n\n.hud-bar {\n    width: 140px;\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.7);\n    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);\n    background: rgba(0, 0, 0, 0.4);\n}\n\n.hud-bar-fill {\n    height: 100%;\n    width: 100%;\n    transition: width 0.15s linear;\n}\n\n.hud-bar.hull .hud-bar-fill {\n    background: #f4c46a;\n}\n\n.hud-bar.shield .hud-bar-fill {\n    background: #78d2ff;\n}\n\n.hud-bar-text {\n    font-size: 11px;\n}\n\n/* ---------------------------------------------------------------- Shipyard */\n\n.shipyard {\n    position: fixed;\n    inset: 0;\n    z-index: 20;\n    display: none;\n    flex-direction: column;\n    color: #dfe9ff;\n    background: rgba(2, 6, 16, 0.96);\n    user-select: none;\n}\n\n.shipyard.open {\n    display: flex;\n}\n\n.shipyard canvas {\n    position: static;\n}\n\n.shipyard-header {\n    display: flex;\n    align-items: center;\n    gap: 20px;\n    padding: 10px 20px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.25);\n}\n\n.shipyard-header h1 {\n    margin: 0;\n    font-size: 26px;\n    text-shadow: 0 0 8px rgba(140, 180, 255, 0.9);\n}\n\n.shipyard-credits {\n    flex: 1;\n    font-size: 18px;\n    color: #ffe08a;\n    text-shadow: 0 0 6px rgba(255, 200, 100, 0.7);\n}\n\n.shipyard-body {\n    flex: 1;\n    display: grid;\n    grid-template-columns: 260px 1fr 300px;\n    grid-template-rows: minmax(0, 1fr);\n    gap: 12px;\n    padding: 12px;\n    min-height: 0;\n}\n\n.shipyard-panel {\n    border: 1px solid rgba(140, 180, 255, 0.25);\n    background: rgba(10, 20, 40, 0.55);\n    padding: 10px;\n    overflow-y: auto;\n    min-height: 0;\n}\n\n.shipyard-panel h3 {\n    margin: 4px 0 8px;\n    font-size: 14px;\n    letter-spacing: 1px;\n    color: #9fc0ff;\n}\n\n.hull-cards {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-card {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 6px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    opacity: 0.75;\n}\n\n.hull-card.owned {\n    opacity: 1;\n}\n\n.hull-card.active {\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.35);\n    opacity: 1;\n}\n\n.hull-thumb {\n    flex: none;\n}\n\n.hull-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    min-width: 0;\n}\n\n.hull-name {\n    font-family: Bungee, sans-serif;\n    font-size: 15px;\n}\n\n.hull-class,\n.hull-meta {\n    color: #9fb2d8;\n    margin-bottom: 3px;\n}\n\n.hull-state {\n    color: #8cffa0;\n    font-family: Bungee, sans-serif;\n}\n\n.hull-view {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-title .title-name {\n    display: block;\n    font-size: 20px;\n}\n\n.hull-title .title-desc {\n    display: block;\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n}\n\n.hull-canvas-wrap {\n    flex: 1;\n    min-height: 200px;\n    position: relative;\n    border: 1px solid rgba(140, 180, 255, 0.15);\n}\n\n.hull-canvas {\n    position: absolute !important;\n    top: 0;\n    left: 0;\n}\n\n.shipyard-hint {\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n    text-align: center;\n}\n\n.ship-stats {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 6px;\n}\n\n.stat {\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    padding: 4px 6px;\n}\n\n.stat-label {\n    display: block;\n    font-family: sans-serif;\n    font-size: 10px;\n    color: #9fb2d8;\n    text-transform: uppercase;\n}\n\n.stat-value {\n    font-size: 14px;\n}\n\n.module-palette {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    margin-bottom: 12px;\n}\n\n.module-item {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 5px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    cursor: grab;\n    touch-action: none;\n}\n\n.module-item:hover {\n    border-color: rgba(200, 220, 255, 0.6);\n}\n\n.module-item.armed {\n    border-color: rgba(140, 255, 160, 0.9);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.4);\n}\n\n.module-item.unaffordable {\n    opacity: 0.45;\n}\n\n.module-icon {\n    flex: none;\n}\n\n.module-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    color: #9fb2d8;\n    min-width: 0;\n}\n\n.module-name {\n    font-family: Bungee, sans-serif;\n    font-size: 12px;\n    color: #dfe9ff;\n}\n\n.module-price {\n    color: #ffe08a;\n    margin-top: 2px;\n}\n\n.inspector {\n    font-family: sans-serif;\n    font-size: 12px;\n}\n\n.inspector p {\n    margin: 4px 0;\n}\n\n.inspector .muted {\n    color: #9fb2d8;\n}\n\n.inspector-name {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n}\n\n.inspector-stats {\n    margin: 4px 0;\n}\n\n.inspector-next {\n    color: #9fb2d8;\n    margin-bottom: 8px;\n}\n\n.inspector-actions {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n\n.sy-button {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #dfe9ff;\n    background: rgba(40, 70, 130, 0.5);\n    border: 1px solid rgba(140, 180, 255, 0.6);\n    padding: 6px 14px;\n    cursor: pointer;\n}\n\n.sy-button:hover:not(:disabled) {\n    background: rgba(60, 100, 180, 0.7);\n    box-shadow: 0 0 8px rgba(140, 180, 255, 0.5);\n}\n\n.sy-button:disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n}\n\n.sy-button.small {\n    font-size: 11px;\n    padding: 3px 8px;\n}\n\n.sy-button.primary {\n    border-color: rgba(140, 255, 160, 0.8);\n    background: rgba(40, 110, 60, 0.5);\n}\n\n.sy-button.buy {\n    border-color: rgba(255, 220, 130, 0.8);\n    background: rgba(110, 90, 30, 0.5);\n}\n\n.sy-button.danger {\n    border-color: rgba(255, 130, 110, 0.7);\n    background: rgba(110, 40, 30, 0.5);\n}\n\n.shipyard-message {\n    position: absolute;\n    bottom: 24px;\n    left: 50%;\n    transform: translateX(-50%);\n    padding: 8px 16px;\n    border: 1px solid rgba(140, 180, 255, 0.5);\n    background: rgba(10, 20, 40, 0.95);\n    opacity: 0;\n    transition: opacity 0.2s;\n    pointer-events: none;\n}\n\n.shipyard-message.visible {\n    opacity: 1;\n}\n\n.drag-ghost {\n    position: fixed !important;\n    z-index: 30;\n    pointer-events: none;\n}\n\n@media (max-width: 900px) {\n    .shipyard-body {\n        grid-template-columns: 1fr;\n        grid-template-rows: none;\n        overflow-y: auto;\n    }\n\n    .hull-canvas-wrap {\n        min-height: 260px;\n    }\n\n    .ship-stats {\n        grid-template-columns: repeat(2, 1fr);\n    }\n}\n\n.hud-bar.cargo .hud-bar-fill {\n    background: #c8aaff;\n}\n\n.menu-tip {\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n/* ---------------------------------------------------------------- Shipyard tabs & market */\n\n.shipyard-tabs {\n    display: flex;\n    gap: 4px;\n}\n\n.sy-tab {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #9fb2d8;\n    background: transparent;\n    border: 1px solid rgba(140, 180, 255, 0.3);\n    padding: 5px 14px;\n    cursor: pointer;\n}\n\n.sy-tab.active {\n    color: #dfe9ff;\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.3);\n}\n\n.shipyard-market {\n    flex: 1;\n    padding: 12px;\n    min-height: 0;\n    overflow-y: auto;\n}\n\n.market-panel {\n    max-width: 720px;\n    margin: 0 auto;\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n.market-panel .muted {\n    color: #9fb2d8;\n}\n\n.market-warning {\n    color: #ffc98a;\n}\n\n.market-section {\n    margin-top: 20px !important;\n}\n\n.market-table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 10px 0 14px;\n}\n\n.market-table th {\n    text-align: left;\n    font-family: Bungee, sans-serif;\n    font-weight: normal;\n    font-size: 11px;\n    color: #9fc0ff;\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.3);\n}\n\n.market-table td {\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.1);\n}\n\n.market-table tr.empty td {\n    color: #6c7a99;\n}\n\n.material-name {\n    font-family: Bungee, sans-serif;\n}\n\n.swatch {\n    display: inline-block;\n    width: 10px;\n    height: 10px;\n    margin-right: 8px;\n    transform: rotate(45deg);\n}\n\n/* ---------------------------------------------------------------- Shield toggle */\n\n.shield-button {\n    position: fixed;\n    top: 12px;\n    left: 50%;\n    transform: translateX(-50%);\n    z-index: 6;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    padding: 6px 16px;\n    color: #dff4ff;\n    background: rgba(10, 30, 60, 0.75);\n    border: 1px solid rgba(120, 210, 255, 0.8);\n    box-shadow: 0 0 10px rgba(120, 210, 255, 0.45);\n    cursor: pointer;\n}\n\n.shield-button.down {\n    color: #ffd9a0;\n    border-color: rgba(255, 190, 110, 0.8);\n    box-shadow: 0 0 10px rgba(255, 170, 80, 0.35);\n}\n\n.shield-button.depleted {\n    color: #ff9c8a;\n    border-color: rgba(255, 110, 90, 0.8);\n    box-shadow: none;\n}\n\n.shield-button.none {\n    opacity: 0.5;\n}\n\n/* ---------------------------------------------------------------- Cargo hold */\n\n.cargo-button {\n    position: fixed;\n    top: 12px;\n    right: 16px;\n    z-index: 6;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    padding: 6px 14px;\n    color: #eadcff;\n    background: rgba(30, 15, 60, 0.75);\n    border: 1px solid rgba(200, 170, 255, 0.8);\n    box-shadow: 0 0 10px rgba(200, 170, 255, 0.35);\n    cursor: pointer;\n}\n\n.cargo-panel {\n    position: fixed;\n    top: 52px;\n    right: 16px;\n    z-index: 7;\n    width: 320px;\n    max-width: calc(100vw - 32px);\n    padding: 10px 12px;\n    color: #dfe9ff;\n    font-family: sans-serif;\n    font-size: 12px;\n    background: rgba(5, 12, 26, 0.92);\n    border: 1px solid rgba(200, 170, 255, 0.6);\n    box-shadow: 0 0 14px rgba(200, 170, 255, 0.25);\n}\n\n.cargo-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    margin-bottom: 6px;\n}\n\n.cargo-capacity {\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.5);\n    margin-bottom: 4px;\n}\n\n.cargo-capacity-fill {\n    height: 100%;\n    background: #c8aaff;\n}\n\n.cargo-sub {\n    color: #9fb2d8;\n    margin: 4px 0;\n}\n\n.cargo-panel table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 6px 0;\n}\n\n.cargo-panel td {\n    padding: 4px 2px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.12);\n    white-space: nowrap;\n}\n\n.cargo-panel td:first-child {\n    font-family: Bungee, sans-serif;\n    font-size: 11px;\n}\n\n.cargo-panel button {\n    font-family: Bungee, sans-serif;\n    font-size: 10px;\n    margin-left: 3px;\n    padding: 2px 6px;\n    color: #ffd9cc;\n    background: rgba(110, 40, 30, 0.5);\n    border: 1px solid rgba(255, 140, 110, 0.6);\n    cursor: pointer;\n}\n\n.cargo-panel .cargo-header button {\n    font-size: 14px;\n    color: #dfe9ff;\n    background: transparent;\n    border: none;\n}\n\n.cargo-panel .cargo-eject-all {\n    width: 100%;\n    margin: 6px 0 0;\n    padding: 5px;\n}\n\n/* ---------------------------------------------------------------- Debug mode */\n\n.debug-menu {\n    cursor: pointer;\n    opacity: 0.6;\n}\n\n.debug-menu.on {\n    opacity: 1;\n    color: #ff7a6a;\n}\n\n.sy-tab.debug-toggle.active {\n    color: #ffb0a0;\n    border-color: rgba(255, 120, 100, 0.9);\n    box-shadow: 0 0 8px rgba(255, 120, 100, 0.4);\n}\n\n/* ---------------------------------------------------------------- DHD */\n\n.dhd-overlay {\n    position: fixed;\n    inset: 0;\n    z-index: 25;\n    display: none;\n    align-items: center;\n    justify-content: center;\n    background: rgba(2, 4, 10, 0.72);\n    user-select: none;\n}\n\n.dhd-overlay.open {\n    display: flex;\n}\n\n.dhd-overlay canvas,\n.starmap-overlay canvas {\n    position: static;\n}\n\n.dhd-panel {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 6px;\n    padding: 14px;\n    color: #f0e2cf;\n    background: rgba(20, 16, 12, 0.92);\n    border: 1px solid rgba(240, 160, 90, 0.5);\n    box-shadow: 0 0 20px rgba(240, 140, 60, 0.25);\n    max-height: 100vh;\n    overflow-y: auto;\n}\n\n.dhd-header {\n    width: 100%;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n}\n\n.dhd-title {\n    font-size: 16px;\n}\n\n.dhd-canvas {\n    cursor: pointer;\n}\n\n.dhd-status {\n    font-family: sans-serif;\n    font-size: 13px;\n    min-height: 1.2em;\n    color: #c8f0c0;\n}\n\n.dhd-status.error {\n    color: #ff9c8a;\n}\n\n.dhd-actions {\n    display: flex;\n    gap: 10px;\n    align-items: center;\n    max-width: 520px;\n}\n\n.dhd-hint {\n    font-family: sans-serif;\n    font-size: 11px;\n    color: #b8a890;\n}\n\n/* ---------------------------------------------------------------- Starmap */\n\n.starmap-overlay {\n    position: fixed;\n    inset: 0;\n    z-index: 25;\n    display: none;\n    background: rgb(3, 6, 14);\n    user-select: none;\n}\n\n.starmap-overlay.open {\n    display: flex;\n}\n\n.starmap-canvas {\n    flex: 1;\n    min-width: 0;\n    height: 100%;\n    cursor: grab;\n}\n\n.starmap-side {\n    width: 320px;\n    padding: 16px;\n    overflow-y: auto;\n    color: #dfe9ff;\n    background: rgba(8, 14, 30, 0.95);\n    border-left: 1px solid rgba(140, 180, 255, 0.3);\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n.starmap-title {\n    font-family: Bungee, sans-serif;\n    font-size: 22px;\n}\n\n.starmap-hint,\n.starmap-side .muted {\n    color: #9fb2d8;\n    font-size: 12px;\n}\n\n.starmap-here {\n    margin: 12px 0;\n    color: #8cffa0;\n}\n\n.starmap-name {\n    font-family: Bungee, sans-serif;\n    font-size: 20px;\n}\n\n.starmap-galaxy {\n    color: #9fc0ff;\n}\n\n.starmap-label {\n    margin-top: 12px;\n    font-family: Bungee, sans-serif;\n    font-size: 12px;\n    color: #9fc0ff;\n}\n\n.starmap-glyphs {\n    display: block;\n    margin: 6px 0;\n}\n\n.starmap-side .sy-button {\n    margin-top: 10px;\n}\n\n@media (max-width: 760px) {\n    .starmap-overlay.open {\n        flex-direction: column;\n    }\n\n    .starmap-side {\n        width: auto;\n        max-height: 45vh;\n    }\n}\n\n.starmap-button {\n    position: fixed;\n    top: 12px;\n    right: 200px;\n    z-index: 6;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    padding: 6px 14px;\n    color: #dfe9ff;\n    background: rgba(10, 25, 60, 0.75);\n    border: 1px solid rgba(140, 190, 255, 0.8);\n    box-shadow: 0 0 10px rgba(140, 190, 255, 0.35);\n    cursor: pointer;\n}\n\n/* Backdrop behind the game canvas: system nebula tint and the distant planet. */\n.backdrop {\n    position: fixed;\n    inset: 0;\n    z-index: 0;\n    pointer-events: none;\n    overflow: hidden;\n}\n\n#gameboard > canvas {\n    z-index: 1;\n}\n\n.backdrop canvas.backdrop-planet {\n    position: absolute;\n    top: 0;\n    left: 0;\n    will-change: transform;\n}\n\n/* ---------------------------------------------------------------- Touch controls */\n\nhtml, body {\n    overscroll-behavior: none;\n    -webkit-tap-highlight-color: transparent;\n    -webkit-touch-callout: none;\n}\n\n.touch-help {\n    display: none;\n}\n\nbody.touch .touch-help {\n    display: block;\n}\n\nbody.touch .menu h4:not(.touch-help):not(.menu-tip):not(.menu-action) {\n    display: none;\n}\n\n.touch-ui {\n    position: fixed;\n    inset: 0;\n    z-index: 7;\n    pointer-events: none;\n    user-select: none;\n    -webkit-user-select: none;\n}\n\n.touch-stick {\n    position: fixed;\n    left: 110px;\n    top: calc(100% - 110px);\n    width: 120px;\n    height: 120px;\n    margin: -60px 0 0 -60px;\n    border-radius: 50%;\n    border: 2px solid rgba(140, 190, 255, 0.35);\n    background: rgba(20, 40, 80, 0.18);\n    opacity: 0.55;\n}\n\n.touch-stick.active {\n    opacity: 1;\n}\n\n.touch-knob {\n    position: absolute;\n    left: 50%;\n    top: 50%;\n    width: 54px;\n    height: 54px;\n    border-radius: 50%;\n    transform: translate(-50%, -50%);\n    background: rgba(140, 190, 255, 0.45);\n    border: 2px solid rgba(200, 225, 255, 0.8);\n    box-shadow: 0 0 12px rgba(120, 180, 255, 0.5);\n}\n\n.touch-buttons {\n    position: fixed;\n    right: max(12px, env(safe-area-inset-right));\n    bottom: max(12px, env(safe-area-inset-bottom));\n    display: grid;\n    grid-template-columns: repeat(2, 64px);\n    gap: 10px;\n    direction: rtl;\n}\n\n.touch-button {\n    pointer-events: auto;\n    touch-action: none;\n    direction: ltr;\n    width: 64px;\n    height: 64px;\n    border-radius: 50%;\n    font-family: Bungee, sans-serif;\n    font-size: 10px;\n    color: #e6f0ff;\n    background: rgba(10, 25, 60, 0.6);\n    border: 2px solid rgba(140, 190, 255, 0.7);\n    box-shadow: 0 0 10px rgba(120, 180, 255, 0.3);\n    padding: 0;\n}\n\n.touch-button.pressed {\n    background: rgba(90, 150, 255, 0.55);\n    border-color: #fff;\n}\n\n.touch-button.missile {\n    border-color: rgba(255, 150, 90, 0.85);\n    color: #ffe2cc;\n}\n\n.touch-button.interact {\n    border-color: rgba(140, 255, 170, 0.9);\n    color: #d8ffe0;\n    background: rgba(10, 60, 30, 0.6);\n}\n\n.touch-corner {\n    position: fixed;\n    left: 50%;\n    bottom: max(8px, env(safe-area-inset-bottom));\n    transform: translateX(-50%);\n    display: flex;\n    gap: 8px;\n}\n\n.touch-button.small {\n    width: 40px;\n    height: 40px;\n    font-size: 14px;\n    border-radius: 8px;\n}\n\n.touch-rotate {\n    position: fixed;\n    top: 40%;\n    left: 50%;\n    transform: translateX(-50%);\n    padding: 10px 16px;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    color: #fff;\n    text-align: center;\n    background: rgba(0, 0, 0, 0.7);\n    border: 1px solid rgba(255, 255, 255, 0.4);\n}\n\n/* Compact HUD on touch screens: stats top-left, shield/cargo/map buttons stacked below. */\nbody.touch .info {\n    font-size: 11px;\n    margin: max(4px, env(safe-area-inset-top)) 0 0 max(6px, env(safe-area-inset-left));\n}\n\nbody.touch #fps {\n    display: none;\n}\n\nbody.touch .hud-bar-row {\n    font-size: 10px;\n    margin: 1px 0;\n}\n\nbody.touch .hud-bar-label {\n    width: 42px;\n}\n\nbody.touch .hud-bar {\n    width: 84px;\n    height: 6px;\n}\n\nbody.touch .hud-bar-text {\n    font-size: 9px;\n}\n\nbody.touch .shield-button,\nbody.touch .cargo-button,\nbody.touch .starmap-button {\n    left: max(6px, env(safe-area-inset-left));\n    right: auto;\n    transform: none;\n    font-size: 10px;\n    padding: 6px 10px;\n    min-width: 110px;\n}\n\nbody.touch .shield-button {\n    top: 92px;\n}\n\nbody.touch .cargo-button {\n    top: 124px;\n}\n\nbody.touch .starmap-button {\n    top: 156px;\n}\n\nbody.touch .cargo-panel {\n    z-index: 8;\n    top: 8px;\n    right: 8px;\n    max-height: 80vh;\n    overflow-y: auto;\n}\n\nbody.touch .dhd-canvas {\n    width: min(520px, 92vw, 58vh) !important;\n    height: auto !important;\n}\n\nbody.touch .dhd-address {\n    width: min(520px, 92vw, 80vh) !important;\n    height: auto !important;\n}\n\nbody.touch .dhd-hint {\n    display: none;\n}\n\nbody.touch .dhd-panel {\n    padding: 8px;\n}\n\nbody.touch .dhd-actions {\n    flex-wrap: wrap;\n    justify-content: center;\n    max-width: 92vw;\n}\n\nbody.touch .starmap-canvas {\n    touch-action: none;\n    cursor: default;\n}\n\n@media (max-height: 500px) and (orientation: landscape) {\n    body.touch .starmap-overlay.open {\n        flex-direction: row;\n    }\n\n    body.touch .starmap-side {\n        width: 240px;\n        max-height: none;\n        padding: 10px;\n    }\n\n    body.touch .starmap-title {\n        font-size: 16px;\n    }\n\n    body.touch .menu {\n        top: 4vh;\n        max-height: 92vh;\n        overflow-y: auto;\n    }\n\n    body.touch .menu h1 {\n        margin-top: 10px;\n    }\n}\n\n/* ---------------------------------------------------------------- Shipyard module popover */\n\n.module-popover {\n    position: absolute;\n    z-index: 2;\n    padding: 6px 8px 5px;\n    background: rgba(6, 14, 30, 0.94);\n    border: 1px solid rgba(140, 190, 255, 0.55);\n    box-shadow: 0 0 14px rgba(90, 150, 255, 0.3);\n    pointer-events: auto;\n    user-select: none;\n}\n\n.popover-name {\n    font-family: Bungee, sans-serif;\n    font-size: 11px;\n    color: #dfe9ff;\n    margin-bottom: 5px;\n    white-space: nowrap;\n}\n\n.popover-actions {\n    display: flex;\n    gap: 8px;\n}\n\n.popover-action {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 2px;\n}\n\n.icon-button {\n    width: 34px;\n    height: 34px;\n    padding: 6px;\n    cursor: pointer;\n    color: #bff0c8;\n    background: rgba(30, 90, 60, 0.55);\n    border: 1px solid rgba(140, 255, 170, 0.7);\n    border-radius: 4px;\n}\n\n.icon-button svg {\n    width: 100%;\n    height: 100%;\n    fill: currentColor;\n    display: block;\n}\n\n.icon-button:hover:not(:disabled) {\n    background: rgba(50, 140, 90, 0.75);\n    color: #fff;\n}\n\n.icon-button.danger {\n    color: #ffc2b5;\n    background: rgba(110, 30, 25, 0.55);\n    border-color: rgba(255, 130, 110, 0.75);\n}\n\n.icon-button.danger:hover:not(:disabled) {\n    background: rgba(170, 50, 40, 0.8);\n    color: #fff;\n}\n\n.icon-button:disabled {\n    cursor: not-allowed;\n    opacity: 0.35;\n    filter: grayscale(1);\n}\n\n.popover-caption {\n    font-family: Bungee, sans-serif;\n    font-size: 9px;\n    color: #9fb2d8;\n    white-space: nowrap;\n}\n\n/* 3D view layers: WebGL scene < main canvas (effects, HUD). */\n#gameboard > canvas.gl-layer {\n    position: fixed;\n    top: 0;\n    left: 0;\n    z-index: 2;\n    pointer-events: none;\n}\n\n#gameboard > canvas.main-layer {\n    z-index: 3;\n}\n\n/* Full 3D game: WebGL scene with its HUD canvas on top. */\n#gameboard > canvas.game3d-layer,\n#gameboard > canvas.game3d-hud {\n    position: fixed;\n    top: 0;\n    left: 0;\n}\n\n#gameboard > canvas.game3d-layer {\n    z-index: 2;\n    pointer-events: none;\n}\n\n#gameboard > canvas.game3d-hud {\n    z-index: 3;\n}\n\nbody.touch .controls-3d {\n    display: none;\n}\n", ""]);

// exports


/***/ }),
/* 38 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			var styleTarget = fn.call(this, selector);
			// Special case to return head of iframe instead of iframe itself
			if (styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[selector] = styleTarget;
		}
		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(40);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 40 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ })
/******/ ]);