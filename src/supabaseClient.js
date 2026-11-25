import { createClient } from "@supabase/supabase-js";

// Client-side environment variables in Vite
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let clientInstance = null;
let initPromise = null;

export const getSupabaseClient = async () => {
  if (clientInstance) return clientInstance;

  if (supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "ahf_supabase_auth",
      },
    });
    return clientInstance;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch("/api?action=public-auth-config");
      if (res.ok) {
        const data = await res.json();
        if (data?.supabaseUrl && data?.supabaseAnonKey) {
          supabaseUrl = data.supabaseUrl;
          supabaseAnonKey = data.supabaseAnonKey;
          clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storageKey: "ahf_supabase_auth",
            },
          });
          return clientInstance;
        }
      }
    } catch (e) {
      console.warn("Could not fetch public auth config:", e);
    }
    return null;
  })();

  return initPromise;
};

// Synchronous instance if already initialized or env vars available
export const getSyncSupabase = () => {
  if (clientInstance) return clientInstance;
  if (supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "ahf_supabase_auth",
      },
    });
    return clientInstance;
  }
  return null;
};
