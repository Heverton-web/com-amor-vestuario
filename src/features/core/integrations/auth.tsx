import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/features/core/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isStaff: boolean;
  isSuperAdmin: boolean;
  pages: Set<string>;
  canAccess: (pageKey: string) => boolean;
  refreshAccess: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pages, setPages] = useState<Set<string>>(new Set());

  async function loadAccess(userId: string) {
    const [rolesRes, superRes, pagesRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("superadmins").select("user_id").eq("user_id", userId).maybeSingle(),
      supabase.from("admin_page_access").select("page_key").eq("user_id", userId),
    ]);
    const isSuper = !!superRes.data;
    setIsSuperAdmin(isSuper);
    setIsStaff(
      isSuper || !!rolesRes.data?.some((r) => r.role === "admin" || r.role === "consultor"),
    );
    setPages(new Set(pagesRes.data?.map((p) => p.page_key) ?? []));
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadAccess(s.user.id), 0);
      } else {
        setIsStaff(false);
        setIsSuperAdmin(false);
        setPages(new Set());
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadAccess(data.session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    user,
    session,
    loading,
    isStaff,
    isSuperAdmin,
    pages,
    canAccess: (key: string) => {
      if (key === "dev") {
        return user?.email === "hevertoneduardoperes@gmail.com";
      }
      return isSuperAdmin || pages.has(key);
    },
    refreshAccess: async () => {
      if (user) await loadAccess(user.id);
    },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signUp: async (email, password, name) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: { full_name: name },
        },
      });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
