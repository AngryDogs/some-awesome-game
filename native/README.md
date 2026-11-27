# Some Awesome Game: native edition

A Stargate-themed 3D space mining and combat game. It is written in Rust with the Bevy
engine, and it runs on the graphics card through wgpu: Metal on macOS and Vulkan on Linux.
Everything the game needs is built into one executable: models are generated in code, and
the sounds, font and game data are embedded. Your save is kept in:

- macOS: `~/Library/Application Support/SomeAwesomeGame/profile.json`
- Linux: `~/.local/share/SomeAwesomeGame/profile.json`

## Download

Every push to this branch runs the **Native game** GitHub Actions workflow. It builds:

- `SomeAwesomeGame-macos`: a universal `Some Awesome Game.app` (Apple silicon and Intel, macOS 11+).
- `SomeAwesomeGame-linux`: an x86_64 executable.

Download them from the workflow run's *Artifacts* section.

The macOS app is not notarized. The first time you open it, right-click the app and
choose **Open**. You can also clear the quarantine flag from Terminal:

```bash
xattr -dr com.apple.quarantine "Some Awesome Game.app"
```

## Build it with Docker (no Rust needed)

You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/). Then, in
this `native` folder:

```bash
./docker-build.sh
```

On a Mac this builds `dist/macos/Some Awesome Game.app`. It is a universal app that runs on
both Apple silicon and Intel Macs. Double-click it to play, or drag it to Applications.

The Mac build needs Apple's macOS SDK. Apple doesn't allow it to be put in a Docker image,
so the script hands in the SDK from your Mac's Command Line Tools. If you don't have them,
install them once with this command. It's free and doesn't install Rust:

```bash
xcode-select --install
```

On Linux, or with `./docker-build.sh linux`, the script builds a Linux executable in
`dist/linux/`. The first build takes about 10 to 20 minutes. Later builds reuse Docker's
cache and are much faster.

## Build it yourself

Install Rust from https://rustup.rs. Then, in this `native` folder:

```bash
cargo run --release
```

To build the macOS app bundle on a Mac:

```bash
./tools/bundle-macos.sh
```

The app is written to `target/macos/`. Add `--native` to build only for your Mac's chip,
which is faster.

On Linux you need these system packages: `libasound2-dev libudev-dev libwayland-dev libxkbcommon-dev`.

## Playing

You start at Atlantis in an F-302. Mine asteroids, sell the ore, and buy bigger hulls and
modules in the shipyard. Fight Goa'uld raiders. Travel to other systems through the
Stargate, or by hyperdrive on the bigger ships.

| Input | Action |
| --- | --- |
| Mouse | Steer. The ring around the centre of the screen only aims; move the cursor further out to turn. |
| Left mouse | Fire guns |
| Right mouse / Shift | Missiles and drones |
| W / S | Thrust / reverse |
| A / D | Strafe |
| R / F (Space / Ctrl) | Up / down |
| Q / E | Roll |
| X | Stabilizer on/off |
| H | Shields up/down (lower them to collect ore with the tractor) |
| T | Target mode: ships, asteroids or both (needs a guidance module) |
| C | Turret auto-targeting on/off |
| 1-6 | Switch weapon groups on/off |
| V / mouse wheel | Far camera / zoom |
| G | Use the DHD next to the Stargate. Press G again to close the gate. |
| M | Hyperdrive star map |
| B | Dock at Atlantis |
| Esc / F1 / F11 | Pause / controls / fullscreen |

How combat works:

- Shields stop kinetic rounds (minigun, missiles) well, but energy weapons (staff, ion beam,
  drones) cut through them.
- Hull armour is the reverse: it resists energy weapons and is weak against kinetic rounds.
- Guns and missiles can shoot down missiles. Only drones can stop drones.

## Code layout

| File | Contents |
| --- | --- |
| `src/sim.rs` | The simulation: flight, weapons, damage, asteroids, mining, enemy AI, the Stargate and travel |
| `src/visuals.rs` | Mirrors the simulation into GPU entities, plus the particles, the gate, Atlantis, planets, the starfield, the travel tunnel and the camera |
| `src/hud.rs` | Flight HUD and radar |
| `src/ui.rs` | Menus and the shipyard |
| `src/meshes.rs` | Procedural models: hulls, asteroids, Atlantis, the gate and the DHD, and planet textures |
| `src/data.rs` | Hulls, modules, materials and systems. These are exported from the web game by `tools/export-game-data.mjs`. |
| `src/testdrive.rs` | A scripted self-test. Run with `SAG_TEST=<folder>` and the game plays itself, saves screenshots to that folder, then quits. |

## Credits

The sounds come from the Stargate Carter Addon Pack (CC BY-NC-SA 4.0). See
`assets/sounds/CREDITS.txt`.
