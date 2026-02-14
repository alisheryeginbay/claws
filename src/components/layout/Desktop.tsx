'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { DesktopIcons } from './DesktopIcons';
import { XPWindow } from './XPWindow';
import { Taskbar } from './Taskbar';
import { NotificationTray } from './NotificationTray';
import { Terminal } from '@/components/tools/Terminal';
import { FileBrowser } from '@/components/tools/FileBrowser';
import { ChatPanel } from '@/components/tools/ChatPanel';
import { EmailClient } from '@/components/tools/EmailClient';
import { WebSearch } from '@/components/tools/WebSearch';
import { Calendar } from '@/components/tools/Calendar';
import { Settings } from '@/components/tools/Settings';
import { WALLPAPERS } from '@/store/slices/settingsSlice';
import type { ToolId } from '@/types';

const TOOL_COMPONENTS: Record<ToolId, React.ComponentType> = {
  terminal: Terminal,
  files: FileBrowser,
  chat: ChatPanel,
  email: EmailClient,
  search: WebSearch,
  calendar: Calendar,
  settings: Settings,
};

export function Desktop() {
  const windows = useGameStore((s) => s.windows);
  const windowOrder = useGameStore((s) => s.windowOrder);
  const openWindow = useGameStore((s) => s.openWindow);
  const setActiveTool = useGameStore((s) => s.setActiveTool);
  const closeStartMenu = useGameStore((s) => s.closeStartMenu);
  const wallpaper = useGameStore((s) => s.wallpaper);
  const wallpaperSrc = WALLPAPERS.find((w) => w.key === wallpaper)!.src;

  // Auto-open Terminal and Chat on mount
  useEffect(() => {
    useGameStore.getState().openWindow('terminal');
    useGameStore.getState().openWindow('chat');
  }, []);

  // Sync activeTool with focused window
  useEffect(() => {
    if (windowOrder.length > 0) {
      const topWindowId = windowOrder[windowOrder.length - 1];
      const topWindow = windows[topWindowId];
      if (topWindow && !topWindow.isMinimized) {
        setActiveTool(topWindow.toolId);
      }
    }
  }, [windowOrder, windows, setActiveTool]);

  // Alt+1-6 keyboard shortcuts
  useEffect(() => {
    const toolMap: Record<string, ToolId> = {
      '1': 'terminal',
      '2': 'files',
      '3': 'chat',
      '4': 'email',
      '5': 'search',
      '6': 'calendar',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.altKey && toolMap[e.key]) {
        e.preventDefault();
        openWindow(toolMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openWindow]);

  // Click on desktop background closes start menu
  const handleDesktopClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.xp-taskbar, .xp-start-menu')) return;
    closeStartMenu();
  };

  return (
    <div
      id="game-root"
      className="h-screen w-screen relative overflow-hidden bg-[var(--color-xp-desktop)]"
      style={{
        backgroundImage: `url(${wallpaperSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={handleDesktopClick}
    >
      {/* Desktop Icons */}
      <DesktopIcons />

      {/* Floating Windows */}
      {Object.values(windows)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((win) => {
          const ToolComponent = TOOL_COMPONENTS[win.toolId];
          const isFocused = windowOrder[windowOrder.length - 1] === win.id && !win.isMinimized;
          return (
            <XPWindow key={win.id} windowState={win} isFocused={isFocused} hidden={win.isMinimized}>
              <div className="h-full flex flex-col">
                <ToolComponent />
              </div>
            </XPWindow>
          );
        })}

      {/* Taskbar */}
      <Taskbar />

      {/* Notifications */}
      <NotificationTray />
    </div>
  );
}
