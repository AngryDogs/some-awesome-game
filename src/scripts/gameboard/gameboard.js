import Ship from '../components/ship/ship';
import Rock from '../components/rock/rock';

let repeater;
let ship = new Ship();
let lastLoop = new Date;

let level = 1;
let score = 0;
let refrechCounter = 0;

const levelElement = document.getElementById('level');
const scoreElement = document.getElementById('score');
const fpsElement = document.getElementById('fps');

let rocks = [];
rocks.push(new Rock(ship));

const renderInfo = () => {

    levelElement.innerHTML = 'Level: ' + level;
    scoreElement.innerHTML = 'Score: ' + score;
    const fps = calculateFps();

    if(refrechCounter === 10) {
        fpsElement.innerHTML = 'Fps: ' + Math.floor(fps);
        refrechCounter = 0;
    } else {
        refrechCounter++;
    }
}

const repeateFunction = () => {

    renderInfo();
    if(ship) ship.translateNewValues();
    if(rocks) rocks.forEach(rock => rock.move());

    if(ship && ship.lifeCount < 0) {
        window.cancelAnimationFrame(repeateFunction);
        return;
    }

    repeater = requestAnimationFrame(repeateFunction);
};

const constructGameBoard = () => {
    // setInterval(() => {
    //     if(rocks && rocks.length < 20) rocks.push(new Rock(ship));
    // }, 2000);

    repeater = requestAnimationFrame(repeateFunction);
};

const calculateFps = () => {
    const thisLoop = new Date;
    const fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;
    return fps;
};

export default constructGameBoard;