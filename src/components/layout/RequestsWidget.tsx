'use client';

import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { ClipboardList, Circle } from 'lucide-react';

export function RequestsWidget() {
  const requests = useGameStore((s) => s.requests);

  const activeReqs = requests.filter(
    (r) => r.status === 'active' || r.status === 'in_progress' || r.status === 'incoming'
  );

  if (activeReqs.length === 0) return null;

  return (
    <div
      className="absolute top-3 right-3 z-20 w-[220px]"
      style={{ fontFamily: 'var(--font-xp)' }}
    >
      {/* XP-style title bar */}
      <div
        className="h-[22px] flex items-center px-2 gap-1.5 rounded-t-[3px]"
        style={{
          background: 'linear-gradient(180deg, #0997FF 0%, #0054E3 8%, #0054E3 88%, #2490F0 100%)',
        }}
      >
        <ClipboardList size={12} className="text-white/90" />
        <span className="text-[11px] text-white font-bold truncate leading-none">
          Active Requests
        </span>
      </div>

      {/* Content area — XP face color with beveled border */}
      <div
        className="max-h-[180px] overflow-y-auto"
        style={{
          background: 'var(--color-xp-face, #ECE9D8)',
          borderLeft: '1px solid #ACA899',
          borderRight: '1px solid #ACA899',
          borderBottom: '1px solid #ACA899',
          borderBottomLeftRadius: '2px',
          borderBottomRightRadius: '2px',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.25)',
        }}
      >
        {activeReqs.map((req, i) => {
          const completedCount = req.objectives.filter((o) => o.completed).length;
          const totalCount = req.objectives.length;

          return (
            <div
              key={req.id}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5',
                i < activeReqs.length - 1 && 'border-b border-[#D2CFC0]'
              )}
            >
              <Circle
                size={6}
                className={cn(
                  'shrink-0 fill-current',
                  req.status === 'incoming' ? 'text-[#0054E3]' :
                  req.status === 'in_progress' ? 'text-[#E8A93A]' :
                  'text-[#808080]'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#000] truncate">{req.title}</div>
                {totalCount > 0 && (
                  <div className="text-[9px] text-[#808080]">
                    {completedCount}/{totalCount} done
                  </div>
                )}
              </div>
              <span className={cn(
                'text-[9px] font-bold shrink-0',
                req.status === 'incoming' ? 'text-[#0054E3]' :
                req.status === 'in_progress' ? 'text-[#E8A93A]' :
                'text-[#808080]'
              )}>
                {req.status === 'incoming' ? 'NEW' : req.status === 'in_progress' ? 'WIP' : 'TODO'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
