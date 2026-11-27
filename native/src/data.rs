//! Shared game data (hulls, modules, materials, star systems, enemy fits), exported from the
//! web game by `tools/export-game-data.mjs` and embedded into the executable.

use serde::Deserialize;
use std::collections::HashMap;
use std::sync::OnceLock;

#[derive(Deserialize, Clone, Debug)]
pub struct ArtPart {
    pub kind: String,
    #[serde(default)]
    pub v: Vec<f32>,
    #[serde(default)]
    pub pts: Vec<[f32; 2]>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct Slot {
    pub id: String,
    pub x: f32,
    pub y: f32,
}

#[derive(Deserialize, Clone, Debug)]
pub struct EngineDef {
    pub x: f32,
    pub y: f32,
    pub size: f32,
}

#[derive(Deserialize, Clone, Debug)]
pub struct ShieldShape {
    pub x: f32,
    pub y: f32,
    pub rx: f32,
    pub ry: f32,
}

#[derive(Deserialize, Clone, Debug)]
pub struct HullDef {
    pub id: String,
    pub name: String,
    pub class_name: String,
    pub faction: String,
    pub description: String,
    pub cost: u32,
    pub color: String,
    pub exhaust: String,
    pub shield_color: String,
    pub mass: f32,
    pub hull: f32,
    pub base_shield: f32,
    pub cargo: u32,
    pub thrust: f32,
    pub torque: f32,
    pub max_turn: f32,
    pub module_scale: f32,
    pub radius: f32,
    pub hyperdrive: f32,
    pub art: Vec<ArtPart>,
    pub slots: Vec<Slot>,
    pub engines: Vec<EngineDef>,
    pub colliders: Vec<[f32; 3]>,
    pub shield: ShieldShape,
}

#[derive(Deserialize, Clone, Debug)]
pub struct ModuleDef {
    pub id: String,
    pub name: String,
    pub short: String,
    pub description: String,
    pub cost: u32,
    pub color: String,
    pub min_hull_mass: f32,
    pub stats: HashMap<String, Vec<f32>>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct MaterialDef {
    pub id: String,
    pub name: String,
    pub color: String,
    pub price: f32,
    pub min_sector: f32,
    pub weight: f32,
    pub growth: f32,
}

#[derive(Deserialize, Clone, Debug)]
pub struct PlanetDef {
    pub x: f32,
    pub y: f32,
    pub radius: f32,
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub moon: bool,
}

#[derive(Deserialize, Clone, Debug)]
pub struct GatePos {
    pub x: f32,
    pub y: f32,
}

#[derive(Deserialize, Clone, Debug)]
pub struct SystemDef {
    pub id: String,
    pub name: String,
    pub galaxy: String,
    pub origin: String,
    pub description: String,
    pub map: [f32; 3],
    pub station: bool,
    pub gate: GatePos,
    pub planet: PlanetDef,
    pub tint: String,
    pub materials: HashMap<String, f32>,
    pub address: Vec<usize>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct EnemySystem {
    pub max: usize,
    pub hulls: HashMap<String, f32>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct EnemyData {
    pub faction_fit: HashMap<String, Vec<String>>,
    pub fighter_fit: HashMap<String, Vec<String>>,
    pub systems: HashMap<String, EnemySystem>,
}

#[derive(Deserialize, Debug)]
pub struct GameData {
    pub hulls: Vec<HullDef>,
    pub modules: Vec<ModuleDef>,
    pub max_level: u32,
    pub materials: Vec<MaterialDef>,
    pub constellations: Vec<String>,
    pub systems: Vec<SystemDef>,
    pub enemies: EnemyData,
}

pub fn data() -> &'static GameData {
    static DATA: OnceLock<GameData> = OnceLock::new();
    DATA.get_or_init(|| serde_json::from_str(include_str!("../assets/data/game_data.json")).expect("embedded game data"))
}

impl GameData {
    pub fn hull(&self, id: &str) -> &HullDef {
        self.hulls.iter().find(|h| h.id == id).unwrap_or(&self.hulls[0])
    }
    pub fn module(&self, id: &str) -> &ModuleDef {
        self.modules.iter().find(|m| m.id == id).unwrap_or(&self.modules[0])
    }
    pub fn material(&self, id: &str) -> &MaterialDef {
        self.materials.iter().find(|m| m.id == id).unwrap_or(&self.materials[0])
    }
    pub fn system(&self, id: &str) -> &SystemDef {
        self.systems.iter().find(|s| s.id == id).unwrap_or(&self.systems[0])
    }
    pub fn system_index(&self, id: &str) -> usize {
        self.systems.iter().position(|s| s.id == id).unwrap_or(0)
    }
}

/// "r,g,b" (0-255) to sRGB floats 0..1.
pub fn rgb(text: &str) -> [f32; 3] {
    let mut out = [1.0; 3];
    for (i, part) in text.split(',').take(3).enumerate() {
        out[i] = part.trim().parse::<f32>().unwrap_or(255.0) / 255.0;
    }
    out
}

// ------------------------------------------------------------ modules and stats

pub type Stats = HashMap<String, f32>;

pub fn module_stats(id: &str, level: u32) -> Stats {
    let def = data().module(id);
    def.stats
        .iter()
        .map(|(k, v)| (k.clone(), v[(level.max(1) as usize - 1).min(v.len() - 1)]))
        .collect()
}

pub fn stat(stats: &Stats, key: &str) -> f32 {
    *stats.get(key).unwrap_or(&0.0)
}

pub fn upgrade_cost(id: &str, level: u32) -> Option<u32> {
    if level >= data().max_level {
        return None;
    }
    let cost = data().module(id).cost as f32;
    Some((cost * if level == 1 { 1.0 } else { 1.8 }).round() as u32)
}

pub fn sell_value(id: &str, level: u32) -> u32 {
    let mut total = data().module(id).cost;
    for l in 1..level {
        total += upgrade_cost(id, l).unwrap_or(0);
    }
    (total as f32 * 0.5).round() as u32
}

#[derive(Clone, Debug)]
pub struct FittedModule {
    pub slot: Slot,
    pub kind: String,
    pub level: u32,
    pub stats: Stats,
}

#[derive(Clone, Debug)]
pub struct ShipStats {
    pub hull: HullDef,
    pub mass: f32,
    pub max_hull: f32,
    pub max_shield: f32,
    pub shield_regen: f32,
    pub cargo: u32,
    pub magnet_range: f32,
    pub guidance: Option<(f32, f32)>,
    pub scanner: Option<f32>,
    pub hyperdrive: Option<f32>,
    pub modules: Vec<FittedModule>,
    pub acceleration: f32,
    pub angular_acceleration: f32,
    pub max_turn: f32,
}

pub type Loadout = HashMap<String, (String, u32)>;

const BASE_MAGNET_RANGE: f32 = 90.0;

/// Same rules as the shipyard: hull base values plus every fitted module.
pub fn ship_stats(hull_id: &str, loadout: &Loadout) -> ShipStats {
    let hull = data().hull(hull_id).clone();
    let mut mass = hull.mass;
    let mut max_hull = hull.hull;
    let mut max_shield = hull.base_shield;
    let mut shield_regen = if hull.base_shield > 0.0 { hull.base_shield * 0.15 } else { 0.0 };
    let mut thrust = hull.thrust;
    let mut torque = hull.torque * hull.mass;
    let mut cargo = hull.cargo;
    let mut magnet = BASE_MAGNET_RANGE;
    let mut guidance: Option<(f32, f32)> = None;
    let mut scanner: Option<f32> = None;
    let mut hyperdrive = if hull.hyperdrive > 0.0 { Some(hull.hyperdrive) } else { None };
    let mut modules = Vec::new();
    for slot in &hull.slots {
        let Some((kind, level)) = loadout.get(&slot.id) else { continue };
        let s = module_stats(kind, *level);
        match kind.as_str() {
            "engine" => {
                thrust += stat(&s, "thrust");
                torque += stat(&s, "torque");
            }
            "shield" => {
                max_shield += stat(&s, "capacity");
                shield_regen += stat(&s, "regen");
            }
            "armor" => {
                max_hull += stat(&s, "hull");
                mass += stat(&s, "mass");
            }
            "cargo" => cargo += stat(&s, "capacity") as u32,
            "hyperdrive" => hyperdrive = Some(hyperdrive.unwrap_or(0.0).max(stat(&s, "speed"))),
            "scanner" => scanner = Some(scanner.unwrap_or(0.0).max(stat(&s, "range"))),
            "magnet" => magnet = magnet.max(stat(&s, "range")),
            "guidance" => {
                let r = stat(&s, "range");
                if guidance.map_or(true, |g| r > g.0) {
                    guidance = Some((r, stat(&s, "homing")));
                }
            }
            _ => {}
        }
        modules.push(FittedModule { slot: slot.clone(), kind: kind.clone(), level: *level, stats: s });
    }
    let acceleration = thrust / mass;
    let angular_acceleration = torque / mass;
    let max_turn = hull.max_turn * (angular_acceleration / hull.torque).sqrt().min(1.6);
    ShipStats {
        hull, mass, max_hull, max_shield, shield_regen, cargo, magnet_range: magnet, guidance, scanner, hyperdrive,
        modules, acceleration, angular_acceleration, max_turn,
    }
}

pub const TURRETS: [&str; 3] = ["minigun", "staff", "beam"];
pub const LAUNCHERS: [&str; 2] = ["missile", "drones"];
