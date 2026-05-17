import { motion } from "framer-motion";

type Bubble = {
  text: string;
  // position in %
  top: string;
  left: string;
  rotate: number;
  scale: number;
  variant: "primary" | "accent" | "secondary" | "sage" | "cream";
  delay: number;
  duration: number;
  font?: "display" | "script" | "sans";
};

const BUBBLES: Bubble[] = [
  { text: "Hei",       top: "8%",  left: "6%",  rotate: -8, scale: 1.0, variant: "secondary", delay: 0.0, duration: 7, font: "script" },
  { text: "Hallo",     top: "14%", left: "82%", rotate: 6,  scale: 1.1, variant: "accent",    delay: 0.4, duration: 8, font: "display" },
  { text: "Hello",     top: "70%", left: "4%",  rotate: -5, scale: 1.0, variant: "cream",     delay: 0.8, duration: 9, font: "display" },
  { text: "Ciao",      top: "62%", left: "84%", rotate: 9,  scale: 1.0, variant: "primary",   delay: 0.2, duration: 7.5, font: "script" },
  { text: "Bonjour",   top: "30%", left: "-2%", rotate: -4, scale: 0.95, variant: "sage",     delay: 1.0, duration: 8.5, font: "script" },
  { text: "Hola",      top: "38%", left: "90%", rotate: 7,  scale: 0.95, variant: "secondary",delay: 0.6, duration: 7.2, font: "display" },
  { text: "Privet",    top: "85%", left: "70%", rotate: -6, scale: 0.9, variant: "accent",    delay: 1.2, duration: 8.2, font: "script" },
  { text: "Namaste",   top: "82%", left: "32%", rotate: 4,  scale: 0.9, variant: "cream",     delay: 0.5, duration: 9, font: "script" },
  { text: "Hej",       top: "4%",  left: "44%", rotate: -3, scale: 0.85,variant: "sage",      delay: 1.4, duration: 7.8, font: "display" },
  { text: "Salam",     top: "50%", left: "-4%", rotate: 5,  scale: 0.85,variant: "primary",   delay: 1.6, duration: 8.4, font: "script" },
  { text: "Konnichiwa",top: "92%", left: "10%", rotate: -7, scale: 0.85,variant: "accent",    delay: 0.9, duration: 9.2, font: "display" },
  { text: "Tak",       top: "22%", left: "26%", rotate: 8,  scale: 0.8, variant: "secondary", delay: 1.8, duration: 7.6, font: "script" },
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

export const FloatingGreetings = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {BUBBLES.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: b.delay, duration: 0.8, ease: "easeOut" }}
          className="absolute"
          style={{ top: b.top, left: b.left, transform: `rotate(${b.rotate}deg)` }}
        >
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [0, b.rotate > 0 ? 2 : -2, 0] }}
            transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
            style={{ transform: `scale(${b.scale})` }}
            className={`relative inline-flex items-center px-5 py-2.5 rounded-full border shadow-card-soft ${variantClasses[b.variant]}`}
          >
            <span className={`text-base md:text-xl ${fontClasses[b.font ?? "display"]} tracking-tight whitespace-nowrap`}>
              {b.text}
            </span>
            {/* tail */}
            <span
              className={`absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-r border-b ${variantClasses[b.variant]}`}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingGreetings;
