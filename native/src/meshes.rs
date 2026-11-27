//! Procedural geometry: ship hulls extruded from their line art, faceted asteroids, Atlantis,
//! the Stargate and DHD, planet textures.
//!
//! Ship-local frame (and the hull data): +X is the bow, +Z is starboard, +Y is up.
//! The hull art's (x, y) maps to local (x, 0, y).

use crate::data::{rgb, HullDef};
use bevy::prelude::*;
use bevy::render::mesh::{Indices, PrimitiveTopology};
use bevy::render::render_asset::RenderAssetUsages;
use bevy::render::render_resource::{Extent3d, TextureDimension, TextureFormat};

// ------------------------------------------------------------ small helpers

pub fn hash(a: i64, b: i64, seed: i64) -> f32 {
    let mut h = (a.wrapping_mul(374761393) ^ b.wrapping_mul(668265263) ^ seed.wrapping_mul(2246822519)) as u64;
    h = (h ^ (h >> 13)).wrapping_mul(1274126177);
    ((h ^ (h >> 16)) & 0xffff_ffff) as f32 / 4294967296.0
}

/// Smooth 3D value noise (fractal), deterministic per seed.
pub fn noise3(x: f32, y: f32, z: f32, seed: i64, octaves: u32) -> f32 {
    let base = |x: f32, y: f32, z: f32| -> f32 {
        let (xi, yi, zi) = (x.floor() as i64, y.floor() as i64, z.floor() as i64);
        let (xf, yf, zf) = (x - x.floor(), y - y.floor(), z - z.floor());
        let f = |t: f32| t * t * (3.0 - 2.0 * t);
        let (u, v, w) = (f(xf), f(yf), f(zf));
        let at = |dx: i64, dy: i64, dz: i64| hash(xi + dx + (zi + dz) * 7919, yi + dy, seed);
        let l = |a: f32, b: f32, t: f32| a + (b - a) * t;
        l(
            l(l(at(0, 0, 0), at(1, 0, 0), u), l(at(0, 1, 0), at(1, 1, 0), u), v),
            l(l(at(0, 0, 1), at(1, 0, 1), u), l(at(0, 1, 1), at(1, 1, 1), u), v),
            w,
        )
    };
    let (mut total, mut amp, mut freq) = (0.0, 0.5, 1.0);
    for _ in 0..octaves {
        total += base(x * freq, y * freq, z * freq) * amp;
        amp *= 0.5;
        freq *= 2.1;
    }
    total
}

fn new_mesh() -> Mesh {
    Mesh::new(PrimitiveTopology::TriangleList, RenderAssetUsages::default())
}

/// Collects flat-shaded triangles; each triangle gets its own normal.
#[derive(Default)]
pub struct MeshBuilder {
    pos: Vec<[f32; 3]>,
    nor: Vec<[f32; 3]>,
    col: Vec<[f32; 4]>,
}

impl MeshBuilder {
    /// Adds triangle a-b-c, flipped if needed so its normal points along `outward`.
    pub fn tri(&mut self, a: Vec3, b: Vec3, c: Vec3, outward: Option<Vec3>, color: [f32; 4]) {
        let mut n = (b - a).cross(c - a);
        if n.length_squared() < 1e-12 {
            return;
        }
        n = n.normalize();
        let (b, c) = match outward {
            Some(o) if n.dot(o) < 0.0 => {
                n = -n;
                (c, b)
            }
            _ => (b, c),
        };
        for p in [a, b, c] {
            self.pos.push(p.to_array());
            self.nor.push(n.to_array());
            self.col.push(color);
        }
    }

    pub fn build(self) -> Mesh {
        new_mesh()
            .with_inserted_attribute(Mesh::ATTRIBUTE_POSITION, self.pos)
            .with_inserted_attribute(Mesh::ATTRIBUTE_NORMAL, self.nor)
            .with_inserted_attribute(Mesh::ATTRIBUTE_COLOR, self.col)
    }
}

fn signed_area(pts: &[[f32; 2]]) -> f32 {
    let mut a = 0.0;
    for i in 0..pts.len() {
        let p = pts[i];
        let q = pts[(i + 1) % pts.len()];
        a += p[0] * q[1] - q[0] * p[1];
    }
    a * 0.5
}

/// Extrudes a polygon (x, z) between heights `bottom` and `top` (y), with a bevelled top
/// edge (inset by `bevel`) so plates catch the light. Concave polygons are fine.
pub fn prism(b: &mut MeshBuilder, pts: &[[f32; 2]], bottom: f32, top: f32, bevel: f32, color: [f32; 4]) {
    if pts.len() < 3 {
        return;
    }
    let mut pts: Vec<[f32; 2]> = pts.to_vec();
    if signed_area(&pts) < 0.0 {
        pts.reverse();
    }
    let n = pts.len();
    // Inset outline for the bevel (offset each vertex along its averaged inward normal).
    let inset: Vec<[f32; 2]> = (0..n)
        .map(|i| {
            let p = Vec2::from(pts[i]);
            let prev = Vec2::from(pts[(i + n - 1) % n]);
            let next = Vec2::from(pts[(i + 1) % n]);
            let e1 = (p - prev).normalize_or_zero();
            let e2 = (next - p).normalize_or_zero();
            // Inward normals for a counter-clockwise (x, z) outline.
            let n1 = Vec2::new(-e1.y, e1.x);
            let n2 = Vec2::new(-e2.y, e2.x);
            let m = (n1 + n2).normalize_or_zero();
            let k = (m.dot(n1)).max(0.35);
            (p + m * (bevel / k)).to_array()
        })
        .collect();
    let bevel_top = top;
    let wall_top = top - bevel.min((top - bottom) * 0.6);
    let flat: Vec<f64> = inset.iter().flat_map(|p| [p[0] as f64, p[1] as f64]).collect();
    let tris = earcutr::earcut(&flat, &[], 2).unwrap_or_default();
    let up = Vec3::Y;
    for t in tris.chunks(3) {
        if t.len() < 3 {
            continue;
        }
        let v = |i: usize| Vec3::new(inset[i][0], bevel_top, inset[i][1]);
        b.tri(v(t[0]), v(t[1]), v(t[2]), Some(up), color);
        let w = |i: usize| Vec3::new(pts[i][0], bottom, pts[i][1]);
        // Bottom uses the full outline triangulation below.
        let _ = w;
    }
    let flat_full: Vec<f64> = pts.iter().flat_map(|p| [p[0] as f64, p[1] as f64]).collect();
    for t in earcutr::earcut(&flat_full, &[], 2).unwrap_or_default().chunks(3) {
        if t.len() < 3 {
            continue;
        }
        let w = |i: usize| Vec3::new(pts[i][0], bottom, pts[i][1]);
        b.tri(w(t[0]), w(t[1]), w(t[2]), Some(-up), color);
    }
    for i in 0..n {
        let j = (i + 1) % n;
        let (p, q) = (Vec2::from(pts[i]), Vec2::from(pts[j]));
        let e = q - p;
        let out = Vec3::new(e.y, 0.0, -e.x);
        let (a0, b0) = (Vec3::new(p.x, bottom, p.y), Vec3::new(q.x, bottom, q.y));
        let (a1, b1) = (Vec3::new(p.x, wall_top, p.y), Vec3::new(q.x, wall_top, q.y));
        b.tri(a0, b0, b1, Some(out), color);
        b.tri(a0, b1, a1, Some(out), color);
        // Bevel strip from the wall top to the inset top face.
        let (ai, bi) = (Vec3::new(inset[i][0], bevel_top, inset[i][1]), Vec3::new(inset[j][0], bevel_top, inset[j][1]));
        let slope = (out.normalize_or_zero() + Vec3::Y).normalize();
        b.tri(a1, b1, bi, Some(slope), color);
        b.tri(a1, bi, ai, Some(slope), color);
    }
}

fn circle_pts(cx: f32, cz: f32, r: f32, steps: usize) -> Vec<[f32; 2]> {
    (0..steps)
        .map(|i| {
            let a = i as f32 / steps as f32 * std::f32::consts::TAU;
            [cx + a.cos() * r, cz + a.sin() * r]
        })
        .collect()
}

fn part_points(part: &crate::data::ArtPart) -> Option<Vec<[f32; 2]>> {
    match part.kind.as_str() {
        "rect" if part.v.len() == 4 => {
            let r = &part.v;
            Some(vec![[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]])
        }
        "circle" if part.v.len() == 3 => Some(circle_pts(part.v[0], part.v[1], part.v[2], 16)),
        "poly" => Some(part.pts.clone()),
        _ => None,
    }
}

// ------------------------------------------------------------ hulls

/// Bounds of a hull's line art in the ship frame (art x -> X, art y -> Z): (min, max).
pub fn art_bounds(hull: &HullDef) -> (Vec2, Vec2) {
    let (mut lo, mut hi) = (Vec2::splat(f32::MAX), Vec2::splat(f32::MIN));
    for part in &hull.art {
        let pts = part_points(part).unwrap_or_else(|| part.pts.clone());
        for p in pts {
            lo = lo.min(Vec2::from(p));
            hi = hi.max(Vec2::from(p));
        }
    }
    if lo.x > hi.x {
        return (Vec2::splat(-hull.radius), Vec2::splat(hull.radius));
    }
    (lo, hi)
}

/// Solid hull: every closed piece of the line art as a bevelled plate. Bigger plates are
/// thicker; later pieces (details) sit slightly higher.
pub fn hull_mesh(hull: &HullDef) -> Mesh {
    let mut b = MeshBuilder::default();
    let max_depth = (hull.radius * 0.2).max(2.5);
    let c = rgb(&hull.color);
    let color = [0.1 + c[0] * 0.32, 0.11 + c[1] * 0.32, 0.13 + c[2] * 0.34, 1.0];
    for (index, part) in hull.art.iter().enumerate() {
        let Some(pts) = part_points(part) else { continue };
        let area = signed_area(&pts).abs();
        let mut perimeter = 0.0;
        for i in 0..pts.len() {
            perimeter += Vec2::from(pts[i]).distance(Vec2::from(pts[(i + 1) % pts.len()]));
        }
        let inradius = if perimeter > 0.0 { 2.0 * area / perimeter } else { 1.0 };
        let depth = (area.sqrt() * 0.3).clamp(0.8, max_depth);
        let lift = index as f32 * 0.02 * (hull.radius / 40.0).max(1.0);
        let top = depth * 0.5 + lift;
        let bevel = (inradius * 0.4).min(depth * 0.8).max(0.15);
        prism(&mut b, &pts, -depth * 0.5, top, bevel, color);
    }
    b.build()
}

/// Glowing outline of the line art along the hull's top surfaces.
pub fn hull_edges(hull: &HullDef) -> Mesh {
    let mut pos: Vec<[f32; 3]> = Vec::new();
    let max_depth = (hull.radius * 0.2).max(2.5);
    for (index, part) in hull.art.iter().enumerate() {
        let lift = index as f32 * 0.02 * (hull.radius / 40.0).max(1.0);
        let (pts, closed) = match part_points(part) {
            Some(p) => (p, true),
            None => (part.pts.clone(), false),
        };
        if pts.len() < 2 {
            continue;
        }
        let area = signed_area(&pts).abs();
        let depth = if closed { (area.sqrt() * 0.3).clamp(0.8, max_depth) } else { 1.0 };
        let y = depth * 0.5 + lift + 0.05;
        let count = if closed { pts.len() } else { pts.len() - 1 };
        for i in 0..count {
            let p = pts[i];
            let q = pts[(i + 1) % pts.len()];
            pos.push([p[0], y, p[1]]);
            pos.push([q[0], y, q[1]]);
        }
    }
    Mesh::new(PrimitiveTopology::LineList, RenderAssetUsages::default()).with_inserted_attribute(Mesh::ATTRIBUTE_POSITION, pos)
}

// ------------------------------------------------------------ asteroids

pub const ROCK_VARIANTS: usize = 16;

/// Faceted rock shape: an icosphere pushed in and out by noise and craters, squashed a bit.
pub fn rock_mesh(index: usize) -> Mesh {
    let sphere = Sphere::new(1.0).mesh().ico(2).expect("icosphere");
    let positions: Vec<[f32; 3]> = match sphere.attribute(Mesh::ATTRIBUTE_POSITION) {
        Some(bevy::render::mesh::VertexAttributeValues::Float32x3(v)) => v.clone(),
        _ => Vec::new(),
    };
    let indices: Vec<u32> = match sphere.indices() {
        Some(Indices::U32(i)) => i.clone(),
        Some(Indices::U16(i)) => i.iter().map(|&v| v as u32).collect(),
        None => (0..positions.len() as u32).collect(),
    };
    let seed = 9000 + index as i64 * 131;
    let squash = Vec3::new(0.75 + hash(index as i64, 1, 3) * 0.3, 0.7 + hash(index as i64, 2, 3) * 0.3, 0.75 + hash(index as i64, 3, 3) * 0.3);
    let craters: Vec<(Vec3, f32, f32)> = (0..(5 + (hash(index as i64, 9, 1) * 5.0) as i64))
        .map(|i| {
            let d = Vec3::new(hash(i, index as i64, 11) - 0.5, hash(i, index as i64, 12) - 0.5, hash(i, index as i64, 13) - 0.5).normalize_or_zero();
            (d, 0.25 + hash(i, index as i64, 14) * 0.35, 0.06 + hash(i, index as i64, 15) * 0.12)
        })
        .collect();
    let displaced: Vec<(Vec3, f32)> = positions
        .iter()
        .map(|p| {
            let d = Vec3::from(*p).normalize();
            let mut r = 0.82 + noise3(d.x * 1.4 + 5.0, d.y * 1.4 + 5.0, d.z * 1.4 + 5.0, seed, 4) * 0.45;
            for (c, cr, depth) in &craters {
                let dist = d.distance(*c);
                if dist < *cr {
                    r -= depth * (1.0 - (dist / cr) * (dist / cr));
                }
            }
            (d * r * squash, r)
        })
        .collect();
    let mut b = MeshBuilder::default();
    for t in indices.chunks(3) {
        let (a, ra) = displaced[t[0] as usize];
        let (bb, rb) = displaced[t[1] as usize];
        let (c, rc) = displaced[t[2] as usize];
        let shade = (0.55 + ((ra + rb + rc) / 3.0 - 0.8) * 1.4).clamp(0.45, 1.15);
        let center = (a + bb + c) / 3.0;
        b.tri(a, bb, c, Some(center), [shade, shade * 0.96, shade * 0.9, 1.0]);
    }
    b.build()
}

// ------------------------------------------------------------ Atlantis

fn rotate_pts(pts: &[[f32; 2]], angle: f32) -> Vec<[f32; 2]> {
    let (s, c) = angle.sin_cos();
    pts.iter().map(|p| [p[0] * c - p[1] * s, p[0] * s + p[1] * c]).collect()
}

fn hexagon(r: f32, offset: f32) -> Vec<[f32; 2]> {
    (0..6)
        .map(|i| {
            let a = i as f32 / 6.0 * std::f32::consts::TAU + offset;
            [a.cos() * r, a.sin() * r]
        })
        .collect()
}

fn boxy(b: &mut MeshBuilder, x: f32, z: f32, w: f32, d: f32, bottom: f32, top: f32, angle: f32, color: [f32; 4]) {
    let pts = rotate_pts(&[[-w / 2.0, -d / 2.0], [w / 2.0, -d / 2.0], [w / 2.0, d / 2.0], [-w / 2.0, d / 2.0]], angle);
    let pts: Vec<[f32; 2]> = pts.iter().map(|p| [p[0] + x, p[1] + z]).collect();
    prism(b, &pts, bottom, top, 0.8, color);
}

pub struct AtlantisMeshes {
    pub metal: Mesh,
    pub towers: Mesh,
    pub glow: Mesh,
}

/// Atlantis: stepped hub with the tall central spire, six piers (three long ones with big
/// platforms), towers with lit windows (vertex-coloured), all below the flight plane.
pub fn atlantis() -> AtlantisMeshes {
    let deck = -70.0;
    let mut metal = MeshBuilder::default();
    let mut towers = MeshBuilder::default();
    let mut glow = MeshBuilder::default();
    let steel = [0.62, 0.69, 0.78, 1.0];
    let dark = [0.29, 0.35, 0.44, 1.0];
    prism(&mut metal, &hexagon(92.0, std::f32::consts::PI / 6.0), deck - 14.0, deck + 8.0, 2.0, steel);
    prism(&mut metal, &hexagon(70.0, 0.0), deck + 8.0, deck + 20.0, 2.0, dark);
    prism(&mut metal, &hexagon(48.0, std::f32::consts::PI / 6.0), deck + 20.0, deck + 32.0, 2.0, steel);
    // Spire: a tapering stack of octagonal prisms.
    for k in 0..6 {
        let r = 17.0 - k as f32 * 2.0;
        let y0 = deck + 32.0 + k as f32 * 11.0;
        prism(&mut towers, &circle_pts(0.0, 0.0, r, 8), y0, y0 + 11.0, 1.0, [0.72, 0.78, 0.88, 1.0]);
    }
    prism(&mut glow, &circle_pts(0.0, 0.0, 6.0, 8), deck + 98.0, deck + 112.0, 2.5, [0.45, 0.7, 1.0, 1.0]);
    for i in 0..6 {
        let a = i as f32 / 6.0 * std::f32::consts::TAU + std::f32::consts::PI / 6.0;
        let h = 22.0 + (i % 2) as f32 * 14.0;
        boxy(&mut towers, a.cos() * 62.0, a.sin() * 62.0, 11.0, 11.0, deck + 8.0, deck + 8.0 + h, a, [0.74, 0.79, 0.86, 1.0]);
    }
    for i in 0..6 {
        let angle = i as f32 * std::f32::consts::PI / 3.0 - std::f32::consts::FRAC_PI_2;
        let main = i % 2 == 0;
        let length = if main { 270.0 } else { 215.0 };
        let half = if main { 22.0 } else { 18.0 };
        let p = |pts: &[[f32; 2]]| rotate_pts(pts, angle);
        let at = |x: f32, z: f32| rotate_pts(&[[x, z]], angle)[0];
        prism(&mut metal, &p(&[[70.0, -half], [length, -half], [length, half], [70.0, half]]), deck - 6.0, deck + 4.0, 1.5, steel);
        prism(&mut metal, &p(&[[80.0, -half * 0.35], [length - 10.0, -half * 0.35], [length - 10.0, half * 0.35], [80.0, half * 0.35]]), deck + 4.0, deck + 9.0, 1.0, dark);
        if main {
            prism(&mut metal, &p(&[[length, -half], [length + 18.0, -58.0], [length + 78.0, -58.0], [length + 96.0, -26.0],
                [length + 96.0, 26.0], [length + 78.0, 58.0], [length + 18.0, 58.0], [length, half]]), deck - 8.0, deck + 6.0, 2.0, steel);
            for (k, t) in [[36.0, -18.0, 34.0], [56.0, 14.0, 48.0], [44.0, 26.0, 26.0], [62.0, -26.0, 40.0], [30.0, 30.0, 20.0], [70.0, 0.0, 30.0]].iter().enumerate() {
                let q = at(length + t[0], t[1]);
                boxy(&mut towers, q[0], q[1], 12.0, 12.0, deck + 6.0, deck + 6.0 + t[2], angle + k as f32 * 0.3, [0.74, 0.8, 0.88, 1.0]);
                // Window lights on the tower faces.
                let q2 = at(length + t[0], t[1] - 6.2);
                for level in 0..((t[2] / 8.0) as i32) {
                    let y = deck + 10.0 + level as f32 * 8.0;
                    boxy(&mut glow, q2[0], q2[1], 8.0, 0.6, y, y + 2.0, angle + k as f32 * 0.3, [1.0, 0.85, 0.55, 1.0]);
                }
            }
        } else {
            prism(&mut metal, &p(&[[length, -half], [length + 20.0, -38.0], [length + 52.0, -30.0], [length + 62.0, 0.0],
                [length + 52.0, 30.0], [length + 20.0, 38.0], [length, half]]), deck - 6.0, deck + 6.0, 2.0, steel);
            let q = at(length + 28.0, 0.0);
            boxy(&mut towers, q[0], q[1], 24.0, 24.0, deck + 6.0, deck + 30.0, angle, [0.74, 0.8, 0.88, 1.0]);
            prism(&mut glow, &circle_pts(q[0], q[1], 4.0, 8), deck + 30.0, deck + 46.0, 1.0, [0.45, 0.7, 1.0, 1.0]);
        }
    }
    AtlantisMeshes { metal: metal.build(), towers: towers.build(), glow: glow.build() }
}

// ------------------------------------------------------------ planets

pub fn planet_texture(kind: &str, seed: i64) -> (Image, Image) {
    let (base, dark, land, cloud): ([f32; 3], [f32; 3], [f32; 3], [f32; 3]) = match kind {
        "ocean" => ([40.0, 90.0, 170.0], [10.0, 30.0, 70.0], [70.0, 140.0, 120.0], [235.0, 245.0, 255.0]),
        "earth" => ([40.0, 80.0, 160.0], [10.0, 25.0, 60.0], [70.0, 130.0, 70.0], [245.0, 248.0, 255.0]),
        "desert" => ([200.0, 160.0, 100.0], [90.0, 60.0, 30.0], [170.0, 120.0, 70.0], [240.0, 225.0, 200.0]),
        "jungle" => ([60.0, 120.0, 70.0], [15.0, 40.0, 20.0], [110.0, 100.0, 60.0], [235.0, 245.0, 235.0]),
        "industrial" => ([110.0, 100.0, 110.0], [30.0, 25.0, 35.0], [80.0, 70.0, 80.0], [200.0, 195.0, 210.0]),
        "ice" => ([180.0, 220.0, 235.0], [50.0, 80.0, 110.0], [140.0, 190.0, 215.0], [250.0, 252.0, 255.0]),
        _ => ([150.0, 80.0, 60.0], [50.0, 20.0, 15.0], [110.0, 60.0, 45.0], [220.0, 190.0, 170.0]),
    };
    let land_level = match kind { "ocean" => 0.62, "earth" => 0.52, "desert" => 0.47, "jungle" => 0.4, "ice" => 0.55, _ => 0.5 };
    let cloud_level = match kind { "ocean" | "earth" => 0.55, "jungle" => 0.5, "ice" => 0.6, "industrial" => 0.62, "desert" => 0.72, _ => 0.75 };
    let (w, h) = (512u32, 256u32);
    let mut surface = vec![0u8; (w * h * 4) as usize];
    let mut clouds = vec![0u8; (w * h * 4) as usize];
    for y in 0..h {
        let lat = (y as f32 / (h - 1) as f32 - 0.5) * std::f32::consts::PI;
        let (sl, cl) = lat.sin_cos();
        for x in 0..w {
            let lon = x as f32 / w as f32 * std::f32::consts::TAU;
            let (px, py, pz) = (lon.cos() * cl * 2.2 + 10.0, sl * 2.2 + 10.0, lon.sin() * cl * 2.2 + 10.0);
            let n = noise3(px, py, pz, seed, 5);
            let detail = noise3(px * 4.0, py * 4.0, pz * 4.0, seed + 1, 3);
            let mut c = if n > land_level {
                let k = ((n - land_level) * 3.0).min(1.0);
                [0, 1, 2].map(|i| land[i] * (0.85 + detail * 0.3) * (1.0 - k * 0.25) + dark[i] * k * 0.25)
            } else {
                let k = ((land_level - n) * 2.5).min(1.0);
                [0, 1, 2].map(|i| base[i] * (1.0 - k * 0.45) + dark[i] * k * 0.45)
            };
            if kind != "desert" && kind != "industrial" {
                let cap = ((sl.abs() - 0.84 + (n - 0.5) * 0.25) * 12.0).clamp(0.0, 1.0);
                c = [0, 1, 2].map(|i| c[i] * (1.0 - cap) + [235.0, 242.0, 250.0][i] * cap);
            }
            let o = ((y * w + x) * 4) as usize;
            surface[o..o + 4].copy_from_slice(&[c[0] as u8, c[1] as u8, c[2] as u8, 255]);
            let cn = noise3(px * 1.7 + 30.0, py * 3.0 + 30.0, pz * 1.7 + 30.0, seed + 7, 5);
            let a = ((cn - cloud_level) * 5.0).clamp(0.0, 1.0);
            clouds[o..o + 4].copy_from_slice(&[cloud[0] as u8, cloud[1] as u8, cloud[2] as u8, (a * 230.0) as u8]);
        }
    }
    let make = |data: Vec<u8>| {
        Image::new(Extent3d { width: w, height: h, depth_or_array_layers: 1 }, TextureDimension::D2, data,
            TextureFormat::Rgba8UnormSrgb, RenderAssetUsages::default())
    };
    (make(surface), make(clouds))
}

/// A UV sphere whose texture coordinates wrap an equirectangular image.
pub fn uv_sphere(radius: f32) -> Mesh {
    Sphere::new(radius).mesh().uv(64, 32)
}

// ------------------------------------------------------------ Stargate

/// Outer ring of the gate, standing in the XY plane (ships fly through along Z).
pub fn gate_ring(inner: f32, outer: f32, depth: f32) -> Mesh {
    let mut b = MeshBuilder::default();
    let steps = 72;
    let stone = [0.55, 0.56, 0.6, 1.0];
    for i in 0..steps {
        let a0 = i as f32 / steps as f32 * std::f32::consts::TAU;
        let a1 = (i + 1) as f32 / steps as f32 * std::f32::consts::TAU;
        let p = |a: f32, r: f32, z: f32| Vec3::new(a.cos() * r, a.sin() * r, z);
        let mid0 = Vec3::new(a0.cos(), a0.sin(), 0.0);
        let h = depth / 2.0;
        // Front and back faces, outer and inner walls.
        b.tri(p(a0, inner, h), p(a0, outer, h), p(a1, outer, h), Some(Vec3::Z), stone);
        b.tri(p(a0, inner, h), p(a1, outer, h), p(a1, inner, h), Some(Vec3::Z), stone);
        b.tri(p(a0, inner, -h), p(a0, outer, -h), p(a1, outer, -h), Some(-Vec3::Z), stone);
        b.tri(p(a0, inner, -h), p(a1, outer, -h), p(a1, inner, -h), Some(-Vec3::Z), stone);
        b.tri(p(a0, outer, -h), p(a1, outer, -h), p(a1, outer, h), Some(mid0), stone);
        b.tri(p(a0, outer, -h), p(a1, outer, h), p(a0, outer, h), Some(mid0), stone);
        b.tri(p(a0, inner, -h), p(a1, inner, -h), p(a1, inner, h), Some(-mid0), stone);
        b.tri(p(a0, inner, -h), p(a1, inner, h), p(a0, inner, h), Some(-mid0), stone);
        // Raised segments on the front face, like the gate's symbol ring.
        if i % 2 == 0 {
            let r0 = inner + 5.0;
            let r1 = outer - 6.0;
            let am = (a0 + a1) / 2.0;
            let s = [0.42, 0.43, 0.47, 1.0];
            b.tri(p(a0 + 0.005, r0, h + 1.2), p(a0 + 0.005, r1, h + 1.2), p(am, r1, h + 1.2), Some(Vec3::Z), s);
            b.tri(p(a0 + 0.005, r0, h + 1.2), p(am, r1, h + 1.2), p(am, r0, h + 1.2), Some(Vec3::Z), s);
        }
    }
    b.build()
}

/// A chevron: a wedge on the outer rim.
pub fn chevron() -> Mesh {
    let mut b = MeshBuilder::default();
    prism(&mut b, &[[-8.0, -4.0], [8.0, -4.0], [4.0, 7.0], [0.0, 9.0], [-4.0, 7.0]], -6.0, 6.0, 1.0, [0.6, 0.6, 0.65, 1.0]);
    b.build()
}

pub fn dhd() -> Mesh {
    let mut b = MeshBuilder::default();
    let octagon: Vec<[f32; 2]> = (0..8)
        .map(|i| {
            let a = i as f32 * std::f32::consts::PI / 4.0 + std::f32::consts::PI / 8.0;
            [a.cos() * 30.0, a.sin() * 30.0]
        })
        .collect();
    prism(&mut b, &octagon, -20.0, 0.0, 3.0, [0.36, 0.35, 0.33, 1.0]);
    for (r, n) in [(24.0, 19), (16.0, 20)] {
        for i in 0..n {
            let a = i as f32 / n as f32 * std::f32::consts::TAU;
            boxy(&mut b, a.cos() * r, a.sin() * r, 4.0, 4.0, 0.0, 2.5, a, [0.6, 0.58, 0.54, 1.0]);
        }
    }
    b.build()
}

/// Rippling event-horizon texture (radial waves), animated by rotating and pulsing.
pub fn horizon_texture() -> Image {
    let size = 256u32;
    let mut px = vec![0u8; (size * size * 4) as usize];
    for y in 0..size {
        for x in 0..size {
            let u = x as f32 / size as f32 * 2.0 - 1.0;
            let v = y as f32 / size as f32 * 2.0 - 1.0;
            let r = (u * u + v * v).sqrt();
            let angle = v.atan2(u);
            let ripple = (r * 30.0).sin() * 0.5 + 0.5;
            let swirl = (angle * 5.0 + r * 9.0).sin() * 0.5 + 0.5;
            let k = ((1.0 - r).max(0.0).powf(1.4) * 0.75 + ripple * 0.22 + swirl * 0.1).clamp(0.0, 1.0);
            let c = [0.08 + (0.78 - 0.08) * k, 0.22 + (0.9 - 0.22) * k, 0.68 + (1.0 - 0.68) * k];
            let a = if r > 1.0 { 0.0 } else { ((1.0 - r) / 0.08).clamp(0.0, 1.0) };
            let o = ((y * size + x) * 4) as usize;
            px[o..o + 4].copy_from_slice(&[(c[0] * 255.0) as u8, (c[1] * 255.0) as u8, (c[2] * 255.0) as u8, (a * 255.0) as u8]);
        }
    }
    Image::new(Extent3d { width: size, height: size, depth_or_array_layers: 1 }, TextureDimension::D2, px,
        TextureFormat::Rgba8UnormSrgb, RenderAssetUsages::default())
}
