import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swords, ExternalLink, Plus, Radio, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Scrim {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  room_id: string;
  room_password: string | null;
  mode: string | null;
  scheduled_at: string;
  stream_link: string | null;
  status: string;
  max_players: number;
  current_players: number;
  created_by: string;
  creatorNickname: string;
  participantCount: number;
}

const createSlug = (name: string) => {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "scrim";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
};

export default function ScrimsPage() {
  const { user, profile, roles } = useAuth();
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    room_id: "",
    max_players: "120",
    scheduled_at: "",
    mode: "Squad",
    stream_link: "",
    room_password: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  const canCreate = roles.includes("admin") || roles.includes("content_creator");

  const fetchScrims = async () => {
    setLoading(true);
    try {
      const { data: scrimsData, error: scrimsError } = await supabase.from("scrims").select("*").order("scheduled_at", { ascending: false });
      if (scrimsError) throw scrimsError;
      const { data: participants } = await supabase.from("scrim_participants").select("scrim_id");
      if (scrimsData) {
        const counts: Record<string, number> = {};
        participants?.forEach((p: any) => { counts[p.scrim_id] = (counts[p.scrim_id] || 0) + 1; });
        const creatorIds = Array.from(new Set(scrimsData.map((s: any) => s.created_by).filter(Boolean)));
        const { data: profilesData } = creatorIds.length
          ? await supabase.from("profiles").select("user_id,nickname").in("user_id", creatorIds)
          : { data: [] as any[] };
        const nickMap = new Map((profilesData ?? []).map((p: any) => [p.user_id, p.nickname]));
        setScrims(scrimsData.map((s: any) => ({
          ...s,
          creatorNickname: nickMap.get(s.created_by) ?? "—",
          participantCount: counts[s.id] || 0,
        })));
      }
    } catch (error: any) {
      toast.error(error.message ?? "No se pudieron cargar las scrims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScrims(); }, []);

  const joinScrim = async (scrimId: string) => {
    if (!user || !profile) { toast.error("Debes iniciar sesión para unirte"); return; }
    const profileStatus = (profile as any).status;
    if (profileStatus === "suspended" || profileStatus === "banned") {
      toast.error("Tu cuenta está restringida y no puedes unirte a scrims");
      return;
    }
    const { error } = await supabase.from("scrim_participants").insert({
      scrim_id: scrimId, user_id: user.id, nickname: profile.nickname,
      player_id: profile.player_id, team: profile.clan, platform: profile.platform,
    });
    if (error) {
      if (error.code === "23505") toast.error("Ya estás inscrito en este scrim");
      else toast.error(error.message);
      return;
    }
    toast.success("¡Te uniste al scrim!");
    fetchScrims();
  };

  const createScrim = async () => {
    if (!user) { toast.error("Debes iniciar sesión"); return; }
    if (!form.name.trim() || !form.room_id.trim() || !form.max_players || !form.scheduled_at) {
      toast.error("Nombre, sala, cupos y fecha son obligatorios");
      return;
    }
    const maxPlayers = Number(form.max_players);
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1) { toast.error("Cupos máximos inválidos"); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("scrims").insert({
        name: form.name.trim(),
        slug: createSlug(form.name),
        room_id: form.room_id.trim(),
        room_password: form.room_password.trim() || null,
        max_players: maxPlayers,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        mode: form.mode || null,
        stream_link: form.stream_link.trim() || null,
        description: form.description.trim() || null,
        current_players: 0,
        created_by: user.id,
      } as any);
      if (error) throw error;
      toast.success("Scrim creado");
      setShowCreate(false);
      setForm({ name: "", room_id: "", max_players: "120", scheduled_at: "", mode: "Squad", stream_link: "", room_password: "", description: "" });
      fetchScrims();
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo crear el scrim");
    } finally {
      setCreating(false);
    }
  };

  const now = new Date();
  const live = scrims.filter((s) => s.status === "live");
  const upcoming = scrims.filter((s) => s.status === "upcoming" && new Date(s.scheduled_at) > now);
  const history = scrims.filter((s) => s.status === "completed" || (s.status !== "live" && new Date(s.scheduled_at) <= now));

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  const ScrimCard = ({ s, accent }: { s: Scrim; accent: "live" | "upcoming" | "history" }) => {
    const fillPct = Math.min(100, Math.round((s.participantCount / Math.max(1, s.max_players)) * 100));
    const isFull = s.participantCount >= s.max_players;
    return (
      <div className={`glass-card-hover p-5 group relative overflow-hidden ${accent === "live" ? "ring-1 ring-gaming-pink/40" : ""}`}>
        {accent === "live" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gaming-pink via-primary to-gaming-cyan" />
        )}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              accent === "live" ? "bg-gaming-pink/15 text-gaming-pink" :
              accent === "upcoming" ? "bg-primary/15 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              <Swords className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                por <Link to={`/player/${encodeURIComponent(s.creatorNickname)}`} className="text-foreground hover:text-primary transition-colors">{s.creatorNickname}</Link> · {s.mode ?? "Sin modo"}
              </p>
            </div>
          </div>
          {accent === "live" ? (
            <span className="px-2.5 py-1 rounded-full bg-gaming-pink/15 text-gaming-pink text-[10px] font-bold flex items-center gap-1.5 shrink-0">
              <span className="live-dot" /> LIVE
            </span>
          ) : accent === "upcoming" ? (
            <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0">PRÓXIMO</span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold shrink-0">FINALIZADO</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(s.scheduled_at).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Users className="h-3.5 w-3.5" /> {s.participantCount}/{s.max_players}
          </span>
        </div>

        <div className="slot-bar mb-3"><span style={{ width: `${fillPct}%` }} /></div>

        {accent === "upcoming" && (
          <button
            onClick={() => joinScrim(s.id)}
            disabled={isFull}
            className="glow-button w-full py-2.5 rounded-lg text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFull ? "Cupo lleno" : "Unirse al Scrim"}
          </button>
        )}
        {accent === "live" && s.stream_link && (
          <a href={s.stream_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gaming-cyan text-sm hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Ver stream
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-3xl bg-mesh">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-gaming-cyan/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative px-6 py-10 md:py-14 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-gaming-cyan/10 border border-gaming-cyan/20 text-gaming-cyan text-sm font-medium">
              <Swords className="h-4 w-4" /> Calentamiento casual
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display gradient-text leading-[1.1] mb-2">Scrims</h1>
            <p className="text-muted-foreground text-lg">Partidas de práctica organizadas por creadores y admins.</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="glow-button px-6 py-3 rounded-xl text-primary-foreground font-semibold inline-flex items-center gap-2 self-start">
              <Plus className="h-4 w-4" /> Crear Scrim
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-4 flex items-center gap-2">
          <Radio className="h-6 w-6 text-gaming-pink animate-pulse" /> En Vivo
        </h2>
        {live.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {live.map((s) => <ScrimCard key={s.id} s={s} accent="live" />)}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-muted-foreground text-sm">No hay scrims en vivo en este momento.</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Próximos
        </h2>
        {upcoming.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((s) => <ScrimCard key={s.id} s={s} accent="upcoming" />)}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-muted-foreground text-sm">No hay scrims programados.</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold font-display text-foreground mb-4">Historial</h2>
        {history.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((s) => <ScrimCard key={s.id} s={s} accent="history" />)}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-muted-foreground text-sm">No hay historial de scrims aún.</div>
        )}
      </section>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Scrim</DialogTitle>
            <DialogDescription>Configura los detalles del scrim.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Scrim Nocturno #1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Código de sala</label>
              <Input value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} placeholder="WARZONE-123" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Cupos máximos</label>
                <Input type="number" min="1" value={form.max_players} onChange={(e) => setForm({ ...form, max_players: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Contraseña</label>
                <Input value={form.room_password} onChange={(e) => setForm({ ...form, room_password: e.target.value })} placeholder="Opcional" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Modo</label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solo">Solo</SelectItem>
                  <SelectItem value="Duo">Duo</SelectItem>
                  <SelectItem value="Trio">Trio</SelectItem>
                  <SelectItem value="Squad">Squad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Fecha y Hora</label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Link del Stream (opcional)</label>
              <Input value={form.stream_link} onChange={(e) => setForm({ ...form, stream_link: e.target.value })} placeholder="https://twitch.tv/..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Descripción (opcional)</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Reglas, mapa o detalles del lobby" />
            </div>
          </div>
          <Button onClick={createScrim} disabled={creating} className="w-full mt-2">
            {creating ? "Creando..." : "Crear Scrim"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
