//! Menus built with Bevy UI: the title screen, the Atlantis shipyard (market, hangar,
//! module mounts), the DHD dialer, the hyperdrive star map, pause, help and game over.

use crate::data::{data, rgb, ship_stats, upgrade_cost, sell_value, stat};
use crate::profile::Profile;
use crate::sim::*;
use crate::sound::Sounds;
use crate::{DialSequence, Overlay, Screen};
use bevy::prelude::*;

#[derive(Component)]
pub struct MenuRoot;
#[derive(Component)]
pub struct YardRoot;
#[derive(Component)]
pub struct OverlayRoot;
#[derive(Component)]
pub struct Disabled;

#[derive(Clone, Debug, PartialEq)]
pub enum Action {
    Launch,
    Quit,
    Help,
    ResetSave,
    Resume,
    ToMenu,
    Undock,
    SellCargo,
    BuyHull(String),
    FlyHull(String),
    SelectSlot(String),
    Install(String, String),
    Upgrade(String),
    Sell(String),
    Dial(String),
    Jump(String),
    CloseOverlay,
    Respawn,
    ToggleDebug,
}

#[derive(Component)]
pub struct Act(pub Action);

#[derive(Resource, Default)]
pub struct Pending(pub Vec<Action>);

#[derive(Resource, Default)]
pub struct Yard {
    pub dirty: bool,
    pub slot: Option<String>,
    pub message: String,
}

#[derive(Resource)]
pub struct Fonts {
    pub title: Handle<Font>,
}

pub fn title_font() -> Font {
    Font::try_from_bytes(include_bytes!("../assets/fonts/Bungee-Regular.ttf").to_vec()).expect("embedded font")
}

pub fn despawn<T: Component>(mut commands: Commands, q: Query<Entity, With<T>>) {
    for e in &q {
        commands.entity(e).despawn();
    }
}

pub fn mark_yard_dirty(mut yard: ResMut<Yard>) {
    yard.dirty = true;
    yard.slot = None;
    yard.message.clear();
}

const PANEL: Color = Color::srgba(0.03, 0.06, 0.11, 0.9);
const ACCENT: Color = Color::srgb(0.45, 0.75, 1.0);
const BUTTON: Color = Color::srgb(0.1, 0.2, 0.33);
const BUTTON_HOVER: Color = Color::srgb(0.16, 0.32, 0.5);
const BUTTON_PRESS: Color = Color::srgb(0.25, 0.45, 0.68);
const BUTTON_OFF: Color = Color::srgb(0.12, 0.13, 0.15);

fn label(p: &mut ChildSpawnerCommands, value: impl Into<String>, size: f32, color: Color) {
    p.spawn((Text::new(value), TextFont { font_size: size, ..default() }, TextColor(color)));
}

fn title(p: &mut ChildSpawnerCommands, fonts: &Fonts, value: &str, size: f32) {
    p.spawn((Text::new(value), TextFont { font: fonts.title.clone(), font_size: size, ..default() }, TextColor(ACCENT)));
}

fn button(p: &mut ChildSpawnerCommands, text: impl Into<String>, action: Action, enabled: bool, width: Val) {
    let mut e = p.spawn((
        Button,
        Node {
            width,
            padding: UiRect::axes(Val::Px(12.0), Val::Px(7.0)),
            margin: UiRect::all(Val::Px(3.0)),
            justify_content: JustifyContent::Center,
            align_items: AlignItems::Center,
            border: UiRect::all(Val::Px(1.0)),
            ..default()
        },
        BorderColor(if enabled { Color::srgba(0.45, 0.75, 1.0, 0.6) } else { Color::srgba(0.4, 0.4, 0.4, 0.4) }),
        BorderRadius::all(Val::Px(4.0)),
        BackgroundColor(if enabled { BUTTON } else { BUTTON_OFF }),
        Act(action),
    ));
    if !enabled {
        e.insert(Disabled);
    }
    e.with_children(|b| {
        label(b, text, 15.0, if enabled { Color::WHITE } else { Color::srgb(0.45, 0.45, 0.48) });
    });
}

fn panel(p: &mut ChildSpawnerCommands, width: Val, children: impl FnOnce(&mut ChildSpawnerCommands)) {
    p.spawn((
        Node {
            width,
            flex_direction: FlexDirection::Column,
            padding: UiRect::all(Val::Px(14.0)),
            margin: UiRect::all(Val::Px(8.0)),
            border: UiRect::all(Val::Px(1.0)),
            row_gap: Val::Px(4.0),
            overflow: Overflow::clip_y(),
            ..default()
        },
        BackgroundColor(PANEL),
        BorderColor(Color::srgba(0.45, 0.75, 1.0, 0.35)),
        BorderRadius::all(Val::Px(6.0)),
    ))
    .with_children(children);
}

fn full_screen(dim: f32) -> (Node, BackgroundColor) {
    (
        Node {
            width: Val::Percent(100.0),
            height: Val::Percent(100.0),
            position_type: PositionType::Absolute,
            flex_direction: FlexDirection::Column,
            align_items: AlignItems::Center,
            justify_content: JustifyContent::Center,
            ..default()
        },
        BackgroundColor(Color::srgba(0.0, 0.01, 0.03, dim)),
    )
}

pub const CONTROLS: &str = "\
Mouse            steer (the ring around the centre aims only)
Left mouse       fire guns        Right mouse / Shift   missiles & drones
W / S            thrust / reverse   A / D   strafe   R / F (Space / Ctrl)  up / down
Q / E            roll              X  stabilizer on/off   H  shields up/down
T                target mode (needs guidance)   C  turret auto-targeting
1 - 6            switch weapon groups on/off    V  far camera   Wheel  zoom
G                use the DHD (near the Stargate)  M  hyperdrive star map
B                dock at Atlantis    Esc  pause    F11  fullscreen

Lower shields to scoop ore with the tractor. Shields resist energy weapons poorly but
stop kinetic rounds well; hull armour is the reverse. Only drones can stop drones;
guns and missiles shoot down missiles.";

pub fn spawn_menu(mut commands: Commands, fonts: Res<Fonts>, profile: Res<Profile>) {
    commands.spawn((full_screen(0.35), MenuRoot)).with_children(|root| {
        title(root, &fonts, "SOME AWESOME GAME", 64.0);
        label(root, "Stargate mining & combat  -  native edition", 18.0, Color::srgb(0.7, 0.8, 0.95));
        root.spawn(Node { height: Val::Px(28.0), ..default() });
        let continuing = profile.credits > 0.0 || profile.owned_hulls.len() > 1;
        button(root, if continuing { "Continue  (Enter)" } else { "Launch from Atlantis  (Enter)" }, Action::Launch, true, Val::Px(320.0));
        button(root, "Controls", Action::Help, true, Val::Px(320.0));
        button(root, if profile.debug { "Free shopping: ON" } else { "Free shopping: OFF" }, Action::ToggleDebug, true, Val::Px(320.0));
        button(root, "Reset save", Action::ResetSave, true, Val::Px(320.0));
        button(root, "Quit", Action::Quit, true, Val::Px(320.0));
        root.spawn(Node { height: Val::Px(20.0), ..default() });
        label(root, format!("Credits {:.0}   Ship: {}", profile.credits, data().hull(&profile.hull).name), 15.0, Color::srgb(0.6, 0.7, 0.8));
        label(root, "Sounds: Stargate Carter Addon Pack (CC BY-NC-SA 4.0).  3D models: Sketchfab artists rossrobotics, ska-ara, Ace_Fighter, TaurWing, anquietas-sys (CC BY / BY-NC / BY-NC-SA).", 12.0, Color::srgb(0.45, 0.5, 0.6));
    });
}

pub fn rebuild_yard(mut commands: Commands, mut yard: ResMut<Yard>, profile: Res<Profile>, fonts: Res<Fonts>, old: Query<Entity, With<YardRoot>>) {
    if !yard.dirty {
        return;
    }
    yard.dirty = false;
    for e in &old {
        commands.entity(e).despawn();
    }
    let hull = data().hull(&profile.hull);
    let stats = ship_stats(&hull.id, &profile.current_loadout());
    commands
        .spawn((
            Node { width: Val::Percent(100.0), height: Val::Percent(100.0), position_type: PositionType::Absolute, flex_direction: FlexDirection::Column, padding: UiRect::all(Val::Px(16.0)), ..default() },
            BackgroundColor(Color::srgba(0.0, 0.02, 0.05, 0.78)),
            YardRoot,
        ))
        .with_children(|root| {
            root.spawn(Node { justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, width: Val::Percent(100.0), ..default() }).with_children(|top| {
                title(top, &fonts, "ATLANTIS SHIPYARD", 34.0);
                label(top, format!("Credits  {:.0}{}", profile.credits, if profile.debug { "   (free shopping)" } else { "" }), 22.0, Color::srgb(1.0, 0.85, 0.5));
                button(top, "Undock  (B)", Action::Undock, true, Val::Px(180.0));
            });
            if !yard.message.is_empty() {
                label(root, yard.message.clone(), 16.0, Color::srgb(1.0, 0.6, 0.5));
            }
            root.spawn(Node { width: Val::Percent(100.0), flex_grow: 1.0, align_items: AlignItems::Stretch, min_height: Val::Px(0.0), ..default() }).with_children(|cols| {
                // Market.
                panel(cols, Val::Percent(24.0), |p| {
                    title(p, &fonts, "MARKET", 20.0);
                    label(p, format!("Cargo {} / {}", profile.cargo_used(), stats.cargo), 15.0, Color::srgb(0.8, 0.85, 0.95));
                    let mut items: Vec<_> = profile.cargo.iter().filter(|(_, n)| **n > 0).collect();
                    items.sort_by(|a, b| a.0.cmp(b.0));
                    if items.is_empty() {
                        label(p, "The hold is empty. Lower your shields near broken asteroids to tractor in ore.", 14.0, Color::srgb(0.6, 0.65, 0.75));
                    }
                    for (id, n) in items {
                        let m = data().material(id);
                        let c = rgb(&m.color);
                        label(p, format!("{} x{}   {:.0} cr", m.name, n, *n as f32 * m.price), 15.0, Color::srgb(c[0], c[1], c[2]));
                    }
                    let value = profile.cargo_value();
                    button(p, format!("Sell all  (+{:.0} cr)", value), Action::SellCargo, value > 0.0, Val::Percent(100.0));
                    p.spawn(Node { height: Val::Px(12.0), ..default() });
                    label(p, "Hull and shields are repaired free of charge while docked.", 13.0, Color::srgb(0.55, 0.8, 0.7));
                });
                // Hangar.
                panel(cols, Val::Percent(36.0), |p| {
                    title(p, &fonts, "HANGAR", 20.0);
                    for h in &data().hulls {
                        let owned = profile.owns(&h.id);
                        let current = profile.hull == h.id;
                        p.spawn(Node { justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, width: Val::Percent(100.0), ..default() }).with_children(|row| {
                            row.spawn(Node { flex_direction: FlexDirection::Column, flex_shrink: 1.0, ..default() }).with_children(|t| {
                                label(t, format!("{}  -  {}", h.name, h.class_name), 15.0, if current { ACCENT } else { Color::WHITE });
                                label(t, format!("hull {:.0}  shield {:.0}  cargo {}  mounts {}{}", h.hull, h.base_shield, h.cargo, h.slots.len(),
                                    if h.hyperdrive > 0.0 { "  hyperdrive" } else { "" }), 12.0, Color::srgb(0.6, 0.66, 0.76));
                            });
                            if current {
                                button(row, "Flying", Action::FlyHull(h.id.clone()), false, Val::Px(130.0));
                            } else if owned {
                                button(row, "Fly", Action::FlyHull(h.id.clone()), true, Val::Px(130.0));
                            } else {
                                let cost = profile.price(h.cost);
                                button(row, format!("Buy {:.0}", cost), Action::BuyHull(h.id.clone()), profile.credits >= cost, Val::Px(130.0));
                            }
                        });
                    }
                });
                // Mounts.
                panel(cols, Val::Percent(38.0), |p| {
                    title(p, &fonts, &format!("{} MOUNTS", hull.name.to_uppercase()), 20.0);
                    label(p, format!(
                        "Hull {:.0}  Shield {:.0} (+{:.1}/s)  Accel {:.0}  Cargo {}{}{}",
                        stats.max_hull, stats.max_shield, stats.shield_regen, stats.acceleration, stats.cargo,
                        stats.hyperdrive.map_or(String::new(), |h| format!("  Hyperdrive x{:.1}", h)),
                        stats.guidance.map_or(String::new(), |g| format!("  Guidance {:.0}", g.0)),
                    ), 13.0, Color::srgb(0.65, 0.75, 0.85));
                    let fits = profile.loadouts.get(&hull.id).cloned().unwrap_or_default();
                    for slot in &hull.slots {
                        let selected = yard.slot.as_deref() == Some(slot.id.as_str());
                        p.spawn(Node { justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, width: Val::Percent(100.0), ..default() }).with_children(|row| {
                            match fits.get(&slot.id) {
                                Some(fit) => {
                                    let def = data().module(&fit.kind);
                                    let c = rgb(&def.color);
                                    label(row, format!("[{}] {} Mk {}", slot.id, def.name, fit.level), 15.0, Color::srgb(c[0], c[1], c[2]));
                                    row.spawn(Node::default()).with_children(|b| {
                                        match upgrade_cost(&fit.kind, fit.level) {
                                            Some(cost) => {
                                                let cost = profile.price(cost);
                                                button(b, format!("Upgrade {:.0}", cost), Action::Upgrade(slot.id.clone()), profile.credits >= cost, Val::Px(140.0));
                                            }
                                            None => button(b, "Max level", Action::Upgrade(slot.id.clone()), false, Val::Px(140.0)),
                                        }
                                        let value = if profile.debug { 0 } else { sell_value(&fit.kind, fit.level) };
                                        button(b, format!("Sell +{}", value), Action::Sell(slot.id.clone()), true, Val::Px(110.0));
                                    });
                                }
                                None => {
                                    label(row, format!("[{}] empty mount", slot.id), 15.0, Color::srgb(0.55, 0.58, 0.65));
                                    button(row, if selected { "Choose below" } else { "Fit module" }, Action::SelectSlot(slot.id.clone()), !selected, Val::Px(140.0));
                                }
                            }
                        });
                    }
                    if let Some(slot) = yard.slot.clone() {
                        if !fits.contains_key(&slot) {
                            p.spawn(Node { height: Val::Px(8.0), ..default() });
                            label(p, format!("Modules for mount [{}]", slot), 15.0, ACCENT);
                            for m in &data().modules {
                                let cost = profile.price(m.cost);
                                let fits_hull = m.min_hull_mass <= 0.0 || hull.mass >= m.min_hull_mass;
                                p.spawn(Node { justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, width: Val::Percent(100.0), ..default() }).with_children(|row| {
                                    let c = rgb(&m.color);
                                    let note = module_note(&m.id);
                                    label(row, format!("{}  {}", m.name, note), 13.0, if fits_hull { Color::srgb(c[0], c[1], c[2]) } else { Color::srgb(0.45, 0.45, 0.5) });
                                    let text = if fits_hull { format!("Buy {:.0}", cost) } else { "Hull too small".into() };
                                    button(row, text, Action::Install(slot.clone(), m.id.clone()), fits_hull && profile.credits >= cost, Val::Px(140.0));
                                });
                            }
                        }
                    }
                });
            });
        });
}

fn module_note(id: &str) -> String {
    let s = crate::data::module_stats(id, 1);
    match id {
        "minigun" => format!("kinetic, {:.0} dmg x {:.0}/s", stat(&s, "damage"), stat(&s, "fireRate")),
        "staff" => format!("energy, {:.0} dmg splash", stat(&s, "damage")),
        "beam" => format!("energy beam, {:.0} dps", stat(&s, "dps")),
        "missile" => format!("kinetic, {:.0} dmg blast", stat(&s, "damage")),
        "drones" => format!("energy swarm x{:.0}", stat(&s, "count")),
        "engine" => format!("+{:.0} thrust", stat(&s, "thrust")),
        "shield" => format!("+{:.0} shield", stat(&s, "capacity")),
        "armor" => format!("+{:.0} hull", stat(&s, "hull")),
        "cargo" => format!("+{:.0} cargo", stat(&s, "capacity")),
        "guidance" => "auto-targeting & homing".into(),
        "hyperdrive" => "interstellar jumps".into(),
        "scanner" => "longer radar".into(),
        "magnet" => "longer tractor".into(),
        _ => String::new(),
    }
}

pub fn rebuild_overlay(mut commands: Commands, overlay: Res<Overlay>, mut last: Local<Option<Overlay>>, sim: Res<Sim>, fonts: Res<Fonts>, old: Query<Entity, With<OverlayRoot>>) {
    if *last == Some(*overlay) {
        return;
    }
    *last = Some(*overlay);
    for e in &old {
        commands.entity(e).despawn();
    }
    let constellations = &data().constellations;
    match *overlay {
        Overlay::None => {}
        Overlay::Pause => {
            commands.spawn((full_screen(0.6), OverlayRoot)).with_children(|r| {
                title(r, &fonts, "PAUSED", 48.0);
                button(r, "Resume  (Esc)", Action::Resume, true, Val::Px(300.0));
                button(r, "Controls", Action::Help, true, Val::Px(300.0));
                button(r, "Save & main menu", Action::ToMenu, true, Val::Px(300.0));
                button(r, "Quit", Action::Quit, true, Val::Px(300.0));
            });
        }
        Overlay::Help => {
            commands.spawn((full_screen(0.75), OverlayRoot)).with_children(|r| {
                panel(r, Val::Px(900.0), |p| {
                    title(p, &fonts, "CONTROLS", 30.0);
                    label(p, CONTROLS, 16.0, Color::srgb(0.85, 0.9, 1.0));
                    button(p, "Back", Action::CloseOverlay, true, Val::Px(200.0));
                });
            });
        }
        Overlay::GameOver => {
            commands.spawn((full_screen(0.55), OverlayRoot)).with_children(|r| {
                title(r, &fonts, "SHIP DESTROYED", 52.0);
                label(r, "Your cargo is lost. Atlantis has your ship rebuilt and fitted.", 18.0, Color::srgb(0.85, 0.85, 0.9));
                button(r, "Return to Atlantis", Action::Respawn, true, Val::Px(320.0));
                button(r, "Main menu", Action::ToMenu, true, Val::Px(320.0));
            });
        }
        Overlay::Dhd => {
            let too_big = sim.player().radius() > GATE_INNER * 0.95;
            commands.spawn((full_screen(0.45), OverlayRoot)).with_children(|r| {
                panel(r, Val::Px(860.0), |p| {
                    title(p, &fonts, "DIAL HOME DEVICE", 30.0);
                    if too_big {
                        label(p, "Your ship is too large to fit through the Stargate.", 15.0, Color::srgb(1.0, 0.6, 0.5));
                    }
                    for s in data().systems.iter().filter(|s| s.id != sim.system) {
                        p.spawn(Node { justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, width: Val::Percent(100.0), ..default() }).with_children(|row| {
                            row.spawn(Node { flex_direction: FlexDirection::Column, ..default() }).with_children(|t| {
                                label(t, format!("{}  ({})", s.name, s.galaxy), 17.0, Color::WHITE);
                                let glyphs: Vec<&str> = s.address.iter().map(|&i| constellations.get(i).map(|c| c.as_str()).unwrap_or("?")).collect();
                                label(t, glyphs.join("  -  "), 12.0, Color::srgb(0.6, 0.72, 0.9));
                            });
                            button(row, "Dial", Action::Dial(s.id.clone()), true, Val::Px(110.0));
                        });
                    }
                    button(p, "Cancel  (Esc)", Action::CloseOverlay, true, Val::Px(200.0));
                });
            });
        }
        Overlay::Starmap => {
            let p = sim.player();
            let speed = p.stats.hyperdrive.unwrap_or(1.0);
            let here = Vec3::from(data().system(&sim.system).map);
            commands.spawn((full_screen(0.45), OverlayRoot)).with_children(|r| {
                panel(r, Val::Px(760.0), |pn| {
                    title(pn, &fonts, "HYPERDRIVE", 30.0);
                    for s in data().systems.iter().filter(|s| s.id != sim.system) {
                        let distance = here.distance(Vec3::from(s.map));
                        let eta = (distance / (90.0 * speed)).clamp(5.0, 45.0);
                        pn.spawn(Node { justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, width: Val::Percent(100.0), ..default() }).with_children(|row| {
                            row.spawn(Node { flex_direction: FlexDirection::Column, ..default() }).with_children(|t| {
                                label(t, format!("{}  ({})", s.name, s.galaxy), 17.0, Color::WHITE);
                                label(t, format!("{:.0} ly   about {:.0} s in hyperspace{}", distance, eta, if s.station { "   - Atlantis" } else { "" }), 12.0, Color::srgb(0.6, 0.72, 0.9));
                            });
                            button(row, "Jump", Action::Jump(s.id.clone()), true, Val::Px(110.0));
                        });
                    }
                    button(pn, "Cancel  (Esc)", Action::CloseOverlay, true, Val::Px(200.0));
                });
            });
        }
    }
}

pub fn button_visuals(mut q: Query<(&Interaction, &mut BackgroundColor, Option<&Disabled>), (Changed<Interaction>, With<Button>)>) {
    for (i, mut bg, disabled) in &mut q {
        if disabled.is_some() {
            continue;
        }
        bg.0 = match i {
            Interaction::Pressed => BUTTON_PRESS,
            Interaction::Hovered => BUTTON_HOVER,
            Interaction::None => BUTTON,
        };
    }
}

pub fn collect_actions(q: Query<(&Interaction, &Act), (Changed<Interaction>, Without<Disabled>)>, mut pending: ResMut<Pending>) {
    for (i, a) in &q {
        if *i == Interaction::Pressed {
            pending.0.push(a.0.clone());
        }
    }
}

#[allow(clippy::too_many_arguments)]
pub fn handle_actions(
    mut pending: ResMut<Pending>,
    mut profile: ResMut<Profile>,
    mut sim: ResMut<Sim>,
    mut sounds: ResMut<Sounds>,
    mut overlay: ResMut<Overlay>,
    mut yard: ResMut<Yard>,
    mut dial: ResMut<DialSequence>,
    mut next: ResMut<NextState<Screen>>,
    state: Res<State<Screen>>,
    mut exit: EventWriter<AppExit>,
    mut commands: Commands,
    menu: Query<Entity, With<MenuRoot>>,
    fonts: Res<Fonts>,
) {
    let actions: Vec<Action> = pending.0.drain(..).collect();
    for action in actions {
        sounds.play("button", 0.45, 1.0);
        match action {
            Action::Launch | Action::Undock => {
                profile.save();
                next.set(Screen::Flight);
            }
            Action::Quit => {
                profile.save();
                exit.write(AppExit::Success);
            }
            Action::Help => {
                if *state.get() == Screen::Menu {
                    for e in &menu {
                        commands.entity(e).despawn();
                    }
                    commands.spawn((full_screen(0.6), MenuRoot)).with_children(|r| {
                        panel(r, Val::Px(900.0), |p| {
                            title(p, &fonts, "CONTROLS", 30.0);
                            label(p, CONTROLS, 16.0, Color::srgb(0.85, 0.9, 1.0));
                            button(p, "Back", Action::ToMenu, true, Val::Px(200.0));
                        });
                    });
                } else {
                    *overlay = Overlay::Help;
                }
            }
            Action::ResetSave | Action::ToggleDebug => {
                if action == Action::ResetSave {
                    *profile = Profile::default();
                } else {
                    profile.debug = !profile.debug;
                }
                profile.save();
                for e in &menu {
                    commands.entity(e).despawn();
                }
                commands.run_system_cached(spawn_menu);
            }
            Action::Resume | Action::CloseOverlay => *overlay = Overlay::None,
            Action::ToMenu => {
                profile.save();
                *overlay = Overlay::None;
                if *state.get() == Screen::Menu {
                    for e in &menu {
                        commands.entity(e).despawn();
                    }
                    commands.run_system_cached(spawn_menu);
                } else {
                    next.set(Screen::Menu);
                }
            }
            Action::Respawn => {
                profile.cargo.clear();
                profile.save();
                *sim = Sim::new(&profile);
                *overlay = Overlay::None;
            }
            Action::SellCargo => {
                let earned = profile.sell_cargo();
                yard.message = format!("Sold the cargo for {:.0} credits.", earned);
                sounds.play("scan", 0.5, 1.2);
                yard.dirty = true;
            }
            Action::BuyHull(id) => {
                yard.message = if profile.buy_hull(&id) { format!("Bought the {}.", data().hull(&id).name) } else { "Not enough credits.".into() };
                yard.slot = None;
                yard.dirty = true;
            }
            Action::FlyHull(id) => {
                profile.select_hull(&id);
                yard.message.clear();
                yard.slot = None;
                yard.dirty = true;
            }
            Action::SelectSlot(slot) => {
                yard.slot = Some(slot);
                yard.dirty = true;
            }
            Action::Install(slot, kind) => {
                yard.message = match profile.install(&slot, &kind) {
                    Ok(()) => format!("Fitted a {}.", data().module(&kind).name),
                    Err(e) => e,
                };
                yard.slot = None;
                yard.dirty = true;
            }
            Action::Upgrade(slot) => {
                yard.message = match profile.upgrade(&slot) {
                    Ok(()) => "Upgraded.".into(),
                    Err(e) => e,
                };
                yard.dirty = true;
            }
            Action::Sell(slot) => {
                profile.sell_module(&slot);
                yard.message = "Module sold.".into();
                yard.dirty = true;
            }
            Action::Dial(target) => {
                *overlay = Overlay::None;
                let glyphs: Vec<usize> = data().system(&target).address.iter().copied().chain(std::iter::once(0)).rev().collect();
                dial.glyphs = glyphs;
                dial.target = Some(target);
                dial.timer = 0.0;
            }
            Action::Jump(target) => {
                *overlay = Overlay::None;
                sim.start_hyperjump(&target, &mut sounds);
            }
        }
    }
}
