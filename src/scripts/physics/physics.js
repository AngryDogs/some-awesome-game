// Shared physics helpers for an open, endless zero-gravity world.
// Units: pixels and seconds. World coordinates are unbounded; the camera follows the ship.

// Gravitational constant, tuned for gameplay. Mass of an asteroid is its area (r^2),
// so a large asteroid pulls noticeably harder than a small one.
export const G = 150;

// Beyond this distance gravity is negligible and skipped for performance.
const GRAVITY_CUTOFF_SQ = 1300 * 1300;

// Viewport size (the camera's view of the world).
export const world = {
    width: window.innerWidth,
    height: window.innerHeight,

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
};

export const delta = (from, to) => ({ x: to.x - from.x, y: to.y - from.y });

// Gravitational acceleration that `attractors` exert on `body`.
// Softened by the attractor's radius so nothing gets flung to infinity.
export const gravityAt = (body, attractors) => {
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
