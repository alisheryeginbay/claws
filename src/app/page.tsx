'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WindowControls } from '@/components/layout/WindowControls';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-screen w-screen bg-[var(--color-xp-desktop)] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-xl mx-4">
        <div className="xp-dialog overflow-hidden xp-window-in">
          {/* XP Title Bar */}
          <div className="xp-titlebar">
            <span className="flex-1">Clawback</span>
            <WindowControls />
          </div>

          {/* Dialog Content */}
          <div className="p-8 space-y-6 bg-[var(--color-xp-face)]">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#003C74] tracking-wide">
                CLAWBACK
              </div>
              <div className="text-xs text-[#808080]">
                Version 0.1
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-[#ACA899] py-4">
              <p className="text-[#000000] text-sm">You are the AI now.</p>
              <p className="text-[#808080] text-xs">
                Handle requests. Use tools. Survive security traps.
              </p>
            </div>

            {mounted && (
              <button
                onClick={() => router.push('/game')}
                className="xp-primary-button !text-sm !px-10 !py-3 w-full"
              >
                Initialize System
              </button>
            )}

            <div className="text-[11px] text-[#808080] space-y-1 pt-2">
              <p>A freeform sandbox where you play as an AI assistant</p>
              <p>Inspired by Papers, Please meets Claude</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
