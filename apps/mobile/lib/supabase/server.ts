/**
 * Supabase 서버 클라이언트 호환 레이어 (모바일)
 *
 * 웹에서는 Clerk + Server Component 통합을 사용하지만
 * 모바일에서는 단일 클라이언트(supabase)를 사용합니다.
 *
 * 이 파일은 웹의 `@/lib/supabase/server` import 경로 호환을 위한 shim입니다.
 */

import { supabase } from '../supabase';

/**
 * 모바일에서는 Clerk 서버 통합이 없으므로 일반 클라이언트 반환
 */
export function createClerkSupabaseClient() {
  return supabase;
}
