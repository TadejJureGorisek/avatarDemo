import { createRoot } from 'react-dom/client';
import { config } from './engine/config';
import { SlotEngine } from './engine/SlotEngine';
import { MainView } from './view/MainView';

// Full-window page with no scrollbars; the game's stage fills it, with black bars around it. No text selection (double-clicks on
// the balance etc. shouldn't highlight anything).
Object.assign(document.body.style, {
  margin: '0', height: '100vh', overflow: 'hidden', background: '#000', color: '#fff',
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  userSelect: 'none', webkitUserSelect: 'none', webkitTapHighlightColor: 'transparent',
});

createRoot(document.getElementById('root')!).render(<MainView engine={new SlotEngine(config)} />);
