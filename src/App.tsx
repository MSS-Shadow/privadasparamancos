import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

// Eager: home (LCP-critical) + 404
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy: everything else (code-split per route)
const Tournaments = lazy(() => import("./pages/Tournaments"));
const TournamentDetail = lazy(() => import("./pages/TournamentDetail"));
const TournamentHistory = lazy(() => import("./pages/TournamentHistory"));
const Rankings = lazy(() => import("./pages/Rankings"));
const Teams = lazy(() => import("./pages/Teams"));
const ClanPage = lazy(() => import("./pages/ClanPage"));
const ClanLeaderRequest = lazy(() => import("./pages/ClanLeaderRequest"));
const Players = lazy(() => import("./pages/Players"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Scrims = lazy(() => import("./pages/Scrims"));
const Upcoming = lazy(() => import("./pages/Upcoming"));
const Results = lazy(() => import("./pages/Results"));
const HallOfFame = lazy(() => import("./pages/HallOfFame"));
const Creators = lazy(() => import("./pages/Creators"));
const CreatorRequest = lazy(() => import("./pages/CreatorRequest"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const Activity = lazy(() => import("./pages/Activity"));
const About = lazy(() => import("./pages/About"));
const Rules = lazy(() => import("./pages/Rules"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Report = lazy(() => import("./pages/Report"));
const VerifyAccount = lazy(() => import("./pages/VerifyAccount"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Index />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/privadas" element={<Tournaments />} />
                <Route path="/tournaments/:tournamentName" element={<TournamentDetail />} />
                <Route path="/privadas/:tournamentName" element={<TournamentDetail />} />
                <Route path="/tournament-history" element={<TournamentHistory />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/ranking" element={<Rankings />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/clanes" element={<Teams />} />
                <Route path="/teams/:clanName" element={<ClanPage />} />
                <Route path="/clan-leader-request" element={<ClanLeaderRequest />} />
                <Route path="/players" element={<Players />} />
                <Route path="/player/:nickname" element={<PlayerProfile />} />
                <Route path="/scrims" element={<Scrims />} />
                <Route path="/upcoming" element={<Upcoming />} />
                <Route path="/results" element={<Results />} />
                <Route path="/hall-of-fame" element={<HallOfFame />} />
                <Route path="/creators" element={<Creators />} />
                <Route path="/creator-request" element={<CreatorRequest />} />
                <Route path="/creator-dashboard" element={<CreatorDashboard />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/about" element={<About />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/report" element={<Report />} />
                <Route path="/verify-account" element={<VerifyAccount />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
