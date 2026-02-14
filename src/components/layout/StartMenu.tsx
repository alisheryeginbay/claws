'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Power } from 'lucide-react';
import { XPIcon } from '@/components/ui/XPIcon';
import type { ToolId } from '@/types';

const PROGRAMS: { toolId: ToolId; label: string; icon: string }[] = [
  { toolId: 'terminal', label: 'Command Prompt', icon: 'command-prompt' },
  { toolId: 'files', label: 'My Computer', icon: 'my-computer' },
  { toolId: 'clawgram', label: 'Clawgram', icon: 'clawgram' },
  { toolId: 'whatsclaw', label: 'Whatsclaw', icon: 'whatsclaw' },
  { toolId: 'email', label: 'Outlook Express', icon: 'outlook-express' },
  { toolId: 'search', label: 'Internet Explorer', icon: 'internet-explorer-6' },
  { toolId: 'calendar', label: 'Calendar', icon: 'date-and-time' },
];

export function StartMenu() {
  const openWindow = useGameStore((s) => s.openWindow);
  const closeStartMenu = useGameStore((s) => s.closeStartMenu);
  const selectedNpc = useGameStore((s) => s.selectedNpc);
  const setPhase = useGameStore((s) => s.setPhase);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Don't close if clicking the start button itself (it handles its own toggle)
        const target = e.target as HTMLElement;
        if (target.closest('.xp-start-button')) return;
        closeStartMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeStartMenu]);

  const handleOpenProgram = (toolId: ToolId) => {
    openWindow(toolId);
    closeStartMenu();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bottom-9 left-0 z-[9500] xp-dialog w-[340px] xp-window-in"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0054E3] to-[#3593FF] px-3 py-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
          {selectedNpc?.avatar || '🤖'}
        </div>
        <div>
          <div className="text-white text-[12px] font-bold">IT Support AI</div>
          <div className="text-white/70 text-[10px]">
            {selectedNpc ? `Working with ${selectedNpc.name}` : 'System Administrator'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Left column - programs */}
        <div className="w-1/2 bg-white py-1 border-r border-[#D6D2C2]">
          <div className="px-2 py-1 text-[10px] text-[#808080] font-bold">Programs</div>
          {PROGRAMS.map(({ toolId, label, icon }) => (
            <button
              key={toolId}
              onClick={() => handleOpenProgram(toolId)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#316AC5] hover:text-white text-[11px] text-left transition-colors group"
            >
              <XPIcon name={icon} size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Right column - system */}
        <div className="w-1/2 bg-[#D3E5FA] py-1">
          <div className="px-2 py-1 text-[10px] text-[#808080] font-bold">Places</div>
          <button
            onClick={() => handleOpenProgram('files')}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#316AC5] hover:text-white text-[11px] text-left transition-colors"
          >
            <XPIcon name="my-computer" size={16} />
            <span className="font-bold">My Computer</span>
          </button>
          <button
            onClick={() => handleOpenProgram('settings')}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#316AC5] hover:text-white text-[11px] text-left transition-colors"
          >
            <XPIcon name="display-properties" size={16} />
            <span>Display Properties</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#316AC5] hover:text-white text-[11px] text-left transition-colors cursor-default"
          >
            <XPIcon name="help-and-support" size={16} />
            <span>Help and Support</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[var(--color-xp-face)] border-t border-[#ACA899] px-3 py-1.5 flex justify-end">
        <button
          onClick={() => setPhase('gameover')}
          className="xp-button flex items-center gap-1.5 text-[11px]"
        >
          <Power size={12} className="text-claw-red" />
          End Shift
        </button>
      </div>
    </div>
  );
}
