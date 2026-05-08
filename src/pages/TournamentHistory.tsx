import { useState, useEffect } from "react";
import { Trophy, Medal, Filter, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface TournamentResult {
  id: string;
  tournament_id: string;
  tournament_name: string;
  date: string;
  mode: string;
  region: string;
  image_url: string;
  sponsor_tag: string;
  prize: string;
  results: { team_name: string; total_points: number; position: number; kills: number }[];
  total_players: number;
}

export default function TournamentHistoryPage() {
  const [tournaments, setTournaments] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("Todos");
  const [filterRegion, setFilterRegion] = useState("Todos");

  const modes = ["Todos", "Solo", "Duo", "Trio", "Squad"];
  const regions = ["Todos", "LATAM", "BR"];

  useEffect(() => {
    const load = async () => {
      const [tourRes, resultsRes, regsRes, champsRes] = await Promise.all([
        supabase.from("tournaments").select("*").eq("status", "Finished").order("date", { ascending: false }),
        supabase.from("tournament_results").select("*").order("total_points", { ascending: false }),
        supabase.from("tournament_registrations").select("tournament_id"),
        supabase.from("tournament_champions").select("*"),
      ]);

      const tours = tourRes.data ?? [];
      const results = resultsRes.data ?? [];
      const champs = champsRes.data ?? [];

      const regCounts: Record<string, number> = {};
      (regsRes.data ?? []).forEach((r: any) => { regCounts[r.tournament_id] = (regCounts[r.tournament_id] || 0) + 1; });

      const mapped: TournamentResult[] = tours.map((t: any) => {
        const tResults = results.filter((r: any) => r.tournament_id === t.id).map((r: any) => ({
          team_name: r.team_name, total_points: Number(r.total_points), position: r.position, kills: r.kills,
        }));
        const champ = champs.find((c: any) => c.tournament_id === t.id);
        if (tResults.length === 0 && champ) {
          tResults.push({ team_name: (champ as any).team_name, total_points: 0, position: 1, kills: 0 });
        }
        return {
          id: t.id, tournament_id: t.id, tournament_name: t.name, date: t.date, mode: t.mode,
          region: t.region || "LATAM",
          image_url: t.image_url || (champ as any)?.image_url || "",
          sponsor_tag: (champ as any)?.sponsor_tag || "Comunitario",
          prize: (champ as any)?.prize || "",
          results: tResults,
          total_players: regCounts[t.id] || 0,
        };
      });

      setTournaments(mapped);
      setLoading(false);
    };
    load();
  }, []);

  let filtered = tournaments;
  if (filterMode !== "Todos") filtered = filtered.filter((t) => t.mode === filterMode);
  if (filterRegion !== "Todos") filtered = filtered.filter((t) => t.region === filterRegion);

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Historial de Torneos</h1>
        <p className="text-muted-foreground">Resultados pasados de las privadas que organizamos en Privadas para Mancos.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Modo:</span>
          {modes.map((m) => (
            <button key={m} onClick={() => setFilterMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === m ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Región:</span>
          {regions.map((r) => (
            <button key={r} onClick={() => setFilterRegion(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterRegion === r ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Torneos Completados", value: filtered.length },
          { label: "Jugadores Participantes", value: filtered.reduce((s, t) => s + t.total_players, 0) },
          { label: "Con Premio", value: filtered.filter((t) => t.prize).length },
          { label: "Patrocinados", value: filtered.filter((t) => t.sponsor_tag === "Patrocinado").length },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tournament list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((t) => {
            const top3 = t.results.slice(0, 3);
            return (
              <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
                {t.image_url && (
                  <div className="relative h-40 sm:h-52 overflow-hidden">
                    <img src={t.image_url} alt={t.tournament_name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <div className="absolute bottom-3 left-4 flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.sponsor_tag === "Patrocinado" ? "bg-accent/90 text-accent-foreground" : "bg-muted/90 text-muted-foreground"}`}>
                        {t.sponsor_tag}
                      </span>
                      {t.prize && <span className="text-xs bg-primary/90 text-primary-foreground px-2 py-0.5 rounded font-medium">{t.prize}</span>}
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Link to={`/tournaments/${encodeURIComponent(t.tournament_name.replace(/ /g, "-"))}`} className="font-semibold text-foreground hover:text-primary">
                        {t.tournament_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {t.mode} · {t.region} · {new Date(t.date).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })} · {t.total_players} jugadores
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!t.image_url && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.sponsor_tag === "Patrocinado" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                          {t.sponsor_tag}
                        </span>
                      )}
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  {top3.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {top3.map((r, i) => (
                        <div key={i} className={`rounded-lg p-3 text-center text-sm ${i === 0 ? "bg-primary/10 border border-primary/30" : "bg-muted/50"}`}>
                          <Medal className={`h-4 w-4 mx-auto mb-1 ${i === 0 ? "text-primary" : "text-muted-foreground"}`} />
                          <p className="font-medium text-foreground truncate">{r.team_name}</p>
                          {r.total_points > 0 && <p className="text-xs text-muted-foreground">{r.total_points} pts</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">No hay torneos finalizados con estos filtros.</p>
      )}
    </div>
  );
}
