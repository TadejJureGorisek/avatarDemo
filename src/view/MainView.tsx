import { Application, Assets, Container } from 'pixi.js';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SlotEngine } from '../engine/SlotEngine';
import { Background } from './Background';
import { BigWin } from './BigWin';
import { Board } from './board/Board';
import { symbolUrl } from './board/Cell';
import { Character, CHARACTER_ASSETS } from './Character';
import type { Cheat } from './hud/CheatMenu';
import { Hud, type HudState } from './hud/Hud';
import type { HistoryEntry } from './hud/menu/History';
import { BetState } from './states/BetState';
import { SpinState } from './states/SpinState';
import { StateMachine } from './states/StateMachine';
import { WinState } from './states/WinState';
import { Message } from './Message';
import { Popup } from './Popup';
import { SymbolInfo } from './SymbolInfo';
import { Wins } from './Wins';

const CELL = 200;
const DESIGN = { width: 1600, height: 900 };
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
    ready: false, state: 'bet', balance: engine.balance, ...betState(defaultBetIndex),
    freeSpinsLeft: 0, freeSpinsTotal: 0, freeSpin: false, autoplayLeft: 0,
  });
  const update = (patch: Partial<HudState>) => setHud((s) => ({ ...s, ...patch }));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const autoplayLeft = useRef(0);
  const setAutoplay = (spins: number) => update({ autoplayLeft: (autoplayLeft.current = spins) });
  const hudHeight = useRef(0);
  const relayout = useRef<() => void>();
  const symbolInfoRef = useRef<SymbolInfo>();

  useEffect(() => {
    const app = new Application();
    createScene(app, host.current!, engine, () => hudHeight.current).then(({ layout, ...scene }) => {
      relayout.current = layout;
      machine.current = new StateMachine(
        { bet: BetState, spin: SpinState, win: WinState },
        {
          engine, ...scene,
          bet: () => engine.config.bets[betIndex.current],
          updateHud: update,
          waitForSpin: () => new Promise((resolve) => (spinRequest.current = resolve)),
          waitForStop: () => new Promise((resolve) => (stopRequest.current = resolve)),
          takeAutoSpin: () => autoplayLeft.current > 0 && (setAutoplay(autoplayLeft.current - 1), true),
          stopAutoplay: () => setAutoplay(0),
          recordSpin: (entry) => setHistory((h) => [entry, ...h].slice(0, 50)),
        },
        (state) => update({ state }),
      );
      // Clicking a landed symbol shows what it pays; not while the reels spin.
      const { board, symbolInfo } = scene;
      symbolInfoRef.current = symbolInfo;
      board.onCellTap = (reel, row) => {
        if (machine.current?.current === 'spin') return;
        const cell = board.cell(reel, row);
        symbolInfo.show(cell.def, engine.config.bets[betIndex.current], board.x + (reel + 0.5) * CELL,
          board.y + (row + 0.5) * CELL, reel < engine.reels / 2);
      };
      update({ ready: true });
      void machine.current.run();
    });
    return () => {
      relayout.current = undefined;
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
  const requestCheat = useCallback((cheat: Cheat) => spinRequest.current?.(cheat), []);
  // The first autoplay spin starts now (BetState is waiting for SPIN); the rest come from BetState.
  const startAutoplay = useCallback((spins: number) => {
    setAutoplay(spins - 1);
    spinRequest.current?.();
  }, []);
  const stopAutoplay = useCallback(() => setAutoplay(0), []);
  const onHudHeight = useCallback((height: number) => {
    hudHeight.current = height;
    relayout.current?.();
  }, []);

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
        onHeight={onHudHeight}
      />
    </div>
  );
}

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine, hudHeight: () => number) {
  await app.init({
    resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio, 2)
  });
  app.canvas.style.display = 'block'; // inline canvases add a few px of line-box overflow
  host.appendChild(app.canvas);

  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...engine.config.symbols.map((s) => symbolUrl(s.id)), ...CHARACTER_ASSETS.map((a) => a.alias)]);

  // Character + gap + board, centred as one group; character vertically centred on the board.
  const GAP = 40;
  const board = new Board(engine.reels, engine.rows, CELL, engine.getSymbol, engine.fillerSymbol, engine.generateGrid());
  const character = new Character();
  const bounds = character.getLocalBounds();
  const left = (DESIGN.width - (bounds.width + GAP + board.boardWidth)) / 2;
  board.position.set(left + bounds.width + GAP, (DESIGN.height - board.boardHeight) / 2 - 40);
  character.position.set(left - bounds.x, board.y + board.boardHeight / 2 - (bounds.y + bounds.height / 2));

  const wins = new Wins(board);
  wins.position.copyFrom(board.position);
  const message = new Message();
  // Screen centre (the scene is centred horizontally), in line with the SPIN button.
  message.position.set(DESIGN.width / 2, board.y + board.boardHeight + 70);
  message.text = 'Press SPIN to play';
  const popup = new Popup();
  popup.position.set(board.x + board.boardWidth / 2, board.y + board.boardHeight / 2);
  const symbolInfo = new SymbolInfo();
  const bigWin = new BigWin(engine.config.bigWins);
  bigWin.position.copyFrom(popup.position);

  const background = new Background();
  // The 1600x900 design-space scene; it's scaled to fit the screen above the HUD.
  const scene = new Container();
  scene.addChild(character, board, wins, message, symbolInfo, bigWin, popup);
  app.stage.addChild(background, scene);
  // A click anywhere off the board closes the symbol pop-up.
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', () => symbolInfo.hide());

  // Runs on window resize and whenever the HUD reports a new height.
  const layout = () => {
    const { width, height } = app.screen;
    background.resize(width, height);
    const available = height - hudHeight();
    const scale = Math.min(width / DESIGN.width, available / DESIGN.height);
    scene.scale.set(scale);
    scene.position.set((width - DESIGN.width * scale) / 2, (available - DESIGN.height * scale) / 2);
  };
  app.renderer.on('resize', layout);
  layout();

  return { board, wins, character, message, popup, bigWin, symbolInfo, layout };
}
