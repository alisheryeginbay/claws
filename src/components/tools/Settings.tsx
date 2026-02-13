'use client';

import { useGameStore } from '@/store/gameStore';
import { WALLPAPERS, type WallpaperKey } from '@/store/slices/settingsSlice';
import { Check } from 'lucide-react';

export function Settings() {
  const wallpaper = useGameStore((s) => s.wallpaper);
  const setWallpaper = useGameStore((s) => s.setWallpaper);

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-xp-face)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#ACA899] px-3 pt-2">
        <div className="px-4 py-1.5 text-[11px] font-bold bg-[var(--color-xp-face)] border border-[#ACA899] border-b-[var(--color-xp-face)] rounded-t -mb-px relative z-10">
          Desktop
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-[11px] text-[#333] font-bold mb-2">Background</div>

        {/* Preview */}
        <div className="w-full h-[140px] rounded border border-[#919B9C] mb-3 overflow-hidden relative">
          <WallpaperPreview wallpaperKey={wallpaper} />
          {/* Mini monitor frame */}
          <div className="absolute inset-x-[15%] top-[10%] bottom-[18%] border border-[#666] rounded-sm overflow-hidden">
            <WallpaperPreview wallpaperKey={wallpaper} />
          </div>
          <div className="absolute inset-x-[25%] bottom-[8%] h-[10%] bg-[#666] rounded-b-sm" />
        </div>

        {/* Wallpaper grid */}
        <div className="grid grid-cols-4 gap-2">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.key}
              onClick={() => setWallpaper(wp.key)}
              className={`group relative rounded border-2 overflow-hidden aspect-[4/3] transition-all ${
                wallpaper === wp.key
                  ? 'border-[#316AC5] shadow-[0_0_0_1px_#316AC5]'
                  : 'border-[#ACA899] hover:border-[#316AC5]/50'
              }`}
            >
              <WallpaperPreview wallpaperKey={wp.key} />
              {wallpaper === wp.key && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-[#316AC5] rounded-full flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5">
                <span className="text-[9px] text-white leading-tight block truncate">
                  {wp.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#ACA899]">
        <div className="text-[10px] text-[#808080] mr-auto self-center">
          Select a wallpaper for your desktop
        </div>
      </div>
    </div>
  );
}

function WallpaperPreview({ wallpaperKey }: { wallpaperKey: WallpaperKey }) {
  const wp = WALLPAPERS.find((w) => w.key === wallpaperKey);
  if (!wp) return null;
  return (
    <img
      src={wp.src}
      alt={wp.label}
      className="w-full h-full object-cover"
    />
  );
}
