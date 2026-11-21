// Touch controls for phones and tablets.
//
//  - Left: a virtual joystick. Push towards where you want to go: an autopilot turns the
//    ship to face that way (countering spin, since this is zero-g) and thrusts once lined up.
//  - Right: touch and hold anywhere on the right part of the screen to aim the guns at that
//    point and fire.
//  - Buttons: missiles (hold), stabilizer (tap on/off), a context button (Dock / DHD),
//    auto-target, zoom and pause.
//
// The controls write into the same `input` object the keyboard and mouse use, so the rest
// of the game doesn't need to know where the input came from.

export const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;

const JOYSTICK_RADIUS = 60;
const TURN_DEADZONE = 0.08;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class TouchControls {

    // actions: { interact(), pause(), toggleAuto(), toggleStabilizer(), zoom(factor) }
    constructor(input, canvas, actions) {
        this.input = input;
        this.canvas = canvas;
        this.actions = actions;
        this.stick = null;      // { id, cx, cy, x, y }
        this.aim = null;        // pointer id aiming/firing
        this.build();
        this.bindCanvas();
    }

    build() {
        const root = el('div', 'touch-ui');

        this.base = el('div', 'touch-stick');
        this.knob = el('div', 'touch-knob');
        this.base.appendChild(this.knob);
        root.appendChild(this.base);

        const cluster = el('div', 'touch-buttons');
        const hold = (label, className, key) => {
            const button = el('button', 'touch-button ' + className, label);
            const set = (on) => (event) => {
                event.preventDefault();
                this.input[key] = on;
                button.classList.toggle('pressed', on);
            };
            button.addEventListener('pointerdown', set(true));
            button.addEventListener('pointerup', set(false));
            button.addEventListener('pointercancel', set(false));
            button.addEventListener('pointerleave', set(false));
            return button;
        };
        const tap = (label, className, action) => {
            const button = el('button', 'touch-button ' + className, label);
            button.addEventListener('pointerdown', (event) => {
                event.preventDefault();
                action();
            });
            return button;
        };

        this.interactButton = tap('Dock', 'interact', () => this.actions.interact());
        this.autoButton = tap('Auto', 'auto', () => this.actions.toggleAuto());
        cluster.appendChild(this.interactButton);
        cluster.appendChild(this.autoButton);
        this.stabButton = tap('Stabilize', 'brake', () => this.actions.toggleStabilizer());
        cluster.appendChild(this.stabButton);
        cluster.appendChild(hold('Missile', 'missile', 'missileKey'));
        root.appendChild(cluster);

        const corner = el('div', 'touch-corner');
        corner.appendChild(tap('+', 'small', () => this.actions.zoom(1.25)));
        corner.appendChild(tap('-', 'small', () => this.actions.zoom(0.8)));
        corner.appendChild(tap('II', 'small', () => this.actions.pause()));
        root.appendChild(corner);

        this.rotateHint = el('div', 'touch-rotate', 'Turn your phone sideways for the best view');
        root.appendChild(this.rotateHint);

        document.body.appendChild(root);
        this.root = root;
        this.show(false);
    }

    bindCanvas() {
        const target = this.canvas;
        target.style.touchAction = 'none';

        target.addEventListener('pointerdown', (event) => {
            if(event.pointerType === 'mouse' || !this.visible) return;
            event.preventDefault();
            const leftSide = event.clientX < window.innerWidth * 0.45;
            // A second finger on the same side as an active control is a pinch-zoom: let go
            // of that control so pinching doesn't steer or shoot.
            const stickSide = this.stick && this.stick.left === leftSide;
            const aimSide = this.aim !== null && this.aimLeft === leftSide;
            if(stickSide || aimSide) {
                if(stickSide) { this.stick = null; this.placeStick(); }
                if(aimSide) { this.aim = null; this.input.mouseDown = false; }
                return;
            }
            if(leftSide && !this.stick) {
                // Joystick appears where the thumb lands (within the left side).
                this.stick = { left: true, id: event.pointerId, cx: event.clientX, cy: event.clientY, x: event.clientX, y: event.clientY };
                this.placeStick();
            } else if(!this.aim) {
                this.aim = event.pointerId;
                this.aimLeft = leftSide;
                this.input.mouseX = event.clientX;
                this.input.mouseY = event.clientY;
                this.input.mouseDown = true;
            }
        });
        target.addEventListener('pointermove', (event) => {
            if(event.pointerType === 'mouse') return;
            if(this.stick && event.pointerId === this.stick.id) {
                this.stick.x = event.clientX;
                this.stick.y = event.clientY;
                this.placeStick();
            } else if(event.pointerId === this.aim) {
                this.input.mouseX = event.clientX;
                this.input.mouseY = event.clientY;
            }
        });
        const release = (event) => {
            if(this.stick && event.pointerId === this.stick.id) {
                this.stick = null;
                this.placeStick();
            }
            if(event.pointerId === this.aim) {
                this.aim = null;
                this.input.mouseDown = false;
            }
        };
        target.addEventListener('pointerup', release);
        target.addEventListener('pointercancel', release);
    }

    placeStick() {
        const stick = this.stick;
        if(!stick) {
            this.base.classList.remove('active');
            this.knob.style.transform = 'translate(-50%, -50%)';
            return;
        }
        this.base.classList.add('active');
        this.base.style.left = stick.cx + 'px';
        this.base.style.top = stick.cy + 'px';
        let dx = stick.x - stick.cx;
        let dy = stick.y - stick.cy;
        const length = Math.sqrt(dx * dx + dy * dy);
        if(length > JOYSTICK_RADIUS) {
            dx *= JOYSTICK_RADIUS / length;
            dy *= JOYSTICK_RADIUS / length;
        }
        this.knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }

    show(visible) {
        this.visible = visible;
        this.root.style.display = visible ? '' : 'none';
        if(!visible) {
            this.stick = null;
            this.aim = null;
            this.placeStick();
        }
    }

    // Called every frame while playing: turns the joystick into thrust and turning, and
    // updates the context buttons.
    update(ship, context) {
        const input = this.input;
        this.rotateHint.style.display = window.innerHeight > window.innerWidth ? '' : 'none';

        this.interactButton.style.display = context.interactLabel ? '' : 'none';
        this.interactButton.textContent = context.interactLabel || '';
        this.autoButton.style.display = ship.guidance ? '' : 'none';
        this.autoButton.classList.toggle('pressed', !!ship.autoTarget);
        this.stabButton.classList.toggle('pressed', !!ship.stabilizer);

        const stick = this.stick;
        if(!stick || !ship.alive) {
            input.forward = false;
            input.rotateLeft = false;
            input.rotateRight = false;
            return;
        }
        const dx = stick.x - stick.cx;
        const dy = stick.y - stick.cy;
        const push = Math.min(1, Math.sqrt(dx * dx + dy * dy) / JOYSTICK_RADIUS);
        if(push < 0.15) {
            input.forward = false;
            input.rotateLeft = false;
            input.rotateRight = false;
            return;
        }

        // Steer: aim for an angular velocity proportional to the heading error, so the
        // ship turns briskly and settles without overshooting.
        const desired = Math.atan2(dy, dx);
        const error = angleDifference(ship.angle, desired);
        const maxTurn = ship.stats.maxTurn;
        const wanted = Math.max(-maxTurn, Math.min(maxTurn, error * 3));
        input.rotateRight = Math.abs(error) > TURN_DEADZONE && ship.angularVelocity < wanted - 0.05;
        input.rotateLeft = Math.abs(error) > TURN_DEADZONE && ship.angularVelocity > wanted + 0.05;
        if(Math.abs(error) <= TURN_DEADZONE) {
            // Lined up: cancel leftover spin.
            input.rotateRight = ship.angularVelocity < -0.1;
            input.rotateLeft = ship.angularVelocity > 0.1;
        }
        // Thrust once roughly facing the stick direction; harder push = thrust sooner.
        input.forward = push > 0.35 && Math.abs(error) < 0.35 + push * 0.4;
    }
}

export default TouchControls;
