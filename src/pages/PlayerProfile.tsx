import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { User, ShieldCheck, Trophy, Medal, ArrowLeft, Crown, Star, Target, Calendar, Globe2, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PlayerData {
  id: string;
  user_id: string;
  nickname: string;
  player_id: string;
  platform: string;
  clan: string;
  country: string;
  verified: boolean;
  status: string;
  created_at: string;
}

export default function PlayerProfile() {
  const { nickname } = useParams<{ nickname: string }>();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [stats, setStats] = useState({ tournaments: 0, wins: 0, top3: 0, top10: 0 });
  const [recentTournaments, setRecentTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ clan: "", country: "", platform: "" });

  useEffect(() => {
    const fetch = async () => {
      if (!nickname) return;
      const { data } = await supabase.from("profiles").select("*").eq("nickname", nickname).single();
      if (data) {
        setPlayer(data as any);
        setEditForm({ clan: (data as any).clan, country: (data as any).country, platform: (data as any).platform });

        const [tourRes, champRes, resultsRes] = await Promise.all([
          supabase.from("tournament_registrations").select("id", { count: "exact", head: true }).eq("nickname", nickname),
          supabase.from("tournament_champions").select("id", { count: "exact", head: true }).eq("team_name", (data as any).clan || nickname),
          supabase.from("tournament_results").select("*").eq("team_name", (data as any).clan || nickname).order("created_at", { ascending: false }).limit(10),
        ]);

        const results = (resultsRes.data as any[]) ?? [];
        const top3 = results.filter((r) => r.position <= 3).length;
        const top10 = results.filter((r) => r.position <= 10).length;

        setStats({ tournaments: tourRes.count ?? 0, wins: champRes.count ?? 0, top3, top10 });
        setRecentTournaments(results);
      }
      setLoading(false);
    };
    fetch();
  }, [nickname]);

  const isOwner = user?.id === player?.user_id;

  const saveProfile = async () => {
    if (!player) return;
    const { error } = await supabase.from("profiles").update(editForm).eq("id", player.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil actualizado");
    setPlayer({ ...player, ...editForm });
    setEditing(false);
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;
  if (!player) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground mb-4">Jugador no encontrado.</p>
      <Link to="/players" className="text-primary hover:underline">← Volver a Jugadores</Link>
    </div>
  );

  const winrate = stats.tournaments > 0 ? Math.round((stats.wins / stats.tournaments) * 100) : 0;
  const isChampion = stats.wins > 0;
  const isTopPlayer = stats.top3 >= 3;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/players" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a Jugadores
      </Link>

      {/* Premium banner header */}
      <div className="relative overflow-hidden rounded-3xl glass-card animate-fade-up">
        <div className="profile-banner h-40 md:h-52 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        </div>

        <div className="relative px-6 pb-6 -mt-16">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-gaming-cyan p-1 shadow-2xl">
              <div className="w-full h-full rounded-[1.3rem] bg-card flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            </div>
            {isOwner && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar perfil</Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black font-display text-foreground flex items-center gap-2 flex-wrap">
                {player.nickname}
                {player.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold border border-accent/30">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Player
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1"><Gamepad2 className="h-3.5 w-3.5" /> {player.platform}</span>
                <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> {player.country}</span>
                {player.clan && (
                  <Link to={`/teams/${encodeURIComponent(player.clan)}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    <Crown className="h-3.5 w-3.5" /> {player.clan}
                  </Link>
                )}
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Desde {new Date(player.created_at).toLocaleDateString("es", { month: "short", year: "numeric" })}</span>
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {player.verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
              {isChampion && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gaming-pink/10 text-gaming-pink text-xs font-semibold border border-gaming-pink/20">
                  <Trophy className="h-3.5 w-3.5" /> Champion
                </span>
              )}
              {isTopPlayer && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                  <Star className="h-3.5 w-3.5" /> Top Player
                </span>
              )}
            </div>
          </div>
        </div>

        {editing ? (
          <div className="px-6 pb-6 space-y-3 border-t border-border/50 pt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Clan</label>
              <Input value={editForm.clan} onChange={(e) => setEditForm({ ...editForm, clan: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">País</label>
              <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveProfile} size="sm">Guardar</Button>
              <Button variant="outline" onClick={() => setEditing(false)} size="sm">Cancelar</Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Featured stats */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Estadísticas de cuenta
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-4 text-center">
            <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-3xl font-black font-display stat-glow text-foreground tabular-nums">{stats.tournaments}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Torneos</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-gaming-pink/15 to-gaming-pink/5 border border-gaming-pink/20 p-4 text-center">
            <Medal className="h-5 w-5 text-gaming-pink mx-auto mb-1" />
            <p className="text-3xl font-black font-display text-foreground tabular-nums">{stats.wins}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Victorias</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 p-4 text-center">
            <Star className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-3xl font-black font-display text-foreground tabular-nums">{stats.top3}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Top 3</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-center">
            <Trophy className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-3xl font-black font-display text-foreground tabular-nums">{stats.top10}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Top 10</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-center">
            <Target className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-3xl font-black font-display text-foreground tabular-nums">{winrate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Winrate</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progreso al podio</span>
            <span className="tabular-nums">{Math.min(100, Math.round((stats.top3 / Math.max(1, stats.tournaments)) * 100))}%</span>
          </div>
          <div className="slot-bar"><span style={{ width: `${Math.min(100, Math.round((stats.top3 / Math.max(1, stats.tournaments)) * 100))}%` }} /></div>
        </div>
      </div>

      {/* Player ID card */}
      <div className="glass-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Player ID</p>
          <p className="text-xl font-bold font-display text-foreground tabular-nums">{player.player_id}</p>
        </div>
        {player.verified ? (
          <span className="text-xs text-accent inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Validado por staff</span>
        ) : (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Pendiente de verificación</span>
        )}
      </div>

      {/* Recent Tournaments */}
      {recentTournaments.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Historial en privadas
          </h3>
          <div className="space-y-2">
            {recentTournaments.map((r: any) => {
              const podium = r.position === 1 ? "text-gaming-pink" : r.position === 2 ? "text-accent" : r.position === 3 ? "text-primary" : "text-muted-foreground";
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black font-display ${podium} tabular-nums`}>#{r.position}</span>
                    <div>
                      <p className="font-medium text-foreground">{r.kills} kills</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground tabular-nums">{Number(r.total_points).toFixed(1)} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="text-center">
          <Link to="/verify-account" className="text-sm text-accent hover:underline inline-flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Solicitar Verificación de Cuenta
          </Link>
        </div>
      )}
    </div>
  );
}
