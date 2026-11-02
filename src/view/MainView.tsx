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
import { MAX_CELL, orientationFor, SCENES, type Orientation, type Scene } from './layout';

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
    freeSpinsLeft: 0, freeSpin: false, autoplayLeft: 0, freeSpinsReady: false, continueReady: false, bigWinCounting: false, turbo: false,
  });
  const update = (patch: Partial<HudState>) => setHud((s) => ({ ...s, ...patch }));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const autoplayLeft = useRef(0);
  const pausedAutoplay = useRef(0);
  const turbo = useRef(false);
  const setAutoplay = (spins: number) => update({ autoplayLeft: (autoplayLeft.current = spins) });
  const symbolInfoRef = useRef<SymbolInfo>();
  const bigWinRef = useRef<BigWin>();
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
          pauseAutoplay: () => {
            pausedAutoplay.current = autoplayLeft.current;
            setAutoplay(0);
          },
          resumeAutoplay: () => {
            if (pausedAutoplay.current) setAutoplay(pausedAutoplay.current);
            pausedAutoplay.current = 0;
          },
          recordSpin: (entry) => setHistory((h) => [entry, ...h].slice(0, 50)),
        },
        (state) => update({ state }),
      );
      const { board, symbolInfo } = scene;
      symbolInfoRef.current = symbolInfo;
      bigWinRef.current = scene.bigWin;
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

  const pressSpin = useCallback(() => {
    if (bigWinRef.current?.counting) bigWinRef.current.skip();
    else if (autoplayLeft.current > 0) setAutoplay(0);
    else if (machine.current?.current === 'spin') stopRequest.current?.();
    else spinRequest.current?.();
  }, []);
  const requestCheat = useCallback((cheat: Cheat) => {
    if (spinRequest.current) spinRequest.current(cheat);
    else engine.forceNext(cheat);
  }, [engine]);
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

export interface HudLayout {
  top: number;
  metersY: number;
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
  app.canvas.style.display = 'block';
  host.appendChild(app.canvas);

  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...CHARACTER_ASSETS.map((a) => a.alias), LOGO_URL]);
  const character = new Character();
  const title = logo(1);
  const background = new Background();
  const scene = new Container();
  app.stage.addChild(background, scene);
  let rest: ReturnType<typeof makeRest> | undefined;
  let current: Orientation | undefined;

  const place = (s: Scene) => {
    character.scale.set(s.character.scale);
    character.position.set(s.character.x, s.character.y);
    title.scale.set(Math.min(s.logo.height / title.texture.height, s.logo.maxWidth / title.texture.width));
    title.position.set(s.logo.x, s.logo.y);
    if (!rest) return;
    const { board, wins, message, popup, bigWin, symbolInfo, splash } = rest;
    board.scale.set(s.board.cell / MAX_CELL);
    board.position.set(s.board.x, s.board.y);
    wins.scale.copyFrom(board.scale);
    wins.position.copyFrom(board.position);
    message.position.set(s.message.x, s.message.y);
    popup.position.set(s.size.width / 2, s.size.height / 2);
    bigWin.position.copyFrom(popup.position);
    symbolInfo.hide();
    splash.layout({ width: s.size.width, ...s.splash });
  };

  const layout = () => {
    const { width, height } = app.screen;
    const orientation = orientationFor(width, height);
    const s = SCENES[orientation];
    if (orientation !== current) {
      current = orientation;
      place(s);
    }
    const scale = Math.min(width / s.size.width, height / s.size.height);
    scene.scale.set(scale);
    scene.position.set((width - s.size.width * scale) / 2, (height - s.size.height * scale) / 2);
    background.resize(width, height, scene.y + s.floor * scale);
    onHudLayout({
      top: scene.y + s.hud.top * scale, metersY: scene.y + s.hud.metersY * scale, left: scene.x, width: s.size.width * scale,
      zoom: scale * HUD_ZOOM_PER_SCENE, boardWidth: (engine.reels + (2 * FRAME_PAD) / MAX_CELL) * s.board.cell * scale,
      portrait: orientation === 'portrait',
    });
  };
  app.renderer.on('resize', layout);
  layout();

  await Assets.load([...engine.config.symbols.map((s) => symbolUrl(s.id)), ...BACKGROUND_URLS, FRAME_URL, PANEL_URL]);
  background.addArt();
  rest = makeRest(engine);
  scene.addChild(title, character, ...Object.values(rest));
  current = undefined;
  layout();
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', () => rest!.symbolInfo.hide());

  return { background, character, logo: title, ...rest };
}

function makeRest(engine: SlotEngine) {
  const board = new Board(engine.reels, engine.rows, MAX_CELL, engine.getSymbol, engine.fillerSymbol, engine.generateGrid());
  const message = new Message();
  message.text = 'Press SPIN to play';
  return {
    board, wins: new Wins(board), message, symbolInfo: new SymbolInfo(),
    bigWin: new BigWin(engine.config.bigWins), popup: new Popup(), splash: new Splash(engine.config),
  };
}
