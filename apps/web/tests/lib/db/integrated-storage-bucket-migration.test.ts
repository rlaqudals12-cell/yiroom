import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(
    process.cwd(),
    'supabase',
    'migrations',
    '202608230400_integrated_sessions_storage_bucket.sql'
  ),
  'utf8'
);

describe('integrated-sessions 비공개 버킷 마이그레이션', () => {
  it('idempotent private 10MB 버킷과 허용 포맷을 고정한다', () => {
    expect(sql).toContain("'integrated-sessions',\n  'integrated-sessions',\n  false,\n  10485760");
    expect(sql).toContain('ON CONFLICT (id) DO UPDATE SET');
    for (const mime of ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']) {
      expect(sql).toContain(`'${mime}'`);
    }
  });

  it('Storage 원본은 service_role만 접근하고 authenticated 직접 조회를 닫는다', () => {
    expect(sql).toContain('FOR ALL TO service_role');
    expect(sql).not.toContain('FOR SELECT TO authenticated');
    expect(sql).not.toContain('CREATE POLICY "Users can view own integrated session images"');
    expect(sql).not.toContain('FOR INSERT TO authenticated');
    expect(sql).not.toContain('FOR DELETE TO authenticated');
  });

  it('세션 owner SELECT는 유지하되 기존 클라이언트 write 정책을 제거한다', () => {
    for (const operation of ['insert', 'update', 'delete']) {
      expect(sql).toContain(
        `DROP POLICY IF EXISTS "integrated_sessions_${operation}_own" ON public.integrated_analysis_sessions`
      );
    }
    expect(sql).not.toContain('CREATE POLICY "integrated_sessions_update_own"');
    expect(sql).toContain(
      'REVOKE INSERT, UPDATE, DELETE ON public.integrated_analysis_sessions FROM anon, authenticated'
    );
  });

  it('분산 rollback 실패를 즉시 재시도할 영속 pending 컬럼과 인덱스를 둔다', () => {
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS image_cleanup_pending BOOLEAN NOT NULL DEFAULT false'
    );
    expect(sql).toContain('idx_integrated_sessions_image_cleanup_pending');
    expect(sql).toContain('WHERE image_cleanup_pending = true');
    expect(sql).toContain(
      'COMMENT ON COLUMN public.integrated_analysis_sessions.image_cleanup_pending'
    );
  });

  it('상태와 무관하게 동의 저장 세션을 keyset 순회할 partial index가 있다', () => {
    expect(sql).toContain('idx_integrated_sessions_consented_image_cleanup');
    expect(sql).toContain('ON public.integrated_analysis_sessions (created_at ASC, id ASC)');
    expect(sql).toContain("questionnaire->>'imageStorageConsent' = 'true'");
    expect(sql).toContain("questionnaire->>'_imageStoragePurgedAt' IS NULL");
    expect(sql).not.toMatch(
      /CREATE INDEX IF NOT EXISTS idx_integrated_sessions_consented_image_cleanup[\s\S]*?WHERE status IN/
    );
  });

  it('구형 무인증 cleanup cron을 pg_cron 유무·권한과 무관하게 안전하게 unschedule한다', () => {
    expect(sql).toContain("to_regclass('cron.job')");
    expect(sql).toContain("jobname = ''cleanup-expired-consents''");
    expect(sql).toContain('cron.unschedule(%s)');
    expect(sql).toContain('WHEN insufficient_privilege OR undefined_table');
    expect(sql).toContain('DROP FUNCTION IF EXISTS public.trigger_cleanup_expired_consents()');
  });

  it('prod 수동 gap-apply와 rollback 순서를 명시한다', () => {
    expect(sql).toContain('prod는 Supabase Dashboard SQL Editor에서 gap-apply');
    expect(sql).toContain('`supabase db push` 금지');
    expect(sql).toContain('-- Rollback');
  });
});
