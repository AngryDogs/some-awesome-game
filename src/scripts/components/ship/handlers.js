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


const addMinigunSound = () => {
  minigunSound.addEventListener('timeupdate', function(){
    const buffer = .44
    if(this.currentTime > this.duration - buffer){
        this.currentTime = 0
        this.play()
    }}, false);
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

const loadArrowKeyHandler = (ship) => {
    addMinigunSound();
    addThrusterSound();

    window.addEventListener("keydown", function (event) {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = true;
        if(event.key != ' ') thrusterSound.play();
      }
    });

    window.addEventListener("keyup", function (event) {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = false;
      }
    });

    setInterval(() => changeStates(ship), 1000 / 60);
};

export default loadArrowKeyHandler;