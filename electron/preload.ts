import { contextBridge, ipcRenderer } from 'electron';
import type { KiroApi, PetAnimation, Settings, WordEntry } from '../src/shared/types';

const api: KiroApi = {
  // ---- Pet window ----
  onAnimation(cb: (anim: PetAnimation) => void) {
    const listener = (_e: unknown, anim: PetAnimation) => cb(anim);
    ipcRenderer.on('pet:animate', listener);
    return () => ipcRenderer.removeListener('pet:animate', listener);
  },
  petDragStart() {
    ipcRenderer.send('pet:drag-start');
  },
  petDragMove(dx: number, dy: number) {
    ipcRenderer.send('pet:drag-move', { dx, dy });
  },
  petDoubleClick() {
    ipcRenderer.send('pet:double-click');
  },
  petContextMenu(x: number, y: number) {
    ipcRenderer.send('pet:context-menu', { x, y });
  },

  // ---- Card window ----
  onCardWord(cb: (word: WordEntry) => void) {
    const listener = (_e: unknown, word: WordEntry) => cb(word);
    ipcRenderer.on('card:word', listener);
    return () => ipcRenderer.removeListener('card:word', listener);
  },
  closeCard() {
    ipcRenderer.send('card:close');
  },
  speak(text: string, accent: 'uk' | 'us') {
    // Speech synthesis runs in the renderer (Web Speech API), so this is a no-op
    // placeholder kept for API symmetry; renderers call window.speechSynthesis directly.
    void text;
    void accent;
  },

  // ---- Settings ----
  getSettings(): Promise<Settings> {
    return ipcRenderer.invoke('settings:get');
  }
};

contextBridge.exposeInMainWorld('kiro', api);
