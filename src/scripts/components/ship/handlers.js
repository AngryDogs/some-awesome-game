let ROTATION_STEP = 1;
let MOVE_STEP = 1;
let longPress = false;
let lastPressedKey = undefined;
let useTrajectory = false;

let MOVE_SPEED = 0;
let ROTATION_SPEED = 0;

const keyPressStorage = {};
const allowedKeys = ['w', 'a', 's', 'd'];

const isAnyKeysDown = () => {
  return Object.keys(keyPressStorage).find((key) => {
    return keyPressStorage[key];
  });
};

const makeKeyPressActions = (ship) => {
  const { angle, movementAngle } = ship
  let direction = movementAngle - angle + 180;

  if(keyPressStorage['w'] && MOVE_SPEED <= 1) {
    if(direction <= 90 && direction >= -90) {
      MOVE_SPEED -= 0.005;
    } else {
      MOVE_SPEED += 0.005;
    }
    useTrajectory = true;
  }

  if(keyPressStorage['s'] && MOVE_SPEED >= -1) {
    if(direction <= 90 && direction >= -90) {
      MOVE_SPEED += 0.005;
    } else {
      MOVE_SPEED -= 0.005;
    }
    useTrajectory = true;
  };
  if(keyPressStorage['d'] && ROTATION_SPEED <= 1) ROTATION_SPEED += 0.005;
  if(keyPressStorage['a'] && ROTATION_SPEED >= -1) ROTATION_SPEED -= 0.005;
}

const loadArrowKeyHandler = (ship) => {
    window.addEventListener("keydown", function (event) {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = true;
      }
    });

    window.addEventListener("keyup", function (event) {
      if(allowedKeys.includes(event.key)) {
        keyPressStorage[event.key] = false;

        if(event.key === 'w' || event.key === 's') useTrajectory = false;
      }
    });

    setInterval(() => {
      if(isAnyKeysDown()) {
        makeKeyPressActions(ship);
      }
      ship.setMovementParameters(MOVE_SPEED, ROTATION_SPEED, useTrajectory);
    }, 3);
};

export default loadArrowKeyHandler;