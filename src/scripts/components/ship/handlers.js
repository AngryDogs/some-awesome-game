const ROTATION_STEP = 0.05;
const MOVE_STEP = 0.05;
const CROSS_SPEED_STEP = 0.05;

let lastLoop = new Date;
let initializedShip;
let repeater;

let longPress = false;

let MOVE_SPEED = 0;
let ROTATION_SPEED = 0;
let CROSS_SPEED = 0;

const keyPressStorage = {};
const allowedKeys = ['w', 'a', 's', 'd', 'q', 'e', ' '];

const repeatOften = () => {
  if(isAnyKeysDown() && initializedShip) {
    makeKeyPressActions(initializedShip);
  }

  const thisLoop = new Date;
  const fps = 1000 / (thisLoop - lastLoop);
  lastLoop = thisLoop;

  initializedShip.setMovementParameters(MOVE_SPEED, ROTATION_SPEED, CROSS_SPEED);
  repeater = requestAnimationFrame(repeatOften);
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

  if(keyPressStorage[' ']) ship.shootMachineGun();
}

const loadArrowKeyHandler = (ship) => {
    initializedShip = ship;

    window.addEventListener("keydown", function (event) {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = true;
      }
    });

    window.addEventListener("keyup", function (event) {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = false;
      }
    });

    repeater = requestAnimationFrame(repeatOften);
};

export default loadArrowKeyHandler;