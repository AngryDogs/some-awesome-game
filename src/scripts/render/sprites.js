// Pre-rendered images. Glows, gradients and detailed line art are expensive to draw
// on a canvas every frame, so anything that doesn't change is drawn once into an
// offscreen canvas and then stamped with drawImage (a cheap bitmap copy).

const cache = {};

// Safari has much tighter limits on total canvas memory (especially on iPhone / iPad) and a
// slower 2D canvas, so it gets lighter settings.
export const isSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent || '');

// Sprites are drawn magnified by the camera zoom, so render them a bit sharper.
export const spriteResolution = () => Math.min(isSafari() ? 2 : 3, (window.devicePixelRatio || 1) * (isSafari() ? 1.25 : 2));

// Draws `draw(ctx)` into an offscreen canvas of `width` x `height` world pixels.
// Pass a previous sprite as `reuse` to redraw into its canvas when the size still fits
// (allocating canvases is slow; reusing one is just a clear).
export const createSprite = (width, height, draw, resolution, reuse) => {
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

// Shared fine-grain dust texture (light and dark specks) used as a fill pattern.
export const grainTexture = () => {
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

// Soft round glow, white-hot centre fading to `color` then transparent.
export const glowSprite = (color) => {
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

// Flame/jet pointing along +x from its left-middle edge (draw it rotated and stretched).
export const flameSprite = (color, core) => {
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

// Muzzle flash: a hot core with a long forward spike and short side spikes (pointing +x).
export const muzzleSprite = (color) => {
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

// Soft feathered puff for dust clouds (no hard edge, unlike a filled circle).
export const dustSprite = (color) => {
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

// Stamp a sprite centred at (x, y) with the given size.
export const stamp = (ctx, sprite, x, y, width, height) => {
    ctx.drawImage(sprite.canvas, x - width / 2, y - height / 2, width, height);
};
