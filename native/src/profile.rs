//! The player's save: credits, owned hulls, module loadouts and the cargo hold. Stored as
//! JSON in the user's data folder (macOS: ~/Library/Application Support/SomeAwesomeGame,
//! Linux: ~/.local/share/SomeAwesomeGame).

use crate::data::{data, sell_value, upgrade_cost, Loadout};
use bevy::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Fit {
    pub kind: String,
    pub level: u32,
}

#[derive(Resource, Serialize, Deserialize, Clone, Debug)]
pub struct Profile {
    pub credits: f64,
    pub seed: u32,
    pub hull: String,
    pub owned_hulls: Vec<String>,
    pub loadouts: HashMap<String, HashMap<String, Fit>>,
    pub cargo: HashMap<String, u32>,
    #[serde(default)]
    pub debug: bool,
}

impl Default for Profile {
    fn default() -> Self {
        let mut x302 = HashMap::new();
        x302.insert("c".to_string(), Fit { kind: "minigun".into(), level: 1 });
        let mut loadouts = HashMap::new();
        loadouts.insert("x302".to_string(), x302);
        Profile {
            credits: 0.0,
            seed: rand::random(),
            hull: "x302".into(),
            owned_hulls: vec!["x302".into()],
            loadouts,
            cargo: HashMap::new(),
            debug: false,
        }
    }
}

fn save_path() -> Option<PathBuf> {
    dirs::data_dir().map(|d| d.join("SomeAwesomeGame").join("profile.json"))
}

impl Profile {
    pub fn load() -> Profile {
        let loaded = save_path()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str::<Profile>(&s).ok());
        let mut profile = loaded.unwrap_or_default();
        if !data().hulls.iter().any(|h| h.id == profile.hull) {
            profile.hull = "x302".into();
        }
        profile
    }

    pub fn save(&self) {
        if let Some(path) = save_path() {
            if let Some(dir) = path.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            if let Ok(text) = serde_json::to_string_pretty(self) {
                let _ = std::fs::write(path, text);
            }
        }
    }

    pub fn price(&self, cost: u32) -> f64 {
        if self.debug { 0.0 } else { cost as f64 }
    }

    pub fn owns(&self, hull: &str) -> bool {
        self.debug || self.owned_hulls.iter().any(|h| h == hull)
    }

    pub fn loadout(&self, hull: &str) -> Loadout {
        self.loadouts
            .get(hull)
            .map(|l| l.iter().map(|(k, f)| (k.clone(), (f.kind.clone(), f.level))).collect())
            .unwrap_or_default()
    }

    pub fn current_loadout(&self) -> Loadout {
        self.loadout(&self.hull)
    }

    pub fn buy_hull(&mut self, id: &str) -> bool {
        let cost = self.price(data().hull(id).cost);
        if self.owns(id) || self.credits < cost {
            return false;
        }
        self.credits -= cost;
        self.owned_hulls.push(id.to_string());
        self.hull = id.to_string();
        self.save();
        true
    }

    pub fn select_hull(&mut self, id: &str) -> bool {
        if !self.owns(id) {
            return false;
        }
        self.hull = id.to_string();
        self.save();
        true
    }

    pub fn install(&mut self, slot: &str, kind: &str) -> Result<(), String> {
        let hull = data().hull(&self.hull);
        let module = data().module(kind);
        if module.min_hull_mass > 0.0 && hull.mass < module.min_hull_mass {
            return Err(format!("The {} is too small for a {}.", hull.name, module.name));
        }
        let cost = self.price(module.cost);
        if self.credits < cost {
            return Err(format!("Not enough credits for the {}.", module.name));
        }
        let fits = self.loadouts.entry(self.hull.clone()).or_default();
        if fits.contains_key(slot) {
            return Err("That mount is taken. Sell its module first.".into());
        }
        fits.insert(slot.to_string(), Fit { kind: kind.to_string(), level: 1 });
        self.credits -= cost;
        self.save();
        Ok(())
    }

    pub fn upgrade(&mut self, slot: &str) -> Result<(), String> {
        let hull = self.hull.clone();
        let Some(fit) = self.loadouts.get(&hull).and_then(|f| f.get(slot)).cloned() else { return Err("Empty mount".into()) };
        let Some(cost) = upgrade_cost(&fit.kind, fit.level) else { return Err("Already at max level".into()) };
        let cost = self.price(cost);
        if self.credits < cost {
            return Err("Not enough credits".into());
        }
        self.credits -= cost;
        if let Some(f) = self.loadouts.get_mut(&hull).and_then(|f| f.get_mut(slot)) {
            f.level += 1;
        }
        self.save();
        Ok(())
    }

    pub fn sell_module(&mut self, slot: &str) {
        let hull = self.hull.clone();
        if let Some(fit) = self.loadouts.get_mut(&hull).and_then(|f| f.remove(slot)) {
            if !self.debug {
                self.credits += sell_value(&fit.kind, fit.level) as f64;
            }
            self.save();
        }
    }

    pub fn cargo_used(&self) -> u32 {
        self.cargo.values().sum()
    }

    pub fn store_ore(&mut self, material: &str, capacity: u32) -> bool {
        if self.cargo_used() >= capacity {
            return false;
        }
        *self.cargo.entry(material.to_string()).or_insert(0) += 1;
        true
    }

    pub fn cargo_value(&self) -> f64 {
        self.cargo.iter().map(|(id, n)| *n as f64 * data().material(id).price as f64).sum::<f64>() + 0.0
    }

    pub fn sell_cargo(&mut self) -> f64 {
        let earned = self.cargo_value();
        self.cargo.clear();
        self.credits += earned;
        self.save();
        earned
    }
}
