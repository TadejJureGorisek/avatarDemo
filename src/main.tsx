import { createRoot } from 'react-dom/client';
import { config } from './engine/config';
import { Hud } from './Hud';
import { MainView } from './MainView';
import './styles.css';

// No StrictMode: its double mount would initialise the Pixi app twice.
createRoot(document.getElementById('root')!).render(<Hud game={new MainView(config)} />);
