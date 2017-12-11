import loadArrowKeyHandler from './handlers';
import Bullet from '../bullet/bullet';

class Ship {

    constructor() {
        this.sizeX = 20;
        this.sizeY = 10;
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

        this.gameboard.appendChild(this.canvas);
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        loadArrowKeyHandler(this);
        this.render();
    }

    setMovementParameters(moveSpeed, rotationSpeed, crossSpeed) {
        this.moveSpeed = moveSpeed;
        this.rotationSpeed = rotationSpeed;
        this.crossSpeed = crossSpeed;
        this.move();
        this.rotate();
    }

    shootMachineGun() {
        if(this.shotBullets.length < 5)
            this.shotBullets.push(new Bullet(this));
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

        this.render();
    }

    rotate() {
        this.angle += this.rotationSpeed;

        if(this.angle > 360) this.angle = 0;
        if(this.angle < 0) this.angle = 360;

        this.render();
    }

    renderBullets() {
        if(this.shotBullets) {
            this.shotBullets.forEach((bullet, index) => bullet.move(index));
        }
    }

    render() {
        const shape = [[0, 6], [0, -6], [15, 0]];
        const { sizeX, sizeY, angle, context, canvas, positionX, positionY } = this;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(positionX, positionY);
        context.rotate(angle * Math.PI / 180);
        context.fillStyle = "#000";
        context.beginPath();
        context.moveTo(shape[0][0],shape[0][1]);
        context.lineTo(shape[1][0],shape[1][1]);
        context.lineTo(shape[2][0],shape[2][1]);
        context.closePath();
        context.stroke();
        context.fill();
        context.restore();
        this.renderBullets();
    }
}

export default Ship;