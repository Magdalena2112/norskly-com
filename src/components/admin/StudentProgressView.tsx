import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface Activity {
  id: string;
  module: string;
  type: string;
  points: number;
  created_at: string;
}

export function StudentProgressView({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  const moduleData = useMemo(() => {
    const counts: Record<string, { count: number; points: number }> = {};
    activities.forEach((a) => {
      if (!counts[a.module]) counts[a.module] = { count: 0, points: 0 };
      counts[a.module].count += 1;
      counts[a.module].points += a.points;
    });
    return Object.entries(counts).map(([module, data]) => ({
      module,
      aktivnosti: data.count,
      poeni: data.points,
    }));
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Nema podataka o napretku.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivnost po modulima</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="module" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="aktivnosti" fill="hsl(168, 45%, 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {moduleData.map((m) => (
          <Card key={m.module}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{m.aktivnosti}</p>
              <p className="text-xs text-muted-foreground capitalize">{m.module}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
