//! Development tool: renders a glTF model from several angles and saves screenshots, used
//! to check orientation and scale of imported ship models.
//!
//!   model_viewer <folder> <file.glb> <output prefix>
//!
//! Prints the model's bounding box. Views: front (+X looking back), side, top, three-quarter.

use bevy::prelude::*;
use bevy::render::primitives::Aabb;
use bevy::render::view::screenshot::{save_to_disk, Screenshot};

#[derive(Resource)]
struct Job {
    file: String,
    out: String,
    frame: u32,
    stable: u32,
    last_count: usize,
    bounds: Option<(Vec3, Vec3)>,
    view: usize,
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let (folder, file, out) = (args[1].clone(), args[2].clone(), args[3].clone());
    App::new()
        .add_plugins(
            DefaultPlugins
                .set(AssetPlugin { file_path: folder, ..default() })
                .set(WindowPlugin {
                    primary_window: Some(Window { resolution: (720.0_f32, 540.0_f32).into(), ..default() }),
                    ..default()
                }),
        )
        .insert_resource(Job { file, out, frame: 0, stable: 0, last_count: 0, bounds: None, view: 0 })
        .insert_resource(ClearColor(Color::srgb(0.32, 0.34, 0.38)))
        .insert_resource(AmbientLight { color: Color::WHITE, brightness: 600.0, affects_lightmapped_meshes: false })
        .add_systems(Startup, setup)
        .add_systems(Update, step)
        .run();
}

fn setup(mut commands: Commands, assets: Res<AssetServer>, job: Res<Job>) {
    commands.spawn(SceneRoot(assets.load(format!("{}#Scene0", job.file))));
    commands.spawn((Camera3d::default(), Transform::from_xyz(0.0, 0.0, 10.0)));
    commands.spawn((DirectionalLight { illuminance: 8000.0, ..default() }, Transform::from_xyz(1.0, 2.0, 1.5).looking_at(Vec3::ZERO, Vec3::Y)));
}

fn step(
    mut commands: Commands,
    mut job: ResMut<Job>,
    meshes: Query<(&Aabb, &GlobalTransform), With<Mesh3d>>,
    mut cam: Query<(&mut Transform, &mut Projection), With<Camera3d>>,
    mut exit: EventWriter<AppExit>,
) {
    job.frame += 1;
    if job.bounds.is_none() {
        let count = meshes.iter().count();
        if count > 0 && count == job.last_count {
            job.stable += 1;
        } else {
            job.stable = 0;
        }
        job.last_count = count;
        if job.stable < 20 {
            if job.frame > 3000 {
                eprintln!("model never finished loading");
                exit.write(AppExit::error());
            }
            return;
        }
        let (mut lo, mut hi) = (Vec3::splat(f32::MAX), Vec3::splat(f32::MIN));
        for (aabb, gt) in &meshes {
            let c = Vec3::from(aabb.center);
            let h = Vec3::from(aabb.half_extents);
            for i in 0..8 {
                let corner = c + h * Vec3::new(if i & 1 == 0 { -1.0 } else { 1.0 }, if i & 2 == 0 { -1.0 } else { 1.0 }, if i & 4 == 0 { -1.0 } else { 1.0 });
                let w = gt.transform_point(corner);
                lo = lo.min(w);
                hi = hi.max(w);
            }
        }
        println!("BOUNDS min={:?} max={:?} size={:?} meshes={}", lo, hi, hi - lo, meshes.iter().count());
        job.bounds = Some((lo, hi));
        job.frame = 0;
    }
    let (lo, hi) = job.bounds.unwrap();
    let center = (lo + hi) / 2.0;
    let radius = (hi - lo).length() / 2.0;
    // Each view: set the camera, wait a few frames, screenshot.
    let views = [
        ("front", Vec3::Z, Vec3::Y),
        ("side", Vec3::X, Vec3::Y),
        ("top", Vec3::Y, -Vec3::Z),
        ("quarter", Vec3::new(1.0, 0.7, 1.0).normalize(), Vec3::Y),
    ];
    if job.view >= views.len() {
        if job.frame > 10 {
            exit.write(AppExit::Success);
        }
        return;
    }
    let (name, dir, up) = views[job.view];
    if let Ok((mut t, mut p)) = cam.single_mut() {
        *t = Transform::from_translation(center + dir * radius * 2.6).looking_at(center, up);
        if let Projection::Perspective(pp) = p.as_mut() {
            pp.near = radius * 0.01;
            pp.far = radius * 20.0;
        }
    }
    if job.frame == 8 {
        let path = format!("{}-{}.png", job.out, name);
        commands.spawn(Screenshot::primary_window()).observe(save_to_disk(path));
    }
    if job.frame >= 14 {
        job.view += 1;
        job.frame = 0;
    }
}
