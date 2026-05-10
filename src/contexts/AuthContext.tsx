import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Tiempo de espera agotado")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  roles: string[];
  loading: boolean;
  isAdmin: boolean;
  isClanLeader: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  isAdmin: false,
  isClanLeader: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async (userId: string) => {
    try {
      const { data } = await withTimeout(
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
      );

      if (!data || data.length === 0) {
        setRoles([]);
        return [];
      }

      const safeRoles = data
        .map((item: any) => {
          const role = item?.role;
          return typeof role === "string" ? role.toLowerCase().trim() : null;
        })
        .filter((role): role is string => role !== null);

      setRoles(safeRoles);
      return safeRoles;
    } catch (err) {
      console.warn("fetchRoles failed:", err);
      setRoles([]);
      return [];
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await withTimeout(
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
      );
      setProfile(data || null);
    } catch {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await Promise.allSettled([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  };

  useEffect(() => {
    let initialized = false;
    const safetyTimer = window.setTimeout(() => {
      if (!initialized) {
        setLoading(false);
      }
    }, 15000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await Promise.allSettled([
          fetchProfile(session.user.id),
          fetchRoles(session.user.id)
        ]);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    withTimeout(supabase.auth.getSession(), 12000)
      .then(async ({ data: { session } }) => {
        if (!initialized) {
          initialized = true;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user?.id) {
            await Promise.allSettled([
              fetchProfile(session.user.id),
              fetchRoles(session.user.id)
            ]);
          }
        }
      })
      .catch((err) => {
        console.warn("getSession failed:", err);
        setSession(null);
        setUser(null);
        setProfile(null);
        setRoles([]);
      })
      .finally(() => setLoading(false));

    return () => {
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      loading,
      isAdmin,
      isClanLeader: roles.includes("clan_leader"),
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}
