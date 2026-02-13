'use client';

import { Minus, Square, X } from 'lucide-react';

interface WindowControlsProps {
  className?: string;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function WindowControls({ className = '', onMinimize, onMaximize, onClose }: WindowControlsProps) {
  return (
    <div className={`flex items-center gap-[2px] ${className}`}>
      <button className="xp-control-btn" title="Minimize" onClick={onMinimize}>
        <Minus size={9} strokeWidth={2.5} className="text-white" />
      </button>
      <button className="xp-control-btn" title="Maximize" onClick={onMaximize}>
        <Square size={8} strokeWidth={2.5} className="text-white" />
      </button>
      <button className="xp-control-btn xp-control-btn-close" title="Close" onClick={onClose}>
        <X size={9} strokeWidth={2.5} className="text-white" />
      </button>
    </div>
  );
}
