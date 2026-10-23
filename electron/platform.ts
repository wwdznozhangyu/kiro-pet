import { app, BrowserWindow } from 'electron';

export const isMac = process.platform === 'darwin';
export const isWin = process.platform === 'win32';

/**
 * Cross-platform always-on-top. On macOS, 'screen-saver' level keeps the pet
 * above full-screen apps and the dock; on Windows the default top level works.
 */
export function applyAlwaysOnTop(win: BrowserWindow): void {
  if (isMac) {
    win.setAlwaysOnTop(true, 'screen-saver');
    // Show on every macOS Space, including full-screen spaces.
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } else {
    win.setAlwaysOnTop(true, 'pop-up-menu');
  }
}

/**
 * Transparent/frameless window options that render correctly on both platforms.
 * macOS needs `vibrancy`/`backgroundColor` left unset and `transparent: true`;
 * Windows needs `transparent: true` with `frame: false` and no `thickFrame`.
 */
export function transparentWindowOptions(): Electron.BrowserWindowConstructorOptions {
  const base: Electron.BrowserWindowConstructorOptions = {
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    fullscreenable: false,
    backgroundColor: '#00000000'
  };
  if (isWin) {
    // thickFrame:false avoids the subtle 1px border Windows draws on transparent windows.
    (base as Electron.BrowserWindowConstructorOptions & { thickFrame?: boolean }).thickFrame = false;
  }
  return base;
}

/**
 * Enable/disable launch-at-login. On both macOS and Windows Electron's
 * setLoginItemSettings is the supported path (uses Login Items / Registry Run key).
 */
export function setLaunchAtLogin(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: isMac // start quietly in the menu bar on macOS
  });
}

/**
 * The context-menu gesture differs by platform. On macOS the convention is
 * Control+Click (as well as two-finger/right click). We expose the label so the
 * settings UI / docs can reflect it, and the renderer decides when to call
 * petContextMenu based on this.
 */
export const contextMenuHint = isMac ? 'Control + 点击' : '右键点击';
