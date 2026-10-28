import '@esotericsoftware/spine-pixi-v8';
import { Application, Assets, Container, FillGradient, Graphics } from 'pixi.js';
import type { GameConfig } from '../config/gameConfig';
import type { Grid } from '../engine/types';
import { BoardView } from './BoardView';
import { CHARACTER_ASSETS, CharacterView } from './CharacterView';
import { symbolAssetUrls } from './SymbolView';

/** Logical design resolution; the scene is letterboxed to fit any window. */
const DESIGN = { width: 1600, height: 900 };

/** Owns the Pixi application and lays out the board and character. */
export class GameStage {
  readonly app = new Application();
  board!: BoardView;
  character!: CharacterView;
  private readonly scene = new Container();
  private readonly background = new Graphics();

  async init(host: HTMLElement, config: GameConfig, initialGrid: Grid): Promise<void> {
    await this.app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2) });
    host.appendChild(this.app.canvas);

    Assets.add([CHARACTER_ASSETS.skeleton, CHARACTER_ASSETS.atlas]);
    await Assets.load([...symbolAssetUrls(config.symbols), CHARACTER_ASSETS.skeleton.alias,
      CHARACTER_ASSETS.atlas.alias]);

    this.app.stage.addChild(this.background, this.scene);

    this.board = new BoardView(config, initialGrid);
    this.board.position.set(90, (DESIGN.height - this.board.boardHeight) / 2 - 40);
    this.character = new CharacterView(0.95);
    this.character.position.set(1370, 560);
    this.scene.addChild(this.character, this.board);

    this.app.renderer.on('resize', this.layout, this);
    this.layout();
  }

  private layout(): void {
    const { width, height } = this.app.screen;
    const gradient = new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 },
      colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }], textureSpace: 'local' });
    this.background.clear().rect(0, 0, width, height).fill(gradient);

    // Leave room at the bottom for the React HUD.
    const hudHeight = 110;
    const scale = Math.min(width / DESIGN.width, (height - hudHeight) / DESIGN.height);
    this.scene.scale.set(scale);
    this.scene.position.set((width - DESIGN.width * scale) / 2, (height - hudHeight - DESIGN.height * scale) / 2);
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
