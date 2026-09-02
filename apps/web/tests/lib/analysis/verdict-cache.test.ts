import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createServiceRoleClientMock,
  checkConsentAndUploadImagesMock,
  rollbackConsentImagesOrMarkCleanupPendingMock,
} = vi.hoisted(() => ({
  createServiceRoleClientMock: vi.fn(),
  checkConsentAndUploadImagesMock: vi.fn(),
  rollbackConsentImagesOrMarkCleanupPendingMock: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}));
vi.mock('@/lib/api/image-consent', () => ({
  checkConsentAndUploadImages: checkConsentAndUploadImagesMock,
  rollbackConsentImagesOrMarkCleanupPending: rollbackConsentImagesOrMarkCleanupPendingMock,
}));

import {
  VERDICT_CACHE_VERSION,
  createAnalysisImageFingerprint,
  createVerdictCacheEntry,
  findCachedVerdict,
  syncCachedVerdictImagesForUser,
} from '@/lib/analysis/verdict-cache';
import { PINNED_FAST_VERDICT_MODEL, PINNED_VERDICT_MODEL } from '@/lib/gemini/model-contract';

function createSupabaseMock(row: Record<string, unknown> | null, error: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error });
  const limit = vi.fn().mockReturnValue({ maybeSingle });
  const order = vi.fn().mockReturnValue({ limit });
  const contains = vi.fn().mockReturnValue({ order });
  const eq = vi.fn().mockReturnValue({ contains });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient, from, eq, contains };
}

describe('analysis verdict cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rollbackConsentImagesOrMarkCleanupPendingMock.mockResolvedValue(undefined);
  });

  it('같은 사용자·컨텍스트·이미지 바이트는 같은 SHA-256 지문을 만든다', () => {
    const first = createAnalysisImageFingerprint(
      'user-1',
      'skin',
      [['front', 'data:image/jpeg;base64,QUJDRA==']],
      { personalColorAssessmentId: 'pc-1' }
    );
    const second = createAnalysisImageFingerprint(
      'user-1',
      'skin',
      [['front', 'data:image/png;base64,QUJDRA==']],
      { personalColorAssessmentId: 'pc-1' }
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('축·이미지·사용자·판정 컨텍스트가 다르면 지문이 달라진다', () => {
    const image = [['front', 'data:image/jpeg;base64,QUJDRA==']] as const;
    const baseContext = {
      userInput: { height: 160, weight: 50 },
      personalColorAssessmentId: 'pc-1',
    };
    const base = createAnalysisImageFingerprint('user-1', 'body', image, baseContext);
    const reordered = createAnalysisImageFingerprint('user-1', 'body', image, {
      personalColorAssessmentId: 'pc-1',
      userInput: { weight: 50, height: 160 },
    });

    expect(reordered).toBe(base);
    expect(createAnalysisImageFingerprint('user-1', 'hair', image, baseContext)).not.toBe(base);
    expect(
      createAnalysisImageFingerprint(
        'user-1',
        'body',
        [['front', 'data:image/jpeg;base64,RUZHSA==']],
        baseContext
      )
    ).not.toBe(base);
    expect(createAnalysisImageFingerprint('user-2', 'body', image, baseContext)).not.toBe(base);
    expect(
      createAnalysisImageFingerprint('user-1', 'body', image, {
        ...baseContext,
        userInput: { height: 160, weight: 55 },
      })
    ).not.toBe(base);
  });

  it('고정 모델·버전과 함께 판정 응답을 저장한다', () => {
    expect(
      createVerdictCacheEntry('personal-color', 'fingerprint', {
        result: { season: 'summer' },
      })
    ).toEqual({
      version: VERDICT_CACHE_VERSION,
      fingerprint: 'fingerprint',
      model: PINNED_VERDICT_MODEL,
      payload: { result: { season: 'summer' } },
    });
  });

  it('동일 사용자·지문에 저장된 판정을 반환하고 사용자 소유권으로 조회한다', async () => {
    const fingerprint = 'a'.repeat(64);
    const payload = { result: { skinType: 'dry' }, usedMock: false };
    const row = {
      id: 'skin-1',
      recommendations: {
        verdictCache: createVerdictCacheEntry('skin', fingerprint, payload),
      },
    };
    const mock = createSupabaseMock(row);

    await expect(
      findCachedVerdict<typeof payload>(mock.client, 'user-1', 'skin', fingerprint)
    ).resolves.toEqual({ data: row, payload });
    expect(mock.from).toHaveBeenCalledWith('skin_analyses');
    expect(mock.eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(mock.contains).toHaveBeenCalledWith('recommendations', {
      verdictCache: {
        version: VERDICT_CACHE_VERSION,
        fingerprint,
        model: PINNED_FAST_VERDICT_MODEL,
      },
    });
  });

  it('조회 오류와 비정상 payload는 캐시 미스로 처리한다', async () => {
    const fingerprint = 'b'.repeat(64);
    const failed = createSupabaseMock(null, new Error('db unavailable'));
    const malformed = createSupabaseMock({
      id: 'skin-2',
      recommendations: { verdictCache: { fingerprint } },
    });

    await expect(
      findCachedVerdict(failed.client, 'user-1', 'skin', fingerprint)
    ).resolves.toBeNull();
    await expect(
      findCachedVerdict(malformed.client, 'user-1', 'skin', fingerprint)
    ).resolves.toBeNull();
  });

  it('캐시 행의 빈 이미지 슬롯을 동의 확인 후 본인 행에만 연결한다', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'skin-1', clerk_user_id: 'user-1', image_url: 'user-1/new_front.jpg' },
      error: null,
    });
    const query = { eq: vi.fn(), is: vi.fn(), select: vi.fn() };
    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.select.mockReturnValue({ maybeSingle });
    const update = vi.fn().mockReturnValue(query);
    const from = vi.fn().mockReturnValue({ update });
    const remove = vi.fn();
    const storageFrom = vi.fn().mockReturnValue({ remove });
    createServiceRoleClientMock.mockReturnValue({ from, storage: { from: storageFrom } });
    checkConsentAndUploadImagesMock.mockResolvedValue({
      hasConsent: true,
      consentId: 'consent-1',
      uploadedImages: { front: 'user-1/new_front.jpg' },
    });

    const result = await syncCachedVerdictImagesForUser({
      userId: 'user-1',
      axis: 'skin',
      cachedData: { id: 'skin-1', image_url: '' },
      bucketName: 'skin-images',
      images: { front: 'data:image/jpeg;base64,QUJDRA==' },
      imageStorageAllowed: true,
    });

    expect(checkConsentAndUploadImagesMock).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'skin',
      'skin-images',
      { front: 'data:image/jpeg;base64,QUJDRA==' },
      { imageStorageAllowed: true }
    );
    expect(update).toHaveBeenCalledWith({ image_url: 'user-1/new_front.jpg' });
    expect(query.eq).toHaveBeenCalledWith('id', 'skin-1');
    expect(query.eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(query.eq).toHaveBeenCalledWith('image_url', '');
    expect(result).toEqual(
      expect.objectContaining({ id: 'skin-1', image_url: 'user-1/new_front.jpg' })
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('캐시 행에 이미지가 이미 연결돼 있으면 중복 업로드하지 않는다', async () => {
    const result = await syncCachedVerdictImagesForUser({
      userId: 'user-1',
      axis: 'hair',
      cachedData: { id: 'hair-1', image_url: 'user-1/existing.jpg' },
      bucketName: 'hair-images',
      images: { hair: 'data:image/jpeg;base64,QUJDRA==' },
      imageStorageAllowed: true,
    });

    expect(result).toEqual({ id: 'hair-1', image_url: 'user-1/existing.jpg' });
    expect(checkConsentAndUploadImagesMock).not.toHaveBeenCalled();
  });

  it('캐시 행 CAS 갱신 실패 시 방금 업로드한 경로를 롤백한다', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const query = { eq: vi.fn(), is: vi.fn(), select: vi.fn() };
    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.select.mockReturnValue({ maybeSingle });
    const from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(query) });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const storageFrom = vi.fn().mockReturnValue({ remove });
    createServiceRoleClientMock.mockReturnValue({ from, storage: { from: storageFrom } });
    checkConsentAndUploadImagesMock.mockResolvedValue({
      hasConsent: true,
      consentId: 'consent-1',
      uploadedImages: { makeup: 'user-1/new_makeup.jpg' },
    });

    await expect(
      syncCachedVerdictImagesForUser({
        userId: 'user-1',
        axis: 'makeup',
        cachedData: { id: 'makeup-1', image_url: null },
        bucketName: 'makeup-images',
        images: { makeup: 'data:image/jpeg;base64,QUJDRA==' },
        imageStorageAllowed: true,
      })
    ).resolves.toEqual({ id: 'makeup-1', image_url: null });
    expect(query.is).toHaveBeenCalledWith('image_url', null);
    expect(rollbackConsentImagesOrMarkCleanupPendingMock).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'makeup',
      'makeup-images',
      ['user-1/new_makeup.jpg']
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('캐시 행 연결과 이미지 정리 예약이 모두 실패하면 캐시 응답을 거부한다', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const query = { eq: vi.fn(), is: vi.fn(), select: vi.fn() };
    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.select.mockReturnValue({ maybeSingle });
    const from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(query) });
    createServiceRoleClientMock.mockReturnValue({ from });
    checkConsentAndUploadImagesMock.mockResolvedValue({
      hasConsent: true,
      consentId: 'consent-1',
      uploadedImages: { front: 'user-1/orphan.jpg' },
    });
    rollbackConsentImagesOrMarkCleanupPendingMock.mockRejectedValueOnce(
      new Error('Image cleanup could not be scheduled')
    );

    await expect(
      syncCachedVerdictImagesForUser({
        userId: 'user-1',
        axis: 'skin',
        cachedData: { id: 'skin-1', image_url: null },
        bucketName: 'skin-images',
        images: { front: 'data:image/jpeg;base64,QUJDRA==' },
        imageStorageAllowed: true,
      })
    ).rejects.toThrow('Image cleanup could not be scheduled');
  });
});
