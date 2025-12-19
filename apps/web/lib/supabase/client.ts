import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization - 빌드 시 클라이언트 생성 방지
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase URL or Anon Key is missing. Please check your environment variables."
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Proxy로 lazy initialization 구현
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    // 함수인 경우 바인딩 필요
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
