import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Trophy, BarChart3, Users, User, Swords, CalendarDays,
  Medal, Star, Megaphone, Shield, LogIn, Menu, X, Crosshair
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Map each nav path to its lazy import factory so we can prefetch on hover/focus.
// Using the same import paths as src/App.tsx ensures Vite reuses the same chunk.
const routePrefetch: Record<string, () => Promise<unknown>> = {
  "/tournaments": () => import("@/pages/Tournaments"),
  "/rankings": () => import("@/pages/Rankings"),
  "/teams": () => import("@/pages/Teams"),
  "/players": () => import("@/pages/Players"),
  "/scrims": () => import("@/pages/Scrims"),
  "/upcoming": () => import("@/pages/Upcoming"),
  "/results": () => import("@/pages/Results"),
  "/hall-of-fame": () => import("@/pages/HallOfFame"),
  "/announcements": () => import("@/pages/Announcements"),
  "/creators": () => import("@/pages/Creators"),
  "/admin": () => import("@/pages/Admin"),
  "/profile": () => import("@/pages/Profile"),
  "/auth": () => import("@/pages/Auth"),
};

const prefetched = new Set<string>();
const prefetchRoute = (path: string) => {
  if (prefetched.has(path)) return;
  const loader = routePrefetch[path];
  if (!loader) return;
  prefetched.add(path);
  // Fire and forget; ignore errors (will retry on real navigation).
  loader().catch(() => prefetched.delete(path));
};

const navItems = [
  { label: "Inicio", path: "/", icon: Home },
  { label: "Privadas", path: "/tournaments", icon: Trophy },
  { label: "Rankings", path: "/rankings", icon: BarChart3 },
  { label: "Squads", path: "/teams", icon: Users },
  { label: "Jugadores", path: "/players", icon: User },
  { label: "Scrims", path: "/scrims", icon: Swords },
  { label: "Próximos", path: "/upcoming", icon: CalendarDays },
  { label: "Resultados", path: "/results", icon: Medal },
  { label: "Salón de la Fama", path: "/hall-of-fame", icon: Star },
  { label: "Anuncios", path: "/announcements", icon: Megaphone },
  { label: "Creators", path: "/creators", icon: Star },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();

  const allNav = [
    ...navItems,
    ...(isAdmin ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] border-r border-border/50 bg-sidebar fixed h-screen z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-tactical-orange">
            <Crosshair className="h-6 w-6 text-background" />
          </div>
          <div>
            <span className="font-bold text-xl font-display tracking-tight text-foreground">Warzone Hub</span>
            <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase -mt-0.5">Private · LATAM</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {allNav.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => prefetchRoute(item.path)}
                onFocus={() => prefetchRoute(item.path)}
                onTouchStart={() => prefetchRoute(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  active
                    ? "text-primary-foreground"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border/50">
          {user ? (
            <Link
              to="/profile"
              onMouseEnter={() => prefetchRoute("/profile")}
              onFocus={() => prefetchRoute("/profile")}
              className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-gaming-cyan/30 flex items-center justify-center border border-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{profile?.nickname || "Mi Perfil"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </Link>
          ) : (
            <Link
              to="/auth"
              onMouseEnter={() => prefetchRoute("/auth")}
              onFocus={() => prefetchRoute("/auth")}
              className="glow-button flex items-center justify-center gap-2 text-primary-foreground font-semibold py-3 rounded-xl w-full"
            >
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-tactical-orange">
              <Crosshair className="h-5 w-5 text-background" />
            </div>
            <span className="font-bold text-lg font-display tracking-tight text-foreground">Warzone Hub</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/profile"
                onMouseEnter={() => prefetchRoute("/profile")}
                onFocus={() => prefetchRoute("/profile")}
                className="text-foreground p-1.5 hover:text-primary transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/auth"
                onMouseEnter={() => prefetchRoute("/auth")}
                onFocus={() => prefetchRoute("/auth")}
                className="text-primary font-medium text-sm"
              >
                Entrar
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-foreground hover:bg-secondary rounded-xl transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl pt-14 lg:hidden overflow-y-auto"
          >
            <nav className="p-4 space-y-1">
              {allNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  onMouseEnter={() => prefetchRoute(item.path)}
                  onFocus={() => prefetchRoute(item.path)}
                  onTouchStart={() => prefetchRoute(item.path)}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-base font-medium transition-all ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[260px] pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
