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
    Space: 'fire'
};

export const input = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
    strafeLeft: false,
    strafeRight: false,
    stabilize: false,
    fire: false,
    mouseDown: false,
    mouseX: window.innerWidth / 2,
    mouseY: 0,
    enabled: false,

    get firing() {
        return this.fire || this.mouseDown;
    },

    reset() {
        Object.keys(KEY_MAP).forEach(code => { this[KEY_MAP[code]] = false; });
        this.mouseDown = false;
    }
};

let initialized = false;

const loadInputHandlers = () => {
    if(initialized) return;
    initialized = true;

    window.addEventListener('keydown', (event) => {
        const action = KEY_MAP[event.code];
        if(!action) return;
        if(input.enabled) event.preventDefault();
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
        if(event.button === 0 && input.enabled) input.mouseDown = true;
    });

    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) input.mouseDown = false;
    });

    window.addEventListener('contextmenu', (event) => {
        if(input.enabled) event.preventDefault();
    });

    // Releasing keys while the window is unfocused would otherwise leave them stuck.
    window.addEventListener('blur', () => input.reset());
};

export default loadInputHandlers;
