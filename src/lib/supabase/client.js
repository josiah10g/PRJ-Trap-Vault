import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const invalidConfig =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("YOUR_PROJECT_ID") ||
    supabaseAnonKey.includes("YOUR_ANON_KEY");

  if (invalidConfig) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
