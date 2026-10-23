import Store from 'electron-store';
import type { Settings } from '../src/shared/types';
import { DEFAULT_SETTINGS } from '../src/shared/types';

// electron-store persists JSON under the OS user-data dir, cross-platform.
const store = new Store<{ settings: Settings }>({
  defaults: { settings: DEFAULT_SETTINGS }
});

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...store.get('settings') };
}

export function saveSettings(partial: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...partial };
  store.set('settings', next);
  return next;
}
