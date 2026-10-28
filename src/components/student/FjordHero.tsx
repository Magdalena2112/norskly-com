/**
 * Pure SVG Lofoten-inspired hero illustration.
 * Sunset sky → slate mountains → rorbuer cabins → mirror water.
 */
const SKY = (
  <linearGradient id="citySky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="hsl(18 75% 84%)" />
    <stop offset="40%" stopColor="hsl(340 55% 85%)" />
    <stop offset="75%" stopColor="hsl(280 35% 82%)" />
    <stop offset="100%" stopColor="hsl(220 30% 78%)" />
  </linearGradient>
);

function LondonHero({ className }: { className: string }) {
  const ink = "hsl(220 25% 26%)";
  return (
    <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>{SKY}</defs>
      <rect width="600" height="360" fill="url(#citySky)" />
      <circle cx="110" cy="120" r="46" fill="hsl(45 95% 88% / 0.7)" />
      {/* London Eye */}
      <g stroke="hsl(220 20% 45%)" strokeWidth="1.5" fill="none">
        <circle cx="140" cy="200" r="62" />
        {[0, 30, 60, 90, 120, 150].map((a) => (
          <line key={a} x1={140 - 62 * Math.cos((a * Math.PI) / 180)} y1={200 - 62 * Math.sin((a * Math.PI) / 180)} x2={140 + 62 * Math.cos((a * Math.PI) / 180)} y2={200 + 62 * Math.sin((a * Math.PI) / 180)} />
        ))}
        <line x1="140" y1="200" x2="115" y2="270" /><line x1="140" y1="200" x2="165" y2="270" />
      </g>
      {/* Skyline */}
      <path fill="hsl(220 18% 55%)" opacity="0.8" d="M0,270 L0,230 L40,230 L40,215 L70,215 L70,240 L230,240 L230,220 L260,220 L260,245 L600,245 L600,270 Z" />
      {/* Parliament + Big Ben */}
      <g fill={ink}>
        <rect x="300" y="215" width="200" height="55" />
        {[310, 340, 370, 400, 430, 460, 485].map((x) => <rect key={x} x={x} y="205" width="6" height="12" />)}
        <rect x="470" y="110" width="26" height="160" />
        <polygon points="470,110 483,78 496,110" />
        <line x1="483" y1="78" x2="483" y2="64" stroke={ink} strokeWidth="2" />
      </g>
      <circle cx="483" cy="128" r="8" fill="hsl(42 75% 70%)" />
      {/* Thames */}
      <rect y="270" width="600" height="90" fill="hsl(220 30% 62%)" />
      <g className="animate-water">
        <rect y="282" width="600" height="2" fill="hsl(45 80% 90% / 0.6)" />
        <rect y="305" width="600" height="1.5" fill="hsl(340 60% 88% / 0.5)" />
      </g>
      {/* Red bus on bridge */}
      <rect x="0" y="262" width="600" height="6" fill="hsl(220 25% 35%)" />
      <g transform="translate(330 244)">
        <rect width="44" height="20" rx="3" fill="hsl(4 70% 48%)" />
        <rect x="4" y="3" width="36" height="5" fill="hsl(36 45% 92%)" />
        <rect x="4" y="11" width="36" height="4" fill="hsl(36 45% 92%)" />
      </g>
    </svg>
  );
}

function BerlinHero({ className }: { className: string }) {
  const ink = "hsl(220 25% 26%)";
  return (
    <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>{SKY}</defs>
      <rect width="600" height="360" fill="url(#citySky)" />
      <circle cx="480" cy="110" r="44" fill="hsl(45 95% 88% / 0.7)" />
      {/* Fernsehturm */}
      <g fill="hsl(220 20% 45%)">
        <rect x="105" y="90" width="8" height="190" />
        <circle cx="109" cy="120" r="16" />
        <rect x="108" y="40" width="2" height="62" />
      </g>
      {/* Skyline */}
      <path fill="hsl(220 18% 58%)" opacity="0.8" d="M0,280 L0,235 L60,235 L60,220 L90,220 L90,245 L150,245 L150,225 L200,225 L200,250 L420,250 L420,228 L470,228 L470,240 L600,240 L600,280 Z" />
      {/* Brandenburger Tor */}
      <g fill={ink}>
        <rect x="250" y="190" width="160" height="14" />
        <rect x="262" y="180" width="136" height="10" />
        {[256, 284, 312, 340, 368, 396].map((x) => <rect key={x} x={x} y="204" width="8" height="66" />)}
        <rect x="244" y="268" width="172" height="6" />
        {/* Quadriga */}
        <rect x="318" y="166" width="24" height="12" />
        <rect x="328" y="154" width="3" height="14" />
      </g>
      {/* Street */}
      <rect y="274" width="600" height="86" fill="hsl(220 22% 70%)" />
      <g className="animate-water">
        <rect y="290" width="600" height="1.5" fill="hsl(45 80% 92% / 0.6)" />
      </g>
      {/* Yellow tram */}
      <g transform="translate(440 250)">
        <rect width="90" height="24" rx="4" fill="hsl(45 85% 58%)" />
        {[6, 26, 46, 66].map((x) => <rect key={x} x={x} y="5" width="16" height="9" fill="hsl(36 45% 92%)" />)}
        <circle cx="18" cy="26" r="3" fill={ink} /><circle cx="72" cy="26" r="3" fill={ink} />
      </g>
    </svg>
  );
}

export default function FjordHero({ className = "", language = "no" }: { className?: string; language?: string }) {
  if (language === "en") return <LondonHero className={className} />;
  if (language === "de") return <BerlinHero className={className} />;
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
