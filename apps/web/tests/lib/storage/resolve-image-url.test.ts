import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractStoragePath, resolveSignedImageUrl } from '@/lib/storage';

const BUCKET = 'skin-images';
const SUPA = 'https://proj.supabase.co';

describe('extractStoragePath', () => {
  it('서명 URL에서 버킷 경로를 추출한다 (쿼리스트링 무시)', () => {
    const url = `${SUPA}/storage/v1/object/sign/${BUCKET}/user_1/123.jpg?token=abc`;
    expect(extractStoragePath(url, BUCKET)).toBe('user_1/123.jpg');
  });

  it('public URL에서도 경로를 추출한다 (비공개 전환 전 레거시)', () => {
    const url = `${SUPA}/storage/v1/object/public/${BUCKET}/user_1/a/b.jpg`;
    expect(extractStoragePath(url, BUCKET)).toBe('user_1/a/b.jpg');
  });

  it('URL 인코딩된 경로를 디코드한다', () => {
    const url = `${SUPA}/storage/v1/object/sign/${BUCKET}/user_1/%ED%94%84%EB%A1%9C%ED%95%84.jpg`;
    expect(extractStoragePath(url, BUCKET)).toBe('user_1/프로필.jpg');
  });

  it('다른 버킷의 URL이면 null (호출측이 원본 유지 판단)', () => {
    const url = `${SUPA}/storage/v1/object/sign/other-bucket/user_1/123.jpg`;
    expect(extractStoragePath(url, BUCKET)).toBeNull();
  });

  it('스토리지 URL이 아니면 null (외부 URL)', () => {
    expect(extractStoragePath('https://example.com/photo.jpg', BUCKET)).toBeNull();
  });

  it('URL이 아닌 값(순수 경로)이면 null', () => {
    expect(extractStoragePath('user_1/123.jpg', BUCKET)).toBeNull();
  });
});

describe('resolveSignedImageUrl', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockSignedResponse(signedUrl: string) {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ signedUrl }),
    });
  }

  it('순수 경로는 서명 API로 서명 URL을 발급받는다', async () => {
    mockSignedResponse('https://signed/fresh.jpg');
    const result = await resolveSignedImageUrl('user_1/123.jpg', BUCKET);

    expect(result).toBe('https://signed/fresh.jpg');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ bucket: BUCKET, path: 'user_1/123.jpg' });
  });

  it('레거시 만료 서명 URL은 경로 추출 후 재서명한다 (영구 로드 실패 수리의 핵심)', async () => {
    mockSignedResponse('https://signed/fresh.jpg');
    const stale = `${SUPA}/storage/v1/object/sign/${BUCKET}/user_1/123.jpg?token=expired`;

    const result = await resolveSignedImageUrl(stale, BUCKET);

    expect(result).toBe('https://signed/fresh.jpg');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    // 전체 URL이 아니라 추출된 경로가 넘어가야 서명 API 소유권 가드(첫 세그먼트=userId)를 통과한다
    expect(body.path).toBe('user_1/123.jpg');
  });

  it('외부 URL(스토리지 아님)은 서명 없이 원본을 반환한다 (기존 동작 보존)', async () => {
    const external = 'https://example.com/photo.jpg';
    const result = await resolveSignedImageUrl(external, BUCKET);

    expect(result).toBe(external);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('서명 API 실패 시 null을 반환한다 (호출측 우아한 실패)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    expect(await resolveSignedImageUrl('user_1/123.jpg', BUCKET)).toBeNull();
  });

  it('네트워크 오류 시 null을 반환한다', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    expect(await resolveSignedImageUrl('user_1/123.jpg', BUCKET)).toBeNull();
  });

  it('빈 값/널은 null을 반환한다', async () => {
    expect(await resolveSignedImageUrl(null, BUCKET)).toBeNull();
    expect(await resolveSignedImageUrl('', BUCKET)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('expiresIn 기본값은 24시간이다 (열린 탭 재만료 방지)', async () => {
    mockSignedResponse('https://signed/fresh.jpg');
    await resolveSignedImageUrl('user_1/123.jpg', BUCKET);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.expiresIn).toBe(86400);
  });
});
