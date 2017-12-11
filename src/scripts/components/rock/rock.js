import RockParticle from './rockParitcle';

class Rock {

    constructor() {
        this.health = Math.floor((Math.random() * 80) + 20);
        this.sizeX =  this.health;
        this.sizeY =  this.health;
        this.positionX = 300;
        this.positionY = 300;
        this.angle = 0;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = Math.floor((Math.random() * 0));
        this.gameboard = document.getElementById("gameboard");
        this.rockParticles = [];

        //this.initPositionCoordinates();
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

        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));
        this.rockParticles.push(new RockParticle(this));

        this.gameboard.appendChild(canvas);
    }

    outOfScreen() {
        const { canvas, positionX, positionY, sizeX, sizeY } = this;
        if(positionX < 0 - sizeX) return true;
        if(positionY < 0 - sizeY) return true;
        if(positionX > window.innerWidth) return true;
        if(positionY > window.innerHeight) return true;

        return false;
    }

    move() {
        const { angle, positionX, positionY, moveSpeed, canvas, health } = this;
        
        if(this.outOfScreen() || health < 1) {
            canvas.remove();
            return;
        }

        this.positionX = Math.round((Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX) * 100) / 100;
        this.positionY = Math.round((Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY) * 100) / 100;

        this.render();
    }

    renderRockParticles() {
        if(this.rockParticles) {
            this.rockParticles.forEach((rockParticle, index) => rockParticle.move(index));
        }
    }

    render() {
        const { canvas, positionX, positionY, angle } = this;
        
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';

        this.renderRockParticles();
    }
}

export default Rock;