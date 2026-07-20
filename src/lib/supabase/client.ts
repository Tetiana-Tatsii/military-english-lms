import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
    );
  }

  return { url, anonKey };
}

/**
 * Browser Supabase client (cookie-based session for SSR / middleware).
 * Call per usage site; createBrowserClient singletons in the browser.
 */
export function createClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey, {
    auth: {
      // Password login only — do not parse ?code= from the URL
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        apikey: anonKey,
      },
    },
  });
}

let browserClient: SupabaseClient | null = null;

function getBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    // SSR / RSC must use `@/lib/supabase/server` instead.
    // Return a throw-on-use proxy so accidental server imports fail loudly.
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          "Browser supabase client used on the server. Import createClient from @/lib/supabase/server instead.",
        );
      },
    });
  }

  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

/**
 * Lazy browser singleton for existing client components / providers.
 * Safe to import from "use client" modules — initializes only in the browser.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getBrowserClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
