// All game sounds live here so they are created and wired up exactly once.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.6);
const minigunSound = createLoop('./assets/sounds/minigun.mp3', 0.5);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.2);

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
    audio.volume = volume;
    audio.currentTime = 0;
    safePlay(audio);
};

// Short synthesized blip for ore pickups (no extra asset needed).
let audioContext = null;
let lastBlip = 0;
const blip = (frequency) => {
    try {
        if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        if(now - lastBlip < 0.04) return;
        lastBlip = now;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, now);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.6, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    } catch(e) {
        // Web Audio unavailable: stay silent.
    }
};

const sounds = {
    pickup(value) { blip(500 + Math.min(700, value * 8)); },
    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    setFiring(on) { setLooping(minigunSound, on); },
    rockHit() { playOneShot(rockHitSound, 0.5); },
    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },
    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        setLooping(minigunSound, false);
    }
};

export default sounds;
