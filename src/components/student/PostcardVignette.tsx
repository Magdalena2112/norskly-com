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
 * Minimal line drawing in the shared card palette: mentor and student
 * facing each other across a small table, with a shared open book and
 * word-free speech bubbles, so it works for every language.
 */
function TeacherVignette({ className }: { className?: string }) {
  const ink = "hsl(350 50% 22%)";
  const paper = "hsl(36 50% 97%)";
  const skin = "hsl(30 55% 84%)";
  return (
    <svg viewBox="0 0 880 146" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <CardSky id="teacherSky" />
        <linearGradient id="teacherMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(350 40% 88%)" />
          <stop offset="100%" stopColor="hsl(36 45% 95%)" />
        </linearGradient>
      </defs>
      <rect width="880" height="146" fill="url(#teacherSky)" />
      <path d="M0,112 Q220,100 440,112 T880,108 L880,146 L0,146 Z" fill="url(#teacherMist)" opacity="0.85" />
      <path d="M0,122 C160,110 280,130 440,122 C600,114 720,132 880,120" fill="none" stroke="hsl(350 45% 40% / 0.3)" strokeWidth="1.2" strokeDasharray="1 6" strokeLinecap="round" />

      <g transform="translate(440 0)" stroke={ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {/* Table */}
        <line x1="-90" y1="104" x2="90" y2="104" strokeWidth="1.8" />
        <line x1="-70" y1="104" x2="-70" y2="122" />
        <line x1="70" y1="104" x2="70" y2="122" />
        {/* Shared open book */}
        <path d="M-26,102 Q-13,96 0,100 Q13,96 26,102 L26,104 L-26,104 Z" fill={paper} strokeWidth="1.1" />
        <line x1="0" y1="99" x2="0" y2="104" strokeWidth="0.9" />

        {/* Mentor (left) */}
        <path d="M-118,104 Q-118,74 -96,72 Q-74,74 -74,104 Z" fill="hsl(145 22% 42%)" />
        <circle cx="-96" cy="56" r="13" fill={skin} />
        <path d="M-109,54 Q-108,40 -96,41 Q-83,40 -83,52 Q-92,46 -109,54 Z" fill="hsl(350 45% 26%)" />
        <path d="M-80,86 Q-60,84 -34,98" fill="none" strokeWidth="1.6" />

        {/* Student (right) */}
        <path d="M74,104 Q74,76 96,74 Q118,76 118,104 Z" fill="hsl(215 28% 55%)" />
        <circle cx="96" cy="58" r="12" fill={skin} />
        <path d="M84,56 Q85,44 96,44 Q108,44 108,56 Q100,50 84,56 Z" fill="hsl(25 40% 35%)" />
        <path d="M80,88 Q62,90 40,99" fill="none" strokeWidth="1.6" />
      </g>

      {/* Word-free speech bubbles */}
      <g stroke={ink} strokeWidth="1.1" strokeLinejoin="round">
        <rect x="290" y="22" width="56" height="30" rx="15" fill={paper} />
        <path d="M318,52 L322,62 L328,52" fill={paper} />
        <g fill={ink} stroke="none">
          <circle cx="306" cy="37" r="2.4" /><circle cx="318" cy="37" r="2.4" /><circle cx="330" cy="37" r="2.4" />
        </g>
        <rect x="534" y="26" width="48" height="28" rx="14" fill={paper} />
        <path d="M550,54 L548,64 L560,54" fill={paper} />
        <path d="M548,40 L555,46 L568,34" fill="none" stroke="hsl(145 30% 38%)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Balancing ink swirls */}
      <path d="M150,64 Q166,72 158,86 Q150,98 168,100" fill="none" stroke="hsl(350 55% 40%)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="172" cy="102" r="2" fill="hsl(350 55% 40%)" />
      <path d="M730,64 Q714,72 722,86 Q730,98 712,100" fill="none" stroke="hsl(350 55% 40%)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="708" cy="102" r="2" fill="hsl(350 55% 40%)" />
    </svg>
  );
}
