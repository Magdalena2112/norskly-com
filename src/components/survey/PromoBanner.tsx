import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export default function PromoBanner() {
 const {pathname}=useLocation();
 if (!['/','/auth','/za-profesore'].includes(pathname) && !pathname.startsWith('/jezici/') && !pathname.startsWith('/relocation-hub')) return null;
 return <aside aria-label="Besplatan promo period" className="border-b border-primary/15 bg-secondary text-secondary-foreground relative z-40">
 <div className="container py-3 flex flex-col lg:flex-row items-start lg:items-center gap-3">
 <p className="text-sm leading-relaxed flex-1">Učenje jezika se prilagođava tebi. Besplatan promo period je otvoren — pomozi nam da promenimo pravila igre i kreiramo kurseve jezika koji će biti baš po tvojoj meri ✨</p>
 <Button asChild size="sm" className="shrink-0"><Link to="/#languages">Započni besplatno</Link></Button>
 </div></aside>;
}
