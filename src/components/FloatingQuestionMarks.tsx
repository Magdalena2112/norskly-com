import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

type Mark = {
  top: string;
  left: string;
  size: number; // in rem
  rotate: number;
  variant: "filled" | "outline";
  tone: "plum" | "pink" | "sage";
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
  drift: number; // vertical px
  parallax: number; // -1..1 multiplier
};

const MARKS: Mark[] = [
  // Large one behind the title
  { top: "-2%",  left: "50%", size: 18, rotate: -6,  variant: "filled",  tone: "pink", opacity: 0.10, blur: 1.5, duration: 14, delay: 0,   drift: 18, parallax: -0.25 },
  // Behind left card
  { top: "42%",  left: "8%",  size: 11, rotate: 10,  variant: "outline", tone: "plum", opacity: 0.16, blur: 0.5, duration: 11, delay: 1.2, drift: 14, parallax: 0.15 },
  // Behind right card
  { top: "48%",  left: "82%", size: 13, rotate: -14, variant: "filled",  tone: "plum", opacity: 0.09, blur: 1.0, duration: 13, delay: 0.6, drift: 16, parallax: 0.2 },
  // Small accent top-right
  { top: "8%",   left: "82%", size: 5,  rotate: 18,  variant: "outline", tone: "sage", opacity: 0.22, blur: 0,   duration: 9,  delay: 0.4, drift: 10, parallax: -0.1 },
  // Small accent bottom-left
  { top: "78%",  left: "18%", size: 6,  rotate: -22, variant: "filled",  tone: "pink", opacity: 0.18, blur: 0.3, duration: 10, delay: 1.8, drift: 12, parallax: -0.15 },
  // Tiny mid-top
  { top: "4%",   left: "14%", size: 4,  rotate: 8,   variant: "outline", tone: "plum", opacity: 0.18, blur: 0,   duration: 8,  delay: 0.9, drift: 8,  parallax: 0.1 },
];

const toneColor = (t: Mark["tone"]) =>
  t === "plum" ? "hsl(var(--primary))" : t === "pink" ? "hsl(var(--accent))" : "hsl(var(--sage))";

const QuestionGlyph = ({ m }: { m: Mark }) => {
  const color = toneColor(m.tone);
  const style: React.CSSProperties = {
    fontFamily: "'Fraunces', 'Playfair Display', serif",
    fontWeight: 900,
    fontSize: `${m.size}rem`,
    lineHeight: 1,
    color: m.variant === "filled" ? color : "transparent",
    WebkitTextStroke: m.variant === "outline" ? `2px ${color}` : undefined,
    userSelect: "none",
  };
  return <span style={style}>?</span>;
};

export const FloatingQuestionMarks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {/* Soft grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--primary) / 0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      {MARKS.map((m, i) => {
        // parallax: each mark gets its own transform tied to scroll progress
        const y = useTransform(scrollYProgress, [0, 1], [60 * m.parallax, -60 * m.parallax]);
        return (
          <motion.div
            key={i}
            className="absolute will-change-transform"
            style={{
              top: m.top,
              left: m.left,
              translateX: "-50%",
              y,
              filter: `blur(${m.blur}px)`,
              opacity: m.opacity,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: m.opacity }}
            transition={{ duration: 1.2, delay: m.delay }}
          >
            <motion.div
              animate={{
                y: [0, -m.drift, 0],
                rotate: [m.rotate, m.rotate + (m.rotate > 0 ? 3 : -3), m.rotate],
                opacity: [m.opacity, m.opacity * 1.35, m.opacity],
              }}
              transition={{
                duration: m.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: m.delay,
              }}
            >
              <QuestionGlyph m={m} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingQuestionMarks;
