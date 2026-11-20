// Shared physics helpers for a zero-gravity, screen-wrapping world.
// Units: pixels and seconds.

// Gravitational constant, tuned for gameplay. Mass of a rock is its area (r^2),
// so a large asteroid pulls noticeably harder than a small one.
export const G = 150;

// Objects wrap around the screen. The world is a bit larger than the visible
// screen so things slide in and out smoothly instead of popping at the edge.
export const world = {
    margin: 80,
    width: window.innerWidth,
    height: window.innerHeight,
    minX: -80,
    minY: -80,
    sizeX: window.innerWidth + 160,
    sizeY: window.innerHeight + 160,

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.minX = -this.margin;
        this.minY = -this.margin;
        this.sizeX = width + this.margin * 2;
        this.sizeY = height + this.margin * 2;
    }
};

export const wrapPosition = (body) => {
    if(body.x < world.minX) body.x += world.sizeX;
    if(body.x >= world.minX + world.sizeX) body.x -= world.sizeX;
    if(body.y < world.minY) body.y += world.sizeY;
    if(body.y >= world.minY + world.sizeY) body.y -= world.sizeY;
};

export const isOutsideWorld = (body) => {
    return body.x < world.minX || body.y < world.minY ||
        body.x >= world.minX + world.sizeX || body.y >= world.minY + world.sizeY;
};

// Shortest signed distance on a wrapping axis.
const wrapAxis = (d, size) => {
    if(d > size / 2) return d - size;
    if(d < -size / 2) return d + size;
    return d;
};

export const delta = (from, to) => {
    return {
        x: wrapAxis(to.x - from.x, world.sizeX),
        y: wrapAxis(to.y - from.y, world.sizeY)
    };
};

// Gravitational acceleration that `attractors` exert on `body`.
// Softened by the attractor's radius so nothing gets flung to infinity.
export const gravityAt = (body, attractors) => {
    let ax = 0;
    let ay = 0;

    for(let i = 0; i < attractors.length; i++) {
        const other = attractors[i];
        if(other === body || other.dead) continue;

        const d = delta(body, other);
        const distSq = d.x * d.x + d.y * d.y;
        if(distSq < 0.0001) continue;

        const dist = Math.sqrt(distSq);
        const soft = other.radius * other.radius;
        const accel = G * other.mass / (distSq + soft);

        ax += d.x / dist * accel;
        ay += d.y / dist * accel;
    }

    return { x: ax, y: ay };
};
