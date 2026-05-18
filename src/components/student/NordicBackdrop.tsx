/**
 * Decorative Norwegian / Scandinavian atmosphere backdrop.
 * Soft fjord silhouettes + floating "postcard" stickers + tiny speech bubbles.
 * Purely presentational, pointer-events disabled.
 */
export default function NordicBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Warm sky wash */}
      <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-sunset/25 via-secondary/30 to-transparent" />

      {/* Fjord mountain silhouette — bottom */}
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[280px] opacity-70"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fjordFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--fjord))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--fjord))" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="fjordNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--fjord-deep))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--forest))" stopOpacity="0.30" />
          </linearGradient>
        </defs>
        {/* Far range */}
        <path
          fill="url(#fjordFar)"
          d="M0,200 L120,140 L240,180 L360,110 L500,170 L640,120 L780,165 L920,100 L1060,160 L1200,130 L1320,180 L1440,140 L1440,320 L0,320 Z"
        />
        {/* Near range */}
        <path
          fill="url(#fjordNear)"
          d="M0,260 L100,210 L220,240 L340,190 L460,230 L600,200 L720,245 L860,205 L1000,240 L1140,210 L1280,250 L1440,225 L1440,320 L0,320 Z"
        />
        {/* Subtle water line */}
        <path
          fill="hsl(var(--fjord) / 0.18)"
          d="M0,280 L1440,275 L1440,320 L0,320 Z"
        />
      </svg>

      {/* Floating postcard stickers */}
      <div
        className="absolute top-[8%] right-[6%] w-24 h-28 bg-cream rounded-md shadow-postcard rotate-[6deg] border border-border/40 p-1.5 animate-float-slow hidden md:block"
        style={{ animationDelay: "0s" }}
      >
        <div className="w-full h-full rounded-sm bg-gradient-to-br from-fjord/40 via-mist to-sunset/40 flex items-end justify-center pb-1">
          <span className="font-script text-[10px] text-primary/80">Lofoten</span>
        </div>
      </div>

      <div
        className="absolute top-[22%] left-[4%] w-20 h-24 bg-cream rounded-md shadow-postcard -rotate-[8deg] border border-border/40 p-1.5 animate-float-slow hidden lg:block"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="w-full h-full rounded-sm bg-gradient-to-br from-forest/40 to-fjord/30 flex items-end justify-center pb-1">
          <span className="font-script text-[10px] text-primary/80">Bergen</span>
        </div>
      </div>

      {/* Tiny stamp */}
      <div
        className="absolute top-[44%] right-[3%] w-14 h-16 bg-cream rounded-sm shadow-card-soft rotate-[12deg] border-2 border-dashed border-primary/20 p-1 animate-float-slow hidden lg:flex items-center justify-center"
        style={{ animationDelay: "2s" }}
      >
        <span className="font-display text-[9px] font-bold text-primary/70 tracking-wider">45 KR</span>
      </div>

      {/* Norwegian speech bubbles */}
      <div className="absolute top-[14%] left-[18%] hidden xl:block animate-float-slow" style={{ animationDelay: "0.6s" }}>
        <div className="relative bg-cream/90 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-sm px-3 py-1.5 shadow-card-soft">
          <span className="font-script italic text-sm text-primary">Hei!</span>
        </div>
      </div>

      <div className="absolute bottom-[34%] left-[8%] hidden xl:block animate-float-slow" style={{ animationDelay: "1.8s" }}>
        <div className="relative bg-cream/90 backdrop-blur-sm border border-border/50 rounded-2xl rounded-br-sm px-3 py-1.5 shadow-card-soft">
          <span className="font-script italic text-xs text-primary/80">Hvordan går det?</span>
        </div>
      </div>

      {/* Soft sun / glow */}
      <div className="absolute top-[6%] left-[42%] w-32 h-32 rounded-full bg-sunset/30 blur-3xl" />
    </div>
  );
}
