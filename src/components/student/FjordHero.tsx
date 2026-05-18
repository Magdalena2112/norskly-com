/**
 * Pure SVG Lofoten-inspired hero illustration.
 * Sunset sky → slate mountains → rorbuer cabins → mirror water.
 */
export default function FjordHero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 360"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(18 75% 82%)" />
          <stop offset="35%" stopColor="hsl(340 55% 84%)" />
          <stop offset="70%" stopColor="hsl(280 35% 80%)" />
          <stop offset="100%" stopColor="hsl(220 30% 75%)" />
        </linearGradient>
        <linearGradient id="mtFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(220 18% 55%)" />
          <stop offset="100%" stopColor="hsl(220 22% 42%)" />
        </linearGradient>
        <linearGradient id="mtNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(215 25% 38%)" />
          <stop offset="100%" stopColor="hsl(145 22% 28%)" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(220 30% 60%)" />
          <stop offset="50%" stopColor="hsl(340 35% 75%)" />
          <stop offset="100%" stopColor="hsl(280 25% 55%)" />
        </linearGradient>
        <radialGradient id="sun" cx="0.15" cy="0.55" r="0.5">
          <stop offset="0%" stopColor="hsl(45 95% 88%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(45 95% 88%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="600" height="240" fill="url(#sky)" />
      <ellipse cx="80" cy="180" rx="180" ry="80" fill="url(#sun)" />

      {/* Distant mountains */}
      <path
        fill="url(#mtFar)"
        opacity="0.85"
        d="M0,200 L40,160 L90,180 L140,140 L200,180 L260,130 L320,170 L380,140 L440,180 L500,150 L560,185 L600,165 L600,240 L0,240 Z"
      />

      {/* Near big mountain (Lofoten-style spike) */}
      <path
        fill="url(#mtNear)"
        d="M250,240 L300,150 L340,90 L380,130 L430,80 L480,170 L520,200 L600,220 L600,240 Z"
      />
      {/* Smaller near peaks left */}
      <path
        fill="url(#mtNear)"
        opacity="0.92"
        d="M0,240 L40,200 L90,170 L130,200 L180,180 L230,210 L270,240 Z"
      />

      {/* Water */}
      <rect y="240" width="600" height="120" fill="url(#water)" />

      {/* Water reflection bands (animated via CSS) */}
      <g className="animate-water">
        <rect y="252" width="600" height="2" fill="hsl(45 80% 90% / 0.6)" />
        <rect y="270" width="600" height="1.5" fill="hsl(340 60% 88% / 0.5)" />
        <rect y="295" width="600" height="1" fill="hsl(220 40% 80% / 0.4)" />
      </g>

      {/* Rorbuer cabins along the shore */}
      <g>
        {/* Cabin 1 — red */}
        <rect x="430" y="222" width="22" height="16" fill="hsl(8 65% 45%)" />
        <polygon points="430,222 441,212 452,222" fill="hsl(220 25% 22%)" />
        <rect x="438" y="228" width="4" height="6" fill="hsl(36 45% 92%)" />

        {/* Cabin 2 — yellow */}
        <rect x="458" y="225" width="20" height="14" fill="hsl(42 75% 60%)" />
        <polygon points="458,225 468,216 478,225" fill="hsl(220 25% 22%)" />
        <rect x="465" y="230" width="3" height="5" fill="hsl(36 45% 92%)" />

        {/* Cabin 3 — red small */}
        <rect x="484" y="228" width="16" height="12" fill="hsl(8 60% 42%)" />
        <polygon points="484,228 492,221 500,228" fill="hsl(220 25% 22%)" />

        {/* Cabin 4 — yellow tall */}
        <rect x="506" y="220" width="18" height="20" fill="hsl(42 70% 58%)" />
        <polygon points="506,220 515,210 524,220" fill="hsl(220 25% 22%)" />
        <rect x="513" y="228" width="3" height="5" fill="hsl(36 45% 92%)" />
      </g>

      {/* Stilts / pier reflections */}
      <g stroke="hsl(220 25% 22% / 0.55)" strokeWidth="1">
        <line x1="436" y1="238" x2="436" y2="248" />
        <line x1="448" y1="238" x2="448" y2="248" />
        <line x1="490" y1="240" x2="490" y2="248" />
      </g>

      {/* Tiny sailboat */}
      <g transform="translate(120 250)">
        <polygon points="0,0 8,-14 8,0" fill="hsl(36 45% 92%)" stroke="hsl(350 50% 22%)" strokeWidth="0.6" />
        <line x1="-4" y1="0" x2="10" y2="0" stroke="hsl(220 25% 22%)" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
