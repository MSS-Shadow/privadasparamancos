import { useState, useEffect } from "react";
import { Download, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

interface ScrimParticipant {
  id: string;
  scrim_id: string;
  scrim_title: string;
  creator_nickname: string;
  nickname: string;
  player_id: string;
  team: string;
  platform: string;
  joined_at: string;
}

export default function AdminScrimParticipants() {
  const [participants, setParticipants] = useState<ScrimParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: scrims } = await supabase.from("scrims").select("id, name, created_by");
    const { data: parts } = await supabase.from("scrim_participants").select("*").order("joined_at", { ascending: false });

    if (scrims && parts) {
      const creatorIds = Array.from(new Set(scrims.map((s: any) => s.created_by).filter(Boolean)));
      let nickMap: Record<string, string> = {};
      if (creatorIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, nickname").in("user_id", creatorIds);
        profs?.forEach((p: any) => { nickMap[p.user_id] = p.nickname; });
      }
      const scrimMap = new Map(scrims.map((s: any) => [s.id, s]));
      const mapped: ScrimParticipant[] = parts.map((p: any) => {
        const scrim = scrimMap.get(p.scrim_id) as any;
        return {
          ...p,
          scrim_title: scrim?.name ?? "Desconocido",
          creator_nickname: (scrim && nickMap[scrim.created_by]) ?? "—",
        };
      });
      setParticipants(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = () => {
    exportToCsv("participantes_scrims", ["Scrim", "Organizador", "Nickname", "Player ID", "Equipo", "Plataforma", "Hora"],
      participants.map((s) => [s.scrim_title, s.creator_nickname, s.nickname, s.player_id, s.team, s.platform, new Date(s.joined_at).toLocaleString("es")])
    );
  };

  const deleteParticipant = async (id: string) => {
    const { error } = await supabase.from("scrim_participants").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Participante eliminado");
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Cargando participantes...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">Participantes de Scrims</h2>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/scrims"><Plus className="h-4 w-4 mr-1" /> Crear Scrim</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>
      {participants.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay participantes de scrims.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scrim</TableHead>
                <TableHead className="hidden md:table-cell">Organizador</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead className="hidden md:table-cell">Player ID</TableHead>
                <TableHead className="hidden lg:table-cell">Equipo</TableHead>
                <TableHead className="hidden md:table-cell">Plataforma</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-foreground font-medium">{s.scrim_title}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{s.creator_nickname}</TableCell>
                  <TableCell className="text-foreground">{s.nickname}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{s.player_id}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{s.team}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline">{s.platform}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(s.joined_at).toLocaleString("es", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteParticipant(s.id)} title="Eliminar">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
