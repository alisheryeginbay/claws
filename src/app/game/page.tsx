'use client';

import { useGameStore } from '@/store/gameStore';
import { GameProvider } from '@/components/game/GameProvider';
import { StartScreen } from '@/components/game/StartScreen';
import { Desktop } from '@/components/layout/Desktop';
import { ScorePopup } from '@/components/game/ScorePopup';
import { SecurityAlert } from '@/components/game/SecurityAlert';
import { GameOverScreen } from '@/components/game/GameOverScreen';

function GameContent() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'generating' || phase === 'selecting') {
    return <StartScreen />;
  }

  return (
    <>
      <Desktop />
      <ScorePopup />
      <SecurityAlert />
      <GameOverScreen />
    </>
  );
}

export default function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
