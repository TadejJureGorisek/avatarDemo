import gsap from 'gsap';
import { Application, Assets, Container, FillGradient, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { countSymbol, type SlotEngine, type SpinResult } from '../engine/SlotEngine';
import { Board } from './board/Board';
import { symbolUrl } from './board/Cell';
import { Character, CHARACTER_ASSETS } from './Character';
import { Hud, type HudState } from './hud/Hud';
import { Wins } from './Wins';

const CELL = 200;
const DESIGN = { width: 1600, height: 900 };
const HUD_HEIGHT = 110;
const REEL_STAGGER_S = 0.11;
const ANTICIPATION_EXTRA_S = 0.9;
const FREE_SPIN_PAUSE_S = 1.1;

interface Scene {
  board: Board;
  wins: Wins;
  character: Character;
}

/** The whole game: Pixi scene (board, wins, character), the HUD, and the spin flow that drives them. */
export function MainView({ engine }: { engine: SlotEngine }) {
  const { bets, defaultBetIndex } = engine.config;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene>();
  const busy = useRef(false);
  const betIndex = useRef(defaultBetIndex);
  const [hud, setHud] = useState<HudState>({
    ready: false, balance: engine.balance, bet: bets[defaultBetIndex], spinning: false,
    freeSpinsLeft: 0, freeSpinsTotal: 0, message: 'Press SPIN to play',
  });
  const update = (patch: Partial<HudState>) => setHud((s) => ({ ...s, ...patch }));

  useEffect(() => {
    const app = new Application();
    createScene(app, host.current!, engine).then((s) => {
      scene.current = s;
      update({ ready: true });
    });
    return () => app.destroy(true, { children: true });
  }, [engine]);

  const changeBet = useCallback((direction: 1 | -1) => {
    betIndex.current = Math.max(0, Math.min(bets.length - 1, betIndex.current + direction));
    update({ bet: bets[betIndex.current] });
  }, [bets]);

  const spin = useCallback(async function spin(): Promise<void> {
    if (!scene.current || busy.current) return;
    const bet = bets[betIndex.current];
    if (!engine.canSpin(bet)) return update({ message: 'Not enough balance, lower your bet' });

    busy.current = true;
    const result = engine.spin(bet);
    update({
      spinning: true,
      balance: engine.balance - result.totalWin, // show the stake now, the win once reels land
      freeSpinsLeft: engine.freeSpinsLeft - result.freeSpinsAwarded,
      message: result.isFreeSpin ? 'Free spin!' : 'Good luck!',
    });

    await present(scene.current, engine, result);

    busy.current = false;
    update({
      spinning: false,
      balance: engine.balance,
      freeSpinsLeft: engine.freeSpinsLeft,
      freeSpinsTotal: engine.freeSpinsTotal,
      message: message(engine, result),
    });

    if (engine.freeSpinsLeft) {
      await new Promise((resolve) => gsap.delayedCall(result.freeSpinsAwarded ? FREE_SPIN_PAUSE_S * 2 : FREE_SPIN_PAUSE_S, resolve));
      return spin();
    }
  }, [engine, bets]);

  return (
    <div className="game">
      <div className="canvas-host" ref={host} />
      <Hud state={hud} onSpin={spin} onBetChange={changeBet} />
    </div>
  );
}

async function createScene(app: Application, host: HTMLElement, engine: SlotEngine): Promise<Scene> {
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

async function present({ board, wins, character }: Scene, engine: SlotEngine, result: SpinResult) {
  // Once one more scatter would trigger free spins, slow the remaining reels and play anticipation.
  const anticipationReel = findAnticipationReel(engine, result);
  const delays = result.grid.map((_, reel) =>
    reel * REEL_STAGGER_S + (anticipationReel >= 0 && reel > anticipationReel ? (reel - anticipationReel) * ANTICIPATION_EXTRA_S : 0));

  wins.clear();
  await board.spin(result.grid, delays, (reel) => reel === anticipationReel && character.startAnticipation());
  wins.show(result.wins, result.totalWin);

  if (anticipationReel >= 0) {
    await character.play(result.freeSpinsAwarded ? 'bonus_anticipation_win' : 'bonus_anticipation_lose');
  } else if (result.totalWin) {
    void character.play('small_win');
  }
}

function findAnticipationReel(engine: SlotEngine, { grid }: SpinResult) {
  if (!engine.scatter) return -1;
  for (let reel = 0; reel < grid.length - 1; reel++) {
    if (countSymbol(grid, engine.scatter.id, reel) >= engine.config.freeSpins.minScatters - 1) return reel;
  }
  return -1;
}

function message(engine: SlotEngine, result: SpinResult) {
  if (result.freeSpinsAwarded) return `${result.freeSpinsAwarded} FREE SPINS!`;
  if (result.isFreeSpin && !engine.freeSpinsLeft) return `Free spins total: ${engine.freeSpinsTotal.toFixed(2)}`;
  const ways = result.wins.reduce((n, w) => n + w.ways, 0);
  return result.totalWin ? `Win on ${ways} way${ways > 1 ? 's' : ''}!` : 'Press SPIN to play';
}
