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
 * Wide, language-neutral scene for the teacher-lesson card.
 * Flat pastel style: a mentor and a student sit faceless at a table with
 * a laptop, word-free speech bubbles above them, mauve mountains and a
 * sunlit window behind — universal for every language, in the platform palette.
 */
function TeacherVignette({ className }: { className?: string }) {
  const paper = "hsl(36 50% 97%)";
  const skin = "hsl(28 55% 82%)";
  const hair = "hsl(350 30% 26%)";
  const sage = "hsl(145 25% 50%)";
  const blue = "hsl(215 30% 62%)";
  const chairPink = "hsl(340 50% 80%)";

  return (
    <svg viewBox="0 0 880 146" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <CardSky id="teacherSky" />
      </defs>
      <rect width="880" height="146" fill="url(#teacherSky)" />

      {/* Soft sun */}
      <circle cx="640" cy="30" r="17" fill="hsl(45 80% 92%)" opacity="0.9" />

      {/* Mauve mountain ranges */}
      <path d="M0,96 L80,74 L160,88 L260,66 L360,86 L460,70 L560,88 L660,72 L760,90 L880,78 L880,146 L0,146 Z" fill="hsl(280 22% 76%)" opacity="0.8" />
      <path d="M0,112 L120,94 L240,108 L380,92 L520,110 L680,96 L880,114 L880,146 L0,146 Z" fill="hsl(270 20% 68%)" opacity="0.85" />

      {/* Floor band */}
      <rect y="120" width="880" height="26" fill="hsl(340 45% 91%)" />

      {/* Sunlit window on the right */}
      <g>
        <rect x="706" y="6" width="132" height="112" rx="10" fill="hsl(350 45% 94%)" />
        <circle cx="772" cy="38" r="15" fill="hsl(45 80% 90%)" />
        <path d="M706,84 L750,62 L790,80 L838,58 L838,118 L706,118 Z" fill="hsl(280 22% 78%)" opacity="0.7" />
        <line x1="772" y1="6" x2="772" y2="118" stroke="hsl(350 30% 82%)" strokeWidth="2.5" />
        <line x1="706" y1="62" x2="838" y2="62" stroke="hsl(350 30% 82%)" strokeWidth="2.5" />
      </g>

      {/* Small potted plant on the left */}
      <g>
        <rect x="86" y="106" width="18" height="13" rx="2.5" fill="hsl(8 55% 55%)" />
        <ellipse cx="95" cy="98" rx="4" ry="9" fill="hsl(145 25% 48%)" />
        <ellipse cx="88" cy="101" rx="3.4" ry="7" fill="hsl(145 25% 42%)" transform="rotate(-18 88 101)" />
        <ellipse cx="102" cy="101" rx="3.4" ry="7" fill="hsl(145 25% 42%)" transform="rotate(18 102 101)" />
      </g>
      {/* Tiny sparkle dots on the left */}
      <g fill="hsl(350 40% 60% / 0.5)">
        <circle cx="150" cy="58" r="1.4" /><circle cx="172" cy="76" r="1.2" /><circle cx="128" cy="88" r="1.2" />
      </g>

      {/* Grounding shadows */}
      <ellipse cx="316" cy="126" rx="36" ry="3.5" fill="hsl(350 40% 40% / 0.08)" />
      <ellipse cx="564" cy="126" rx="36" ry="3.5" fill="hsl(350 40% 40% / 0.08)" />
      <ellipse cx="440" cy="126" rx="72" ry="3" fill="hsl(350 40% 40% / 0.08)" />

      {/* Chairs */}
      <rect x="294" y="78" width="42" height="46" rx="9" fill={chairPink} />
      <rect x="544" y="78" width="42" height="46" rx="9" fill={chairPink} />

      {/* Mentor (left, sage sweater, gesturing) */}
      <g>
        <path d="M300,124 C300,94 308,78 322,76 C336,78 344,94 344,124 Z" fill={sage} />
        <path d="M338,86 Q356,82 364,72" fill="none" stroke={sage} strokeWidth="7" strokeLinecap="round" />
        <circle cx="367" cy="69" r="4.2" fill={skin} />
        <circle cx="324" cy="60" r="13" fill={skin} />
        <path d="M311,60 Q311,45 324,45 Q337,45 337,58 Q330,51 324,51 Q316,51 311,60 Z" fill={hair} />
      </g>

      {/* Student (right, blue sweater, hair bun) */}
      <g>
        <path d="M536,124 C536,94 544,78 558,76 C572,78 580,94 580,124 Z" fill={blue} />
        <path d="M542,88 Q530,94 524,99" fill="none" stroke={blue} strokeWidth="7" strokeLinecap="round" />
        <circle cx="521" cy="100" r="4.2" fill={skin} />
        <circle cx="556" cy="60" r="13" fill={skin} />
        <path d="M543,58 Q543,45 556,45 Q569,45 569,58 Q562,51 556,51 Q549,51 543,58 Z" fill={hair} />
        <circle cx="556" cy="43" r="5.5" fill={hair} />
      </g>

      {/* Table */}
      <rect x="352" y="100" width="176" height="5" rx="2.5" fill={paper} />
      <rect x="370" y="105" width="4" height="19" rx="2" fill="hsl(350 25% 62%)" />
      <rect x="506" y="105" width="4" height="19" rx="2" fill="hsl(350 25% 62%)" />

      {/* Book stack */}
      <rect x="382" y="94.5" width="24" height="3" rx="1.5" fill="hsl(8 60% 55%)" />
      <rect x="385" y="91" width="18" height="3" rx="1.5" fill="hsl(42 70% 60%)" />

      {/* Laptop with a soft pink screen */}
      <rect x="424" y="76" width="34" height="24" rx="2.5" fill="hsl(220 15% 72%)" />
      <rect x="427" y="79" width="28" height="18" rx="1.5" fill="hsl(340 55% 84%)" />
      <rect x="418" y="100" width="46" height="3.5" rx="1.75" fill="hsl(220 15% 68%)" />

      {/* Word-free speech bubbles */}
      <g>
        <rect x="336" y="12" width="54" height="27" rx="13.5" fill={paper} />
        <path d="M354,39 L358,49 L366,39 Z" fill={paper} />
        <g fill="hsl(350 45% 38%)">
          <circle cx="351" cy="25.5" r="2.6" /><circle cx="363" cy="25.5" r="2.6" /><circle cx="375" cy="25.5" r="2.6" />
        </g>
        <rect x="488" y="16" width="50" height="27" rx="13.5" fill={paper} />
        <path d="M504,43 L500,53 L512,43 Z" fill={paper} />
        <path d="M500,29.5 L506,35.5 L518,23.5" fill="none" stroke="hsl(145 30% 40%)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
