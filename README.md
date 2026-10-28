# Ways Slot – Game Developer Test

A 5×3, 243-ways slot prototype built with **TypeScript + PixiJS 8**, a **React** HUD and the provided
character animated with the **Spine 4.2 runtime** (`@esotericsoftware/spine-pixi-v8@4.2`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

Hosted on Railway: it detects Vite, runs `npm run build` and serves `dist/` as a static site, so no
start command is needed.

## Features

- 5 reels × 3 rows, **243 ways**, pays left to right from reel 1 (3+ of a kind).
- Drop-style spin: reels drop out and in one after another, then winning symbols switch to their
  `_connect` art and pulse while the rest dim.
- Balance, bet (+/−), last win and a status message in the React HUD. `Space` spins.
- **BONUS** scatter pays anywhere (3/4/5) and 3+ award **8 free spins** (auto-played, retriggerable).
- **Anticipation**: once two BONUS symbols have landed, the remaining reels slow down while the
  character plays `bonus_anticipation`, then `bonus_anticipation_win` / `_lose`.
- Character plays `small_win` on any win and loops `idle` otherwise.
- RNG: `crypto.getRandomValues`. Paytable tuned by simulation to RTP ≈ 96%, hit rate ≈ 13%.

## Structure

```
src/
  engine/config.ts       board size, symbols, weights, paytable, bets, free spins (data only)
  engine/SlotEngine.ts   pure logic: RNG, grid generation, ways evaluation, wallet, free spins
  MainView.ts            PixiJS: Board (drop animation), WinLayer, Spine Character, spin flow
  Hud.tsx                React HUD: balance, bet, win, spin button
```

**Extending:** board size is `reels`/`rows` in `config.ts`, and the engine and board both read it.
Adding a wild is just a symbol with `kind: 'wild'`, since the evaluator already substitutes it.
New features (bonus game, multipliers, cascades) go in `SlotEngine.spin()` for the maths and
`MainView.present()` for the presentation. The HUD doesn't need to change.

## Spine character analysis

- Exported from Spine **4.2.43**, one `default` skin, 29 slots, uses 4.2 **physics** constraints
  (necklace chain, etc.) and transform constraints.
- 7 animations: `character_idle` (35 s loop), `character_small_win`, `character_bonus_anticipation`,
  `character_bonus_anticipation_win`, `character_bonus_anticipation_lose`, `character_wild_throw`,
  `character_wild_landing`.
- Events for sound: `sfx_squat`, `sfx_smile`, `sfx_unsquat`, `sfx_wiggle`, `sfx_clink`,
  `sfx_anticipation`, `sfx_wildland`, `sfx_glasses` (no audio was supplied, so they are not hooked up).
- The pack ships **no `.atlas`**, only loose PNGs, so I generated
  `public/assets/character/character.atlas`: a multi-page atlas with one page per PNG and one
  full-size region named after the file. That matches the attachment paths, so meshes and regions
  render without repacking.
- `wild_throw` / `wild_landing` are not used because the symbol pack contains no wild symbol; they
  are ready to wire up via `Character.play()` if one is added.
