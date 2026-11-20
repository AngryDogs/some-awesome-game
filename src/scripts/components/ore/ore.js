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
        const color = MATERIALS[this.material].color;
        const rgb = color.split(',').map(Number);
        const r = this.radius;
        const sparkle = Math.sin(time * 3 + this.phase);

        ctx.save();
        ctx.translate(this.x, this.y);

        // Soft halo in the metal colour.
        ctx.fillStyle = 'rgba(' + color + ', ' + (0.16 + 0.08 * sparkle).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
        ctx.fill();

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

export default Ore;
