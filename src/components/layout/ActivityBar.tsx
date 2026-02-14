'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import type { ToolId } from '@/types';
import {
  Terminal,
  FolderOpen,
  Send,
  Phone,
  Mail,
  Search,
  Calendar,
} from 'lucide-react';

const TOOLS: { id: ToolId; icon: typeof Terminal; label: string }[] = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
  { id: 'teleclaw', icon: Send, label: 'Teleclaw' },
  { id: 'whatsclaw', icon: Phone, label: 'Whatsclaw' },
  { id: 'email', icon: Mail, label: 'Email' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
];

export function ActivityBar() {
  const activeTool = useGameStore((s) => s.tools.activeTool);
  const setActiveTool = useGameStore((s) => s.setActiveTool);
  const conversations = useGameStore((s) => s.conversations);
  const selectedNpc = useGameStore((s) => s.selectedNpc);
  const emails = useGameStore((s) => s.emails);

  const totalUnread = Object.values(conversations).reduce((sum, c) => sum + c.unreadCount, 0);
  const teleclawUnread = selectedNpc?.preferredApp === 'teleclaw' ? totalUnread : 0;
  const whatslawUnread = selectedNpc?.preferredApp === 'whatsclaw' ? totalUnread : 0;
  const unreadEmails = emails.filter((e) => !e.isRead).length;

  function getBadge(toolId: ToolId): number | undefined {
    if (toolId === 'teleclaw' && teleclawUnread > 0) return teleclawUnread;
    if (toolId === 'whatsclaw' && whatslawUnread > 0) return whatslawUnread;
    if (toolId === 'email' && unreadEmails > 0) return unreadEmails;
    return undefined;
  }

  // Track previous badge values to detect increases
  const prevBadges = useRef<Record<string, number>>({});
  const [poppingIds, setPoppingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const badges: Record<string, number> = {
      teleclaw: teleclawUnread,
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
  }, [teleclawUnread, whatslawUnread, unreadEmails]);

  return (
    <div className="w-12 bg-claw-surface border-r border-claw-border flex flex-col items-center py-2 gap-1">
      {TOOLS.map(({ id, icon: Icon, label }) => {
        const badge = getBadge(id);
        return (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            title={label}
            className={cn(
              'relative w-10 h-10 flex items-center justify-center rounded transition-colors',
              activeTool === id
                ? 'text-claw-green bg-claw-green/10 border-l-2 border-claw-green'
                : 'text-claw-muted hover:text-claw-text hover:bg-claw-surface-alt'
            )}
          >
            <Icon size={18} />
            {badge != null && (
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 bg-claw-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center',
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
  );
}
