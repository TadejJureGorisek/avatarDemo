import { Application, Assets, Container } from 'pixi.js';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SlotEngine } from '../engine/SlotEngine';
import { Background } from './Background';
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
const DESIGN = { width: 1600, height: 900 };
/** Space kept free around the scene and between character and board. */
const MARGIN = 20;
const GAP = 40;
/** Below the board: frame → message centre, message centre → HUD row, and the HUD row's height (all design px). */
const MESSAGE_GAP = 40;
const HUD_GAP = 40;
const HUD_ROW = 125;
/** The HUD is laid out for scene scale 0.8 (a 1280×720 window) and zoomed with the scene from there. */
const HUD_ZOOM_PER_SCENE = 1.25;
/** Most extra room (design px) the message gets below the board in a tall window; the HUD row gets twice it. */
const MAX_SPREAD = 40;
/** The logo above the character, and the gap between them (design px). */
const LOGO_HEIGHT = 170;
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
  const [hudLayout, setHudLayout] = useState<HudLayout>({ top: 0, zoom: 1, boardWidth: 0 });

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
        const size = board.cellSize;
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

/** Where the HUD row goes on screen (px from the top), its zoom, and the board's on-screen width. */
export interface HudLayout {
  top: number;
  zoom: number;
  boardWidth: number;
}

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine, onHudLayout: (layout: HudLayout) => void) {
  await app.init({
    resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio, 2)
  });
  app.canvas.style.display = 'block'; // inline canvases add a few px of line-box overflow
  host.appendChild(app.canvas);

  // The character (and logo) come first: their size sets the layout, so the HUD row (with "Loading…"
  // where SPIN goes) is in place while the rest loads.
  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...CHARACTER_ASSETS.map((a) => a.alias), LOGO_URL]);

  // Logo over character, next to the board, centred as one group.
  const character = new Character();
  const bounds = character.getLocalBounds();
  // Symbol size: as big as fits next to the character and above the message and HUD row, for any reels × rows.
  const below = MESSAGE_GAP + HUD_GAP + HUD_ROW;
  const maxWidth = DESIGN.width - 2 * MARGIN - bounds.width - GAP - 2 * FRAME_PAD;
  const maxHeight = DESIGN.height - 2 * MARGIN - below - 2 * FRAME_PAD;
  const cell = Math.floor(Math.min(MAX_CELL, maxWidth / engine.reels, maxHeight / engine.rows));
  const boardWidth = engine.reels * cell;
  const boardHeight = engine.rows * cell;
  // The character shrinks if it has to, so it fits under the logo within the board frame's height.
  const fitScale = Math.min(1, (boardHeight + 2 * FRAME_PAD - LOGO_HEIGHT - LOGO_GAP) / bounds.height);
  character.scale.set(fitScale);
  const characterWidth = bounds.width * fitScale;
  const left = (DESIGN.width - (characterWidth + GAP + boardWidth)) / 2;
  // Board, message and HUD row stacked, centred vertically as one block.
  const stack = 2 * FRAME_PAD + boardHeight + below;
  const boardX = left + characterWidth + GAP;
  const boardY = (DESIGN.height - stack) / 2 + FRAME_PAD;
  // Logo level with the top of the board frame, the character standing on the level of its bottom.
  const title = logo(LOGO_HEIGHT, characterWidth + GAP);
  title.position.set(left + characterWidth / 2, boardY - FRAME_PAD + LOGO_HEIGHT / 2);
  character.position.set(left - bounds.x * fitScale, boardY + boardHeight + FRAME_PAD - (bounds.y + bounds.height) * fitScale);
  const messageY = boardY + boardHeight + FRAME_PAD + MESSAGE_GAP;
  const hudTop = messageY + HUD_GAP;

  const background = new Background();
  // The 1600x900 design-space scene; it's scaled to fit the window (the HUD row is part of it).
  const scene = new Container();
  app.stage.addChild(background, scene);
  // In a window taller than the design, the message moves down by `spread` and the HUD row by twice
  // that, so they get some air instead of all the spare room going above and below the scene.
  let spread = 0;
  let onSpread = () => {};
  // Runs on window resize; tells the HUD where its row is so it sits right under the message.
  const layout = () => {
    const { width, height } = app.screen;
    background.resize(width, height);
    const scale = Math.min(width / DESIGN.width, height / DESIGN.height);
    spread = Math.min(MAX_SPREAD, Math.max(0, height / scale - DESIGN.height) / 8);
    scene.scale.set(scale);
    // The scene grows by 2 × spread at the bottom; it stays centred as a whole.
    scene.position.set((width - DESIGN.width * scale) / 2, (height - (DESIGN.height + 2 * spread) * scale) / 2);
    onSpread();
    onHudLayout({ top: scene.y + (hudTop + 2 * spread) * scale, zoom: scale * HUD_ZOOM_PER_SCENE, boardWidth: (boardWidth + 2 * FRAME_PAD) * scale });
  };
  app.renderer.on('resize', layout);
  layout();

  await Assets.load(engine.config.symbols.map((s) => symbolUrl(s.id)));
  const board = new Board(engine.reels, engine.rows, cell, engine.getSymbol, engine.fillerSymbol, engine.generateGrid());
  board.position.set(boardX, boardY);
  const wins = new Wins(board);
  wins.position.copyFrom(board.position);
  const message = new Message();
  // Screen centre (the scene is centred horizontally), in line with the SPIN button.
  message.position.set(DESIGN.width / 2, messageY);
  message.text = 'Press SPIN to play';
  const popup = new Popup();
  popup.position.set(board.x + board.boardWidth / 2, board.y + board.boardHeight / 2);
  const symbolInfo = new SymbolInfo();
  const bigWin = new BigWin(engine.config.bigWins);
  bigWin.position.copyFrom(popup.position);

  // The intro fills the space above the HUD row, with its dots where the message goes.
  const splash = new Splash(engine.config, DESIGN.width, MARGIN, message.y - MESSAGE_GAP / 2, message.y);
  onSpread = () => {
    message.y = messageY + spread;
    splash.setDotsY(messageY + spread);
  };
  onSpread();
  scene.addChild(title, character, board, wins, message, symbolInfo, bigWin, popup, splash);
  // A click anywhere off the board closes the symbol pop-up.
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', () => symbolInfo.hide());

  return { background, board, wins, character, logo: title, message, popup, bigWin, symbolInfo, splash };
}
