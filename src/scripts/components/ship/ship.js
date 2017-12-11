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
    }

    init() {
        const shape = [[0, 6], [0, -6], [15, 0]];
        const { canvas, context, angle, positionX, positionY } = this;

        canvas.width = 16;
        canvas.height = 14;
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.position = "absolute";

        context.translate(0, 7);
        context.rotate(angle * Math.PI / 180);
        context.fillStyle = "#000";
        context.beginPath();
        context.moveTo(shape[0][0],shape[0][1]);
        context.lineTo(shape[1][0],shape[1][1]);
        context.lineTo(shape[2][0],shape[2][1]);
        context.closePath();
        context.stroke();
        context.fill();

        this.gameboard.appendChild(this.canvas);

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
        if(this.shotBullets.length < 500)
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
        const { canvas, positionX, positionY, angle } = this;
        
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.transform = 'rotate(' + angle + 'deg)';

        this.renderBullets();
    }
}

export default Ship;