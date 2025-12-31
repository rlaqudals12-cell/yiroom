/**
 * Supabase 클라이언트 설정 (Clerk 통합)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-expo';
import { useMemo, useRef, useEffect } from 'react';

// Supabase 설정
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 공개 데이터용 Supabase 클라이언트
 * 인증 없이 사용 가능
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Clerk 인증 통합 Supabase 클라이언트 Hook
 * Clerk의 JWT 토큰을 Supabase 인증에 사용
 *
 * 성능 최적화:
 * - useRef로 getToken 함수 참조를 저장하여 클라이언트 재생성 방지
 * - 클라이언트는 한 번만 생성되고, 매 요청 시 최신 토큰 사용
 */
export function useClerkSupabaseClient(): SupabaseClient {
  const { getToken } = useAuth();

  // getToken 함수 참조를 저장 (매 렌더링마다 변경되지만 ref는 유지)
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // 클라이언트는 한 번만 생성
  const client = useMemo(() => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        fetch: async (url, options = {}) => {
          // ref에서 최신 getToken 함수 사용
          const clerkToken = await getTokenRef.current({ template: 'supabase' });

          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    });
  }, []); // 의존성 배열 비움 - 클라이언트 한 번만 생성

  return client;
}

/**
 * 환경 변수 검증
 */
export function validateSupabaseConfig(): boolean {
  if (!SUPABASE_URL) {
    console.warn('Missing EXPO_PUBLIC_SUPABASE_URL');
    return false;
  }
  if (!SUPABASE_ANON_KEY) {
    console.warn('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return false;
  }
  return true;
}
