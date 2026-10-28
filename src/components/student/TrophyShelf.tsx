import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Lesson = { id: string; sort_order: number; title_target: string };

// Compact shelf with 12 slots per CEFR level; a slot glows once the lesson's review is passed.
export default function TrophyShelf({ level, lessons, won }: { level: string; lessons: Lesson[]; won: Set<string> }) {
  const navigate = useNavigate();
  const bySlot = new Map(lessons.map((l) => [l.sort_order, l]));
  const count = lessons.filter((l) => won.has(l.id)).length;
  return (
    <div className="mt-4 rounded-2xl border border-border/50 bg-cream/80 backdrop-blur-md shadow-card-soft px-4 py-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-script italic text-xs text-primary/70">Trofeji nivoa {level}</p>
        <p className="text-xs font-medium text-primary">{count} / 12</p>
      </div>
      <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end pb-1 border-b-2 border-primary/15">
        {Array.from({ length: 12 }, (_, i) => {
          const l = bySlot.get(i + 1);
          const ok = l && won.has(l.id);
          return (
            <button
              key={i}
              type="button"
              disabled={!l}
              onClick={() => l && navigate(`/lekcija/${l.id}`)}
              title={l ? `Lekcija ${i + 1}: ${l.title_target}${ok ? " · trofej osvojen" : ""}` : `Lekcija ${i + 1} · uskoro`}
              aria-label={`Lekcija ${i + 1}${ok ? ", trofej osvojen" : ""}`}
              className="flex flex-col items-center gap-0.5 disabled:cursor-default"
            >
              <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${ok ? "text-sunset drop-shadow-sm hover:scale-110" : "text-primary/15"}`} />
              <span className={`text-[9px] sm:text-[10px] ${ok ? "text-primary" : "text-primary/30"}`}>{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
