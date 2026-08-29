import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  hasActiveAccess: vi.fn(),
  storageFrom: vi.fn(),
  createSignedUrl: vi.fn(),
  createSignedUrls: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/consent/image-access', () => ({
  ANALYSIS_IMAGE_BUCKETS: {
    skin: 'skin-images',
    body: 'body-images',
    'personal-color': 'personal-color-images',
    hair: 'hair-images',
    makeup: 'makeup-images',
  },
  hasActiveAnalysisImageAccess: mocks.hasActiveAccess,
}));
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    storage: { from: mocks.storageFrom },
  }),
}));

import { POST } from '@/app/api/storage/signed-url/route';

function request(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/storage/signed-url', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/storage/signed-url — 분석 이미지 동의 경계', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'user-1' });
    mocks.hasActiveAccess.mockResolvedValue(true);
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed/single' },
      error: null,
    });
    mocks.createSignedUrls.mockResolvedValue({
      data: [{ path: 'user-1/photo.jpg', signedUrl: 'https://signed/batch' }],
      error: null,
    });
    mocks.storageFrom.mockReturnValue({
      createSignedUrl: mocks.createSignedUrl,
      createSignedUrls: mocks.createSignedUrls,
    });
  });

  it.each([
    ['skin-images', 'skin'],
    ['body-images', 'body'],
    ['personal-color-images', 'personal-color'],
    ['hair-images', 'hair'],
    ['makeup-images', 'makeup'],
  ] as const)('%s는 활성 %s 동의가 없으면 서명하지 않는다', async (bucket, axis) => {
    mocks.hasActiveAccess.mockResolvedValueOnce(false);

    const response = await POST(request({ bucket, path: 'user-1/photo.jpg', expiresIn: 86400 }));

    expect(response.status).toBe(403);
    expect(mocks.hasActiveAccess).toHaveBeenCalledWith(expect.anything(), axis, 'user-1');
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it('분석 이미지 단건 서명 TTL을 1시간으로 제한한다', async () => {
    const response = await POST(
      request({ bucket: 'hair-images', path: 'user-1/photo.jpg', expiresIn: 86400 })
    );

    expect(response.status).toBe(200);
    expect(mocks.createSignedUrl).toHaveBeenCalledWith('user-1/photo.jpg', 3600);
  });

  it('분석 이미지 일괄 서명도 동의 확인과 1시간 제한을 적용한다', async () => {
    const response = await POST(
      request({ bucket: 'makeup-images', paths: ['user-1/photo.jpg'], expiresIn: 86400 })
    );

    expect(response.status).toBe(200);
    expect(mocks.hasActiveAccess).toHaveBeenCalledWith(expect.anything(), 'makeup', 'user-1');
    expect(mocks.createSignedUrls).toHaveBeenCalledWith(['user-1/photo.jpg'], 3600);
  });

  it('비분석 버킷은 기존 TTL과 소유권 경계를 유지한다', async () => {
    const response = await POST(
      request({ bucket: 'inventory-images', path: 'user-1/photo.jpg', expiresIn: 86400 })
    );

    expect(response.status).toBe(200);
    expect(mocks.hasActiveAccess).not.toHaveBeenCalled();
    expect(mocks.createSignedUrl).toHaveBeenCalledWith('user-1/photo.jpg', 86400);
  });

  it('비분석 버킷 단건도 요청값과 무관하게 24시간을 절대 상한으로 둔다', async () => {
    const response = await POST(
      request({ bucket: 'inventory-images', path: 'user-1/photo.jpg', expiresIn: 604800 })
    );

    expect(response.status).toBe(200);
    expect(mocks.createSignedUrl).toHaveBeenCalledWith('user-1/photo.jpg', 86400);
  });

  it('비분석 버킷 일괄 서명도 24시간 절대 상한을 적용한다', async () => {
    const response = await POST(
      request({ bucket: 'inventory-images', paths: ['user-1/photo.jpg'], expiresIn: 604800 })
    );

    expect(response.status).toBe(200);
    expect(mocks.createSignedUrls).toHaveBeenCalledWith(['user-1/photo.jpg'], 86400);
  });
});
