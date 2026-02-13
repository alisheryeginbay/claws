import { type StateCreator } from 'zustand';
import type { ToolId, WindowId, WindowState } from '@/types';

const WINDOW_DEFAULTS: Record<ToolId, { width: number; height: number; minWidth: number; minHeight: number; title: string; icon: string }> = {
  terminal: { width: 680, height: 440, minWidth: 400, minHeight: 300, title: 'Command Prompt', icon: 'terminal' },
  files: { width: 700, height: 500, minWidth: 400, minHeight: 300, title: 'My Computer', icon: 'folder-open' },
  chat: { width: 420, height: 520, minWidth: 320, minHeight: 400, title: 'MSN Messenger', icon: 'message-square' },
  email: { width: 700, height: 500, minWidth: 500, minHeight: 350, title: 'Outlook Express', icon: 'mail' },
  search: { width: 700, height: 500, minWidth: 400, minHeight: 300, title: 'Internet Explorer', icon: 'search' },
  calendar: { width: 600, height: 500, minWidth: 400, minHeight: 350, title: 'Calendar', icon: 'calendar' },
};

export interface WindowSlice {
  windows: Record<WindowId, WindowState>;
  windowOrder: WindowId[];
  nextZIndex: number;
  startMenuOpen: boolean;
  cascadeOffset: number;

  openWindow: (toolId: ToolId) => void;
  closeWindow: (windowId: WindowId) => void;
  minimizeWindow: (windowId: WindowId) => void;
  maximizeWindow: (windowId: WindowId) => void;
  restoreWindow: (windowId: WindowId) => void;
  focusWindow: (windowId: WindowId) => void;
  moveWindow: (windowId: WindowId, position: { x: number; y: number }) => void;
  resizeWindow: (windowId: WindowId, size: { width: number; height: number }) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  resetWindows: () => void;
}

function normalizeZIndexes(state: WindowSlice): Partial<WindowSlice> {
  const updatedWindows = { ...state.windows };
  state.windowOrder.forEach((id, i) => {
    if (updatedWindows[id]) {
      updatedWindows[id] = { ...updatedWindows[id], zIndex: 100 + i };
    }
  });
  return { windows: updatedWindows, nextZIndex: 100 + state.windowOrder.length };
}

export const createWindowSlice: StateCreator<WindowSlice> = (set, get) => ({
  windows: {},
  windowOrder: [],
  nextZIndex: 100,
  startMenuOpen: false,
  cascadeOffset: 0,

  openWindow: (toolId) => {
    const state = get();
    // If window for this tool already exists, focus/restore it
    const existing = Object.values(state.windows).find((w) => w.toolId === toolId);
    if (existing) {
      if (existing.isMinimized) {
        state.restoreWindow(existing.id);
      } else {
        state.focusWindow(existing.id);
      }
      return;
    }

    const defaults = WINDOW_DEFAULTS[toolId];
    const base = { x: 80, y: 40 };
    const offset = state.cascadeOffset * 30;
    const position = { x: base.x + offset, y: base.y + offset };
    const windowId = `window-${toolId}`;
    const zIndex = state.nextZIndex;

    const newWindow: WindowState = {
      id: windowId,
      toolId,
      title: defaults.title,
      icon: defaults.icon,
      position,
      size: { width: defaults.width, height: defaults.height },
      minSize: { width: defaults.minWidth, height: defaults.minHeight },
      isMinimized: false,
      isMaximized: false,
      zIndex,
    };

    set({
      windows: { ...state.windows, [windowId]: newWindow },
      windowOrder: [...state.windowOrder, windowId],
      nextZIndex: zIndex + 1,
      startMenuOpen: false,
      cascadeOffset: (state.cascadeOffset + 1) % 8,
    });
  },

  closeWindow: (windowId) => {
    const state = get();
    const { [windowId]: _, ...rest } = state.windows;
    set({
      windows: rest,
      windowOrder: state.windowOrder.filter((id) => id !== windowId),
    });
  },

  minimizeWindow: (windowId) => {
    const state = get();
    const win = state.windows[windowId];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [windowId]: { ...win, isMinimized: true },
      },
    });
  },

  maximizeWindow: (windowId) => {
    const state = get();
    const win = state.windows[windowId];
    if (!win) return;

    if (win.isMaximized) {
      // Restore from maximize
      const prev = win.preMaximize;
      set({
        windows: {
          ...state.windows,
          [windowId]: {
            ...win,
            isMaximized: false,
            position: prev?.position ?? win.position,
            size: prev?.size ?? win.size,
            preMaximize: undefined,
          },
        },
      });
    } else {
      // Maximize
      set({
        windows: {
          ...state.windows,
          [windowId]: {
            ...win,
            isMaximized: true,
            preMaximize: { position: win.position, size: win.size },
            position: { x: 0, y: 0 },
            size: { width: window.innerWidth, height: window.innerHeight - 36 },
          },
        },
      });
    }

    // Also focus
    state.focusWindow(windowId);
  },

  restoreWindow: (windowId) => {
    const state = get();
    const win = state.windows[windowId];
    if (!win) return;
    const zIndex = state.nextZIndex;
    set({
      windows: {
        ...state.windows,
        [windowId]: { ...win, isMinimized: false, zIndex },
      },
      windowOrder: [...state.windowOrder.filter((id) => id !== windowId), windowId],
      nextZIndex: zIndex + 1,
    });
  },

  focusWindow: (windowId) => {
    const state = get();
    const win = state.windows[windowId];
    if (!win) return;
    const zIndex = state.nextZIndex;
    const newState = {
      windows: {
        ...state.windows,
        [windowId]: { ...win, zIndex },
      },
      windowOrder: [...state.windowOrder.filter((id) => id !== windowId), windowId],
      nextZIndex: zIndex + 1,
      startMenuOpen: false,
    };
    set(newState);
    if (newState.nextZIndex > 1000) {
      set(normalizeZIndexes(get()));
    }
  },

  moveWindow: (windowId, position) => {
    const state = get();
    const win = state.windows[windowId];
    if (!win || win.isMaximized) return;
    set({
      windows: {
        ...state.windows,
        [windowId]: { ...win, position },
      },
    });
  },

  resizeWindow: (windowId, size) => {
    const state = get();
    const win = state.windows[windowId];
    if (!win || win.isMaximized) return;
    const clampedSize = {
      width: Math.max(size.width, win.minSize.width),
      height: Math.max(size.height, win.minSize.height),
    };
    set({
      windows: {
        ...state.windows,
        [windowId]: { ...win, size: clampedSize },
      },
    });
  },

  toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),

  resetWindows: () => {
    set({
      windows: {},
      windowOrder: [],
      nextZIndex: 100,
      startMenuOpen: false,
      cascadeOffset: 0,
    });
  },
});
