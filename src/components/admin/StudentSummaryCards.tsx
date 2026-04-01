import { Card, CardContent } from "@/components/ui/card";
import { Users, Zap, CalendarDays, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  totalStudents: number;
  activeThisWeek: number;
  totalLessons: number;
  avgXp: number;
  loading?: boolean;
}

export function StudentSummaryCards({ totalStudents, activeThisWeek, totalLessons, avgXp, loading }: Props) {
  const cards = [
    { label: "Ukupno studenata", value: totalStudents, icon: Users, color: "text-primary" },
    { label: "Aktivni ove nedelje", value: activeThisWeek, icon: TrendingUp, color: "text-accent" },
    { label: "Ukupno lekcija", value: totalLessons, icon: CalendarDays, color: "text-primary" },
    { label: "Prosečan XP", value: avgXp, icon: Zap, color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
