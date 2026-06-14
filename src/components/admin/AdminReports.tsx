import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import SignedFileLink from "@/components/SignedFileLink";

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      console.error("Error loading reports:", err);
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleResolve = async (id: string, status: string) => {
    try {
      const update: any = { status, resolved_at: new Date().toISOString() };
      if (notes[id]) update.admin_notes = notes[id];
      const { error } = await supabase.from("reports").update(update).eq("id", id);
      if (error) throw error;
      toast.success(`Reporte marcado como ${status}`);
      fetchReports();
    } catch (err: any) {
      toast.error("Error al actualizar reporte");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Reportes ({reports.length})</h2>
        <Button variant="ghost" size="sm" onClick={fetchReports} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando reportes...</p>
      ) : reports.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay reportes.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reportado por</TableHead>
                <TableHead>Jugador reportado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Evidencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Notas / Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-xs">{r.reporter_nickname}</TableCell>
                  <TableCell className="text-xs">{r.reported_player}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{r.description}</TableCell>
                  <TableCell>
                    {r.screenshot_url ? (
                      <SignedFileLink urlOrPath={r.screenshot_url} className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                        Ver
                      </SignedFileLink>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "resolved" ? "default" : r.status === "dismissed" ? "outline" : "secondary"} className="text-xs">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es")}</TableCell>
                  <TableCell>
                    {r.status === "pending" ? (
                      <div className="space-y-1">
                        <Textarea
                          placeholder="Notas admin..."
                          className="h-16 text-xs"
                          value={notes[r.id] || ""}
                          onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleResolve(r.id, "resolved")}>Resolver</Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleResolve(r.id, "dismissed")}>Descartar</Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{r.admin_notes || "—"}</span>
                    )}
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
