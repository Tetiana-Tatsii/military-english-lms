"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { nameToEmail } from "@/lib/authEmail";
import { hashPassword, verifyPassword } from "@/lib/password";
import type {
  AccountStatus,
  SessionUser,
  UserAccount,
  UserRole,
} from "@/types";

export type PostLoginHandler = (userId: string) => Promise<void>;

interface AuthContextValue {
  user: SessionUser | null;
  usersDb: UserAccount[];
  authReady: boolean;
  setUser: React.Dispatch<React.SetStateAction<SessionUser | null>>;
  registerPostLoginHandler: (handler: PostLoginHandler) => () => void;
  restoreSession: () => Promise<string | null>;
  fetchUsersFromSupabase: () => Promise<void>;
  registerUser: (
    name: string,
    password: string,
    role: UserRole,
  ) => Promise<string | null>;
  login: (name: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [usersDb, setUsersDb] = useState<UserAccount[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const postLoginHandlers = useRef<PostLoginHandler[]>([]);

  const registerPostLoginHandler = useCallback((handler: PostLoginHandler) => {
    postLoginHandlers.current.push(handler);
    return () => {
      postLoginHandlers.current = postLoginHandlers.current.filter(
        (h) => h !== handler,
      );
    };
  }, []);

  const runPostLoginHandlers = useCallback(async (userId: string) => {
    for (const handler of postLoginHandlers.current) {
      await handler(userId);
    }
  }, []);

  const fetchUsersFromSupabase = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role, status, squad_id")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setUsersDb(
        data.map((u) => ({
          id: u.id,
          name: u.name,
          password: "",
          role: u.role as UserRole,
          status: u.status as AccountStatus,
          squadId: u.squad_id,
        })),
      );
    }
  }, []);

  const clearBrokenSession = useCallback(async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("lanp_user");
    setUser(null);
  }, []);

  const applySessionUser = useCallback((sessionData: SessionUser) => {
    setUser(sessionData);
    sessionStorage.setItem("lanp_user", JSON.stringify(sessionData));
    return sessionData.id;
  }, []);

  const restoreUserFromAuthSession = useCallback(
    async (authUserId: string): Promise<string | null> => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, role, status, squad_id")
        .eq("id", authUserId)
        .single();

      if (!profileData) {
        await clearBrokenSession();
        return null;
      }

      return applySessionUser({
        id: profileData.id,
        name: profileData.name,
        role: profileData.role as UserRole,
        squadId: profileData.squad_id,
      });
    },
    [applySessionUser, clearBrokenSession],
  );

  const restoreSession = useCallback(async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const savedUserSession = sessionStorage.getItem("lanp_user");
    let activeUserId: string | null = session?.user?.id ?? null;

    if (savedUserSession) {
      try {
        if (session?.user) {
          activeUserId = await restoreUserFromAuthSession(session.user.id);
        } else {
          sessionStorage.removeItem("lanp_user");
          setUser(null);
          activeUserId = null;
        }
      } catch (e) {
        console.error("Помилка парсингу сесії:", e);
        sessionStorage.removeItem("lanp_user");
        activeUserId = null;
      }
    } else if (session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, role, status, squad_id")
        .eq("id", session.user.id)
        .single();

      if (!profileError && profileData) {
        activeUserId = applySessionUser({
          id: profileData.id,
          name: profileData.name,
          role: profileData.role as UserRole,
          squadId: profileData.squad_id,
        });
      } else {
        await clearBrokenSession();
        activeUserId = null;
      }
    }

    await fetchUsersFromSupabase();
    return activeUserId;
  }, [
    applySessionUser,
    clearBrokenSession,
    fetchUsersFromSupabase,
    restoreUserFromAuthSession,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await restoreSession();
      } catch (error) {
        console.error("Помилка відновлення сесії:", error);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  const finishLogin = useCallback(
    async (userId: string): Promise<string | null> => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, role, status, squad_id")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        return "Профіль не знайдено.";
      }

      if (profileData.status === "pending") {
        return "Ваш акаунт ще не активовано адміністрацією.";
      }

      applySessionUser({
        id: profileData.id,
        name: profileData.name,
        role: profileData.role as UserRole,
        squadId: profileData.squad_id,
      });

      await runPostLoginHandlers(profileData.id);
      return null;
    },
    [applySessionUser, runPostLoginHandlers],
  );

  const registerUser = useCallback(
    async (
      name: string,
      password: string,
      role: UserRole,
    ): Promise<string | null> => {
      const { data: existing } = await supabase
        .from("profiles")
        .select("name")
        .eq("name", name);
      if (existing && existing.length > 0) {
        return "Користувач з таким іменем вже існує.";
      }

      const hashedPassword = await hashPassword(password);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nameToEmail(name),
        password,
        options: {
          data: { name, role },
        },
      });

      if (authError) {
        console.error("Supabase Auth error:", authError);
        const uid = `usr-${Date.now()}`;
        const { error } = await supabase.from("profiles").insert([
          {
            id: uid,
            name,
            password: hashedPassword,
            role,
            status: "pending",
            squad_id: role === "student" ? "Alpha Squad" : null,
          },
        ]);

        if (error) return "Помилка реєстрації на сервері.";
        await fetchUsersFromSupabase();
        return null;
      }

      if (authData.user) {
        const { error } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            name,
            password: hashedPassword,
            role,
            status: "pending",
            squad_id: role === "student" ? "Alpha Squad" : null,
          },
        ]);

        if (error) return "Помилка створення профілю.";
        await fetchUsersFromSupabase();
      }

      return null;
    },
    [fetchUsersFromSupabase],
  );

  const login = useCallback(
    async (name: string, password: string): Promise<string | null> => {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: nameToEmail(name),
          password,
        });

      if (!authError && authData?.user) {
        return finishLogin(authData.user.id);
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_profile_for_login",
        { p_name: name },
      );

      if (rpcError || !rpcData || rpcData.error === "not_found") {
        return authError?.message?.includes("Invalid login")
          ? "Невірне ім'я або пароль."
          : "Користувача не знайдено.";
      }

      const data = {
        id: rpcData.id as string,
        name: rpcData.name as string,
        password: rpcData.password_hash as string,
        role: rpcData.role as string,
        status: rpcData.status as string,
        auth_email: (rpcData.auth_email as string | null) ?? null,
      };

      if (data.status === "pending") {
        return "Ваш акаунт ще не активовано адміністрацією.";
      }

      if (data.auth_email) {
        const { data: authByRealEmail, error: realEmailError } =
          await supabase.auth.signInWithPassword({
            email: data.auth_email,
            password,
          });
        if (!realEmailError && authByRealEmail?.user) {
          return finishLogin(authByRealEmail.user.id);
        }
      }

      if (!data.password) return "Користувача не знайдено.";

      const isHashed =
        data.password.startsWith("$2b$") || data.password.startsWith("$2a$");
      let isPasswordValid: boolean;

      if (isHashed) {
        isPasswordValid = await verifyPassword(password, data.password);
      } else {
        isPasswordValid = password === data.password;
        if (isPasswordValid) {
          const hashedPassword = await hashPassword(password);
          await supabase
            .from("profiles")
            .update({ password: hashedPassword })
            .eq("id", data.id);
        }
      }

      if (!isPasswordValid) return "Невірний пароль.";

      const authEmailHint = data.auth_email ?? nameToEmail(data.name);
      return (
        `Пароль у профілі правильний, але Supabase Auth не приймає його. ` +
        `Синхронізуйте пароль для email: ${authEmailHint} ` +
        `(Supabase → Authentication → Users, або SQL UPDATE auth.users за profile id).`
      );
    },
    [finishLogin],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem("lanp_user");
  }, []);

  const approveUser = useCallback(
    async (userId: string) => {
      setUsersDb((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: "approved" as const } : u,
        ),
      );
      const { error } = await supabase
        .from("profiles")
        .update({ status: "approved" })
        .eq("id", userId);
      if (error) await fetchUsersFromSupabase();
    },
    [fetchUsersFromSupabase],
  );

  const rejectUser = useCallback(
    async (userId: string) => {
      setUsersDb((prev) => prev.filter((u) => u.id !== userId));
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (error) await fetchUsersFromSupabase();
    },
    [fetchUsersFromSupabase],
  );

  const changeUserPassword = useCallback(
    async (userId: string, newPassword: string) => {
      const hashedPassword = await hashPassword(newPassword);
      const { error } = await supabase
        .from("profiles")
        .update({ password: hashedPassword })
        .eq("id", userId);
      if (error) console.error("Помилка зміни пароля:", error.message);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        usersDb,
        authReady,
        setUser,
        registerPostLoginHandler,
        restoreSession,
        fetchUsersFromSupabase,
        registerUser,
        login,
        logout,
        approveUser,
        rejectUser,
        changeUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
