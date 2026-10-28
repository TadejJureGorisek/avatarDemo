import { createRoot } from 'react-dom/client';
import { config } from './engine/config';
import { SlotEngine } from './engine/SlotEngine';
import { MainView } from './view/MainView';
import './styles.css';

// No StrictMode: its double mount would initialise the Pixi app twice.
createRoot(document.getElementById('root')!).render(<MainView engine={new SlotEngine(config)} />);
