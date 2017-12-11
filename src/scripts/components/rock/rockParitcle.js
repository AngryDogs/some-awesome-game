class RockParticle {

    constructor(rock) {
        this.sizeX = 2;
        this.sizeY = 2;
        this.positionX = rock.positionX + (rock.sizeX / 2);
        this.positionY = rock.positionY + (rock.sizeY / 2);
        this.angle = Math.floor((Math.random() * 360));
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = Math.floor((Math.random() * 2) + 1);
        this.gameboard = document.getElementById("gameboard");
        this.lifeCycle = Math.floor((Math.random() * 50) + 30);
        this.rock = rock;

        this.init();
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

    move(index) {
        const { angle, positionX, positionY, moveSpeed, rock, canvas, lifeCycle } = this;

        if(this.outOfScreen() || lifeCycle < 1) {
            rock.rockParticles.splice(index, 1);
            canvas.remove();
            return;
        }

        this.positionX = Math.round((Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX) * 100) / 100;
        this.positionY = Math.round((Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY) * 100) / 100;

        this.lifeCycle--;

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

export default RockParticle;