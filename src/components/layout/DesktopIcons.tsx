'use client';

import { useGameStore } from '@/store/gameStore';
import { XPIcon } from '@/components/ui/XPIcon';
import type { ToolId } from '@/types';

const ICONS: { toolId: ToolId; label: string; icon: string }[] = [
  { toolId: 'terminal', label: 'Command\nPrompt', icon: 'command-prompt' },
  { toolId: 'files', label: 'My Computer', icon: 'my-computer' },
  { toolId: 'chat', label: 'MSN\nMessenger', icon: 'msn-messenger' },
  { toolId: 'email', label: 'Outlook\nExpress', icon: 'outlook-express' },
  { toolId: 'search', label: 'Internet\nExplorer', icon: 'internet-explorer-6' },
  { toolId: 'calendar', label: 'Calendar', icon: 'date-and-time' },
];

export function DesktopIcons() {
  const openWindow = useGameStore((s) => s.openWindow);

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
      {ICONS.map(({ toolId, label, icon }) => (
        <button
          key={toolId}
          className="xp-desktop-icon group flex flex-col items-center w-[75px] p-2 rounded-sm"
          onDoubleClick={() => openWindow(toolId)}
        >
          <div className="w-12 h-12 flex items-center justify-center mb-1">
            <XPIcon name={icon} size={48} className="drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)]" />
          </div>
          <span className="text-[11px] text-white text-center leading-tight whitespace-pre-line drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
