//! Flight HUD: hull / shield bars, speed, cargo and credits, weapon readiness, target
//! brackets, a 3D radar, floating pickup text, banners and context prompts.

use crate::data::{data, rgb};
use crate::profile::Profile;
use crate::sim::*;
use crate::visuals::MainCamera;
use bevy::prelude::*;
use bevy::window::PrimaryWindow;

const RADAR_SIZE: f32 = 190.0;
const RADAR_DOTS: usize = 90;
const BRACKETS: usize = 16;
const FLOATS: usize = 14;
const WEAPONS: usize = 6;

#[derive(Component)]
pub struct HudRoot;
#[derive(Component)]
pub struct HullFill;
#[derive(Component)]
pub struct ShieldFill;
#[derive(Component)]
pub struct HullText;
#[derive(Component)]
pub struct ShieldText;
#[derive(Component)]
pub struct InfoText;
#[derive(Component)]
pub struct StatusText;
#[derive(Component)]
pub struct BannerText;
#[derive(Component)]
pub struct PromptText;
#[derive(Component)]
pub struct CenterText;
#[derive(Component)]
pub struct Crosshair;
#[derive(Component)]
pub struct RadarDot(usize);
#[derive(Component)]
pub struct Bracket(usize);
#[derive(Component)]
pub struct BracketLabel(usize);
#[derive(Component)]
pub struct BracketBar(usize);
#[derive(Component)]
pub struct FloatLabel(usize);
#[derive(Component)]
pub struct WeaponBox(usize);
#[derive(Component)]
pub struct WeaponLabel(usize);
#[derive(Component)]
pub struct WeaponFill(usize);

/// Mouse position in window pixels, written by the input system.
#[derive(Resource, Default)]
pub struct Mouse(pub Option<Vec2>);

fn text(value: impl Into<String>, size: f32, color: Color) -> (Text, TextFont, TextColor) {
    (Text::new(value), TextFont { font_size: size, ..default() }, TextColor(color))
}

fn bar(parent: &mut ChildSpawnerCommands, label: &str, color: Color, fill: impl Component, label_marker: impl Component) {
    parent
        .spawn(Node { flex_direction: FlexDirection::Column, margin: UiRect::bottom(Val::Px(6.0)), ..default() })
        .with_children(|c| {
            c.spawn((text(label, 13.0, Color::srgb(0.75, 0.82, 0.92)), label_marker));
            c.spawn((
                Node { width: Val::Px(240.0), height: Val::Px(10.0), border: UiRect::all(Val::Px(1.0)), ..default() },
                BorderColor(Color::srgba(0.6, 0.75, 0.95, 0.6)),
                BackgroundColor(Color::srgba(0.05, 0.08, 0.12, 0.7)),
            ))
            .with_children(|b| {
                b.spawn((Node { width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() }, BackgroundColor(color), fill));
            });
        });
}

pub fn spawn_hud(mut commands: Commands) {
    let panel = Color::srgba(0.02, 0.04, 0.08, 0.55);
    commands
        .spawn((Node { width: Val::Percent(100.0), height: Val::Percent(100.0), position_type: PositionType::Absolute, ..default() }, HudRoot))
        .with_children(|root| {
            // Top left: ship status.
            root.spawn((
                Node { position_type: PositionType::Absolute, left: Val::Px(16.0), top: Val::Px(14.0), padding: UiRect::all(Val::Px(10.0)), flex_direction: FlexDirection::Column, ..default() },
                BackgroundColor(panel),
            ))
            .with_children(|p| {
                bar(p, "HULL", Color::srgb(0.95, 0.55, 0.3), HullFill, HullText);
                bar(p, "SHIELD", Color::srgb(0.35, 0.7, 1.0), ShieldFill, ShieldText);
                p.spawn((text("", 14.0, Color::srgb(0.85, 0.9, 1.0)), InfoText));
                p.spawn((text("", 13.0, Color::srgb(0.6, 0.85, 0.75)), StatusText, Node { margin: UiRect::top(Val::Px(4.0)), ..default() }));
            });
            // Banner.
            root.spawn(Node { position_type: PositionType::Absolute, top: Val::Px(18.0), width: Val::Percent(100.0), justify_content: JustifyContent::Center, ..default() })
                .with_children(|b| {
                    b.spawn((text("", 22.0, Color::srgb(1.0, 0.9, 0.65)), BannerText, TextLayout::new_with_justify(JustifyText::Center)));
                });
            // Centre messages (transit, game over hints) and prompts.
            root.spawn(Node { position_type: PositionType::Absolute, top: Val::Percent(30.0), width: Val::Percent(100.0), justify_content: JustifyContent::Center, ..default() })
                .with_children(|b| {
                    b.spawn((text("", 30.0, Color::srgb(0.8, 0.9, 1.0)), CenterText, TextLayout::new_with_justify(JustifyText::Center)));
                });
            root.spawn(Node { position_type: PositionType::Absolute, bottom: Val::Px(120.0), width: Val::Percent(100.0), justify_content: JustifyContent::Center, ..default() })
                .with_children(|b| {
                    b.spawn((text("", 18.0, Color::srgb(0.6, 1.0, 0.8)), PromptText, TextLayout::new_with_justify(JustifyText::Center)));
                });
            // Weapons.
            root.spawn(Node { position_type: PositionType::Absolute, bottom: Val::Px(18.0), width: Val::Percent(100.0), justify_content: JustifyContent::Center, column_gap: Val::Px(10.0), ..default() })
                .with_children(|row| {
                    for i in 0..WEAPONS {
                        row.spawn((
                            Node { width: Val::Px(130.0), padding: UiRect::all(Val::Px(6.0)), flex_direction: FlexDirection::Column, border: UiRect::all(Val::Px(1.0)), display: Display::None, ..default() },
                            BackgroundColor(panel),
                            BorderColor(Color::srgba(0.5, 0.6, 0.8, 0.5)),
                            WeaponBox(i),
                        ))
                        .with_children(|w| {
                            w.spawn((text("", 13.0, Color::WHITE), WeaponLabel(i)));
                            w.spawn((Node { width: Val::Percent(100.0), height: Val::Px(5.0), margin: UiRect::top(Val::Px(4.0)), ..default() }, BackgroundColor(Color::srgba(1.0, 1.0, 1.0, 0.1))))
                                .with_children(|b| {
                                    b.spawn((Node { width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() }, BackgroundColor(Color::WHITE), WeaponFill(i)));
                                });
                        });
                    }
                });
            // Radar.
            root.spawn((
                Node {
                    position_type: PositionType::Absolute, right: Val::Px(16.0), bottom: Val::Px(16.0), width: Val::Px(RADAR_SIZE), height: Val::Px(RADAR_SIZE),
                    border: UiRect::all(Val::Px(1.0)), ..default()
                },
                BackgroundColor(Color::srgba(0.02, 0.06, 0.1, 0.6)),
                BorderColor(Color::srgba(0.4, 0.7, 1.0, 0.5)),
                BorderRadius::all(Val::Percent(50.0)),
            ))
            .with_children(|r| {
                for (w, h) in [(RADAR_SIZE, 1.0), (1.0, RADAR_SIZE)] {
                    r.spawn((
                        Node { position_type: PositionType::Absolute, left: Val::Px((RADAR_SIZE - w) / 2.0), top: Val::Px((RADAR_SIZE - h) / 2.0), width: Val::Px(w), height: Val::Px(h), ..default() },
                        BackgroundColor(Color::srgba(0.4, 0.7, 1.0, 0.18)),
                    ));
                }
                for i in 0..RADAR_DOTS {
                    r.spawn((Node { position_type: PositionType::Absolute, width: Val::Px(4.0), height: Val::Px(4.0), display: Display::None, ..default() }, BackgroundColor(Color::WHITE), BorderRadius::all(Val::Px(3.0)), RadarDot(i)));
                }
            });
            // Target brackets.
            for i in 0..BRACKETS {
                root.spawn((
                    Node { position_type: PositionType::Absolute, border: UiRect::all(Val::Px(2.0)), display: Display::None, ..default() },
                    BorderColor(Color::srgb(1.0, 0.3, 0.25)),
                    Bracket(i),
                ))
                .with_children(|b| {
                    b.spawn((
                        Node { position_type: PositionType::Absolute, top: Val::Percent(100.0), left: Val::Px(-2.0), margin: UiRect::top(Val::Px(4.0)), width: Val::Px(180.0), flex_direction: FlexDirection::Column, ..default() },
                    ))
                    .with_children(|l| {
                        l.spawn((text("", 12.0, Color::srgb(1.0, 0.7, 0.65)), BracketLabel(i)));
                        l.spawn((Node { width: Val::Px(70.0), height: Val::Px(4.0), ..default() }, BackgroundColor(Color::srgba(1.0, 1.0, 1.0, 0.15))))
                            .with_children(|bb| {
                                bb.spawn((Node { width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() }, BackgroundColor(Color::srgb(1.0, 0.4, 0.3)), BracketBar(i)));
                            });
                    });
                });
            }
            for i in 0..FLOATS {
                root.spawn((text("", 15.0, Color::WHITE), Node { position_type: PositionType::Absolute, display: Display::None, ..default() }, FloatLabel(i)));
            }
            // Crosshair.
            root.spawn((
                Node { position_type: PositionType::Absolute, width: Val::Px(26.0), height: Val::Px(26.0), border: UiRect::all(Val::Px(2.0)), ..default() },
                BorderColor(Color::srgba(0.6, 1.0, 0.85, 0.85)),
                BorderRadius::all(Val::Percent(50.0)),
                Crosshair,
            ))
            .with_children(|c| {
                c.spawn((Node { position_type: PositionType::Absolute, left: Val::Px(9.0), top: Val::Px(9.0), width: Val::Px(4.0), height: Val::Px(4.0), ..default() }, BackgroundColor(Color::srgb(0.6, 1.0, 0.85))));
            });
        });
}

pub fn despawn_hud(mut commands: Commands, q: Query<Entity, With<HudRoot>>) {
    for e in &q {
        commands.entity(e).despawn();
    }
}

fn project(cam: &Camera, gt: &GlobalTransform, p: Vec3) -> Option<Vec2> {
    let local = gt.affine().inverse().transform_point3(p);
    if local.z > -1.0 {
        return None;
    }
    cam.world_to_viewport(gt, p).ok()
}

#[allow(clippy::too_many_arguments)]
pub fn update_hud(
    sim: Res<Sim>,
    profile: Res<Profile>,
    mouse: Res<Mouse>,
    window: Query<&Window, With<PrimaryWindow>>,
    camera: Query<(&Camera, &GlobalTransform), With<MainCamera>>,
    mut nodes: ParamSet<(
        Query<&mut Node, With<HullFill>>,
        Query<&mut Node, With<ShieldFill>>,
        Query<&mut Node, With<Crosshair>>,
        Query<(&RadarDot, &mut Node, &mut BackgroundColor)>,
        Query<(&Bracket, &mut Node, &mut BorderColor)>,
        Query<(&WeaponBox, &mut Node, &mut BorderColor)>,
        Query<(&WeaponFill, &mut Node, &mut BackgroundColor)>,
        Query<(&BracketBar, &mut Node)>,
    )>,
    mut all_texts: ParamSet<(
        ParamSet<(
        Query<&mut Text, With<HullText>>,
        Query<&mut Text, With<ShieldText>>,
        Query<&mut Text, With<InfoText>>,
        Query<&mut Text, With<StatusText>>,
        Query<(&mut Text, &mut TextColor), With<BannerText>>,
        Query<&mut Text, With<PromptText>>,
        Query<&mut Text, With<CenterText>>,
        Query<(&BracketLabel, &mut Text)>,
        )>,
        Query<(&WeaponLabel, &mut Text, &mut TextColor)>,
        Query<(&FloatLabel, &mut Text, &mut TextColor, &mut Node), (Without<RadarDot>, Without<Bracket>, Without<WeaponBox>, Without<WeaponFill>, Without<BracketBar>, Without<HullFill>, Without<ShieldFill>, Without<Crosshair>)>,
    )>,
) {
    let p = sim.player();
    let Ok(window) = window.single() else { return };
    let Ok((cam, gt)) = camera.single() else { return };

    let hull_frac = (p.hp / p.stats.max_hull).clamp(0.0, 1.0);
    let shield_frac = if p.stats.max_shield > 0.0 { (p.shield / p.stats.max_shield).clamp(0.0, 1.0) } else { 0.0 };
    for mut n in &mut nodes.p0() {
        n.width = Val::Percent(hull_frac * 100.0);
    }
    for mut n in &mut nodes.p1() {
        n.width = Val::Percent(shield_frac * 100.0);
    }
    let mut texts = all_texts.p0();
    for mut t in &mut texts.p0() {
        t.0 = format!("HULL  {:.0} / {:.0}", p.hp, p.stats.max_hull);
    }
    for mut t in &mut texts.p1() {
        t.0 = if p.stats.max_shield <= 0.0 {
            "SHIELD  none fitted".into()
        } else {
            format!("SHIELD  {:.0} / {:.0}{}", p.shield, p.stats.max_shield, if p.shields_enabled { "" } else { "  (lowered)" })
        };
    }
    let sys = data().system(&sim.system);
    for mut t in &mut texts.p2() {
        t.0 = format!(
            "{}  ({})\nSpeed {:.0}\nCargo {} / {}   value {:.0} cr\nCredits {:.0}",
            sys.name, sys.galaxy, p.vel.length(), profile.cargo_used(), p.stats.cargo, profile.cargo_value(), profile.credits
        );
    }
    for mut t in &mut texts.p3() {
        let targeting = if p.stats.guidance.is_some() { p.target_mode.label() } else { "manual" };
        t.0 = format!(
            "Stabilizer {}  |  Shields {}  |  Targets: {}{}",
            if p.stabilizer { "ON" } else { "OFF" },
            if p.stats.max_shield <= 0.0 { "-" } else if p.shields_enabled { "UP" } else { "DOWN" },
            targeting,
            if sim.tractor_count > 0 { format!("  |  Tractor x{}", sim.tractor_count) } else { String::new() }
        );
    }
    for (mut t, mut c) in &mut texts.p4() {
        if sim.banner_timer > 0.0 {
            t.0 = sim.banner.clone();
            c.0 = Color::srgba(1.0, 0.9, 0.65, sim.banner_timer.min(1.0));
        } else {
            t.0.clear();
        }
    }
    for mut t in &mut texts.p5() {
        let g = &sim.gate;
        t.0 = if !p.alive || sim.transition.is_some() {
            String::new()
        } else if sim.can_dock {
            if p.vel.length() > MAX_DOCK_SPEED { "Slow down to dock".into() } else { "Press B to dock at Atlantis".into() }
        } else if sim.near_dhd {
            if g.busy() { "Press G at the DHD to close the gate".into() } else { "Press G to use the DHD".into() }
        } else if g.state == GateState::Dialing {
            format!("Chevron {} encoded", g.locked)
        } else if g.state == GateState::Open && g.outgoing {
            let name = g.target.as_deref().map(|t| data().system(t).name.clone()).unwrap_or_default();
            format!("Wormhole to {} established: fly through the gate", name)
        } else {
            String::new()
        };
    }
    for mut t in &mut texts.p6() {
        t.0 = match &sim.transition {
            Some(Transition::Gate { .. }) => "Wormhole travel".into(),
            Some(Transition::Hyper { phase: 1, t, duration, target, .. }) => {
                format!("Hyperspace to {}\nETA {:.0} s", data().system(target).name, (duration - t).max(0.0))
            }
            _ if !p.alive => "SHIP DESTROYED".into(),
            _ => String::new(),
        };
    }

    // Crosshair follows the mouse.
    for mut n in &mut nodes.p2() {
        match mouse.0 {
            Some(m) if p.alive && sim.transition.is_none() => {
                n.display = Display::Flex;
                n.left = Val::Px(m.x - 13.0);
                n.top = Val::Px(m.y - 13.0);
            }
            _ => n.display = Display::None,
        }
    }

    // Radar: everything within range, in the ship's frame (up on the radar = ahead).
    let inv = p.rot.inverse();
    let mut blips: Vec<(Vec3, Color, f32)> = Vec::new();
    for s in sim.ships.iter().skip(1).filter(|s| s.alive) {
        blips.push((s.pos, Color::srgb(1.0, 0.3, 0.25), 6.0));
    }
    for m in &sim.missiles {
        let c = if m.side == Side::Player { Color::srgb(1.0, 0.9, 0.5) } else { Color::srgb(1.0, 0.55, 0.2) };
        blips.push((m.pos, c, 3.0));
    }
    blips.push((sim.gate.pos, Color::srgb(0.4, 0.7, 1.0), 8.0));
    if let Some(st) = sim.station {
        blips.push((st, Color::srgb(0.6, 1.0, 0.8), 9.0));
    }
    for r in &sim.rocks {
        let d = r.dominant();
        let c = if d == "rock" { Color::srgba(0.6, 0.6, 0.6, 0.5) } else {
            let k = rgb(&data().material(d).color);
            Color::srgba(k[0], k[1], k[2], 0.8)
        };
        blips.push((r.pos, c, if r.radius > 80.0 { 4.0 } else { 3.0 }));
    }
    let range = p.stats.scanner.unwrap_or(0.0).max(RADAR_RANGE);
    let mut used = 0;
    let mut dots = nodes.p3();
    let mut slots: Vec<_> = dots.iter_mut().collect();
    slots.sort_by_key(|(d, _, _)| d.0);
    for (pos, color, size) in blips {
        let local = inv * (pos - p.pos);
        let flat = Vec2::new(local.z, -local.x);
        let d = local.length();
        if d > range || used >= slots.len() {
            continue;
        }
        let scaled = flat / range * (RADAR_SIZE / 2.0 - 6.0);
        let (_, node, bg) = &mut slots[used];
        used += 1;
        node.display = Display::Flex;
        let sz = size * if local.y > 150.0 { 1.3 } else if local.y < -150.0 { 0.75 } else { 1.0 };
        node.width = Val::Px(sz);
        node.height = Val::Px(sz);
        node.left = Val::Px(RADAR_SIZE / 2.0 + scaled.x - sz / 2.0);
        node.top = Val::Px(RADAR_SIZE / 2.0 + scaled.y - sz / 2.0);
        bg.0 = color;
    }
    for (_, node, _) in slots.iter_mut().skip(used) {
        node.display = Display::None;
    }

    // Brackets around hostile ships (orange for the missile lock).
    let lock = p.missile_lock;
    let mut shown: Vec<(Vec2, f32, String, f32, bool)> = Vec::new();
    for s in sim.ships.iter().skip(1).filter(|s| s.alive && !s.hidden) {
        let Some(c) = project(cam, gt, s.pos) else { continue };
        let distance = s.pos.distance(gt.translation());
        let size = (s.radius() * 2.2 / distance * window.height() * 0.8).clamp(18.0, 220.0);
        let level = if s.level == 3 { "III" } else { "II" };
        let label = format!("{} Mk {}  {:.0} m", s.stats.hull.name, level, s.pos.distance(p.pos));
        let health = (s.hp / s.stats.max_hull).clamp(0.0, 1.0);
        shown.push((c, size, label, health, lock == Some(Target::Ship(s.id))));
    }
    if let Some(Target::Rock(id)) = lock {
        if let Some(r) = sim.rocks.iter().find(|r| r.id == id) {
            if let Some(c) = project(cam, gt, r.pos) {
                let distance = r.pos.distance(gt.translation());
                let size = (r.radius * 2.0 / distance * window.height() * 0.8).clamp(14.0, 200.0);
                let m = r.dominant();
                shown.push((c, size, data().material(m).name.clone(), -1.0, true));
            }
        }
    }
    let mut healths = vec![-1.0; BRACKETS];
    {
        let mut brackets = nodes.p4();
        for (b, mut node, mut border) in &mut brackets {
            match shown.get(b.0) {
                Some((c, size, _, health, locked)) => {
                    node.display = Display::Flex;
                    node.left = Val::Px(c.x - size / 2.0);
                    node.top = Val::Px(c.y - size / 2.0);
                    node.width = Val::Px(*size);
                    node.height = Val::Px(*size);
                    border.0 = if *locked { Color::srgb(1.0, 0.65, 0.15) } else if *health < 0.0 { Color::srgb(0.5, 0.9, 1.0) } else { Color::srgba(1.0, 0.3, 0.25, 0.85) };
                    healths[b.0] = *health;
                }
                None => node.display = Display::None,
            }
        }
    }
    for (b, mut n) in &mut nodes.p7() {
        let h = healths[b.0];
        n.width = Val::Percent(h.max(0.0) * 100.0);
    }
    for (l, mut t) in &mut texts.p7() {
        t.0 = shown.get(l.0).map(|s| s.2.clone()).unwrap_or_default();
    }

    // Floating pickup / bounty text.
    let mut list: Vec<(Vec2, &FloatText)> = sim.floats.iter().filter_map(|f| project(cam, gt, f.pos).map(|c| (c, f))).collect();
    list.truncate(FLOATS);
    for (fl, mut t, mut color, mut node) in &mut all_texts.p2() {
        match list.get(fl.0) {
            Some((c, f)) => {
                node.display = Display::Flex;
                node.left = Val::Px(c.x - 30.0);
                node.top = Val::Px(c.y - 10.0);
                t.0 = f.text.clone();
                color.0 = Color::srgba(f.color[0], f.color[1], f.color[2], (f.life / 0.5).min(1.0));
            }
            None => node.display = Display::None,
        }
    }

    // Weapons panel.
    let weapons = p.weapon_status();
    let mut boxes = nodes.p5();
    for (w, mut node, mut border) in &mut boxes {
        match weapons.get(w.0) {
            Some(ws) => {
                node.display = Display::Flex;
                border.0 = if ws.off { Color::srgba(0.4, 0.4, 0.4, 0.5) } else { Color::srgba(ws.color[0], ws.color[1], ws.color[2], 0.8) };
            }
            None => node.display = Display::None,
        }
    }
    for (w, mut node, mut bg) in &mut nodes.p6() {
        if let Some(ws) = weapons.get(w.0) {
            node.width = Val::Percent(ws.ready * 100.0);
            bg.0 = if ws.off { Color::srgb(0.35, 0.35, 0.35) } else { Color::srgb(ws.color[0], ws.color[1], ws.color[2]) };
        }
    }
    for (w, mut t, mut c) in &mut all_texts.p1() {
        if let Some(ws) = weapons.get(w.0) {
            t.0 = format!("{} {}{}\n{}", w.0 + 1, ws.name, if ws.count > 1 { format!(" x{}", ws.count) } else { String::new() }, ws.state);
            c.0 = if ws.off { Color::srgb(0.5, 0.5, 0.5) } else { Color::WHITE };
        }
    }
}
