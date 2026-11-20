// Keyboard + mouse input. Listeners are attached once; the game reads `input`
// every physics step instead of mutating ship state from a separate interval.

const KEY_MAP = {
    KeyW: 'forward',
    KeyS: 'backward',
    KeyA: 'rotateLeft',
    KeyD: 'rotateRight',
    KeyQ: 'strafeLeft',
    KeyE: 'strafeRight',
    KeyX: 'stabilize',
    KeyF: 'missileKey',
    Space: 'fire'
};

// One-shot key presses (toggle auto-targeting, pause).
const pressHandlers = {};

export const input = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
    strafeLeft: false,
    strafeRight: false,
    stabilize: false,
    fire: false,
    missileKey: false,
    mouseDown: false,
    rightMouseDown: false,
    mouseX: window.innerWidth / 2,
    mouseY: 0,
    enabled: false,

    get firing() {
        return this.fire || this.mouseDown;
    },

    get firingMissiles() {
        return this.missileKey || this.rightMouseDown;
    },

    reset() {
        Object.keys(KEY_MAP).forEach(code => { this[KEY_MAP[code]] = false; });
        this.mouseDown = false;
        this.rightMouseDown = false;
    }
};

export const onKeyPress = (code, handler) => {
    pressHandlers[code] = handler;
};

let initialized = false;

const loadInputHandlers = () => {
    if(initialized) return;
    initialized = true;

    window.addEventListener('keydown', (event) => {
        if(pressHandlers[event.code] && !event.repeat && pressHandlers[event.code](event)) {
            event.preventDefault();
            return;
        }
        const action = KEY_MAP[event.code];
        if(!action || !input.enabled) return;
        event.preventDefault();
        input[action] = true;
    });

    window.addEventListener('keyup', (event) => {
        const action = KEY_MAP[event.code];
        if(action) input[action] = false;
    });

    window.addEventListener('mousemove', (event) => {
        input.mouseX = event.clientX;
        input.mouseY = event.clientY;
    });

    window.addEventListener('mousedown', (event) => {
        if(!input.enabled) return;
        if(event.button === 0) input.mouseDown = true;
        if(event.button === 2) input.rightMouseDown = true;
    });

    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) input.mouseDown = false;
        if(event.button === 2) input.rightMouseDown = false;
    });

    window.addEventListener('contextmenu', (event) => {
        if(input.enabled) event.preventDefault();
    });

    // Releasing keys while the window is unfocused would otherwise leave them stuck.
    window.addEventListener('blur', () => input.reset());
};

export default loadInputHandlers;
