'use client';

export function WelcomeLogo({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-[56px] leading-none">🦞</span>

      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-white text-[22px] font-bold tracking-wide font-xp-brand">
            Claw
          </span>
          <span className="text-white text-[14px] font-light italic tracking-wider font-xp-brand">
            OS
          </span>
        </div>
      </div>

      <p className="text-white/80 text-[13px] text-center leading-relaxed mt-2">
        {subtitle}
      </p>
    </div>
  );
}
