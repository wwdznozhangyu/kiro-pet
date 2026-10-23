import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  screen,
  Tray,
  nativeImage
} from 'electron';
import path from 'node:path';
import type { PetAnimation, Settings } from '../src/shared/types';
import { EXAM_LABELS } from '../src/shared/types';
import { getSettings, saveSettings } from './settings';
import { setLaunchAtLogin, isMac } from './platform';
import { createCardWindow, createPetWindow } from './windows';
import { WordBank } from './wordbank';

let petWindow: BrowserWindow | null = null;
let cardWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let popupTimer: NodeJS.Timeout | null = null;

const bank = new WordBank();

// Keep a single instance so the tray/pet are not duplicated.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function sendPetAnimation(anim: PetAnimation): void {
  petWindow?.webContents.send('pet:animate', anim);
}

/** (Re)start the automatic card pop-up timer from current settings. */
function scheduleNextPopup(): void {
  if (popupTimer) {
    clearInterval(popupTimer);
    popupTimer = null;
  }
  const { popupIntervalMinutes, petEnabled } = getSettings();
  if (!petEnabled) return;
  popupTimer = setInterval(() => {
    showWordCard();
  }, popupIntervalMinutes * 60 * 1000);
}

function showWordCard(): void {
  const settings = getSettings();
  const word = bank.randomWord(settings.enabledExams);
  if (!word) return;

  // Pet holds up a sign / jumps when a card appears.
  sendPetAnimation('hold-sign');

  if (!cardWindow || cardWindow.isDestroyed()) {
    cardWindow = createCardWindow();
    cardWindow.on('closed', () => {
      cardWindow = null;
    });
    cardWindow.webContents.once('did-finish-load', () => {
      cardWindow?.webContents.send('card:word', word);
    });
  } else {
    cardWindow.show();
    cardWindow.webContents.send('card:word', word);
  }
}

function buildContextMenu(): Menu {
  const settings = getSettings();
  const intervals: Array<Settings['popupIntervalMinutes']> = [5, 10, 15, 30];

  return Menu.buildFromTemplate([
    {
      label: '弹出频率',
      submenu: intervals.map((min) => ({
        label: `${min} 分钟`,
        type: 'radio',
        checked: settings.popupIntervalMinutes === min,
        click: () => {
          saveSettings({ popupIntervalMinutes: min });
          scheduleNextPopup();
        }
      }))
    },
    {
      label: '词库',
      submenu: (Object.keys(EXAM_LABELS) as Array<keyof typeof EXAM_LABELS>).map((tag) => ({
        label: EXAM_LABELS[tag],
        type: 'checkbox',
        checked: settings.enabledExams.includes(tag),
        click: (item) => {
          const current = new Set(getSettings().enabledExams);
          if (item.checked) current.add(tag);
          else current.delete(tag);
          saveSettings({ enabledExams: Array.from(current) });
        }
      }))
    },
    { type: 'separator' },
    {
      label: '立即弹出单词卡片',
      click: () => showWordCard()
    },
    {
      label: '导入自定义单词文件…',
      click: () => importCustomFile()
    },
    { type: 'separator' },
    {
      label: settings.petEnabled ? '隐藏桌宠' : '显示桌宠',
      click: () => togglePet()
    },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: settings.launchAtLogin,
      click: (item) => {
        saveSettings({ launchAtLogin: item.checked });
        setLaunchAtLogin(item.checked);
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
}

function togglePet(): void {
  const next = !getSettings().petEnabled;
  saveSettings({ petEnabled: next });
  if (next) {
    if (!petWindow || petWindow.isDestroyed()) petWindow = createPetWindow();
    else petWindow.show();
    scheduleNextPopup();
  } else {
    petWindow?.hide();
    if (popupTimer) {
      clearInterval(popupTimer);
      popupTimer = null;
    }
  }
}

async function importCustomFile(): Promise<void> {
  const result = await dialog.showOpenDialog({
    title: '导入自定义单词文件',
    filters: [{ name: '单词文件', extensions: ['json', 'csv'] }],
    properties: ['openFile', 'multiSelections']
  });
  if (result.canceled || !result.filePaths.length) return;
  const settings = getSettings();
  const merged = Array.from(new Set([...settings.customWordFiles, ...result.filePaths]));
  saveSettings({ customWordFiles: merged });
  await bank.setCustomFiles(merged);
  const total = bank.totalCount();
  dialog.showMessageBox({
    type: 'info',
    message: '导入成功',
    detail: `当前词库共 ${total} 个单词。`
  });
}

function createTray(): void {
  // A tiny transparent 16x16 placeholder; replace build/tray icon in production.
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'renderer', 'pet', 'tray.png'));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Kiro Pet — 单词桌宠');
  tray.setContextMenu(buildContextMenu());
  tray.on('click', () => tray?.popUpContextMenu(buildContextMenu()));
}

// ---------------- IPC wiring ----------------

let dragOrigin: { winX: number; winY: number; mouseX: number; mouseY: number } | null = null;

ipcMain.on('pet:drag-start', () => {
  if (!petWindow) return;
  const [winX, winY] = petWindow.getPosition();
  const cursor = screen.getCursorScreenPoint();
  dragOrigin = { winX, winY, mouseX: cursor.x, mouseY: cursor.y };
});

ipcMain.on('pet:drag-move', () => {
  if (!petWindow || !dragOrigin) return;
  const cursor = screen.getCursorScreenPoint();
  const nextX = dragOrigin.winX + (cursor.x - dragOrigin.mouseX);
  const nextY = dragOrigin.winY + (cursor.y - dragOrigin.mouseY);
  petWindow.setPosition(Math.round(nextX), Math.round(nextY));
});

ipcMain.on('pet:double-click', () => showWordCard());

ipcMain.on('pet:context-menu', () => {
  buildContextMenu().popup();
});

ipcMain.on('card:close', () => {
  cardWindow?.close();
  cardWindow = null;
  // Pet reacts: nod + wag.
  sendPetAnimation(Math.random() < 0.5 ? 'nod' : 'wag');
});

ipcMain.handle('settings:get', () => getSettings());

// ---------------- Idle wandering ----------------

/**
 * Periodically nudge the pet to wander/jump/blink and move the window a little,
 * staying inside the current display's work area.
 */
function startIdleBehaviour(): void {
  const tick = () => {
    if (petWindow && !petWindow.isDestroyed() && petWindow.isVisible()) {
      const roll = Math.random();
      if (roll < 0.45) {
        sendPetAnimation('blink');
      } else if (roll < 0.8) {
        wanderStep();
      } else {
        sendPetAnimation('jump');
      }
    }
    // Reschedule with a randomized interval between 6-16s for a natural feel.
    setTimeout(tick, 6000 + Math.random() * 10000);
  };
  setTimeout(tick, 5000);
}

function wanderStep(): void {
  if (!petWindow) return;
  sendPetAnimation('wander');
  const display = screen.getDisplayNearestPoint(petWindow.getBounds());
  const { workArea } = display;
  const [x, y] = petWindow.getPosition();
  const size = petWindow.getSize();
  const stepX = (Math.random() - 0.5) * 220;
  const stepY = (Math.random() - 0.5) * 60;
  const nextX = Math.min(
    Math.max(workArea.x, x + stepX),
    workArea.x + workArea.width - size[0]
  );
  const nextY = Math.min(
    Math.max(workArea.y, y + stepY),
    workArea.y + workArea.height - size[1]
  );
  animateWindowTo(petWindow, Math.round(nextX), Math.round(nextY));
}

/** Smoothly step the window toward a target over ~500ms. */
function animateWindowTo(win: BrowserWindow, targetX: number, targetY: number): void {
  const [startX, startY] = win.getPosition();
  const steps = 20;
  let i = 0;
  const id = setInterval(() => {
    i++;
    if (win.isDestroyed()) {
      clearInterval(id);
      return;
    }
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
    win.setPosition(
      Math.round(startX + (targetX - startX) * ease),
      Math.round(startY + (targetY - startY) * ease)
    );
    if (i >= steps) clearInterval(id);
  }, 25);
}

// ---------------- App lifecycle ----------------

app.on('second-instance', () => {
  petWindow?.show();
});

app.whenReady().then(async () => {
  if (isMac) app.dock?.hide(); // menu-bar / tray-only app on macOS

  await bank.loadBuiltIns();
  await bank.setCustomFiles(getSettings().customWordFiles);
  setLaunchAtLogin(getSettings().launchAtLogin);

  if (getSettings().petEnabled) {
    petWindow = createPetWindow();
  }
  createTray();
  scheduleNextPopup();
  startIdleBehaviour();

  app.on('activate', () => {
    if (!petWindow || petWindow.isDestroyed()) {
      if (getSettings().petEnabled) petWindow = createPetWindow();
    }
  });
});

// Tray app: do not quit when all windows close.
app.on('window-all-closed', () => {
  // Intentionally keep running in the tray/menu bar.
});
