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
| Stabilize (cancel drift & spin) | X |
| Aim | Mouse |
| Guns | Left click / Space |
| Missiles | Right click / F |
| Toggle auto-targeting | G (needs a targeting computer) |
| Dock at Atlantis (shipyard) | B (inside the dashed ring, slowly) |
| Shields on / off | H (or the button at the top of the screen) |
| Cargo hold (view / eject ore) | C (or the cargo button, top right) |
| Zoom | Mouse wheel |
| Pause | Esc |

## Mining

- Space is endless: sectors are generated as you fly. The scanner (bottom right) shows nearby asteroids
  coloured by material, and an arrow points back to base.
- Asteroids contain rock, iron, copper, titanium, gold and naquadah. Valuable metals appear further from base.
- Shooting chips an asteroid down and breaks chunks off. The chipped material floats free as ore.
  Fly near it to scoop it into your cargo hold.
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
