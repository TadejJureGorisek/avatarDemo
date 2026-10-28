# Ways Slot – Game Developer Test

A 5×3, 243-ways slot prototype built with **TypeScript + PixiJS 8**, a **React** HUD and the provided
character animated with the **Spine 4.2 runtime** (`@esotericsoftware/spine-pixi-v8@4.2`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # evaluator unit tests + 200k-spin RTP simulation
npm run build    # static build in dist/ (relative paths, works on GitHub Pages)
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(enable *Settings → Pages → Source: GitHub Actions* once).

## Features

- 5 reels × 3 rows, **243 ways**, pays left to right from reel 1 (3+ of a kind).
- Drop-style spin: reels drop out and in one after another, then winning symbols switch to their
  `_connect` art and pulse while the rest dim.
- Balance, bet (+/−), last win and a status message in the React HUD; paytable overlay. `Space` spins.
- **BONUS** scatter pays anywhere (3/4/5) and 3+ award **8 free spins** (auto-played, retriggerable).
- **Anticipation**: once two BONUS symbols have landed, the remaining reels slow down while the
  character plays `bonus_anticipation`, then `bonus_anticipation_win` / `_lose`.
- Character plays `small_win` on any win and loops `idle` otherwise.
- RNG: `crypto.getRandomValues` in play, seeded Mulberry32 for tests. Simulated RTP ≈ 96.9%,
  hit rate ≈ 13%.

## Structure

```
src/
  config/gameConfig.ts       board size, symbols, weights, paytable, bets, free spins - all data
  engine/                    pure logic, no rendering (can run headless or move server-side)
    rng.ts                   Rng interface, CryptoRng, SeededRng, weighted pick
    waysEvaluator.ts         ways + scatter evaluation (wild substitution supported)
    SlotEngine.ts            wallet, grid generation, free spins state
  view/                      PixiJS
    GameStage.ts             app init, asset loading, letterboxed layout
    BoardView / ReelView / SymbolView
    CharacterView.ts         Spine wrapper (idle track + one-shot reactions)
    tween.ts                 tiny promise-based tween helper on the Pixi ticker
  controller/
    GameController.ts        orchestrates engine → view → UI state; spin flow and anticipation
    Store.ts                 observable store read by React via useSyncExternalStore
  ui/                        React HUD, paytable
scripts/build-atlas.mjs      generates the Spine atlas (see below)
```

**Extending:** board size is `reels`/`rows` in the config (the evaluator, grid generator and board
view all read it). Adding a wild is just a symbol with `kind: 'wild'` – the evaluator already
substitutes it. New features (bonus game, multipliers, cascades) hook into `SlotEngine.spin()`
for the maths and `GameController.presentSpin()` for the presentation, without the UI changing.

## Spine character analysis

- Exported from Spine **4.2.43**, one `default` skin, 29 slots, uses 4.2 **physics** constraints
  (necklace chain, etc.) and transform constraints.
- 7 animations: `character_idle` (35 s loop), `character_small_win`, `character_bonus_anticipation`,
  `character_bonus_anticipation_win`, `character_bonus_anticipation_lose`, `character_wild_throw`,
  `character_wild_landing`.
- Events for sound: `sfx_squat`, `sfx_smile`, `sfx_unsquat`, `sfx_wiggle`, `sfx_clink`,
  `sfx_anticipation`, `sfx_wildland`, `sfx_glasses` (no audio was supplied, so they are not hooked up).
- The pack ships **no `.atlas`**, only loose PNGs. `scripts/build-atlas.mjs` writes a multi-page
  atlas (one page per PNG, one full-size region named after the file), which matches the attachment
  paths, so meshes and regions render without repacking. Run `npm run atlas` if the images change.
- `wild_throw` / `wild_landing` are not used because the symbol pack contains no wild symbol; they
  are ready to wire up via `CharacterView.react()` if one is added.
