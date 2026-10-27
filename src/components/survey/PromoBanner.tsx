import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: 'smooth' });
  return true;
};

export default function PromoBanner() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  // After navigating from another page to "/#languages", scroll once content renders.
  useEffect(() => {
    if (pathname !== '/' || hash !== '#languages') return;
    let tries = 0;
    const t = window.setInterval(() => {
      if (scrollToId('languages') || ++tries > 20) window.clearInterval(t);
    }, 100);
    return () => window.clearInterval(t);
  }, [pathname, hash]);

  if (!['/', '/auth', '/za-profesore'].includes(pathname) && !pathname.startsWith('/jezici/') && !pathname.startsWith('/relocation-hub')) return null;

  const start = () => {
    if (pathname.startsWith('/jezici/') && scrollToId('courses')) return;
    if (pathname === '/' && scrollToId('languages')) return;
    navigate('/#languages');
  };

  return (
    <aside aria-label="Besplatan promo period" className="relative z-40 bg-primary text-primary-foreground border-b border-primary-foreground/10 shadow-soft">
      <div className="container py-3 sm:py-3.5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-5">
        <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-accent/60 bg-primary-foreground/10 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden />
          Besplatan promo period
        </span>
        <p className="flex-1 text-sm leading-relaxed text-primary-foreground/90">
          <span className="hidden sm:inline">Učenje jezika se prilagođava tebi. Besplatan promo period je otvoren — pomozi nam da promenimo pravila igre i kreiramo kurseve jezika koji će biti baš po tvojoj meri.</span>
          <span className="sm:hidden">Učenje se prilagođava tebi. Pomozi nam da kreiramo kurseve po tvojoj meri.</span>
        </p>
        <Button size="sm" onClick={start} className="shrink-0 rounded-full bg-background text-primary hover:bg-background/90 font-semibold px-5">
          Započni besplatno <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
