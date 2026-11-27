//! The game simulation: ships, flight, weapons, damage, asteroids, mining, ore, combat,
//! enemy AI, the Stargate and travel. Plain Rust data stepped once per frame; the
//! `visuals` module mirrors it into Bevy entities for rendering.
//!
//! World: Y is up. Ship-local frame: +X bow, +Y up, +Z starboard.

use crate::data::{data, rgb, ship_stats, stat, Loadout, ShipStats, LAUNCHERS, TURRETS};
use crate::profile::Profile;
use crate::sound::Sounds;
use bevy::prelude::*;
use rand::Rng;
use std::collections::{HashMap, HashSet};

pub const BULLET_SPEED: f32 = 1400.0;
pub const PLASMA_SPEED: f32 = 650.0;
const SECONDARY: f32 = 0.6;
const MAX_SPEED: f32 = 700.0;
const MASS_UNIT: f32 = 300.0;
const SPREAD: f32 = 0.012;
const HEAT_COOLING: f32 = 0.35;
const HEAT_RESUME: f32 = 0.3;
const SHIELD_REGEN_DELAY: f32 = 2.0;
pub const SHIELD_FLASH_TIME: f32 = 0.35;
const SALVO_GAP: f32 = 0.12;
const ENEMY_DAMAGE: f32 = 0.75;
pub const SECTOR: f32 = 2000.0;
const SAFE_RADIUS: f32 = 1100.0;
pub const DOCK_RADIUS: f32 = 420.0;
pub const MAX_DOCK_SPEED: f32 = 140.0;
pub const CITY_SHIELD: f32 = 380.0;
pub const GATE_RADIUS: f32 = 78.0;
pub const GATE_INNER: f32 = 58.0;
pub const DHD_RANGE: f32 = 240.0;
pub const RADAR_RANGE: f32 = 3500.0;
const ORE_LIFETIME: f32 = 90.0;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Side {
    Player,
    Enemy,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    Bullet,
    Plasma,
    Beam,
    Missile,
    Drone,
}

impl Kind {
    pub fn energy(self) -> bool {
        matches!(self, Kind::Plasma | Kind::Beam | Kind::Drone)
    }
    /// Effectiveness against ships (asteroid damage is unchanged).
    pub fn ship_factor(self) -> f32 {
        match self {
            Kind::Bullet => 0.5,
            Kind::Plasma => 1.0,
            Kind::Beam => 0.35,
            Kind::Missile => 1.15,
            Kind::Drone => 1.3,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TargetMode {
    Both,
    Ships,
    Asteroids,
}

impl TargetMode {
    pub fn label(self) -> &'static str {
        match self {
            TargetMode::Both => "Ships + asteroids",
            TargetMode::Ships => "Ships",
            TargetMode::Asteroids => "Asteroids",
        }
    }
    fn next(self) -> Self {
        match self {
            TargetMode::Both => TargetMode::Ships,
            TargetMode::Ships => TargetMode::Asteroids,
            TargetMode::Asteroids => TargetMode::Both,
        }
    }
}

/// Something a weapon can lock onto.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Target {
    Ship(u64),
    Rock(u64),
    Missile(u64),
}

#[derive(Clone, Debug, Default)]
pub struct Controls {
    pub thrust: f32,
    pub strafe: f32,
    pub lift: f32,
    pub pitch: f32,
    pub yaw: f32,
    pub roll: f32,
    pub fire: bool,
    pub missiles: bool,
    pub aim_point: Option<Vec3>,
    pub aim_target: Option<Target>,
    pub lock: Option<Target>,
}

#[derive(Clone, Debug)]
pub struct Turret {
    pub kind: String,
    pub stats: crate::data::Stats,
    pub local: Vec3,
    pub aim: Vec3,
    pub cooldown: f32,
    pub target: Option<Target>,
    pub heat: f32,
    pub overheated: bool,
    pub beam_time: f32,
    pub beam: Option<(Vec3, Vec3)>,
}

#[derive(Clone, Debug)]
pub struct Launcher {
    pub kind: String,
    pub stats: crate::data::Stats,
    pub local: Vec3,
    pub cooldown: f32,
    pub salvo: Option<(u32, f32, Option<Target>)>,
}

#[derive(Clone, Debug)]
pub struct Ai {
    pub controls: Controls,
    pub mode: u8, // 0 attack, 1 break, 2 retreat
    pub mode_timer: f32,
    pub orbit: f32,
    pub orbit_timer: f32,
    pub missile_timer: f32,
    pub evade_timer: f32,
    pub evade: Vec2,
    pub aim_error: Vec3,
    pub range: f32,
    pub gun_reach: f32,
    pub projectile_speed: f32,
    pub break_dir: Vec3,
    pub retreated: bool,
}

#[derive(Clone, Debug)]
pub struct Ship {
    pub id: u64,
    pub side: Side,
    pub stats: ShipStats,
    pub pos: Vec3,
    pub vel: Vec3,
    pub rot: Quat,
    pub ang: Vec3,
    pub hp: f32,
    pub shield: f32,
    pub alive: bool,
    pub hidden: bool,
    pub stabilizer: bool,
    pub shields_enabled: bool,
    pub weapons_off: HashSet<String>,
    pub auto_target: bool,
    pub target_mode: TargetMode,
    pub damage_scale: f32,
    pub immunity: f32,
    pub hit_cooldown: f32,
    pub since_hit: f32,
    pub shield_flash: f32,
    pub hull_flash: f32,
    pub salvo_cooldown: f32,
    pub next_launcher: usize,
    pub thrust_level: f32,
    pub turrets: Vec<Turret>,
    pub launchers: Vec<Launcher>,
    pub missile_lock: Option<Target>,
    pub level: u32,
    pub bounty: u32,
    pub ai: Option<Ai>,
    pub firing: bool,
    pub minigun_firing: bool,
    pub beaming: bool,
    pub counted: bool,
    pub shield_level: f32,
}

impl Ship {
    pub fn new(id: u64, stats: ShipStats, side: Side) -> Ship {
        let u = stats.hull.module_scale;
        let turrets = stats
            .modules
            .iter()
            .filter(|m| TURRETS.contains(&m.kind.as_str()))
            .map(|m| Turret {
                kind: m.kind.clone(), stats: m.stats.clone(), local: Vec3::new(m.slot.x, 2.0 * u, m.slot.y),
                aim: Vec3::X, cooldown: 0.0, target: None, heat: 0.0, overheated: false, beam_time: 0.0, beam: None,
            })
            .collect();
        let launchers = stats
            .modules
            .iter()
            .filter(|m| LAUNCHERS.contains(&m.kind.as_str()))
            .map(|m| Launcher { kind: m.kind.clone(), stats: m.stats.clone(), local: Vec3::new(m.slot.x, 1.0, m.slot.y), cooldown: 0.0, salvo: None })
            .collect();
        Ship {
            id, side, hp: stats.max_hull, shield: stats.max_shield, stats, pos: Vec3::ZERO, vel: Vec3::ZERO, rot: Quat::IDENTITY,
            ang: Vec3::ZERO, alive: true, hidden: false, stabilizer: side == Side::Player, shields_enabled: true,
            weapons_off: HashSet::new(), auto_target: true, target_mode: TargetMode::Both, damage_scale: 1.0, immunity: 1.5,
            hit_cooldown: 0.0, since_hit: SHIELD_REGEN_DELAY, shield_flash: 0.0, hull_flash: 0.0, salvo_cooldown: 0.0,
            next_launcher: 0, thrust_level: 0.0, turrets, launchers, missile_lock: None, level: 1, bounty: 0, ai: None,
            firing: false, minigun_firing: false, beaming: false, counted: false, shield_level: 0.0,
        }
    }

    pub fn radius(&self) -> f32 {
        self.stats.hull.radius
    }
    pub fn mass(&self) -> f32 {
        self.stats.mass * MASS_UNIT
    }
    pub fn forward(&self) -> Vec3 {
        self.rot * Vec3::X
    }
    pub fn to_world(&self, local: Vec3) -> Vec3 {
        self.pos + self.rot * local
    }
    pub fn shield_up(&self) -> bool {
        self.shields_enabled && self.alive && self.stats.max_shield > 0.0 && self.shield > 0.5
    }
    pub fn magnet_range(&self) -> f32 {
        self.stats.magnet_range + (self.radius() - 30.0).max(0.0) * 0.8 + 40.0
    }
    pub fn collect_radius(&self) -> f32 {
        self.radius() * 0.6 + 12.0
    }
    /// Shield ellipsoid: centre and radii in the ship frame.
    pub fn shield_shape(&self) -> (Vec3, Vec3) {
        let s = &self.stats.hull.shield;
        (Vec3::new(s.x, 0.0, s.y), Vec3::new(s.rx, (s.rx.min(s.ry) * 0.7).max(8.0), s.ry))
    }
    /// Is a sphere (point p, radius r) touching the shield bubble? Returns the outward normal.
    pub fn shield_contact(&self, p: Vec3, r: f32) -> Option<(Vec3, f32)> {
        let (c, radii) = self.shield_shape();
        let local = self.rot.inverse() * (p - self.pos) - c;
        let l = local / radii;
        let k = l.length().max(0.0001);
        let scale = (radii.x + radii.y + radii.z) / 3.0;
        let gap = (k - 1.0) * scale;
        if gap > r {
            return None;
        }
        let normal = self.rot * (l / (radii * k)).normalize_or_zero();
        Some((normal, r - gap))
    }
    pub fn colliders(&self) -> Vec<(Vec3, f32)> {
        self.stats.hull.colliders.iter().map(|c| (self.to_world(Vec3::new(c[0], 0.0, c[1])), c[2])).collect()
    }
    pub fn weapon_status(&self) -> Vec<WeaponStatus> {
        let mut groups: Vec<WeaponStatus> = Vec::new();
        let mut push = |kind: &str, ready: f32, state: &'static str| {
            if let Some(g) = groups.iter_mut().find(|g| g.kind == kind) {
                g.ready += ready.clamp(0.0, 1.0);
                g.count += 1;
                if state != "READY" {
                    g.state = state;
                }
            } else {
                let def = data().module(kind);
                groups.push(WeaponStatus { kind: kind.to_string(), name: def.short.clone(), color: rgb(&def.color), ready: ready.clamp(0.0, 1.0), count: 1, state, off: false });
            }
        };
        for t in &self.turrets {
            let (ready, state) = match t.kind.as_str() {
                "minigun" => (1.0 - t.heat, if t.overheated { "OVERHEAT" } else if t.heat > 0.6 { "HOT" } else { "READY" }),
                "beam" if t.beam_time > 0.0 => (t.beam_time / stat(&t.stats, "burst"), "FIRING"),
                "beam" if t.cooldown > 0.0 => (1.0 - t.cooldown / stat(&t.stats, "cooldown"), "CHARGING"),
                "staff" if t.cooldown > 0.0 => (1.0 - t.cooldown * stat(&t.stats, "fireRate"), "RELOAD"),
                _ => (1.0, "READY"),
            };
            push(&t.kind, ready, state);
        }
        for l in &self.launchers {
            if l.cooldown > 0.0 {
                push(&l.kind, 1.0 - l.cooldown / stat(&l.stats, "cooldown"), "RELOAD");
            } else {
                push(&l.kind, 1.0, "READY");
            }
        }
        for g in groups.iter_mut() {
            g.ready /= g.count as f32;
            if self.weapons_off.contains(&g.kind) {
                g.off = true;
                g.state = "OFF";
            }
        }
        groups
    }
}

#[derive(Clone, Debug)]
pub struct WeaponStatus {
    pub kind: String,
    pub name: String,
    pub color: [f32; 3],
    pub ready: f32,
    pub count: u32,
    pub state: &'static str,
    pub off: bool,
}

#[derive(Clone, Debug)]
pub struct Rock {
    pub id: u64,
    pub pos: Vec3,
    pub vel: Vec3,
    pub radius: f32,
    pub variant: usize,
    pub composition: Vec<(String, f32)>,
    pub axis: Vec3,
    pub angle: f32,
    pub spin: f32,
    pub wear: f32,
    pub ore_progress: f32,
    pub flash: f32,
    pub grace: f32,
    pub dead: bool,
}

impl Rock {
    pub fn mass(&self) -> f32 {
        self.radius * self.radius * self.radius * 0.05
    }
    pub fn dominant(&self) -> &str {
        self.composition.iter().filter(|(id, _)| id != "rock").max_by(|a, b| a.1.total_cmp(&b.1)).map(|c| c.0.as_str()).unwrap_or("rock")
    }
    fn pick_ore(&self) -> String {
        let mut roll = rand::random::<f32>();
        for (id, share) in &self.composition {
            roll -= share;
            if roll <= 0.0 {
                return id.clone();
            }
        }
        "rock".into()
    }
}

#[derive(Clone, Debug)]
pub struct Ore {
    pub id: u64,
    pub pos: Vec3,
    pub vel: Vec3,
    pub material: String,
    pub life: f32,
    pub angle: f32,
    pub spin: f32,
    pub tractored: bool,
    pub dead: bool,
}

#[derive(Clone, Debug)]
pub struct Bullet {
    pub pos: Vec3,
    pub prev: Vec3,
    pub vel: Vec3,
    pub damage: f32,
    pub kind: Kind,
    pub side: Side,
    pub life: f32,
    pub age: f32,
    pub splash: f32,
    pub mass: f32,
    pub dead: bool,
}

#[derive(Clone, Debug)]
pub struct Missile {
    pub id: u64,
    pub kind: Kind,
    pub pos: Vec3,
    pub vel: Vec3,
    pub dir: Vec3,
    pub damage: f32,
    pub blast: f32,
    pub target: Option<Target>,
    pub homing: f32,
    pub side: Side,
    pub life: f32,
    pub retarget: f32,
    pub trail: f32,
    pub mode: TargetMode,
    pub dead: bool,
}

/// A particle effect request for the renderer.
#[derive(Clone, Debug)]
pub struct Particle {
    pub pos: Vec3,
    pub vel: Vec3,
    pub life: f32,
    pub size: f32,
    pub grow: f32,
    pub color: [f32; 3],
    pub glow: f32,
    pub drag: f32,
}

#[derive(Clone, Debug)]
pub struct FloatText {
    pub pos: Vec3,
    pub text: String,
    pub color: [f32; 3],
    pub life: f32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum GateState {
    Idle,
    Dialing,
    Opening,
    Kawoosh,
    Open,
    Closing,
}

#[derive(Clone, Debug)]
pub struct Gate {
    pub pos: Vec3,
    pub state: GateState,
    pub clock: f32,
    pub timer: f32,
    pub locked: u32,
    pub chevron_times: Vec<f32>,
    pub lock_time: f32,
    pub open_time: f32,
    pub ring_stop: f32,
    pub spin: f32,
    pub spin_from: f32,
    pub spin_to: f32,
    pub kawoosh: f32,
    pub outgoing: bool,
    pub target: Option<String>,
    pub was_open: bool,
}

impl Gate {
    fn new(pos: Vec3) -> Gate {
        Gate {
            pos, state: GateState::Idle, clock: 0.0, timer: 0.0, locked: 0, chevron_times: vec![], lock_time: 0.0, open_time: 0.0,
            ring_stop: 0.0, spin: 0.0, spin_from: 0.0, spin_to: 0.0, kawoosh: 0.0, outgoing: false, target: None, was_open: false,
        }
    }
    pub fn busy(&self) -> bool {
        self.state != GateState::Idle
    }
    /// Lamps lit: chevrons 1-6 then the top one (index into the 9 chevrons).
    pub fn chevron_lit(&self, index: usize) -> bool {
        const ORDER: [usize; 7] = [1, 2, 3, 6, 7, 8, 0];
        ORDER.iter().position(|&i| i == index).map_or(false, |o| (o as u32) < self.locked)
    }
}

#[derive(Clone, Debug)]
pub enum Transition {
    Gate { t: f32, target: String },
    Hyper { t: f32, phase: u8, target: String, duration: f32, distance: f32, window: Vec3 },
}

/// The whole running game.
#[derive(Resource)]
pub struct Sim {
    pub next_id: u64,
    pub system: String,
    pub time: f32,
    pub ships: Vec<Ship>,
    pub rocks: Vec<Rock>,
    pub ores: Vec<Ore>,
    pub bullets: Vec<Bullet>,
    pub missiles: Vec<Missile>,
    pub particles: Vec<Particle>,
    pub floats: Vec<FloatText>,
    pub gate: Gate,
    pub dhd_pos: Vec3,
    pub station: Option<Vec3>,
    pub transition: Option<Transition>,
    pub banner: String,
    pub banner_timer: f32,
    pub enemy_timer: f32,
    pub field_timer: f32,
    pub game_over_timer: f32,
    pub tractor_count: usize,
    pub can_dock: bool,
    pub near_dhd: bool,
    pub controls: Controls,
    pub seed: u32,
    dormant: HashMap<(i32, i32, i32), Vec<Rock>>,
    seen: HashSet<(i32, i32, i32)>,
    active: HashSet<(i32, i32, i32)>,
    pub hold_full_warned: bool,
    pub system_changed: bool,
    pub explosions: Vec<(Vec3, f32)>,
}

impl Sim {
    pub fn new(profile: &Profile) -> Sim {
        let stats = ship_stats(&profile.hull, &profile.current_loadout());
        let ship = Ship::new(1, stats, Side::Player);
        let mut sim = Sim {
            next_id: ((rand::random::<u32>() as u64) << 20) + 100, system: "lantea".into(), time: 0.0, ships: vec![ship], rocks: vec![], ores: vec![], bullets: vec![],
            missiles: vec![], particles: vec![], floats: vec![], gate: Gate::new(Vec3::ZERO), dhd_pos: Vec3::ZERO, station: None,
            transition: None, banner: String::new(), banner_timer: 0.0, enemy_timer: 25.0, field_timer: 0.0, game_over_timer: 0.0,
            tractor_count: 0, can_dock: false, near_dhd: false, controls: Controls::default(), seed: profile.seed,
            dormant: HashMap::new(), seen: HashSet::new(), active: HashSet::new(), hold_full_warned: false, system_changed: true,
            explosions: vec![],
        };
        sim.enter_system("lantea", None);
        sim
    }

    fn id(&mut self) -> u64 {
        self.next_id += 1;
        self.next_id
    }

    pub fn banner(&mut self, text: impl Into<String>, time: f32) {
        self.banner = text.into();
        self.banner_timer = time;
    }

    pub fn player(&self) -> &Ship {
        &self.ships[0]
    }
    pub fn player_mut(&mut self) -> &mut Ship {
        &mut self.ships[0]
    }

    // ------------------------------------------------------------ systems

    pub fn enter_system(&mut self, id: &str, how: Option<&str>) {
        let sys = data().system(id);
        self.system = sys.id.clone();
        self.rocks.clear();
        self.ores.clear();
        self.bullets.clear();
        self.missiles.clear();
        self.particles.clear();
        self.ships.truncate(1);
        self.dormant.clear();
        self.seen.clear();
        self.active.clear();
        self.gate = Gate::new(Vec3::new(sys.gate.x, 0.0, sys.gate.y));
        self.dhd_pos = self.gate.pos + Vec3::new(260.0, -20.0, 0.0);
        self.station = if sys.station { Some(Vec3::ZERO) } else { None };
        self.transition = None;
        self.enemy_timer = 20.0 + rand::random::<f32>() * 15.0;
        self.system_changed = true;
        let gate_pos = self.gate.pos;
        let p = self.player_mut();
        p.vel = Vec3::ZERO;
        p.ang = Vec3::ZERO;
        match how {
            Some("gate") => {
                p.pos = gate_pos + Vec3::new(0.0, 0.0, 40.0 + p.stats.hull.radius * 3.0 + 60.0);
                p.rot = Quat::from_rotation_arc(Vec3::X, Vec3::Z);
                p.vel = Vec3::Z * 160.0;
                self.gate.state = GateState::Open;
                self.gate.outgoing = false;
                self.gate.locked = 7;
                self.gate.timer = 4.0;
                self.gate.was_open = true;
            }
            Some("hyper") => {
                let a = rand::random::<f32>() * std::f32::consts::TAU;
                p.pos = gate_pos + Vec3::new(a.cos() * 1400.0, 200.0, a.sin() * 1400.0);
                let toward = (gate_pos - p.pos).normalize();
                p.rot = Quat::from_rotation_arc(Vec3::X, toward);
                p.vel = toward * 240.0;
            }
            _ => {
                p.pos = Vec3::new(CITY_SHIELD + 140.0 + p.stats.hull.radius * 1.6, 60.0, 0.0);
                p.rot = Quat::IDENTITY;
            }
        }
        let (x, y, z) = (self.player().pos.x, self.player().pos.y, self.player().pos.z);
        self.update_field(Vec3::new(x, y, z));
        let name = sys.name.clone();
        self.banner(if how.is_some() { format!("Arrived at {}", name) } else { "Undocked from Atlantis. Happy mining!".into() }, 2.5);
    }

    fn sector_rocks(&mut self, sx: i32, sy: i32, sz: i32) -> Vec<Rock> {
        let mut rng = SeededRng::new(self.seed ^ (sx as u32).wrapping_mul(73856093) ^ (sy as u32).wrapping_mul(19349663) ^ (sz as u32).wrapping_mul(83492791)
            ^ self.system.bytes().fold(7u32, |h, b| h.wrapping_mul(31).wrapping_add(b as u32)));
        let sys = data().system(&self.system);
        let distance = sx.abs().max(sy.abs()).max(sz.abs()) as f32;
        let dense = rng.next() < 0.18;
        let count = if dense { 9 + (rng.next() * 8.0) as usize } else { 2 + (rng.next() * 6.0) as usize };
        let center = Vec3::new((sx as f32 + 0.2 + rng.next() * 0.6) * SECTOR, (sy as f32 + 0.2 + rng.next() * 0.6) * SECTOR, (sz as f32 + 0.2 + rng.next() * 0.6) * SECTOR);
        let mut out = vec![];
        let safe: Vec<Vec3> = [Some(self.gate.pos), self.station].into_iter().flatten().collect();
        for _ in 0..count {
            let pos = if dense {
                center + Vec3::new(rng.next() - 0.5, rng.next() - 0.5, rng.next() - 0.5) * 900.0
            } else {
                Vec3::new((sx as f32 + rng.next()) * SECTOR, (sy as f32 + rng.next()) * SECTOR, (sz as f32 + rng.next()) * SECTOR)
            };
            if safe.iter().any(|s| s.distance(pos) < SAFE_RADIUS) {
                continue;
            }
            let giant = rng.next() < 0.05;
            let radius = if giant { 110.0 + rng.next() * 110.0 } else { 14.0 + rng.next() * rng.next() * 95.0 };
            // Material by distance and the system's riches, like the 2D game.
            let options: Vec<(String, f32)> = data()
                .materials
                .iter()
                .filter_map(|m| {
                    let bias = *sys.materials.get(&m.id).unwrap_or(&1.0);
                    let min = (m.min_sector - if bias >= 2.0 { 4.0 } else { 0.0 }).max(0.0);
                    if distance < min {
                        return None;
                    }
                    Some((m.id.clone(), (m.weight + m.growth * (distance - min)) * bias))
                })
                .collect();
            let total: f32 = options.iter().map(|o| o.1).sum();
            let mut roll = rng.next() * total;
            let mut main = "rock".to_string();
            for (id, w) in &options {
                roll -= w;
                if roll <= 0.0 {
                    main = id.clone();
                    break;
                }
            }
            let composition = if main == "rock" {
                vec![("rock".to_string(), 1.0)]
            } else {
                let r = 0.45 + rng.next() * 0.25;
                vec![("rock".to_string(), r), (main, 1.0 - r)]
            };
            let axis = Vec3::new(rng.next() - 0.5, rng.next() - 0.5, rng.next() - 0.5).normalize_or(Vec3::Y);
            let id = self.id();
            out.push(Rock {
                id, pos, vel: Vec3::new(rng.next() - 0.5, rng.next() - 0.5, rng.next() - 0.5) * 16.0, radius,
                variant: (rng.next() * crate::meshes::ROCK_VARIANTS as f32) as usize % crate::meshes::ROCK_VARIANTS,
                composition, axis, angle: rng.next() * 6.0, spin: (rng.next() - 0.5) * 30.0 / (radius + 10.0), wear: 0.0,
                ore_progress: 0.0, flash: 0.0, grace: 0.0, dead: false,
            });
        }
        out
    }

    /// Stream asteroid sectors in and out around `p`.
    fn update_field(&mut self, p: Vec3) {
        let c = ((p.x / SECTOR).floor() as i32, (p.y / SECTOR).floor() as i32, (p.z / SECTOR).floor() as i32);
        let mut wanted = HashSet::new();
        for dx in -1..=1 {
            for dy in -1..=1 {
                for dz in -1..=1 {
                    wanted.insert((c.0 + dx, c.1 + dy, c.2 + dz));
                }
            }
        }
        let rocks = std::mem::take(&mut self.rocks);
        for rock in rocks {
            if rock.dead {
                continue;
            }
            let key = ((rock.pos.x / SECTOR).floor() as i32, (rock.pos.y / SECTOR).floor() as i32, (rock.pos.z / SECTOR).floor() as i32);
            if wanted.contains(&key) {
                self.rocks.push(rock);
            } else {
                self.dormant.entry(key).or_default().push(rock);
            }
        }
        self.active.retain(|k| wanted.contains(k));
        for key in wanted {
            if self.active.contains(&key) {
                continue;
            }
            self.active.insert(key);
            if !self.seen.contains(&key) {
                self.seen.insert(key);
                let new = self.sector_rocks(key.0, key.1, key.2);
                self.rocks.extend(new);
            }
            if let Some(list) = self.dormant.remove(&key) {
                self.rocks.extend(list);
            }
        }
    }

    // ------------------------------------------------------------ effects

    pub fn spark(&mut self, pos: Vec3, vel: Vec3, count: usize, min_speed: f32, max_speed: f32, life: f32, size: f32, color: [f32; 3], glow: f32) {
        let mut rng = rand::thread_rng();
        for _ in 0..count {
            let d = Vec3::new(rng.gen::<f32>() - 0.5, rng.gen::<f32>() - 0.5, rng.gen::<f32>() - 0.5).normalize_or(Vec3::Y);
            self.particles.push(Particle {
                pos, vel: vel + d * rng.gen_range(min_speed..max_speed.max(min_speed + 0.1)), life: life * rng.gen_range(0.6..1.2),
                size: size * rng.gen_range(0.7..1.3), grow: 0.0, color, glow, drag: 1.0,
            });
        }
    }

    pub fn dust(&mut self, pos: Vec3, vel: Vec3, count: usize, size: f32, color: [f32; 3]) {
        let mut rng = rand::thread_rng();
        for _ in 0..count {
            let d = Vec3::new(rng.gen::<f32>() - 0.5, rng.gen::<f32>() - 0.5, rng.gen::<f32>() - 0.5);
            self.particles.push(Particle { pos, vel: vel + d * 70.0, life: rng.gen_range(1.0..2.4), size, grow: size * 0.8, color, glow: 0.0, drag: 0.7 });
        }
    }

    pub fn explosion(&mut self, pos: Vec3, vel: Vec3, size: f32, color: [f32; 3]) {
        self.spark(pos, vel, (12.0 + size * 0.6) as usize, 30.0, 60.0 + size * 5.0, 0.7, 5.0 + size * 0.12, color, 3.0);
        self.spark(pos, vel, (10.0 + size * 0.4) as usize, 80.0, 180.0 + size * 6.0, 0.7, 2.0, [1.0, 0.86, 0.63], 4.0);
        self.particles.push(Particle { pos, vel: Vec3::ZERO, life: 0.35, size: size * 0.8 + 10.0, grow: size * 2.0, color: [1.0, 0.95, 0.85], glow: 6.0, drag: 0.0 });
        self.dust(pos, vel * 0.5, (4.0 + size * 0.15) as usize, 10.0 + size * 0.2, [0.43, 0.41, 0.39]);
        self.explosions.push((pos, size));
    }

    fn float(&mut self, pos: Vec3, text: String, color: [f32; 3]) {
        self.floats.push(FloatText { pos, text, color, life: 1.4 });
    }

    // ------------------------------------------------------------ lookups

    pub fn target_info(&self, t: Target) -> Option<(Vec3, Vec3, f32)> {
        match t {
            Target::Ship(id) => self.ships.iter().find(|s| s.id == id && s.alive && !s.hidden).map(|s| (s.pos, s.vel, s.radius())),
            Target::Rock(id) => self.rocks.iter().find(|r| r.id == id && !r.dead).map(|r| (r.pos, r.vel, r.radius)),
            Target::Missile(id) => self.missiles.iter().find(|m| m.id == id && !m.dead).map(|m| (m.pos, m.vel, 6.0)),
        }
    }

    fn hostile_ships(&self, side: Side) -> Vec<usize> {
        let in_transit = self.transition.is_some();
        (0..self.ships.len())
            .filter(|&i| {
                let s = &self.ships[i];
                s.side != side && s.alive && !s.hidden && !(s.side == Side::Player && in_transit)
            })
            .collect()
    }

    fn nearest_ship(&self, p: Vec3, side: Side, range: f32) -> Option<Target> {
        self.hostile_ships(side)
            .into_iter()
            .map(|i| (i, self.ships[i].pos.distance(p) - self.ships[i].radius() * 0.8))
            .filter(|(_, d)| *d < range)
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(i, _)| Target::Ship(self.ships[i].id))
    }

    fn nearest_rock(&self, p: Vec3, range: f32) -> Option<Target> {
        self.rocks
            .iter()
            .filter(|r| !r.dead)
            .map(|r| (r.id, r.pos.distance(p) - r.radius))
            .filter(|(_, d)| *d < range)
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(id, _)| Target::Rock(id))
    }

    fn nearest_missile(&self, p: Vec3, side: Side, kind: Kind, range: f32, closing_only: bool) -> Option<Target> {
        self.missiles
            .iter()
            .filter(|m| !m.dead && m.side != side && m.kind == kind)
            .filter(|m| !closing_only || m.vel.dot((p - m.pos).normalize_or_zero()) > 100.0)
            .map(|m| (m.id, m.pos.distance(p)))
            .filter(|(_, d)| *d < range)
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(id, _)| Target::Missile(id))
    }

    /// Beam / aim ray against asteroids and (optionally) ships of the other side.
    pub fn raycast(&self, origin: Vec3, dir: Vec3, range: f32, side: Option<Side>) -> (f32, Option<Target>) {
        let mut best = range;
        let mut hit = None;
        let mut test = |center: Vec3, r: f32, t: Target| {
            let o = center - origin;
            let along = o.dot(dir);
            if along < 0.0 || along - r > best {
                return;
            }
            let d2 = o.length_squared() - along * along;
            if d2 > r * r {
                return;
            }
            let t_hit = (along - (r * r - d2).sqrt()).max(0.0);
            if t_hit < best {
                best = t_hit;
                hit = Some(t);
            }
        };
        for r in self.rocks.iter().filter(|r| !r.dead) {
            test(r.pos, r.radius * 0.85, Target::Rock(r.id));
        }
        for s in &self.ships {
            if !s.alive || s.hidden {
                continue;
            }
            if let Some(side) = side {
                if s.side == side {
                    continue;
                }
            } else if s.side == Side::Player {
                continue;
            }
            let (_, radii) = s.shield_shape();
            let r = if s.shield_up() { radii.x.max(radii.z) * 0.9 } else { s.radius() * 0.7 };
            test(s.pos, r, Target::Ship(s.id));
        }
        (best, hit)
    }

    // ------------------------------------------------------------ the step

    pub fn step(&mut self, dt: f32, profile: &mut Profile, sounds: &mut Sounds) {
        self.time += dt;
        let prev_z = self.player().pos.z;
        let in_tunnel = matches!(self.transition, Some(Transition::Gate { .. })) || matches!(self.transition, Some(Transition::Hyper { phase: 1, .. }));
        if !in_tunnel {
            let mut controls = self.controls.clone();
            if self.transition.is_some() {
                controls.fire = false;
                controls.missiles = false;
                controls.thrust = 0.0;
            }
            self.update_ship(0, dt, &controls, sounds);
        }
        self.update_enemies(dt, sounds);
        for r in self.rocks.iter_mut() {
            r.pos += r.vel * dt;
            r.angle += r.spin * dt;
            r.flash -= dt;
            r.grace -= dt;
        }
        self.update_bullets(dt, sounds);
        self.update_missiles(dt, sounds);
        self.update_ores(dt, profile, sounds);
        for i in 0..self.ships.len() {
            self.collide_rocks(i, sounds);
        }
        self.ship_bumps();
        self.enemy_losses(profile, sounds);
        // Atlantis city shield keeps asteroids out.
        if let Some(st) = self.station {
            for r in self.rocks.iter_mut() {
                let reach = CITY_SHIELD + 60.0 + r.radius;
                let d = r.pos.distance(st);
                if d < reach {
                    let n = (r.pos - st).normalize_or(Vec3::Y);
                    r.pos = st + n * reach;
                    let vn = r.vel.dot(n);
                    if vn < 0.0 {
                        r.vel -= n * vn * 1.6;
                    }
                }
            }
        }
        self.rocks.retain(|r| !r.dead);
        self.update_gate(dt, sounds);
        self.check_gate_travel(prev_z, sounds);
        self.field_timer -= dt;
        if self.field_timer <= 0.0 {
            self.field_timer = 0.5;
            let p = self.player().pos;
            self.update_field(p);
            self.ores.retain(|o| o.pos.distance(p) < 6000.0);
        }
        let p = self.player().pos;
        let alive = self.player().alive;
        self.can_dock = alive && self.station.map_or(false, |s| s.distance(p) < DOCK_RADIUS);
        self.near_dhd = alive && self.dhd_pos.distance(p) < DHD_RANGE;
        for f in self.floats.iter_mut() {
            f.life -= dt;
            f.pos.y += 20.0 * dt;
        }
        self.floats.retain(|f| f.life > 0.0);
        self.banner_timer -= dt;
        if !alive {
            if self.game_over_timer == 0.0 {
                let (pos, vel, r) = (self.player().pos, self.player().vel, self.player().radius());
                self.explosion(pos, vel, r * 2.5, [1.0, 0.7, 0.43]);
            }
            self.game_over_timer += dt;
        }
        // Particles.
        for p in self.particles.iter_mut() {
            p.life -= dt;
            let k = (1.0 - p.drag * dt).max(0.0);
            p.vel *= k;
            p.pos += p.vel * dt;
            p.size += p.grow * dt;
        }
        self.particles.retain(|p| p.life > 0.0);
        if self.particles.len() > 2500 {
            let excess = self.particles.len() - 2500;
            self.particles.drain(0..excess);
        }
        self.update_transition(dt, sounds);
    }

    // ------------------------------------------------------------ ships

    fn update_ship(&mut self, index: usize, dt: f32, c: &Controls, sounds: &mut Sounds) {
        let now = self.time;
        {
            let s = &mut self.ships[index];
            if !s.alive {
                s.firing = false;
                s.minigun_firing = false;
                s.beaming = false;
                return;
            }
            s.hit_cooldown -= dt;
            s.immunity -= dt;
            s.shield_flash -= dt;
            s.hull_flash -= dt;
            s.salvo_cooldown -= dt;
            s.since_hit += dt;
            if s.since_hit > SHIELD_REGEN_DELAY && s.shield < s.stats.max_shield {
                s.shield = (s.shield + s.stats.shield_regen * dt).min(s.stats.max_shield);
            }
            let target = if s.shield_up() { 1.0 } else { 0.0 };
            s.shield_level += (target - s.shield_level) * (dt * 4.0).min(1.0);
            // Rotation: controls set a wanted turn rate, the thrusters chase it.
            let max_turn = s.stats.max_turn;
            let accel = s.stats.angular_acceleration * 1.2;
            let want = Vec3::new(c.roll.clamp(-1.0, 1.0) * max_turn * 1.3, -c.yaw.clamp(-1.0, 1.0) * max_turn, c.pitch.clamp(-1.0, 1.0) * max_turn);
            let diff = want - s.ang;
            s.ang += diff.clamp(Vec3::splat(-accel * dt), Vec3::splat(accel * dt));
            if s.ang.length_squared() > 1e-10 {
                s.rot = (s.rot * Quat::from_scaled_axis(s.ang * dt)).normalize();
            }
            // Thrust in the ship's frame.
            let main = s.stats.acceleration;
            let side = main * SECONDARY;
            let thrust = c.thrust.clamp(-1.0, 1.0);
            let local = Vec3::new(if thrust > 0.0 { thrust * main } else { thrust * side }, c.lift.clamp(-1.0, 1.0) * side, c.strafe.clamp(-1.0, 1.0) * side);
            let mut force = s.rot * local;
            s.thrust_level += (thrust.max(0.0) - s.thrust_level) * (dt * 8.0).min(1.0);
            // Stabilizer: cancel drift the pilot isn't asking for.
            if s.stabilizer {
                let mut drift = s.vel;
                let commanded = force.length();
                if commanded > 0.0 {
                    let dir = force / commanded;
                    drift -= dir * drift.dot(dir).max(0.0);
                }
                let d = drift.length();
                if d > 1.0 {
                    force -= drift / d * side.min(d / dt);
                }
            }
            s.vel += force * dt;
            let speed = s.vel.length();
            if speed > MAX_SPEED {
                s.vel *= MAX_SPEED / speed;
            }
            s.pos += s.vel * dt;
        }
        self.update_targeting(index, c);
        self.update_turrets(index, dt, c, sounds, now);
        self.update_launchers(index, dt, c, sounds);
    }

    fn update_targeting(&mut self, index: usize, c: &Controls) {
        let s = &self.ships[index];
        let Some((range, _)) = s.stats.guidance else {
            let s = &mut self.ships[index];
            s.missile_lock = None;
            for t in s.turrets.iter_mut() {
                t.target = None;
            }
            return;
        };
        let range = range + s.radius();
        let side = s.side;
        let mode = s.target_mode;
        let pos = s.pos;
        let aim = c.aim_point.unwrap_or(pos);
        let ships_ok = mode != TargetMode::Asteroids;
        let rocks_ok = mode != TargetMode::Ships;
        let aim_target = c.aim_target.filter(|t| match t {
            Target::Ship(_) => ships_ok,
            Target::Rock(_) => rocks_ok,
            _ => false,
        });
        let lock = aim_target
            .filter(|t| matches!(t, Target::Ship(_)))
            .or_else(|| if ships_ok { self.nearest_ship(aim, side, 250.0) } else { None })
            .or(aim_target)
            .or_else(|| if ships_ok { self.nearest_ship(pos, side, range * 1.8) } else { None })
            .or_else(|| if rocks_ok { self.nearest_rock(pos, range) } else { None });
        let auto = s.auto_target;
        let turret_targets: Vec<Option<Target>> = s
            .turrets
            .iter()
            .map(|t| {
                if !auto {
                    return None;
                }
                let p = s.to_world(t.local);
                let reach = if t.kind == "beam" { range.min(stat(&t.stats, "range")) } else { range };
                let ship_reach = if t.kind == "beam" { stat(&t.stats, "range") } else { range.max(800.0) };
                (if t.kind == "minigun" { self.nearest_missile(p, side, Kind::Missile, 450.0 + s.radius(), true) } else { None })
                    .or_else(|| if ships_ok { self.nearest_ship(p, side, ship_reach) } else { None })
                    .or_else(|| if rocks_ok { self.nearest_rock(p, reach) } else { None })
            })
            .collect();
        let s = &mut self.ships[index];
        s.missile_lock = lock;
        for (t, target) in s.turrets.iter_mut().zip(turret_targets) {
            t.target = target;
        }
    }

    fn update_turrets(&mut self, index: usize, dt: f32, c: &Controls, sounds: &mut Sounds, now: f32) {
        let n = self.ships[index].turrets.len();
        {
            let s = &mut self.ships[index];
            s.firing = false;
            s.minigun_firing = false;
            s.beaming = false;
        }
        for ti in 0..n {
            let (kind, p, target, enabled) = {
                let s = &mut self.ships[index];
                let t = &mut s.turrets[ti];
                t.cooldown -= dt;
                t.beam = None;
                if t.kind == "minigun" {
                    t.heat = (t.heat - HEAT_COOLING * dt).max(0.0);
                    if t.overheated && t.heat <= HEAT_RESUME {
                        t.overheated = false;
                    }
                }
                let kind = t.kind.clone();
                let target = t.target;
                let local = t.local;
                let enabled = !s.weapons_off.contains(&kind);
                (kind, s.to_world(local), target, enabled)
            };
            let mut aim_point = c.aim_point;
            let mut should_fire = c.fire && enabled;
            if !c.fire && enabled {
                if let Some(info) = target.and_then(|t| self.target_info(t)) {
                    let speed = if kind == "staff" { PLASMA_SPEED } else { BULLET_SPEED };
                    let time = if kind == "beam" { 0.0 } else { info.0.distance(p) / speed };
                    aim_point = Some(info.0 + info.1 * time);
                    should_fire = true;
                }
            }
            let forward = self.ships[index].forward();
            {
                let t = &mut self.ships[index].turrets[ti];
                t.aim = aim_point.map(|a| (a - p).normalize_or(forward)).unwrap_or(forward);
            }
            if kind == "beam" {
                self.update_beam(index, ti, dt, p, should_fire && aim_point.is_some(), sounds);
                continue;
            }
            let (overheated, cooldown) = {
                let t = &self.ships[index].turrets[ti];
                (t.overheated, t.cooldown)
            };
            if !should_fire || aim_point.is_none() || overheated {
                continue;
            }
            self.ships[index].firing = true;
            if kind == "minigun" {
                self.ships[index].minigun_firing = true;
            }
            if cooldown > 0.0 {
                continue;
            }
            if kind == "minigun" {
                self.fire_minigun(index, ti, p, sounds, now);
            } else {
                self.fire_staff(index, ti, p, sounds, now);
            }
        }
    }

    fn jitter(dir: Vec3, amount: f32) -> Vec3 {
        let mut rng = rand::thread_rng();
        (dir + Vec3::new(rng.gen_range(-amount..amount), rng.gen_range(-amount..amount), rng.gen_range(-amount..amount))).normalize_or(dir)
    }

    fn fire_minigun(&mut self, index: usize, ti: usize, p: Vec3, sounds: &mut Sounds, now: f32) {
        let s = &mut self.ships[index];
        let side = s.side;
        let vel = s.vel;
        let scale = s.damage_scale;
        let barrel = 9.0 * s.stats.hull.module_scale;
        let mass = s.stats.mass;
        let t = &mut s.turrets[ti];
        let fire_rate = stat(&t.stats, "fireRate");
        t.cooldown = t.cooldown.max(0.0) + 1.0 / fire_rate;
        let dir = Self::jitter(t.aim, SPREAD);
        let speed = BULLET_SPEED + vel.dot(dir).max(0.0);
        let damage = stat(&t.stats, "damage") * scale;
        t.heat += 1.0 / stat(&t.stats, "heatShots") + HEAT_COOLING / fire_rate;
        let overheated = if t.heat >= 1.0 {
            t.heat = 1.0;
            t.overheated = true;
            true
        } else {
            false
        };
        s.vel -= dir * 0.8 / mass;
        let start = p + dir * barrel;
        self.bullets.push(Bullet { pos: start, prev: start, vel: dir * speed, damage, kind: Kind::Bullet, side, life: 1.6, age: 0.0, splash: 0.0, mass: 1.2, dead: false });
        self.particles.push(Particle { pos: start, vel, life: 0.05, size: 6.0, grow: 0.0, color: [1.0, 0.86, 0.6], glow: 5.0, drag: 0.0 });
        if side == Side::Player || rand::random::<f32>() < 0.3 {
            sounds.play_limited("railgun", if side == Side::Player { 0.45 } else { 0.25 }, 0.94 + rand::random::<f32>() * 0.12, 0.035, now);
        }
        if overheated && side == Side::Player {
            sounds.play("button", 0.4, 0.8);
        }
    }

    fn fire_staff(&mut self, index: usize, ti: usize, p: Vec3, sounds: &mut Sounds, now: f32) {
        let s = &mut self.ships[index];
        let side = s.side;
        let vel = s.vel;
        let scale = s.damage_scale;
        let barrel = 8.0 * s.stats.hull.module_scale;
        let mass = s.stats.mass;
        let t = &mut s.turrets[ti];
        t.cooldown = 1.0 / stat(&t.stats, "fireRate");
        let dir = t.aim;
        let speed = PLASMA_SPEED + vel.dot(dir).max(0.0);
        let damage = stat(&t.stats, "damage") * scale;
        let splash = stat(&t.stats, "splash");
        s.vel -= dir * 4.8 / mass;
        let start = p + dir * barrel;
        self.bullets.push(Bullet { pos: start, prev: start, vel: dir * speed, damage, kind: Kind::Plasma, side, life: 2.4, age: 0.0, splash, mass: 30.0, dead: false });
        self.spark(start, vel, 6, 40.0, 140.0, 0.25, 4.0, [1.0, 0.67, 0.24], 3.0);
        sounds.play_limited("staff", 0.7, 0.96 + rand::random::<f32>() * 0.08, 0.08, now);
    }

    fn update_beam(&mut self, index: usize, ti: usize, dt: f32, p: Vec3, trigger: bool, sounds: &mut Sounds) {
        let (aim, side, scale, start_beam) = {
            let s = &mut self.ships[index];
            let side = s.side;
            let scale = s.damage_scale;
            let t = &mut s.turrets[ti];
            let burst = stat(&t.stats, "burst");
            let cooldown = stat(&t.stats, "cooldown");
            if t.beam_time > 0.0 && !trigger {
                t.cooldown = cooldown * (1.0 - t.beam_time / burst);
                t.beam_time = 0.0;
            }
            let mut start_beam = false;
            if trigger && t.beam_time <= 0.0 && t.cooldown <= 0.0 {
                t.beam_time = burst;
                start_beam = true;
            }
            if t.beam_time <= 0.0 {
                return;
            }
            t.beam_time -= dt;
            if t.beam_time <= 0.0 {
                t.beam_time = 0.0;
                t.cooldown = cooldown;
            }
            (t.aim, side, scale, start_beam)
        };
        if start_beam {
            sounds.play("asgard_beam", 0.7, 1.0);
        }
        let range = stat(&self.ships[index].turrets[ti].stats, "range");
        let dps = stat(&self.ships[index].turrets[ti].stats, "dps");
        let (distance, hit) = self.raycast(p, aim, range, Some(side));
        let end = p + aim * distance;
        {
            let s = &mut self.ships[index];
            s.turrets[ti].beam = Some((p, end));
            s.firing = true;
            s.beaming = true;
        }
        if let Some(target) = hit {
            let damage = dps * dt * scale;
            match target {
                Target::Ship(id) => {
                    if let Some(i) = self.ships.iter().position(|s| s.id == id) {
                        self.damage_ship(i, damage * Kind::Beam.ship_factor(), Some(Kind::Beam), true, sounds);
                    }
                }
                Target::Rock(id) => {
                    if let Some(i) = self.rocks.iter().position(|r| r.id == id) {
                        self.rocks[i].vel += aim * 0.4;
                        self.hit_rock(i, damage, end, aim, Kind::Beam, sounds);
                    }
                }
                _ => {}
            }
            if rand::random::<f32>() < 0.4 {
                self.spark(end, Vec3::ZERO, 1, 40.0, 160.0, 0.3, 3.0, [0.75, 0.9, 1.0], 4.0);
            }
        }
    }

    fn update_launchers(&mut self, index: usize, dt: f32, c: &Controls, sounds: &mut Sounds) {
        let count = self.ships[index].launchers.len();
        for li in 0..count {
            let salvo = {
                let l = &mut self.ships[index].launchers[li];
                l.cooldown -= dt;
                l.salvo
            };
            if let Some((remaining, timer, target)) = salvo {
                let timer = timer - dt;
                if timer > 0.0 {
                    self.ships[index].launchers[li].salvo = Some((remaining, timer, target));
                } else if remaining == 0 || !self.ships[index].alive {
                    self.ships[index].launchers[li].salvo = None;
                } else {
                    self.launch(index, li, Kind::Drone, target, c, sounds);
                    self.ships[index].launchers[li].salvo = if remaining > 1 { Some((remaining - 1, 0.11, target)) } else { None };
                }
            }
        }
        if !c.missiles || self.ships[index].salvo_cooldown > 0.0 || count == 0 {
            return;
        }
        for k in 0..count {
            let li = (self.ships[index].next_launcher + k) % count;
            let (ready, kind) = {
                let s = &self.ships[index];
                let l = &s.launchers[li];
                (l.cooldown <= 0.0 && !s.weapons_off.contains(&l.kind), l.kind.clone())
            };
            if !ready {
                continue;
            }
            let target = self.launch_target(index, c);
            if kind == "missile" {
                self.launch(index, li, Kind::Missile, target, c, sounds);
                let cd = stat(&self.ships[index].launchers[li].stats, "cooldown");
                self.ships[index].launchers[li].cooldown = cd;
            } else {
                // Drones hunt hostile drones first: only drones can stop drones.
                let s = &self.ships[index];
                let drone_target = self.nearest_missile(s.pos, s.side, Kind::Drone, 1000.0, false).or(target).or_else(|| {
                    if s.target_mode != TargetMode::Asteroids { self.nearest_ship(s.pos, s.side, 1500.0) } else { None }
                });
                let l = &mut self.ships[index].launchers[li];
                l.salvo = Some((stat(&l.stats, "count") as u32, 0.0, drone_target));
                l.cooldown = stat(&l.stats, "cooldown");
            }
            self.ships[index].salvo_cooldown = SALVO_GAP;
            self.ships[index].next_launcher = li + 1;
            return;
        }
    }

    fn launch_target(&self, index: usize, c: &Controls) -> Option<Target> {
        let s = &self.ships[index];
        if c.lock.is_some() {
            return c.lock;
        }
        if s.stats.guidance.is_some() {
            return s.missile_lock;
        }
        c.aim_target
    }

    fn launch(&mut self, index: usize, li: usize, kind: Kind, target: Option<Target>, c: &Controls, sounds: &mut Sounds) {
        let s = &self.ships[index];
        let l = &s.launchers[li];
        let p = s.to_world(l.local);
        let info = target.and_then(|t| self.target_info(t));
        let mut dir = match (info, c.aim_point) {
            (Some(i), _) => (i.0 - p).normalize_or(s.forward()),
            (None, Some(a)) => (a - p).normalize_or(s.forward()),
            _ => s.forward(),
        };
        if kind == Kind::Drone {
            dir = Self::jitter(dir, 0.45);
        }
        let homing = if kind == Kind::Drone { 7.0 } else if let Some((_, h)) = s.stats.guidance { h } else if target.is_some() { 2.6 } else { 0.0 };
        let id = self.next_id + 1;
        self.next_id += 1;
        let m = Missile {
            id, kind, pos: p, vel: s.vel + dir * if kind == Kind::Drone { 240.0 } else { 140.0 }, dir,
            damage: stat(&l.stats, "damage") * s.damage_scale, blast: stat(&l.stats, "blast"), target, homing, side: s.side,
            life: if kind == Kind::Drone { 7.0 } else { 5.0 }, retarget: 0.0, trail: 0.0, mode: s.target_mode, dead: false,
        };
        self.missiles.push(m);
        if kind == Kind::Drone {
            sounds.play("drone", 0.6, 0.94 + rand::random::<f32>() * 0.12);
        } else {
            sounds.play("missile", 0.7, 0.96 + rand::random::<f32>() * 0.08);
        }
    }

    // ------------------------------------------------------------ damage

    /// `kind` marks a weapon hit (no knock cooldown, resistances apply).
    pub fn damage_ship(&mut self, index: usize, amount: f32, kind: Option<Kind>, quiet: bool, sounds: &mut Sounds) {
        let now = self.time;
        let s = &mut self.ships[index];
        if !s.alive || s.immunity > 0.0 {
            return;
        }
        if kind.is_none() && s.hit_cooldown > 0.0 {
            return;
        }
        if kind.is_none() {
            s.hit_cooldown = 0.25;
        }
        s.since_hit = 0.0;
        let (shield_factor, hull_factor) = match kind {
            Some(k) if k.energy() => (1.5, 0.6),
            Some(_) => (0.5, 1.25),
            None => (1.0, 1.0),
        };
        let mut remaining = amount;
        if s.shield_up() {
            let absorbed = amount.min(s.shield / shield_factor);
            s.shield = (s.shield - absorbed * shield_factor).max(0.0);
            remaining -= absorbed;
            if absorbed > 0.0 {
                s.shield_flash = SHIELD_FLASH_TIME;
                if !quiet || rand::random::<f32>() < 0.08 {
                    let heavy = kind.is_some() && absorbed > 2.0;
                    sounds.play_limited(if heavy { "shield_hit_heavy" } else { "shield_hit" }, 0.5, 0.9 + rand::random::<f32>() * 0.2, 0.25, now);
                }
            }
        }
        if remaining > 0.0 {
            s.hp -= remaining * hull_factor;
            s.hull_flash = 0.15;
        }
        if s.hp <= 0.0 {
            s.hp = 0.0;
            s.alive = false;
            sounds.play("ship_explosion", 0.9, 1.0);
        }
    }

    fn hit_rock(&mut self, i: usize, damage: f32, point: Vec3, dir: Vec3, kind: Kind, sounds: &mut Sounds) {
        let now = self.time;
        if self.rocks[i].dead {
            return;
        }
        let (rpos, rvel) = (self.rocks[i].pos, self.rocks[i].vel);
        let tint = rock_tint(&self.rocks[i].composition);
        let out = (point - rpos).normalize_or(-dir);
        self.rocks[i].flash = 0.08;
        self.dust(point, rvel + out * 20.0, (2.0 + damage).min(10.0) as usize, 7.0 + damage * 0.4, tint);
        let (count, color, size) = if kind == Kind::Plasma { (14, [1.0, 0.67, 0.24], 4.0) } else { (3, [1.0, 0.86, 0.63], 2.0) };
        self.spark(point, rvel + out * 40.0, count, 60.0, 220.0, 0.35, size, color, 3.0);
        match kind {
            Kind::Plasma => sounds.play_limited("explosion", 0.25, 1.3, 0.06, now),
            Kind::Beam => {}
            _ => sounds.play_limited("button", 0.12, 1.8, 0.05, now),
        }
        let r = &mut self.rocks[i];
        r.ore_progress += damage / (6.0 + r.radius * 0.12);
        let mut spawned = Vec::new();
        while r.ore_progress >= 1.0 {
            r.ore_progress -= 1.0;
            spawned.push(r.pick_ore());
        }
        // Wear the rock down; more material comes off big rocks per hit.
        let volume = r.radius.powi(3) - damage * (30.0 + r.radius * 6.0);
        r.wear += damage;
        let mut destroyed = false;
        let mut split = false;
        if volume <= 7.0f32.powi(3) {
            r.dead = true;
            destroyed = true;
        } else {
            r.radius = volume.cbrt();
            split = r.radius > 28.0 && r.wear > r.radius * 2.5;
        }
        let mut rng = rand::thread_rng();
        for material in spawned {
            let speed = 30.0 + rng.gen::<f32>() * 60.0;
            let v = rvel + out * speed + Vec3::new(rng.gen::<f32>() - 0.5, rng.gen::<f32>() - 0.5, rng.gen::<f32>() - 0.5) * 30.0;
            self.spawn_ore(point, v, material);
        }
        if destroyed {
            self.dust(rpos, rvel, 18, 12.0, tint);
            let m = self.rocks[i].pick_ore();
            self.spawn_ore(point, rvel, m);
            sounds.play_limited("explosion", 0.35, 1.2, 0.06, now);
        } else if split {
            self.split_rock(i, out, sounds);
        }
    }

    fn split_rock(&mut self, i: usize, hit_dir: Vec3, sounds: &mut Sounds) {
        let rock = self.rocks[i].clone();
        self.rocks[i].dead = true;
        sounds.play("explosion", 0.4, 0.8);
        let pieces = if rock.radius > 90.0 { 3 } else { 2 };
        let r = rock.radius * (1.0 / pieces as f32).cbrt();
        let side = Vec3::new(rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5).cross(hit_dir).normalize_or(Vec3::Y);
        for k in 0..pieces {
            let a = k as f32 / pieces as f32 * std::f32::consts::TAU;
            let offset = Quat::from_axis_angle(hit_dir.normalize_or(Vec3::X), a) * side * r * 0.9;
            let speed = 18.0 + rand::random::<f32>() * 18.0;
            let id = self.id();
            self.rocks.push(Rock {
                id, pos: rock.pos + offset, vel: rock.vel + offset / r * speed, radius: r, variant: (rock.variant + k + 1) % crate::meshes::ROCK_VARIANTS,
                composition: rock.composition.clone(), axis: rock.axis, angle: rock.angle, spin: rock.spin * 1.4, wear: 0.0, ore_progress: 0.0,
                flash: 0.0, grace: 0.6, dead: false,
            });
        }
        self.dust(rock.pos, Vec3::ZERO, 22, 14.0, [0.59, 0.55, 0.51]);
    }

    fn spawn_ore(&mut self, pos: Vec3, vel: Vec3, material: String) {
        let id = self.id();
        self.ores.push(Ore { id, pos, vel, material, life: ORE_LIFETIME, angle: rand::random::<f32>() * 6.0, spin: (rand::random::<f32>() - 0.5) * 4.0, tractored: false, dead: false });
    }

    fn update_ores(&mut self, dt: f32, profile: &mut Profile, sounds: &mut Sounds) {
        let p = self.player().clone();
        let can = p.alive && !p.hidden && self.transition.is_none();
        let mut tractored = 0;
        let mut collected: Vec<(Vec3, String)> = Vec::new();
        let mut burned: Vec<Vec3> = Vec::new();
        let mut full = false;
        for ore in self.ores.iter_mut() {
            ore.life -= dt;
            if ore.life <= 0.0 {
                ore.dead = true;
            }
            ore.tractored = false;
            if can {
                let d = p.pos.distance(ore.pos).max(0.001);
                if p.shield_up() && p.shield_contact(ore.pos, 2.0).is_some() {
                    ore.dead = true;
                    burned.push(ore.pos);
                } else if !p.shield_up() && d < p.magnet_range() {
                    tractored += 1;
                    ore.tractored = true;
                    let pull = 260.0 + (1.0 - d / p.magnet_range()) * 500.0;
                    ore.vel += ((p.pos - ore.pos) / d * pull + (p.vel - ore.vel) * 3.0) * dt;
                    if d < p.collect_radius() {
                        if profile.store_ore(&ore.material, p.stats.cargo) {
                            ore.dead = true;
                            collected.push((ore.pos, ore.material.clone()));
                        } else {
                            full = true;
                        }
                    }
                }
            }
            ore.pos += ore.vel * dt;
            ore.angle += ore.spin * dt;
        }
        for pos in burned {
            let s = self.player_mut();
            s.shield = (s.shield - 0.25).max(0.0);
            let color = rgb(&self.player().stats.hull.shield_color);
            self.spark(pos, Vec3::ZERO, 5, 20.0, 80.0, 0.3, 3.0, color, 3.0);
        }
        if !collected.is_empty() {
            profile.save();
        }
        for (pos, material) in collected {
            let def = data().material(&material);
            sounds.play_limited("scan", 0.25, 1.4 + (def.price / 100.0).min(0.6), 0.04, self.time);
            self.float(pos, format!("+{}", def.name), rgb(&def.color));
        }
        if full && !self.hold_full_warned {
            self.hold_full_warned = true;
            self.banner("Cargo hold full: sell at Atlantis", 2.0);
        }
        if profile.cargo_used() < p.stats.cargo {
            self.hold_full_warned = false;
        }
        self.tractor_count = tractored;
        self.ores.retain(|o| !o.dead);
    }

    // ------------------------------------------------------------ projectiles

    fn update_bullets(&mut self, dt: f32, sounds: &mut Sounds) {
        let mut bullets = std::mem::take(&mut self.bullets);
        for b in bullets.iter_mut() {
            if b.dead {
                continue;
            }
            b.prev = b.pos;
            b.pos += b.vel * dt;
            b.age += dt;
            b.life -= dt;
            if b.life <= 0.0 {
                b.dead = true;
                continue;
            }
            if b.kind == Kind::Plasma && rand::random::<f32>() < 0.6 {
                self.particles.push(Particle { pos: b.pos, vel: b.vel * 0.1, life: 0.25, size: 7.0, grow: 0.0, color: [1.0, 0.65, 0.25], glow: 4.0, drag: 0.0 });
            }
            // Hostile ships.
            let pad = if b.kind == Kind::Plasma { (b.splash * 0.4).max(8.0) } else { 3.0 };
            let mut hit_ship = None;
            for i in self.hostile_ships(b.side) {
                if self.ship_hit(i, b.pos, pad).is_some() {
                    hit_ship = Some(i);
                    break;
                }
            }
            if let Some(i) = hit_ship {
                b.dead = true;
                let shield = self.ships[i].shield_up();
                self.damage_ship(i, b.damage * b.kind.ship_factor(), Some(b.kind), false, sounds);
                let dir = b.vel.normalize_or_zero();
                let mass = self.ships[i].stats.mass;
                self.ships[i].vel += dir * b.mass * 6.0 / mass;
                let color = if shield { rgb(&self.ships[i].stats.hull.shield_color) } else if b.kind == Kind::Plasma { [1.0, 0.67, 0.24] } else { [1.0, 0.86, 0.63] };
                let v = self.ships[i].vel;
                self.spark(b.pos, v, if b.kind == Kind::Plasma { 16 } else { 5 }, 40.0, 200.0, 0.35, if b.kind == Kind::Plasma { 4.0 } else { 2.2 }, color, 3.0);
                continue;
            }
            // Asteroids (swept so fast rounds don't skip small rocks).
            let mut hit_rock = None;
            for (i, r) in self.rocks.iter().enumerate() {
                if r.dead {
                    continue;
                }
                let rr = r.radius * 0.85;
                if (r.pos - b.pos).abs().max_element() > rr + 30.0 {
                    continue;
                }
                if let Some(t) = segment_sphere(b.prev, b.pos, r.pos, rr) {
                    hit_rock = Some((i, b.prev + (b.pos - b.prev) * t));
                    break;
                }
            }
            if let Some((i, point)) = hit_rock {
                b.dead = true;
                let dir = b.vel.normalize_or_zero();
                let kick = (1100.0 * b.mass / self.rocks[i].mass()).min(20.0);
                self.rocks[i].vel += dir * kick;
                self.hit_rock(i, b.damage, point, dir, b.kind, sounds);
                if b.kind == Kind::Plasma {
                    let others: Vec<usize> = self.rocks.iter().enumerate().filter(|(j, o)| *j != i && !o.dead && o.pos.distance(point) < b.splash + o.radius).map(|(j, _)| j).collect();
                    for j in others {
                        self.hit_rock(j, b.damage * 0.5, point, dir, Kind::Plasma, sounds);
                    }
                }
                continue;
            }
            // Kinetic rounds can shoot down missiles (never drones).
            if b.kind == Kind::Bullet {
                let target = self.missiles.iter().position(|m| !m.dead && m.side != b.side && m.kind == Kind::Missile && segment_sphere(b.prev, b.pos, m.pos, 12.0).is_some());
                if let Some(mi) = target {
                    b.dead = true;
                    self.missiles[mi].damage *= 0.3;
                    self.detonate(mi, sounds);
                }
            }
        }
        bullets.retain(|b| !b.dead);
        bullets.extend(std::mem::take(&mut self.bullets));
        self.bullets = bullets;
    }

    fn ship_hit(&self, i: usize, p: Vec3, pad: f32) -> Option<bool> {
        let s = &self.ships[i];
        if s.pos.distance(p) > s.radius() * 1.6 + pad {
            return None;
        }
        if s.shield_up() {
            return s.shield_contact(p, pad).map(|_| true);
        }
        s.colliders().iter().any(|(c, r)| c.distance(p) < r + pad).then_some(false)
    }

    fn update_missiles(&mut self, dt: f32, sounds: &mut Sounds) {
        let count = self.missiles.len();
        for mi in 0..count {
            if self.missiles[mi].dead {
                continue;
            }
            self.missiles[mi].life -= dt;
            if self.missiles[mi].life <= 0.0 {
                self.detonate(mi, sounds);
                continue;
            }
            // Retarget: drones hunt hostile drones first, then ships, then asteroids.
            let (pos, side, kind, mode, homing) = {
                let m = &mut self.missiles[mi];
                m.retarget -= dt;
                (m.pos, m.side, m.kind, m.mode, m.homing)
            };
            let target_alive = self.missiles[mi].target.and_then(|t| self.target_info(t)).is_some();
            if homing > 0.0 && (self.missiles[mi].retarget <= 0.0 || !target_alive) {
                self.missiles[mi].retarget = 0.25;
                let drone = if kind == Kind::Drone { self.nearest_missile(pos, side, Kind::Drone, 1000.0, false) } else { None };
                let current_is_ship = matches!(self.missiles[mi].target, Some(Target::Ship(_)));
                let new = if drone.is_some() {
                    drone
                } else if !target_alive || (!current_is_ship && mode != TargetMode::Asteroids) {
                    let ship = if mode != TargetMode::Asteroids { self.nearest_ship(pos, side, 1400.0) } else { None };
                    ship.or_else(|| if target_alive { self.missiles[mi].target } else if mode != TargetMode::Ships { self.nearest_rock(pos, 700.0) } else { None })
                } else {
                    self.missiles[mi].target
                };
                self.missiles[mi].target = new;
            }
            let info = self.missiles[mi].target.and_then(|t| self.target_info(t));
            let (accel, max) = if kind == Kind::Drone { (950.0, 820.0) } else { (560.0, 680.0) };
            {
                let m = &mut self.missiles[mi];
                if m.homing > 0.0 {
                    if let Some((tp, _, _)) = info {
                        let want = (tp - m.pos).normalize_or(m.dir);
                        let d = tp.distance(m.pos);
                        let terminal = if d < 320.0 { 1.0 + 2.5 * (1.0 - d / 320.0) } else { 1.0 };
                        let angle = m.dir.angle_between(want);
                        if angle > 1e-4 {
                            let axis = m.dir.cross(want).normalize_or(Vec3::Y);
                            m.dir = (Quat::from_axis_angle(axis, angle.min(m.homing * terminal * dt)) * m.dir).normalize();
                        }
                    }
                }
                m.vel += m.dir * accel * dt;
                if m.homing > 0.0 {
                    let forward = m.vel.dot(m.dir);
                    let k = (m.homing * 0.8 * dt).min(1.0);
                    m.vel += (m.dir * forward - m.vel) * k;
                }
                let speed = m.vel.length();
                if speed > max {
                    m.vel *= max / speed;
                }
                m.pos += m.vel * dt;
                m.trail -= dt;
            }
            if self.missiles[mi].trail <= 0.0 {
                let m = &self.missiles[mi];
                let (p, v, d) = (m.pos, m.vel, m.dir);
                self.missiles[mi].trail = 0.02;
                let color = if kind == Kind::Drone { [1.0, 0.86, 0.47] } else { [1.0, 0.59, 0.27] };
                self.particles.push(Particle { pos: p - d * 4.0, vel: v * 0.15, life: 0.35, size: if kind == Kind::Drone { 4.0 } else { 5.0 }, grow: 0.0, color, glow: 3.0, drag: 0.0 });
                if kind == Kind::Missile && rand::random::<f32>() < 0.5 {
                    self.particles.push(Particle { pos: p - d * 6.0, vel: Vec3::ZERO, life: 1.2, size: 6.0, grow: 8.0, color: [0.75, 0.72, 0.7], glow: 0.0, drag: 0.0 });
                }
            }
            // Contact or proximity fuse.
            let (p, blast) = (self.missiles[mi].pos, self.missiles[mi].blast);
            if self.hostile_ships(side).into_iter().any(|i| self.ship_hit(i, p, (blast * 0.45).max(4.0)).is_some())
                || self.rocks.iter().any(|r| !r.dead && r.pos.distance(p) < r.radius * 0.85 + 3.0)
            {
                self.detonate(mi, sounds);
                continue;
            }
            if kind == Kind::Drone {
                if let Some(other) = self.missiles.iter().position(|o| !o.dead && o.side != side && o.kind == Kind::Drone && o.pos.distance(p) < 16.0) {
                    self.detonate(mi, sounds);
                    self.detonate(other, sounds);
                }
            }
        }
        self.missiles.retain(|m| !m.dead);
    }

    /// Explosion: damages asteroids and ships of the other side; missile blasts stop
    /// missiles, drone blasts stop drones.
    fn detonate(&mut self, mi: usize, sounds: &mut Sounds) {
        if self.missiles[mi].dead {
            return;
        }
        self.missiles[mi].dead = true;
        let m = self.missiles[mi].clone();
        let drone = m.kind == Kind::Drone;
        self.explosion(m.pos, m.vel * 0.1, m.blast, if drone { [1.0, 0.86, 0.55] } else { [1.0, 0.67, 0.35] });
        sounds.play_limited("explosion", if drone { 0.5 } else { 0.6 }, if drone { 1.15 } else { 1.0 }, 0.05, self.time);
        let rocks: Vec<(usize, f32, Vec3)> = self
            .rocks
            .iter()
            .enumerate()
            .filter(|(_, r)| !r.dead && r.pos.distance(m.pos) < m.blast + r.radius)
            .map(|(i, r)| (i, 1.0 - r.pos.distance(m.pos) / (m.blast + r.radius), (r.pos - m.pos).normalize_or(Vec3::Y)))
            .collect();
        for (i, falloff, dir) in rocks {
            let push = (60000.0 * falloff / self.rocks[i].mass()).min(50.0);
            self.rocks[i].vel += dir * push;
            let point = self.rocks[i].pos - dir * self.rocks[i].radius * 0.8;
            self.hit_rock(i, m.damage * (0.35 + 0.65 * falloff), point, dir, m.kind, sounds);
        }
        for i in self.hostile_ships(m.side) {
            let d = self.ships[i].pos.distance(m.pos);
            let reach = m.blast + self.ships[i].radius() * 0.8;
            if d > reach {
                continue;
            }
            let falloff = 1.0 - d / reach;
            self.damage_ship(i, m.damage * m.kind.ship_factor() * (0.4 + 0.6 * falloff), Some(m.kind), false, sounds);
            let dir = (self.ships[i].pos - m.pos).normalize_or(Vec3::Y);
            let mass = self.ships[i].mass();
            self.ships[i].vel += dir * (24000.0 * falloff / mass).min(40.0);
        }
        let chain: Vec<usize> = self
            .missiles
            .iter()
            .enumerate()
            .filter(|(_, o)| !o.dead && o.side != m.side && o.kind == m.kind && o.pos.distance(m.pos) < m.blast * 1.1)
            .map(|(i, _)| i)
            .collect();
        for i in chain {
            self.missiles[i].damage *= 0.3;
            self.detonate(i, sounds);
        }
    }

    // ------------------------------------------------------------ collisions

    fn collide_rocks(&mut self, si: usize, sounds: &mut Sounds) {
        if !self.ships[si].alive || self.ships[si].hidden {
            return;
        }
        let ship_mass = self.ships[si].mass();
        let mut damage = 0.0;
        let mut sparks: Vec<(Vec3, bool)> = vec![];
        for r in self.rocks.iter_mut() {
            if r.dead || r.grace > 0.0 {
                continue;
            }
            let s = &self.ships[si];
            if s.pos.distance(r.pos) > s.radius() * 1.6 + r.radius {
                continue;
            }
            let mut contact: Option<(Vec3, f32)> = None;
            if s.shield_up() {
                contact = s.shield_contact(r.pos, r.radius * 0.8);
            } else {
                for (c, cr) in s.colliders() {
                    let o = cr + r.radius * 0.8 - c.distance(r.pos);
                    if o > 0.0 {
                        contact = Some(((r.pos - c).normalize_or(Vec3::Y), o));
                        break;
                    }
                }
            }
            let Some((n, overlap)) = contact else { continue };
            let (inv1, inv2) = (1.0 / ship_mass, 1.0 / r.mass());
            let total = inv1 + inv2;
            let shield = s.shield_up();
            let svel = s.vel;
            r.pos += n * overlap * inv2 / total;
            let s = &mut self.ships[si];
            s.pos -= n * overlap * inv1 / total;
            let rel = (r.vel - svel).dot(n);
            if rel >= 0.0 {
                continue;
            }
            let impulse = -1.3 * rel / total;
            s.vel -= n * impulse * inv1;
            r.vel += n * impulse * inv2;
            if -rel > 20.0 {
                damage += 3.0 + (-rel) * r.mass() / 60000.0;
                sparks.push((r.pos - n * r.radius * 0.8, shield));
            }
        }
        if damage > 0.0 {
            self.damage_ship(si, damage, None, false, sounds);
            let v = self.ships[si].vel;
            let color = rgb(&self.ships[si].stats.hull.shield_color);
            for (p, shield) in sparks {
                self.spark(p, v, 8, 30.0, 120.0, 0.4, 2.5, if shield { color } else { [1.0, 0.78, 0.55] }, 3.0);
                if !shield {
                    sounds.play_limited("explosion", 0.4, 1.1, 0.1, self.time);
                }
            }
        }
    }

    fn ship_bumps(&mut self) {
        let n = self.ships.len();
        for i in 0..n {
            for j in (i + 1)..n {
                let (a, b) = (&self.ships[i], &self.ships[j]);
                if !a.alive || !b.alive || a.hidden || b.hidden {
                    continue;
                }
                let d = b.pos - a.pos;
                let dist = d.length().max(0.001);
                let overlap = (a.radius() + b.radius()) * 0.7 - dist;
                if overlap <= 0.0 {
                    continue;
                }
                let n = d / dist;
                let (ma, mb) = (a.mass(), b.mass());
                let total = 1.0 / ma + 1.0 / mb;
                let rel = (b.vel - a.vel).dot(n);
                let impulse = if rel < 0.0 { -1.3 * rel / total } else { 0.0 };
                let a = &mut self.ships[i];
                a.pos -= n * overlap * (1.0 / ma) / total;
                a.vel -= n * impulse / ma;
                let b = &mut self.ships[j];
                b.pos += n * overlap * (1.0 / mb) / total;
                b.vel += n * impulse / mb;
            }
        }
    }

    // ------------------------------------------------------------ enemies

    pub fn spawn_enemy(&mut self, hull: Option<&str>, level: Option<u32>, near: bool, sounds: &mut Sounds) {
        let config = data().enemies.systems.get(&self.system).or_else(|| data().enemies.systems.get("lantea")).cloned();
        let Some(config) = config else { return };
        let hull_id = hull.map(|h| h.to_string()).unwrap_or_else(|| {
            let total: f32 = config.hulls.values().sum();
            let mut roll = rand::random::<f32>() * total;
            let mut pick = config.hulls.keys().next().cloned().unwrap_or_else(|| "glider".into());
            let mut keys: Vec<_> = config.hulls.keys().cloned().collect();
            keys.sort();
            for k in keys {
                roll -= config.hulls[&k];
                if roll <= 0.0 {
                    pick = k;
                    break;
                }
            }
            pick
        });
        let level = level.unwrap_or(if rand::random::<f32>() < 0.35 { 3 } else { 2 });
        let ppos = self.player().pos;
        for _ in 0..12 {
            let dir = Vec3::new(rand::random::<f32>() - 0.5, (rand::random::<f32>() - 0.5) * 0.6, rand::random::<f32>() - 0.5).normalize_or(Vec3::X);
            let p = ppos + dir * if near { 800.0 + rand::random::<f32>() * 300.0 } else { 2200.0 + rand::random::<f32>() * 700.0 };
            if !near && self.station.map_or(false, |s| s.distance(p) < 3200.0) {
                continue;
            }
            let wing = hull.is_none() && hull_id == "glider";
            for k in 0..(if wing { 2 } else { 1 }) {
                let enemy = self.make_enemy(&hull_id, level, p + Vec3::new(80.0, 40.0, 60.0) * k as f32, ppos);
                self.ships.push(enemy);
            }
            let name = data().hull(&hull_id).name.clone();
            self.banner(format!("Hostile {}{} detected (Mk {})", name, if wing { " pair" } else { "" }, if level == 3 { "III" } else { "II" }), 2.5);
            sounds.play("scan", 0.5, 1.0);
            return;
        }
    }

    fn make_enemy(&mut self, hull_id: &str, level: u32, pos: Vec3, look: Vec3) -> Ship {
        let hull = data().hull(hull_id);
        let fit = data().enemies.fighter_fit.get(hull_id).or_else(|| data().enemies.faction_fit.get(&hull.faction)).cloned().unwrap_or_default();
        let mut loadout: Loadout = HashMap::new();
        for (i, slot) in hull.slots.iter().enumerate() {
            if !fit.is_empty() {
                loadout.insert(slot.id.clone(), (fit[i % fit.len()].clone(), level));
            }
        }
        let id = self.id();
        let mut ship = Ship::new(id, ship_stats(hull_id, &loadout), Side::Enemy);
        ship.pos = pos;
        ship.rot = Quat::from_rotation_arc(Vec3::X, (look - pos).normalize_or(Vec3::X));
        ship.damage_scale = ENEMY_DAMAGE;
        ship.auto_target = false;
        ship.immunity = 0.6;
        ship.level = level;
        let kinds: Vec<&str> = ship.turrets.iter().map(|t| t.kind.as_str()).chain(ship.launchers.iter().map(|l| l.kind.as_str())).collect();
        let range = (if kinds.contains(&"beam") { 380.0 } else if kinds.contains(&"staff") || kinds.contains(&"minigun") { 450.0 } else { 700.0 }) + hull.radius * 1.2;
        let gun_reach = (if kinds.contains(&"beam") { 650.0 } else if kinds.contains(&"staff") { 750.0 } else { 850.0 }) + hull.radius * 0.5;
        ship.ai = Some(Ai {
            controls: Controls::default(), mode: 0, mode_timer: 0.0, orbit: if rand::random::<bool>() { 1.0 } else { -1.0 }, orbit_timer: 3.0,
            missile_timer: 1.5 + rand::random::<f32>() * 2.0, evade_timer: 0.0, evade: Vec2::ZERO, aim_error: Vec3::ZERO, range, gun_reach,
            projectile_speed: if kinds.contains(&"staff") { PLASMA_SPEED } else { BULLET_SPEED }, break_dir: Vec3::X, retreated: false,
        });
        ship.bounty = ((150.0 + hull.cost as f32 * 0.12) * if level == 3 { 1.5 } else { 1.0 }).round() as u32;
        ship
    }

    fn update_enemies(&mut self, dt: f32, sounds: &mut Sounds) {
        if self.transition.is_none() {
            self.enemy_timer -= dt;
            if self.enemy_timer <= 0.0 {
                self.enemy_timer = 35.0 + rand::random::<f32>() * 35.0;
                let max = data().enemies.systems.get(&self.system).map_or(2, |c| c.max);
                if self.ships.len() - 1 < max {
                    self.spawn_enemy(None, None, false, sounds);
                }
            }
        }
        let player_ok = self.player().alive && !self.player().hidden && self.transition.is_none();
        for i in 1..self.ships.len() {
            if !self.ships[i].alive {
                continue;
            }
            let controls = self.ai_controls(i, dt, player_ok);
            if let Some(ai) = self.ships[i].ai.as_mut() {
                ai.controls = controls.clone();
            }
            self.update_ship(i, dt, &controls, sounds);
        }
    }

    /// The enemy pilot: fighters make attack runs and jink away from missiles; capital
    /// ships hold their distance and circle; badly damaged ships withdraw.
    fn ai_controls(&mut self, i: usize, dt: f32, player_ok: bool) -> Controls {
        let mut c = Controls::default();
        let player = self.player().clone();
        let station = self.station;
        let incoming: Vec<(Vec3, Vec3, Kind)> = self.missiles.iter().filter(|m| !m.dead && m.side == Side::Player).map(|m| (m.pos, m.vel, m.kind)).collect();
        let friends: Vec<(Vec3, f32)> = self.ships.iter().enumerate().filter(|(j, s)| *j != i && *j != 0 && s.alive).map(|(_, s)| (s.pos, s.radius())).collect();
        let rocks_near: Vec<(Vec3, f32)> = {
            let s = &self.ships[i];
            self.rocks.iter().filter(|r| !r.dead && r.pos.distance(s.pos) < r.radius + s.radius() + 400.0).map(|r| (r.pos, r.radius)).collect()
        };
        let s = &mut self.ships[i];
        let ship_id = s.id;
        let radius = s.radius();
        let fighter = radius < 45.0;
        let (pos, rot) = (s.pos, s.rot);
        let hp_frac = s.hp / s.stats.max_hull;
        let (shield, max_shield) = (s.shield, s.stats.max_shield);
        let has_gun = s.turrets.iter().any(|t| t.kind == "minigun");
        let launchers_cooling = !s.launchers.is_empty() && s.launchers.iter().all(|l| l.cooldown > 0.0);
        let has_launchers = !s.launchers.is_empty();
        let ai = s.ai.as_mut().expect("enemy ai");
        ai.mode_timer -= dt;
        ai.evade_timer -= dt;
        ai.orbit_timer -= dt;
        if ai.orbit_timer <= 0.0 {
            ai.orbit = -ai.orbit;
            ai.orbit_timer = 3.0 + rand::random::<f32>() * 4.0;
            ai.aim_error = Vec3::new(rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5) * 0.05;
        }
        let steer = |c: &mut Controls, dir: Vec3| -> f32 {
            let local = rot.inverse() * dir;
            let yaw = local.z.atan2(local.x);
            let pitch = local.y.atan2((local.x * local.x + local.z * local.z).sqrt());
            c.yaw = (yaw * 2.2).clamp(-1.0, 1.0);
            c.pitch = (pitch * 2.2).clamp(-1.0, 1.0);
            (local.x / local.length().max(0.0001)).clamp(-1.0, 1.0).acos()
        };
        if let Some(st) = station {
            if pos.distance(st) < CITY_SHIELD + 260.0 + radius {
                steer(&mut c, (pos - st).normalize_or(Vec3::Y));
                c.thrust = 1.0;
                return c;
            }
        }
        if !player_ok || player.pos.distance(pos) > 4000.0 {
            return c;
        }
        let to = player.pos - pos;
        let distance = to.length().max(1.0);
        let dir = to / distance;
        if ai.mode != 2 && hp_frac < 0.3 && max_shield > 0.0 && !ai.retreated {
            ai.mode = 2;
            ai.mode_timer = 8.0 + rand::random::<f32>() * 4.0;
            ai.retreated = true;
        }
        if ai.mode == 2 {
            if ai.mode_timer <= 0.0 || (shield > max_shield * 0.8 && distance > 1600.0) {
                ai.mode = 0;
            } else {
                steer(&mut c, -dir);
                c.thrust = 1.0;
                return c;
            }
        }
        // Threats: the player's missiles and drones closing in.
        let mut threat: Option<(Vec3, Vec3, Kind, f32)> = None;
        for (mp, mv, mk) in &incoming {
            let d = pos.distance(*mp);
            if d > 450.0 + radius {
                continue;
            }
            if mv.dot((pos - *mp).normalize_or_zero()) > 120.0 && threat.map_or(true, |t| d < t.3) {
                threat = Some((*mp, *mv, *mk, d));
            }
        }
        if threat.is_some() && fighter && ai.evade_timer <= 0.0 {
            ai.evade_timer = 0.7;
            ai.evade = Vec2::new(if rand::random::<bool>() { 1.0 } else { -1.0 }, if rand::random::<bool>() { 1.0 } else { -1.0 });
        }
        let shoot_down = threat.filter(|t| t.2 == Kind::Missile && t.3 < 350.0 && has_gun);
        let (aim_pos, aim_vel) = shoot_down.map(|t| (t.0, t.1)).unwrap_or((player.pos, player.vel));
        let t = aim_pos.distance(pos) / ai.projectile_speed;
        let lead = aim_pos + aim_vel * t;
        let lead_dir = ((lead - pos).normalize_or(dir) + ai.aim_error).normalize_or(dir);
        c.aim_point = Some(pos + lead_dir * lead.distance(pos));
        let range = ai.range;
        if fighter {
            if ai.mode == 0 {
                let off = steer(&mut c, (lead - pos).normalize_or(dir));
                c.thrust = if off < 0.7 { 1.0 } else { 0.2 };
                if distance < (range * 0.45).max(180.0) {
                    ai.mode = 1;
                    ai.mode_timer = 1.2 + rand::random::<f32>() * 0.8;
                    let side = Vec3::new(rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5).cross(dir).normalize_or(Vec3::Y);
                    ai.break_dir = (dir * 0.4 + side).normalize_or(Vec3::Y);
                }
            } else {
                steer(&mut c, ai.break_dir);
                c.thrust = 1.0;
                if (ai.mode_timer <= 0.0 && distance > range * 0.9) || ai.mode_timer < -3.0 {
                    ai.mode = 0;
                }
            }
        } else {
            ai.mode = 0;
            let off = steer(&mut c, dir);
            if distance > range * 1.05 && off < 1.2 {
                c.thrust = 1.0;
            }
            if distance < range * 0.7 {
                c.thrust = -1.0;
            }
            if distance < range * 1.2 {
                c.strafe = ai.orbit;
            }
        }
        if ai.evade_timer > 0.0 {
            c.strafe = ai.evade.x;
            c.lift = ai.evade.y;
        }
        for (fp, fr) in &friends {
            if fp.distance(pos) < fr + radius + 70.0 {
                c.lift = if fp.y > pos.y { -1.0 } else { 1.0 };
            }
        }
        let ahead = pos + rot * Vec3::X * (radius + 120.0);
        for (rp, rr) in &rocks_near {
            if rp.distance(ahead) < rr + radius + 60.0 {
                let local = rot.inverse() * (*rp - ahead);
                c.strafe = if local.z > 0.0 { -1.0 } else { 1.0 };
                c.lift = if local.y > 0.0 { -1.0 } else { 1.0 };
                if fighter {
                    c.thrust = c.thrust.min(0.3);
                }
                break;
            }
        }
        c.fire = shoot_down.is_some() || distance - player.radius() * 0.8 < ai.gun_reach;
        ai.missile_timer -= dt;
        let player_drones = incoming.iter().any(|m| m.2 == Kind::Drone);
        if has_launchers && (ai.missile_timer <= 0.0 || player_drones) && distance < 1500.0 && distance > 150.0 {
            c.missiles = true;
            c.lock = Some(Target::Ship(1));
            if launchers_cooling || rand::random::<f32>() < 0.02 {
                ai.missile_timer = 2.0 + rand::random::<f32>() * 3.0;
            }
        }
        let _ = ship_id;
        c
    }

    fn enemy_losses(&mut self, profile: &mut Profile, sounds: &mut Sounds) {
        let mut paid = vec![];
        for s in self.ships.iter_mut().skip(1) {
            if !s.alive && !s.counted {
                s.counted = true;
                paid.push((s.pos, s.vel, s.radius(), s.bounty, s.stats.hull.name.clone()));
            }
        }
        for (pos, vel, radius, bounty, name) in paid {
            profile.credits += bounty as f64;
            profile.save();
            self.float(pos, format!("+{} cr", bounty), [1.0, 0.84, 0.47]);
            self.banner(format!("{} destroyed  +{} credits", name, bounty), 2.2);
            self.explosion(pos, vel, radius * 2.2, [1.0, 0.7, 0.43]);
            sounds.play("ship_explosion", 0.7, 1.1);
        }
        let ppos = self.player().pos;
        let mut first = true;
        self.ships.retain(|s| {
            if first {
                first = false;
                return true;
            }
            s.alive && s.pos.distance(ppos) < 8000.0
        });
    }

    // ------------------------------------------------------------ gate & travel

    pub fn dial(&mut self, target: &str) {
        let g = &mut self.gate;
        if g.busy() && g.state != GateState::Closing {
            return;
        }
        g.state = GateState::Dialing;
        g.outgoing = true;
        g.target = Some(target.to_string());
        g.locked = 0;
        g.clock = 0.0;
        g.was_open = false;
        // CAP's DHD dial: ring rolls, chevrons 1-6 at random intervals over 4 s, the ring
        // stops, chevron 7 locks 0.8 s later and the gate opens 1.2 s after that.
        let mut gaps: Vec<f32> = (0..5).map(|_| 0.3 + rand::random::<f32>() * 0.7).collect();
        gaps.push(1.0);
        let total: f32 = gaps.iter().sum();
        let delta = (4.0 - total) / 6.0;
        let mut t = 1.0;
        g.chevron_times.clear();
        for gap in gaps {
            g.chevron_times.push(t);
            t += gap + delta;
        }
        g.ring_stop = t;
        g.lock_time = t + 0.8;
        g.open_time = g.lock_time + 1.2;
        g.spin_from = g.spin;
        g.spin_to = g.spin + std::f32::consts::TAU * 2.0 + rand::random::<f32>() * 3.0;
    }

    pub fn close_gate(&mut self, silent: bool, sounds: &mut Sounds) {
        if matches!(self.gate.state, GateState::Idle | GateState::Closing) {
            return;
        }
        self.gate.was_open = matches!(self.gate.state, GateState::Open | GateState::Kawoosh);
        self.gate.state = GateState::Closing;
        self.gate.timer = 0.9;
        if !silent {
            sounds.play("gate_close", 0.9, 1.0);
        }
    }

    fn update_gate(&mut self, dt: f32, sounds: &mut Sounds) {
        let g = &mut self.gate;
        g.timer -= dt;
        match g.state {
            GateState::Dialing => {
                g.clock += dt;
                let t = g.clock;
                let span = g.ring_stop - 0.1;
                let u = ((t - 0.1) / span).clamp(0.0, 1.0);
                let ease = u * u * (3.0 - 2.0 * u);
                g.spin = g.spin_from + (g.spin_to - g.spin_from) * ease;
                while (g.locked as usize) < 6 && t >= g.chevron_times[g.locked as usize] {
                    g.locked += 1;
                    sounds.play("chevron", 1.0, 0.97 + rand::random::<f32>() * 0.07);
                }
                if g.locked == 6 && t >= g.lock_time {
                    g.locked = 7;
                    sounds.play("chevron_lock", 1.0, 0.97 + rand::random::<f32>() * 0.07);
                }
                if t >= g.open_time {
                    g.state = GateState::Opening;
                    g.timer = 0.8;
                    sounds.play("kawoosh", 1.0, 1.0);
                }
            }
            GateState::Opening if g.timer <= 0.0 => {
                g.state = GateState::Kawoosh;
                g.timer = 1.3;
            }
            GateState::Kawoosh => {
                g.kawoosh = 1.0 - (g.timer / 1.3).max(0.0);
                if g.timer <= 0.0 {
                    g.state = GateState::Open;
                    g.timer = 38.0;
                    g.was_open = true;
                }
            }
            GateState::Open if g.timer <= 0.0 => {
                self.close_gate(false, sounds);
            }
            GateState::Closing if g.timer <= 0.0 => {
                let g = &mut self.gate;
                g.state = GateState::Idle;
                g.locked = 0;
                g.target = None;
            }
            _ => {}
        }
    }

    fn check_gate_travel(&mut self, prev_z: f32, sounds: &mut Sounds) {
        let p = self.player().clone();
        let g = &self.gate;
        if self.transition.is_some() || !p.alive || g.state != GateState::Open || !g.outgoing {
            return;
        }
        let plane = g.pos.z;
        if (prev_z - plane) * (p.pos.z - plane) > 0.0 {
            return;
        }
        if Vec2::new(p.pos.x - g.pos.x, p.pos.y - g.pos.y).length() > GATE_INNER * 0.85 {
            return;
        }
        if p.radius() > GATE_INNER * 0.95 {
            self.banner("Ship too large for the Stargate: use a hyperdrive.", 2.5);
            return;
        }
        let target = g.target.clone().unwrap_or_else(|| "earth".into());
        sounds.play("gate_enter", 1.0, 0.9 + rand::random::<f32>() * 0.2);
        sounds.play("wormhole", 1.0, 1.0);
        self.close_gate(true, sounds);
        self.player_mut().hidden = true;
        self.transition = Some(Transition::Gate { t: 0.0, target });
    }

    pub fn start_hyperjump(&mut self, target: &str, sounds: &mut Sounds) {
        let p = self.player();
        let Some(speed) = p.stats.hyperdrive else { return };
        let a = data().system(&self.system).map;
        let b = data().system(target).map;
        let distance = Vec3::from(a).distance(Vec3::from(b));
        let duration = (distance / (90.0 * speed)).clamp(5.0, 45.0);
        let window = p.pos + p.forward() * (p.radius() * 3.0 + 150.0);
        self.transition = Some(Transition::Hyper { t: 0.0, phase: 0, target: target.to_string(), duration, distance, window });
        sounds.play("hyper_window", 1.0, 1.0);
        let name = data().system(target).name.clone();
        self.banner(format!("Hyperdrive engaged: {}", name), 2.0);
    }

    fn update_transition(&mut self, dt: f32, sounds: &mut Sounds) {
        let Some(tr) = self.transition.clone() else { return };
        match tr {
            Transition::Gate { t, target } => {
                let t = t + dt;
                if t >= 3.4 {
                    self.player_mut().hidden = false;
                    self.enter_system(&target, Some("gate"));
                    sounds.play("gate_enter", 1.0, 1.0);
                } else {
                    self.transition = Some(Transition::Gate { t, target });
                }
            }
            Transition::Hyper { t, phase, target, duration, distance, window } => {
                let t = t + dt;
                if phase == 0 {
                    let glow = t.min(1.0);
                    for _ in 0..3 {
                        let off = Vec3::new(rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5, rand::random::<f32>() - 0.5) * 120.0 * glow;
                        self.particles.push(Particle { pos: window + off, vel: Vec3::ZERO, life: 0.4, size: 30.0 + 60.0 * glow, grow: 0.0, color: [0.67, 0.88, 0.92], glow: 2.0, drag: 0.0 });
                    }
                    if t > 1.0 {
                        let p = self.player_mut();
                        p.vel += (window - p.pos).normalize_or(Vec3::X) * 900.0 * dt;
                        if p.pos.distance(window) < p.radius() + 40.0 || t > 3.0 {
                            p.hidden = true;
                            self.transition = Some(Transition::Hyper { t: 0.0, phase: 1, target, duration, distance, window });
                            return;
                        }
                    }
                    self.transition = Some(Transition::Hyper { t, phase, target, duration, distance, window });
                } else if t >= duration {
                    sounds.play("hyper_window", 1.0, 1.08);
                    self.player_mut().hidden = false;
                    self.enter_system(&target, Some("hyper"));
                } else {
                    self.transition = Some(Transition::Hyper { t, phase, target, duration, distance, window });
                }
            }
        }
    }

    // ------------------------------------------------------------ player actions

    pub fn toggle_shields(&mut self, sounds: &mut Sounds) {
        let p = self.player_mut();
        if p.stats.max_shield <= 0.0 {
            self.banner("No shield emitter fitted", 1.5);
            return;
        }
        p.shields_enabled = !p.shields_enabled;
        let on = p.shields_enabled;
        sounds.play(if on { "shield_up" } else { "shield_down" }, 0.8, 1.0);
        self.banner(if on { "Shields raised" } else { "Shields lowered: ore collection enabled" }, 1.5);
    }

    pub fn cycle_targets(&mut self, sounds: &mut Sounds) {
        let p = self.player_mut();
        if p.stats.guidance.is_none() {
            self.banner("Fit a targeting computer to choose targets", 1.6);
            return;
        }
        p.target_mode = p.target_mode.next();
        let label = p.target_mode.label();
        sounds.play("button", 0.5, 1.0);
        self.banner(format!("Targeting: {}", label), 1.4);
    }

    pub fn toggle_weapon(&mut self, n: usize, sounds: &mut Sounds) {
        let weapons = self.player().weapon_status();
        let Some(w) = weapons.get(n) else { return };
        let kind = w.kind.clone();
        let name = w.name.clone();
        let p = self.player_mut();
        let on = if p.weapons_off.contains(&kind) {
            p.weapons_off.remove(&kind);
            true
        } else {
            p.weapons_off.insert(kind);
            false
        };
        sounds.play("button", 0.5, if on { 1.0 } else { 0.85 });
        self.banner(format!("{} {}", name, if on { "ON" } else { "OFF" }), 1.1);
    }
}

pub fn rock_tint(composition: &[(String, f32)]) -> [f32; 3] {
    let mut c = [0.55, 0.5, 0.46];
    for (id, share) in composition {
        if id == "rock" {
            continue;
        }
        let t = rgb(&data().material(id).color);
        let s = share * 0.55;
        for i in 0..3 {
            c[i] = c[i] * (1.0 - s) + t[i] * s;
        }
    }
    c
}

/// First point along segment a->b inside the sphere, as a fraction 0..1.
pub fn segment_sphere(a: Vec3, b: Vec3, c: Vec3, r: f32) -> Option<f32> {
    let d = b - a;
    let f = a - c;
    let cc = f.length_squared() - r * r;
    if cc < 0.0 {
        return Some(0.0);
    }
    let aa = d.length_squared();
    if aa == 0.0 {
        return None;
    }
    let bb = 2.0 * f.dot(d);
    let disc = bb * bb - 4.0 * aa * cc;
    if disc < 0.0 {
        return None;
    }
    let t = (-bb - disc.sqrt()) / (2.0 * aa);
    (0.0..=1.0).contains(&t).then_some(t)
}

/// Small deterministic generator for sector contents (same field every visit).
pub struct SeededRng(u32);

impl SeededRng {
    pub fn new(seed: u32) -> Self {
        SeededRng(seed)
    }
    pub fn next(&mut self) -> f32 {
        self.0 = self.0.wrapping_add(0x6D2B79F5);
        let mut t = self.0;
        t = (t ^ (t >> 15)).wrapping_mul(t | 1);
        t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61));
        (t ^ (t >> 14)) as f32 / 4294967296.0
    }
}
