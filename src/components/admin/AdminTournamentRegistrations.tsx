import { useState, useEffect } from "react";
import { Download, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Tournament = Tables<"tournaments">;
type Registration = Tables<"tournament_registrations">;

interface RegWithTournament extends Registration {
  tournamentName: string;
}

export default function AdminTournamentRegistrations() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<RegWithTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTournament, setNewTournament] = useState({ name: "", mode: "Squad", date: "", max_players: 120, region: "LATAM", image_url: "" });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: t } = await supabase.from("tournaments").select("*").order("date", { ascending: false });
    const { data: r } = await supabase.from("tournament_registrations").select("*");
    if (t) {
      setTournaments(t);
      if (r) {
        const mapped: RegWithTournament[] = r.map((reg) => ({
          ...reg,
          tournamentName: t.find((tour) => tour.id === reg.tournament_id)?.name ?? "Desconocido",
        }));
        setRegistrations(mapped);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = selectedTournament === "all"
    ? registrations
    : registrations.filter((r) => r.tournament_id === selectedTournament);

  const handleExport = () => {
    exportToCsv("inscripciones_torneos", ["Torneo", "Equipo", "Nickname", "Player ID", "Plataforma", "Fecha"],
      filtered.map((r) => [r.tournamentName, r.tournament_team_name, r.nickname, r.player_id, r.platform, new Date(r.created_at).toLocaleDateString("es")])
    );
  };

  const deleteRegistration = async (id: string) => {
    const { error } = await supabase.from("tournament_registrations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Inscripción eliminada");
    fetchData();
  };

  const deleteTournament = async (id: string) => {
    await supabase.from("tournament_registrations").delete().eq("tournament_id", id);
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Torneo eliminado");
    setSelectedTournament("all");
    fetchData();
  };

  const createTournament = async () => {
    if (!newTournament.name || !newTournament.date) {
      toast.error("Nombre y fecha son obligatorios");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("tournaments").insert({
      name: newTournament.name,
      mode: newTournament.mode,
      date: new Date(newTournament.date).toISOString(),
      max_players: newTournament.max_players,
      region: newTournament.region,
      image_url: newTournament.image_url,
    } as any);
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Torneo creado");
    setShowCreateDialog(false);
    setNewTournament({ name: "", mode: "Squad", date: "", max_players: 120, region: "LATAM", image_url: "" });
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Cargando torneos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">Inscripciones de Torneos</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Crear Torneo
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedTournament} onValueChange={setSelectedTournament}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Filtrar por torneo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Torneos</SelectItem>
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTournament !== "all" && (
          <Button variant="destructive" size="sm" onClick={() => deleteTournament(selectedTournament)}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar Torneo
          </Button>
        )}
      </div>

      {/* Tournament list */}
      {tournaments.length > 0 && (
        <div className="border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Torneos ({tournaments.length})</h3>
          <div className="grid gap-2">
            {tournaments.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium text-sm">{t.name}</span>
                  <Badge variant="outline" className="text-xs">{t.mode}</Badge>
                  <span className="text-muted-foreground text-xs">{new Date(t.date).toLocaleDateString("es")}</span>
                  <Badge className={t.status === "Open" ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground"}>
                    {t.status === "Open" ? "Abierto" : t.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTournament(t.id)} title="Eliminar torneo">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registrations table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Torneo</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead className="hidden md:table-cell">Player ID</TableHead>
              <TableHead className="hidden md:table-cell">Plataforma</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-foreground font-medium">{r.tournamentName}</TableCell>
                <TableCell className="text-muted-foreground">{r.tournament_team_name}</TableCell>
                <TableCell className="text-foreground">{r.nickname}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{r.player_id}</TableCell>
                <TableCell className="hidden md:table-cell"><Badge variant="outline">{r.platform}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("es")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRegistration(r.id)} title="Eliminar inscripción">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No se encontraron inscripciones.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Tournament Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Torneo</DialogTitle>
            <DialogDescription>Completa los detalles del torneo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nombre</label>
              <Input value={newTournament.name} onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })} placeholder="Privadas para Mancos #5" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Modo</label>
              <Select value={newTournament.mode} onValueChange={(v) => setNewTournament({ ...newTournament, mode: v })}>
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
              <label className="text-sm text-muted-foreground mb-1 block">Fecha</label>
              <Input type="datetime-local" value={newTournament.date} onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Máx. Jugadores</label>
              <Input type="number" value={newTournament.max_players} onChange={(e) => setNewTournament({ ...newTournament, max_players: parseInt(e.target.value) || 120 })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Región</label>
              <Select value={newTournament.region} onValueChange={(v) => setNewTournament({ ...newTournament, region: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LATAM">LATAM</SelectItem>
                  <SelectItem value="BR">BR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">URL de Imagen (evidencia)</label>
              <Input value={newTournament.image_url} onChange={(e) => setNewTournament({ ...newTournament, image_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={createTournament} disabled={creating} className="w-full mt-2">
            {creating ? "Creando..." : "Crear Torneo"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
