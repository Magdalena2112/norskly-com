import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";
import { LANGUAGES, type LanguageSlug } from "@/lib/languages";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";

export default function LanguageSwitcher() {
  const { slug, setLanguage } = useSelectedLanguage();
  const current = LANGUAGES.find((l) => l.slug === slug) || LANGUAGES[0];
  const navigate = useNavigate();
  const location = useLocation();

  const onPick = (next: LanguageSlug) => {
    if (next === slug) return;
    setLanguage(next);
    // If on the dashboard, push the matching /ucenje/<slug> URL so it's visible.
    if (location.pathname === "/practice" || location.pathname.startsWith("/ucenje/")) {
      navigate(`/ucenje/${next}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full border-border/60 bg-cream/80 hover:bg-cream"
        >
          <Globe className="w-3.5 h-3.5 text-primary/70" />
          <span aria-hidden>{current.flag}</span>
          <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.slug}
            onClick={() => l.available && onPick(l.slug)}
            disabled={!l.available}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{l.flag}</span>
              <span className="text-sm">{l.label}</span>
              {!l.available && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  uskoro
                </span>
              )}
            </span>
            {l.slug === slug && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
