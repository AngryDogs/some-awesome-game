import Particle from '../particle/particle';

const EXPLOSION_PARTICLE_COUNT = 4;

class Rock {

    constructor(ship) {
        this.type = 'rock';
        this.health = Math.floor((Math.random() * 40) + 20);
        this.sizeX =  this.health;
        this.sizeY =  this.health;
        this.positionX = 300;
        this.positionY = 300;
        this.angle = 0;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = Math.floor((Math.random() * 3) + 1);
        this.gameboard = document.getElementById("gameboard");
        this.rockParticles = [];
        this.shotBullets = ship.shotBullets;
        this.ship = ship;
        this.allowHits = true;

        this.initPositionCoordinates();
        this.init();
    }

    initPositionCoordinates() {
        const { sizeX, sizeY } = this;
        const screenSide = Math.floor((Math.random() * 4) + 1);

        switch(screenSide) {
            // LEFT SCREEN SIDE
            case 1:
                this.positionX = 0 - sizeX;
                this.positionY = Math.floor((Math.random() * window.innerHeight));
                this.angle = Math.floor((Math.random() * 160) + 290);
                break;
            // TOP SCREEN SIDE
            case 2:
                this.positionX = Math.floor((Math.random() * window.innerWidth));
                this.positionY = 0 - sizeY;
                this.angle = Math.floor((Math.random() * 160) + 20);
                break;
            // RIGTH SCREEN SIDE
            case 3:
                this.positionX = window.innerWidth
                this.positionY = Math.floor((Math.random() * window.innerHeight));
                this.angle = Math.floor((Math.random() * 160) + 110);
                break;
            // BOTTOM SCREEN SIDE
            case 4:
                this.positionX = Math.floor((Math.random() * window.innerWidth));
                this.positionY = innerHeight
                this.angle = Math.floor((Math.random() * 160) + 200);
                break;    
        }
    }

    init() {
        const { sizeX, sizeY, canvas, context, angle, positionX, positionY } = this;
        
        canvas.width = sizeX;
        canvas.height = sizeY;
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.position = "absolute";

        context.beginPath();
        context.arc(sizeX / 2, sizeY / 2, sizeX / 3, 0, 2 * Math.PI, false);
        context.fillStyle = '#000';
        context.fill();
        context.stroke();

        this.gameboard.appendChild(canvas);
    }

    outOfScreenMovement() {
        const { canvas, positionX, positionY, sizeX, sizeY } = this;
        if(positionX < 0 - sizeX) this.positionX = window.innerWidth;
        if(positionY < 0 - sizeY) this.positionY = window.innerHeight;
        if(positionX > window.innerWidth) this.positionX = 0 - sizeX;
        if(positionY > window.innerHeight) this.positionY = 0 - sizeY;
    }

    bulletHit() {
        this.rockParticles.push(new Particle(this));
    }

    explosion() {
        let interval = 0;

        const explosionInterval = setInterval(() => {
            interval++;

            if(interval === EXPLOSION_PARTICLE_COUNT) clearInterval(explosionInterval);
            this.rockParticles.push(new Particle(this));
        }, 1000 / 60);
    }

    move() {
        const { angle, positionX, positionY, moveSpeed, canvas, health } = this;

        this.positionX = Math.round((Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX) * 100) / 100;
        this.positionY = Math.round((Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY) * 100) / 100;

        this.outOfScreenMovement();

        this.render();
    }

    renderRockParticles() {
        if(this.rockParticles) {
            this.rockParticles.forEach((rockParticle, index) => rockParticle.move(index));
        }
    }

    renderShipIntersection() {
        const { ship, positionX, positionY, sizeX, sizeY } = this;

        const shipNoseX = ship.positionX + ship.sizeX;
        const shipNoseY = ship.positionY + (ship.sizeY / 2);
        
        const hasIntersected = (shipNoseX > positionX + 10 && shipNoseX < positionX + sizeX + 5) && 
            (shipNoseY > positionY + 10 && shipNoseY < positionY + sizeY + 5);

        if(hasIntersected && ship.immunity == 0) {
            ship.immunity = 200;
            ship.lifeCount--;
            ship.explosion();
        }
    }

    renderIntersection() {
        const { shotBullets, positionX, positionY, sizeX, sizeY, canvas, allowHits } = this;
        if(!shotBullets && !allowHits) return;
        
        shotBullets.forEach((bullet, index) => {
            const hasIntersected = (bullet.positionX > positionX - 6 && bullet.positionX < positionX + sizeX - 6) && 
                (bullet.positionY > positionY - 6 && bullet.positionY < positionY + sizeY - 6);

            if(this.health < 0 && allowHits) {
                this.allowHits = false;
                canvas.style.visibility = "hidden";
                this.explosion();
                return;
            } else if(hasIntersected && allowHits) {
                shotBullets.splice(index, 1);
                bullet.canvas.remove();
                if(this.health > 15) this.bulletHit();
                this.health--;
                return;
            }
        });
    }

    render() {
        const { canvas, positionX, positionY, angle, rockParticles, allowHits } = this;

        if(rockParticles.length == 0 && !allowHits) {
            canvas.remove();
            delete this;
            return;
        }
        
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';

        this.renderIntersection();
        this.renderShipIntersection();
        this.renderRockParticles();
    }
}

export default Rock;