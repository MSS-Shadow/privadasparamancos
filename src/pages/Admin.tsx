import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminPlayers from "@/components/admin/AdminPlayers";
import AdminCreators from "@/components/admin/AdminCreators";
import AdminClanLeaderRequests from "@/components/admin/AdminClanLeaderRequests";
import AdminTournamentRegistrations from "@/components/admin/AdminTournamentRegistrations";
import AdminTournamentScoring from "@/components/admin/AdminTournamentScoring";
import AdminBracketManager from "@/components/admin/AdminBracketManager";
import AdminScrimParticipants from "@/components/admin/AdminScrimParticipants";
import AdminLobbyGenerator from "@/components/admin/AdminLobbyGenerator";
import AdminRoleManager from "@/components/admin/AdminRoleManager";
import AdminVerification from "@/components/admin/AdminVerification";
import AdminReports from "@/components/admin/AdminReports";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminSmurfDetection from "@/components/admin/AdminSmurfDetection";
import AdminModerationLog from "@/components/admin/AdminModerationLog";
import AdminBackup from "@/components/admin/AdminBackup";
import AdminSiteConfig from "@/components/admin/AdminSiteConfig";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panel de Administrador</h1>
        <p className="text-muted-foreground">Gestiona toda la plataforma Privadas para Mancos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full text-xs">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="players">👥 Jugadores</TabsTrigger>
            <TabsTrigger value="creators">⭐ Creadores</TabsTrigger>
            <TabsTrigger value="clan-leaders">🏆 Clan Leaders</TabsTrigger>
            <TabsTrigger value="tournaments">🏆 Torneos</TabsTrigger>
            <TabsTrigger value="scoring">📈 Scoring</TabsTrigger>
            <TabsTrigger value="brackets">🔗 Brackets</TabsTrigger>
            <TabsTrigger value="scrims">⚔️ Scrims</TabsTrigger>
            <TabsTrigger value="lobbies">🎮 Lobbies</TabsTrigger>
            <TabsTrigger value="roles">🔑 Roles</TabsTrigger>
            <TabsTrigger value="verification">✅ Verificación</TabsTrigger>
            <TabsTrigger value="reports">📋 Reportes</TabsTrigger>
            <TabsTrigger value="announcements">📢 Anuncios</TabsTrigger>
            <TabsTrigger value="smurf">🚩 Smurf</TabsTrigger>
            <TabsTrigger value="moderation">🛡️ Moderación</TabsTrigger>
            <TabsTrigger value="backup">💾 Respaldo</TabsTrigger>
            <TabsTrigger value="site-config">⚙️ Config</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
        <TabsContent value="players"><AdminPlayers /></TabsContent>
        <TabsContent value="creators"><AdminCreators /></TabsContent>
        <TabsContent value="clan-leaders"><AdminClanLeaderRequests /></TabsContent>
        <TabsContent value="tournaments"><AdminTournamentRegistrations /></TabsContent>
        <TabsContent value="scoring"><AdminTournamentScoring /></TabsContent>
        <TabsContent value="brackets"><AdminBracketManager /></TabsContent>
        <TabsContent value="scrims"><AdminScrimParticipants /></TabsContent>
        <TabsContent value="lobbies"><AdminLobbyGenerator /></TabsContent>
        <TabsContent value="roles"><AdminRoleManager /></TabsContent>
        <TabsContent value="verification"><AdminVerification /></TabsContent>
        <TabsContent value="reports"><AdminReports /></TabsContent>
        <TabsContent value="announcements"><AdminAnnouncements /></TabsContent>
        <TabsContent value="smurf"><AdminSmurfDetection /></TabsContent>
        <TabsContent value="moderation"><AdminModerationLog /></TabsContent>
        <TabsContent value="backup"><AdminBackup /></TabsContent>
        <TabsContent value="site-config"><AdminSiteConfig /></TabsContent>
      </Tabs>
    </div>
  );
}
