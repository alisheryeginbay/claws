'use client';

import Image from 'next/image';

export function WelcomeLogo({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-end gap-4">
      <div className="flex flex-col items-center">
        {/* Top row: Clawsoft® + logo icon */}
        <div className="flex items-end gap-2">
          <span
            className="text-white/60 text-[12px]"
            style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.3)' }}
          >
            Clawsoft<sup>&reg;</sup>
          </span>
          <Image src="/claws.svg" alt="Claws" width={72} height={72} className="shrink-0" />
        </div>

        {/* Bottom row: "Claws" large text, full width */}
        <div
          className="text-white text-[46px] font-bold tracking-wide font-xp-brand w-full text-center -mt-1"
          style={{ textShadow: '1px 2px 3px rgba(0,0,0,0.4)' }}
        >
          Claws
        </div>
      </div>

      <p
        className="text-white/80 text-[13px] text-center leading-relaxed mt-2"
        style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.3)' }}
      >
        {subtitle}
      </p>
    </div>
  );
}
