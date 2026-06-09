import { useState, useEffect } from "react";
import { User, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("La carga tardó demasiado")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

interface Player {
  nickname: string;
  player_id: string;
  platform: string;
  clan: string;
  verified: boolean;
  tournaments: number;
}

type ProfilePlayerRow = Omit<Player, "tournaments">;
type RegistrationRow = { nickname: string | null };

const getMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPlayers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [{ data: profiles, error: profilesError }, { data: regs, error: regsError }] = await Promise.all([
        withTimeout(supabase.from("profiles").select("nickname, player_id, platform, clan, verified").eq("status", "active")),
        withTimeout(supabase.from("tournament_registrations").select("nickname")),
      ]);

      if (profilesError) throw profilesError;
      if (regsError) throw regsError;

      const regCount = new Map<string, number>();
      (regs as RegistrationRow[] | null)?.forEach((r) => {
        if (r.nickname) regCount.set(r.nickname, (regCount.get(r.nickname) || 0) + 1);
      });

      const list: Player[] = ((profiles ?? []) as ProfilePlayerRow[]).map((p) => ({
        ...p,
        tournaments: regCount.get(p.nickname) || 0,
      }));

      setPlayers(list.sort((a, b) => b.tournaments - a.tournaments));
    } catch (error: unknown) {
      console.error("Error cargando jugadores:", error);
      toast.error(getMessage(error, "Error al cargar jugadores"));
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSync = () => {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => fetchPlayers(false), 500);
    };

    fetchPlayers();

    const channel = supabase
      .channel("players-public-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleSync)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_registrations" }, scheduleSync)
      .subscribe();

    return () => {
      if (syncTimer) clearTimeout(syncTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = search
    ? players.filter((p) => p.nickname.toLowerCase().includes(search.toLowerCase()) || p.player_id.toLowerCase().includes(search.toLowerCase()))
    : players;

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Jugadores</h1>
        <p className="text-muted-foreground">Todos los jugadores registrados en la comunidad.</p>
      </div>

      <input
        placeholder="Buscar jugador..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2 rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />

      {filtered.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {["Jugador", "Player ID", "Plataforma", "Clan", "Torneos", "Estado"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.player_id} className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link to={`/player/${p.nickname}`} className="flex items-center gap-2 hover:text-primary">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {p.nickname}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{p.player_id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">{p.platform}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.clan || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{p.tournaments}</td>
                  <td className="px-4 py-3">
                    {p.verified ? (
                      <span className="inline-flex items-center gap-1 text-accent text-xs font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verificado
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Aún no hay jugadores registrados.</p>
      )}
    </div>
  );
}
