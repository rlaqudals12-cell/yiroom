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
  const from = vi.fn((table: string) => {
    visitedTables.push(table);
    const result = { error: failedTables.has(table) ? { message: 'failed' } : null };

    if (table === 'image_consents') {
      return {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue(result),
          })),
        })),
      };
    }

    return {
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue(result),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue(result),
      })),
    };
  });

  return { supabase: { from } as never, from, visitedTables };
}

describe('revokeBiometricConsentAndPurge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPurgeUserStorageBuckets.mockResolvedValue({ deleted: 4, failedBuckets: [] });
  });

  it('동의 플래그·생체 버킷·이미지 메타데이터와 포인터를 한 요청에서 모두 정리한다', async () => {
    const { supabase, visitedTables } = makeSupabase();

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
  });

  it('DB와 Storage 일부 실패를 숨기지 않고 나머지 파기를 계속한다', async () => {
    const { supabase, visitedTables } = makeSupabase(
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
    // 앞 단계 실패 후에도 마지막 통합 세션 포인터까지 정리를 시도한다.
    expect(visitedTables).toContain('integrated_analysis_sessions');
  });
});
