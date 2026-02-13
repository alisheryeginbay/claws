'use client';

import { useState, useCallback } from 'react';
import { useGameEngine } from './GameProvider';
import { useGameStore } from '@/store/gameStore';
import { generateNpcCandidates } from '@/services/generation';
import { NpcSelectionScreen } from './NpcSelectionScreen';
import { WelcomeLogo } from './WelcomeLogo';
import type { Difficulty, NpcPersona } from '@/types';

const DIFFICULTIES: { id: Difficulty; label: string; description: string; icon: string }[] = [
  { id: 'easy', label: 'Easy', description: 'Slow pace, fewer requests', icon: '🌿' },
  { id: 'normal', label: 'Normal', description: 'Balanced challenge', icon: '⚡' },
  { id: 'hard', label: 'Hard', description: 'Tight deadlines, more traps', icon: '🔥' },
];

export function StartScreen() {
  const engine = useGameEngine();
  const phase = useGameStore((s) => s.phase);
  const npcCandidates = useGameStore((s) => s.npcCandidates);
  const setNpcCandidates = useGameStore((s) => s.setNpcCandidates);
  const setPhase = useGameStore((s) => s.setPhase);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isGeneratedNpcs, setIsGeneratedNpcs] = useState(false);

  const handleSelectDifficulty = useCallback(async (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setPhase('generating');

    const { npcs, isGenerated } = await generateNpcCandidates(difficulty);
    setNpcCandidates(npcs);
    setIsGeneratedNpcs(isGenerated);
    setPhase('selecting');
  }, [setPhase, setNpcCandidates]);

  const handleNpcSelected = useCallback((npc: NpcPersona) => {
    engine.start({ difficulty: selectedDifficulty || 'normal', selectedNpc: npc });
  }, [engine, selectedDifficulty]);

  // Generating phase — XP welcome style loading
  if (phase === 'generating') {
    return (
      <div className="h-screen w-screen xp-welcome-bg flex flex-col select-none">
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

  // Selecting phase — NPC selection in XP welcome style
  if (phase === 'selecting') {
    return (
      <NpcSelectionScreen
        candidates={npcCandidates}
        isGenerated={isGeneratedNpcs}
        onSelect={handleNpcSelected}
      />
    );
  }

  // Difficulty selection — XP Welcome Screen style
  return (
    <div className="h-screen w-screen xp-welcome-bg flex flex-col select-none xp-login-fade-in">
      {/* Top bar */}
      <div className="xp-welcome-bar h-8 shrink-0" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="flex items-center gap-12 max-w-3xl w-full">
          {/* Left panel — logo + instruction */}
          <div className="flex-shrink-0 w-[200px]">
            <WelcomeLogo subtitle="To begin, select your difficulty" />
          </div>

          {/* Separator */}
          <div className="xp-welcome-separator self-stretch min-h-[200px]" />

          {/* Right panel — difficulty options */}
          <div className="flex-1 space-y-1">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.id}
                onClick={() => handleSelectDifficulty(diff.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectDifficulty(diff.id);
                  }
                }}
                className="xp-welcome-row w-full flex items-center gap-4 rounded-sm"
              >
                <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center text-2xl shrink-0 border border-white/20">
                  {diff.icon}
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">{diff.label}</div>
                  <div className="text-white/50 text-xs mt-0.5">{diff.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="xp-welcome-bar h-10 shrink-0 flex items-center justify-between px-6">
        <div className="text-white/40 text-[11px]">
          You are the AI now.
        </div>
        <div className="text-white/30 text-[10px]">
          Clawback v0.1 — Papers, Please meets Claude
        </div>
      </div>
    </div>
  );
}
