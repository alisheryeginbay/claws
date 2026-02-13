import { type StateCreator } from 'zustand';

export type WallpaperKey = 'bliss-modern' | 'bliss-classic' | 'bliss-pixel';

export const WALLPAPERS: { key: WallpaperKey; label: string; src: string }[] = [
  { key: 'bliss-modern', label: 'Bliss (Modern)', src: '/wallpapers/bliss-modern.webp' },
  { key: 'bliss-classic', label: 'Bliss (Classic)', src: '/wallpapers/bliss-classic.webp' },
  { key: 'bliss-pixel', label: 'Bliss (Pixel Art)', src: '/wallpapers/bliss-pixel.webp' },
];

function loadWallpaper(): WallpaperKey {
  if (typeof window === 'undefined') return 'bliss-modern';
  return (localStorage.getItem('clawback-wallpaper') as WallpaperKey) || 'bliss-modern';
}

export interface SettingsSlice {
  wallpaper: WallpaperKey;
  setWallpaper: (key: WallpaperKey) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  wallpaper: loadWallpaper(),
  setWallpaper: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback-wallpaper', key);
    }
    set({ wallpaper: key });
  },
});
