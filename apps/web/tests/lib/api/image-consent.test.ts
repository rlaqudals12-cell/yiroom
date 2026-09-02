/**
 * 이미지 동의 확인 헬퍼 테스트
 * @description lib/api/image-consent.ts의 동의 확인 및 이미지 업로드 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import {
  checkImageConsent,
  ImageUploadUncertainError,
  uploadImageToStorage,
  checkConsentAndUploadImages,
  rollbackConsentImagesOrMarkCleanupPending,
} from '@/lib/api/image-consent';

const ACTIVE_CONSENT = {
  id: 'consent_1',
  consent_given: true,
  consent_version: 'v1.0',
  retention_until: '2099-01-01T00:00:00.000Z',
  updated_at: '2026-08-23T00:00:00.000Z',
};

// Supabase mock 클라이언트
function createMockSupabase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));

  const agreementChain: Record<string, ReturnType<typeof vi.fn>> = {};
  agreementChain.select = vi.fn(() => agreementChain);
  agreementChain.eq = vi.fn(() => agreementChain);
  agreementChain.maybeSingle = vi.fn().mockResolvedValue({
    data: { biometric_agreed: true },
    error: null,
  });
  const from = vi.fn((table: string) => (table === 'user_agreements' ? agreementChain : chain));

  // Storage mock
  const remove = vi.fn().mockResolvedValue({ error: null });
  const storageMock = {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: { path: 'test/path.jpg' }, error: null })),
      remove,
    })),
  };

  return { ...chain, from, storage: storageMock, ...overrides };
}

describe('checkImageConsent', () => {
  it('동의가 있으면 hasConsent: true와 consentId를 반환한다', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: ACTIVE_CONSENT,
      error: null,
    });

    const result = await checkImageConsent(mockSupabase as never, 'user_123', 'skin');

    expect(result.hasConsent).toBe(true);
    expect(result.consentId).toBe('consent_1');
    expect(mockSupabase.from).toHaveBeenCalledWith('image_consents');
  });

  it('동의가 없으면 hasConsent: false를 반환한다', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 'consent_1', consent_given: false },
      error: null,
    });

    const result = await checkImageConsent(mockSupabase as never, 'user_123', 'skin');

    expect(result.hasConsent).toBe(false);
    expect(result.consentId).toBeNull();
  });

  it('조회 오류는 저장 동의로 간주하지 않는다', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: ACTIVE_CONSENT,
      error: { message: 'db unavailable' },
    });

    await expect(checkImageConsent(mockSupabase as never, 'user_123', 'hair')).resolves.toEqual({
      hasConsent: false,
      consentId: null,
    });
  });

  it.each([
    ['만료된 동의', { ...ACTIVE_CONSENT, retention_until: '2020-01-01T00:00:00.000Z' }],
    ['구버전 동의', { ...ACTIVE_CONSENT, consent_version: 'v0.9' }],
    ['보관 기한이 없는 동의', { ...ACTIVE_CONSENT, retention_until: null }],
  ])('%s는 저장을 허용하지 않는다', async (_label, consent) => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: consent,
      error: null,
    });

    const result = await checkImageConsent(mockSupabase as never, 'user_123', 'makeup');

    expect(result).toEqual({ hasConsent: false, consentId: null });
  });

  it('데이터가 없으면 hasConsent: false를 반환한다', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await checkImageConsent(mockSupabase as never, 'user_123', 'body');

    expect(result.hasConsent).toBe(false);
    expect(result.consentId).toBeNull();
  });
});

describe('uploadImageToStorage', () => {
  it('Base64 이미지를 성공적으로 업로드한다', async () => {
    const uuid = '11111111-1111-4111-8111-111111111111';
    const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(uuid);
    const uploadFn = vi.fn().mockResolvedValue({
      data: { path: 'user_123/12345_front.jpg' },
      error: null,
    });
    const mockSupabase = {
      storage: {
        from: vi.fn(() => ({ upload: uploadFn })),
      },
    };

    const result = await uploadImageToStorage(
      mockSupabase as never,
      'skin-images',
      'user_123',
      'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      'front'
    );

    expect(result).toBe('user_123/12345_front.jpg');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('skin-images');
    expect(uploadFn).toHaveBeenCalled();
    // 첫 인자는 파일명 패턴
    const uploadPath = uploadFn.mock.calls[0][0] as string;
    expect(uploadPath).toBe(`user_123/${uuid}_front.jpg`);
    uuidSpy.mockRestore();
  });

  it('업로드 실패 시 rollback 가능한 후보 경로를 typed error에 보존한다', async () => {
    const uuid = '22222222-2222-4222-8222-222222222222';
    const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(uuid);
    const uploadFn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Upload failed' },
    });
    const mockSupabase = {
      storage: {
        from: vi.fn(() => ({ upload: uploadFn })),
      },
    };

    const uploadPromise = uploadImageToStorage(
      mockSupabase as never,
      'skin-images',
      'user_123',
      'data:image/png;base64,abc123',
      'side'
    );

    await expect(uploadPromise).rejects.toBeInstanceOf(ImageUploadUncertainError);
    await expect(uploadPromise).rejects.toMatchObject({
      name: 'ImageUploadUncertainError',
      candidatePath: `user_123/${uuid}_side.jpg`,
    });
    uuidSpy.mockRestore();
  });

  it('Base64 접두사를 제거하고 버퍼로 변환한다', async () => {
    const uploadFn = vi.fn().mockResolvedValue({
      data: { path: 'test.jpg' },
      error: null,
    });
    const mockSupabase = {
      storage: {
        from: vi.fn(() => ({ upload: uploadFn })),
      },
    };

    await uploadImageToStorage(
      mockSupabase as never,
      'bucket',
      'user_1',
      'data:image/jpeg;base64,dGVzdA==',
      'test'
    );

    // 두 번째 인자가 Buffer인지 확인
    const bufferArg = uploadFn.mock.calls[0][1];
    expect(Buffer.isBuffer(bufferArg)).toBe(true);
    expect(bufferArg.toString()).toBe('test');
  });
});

describe('checkConsentAndUploadImages', () => {
  it('동의가 없으면 이미지를 업로드하지 않는다', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'skin',
      'skin-images',
      { front: 'data:image/jpeg;base64,abc', side: 'data:image/jpeg;base64,def' }
    );

    expect(result.hasConsent).toBe(false);
    expect(result.consentId).toBeNull();
    expect(result.uploadedImages.front).toBeNull();
    expect(result.uploadedImages.side).toBeNull();
  });

  it('동의가 있으면 모든 이미지를 업로드한다', async () => {
    const uploadFn = vi.fn().mockResolvedValue({
      data: { path: 'uploaded.jpg' },
      error: null,
    });
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload: uploadFn })) },
    });
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...ACTIVE_CONSENT, id: 'c1' },
      error: null,
    });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'skin',
      'skin-images',
      { front: 'data:image/jpeg;base64,abc' }
    );

    expect(result.hasConsent).toBe(true);
    expect(result.consentId).toBe('c1');
    expect(result.uploadedImages.front).toBe('uploaded.jpg');
  });

  it('undefined 이미지는 null로 처리한다', async () => {
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload: vi.fn() })) },
    });
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...ACTIVE_CONSENT, id: 'c1' },
      error: null,
    });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'body',
      'body-images',
      { front: undefined, side: undefined }
    );

    expect(result.hasConsent).toBe(true);
    expect(result.uploadedImages.front).toBeNull();
    expect(result.uploadedImages.side).toBeNull();
  });

  it('업로드 중 동의가 철회되면 생성한 객체를 되돌리고 raw 경로를 반환하지 않는다', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'user_123/late.jpg' }, error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload, remove })) },
    });
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: { ...ACTIVE_CONSENT, id: 'c1' }, error: null })
      .mockResolvedValueOnce({
        data: {
          ...ACTIVE_CONSENT,
          id: 'c1',
          consent_given: false,
          updated_at: '2026-08-23T00:01:00.000Z',
        },
        error: null,
      });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'makeup',
      'makeup-images',
      { makeup: 'data:image/jpeg;base64,abc' }
    );

    expect(remove).toHaveBeenCalledWith(['user_123/late.jpg']);
    expect(result).toEqual({
      hasConsent: false,
      consentId: null,
      uploadedImages: { makeup: null },
    });
  });

  it('Storage가 commit 뒤 reject해도 typed 후보 경로를 즉시 rollback한다', async () => {
    const uuid = '33333333-3333-4333-8333-333333333333';
    const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(uuid);
    const upload = vi.fn().mockRejectedValue(new Error('timeout after commit'));
    const remove = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload, remove })) },
    });
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ACTIVE_CONSENT,
      error: null,
    });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'skin',
      'skin-images',
      { front: 'data:image/jpeg;base64,abc' }
    );

    expect(remove).toHaveBeenCalledWith([`user_123/${uuid}_front.jpg`]);
    expect(result).toEqual({
      hasConsent: true,
      consentId: 'consent_1',
      uploadedImages: { front: null },
    });
    uuidSpy.mockRestore();
  });

  it('global 동의만 꺼지고 axis는 활성인 최신 상태면 첫 marker CAS 실패 뒤 최신 CAS로 재시도한다', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('timeout after commit'));
    const remove = vi.fn().mockResolvedValue({ error: { message: 'storage unavailable' } });
    const update = vi.fn();
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload, remove })) },
    });
    const imageChain = mockSupabase as Record<string, ReturnType<typeof vi.fn>>;
    const agreementChain: Record<string, ReturnType<typeof vi.fn>> = {};
    agreementChain.select = vi.fn(() => agreementChain);
    agreementChain.eq = vi.fn(() => agreementChain);
    agreementChain.maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: { biometric_agreed: true }, error: null })
      .mockResolvedValueOnce({ data: { biometric_agreed: false }, error: null });
    mockSupabase.from = vi.fn((table: string) =>
      table === 'user_agreements' ? agreementChain : imageChain
    );
    imageChain.update = update.mockReturnValue(imageChain);
    imageChain.select = vi.fn(() => imageChain);
    imageChain.eq = vi.fn(() => imageChain);
    imageChain.maybeSingle
      .mockResolvedValueOnce({ data: ACTIVE_CONSENT, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'stale CAS' } })
      .mockResolvedValueOnce({
        data: { ...ACTIVE_CONSENT, updated_at: '2026-08-23T00:01:00.000Z' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'consent_1' }, error: null });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'hair',
      'hair-images',
      { hair: 'data:image/jpeg;base64,abc' }
    );

    expect(update).toHaveBeenCalledTimes(2);
    expect(imageChain.eq).toHaveBeenCalledWith('updated_at', '2026-08-23T00:01:00.000Z');
    expect(result).toEqual({
      hasConsent: false,
      consentId: null,
      uploadedImages: { hair: null },
    });
  });

  it('commit-after-reject와 동시 DELETE에서 rollback·pending CAS가 실패해도 raw 경로를 폐기한다', async () => {
    const uuid = '44444444-4444-4444-8444-444444444444';
    const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(uuid);
    const upload = vi.fn().mockRejectedValue(new Error('timeout after commit'));
    const remove = vi.fn().mockResolvedValue({ error: { message: 'storage unavailable' } });
    const update = vi.fn();
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload, remove })) },
    });
    const imageChain = mockSupabase as Record<string, ReturnType<typeof vi.fn>>;
    const from = imageChain.from;
    const originalFrom = from.getMockImplementation();
    from.mockImplementation((table: string) =>
      table === 'image_consents' ? imageChain : originalFrom?.(table)
    );
    imageChain.update = update.mockReturnValue(imageChain);
    imageChain.select = vi.fn(() => imageChain);
    imageChain.eq = vi.fn(() => imageChain);
    imageChain.maybeSingle
      .mockResolvedValueOnce({ data: ACTIVE_CONSENT, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'marker unavailable' } })
      .mockResolvedValueOnce({
        data: {
          ...ACTIVE_CONSENT,
          consent_given: false,
          withdrawal_at: '2026-08-23T00:01:00.000Z',
          retention_until: null,
          updated_at: '2026-08-23T00:01:00.000Z',
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: 'marker unavailable' } });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'makeup',
      'makeup-images',
      { makeup: 'data:image/jpeg;base64,abc' }
    );

    expect(remove).toHaveBeenCalledWith([`user_123/${uuid}_makeup.jpg`]);
    expect(update).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      hasConsent: false,
      consentId: null,
      uploadedImages: { makeup: null },
    });
    uuidSpy.mockRestore();
  });

  it('철회 후 rollback 실패는 현재 행 CAS로 즉시 파기 대기 상태를 남긴다', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'user_123/late.jpg' }, error: null });
    const remove = vi.fn().mockResolvedValue({ error: { message: 'storage unavailable' } });
    const update = vi.fn();
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ upload, remove })) },
    });
    const imageChain = mockSupabase as Record<string, ReturnType<typeof vi.fn>>;
    const from = imageChain.from;
    const originalFrom = from.getMockImplementation();
    from.mockImplementation((table: string) =>
      table === 'image_consents' ? imageChain : originalFrom?.(table)
    );
    imageChain.update = update.mockReturnValue(imageChain);
    imageChain.select = vi.fn(() => imageChain);
    imageChain.eq = vi.fn(() => imageChain);
    imageChain.maybeSingle
      .mockResolvedValueOnce({ data: { ...ACTIVE_CONSENT, id: 'c1' }, error: null })
      .mockResolvedValueOnce({
        data: {
          ...ACTIVE_CONSENT,
          id: 'c1',
          consent_given: false,
          retention_until: null,
          updated_at: '2026-08-23T00:01:00.000Z',
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'c1' }, error: null });

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'hair',
      'hair-images',
      { hair: 'data:image/jpeg;base64,abc' }
    );

    expect(result.uploadedImages.hair).toBeNull();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        consent_given: false,
        withdrawal_at: expect.any(String),
        retention_until: expect.any(String),
      })
    );
    expect(imageChain.eq).toHaveBeenCalledWith('updated_at', '2026-08-23T00:01:00.000Z');
  });

  it('요청 단위 저장 거부는 기존 DB 동의보다 우선하며 조회와 업로드를 모두 생략한다', async () => {
    const mockSupabase = createMockSupabase();

    const result = await checkConsentAndUploadImages(
      mockSupabase as never,
      'user_123',
      'hair',
      'hair-images',
      { hair: 'data:image/jpeg;base64,abc' },
      { imageStorageAllowed: false }
    );

    expect(result).toEqual({
      hasConsent: false,
      consentId: null,
      uploadedImages: { hair: null },
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(
      (mockSupabase.storage as { from: ReturnType<typeof vi.fn> }).from
    ).not.toHaveBeenCalled();
  });
});

describe('rollbackConsentImagesOrMarkCleanupPending', () => {
  it('스토리지 롤백이 실패하면 기존 동의 행을 cleanup-pending 상태로 전환한다', async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: 'storage unavailable' } });
    const update = vi.fn();
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ remove })) },
    });
    const imageChain = mockSupabase as Record<string, ReturnType<typeof vi.fn>>;
    const from = imageChain.from;
    const originalFrom = from.getMockImplementation();
    from.mockImplementation((table: string) =>
      table === 'image_consents' ? imageChain : originalFrom?.(table)
    );
    imageChain.update = update.mockReturnValue(imageChain);
    imageChain.select = vi.fn(() => imageChain);
    imageChain.eq = vi.fn(() => imageChain);
    imageChain.maybeSingle
      .mockResolvedValueOnce({ data: ACTIVE_CONSENT, error: null })
      .mockResolvedValueOnce({ data: { id: 'consent_1' }, error: null });

    await expect(
      rollbackConsentImagesOrMarkCleanupPending(
        mockSupabase as never,
        'user_123',
        'skin',
        'skin-images',
        ['user_123/orphan.jpg']
      )
    ).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledWith(['user_123/orphan.jpg']);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        consent_given: false,
        withdrawal_at: expect.any(String),
        cleanup_reconciled_at: null,
      })
    );
    expect(imageChain.eq).toHaveBeenCalledWith('updated_at', ACTIVE_CONSENT.updated_at);
  });

  it('스토리지 롤백과 cleanup-pending 표식이 모두 실패하면 예외로 차단한다', async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: 'storage unavailable' } });
    const update = vi.fn();
    const mockSupabase = createMockSupabase({
      storage: { from: vi.fn(() => ({ remove })) },
    });
    const imageChain = mockSupabase as Record<string, ReturnType<typeof vi.fn>>;
    const from = imageChain.from;
    const originalFrom = from.getMockImplementation();
    from.mockImplementation((table: string) =>
      table === 'image_consents' ? imageChain : originalFrom?.(table)
    );
    imageChain.update = update.mockReturnValue(imageChain);
    imageChain.select = vi.fn(() => imageChain);
    imageChain.eq = vi.fn(() => imageChain);
    imageChain.maybeSingle
      .mockResolvedValueOnce({ data: ACTIVE_CONSENT, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'db unavailable' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'db unavailable' } });

    await expect(
      rollbackConsentImagesOrMarkCleanupPending(
        mockSupabase as never,
        'user_123',
        'skin',
        'skin-images',
        ['user_123/orphan.jpg']
      )
    ).rejects.toThrow('Image cleanup could not be scheduled');
  });
});
