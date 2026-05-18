/**
 * Decorative Norwegian / Scandinavian atmosphere backdrop.
 * Soft sky wash + multi-layer fjord silhouettes + floating postcard stickers + tiny speech bubbles.
 * Purely presentational, pointer-events disabled.
 */
export default function NordicBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sky wash — peach → lilac → cream → mist */}
      <div
        className="absolute inset-x-0 top-0 h-[65%]"
        style={{
          background:
            "linear-gradient(180deg, hsl(18 75% 88% / 0.55) 0%, hsl(340 55% 86% / 0.45) 25%, hsl(280 35% 84% / 0.30) 50%, hsl(36 45% 95% / 0) 100%)",
        }}
      />

      {/* Soft sun */}
      <div className="absolute top-[7%] left-[18%] w-40 h-40 rounded-full bg-sunset/40 blur-3xl" />
      <div className="absolute top-[10%] left-[22%] w-24 h-24 rounded-full bg-secondary/40 blur-2xl" />

      {/* Distant ridges */}
      <svg
        viewBox="0 0 1440 360"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[320px] opacity-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ridgeFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220 22% 55%)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="hsl(220 22% 55%)" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="ridgeMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 25% 42%)" stopOpacity="0.40" />
            <stop offset="100%" stopColor="hsl(160 22% 38%)" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id="ridgeNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(145 22% 32%)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(145 25% 25%)" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="waterWash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(340 35% 80%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(220 30% 60%)" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        {/* Far range */}
        <path
          fill="url(#ridgeFar)"
          d="M0,200 L120,140 L240,180 L360,110 L500,170 L640,120 L780,165 L920,100 L1060,160 L1200,130 L1320,180 L1440,140 L1440,360 L0,360 Z"
        />
        {/* Mid range */}
        <path
          fill="url(#ridgeMid)"
          d="M0,250 L100,200 L220,235 L340,180 L460,225 L600,195 L720,240 L860,200 L1000,235 L1140,205 L1280,245 L1440,220 L1440,360 L0,360 Z"
        />
        {/* Near range */}
        <path
          fill="url(#ridgeNear)"
          d="M0,300 L80,265 L200,290 L320,250 L460,285 L600,260 L760,295 L900,265 L1060,300 L1200,275 L1320,305 L1440,285 L1440,360 L0,360 Z"
        />
        {/* Water wash */}
        <rect y="310" width="1440" height="50" fill="url(#waterWash)" />
        <rect y="315" width="1440" height="0.6" fill="hsl(45 80% 88% / 0.45)" />
        <rect y="330" width="1440" height="0.5" fill="hsl(340 60% 88% / 0.35)" />
      </svg>

      {/* Paper texture dots */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--primary) / 0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating postcard stickers */}
      <Sticker className="top-[6%] right-[5%] rotate-[6deg] hidden md:flex" delay="0s" label="Lofoten" tint="from-sunset/50 via-secondary to-fjord/40" />
      <Sticker className="top-[26%] left-[3%] -rotate-[8deg] hidden lg:flex" delay="1.2s" label="Bergen" tint="from-forest/40 to-fjord/40" />
      <Sticker className="top-[58%] right-[3%] rotate-[4deg] hidden lg:flex" delay="2.4s" label="Tromsø" tint="from-fjord/50 to-secondary/60" small />

      {/* Tiny stamp */}
      <div
        className="absolute top-[44%] right-[8%] w-14 h-16 bg-cream rounded-sm shadow-card-soft rotate-[12deg] border-2 border-dashed border-primary/25 p-1 animate-float-slow hidden lg:flex items-center justify-center"
        style={{ animationDelay: "1.6s" }}
      >
        <div className="text-center">
          <div className="font-display text-[8px] font-bold text-primary/80 leading-none">45 KR</div>
          <div className="font-script text-[7px] text-primary/60 italic mt-0.5">Norge</div>
        </div>
      </div>

      {/* Speech bubbles */}
      <div className="absolute top-[12%] left-[36%] hidden xl:block animate-float-slow" style={{ animationDelay: "0.6s" }}>
        <SpeechBubble text="Hei!" big />
      </div>
      <div className="absolute bottom-[38%] left-[6%] hidden xl:block animate-float-slow" style={{ animationDelay: "1.8s" }}>
        <SpeechBubble text="Hvordan går det?" />
      </div>
    </div>
  );
}

function Sticker({
  className,
  delay,
  label,
  tint,
  small,
}: {
  className: string;
  delay: string;
  label: string;
  tint: string;
  small?: boolean;
}) {
  const size = small ? "w-16 h-20" : "w-24 h-28";
  return (
    <div
      className={`absolute ${size} bg-cream rounded-md shadow-postcard border border-border/40 p-1.5 animate-float-slow items-end justify-center ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className={`w-full h-full rounded-sm bg-gradient-to-br ${tint} flex items-end justify-center pb-1`}>
        <span className="font-script italic text-[10px] text-primary/85">{label}</span>
      </div>
    </div>
  );
}

function SpeechBubble({ text, big }: { text: string; big?: boolean }) {
  return (
    <div className="relative bg-cream/90 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-sm px-3 py-1.5 shadow-card-soft">
      <span className={`font-script italic text-primary ${big ? "text-base" : "text-xs"}`}>{text}</span>
    </div>
  );
}
