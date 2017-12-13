/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Particle {
    
        constructor(element) {
            this.sizeX = 4;
            this.sizeY = 4;
            this.positionX = element.positionX + (element.sizeX / 2);
            this.positionY = element.positionY + (element.sizeY / 2);
            this.angle = Math.floor((Math.random() * 360));
            this.canvas = document.createElement("canvas");
            this.context = this.canvas.getContext('2d');
            this.moveSpeed = Math.floor((Math.random() * 3) + 1);
            this.gameboard = document.getElementById("gameboard");
            this.lifeCycle = Math.floor((Math.random() * 50) + 20);
            this.rock;
            this.ship;
            if(element.type === 'ship') this.ship = element;
            if(element.type === 'rock') this.rock = element;
    
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
            context.arc(sizeX / 2, sizeY / 2, (sizeX / 2 - 1), 0, 2 * Math.PI, false);
            context.fillStyle = '#fff';
            context.shadowBlur = 15;
            context.shadowColor = '#fff';
            context.fill(); 
    
            this.gameboard.appendChild(canvas);
        }
    
        move(index) {
            const { angle, positionX, positionY, moveSpeed, rock, canvas, lifeCycle, ship } = this;
    
            if(this.outOfScreen() || lifeCycle < 1) {
                if(rock) rock.rockParticles.splice(index, 1);
                if(ship) ship.shipParticles.splice(index, 1);
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
    
    /* harmony default export */ __webpack_exports__["a"] = (Particle);

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__styles_main_css__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__styles_main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__styles_main_css__);



const startGame = document.getElementById('startGame');
const menu = document.getElementById('menu');

startGame.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__["a" /* default */])();
});

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__ = __webpack_require__(6);



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

    ship = new __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* default */]();
    rockInterval = setInterval(() => {
        if(rocks && rocks.length < rockLimitCounter) rocks.push(new __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["a" /* default */](ship));
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

/* harmony default export */ __webpack_exports__["a"] = (constructGameBoard);

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__handlers__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__bullet_bullet__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particle_particle__ = __webpack_require__(0);




const shipExplosionSound = new Audio('./assets/sounds/explosion2.mp3');
const menu = document.getElementById('menu');

const EXPLOSION_PARTICLE_COUNT = 10;

class Ship {

    constructor() {
        this.type = 'ship';
        this.sizeX = 20;
        this.sizeY = 19;
        this.positionX = 110;
        this.positionY = 110;
        this.angle = 0;
        this.movementAngle = 0;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = 0;
        this.rotationSpeed = 0;
        this.crossSpeed = 0;
        this.gameboard = document.getElementById("gameboard");
        this.init();
        this.shotBullets = [];
        this.lifeCount = 3;
        this.immunity = 100;
        this.shipParticles = [];
    }

    init() {
        const shape = [[0, 6], [0, -6], [15, 0]];
        const { sizeX, sizeY, canvas, context, angle, positionX, positionY } = this;

        canvas.width = sizeX;
        canvas.height = sizeY;
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.position = "absolute";

        context.translate(3, 9);
        context.rotate(angle * Math.PI / 180);
        context.fillStyle = "#fff";
        context.shadowBlur = 5;
        context.shadowColor = '#fff';
        context.beginPath();
        context.moveTo(shape[0][0],shape[0][1]);
        context.lineTo(shape[1][0],shape[1][1]);
        context.lineTo(shape[2][0],shape[2][1]);
        context.closePath();
        context.stroke();
        context.fill();

        this.canvas.id = "ship";
        this.gameboard.appendChild(this.canvas);

        Object(__WEBPACK_IMPORTED_MODULE_0__handlers__["a" /* default */])(this);
        this.render();
    }

    setMovementParameters(moveSpeed, rotationSpeed, crossSpeed) {
        this.moveSpeed = moveSpeed;
        this.rotationSpeed = rotationSpeed;
        this.crossSpeed = crossSpeed;
    }

    shootMachineGun(minigunSound) {
        minigunSound.play();
        if(this.shotBullets.length < 300) {
            this.shotBullets.push(new __WEBPACK_IMPORTED_MODULE_1__bullet_bullet__["a" /* default */](this));
        }
    }

    translateNewValues() {
        this.move();
        this.rotate();
    }

    outOfScreenMovement() {
        const { canvas, positionX, positionY, sizeX, sizeY } = this;
        if(positionX < 0 - sizeX) this.positionX = window.innerWidth;
        if(positionY < 0 - sizeY) this.positionY = window.innerHeight;
        if(positionX > window.innerWidth) this.positionX = 0 - sizeX;
        if(positionY > window.innerHeight) this.positionY = 0 - sizeY;
    }

    explosion() {
        for(let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            this.shipParticles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */](this));
        }
        shipExplosionSound.currentTime = 0;
        shipExplosionSound.play();
    }

    move() {
        const { angle, positionX, positionY, moveSpeed, movementAngle, crossSpeed } = this;

        const positionXWithAngle = Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX;
        const positionYWithAngle = Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY;

        let crossAngle = 0;

        if(crossSpeed > 0) crossAngle = angle - 90;
        if(crossSpeed < 0) crossAngle = angle - 90;

        const positionXWithCrossAngle = Math.cos((crossAngle) * Math.PI / 180) * crossSpeed + positionX;
        const positionYWithCrossAngle = Math.sin((crossAngle) * Math.PI / 180) * crossSpeed + positionY;
        
        this.positionX = (positionXWithAngle + positionXWithCrossAngle) / 2;
        this.positionY = (positionYWithAngle + positionYWithCrossAngle) / 2;

        this.outOfScreenMovement();

        this.render();
    }

    rotate() {
        this.angle += this.rotationSpeed;

        this.render();
    }

    renderBullets() {
        if(this.shotBullets) {
            this.shotBullets.forEach((bullet, index) => bullet.move(index));
        }
    }

    renderShipParticles() {
        if(this.shipParticles) {
            this.shipParticles.forEach((shipParticle, index) => shipParticle.move(index));
        }
    }

    render() {
        const { canvas, positionX, positionY, angle, shotBullets, lifeCount, immunity, shipParticles } = this;

        if(lifeCount < 0) {
            canvas.style.visibility = "hidden";
        }

        if(shipParticles && shipParticles.length == 0 && lifeCount < 0) {
            canvas.remove();
            delete this;
            return;
        }

        if(immunity != 0) this.immunity--;
        
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';
        canvas.style.transform = 'rotate(' + angle + 'deg)';

        this.renderBullets();
        this.renderShipParticles();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ship);

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const ROTATION_STEP = 0.05;
const MOVE_STEP = 0.05;
const CROSS_SPEED_STEP = 0.05;

let MOVE_SPEED = 0;
let ROTATION_SPEED = 0;
let CROSS_SPEED = 0;

const keyPressStorage = {};
const controllKeys = ['w', 'a', 's', 'd'];
const allowedKeys = ['w', 'a', 's', 'd', 'q', 'e', ' '];

const thrusterSound = new Audio('./assets/sounds/thrust.mp3');
const minigunSound = new Audio('./assets/sounds/minigun.mp3'); 
const engine = new Audio('./assets/sounds/engine.mp3'); 

let interval;

const addMinigunSound = () => {
  minigunSound.addEventListener('timeupdate', function(){
    const buffer = .44
    if(this.currentTime > this.duration - buffer){
        this.currentTime = 0
        this.play()
    }}, false);
}

const addEngineSound = () => {
  engine.addEventListener('timeupdate', function(){
    const buffer = .44
    if(this.currentTime > this.duration - buffer){
        this.currentTime = 0
        this.play()
    }}, false);
  engine.volume = 0.2;
  engine.play();
}

const addThrusterSound = () => {
  thrusterSound.addEventListener('timeupdate', function(){
    const buffer = .44
    if(this.currentTime > this.duration - buffer){
        this.currentTime = 0
        this.play()
    }}, false);
}

const changeStates = (ship) => {
  if(!keyPressStorage[' ']) {
    minigunSound.pause();
  }

  if(isAnyKeysDown()) {
    makeKeyPressActions(ship);
  } else {
    thrusterSound.currentTime = 0;
    thrusterSound.pause();
  }
}

const isAnyKeysDown = () => {
  return Object.keys(keyPressStorage).find((key) => {
    return keyPressStorage[key];
  });
};

const makeKeyPressActions = (ship) => {
  if(keyPressStorage['w'] && MOVE_SPEED <= 10) MOVE_SPEED += MOVE_STEP;
  if(keyPressStorage['s'] && MOVE_SPEED >= -10) MOVE_SPEED -= MOVE_STEP;

  if(keyPressStorage['d'] && ROTATION_SPEED <= 1) ROTATION_SPEED += ROTATION_STEP;
  if(keyPressStorage['a'] && ROTATION_SPEED >= -1) ROTATION_SPEED -= ROTATION_STEP;

  if(keyPressStorage['q'] && CROSS_SPEED <= 1) CROSS_SPEED += CROSS_SPEED_STEP;
  if(keyPressStorage['e'] && CROSS_SPEED >= -1) CROSS_SPEED -= CROSS_SPEED_STEP;

  if(keyPressStorage[' ']) ship.shootMachineGun(minigunSound);


  ship.setMovementParameters(MOVE_SPEED, ROTATION_SPEED, CROSS_SPEED);
}

const removeAllPreviousHandles = () => {
  window.removeEventListener("keydown", state => state);
  window.removeEventListener("keyup", state => state);
  if(interval) clearInterval(interval);
  if(ship) {
    ship.moveSpeed = 0;
    ship.rotationSpeed = 0;
    ship.crossSpeed = 0;
  }
}

const loadArrowKeyHandler = (ship) => {
    addEngineSound();
    addMinigunSound();
    addThrusterSound();
    removeAllPreviousHandles();

    window.addEventListener("keydown", (event) => {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = true;
        if(event.key != ' ') thrusterSound.play();
      }
    });

    window.addEventListener("keyup", (event) => {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = false;
      }
    });

    interval = setInterval(() => changeStates(ship), 1000 / 60);
};

/* harmony default export */ __webpack_exports__["a"] = (loadArrowKeyHandler);

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Bullet {

    constructor(ship) {
        this.sizeX = 12;
        this.sizeY = 12;
        this.positionX = ship.positionX + 1;
        this.positionY = ship.positionY + 3;
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
        context.strokeStyle = "#fff";
        context.shadowBlur = 20;
        context.shadowColor = '#fff';
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

/* harmony default export */ __webpack_exports__["a"] = (Bullet);

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__particle_particle__ = __webpack_require__(0);


const EXPLOSION_PARTICLE_COUNT = 30;
const rockHitSound = new Audio('./assets/sounds/explosion1.mp3');
const rockExplosionSound = new Audio('./assets/sounds/explosion2.mp3');

class Rock {

    constructor(ship) {
        this.type = 'rock';
        this.health = Math.floor((Math.random() * 40) + 20);
        this.sizeX =  Math.floor((Math.random() * 40) + 30);
        this.sizeY =  this.sizeX;
        this.positionX = 500;
        this.positionY = 90;
        this.angle = 0;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.moveSpeed = Math.floor((Math.random() * 3) + 1);
        this.gameboard = document.getElementById("gameboard");
        this.rockParticles = [];
        this.shotBullets = ship.shotBullets;
        this.ship = ship;
        this.allowHits = true;

        this.initPositionCoordinates();
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
        context.arc(sizeX / 2, sizeY / 2, (sizeX / 2 - 6), 0, 2 * Math.PI, false);
        context.fillStyle = '#fff';
        context.shadowBlur = 10;
        context.shadowColor = '#fff';
        context.fill();

        this.gameboard.appendChild(canvas);
    }

    outOfScreenMovement() {
        const { canvas, positionX, positionY, sizeX, sizeY } = this;
        if(positionX < 0 - sizeX) this.positionX = window.innerWidth;
        if(positionY < 0 - sizeY) this.positionY = window.innerHeight;
        if(positionX > window.innerWidth) this.positionX = 0 - sizeX;
        if(positionY > window.innerHeight) this.positionY = 0 - sizeY;
    }

    bulletHit() {
        rockHitSound.currentTime = 0;
        rockHitSound.play();
        this.rockParticles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */](this));
    }

    explosion() {
        for(let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            this.rockParticles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */](this));
        }
        rockExplosionSound.currentTime = 0;
        rockExplosionSound.play();
    }

    move() {
        const { angle, positionX, positionY, moveSpeed, canvas, health } = this;

        this.positionX = Math.round((Math.cos((angle) * Math.PI / 180) * moveSpeed + positionX) * 100) / 100;
        this.positionY = Math.round((Math.sin((angle) * Math.PI / 180) * moveSpeed + positionY) * 100) / 100;

        this.outOfScreenMovement();

        this.render();
    }

    renderRockParticles() {
        if(this.rockParticles) {
            this.rockParticles.forEach((rockParticle, index) => rockParticle.move(index));
        }
    }

    pointInterscetsWithCircle(pointX, pointY, centerX, centerY, radius) {
        return Math.sqrt((pointX - centerX) * (pointX - centerX) + (pointY - centerY) * (pointY - centerY)) < radius - 3;
    }

    renderShipIntersection() {
        const { ship, positionX, positionY, sizeX, sizeY, allowHits } = this;

        const radius = sizeX / 2;
        const centerX = positionX + (sizeX / 2);
        const centerY = positionY + (sizeY / 2);

        const shipNoseX = ship.positionX + ship.sizeX;
        const shipNoseY = ship.positionY + (ship.sizeY / 2);

        const shipSide1X = ship.positionX;
        const shipSide1Y = ship.positionY;

        const shipSide2X = ship.positionX;
        const shipSide2Y = ship.positionY + ship.sizeY;

        const noseIntersection = this.pointInterscetsWithCircle(shipNoseX, shipNoseY, centerX, centerY, radius);
        const side1Intersection = this.pointInterscetsWithCircle(shipSide1X, shipSide1Y, centerX, centerY, radius);
        const side2Intersection = this.pointInterscetsWithCircle(shipSide2X, shipSide2Y, centerX, centerY, radius);
        
        const hasIntersected = noseIntersection || side1Intersection || side2Intersection;

        if(hasIntersected && ship.immunity == 0 && allowHits) {
            ship.immunity = 200;
            ship.lifeCount--;
            ship.explosion();
        }
    }

    renderIntersection() {
        const { shotBullets, positionX, positionY, sizeX, sizeY, canvas, allowHits } = this;
        if(!shotBullets && !allowHits) return;

        const radius = sizeX / 2;
        const centerX = positionX + (sizeX / 2);
        const centerY = positionY + (sizeY / 2);
        
        shotBullets.forEach((bullet, index) => {
            const hasIntersected = this.pointInterscetsWithCircle(bullet.positionX, bullet.positionY, centerX, centerY, radius);

            if(hasIntersected && allowHits) {
                shotBullets.splice(index, 1);
                bullet.canvas.remove();
                this.bulletHit();
                this.health--;
                return;
            }
        });
    }

    render() {
        const { canvas, positionX, positionY, angle, rockParticles, allowHits, health } = this;

        if(this.health < 0 && allowHits) {
            const scoreElement = document.getElementById('score');

            const score = scoreElement.innerHTML.replace(/\D/g,'');
            const newScore = parseInt(score) + 1;

            const currentHits = localStorage.getItem('currentHits');
            localStorage.setItem('currentHits', parseInt(currentHits) + 1);

            scoreElement.innerHTML = 'Score: ' + newScore;

            this.allowHits = false;
            canvas.style.visibility = "hidden";
            this.explosion();
            return;
        }

        if(rockParticles.length == 0 && !allowHits) {
            canvas.remove();
            delete this;
            return;
        }
        
        canvas.style.left = positionX + 'px';
        canvas.style.top = positionY + 'px';

        this.renderIntersection();
        this.renderShipIntersection();
        this.renderRockParticles();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Rock);

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(8);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(10)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./main.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./main.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(9)(undefined);
// imports


// module
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n  \ncanvas {\n    position: absolute;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    height: 250px;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}", ""]);

// exports


/***/ }),
/* 9 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			var styleTarget = fn.call(this, selector);
			// Special case to return head of iframe instead of iframe itself
			if (styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[selector] = styleTarget;
		}
		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(11);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 11 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ })
/******/ ]);