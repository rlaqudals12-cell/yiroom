"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - useAuth().getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('table').select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 빌드 시 환경 변수가 없을 수 있음 - 빈 클라이언트 반환 방지
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase URL or Anon Key is missing. Please check your environment variables."
      );
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        try {
          const token = await getToken();
          if (!token) {
            console.warn(
              "[Clerk-Supabase] Token is null - user may not be authenticated"
            );
          }
          return token ?? null;
        } catch (error) {
          console.error("[Clerk-Supabase] Failed to get token:", error);
          return null;
        }
      },
    });
  }, [getToken]);

  return supabase;
}
