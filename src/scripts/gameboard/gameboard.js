import Ship from '../components/ship/ship';
import Rock from '../components/rock/rock';

let repeater;
let ship = new Ship();
let lastLoop = new Date;

let rocks = [];
rocks.push(new Rock(ship));

const repeateFunction = () => {
    const thisLoop = new Date;
    const fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;

    if(ship) ship.translateNewValues();
    if(rocks) rocks.forEach(rock => rock.move());

    if(ship && ship.lifeCount < 0) {
        window.cancelAnimationFrame(repeateFunction);
        return;
    }

    repeater = requestAnimationFrame(repeateFunction);
}

const constructGameBoard = () => {
    // setInterval(() => {
    //     if(rocks && rocks.length < 20) rocks.push(new Rock(ship));
    // }, 2000);

    repeater = requestAnimationFrame(repeateFunction);
}

export default constructGameBoard;