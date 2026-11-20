// Pre-rendered images. Glows, gradients and detailed line art are expensive to draw
// on a canvas every frame, so anything that doesn't change is drawn once into an
// offscreen canvas and then stamped with drawImage (a cheap bitmap copy).

const cache = {};

export const spriteResolution = () => Math.min(2, window.devicePixelRatio || 1);

// Draws `draw(ctx)` into a new offscreen canvas of `width` x `height` world pixels.
export const createSprite = (width, height, draw, resolution) => {
    const res = resolution || spriteResolution();
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width * res));
    canvas.height = Math.max(1, Math.ceil(height * res));
    const ctx = canvas.getContext('2d');
    ctx.scale(res, res);
    draw(ctx);
    return { canvas: canvas, width: width, height: height };
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

// Stamp a sprite centred at (x, y) with the given size.
export const stamp = (ctx, sprite, x, y, width, height) => {
    ctx.drawImage(sprite.canvas, x - width / 2, y - height / 2, width, height);
};
