'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import { formatTime, formatDay, formatNumber } from '@/lib/utils';
import type { ToolId } from '@/types';
import {
  Terminal,
  FolderOpen,
  Send,
  Phone,
  Mail,
  Search,
  Calendar,
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

const RESOURCE_THRESHOLDS = {
  CRITICAL: 90,
  WARNING: 75,
  HIGH: 80,
  MEDIUM: 50,
} as const;

const TOOLS: { id: ToolId; icon: typeof Terminal; label: string }[] = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
  { id: 'clawgram', icon: Send, label: 'Clawgram' },
  { id: 'whatsclaw', icon: Phone, label: 'Whatsclaw' },
  { id: 'email', icon: Mail, label: 'Email' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
];

export function HUDBar() {
  const activeTool = useGameStore((s) => s.tools.activeTool);
  const setActiveTool = useGameStore((s) => s.setActiveTool);
  const conversations = useGameStore((s) => s.conversations);
  const emails = useGameStore((s) => s.emails);
  const clock = useGameStore((s) => s.clock);
  const score = useGameStore((s) => s.score);
  const resources = useGameStore((s) => s.resources);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const phase = useGameStore((s) => s.phase);

  const selectedNpc = useGameStore((s) => s.selectedNpc);

  const totalUnread = Object.values(conversations).reduce((sum, c) => sum + c.unreadCount, 0);
  const clawgramUnread = selectedNpc?.preferredApp === 'clawgram' ? totalUnread : 0;
  const whatslawUnread = selectedNpc?.preferredApp === 'whatsclaw' ? totalUnread : 0;
  const unreadEmails = emails.filter((e) => !e.isRead).length;

  function getBadge(toolId: ToolId): number | undefined {
    if (toolId === 'clawgram' && clawgramUnread > 0) return clawgramUnread;
    if (toolId === 'whatsclaw' && whatslawUnread > 0) return whatslawUnread;
    if (toolId === 'email' && unreadEmails > 0) return unreadEmails;
    return undefined;
  }

  const prevBadges = useRef<Record<string, number>>({});
  const [poppingIds, setPoppingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const badges: Record<string, number> = {
      clawgram: clawgramUnread,
      whatsclaw: whatslawUnread,
      email: unreadEmails,
    };
    const newPopping = new Set<string>();
    for (const tool of TOOLS) {
      const badge = badges[tool.id] ?? 0;
      const prev = prevBadges.current[tool.id] ?? 0;
      if (badge > prev) {
        newPopping.add(tool.id);
      }
      prevBadges.current[tool.id] = badge;
    }
    if (newPopping.size > 0) {
      setPoppingIds(newPopping);
      const timer = setTimeout(() => setPoppingIds(new Set()), 300);
      return () => clearTimeout(timer);
    }
  }, [clawgramUnread, whatslawUnread, unreadEmails]);

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
    <div className="xp-taskbar h-[30px] flex items-center px-1 gap-0.5 text-xs select-none">
      {/* XP Start Button */}
      <button className="xp-start-button">
        <svg width="14" height="14" viewBox="0 0 16 16" className="text-white">
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path fill="currentColor" d="M5 4.5L12 8L5 11.5Z" />
        </svg>
        <span>start</span>
      </button>

      <div className="w-px h-5 bg-[#0D4A8A] mx-0.5" />

      {/* Quick Launch */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map(({ id, icon: Icon, label }) => {
          const badge = getBadge(id);
          return (
            <button
              key={id}
              onClick={() => setActiveTool(id)}
              title={label}
              className={cn(
                'relative h-[24px] px-2 flex items-center gap-1 rounded-sm transition-all text-white/90',
                activeTool === id
                  ? 'bg-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'hover:bg-white/10'
              )}
            >
              <Icon size={13} />
              <span className="text-[10px] hidden sm:inline">{label}</span>
              {badge != null && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1 bg-claw-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center',
                    poppingIds.has(id) && 'badge-pop'
                  )}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* System Tray */}
      <div className="flex items-center gap-2 bg-[#0F4A8C] px-2 h-[24px] rounded-sm border border-[#0D4A8A] text-white/90">
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
  );
}
