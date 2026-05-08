import { useState, useEffect } from "react";
import { Trophy, Calendar, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LobbyProgress from "@/components/LobbyProgress";
import TournamentRegisterDialog from "@/components/TournamentRegisterDialog";
import type { Tables } from "@/integrations/supabase/types";

type Tournament = Tables<"tournaments">;

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const [filterMode, setFilterMode] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const modes = ["Todos", "Solo", "Duo", "Trio", "Squad"];
  const statuses = ["Todos", "Open", "Closed", "In Progress", "Finished"];

  const statusLabel: Record<string, string> = {
    Open: "Abierto",
    Closed: "Cerrado",
    "In Progress": "En Progreso",
    Finished: "Finalizado",
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: tourData } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: false });

      if (tourData) {
        setTournaments(tourData);
        const { data: regs } = await supabase
          .from("tournament_registrations")
          .select("tournament_id");
        if (regs) {
          const counts: Record<string, number> = {};
          regs.forEach((r: any) => {
            counts[r.tournament_id] = (counts[r.tournament_id] || 0) + 1;
          });
          setRegCounts(counts);
        }
      }
    };
    fetchData();
  }, []);

  let filteredTournaments = tournaments;
  if (filterMode !== "Todos") filteredTournaments = filteredTournaments.filter(t => t.mode === filterMode);
  if (filterStatus !== "Todos") filteredTournaments = filteredTournaments.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-3xl bg-mesh">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative px-6 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Trophy className="h-4 w-4" /> Privadas para mancos
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-display gradient-text leading-[1.1] mb-3">
            Torneos
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Pasa el rato en privadas casuales y justas de Warzone LATAM. Sin tryhards.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="glass-card flex flex-wrap items-center gap-1 p-1.5">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterMode === mode
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="glass-card flex flex-wrap items-center gap-1 p-1.5">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {statusLabel[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament cards */}
      {filteredTournaments.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">No hay torneos que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredTournaments.map((t) => {
            const count = regCounts[t.id] || 0;
            const isOpen = t.status === "Open";
            return (
              <div key={t.id} className="glass-card-hover p-6 group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-gaming-pink opacity-90 group-hover:opacity-100 transition-opacity">
                      <Trophy className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-display text-foreground">{t.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-gaming-cyan/10 text-gaming-cyan text-xs font-medium">{t.mode}</span>
                        <span>•</span>
                        <span>{(t as any).region || "LATAM"}</span>
                        <span>•</span>
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(t.date).toLocaleDateString("es", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                    isOpen
                      ? "bg-gaming-cyan/15 text-gaming-cyan border border-gaming-cyan/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {statusLabel[t.status] || t.status}
                  </span>
                </div>

                <LobbyProgress current={count} max={t.max_players} label={`Inscripciones (${count}/${t.max_players})`} />

                <div className="mt-5">
                  {isOpen ? (
                    <button
                      onClick={() => setSelectedTournament(t)}
                      className="glow-button w-full py-3.5 rounded-xl text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" /> Inscribirse ahora
                    </button>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground text-sm">
                      Inscripciones {t.status === "Closed" ? "cerradas" : "finalizadas"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTournament && (
        <TournamentRegisterDialog
          open={!!selectedTournament}
          onClose={() => setSelectedTournament(null)}
          tournament={{ id: selectedTournament.id, name: selectedTournament.name, mode: selectedTournament.mode }}
        />
      )}
    </div>
  );
}
