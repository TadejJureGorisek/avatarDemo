import { Application, Assets, Container } from 'pixi.js';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SlotEngine } from '../engine/SlotEngine';
import { Background, BACKGROUND_URLS, type Orientation } from './Background';
import { BigWin, BIG_WIN_WIDTH } from './BigWin';
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
import { Popup, POPUP_WIDTH } from './Popup';
import { Splash } from './Splash';
import { SymbolInfo } from './SymbolInfo';
import { Wins } from './Wins';

/** Largest symbol size; boards with more reels or rows get smaller symbols so they still fit. */
const MAX_CELL = 200;
/**
 * The stage is 16:9 in a landscape window and 9:16 in a portrait one (1920×1080 / 1080×1920 at full
 * size), laid out in these design units and scaled to fit, with black bars around it.
 */
const DESIGN = { landscape: { width: 1600, height: 900 }, portrait: { width: 900, height: 1600 } };
/** Where the floor is in the landscape background (of its height): the character stands on it there. */
const LANDSCAPE_FLOOR = 0.755;
/** Space kept free around the scene and between character and board. */
const MARGIN = 20;
const GAP = 40;
/** Below the board: frame → message centre, message centre → HUD row, and the HUD row's height (all design px). */
const MESSAGE_GAP = 40;
const HUD_GAP = 40;
const HUD_ROW = 125;
/**
 * The HUD is laid out for scene scale 0.8 (a 1280×720 landscape window) and zoomed with the scene
 * from there; in portrait it's zoomed less, so the row fits the narrower stage.
 */
const HUD_ZOOM_PER_SCENE = { landscape: 1.25, portrait: 0.85 };
/** The logo above the character (in game and on the splash), and the gap under it (design px). */
const LOGO_HEIGHT = { landscape: 170, portrait: 220 };
const SPLASH_LOGO_HEIGHT = { landscape: 170, portrait: 260 };
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
    freeSpinsLeft: 0, freeSpin: false, autoplayLeft: 0, freeSpinsReady: false, continueReady: false,
  });
  const update = (patch: Partial<HudState>) => setHud((s) => ({ ...s, ...patch }));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const autoplayLeft = useRef(0);
  const setAutoplay = (spins: number) => update({ autoplayLeft: (autoplayLeft.current = spins) });
  const symbolInfoRef = useRef<SymbolInfo>();
  // Where the scene puts the HUD row and how much to zoom it, plus the board's on-screen width for the menu.
  const [hudLayout, setHudLayout] = useState<HudLayout>({ top: 0, left: 0, width: 0, zoom: 1, boardWidth: 0 });

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
        layout={hudLayout}
      />
    </div>
  );
}

/** Where the HUD row goes on screen (px), its zoom, and the board's on-screen width. */
export interface HudLayout {
  top: number;
  /** The stage's left edge and width: the row is centred on it. */
  left: number;
  width: number;
  zoom: number;
  boardWidth: number;
}

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine, onHudLayout: (layout: HudLayout) => void) {
  await app.init({
    resizeTo: host, background: 0x000000, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio, 2)
  });
  app.canvas.style.display = 'block'; // inline canvases add a few px of line-box overflow
  host.appendChild(app.canvas);

  // The character (and logo) come first: their size sets the layout, so the HUD row (with "Loading…"
  // where SPIN goes) is in place while the rest loads.
  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...CHARACTER_ASSETS.map((a) => a.alias), LOGO_URL]);

  const character = new Character();
  const bounds = character.getLocalBounds();
  const title = logo(1);
  const background = new Background();
  // The design-space scene, scaled to fit the stage (the HUD row is part of it).
  const scene = new Container();
  app.stage.addChild(background, scene);
  // The rest needs the symbols; until they're in, only the character, logo and HUD row are placed.
  let rest: ReturnType<typeof makeRest> | undefined;
  let orientation: Orientation | undefined;
  let place = { hudTop: 0, boardWidth: 0 };

  /** Places everything for a landscape or portrait stage; returns the HUD row's top and the board frame's width. */
  const arrange = (o: Orientation) => {
    const D = DESIGN[o];
    const below = MESSAGE_GAP + HUD_GAP + HUD_ROW;
    const logoHeight = LOGO_HEIGHT[o];
    let cell: number, boardX: number, boardY: number, fit: number, feet: number;
    let logoBox: { x: number; y: number; width: number };
    if (o === 'landscape') {
      // Logo over character, next to the board, centred as one group; the character stands on the floor.
      const maxWidth = D.width - 2 * MARGIN - bounds.width - GAP - 2 * FRAME_PAD;
      const maxHeight = D.height - 2 * MARGIN - below - 2 * FRAME_PAD;
      cell = Math.floor(Math.min(MAX_CELL, maxWidth / engine.reels, maxHeight / engine.rows));
      boardY = (D.height - (2 * FRAME_PAD + engine.rows * cell + below)) / 2 + FRAME_PAD;
      // The character shrinks if it has to, to fit under the logo and above the floor.
      fit = Math.min(1, (LANDSCAPE_FLOOR * D.height - (boardY - FRAME_PAD) - logoHeight - LOGO_GAP) / bounds.height);
      const characterWidth = bounds.width * fit;
      const left = (D.width - (characterWidth + GAP + engine.reels * cell)) / 2;
      boardX = left + characterWidth + GAP;
      logoBox = { x: left + characterWidth / 2, y: boardY - FRAME_PAD + logoHeight / 2, width: characterWidth + GAP };
      character.x = left - bounds.x * fit;
      feet = LANDSCAPE_FLOOR * D.height;
    } else {
      // Logo across the top; under it, as in landscape, the character on the board's left, as tall
      // as the board's frame and standing on the floor, with both as wide as the stage allows.
      // Logo, that row, the message and the HUD row are centred as one group.
      const aspect = bounds.width / bounds.height;
      // Character width + gap + frame = the stage's width, with the character as tall as the frame.
      cell = Math.floor(Math.min(MAX_CELL,
        (D.width - 2 * MARGIN - GAP - 2 * FRAME_PAD - aspect * 2 * FRAME_PAD) / (engine.reels + aspect * engine.rows)));
      const frameHeight = engine.rows * cell + 2 * FRAME_PAD;
      fit = frameHeight / bounds.height;
      const characterWidth = bounds.width * fit;
      const group = logoHeight + LOGO_GAP + frameHeight + below;
      const top = (D.height - group) / 2;
      boardY = top + logoHeight + LOGO_GAP + FRAME_PAD;
      const left = (D.width - (characterWidth + GAP + engine.reels * cell + 2 * FRAME_PAD)) / 2;
      boardX = left + characterWidth + GAP + FRAME_PAD;
      logoBox = { x: D.width / 2, y: top + logoHeight / 2, width: D.width - 2 * MARGIN };
      character.x = left - bounds.x * fit;
      feet = boardY + engine.rows * cell + FRAME_PAD;
    }
    character.scale.set(fit);
    character.y = feet - (bounds.y + bounds.height) * fit;
    title.scale.set(Math.min(logoHeight / title.texture.height, logoBox.width / title.texture.width));
    title.position.set(logoBox.x, logoBox.y);
    const boardScale = cell / MAX_CELL;
    const messageY = boardY + engine.rows * cell + FRAME_PAD + MESSAGE_GAP;
    if (rest) {
      const { board, wins, message, popup, bigWin, symbolInfo, splash } = rest;
      // The board is built at the largest symbol size and scaled down to this one.
      board.scale.set(boardScale);
      board.position.set(boardX, boardY);
      wins.scale.copyFrom(board.scale);
      wins.position.copyFrom(board.position);
      message.position.set(D.width / 2, messageY);
      // Pop-ups in the middle of the stage, as wide as fits.
      const fitWidth = (width: number) => Math.min(1, (D.width - 2 * MARGIN) / width);
      popup.position.set(D.width / 2, D.height / 2);
      popup.scale.set((popup.fit = fitWidth(POPUP_WIDTH)));
      bigWin.position.copyFrom(popup.position);
      bigWin.scale.set((bigWin.fit = fitWidth(BIG_WIN_WIDTH)));
      symbolInfo.hide();
      // The intro fills the space above the HUD row, with its dots where the message goes.
      splash.layout({ width: D.width, top: MARGIN, bottom: messageY - MESSAGE_GAP / 2, dotsY: messageY, logoHeight: SPLASH_LOGO_HEIGHT[o] });
    }
    return { hudTop: messageY + HUD_GAP, boardWidth: engine.reels * cell + 2 * FRAME_PAD * boardScale };
  };

  // Runs on window resize: the stage is the largest 16:9 (or 9:16) box that fits, centred; the
  // background fills the bars around it.
  const layout = () => {
    const { width, height } = app.screen;
    const o: Orientation = width >= height ? 'landscape' : 'portrait';
    if (o !== orientation) {
      orientation = o;
      place = arrange(o);
    }
    const D = DESIGN[o];
    const scale = Math.min(width / D.width, height / D.height);
    scene.scale.set(scale);
    scene.position.set((width - D.width * scale) / 2, (height - D.height * scale) / 2);
    background.resize({ width, height }, { x: scene.x, y: scene.y, width: D.width * scale, height: D.height * scale }, o);
    onHudLayout({
      top: scene.y + place.hudTop * scale, left: scene.x, width: D.width * scale,
      zoom: scale * HUD_ZOOM_PER_SCENE[o], boardWidth: place.boardWidth * scale,
    });
  };
  app.renderer.on('resize', layout);
  layout();

  await Assets.load([...engine.config.symbols.map((s) => symbolUrl(s.id)), ...BACKGROUND_URLS]);
  background.addArt();
  rest = makeRest(engine);
  scene.addChild(title, character, ...Object.values(rest));
  // Lay out again, now with everything in.
  orientation = undefined;
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
