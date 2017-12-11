class Bullet {

    constructor(ship) {
        this.sizeX = 10;
        this.sizeY = 2;
        this.positionX = ship.positionX;
        this.positionY = ship.positionY;
        this.angle = this.dispersion(ship.angle - 2, ship.angle + 2);
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = 5;
        this.gameboard = document.getElementById("gameboard");
        this.ship = ship;

        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gameboard.appendChild(this.canvas);
    }

    dispersion(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

    move(index) {
        const { angle, positionX, positionY, moveSpeed, ship, canvas } = this;

        if(this.outOfScreen()) {
            ship.shotBullets.splice(index, 1);
            canvas.remove();
            return;
        }

        this.positionX = Math.round((Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX) * 10) / 10;
        this.positionY = Math.round((Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY) * 10) / 10;

        this.render();
    }

    outOfScreen() {
        const { canvas, positionX, positionY } = this;
        if(positionX < 0) return true;
        if(positionY < 0) return true;
        if(positionX > canvas.width) return true;
        if(positionY > canvas.height) return true;

        return false;
    }

    render() {
        const shape = [[0, 0], [6, 0]];
        const { sizeX, sizeY, angle, context, canvas, positionX, positionY } = this;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(positionX, positionY);
        context.rotate(angle * Math.PI / 180);
        context.fillStyle = "#000";
        context.beginPath();
        context.moveTo(shape[0][0],shape[0][1]);
        context.lineTo(shape[1][0],shape[1][1]);
        context.closePath();
        context.stroke();
        context.fill();
        context.restore();
    }
}

export default Bullet;