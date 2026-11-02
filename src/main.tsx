import { createRoot } from 'react-dom/client';
import { config } from './engine/config';
import { SlotEngine } from './engine/SlotEngine';
import { MainView } from './view/MainView';

// Full-window page with no scrollbars; the game fills it.
Object.assign(document.body.style, {
  margin: '0', height: '100vh', overflow: 'hidden', background: '#12052e', color: '#fff',
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
});

createRoot(document.getElementById('root')!).render(<MainView engine={new SlotEngine(config)} />);
