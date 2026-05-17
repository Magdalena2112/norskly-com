import { motion } from "framer-motion";
import avatarSrc from "@/assets/teacher-avatar.png";

/**
 * Animated AI teacher avatar.
 *  - Whole figure has a gentle idle float.
 *  - Right hand (isolated via radial mask) waves periodically.
 *  - A soft "Hei!" speech bubble fades in synced with the wave.
 *  - Respects prefers-reduced-motion.
 */
export default function TeacherAvatar() {
  // Approximate hand location in the source image (percentages).
  // The waving hand sits in the upper-right; wrist is below it.
  const HAND_CENTER = { x: "78%", y: "42%" };
  const WRIST = { x: "70%", y: "60%" };

  // Mask that hides the hand area (used on the base/body layer).
  const bodyMask = `radial-gradient(circle at ${HAND_CENTER.x} ${HAND_CENTER.y}, transparent 0, transparent 16%, black 26%)`;
  // Mask that shows only the hand area (used on the hand layer).
  const handMask = `radial-gradient(circle at ${HAND_CENTER.x} ${HAND_CENTER.y}, black 0, black 15%, transparent 24%)`;

  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Ambient halo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[85%] aspect-square rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />
      </div>
      <div className="pointer-events-none absolute -bottom-10 left-1/4 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />

      {/* Floating container */}
      <motion.div
        className="relative w-[78%] max-w-md aspect-[4/5] motion-reduce:!transform-none"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Body layer (hand area masked out) */}
        <img
          src={avatarSrc}
          alt="AI nastavnik koji pozdravlja"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{
            WebkitMaskImage: bodyMask,
            maskImage: bodyMask,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />

        {/* Hand layer (only hand visible, rotates around wrist) */}
        <motion.img
          src={avatarSrc}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none motion-reduce:!transform-none"
          style={{
            WebkitMaskImage: handMask,
            maskImage: handMask,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            transformOrigin: `${WRIST.x} ${WRIST.y}`,
          }}
          animate={{ rotate: [0, -14, 8, -12, 6, -8, 0] }}
          transition={{
            duration: 1.8,
            times: [0, 0.18, 0.34, 0.5, 0.66, 0.82, 1],
            repeat: Infinity,
            repeatDelay: 3.2,
            ease: "easeInOut",
          }}
        />

        {/* "Hei!" speech bubble */}
        <motion.div
          className="absolute top-[18%] right-[-2%] md:right-[-6%] motion-reduce:hidden"
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4], scale: [0.9, 1, 1, 0.95] }}
          transition={{
            duration: 2.4,
            times: [0, 0.2, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 2.6,
            ease: "easeOut",
          }}
        >
          <div className="relative rounded-2xl bg-background/90 backdrop-blur-sm border border-border/60 shadow-soft px-4 py-2">
            <span className="font-script text-primary text-xl leading-none">Hei!</span>
            <span className="absolute -bottom-1.5 left-5 w-3 h-3 bg-background/90 border-b border-r border-border/60 rotate-45" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
