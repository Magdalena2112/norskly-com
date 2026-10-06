import { LANGUAGES } from "@/lib/languages";

export type LangFilter = "all" | "no" | "en" | "de";

export function langMeta(code?: string | null) {
  const l = LANGUAGES.find((x) => x.code === code);
  return l ? { flag: l.flag, label: l.label } : { flag: "🌍", label: code || "—" };
}

export function LangBadge({ code }: { code?: string | null }) {
  const m = langMeta(code);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground whitespace-nowrap">
      <span>{m.flag}</span>
      <span className="hidden sm:inline">{m.label}</span>
    </span>
  );
}

export default function LanguageFilter({
  value,
  onChange,
  available,
}: {
  value: LangFilter;
  onChange: (v: LangFilter) => void;
  available?: string[];
}) {
  const opts: { v: LangFilter; label: string }[] = [
    { v: "all", label: "Svi jezici" },
    ...LANGUAGES.filter((l) => !available || available.includes(l.code)).map((l) => ({
      v: l.code as LangFilter,
      label: `${l.flag} ${l.label}`,
    })),
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${
            value === o.v
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background/80 text-foreground border-border hover:border-primary/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
