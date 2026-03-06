import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Star, TrendingUp } from "lucide-react";

const XP_TITLES: Record<number, string> = {
  1: "Utforsker",
  2: "Lærling",
  3: "Kommunikatør",
  4: "Taler",
  5: "Trygg taler",
  6: "Avansert kommunikatør",
  7: "Flytende",
  8: "Dyktig",
  9: "Ekspert",
  10: "Norskly-mester",
};

interface XpProgressCardProps {
  level: number;
  totalXp: number;
}

export default function XpProgressCard({ level, totalXp }: XpProgressCardProps) {
  const xpInLevel = totalXp % 100;
  const xpForNext = 100;
  const xpNeeded = xpForNext - xpInLevel;
  const percent = (xpInLevel / xpForNext) * 100;
  const title = XP_TITLES[Math.min(level, 10)] || `Level ${level}`;

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/8 via-accent/5 to-primary/3 shadow-nordic overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-primary/8 to-transparent rounded-tr-full pointer-events-none" />

      <CardContent className="pt-6 pb-6 relative z-10">
        <div className="flex items-center gap-4 mb-4">
          {/* Level Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative shrink-0"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
              <span className="text-2xl font-bold text-primary-foreground relative z-10">{level}</span>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md"
            >
              <Star className="w-3.5 h-3.5 text-accent-foreground fill-accent-foreground" />
            </motion.div>
          </motion.div>

          {/* Title & XP info */}
          <div className="flex-1 min-w-0">
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg font-bold text-foreground font-display truncate"
            >
              {title}
            </motion.h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-semibold text-accent">{totalXp} XP</span>
              <span className="text-xs text-muted-foreground">· Nivå {level}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Framgang til nivå {level + 1}</span>
            <span className="font-semibold text-foreground">{xpInLevel} / {xpForNext} XP</span>
          </div>

          <div className="relative h-3.5 w-full rounded-full bg-secondary/80 overflow-hidden">
            {/* Animated fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-accent relative"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              />
            </motion.div>
          </div>

          {/* XP needed text */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>
              {xpNeeded > 0
                ? `Trenger ${xpNeeded} XP til for å nå nivå ${level + 1}`
                : "Klar for neste nivå!"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
