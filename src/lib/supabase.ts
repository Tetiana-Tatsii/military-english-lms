import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
}

// sessionStorage — окрема auth-сесія на вкладку (localStorage спільний для всіх вкладок)
const tabAuthStorage =
  typeof window !== "undefined"
    ? {
        getItem: (key: string) => sessionStorage.getItem(key),
        setItem: (key: string, value: string) =>
          sessionStorage.setItem(key, value),
        removeItem: (key: string) => sessionStorage.removeItem(key),
      }
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: tabAuthStorage,
  },
});
