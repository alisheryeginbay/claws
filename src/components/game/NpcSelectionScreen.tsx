'use client';

import Image from 'next/image';
import type { NpcPersona } from '@/types';
import { getIconPath } from '@/lib/xp-icons';
import { WelcomeLogo } from './WelcomeLogo';

/** Map known NPC ids to XP icon slugs for profile pictures */
const NPC_ICON_MAP: Record<string, string> = {
  gerald: 'briefcase',
  yuki: 'command-prompt',
  chadwick: 'internet-explorer-6',
  margaret: 'system-restore',
  blaze: 'performance-monitor',
  priya: 'chip',
  todd: 'calculator',
  zara: 'theme',
  hacker_kevin: 'security-settings',
  brenda: 'help-and-support',
  dmitri: 'indexing-service',
  ashley: 'scheduled-tasks',
};

function getNpcIcon(npcId: string): string {
  return getIconPath(NPC_ICON_MAP[npcId] || 'user-accounts', 48);
}

interface NpcSelectionScreenProps {
  candidates: NpcPersona[];
  isGenerated: boolean;
  onSelect: (npc: NpcPersona) => void;
}

export function NpcSelectionScreen({ candidates, isGenerated, onSelect }: NpcSelectionScreenProps) {
  return (
    <div className="h-screen w-screen xp-welcome-bg flex flex-col select-none xp-login-fade-in">
      {/* Top bar */}
      <div className="xp-welcome-bar h-8 shrink-0" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="flex items-center gap-12 max-w-3xl w-full">
          {/* Left panel — logo + instruction */}
          <div className="flex-shrink-0 w-[200px]">
            <WelcomeLogo subtitle="To begin, click your colleague" />
          </div>

          {/* Separator */}
          <div className="xp-welcome-separator self-stretch min-h-[280px]" />

          {/* Right panel — NPC accounts */}
          <div className="flex-1 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {candidates.map((npc) => (
              <button
                key={npc.id}
                onClick={() => onSelect(npc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(npc);
                  }
                }}
                className="xp-welcome-row w-full flex items-center gap-4"
              >
                {/* XP-style beveled avatar frame */}
                <div className="xp-welcome-avatar-frame shrink-0">
                  <Image
                    src={getNpcIcon(npc.id)}
                    alt={npc.name}
                    width={48}
                    height={48}
                    className="block"
                    draggable={false}
                  />
                </div>

                {/* Arrow indicator */}
                <span className="xp-welcome-arrow">&#9658;</span>

                {/* Info */}
                <div className="text-left min-w-0 flex-1">
                  <div
                    className="text-white font-bold text-sm truncate"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {npc.name}
                  </div>
                  <div
                    className="text-white/50 text-xs mt-0.5 truncate"
                    style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.3)' }}
                  >
                    {npc.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="xp-welcome-bar h-10 shrink-0 flex items-center justify-between px-6">
        <div className="xp-welcome-shutdown">
          <Image src={getIconPath('power', 16)} alt="" width={16} height={16} draggable={false} />
          <span>Turn off computer</span>
        </div>
        <div className="text-white/30 text-[10px]">
          {!isGenerated && '(Classic Mode) \u00B7 '}
          Click a colleague to begin your shift
        </div>
      </div>
    </div>
  );
}
