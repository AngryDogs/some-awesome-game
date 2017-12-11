import Ship from '../components/ship/ship';

let repeater;
let ship = new Ship();
let lastLoop = new Date;

const repeateFunction = () => {
    const thisLoop = new Date;
    const fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;

    if(ship) ship.translateNewValues();

    repeater = requestAnimationFrame(repeateFunction);
}

const constructGameBoard = () => {
    repeater = requestAnimationFrame(repeateFunction);
}

export default constructGameBoard;