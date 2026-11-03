# AvatarUX Slot – Game Developer Test

**Bling Bling Boss** — a 5×3, 243-ways slot prototype built with **TypeScript + PixiJS 8**, a
**React** HUD and the provided character animated with the **Spine 4.2 runtime**
(`@esotericsoftware/spine-pixi-v8@4.2`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

Hosted on Railway: it detects Vite, runs `npm run build` and serves `dist/` as a static site, so no
start command is needed.

## Features

- **Loading and splash**: the splash's own assets load first, so it shows right away with three
  slides (the character, big wins, free spins) under the logo, and "Loading…" where SPIN will be
  until the rest has loaded. Swipe, the side arrows, the dots or the
  arrow keys change slides (looping). SPIN shows an arrow and is CONTINUE: the splash zooms away
  while the character, logo, board and HUD come in.
- 5 reels × 3 rows, **243 ways**, pays left to right from reel 1 (3+ of a kind).
- Spinning reels: all reels spin for at least `timing.minSpinTime`, then each reel lands its
  **stop symbols** (the result) one after another with a bounce. Winning symbols pop until the
  next spin, with the win amount over them. Click a landed symbol to see what it pays.
- One main button: SPIN, then STOP while spinning (lands the reels early), the free spins left
  during free spins, and the autoplay spins left during autoplay. `Space` presses it.
- **TURBO** (lightning, left of SPIN): spins run `timing.turboSpeed` × faster, and STOP lands the
  reels instantly. **Autoplay** (right of SPIN): pick 10/25/50/100 spins.
- **BONUS** scatter: at most one per reel, pays anywhere (3/4/5). Five (one on every reel) award
  **8 free spins**: the award pop-up waits for SPIN, then the background turns gold and they play
  by themselves (retriggerable). Their win is paid into the balance at the end of the round.
- **Anticipation**: once reels 1 and 2 both land a BONUS, the next reel slows down and spins longer;
  every further BONUS slows the reel after it. The character plays `bonus_anticipation`, then
  `bonus_anticipation_win` / `_lose`.
- **Big wins**: wins of 20× / 35× / 50× / 100× the bet get a count-up (NICE / BIG / MEGA / EPIC WIN)
  with the title stepping up as each threshold is passed. Click to skip.
- While a pop-up or big win is up, the scene and HUD fade darker behind it; SPIN and the
  player message (moved just under the pop-up) stay bright in front.
- **Menu** (round burger): round icon buttons fly out of it into a centred column on the left
  (landscape) or a centred row at the bottom (portrait), over a blurred overlay: CLOSE, HOME (asks to confirm, then opens the developer's LinkedIn), HISTORY (last 50 spins),
  SETTINGS (Master, Sound FX and Music volume sliders with on/off toggles, spacebar to spin, turbo; saved in the browser),
  AUTOPLAY (any count up to 999, typed or built with +1/+10/+100) and INFO (rules, paytable at the current bet, game details).
- **Audio** (ElevenLabs): a base game music loop and a more intense one for free spins (cross-faded),
  and effects for buttons, the reel spin (a loop that fades out as each reel lands), reel stops, BONUS landing, anticipation, wins, the big win coin
  shower and the free spins award. The character's Spine events (`sfx_squat`, `sfx_clink`, ...) play
  matching sounds. Audio starts on the first click or key press, as browsers require.
- **CHEATS** (or keys **1–7**): *Small win*, *Nice / Big / Mega / Epic win* (an exact win of that tier),
  *27 ways* (one symbol on every row of reels 1–3), all in `config.winCheats`; *Free spins* forces a
  BONUS on every reel. Picked while waiting for SPIN it starts that spin;
  mid-round it lines up the next one (`SlotEngine.forceNext()`).
- **Any screen**: a landscape layout (1600×900) and a portrait one (900×1600) for windows clearly
  taller than wide, e.g. phones. The scene scales to fit the window without distorting; the
  background covers the window with its floor under the character's feet.
- Art: logo, backgrounds, reel frame and big win panel generated with Higgsfield / Meshy; sounds and
  music with ElevenLabs; icons
  from [Lucide](https://lucide.dev) (ISC).
- RNG: `crypto.getRandomValues`. Tuned by simulation (6M spins): RTP ≈ 96%, hit rate ≈ 28%,
  free spins about 1 in 320 spins.

## Structure

```
src/
  engine/
    config.ts          board size, symbols, weights, paytable, bets, free spins, timing (data only)
    SlotEngine.ts      pure logic: RNG, grid generation, ways evaluation, wallet, free spins
  view/
    MainView.tsx       builds the Pixi scene + HUD, places everything, runs the state machine
    layout.ts          where everything goes, one table for landscape and one for portrait
    states/            Splash → Bet → Spin → Win (only on a win) → Bet; all game flow lives here
    board/             Board (frame, reels), Reel (spins filler, lands stop symbols), Cell
    Splash.ts          intro slides
    Background.ts      base / free spins / splash art, cross-faded
    Sound.ts           Web Audio effects and music (separate Sound FX / Music volumes)
    settings.ts        player settings, saved in localStorage
    Frame.ts           the gold reel frame and pop-up panels (nine-slice)
    Wins.ts, BigWin.ts, Popup.ts, Message.ts, SymbolInfo.ts, Character.ts, Logo.ts
    hud/               React HUD: buttons, balance, bet, cheats, icons, burger menu tabs
public/assets/         symbols, character (Spine), logo, backgrounds, board frame/panel, icons, audio
```

Animation uses GSAP; the HUD uses inline styles only (no CSS files). The bright HUD fills, rings and icons
are drawn on small canvases (`hud/Paint.tsx`), because phone browsers with a forced dark mode (e.g.
Samsung Internet) recolour page elements but leave canvases alone. The HUD only sends requests
(spin, stop, cheat, autoplay, turbo); the states decide what happens.

**Extending:** the board size comes from the engine (`engine.reels` × `engine.rows`, set in
`config.ts`) and is passed down Board → Reel → Cell. For a different board size, adjust the board
position and symbol size in `layout.ts`. Adding a wild is just a symbol with `kind: 'wild'`, since
the evaluator already substitutes it. A new feature is a new state plus its maths in `SlotEngine`.

## Spine character analysis

- Exported from Spine **4.2.43**, one `default` skin, 29 slots, uses 4.2 **physics** constraints
  (necklace chain, etc.) and transform constraints.
- 7 animations: `character_idle` (35 s loop), `character_small_win`, `character_bonus_anticipation`,
  `character_bonus_anticipation_win`, `character_bonus_anticipation_lose`, `character_wild_throw`,
  `character_wild_landing`.
- Events for sound: `sfx_squat`, `sfx_smile`, `sfx_unsquat`, `sfx_wiggle`, `sfx_clink`,
  `sfx_anticipation`, `sfx_wildland`, `sfx_glasses`. No audio was supplied, so I generated sounds for the
  ones the used animations fire (`Character.ts` maps each event to a sound).
- The pack ships **no `.atlas`**, only loose PNGs, so I generated
  `public/assets/character/character.atlas`: a multi-page atlas with one page per PNG and one
  full-size region named after the file. That matches the attachment paths, so meshes and regions
  render without repacking.
- `wild_throw` / `wild_landing` are not used because the symbol pack contains no wild symbol; they
  are ready to wire up via `Character.play()` if one is added.
