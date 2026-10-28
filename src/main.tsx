import { createRoot } from 'react-dom/client';
import { gameConfig } from './config/gameConfig';
import { GameController } from './controller/GameController';
import { CryptoRng } from './engine/rng';
import { App } from './ui/App';
import './ui/styles.css';

const controller = new GameController(gameConfig, new CryptoRng());
if (import.meta.env.DEV) Object.assign(window, { game: controller });

// No StrictMode: its double mount would initialise the Pixi application twice.
createRoot(document.getElementById('root')!).render(<App controller={controller} />);
