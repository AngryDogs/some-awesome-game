//! Imported 3D models from Sketchfab (see assets/models/CREDITS.txt). They are embedded in
//! the executable and served to Bevy's glTF loader from memory as `models://<name>.glb`.
//! tools/models/prepare-models.mjs has already turned each one into the ship frame (+X bow,
//! +Y up), centred it and scaled it to 1 unit along X.

use crate::data::{rgb, HullDef};
use crate::visuals::{glow_material, ChevronLamp, GateSpin};
use bevy::asset::io::memory::{Dir, MemoryAssetReader};
use bevy::asset::io::AssetSourceBuilder;
use bevy::gltf::{GltfAssetLabel, GltfMaterialName};
use bevy::prelude::*;
use bevy::render::primitives::Aabb;
use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use std::sync::OnceLock;

macro_rules! model {
    ($name:literal) => {
        ($name, include_bytes!(concat!("../assets/models/", $name, ".glb")) as &'static [u8])
    };
}

const FILES: [(&str, &[u8]); 9] = [
    model!("x302"),
    model!("glider"),
    model!("jumper"),
    model!("x303"),
    model!("alkesh"),
    model!("x304"),
    model!("hatak"),
    model!("gate"),
    model!("atlantis"),
];

#[derive(Deserialize, Clone, Debug)]
#[allow(dead_code)]
pub struct ModelInfo {
    /// Size after preparation: X is always 1.
    pub size: [f32; 3],
    /// Distance of the nearest vertex from the model's Z axis (the gate's opening).
    pub inner_radius: f32,
    pub title: String,
    pub author: String,
    pub license: String,
}

pub fn manifest() -> &'static HashMap<String, ModelInfo> {
    static M: OnceLock<HashMap<String, ModelInfo>> = OnceLock::new();
    M.get_or_init(|| serde_json::from_str(include_str!("../assets/models/manifest.json")).expect("model manifest"))
}

/// Registers the in-memory `models://` asset source. Must run before DefaultPlugins.
pub fn register(app: &mut App) {
    let dir = Dir::default();
    for (name, bytes) in FILES {
        dir.insert_asset(Path::new(&format!("{name}.glb")), bytes);
    }
    app.register_asset_source("models", AssetSourceBuilder::default().with_reader(move || Box::new(MemoryAssetReader { root: dir.clone() })));
}

#[derive(Resource)]
pub struct Models {
    scenes: HashMap<String, Handle<Scene>>,
}

impl Models {
    pub fn scene(&self, name: &str) -> Option<Handle<Scene>> {
        self.scenes.get(name).cloned()
    }
}

pub fn load_models(mut commands: Commands, assets: Res<AssetServer>) {
    let scenes = FILES
        .iter()
        .map(|(name, _)| (name.to_string(), assets.load(GltfAssetLabel::Scene(0).from_asset(format!("models://{name}.glb")))))
        .collect();
    commands.insert_resource(Models { scenes });
}

/// Where a hull's model goes inside the ship: centred on the hull's outline and scaled so
/// its top-down area matches the outline's (the colliders and shield are built from it).
pub fn ship_transform(hull: &HullDef) -> Option<Transform> {
    let info = manifest().get(&hull.id)?;
    let (lo, hi) = crate::meshes::art_bounds(hull);
    let (length, width) = (hi.x - lo.x, hi.y - lo.y);
    let scale = (length * width / info.size[2]).sqrt();
    let center = (lo + hi) / 2.0;
    Some(Transform::from_xyz(center.x, 0.0, center.y).with_scale(Vec3::splat(scale)))
}

/// Paint for models that come without textures, from the hull's colour.
#[derive(Component)]
pub struct Tint(pub [f32; 3]);

pub fn hull_tint(hull: &HullDef) -> Tint {
    let c = rgb(&hull.color);
    Tint([0.5 + c[0] * 0.3, 0.52 + c[1] * 0.3, 0.55 + c[2] * 0.3])
}

/// Marks the gate model so its ring spins and its chevron lights follow the dialing.
#[derive(Component)]
pub struct GateModel;

/// A chevron light mesh of the gate model waiting to learn which chevron it is.
#[derive(Component)]
pub struct UnassignedChevron;

fn ancestor<'a, T: Component>(mut e: Entity, parents: &Query<&ChildOf>, q: &'a Query<&T>) -> Option<(Entity, &'a T)> {
    for _ in 0..32 {
        if let Ok(t) = q.get(e) {
            return Some((e, t));
        }
        e = parents.get(e).ok()?.parent();
    }
    None
}

/// Runs on freshly spawned model parts: paints untextured materials, finds the gate's ring
/// and chevron lights.
#[allow(clippy::too_many_arguments)]
pub fn fix_new_parts(
    mut commands: Commands,
    new_meshes: Query<(Entity, &MeshMaterial3d<StandardMaterial>, Option<&GltfMaterialName>), Added<MeshMaterial3d<StandardMaterial>>>,
    new_names: Query<(Entity, &Name, &Transform), Added<Name>>,
    parents: Query<&ChildOf>,
    tints: Query<&Tint>,
    gates: Query<&GateModel>,
    mut mats: ResMut<Assets<StandardMaterial>>,
    mut painted: Local<HashMap<[u32; 3], Handle<StandardMaterial>>>,
) {
    for (e, mat, mat_name) in &new_meshes {
        if let Some((_, tint)) = ancestor(e, &parents, &tints) {
            let untextured = mats.get(&mat.0).is_some_and(|m| m.base_color_texture.is_none());
            if untextured {
                let key = tint.0.map(|v| (v * 1000.0) as u32);
                let c = tint.0;
                let handle = painted
                    .entry(key)
                    .or_insert_with(|| mats.add(StandardMaterial { base_color: Color::srgb(c[0], c[1], c[2]), metallic: 0.55, perceptual_roughness: 0.42, ..default() }))
                    .clone();
                commands.entity(e).insert(MeshMaterial3d(handle));
            }
        }
        if mat_name.is_some_and(|n| n.0.starts_with("ChevronLight")) && ancestor(e, &parents, &gates).is_some() {
            commands.entity(e).insert(UnassignedChevron);
        }
    }
    for (e, name, t) in &new_names {
        if name.as_str() == "Ring" && ancestor(e, &parents, &gates).is_some() {
            commands.entity(e).insert(GateSpin { base: Some(t.rotation), axis: None });
        }
    }
}

/// Once transforms are known, give each chevron light its number (by its angle around the
/// gate: 0 at the top, counter-clockwise like the game's chevrons) and its own lamp material.
/// The model only has lights on its front face, so each also gets a mirrored copy on the back.
pub fn assign_chevrons(
    mut commands: Commands,
    lights: Query<(Entity, &Aabb, &GlobalTransform, &Mesh3d), With<UnassignedChevron>>,
    gates: Query<(Entity, &GlobalTransform), With<GateModel>>,
    mut mats: ResMut<Assets<StandardMaterial>>,
) {
    let Ok((gate_entity, gate)) = gates.single() else { return };
    for (e, aabb, gt, mesh) in &lights {
        if *gt == GlobalTransform::IDENTITY {
            continue;
        }
        let to_gate = gate.affine().inverse() * gt.affine();
        let local = to_gate.transform_point3(Vec3::from(aabb.center));
        let angle = local.y.atan2(local.x);
        let step = std::f32::consts::TAU / 9.0;
        let index = (((angle - std::f32::consts::FRAC_PI_2) / step).round() as i32).rem_euclid(9) as usize;
        let mut lamp_mat = glow_material([0.35, 0.15, 0.08], 1.0);
        lamp_mat.cull_mode = None;
        let lamp = mats.add(lamp_mat);
        commands.entity(e).remove::<UnassignedChevron>().insert((MeshMaterial3d(lamp.clone()), ChevronLamp(index, lamp.clone())));
        // Mirror through the gate's plane, then stand it slightly proud of the back face.
        let mirrored = bevy::math::Affine3A::from_translation(Vec3::new(0.0, 0.0, -0.03))
            * bevy::math::Affine3A::from_scale(Vec3::new(1.0, 1.0, -1.0))
            * to_gate;
        commands.entity(gate_entity).with_child((
            mesh.clone(),
            MeshMaterial3d(lamp.clone()),
            Transform::from_matrix(Mat4::from(mirrored)),
            ChevronLamp(index, lamp),
        ));
    }
}
