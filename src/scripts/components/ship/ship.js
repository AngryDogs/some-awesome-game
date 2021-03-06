import loadArrowKeyHandler from './handlers';
import Bullet from '../bullet/bullet';
import Particle from '../particle/particle';

const shipExplosionSound = new Audio('./assets/sounds/explosion2.mp3');
const menu = document.getElementById('menu');

const EXPLOSION_PARTICLE_COUNT = 10;

class Ship {

    constructor() {
        this.type = 'ship';
        this.sizeX = 20;
        this.sizeY = 19;
        this.positionX = 110;
        this.positionY = 110;
        this.angle = 0;
        this.movementAngle = 0;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = 0;
        this.rotationSpeed = 0;
        this.crossSpeed = 0;
        this.gameboard = document.getElementById("gameboard");
        this.init();
        this.shotBullets = [];
        this.lifeCount = 3;
        this.immunity = 100;
        this.shipParticles = [];
    }

    init() {
        const shape = [[0, 6], [0, -6], [15, 0]];
        const { sizeX, sizeY, canvas, context, angle, positionX, positionY } = this;

        canvas.width = sizeX;
        canvas.height = sizeY;
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.position = "absolute";

        context.translate(3, 9);
        context.rotate(angle * Math.PI / 180);
        context.fillStyle = "#fff";
        context.shadowBlur = 5;
        context.shadowColor = '#fff';
        context.beginPath();
        context.moveTo(shape[0][0],shape[0][1]);
        context.lineTo(shape[1][0],shape[1][1]);
        context.lineTo(shape[2][0],shape[2][1]);
        context.closePath();
        context.stroke();
        context.fill();

        this.canvas.id = "ship";
        this.gameboard.appendChild(this.canvas);

        loadArrowKeyHandler(this);
        this.render();
    }

    setMovementParameters(moveSpeed, rotationSpeed, crossSpeed) {
        this.moveSpeed = moveSpeed;
        this.rotationSpeed = rotationSpeed;
        this.crossSpeed = crossSpeed;
    }

    shootMachineGun(minigunSound) {
        minigunSound.play();
        if(this.shotBullets.length < 300) {
            this.shotBullets.push(new Bullet(this));
        }
    }

    translateNewValues() {
        this.move();
        this.rotate();
    }

    outOfScreenMovement() {
        const { canvas, positionX, positionY, sizeX, sizeY } = this;
        if(positionX < 0 - sizeX) this.positionX = window.innerWidth;
        if(positionY < 0 - sizeY) this.positionY = window.innerHeight;
        if(positionX > window.innerWidth) this.positionX = 0 - sizeX;
        if(positionY > window.innerHeight) this.positionY = 0 - sizeY;
    }

    explosion() {
        for(let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            this.shipParticles.push(new Particle(this));
        }
        shipExplosionSound.currentTime = 0;
        shipExplosionSound.play();
    }

    move() {
        const { angle, positionX, positionY, moveSpeed, movementAngle, crossSpeed } = this;

        const positionXWithAngle = Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX;
        const positionYWithAngle = Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY;

        let crossAngle = 0;

        if(crossSpeed > 0) crossAngle = angle - 90;
        if(crossSpeed < 0) crossAngle = angle - 90;

        const positionXWithCrossAngle = Math.cos((crossAngle) * Math.PI / 180) * crossSpeed + positionX;
        const positionYWithCrossAngle = Math.sin((crossAngle) * Math.PI / 180) * crossSpeed + positionY;
        
        this.positionX = (positionXWithAngle + positionXWithCrossAngle) / 2;
        this.positionY = (positionYWithAngle + positionYWithCrossAngle) / 2;

        this.outOfScreenMovement();

        this.render();
    }

    rotate() {
        this.angle += this.rotationSpeed;

        this.render();
    }

    renderBullets() {
        if(this.shotBullets) {
            this.shotBullets.forEach((bullet, index) => bullet.move(index));
        }
    }

    renderShipParticles() {
        if(this.shipParticles) {
            this.shipParticles.forEach((shipParticle, index) => shipParticle.move(index));
        }
    }

    render() {
        const { canvas, positionX, positionY, angle, shotBullets, lifeCount, immunity, shipParticles } = this;

        if(lifeCount < 0) {
            canvas.style.visibility = "hidden";
        }

        if(shipParticles && shipParticles.length == 0 && lifeCount < 0) {
            canvas.remove();
            delete this;
            return;
        }

        if(immunity != 0) this.immunity--;
        
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.transform = 'rotate(' + angle + 'deg)';

        this.renderBullets();
        this.renderShipParticles();
    }
}

export default Ship;