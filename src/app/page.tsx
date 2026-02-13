'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { XPBootLogo } from '@/components/game/XPBootLogo';
import { XPBootProgress } from '@/components/game/XPBootProgress';
import { cn } from '@/lib/utils';

const BOOT_DURATION = 3500;
const FADE_DURATION = 800;

export default function HomePage() {
  const router = useRouter();
  const [bootFading, setBootFading] = useState(false);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setBootFading(true);
    }, BOOT_DURATION);

    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (!bootFading) return;
    const navTimer = setTimeout(() => {
      router.push('/game');
    }, FADE_DURATION);

    return () => clearTimeout(navTimer);
  }, [bootFading, router]);

  return (
    <div className={cn(
      'h-screen w-screen bg-black flex flex-col items-center justify-center select-none',
      bootFading && 'xp-boot-fade-out'
    )}>
      {/* Logo and text — positioned slightly above center */}
      <div className="-mt-16">
        <XPBootLogo />
      </div>

      {/* Progress bar — below center */}
      <div className="mt-16">
        <XPBootProgress />
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between">
        <span className="text-[#808080] text-[11px]">
          Copyright &copy; {new Date().getFullYear()} Clawback Corp.
        </span>
        <span className="text-[#808080] text-[11px]">
          Clawback&reg;
        </span>
      </div>
    </div>
  );
}
