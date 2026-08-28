import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '202608230300_image_consents_hair_makeup.sql'),
  'utf8'
);
const twinSql = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '202608270100_image_consents_twin.sql'),
  'utf8'
);

describe('hair/makeup 이미지 저장 동의 마이그레이션', () => {
  it('5축 CHECK와 변경 이력·롤백 근거를 남긴다', () => {
    expect(sql).toContain('-- Date: 2026-08-23');
    expect(sql).toContain('-- Issue: 배치 D');
    expect(sql).toContain('-- Rollback:');
    expect(sql).toContain(
      "CHECK (analysis_type IN ('skin', 'body', 'personal-color', 'hair', 'makeup'))"
    );
  });

  it.each(['hair-images', 'makeup-images'])('%s를 private 10MB 버킷으로 만든다', (bucket) => {
    const bucketBlock = new RegExp(
      `'${bucket}',\\s*'${bucket}',\\s*false,\\s*10485760,\\s*ARRAY\\[([^\\]]+)\\]`,
      'm'
    ).exec(sql);

    expect(bucketBlock, `${bucket} bucket definition`).not.toBeNull();
    expect(bucketBlock?.[1]).toContain("'image/jpeg'");
    expect(bucketBlock?.[1]).toContain("'image/png'");
    expect(bucketBlock?.[1]).toContain("'image/webp'");
    expect(bucketBlock?.[1]).toContain("'image/heic'");
    expect(bucketBlock?.[1]).toContain("'image/heif'");
  });

  it.each(['hair', 'makeup'])('%s 버킷은 authenticated 직접 접근 정책을 제거한다', (axis) => {
    expect(sql).toContain(`DROP POLICY IF EXISTS "Users can upload ${axis} images"`);
    expect(sql).toContain(`DROP POLICY IF EXISTS "Users can view own ${axis} images"`);
    expect(sql).toContain(`DROP POLICY IF EXISTS "Users can delete own ${axis} images"`);
    expect(sql).not.toContain(`CREATE POLICY "Users can upload ${axis} images"`);
    expect(sql).not.toContain(`CREATE POLICY "Users can view own ${axis} images"`);
    expect(sql).not.toContain(`CREATE POLICY "Users can delete own ${axis} images"`);
  });

  it.each([
    ['skin', 'skin'],
    ['body', 'body'],
    ['personal-color', 'pc'],
  ] as const)('%s 구 버킷의 authenticated 직접 접근 정책도 제거한다', (_axis, policyAxis) => {
    expect(sql).toContain(`DROP POLICY IF EXISTS "Users can upload ${policyAxis} images"`);
    expect(sql).toContain(`DROP POLICY IF EXISTS "Users can view own ${policyAxis} images"`);
    expect(sql).toContain(`DROP POLICY IF EXISTS "Users can delete own ${policyAxis} images"`);
  });

  it('image_consents는 own SELECT만 남기고 직접 쓰기 정책을 제거한다', () => {
    for (const operation of ['insert', 'update', 'delete']) {
      expect(sql).toContain(
        `DROP POLICY IF EXISTS "image_consents_${operation}_own" ON public.image_consents`
      );
    }
    expect(sql).not.toContain('CREATE POLICY "image_consents_insert_own"');
    expect(sql).not.toContain('CREATE POLICY "image_consents_update_own"');
    expect(sql).not.toContain('CREATE POLICY "image_consents_delete_own"');
    expect(sql).toContain(
      'REVOKE INSERT, UPDATE, DELETE ON public.image_consents FROM anon, authenticated'
    );
  });

  it('파기 대기 큐의 안정 keyset 순회를 위한 partial index를 만든다', () => {
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_image_consents_cleanup_pending');
    expect(sql).toContain('ON public.image_consents(retention_until, id)');
    expect(sql).toContain('WHERE consent_given = false');
    expect(sql).toContain('withdrawal_at IS NOT NULL');
    expect(sql).toContain('retention_until IS NOT NULL');
  });

  it('철회 완료 행 재조정은 별도 withdrawal_at keyset과 완료 표식을 사용한다', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS cleanup_reconciled_at TIMESTAMPTZ');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_image_consents_cleanup_reconciliation');
    expect(sql).toContain('ON public.image_consents(withdrawal_at, id)');
    expect(sql).toContain('retention_until IS NULL');
    expect(sql).toContain('cleanup_reconciled_at IS NULL');
  });
});

describe('AI 아바타 전용 이미지 저장 동의 마이그레이션', () => {
  it('기존 5축을 보존하면서 전용 twin 타입만 CHECK에 추가한다', () => {
    expect(twinSql).toContain('-- Date: 2026-08-27');
    expect(twinSql).toContain('-- Issue: 배치 G');
    expect(twinSql).toContain('-- Rollback:');
    expect(twinSql).toContain(
      "CHECK (analysis_type IN ('skin', 'body', 'personal-color', 'hair', 'makeup', 'twin'))"
    );
  });

  it('기존 twins 버킷이나 authenticated 우회 정책을 다시 만들지 않는다', () => {
    expect(twinSql).not.toMatch(/INSERT\s+INTO\s+(?:public\.)?storage\.buckets/i);
    expect(twinSql).not.toMatch(/CREATE\s+POLICY/i);
    expect(twinSql).not.toMatch(/GRANT\s+(?:INSERT|SELECT|UPDATE|DELETE)/i);
    expect(twinSql).toContain(
      'authenticated 클라이언트가 Storage를 직접 우회할 수 있는 정책은 두지 않는다'
    );
  });

  it('레거시 아바타 소유자를 미동의 파기 대기로 이관하고 신규 유효 동의는 보존한다', () => {
    expect(twinSql).toMatch(/INSERT\s+INTO\s+public\.image_consents/i);
    expect(twinSql).toContain('SELECT DISTINCT');
    expect(twinSql).toContain('FROM public.user_twins AS twins');
    expect(twinSql).toContain('INNER JOIN public.users AS users');
    expect(twinSql).toContain("'twin'");
    expect(twinSql).toMatch(/'twin',\s*false,\s*'v1\.0',\s*NULL,\s*now\(\),\s*now\(\),\s*NULL/);
    expect(twinSql).toContain('ON CONFLICT (clerk_user_id, analysis_type) DO NOTHING');
  });

  it('Storage 객체를 SQL로 직접 삭제하지 않고 cleanup-consents에 맡긴다', () => {
    expect(twinSql).not.toMatch(/DELETE\s+FROM\s+(?:public\.)?storage\.objects/i);
    expect(twinSql).toContain(
      'cleanup-consents가 Storage API로 객체와 user_twins 행을 함께 지운다'
    );
  });
});
