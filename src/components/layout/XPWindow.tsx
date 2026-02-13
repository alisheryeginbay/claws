'use client';

import { useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useGameStore } from '@/store/gameStore';
import { WindowControls } from './WindowControls';
import { XPIcon } from '@/components/ui/XPIcon';
import { WINDOW_ICON_MAP } from '@/lib/xp-icons';
import type { WindowState } from '@/types';

interface XPWindowProps {
  windowState: WindowState;
  isFocused: boolean;
  children: ReactNode;
}

export function XPWindow({ windowState, isFocused, children }: XPWindowProps) {
  const focusWindow = useGameStore((s) => s.focusWindow);
  const minimizeWindow = useGameStore((s) => s.minimizeWindow);
  const maximizeWindow = useGameStore((s) => s.maximizeWindow);
  const closeWindow = useGameStore((s) => s.closeWindow);
  const moveWindow = useGameStore((s) => s.moveWindow);
  const resizeWindow = useGameStore((s) => s.resizeWindow);

  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number; startPosX: number; startPosY: number; direction: string } | null>(null);

  const iconSlug = WINDOW_ICON_MAP[windowState.icon] || windowState.icon;

  const handleMouseDown = useCallback(() => {
    if (!isFocused) {
      focusWindow(windowState.id);
    }
  }, [isFocused, focusWindow, windowState.id]);

  const handleTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowState.isMaximized) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: windowState.position.x,
      startPosY: windowState.position.y,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
  }, [windowState.position, windowState.isMaximized]);

  const handleResizeMouseDown = useCallback((direction: string) => (e: React.MouseEvent) => {
    if (windowState.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: windowState.size.width,
      startH: windowState.size.height,
      startPosX: windowState.position.x,
      startPosY: windowState.position.y,
      direction,
    };
    document.body.style.userSelect = 'none';
  }, [windowState.size, windowState.position, windowState.isMaximized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const el = windowRef.current;
        if (el) {
          const rawX = dragRef.current.startPosX + dx;
          const rawY = dragRef.current.startPosY + dy;
          const elW = el.offsetWidth;
          // Keep at least 100px visible horizontally, clamp top to 0 and bottom to above taskbar
          const x = Math.max(-elW + 100, Math.min(rawX, window.innerWidth - 100));
          const y = Math.max(0, Math.min(rawY, window.innerHeight - 72));
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        }
      }
      if (resizeRef.current) {
        const r = resizeRef.current;
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        const el = windowRef.current;
        if (!el) return;

        let newW = r.startW;
        let newH = r.startH;
        let newX = r.startPosX;
        let newY = r.startPosY;

        if (r.direction.includes('e')) newW = r.startW + dx;
        if (r.direction.includes('s')) newH = r.startH + dy;
        if (r.direction.includes('w')) {
          newW = r.startW - dx;
          newX = r.startPosX + dx;
        }
        if (r.direction.includes('n')) {
          newH = r.startH - dy;
          newY = r.startPosY + dy;
        }

        newW = Math.max(newW, windowState.minSize.width);
        newH = Math.max(newH, windowState.minSize.height);

        // If we clamped width from the west side, don't move x
        if (r.direction.includes('w') && newW === windowState.minSize.width) {
          newX = r.startPosX + r.startW - windowState.minSize.width;
        }
        if (r.direction.includes('n') && newH === windowState.minSize.height) {
          newY = r.startPosY + r.startH - windowState.minSize.height;
        }

        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        const el = windowRef.current;
        if (el) {
          const rawX = parseInt(el.style.left) || 0;
          const rawY = parseInt(el.style.top) || 0;
          const elW = el.offsetWidth;
          const x = Math.max(-elW + 100, Math.min(rawX, window.innerWidth - 100));
          const y = Math.max(0, Math.min(rawY, window.innerHeight - 72));
          moveWindow(windowState.id, { x, y });
        }
        dragRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (resizeRef.current) {
        const el = windowRef.current;
        if (el) {
          const w = parseInt(el.style.width) || windowState.size.width;
          const h = parseInt(el.style.height) || windowState.size.height;
          const x = parseInt(el.style.left) || windowState.position.x;
          const y = parseInt(el.style.top) || windowState.position.y;
          resizeWindow(windowState.id, { width: w, height: h });
          moveWindow(windowState.id, { x, y });
        }
        resizeRef.current = null;
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      dragRef.current = null;
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [windowState.id, windowState.minSize, windowState.size, windowState.position, moveWindow, resizeWindow]);

  return (
    <div
      ref={windowRef}
      className="absolute flex flex-col xp-window xp-window-in"
      style={{
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
        zIndex: windowState.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar */}
      <div
        className={isFocused ? 'xp-titlebar' : 'xp-titlebar xp-titlebar-inactive'}
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={() => maximizeWindow(windowState.id)}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <XPIcon name={iconSlug} size={16} />
          <span className="text-[12px] truncate">{windowState.title}</span>
        </div>
        <div className="flex-1" />
        <WindowControls
          onMinimize={() => minimizeWindow(windowState.id)}
          onMaximize={() => maximizeWindow(windowState.id)}
          onClose={() => closeWindow(windowState.id)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[var(--color-xp-face)]">
        {children}
      </div>

      {/* Resize handles */}
      {!windowState.isMaximized && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 cursor-n-resize" onMouseDown={handleResizeMouseDown('n')} />
          <div className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize" onMouseDown={handleResizeMouseDown('s')} />
          <div className="absolute top-0 left-0 bottom-0 w-1 cursor-w-resize" onMouseDown={handleResizeMouseDown('w')} />
          <div className="absolute top-0 right-0 bottom-0 w-1 cursor-e-resize" onMouseDown={handleResizeMouseDown('e')} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={handleResizeMouseDown('nw')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={handleResizeMouseDown('ne')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={handleResizeMouseDown('sw')} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={handleResizeMouseDown('se')} />
        </>
      )}
    </div>
  );
}
