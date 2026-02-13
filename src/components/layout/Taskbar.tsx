'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import { formatTime, formatDay, formatNumber } from '@/lib/utils';
import Image from 'next/image';
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
import { XPIcon } from '@/components/ui/XPIcon';
import { WINDOW_ICON_MAP } from '@/lib/xp-icons';
import { StartMenu } from './StartMenu';

const RESOURCE_THRESHOLDS = {
  CRITICAL: 90,
  WARNING: 75,
  HIGH: 80,
  MEDIUM: 50,
} as const;

export function Taskbar() {
  const windows = useGameStore((s) => s.windows);
  const windowOrder = useGameStore((s) => s.windowOrder);
  const focusWindow = useGameStore((s) => s.focusWindow);
  const minimizeWindow = useGameStore((s) => s.minimizeWindow);
  const restoreWindow = useGameStore((s) => s.restoreWindow);
  const startMenuOpen = useGameStore((s) => s.startMenuOpen);
  const toggleStartMenu = useGameStore((s) => s.toggleStartMenu);
  const conversations = useGameStore((s) => s.conversations);
  const emails = useGameStore((s) => s.emails);
  const clock = useGameStore((s) => s.clock);
  const score = useGameStore((s) => s.score);
  const resources = useGameStore((s) => s.resources);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const phase = useGameStore((s) => s.phase);

  const totalUnread = Object.values(conversations).reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );
  const unreadEmails = emails.filter((e) => !e.isRead).length;

  const prevBadges = useRef<Record<string, number>>({});
  const [poppingIds, setPoppingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const badges: Record<string, number> = {
      chat: totalUnread,
      email: unreadEmails,
    };
    const newPopping = new Set<string>();
    for (const [key, value] of Object.entries(badges)) {
      const prev = prevBadges.current[key] ?? 0;
      if (value > prev) {
        newPopping.add(key);
      }
      prevBadges.current[key] = value;
    }
    if (newPopping.size > 0) {
      setPoppingIds(newPopping);
      const timer = setTimeout(() => setPoppingIds(new Set()), 300);
      return () => clearTimeout(timer);
    }
  }, [totalUnread, unreadEmails]);

  function getBadge(toolId: string): number | undefined {
    if (toolId === 'chat' && totalUnread > 0) return totalUnread;
    if (toolId === 'email' && unreadEmails > 0) return unreadEmails;
    return undefined;
  }

  const handleTaskbarClick = (windowId: string) => {
    const win = windows[windowId];
    if (!win) return;
    if (win.isMinimized) {
      restoreWindow(windowId);
    } else if (windowOrder[windowOrder.length - 1] === windowId) {
      minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  const securityColor =
    score.securityScore > RESOURCE_THRESHOLDS.HIGH ? 'text-[#80D0FF]' :
    score.securityScore > RESOURCE_THRESHOLDS.MEDIUM ? 'text-claw-orange' :
    'text-claw-red';

  const getResourceStyle = (value: number) => {
    const color = value > RESOURCE_THRESHOLDS.HIGH ? 'text-claw-red' : value > RESOURCE_THRESHOLDS.MEDIUM ? 'text-claw-orange' : 'text-white/60';
    const glow = value > RESOURCE_THRESHOLDS.CRITICAL ? 'meter-critical' : value > RESOURCE_THRESHOLDS.WARNING ? 'meter-warning' : '';
    return { color, glow };
  };

  const cpu = getResourceStyle(resources.cpu);
  const mem = getResourceStyle(resources.memory);
  const disk = getResourceStyle(resources.disk);
  const net = getResourceStyle(resources.network);

  return (
    <>
      {startMenuOpen && <StartMenu />}
      <div className="fixed bottom-0 left-0 right-0 h-9 xp-taskbar flex items-center px-0.5 gap-0.5 text-xs select-none z-[9000]">
        {/* Start Button */}
        <button
          className={cn('xp-start-button', startMenuOpen && 'shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]')}
          onClick={toggleStartMenu}
        >
          <Image src="/claws.svg" alt="" width={18} height={18} className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
          <span>start</span>
        </button>

        <div className="w-px h-6 bg-[#0D4A8A] mx-0.5" />

        {/* Open Window Buttons */}
        <div className="flex-1 flex items-center gap-0.5 overflow-hidden min-w-0">
          {windowOrder.map((windowId) => {
            const win = windows[windowId];
            if (!win) return null;
            const isFocused = windowOrder[windowOrder.length - 1] === windowId && !win.isMinimized;
            const iconSlug = WINDOW_ICON_MAP[win.icon] || win.icon;
            const badge = getBadge(win.toolId);

            return (
              <button
                key={windowId}
                onClick={() => handleTaskbarClick(windowId)}
                title={win.title}
                className={cn(
                  'relative h-[26px] px-2 flex items-center gap-1.5 rounded-sm transition-all text-white/90 min-w-[120px] max-w-[180px] truncate',
                  isFocused
                    ? 'xp-taskbar-button-active'
                    : 'xp-taskbar-button'
                )}
              >
                <XPIcon name={iconSlug} size={16} className="flex-shrink-0" />
                <span className="text-[11px] truncate">{win.title}</span>
                {badge != null && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 bg-claw-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center',
                      poppingIds.has(win.toolId) && 'badge-pop'
                    )}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-2 bg-[#0F4A8C] px-2 h-[26px] rounded-sm border border-[#0D4A8A] text-white/90">
          <div className="flex items-center gap-1 text-[#FFD700]">
            <span className="font-bold text-[11px]">{formatNumber(score.total)}</span>
            <span className="text-white/50 text-[9px]">pts</span>
          </div>

          <div className={cn('flex items-center gap-0.5', securityColor)}>
            <Shield size={10} />
            <span className="text-[10px]">{score.securityScore}</span>
          </div>

          {score.streak > 0 && (
            <div className="flex items-center gap-0.5 text-claw-orange">
              <Flame size={10} />
              <span className="text-[10px]">{score.streak}</span>
            </div>
          )}

          <div className="w-px h-3 bg-white/20" />

          <div className={cn('flex items-center gap-0.5', cpu.color, cpu.glow)}>
            <Cpu size={9} />
            <span className="text-[9px]">{Math.round(resources.cpu)}%</span>
          </div>
          <div className={cn('flex items-center gap-0.5', mem.color, mem.glow)}>
            <MemoryStick size={9} />
            <span className="text-[9px]">{Math.round(resources.memory)}%</span>
          </div>
          <div className={cn('flex items-center gap-0.5', disk.color, disk.glow)}>
            <HardDrive size={9} />
            <span className="text-[9px]">{Math.round(resources.disk)}%</span>
          </div>
          <div className={cn('flex items-center gap-0.5', net.color, net.glow)}>
            <Wifi size={9} />
            <span className="text-[9px]">{Math.round(resources.network)}%</span>
          </div>

          <div className="w-px h-3 bg-white/20" />

          {phase === 'playing' && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setSpeed(clock.speed === 'paused' ? 'normal' : 'paused')}
                className={cn(
                  'p-0.5 rounded-sm transition-colors',
                  clock.speed === 'paused' ? 'text-claw-orange' : 'text-white/60 hover:text-white'
                )}
                title={clock.speed === 'paused' ? 'Resume' : 'Pause'}
              >
                {clock.speed === 'paused' ? <Play size={10} /> : <Pause size={10} />}
              </button>
              <button
                onClick={() => setSpeed(clock.speed === 'fast' ? 'normal' : 'fast')}
                className={cn(
                  'p-0.5 rounded-sm transition-colors',
                  clock.speed === 'fast' ? 'text-[#80D0FF]' : 'text-white/60 hover:text-white'
                )}
                title="Fast forward"
              >
                <FastForward size={10} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 text-white">
            <Clock size={10} />
            <span className="text-[10px] font-mono">{formatDay(clock.day)}</span>
            <span className="text-[10px] font-mono">{formatTime(clock.hour, clock.minute)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
