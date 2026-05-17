import { motion } from "framer-motion";
import avatarSrc from "@/assets/teacher-avatar.png";

/**
 * Animated AI teacher avatar.
 *  - Gentle idle float + subtle sway (no image cropping/masking).
 *  - Periodic "wave" effect via micro-tilt around bottom-center, paired with
 *    a soft scale pulse that reads as a friendly hand wave.
 *  - "Hei!" speech bubble fades in synced with the wave.
 *  - Respects prefers-reduced-motion.
 */
export default function TeacherAvatar() {
  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Ambient halo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[80%] aspect-square rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />
      </div>
      <div className="pointer-events-none absolute -bottom-10 left-1/4 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />

      {/* Floating + gently swaying container */}
      <motion.div
        className="relative w-[82%] max-w-md aspect-[4/5] motion-reduce:!transform-none"
        animate={{ y: [0, -10, 0], rotate: [-1.2, 1.2, -1.2] }}
        transition={{
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ transformOrigin: "50% 90%" }}
      >
        {/* Wave pulse layer — periodic playful tilt that suggests a wave */}
        <motion.img
          src={avatarSrc}
          alt="AI nastavnik koji pozdravlja"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none motion-reduce:!transform-none"
          style={{ transformOrigin: "50% 95%" }}
          animate={{ rotate: [0, -3, 2.5, -2, 1.5, 0], scale: [1, 1.012, 1, 1.008, 1, 1] }}
          transition={{
            duration: 2,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 3.4,
            ease: "easeInOut",
          }}
        />

        {/* "Hei!" speech bubble — synced with the wave */}
        <motion.div
          className="absolute top-[14%] right-[-4%] md:right-[-10%] motion-reduce:hidden"
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [8, 0, 0, -6],
            scale: [0.9, 1, 1, 0.95],
            rotate: [-4, 0, 0, 2],
          }}
          transition={{
            duration: 2.6,
            times: [0, 0.2, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 2.8,
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
