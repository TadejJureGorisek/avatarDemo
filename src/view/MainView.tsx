import { Application, Assets, Container } from 'pixi.js';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SlotEngine } from '../engine/SlotEngine';
import { Background, BACKGROUND_URLS } from './Background';
import { BigWin } from './BigWin';
import { Board, FRAME_PAD } from './board/Board';
import { symbolUrl } from './board/Cell';
import { Character, CHARACTER_ASSETS } from './Character';
import type { Cheat } from './hud/CheatMenu';
import { Hud, type HudState } from './hud/Hud';
import type { HistoryEntry } from './hud/menu/History';
import { BetState } from './states/BetState';
import { SpinState } from './states/SpinState';
import { SplashState } from './states/SplashState';
import { StateMachine } from './states/StateMachine';
import { WinState } from './states/WinState';
import { logo, LOGO_URL } from './Logo';
import { Message } from './Message';
import { Popup } from './Popup';
import { Splash } from './Splash';
import { SymbolInfo } from './SymbolInfo';
import { Wins } from './Wins';

/** Largest symbol size; boards with more reels or rows get smaller symbols so they still fit. */
const MAX_CELL = 200;
/**
 * The landscape scene's design size, scaled to fit the window. A window tall enough for the whole
 * portrait layout gets the portrait scene instead: as wide as this is tall.
 */
const DESIGN = { width: 1600, height: 900 };
/** Where the character stands in landscape (of the design height); the background's floor is moved to it. */
const FLOOR = 0.755;
/** Space kept free around the scene and between character and board. */
const MARGIN = 20;
const GAP = 40;
/** Below the board: frame → message centre, message centre → HUD row, and the HUD row's height (all design px). */
const MESSAGE_GAP = 40;
const HUD_GAP = 40;
const HUD_ROW = 125;
/** The portrait HUD's height (two rows at the bottom of the screen). */
const HUD_PORTRAIT = 620;
/** Of that, the bottom row with SPIN. */
const PORTRAIT_SPIN_ROW = 340;
/** The HUD is laid out for scene scale 0.8 (a 1280×720 window) and zoomed with the scene from there. */
const HUD_ZOOM_PER_SCENE = 1.25;
/** The logo above the character (in game and on the splash), and the gap under it (design px). */
const LOGO_HEIGHT = 170;
const PORTRAIT_LOGO_HEIGHT = 230;
const PORTRAIT_SPLASH_LOGO_HEIGHT = 260;
/** How far the portrait logo sits above its place in the group (design px). */
const PORTRAIT_LOGO_LIFT = 60;
const LOGO_GAP = 10;
const fill: CSSProperties = { position: 'absolute', inset: 0 };

export function MainView({ engine }: { engine: SlotEngine }) {
  const host = useRef<HTMLDivElement>(null);
  const spinRequest = useRef<(cheat?: Cheat) => void>();
  const stopRequest = useRef<() => void>();
  const machine = useRef<StateMachine>();
  const { bets, defaultBetIndex } = engine.config;
  const betIndex = useRef(defaultBetIndex);
  const betState = (i: number) => ({ bet: bets[i], atMinBet: i === 0, atMaxBet: i === bets.length - 1 });
  const [hud, setHud] = useState<HudState>({
    ready: false, state: 'splash', balance: engine.balance, ...betState(defaultBetIndex),
    freeSpinsLeft: 0, freeSpin: false, autoplayLeft: 0, freeSpinsReady: false, continueReady: false, turbo: false,
  });
  const update = (patch: Partial<HudState>) => setHud((s) => ({ ...s, ...patch }));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const autoplayLeft = useRef(0);
  const turbo = useRef(false);
  const setAutoplay = (spins: number) => update({ autoplayLeft: (autoplayLeft.current = spins) });
  const symbolInfoRef = useRef<SymbolInfo>();
  // Where the scene puts the HUD row and how much to zoom it, plus the board's on-screen width for the menu.
  const [hudLayout, setHudLayout] = useState<HudLayout>({ top: 0, left: 0, width: 0, zoom: 1, boardWidth: 0, portrait: false });

  useEffect(() => {
    const app = new Application();
    createScene(app, host.current!, engine, setHudLayout).then((scene) => {
      machine.current = new StateMachine(
        { splash: SplashState, bet: BetState, spin: SpinState, win: WinState },
        {
          engine, ...scene,
          bet: () => engine.config.bets[betIndex.current],
          updateHud: update,
          waitForSpin: () => new Promise((resolve) => {
            spinRequest.current = (cheat) => {
              spinRequest.current = undefined;
              resolve(cheat);
            };
          }),
          waitForStop: () => new Promise((resolve) => (stopRequest.current = resolve)),
          takeAutoSpin: () => autoplayLeft.current > 0 && (setAutoplay(autoplayLeft.current - 1), true),
          autoplayRunning: () => autoplayLeft.current > 0,
          turbo: () => turbo.current,
          stopAutoplay: () => setAutoplay(0),
          recordSpin: (entry) => setHistory((h) => [entry, ...h].slice(0, 50)),
        },
        (state) => update({ state }),
      );
      // Clicking a landed symbol shows what it pays; not while the reels spin.
      const { board, symbolInfo } = scene;
      symbolInfoRef.current = symbolInfo;
      // Clicking the symbol whose pop-up is open closes it; any other symbol opens its own.
      let shown = '';
      board.onCellTap = (reel, row) => {
        if (machine.current?.current === 'spin') return;
        const key = `${reel}:${row}`;
        if (symbolInfo.visible && shown === key) return symbolInfo.hide();
        shown = key;
        const cell = board.cell(reel, row);
        const size = board.cellSize * board.scale.x;
        symbolInfo.show(cell.def, engine.config.bets[betIndex.current], board.x + (reel + 0.5) * size,
          board.y + (row + 0.5) * size, size, reel < engine.reels / 2);
      };
      update({ ready: true });
      void machine.current.run();
    });
    return () => {
      symbolInfoRef.current = undefined;
      app.destroy(true, { children: true });
    };
  }, [engine]);

  const changeBet = useCallback((direction: 1 | -1) => {
    betIndex.current = Math.max(0, Math.min(bets.length - 1, betIndex.current + direction));
    update(betState(betIndex.current));
    symbolInfoRef.current?.setBet(bets[betIndex.current]);
  }, [bets]);

  // One button: SPIN in the bet state, STOP while the reels spin, and stops a running autoplay.
  const pressSpin = useCallback(() => {
    if (autoplayLeft.current > 0) setAutoplay(0);
    else if (machine.current?.current === 'spin') stopRequest.current?.();
    else spinRequest.current?.();
  }, []);
  // A cheat starts the spin when the game is waiting for the player; otherwise (mid-spin, free
  // spins, autoplay) it lines up the board for whichever spin comes next.
  const requestCheat = useCallback((cheat: Cheat) => {
    if (spinRequest.current) spinRequest.current(cheat);
    else engine.forceNext(cheat);
  }, [engine]);
  // The first autoplay spin starts now (BetState is waiting for SPIN); the rest come from BetState.
  const startAutoplay = useCallback((spins: number) => {
    setAutoplay(spins - 1);
    spinRequest.current?.();
  }, []);
  const stopAutoplay = useCallback(() => setAutoplay(0), []);
  const toggleTurbo = useCallback(() => update({ turbo: (turbo.current = !turbo.current) }), []);
  return (
    <div style={fill}>
      <div style={fill} ref={host} />
      <Hud
        state={hud}
        config={engine.config}
        history={history}
        onSpin={pressSpin}
        onBetChange={changeBet}
        onCheat={requestCheat}
        onStartAutoplay={startAutoplay}
        onStopAutoplay={stopAutoplay}
        onToggleTurbo={toggleTurbo}
        layout={hudLayout}
      />
    </div>
  );
}

/** Where the HUD goes on screen (px), its zoom, the board's on-screen width, and its arrangement. */
export interface HudLayout {
  top: number;
  /** The scene's left edge and width on screen: the HUD is centred on it. */
  left: number;
  width: number;
  zoom: number;
  boardWidth: number;
  /** Portrait: two rows at the bottom of the screen, with bigger controls. */
  portrait: boolean;
}

type Orientation = 'landscape' | 'portrait';

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine, onHudLayout: (layout: HudLayout) => void) {
  await app.init({
    resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio, 2)
  });
  app.canvas.style.display = 'block'; // inline canvases add a few px of line-box overflow
  host.appendChild(app.canvas);

  // The character (and logo) come first: their size sets the layout, so the HUD (with "Loading…"
  // where SPIN goes) is in place while the rest loads.
  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...CHARACTER_ASSETS.map((a) => a.alias), LOGO_URL]);

  const character = new Character();
  const bounds = character.getLocalBounds();
  const title = logo(1);
  const background = new Background();
  // The design-space scene, scaled to the window (the HUD is part of it).
  const scene = new Container();
  app.stage.addChild(background, scene);
  // In portrait, the symbol size that fits the character and board side by side across the scene,
  // and the height the whole portrait layout needs: a window shorter than that gets landscape.
  const aspect = bounds.width / bounds.height;
  const PORTRAIT_CELL = Math.floor(Math.min(MAX_CELL,
    (DESIGN.height - 2 * MARGIN - GAP - 2 * FRAME_PAD - aspect * 2 * FRAME_PAD) / (engine.reels + aspect * engine.rows)));
  const portraitHeight = 2 * MARGIN + PORTRAIT_LOGO_LIFT + PORTRAIT_LOGO_HEIGHT + LOGO_GAP
    + engine.rows * PORTRAIT_CELL + 2 * FRAME_PAD + 2 * MESSAGE_GAP + HUD_PORTRAIT;
  // The rest needs the symbols; until they're in, only the character, logo and HUD are placed.
  let rest: ReturnType<typeof makeRest> | undefined;

  /**
   * Places everything in a scene of size `D`: one landscape layout (logo over the character, next
   * to the board, HUD row under the message), or for a portrait window the logo over the board,
   * the character on its left, and the HUD at the bottom. Returns where the HUD goes, the board
   * frame's width and where the character's feet are (design px).
   */
  const arrange = (o: Orientation, D: { width: number; height: number }) => {
    let cell: number, boardY: number, boardX: number, fit: number, feet: number, hudTop: number, logoX: number, logoY: number, logoWidth: number;
    let splashArea: { top: number; bottom: number; dotsY: number };
    if (o === 'landscape') {
      // Symbol size: as big as fits next to the character and above the message and HUD row.
      const below = MESSAGE_GAP + HUD_GAP + HUD_ROW;
      const maxWidth = D.width - 2 * MARGIN - bounds.width - GAP - 2 * FRAME_PAD;
      const maxHeight = D.height - 2 * MARGIN - below - 2 * FRAME_PAD;
      cell = Math.floor(Math.min(MAX_CELL, maxWidth / engine.reels, maxHeight / engine.rows));
      boardY = (D.height - (2 * FRAME_PAD + engine.rows * cell + below)) / 2 + FRAME_PAD;
      feet = FLOOR * D.height;
      // The character shrinks if it has to, to fit under the logo and above the floor.
      fit = Math.min(1, (feet - (boardY - FRAME_PAD) - LOGO_HEIGHT - LOGO_GAP) / bounds.height);
      const characterWidth = bounds.width * fit;
      const left = (D.width - (characterWidth + GAP + engine.reels * cell)) / 2;
      boardX = left + characterWidth + GAP;
      [logoX, logoY, logoWidth] = [left + characterWidth / 2, boardY - FRAME_PAD + LOGO_HEIGHT / 2, characterWidth + GAP];
      character.x = left - bounds.x * fit;
      const messageY = boardY + engine.rows * cell + FRAME_PAD + MESSAGE_GAP;
      hudTop = messageY + HUD_GAP;
      splashArea = { top: MARGIN, bottom: messageY - MESSAGE_GAP / 2, dotsY: messageY };
    } else {
      // Character on the board's left, as tall as the board's frame: together as wide as the scene.
      cell = PORTRAIT_CELL;
      const frameHeight = engine.rows * cell + 2 * FRAME_PAD;
      fit = frameHeight / bounds.height;
      const characterWidth = bounds.width * fit;
      // The HUD at the bottom; logo, board row and message centred in the room above it.
      hudTop = D.height - MARGIN - HUD_PORTRAIT;
      const group = PORTRAIT_LOGO_HEIGHT + LOGO_GAP + frameHeight + 2 * MESSAGE_GAP;
      const top = MARGIN + (hudTop - MARGIN - group) / 2;
      boardY = top + PORTRAIT_LOGO_HEIGHT + LOGO_GAP + FRAME_PAD;
      const left = (D.width - (characterWidth + GAP + engine.reels * cell + 2 * FRAME_PAD)) / 2;
      boardX = left + characterWidth + GAP + FRAME_PAD;
      // The logo centred on the screen, a little above the rest of the group.
      const logoTop = Math.max(MARGIN, top - PORTRAIT_LOGO_LIFT);
      [logoX, logoY, logoWidth] = [D.width / 2, logoTop + PORTRAIT_LOGO_HEIGHT / 2, D.width - 2 * MARGIN];
      character.x = left - bounds.x * fit;
      feet = boardY + engine.rows * cell + FRAME_PAD;
      // On the splash only SPIN (CONTINUE) shows, so the splash has everything above the SPIN row.
      const spinRowTop = D.height - MARGIN - PORTRAIT_SPIN_ROW;
      splashArea = { top: MARGIN, bottom: spinRowTop - 2 * MESSAGE_GAP, dotsY: spinRowTop - MESSAGE_GAP };
    }
    character.scale.set(fit);
    character.y = feet - (bounds.y + bounds.height) * fit;
    const logoHeight = o === 'landscape' ? LOGO_HEIGHT : PORTRAIT_LOGO_HEIGHT;
    title.scale.set(Math.min(logoHeight / title.texture.height, logoWidth / title.texture.width));
    title.position.set(logoX, logoY);
    if (rest) {
      const { board, wins, message, popup, bigWin, symbolInfo } = rest;
      board.scale.set(cell / MAX_CELL); // built at the largest symbol size
      board.position.set(boardX, boardY);
      wins.scale.copyFrom(board.scale);
      wins.position.copyFrom(board.position);
      // Screen centre (the scene is centred horizontally), in line with the SPIN button.
      message.position.set(D.width / 2, boardY + engine.rows * cell + FRAME_PAD + MESSAGE_GAP);
      // Pop-ups in the middle of the screen.
      popup.position.set(D.width / 2, D.height / 2);
      bigWin.position.copyFrom(popup.position);
      symbolInfo.hide();
    }
    const splash = { width: D.width, ...splashArea, logoHeight: o === 'landscape' ? LOGO_HEIGHT : PORTRAIT_SPLASH_LOGO_HEIGHT };
    return { hudTop, boardWidth: engine.reels * cell + 2 * FRAME_PAD * (cell / MAX_CELL), feet, splash };
  };

  let placed: ReturnType<typeof arrange> | undefined;
  let current = '';
  let splashBuilt = '';
  let splashTimer: ReturnType<typeof setTimeout> | undefined;
  // The splash is rebuilt for a new layout right away when the orientation flips, and otherwise
  // only once the window has stopped changing size.
  const layoutSplash = (now: boolean) => {
    if (!rest || !placed) return;
    clearTimeout(splashTimer);
    const key = JSON.stringify(placed.splash);
    const build = () => {
      if (!rest || !placed || key === splashBuilt) return;
      splashBuilt = key;
      rest.splash.layout(placed.splash);
    };
    if (now) build();
    else splashTimer = setTimeout(build, 250);
  };

  // Runs on window resize. A landscape window gets the landscape scene, as big as fits and centred;
  // a portrait one the portrait scene, as wide as the window and as tall as its shape. The
  // background covers the window, with its floor under the character's feet.
  const layout = () => {
    const { width, height } = app.screen;
    const o: Orientation = (DESIGN.height * height) / width >= portraitHeight ? 'portrait' : 'landscape';
    const D = o === 'landscape' ? DESIGN : { width: DESIGN.height, height: Math.round((DESIGN.height * height) / width) };
    const key = `${o}:${D.width}x${D.height}`;
    if (key !== current) {
      const flipped = !current.startsWith(o);
      current = key;
      placed = arrange(o, D);
      layoutSplash(flipped);
    }
    const scale = Math.min(width / D.width, height / D.height);
    scene.scale.set(scale);
    scene.position.set((width - D.width * scale) / 2, (height - D.height * scale) / 2);
    background.resize(width, height, scene.y + placed!.feet * scale);
    onHudLayout({
      top: scene.y + placed!.hudTop * scale, left: scene.x, width: D.width * scale,
      zoom: scale * HUD_ZOOM_PER_SCENE, boardWidth: placed!.boardWidth * scale, portrait: o === 'portrait',
    });
  };
  app.renderer.on('resize', layout);
  layout();

  await Assets.load([...engine.config.symbols.map((s) => symbolUrl(s.id)), ...BACKGROUND_URLS]);
  background.addArt();
  rest = makeRest(engine);
  scene.addChild(title, character, ...Object.values(rest));
  // Lay out again, now with everything in.
  current = '';
  layout();
  // A click anywhere off the board closes the symbol pop-up.
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', () => rest!.symbolInfo.hide());

  return { background, character, logo: title, ...rest };
}

/** Everything that needs the symbols loaded, in drawing order; `arrange` places it. */
function makeRest(engine: SlotEngine) {
  const board = new Board(engine.reels, engine.rows, MAX_CELL, engine.getSymbol, engine.fillerSymbol, engine.generateGrid());
  const message = new Message();
  message.text = 'Press SPIN to play';
  return {
    board, wins: new Wins(board), message, symbolInfo: new SymbolInfo(),
    bigWin: new BigWin(engine.config.bigWins), popup: new Popup(), splash: new Splash(engine.config),
  };
}
