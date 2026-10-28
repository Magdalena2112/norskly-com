/**
 * Watercolor-style SVG vignettes used as the illustration strip of each postcard.
 * All scenes are drawn edge-to-edge in a wide viewBox matching the card aspect,
 * so `slice` never cuts the central motif, and use the platform palette
 * (sunset peach → pink → plum sky, sage/forest greens, muted fjord blues).
 */

type Variant = "book" | "stamp" | "speech" | "cabins" | "teacher";

export default function PostcardVignette({ variant, className = "" }: { variant: Variant; className?: string }) {
  if (variant === "book") return <BookVignette className={className} />;
  if (variant === "stamp") return <StampVignette className={className} />;
  if (variant === "speech") return <SpeechVignette className={className} />;
  if (variant === "teacher") return <TeacherVignette className={className} />;
  return <CabinsVignette className={className} />;
}

/** Warm sunset sky shared by the card-sized scenes. */
function CardSky({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(18 75% 88%)" />
      <stop offset="45%" stopColor="hsl(340 55% 90%)" />
      <stop offset="100%" stopColor="hsl(280 30% 88%)" />
    </linearGradient>
  );
}

function BookVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 128" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <CardSky id="bookSky" />
        <linearGradient id="bookMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(350 40% 88%)" />
          <stop offset="100%" stopColor="hsl(36 45% 95%)" />
        </linearGradient>
      </defs>
      <rect width="480" height="128" fill="url(#bookSky)" />
      {/* Soft low mist band */}
      <path d="M0,96 Q120,86 240,96 T480,92 L480,128 L0,128 Z" fill="url(#bookMist)" opacity="0.8" />
      {/* Dotted journey line spanning the card */}
      <path d="M0,104 C80,92 140,112 240,104 C340,96 400,114 480,102" fill="none" stroke="hsl(350 45% 40% / 0.35)" strokeWidth="1.2" strokeDasharray="1 6" strokeLinecap="round" />
      {/* Open book, centred and fully inside the safe band */}
      <g transform="translate(196 40)">
        <path d="M0,10 Q44,-2 88,10 L88,54 Q44,42 0,54 Z" fill="hsl(36 45% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.4" />
        <line x1="44" y1="5" x2="44" y2="50" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        <line x1="9" y1="21" x2="38" y2="17" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.9" />
        <line x1="9" y1="29" x2="38" y2="25" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.9" />
        <line x1="9" y1="37" x2="38" y2="33" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.9" />
        <line x1="50" y1="17" x2="79" y2="21" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.9" />
        <line x1="50" y1="25" x2="79" y2="29" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.9" />
        <line x1="50" y1="33" x2="79" y2="37" stroke="hsl(350 50% 22% / 0.4)" strokeWidth="0.9" />
        {/* Gentle book shadow */}
        <ellipse cx="44" cy="58" rx="52" ry="4" fill="hsl(350 45% 30% / 0.08)" />
      </g>
      {/* Ink swirls balanced left and right */}
      <path d="M60,58 Q76,66 68,80 Q60,92 78,94" fill="none" stroke="hsl(350 55% 40%)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="82" cy="96" r="2" fill="hsl(350 55% 40%)" />
      <path d="M400,62 Q386,70 394,84 Q402,94 386,96" fill="none" stroke="hsl(350 55% 40%)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="382" cy="98" r="2" fill="hsl(350 55% 40%)" />
      {/* Small fir silhouettes on the mist line */}
      <g fill="hsl(145 22% 45%)" opacity="0.75">
        <polygon points="128,96 134,82 140,96" />
        <polygon points="330,94 336,80 342,94" />
      </g>
    </svg>
  );
}

function StampVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 128" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <CardSky id="stampSky" />
      </defs>
      <rect width="480" height="128" fill="url(#stampSky)" />
      {/* Horizon water band */}
      <rect y="96" width="480" height="32" fill="hsl(220 30% 78%)" opacity="0.45" />
      <rect y="98" width="480" height="1.5" fill="hsl(45 80% 90% / 0.6)" />
      {/* Postcard stamp, centred */}
      <g transform="translate(204 18)">
        <rect x="0" y="0" width="72" height="92" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" strokeDasharray="2.4 1.8" />
        <g transform="translate(36 34)">
          <circle r="4" fill="hsl(340 60% 60%)" />
          <circle cx="-8" cy="-4" r="3.2" fill="hsl(340 65% 70%)" />
          <circle cx="8" cy="-4" r="3.2" fill="hsl(340 65% 70%)" />
          <circle cx="-6" cy="7" r="3" fill="hsl(340 70% 78%)" />
          <circle cx="6" cy="7" r="3" fill="hsl(340 70% 78%)" />
          <line x1="0" y1="7" x2="0" y2="26" stroke="hsl(145 30% 38%)" strokeWidth="1.3" />
          <path d="M0,16 Q-7,14 -9,21" stroke="hsl(145 30% 38%)" strokeWidth="1" fill="none" />
          <path d="M0,20 Q7,18 9,25" stroke="hsl(145 30% 38%)" strokeWidth="1" fill="none" />
        </g>
        <text x="36" y="84" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="7" fontFamily="Fraunces, serif" fontWeight="700" letterSpacing="1.5">
          NORSKLY
        </text>
      </g>
      {/* Balancing script flourishes */}
      <path d="M70,64 Q92,54 96,70" fill="none" stroke="hsl(350 45% 45%)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M410,64 Q388,54 384,70" fill="none" stroke="hsl(350 45% 45%)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Tiny sailboat on the water */}
      <g transform="translate(120 90)">
        <polygon points="0,0 7,-12 7,0" fill="hsl(36 45% 92%)" stroke="hsl(350 50% 22%)" strokeWidth="0.6" />
        <line x1="-4" y1="0" x2="10" y2="0" stroke="hsl(220 25% 22%)" strokeWidth="1.1" />
      </g>
      <g transform="translate(352 90)">
        <polygon points="0,0 7,-12 7,0" fill="hsl(36 45% 92%)" stroke="hsl(350 50% 22%)" strokeWidth="0.6" />
        <line x1="-4" y1="0" x2="10" y2="0" stroke="hsl(220 25% 22%)" strokeWidth="1.1" />
      </g>
    </svg>
  );
}

function SpeechVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 128" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <CardSky id="speechSky" />
      </defs>
      <rect width="480" height="128" fill="url(#speechSky)" />
      {/* Full-width fjord silhouette */}
      <path d="M0,104 L60,88 L120,98 L190,80 L250,94 L320,78 L390,96 L440,86 L480,96 L480,128 L0,128 Z" fill="hsl(215 25% 40% / 0.55)" />
      <rect y="108" width="480" height="20" fill="hsl(220 30% 62%)" opacity="0.5" />
      {/* Speech bubbles, centred and inside the safe band */}
      <g>
        <ellipse cx="170" cy="56" rx="40" ry="24" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <polygon points="156,77 161,90 174,77" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <text x="170" y="62" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="17" fontFamily="Instrument Serif, serif" fontStyle="italic">…</text>
      </g>
      <g>
        <ellipse cx="310" cy="48" rx="34" ry="20" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <polygon points="322,66 318,76 306,66" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <text x="310" y="54" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="12" fontFamily="Instrument Serif, serif" fontStyle="italic">?</text>
      </g>
      {/* Cabin accents on the far shore */}
      <g>
        <rect x="392" y="92" width="14" height="10" fill="hsl(8 65% 45%)" />
        <polygon points="392,92 399,86 406,92" fill="hsl(220 25% 22%)" />
        <rect x="412" y="94" width="12" height="8" fill="hsl(42 75% 60%)" />
        <polygon points="412,94 418,89 424,94" fill="hsl(220 25% 22%)" />
      </g>
    </svg>
  );
}

function CabinsVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 128" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <CardSky id="cabinSky" />
        <linearGradient id="cabinMt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(215 25% 40%)" />
          <stop offset="100%" stopColor="hsl(145 22% 30%)" />
        </linearGradient>
        <linearGradient id="cabinWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(340 35% 74%)" />
          <stop offset="100%" stopColor="hsl(220 30% 58%)" />
        </linearGradient>
      </defs>
      <rect width="480" height="128" fill="url(#cabinSky)" />
      {/* Far range */}
      <path d="M0,92 L50,72 L100,82 L160,58 L220,80 L280,62 L340,84 L400,68 L480,88 L480,100 L0,100 Z" fill="hsl(220 18% 55% / 0.7)" />
      {/* Near peak */}
      <path d="M120,100 L170,74 L205,42 L245,74 L280,52 L330,90 L360,100 Z" fill="url(#cabinMt)" />
      {/* Water */}
      <rect y="98" width="480" height="30" fill="url(#cabinWater)" />
      <rect y="102" width="480" height="1" fill="hsl(45 80% 90% / 0.5)" />
      {/* Rorbuer row along the shore */}
      <g>
        {[40, 70, 102, 136, 372, 402, 434].map((x, i) => {
          const colors = ["hsl(8 65% 45%)", "hsl(42 75% 60%)", "hsl(8 60% 42%)", "hsl(42 70% 58%)", "hsl(8 65% 45%)", "hsl(42 70% 60%)", "hsl(8 60% 42%)"];
          return (
            <g key={i}>
              <rect x={x} y={88} width="14" height="10" fill={colors[i]} />
              <polygon points={`${x},88 ${x + 7},82 ${x + 14},88`} fill="hsl(220 25% 22%)" />
            </g>
          );
        })}
      </g>
      {/* Pier reflections */}
      <g stroke="hsl(220 25% 22% / 0.5)" strokeWidth="1">
        <line x1="47" y1="100" x2="47" y2="108" />
        <line x1="109" y1="100" x2="109" y2="108" />
        <line x1="409" y1="100" x2="409" y2="108" />
      </g>
      {/* Tiny sailboat */}
      <g transform="translate(240 104)">
        <polygon points="0,0 8,-14 8,0" fill="hsl(36 45% 92%)" stroke="hsl(350 50% 22%)" strokeWidth="0.6" />
        <line x1="-4" y1="0" x2="10" y2="0" stroke="hsl(220 25% 22%)" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/**
 * Wide full-width scene for the "Razgovor sa profesorom" card.
 * Fjord backdrop with a warm video-call frame at the centre: a friendly
 * mentor waving on screen, flanked by chat bubbles — all inside the safe band.
 */
function TeacherVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 880 146" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="teacherSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(18 75% 88%)" />
          <stop offset="40%" stopColor="hsl(340 55% 90%)" />
          <stop offset="100%" stopColor="hsl(280 30% 88%)" />
        </linearGradient>
        <linearGradient id="teacherMt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(215 25% 42%)" />
          <stop offset="100%" stopColor="hsl(145 22% 30%)" />
        </linearGradient>
        <linearGradient id="teacherWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(340 35% 74%)" />
          <stop offset="100%" stopColor="hsl(220 30% 58%)" />
        </linearGradient>
      </defs>
      <rect width="880" height="146" fill="url(#teacherSky)" />
      {/* Distant range across the whole card */}
      <path d="M0,104 L70,84 L140,94 L220,70 L300,92 L380,72 L440,84 L520,66 L600,90 L680,74 L760,94 L830,82 L880,92 L880,112 L0,112 Z" fill="hsl(220 18% 55% / 0.65)" />
      {/* Water */}
      <rect y="112" width="880" height="34" fill="url(#teacherWater)" />
      <rect y="116" width="880" height="1.5" fill="hsl(45 80% 90% / 0.5)" />
      {/* Video-call frame, centred */}
      <g transform="translate(340 22)">
        {/* Screen */}
        <rect x="0" y="0" width="200" height="86" rx="10" fill="hsl(36 45% 96%)" stroke="hsl(350 50% 22%)" strokeWidth="1.6" />
        <rect x="6" y="6" width="188" height="74" rx="7" fill="hsl(340 55% 90%)" />
        {/* Mentor on screen */}
        <g>
          {/* Shoulders */}
          <path d="M66,80 Q100,56 134,80 L134,80 L66,80 Z" fill="hsl(350 50% 24%)" />
          <circle cx="100" cy="44" r="18" fill="hsl(30 55% 82%)" stroke="hsl(350 50% 22%)" strokeWidth="1.2" />
          {/* Hair bun */}
          <circle cx="116" cy="30" r="7" fill="hsl(350 45% 26%)" />
          <path d="M82,42 Q80,22 100,24 Q120,22 118,42" fill="hsl(350 45% 26%)" />
          {/* Smile + eyes */}
          <circle cx="94" cy="42" r="1.6" fill="hsl(350 50% 22%)" />
          <circle cx="106" cy="42" r="1.6" fill="hsl(350 50% 22%)" />
          <path d="M94,50 Q100,54 106,50" fill="none" stroke="hsl(350 50% 22%)" strokeWidth="1.4" strokeLinecap="round" />
          {/* Waving hand */}
          <path d="M126,64 Q136,54 134,44" fill="none" stroke="hsl(350 50% 22%)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="134" cy="41" r="4" fill="hsl(30 55% 82%)" stroke="hsl(350 50% 22%)" strokeWidth="1" />
        </g>
        {/* Status bar dots */}
        <circle cx="178" cy="14" r="3" fill="hsl(145 30% 55%)" />
        <rect x="14" y="14" width="30" height="8" rx="4" fill="hsl(350 50% 30% / 0.15)" />
        {/* Desk stand */}
        <rect x="92" y="86" width="16" height="8" fill="hsl(350 50% 30%)" />
        <rect x="72" y="94" width="56" height="5" rx="2.5" fill="hsl(350 50% 24%)" />
      </g>
      {/* Chat bubbles flanking the screen */}
      <g>
        <ellipse cx="286" cy="52" rx="30" ry="18" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <polygon points="298,68 294,78 282,68" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <text x="286" y="57" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="11" fontFamily="Instrument Serif, serif" fontStyle="italic">Hei!</text>
      </g>
      <g>
        <ellipse cx="594" cy="46" rx="30" ry="18" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <polygon points="582,62 578,72 566,62" fill="hsl(36 50% 97%)" stroke="hsl(350 50% 22%)" strokeWidth="1.1" />
        <text x="594" y="51" textAnchor="middle" fill="hsl(350 50% 22%)" fontSize="10" fontFamily="Instrument Serif, serif" fontStyle="italic">Ja!</text>
      </g>
      {/* Rorbuer accents on the near shore */}
      <g>
        <rect x="80" y="100" width="18" height="12" fill="hsl(8 65% 45%)" />
        <polygon points="80,100 89,93 98,100" fill="hsl(220 25% 22%)" />
        <rect x="104" y="102" width="16" height="10" fill="hsl(42 75% 60%)" />
        <polygon points="104,102 112,96 120,102" fill="hsl(220 25% 22%)" />
        <rect x="760" y="100" width="18" height="12" fill="hsl(8 65% 45%)" />
        <polygon points="760,100 769,93 778,100" fill="hsl(220 25% 22%)" />
        <rect x="784" y="102" width="16" height="10" fill="hsl(42 75% 60%)" />
        <polygon points="784,102 792,96 800,102" fill="hsl(220 25% 22%)" />
      </g>
      {/* Pier reflections */}
      <g stroke="hsl(220 25% 22% / 0.5)" strokeWidth="1">
        <line x1="92" y1="114" x2="92" y2="122" />
        <line x1="112" y1="114" x2="112" y2="122" />
        <line x1="772" y1="114" x2="772" y2="122" />
      </g>
      {/* Tiny sailboat */}
      <g transform="translate(690 118)">
        <polygon points="0,0 8,-14 8,0" fill="hsl(36 45% 92%)" stroke="hsl(350 50% 22%)" strokeWidth="0.6" />
        <line x1="-4" y1="0" x2="10" y2="0" stroke="hsl(220 25% 22%)" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
