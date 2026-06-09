import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PlayerRow = {
  id: string;
  user_id: string;
  nickname: string | null;
  player_id: string | null;
  email: string | null;
  platform: string | null;
  clan: string | null;
  status: string;
  verified: boolean | null;
};

type FunctionErrorPayload = { error?: string };

const getMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 18000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("La operación tardó demasiado. Se canceló el cargando para evitar que la página se cuelgue.")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

const getDeleteErrorMessage = async (error: { message?: string; context?: { json?: () => Promise<FunctionErrorPayload> } }) => {
  const fallback = error.message || "Error al eliminar";
  try {
    const payload = await error?.context?.json?.();
    return payload?.error || fallback;
  } catch {
    return fallback;
  }
};

export default function AdminPlayers() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PlayerRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").order("created_at", { ascending: false })
      );
      if (error) throw error;
      setPlayers(data || []);
    } catch (err: unknown) {
      console.error("Error loading players:", err);
      toast.error("Error al cargar jugadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlayers(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await withTimeout(supabase.from("profiles").update({ status }).eq("user_id", userId));
      if (error) throw error;
      toast.success(`Estado actualizado a ${status}`);
      await fetchPlayers();
    } catch (e: unknown) {
      toast.error(getMessage(e, "Error al actualizar estado"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("admin-delete-user", {
          body: { target_user_id: deleteTarget.user_id },
        })
      );
      if (error) throw new Error(await getDeleteErrorMessage(error));
      const payload = data as FunctionErrorPayload | null;
      if (payload?.error) throw new Error(payload.error);
      toast.success("Cuenta eliminada");
      setDeleteTarget(null);
      setConfirmText("");
      await fetchPlayers();
    } catch (e: unknown) {
      toast.error(getMessage(e, "Error al eliminar"));
      await fetchPlayers();
    } finally {
      setDeleting(false);
    }
  };

  const filtered = players.filter((p) =>
    p.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    p.player_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Jugadores Registrados ({players.length})</h2>
        <Button variant="ghost" size="sm" onClick={fetchPlayers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nickname, player ID o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando jugadores...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Player ID</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Clan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nickname}</TableCell>
                  <TableCell className="font-mono text-xs">{p.player_id}</TableCell>
                  <TableCell>{p.platform}</TableCell>
                  <TableCell>{p.clan || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "destructive"} className="text-xs">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.verified ? "✅" : "❌"}</TableCell>
                  <TableCell>
                    <Select value={p.status} onValueChange={(v) => updateStatus(p.user_id, v)} disabled={updatingUserId === p.user_id || deleting}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 ml-2"
                      disabled={deleting || updatingUserId === p.user_id}
                      onClick={() => { setDeleteTarget(p); setConfirmText(""); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta de {deleteTarget?.nickname}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción borra el perfil, los roles y la cuenta de autenticación. No se puede deshacer.
              Escribe <strong>DELETE</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "DELETE" || deleting}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
            >
              {deleting ? "Eliminando..." : "Eliminar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
