/**
 * Clerk + Supabase 클라이언트 호환 레이어 (모바일)
 *
 * 웹에서는 useAuth().getToken()으로 Supabase 클라이언트를 생성하지만
 * 모바일에서는 이미 lib/supabase.ts의 useClerkSupabaseClient를 사용합니다.
 */

export { useClerkSupabaseClient } from '../supabase';
