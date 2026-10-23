import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { applyAlwaysOnTop, transparentWindowOptions } from './platform';

const DEV_SERVER = process.env.VITE_DEV_SERVER_URL; // set by `npm run dev`
const PRELOAD = path.join(__dirname, 'preload.js');

export const PET_SIZE = { width: 180, height: 200 };
export const CARD_SIZE = { width: 360, height: 420 };

function rendererUrl(entry: 'pet' | 'card'): { url?: string; file?: string } {
  if (DEV_SERVER) {
    return { url: `${DEV_SERVER}/${entry}/index.html` };
  }
  return { file: path.join(__dirname, '..', 'renderer', entry, 'index.html') };
}

function loadRenderer(win: BrowserWindow, entry: 'pet' | 'card'): void {
  const target = rendererUrl(entry);
  if (target.url) {
    void win.loadURL(target.url);
  } else if (target.file) {
    void win.loadFile(target.file);
  }
}

export function createPetWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay();
  const { workArea } = display;

  const win = new BrowserWindow({
    ...transparentWindowOptions(),
    width: PET_SIZE.width,
    height: PET_SIZE.height,
    x: workArea.x + workArea.width - PET_SIZE.width - 40,
    y: workArea.y + workArea.height - PET_SIZE.height - 40,
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });

  applyAlwaysOnTop(win);
  loadRenderer(win, 'pet');
  win.once('ready-to-show', () => win.show());
  return win;
}

export function createCardWindow(): BrowserWindow {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { workArea } = display;

  const win = new BrowserWindow({
    ...transparentWindowOptions(),
    width: CARD_SIZE.width,
    height: CARD_SIZE.height,
    x: workArea.x + workArea.width - CARD_SIZE.width - 60,
    y: workArea.y + workArea.height - CARD_SIZE.height - 60,
    show: false,
    focusable: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  applyAlwaysOnTop(win);
  loadRenderer(win, 'card');
  win.once('ready-to-show', () => win.show());
  return win;
}
