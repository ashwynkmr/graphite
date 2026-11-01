import type { Settings } from '../data/repo/meta';

/** Light or Dark override the system; System removes the attribute so tokens.css follows the device. */
export function applyTheme(theme: Settings['theme']): void {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
