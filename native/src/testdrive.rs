//! Scripted self-test: with `SAG_TEST=<folder>` set, the game drives itself through the
//! menu, flight, combat, the Stargate and the shipyard, saving screenshots to the folder,
//! then quits. Used to check builds on machines without a person at the controls.

use crate::sim::*;
use crate::sound::Sounds;
use crate::ui::{Action, Pending};
use crate::Screen;
use bevy::prelude::*;
use bevy::render::view::screenshot::{save_to_disk, Screenshot};

#[derive(Resource, Default)]
pub struct TestInput {
    pub cursor: Option<Vec2>,
    pub thrust: f32,
    pub fire: bool,
    pub missiles: bool,
}

#[derive(Default)]
pub struct Script {
    dir: Option<String>,
    checked: bool,
    step: usize,
    clock: f32,
    dial_shot: bool,
}

/// Parks a ship with no pilot and lowered shields, for the model parade screenshots.
fn park(sim: &mut Sim, hull: &str, pos: Vec3, facing: Vec3) {
    sim.next_id += 1;
    let mut ship = Ship::new(sim.next_id, crate::data::ship_stats(hull, &Default::default()), Side::Enemy);
    ship.pos = pos;
    ship.rot = Quat::from_rotation_arc(Vec3::X, facing.normalize());
    ship.shields_enabled = false;
    sim.ships.push(ship);
}

#[allow(clippy::too_many_arguments)]
pub fn drive(
    mut commands: Commands,
    mut script: Local<Script>,
    time: Res<Time>,
    mut input: Option<ResMut<TestInput>>,
    mut sim: ResMut<Sim>,
    mut sounds: ResMut<Sounds>,
    mut pending: ResMut<Pending>,
    mut next: ResMut<NextState<Screen>>,
    mut exit: EventWriter<AppExit>,
    window: Query<&Window>,
    mut profile: ResMut<crate::profile::Profile>,
    mut rig: ResMut<crate::visuals::CameraRig>,
) {
    if !script.checked {
        script.checked = true;
        script.dir = std::env::var("SAG_TEST").ok();
        commands.insert_resource(TestInput::default());
        return;
    }
    let Some(dir) = script.dir.clone() else { return };
    let Some(input) = input.as_mut() else { return };
    script.clock += time.delta_secs();
    let shot = |commands: &mut Commands, name: &str| {
        let path = format!("{}/{}.png", dir, name);
        info!("screenshot {}", path);
        commands.spawn(Screenshot::primary_window()).observe(save_to_disk(path));
    };
    let center = window.iter().next().map(|w| Vec2::new(w.width() / 2.0, w.height() / 2.0)).unwrap_or(Vec2::new(800.0, 450.0));
    // (time to wait before this step, action)
    let wait = [3.0, 1.0, 5.0, 4.0, 5.0, 2.0, 2.0, 1.0, 1.5, 3.0, 3.0, 3.0, 2.0, 5.0, 4.0, 1.0, 4.0, 1.0, 4.0, 1.0, 3.0, 4.0, 2.0];
    // Mid-dial close-up: the glyph ring turning and the first chevrons lit.
    if script.step == 6 && !script.dial_shot && sim.gate.locked >= 4 {
        script.dial_shot = true;
        shot(&mut commands, "04a-dialing");
    }
    if script.step >= wait.len() || script.clock < wait[script.step] {
        return;
    }
    // Some steps wait for the game to get there (software rendering is slow).
    let ready = match script.step {
        6 => sim.gate.state == GateState::Open,
        9 => sim.system != "lantea" && sim.transition.is_none(),
        _ => true,
    };
    if !ready && script.clock < 90.0 {
        return;
    }
    script.clock = 0.0;
    match script.step {
        0 => shot(&mut commands, "01-menu"),
        1 => pending.0.push(Action::Launch),
        2 => {
            shot(&mut commands, "02-flight");
            input.cursor = Some(center + Vec2::new(0.0, 40.0));
            input.thrust = 1.0;
        }
        3 => {
            input.thrust = 0.0;
            input.cursor = Some(center);
            sim.spawn_enemy(Some("glider"), Some(2), true, &mut sounds);
            input.fire = true;
            input.missiles = true;
        }
        4 => shot(&mut commands, "03-combat"),
        5 => {
            input.fire = false;
            input.missiles = false;
            sim.ships.truncate(1);
            let g = sim.gate.pos;
            let p = sim.player_mut();
            p.pos = g + Vec3::new(0.0, 0.0, -420.0);
            p.vel = Vec3::ZERO;
            p.rot = Quat::from_rotation_arc(Vec3::X, Vec3::Z);
            sim.dial("abydos");
        }
        6 => shot(&mut commands, "04-gate-open"),
        7 => {
            let g = sim.gate.pos;
            let p = sim.player_mut();
            p.pos = g + Vec3::new(0.0, 0.0, -30.0);
            p.vel = Vec3::Z * 200.0;
        }
        8 => shot(&mut commands, "05-wormhole"),
        9 => shot(&mut commands, "06-arrival"),
        10 => next.set(Screen::Docked),
        11 => shot(&mut commands, "07-shipyard"),
        12 => {
            // A fully fitted capital ship against a Ha'tak: shields, drones, missiles, beams.
            let mut fits = std::collections::HashMap::new();
            let kinds = ["beam", "drones", "missile", "shield", "minigun", "guidance", "shield", "staff", "missile", "engine"];
            for (i, slot) in crate::data::data().hull("asgard").slots.iter().enumerate() {
                fits.insert(slot.id.clone(), crate::profile::Fit { kind: kinds[i % kinds.len()].into(), level: 3 });
            }
            profile.loadouts.insert("asgard".into(), fits);
            profile.owned_hulls.push("asgard".into());
            profile.hull = "asgard".into();
            pending.0.push(Action::Undock);
        }
        13 => {
            sim.spawn_enemy(Some("hatak"), Some(3), true, &mut sounds);
            sim.spawn_enemy(Some("glider"), Some(2), true, &mut sounds);
            input.cursor = Some(center);
            input.fire = true;
            input.missiles = true;
        }
        14 => shot(&mut commands, "08-capital-combat"),
        15 => {
            // Model parade, fighters: in a row ahead, seen from the side and a little ahead.
            input.fire = false;
            input.missiles = false;
            sim.ships.truncate(1);
            let g = sim.gate.pos;
            let base = g + Vec3::new(0.0, 250.0, -900.0);
            let p = sim.player_mut();
            p.pos = base;
            p.vel = Vec3::ZERO;
            p.rot = Quat::IDENTITY;
            p.hidden = true;
            p.auto_target = false;
            rig.zoom = 0.3;
            for (i, hull) in ["x302", "glider", "jumper", "alkesh"].iter().enumerate() {
                park(&mut sim, hull, base + Vec3::new(300.0, 0.0, -195.0 + i as f32 * 130.0), Vec3::new(-0.35, 0.0, 1.0));
            }
        }
        16 => shot(&mut commands, "11-fighters"),
        17 => {
            // Capital ships, further out.
            sim.ships.truncate(1);
            rig.zoom = 0.55;
            let base = sim.player().pos;
            for (i, hull) in ["x303", "x304", "hatak"].iter().enumerate() {
                park(&mut sim, hull, base + Vec3::new(1250.0, 0.0, -560.0 + i as f32 * 560.0), Vec3::new(-0.35, 0.0, 1.0));
            }
        }
        18 => shot(&mut commands, "12-capitals"),
        19 => {
            sim.ships.truncate(1);
            sim.player_mut().hidden = false;
            sim.start_hyperjump("earth", &mut sounds);
        }
        20 => shot(&mut commands, "09-hyper-window"),
        21 => shot(&mut commands, "10-hyperspace"),
        _ => {
            exit.write(AppExit::Success);
        }
    }
    script.step += 1;
}
