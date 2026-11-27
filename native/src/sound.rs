//! Sounds: the Stargate Carter Addon Pack sounds (CC BY-NC-SA 4.0, see
//! assets/sounds/CREDITS.txt), embedded into the executable.

use bevy::audio::{PlaybackMode, Volume};
use bevy::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;

macro_rules! sound {
    ($path:literal) => {
        include_bytes!(concat!("../assets/sounds/", $path)) as &'static [u8]
    };
}

/// Sound name -> variants.
fn library() -> Vec<(&'static str, Vec<&'static [u8]>)> {
    vec![
        ("dhd_press", vec![sound!("stargate/dhd/sg1/press.mp3"), sound!("stargate/dhd/sg1/press_2.mp3"), sound!("stargate/dhd/sg1/press_3.mp3"),
            sound!("stargate/dhd/sg1/press_4.mp3"), sound!("stargate/dhd/sg1/press_5.mp3"), sound!("stargate/dhd/sg1/press_6.mp3"), sound!("stargate/dhd/sg1/press_7.mp3")]),
        ("dhd_dome", vec![sound!("stargate/stargate/dhd/dhd_usual_dial.mp3")]),
        ("dial_fail", vec![sound!("stargate/dial_fail_sg1.mp3")]),
        ("gate_spin", vec![sound!("alexalx/stargate/gate_roll_long.mp3")]),
        ("chevron", vec![sound!("stargate/chevron_dhd.mp3")]),
        ("chevron_lock", vec![sound!("stargate/chevron_lock.mp3")]),
        ("kawoosh", vec![sound!("stargate/sg1/open.mp3")]),
        ("horizon", vec![sound!("stargate/wormhole_loop.wav")]),
        ("gate_enter", vec![sound!("stargate/teleport.mp3"), sound!("stargate/teleport_2.mp3"), sound!("stargate/teleport_3.mp3"), sound!("stargate/teleport_4.mp3")]),
        ("wormhole", vec![sound!("stargate/gate_travel.mp3")]),
        ("gate_close", vec![sound!("stargate/gate_close.mp3")]),
        ("hyper_window", vec![sound!("tech/hyperwindow.mp3")]),
        ("railgun", vec![sound!("weapons/railgun_shoot.wav")]),
        ("staff", vec![sound!("pulse_weapon/staff_weapon.mp3")]),
        ("missile", vec![sound!("f302/missilefire.mp3")]),
        ("drone", vec![sound!("weapons/drone_shot.mp3")]),
        ("asgard_beam", vec![sound!("weapons/asgard_beam.mp3")]),
        ("shield_hit", vec![sound!("shields/shield_hit.mp3")]),
        ("shield_hit_heavy", vec![sound!("stargate/shield/hit.mp3"), sound!("stargate/shield/hit_2.mp3")]),
        ("shield_up", vec![sound!("shields/shield_engage.mp3")]),
        ("shield_down", vec![sound!("shields/shield_disengage.mp3")]),
        ("door", vec![sound!("door/atlantis_door_open.mp3")]),
        ("button", vec![sound!("button/ancient_button1.wav"), sound!("button/ancient_button2.wav")]),
        ("scan", vec![sound!("glebqip/tracking.wav")]),
        ("ship_explosion", vec![sound!("jumper/jumperexplosion.mp3")]),
        ("explosion", vec![sound!("explosion2.mp3")]),
        ("engine", vec![sound!("engine.mp3")]),
        ("thrust", vec![sound!("thrust.mp3")]),
    ]
}

#[derive(Resource, Default)]
pub struct Sounds {
    clips: HashMap<&'static str, Vec<Handle<AudioSource>>>,
    last: HashMap<&'static str, f32>,
    pub requests: Vec<(&'static str, f32, f32)>,
}

impl Sounds {
    /// Queue a one-shot sound: name, volume (0..1), playback speed.
    pub fn play(&mut self, name: &'static str, volume: f32, speed: f32) {
        self.requests.push((name, volume, speed));
    }

    /// Like `play`, but at most once per `gap` seconds (rapid fire, impacts).
    pub fn play_limited(&mut self, name: &'static str, volume: f32, speed: f32, gap: f32, now: f32) {
        let last = self.last.get(name).copied().unwrap_or(-100.0);
        if now - last < gap {
            return;
        }
        self.last.insert(name, now);
        self.play(name, volume, speed);
    }

    pub fn clip(&self, name: &str) -> Option<Handle<AudioSource>> {
        let list = self.clips.get(name)?;
        if list.is_empty() {
            return None;
        }
        Some(list[rand::random::<usize>() % list.len()].clone())
    }
}

/// Looping sounds (engine, thrusters, gate ring, event horizon) switched on and off by name.
#[derive(Component)]
pub struct Loop(pub &'static str);

#[derive(Resource, Default)]
pub struct Loops {
    pub wanted: HashMap<&'static str, f32>,
}

impl Loops {
    pub fn set(&mut self, name: &'static str, volume: f32) {
        if volume > 0.0 {
            self.wanted.insert(name, volume);
        } else {
            self.wanted.remove(name);
        }
    }
    pub fn clear(&mut self) {
        self.wanted.clear();
    }
}

pub fn setup_sounds(mut sounds: ResMut<Sounds>, mut sources: ResMut<Assets<AudioSource>>) {
    for (name, variants) in library() {
        let handles = variants.into_iter().map(|bytes| sources.add(AudioSource { bytes: Arc::from(bytes) })).collect();
        sounds.clips.insert(name, handles);
    }
}

pub fn play_sounds(mut commands: Commands, mut sounds: ResMut<Sounds>) {
    let requests: Vec<_> = sounds.requests.drain(..).collect();
    for (name, volume, speed) in requests.into_iter().take(24) {
        if let Some(handle) = sounds.clip(name) {
            commands.spawn((
                AudioPlayer::new(handle),
                PlaybackSettings { mode: PlaybackMode::Despawn, volume: Volume::Linear(volume), speed, ..default() },
            ));
        }
    }
}

pub fn update_loops(mut commands: Commands, sounds: Res<Sounds>, loops: Res<Loops>, mut playing: Query<(Entity, &Loop, Option<&mut AudioSink>)>) {
    let mut have: HashMap<&'static str, bool> = HashMap::new();
    for (entity, l, sink) in &mut playing {
        match loops.wanted.get(l.0) {
            Some(volume) => {
                have.insert(l.0, true);
                if let Some(mut sink) = sink {
                    sink.set_volume(Volume::Linear(*volume));
                }
            }
            None => commands.entity(entity).despawn(),
        }
    }
    for (name, volume) in &loops.wanted {
        if have.contains_key(name) {
            continue;
        }
        if let Some(handle) = sounds.clip(name) {
            commands.spawn((AudioPlayer::new(handle), PlaybackSettings { mode: PlaybackMode::Loop, volume: Volume::Linear(*volume), ..default() }, Loop(name)));
        }
    }
}
