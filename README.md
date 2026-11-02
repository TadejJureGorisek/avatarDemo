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
- Drop-style spin: reels drop out and in one after another. Winning symbols pop (scale up and
  down) until the next spin, with the win amount shown over the symbols.
- Balance, bet (+/−) and a status message in the React HUD. `Space` spins.
- **BONUS** scatter pays anywhere (3/4/5) and 3+ award **8 free spins** (auto-played, retriggerable).
- **Anticipation**: once two BONUS symbols have landed, the remaining reels slow down while the
  character plays `bonus_anticipation`, then `bonus_anticipation_win` / `_lose`.
- Character plays `small_win` on any win and loops `idle` otherwise.
- **CHEATS** menu (top right): *Big win* forces the top symbol across the middle row, *Free spins*
  forces 3 BONUS. Handled in `BetState` via `SlotEngine.forceNext()`.
- RNG: `crypto.getRandomValues`. Paytable tuned by simulation to RTP ≈ 96%, hit rate ≈ 13%.

## Structure

```
src/
  engine/
    config.ts          board size, symbols, weights, paytable, bets, free spins (data only)
    SlotEngine.ts      pure logic: RNG, grid generation, ways evaluation, wallet, free spins
  view/
    MainView.tsx       the whole game: builds the Pixi scene + HUD, runs the state machine
    states/
      StateMachine.ts  loops Bet → Spin → Win (only on a win) → Bet
      BetState.ts      waits for SPIN (balance check); auto-continues during free spins
      SpinState.ts     takes the stake, gets the result, drops reels, bonus anticipation
      WinState.ts      win pop + amount, pays the win, character reaction
    board/Board.ts     symbols area, creates one Reel per reel
    board/Reel.ts      one column, creates one Cell per row, drop animation
    board/Cell.ts      one symbol sprite
    Wins.ts            win pop on winning symbols + win amount over the board
    Character.ts       Spine character
    Background.ts      full-screen gradient
    hud/Hud.tsx        the whole UI: Balance, BetControl, SpinButton, CheatMenu, messages
```

Animation uses GSAP. All game flow lives in the states; the HUD only sends a spin request and
is locked outside the bet state.

**Extending:** the board size comes from the engine (`engine.reels` × `engine.rows`, set in
`config.ts`) and is passed down Board → Reel → Cell, so nothing in the view hardcodes 5×3. Adding
a wild is just a symbol with `kind: 'wild'`, since the evaluator already substitutes it. A new
feature is a new state (for example a `BonusState` entered from `WinState`) plus its maths in
`SlotEngine`.

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
