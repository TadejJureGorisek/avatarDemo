import { Application, Assets, Container, FillGradient, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlotEngine } from '../engine/SlotEngine';
import { Board } from './board/Board';
import { symbolUrl } from './board/Cell';
import { Character, CHARACTER_ASSETS } from './Character';
import type { Cheat } from './hud/CheatMenu';
import { Hud, type HudState } from './hud/Hud';
import { BetState } from './states/BetState';
import { SpinState } from './states/SpinState';
import { StateMachine } from './states/StateMachine';
import { WinState } from './states/WinState';
import { Wins } from './Wins';

const CELL = 200;
const DESIGN = { width: 1600, height: 900 };
const HUD_HEIGHT = 110;

/** The whole game: builds the Pixi scene (board, wins, character) and the HUD, then runs the state machine. */
export function MainView({ engine }: { engine: SlotEngine }) {
  const { bets, defaultBetIndex } = engine.config;
  const host = useRef<HTMLDivElement>(null);
  const betIndex = useRef(defaultBetIndex);
  const spinRequest = useRef<(cheat?: Cheat) => void>();
  const [hud, setHud] = useState<HudState>({
    ready: false, state: 'bet', balance: engine.balance, bet: bets[defaultBetIndex],
    freeSpinsLeft: 0, freeSpinsTotal: 0, message: 'Press SPIN to play',
  });
  const update = (patch: Partial<HudState>) => setHud((s) => ({ ...s, ...patch }));

  useEffect(() => {
    const app = new Application();
    createScene(app, host.current!, engine).then((scene) => {
      const machine = new StateMachine(
        { bet: BetState, spin: SpinState, win: WinState },
        {
          engine, ...scene,
          bet: () => bets[betIndex.current],
          updateHud: update,
          waitForSpin: () => new Promise((resolve) => (spinRequest.current = resolve)),
        },
        (state) => update({ state }),
      );
      update({ ready: true });
      void machine.run();
    });
    return () => app.destroy(true, { children: true });
  }, [engine, bets]);

  const changeBet = useCallback((direction: 1 | -1) => {
    betIndex.current = Math.max(0, Math.min(bets.length - 1, betIndex.current + direction));
    update({ bet: bets[betIndex.current] });
  }, [bets]);

  const requestSpin = useCallback(() => spinRequest.current?.(), []);
  const requestCheat = useCallback((cheat: Cheat) => spinRequest.current?.(cheat), []);

  return (
    <div className="game">
      <div className="canvas-host" ref={host} />
      <Hud state={hud} onSpin={requestSpin} onBetChange={changeBet} onCheat={requestCheat} />
    </div>
  );
}

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine) {
  await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio, 2) });
  host.appendChild(app.canvas);

  Assets.add(CHARACTER_ASSETS);
  await Assets.load([...engine.config.symbols.map((s) => symbolUrl(s.id)), ...CHARACTER_ASSETS.map((a) => a.alias)]);

  // Board size comes from the engine, so nothing in the view hardcodes 5x3.
  const board = new Board(engine.reels, engine.rows, CELL, engine.getSymbol, engine.generateGrid());
  // Character on the left, board on the right.
  board.position.set(DESIGN.width - board.boardWidth - 60, (DESIGN.height - board.boardHeight) / 2 - 40);
  const wins = new Wins(board);
  wins.position.copyFrom(board.position);
  const character = new Character();
  character.position.set(270, 560);

  const background = new Graphics();
  const root = new Container();
  root.addChild(character, board, wins);
  app.stage.addChild(background, root);

  // Letterbox the 1600x900 scene above the HUD.
  const layout = () => {
    const { width, height } = app.screen;
    const fill = new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
      colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }] });
    background.clear().rect(0, 0, width, height).fill(fill);
    const scale = Math.min(width / DESIGN.width, (height - HUD_HEIGHT) / DESIGN.height);
    root.scale.set(scale);
    root.position.set((width - DESIGN.width * scale) / 2, (height - HUD_HEIGHT - DESIGN.height * scale) / 2);
  };
  app.renderer.on('resize', layout);
  layout();

  return { board, wins, character };
}
