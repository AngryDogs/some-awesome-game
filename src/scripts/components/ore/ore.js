import MATERIALS from '../../world/materials';

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
        this.radius = material === 'rock' ? 2.5 : 3.2;
        this.dead = false;
    }

    // Tractor pull towards the ship when in range. Returns true when collected.
    update(dt, ship, canCollect) {
        this.life -= dt;
        if(this.life <= 0) this.dead = true;

        if(ship && ship.alive && canCollect) {
            const dx = ship.x - this.x;
            const dy = ship.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;

            if(distance < ship.collectRadius) return true;

            if(distance < ship.magnetRange) {
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
        const color = MATERIALS[this.material].color;
        const r = this.radius;
        const pulse = 0.7 + 0.3 * Math.sin(time * 5 + this.angle * 3);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(' + color + ',' + pulse.toFixed(2) + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(0, r * 0.8);
        ctx.lineTo(-r, 0);
        ctx.lineTo(0, -r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

export default Ore;
