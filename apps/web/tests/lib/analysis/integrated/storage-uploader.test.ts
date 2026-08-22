import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateServiceRoleClient = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockCreateServiceRoleClient(),
}));

const { uploadSessionImages } = await import('@/lib/analysis/integrated/internal/storage-uploader');

describe('uploadSessionImages', () => {
  const upload = vi.fn();
  const remove = vi.fn();
  const storageFrom = vi.fn(() => ({ upload, remove }));
  const supabase = { storage: { from: storageFrom } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServiceRoleClient.mockReturnValue(supabase);
    upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }));
    remove.mockResolvedValue({ data: null, error: null });
  });

  it('통합 분석은 독립 보관기한 계약이 없어 얼굴·전신 원본을 항상 비저장한다', async () => {
    const result = await uploadSessionImages(
      'session-1',
      'user-1',
      'data:image/jpeg;base64,YQ==',
      'data:image/jpeg;base64,Yg=='
    );

    expect(result).toEqual({ faceImageUrl: null, bodyImageUrl: null });
    expect(storageFrom).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
