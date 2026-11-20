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
| Dock at the shipyard | B (inside the dashed ring, slowly) |
| Pause | Esc |

## Mining

- Space is endless: sectors are generated as you fly. The scanner (bottom right) shows nearby asteroids
  coloured by material, and an arrow points back to base.
- Asteroids contain rock, iron, copper, titanium, gold and naquadah. Valuable metals appear further from base.
- Shooting chips an asteroid down and breaks chunks off. The chipped material floats free as ore.
  Fly near it to scoop it into your cargo hold.
- Asteroids pull on each other with gravity based on their size, and merge when they collide.
- Dock at the shipyard (B) to sell ore in the Market tab and repair your hull.
  If your ship is destroyed, the cargo is lost.

## Shipyard

Spend credits on:

- **Hulls**: X-302, X-303, X-304, Ha'tak, Asgard and the Ancient Aurora, each with its own mounts, cargo hold, mass, hull and built-in shields.
- **Modules** placed on mounts by drag & drop (or select one and click a mount):
  minigun turrets, Goa'uld staff cannons, Asgard ion beams, missile pods, Ancient drone launchers,
  sublight engines, shield emitters, targeting computers, cargo pods, ore tractors and armor.
  Each module upgrades from Mk I to Mk III and can be sold for half its value.

Every weapon has a cooldown, shown in the weapon panel (bottom left): miniguns overheat, ion beams fire
in bursts and recharge, staff cannons, missiles and drones reload between shots.
Primary weapons (left click / Space): minigun, staff cannon, ion beam.
Secondary weapons (right click / F): missiles, drones.

A targeting computer makes turrets lock on and fire automatically and turns missiles into homing missiles.
