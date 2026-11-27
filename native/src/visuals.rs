//! Mirrors the simulation into Bevy entities: asteroids, ships with shields and engine
//! glow, ore, missiles, GPU particles, the Stargate, the DHD, Atlantis, the planet, the
//! starfield, the hyperspace / wormhole tunnel and the chase camera.

use crate::data::{data, rgb};
use crate::meshes;
use crate::sim::*;
use bevy::core_pipeline::bloom::Bloom;
use bevy::core_pipeline::tonemapping::Tonemapping;
use bevy::input::mouse::AccumulatedMouseScroll;
use bevy::prelude::*;
use bevy::render::mesh::{Indices, PrimitiveTopology};
use bevy::render::render_asset::RenderAssetUsages;
use std::collections::HashMap;
use std::f32::consts::{FRAC_PI_2, PI, TAU};

pub const PARTICLE_POOL: usize = 1800;

#[derive(Component)]
pub struct MainCamera;
#[derive(Component)]
pub struct RockVis(pub u64);
#[derive(Component)]
pub struct ShipVis(pub u64, pub String);
#[derive(Component)]
pub struct OreVis(pub u64);
#[derive(Component)]
pub struct MissileVis(pub u64);
#[derive(Component)]
pub struct ParticleVis(pub usize);
#[derive(Component)]
pub struct ShieldVis(pub u64, pub Handle<StandardMaterial>);
#[derive(Component)]
pub struct EngineGlow(pub u64, pub f32);
#[derive(Component)]
pub struct SystemVis;
#[derive(Component)]
pub struct GateSpin;
#[derive(Component)]
pub struct ChevronLamp(pub usize, pub Handle<StandardMaterial>);
#[derive(Component)]
pub struct Horizon(pub Handle<StandardMaterial>);
#[derive(Component)]
pub struct Kawoosh;
#[derive(Component)]
pub struct GateLight;
#[derive(Component)]
pub struct DhdDome(pub Handle<StandardMaterial>);
#[derive(Component)]
pub struct Sky;
#[derive(Component)]
pub struct Tunnel;
#[derive(Component)]
pub struct TunnelRing(pub usize);
#[derive(Component)]
pub struct TunnelWall(pub Handle<StandardMaterial>);
#[derive(Component)]
pub struct HyperWindow;
#[derive(Component)]
pub struct Spinner(pub Vec3);

#[derive(Resource)]
pub struct Art {
    rocks: Vec<Handle<Mesh>>,
    rock_mats: HashMap<String, Handle<StandardMaterial>>,
    hulls: HashMap<String, (Handle<Mesh>, Handle<Mesh>, Handle<StandardMaterial>, Handle<StandardMaterial>)>,
    pub sphere: Handle<Mesh>,
    ore_mesh: Handle<Mesh>,
    ore_mats: HashMap<String, Handle<StandardMaterial>>,
    glow_cache: HashMap<(u8, u8, u8, u8), Handle<StandardMaterial>>,
    missile_mesh: Handle<Mesh>,
    missile_mat: Handle<StandardMaterial>,
    drone_mat: Handle<StandardMaterial>,
    exhaust_mats: HashMap<String, Handle<StandardMaterial>>,
}

#[derive(Resource)]
pub struct CameraRig {
    pub zoom: f32,
    pub rot: Quat,
    pub far_view: bool,
    pub orbit: f32,
}

impl Default for CameraRig {
    fn default() -> Self {
        CameraRig { zoom: 1.0, rot: Quat::from_rotation_y(-FRAC_PI_2), far_view: false, orbit: 0.0 }
    }
}

pub fn glow_material(color: [f32; 3], k: f32) -> StandardMaterial {
    let l = Color::srgb(color[0], color[1], color[2]).to_linear();
    StandardMaterial {
        base_color: Color::LinearRgba(LinearRgba::new(l.red * k, l.green * k, l.blue * k, 1.0)),
        unlit: true,
        alpha_mode: AlphaMode::Add,
        fog_enabled: false,
        ..default()
    }
}

fn solid(color: [f32; 3], metallic: f32, roughness: f32) -> StandardMaterial {
    StandardMaterial { base_color: Color::srgb(color[0], color[1], color[2]), metallic, perceptual_roughness: roughness, ..default() }
}

pub fn setup_art(mut commands: Commands, mut meshes: ResMut<Assets<Mesh>>, mut mats: ResMut<Assets<StandardMaterial>>) {
    let rocks = (0..meshes::ROCK_VARIANTS).map(|i| meshes.add(meshes::rock_mesh(i))).collect();
    let mut rock_mats = HashMap::new();
    rock_mats.insert("rock".to_string(), mats.add(solid(crate::sim::rock_tint(&[]), 0.0, 0.95)));
    let mut ore_mats = HashMap::new();
    for m in &data().materials {
        let tint = rock_tint(&[(m.id.clone(), 0.7)]);
        rock_mats.insert(m.id.clone(), mats.add(solid(tint, 0.1, 0.85)));
        ore_mats.insert(m.id.clone(), mats.add(glow_material(rgb(&m.color), 3.0)));
    }
    let mut hulls = HashMap::new();
    let mut exhaust_mats = HashMap::new();
    for h in &data().hulls {
        let body = meshes.add(meshes::hull_mesh(h));
        let edges = meshes.add(meshes::hull_edges(h));
        let body_mat = mats.add(StandardMaterial { base_color: Color::WHITE, metallic: 0.55, perceptual_roughness: 0.45, ..default() });
        let edge_mat = mats.add(glow_material(rgb(&h.color), 2.2));
        hulls.insert(h.id.clone(), (body, edges, body_mat, edge_mat));
        exhaust_mats.insert(h.id.clone(), mats.add(glow_material(rgb(&h.exhaust), 6.0)));
    }
    let missile_mesh = meshes.add(Capsule3d::new(1.6, 9.0).mesh().build().rotated_by(Quat::from_rotation_z(FRAC_PI_2)));
    commands.insert_resource(Art {
        rocks,
        rock_mats,
        hulls,
        sphere: meshes.add(Sphere::new(1.0).mesh().ico(3).expect("sphere")),
        ore_mesh: meshes.add(Sphere::new(1.0).mesh().ico(0).expect("ore")),
        ore_mats,
        glow_cache: HashMap::new(),
        missile_mesh,
        missile_mat: mats.add(StandardMaterial { base_color: Color::srgb(0.75, 0.75, 0.78), metallic: 0.8, perceptual_roughness: 0.3, ..default() }),
        drone_mat: mats.add(glow_material([1.0, 0.7, 0.3], 8.0)),
        exhaust_mats,
    });
}

/// Camera, lights, starfield, particle pool and the travel tunnel: things that live for
/// the whole session.
pub fn setup_scene(mut commands: Commands, mut meshes: ResMut<Assets<Mesh>>, mut mats: ResMut<Assets<StandardMaterial>>, art: Res<Art>) {
    commands.spawn((
        Camera3d::default(),
        Camera { hdr: true, clear_color: ClearColorConfig::Custom(Color::srgb(0.004, 0.006, 0.014)), ..default() },
        Projection::Perspective(PerspectiveProjection { fov: 70f32.to_radians(), near: 1.0, far: 400_000.0, ..default() }),
        Tonemapping::TonyMcMapface,
        Bloom { intensity: 0.22, ..Bloom::NATURAL },
        Msaa::Sample4,
        Transform::from_xyz(0.0, 100.0, 300.0).looking_at(Vec3::ZERO, Vec3::Y),
        MainCamera,
    ));
    commands.spawn((
        DirectionalLight { illuminance: 9000.0, shadows_enabled: false, ..default() },
        Transform::from_xyz(0.6, 0.8, 0.35).looking_at(Vec3::ZERO, Vec3::Y),
    ));
    commands.insert_resource(AmbientLight { color: Color::srgb(0.55, 0.62, 0.8), brightness: 260.0, affects_lightmapped_meshes: false });

    // Starfield: one mesh of thousands of tiny octahedra on a huge sphere, coloured by
    // star temperature, plus a faint band of the galaxy.
    let mut pos: Vec<[f32; 3]> = Vec::new();
    let mut col: Vec<[f32; 4]> = Vec::new();
    let mut idx: Vec<u32> = Vec::new();
    let mut rng = SeededRng::new(77);
    for i in 0..4200 {
        let band = i % 3 == 0;
        let mut d = Vec3::new(rng.next() * 2.0 - 1.0, rng.next() * 2.0 - 1.0, rng.next() * 2.0 - 1.0).normalize_or(Vec3::Y);
        if band {
            d.y *= 0.12;
            d = d.normalize();
        }
        let r = 150_000.0;
        let size = (60.0 + rng.next().powi(6) * 420.0) * if band { 0.8 } else { 1.0 };
        let t = rng.next();
        let bright = 0.6 + rng.next().powi(3) * 5.0;
        let c = if t < 0.15 { [1.0, 0.75, 0.55] } else if t < 0.35 { [0.7, 0.8, 1.0] } else { [1.0, 0.97, 0.92] };
        let l = Color::srgb(c[0], c[1], c[2]).to_linear();
        let color = [l.red * bright, l.green * bright, l.blue * bright, 1.0];
        let center = d * r;
        let base = pos.len() as u32;
        for v in [Vec3::X, -Vec3::X, Vec3::Y, -Vec3::Y, Vec3::Z, -Vec3::Z] {
            pos.push((center + v * size).to_array());
            col.push(color);
        }
        for f in [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]] {
            idx.extend(f.iter().map(|k| base + k));
        }
    }
    let stars = Mesh::new(PrimitiveTopology::TriangleList, RenderAssetUsages::default())
        .with_inserted_attribute(Mesh::ATTRIBUTE_POSITION, pos)
        .with_inserted_attribute(Mesh::ATTRIBUTE_COLOR, col)
        .with_inserted_indices(Indices::U32(idx));
    commands.spawn((
        Mesh3d(meshes.add(stars)),
        MeshMaterial3d(mats.add(StandardMaterial { base_color: Color::WHITE, unlit: true, fog_enabled: false, cull_mode: None, ..default() })),
        Transform::default(),
        Sky,
    ));

    for i in 0..PARTICLE_POOL {
        commands.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(art.missile_mat.clone()), Transform::default(), Visibility::Hidden, ParticleVis(i)));
    }

    // Tunnel: an inside-out cylinder plus rushing rings, shown around the camera in transit.
    let wall = mats.add(StandardMaterial {
        base_color: Color::LinearRgba(LinearRgba::new(0.05, 0.2, 0.8, 1.0)),
        unlit: true,
        cull_mode: None,
        fog_enabled: false,
        ..default()
    });
    let ring_mat = mats.add(glow_material([0.6, 0.85, 1.0], 5.0));
    let ring = meshes.add(Torus::new(118.0, 124.0).mesh().minor_resolution(8).major_resolution(48).build().rotated_by(Quat::from_rotation_x(FRAC_PI_2)));
    commands
        .spawn((Transform::default(), Visibility::Hidden, Tunnel))
        .with_children(|t| {
            t.spawn((
                Mesh3d(meshes.add(Cylinder::new(130.0, 6000.0).mesh().resolution(48).build().rotated_by(Quat::from_rotation_x(FRAC_PI_2)))),
                MeshMaterial3d(wall.clone()),
                Transform::from_xyz(0.0, 0.0, -2600.0),
                TunnelWall(wall),
            ));
            for i in 0..36 {
                t.spawn((Mesh3d(ring.clone()), MeshMaterial3d(ring_mat.clone()), Transform::default(), TunnelRing(i)));
            }
        });

    // Hyperspace window: a glowing disc that opens in front of the ship.
    commands.spawn((
        Mesh3d(meshes.add(Circle::new(1.0).mesh().resolution(48).build())),
        MeshMaterial3d(mats.add(StandardMaterial {
            base_color: Color::LinearRgba(LinearRgba::new(0.5, 1.4, 2.2, 0.85)),
            unlit: true,
            cull_mode: None,
            alpha_mode: AlphaMode::Add,
            ..default()
        })),
        Transform::default(),
        Visibility::Hidden,
        HyperWindow,
    ));
}

/// Rebuild the per-system scenery (gate, DHD, Atlantis, planet) after arriving somewhere.
pub fn build_system(
    mut commands: Commands,
    mut sim: ResMut<Sim>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut mats: ResMut<Assets<StandardMaterial>>,
    mut images: ResMut<Assets<Image>>,
    old: Query<Entity, With<SystemVis>>,
    art: Res<Art>,
) {
    if !sim.system_changed {
        return;
    }
    sim.system_changed = false;
    for e in &old {
        commands.entity(e).despawn();
    }
    let sys = data().system(&sim.system);
    let stone = mats.add(StandardMaterial {
        base_color: Color::srgb(1.0, 0.98, 0.95),
        emissive: LinearRgba::rgb(0.03, 0.035, 0.045),
        metallic: 0.3,
        perceptual_roughness: 0.6,
        ..default()
    });

    // Stargate.
    let horizon_mat = mats.add(StandardMaterial {
        base_color: Color::LinearRgba(LinearRgba::new(1.6, 1.8, 2.4, 1.0)),
        base_color_texture: Some(images.add(meshes::horizon_texture())),
        unlit: true,
        cull_mode: None,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let lamp_off = [0.35, 0.15, 0.08];
    commands
        .spawn((Transform::from_translation(sim.gate.pos), Visibility::Visible, SystemVis))
        .with_children(|g| {
            g.spawn((Mesh3d(meshes.add(meshes::gate_ring(68.0, GATE_RADIUS + 2.0, 12.0))), MeshMaterial3d(stone.clone()), Transform::default()));
            g.spawn((Mesh3d(meshes.add(meshes::gate_ring(GATE_INNER - 1.0, 68.5, 9.0))), MeshMaterial3d(stone.clone()), Transform::default(), GateSpin));
            let chev = meshes.add(meshes::chevron());
            for i in 0..9 {
                let a = FRAC_PI_2 + i as f32 * TAU / 9.0;
                let lamp = mats.add(glow_material(lamp_off, 1.0));
                // Chevrons stand proud of both faces with a lamp on each side, so the
                // gate reads the same from either approach.
                g.spawn((Mesh3d(chev.clone()), MeshMaterial3d(stone.clone()), Transform::from_xyz(a.cos() * 77.0, a.sin() * 77.0, 0.0)
                    .with_rotation(Quat::from_rotation_z(a - FRAC_PI_2) * Quat::from_rotation_x(FRAC_PI_2))
                    .with_scale(Vec3::new(1.2, 1.35, 1.2))))
                    .with_children(|c| {
                        for side in [1.0, -1.0] {
                            c.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(lamp.clone()), Transform::from_xyz(0.0, 6.4 * side, 1.5).with_scale(Vec3::new(4.0, 1.0, 3.2)), ChevronLamp(i, lamp.clone())));
                        }
                    });
            }
            g.spawn((Mesh3d(meshes.add(Circle::new(GATE_INNER).mesh().resolution(64).build())), MeshMaterial3d(horizon_mat.clone()), Transform::default(), Visibility::Hidden, Horizon(horizon_mat)));
            g.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(mats.add(glow_material([0.5, 0.75, 1.0], 3.0))), Transform::default(), Visibility::Hidden, Kawoosh));
            g.spawn((PointLight { color: Color::srgb(0.5, 0.7, 1.0), intensity: 0.0, range: 1500.0, radius: 40.0, ..default() }, Transform::from_xyz(0.0, 0.0, 40.0), GateLight));
        });
    // DHD.
    let dome = mats.add(glow_material([1.0, 0.25, 0.1], 1.5));
    commands
        .spawn((Mesh3d(meshes.add(meshes::dhd())), MeshMaterial3d(stone.clone()), Transform::from_translation(sim.dhd_pos), SystemVis))
        .with_children(|d| {
            d.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(dome.clone()), Transform::from_xyz(0.0, 1.0, 0.0).with_scale(Vec3::new(8.0, 5.0, 8.0)), DhdDome(dome)));
        });
    // Atlantis.
    if let Some(st) = sim.station {
        let a = meshes::atlantis();
        let metal = mats.add(StandardMaterial { base_color: Color::WHITE, metallic: 0.7, perceptual_roughness: 0.35, ..default() });
        let glow = mats.add(StandardMaterial { base_color: Color::LinearRgba(LinearRgba::new(2.5, 2.5, 2.5, 1.0)), unlit: true, ..default() });
        let bubble = mats.add(StandardMaterial {
            base_color: Color::LinearRgba(LinearRgba::new(0.15, 0.35, 0.8, 0.05)),
            unlit: true,
            alpha_mode: AlphaMode::Add,
            cull_mode: None,
            ..default()
        });
        commands
            .spawn((Transform::from_translation(st), Visibility::Visible, SystemVis))
            .with_children(|c| {
                c.spawn((Mesh3d(meshes.add(a.metal)), MeshMaterial3d(metal.clone()), Transform::default()));
                c.spawn((Mesh3d(meshes.add(a.towers)), MeshMaterial3d(metal), Transform::default()));
                c.spawn((Mesh3d(meshes.add(a.glow)), MeshMaterial3d(glow), Transform::default()));
                c.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(bubble), Transform::from_xyz(0.0, -70.0, 0.0).with_scale(Vec3::new(CITY_SHIELD, CITY_SHIELD * 0.55, CITY_SHIELD))));
                c.spawn((PointLight { color: Color::srgb(0.7, 0.8, 1.0), intensity: 4.0e7, range: 1800.0, radius: 80.0, ..default() }, Transform::from_xyz(0.0, 120.0, 0.0)));
            });
    }
    // The system's planet, far off.
    let p = &sys.planet;
    let dir = Vec3::new(p.x, -p.radius * 0.4, p.y).normalize_or(Vec3::new(1.0, -0.3, 0.5));
    let distance = 70_000.0;
    let radius = (p.radius * 40.0).clamp(6000.0, 30_000.0);
    let seed = sim.system.bytes().fold(3i64, |h, b| h * 31 + b as i64) % 10_000;
    let (surface, clouds) = meshes::planet_texture(&p.kind, seed);
    let sphere = meshes.add(meshes::uv_sphere(1.0));
    commands
        .spawn((Transform::from_translation(dir * distance).with_scale(Vec3::splat(radius)), Visibility::Visible, SystemVis, Spinner(Vec3::Y * 0.004)))
        .with_children(|c| {
            c.spawn((Mesh3d(sphere.clone()), MeshMaterial3d(mats.add(StandardMaterial { base_color_texture: Some(images.add(surface)), perceptual_roughness: 0.8, fog_enabled: false, ..default() })), Transform::default()));
            c.spawn((Mesh3d(sphere.clone()), MeshMaterial3d(mats.add(StandardMaterial {
                base_color_texture: Some(images.add(clouds)), alpha_mode: AlphaMode::Blend, perceptual_roughness: 1.0, fog_enabled: false, ..default()
            })), Transform::from_scale(Vec3::splat(1.015))));
            let tint = rgb(&sys.tint);
            c.spawn((Mesh3d(sphere), MeshMaterial3d(mats.add(StandardMaterial {
                base_color: Color::LinearRgba(LinearRgba::new(tint[0] * 0.25, tint[1] * 0.3, tint[2] * 0.45, 0.25)), unlit: true,
                alpha_mode: AlphaMode::Add, cull_mode: Some(bevy::render::render_resource::Face::Front), fog_enabled: false, ..default()
            })), Transform::from_scale(Vec3::splat(1.06))));
        });
}

pub fn spin(time: Res<Time>, mut q: Query<(&Spinner, &mut Transform)>) {
    for (s, mut t) in &mut q {
        t.rotate(Quat::from_scaled_axis(s.0 * time.delta_secs()));
    }
}

fn rock_rotation(r: &Rock) -> Quat {
    Quat::from_axis_angle(r.axis, r.angle)
}

pub fn sync_rocks(mut commands: Commands, sim: Res<Sim>, art: Res<Art>, mut q: Query<(Entity, &RockVis, &mut Transform)>) {
    let index: HashMap<u64, usize> = sim.rocks.iter().enumerate().map(|(i, r)| (r.id, i)).collect();
    let mut seen = std::collections::HashSet::new();
    for (e, v, mut t) in &mut q {
        match index.get(&v.0) {
            Some(&i) => {
                let r = &sim.rocks[i];
                t.translation = r.pos;
                t.rotation = rock_rotation(r);
                t.scale = Vec3::splat(r.radius);
                seen.insert(v.0);
            }
            None => commands.entity(e).despawn(),
        }
    }
    for r in &sim.rocks {
        if seen.contains(&r.id) {
            continue;
        }
        let mat = art.rock_mats.get(r.dominant()).or_else(|| art.rock_mats.get("rock")).cloned().unwrap();
        commands.spawn((
            Mesh3d(art.rocks[r.variant % art.rocks.len()].clone()),
            MeshMaterial3d(mat),
            Transform::from_translation(r.pos).with_rotation(rock_rotation(r)).with_scale(Vec3::splat(r.radius)),
            RockVis(r.id),
        ));
    }
}

pub fn sync_ores(mut commands: Commands, sim: Res<Sim>, art: Res<Art>, mut q: Query<(Entity, &OreVis, &mut Transform)>) {
    let index: HashMap<u64, usize> = sim.ores.iter().enumerate().map(|(i, o)| (o.id, i)).collect();
    let mut seen = std::collections::HashSet::new();
    for (e, v, mut t) in &mut q {
        match index.get(&v.0) {
            Some(&i) => {
                let o = &sim.ores[i];
                t.translation = o.pos;
                t.rotation = Quat::from_euler(EulerRot::XYZ, o.angle, o.angle * 0.7, 0.0);
                seen.insert(v.0);
            }
            None => commands.entity(e).despawn(),
        }
    }
    for o in &sim.ores {
        if seen.contains(&o.id) {
            continue;
        }
        let Some(mat) = art.ore_mats.get(&o.material).cloned() else { continue };
        commands.spawn((Mesh3d(art.ore_mesh.clone()), MeshMaterial3d(mat), Transform::from_translation(o.pos).with_scale(Vec3::splat(4.0)), OreVis(o.id)));
    }
}

pub fn sync_missiles(mut commands: Commands, sim: Res<Sim>, art: Res<Art>, mut q: Query<(Entity, &MissileVis, &mut Transform)>) {
    let index: HashMap<u64, usize> = sim.missiles.iter().enumerate().map(|(i, m)| (m.id, i)).collect();
    let mut seen = std::collections::HashSet::new();
    for (e, v, mut t) in &mut q {
        match index.get(&v.0) {
            Some(&i) => {
                let m = &sim.missiles[i];
                t.translation = m.pos;
                t.rotation = Quat::from_rotation_arc(Vec3::X, m.dir.normalize_or(Vec3::X));
                seen.insert(v.0);
            }
            None => commands.entity(e).despawn(),
        }
    }
    for m in &sim.missiles {
        if seen.contains(&m.id) {
            continue;
        }
        let rot = Quat::from_rotation_arc(Vec3::X, m.dir.normalize_or(Vec3::X));
        if m.kind == Kind::Drone {
            commands.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(art.drone_mat.clone()), Transform::from_translation(m.pos).with_scale(Vec3::new(5.0, 2.5, 2.5)).with_rotation(rot), MissileVis(m.id)));
        } else {
            commands.spawn((Mesh3d(art.missile_mesh.clone()), MeshMaterial3d(art.missile_mat.clone()), Transform::from_translation(m.pos).with_rotation(rot), MissileVis(m.id)));
        }
    }
}

pub fn sync_ships(
    mut commands: Commands,
    sim: Res<Sim>,
    art: Res<Art>,
    mut mats: ResMut<Assets<StandardMaterial>>,
    mut q: Query<(Entity, &ShipVis, &mut Transform, &mut Visibility)>,
) {
    let index: HashMap<u64, usize> = sim.ships.iter().enumerate().map(|(i, s)| (s.id, i)).collect();
    let mut seen = std::collections::HashSet::new();
    for (e, v, mut t, mut vis) in &mut q {
        match index.get(&v.0) {
            Some(&i) if sim.ships[i].stats.hull.id == v.1 => {
                let s = &sim.ships[i];
                t.translation = s.pos;
                t.rotation = s.rot;
                *vis = if s.alive && !s.hidden { Visibility::Visible } else { Visibility::Hidden };
                seen.insert(v.0);
            }
            _ => commands.entity(e).despawn(),
        }
    }
    for s in &sim.ships {
        if seen.contains(&s.id) {
            continue;
        }
        let h = &s.stats.hull;
        let Some((body, edges, body_mat, edge_mat)) = art.hulls.get(&h.id).cloned() else { continue };
        let exhaust = art.exhaust_mats.get(&h.id).cloned().unwrap();
        let (c, radii) = s.shield_shape();
        let shield_mat = mats.add(StandardMaterial {
            base_color: Color::LinearRgba(LinearRgba::new(0.0, 0.0, 0.0, 0.0)),
            unlit: true,
            alpha_mode: AlphaMode::Add,
            cull_mode: None,
            ..default()
        });
        let id = s.id;
        commands
            .spawn((Transform::from_translation(s.pos).with_rotation(s.rot), Visibility::Visible, ShipVis(s.id, h.id.clone())))
            .with_children(|p| {
                p.spawn((Mesh3d(body), MeshMaterial3d(body_mat), Transform::default()));
                p.spawn((Mesh3d(edges), MeshMaterial3d(edge_mat), Transform::default()));
                p.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(shield_mat.clone()), Transform::from_translation(c).with_scale(radii), ShieldVis(id, shield_mat)));
                for en in &h.engines {
                    p.spawn((Mesh3d(art.sphere.clone()), MeshMaterial3d(exhaust.clone()), Transform::from_xyz(en.x, 0.0, en.y), EngineGlow(id, en.size)));
                }
                if s.side == Side::Player {
                    p.spawn((PointLight { color: Color::srgb(0.9, 0.95, 1.0), intensity: 2.0e6, range: 600.0, ..default() }, Transform::from_xyz(h.radius * 1.5, h.radius * 0.6 + 20.0, 0.0)));
                }
            });
    }
}

pub fn update_ship_fx(
    sim: Res<Sim>,
    mut mats: ResMut<Assets<StandardMaterial>>,
    shields: Query<&ShieldVis>,
    mut engines: Query<(&EngineGlow, &mut Transform)>,
) {
    let index: HashMap<u64, usize> = sim.ships.iter().enumerate().map(|(i, s)| (s.id, i)).collect();
    for sv in &shields {
        let Some(&i) = index.get(&sv.0) else { continue };
        let s = &sim.ships[i];
        let flash = (s.shield_flash / SHIELD_FLASH_TIME).max(0.0);
        let level = s.shield_level;
        let c = rgb(&s.stats.hull.shield_color);
        let l = Color::srgb(c[0], c[1], c[2]).to_linear();
        let k = level * 0.04 + flash * 0.45 * level.max(0.3);
        if let Some(m) = mats.get_mut(&sv.1) {
            m.base_color = Color::LinearRgba(LinearRgba::new(l.red * k, l.green * k, l.blue * k, 1.0));
        }
    }
    for (eg, mut t) in &mut engines {
        let Some(&i) = index.get(&eg.0) else { continue };
        let s = &sim.ships[i];
        let k = 0.25 + s.thrust_level * 0.9;
        let flicker = 0.9 + 0.1 * (sim.time * 40.0 + eg.1).sin();
        t.scale = Vec3::new(eg.1 * (0.6 + s.thrust_level * 1.6) * flicker, eg.1 * 0.45 * k, eg.1 * 0.45 * k).max(Vec3::splat(0.01));
    }
}

pub fn sync_particles(
    sim: Res<Sim>,
    mut art: ResMut<Art>,
    mut mats: ResMut<Assets<StandardMaterial>>,
    mut q: Query<(&ParticleVis, &mut Transform, &mut Visibility, &mut MeshMaterial3d<StandardMaterial>)>,
) {
    let n = sim.particles.len();
    for (pv, mut t, mut vis, mut mat) in &mut q {
        if pv.0 >= n {
            if *vis != Visibility::Hidden {
                *vis = Visibility::Hidden;
            }
            continue;
        }
        let p = &sim.particles[n - 1 - pv.0];
        let fade = (p.life / 0.3).min(1.0);
        t.translation = p.pos;
        t.scale = Vec3::splat((p.size * 0.5 * fade).max(0.05));
        *vis = Visibility::Visible;
        let key = ((p.color[0] * 15.0) as u8, (p.color[1] * 15.0) as u8, (p.color[2] * 15.0) as u8, p.glow.round().min(8.0) as u8);
        let handle = art
            .glow_cache
            .entry(key)
            .or_insert_with(|| {
                let c = [key.0 as f32 / 15.0, key.1 as f32 / 15.0, key.2 as f32 / 15.0];
                if key.3 == 0 {
                    mats.add(StandardMaterial { base_color: Color::srgba(c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, 0.14), alpha_mode: AlphaMode::Blend, unlit: true, ..default() })
                } else {
                    mats.add(glow_material(c, key.3 as f32 * 1.2))
                }
            })
            .clone();
        if mat.0 != handle {
            mat.0 = handle;
        }
    }
}

/// Tracers, beams and tractor lines as HDR gizmo lines.
pub fn draw_lines(sim: Res<Sim>, mut gizmos: Gizmos) {
    let hdr = |c: [f32; 3], k: f32| {
        let l = Color::srgb(c[0], c[1], c[2]).to_linear();
        Color::LinearRgba(LinearRgba::new(l.red * k, l.green * k, l.blue * k, 1.0))
    };
    for b in &sim.bullets {
        match b.kind {
            Kind::Plasma => {
                let d = b.vel.normalize_or_zero();
                gizmos.line(b.pos - d * 16.0, b.pos + d * 4.0, hdr([1.0, 0.6, 0.2], 10.0));
                gizmos.sphere(Isometry3d::from_translation(b.pos), 3.5, hdr([1.0, 0.8, 0.4], 12.0));
            }
            _ => {
                let tail = b.pos - b.vel * 0.02;
                let color = if b.side == Side::Player { [1.0, 0.85, 0.5] } else { [1.0, 0.45, 0.35] };
                gizmos.line(tail, b.pos, hdr(color, 6.0));
            }
        }
    }
    for s in &sim.ships {
        for t in &s.turrets {
            if let Some((a, b)) = t.beam {
                let flicker = 0.8 + 0.2 * (sim.time * 60.0).sin();
                gizmos.line(a, b, hdr([0.6, 0.85, 1.0], 14.0 * flicker));
                let side = (b - a).cross(Vec3::Y).normalize_or(Vec3::X) * 0.8;
                gizmos.line(a + side, b + side, hdr([0.4, 0.6, 1.0], 5.0));
                gizmos.line(a - side, b - side, hdr([0.4, 0.6, 1.0], 5.0));
            }
        }
    }
    let p = sim.player();
    for o in sim.ores.iter().filter(|o| o.tractored) {
        gizmos.line(p.pos, o.pos, hdr([0.4, 0.9, 1.0], 1.2));
    }
}

pub fn update_gate_visuals(
    sim: Res<Sim>,
    time: Res<Time>,
    mut mats: ResMut<Assets<StandardMaterial>>,
    mut spin: Query<&mut Transform, (With<GateSpin>, Without<Horizon>, Without<Kawoosh>)>,
    lamps: Query<&ChevronLamp>,
    mut horizon: Query<(&Horizon, &mut Transform, &mut Visibility), (Without<GateSpin>, Without<Kawoosh>)>,
    mut kawoosh: Query<(&mut Transform, &mut Visibility), (With<Kawoosh>, Without<GateSpin>, Without<Horizon>)>,
    mut light: Query<&mut PointLight, With<GateLight>>,
    domes: Query<&DhdDome>,
) {
    let g = &sim.gate;
    for mut t in &mut spin {
        t.rotation = Quat::from_rotation_z(g.spin);
    }
    for lamp in &lamps {
        let lit = g.chevron_lit(lamp.0);
        if let Some(m) = mats.get_mut(&lamp.1) {
            let k = if lit { 9.0 } else { 0.6 };
            let c = Color::srgb(1.0, 0.42, 0.12).to_linear();
            m.base_color = Color::LinearRgba(LinearRgba::new(c.red * k, c.green * k, c.blue * k, 1.0));
        }
    }
    let open_k = match g.state {
        GateState::Opening => 1.0 - (g.timer / 0.8).max(0.0),
        GateState::Kawoosh | GateState::Open => 1.0,
        GateState::Closing => (g.timer / 0.9).max(0.0),
        _ => 0.0,
    };
    for (h, mut t, mut vis) in &mut horizon {
        *vis = if open_k > 0.0 { Visibility::Visible } else { Visibility::Hidden };
        let pulse = 1.0 + (time.elapsed_secs() * 3.0).sin() * 0.01;
        t.scale = Vec3::splat(open_k.max(0.01) * pulse);
        t.rotation = Quat::from_rotation_z(time.elapsed_secs() * 0.25);
        if let Some(m) = mats.get_mut(&h.0) {
            let k = 1.4 + 0.25 * (time.elapsed_secs() * 2.1).sin() + if g.state == GateState::Opening { 2.0 } else { 0.0 };
            m.base_color = Color::LinearRgba(LinearRgba::new(k * 0.9, k * 1.05, k * 1.5, 0.92));
        }
    }
    for (mut t, mut vis) in &mut kawoosh {
        if g.state == GateState::Kawoosh || g.state == GateState::Opening {
            let k = if g.state == GateState::Opening { 0.0 } else { (g.kawoosh * PI).sin() };
            *vis = Visibility::Visible;
            let length = 20.0 + 150.0 * k;
            t.translation = Vec3::new(0.0, 0.0, length * 0.7);
            t.scale = Vec3::new(GATE_INNER * (0.55 + 0.35 * k), GATE_INNER * (0.55 + 0.35 * k), length);
        } else {
            *vis = Visibility::Hidden;
        }
    }
    for mut l in &mut light {
        l.intensity = open_k * 3.0e7;
    }
    for d in &domes {
        if let Some(m) = mats.get_mut(&d.0) {
            let k = if g.busy() { 6.0 + (time.elapsed_secs() * 4.0).sin() } else if sim.near_dhd { 2.2 } else { 1.0 };
            let c = Color::srgb(1.0, 0.25, 0.1).to_linear();
            m.base_color = Color::LinearRgba(LinearRgba::new(c.red * k, c.green * k, c.blue * k, 1.0));
        }
    }
}

/// Chase camera with mouse-wheel zoom; orbits the wreck after the player dies.
pub fn update_camera(
    sim: Res<Sim>,
    time: Res<Time>,
    scroll: Res<AccumulatedMouseScroll>,
    mut rig: ResMut<CameraRig>,
    mut cam: Query<&mut Transform, (With<MainCamera>, Without<Sky>)>,
    mut sky: Query<&mut Transform, (With<Sky>, Without<MainCamera>)>,
) {
    let dt = time.delta_secs().min(0.05);
    if scroll.delta.y != 0.0 {
        rig.zoom = (rig.zoom * (1.0 - scroll.delta.y.clamp(-3.0, 3.0) * 0.1)).clamp(0.35, 12.0);
    }
    let Ok(mut t) = cam.single_mut() else { return };
    let p = sim.player();
    // In the wormhole / hyperspace the camera moves far away from the scenery so only the
    // tunnel (which follows the camera) is visible.
    let in_tunnel = matches!(sim.transition, Some(Transition::Gate { .. }) | Some(Transition::Hyper { phase: 1, .. }));
    if in_tunnel {
        t.translation = Vec3::new(0.0, 250_000.0, 0.0);
        t.rotation = rig.rot;
        for mut s in &mut sky {
            s.translation = t.translation;
        }
        return;
    }
    let base = (p.radius() * 3.0 + 45.0) * rig.zoom * if rig.far_view { 2.5 } else { 1.0 };
    if !p.alive {
        rig.orbit += dt * 0.25;
        let pos = p.pos + Vec3::new(rig.orbit.cos(), 0.4, rig.orbit.sin()) * base * 2.0;
        t.translation = t.translation.lerp(pos, (dt * 2.0).min(1.0));
        t.look_at(p.pos, Vec3::Y);
    } else {
        let want = p.rot * Quat::from_rotation_y(-FRAC_PI_2);
        let k = 1.0 - (-dt * 7.0).exp();
        rig.rot = rig.rot.slerp(want, k).normalize();
        let offset = rig.rot * Vec3::new(0.0, base * 0.3, base);
        t.translation = p.pos + offset;
        t.rotation = rig.rot;
        // Look slightly above the ship so the crosshair area stays clear.
        let ahead = p.pos + rig.rot * Vec3::new(0.0, base * 0.18, -base * 0.6);
        let up = rig.rot * Vec3::Y;
        t.look_at(ahead, up);
    }
    for mut s in &mut sky {
        s.translation = t.translation;
    }
}

pub fn update_tunnel(
    sim: Res<Sim>,
    time: Res<Time>,
    cam: Query<&Transform, (With<MainCamera>, Without<Tunnel>, Without<TunnelRing>, Without<HyperWindow>)>,
    mut tunnel: Query<(&mut Transform, &mut Visibility), (With<Tunnel>, Without<TunnelRing>, Without<HyperWindow>)>,
    mut rings: Query<(&TunnelRing, &mut Transform), (Without<Tunnel>, Without<HyperWindow>)>,
    walls: Query<&TunnelWall>,
    mut window: Query<(&mut Transform, &mut Visibility), (With<HyperWindow>, Without<Tunnel>, Without<TunnelRing>)>,
    mut mats: ResMut<Assets<StandardMaterial>>,
) {
    let Ok(cam) = cam.single() else { return };
    let (active, hyper) = match &sim.transition {
        Some(Transition::Gate { .. }) => (true, false),
        Some(Transition::Hyper { phase: 1, .. }) => (true, true),
        _ => (false, false),
    };
    if let Ok((mut t, mut vis)) = tunnel.single_mut() {
        *vis = if active { Visibility::Visible } else { Visibility::Hidden };
        if active {
            let wobble = Quat::from_rotation_z(time.elapsed_secs() * if hyper { 0.2 } else { 0.9 });
            *t = Transform::from_translation(cam.translation).with_rotation(cam.rotation * wobble);
        }
    }
    let speed = if hyper { 2600.0 } else { 1800.0 };
    let tt = time.elapsed_secs();
    for (r, mut t) in &mut rings {
        let span = 5400.0;
        let z = -((r.0 as f32 * 150.0 + tt * speed) % span);
        let sway = if hyper { 0.0 } else { (tt * 1.7 + r.0 as f32 * 0.4).sin() * 22.0 };
        t.translation = Vec3::new(sway, (tt * 1.3 + r.0 as f32 * 0.3).cos() * sway * 0.6, z - 40.0);
        t.scale = Vec3::splat(if hyper { 0.95 } else { 0.85 + 0.1 * (r.0 as f32 * 1.3 + tt * 4.0).sin() });
    }
    for w in &walls {
        if let Some(m) = mats.get_mut(&w.0) {
            let pulse = 0.8 + 0.2 * (tt * 5.0).sin();
            m.base_color = if hyper {
                Color::LinearRgba(LinearRgba::new(0.25 * pulse, 0.45 * pulse, 0.9 * pulse, 1.0))
            } else {
                Color::LinearRgba(LinearRgba::new(0.05 * pulse, 0.25 * pulse, 1.1 * pulse, 1.0))
            };
        }
    }
    if let Ok((mut t, mut vis)) = window.single_mut() {
        match &sim.transition {
            Some(Transition::Hyper { phase: 0, t: tw, window: w, .. }) => {
                *vis = Visibility::Visible;
                let r = 30.0 + 120.0 * tw.min(1.0) + (tt * 7.0).sin() * 4.0;
                let face = (cam.translation - *w).normalize_or(Vec3::Z);
                *t = Transform::from_translation(*w).with_rotation(Quat::from_rotation_arc(Vec3::Z, face)).with_scale(Vec3::splat(r));
            }
            _ => *vis = Visibility::Hidden,
        }
    }
}

/// Removes everything mirrored from the simulation (used when leaving flight).
pub fn clear_world(
    mut commands: Commands,
    q: Query<Entity, Or<(With<RockVis>, With<ShipVis>, With<OreVis>, With<MissileVis>, With<SystemVis>)>>,
    mut particles: Query<&mut Visibility, With<ParticleVis>>,
) {
    for e in &q {
        commands.entity(e).despawn();
    }
    for mut v in &mut particles {
        *v = Visibility::Hidden;
    }
}
