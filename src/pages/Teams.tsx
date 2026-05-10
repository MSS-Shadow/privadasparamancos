import { useState, useEffect } from "react";
import { Users, Plus, Star, UserCheck, Clock, ArrowRight, Crown, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ClanInfo {
  id: string;
  name: string;
  leader_nickname: string;
  memberCount: number;
  wins: number;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [clans, setClans] = useState<ClanInfo[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ clan_name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [myClan, setMyClan] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles").select("clan").eq("user_id", user.id).single();
          if (profileData?.clan) setMyClan(profileData.clan);

          if (profileData?.clan) {
            const { data: requests } = await supabase.from("clan_join_requests")
              .select("*").eq("clan_name", profileData.clan).eq("status", "pending");
            if (requests && requests.length > 0) {
              setPendingRequests([{ clan_name: profileData.clan, count: requests.length }]);
            }
          }
        }

        const [clansRes, membersRes, championsRes] = await Promise.all([
          supabase.from("clans").select("*"),
          supabase.from("clan_members").select("clan_id").eq("status", "member"),
          supabase.from("tournament_champions").select("team_name"),
        ]);

        const memberCounts = new Map<string, number>();
        membersRes.data?.forEach((m: any) => memberCounts.set(m.clan_id, (memberCounts.get(m.clan_id) || 0) + 1));
        const winCounts = new Map<string, number>();
        championsRes.data?.forEach((c: any) => winCounts.set(c.team_name, (winCounts.get(c.team_name) || 0) + 1));

        const clanList: ClanInfo[] = (clansRes.data as any[] ?? []).map((c) => ({
          id: c.id, name: c.name, leader_nickname: c.leader_nickname,
          memberCount: (memberCounts.get(c.id) || 0) + 1,
          wins: winCounts.get(c.name) || 0,
        }));
        clanList.sort((a, b) => b.wins - a.wins || b.memberCount - a.memberCount);
        setClans(clanList);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando clanes...</div>;

  const featuredClans = clans.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-mesh">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative px-6 py-10 md:py-14 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Users className="h-4 w-4" /> Comunidad
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display gradient-text leading-[1.1] mb-2">Equipos / Clanes</h1>
            <p className="text-muted-foreground text-lg">Únete a un squad o crea el tuyo para jugar privadas tranquilas.</p>
          </div>
          {user && (
            <Link to="/clan-leader-request" className="glow-button px-6 py-3 rounded-xl text-primary-foreground font-semibold inline-flex items-center gap-2 self-start">
              <Plus className="h-4 w-4" /> Solicitar ser Líder
            </Link>
          )}
        </div>
      </section>

      {/* Pending requests notice */}
      {pendingRequests.length > 0 && (
        <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-gaming-cyan/30">
          <div className="p-3 rounded-xl bg-gaming-cyan/15">
            <Clock className="h-6 w-6 text-gaming-cyan" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Tienes {pendingRequests[0].count} solicitud(es) pendiente(s) en tu clan</p>
            <p className="text-sm text-muted-foreground">Revisa las solicitudes en la página de tu clan</p>
          </div>
          <Link to={`/teams/${encodeURIComponent(pendingRequests[0].clan_name)}`}
            className="glow-button px-5 py-2.5 rounded-xl text-primary-foreground text-sm font-semibold whitespace-nowrap">
            Ver solicitudes
          </Link>
        </div>
      )}

      {/* Featured clans */}
      {featuredClans.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-display text-foreground mb-5 flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" /> Clanes Destacados
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {featuredClans.map((c, i) => (
              <Link key={c.id} to={`/teams/${encodeURIComponent(c.name)}`}
                className={`glass-card-hover p-6 group ${myClan === c.name ? "border-primary/50" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${
                    i === 0 ? "from-yellow-400 to-amber-500" :
                    i === 1 ? "from-gaming-cyan to-primary" :
                    "from-gaming-pink to-primary"
                  } opacity-90 group-hover:opacity-100 transition-opacity`}>
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  {myClan === c.name && (
                    <span className="px-2.5 py-1 rounded-full bg-gaming-cyan/15 text-gaming-cyan text-[10px] font-semibold">TU CLAN</span>
                  )}
                </div>
                <h3 className="text-xl font-bold font-display text-foreground mb-1">{c.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">Líder: {c.leader_nickname}</p>
                <div className="flex justify-between pt-4 border-t border-border/40">
                  <div>
                    <p className="text-2xl font-black font-display text-foreground">{c.memberCount}</p>
                    <p className="text-xs text-muted-foreground">Miembros</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black font-display text-primary stat-glow">{c.wins}</p>
                    <p className="text-xs text-muted-foreground">Victorias</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All clans */}
      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-5">
          Todos los Clanes <span className="text-muted-foreground font-normal text-lg">({clans.length})</span>
        </h2>
        {clans.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-foreground font-semibold mb-1">Aún no hay clanes registrados</p>
            <p className="text-muted-foreground text-sm">Sé el primero en solicitar ser líder</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clans.map((c) => (
              <Link key={c.id} to={`/teams/${encodeURIComponent(c.name)}`}
                className={`glass-card-hover p-5 group ${myClan === c.name ? "ring-2 ring-primary/30" : ""}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-foreground">{c.name}</h3>
                  {myClan === c.name && <UserCheck className="h-4 w-4 text-gaming-cyan" />}
                </div>
                <p className="text-xs text-muted-foreground mb-4">Líder: {c.leader_nickname}</p>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" /> {c.memberCount}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-primary">
                    <Trophy className="h-4 w-4" /> {c.wins}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-end gap-1">
                  Ver clan <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
