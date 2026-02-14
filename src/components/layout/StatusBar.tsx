'use client';

import { useGameStore } from '@/store/gameStore';
import { formatTime, formatDay, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Shield,
  Flame,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  Pause,
  Play,
  FastForward,
  MemoryStick,
} from 'lucide-react';

export function StatusBar() {
  const clock = useGameStore((s) => s.clock);
  const score = useGameStore((s) => s.score);
  const resources = useGameStore((s) => s.resources);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const phase = useGameStore((s) => s.phase);

  const securityColor =
    score.securityScore > 80 ? 'text-claw-green' :
    score.securityScore > 50 ? 'text-claw-orange' :
    'text-claw-red';

  const getResourceStyle = (value: number) => {
    const color = value > 80 ? 'text-claw-red' : value > 50 ? 'text-claw-orange' : 'text-claw-muted';
    const glow = value > 90 ? 'meter-critical' : value > 75 ? 'meter-warning' : '';
    return { color, glow };
  };

  const cpu = getResourceStyle(resources.cpu);
  const mem = getResourceStyle(resources.memory);
  const disk = getResourceStyle(resources.disk);
  const net = getResourceStyle(resources.network);

  return (
    <div className="h-7 bg-claw-surface border-t border-claw-border flex items-center px-3 gap-4 text-xs font-mono select-none">
      {/* Score */}
      <div className="flex items-center gap-1 text-claw-purple">
        <span className="font-bold">{formatNumber(score.total)}</span>
        <span className="text-claw-muted">pts</span>
      </div>

      {/* Security */}
      <div className={cn('flex items-center gap-1', securityColor)}>
        <Shield size={12} />
        <span>{score.securityScore}</span>
      </div>

      {/* Streak */}
      {score.streak > 0 && (
        <div className="flex items-center gap-1 text-claw-orange">
          <Flame size={12} />
          <span>{score.streak}</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Resources */}
      <div className={cn('flex items-center gap-1', cpu.color, cpu.glow)}>
        <Cpu size={11} />
        <span>{Math.round(resources.cpu)}%</span>
      </div>
      <div className={cn('flex items-center gap-1', mem.color, mem.glow)}>
        <MemoryStick size={11} />
        <span>{Math.round(resources.memory)}%</span>
      </div>
      <div className={cn('flex items-center gap-1', disk.color, disk.glow)}>
        <HardDrive size={11} />
        <span>{Math.round(resources.disk)}%</span>
      </div>
      <div className={cn('flex items-center gap-1', net.color, net.glow)}>
        <Wifi size={11} />
        <span>{Math.round(resources.network)}%</span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-claw-border" />

      {/* Speed Controls */}
      {phase === 'playing' && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSpeed(clock.speed === 'paused' ? 'normal' : 'paused')}
            className={cn(
              'p-0.5 rounded transition-colors',
              clock.speed === 'paused' ? 'text-claw-orange' : 'text-claw-muted hover:text-claw-text'
            )}
            title={clock.speed === 'paused' ? 'Resume' : 'Pause'}
          >
            {clock.speed === 'paused' ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            onClick={() => setSpeed(clock.speed === 'fast' ? 'normal' : 'fast')}
            className={cn(
              'p-0.5 rounded transition-colors',
              clock.speed === 'fast' ? 'text-claw-green' : 'text-claw-muted hover:text-claw-text'
            )}
            title="Fast forward"
          >
            <FastForward size={12} />
          </button>
        </div>
      )}

      {/* Clock */}
      <div className="flex items-center gap-1 text-claw-text">
        <Clock size={11} />
        <span>{formatDay(clock.day)}</span>
        <span>{formatTime(clock.hour, clock.minute, clock.second)}</span>
      </div>
    </div>
  );
}
