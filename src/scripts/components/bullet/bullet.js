class Bullet {

    constructor(ship) {
        this.sizeX = 12;
        this.sizeY = 12;
        this.positionX = ship.positionX + 1;
        this.positionY = ship.positionY + 1;
        this.angle = this.dispersion(ship.angle - 2, ship.angle + 2);
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = 10;
        this.gameboard = document.getElementById("gameboard");
        this.ship = ship;

        this.init();
    }

    init() {
        const shape = [[0, 0], [6, 0]];
        const { sizeX, sizeY, canvas, context, angle, positionX, positionY } = this;

        canvas.width = sizeX;
        canvas.height = sizeY;
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.position = "absolute";

        context.translate(6, 6);
        context.rotate(angle * Math.PI / 180);
        context.fillStyle = "#000";
        context.beginPath();
        context.moveTo(shape[0][0],shape[0][1]);
        context.lineTo(shape[1][0],shape[1][1]);
        context.closePath();
        context.stroke();

        this.gameboard.appendChild(canvas);
    }

    dispersion(min, max) {
        return Math.random() * (max - min + 1) + min;
      }

    move(index) {
        const { angle, positionX, positionY, moveSpeed, ship, canvas } = this;

        if(this.outOfScreen()) {
            ship.shotBullets.splice(index, 1);
            canvas.remove();
            return;
        }

        this.positionX = Math.round((Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX) * 100) / 100;
        this.positionY = Math.round((Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY) * 100) / 100;

        this.render();
    }

    outOfScreen() {
        const { canvas, positionX, positionY, sizeX, sizeY } = this;
        if(positionX < 0 - sizeX) return true;
        if(positionY < 0 - sizeY) return true;
        if(positionX > window.innerWidth) return true;
        if(positionY > window.innerHeight) return true;

        return false;
    }

    render() {
        const { canvas, positionX, positionY } = this;

        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
    }
}

export default Bullet;