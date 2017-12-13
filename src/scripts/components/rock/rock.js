import Particle from '../particle/particle';

const EXPLOSION_PARTICLE_COUNT = 30;
const rockHitSound = new Audio('./assets/sounds/explosion1.mp3');
const rockExplosionSound = new Audio('./assets/sounds/explosion2.mp3');

class Rock {

    constructor(ship) {
        this.type = 'rock';
        this.health = Math.floor((Math.random() * 40) + 20);
        this.sizeX =  Math.floor((Math.random() * 40) + 30);
        this.sizeY =  this.sizeX;
        this.positionX = 500;
        this.positionY = 90;
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
        context.arc(sizeX / 2, sizeY / 2, (sizeX / 2 - 6), 0, 2 * Math.PI, false);
        context.fillStyle = '#fff';
        context.shadowBlur = 10;
        context.shadowColor = '#fff';
        context.fill();

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
        rockHitSound.currentTime = 0;
        rockHitSound.play();
        this.rockParticles.push(new Particle(this));
    }

    explosion() {
        for(let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            this.rockParticles.push(new Particle(this));
        }
        rockExplosionSound.currentTime = 0;
        rockExplosionSound.play();
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

    pointInterscetsWithCircle(pointX, pointY, centerX, centerY, radius) {
        return Math.sqrt((pointX - centerX) * (pointX - centerX) + (pointY - centerY) * (pointY - centerY)) < radius - 3;
    }

    renderShipIntersection() {
        const { ship, positionX, positionY, sizeX, sizeY, allowHits } = this;

        const radius = sizeX / 2;
        const centerX = positionX + (sizeX / 2);
        const centerY = positionY + (sizeY / 2);

        const shipNoseX = ship.positionX + ship.sizeX;
        const shipNoseY = ship.positionY + (ship.sizeY / 2);

        const shipSide1X = ship.positionX;
        const shipSide1Y = ship.positionY;

        const shipSide2X = ship.positionX;
        const shipSide2Y = ship.positionY + ship.sizeY;

        const noseIntersection = this.pointInterscetsWithCircle(shipNoseX, shipNoseY, centerX, centerY, radius);
        const side1Intersection = this.pointInterscetsWithCircle(shipSide1X, shipSide1Y, centerX, centerY, radius);
        const side2Intersection = this.pointInterscetsWithCircle(shipSide2X, shipSide2Y, centerX, centerY, radius);
        
        const hasIntersected = noseIntersection || side1Intersection || side2Intersection;

        if(hasIntersected && ship.immunity == 0 && allowHits) {
            ship.immunity = 200;
            ship.lifeCount--;
            ship.explosion();
        }
    }

    renderIntersection() {
        const { shotBullets, positionX, positionY, sizeX, sizeY, canvas, allowHits } = this;
        if(!shotBullets && !allowHits) return;

        const radius = sizeX / 2;
        const centerX = positionX + (sizeX / 2);
        const centerY = positionY + (sizeY / 2);
        
        shotBullets.forEach((bullet, index) => {
            const hasIntersected = this.pointInterscetsWithCircle(bullet.positionX, bullet.positionY, centerX, centerY, radius);

            if(hasIntersected && allowHits) {
                shotBullets.splice(index, 1);
                bullet.canvas.remove();
                this.bulletHit();
                this.health--;
                return;
            }
        });
    }

    render() {
        const { canvas, positionX, positionY, angle, rockParticles, allowHits, health } = this;

        if(this.health < 0 && allowHits) {
            const scoreElement = document.getElementById('score');

            const score = scoreElement.innerHTML.replace(/\D/g,'');
            const newScore = parseInt(score) + 1;

            const currentHits = localStorage.getItem('currentHits');
            localStorage.setItem('currentHits', parseInt(currentHits) + 1);

            scoreElement.innerHTML = 'Score: ' + newScore;

            this.allowHits = false;
            canvas.style.visibility = "hidden";
            this.explosion();
            return;
        }

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