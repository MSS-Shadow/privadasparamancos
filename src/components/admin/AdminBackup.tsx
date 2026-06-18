import { useState, useEffect } from "react";
import { Download, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/exportCsv";

interface TableInfo {
  name: string;
  count: number;
  exportFn: () => void;
}

export default function AdminBackup() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [allData, setAllData] = useState<any>({});

  useEffect(() => {
    const fetch = async () => {
      const [profiles, tournaments, regs, scrims, scrimParts, creators, modLogs] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("tournaments").select("*"),
        supabase.from("tournament_registrations").select("*"),
        supabase.from("scrims").select("*"),
        supabase.from("scrim_participants").select("*"),
        supabase.from("creator_requests").select("*"),
        supabase.from("moderation_logs").select("*"),
      ]);

      const data = {
        profiles: profiles.data ?? [],
        tournaments: tournaments.data ?? [],
        tournament_registrations: regs.data ?? [],
        scrims: scrims.data ?? [],
        scrim_participants: scrimParts.data ?? [],
        creator_requests: creators.data ?? [],
        moderation_logs: modLogs.data ?? [],
      };
      setAllData(data);

      setTables([
        { name: "Jugadores", count: data.profiles.length, exportFn: () => exportToCsv("backup_jugadores", ["Nickname", "Player ID", "Plataforma", "Clan", "País", "Email", "Verificado"], data.profiles.map((p: any) => [p.nickname, p.player_id, p.platform, p.clan, p.country, p.email, p.verified ? "Sí" : "No"])) },
        { name: "Torneos", count: data.tournaments.length, exportFn: () => exportToCsv("backup_torneos", ["Nombre", "Modo", "Fecha", "Estado", "Máx. Jugadores"], data.tournaments.map((t: any) => [t.name, t.mode, t.date, t.status, t.max_players])) },
        { name: "Inscripciones", count: data.tournament_registrations.length, exportFn: () => exportToCsv("backup_inscripciones", ["Torneo ID", "Equipo", "Nickname", "Player ID", "Plataforma"], data.tournament_registrations.map((r: any) => [r.tournament_id, r.tournament_team_name, r.nickname, r.player_id, r.platform])) },
        { name: "Scrims", count: data.scrims.length, exportFn: () => exportToCsv("backup_scrims", ["Nombre", "Modo", "Fecha", "Estado", "Sala", "Creador"], data.scrims.map((s: any) => [s.name, s.mode, s.scheduled_at, s.status, s.room_id, s.created_by])) },
        { name: "Participantes Scrims", count: data.scrim_participants.length, exportFn: () => exportToCsv("backup_participantes_scrims", ["Scrim ID", "Nickname", "Player ID", "Equipo", "Plataforma"], data.scrim_participants.map((p: any) => [p.scrim_id, p.nickname, p.player_id, p.team, p.platform])) },
        { name: "Solicitudes Creadores", count: data.creator_requests.length, exportFn: () => exportToCsv("backup_creadores", ["Nickname", "Email", "Plataforma", "Canal", "Estado"], data.creator_requests.map((c: any) => [c.nickname, c.email, c.platform, c.channel_link, c.status])) },
        { name: "Log de Moderación", count: data.moderation_logs.length, exportFn: () => exportToCsv("backup_moderacion", ["Acción", "Objetivo", "Razón", "Admin", "Fecha"], data.moderation_logs.map((l: any) => [l.action, l.target_nickname, l.reason, l.admin_nickname, l.created_at])) },
      ]);
    };
    fetch();
  }, []);

  const exportAllJson = () => {
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "backup_completo.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Respaldo</h2>
          <p className="text-sm text-muted-foreground">Descarga respaldos de todos los datos de la plataforma.</p>
        </div>
        <Button onClick={exportAllJson}>
          <Database className="h-4 w-4 mr-1" /> Descargar Respaldo Completo (JSON)
        </Button>
      </div>

      <div className="grid gap-3">
        {tables.map((t) => (
          <div key={t.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{t.name}</span>
              <Badge variant="outline" className="text-xs">{t.count} registros</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={t.exportFn}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
