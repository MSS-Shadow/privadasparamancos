import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";

const ALL_ROLES = ["admin", "clan_leader", "content_creator", "player"] as const;

export default function AdminRoleManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, nickname, is_clan_leader")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap: Record<string, string[]> = {};
      (allRoles || []).forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        if (r.role) roleMap[r.user_id].push(r.role);
      });

      const processed = (profiles || []).map((u: any) => ({
        ...u,
        roles: roleMap[u.user_id] || [],
      }));

      setUsers(processed);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (userId: string, role: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });
        if (error && !String(error.message).includes("duplicate")) throw error;
      }

      if (role === "clan_leader") {
        await supabase.from("profiles").update({ is_clan_leader: !hasRole }).eq("user_id", userId);
      }

      toast.success(`Rol "${role}" ${hasRole ? "removido" : "asignado"}`);
      await fetchUsers();
    } catch (err: any) {
      console.error("Error toggling role:", err);
      toast.error(`Error al ${hasRole ? "remover" : "asignar"} rol: ${err.message || "desconocido"}`);
    }
  };

  const filtered = users.filter((u) =>
    u.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-muted-foreground">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Gestión de Roles ({users.length})</h2>
        <Button variant="ghost" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nickname o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nickname</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles Actuales</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay usuarios
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nickname || "—"}</TableCell>
                  <TableCell className="text-xs">{user.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? user.roles.map((r: string, i: number) => (
                        <Badge key={i} variant={r === "admin" ? "destructive" : "secondary"} className="text-xs">
                          {r}
                        </Badge>
                      )) : (
                        <span className="text-muted-foreground text-xs">Sin roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ALL_ROLES.map((role) => {
                        const has = user.roles.includes(role);
                        return (
                          <Button
                            key={role}
                            size="sm"
                            variant={has ? "destructive" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => toggleRole(user.user_id, role, has)}
                          >
                            {has ? `- ${role}` : `+ ${role}`}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
