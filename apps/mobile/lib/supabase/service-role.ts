/**
 * Service Role 클라이언트 호환 레이어 (모바일)
 *
 * 모바일에서는 보안상 Service Role 클라이언트를 사용할 수 없습니다.
 * 서버 API를 통해 Service Role 작업을 수행하세요.
 *
 * 이 파일은 import 호환성을 위해 존재하며,
 * 호출 시 에러를 발생시킵니다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export function createServiceRoleClient(): SupabaseClient {
  throw new Error(
    '[Supabase] 모바일에서는 Service Role 클라이언트를 사용할 수 없습니다. 서버 API를 사용하세요.'
  );
}
