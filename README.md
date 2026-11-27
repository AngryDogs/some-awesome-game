# some-awesome-game

Zero-gravity asteroid mining in an endless star field, with a ship-building shipyard.

## Running

```
yarn install
NODE_OPTIONS=--openssl-legacy-provider yarn build
```

Then open `index.html` through any static web server (e.g. `python3 -m http.server`).

## 3D graphics

The game is drawn in 3D on the graphics card with WebGL ([Three.js](https://threejs.org) r158,
bundled in `assets/vendor/`, MIT licence, so it also works when `index.html` is opened from
disk). A perspective camera looks straight down on the playing field:

- asteroids are lit 3D rocks built from their real (chippable) outlines with their painted
  surface wrapped on; ore pieces are faceted crystals;
- ship hulls are bevelled metal plates extruded from their line art (the glowing line art is
  drawn on top);
- Atlantis is a 3D city (central spire, piers, towers with lit windows) under a glowing
  shield dome; the Stargate has a 3D ring with a turning symbol ring and chevrons that light
  up as they lock; the DHD is a 3D pedestal;
- each system's planet is a real sphere far below with clouds, ice caps, an atmosphere glow
  and sometimes a moon; stars sit at different depths, all drifting with real parallax.

Gameplay is unchanged and still happens on a flat plane; effects, shields, the event horizon
and the HUD are drawn in a 2D layer lined up exactly with the 3D view.

The 3D view only starts with real graphics-card acceleration, and drops to the 2D view by
itself if it can't keep a playable frame rate (the fps line shows `(3D)` or `(2D)`). Add `?2d`
to the address to force the 2D view, or `?3d` to force 3D. Safari gets lighter settings
(standard resolution, smaller cached images) because of its tighter canvas limits. If
something goes wrong while playing, the game keeps running and shows the error message.

## Controls

| Action | Keys |
| --- | --- |
| Thrust / reverse | W / S |
| Rotate | A / D |
| Strafe | Q / E |
| Stabilizer on / off (cancels drift & spin you aren't steering) | X |
| Aim | Mouse |
| Guns | Left click / Space |
| Missiles | Right click / F |
| Toggle auto-targeting | G (needs a targeting computer) |
| Dock at Atlantis (shipyard) / use the DHD | B |
| Starmap (addresses, hyperspace) | M (J engages the hyperdrive) |
| Shields on / off | H (or the button at the top of the screen) |
| Cargo hold (view / eject ore) | C (or the cargo button, top right) |
| Zoom | Mouse wheel or + / - (0 resets; zooms out to a wide tactical view) |
| Targeting mode (ships / asteroids / both) | T (needs a targeting computer) |
| Weapons on / off | 1-5 (the rows of the weapon panel), or click / tap a row |
| Pause | Esc |

### Phones and tablets

Touch screens get on-screen controls automatically (play in landscape; the game goes full screen
on launch where the browser allows it):

- **Left thumb**: a joystick appears where you touch. Push towards where you want to fly: the
  ship turns to face that way (cancelling spin) and thrusts once lined up. Push harder to thrust sooner.
- **Right thumb**: touch and hold anywhere on the right side to aim there and fire the guns.
- **Missile**: hold. **Stabilize**: tap to switch the stabilizer on or off. **Dock** / **DHD** appears when you are close enough.
  **Auto** toggles auto-targeting when a targeting computer is fitted.
- **+ / -** zoom (or pinch with two fingers on one side), **II** pauses.
- Shields, cargo hold and starmap buttons sit on the left under the HUD. The starmap rotates by
  dragging and zooms by pinching; the DHD is tapped glyph by glyph.

## Enemy ships

Hostile ships turn up from time to time (never near Atlantis): Death Gliders, Al'kesh and
Ha'tak in Goa'uld space, rogue F-302s, X-303s and Jumpers elsewhere, and the odd X-304,
Aurora or Asgard ship around Othala. They use the same hulls as you, fitted at Mk II or fully
upgraded (Mk III), and carry their faction's weapons. They show red brackets with hull and
shield bars, red arrows at the screen edge and red contacts on the sensor map. Destroying one
pays a bounty; they can destroy you too.

- **Damage types**: miniguns and missiles are *kinetic*; staff cannons, Asgard beams and
  drones are *energy*. Shields are strong against kinetic hits (they lose half as much) but
  drain fast under energy fire (x1.5); bare hull is the opposite (energy x0.6, kinetic x1.25).
- **Against ships** weapons hit differently than against asteroids: miniguns x0.5 and Asgard
  beams x0.35 (they're mining tools first), staff cannons x1, missiles x1.15, drones x1.3. Break
  shields with energy weapons, drones or missiles, then finish the hull with guns.
- **Targeting modes** (with a targeting computer): press **T** to switch auto-targeting, missile
  locks and drones between *ships + asteroids*, *ships only* and *asteroids only*. Ships always
  take priority over asteroids in the combined mode.
- **AI**: fighters make attack runs and jink away from incoming missiles; capital ships hold
  a standoff distance and circle; badly damaged ships withdraw to recharge their shields;
  Death Gliders fly in pairs.
- **Missile defence**: incoming missiles can be shot down with minigun fire, or caught in the
  blast of your own missiles. With a targeting computer, miniguns shoot at incoming missiles
  automatically before anything else.
- **Drones** can only be stopped by drones: your drones hunt incoming drones first and
  destroy them on contact or with their blast.
- Debug mode: press **N** to spawn an enemy nearby.

## Travel

The galaxy has several star systems: **Lantea** (Atlantis, the shipyard and ore market), **Earth**,
**Abydos**, **Chulak**, **Dakara**, **Langara** and **Othala**. Each has its own planet, asteroid
fields and ore mix (Abydos is rich in naquadah, Dakara in gold, and so on).

- **Stargate**: every system has a gate with a DHD next to it. Fly to the DHD and press **B**, enter
  the six symbols of the destination address and then this gate's point of origin, and press the
  dome. The gate dials (chevrons lock one by one), opens with the kawoosh, and you fly through the
  event horizon. Only ships small enough to fit can use a gate.
  While the gate is dialling or open, pressing the DHD dome shuts it down so you can dial a
  new address.
- **Starmap (M)**: a 3D map of the constellations and worlds. Click a world to see its address: the
  six symbols are three pairs, and the line through each pair passes through the destination.
- **Hyperdrive**: the Al'kesh, X-304, Ha'tak, Asgard and Aurora have one built in, and cruiser-sized ships can
  fit a hyperdrive module. Pick a destination on the starmap and engage: a hyperspace window opens,
  and the trip takes longer the further you go.

The DHD's glyphs follow the Milky Way glyph chart (glyph 1, the pyramid, is Earth's point of
origin), and on the starmap each constellation is drawn as its star figure. Dialling follows the
Carter Addon Pack's DHD dial sequence and timing (ring rolls, chevrons 1-6 encode, ring stops,
chevron 7 locks, the gate opens 7 seconds after the dome), using the same sound files. The sounds
also work when index.html is opened straight from disk.

## Sound credits

The Stargate, DHD, wormhole, hyperspace window, weapon, shield, door and button sounds come from
the [Stargate Carter Addon Pack resources](https://github.com/RafaelDeJongh/cap_resources) by the
CAP team, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). They are
used (larger files converted to MP3), in `assets/sounds/cap/` (see `CREDITS.txt` there). Because of that licence, this
game must stay non-commercial, and redistributions of those sounds must keep the same licence.
Anything not covered by a sample is synthesized with the Web Audio API.

## Debug mode

Click **Debug mode** on the main menu (or the **Debug** button in the shipyard header, or open
`index.html?debug`) to unlock every hull and make all purchases, upgrades and repairs free.
Turn it off the same way. Selling gives nothing back while it's on.

## Mining

- Space is endless: sectors are generated as you fly. The scanner (bottom right) shows nearby asteroids
  coloured by material, and an arrow points back to base.
- Asteroids contain rock, iron, copper, titanium, gold and naquadah. Valuable metals appear further from base.
- Asteroids have a soft, dusty outer layer and a hard core. The dust carves away quickly (mostly plain
  rock), the core is slow to cut but holds most of the metal. Cut all the way through and the asteroid
  splits in two along the cut. Chipped material pops out as ore: fly near it to scoop it into your hold.
- Asteroids pull on each other with gravity based on their size. When they touch they lock together
  and the smaller one gradually sinks into the bigger one in a cloud of dust.
- Shields protect the hull, but while they're up the tractor beam is offline and ore that touches them
  burns up (costing a little shield energy). Lower shields (H) to collect ore with the tractor beam.
- Open the cargo hold (C) to see what you carry and eject unwanted ore to make room.
- An ore scanner colours the scanner map by metal, pings the area and guides you to the richest asteroid nearby.
- Atlantis is protected by a city shield that deflects asteroids but lets ships through.
- Dock at Atlantis (B) to sell ore in the Market tab and repair your hull.
  If your ship is destroyed, the cargo is lost.

## Shipyard

Spend credits on:

- **Hulls**: F-302, Death Glider, Puddle Jumper, X-303, Al'kesh, X-304, Ha'tak, Asgard and the Ancient Aurora, each with its own mounts, cargo hold, mass, hull and built-in shields. The Glider, Jumper and Al'kesh line art follows blueprint references; the Al'kesh has a (slow) hyperdrive built in.
- **Modules** placed on mounts by drag & drop (or select one and click a mount):
  minigun turrets, Goa'uld staff cannons, Asgard ion beams, missile pods, Ancient drone launchers,
  sublight engines, shield emitters, targeting computers, ore scanners, cargo pods, ore tractors and armor.
  Each module upgrades from Mk I to Mk III and can be sold for half its value.

Every weapon has a cooldown, shown in the weapon panel (bottom left): miniguns overheat, ion beams fire
in bursts and recharge, staff cannons, missiles and drones reload between shots.
Primary weapons (left click / Space): minigun, staff cannon, ion beam.
Secondary weapons (right click / F): missiles, drones.

A targeting computer makes turrets lock on and fire automatically and turns missiles into homing missiles.
