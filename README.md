# some-awesome-game

Zero-gravity asteroid mining in an endless star field, with a ship-building shipyard.

## Running

```
yarn install
NODE_OPTIONS=--openssl-legacy-provider yarn build
```

Then open `index.html` through any static web server (e.g. `python3 -m http.server`).

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
| Zoom | Mouse wheel or + / - (0 resets) |
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

## Travel

The galaxy has several star systems: **Lantea** (Atlantis, the shipyard and ore market), **Earth**,
**Abydos**, **Chulak**, **Dakara**, **Langara** and **Othala**. Each has its own planet, asteroid
fields and ore mix (Abydos is rich in naquadah, Dakara in gold, and so on).

- **Stargate**: every system has a gate with a DHD next to it. Fly to the DHD and press **B**, enter
  the six symbols of the destination address and then this gate's point of origin, and press the
  dome. The gate dials (chevrons lock one by one), opens with the kawoosh, and you fly through the
  event horizon. Only ships small enough to fit can use a gate.
- **Starmap (M)**: a 3D map of the constellations and worlds. Click a world to see its address: the
  six symbols are three pairs, and the line through each pair passes through the destination.
- **Hyperdrive**: the X-304, Ha'tak, Asgard and Aurora have one built in, and cruiser-sized ships can
  fit a hyperdrive module. Pick a destination on the starmap and engage: a hyperspace window opens,
  and the trip takes longer the further you go.

The DHD glyphs follow the Milky Way glyph chart (glyph 1, the pyramid, is Earth's point of
origin), and on the starmap each constellation is drawn as its star figure.

## Sound credits

The Stargate, DHD, wormhole, hyperspace window, weapon, shield, door and button sounds come from
the [Stargate Carter Addon Pack resources](https://github.com/RafaelDeJongh/cap_resources) by the
CAP team, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). They are
used unmodified, in `assets/sounds/cap/` (see `CREDITS.txt` there). Because of that licence, this
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

- **Hulls**: F-302, X-303, X-304, Ha'tak, Asgard and the Ancient Aurora, each with its own mounts, cargo hold, mass, hull and built-in shields.
- **Modules** placed on mounts by drag & drop (or select one and click a mount):
  minigun turrets, Goa'uld staff cannons, Asgard ion beams, missile pods, Ancient drone launchers,
  sublight engines, shield emitters, targeting computers, ore scanners, cargo pods, ore tractors and armor.
  Each module upgrades from Mk I to Mk III and can be sold for half its value.

Every weapon has a cooldown, shown in the weapon panel (bottom left): miniguns overheat, ion beams fire
in bursts and recharge, staff cannons, missiles and drones reload between shots.
Primary weapons (left click / Space): minigun, staff cannon, ion beam.
Secondary weapons (right click / F): missiles, drones.

A targeting computer makes turrets lock on and fire automatically and turns missiles into homing missiles.
