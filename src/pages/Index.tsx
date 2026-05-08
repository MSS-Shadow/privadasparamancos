import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Megaphone, Zap, Users, Swords, ChevronRight, Gamepad2, Crown, TrendingUp, Radio, ShieldCheck, Activity, Calendar, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({ players: 0, teams: 0, tournaments: 0, scrims: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [liveScrims, setLiveScrims] = useState<any[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [activity, setActivity] = useState<{ type: string; title: string; subtitle?: string; date: string; href?: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const nowIso = new Date().toISOString();
        const [
          profileRes, clanRes, tourneyRes, scrimRes, annRes,
          liveRes, upTourRes,
          newPlayersRes, newClansRes, newScrimsRes, newChampsRes,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("clans").select("*", { count: "exact", head: true }),
          supabase.from("tournaments").select("*", { count: "exact", head: true }),
          supabase.from("scrims").select("*", { count: "exact", head: true }),
          supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
          supabase.from("scrims").select("id,title,mode,creator_nickname,stream_link").eq("status", "live").limit(3),
          supabase.from("tournaments").select("id,name,mode,date,max_players").gte("date", nowIso).order("date", { ascending: true }).limit(3),
          supabase.from("profiles").select("nickname,verified,created_at").order("created_at", { ascending: false }).limit(8),
          supabase.from("clans").select("name,leader_nickname,created_at").order("created_at", { ascending: false }).limit(4),
          supabase.from("scrims").select("title,creator_nickname,created_at").order("created_at", { ascending: false }).limit(4),
          supabase.from("tournament_champions").select("team_name,tournament_name,created_at").order("created_at", { ascending: false }).limit(4),
        ]);

        setStats({
          players: (profileRes as any).count ?? 0,
          teams: (clanRes as any).count ?? 0,
          tournaments: (tourneyRes as any).count ?? 0,
          scrims: (scrimRes as any).count ?? 0,
        });
        setAnnouncements(annRes.data ?? []);
        setLiveScrims(liveRes.data ?? []);
        setUpcomingTournaments(upTourRes.data ?? []);

        // Build a unified activity feed from recent rows
        const feed: { type: string; title: string; subtitle?: string; date: string; href?: string }[] = [];
        (newPlayersRes.data ?? []).forEach((p: any) => {
          if (p.verified) {
            feed.push({
              type: "verified",
              title: `${p.nickname} fue verificado`,
              subtitle: "Nuevo jugador verificado",
              date: p.created_at,
              href: `/player/${encodeURIComponent(p.nickname)}`,
            });
          } else {
            feed.push({
              type: "player",
              title: `${p.nickname} se unió`,
              subtitle: "Nuevo jugador",
              date: p.created_at,
              href: `/player/${encodeURIComponent(p.nickname)}`,
            });
          }
        });
        (newClansRes.data ?? []).forEach((c: any) => {
          feed.push({
            type: "clan",
            title: `Nuevo clan: ${c.name}`,
            subtitle: `Liderado por ${c.leader_nickname}`,
            date: c.created_at,
            href: `/teams/${encodeURIComponent(c.name)}`,
          });
        });
        (newScrimsRes.data ?? []).forEach((s: any) => {
          feed.push({
            type: "scrim",
            title: `Nueva scrim: ${s.title}`,
            subtitle: `Por ${s.creator_nickname}`,
            date: s.created_at,
            href: "/scrims",
          });
        });
        (newChampsRes.data ?? []).forEach((c: any) => {
          feed.push({
            type: "champion",
            title: `${c.team_name} ganó ${c.tournament_name}`,
            subtitle: "Torneo finalizado",
            date: c.created_at,
            href: "/hall-of-fame",
          });
        });
        feed.sort((a, b) => +new Date(b.date) - +new Date(a.date));
        setActivity(feed.slice(0, 8));
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    loadData();
  }, []);

  const statItems = [
    { label: "Operadores", value: stats.players, icon: Users, color: "from-primary to-tactical-orange", path: "/players" },
    { label: "Squads", value: stats.teams, icon: Crown, color: "from-tactical-orange to-primary", path: "/teams" },
    { label: "Privadas", value: stats.tournaments, icon: Trophy, color: "from-primary to-tactical-orange", path: "/tournaments" },
    { label: "Scrims", value: stats.scrims, icon: Swords, color: "from-tactical-orange to-primary", path: "/scrims" },
  ];

  const quickLinks = [
    { label: "Privadas", desc: "BR · Resurgimiento · Kill Race", path: "/tournaments", icon: Trophy },
    { label: "Scrims", desc: "Entrena con tu squad", path: "/scrims", icon: Swords },
    { label: "Rankings", desc: "Top operadores LATAM", path: "/rankings", icon: TrendingUp },
    { label: "Squads", desc: "Encuentra tu escuadrón", path: "/teams", icon: Users },
  ];

  const activityIcon = (type: string) => {
    switch (type) {
      case "verified": return <ShieldCheck className="h-4 w-4 text-accent" />;
      case "clan": return <Crown className="h-4 w-4 text-gaming-pink" />;
      case "scrim": return <Swords className="h-4 w-4 text-gaming-cyan" />;
      case "champion": return <Trophy className="h-4 w-4 text-primary" />;
      default: return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "ahora";
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    return `hace ${d}d`;
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-mesh">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gaming-cyan/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <span className="live-dot" />
            Privadas para mancos · Warzone LATAM · Sin tryhards
          </div>

          <h1 className="text-5xl md:text-7xl font-black font-display gradient-text leading-[1.1] mb-4">
            Las privadas más grandes<br />de Warzone LATAM.
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Compite en <span className="text-foreground font-semibold">Battle Royale, Resurgimiento y Kill Race</span> junto a los mejores squads de la región.
            Privadas, scrims y rankings con jugadores verificados manualmente.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <>
                <Link to="/scrims" className="glow-button px-8 py-3.5 rounded-xl text-primary-foreground font-semibold inline-flex items-center gap-2">
                  <Radio className="h-5 w-5" /> Unirme a una privada
                </Link>
                <Link to="/verify-account" className="glass-card px-8 py-3.5 rounded-xl text-foreground font-semibold inline-flex items-center gap-2 hover:border-primary/30 transition-colors">
                  <ShieldCheck className="h-5 w-5 text-accent" /> Verificar cuenta
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="glow-button px-8 py-3.5 rounded-xl text-primary-foreground font-semibold inline-flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Crear squad y competir
                </Link>
                <Link to="/scrims" className="glass-card px-8 py-3.5 rounded-xl text-foreground font-semibold inline-flex items-center gap-2 hover:border-primary/30 transition-colors">
                  <Radio className="h-5 w-5 text-tactical-orange" /> Ver privadas activas
                </Link>
              </>
            )}
          </div>

          {isAdmin && (
            <p className="mt-6 text-sm text-gaming-cyan font-medium">
              <Crown className="h-4 w-4 inline mr-1" /> Panel Admin disponible
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <Link
            key={i}
            to={stat.path}
            className="glass-card-hover p-6 text-center group cursor-pointer animate-fade-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-4xl font-black font-display stat-glow text-foreground">{stat.value}</p>
            <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
          </Link>
        ))}
      </section>

      {/* EN VIVO */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <span className="live-dot" /> Operación en curso
          </h2>
          <Link to="/scrims" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Live scrims */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-tactical-orange uppercase tracking-wider mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 animate-pulse" /> Scrims en vivo
            </h3>
            {liveScrims.length > 0 ? (
              <div className="space-y-2">
                {liveScrims.map((s) => (
                  <Link
                    key={s.id}
                    to="/scrims"
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-tactical-orange/20 text-tactical-orange text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <span className="live-dot" /> LIVE
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.mode} · por {s.creator_nickname}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No hay scrims en vivo. Vuelve pronto.</p>
            )}
          </div>

          {/* Upcoming tournaments */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Próximas privadas
            </h3>
            {upcomingTournaments.length > 0 ? (
              <div className="space-y-2">
                {upcomingTournaments.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tournaments/${encodeURIComponent(t.name)}`}
                    className="block p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors group"
                  >
                    <p className="font-semibold text-foreground text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.mode} · {new Date(t.date).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin torneos programados.</p>
            )}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-5 flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" /> Operaciones rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path} className="glass-card-hover p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <link.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground">{link.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity feed */}
      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-5 flex items-center gap-2">
          <Activity className="h-6 w-6 text-accent" /> Kill feed reciente
        </h2>
        {activity.length > 0 ? (
          <div className="glass-card divide-y divide-border/50">
            {activity.map((a, i) => {
              const inner = (
                <div className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                    {activityIcon(a.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    {a.subtitle && <p className="text-xs text-muted-foreground truncate">{a.subtitle}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">{timeAgo(a.date)}</span>
                </div>
              );
              return a.href ? (
                <Link key={i} to={a.href} className="block">{inner}</Link>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-sm text-muted-foreground">Aún no hay actividad reciente.</div>
        )}
      </section>

      {/* Announcements */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-tactical-orange" /> Avisos de la comunidad
          </h2>
          <Link to="/announcements" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className="glass-card-hover p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(a.created_at).toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <h3 className="font-semibold text-foreground text-lg">{a.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm line-clamp-2">{a.description}</p>
                  </div>
                  {a.image_url && (
                    <img src={a.image_url} alt="" className="w-20 h-20 rounded-xl object-cover ml-4 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay anuncios por el momento.</p>
          </div>
        )}
      </section>

      {/* SEO indexable content */}
      <section className="glass-card p-8 space-y-6">
        <h2 className="text-2xl font-bold font-display gradient-text">
          Privadas para Mancos · Warzone LATAM sin tryhards
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground leading-relaxed">
          <article>
            <h3 className="text-foreground font-semibold mb-2">Privadas de Warzone</h3>
            <p>
              Únete a <strong>privadas Warzone</strong> de Battle Royale, Resurgimiento y Kill Race con lobbies
              personalizados, reglas claras y check-in justo. <Link to="/tournaments" className="text-primary hover:underline">Ver privadas activas</Link>.
            </p>
          </article>
          <article>
            <h3 className="text-foreground font-semibold mb-2">Scrims relajadas</h3>
            <p>
              Practica con tu squad en <strong>scrims casuales Warzone</strong> organizadas por creadores y casters verificados,
              con waitlist automática y puntos configurables. <Link to="/scrims" className="text-primary hover:underline">Ver scrims disponibles</Link>.
            </p>
          </article>
          <article>
            <h3 className="text-foreground font-semibold mb-2">Jugadores verificados</h3>
            <p>
              Todos los operadores pasan por un sistema de <strong>verificación manual</strong> con validación de
              Activision ID para garantizar fair play y combatir el smurfing. <Link to="/players" className="text-primary hover:underline">Ver operadores</Link>.
            </p>
          </article>
          <article>
            <h3 className="text-foreground font-semibold mb-2">Squads y clanes</h3>
            <p>
              Crea o únete a <strong>squads Warzone</strong> con perfiles públicos, KD promedio, historial en privadas
              y requisitos por privada. <Link to="/teams" className="text-primary hover:underline">Explorar squads</Link>.
            </p>
          </article>
          <article>
            <h3 className="text-foreground font-semibold mb-2">Ranking de la comunidad</h3>
            <p>
              Sigue el <strong>ranking Warzone LATAM</strong> por modo: BR Squad, Trio, Resurgimiento y Kill Race.
              <Link to="/rankings" className="text-primary hover:underline"> Ver tabla de posiciones</Link>.
            </p>
          </article>
          <article>
            <h3 className="text-foreground font-semibold mb-2">Comunidad LATAM</h3>
            <p>
              Privadas para Mancos conecta la escena casual y comunitaria de Call of Duty: Warzone en LATAM y Brasil con
              moderación activa, anti-cheat y soporte 24/7.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
