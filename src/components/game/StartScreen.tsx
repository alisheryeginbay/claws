'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameEngine } from './GameProvider';
import { useGameStore } from '@/store/gameStore';
import { generateNpcCandidates } from '@/services/generation';
import { NpcSelectionScreen } from './NpcSelectionScreen';
import { WelcomeLogo } from './WelcomeLogo';
import type { NpcPersona } from '@/types';

export function StartScreen() {
  const engine = useGameEngine();
  const npcCandidates = useGameStore((s) => s.npcCandidates);
  const setNpcCandidates = useGameStore((s) => s.setNpcCandidates);
  const setPhase = useGameStore((s) => s.setPhase);

  const [isGeneratedNpcs, setIsGeneratedNpcs] = useState(false);
  const hasStartedGeneration = useRef(false);

  // Start NPC generation immediately on mount
  useEffect(() => {
    if (hasStartedGeneration.current) return;
    hasStartedGeneration.current = true;

    (async () => {
      try {
        const { npcs, isGenerated } = await generateNpcCandidates();
        setNpcCandidates(npcs);
        setIsGeneratedNpcs(isGenerated);
        setPhase('selecting');
      } catch {
        // Ensure we always transition even on unexpected errors
        setPhase('selecting');
      }
    })();
  }, [setPhase, setNpcCandidates]);

  const handleNpcSelected = useCallback((npc: NpcPersona) => {
    engine.start({ selectedNpc: npc });
  }, [engine]);

  // Show NPC selection as soon as candidates are available
  if (npcCandidates.length > 0) {
    return (
      <NpcSelectionScreen
        candidates={npcCandidates}
        isGenerated={isGeneratedNpcs}
        onSelect={handleNpcSelected}
      />
    );
  }

  // Generating phase — XP welcome style loading
  return (
    <div className="h-screen w-screen xp-welcome-bg flex flex-col select-none xp-login-fade-in">
      {/* Top bar */}
      <div className="xp-welcome-bar h-8 shrink-0" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-8">
          <WelcomeLogo subtitle="Preparing your workspace..." />
          <div className="xp-welcome-separator self-stretch" />
          <div className="text-center space-y-4 min-w-[200px]">
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-white/70 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <p className="text-white/60 text-xs">
              Contacting HR department...
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="xp-welcome-bar h-10 shrink-0" />
    </div>
  );
}
