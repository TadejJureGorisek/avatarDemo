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
- Spinning reels: all reels spin for at least `timing.minSpinTime`, then each reel lands its
  **stop symbols** (the result) one after another with a bounce. Timings live in `config.ts`.
  Winning symbols pop (scale up and down) until the next spin, with the win amount over them.
- React HUD: menu bottom left, main button centre, Balance / Bet / CHEATS stacked bottom right;
  player message below the board. Click a landed symbol to see what it pays. The main button is
  SPIN, then STOP while spinning (lands the reels early), and shows the free spins left during
  free spins. `Space` presses it.
- **BONUS** scatter: at most one per reel, pays anywhere (3/4/5). Five (one on every reel) award
  **8 free spins** (auto-played, retriggerable), with pop-ups for the award and the round's total.
- **Anticipation**: once reels 1 and 2 both land a BONUS, the next reel slows down and spins longer
  while the others keep full speed; every further BONUS slows the reel after it. The character
  plays `bonus_anticipation`, then `bonus_anticipation_win` / `_lose`.
- **Big wins**: wins of 20× / 35× / 50× / 100× the bet get a count-up (NICE / BIG / MEGA / EPIC WIN)
  that speeds up then slows down, with the title stepping up as each threshold is passed. Click
  to skip. Tiers live in `config.bigWins`.
- Character plays `small_win` on any win and loops `idle` otherwise.
- **Menu** (burger, bottom left): HOW TO PLAY (rules + paytable at the current bet), ABOUT THE GAME,
  AUTOPLAY (set the bet, pick 10/25/50/100 spins; the main button shows the spins left and stops
  it), HISTORY
  (last 50 spins).
- **CHEATS** menu (under Balance and Bet): *Nice / Big / Mega / Epic win* land an exact win of that
  tier (24× / 40× / 80× / 400×, `config.winCheats`),
  *Free spins* forces a BONUS on every reel. Handled in `BetState` via `SlotEngine.forceNext()`.
- RNG: `crypto.getRandomValues`. Tuned by simulation (6M spins): RTP ≈ 96%, hit rate ≈ 28%,
  free spins about 1 in 320 spins.

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
      SpinState.ts     starts reels, gets the result, min spin time, lands stop symbols, anticipation
      WinState.ts      win pop + amount, pays the win, character reaction
    board/Board.ts     symbols area, creates one Reel per reel
    board/Reel.ts      one column: Cell per row + 1 buffer, spins filler, lands `stopSymbols`
    board/Cell.ts      one symbol sprite
    Wins.ts            win pop on winning symbols + win amount over the board
    Character.ts       Spine character
    Background.ts      full-screen gradient
    Message.ts         player message below the board, set by the states
    Popup.ts           free spins pop-ups (awarded / round won / complete)
    BigWin.ts          big win count-up with tier titles
    SymbolInfo.ts      pop-up with a clicked symbol's pays
    hud/Hud.tsx        the whole UI: Balance, BetControl, SpinButton, CheatMenu, Menu
    hud/menu/          burger menu tabs: HowToPlay, About, Autoplay, History
    hud/theme.ts       shared inline styles (no CSS files)
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
