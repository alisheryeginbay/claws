'use client';

import { useGameStore } from '@/store/gameStore';
import { useGameEngine } from './GameProvider';
import { ScoringEngine } from '@/systems/scoring/ScoringEngine';
import { cn } from '@/lib/utils';

const GRADE_COLORS: Record<string, string> = {
  S: 'text-[#FFD700]',
  A: 'text-[#0066CC]',
  B: 'text-[#0066CC]',
  C: 'text-claw-orange',
  D: 'text-claw-red',
  F: 'text-claw-red',
};

export function GameOverScreen() {
  const engine = useGameEngine();
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);

  if (phase !== 'gameover') return null;

  const scoringEngine = new ScoringEngine();
  const summary = scoringEngine.getEndGameSummary();

  return (
    <div className="fixed inset-0 bg-black/60 z-[9900] flex items-center justify-center p-4">
      <div className="xp-dialog overflow-hidden max-w-lg w-full">
        {/* XP Title Bar */}
        <div className="xp-titlebar">
          <span>System Offline</span>
        </div>

        <div className="p-8 bg-[var(--color-xp-face)]">
          <div className="text-center mb-6">
            <div className="text-claw-red text-xl font-bold mb-2">SYSTEM SHUTDOWN</div>
            <div className="text-[#808080] text-sm">
              {score.securityScore <= 0
                ? 'Security breach detected. System compromised.'
                : 'End of shift. Performance review follows.'}
            </div>
          </div>

          {/* Grade */}
          <div className="text-center mb-6">
            <div className="text-[11px] text-[#808080] uppercase tracking-wider mb-2">Final Grade</div>
            <div
              className={cn('text-6xl font-bold', GRADE_COLORS[summary.grade] || 'text-[#000000]')}
            >
              {summary.grade}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-0 mb-6 border border-[#ACA899] bg-white">
            <StatRow label="Total Score" value={summary.totalScore.toLocaleString()} color="text-[#7B68EE]" />
            <StatRow label="Requests Completed" value={String(summary.requestsCompleted)} color="text-[#0066CC]" />
            <StatRow label="Requests Failed" value={String(summary.requestsFailed)} color="text-claw-red" />
            <StatRow label="Requests Expired" value={String(summary.requestsExpired)} color="text-claw-orange" />
            <StatRow label="Max Streak" value={String(summary.maxStreak)} color="text-claw-orange" />
            <StatRow label="Security Score" value={`${summary.securityScore}/100`} color={summary.securityScore > 80 ? 'text-[#0066CC]' : 'text-claw-red'} />
            <StatRow label="Days Played" value={String(summary.daysPlayed)} color="text-[#000000]" />
          </div>

          {/* Restart */}
          <div className="flex justify-center pt-4 border-t border-[#ACA899]">
            <button
              onClick={() => {
                engine.stop();
                useGameStore.getState().resetGame();
              }}
              className="xp-primary-button px-8 py-2.5"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 px-3 border-b border-[#ECE9D8] last:border-b-0">
      <span className="text-sm text-[#000000]">{label}</span>
      <span className={cn('text-sm font-bold', color)}>{value}</span>
    </div>
  );
}
