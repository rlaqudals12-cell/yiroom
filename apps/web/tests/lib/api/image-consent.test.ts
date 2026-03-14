/**
 * 이미지 동의 확인 헬퍼 테스트
 * @description lib/api/image-consent.ts의 동의 확인 및 이미지 업로드 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import {
  checkImageConsent,
  uploadImageToStorage,
  checkConsentAndUploadImages,
} from '@/lib/api/image-consent';

// Supabase mock 클라이언트
function createMockSupabase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));

  // Storage mock
  const storageMock = {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: { path: 'test/path.jpg' }, error: null })),
    })),
  };

  return { ...chain, storage: storageMock, ...overrides };
}

describe('checkImageConsent', () => {
  it('동의가 있으면 hasConsent: true와 consentId를 반환한다', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 'consent_1', consent_given: true },
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
    expect(uploadPath).toContain('user_123/');
    expect(uploadPath).toContain('_front.jpg');
  });

  it('업로드 실패 시 null을 반환한다', async () => {
    const uploadFn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Upload failed' },
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
      'data:image/png;base64,abc123',
      'side'
    );

    expect(result).toBeNull();
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
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.from = vi.fn(() => chain);
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.maybeSingle = vi.fn().mockResolvedValueOnce({
      data: { id: 'c1', consent_given: true },
      error: null,
    });

    const mockSupabase = {
      ...chain,
      storage: { from: vi.fn(() => ({ upload: uploadFn })) },
    };

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
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.from = vi.fn(() => chain);
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.maybeSingle = vi.fn().mockResolvedValueOnce({
      data: { id: 'c1', consent_given: true },
      error: null,
    });

    const mockSupabase = {
      ...chain,
      storage: { from: vi.fn(() => ({ upload: vi.fn() })) },
    };

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
});
