import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './app/App';
import { captureInstallPrompt } from './app/install';
import { watchForReplan } from './app/reminders';
import { applyTheme } from './app/theme';
import { getSettings } from './data/repo/meta';

captureInstallPrompt();
watchForReplan();
void getSettings().then((s) => applyTheme(s.theme));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
