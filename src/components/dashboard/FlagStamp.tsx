// Vintage postage stamp with a muted flag of the language being learned.
// Flag hues are intentionally desaturated content colors (not theme tokens).
const FLAGS: Record<string, JSX.Element> = {
  no: (
    <g>
      <rect x="9" y="9" width="62" height="64" fill="#b5524f" />
      <rect x="25" y="9" width="14" height="64" fill="#f3ead9" />
      <rect x="9" y="34" width="62" height="14" fill="#f3ead9" />
      <rect x="28.5" y="9" width="7" height="64" fill="#3f5878" />
      <rect x="9" y="37.5" width="62" height="7" fill="#3f5878" />
    </g>
  ),
  de: (
    <g>
      <rect x="9" y="9" width="62" height="21.4" fill="#3a3533" />
      <rect x="9" y="30.4" width="62" height="21.3" fill="#b5524f" />
      <rect x="9" y="51.7" width="62" height="21.3" fill="#d9b25c" />
    </g>
  ),
  en: (
    <g>
      <rect x="9" y="9" width="62" height="64" fill="#3f5878" />
      <path d="M9 9 L71 73 M71 9 L9 73" stroke="#f3ead9" strokeWidth="10" />
      <path d="M9 9 L71 73 M71 9 L9 73" stroke="#b5524f" strokeWidth="3.5" />
      <rect x="33" y="9" width="14" height="64" fill="#f3ead9" />
      <rect x="9" y="34" width="62" height="14" fill="#f3ead9" />
      <rect x="36" y="9" width="8" height="64" fill="#b5524f" />
      <rect x="9" y="37" width="62" height="8" fill="#b5524f" />
    </g>
  ),
};

export default function FlagStamp({ language, className = "" }: { language: string; className?: string }) {
  const flag = FLAGS[language] ?? FLAGS.no;
  return (
    <svg aria-hidden="true" viewBox="0 0 80 96" className={className}>
      <rect x="2" y="2" width="76" height="92" rx="3" className="fill-background stroke-accent" strokeWidth="2" strokeDasharray="3 3" />
      <clipPath id={`stamp-${language}`}><rect x="9" y="9" width="62" height="64" rx="2" /></clipPath>
      <g clipPath={`url(#stamp-${language})`} opacity="0.82">{flag}</g>
      {/* postmark */}
      <g className="stroke-primary" fill="none" opacity="0.45" strokeWidth="1.2">
        <circle cx="62" cy="64" r="13" />
        <circle cx="62" cy="64" r="9.5" />
        <path d="M40 58 q5 -3 10 0 t10 0 M40 64 q5 -3 10 0 t10 0 M40 70 q5 -3 10 0 t10 0" />
      </g>
      <text x="40" y="86" textAnchor="middle" className="fill-primary" fontSize="7" fontStyle="italic">norskly</text>
    </svg>
  );
}
