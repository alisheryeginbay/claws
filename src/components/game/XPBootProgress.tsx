'use client';

export function XPBootProgress() {
  return (
    <div className="flex justify-center">
      {/* Outer container - silver/gray recessed bar */}
      <div
        className="relative overflow-hidden rounded-sm"
        style={{
          width: '200px',
          height: '20px',
          background: 'linear-gradient(180deg, #808080 0%, #C0C0C0 2px, #E0E0E0 4px, #C0C0C0 100%)',
          border: '1px solid #606060',
          padding: '3px',
        }}
      >
        {/* Inner dark track */}
        <div className="relative w-full h-full overflow-hidden rounded-sm bg-[#1a1a2e]">
          {/* Three sliding blue blocks */}
          <div className="absolute inset-y-0 left-0 flex gap-[2px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="xp-boot-block h-full rounded-[1px]"
                style={{
                  width: '10px',
                  background: 'linear-gradient(180deg, #7BB5ED 0%, #3B8FE0 30%, #0054E3 60%, #003C9E 100%)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
