import Ship from '../components/ship/ship';
import Rock from '../components/rock/rock';

let repeater;
let ship;
let lastLoop = new Date;

let level = 1;
let score = 0;
let refrechCounter = 0;
let rockLimitCounter = 2; 

const gameboard = document.getElementById("gameboard");
const menu = document.getElementById('menu');
const levelElement = document.getElementById('level');
const scoreElement = document.getElementById('score');
const fpsElement = document.getElementById('fps');
const healthElement = document.getElementById('health');

let rockInterval;

let rocks = [];

const levelIncrement = () => {
    const score = scoreElement.innerHTML.replace(/\D/g,'');
    const currentScore = parseInt(score);

    const currentHits = parseInt(localStorage.getItem('currentHits'));

    if(currentHits && rocks && currentHits === rocks.length && !hasAnyParticles()) {
        localStorage.setItem('currentHits', 0);
        level++;
        rockLimitCounter += 5;
        rocks = [];
    }
}

const hasAnyParticles = () => {
    if(rocks) return rocks.find(rock => {
        return rock.rockParticles.length > 0;
    });
    return false;
}

const renderInfo = () => {

    levelElement.innerHTML = 'Level: ' + level;
    if(ship) healthElement.innerHTML = 'Lifes: ' + ship.lifeCount;
    const fps = calculateFps();

    if(refrechCounter === 10) {
        fpsElement.innerHTML = 'Fps: ' + Math.floor(fps);
        refrechCounter = 0;
    } else {
        refrechCounter++;
    }
}

const repeateFunction = () => {

    levelIncrement();
    renderInfo();
    if(ship) ship.translateNewValues();
    if(rocks) rocks.forEach(rock => rock.move(score));

    if(ship && ship.lifeCount < 0) {
        menu.style.visibility = 'visible';
        
        while (gameboard.firstChild) {
            gameboard.removeChild(gameboard.firstChild);
        }

        window.cancelAnimationFrame(repeateFunction);
        return;
    }

    repeater = requestAnimationFrame(repeateFunction);
};

const constructGameBoard = () => {
    restoreGameBoard();

    ship = new Ship();
    rockInterval = setInterval(() => {
        if(rocks && rocks.length < rockLimitCounter) rocks.push(new Rock(ship));
    }, 2000);

    repeater = requestAnimationFrame(repeateFunction);
};

const restoreGameBoard = () => {
    level = 1;
    score = 0;
    scoreElement.innerHTML = 'Score: ' + 0;
    refrechCounter = 0;
    rockLimitCounter = 2;
    rocks = [];
    ship = null;

    localStorage.setItem('currentHits', 0);

    if(rockInterval) clearInterval(rockInterval);
}

const calculateFps = () => {
    const thisLoop = new Date;
    const fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;
    return fps;
};

export default constructGameBoard;