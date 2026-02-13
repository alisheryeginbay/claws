'use client';

export function XPBootLogo() {
  return (
    <div className="flex flex-col items-center gap-5">
      <span className="text-[80px] leading-none xp-flag-glow">🦞</span>

      {/* Product name */}
      <div className="text-center space-y-1">
        <div className="text-white text-[15px] tracking-[0.25em] font-light font-xp-brand">
          Clawback<sup className="text-[8px] ml-0.5">&#174;</sup>
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-white text-[28px] font-bold tracking-wide font-xp-brand">
            Claw
          </span>
          <span className="text-white text-[17px] font-light italic tracking-wider font-xp-brand">
            OS
          </span>
        </div>
        <div className="text-white text-[15px] tracking-[0.15em] font-light font-xp-brand">
          Professional
        </div>
      </div>
    </div>
  );
}
