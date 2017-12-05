import loadArrowKeyHandler from './handlers';

class Ship {

    constructor() {
        this.sizeX = 20;
        this.sizeY = 10;
        this.positionX = 110;
        this.positionY = 110;
        this.angle = 0;
        this.movementAngle = 0;
        this.canvas = document.getElementById('ship');
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = 0;
        this.rotationSpeed = 0;
        this.init();
    }

    init() {
        loadArrowKeyHandler(this);
        this.render();
    }

    setMovementParameters(moveSpeed, rotationSpeed, useTrajectory) {
        this.moveSpeed = moveSpeed;
        this.rotationSpeed = rotationSpeed;

        if(useTrajectory) this.trajectory();
        this.move();
        this.rotate();

    }

    trajectory() {
        const { angle, moveSpeed } = this;

        if(angle < this.movementAngle) {
            this.movementAngle -= 1;
        }

        if(angle > this.movementAngle) {
            this.movementAngle += 1;
        }
    }

    move() {
        const { angle, positionX, positionY, moveSpeed, movementAngle } = this;

        this.positionX = Math.cos((movementAngle) * Math.PI / 180) * moveSpeed + positionX;
        this.positionY = Math.sin((movementAngle) * Math.PI / 180) * moveSpeed + positionY;

        this.render();
    }

    rotate() {
        this.angle += this.rotationSpeed;

        if(this.angle > 360) this.angle = 0;
        if(this.angle < 0) this.angle = 360;

        this.render();
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
    }
}

export default Ship;