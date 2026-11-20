// All game sounds. The engine, thruster and minigun loops use the recorded samples;
// everything else is synthesized with the Web Audio API so each weapon has its own voice.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.5);
const minigunSound = createLoop('./assets/sounds/minigun.mp3', 0.45);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.18);

const rockHitSound = new Audio('./assets/sounds/explosion1.mp3');
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

// ------------------------------------------------------------ Web Audio synth

let ac = null;
let master = null;
let noiseBuffer = null;
const lastPlayed = {};

const context = () => {
    if(ac) return ac;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = 0.55;
        master.connect(ac.destination);

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

const envelope = (c, peak, attack, decay) => {
    const gain = c.createGain();
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    gain.connect(master);
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

// Continuous Asgard beam hum (two detuned saws through a sweeping band-pass).
let beamVoice = null;
const startBeam = () => {
    const c = context();
    if(!c || beamVoice) return;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, c.currentTime + 0.08);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 3;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 9;
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = 'sawtooth';
    b.type = 'sawtooth';
    a.frequency.value = 220;
    b.frequency.value = 223.5;
    a.connect(filter);
    b.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    [a, b, lfo].forEach(o => o.start());
    beamVoice = { gain: gain, oscillators: [a, b, lfo] };
};

const stopBeam = () => {
    if(!beamVoice || !ac) return;
    const voice = beamVoice;
    beamVoice = null;
    const now = ac.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    voice.oscillators.forEach(o => o.stop(now + 0.2));
};

const sounds = {
    // Must be called from a user gesture (e.g. the launch click) so audio can start.
    unlock() {
        const c = context();
        if(c && c.state === 'suspended') c.resume();
    },

    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    setFiring(on) { setLooping(minigunSound, on); },
    setBeam(on) { if(on) startBeam(); else stopBeam(); },

    rockHit() { playOneShot(rockHitSound, 0.35); },
    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },

    staffShot() {
        const c = throttle('staff', 0.05);
        if(!c) return;
        tone(c, 'sawtooth', 900, 140, 0.25, envelope(c, 0.22, 0.005, 0.25));
        tone(c, 'square', 1400, 300, 0.12, envelope(c, 0.06, 0.002, 0.12));
        noise(c, 0.2, 'bandpass', 3000, 600, envelope(c, 0.12, 0.002, 0.18), 2);
    },

    plasmaImpact() {
        const c = throttle('plasmaImpact', 0.05);
        if(!c) return;
        noise(c, 0.35, 'lowpass', 2500, 200, envelope(c, 0.3, 0.005, 0.35));
        tone(c, 'sine', 300, 60, 0.3, envelope(c, 0.2, 0.005, 0.3));
    },

    missileLaunch() {
        const c = throttle('missile', 0.05);
        if(!c) return;
        noise(c, 0.6, 'bandpass', 600, 2500, envelope(c, 0.25, 0.02, 0.6), 1.5);
        tone(c, 'triangle', 120, 60, 0.4, envelope(c, 0.15, 0.005, 0.35));
    },

    droneLaunch() {
        const c = throttle('drones', 0.1);
        if(!c) return;
        // Rising, shimmering Ancient whine.
        tone(c, 'sine', 320, 1500, 0.7, envelope(c, 0.16, 0.05, 0.7));
        tone(c, 'sine', 480, 2200, 0.7, envelope(c, 0.08, 0.05, 0.7));
        tone(c, 'triangle', 640, 900, 0.5, envelope(c, 0.05, 0.1, 0.5));
    },

    droneImpact() {
        const c = throttle('droneImpact', 0.04);
        if(!c) return;
        tone(c, 'sine', 1800, 200, 0.2, envelope(c, 0.12, 0.002, 0.2));
        noise(c, 0.25, 'highpass', 2000, 500, envelope(c, 0.12, 0.002, 0.22));
    },

    missileExplosion() {
        const c = throttle('boom', 0.05);
        if(!c) return;
        noise(c, 0.9, 'lowpass', 1800, 80, envelope(c, 0.45, 0.005, 0.9));
        tone(c, 'sine', 120, 35, 0.7, envelope(c, 0.35, 0.005, 0.7));
    },

    beamImpact() {
        const c = throttle('beamImpact', 0.09);
        if(!c) return;
        noise(c, 0.08, 'highpass', 4000, 2500, envelope(c, 0.06, 0.002, 0.08));
    },

    overheat() {
        const c = throttle('overheat', 0.5);
        if(!c) return;
        tone(c, 'square', 880, 880, 0.08, envelope(c, 0.08, 0.002, 0.08));
        setTimeout(() => { if(ac) tone(ac, 'square', 660, 660, 0.12, envelope(ac, 0.08, 0.002, 0.12)); }, 120);
        noise(c, 0.6, 'highpass', 3000, 1500, envelope(c, 0.05, 0.05, 0.6));
    },

    shieldHit() {
        const c = throttle('shield', 0.08);
        if(!c) return;
        tone(c, 'sine', 1600, 300, 0.3, envelope(c, 0.2, 0.002, 0.3));
        tone(c, 'triangle', 2400, 600, 0.2, envelope(c, 0.08, 0.002, 0.2));
    },

    hullHit() {
        const c = throttle('hull', 0.1);
        if(!c) return;
        noise(c, 0.4, 'lowpass', 900, 100, envelope(c, 0.4, 0.002, 0.4));
        tone(c, 'square', 90, 40, 0.25, envelope(c, 0.15, 0.002, 0.25));
    },

    rockCrack() {
        const c = throttle('crack', 0.06);
        if(!c) return;
        noise(c, 0.25, 'bandpass', 1500, 300, envelope(c, 0.35, 0.001, 0.25), 0.8);
        tone(c, 'triangle', 200, 70, 0.2, envelope(c, 0.15, 0.001, 0.2));
    },

    // Deep rumble as asteroids grind together and merge.
    merge(size) {
        const c = throttle('merge', 0.15);
        if(!c) return;
        const volume = Math.min(0.5, 0.15 + size / 200);
        noise(c, 1.4, 'lowpass', 400, 60, envelope(c, volume, 0.15, 1.3));
        tone(c, 'sine', 70, 40, 1.2, envelope(c, volume * 0.6, 0.1, 1.2));
    },

    pickup(value) {
        const c = throttle('pickup', 0.04);
        if(!c) return;
        const f = 500 + Math.min(700, value * 8);
        tone(c, 'triangle', f, f * 1.6, 0.1, envelope(c, 0.08, 0.002, 0.12));
    },

    dock() {
        const c = context();
        if(!c) return;
        tone(c, 'sine', 660, 660, 0.25, envelope(c, 0.15, 0.01, 0.25));
        setTimeout(() => { if(ac) tone(ac, 'sine', 990, 990, 0.4, envelope(ac, 0.15, 0.01, 0.4)); }, 160);
    },

    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        setLooping(minigunSound, false);
        stopBeam();
    }
};

export default sounds;
