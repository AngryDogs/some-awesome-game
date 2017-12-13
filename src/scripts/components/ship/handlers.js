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

export default loadArrowKeyHandler;