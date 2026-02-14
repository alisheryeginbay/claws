'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

import { Terminal } from '@/components/tools/Terminal';
import { FileBrowser } from '@/components/tools/FileBrowser';
import { Clawgram } from '@/components/tools/Clawgram';
import { Whatsclaw } from '@/components/tools/Whatsclaw';
import { EmailClient } from '@/components/tools/EmailClient';
import { WebSearch } from '@/components/tools/WebSearch';
import { Calendar } from '@/components/tools/Calendar';
import { Settings } from '@/components/tools/Settings';
import type { ToolId } from '@/types';

const TOOL_COMPONENTS: Record<ToolId, React.ComponentType> = {
  terminal: Terminal,
  files: FileBrowser,
  clawgram: Clawgram,
  whatsclaw: Whatsclaw,
  email: EmailClient,
  search: WebSearch,
  calendar: Calendar,
  settings: Settings,
};

const TOOL_LABELS: Record<ToolId, string> = {
  terminal: 'Terminal',
  files: 'File Browser',
  clawgram: 'Clawgram',
  whatsclaw: 'Whatsclaw',
  email: 'Email',
  search: 'Web Search',
  calendar: 'Calendar',
  settings: 'Display Properties',
};

export function PanelContainer() {
  const activeTool = useGameStore((s) => s.tools.activeTool);
  const setActiveTool = useGameStore((s) => s.setActiveTool);
  const ActiveComponent = TOOL_COMPONENTS[activeTool];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      const toolMap: Record<string, ToolId> = {
        '1': 'terminal',
        '2': 'files',
        '3': 'clawgram',
        '4': 'email',
        '5': 'search',
        '6': 'calendar',
        '7': 'whatsclaw',
      };

      if (e.altKey && toolMap[e.key]) {
        e.preventDefault();
        setActiveTool(toolMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);

  const isMessenger = activeTool === 'clawgram' || activeTool === 'whatsclaw';

  if (isMessenger) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ActiveComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-xp-face)]">
      <div className="h-8 bg-[var(--color-xp-face)] border-b border-[#ACA899] flex items-center px-3">
        <span className="text-xs text-[#000000] font-bold">
          {TOOL_LABELS[activeTool]}
        </span>
        <span className="text-[10px] text-[#808080] ml-auto">Alt+1-7 to switch tools</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <ActiveComponent />
      </div>
    </div>
  );
}
