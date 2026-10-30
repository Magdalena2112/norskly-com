/** Small retro alarm-clock illustration (fjord body, terracotta knob). Decorative only. */
export default function RetroClock({ className = "" }: { className?: string }) {
  const nums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <svg viewBox="0 0 64 60" className={className} aria-hidden="true">
      <rect x="27" y="2" width="12" height="7" rx="3" className="fill-sunset" />
      <rect x="5" y="8" width="54" height="48" rx="12" className="fill-fjord/40" />
      <rect x="10" y="14" width="44" height="38" rx="8" className="fill-cream stroke-primary" strokeWidth="2.2" />
      {nums.map((n, i) => {
        const a = (i * 30 - 90) * (Math.PI / 180);
        return (
          <text key={n} x={32 + Math.cos(a) * 16} y={33 + Math.sin(a) * 13 + 2} fontSize="5" textAnchor="middle" className="fill-primary" fontFamily="serif">{n}</text>
        );
      })}
      <line x1="32" y1="33" x2="32" y2="21" className="stroke-primary" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="32" y1="33" x2="26" y2="41" className="stroke-primary" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="32" cy="33" r="2.6" className="fill-sunset" />
    </svg>
  );
}
