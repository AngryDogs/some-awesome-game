//! Some Awesome Game: a Stargate-themed 3D space mining and combat game.
//! Native build: Rust + Bevy, rendered on the GPU through wgpu (Metal on macOS,
//! Vulkan on Linux). Every asset is embedded in the executable.

mod data;
mod hud;
mod meshes;
mod profile;
mod sim;
mod sound;
mod testdrive;
mod ui;
mod visuals;

use bevy::prelude::*;
use bevy::window::{PresentMode, PrimaryWindow, WindowMode};
use profile::Profile;
use sim::*;
use sound::{Loops, Sounds};

#[derive(States, Default, Clone, Eq, PartialEq, Hash, Debug)]
pub enum Screen {
    #[default]
    Menu,
    Flight,
    Docked,
}

#[derive(Resource, Default, PartialEq, Eq, Clone, Copy, Debug)]
pub enum Overlay {
    #[default]
    None,
    Dhd,
    Starmap,
    Pause,
    Help,
    GameOver,
}

impl Overlay {
    pub fn paused(self) -> bool {
        matches!(self, Overlay::Pause | Overlay::Help)
    }
}

/// DHD glyph presses play one by one before the gate starts dialing.
#[derive(Resource, Default)]
pub struct DialSequence {
    pub target: Option<String>,
    pub glyphs: Vec<usize>,
    pub timer: f32,
}

fn main() {
    let profile = Profile::load();
    let mut app = App::new();
    app
        .add_plugins(
            DefaultPlugins
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        title: "Some Awesome Game".into(),
                        resolution: (1600.0, 900.0).into(),
                        present_mode: PresentMode::AutoVsync,
                        ..default()
                    }),
                    ..default()
                })
                .set(bevy::log::LogPlugin { filter: "wgpu=error,naga=warn,bevy_render=warn".into(), ..default() }),
        )

        .insert_resource(profile)
        .insert_resource(Sim::new(&Profile::default()))
        .init_resource::<Overlay>()
        .init_resource::<Sounds>()
        .init_resource::<Loops>()
        .init_resource::<DialSequence>()
        .init_resource::<visuals::CameraRig>()
        .init_resource::<hud::Mouse>()
        .init_resource::<ui::Pending>()
        .init_resource::<ui::Yard>()
        .add_systems(PreStartup, (sound::setup_sounds, visuals::setup_art))
        .add_systems(Startup, (visuals::setup_scene, configure_gizmos))
        .add_systems(OnEnter(Screen::Menu), (ui::spawn_menu, show_cursor))
        .add_systems(OnExit(Screen::Menu), ui::despawn::<ui::MenuRoot>)
        .add_systems(OnEnter(Screen::Flight), (start_flight, hud::spawn_hud))
        .add_systems(OnExit(Screen::Flight), (visuals::clear_world, hud::despawn_hud, ui::despawn::<ui::OverlayRoot>, stop_loops, show_cursor))
        .add_systems(OnEnter(Screen::Docked), (ui::mark_yard_dirty, show_cursor))
        .add_systems(OnExit(Screen::Docked), ui::despawn::<ui::YardRoot>)
        .add_systems(
            Update,
            (
                (flight_input, dial_sequence, step_sim, flight_audio, overlay_watch).chain().run_if(in_state(Screen::Flight)),
                (
                    visuals::build_system,
                    visuals::sync_rocks,
                    visuals::sync_ores,
                    visuals::sync_missiles,
                    visuals::sync_ships,
                    visuals::update_ship_fx,
                    visuals::sync_particles,
                    visuals::draw_lines,
                    visuals::update_gate_visuals,
                    visuals::spin,
                    hud::update_hud,
                )
                    .after(step_sim)
                    .run_if(in_state(Screen::Flight)),
                (visuals::update_camera, visuals::update_tunnel).chain().after(visuals::sync_ships),
                ui::rebuild_yard.run_if(in_state(Screen::Docked)),
                ui::rebuild_overlay.run_if(in_state(Screen::Flight)),
                (ui::button_visuals, ui::collect_actions, ui::handle_actions).chain(),
                menu_keys,
                sound::play_sounds,
                sound::update_loops,
                testdrive::drive,
            ),
        )
        ;
    // Fonts must exist before the first OnEnter(Menu), which runs ahead of Startup.
    let font = app.world_mut().resource_mut::<Assets<Font>>().add(ui::title_font());
    app.insert_resource(ui::Fonts { title: font }).init_state::<Screen>();
    app.run();
}

fn configure_gizmos(mut store: ResMut<GizmoConfigStore>) {
    let (config, _) = store.config_mut::<DefaultGizmoConfigGroup>();
    config.line.width = 2.5;
}

fn show_cursor(mut window: Query<&mut Window, With<PrimaryWindow>>) {
    if let Ok(mut w) = window.single_mut() {
        w.cursor_options.visible = true;
    }
}

fn stop_loops(mut loops: ResMut<Loops>) {
    loops.clear();
}

fn start_flight(mut sim: ResMut<Sim>, profile: Res<Profile>, mut overlay: ResMut<Overlay>, mut rig: ResMut<visuals::CameraRig>, mut sounds: ResMut<Sounds>) {
    *sim = Sim::new(&profile);
    *overlay = Overlay::None;
    rig.rot = sim.player().rot * Quat::from_rotation_y(-std::f32::consts::FRAC_PI_2);
    sounds.play("door", 0.6, 1.0);
}

/// Mouse steering: an aim-only zone around the centre of the screen; outside it the
/// ship turns toward the cursor. Keyboard for thrust, strafe, lift and roll.
#[allow(clippy::too_many_arguments)]
fn flight_input(
    keys: Res<ButtonInput<KeyCode>>,
    buttons: Res<ButtonInput<MouseButton>>,
    mut window: Query<&mut Window, With<PrimaryWindow>>,
    camera: Query<(&Camera, &GlobalTransform), With<visuals::MainCamera>>,
    mut sim: ResMut<Sim>,
    mut overlay: ResMut<Overlay>,
    mut sounds: ResMut<Sounds>,
    mut mouse: ResMut<hud::Mouse>,
    mut rig: ResMut<visuals::CameraRig>,
    mut next: ResMut<NextState<Screen>>,
    mut dial: ResMut<DialSequence>,
    test: Res<testdrive::TestInput>,
) {
    let Ok(mut window) = window.single_mut() else { return };
    let flying = *overlay == Overlay::None;
    window.cursor_options.visible = !flying;
    let cursor = test.cursor.or(window.cursor_position());
    mouse.0 = cursor;
    let mut c = Controls::default();
    if keys.just_pressed(KeyCode::Escape) {
        *overlay = match *overlay {
            Overlay::None => Overlay::Pause,
            Overlay::GameOver => Overlay::GameOver,
            _ => Overlay::None,
        };
        sounds.play("button", 0.4, 1.0);
    }
    if !flying || !sim.player().alive {
        sim.controls = c;
        return;
    }
    let (w, h) = (window.width(), window.height());
    if let Some(m) = cursor {
        let offset = Vec2::new(m.x - w / 2.0, m.y - h / 2.0) / (h * 0.42);
        let r = offset.length();
        let dead = 0.1;
        if r > dead {
            let k = ((r - dead) / (1.0 - dead)).min(1.0) / r;
            c.yaw = offset.x * k;
            c.pitch = -offset.y * k;
        }
        if let Ok((cam, gt)) = camera.single() {
            if let Ok(ray) = cam.viewport_to_world(gt, m) {
                let (dist, hit) = sim.raycast(ray.origin, *ray.direction, 4000.0, Some(Side::Player));
                let d = if hit.is_some() { dist } else { 1500.0 };
                c.aim_point = Some(ray.origin + *ray.direction * d);
                c.aim_target = hit;
            }
        }
    }
    let axis = |pos: &[KeyCode], neg: &[KeyCode]| -> f32 {
        let p = pos.iter().any(|k| keys.pressed(*k)) as i32 as f32;
        let n = neg.iter().any(|k| keys.pressed(*k)) as i32 as f32;
        p - n
    };
    c.thrust = axis(&[KeyCode::KeyW, KeyCode::ArrowUp], &[KeyCode::KeyS, KeyCode::ArrowDown]) + test.thrust;
    c.strafe = axis(&[KeyCode::KeyD], &[KeyCode::KeyA]);
    c.lift = axis(&[KeyCode::KeyR, KeyCode::Space], &[KeyCode::KeyF, KeyCode::ControlLeft]);
    c.roll = axis(&[KeyCode::KeyE], &[KeyCode::KeyQ]);
    c.yaw += axis(&[KeyCode::ArrowRight], &[KeyCode::ArrowLeft]);
    c.fire = buttons.pressed(MouseButton::Left) || test.fire;
    c.missiles = buttons.pressed(MouseButton::Right) || keys.pressed(KeyCode::ShiftLeft) || test.missiles;
    sim.controls = c;

    if keys.just_pressed(KeyCode::KeyX) {
        let on = {
            let p = sim.player_mut();
            p.stabilizer = !p.stabilizer;
            p.stabilizer
        };
        sounds.play("button", 0.5, if on { 1.0 } else { 0.85 });
        sim.banner(if on { "Stabilizer ON" } else { "Stabilizer OFF: drifting freely" }, 1.4);
    }
    if keys.just_pressed(KeyCode::KeyH) {
        sim.toggle_shields(&mut sounds);
    }
    if keys.just_pressed(KeyCode::KeyT) {
        sim.cycle_targets(&mut sounds);
    }
    if keys.just_pressed(KeyCode::KeyC) {
        let on = {
            let p = sim.player_mut();
            p.auto_target = !p.auto_target;
            p.auto_target
        };
        sounds.play("button", 0.5, 1.0);
        sim.banner(if on { "Turret auto-targeting ON" } else { "Turret auto-targeting OFF" }, 1.4);
    }
    if keys.just_pressed(KeyCode::KeyV) {
        rig.far_view = !rig.far_view;
    }
    for (i, k) in [KeyCode::Digit1, KeyCode::Digit2, KeyCode::Digit3, KeyCode::Digit4, KeyCode::Digit5, KeyCode::Digit6].iter().enumerate() {
        if keys.just_pressed(*k) {
            sim.toggle_weapon(i, &mut sounds);
        }
    }
    if keys.just_pressed(KeyCode::KeyG) && sim.transition.is_none() {
        if sim.near_dhd {
            if sim.gate.busy() || dial.target.is_some() {
                dial.target = None;
                sim.close_gate(false, &mut sounds);
                sounds.play("dhd_dome", 0.8, 1.0);
            } else {
                *overlay = Overlay::Dhd;
                sounds.play("button", 0.5, 1.0);
            }
        } else {
            sim.banner("Fly to the DHD next to the Stargate to dial", 1.6);
        }
    }
    if keys.just_pressed(KeyCode::KeyM) && sim.transition.is_none() {
        if sim.player().stats.hyperdrive.is_some() {
            *overlay = Overlay::Starmap;
            sounds.play("button", 0.5, 1.0);
        } else {
            sim.banner("No hyperdrive: fit one at Atlantis or use the Stargate", 1.8);
        }
    }
    if keys.just_pressed(KeyCode::KeyB) && sim.can_dock {
        if sim.player().vel.length() > MAX_DOCK_SPEED {
            sim.banner("Slow down to dock", 1.2);
        } else {
            sounds.play("door", 0.8, 1.0);
            next.set(Screen::Docked);
        }
    }
    if keys.just_pressed(KeyCode::F1) {
        *overlay = Overlay::Help;
    }
}

fn dial_sequence(time: Res<Time>, mut dial: ResMut<DialSequence>, mut sim: ResMut<Sim>, mut sounds: ResMut<Sounds>, overlay: Res<Overlay>) {
    if dial.target.is_none() || overlay.paused() {
        return;
    }
    dial.timer -= time.delta_secs();
    if dial.timer > 0.0 {
        return;
    }
    if dial.glyphs.pop().is_some() {
        sounds.play("dhd_press", 0.9, 1.0);
        dial.timer = 0.38;
        if !dial.glyphs.is_empty() {
            return;
        }
        dial.timer = 0.6;
        return;
    }
    let target = dial.target.take().unwrap();
    sounds.play("dhd_dome", 1.0, 1.0);
    sounds.play("gate_spin", 0.8, 1.0);
    sim.dial(&target);
}

fn step_sim(time: Res<Time>, mut sim: ResMut<Sim>, mut profile: ResMut<Profile>, mut sounds: ResMut<Sounds>, overlay: Res<Overlay>) {
    if overlay.paused() {
        return;
    }
    let dt = time.delta_secs().min(1.0 / 20.0);
    let steps = (dt / (1.0 / 90.0)).ceil().max(1.0) as usize;
    let h = dt / steps as f32;
    for _ in 0..steps {
        sim.step(h, &mut profile, &mut sounds);
    }
}

fn flight_audio(sim: Res<Sim>, mut loops: ResMut<Loops>, overlay: Res<Overlay>, cam: Query<&GlobalTransform, With<visuals::MainCamera>>) {
    if overlay.paused() {
        loops.clear();
        return;
    }
    let p = sim.player();
    let flying = p.alive && !p.hidden;
    loops.set("engine", if flying { 0.12 + p.thrust_level * 0.3 } else { 0.0 });
    let c = &sim.controls;
    let lateral = (c.strafe.abs() + c.lift.abs()).min(1.0) + if c.thrust < 0.0 { 0.6 } else { 0.0 };
    loops.set("thrust", if flying { lateral.min(1.0) * 0.25 } else { 0.0 });
    let ear = cam.single().map(|g| g.translation()).unwrap_or(p.pos);
    let g = &sim.gate;
    let d = ear.distance(g.pos);
    let open = matches!(g.state, GateState::Open | GateState::Kawoosh);
    loops.set("horizon", if open { (1.0 - d / 1400.0).clamp(0.0, 1.0) * 0.6 } else { 0.0 });
}

fn overlay_watch(sim: Res<Sim>, mut overlay: ResMut<Overlay>) {
    if !sim.player().alive && sim.game_over_timer > 2.0 && *overlay != Overlay::GameOver {
        *overlay = Overlay::GameOver;
    }
    if sim.transition.is_some() && matches!(*overlay, Overlay::Dhd | Overlay::Starmap) {
        *overlay = Overlay::None;
    }
}

fn menu_keys(keys: Res<ButtonInput<KeyCode>>, state: Res<State<Screen>>, mut pending: ResMut<ui::Pending>, mut window: Query<&mut Window, With<PrimaryWindow>>) {
    if keys.just_pressed(KeyCode::F11) {
        if let Ok(mut w) = window.single_mut() {
            w.mode = if w.mode == WindowMode::Windowed { WindowMode::BorderlessFullscreen(MonitorSelection::Current) } else { WindowMode::Windowed };
        }
    }
    match state.get() {
        Screen::Menu if keys.just_pressed(KeyCode::Enter) => pending.0.push(ui::Action::Launch),
        Screen::Docked if keys.just_pressed(KeyCode::Escape) || keys.just_pressed(KeyCode::KeyB) => pending.0.push(ui::Action::Undock),
        _ => {}
    }
}
