# some-awesome-game

Zero-gravity asteroid shooter with a ship-building shipyard.

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
| Pause / shipyard | Esc |

## Shipyard

Destroying asteroids earns credits (saved in the browser). Spend them in the shipyard on:

- **Hulls**: X-302, X-303, X-304, Ha'tak and Asgard, each with its own mounts, mass, hull and built-in shields.
- **Modules** placed on mounts by drag & drop (or select one and click a mount):
  minigun turrets, missile pods, sublight engines, shield emitters, targeting computers and armor.
  Each module upgrades from Mk I to Mk III and can be sold for half its value.

A targeting computer makes turrets lock on and fire automatically and turns missiles into homing missiles.
