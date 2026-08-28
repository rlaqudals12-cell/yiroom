import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPurgeUserStorageBuckets } = vi.hoisted(() => ({
  mockPurgeUserStorageBuckets: vi.fn(),
}));

vi.mock('@/lib/api/storage-purge', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/api/storage-purge')>('@/lib/api/storage-purge');
  return {
    ...actual,
    purgeUserStorageBuckets: mockPurgeUserStorageBuckets,
  };
});

const { revokeBiometricConsentAndPurge } = await import('@/lib/api/biometric-withdrawal');

function makeSupabase(failedTables: ReadonlySet<string> = new Set()) {
  const visitedTables: string[] = [];
  const updates: Array<{ table: string; payload: Record<string, unknown> }> = [];
  const imageConsentUpdates: Array<{
    payload: Record<string, unknown>;
    equalities: Array<[string, unknown]>;
    analysisTypes: readonly string[];
  }> = [];
  const from = vi.fn((table: string) => {
    visitedTables.push(table);
    const result = { error: failedTables.has(table) ? { message: 'failed' } : null };

    if (table === 'image_consents') {
      return {
        update: vi.fn((payload: Record<string, unknown>) => {
          const record: (typeof imageConsentUpdates)[number] = {
            payload,
            equalities: [],
            analysisTypes: [],
          };
          imageConsentUpdates.push(record);
          const eq = vi.fn((column: string, value: unknown) => {
            record.equalities.push([column, value]);
            return mutation;
          });
          const inFilter = vi.fn((column: string, values: readonly string[]) => {
            if (column === 'analysis_type') record.analysisTypes = values;
            return Promise.resolve(result);
          });
          const mutation = { eq, in: inFilter };
          return mutation;
        }),
      };
    }

    return {
      update: vi.fn((payload: Record<string, unknown>) => {
        updates.push({ table, payload });
        const mutation = {
          or: vi.fn().mockResolvedValue(result),
          then: (resolve: (value: typeof result) => unknown) =>
            Promise.resolve(result).then(resolve),
        };
        return { eq: vi.fn(() => mutation) };
      }),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue(result),
      })),
    };
  });

  return { supabase: { from } as never, from, visitedTables, updates, imageConsentUpdates };
}

describe('revokeBiometricConsentAndPurge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPurgeUserStorageBuckets.mockResolvedValue({ deleted: 4, failedBuckets: [] });
  });

  it('동의 플래그·생체 버킷·이미지 메타데이터와 포인터를 한 요청에서 모두 정리한다', async () => {
    const { supabase, visitedTables, imageConsentUpdates } = makeSupabase();

    const result = await revokeBiometricConsentAndPurge(supabase, 'user-1');

    expect(result).toEqual({
      consentRevoked: true,
      imagesDeleted: 4,
      databaseTargetsCleared: 11,
      fullyPurged: true,
      failedTargets: [],
    });
    expect(visitedTables).toEqual(
      expect.arrayContaining([
        'user_agreements',
        'image_consents',
        'analysis_images',
        'user_twins',
        'personal_color_assessments',
        'skin_analyses',
        'body_analyses',
        'hair_analyses',
        'makeup_analyses',
        'posture_analyses',
        'integrated_analysis_sessions',
      ])
    );
    expect(imageConsentUpdates).toHaveLength(2);
    expect(imageConsentUpdates[0]?.payload).toEqual(
      expect.objectContaining({
        consent_given: false,
        withdrawal_at: expect.any(String),
        retention_until: expect.any(String),
        cleanup_reconciled_at: null,
      })
    );
    expect(imageConsentUpdates[1]).toEqual(
      expect.objectContaining({
        payload: { retention_until: null, cleanup_reconciled_at: null },
        equalities: expect.arrayContaining([
          ['consent_given', false],
          ['withdrawal_at', imageConsentUpdates[0]?.payload.withdrawal_at],
        ]),
        analysisTypes: ['skin', 'body', 'personal-color', 'hair', 'makeup', 'posture', 'twin'],
      })
    );
  });

  it('DB와 Storage 일부 실패를 숨기지 않고 나머지 파기를 계속한다', async () => {
    const { supabase, visitedTables, updates, imageConsentUpdates } = makeSupabase(
      new Set(['user_agreements', 'makeup_analyses'])
    );
    mockPurgeUserStorageBuckets.mockResolvedValue({
      deleted: 2,
      failedBuckets: ['storage:integrated-sessions'],
    });

    const result = await revokeBiometricConsentAndPurge(supabase, 'user-1');

    expect(result).toEqual({
      consentRevoked: false,
      imagesDeleted: 2,
      databaseTargetsCleared: 9,
      fullyPurged: false,
      failedTargets: ['db:user_agreements', 'storage:integrated-sessions', 'db:makeup_analyses'],
    });
    // Storage 실패 뒤 포인터를 지우지 않고 cron 즉시 재시도 표식만 남긴다.
    expect(visitedTables).toContain('integrated_analysis_sessions');
    expect(updates.find(({ table }) => table === 'integrated_analysis_sessions')?.payload).toEqual({
      image_cleanup_pending: true,
    });
    expect(
      updates.some(
        ({ table, payload }) =>
          table === 'integrated_analysis_sessions' && payload.face_image_url === null
      )
    ).toBe(false);
    // 메이크업 메타데이터 실패 축은 pending retention을 유지하고 성공 축만 CAS 완료한다.
    expect(imageConsentUpdates[0]?.payload.retention_until).toEqual(expect.any(String));
    expect(imageConsentUpdates[1]?.analysisTypes).not.toContain('makeup');
    expect(imageConsentUpdates[1]?.analysisTypes).toEqual(
      expect.arrayContaining(['skin', 'body', 'personal-color', 'hair', 'posture'])
    );
  });

  it('축별 Storage 파기 실패 행은 retry retention을 유지하고 성공 축만 완료한다', async () => {
    const { supabase, imageConsentUpdates } = makeSupabase();
    mockPurgeUserStorageBuckets.mockResolvedValue({
      deleted: 3,
      failedBuckets: ['storage:hair-images'],
    });

    const result = await revokeBiometricConsentAndPurge(supabase, 'user-1');

    expect(result.fullyPurged).toBe(false);
    expect(result.failedTargets).toContain('storage:hair-images');
    expect(imageConsentUpdates[0]?.payload.retention_until).toEqual(expect.any(String));
    expect(imageConsentUpdates[1]?.payload).toEqual({
      retention_until: null,
      cleanup_reconciled_at: null,
    });
    expect(imageConsentUpdates[1]?.analysisTypes).not.toContain('hair');
    expect(imageConsentUpdates[1]?.analysisTypes).toEqual(
      expect.arrayContaining(['skin', 'body', 'personal-color', 'makeup', 'posture'])
    );
  });

  it('AI 아바타 DB 행 파기 실패 시 twin 동의는 완료로 확정하지 않는다', async () => {
    const { supabase, imageConsentUpdates } = makeSupabase(new Set(['user_twins']));

    const result = await revokeBiometricConsentAndPurge(supabase, 'user-1');

    expect(result.fullyPurged).toBe(false);
    expect(result.failedTargets).toContain('db:user_twins');
    expect(imageConsentUpdates[1]?.analysisTypes).not.toContain('twin');
    expect(imageConsentUpdates[1]?.analysisTypes).toEqual(
      expect.arrayContaining(['skin', 'body', 'personal-color', 'hair', 'makeup', 'posture'])
    );
  });

  it('통합 포인터 clear 실패도 pending 큐를 남겨 다음 cron에서 재시도한다', async () => {
    const { supabase, updates } = makeSupabase(new Set(['integrated_analysis_sessions']));

    const result = await revokeBiometricConsentAndPurge(supabase, 'user-1');

    expect(result.fullyPurged).toBe(false);
    expect(result.failedTargets).toEqual(
      expect.arrayContaining([
        'db:integrated_analysis_sessions',
        'db:integrated_analysis_sessions_cleanup_queue',
      ])
    );
    expect(
      updates
        .filter(({ table }) => table === 'integrated_analysis_sessions')
        .map(({ payload }) => payload.image_cleanup_pending)
    ).toEqual([false, true]);
  });
});
