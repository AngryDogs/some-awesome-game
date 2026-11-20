// All game sounds. The engine and thruster loops use the recorded samples; weapons,
// impacts and effects are synthesized with the Web Audio API.
//
// Every sound is layered (a sub-bass "body", a mid punch and a noisy transient) and
// runs through a compressor; heavy weapons also send into a generated reverb so shots
// and explosions have a big, rolling tail instead of a thin "toy" blip.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.5);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.18);
const explosionSound = new Audio('./assets/sounds/explosion2.mp3');

// play() returns a promise that rejects when autoplay is blocked; ignore it.
const safePlay = (audio) => {
    const result = audio.play();
    if(result && result.catch) result.catch(() => {});
};

const setLooping = (audio, on) => {
    if(on && audio.paused) safePlay(audio);
    if(!on && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
    }
};

const playOneShot = (audio, volume) => {
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    safePlay(audio);
};

// ------------------------------------------------------------ Web Audio graph

let ac = null;
let master = null;      // dry bus -> compressor -> speakers
let reverb = null;      // wet bus -> convolver -> compressor
let noiseBuffer = null;
const lastPlayed = {};

// Decaying stereo noise: a cheap but convincing "big hangar / space" reverb.
const createImpulse = (c, seconds, decay) => {
    const length = Math.floor(c.sampleRate * seconds);
    const impulse = c.createBuffer(2, length, c.sampleRate);
    for(let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for(let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return impulse;
};

const context = () => {
    if(ac) return ac;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();

        const compressor = ac.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 12;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        const output = ac.createGain();
        output.gain.value = 0.9;
        compressor.connect(output);
        output.connect(ac.destination);

        master = ac.createGain();
        master.gain.value = 0.7;
        master.connect(compressor);

        const convolver = ac.createConvolver();
        convolver.buffer = createImpulse(ac, 2.4, 3);
        reverb = ac.createGain();
        reverb.gain.value = 0.55;
        reverb.connect(convolver);
        convolver.connect(compressor);

        noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    } catch(e) {
        ac = null;
    }
    return ac;
};

// Limits how often one effect can retrigger, so rapid events don't turn into noise.
const throttle = (name, seconds) => {
    const c = context();
    if(!c) return null;
    if(lastPlayed[name] && c.currentTime - lastPlayed[name] < seconds) return null;
    lastPlayed[name] = c.currentTime;
    return c;
};

// Gain envelope feeding the dry bus, plus an optional reverb send (`wet` 0..1).
const envelope = (c, peak, attack, decay, wet) => {
    const gain = c.createGain();
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    gain.connect(master);
    if(wet) {
        const send = c.createGain();
        send.gain.value = wet;
        gain.connect(send);
        send.connect(reverb);
    }
    return gain;
};

const tone = (c, type, from, to, duration, output) => {
    const osc = c.createOscillator();
    const now = c.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    osc.connect(output);
    osc.start(now);
    osc.stop(now + duration + 0.05);
    return osc;
};

const noise = (c, duration, filterType, from, to, output, q) => {
    const source = c.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    const now = c.currentTime;
    filter.type = filterType;
    filter.Q.value = q || 1;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
    source.connect(filter);
    filter.connect(output);
    source.start(now, Math.random() * 0.5);
    source.stop(now + duration + 0.05);
};

// Deep layered detonation used by missiles, drones and big impacts.
const boom = (c, size, wet) => {
    tone(c, 'sine', 95 + 30 / size, 26, 1.1 * size, envelope(c, 0.55, 0.004, 1.1 * size, wet));
    tone(c, 'triangle', 180, 45, 0.35, envelope(c, 0.25, 0.002, 0.35, wet * 0.5));
    noise(c, 1.3 * size, 'lowpass', 2600, 60, envelope(c, 0.5, 0.003, 1.3 * size, wet));
    noise(c, 0.5, 'bandpass', 4500, 900, envelope(c, 0.12, 0.002, 0.45, wet), 1.5);
};

// Random pitch variation so rapid fire never sounds like the same sample repeating.
const vary = (amount) => 1 + (Math.random() - 0.5) * 2 * amount;

// Ring-modulated tone: a carrier multiplied by a modulator gives the buzzing,
// electric timbre of energy weapons (instead of a clean "beep").
const ringTone = (c, type, from, to, modFrequency, duration, output) => {
    const carrier = c.createOscillator();
    const modulator = c.createOscillator();
    const ring = c.createGain();
    const now = c.currentTime;
    carrier.type = type;
    carrier.frequency.setValueAtTime(from, now);
    carrier.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    modulator.type = 'square';
    modulator.frequency.value = modFrequency;
    ring.gain.value = 0;
    modulator.connect(ring.gain);
    carrier.connect(ring);
    ring.connect(output);
    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + duration + 0.05);
    modulator.stop(now + duration + 0.05);
};

// Band-passed noise whose centre frequency sweeps: whooshes and "tsew" sounds.
const sweep = (c, duration, from, to, q, output) => noise(c, duration, 'bandpass', from, to, output, q);

// Short metallic "tang": two inharmonic partials through a resonant band-pass.
const metal = (c, base, duration, output) => {
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = base * 1.3;
    filter.Q.value = 9;
    filter.connect(output);
    tone(c, 'square', base, base * 0.97, duration, filter);
    tone(c, 'square', base * 1.37, base * 1.33, duration, filter);
};

// ------------------------------------------------------------ sustained voices

const createVoice = (build) => {
    let voice = null;
    return {
        start(level) {
            const c = context();
            if(!c) return;
            if(!voice) voice = build(c);
            const target = Math.max(0.0001, level === undefined ? 1 : level) * voice.peak;
            voice.gain.gain.cancelScheduledValues(c.currentTime);
            voice.gain.gain.setTargetAtTime(target, c.currentTime, 0.08);
        },
        stop() {
            if(!voice || !ac) return;
            const v = voice;
            voice = null;
            const now = ac.currentTime;
            v.gain.gain.cancelScheduledValues(now);
            v.gain.gain.setTargetAtTime(0.0001, now, 0.06);
            v.nodes.forEach(n => n.stop(now + 0.4));
        }
    };
};

// Asgard beam: detuned saws through a wobbling band-pass, a sub-bass drone and crackle.
const beamVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.3;
    gain.connect(send);
    send.connect(reverb);

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2.5;
    filter.connect(gain);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 7.5;
    lfoGain.gain.value = 520;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = b.type = 'sawtooth';
    a.frequency.value = 146;
    b.frequency.value = 148.6;
    a.connect(filter);
    b.connect(filter);

    const sub = c.createOscillator();
    const subGain = c.createGain();
    sub.type = 'sine';
    sub.frequency.value = 55;
    subGain.gain.value = 0.9;
    sub.connect(subGain);
    subGain.connect(gain);

    const crackle = c.createBufferSource();
    crackle.buffer = noiseBuffer;
    crackle.loop = true;
    const crackleFilter = c.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 3500;
    const crackleGain = c.createGain();
    crackleGain.gain.value = 0.25;
    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(gain);

    const nodes = [a, b, lfo, sub, crackle];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.2 };
});

// Tractor beam: a soft shimmering chord over a breathy, slowly sweeping "air" layer.
const tractorVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.4;
    gain.connect(send);
    send.connect(reverb);

    const tremolo = c.createGain();
    tremolo.gain.value = 0.7;
    tremolo.connect(gain);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);

    const nodes = [lfo];
    [[220, 0.5], [330, 0.35], [440.8, 0.25], [659, 0.12]].forEach(pair => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = pair[0];
        g.gain.value = pair[1];
        osc.connect(g);
        g.connect(tremolo);
        nodes.push(osc);
    });

    const air = c.createBufferSource();
    air.buffer = noiseBuffer;
    air.loop = true;
    const airFilter = c.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.Q.value = 6;
    airFilter.frequency.value = 900;
    const sweep = c.createOscillator();
    const sweepGain = c.createGain();
    sweep.frequency.value = 0.7;
    sweepGain.gain.value = 500;
    sweep.connect(sweepGain);
    sweepGain.connect(airFilter.frequency);
    const airGain = c.createGain();
    airGain.gain.value = 0.35;
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(gain);
    nodes.push(air, sweep);

    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.09 };
});

// ------------------------------------------------------------ public API

let beamOn = false;

const sounds = {
    // Must be called from a user gesture (e.g. the launch click) so audio can start.
    unlock() {
        const c = context();
        if(c && c.state === 'suspended') c.resume();
    },

    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    setFiring() { /* minigun rounds are synthesized per shot (minigunShot) */ },
    setBeam(on) {
        if(on && !beamOn) sounds.beamCharge();
        beamOn = on;
        if(on) beamVoice.start(); else beamVoice.stop();
    },

    // Asgard ion cannon spinning up as the beam fires: a fast rising whine and crack.
    beamCharge() {
        const c = throttle('beamCharge', 0.2);
        if(!c) return;
        ringTone(c, 'sawtooth', 180, 1400, 90, 0.18, envelope(c, 0.18, 0.01, 0.18, 0.4));
        noise(c, 0.12, 'highpass', 6000, 3000, envelope(c, 0.14, 0.001, 0.12, 0.3));
        tone(c, 'sine', 90, 50, 0.4, envelope(c, 0.4, 0.002, 0.4, 0.4));
    },
    // `level` 0..1 grows with the number of ore pieces held.
    setTractor(on, level) { if(on) tractorVoice.start(0.5 + 0.5 * (level || 0)); else tractorVoice.stop(); },

    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },

    // Tau'ri railgun turret (like the X-304's point-defence guns): a hard electric
    // crack, a metallic "tang" from the rails and a short concussive thump.
    minigunShot() {
        const c = throttle('minigun', 0.035);
        if(!c) return;
        const v = vary(0.07);
        noise(c, 0.035, 'highpass', 7000 * v, 2600, envelope(c, 0.3, 0.0008, 0.035, 0.12));
        metal(c, 2300 * v, 0.07, envelope(c, 0.09, 0.001, 0.07, 0.2));
        tone(c, 'sawtooth', 900 * v, 260, 0.045, envelope(c, 0.07, 0.001, 0.045));
        tone(c, 'sine', 130 * v, 42, 0.1, envelope(c, 0.36, 0.001, 0.1));
    },

    // Round striking an asteroid: soft dusty thud on the outside, sharp clink on the core.
    rockHit(hard) {
        const c = throttle('rockHit', 0.03);
        if(!c) return;
        const v = vary(0.1);
        if(hard) {
            metal(c, 1700 * v, 0.06, envelope(c, 0.06, 0.001, 0.06, 0.2));
            noise(c, 0.06, 'bandpass', 3500 * v, 1500, envelope(c, 0.14, 0.001, 0.06), 1.5);
        } else {
            noise(c, 0.12, 'lowpass', 1400 * v, 300, envelope(c, 0.2, 0.002, 0.12, 0.1));
        }
        tone(c, 'sine', 120 * v, 55, 0.08, envelope(c, 0.12, 0.001, 0.08));
    },

    // Goa'uld staff weapon: the descending electric "tsew" - a ring-modulated buzz
    // sweeping down, a crackling discharge and a deep concussion with a long tail.
    staffShot() {
        const c = throttle('staff', 0.08);
        if(!c) return;
        const v = vary(0.05);
        ringTone(c, 'sawtooth', 1900 * v, 210, 63, 0.32, envelope(c, 0.3, 0.002, 0.32, 0.5));
        sweep(c, 0.3, 5200 * v, 600, 4, envelope(c, 0.3, 0.001, 0.3, 0.45));
        noise(c, 0.18, 'highpass', 6000, 3000, envelope(c, 0.1, 0.001, 0.18, 0.3));
        tone(c, 'sine', 140 * v, 32, 0.6, envelope(c, 0.55, 0.002, 0.6, 0.4));
    },

    // Staff blast hitting: crackling plasma burst over a deep boom.
    plasmaImpact() {
        const c = throttle('plasmaImpact', 0.06);
        if(!c) return;
        boom(c, 0.65, 0.4);
        ringTone(c, 'sawtooth', 900, 120, 47, 0.35, envelope(c, 0.15, 0.002, 0.35, 0.5));
    },

    // Tau'ri missile: ignition crack, then a tearing rocket roar that climbs away.
    missileLaunch() {
        const c = throttle('missile', 0.05);
        if(!c) return;
        tone(c, 'sine', 120, 40, 0.3, envelope(c, 0.45, 0.002, 0.3, 0.25));
        noise(c, 0.05, 'highpass', 5000, 2500, envelope(c, 0.18, 0.001, 0.05));
        sweep(c, 1.1, 350, 2800, 0.9, envelope(c, 0.32, 0.04, 1.05, 0.45));
        noise(c, 0.8, 'lowpass', 1200, 200, envelope(c, 0.22, 0.02, 0.75, 0.35));
    },

    missileExplosion() {
        const c = throttle('boom', 0.05);
        if(!c) return;
        noise(c, 0.06, 'highpass', 4000, 2000, envelope(c, 0.2, 0.001, 0.06));
        boom(c, 1.1, 0.6);
    },

    // Ancient drone: a hissing whoosh with the characteristic rising whistle.
    droneLaunch() {
        const c = throttle('drones', 0.07);
        if(!c) return;
        const v = vary(0.06);
        sweep(c, 0.7, 700 * v, 3600, 3, envelope(c, 0.28, 0.02, 0.68, 0.5));
        tone(c, 'sine', 820 * v, 1750, 0.6, envelope(c, 0.09, 0.03, 0.58, 0.6));
        tone(c, 'sine', 1640 * v, 3400, 0.5, envelope(c, 0.03, 0.03, 0.48, 0.6));
    },

    // Drone detonation: a bright energy snap into a deep, rolling blast.
    droneImpact() {
        const c = throttle('droneImpact', 0.05);
        if(!c) return;
        ringTone(c, 'square', 3000, 400, 140, 0.25, envelope(c, 0.12, 0.001, 0.25, 0.6));
        boom(c, 0.95, 0.6);
        tone(c, 'sine', 2400, 700, 0.7, envelope(c, 0.07, 0.004, 0.7, 0.7));
    },

    beamImpact() {
        const c = throttle('beamImpact', 0.09);
        if(!c) return;
        noise(c, 0.1, 'bandpass', 3000, 1500, envelope(c, 0.08, 0.002, 0.1), 2);
    },

    overheat() {
        const c = throttle('overheat', 0.5);
        if(!c) return;
        tone(c, 'square', 880, 880, 0.08, envelope(c, 0.08, 0.002, 0.08));
        setTimeout(() => { if(ac) tone(ac, 'square', 660, 660, 0.12, envelope(ac, 0.08, 0.002, 0.12)); }, 120);
        noise(c, 0.7, 'highpass', 3000, 1200, envelope(c, 0.07, 0.05, 0.7, 0.3));
    },

    // Something striking raised shields: an electric zap with a resonant hum.
    shieldHit(strength) {
        const c = throttle('shield', 0.07);
        if(!c) return;
        const s = Math.max(0.3, Math.min(1.5, strength || 1));
        tone(c, 'sine', 1500, 260, 0.35, envelope(c, 0.2 * s, 0.002, 0.35, 0.4));
        tone(c, 'sawtooth', 120, 70, 0.3, envelope(c, 0.12 * s, 0.002, 0.3, 0.3));
        noise(c, 0.2, 'highpass', 5000, 2000, envelope(c, 0.08 * s, 0.001, 0.2, 0.3));
    },

    shieldUp() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        tone(c, 'sine', 160, 900, 0.55, envelope(c, 0.2, 0.02, 0.55, 0.5));
        tone(c, 'triangle', 320, 1800, 0.5, envelope(c, 0.07, 0.02, 0.5, 0.5));
    },

    shieldDown() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        tone(c, 'sine', 900, 110, 0.5, envelope(c, 0.18, 0.01, 0.5, 0.5));
        noise(c, 0.45, 'bandpass', 2000, 300, envelope(c, 0.06, 0.01, 0.45, 0.3), 2);
    },

    hullHit() {
        const c = throttle('hull', 0.1);
        if(!c) return;
        boom(c, 0.5, 0.25);
        tone(c, 'square', 90, 40, 0.25, envelope(c, 0.15, 0.002, 0.25));
    },

    rockCrack() {
        const c = throttle('crack', 0.06);
        if(!c) return;
        noise(c, 0.35, 'bandpass', 1500, 250, envelope(c, 0.4, 0.001, 0.35, 0.35), 0.8);
        tone(c, 'triangle', 200, 55, 0.3, envelope(c, 0.22, 0.001, 0.3, 0.3));
    },

    // Deep rumble as asteroids grind together and merge.
    merge(size) {
        const c = throttle('merge', 0.15);
        if(!c) return;
        const volume = Math.min(0.5, 0.15 + size / 200);
        noise(c, 1.4, 'lowpass', 400, 60, envelope(c, volume, 0.15, 1.3, 0.4));
        tone(c, 'sine', 70, 40, 1.2, envelope(c, volume * 0.6, 0.1, 1.2, 0.3));
    },

    // Asteroid glancing off the Atlantis city shield.
    cityShield(volume) {
        const c = throttle('cityShield', 0.12);
        if(!c) return;
        const v = Math.max(0.02, Math.min(0.3, volume));
        tone(c, 'sine', 700, 160, 0.7, envelope(c, v, 0.004, 0.7, 0.6));
        tone(c, 'triangle', 1400, 480, 0.45, envelope(c, v * 0.4, 0.004, 0.45, 0.6));
        noise(c, 0.3, 'highpass', 4000, 1800, envelope(c, v * 0.3, 0.002, 0.3, 0.4));
    },

    // Tractor beam latching onto a new piece of ore.
    tractorLock() {
        const c = throttle('tractorLock', 0.06);
        if(!c) return;
        tone(c, 'sine', 700, 1150, 0.14, envelope(c, 0.07, 0.005, 0.14, 0.4));
    },

    // Ore stowed in the hold: a little two-note chime, higher for valuable ore.
    pickup(value) {
        const c = throttle('pickup', 0.05);
        if(!c) return;
        const f = 620 + Math.min(600, value * 6);
        tone(c, 'triangle', f, f, 0.09, envelope(c, 0.09, 0.002, 0.09, 0.3));
        setTimeout(() => { if(ac) tone(ac, 'sine', f * 1.5, f * 1.5, 0.16, envelope(ac, 0.07, 0.002, 0.16, 0.3)); }, 60);
    },

    // Scanner sweep ping.
    scanPing() {
        const c = throttle('scan', 0.5);
        if(!c) return;
        tone(c, 'sine', 1320, 1240, 0.5, envelope(c, 0.08, 0.004, 0.5, 0.7));
        tone(c, 'sine', 660, 640, 0.6, envelope(c, 0.05, 0.004, 0.6, 0.7));
    },

    dock() {
        const c = context();
        if(!c) return;
        tone(c, 'sine', 660, 660, 0.25, envelope(c, 0.15, 0.01, 0.25, 0.4));
        setTimeout(() => { if(ac) tone(ac, 'sine', 990, 990, 0.4, envelope(ac, 0.15, 0.01, 0.4, 0.4)); }, 160);
    },

    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        beamVoice.stop();
        tractorVoice.stop();
    }
};

export default sounds;
