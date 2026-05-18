/**
 * Small watercolor-style SVG vignettes used as the "stamp" portion of each module postcard.
 */

type Variant = "book" | "stamp" | "speech" | "cabins";

export default function PostcardVignette({ variant, className = "" }: { variant: Variant; className?: string }) {
  if (variant === "book") return <BookVignette className={className} />;
  if (variant === "stamp") return <StampVignette className={className} />;
  if (variant === "speech") return <SpeechVignette className={className} />;
  return <CabinsVignette className={className} />;
}

function BookVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bookSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(350 70% 92%)" />
          <stop offset="100%" stopColor="hsl(36 45% 95%)" />
        </linearGradient>
      </defs>
      <rect width="200" height="110" fill="url(#bookSky)" />
      {/* Open book */}
      <g transform="translate(60 30)">
        <path d="M0,8 Q40,-2 80,8 L80,52 Q40,42 0,52 Z" fill="hsl(36 45% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.2" />
        <line x1="40" y1="4" x2="40" y2="50" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        <line x1="8" y1="18" x2="34" y2="14" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.8" />
        <line x1="8" y1="26" x2="34" y2="22" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.8" />
        <line x1="8" y1="34" x2="34" y2="30" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.8" />
        <line x1="46" y1="14" x2="72" y2="18" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.8" />
        <line x1="46" y1="22" x2="72" y2="26" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.8" />
        <line x1="46" y1="30" x2="72" y2="34" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.8" />
      </g>
      {/* Ink swirl */}
      <path d="M150,30 Q170,40 160,60 Q150,75 170,80" fill="none" stroke="hsl(350 55% 35%)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="170" cy="80" r="2" fill="hsl(350 55% 35%)" />
    </svg>
  );
}

function StampVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="stampSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(18 75% 88%)" />
          <stop offset="100%" stopColor="hsl(36 50% 94%)" />
        </linearGradient>
      </defs>
      <rect width="200" height="110" fill="url(#stampSky)" />
      {/* Stamp */}
      <g transform="translate(70 18)">
        <rect x="0" y="0" width="60" height="74" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1" strokeDasharray="2 1.5" />
        {/* Floral inside */}
        <g transform="translate(30 32)">
          <circle r="3.5" fill="hsl(340 60% 60%)" />
          <circle cx="-7" cy="-3" r="3" fill="hsl(340 65% 70%)" />
          <circle cx="7" cy="-3" r="3" fill="hsl(340 65% 70%)" />
          <circle cx="-5" cy="6" r="2.8" fill="hsl(340 70% 78%)" />
          <circle cx="5" cy="6" r="2.8" fill="hsl(340 70% 78%)" />
          <line x1="0" y1="6" x2="0" y2="22" stroke="hsl(145 30% 38%)" strokeWidth="1.2" />
          <path d="M0,14 Q-6,12 -8,18" stroke="hsl(145 30% 38%)" strokeWidth="1" fill="none" />
          <path d="M0,18 Q6,16 8,22" stroke="hsl(145 30% 38%)" strokeWidth="1" fill="none" />
        </g>
        <text x="30" y="68" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="6" fontFamily="Fraunces, serif" fontWeight="700" letterSpacing="1">
          45 KR · NORGE
        </text>
      </g>
    </svg>
  );
}

function SpeechVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="speechSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(205 45% 82%)" />
          <stop offset="100%" stopColor="hsl(200 35% 92%)" />
        </linearGradient>
      </defs>
      <rect width="200" height="110" fill="url(#speechSky)" />
      {/* Small fjord silhouette */}
      <path d="M0,80 L40,60 L80,75 L120,55 L160,72 L200,62 L200,110 L0,110 Z" fill="hsl(215 25% 38% / 0.55)" />
      {/* Speech bubbles */}
      <g>
        <ellipse cx="60" cy="40" rx="32" ry="20" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        <polygon points="48,58 52,68 62,58" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        <text x="60" y="44" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="14" fontFamily="Instrument Serif, serif" fontStyle="italic">Hei!</text>
      </g>
      <g>
        <ellipse cx="145" cy="32" rx="28" ry="16" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        <polygon points="155,46 152,54 142,46" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        <text x="145" y="36" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="9" fontFamily="Instrument Serif, serif" fontStyle="italic">Hvordan?</text>
      </g>
    </svg>
  );
}

function CabinsVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cabinSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(18 75% 84%)" />
          <stop offset="60%" stopColor="hsl(340 50% 86%)" />
          <stop offset="100%" stopColor="hsl(280 30% 80%)" />
        </linearGradient>
        <linearGradient id="cabinMt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(215 25% 40%)" />
          <stop offset="100%" stopColor="hsl(145 22% 30%)" />
        </linearGradient>
        <linearGradient id="cabinWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(340 35% 72%)" />
          <stop offset="100%" stopColor="hsl(220 30% 55%)" />
        </linearGradient>
      </defs>
      <rect width="400" height="130" fill="url(#cabinSky)" />
      {/* Far range */}
      <path d="M0,80 L60,55 L120,70 L180,40 L260,65 L320,45 L400,72 L400,95 L0,95 Z" fill="hsl(220 18% 55% / 0.7)" />
      {/* Near big peak */}
      <path d="M120,95 L180,55 L220,25 L260,55 L300,30 L340,75 L380,95 Z" fill="url(#cabinMt)" />
      {/* Water */}
      <rect y="95" width="400" height="35" fill="url(#cabinWater)" />
      <rect y="100" width="400" height="1" fill="hsl(45 80% 90% / 0.5)" />
      {/* Cabins row */}
      <g>
        {[40, 78, 120, 160, 220, 270, 320].map((x, i) => {
          const colors = ["hsl(8 65% 45%)", "hsl(42 75% 60%)", "hsl(8 60% 42%)", "hsl(42 70% 58%)", "hsl(8 65% 45%)", "hsl(42 70% 60%)", "hsl(8 60% 42%)"];
          return (
            <g key={i}>
              <rect x={x} y={86} width="14" height="10" fill={colors[i]} />
              <polygon points={`${x},86 ${x + 7},80 ${x + 14},86`} fill="hsl(220 25% 22%)" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
