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

## Build it with Docker or Podman (no Rust needed)

You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/) or
[Podman](https://podman.io/). Then, in this `native` folder:

```bash
./docker-build.sh
```

The script uses Docker if it's running, and otherwise Podman. On a Mac it starts the
Podman machine for you if needed. To choose the engine yourself:

```bash
CONTAINER_ENGINE=podman ./docker-build.sh
```

On a Mac this builds `dist/macos/Some Awesome Game.app`. It is a universal app that runs on
both Apple silicon and Intel Macs. Double-click it to play, or drag it to Applications.

The Mac build needs Apple's macOS SDK. Apple doesn't allow it to be put in a container
image, so the script copies the SDK from your Mac's Command Line Tools into `macos-sdk/`
next to the Dockerfile, then builds. If you don't have the Command Line Tools, install them
once with this command. It's free and doesn't install Rust:

```bash
xcode-select --install
```

On Linux, or with `./docker-build.sh linux`, the script builds a Linux executable in
`dist/linux/`. The first build takes about 10 to 20 minutes. Later builds reuse the
container cache and are much faster.

## Company-managed Macs (ThreatLocker and similar)

Allowlisting tools such as ThreatLocker block every program that your IT hasn't approved,
however the program is built. That's their job, so the game can't avoid it. It has to be
approved. The build signs the app and ends by printing the details an administrator needs:
bundle ID, path, SHA-256 hash and signature.

- **With an Apple Developer ID**, sign with it, and optionally notarize:

  ```bash
  SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)" NOTARY_PROFILE=my-profile ./docker-build.sh
  ```

  Your administrator can then approve the app by its certificate. That approval keeps
  working for every future build.
- **Without one**, the app gets an ad-hoc signature, which is enough for macOS to run it.
  An allowlisting tool can then approve it only by file hash, which changes with every
  rebuild, so ask again after updating.

To sign an app you already built:

```bash
./tools/sign-macos.sh "dist/macos/Some Awesome Game.app"
```

The browser version of the game in the repository's root folder isn't a program you
install, so these tools don't block it.

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
| `src/models.rs` | The imported Sketchfab models: embedded in the executable, scaled to each hull, and the gate's spinning ring and chevron lights |
| `src/meshes.rs` | Procedural models: hulls, asteroids, Atlantis, the gate and the DHD, and planet textures |
| `src/data.rs` | Hulls, modules, materials and systems. These are exported from the web game by `tools/export-game-data.mjs`. |
| `src/testdrive.rs` | A scripted self-test. Run with `SAG_TEST=<folder>` and the game plays itself, saves screenshots to that folder, then quits. |

## 3D models

The F-302, Death Glider, Puddle Jumper, X-303, Al'kesh, X-304, Ha'tak, the Stargate and
Atlantis are fan-made models from [Sketchfab](https://sketchfab.com), used under their
Creative Commons licenses. `assets/models/CREDITS.txt` lists each model, its author and its
license. The Asgard and Aurora ships, the DHD and the asteroids are still generated by
the game.

The files in `assets/models/` are already prepared for the game:
- rotated so the bow faces forward;
- centred and scaled to a standard size;
- simplified where the meshes were very heavy;
- textures resized to keep the executable small.

To change the selection or redo them, edit `tools/models/models.json` and run:

```bash
cd tools/models
npm install
SKETCHFAB_TOKEN=<your Sketchfab API token> npm run download
npm run prepare-models
```

To check a model's orientation, render it from four sides:

```bash
cargo run --features dev-tools --bin model_viewer -- assets/models x302.glb /tmp/x302
```

## Credits

- Sounds: Stargate Carter Addon Pack (CC BY-NC-SA 4.0). See `assets/sounds/CREDITS.txt`.
- 3D models: rossrobotics, ska-ara, Ace_Fighter, TaurWing and anquietas-sys on Sketchfab
  (CC BY 4.0, CC BY-NC 4.0 and CC BY-NC-SA 4.0). See `assets/models/CREDITS.txt`.

Some of these licenses don't allow commercial use, so this game must not be sold.
