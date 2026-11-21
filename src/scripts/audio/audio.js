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
let drive = null;       // weapon bus -> saturation -> bass boost -> master (aggressive, heavy)
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

        // Weapon bus: soft-clipping saturation thickens and roughens everything, and a
        // low-shelf boost adds chest-thumping weight.
        const shaper = ac.createWaveShaper();
        const curve = new Float32Array(2048);
        for(let i = 0; i < curve.length; i++) {
            const x = i / (curve.length - 1) * 2 - 1;
            curve[i] = Math.tanh(x * 3.2) / Math.tanh(3.2);
        }
        shaper.curve = curve;
        shaper.oversample = '2x';
        const lowShelf = ac.createBiquadFilter();
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = 140;
        lowShelf.gain.value = 7;
        const tame = ac.createBiquadFilter();
        tame.type = 'lowpass';
        tame.frequency.value = 7000;
        drive = ac.createGain();
        drive.gain.value = 0.9;
        drive.connect(shaper);
        shaper.connect(lowShelf);
        lowShelf.connect(tame);
        tame.connect(master);

        const convolver = ac.createConvolver();
        convolver.buffer = createImpulse(ac, 2.4, 3);
        reverb = ac.createGain();
        reverb.gain.value = 0.55;
        reverb.connect(convolver);
        convolver.connect(compressor);

        noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        loadSamples(ac);
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
// Gain envelope feeding the dry bus (or the weapon `drive` bus when `driven`), plus an
// optional reverb send (`wet` 0..1).
const envelope = (c, peak, attack, decay, wet, driven) => {
    const gain = c.createGain();
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    gain.connect(driven ? drive : master);
    if(wet) {
        const send = c.createGain();
        send.gain.value = wet;
        gain.connect(send);
        send.connect(reverb);
    }
    return gain;
};

// Shorthand for weapon layers: always through the saturating drive bus.
const heavy = (c, peak, attack, decay, wet) => envelope(c, peak, attack, decay, wet, true);

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
    tone(c, 'sine', 80 + 20 / size, 24, 1.3 * size, heavy(c, 0.7, 0.003, 1.3 * size, wet));
    tone(c, 'sawtooth', 120, 32, 0.5 * size, heavy(c, 0.25, 0.002, 0.5 * size, wet * 0.5));
    noise(c, 1.5 * size, 'lowpass', 1800, 50, heavy(c, 0.6, 0.002, 1.5 * size, wet));
    noise(c, 0.35, 'bandpass', 2500, 500, envelope(c, 0.12, 0.002, 0.3, wet), 1.2);
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
    gain.connect(drive);
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

// Minigun "BRRRT": a low, distorted growl chopped at the rate of fire, layered under
// the individual rounds while the guns are firing.
const minigunVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);

    const chop = c.createGain();
    chop.gain.value = 0.5;
    chop.connect(gain);
    const rate = c.createOscillator();
    const depth = c.createGain();
    rate.type = 'square';
    rate.frequency.value = 17;
    depth.gain.value = 0.5;
    rate.connect(depth);
    depth.connect(chop.gain);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 2;
    filter.connect(chop);
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = 'sawtooth';
    b.type = 'square';
    a.frequency.value = 48;
    b.frequency.value = 97;
    a.connect(filter);
    b.connect(filter);

    const rumble = c.createBufferSource();
    rumble.buffer = noiseBuffer;
    rumble.loop = true;
    const rumbleFilter = c.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 300;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(chop);

    const nodes = [a, b, rate, rumble];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.28 };
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

// ------------------------------------------------------------ recorded samples
//
// Stargate, weapon and ship sounds from the Stargate Carter Addon Pack (CAP) resources
// (https://github.com/RafaelDeJongh/cap_resources, CC BY-NC-SA 4.0, see
// assets/sounds/cap/CREDITS.txt). They're decoded into Web Audio buffers when audio
// starts; until a sample has loaded (or if it fails to), the synthesized version plays.

const CAP = './assets/sounds/cap/';
const SAMPLE_FILES = {
    dhd_press: ['stargate/dhd/sg1/press.mp3', 'stargate/dhd/sg1/press_2.mp3', 'stargate/dhd/sg1/press_3.mp3',
        'stargate/dhd/sg1/press_4.mp3', 'stargate/dhd/sg1/press_5.mp3', 'stargate/dhd/sg1/press_6.mp3', 'stargate/dhd/sg1/press_7.mp3'],
    dhd_dome: ['stargate/stargate/dhd/dhd_usual_dial.wav'],
    dial_fail: ['stargate/dial_fail_sg1.mp3'],
    gate_spin: ['stargate/gate_roll.mp3'],
    chevron: ['stargate/sg1/chevron.mp3', 'stargate/sg1/chevron_2.mp3'],
    chevron_lock: ['stargate/sg1/lock.mp3'],
    kawoosh: ['stargate/sg1/open.mp3'],
    horizon: ['stargate/wormhole_loop.wav'],
    gate_enter: ['stargate/stargate/eh/eh_go_1.wav', 'stargate/stargate/eh/eh_go_2.wav', 'stargate/stargate/eh/eh_go_3.wav'],
    wormhole: ['stargate/gate_travel.mp3'],
    gate_close: ['stargate/gate_close.mp3'],
    hyper_window: ['tech/hyperwindow.wav'],
    railgun: ['weapons/railgun_shoot.wav'],
    staff: ['pulse_weapon/staff_weapon.mp3'],
    missile: ['f302/missilefire.wav'],
    drone: ['weapons/drone_shot.mp3'],
    asgard_beam: ['weapons/asgard_beam.wav'],
    shield_hit: ['shields/shield_hit.mp3'],
    shield_up: ['shields/shield_engage.mp3'],
    shield_down: ['shields/shield_disengage.mp3'],
    door: ['door/atlantis_door_open.wav'],
    button: ['button/ancient_button1.wav', 'button/ancient_button2.wav'],
    scan: ['glebqip/tracking.wav'],
    ship_explosion: ['jumper/jumperexplosion.mp3']
};
const LOOPING_SAMPLES = { gate_spin: true, horizon: true };
const buffers = {};
const loops = {};
let samplesRequested = false;

function loadSamples(c) {
    if(samplesRequested || !window.fetch) return;
    samplesRequested = true;
    Object.keys(SAMPLE_FILES).forEach(name => {
        buffers[name] = [];
        SAMPLE_FILES[name].forEach((file, i) => {
            window.fetch(CAP + file)
                .then(response => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(file))))
                // Callback form: older Safari has no promise-returning decodeAudioData.
                .then(data => new Promise((resolve, reject) => c.decodeAudioData(data, resolve, reject)))
                .then(buffer => { buffers[name][i] = buffer; })
                .catch(() => {});
        });
    });
}

// Play sample `name` (a random variant, or options.variant). Returns false if it isn't
// loaded yet so the caller can fall back to the synthesized sound.
//   options: { variant, rate, wet (reverb send 0..1) }
const playSample = (name, volume, options) => {
    const list = buffers[name];
    if(!ac || !list) return false;
    const opts = options || {};
    const count = SAMPLE_FILES[name].length;
    const index = opts.variant !== undefined ? Math.abs(opts.variant) % count : Math.floor(Math.random() * count);
    const buffer = list[index] || list.filter(Boolean)[0];
    if(!buffer) return false;
    const level = volume === undefined ? 0.9 : volume;

    if(LOOPING_SAMPLES[name]) {
        const playing = loops[name];
        if(playing) {
            playing.gain.gain.setTargetAtTime(level, ac.currentTime, 0.05);
            return true;
        }
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = opts.rate || 1;
    const gain = ac.createGain();
    gain.gain.value = level;
    source.connect(gain);
    gain.connect(master);
    if(opts.wet) {
        const send = ac.createGain();
        send.gain.value = opts.wet;
        gain.connect(send);
        send.connect(reverb);
    }
    if(LOOPING_SAMPLES[name]) {
        source.loop = true;
        loops[name] = { source: source, gain: gain };
    }
    source.start();
    return true;
};

const stopSample = (name) => {
    const playing = loops[name];
    if(!playing || !ac) return;
    delete loops[name];
    playing.gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.08);
    try { playing.source.stop(ac.currentTime + 0.5); } catch(e) { /* already stopped */ }
};

// Grinding rumble of the inner ring turning.
const gateSpinVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);
    const grind = c.createBufferSource();
    grind.buffer = noiseBuffer;
    grind.loop = true;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 220;
    band.Q.value = 1.5;
    grind.connect(band);
    band.connect(gain);
    const motor = c.createOscillator();
    const motorGain = c.createGain();
    motor.type = 'sawtooth';
    motor.frequency.value = 46;
    motorGain.gain.value = 0.35;
    motor.connect(motorGain);
    motorGain.connect(gain);
    const wobble = c.createOscillator();
    const wobbleGain = c.createGain();
    wobble.frequency.value = 7;
    wobbleGain.gain.value = 60;
    wobble.connect(wobbleGain);
    wobbleGain.connect(band.frequency);
    const nodes = [grind, motor, wobble];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.35 };
});

// Deep, watery hum of an open event horizon.
const horizonVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.5;
    gain.connect(send);
    send.connect(reverb);
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = 'sine';
    b.type = 'triangle';
    a.frequency.value = 62;
    b.frequency.value = 93.5;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.8;
    lfoGain.gain.value = 0.35;
    const mod = c.createGain();
    mod.gain.value = 0.65;
    lfo.connect(lfoGain);
    lfoGain.connect(mod.gain);
    a.connect(mod);
    b.connect(mod);
    mod.connect(gain);
    const water = c.createBufferSource();
    water.buffer = noiseBuffer;
    water.loop = true;
    const waterFilter = c.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 500;
    waterFilter.Q.value = 4;
    const sweep2 = c.createOscillator();
    const sweepGain = c.createGain();
    sweep2.frequency.value = 0.35;
    sweepGain.gain.value = 250;
    sweep2.connect(sweepGain);
    sweepGain.connect(waterFilter.frequency);
    const waterGain = c.createGain();
    waterGain.gain.value = 0.25;
    water.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(gain);
    const nodes = [a, b, lfo, water, sweep2];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.3 };
});

// Roaring rumble while travelling in hyperspace.
const hyperVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(drive);
    const roar = c.createBufferSource();
    roar.buffer = noiseBuffer;
    roar.loop = true;
    const low = c.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 380;
    roar.connect(low);
    low.connect(gain);
    const tone1 = c.createOscillator();
    const toneGain = c.createGain();
    tone1.type = 'sine';
    tone1.frequency.value = 55;
    toneGain.gain.value = 0.5;
    tone1.connect(toneGain);
    toneGain.connect(gain);
    const nodes = [roar, tone1];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.3 };
});

const gateSounds = {
    // DHD key: a soft electronic "bwoop", pitched by the key's position on the ring.
    dhdPress(index) {
        if(playSample('dhd_press', 0.8, { variant: index })) return;
        const c = context();
        if(!c) return;
        const f = 520 + (index % 13) * 22;
        tone(c, 'sine', f * 1.25, f, 0.18, envelope(c, 0.16, 0.004, 0.18, 0.3));
        tone(c, 'triangle', f * 0.5, f * 0.48, 0.12, envelope(c, 0.08, 0.002, 0.12, 0.2));
        noise(c, 0.02, 'highpass', 5000, 4000, envelope(c, 0.05, 0.001, 0.02));
    },

    // Pressing the big dome: a heavy, rising activation tone.
    dhdDome() {
        if(playSample('dhd_dome', 0.9)) return;
        const c = context();
        if(!c) return;
        tone(c, 'sine', 140, 320, 0.5, heavy(c, 0.4, 0.01, 0.5, 0.5));
        tone(c, 'triangle', 560, 880, 0.4, envelope(c, 0.08, 0.01, 0.4, 0.5));
        noise(c, 0.08, 'lowpass', 1200, 300, heavy(c, 0.25, 0.001, 0.08));
    },

    dialFail() {
        if(playSample('dial_fail', 0.9)) return;
        const c = context();
        if(!c) return;
        tone(c, 'square', 160, 150, 0.45, heavy(c, 0.18, 0.005, 0.45, 0.3));
        tone(c, 'square', 113, 110, 0.45, heavy(c, 0.14, 0.005, 0.45, 0.3));
    },

    gateSpin(on) {
        if(!on) {
            stopSample('gate_spin');
            gateSpinVoice.stop();
            return;
        }
        if(!playSample('gate_spin', 0.7)) gateSpinVoice.start();
    },

    // Chevron locking: a heavy mechanical "ka-chunk" with a resonant metal clang.
    chevronLock(final) {
        if(playSample(final ? 'chevron_lock' : 'chevron', final ? 1 : 0.85, { wet: 0.15 })) return;
        const c = context();
        if(!c) return;
        noise(c, 0.08, 'lowpass', 2500, 400, heavy(c, 0.5, 0.001, 0.08, 0.3));
        tone(c, 'sine', 120, 45, 0.35, heavy(c, 0.7, 0.002, 0.35, 0.4));
        [310, 467, 692, 1010].forEach((f, i) => {
            tone(c, 'sine', f, f * 0.995, 0.9 - i * 0.15, envelope(c, 0.06 / (i + 1), 0.003, 0.9 - i * 0.15, 0.6));
        });
        setTimeout(() => {
            if(!ac) return;
            noise(ac, 0.06, 'lowpass', 1800, 300, heavy(ac, 0.35, 0.001, 0.06, 0.3));
            tone(ac, 'sine', 95, 40, 0.25, heavy(ac, 0.5, 0.002, 0.25, 0.3));
        }, 140);
        if(final) tone(c, 'sine', 70, 35, 0.9, heavy(c, 0.6, 0.01, 0.9, 0.6));
    },

    // The kawoosh: a huge rushing surge that splashes out and is sucked back in.
    kawoosh() {
        if(playSample('kawoosh', 1, { wet: 0.2 })) return;
        const c = context();
        if(!c) return;
        sweep(c, 1.4, 150, 2200, 1.2, heavy(c, 0.55, 0.12, 1.3, 0.7));
        noise(c, 1.6, 'lowpass', 900, 120, heavy(c, 0.5, 0.25, 1.4, 0.7));
        tone(c, 'sine', 55, 30, 1.5, heavy(c, 0.7, 0.2, 1.4, 0.6));
        for(let i = 0; i < 14; i++) {
            setTimeout(() => {
                if(!ac) return;
                const f = 200 + Math.random() * 700;
                tone(ac, 'sine', f, f * (0.4 + Math.random() * 0.4), 0.12, envelope(ac, 0.05, 0.005, 0.12, 0.6));
            }, 300 + i * 55);
        }
    },

    horizon(on) {
        if(!on) {
            stopSample('horizon');
            horizonVoice.stop();
            return;
        }
        if(!playSample('horizon', 0.6)) horizonVoice.start();
    },

    // Riding the wormhole: a long, roaring, flanging rush.
    wormhole() {
        const entered = playSample('gate_enter', 0.9);
        if(playSample('wormhole', 1) || entered) return;
        const c = context();
        if(!c) return;
        sweep(c, 3.4, 300, 2600, 1.5, heavy(c, 0.45, 0.3, 3.1, 0.6));
        sweep(c, 3.4, 2400, 400, 2, envelope(c, 0.18, 0.4, 3, 0.6));
        noise(c, 3.4, 'lowpass', 600, 150, heavy(c, 0.45, 0.2, 3.2, 0.5));
        tone(c, 'sine', 48, 70, 3.2, heavy(c, 0.5, 0.3, 3, 0.4));
    },

    gateClose() {
        if(playSample('gate_close', 0.9)) return;
        const c = context();
        if(!c) return;
        sweep(c, 0.8, 1800, 200, 2, envelope(c, 0.25, 0.01, 0.8, 0.6));
        tone(c, 'sine', 180, 40, 0.7, heavy(c, 0.35, 0.005, 0.7, 0.5));
    },

    // Hyperspace window opening: a deep "whoomph" and a swirling rising rush.
    hyperOpen() {
        if(playSample('hyper_window', 1, { wet: 0.2 })) return;
        const c = context();
        if(!c) return;
        tone(c, 'sine', 70, 28, 1.2, heavy(c, 0.8, 0.01, 1.2, 0.6));
        sweep(c, 1.5, 200, 3000, 1.3, heavy(c, 0.45, 0.2, 1.3, 0.7));
        ringTone(c, 'sawtooth', 120, 600, 40, 1.2, heavy(c, 0.18, 0.2, 1, 0.6));
    },

    hyperTravel(on) {
        if(!on) {
            hyperVoice.stop();
            return;
        }
        hyperVoice.start();
    },

    hyperExit() {
        if(playSample('hyper_window', 1, { rate: 1.08, wet: 0.2 })) return;
        const c = context();
        if(!c) return;
        noise(c, 0.1, 'lowpass', 3000, 800, heavy(c, 0.4, 0.001, 0.1));
        tone(c, 'sine', 90, 30, 1, heavy(c, 0.7, 0.005, 1, 0.6));
        sweep(c, 1, 2500, 250, 1.5, heavy(c, 0.3, 0.01, 1, 0.6));
    }
};

let beamOn = false;

const sounds = {
    // Must be called from a user gesture (e.g. the launch click) so audio can start.
    unlock() {
        const c = context();
        if(c && c.state === 'suspended') c.resume();
    },

    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    // Minigun growl underneath the per-round shots.
    setFiring(on) { if(on) minigunVoice.start(); else minigunVoice.stop(); },
    setBeam(on) {
        if(on && !beamOn) sounds.beamCharge();
        beamOn = on;
        if(on) beamVoice.start(); else beamVoice.stop();
    },

    // Asgard ion cannon spinning up as the beam fires: a fast, distorted rising roar.
    beamCharge() {
        const c = throttle('beamCharge', 0.2);
        if(!c) return;
        if(playSample('asgard_beam', 0.85, { wet: 0.2 })) return;
        ringTone(c, 'sawtooth', 90, 600, 60, 0.22, heavy(c, 0.35, 0.01, 0.22, 0.4));
        tone(c, 'sine', 70, 38, 0.5, heavy(c, 0.7, 0.002, 0.5, 0.4));
        noise(c, 0.15, 'lowpass', 3000, 600, heavy(c, 0.25, 0.001, 0.15, 0.3));
    },
    // `level` 0..1 grows with the number of ore pieces held.
    setTractor(on, level) { if(on) tractorVoice.start(0.5 + 0.5 * (level || 0)); else tractorVoice.stop(); },

    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },
    // The player's ship blowing up.
    shipExplosion() {
        if(!playSample('ship_explosion', 1, { wet: 0.3 })) sounds.explosion(1);
    },
    // Console button (stabilizer and other toggles).
    toggle(on) {
        if(playSample('button', 0.6, { variant: on ? 0 : 1 })) return;
        const c = context();
        if(c) tone(c, 'sine', on ? 700 : 500, on ? 900 : 380, 0.12, envelope(c, 0.08, 0.003, 0.12));
    },

    // Heavy minigun round: a deep chest-punch thump, a gritty saturated body and a
    // low-mid crack (no thin high tones), randomised so the stream sounds like a growl.
    minigunShot() {
        const c = throttle('minigun', 0.035);
        if(!c) return;
        const v = vary(0.08);
        // Recorded railgun round with a sub-bass thump underneath for weight.
        if(playSample('railgun', 0.5, { rate: vary(0.06) })) {
            tone(c, 'sine', 95 * v, 34, 0.13, heavy(c, 0.45, 0.001, 0.13, 0.12));
            return;
        }
        tone(c, 'sine', 95 * v, 34, 0.13, heavy(c, 0.75, 0.001, 0.13, 0.12));
        tone(c, 'sawtooth', 170 * v, 55, 0.07, heavy(c, 0.32, 0.001, 0.07, 0.1));
        noise(c, 0.06, 'lowpass', 3200 * v, 500, heavy(c, 0.45, 0.0008, 0.06, 0.15));
        noise(c, 0.03, 'bandpass', 1400 * v, 700, heavy(c, 0.2, 0.0005, 0.03), 1.4);
    },

    // Round striking an asteroid: dull dusty thud on the outside, harder crunch on the core.
    rockHit(hard) {
        const c = throttle('rockHit', 0.03);
        if(!c) return;
        const v = vary(0.1);
        tone(c, 'sine', 110 * v, 40, 0.1, heavy(c, 0.3, 0.001, 0.1));
        if(hard) noise(c, 0.08, 'bandpass', 2200 * v, 900, heavy(c, 0.18, 0.001, 0.08, 0.15), 1.2);
        else noise(c, 0.14, 'lowpass', 1000 * v, 200, heavy(c, 0.25, 0.002, 0.14, 0.1));
    },

    // Goa'uld staff weapon: a snarling, distorted "tsew" sweeping down into a deep
    // concussion, with crackling plasma and a long rolling tail.
    staffShot() {
        const c = throttle('staff', 0.08);
        if(!c) return;
        const v = vary(0.05);
        if(playSample('staff', 0.85, { rate: vary(0.04), wet: 0.25 })) {
            tone(c, 'sine', 120 * v, 28, 0.6, heavy(c, 0.5, 0.002, 0.6, 0.3));
            return;
        }
        ringTone(c, 'sawtooth', 1100 * v, 120, 58, 0.36, heavy(c, 0.38, 0.002, 0.36, 0.5));
        sweep(c, 0.32, 3200 * v, 300, 3, heavy(c, 0.35, 0.001, 0.32, 0.45));
        tone(c, 'sine', 120 * v, 28, 0.7, heavy(c, 0.8, 0.002, 0.7, 0.4));
        tone(c, 'square', 70 * v, 30, 0.3, heavy(c, 0.2, 0.002, 0.3, 0.3));
        noise(c, 0.2, 'highpass', 4000, 2000, envelope(c, 0.06, 0.001, 0.2, 0.3));
    },

    // Staff blast hitting: a crackling, distorted plasma burst over a deep boom.
    plasmaImpact() {
        const c = throttle('plasmaImpact', 0.06);
        if(!c) return;
        boom(c, 0.75, 0.45);
        ringTone(c, 'sawtooth', 600, 70, 45, 0.4, heavy(c, 0.22, 0.002, 0.4, 0.5));
    },

    // Tau'ri missile: a hard ignition punch, then a roaring, distorted rocket that climbs away.
    missileLaunch() {
        const c = throttle('missile', 0.05);
        if(!c) return;
        if(playSample('missile', 0.9, { rate: vary(0.04), wet: 0.2 })) return;
        tone(c, 'sine', 100, 30, 0.4, heavy(c, 0.7, 0.002, 0.4, 0.3));
        noise(c, 0.06, 'lowpass', 3000, 800, heavy(c, 0.3, 0.001, 0.06));
        sweep(c, 1.2, 250, 1600, 0.8, heavy(c, 0.4, 0.04, 1.15, 0.45));
        noise(c, 1, 'lowpass', 700, 120, heavy(c, 0.35, 0.02, 0.95, 0.4));
    },

    missileExplosion() {
        const c = throttle('boom', 0.05);
        if(!c) return;
        noise(c, 0.08, 'lowpass', 3000, 900, heavy(c, 0.35, 0.001, 0.08));
        boom(c, 1.2, 0.6);
    },

    // Ancient drone: a deep, menacing rush of air with a low hum and a growling whistle,
    // rather than a thin high whine.
    droneLaunch() {
        const c = throttle('drones', 0.07);
        if(!c) return;
        const v = vary(0.06);
        if(playSample('drone', 0.75, { rate: v, wet: 0.25 })) return;
        sweep(c, 0.75, 250 * v, 1400, 2.2, heavy(c, 0.45, 0.02, 0.72, 0.5));
        tone(c, 'sawtooth', 110 * v, 220, 0.6, heavy(c, 0.22, 0.03, 0.58, 0.5));
        tone(c, 'sine', 380 * v, 720, 0.55, heavy(c, 0.12, 0.03, 0.52, 0.6));
        tone(c, 'sine', 70 * v, 45, 0.5, heavy(c, 0.5, 0.01, 0.5, 0.3));
    },

    // Drone detonation: a hard energy crack into a deep, rolling, distorted blast.
    droneImpact() {
        const c = throttle('droneImpact', 0.05);
        if(!c) return;
        ringTone(c, 'sawtooth', 900, 90, 70, 0.3, heavy(c, 0.3, 0.001, 0.3, 0.6));
        boom(c, 1.05, 0.6);
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
        if(playSample('shield_hit', 0.35 + 0.35 * Math.min(1, s), { rate: vary(0.05) })) return;
        tone(c, 'sine', 1500, 260, 0.35, envelope(c, 0.2 * s, 0.002, 0.35, 0.4));
        tone(c, 'sawtooth', 120, 70, 0.3, envelope(c, 0.12 * s, 0.002, 0.3, 0.3));
        noise(c, 0.2, 'highpass', 5000, 2000, envelope(c, 0.08 * s, 0.001, 0.2, 0.3));
    },

    shieldUp() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        if(playSample('shield_up', 0.8)) return;
        tone(c, 'sine', 160, 900, 0.55, envelope(c, 0.2, 0.02, 0.55, 0.5));
        tone(c, 'triangle', 320, 1800, 0.5, envelope(c, 0.07, 0.02, 0.5, 0.5));
    },

    shieldDown() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        if(playSample('shield_down', 0.8)) return;
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
        if(playSample('scan', 0.35)) return;
        tone(c, 'sine', 1320, 1240, 0.5, envelope(c, 0.08, 0.004, 0.5, 0.7));
        tone(c, 'sine', 660, 640, 0.6, envelope(c, 0.05, 0.004, 0.6, 0.7));
    },

    dock() {
        const c = context();
        if(!c) return;
        if(playSample('door', 0.8)) return;
        tone(c, 'sine', 660, 660, 0.25, envelope(c, 0.15, 0.01, 0.25, 0.4));
        setTimeout(() => { if(ac) tone(ac, 'sine', 990, 990, 0.4, envelope(ac, 0.15, 0.01, 0.4, 0.4)); }, 160);
    },

    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        beamVoice.stop();
        tractorVoice.stop();
        minigunVoice.stop();
        gateSpinVoice.stop();
        horizonVoice.stop();
        hyperVoice.stop();
        Object.keys(loops).forEach(stopSample);
    }
};

Object.assign(sounds, gateSounds);

export default sounds;
