import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Detects unfilled placeholder values so the app falls back to local mock
// mode instead of trying (and failing) to hit a fake URL.
const looksLikePlaceholder =
  supabaseUrl.includes("your-project-id") || supabaseAnonKey.includes("your-anon-public-key");

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !looksLikePlaceholder);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
