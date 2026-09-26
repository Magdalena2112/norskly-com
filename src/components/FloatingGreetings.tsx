import { useEffect, useRef } from "react";
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Briefcase, GraduationCap, Languages, Luggage, MapPin, Stethoscope } from "lucide-react";

type Bubble = {
  text?: string;
  icon?: LucideIcon;
  top: string;
  left: string;
  rotate: number;
  scale: number;
  variant: "primary" | "accent" | "secondary" | "sage" | "cream";
  delay: number;
  duration: number;
  depth: number; // 0.2 (far) → 1.2 (near) for parallax
  font?: "display" | "script" | "sans";
};

// Kratke reči vezane za Norskly koncept: jezik, posao, preseljenje,
// zdravstvo i studije — mešavina norveškog, nemačkog i engleskog.
const BUBBLES: Bubble[] = [
  { text: "Norsk",        top: "8%",  left: "5%",  rotate: -8, scale: 1.0,  variant: "secondary", delay: 0.0, duration: 7,   depth: 1.1, font: "script" },
  { icon: GraduationCap, text: "Study", top: "14%", left: "80%", rotate: 6, scale: 1.1, variant: "accent", delay: 0.4, duration: 8, depth: 1.2, font: "display" },
  { text: "Jobb",         top: "68%", left: "4%",  rotate: -5, scale: 1.0,  variant: "cream",     delay: 0.8, duration: 9,   depth: 0.9, font: "display" },
  { icon: Briefcase, text: "Arbeit", top: "60%", left: "84%", rotate: 9, scale: 1.0, variant: "primary", delay: 0.2, duration: 7.5, depth: 1.0, font: "sans" },
  { icon: Stethoscope, text: "Lege", top: "30%", left: "-3%", rotate: -4, scale: 0.95, variant: "sage", delay: 1.0, duration: 8.5, depth: 0.7, font: "sans" },
  { text: "Visa",         top: "40%", left: "90%", rotate: 7,  scale: 0.95, variant: "secondary", delay: 0.6, duration: 7.2, depth: 0.8, font: "display" },
  { text: "Deutsch",      top: "4%",  left: "42%", rotate: -3, scale: 0.85, variant: "sage",      delay: 1.4, duration: 7.8, depth: 0.45, font: "display" },
  { icon: MapPin, text: "Bolig", top: "52%", left: "-4%", rotate: 5, scale: 0.85, variant: "primary", delay: 1.6, duration: 8.4, depth: 0.5, font: "script" },
  { text: "Karriere",     top: "84%", left: "66%", rotate: -6, scale: 0.9,  variant: "accent",    delay: 1.2, duration: 8.2, depth: 0.6, font: "script" },
  { text: "Språk",        top: "82%", left: "30%", rotate: 4,  scale: 0.9,  variant: "cream",     delay: 0.5, duration: 9,   depth: 0.55, font: "script" },
  { icon: Luggage,        top: "90%", left: "10%", rotate: -7, scale: 0.85, variant: "accent",    delay: 0.9, duration: 9.2, depth: 0.35, font: "sans" },
  { text: "Learn",        top: "22%", left: "26%", rotate: 8,  scale: 0.8,  variant: "secondary", delay: 1.8, duration: 7.6, depth: 0.35, font: "display" },
  { icon: Languages,      top: "46%", left: "74%", rotate: 3,  scale: 0.8,  variant: "sage",      delay: 1.1, duration: 8.8, depth: 0.4, font: "display" },
];

const variantClasses: Record<Bubble["variant"], string> = {
  primary:   "bg-primary text-primary-foreground border-primary/30",
  accent:    "bg-accent text-accent-foreground border-accent/40",
  secondary: "bg-secondary text-secondary-foreground border-secondary/50",
  sage:      "bg-[hsl(var(--sage)/0.85)] text-primary border-[hsl(var(--sage)/0.4)]",
  cream:     "bg-card text-primary border-border",
};

const fontClasses = {
  display: "font-display font-black",
  script:  "font-script",
  sans:    "font-sans font-semibold",
};

const MAX_PARALLAX = 40;

const BubbleItem = ({ b, smx, smy }: { b: Bubble; smx: MotionValue<number>; smy: MotionValue<number> }) => {
  const tx = useTransform(smx, (v) => -v * MAX_PARALLAX * b.depth);
  const ty = useTransform(smy, (v) => -v * MAX_PARALLAX * b.depth);

  const opacity = 0.55 + b.depth * 0.4;
  const blurPx = Math.max(0, (1.0 - b.depth) * 1.6);

  const Icon = b.icon;

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        top: b.top,
        left: b.left,
        x: tx,
        y: ty,
        opacity,
        filter: `blur(${blurPx}px)`,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity, scale: 1 }}
      transition={{ delay: b.delay, duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        animate={{
          y: [0, -14, 0],
          rotate: [b.rotate, b.rotate + (b.rotate > 0 ? 2 : -2), b.rotate],
        }}
        transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        style={{ transform: `scale(${b.scale})` }}
        className={
          Icon && !b.text
            ? `relative inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-card-soft ${variantClasses[b.variant]}`
            : `relative inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border shadow-card-soft ${variantClasses[b.variant]}`
        }
      >
        {Icon && <Icon className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />}
        {b.text && (
          <span className={`text-base md:text-xl ${fontClasses[b.font ?? "display"]} tracking-tight whitespace-nowrap`}>
            {b.text}
          </span>
        )}
        {b.text && (
          <span
            className={`absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-r border-b ${variantClasses[b.variant]}`}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export const FloatingGreetings = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Soft, lagging spring for elegant parallax
  const smx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mx.set((e.clientX - cx) / (rect.width / 2));
      my.set((e.clientY - cy) / (rect.height / 2));
    };
    const handleLeave = () => {
      mx.set(0);
      my.set(0);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [mx, my]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {BUBBLES.map((b, i) => (
        <BubbleItem key={i} b={b} smx={smx} smy={smy} />
      ))}
    </div>
  );
};

export default FloatingGreetings;
