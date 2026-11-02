import { createRoot } from 'react-dom/client';
import { config } from './engine/config';
import { SlotEngine } from './engine/SlotEngine';
import { MainView } from './view/MainView';

// No text selection, so double-clicks on the HUD don't highlight anything.
Object.assign(document.body.style, {
  margin: '0', height: '100vh', overflow: 'hidden', background: '#12052e', color: '#fff',
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  userSelect: 'none', webkitUserSelect: 'none', webkitTapHighlightColor: 'transparent',
});

createRoot(document.getElementById('root')!).render(<MainView engine={new SlotEngine(config)} />);
