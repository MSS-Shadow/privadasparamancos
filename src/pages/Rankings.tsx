import { useState, useEffect } from "react";
import { Trophy, Crown, Medal, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Champion {
  id: string;
  team_name: string;
  tournament_name: string;
  mode: string;
  date: string;
}

export default function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [rankings, setRankings] = useState<Record<string, { rank: number; name: string; wins: number }[]>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase.from("tournament_champions").select("*").order("date", { ascending: false });
        const champs = (data as any[]) ?? [];
        setChampions(champs);
        const modeWins: Record<string, Map<string, number>> = {};
        champs.forEach((c) => {
          if (!modeWins[c.mode]) modeWins[c.mode] = new Map();
          modeWins[c.mode].set(c.team_name, (modeWins[c.mode].get(c.team_name) || 0) + 1);
        });
        const result: Record<string, { rank: number; name: string; wins: number }[]> = {};
        Object.entries(modeWins).forEach(([mode, map]) => {
          result[mode] = Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, wins], i) => ({ rank: i + 1, name, wins }));
        });
        setRankings(result);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const categories = ["Solo", "Duo", "Trio", "Squad"];
  const modeColors: Record<string, string> = {
    Solo: "from-primary to-gaming-pink",
    Duo: "from-gaming-cyan to-primary",
    Trio: "from-gaming-pink to-primary",
    Squad: "from-primary to-gaming-cyan",
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-300" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-mesh">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-gaming-pink/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative px-6 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-gaming-pink/10 border border-gaming-pink/20 text-gaming-pink text-sm font-medium">
            <TrendingUp className="h-4 w-4" /> Ranking de la comunidad
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-display gradient-text leading-[1.1] mb-2">Rankings</h1>
          <p className="text-muted-foreground text-lg">Clasificación por campeonatos ganados en cada modo.</p>
        </div>
      </section>

      {/* Rankings grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {categories.map((cat) => (
          <section key={cat} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${modeColors[cat]} opacity-90`}>
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold font-display text-foreground">{cat}</h2>
            </div>
            {rankings[cat] && rankings[cat].length > 0 ? (
              <div className="space-y-2">
                {rankings[cat].slice(0, 10).map((r) => (
                  <div key={r.rank} className="flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card transition-colors border border-border/40">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums ${
                        r.rank === 1 ? "bg-yellow-400/20 text-yellow-400" :
                        r.rank === 2 ? "bg-gray-300/20 text-gray-300" :
                        r.rank === 3 ? "bg-amber-600/20 text-amber-500" :
                        "bg-muted text-muted-foreground"
                      }`}>{r.rank}</span>
                      <span className="font-medium text-foreground flex items-center gap-2">{rankIcon(r.rank)} {r.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums">{r.wins} 🏆</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6 text-sm">Aún no hay datos para {cat}.</p>
            )}
          </section>
        ))}
      </div>

      {/* Championship history */}
      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-4 flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-400" /> Historial de Campeonatos
        </h2>
        {champions.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campeón</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Torneo</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modo</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {champions.map((c) => (
                    <tr key={c.id} className="border-b border-border/30 last:border-0 hover:bg-foreground/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-400" /> {c.team_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.tournament_name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-gaming-cyan/10 text-gaming-cyan text-xs font-medium">{c.mode}</span></td>
                      <td className="px-4 py-3 text-muted-foreground text-right text-sm">{new Date(c.date).toLocaleDateString("es")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-muted-foreground text-sm">Aún no hay campeones registrados.</div>
        )}
      </section>
    </div>
  );
}
