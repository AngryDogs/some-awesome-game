import Ship from '../components/ship/ship';
import Rock from '../components/rock/rock';

let repeater;
let ship = new Ship();
let lastLoop = new Date;

let rock = new Rock(ship.shotBullets);

const repeateFunction = () => {
    const thisLoop = new Date;
    const fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;

    if(ship) ship.translateNewValues();
    if(rock) rock.move();

    repeater = requestAnimationFrame(repeateFunction);
}

const constructGameBoard = () => {
    repeater = requestAnimationFrame(repeateFunction);
}

export default constructGameBoard;