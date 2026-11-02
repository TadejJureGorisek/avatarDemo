import { Application, Assets, Container } from 'pixi.js';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SlotEngine } from '../engine/SlotEngine';
import { Background, BACKGROUND_URLS } from './Background';
import { BigWin } from './BigWin';
import { Board, FRAME_PAD } from './board/Board';
import { FRAME_URL, PANEL_URL } from './Frame';
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
import { layoutFor, MAX_CELL, sceneFor } from './layout';

/** The HUD is laid out for scene scale 0.8 (a 1280×720 window) and zoomed with the scene from there. */
const HUD_ZOOM_PER_SCENE = 1.25;
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
  const [hudLayout, setHudLayout] = useState<HudLayout>({ top: 0, metersY: 0, left: 0, width: 0, zoom: 1, boardWidth: 0, portrait: false });

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
      const { board, symbolInfo } = scene;
      symbolInfoRef.current = symbolInfo;
      // Tapping the symbol whose pop-up is open closes it; any other symbol opens its own.
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

/** All positions and sizes in screen px. */
export interface HudLayout {
  top: number;
  /** Portrait: where the balance and bet row is centred. */
  metersY: number;
  /** The scene's left edge and width: the HUD is centred on it. */
  left: number;
  width: number;
  zoom: number;
  boardWidth: number;
  portrait: boolean;
}

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine, onHudLayout: (layout: HudLayout) => void) {
  await app.init({
    resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio, 2)
  });
  app.canvas.style.display = 'block'; // inline canvases add a few px of line-box overflow
  host.appendChild(app.canvas);

  // Character and logo load first: their size sets the layout, so the HUD can show while the rest loads.
  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...CHARACTER_ASSETS.map((a) => a.alias), LOGO_URL]);
  const character = new Character();
  const title = logo(1);
  const background = new Background();
  const scene = new Container();
  app.stage.addChild(background, scene);
  const input = { reels: engine.reels, rows: engine.rows, character: character.getLocalBounds(), pad: FRAME_PAD / MAX_CELL };
  // Needs the symbols loaded; until then only the character, logo and HUD are placed.
  let rest: ReturnType<typeof makeRest> | undefined;
  let placed: ReturnType<typeof layoutFor>;
  let key = '';
  let splashFor = '';

  const layout = () => {
    const { width, height } = app.screen;
    const { orientation, size } = sceneFor(width, height, input);
    if (`${orientation}:${size.height}` !== key) {
      key = `${orientation}:${size.height}`;
      placed = layoutFor(orientation, size, input);
      place(placed);
      // The splash is only rebuilt when the orientation flips; otherwise it just moves with SPIN.
      if (rest && splashFor !== orientation) {
        splashFor = orientation;
        rest.splash.layout(placed.splash);
        rest.splash.builtTop = placed.splash.top;
      } else if (rest) rest.splash.y = rest.splash.pivot.y + placed.splash.top - rest.splash.builtTop;
    }
    const scale = Math.min(width / size.width, height / size.height);
    scene.scale.set(scale);
    scene.position.set((width - size.width * scale) / 2, (height - size.height * scale) / 2);
    background.resize(width, height, scene.y + placed.feet * scale);
    onHudLayout({
      top: scene.y + placed.hudTop * scale, metersY: scene.y + placed.metersY * scale, left: scene.x, width: size.width * scale,
      zoom: scale * HUD_ZOOM_PER_SCENE, boardWidth: placed.board.frameWidth * scale, portrait: orientation === 'portrait',
    });
  };

  const place = (p: ReturnType<typeof layoutFor>) => {
    character.scale.set(p.character.scale);
    character.position.set(p.character.x, p.character.y);
    title.scale.set(Math.min(p.logo.height / title.texture.height, p.logo.width / title.texture.width));
    title.position.set(p.logo.x, p.logo.y);
    if (!rest) return;
    const { board, wins, message, popup, bigWin, symbolInfo } = rest;
    board.scale.set(p.cell / MAX_CELL); // built at the largest symbol size
    board.position.set(p.board.x, p.board.y);
    wins.scale.copyFrom(board.scale);
    wins.position.copyFrom(board.position);
    message.position.set(p.message.x, p.message.y);
    popup.position.set(p.centre.x, p.centre.y);
    bigWin.position.copyFrom(popup.position);
    symbolInfo.hide();
  };

  app.renderer.on('resize', layout);
  layout();

  await Assets.load([...engine.config.symbols.map((s) => symbolUrl(s.id)), ...BACKGROUND_URLS, FRAME_URL, PANEL_URL]);
  background.addArt();
  rest = makeRest(engine);
  scene.addChild(title, character, ...Object.values(rest));
  key = ''; // lay out again now that everything is in
  layout();
  // A click anywhere off the board closes the symbol pop-up.
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', () => rest!.symbolInfo.hide());

  return { background, character, logo: title, ...rest };
}

/** Everything that needs the symbols loaded, in drawing order. */
function makeRest(engine: SlotEngine) {
  const board = new Board(engine.reels, engine.rows, MAX_CELL, engine.getSymbol, engine.fillerSymbol, engine.generateGrid());
  const message = new Message();
  message.text = 'Press SPIN to play';
  return {
    board, wins: new Wins(board), message, symbolInfo: new SymbolInfo(),
    bigWin: new BigWin(engine.config.bigWins), popup: new Popup(), splash: new Splash(engine.config),
  };
}
