/**
 * Supabase 클라이언트 호환 레이어
 *
 * 웹 앱의 `@/lib/supabase/client` 경로를 모바일에서도 사용할 수 있도록
 * 모바일의 supabase 클라이언트를 re-export 합니다.
 *
 * 웹: createPublicClient() → 서버/클라이언트 분리
 * 모바일: supabase (단일 public 클라이언트)
 */

export { supabase as createPublicClient, supabase } from '../supabase';
