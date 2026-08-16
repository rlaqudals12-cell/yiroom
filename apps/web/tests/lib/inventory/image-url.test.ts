/**
 * 인벤토리 이미지 URL 해석 테스트
 *
 * @see lib/inventory/image-url.ts
 * 핵심 계약: `inventory-images`는 **비공개** 버킷이다.
 *   - DB에 저장된 스토리지 경로는 반드시 서명 URL로 바뀌어야 한다
 *   - 레거시 절대 URL은 그대로 통과해야 한다 (하위호환)
 *   - 해석 실패는 빈 문자열 — 경로를 그대로 내보내면 next/image가 예외를 던져 화면이 깨진다
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isInventoryStoragePath,
  resolveInventoryImageUrl,
  signInventoryImagePaths,
  __resetInventoryImageUrlCache,
  INVENTORY_IMAGE_BUCKET,
  type SignedUrlCapableClient,
} from '@/lib/inventory/image-url';

const PATH_A = 'user_1/closet/aaa_processed.png';
const PATH_B = 'user_1/closet/bbb_processed.png';
const SIGNED_A = 'https://proj.supabase.co/storage/v1/object/sign/inventory-images/a?token=x';
const SIGNED_B = 'https://proj.supabase.co/storage/v1/object/sign/inventory-images/b?token=y';

function makeClient(
  impl: SignedUrlCapableClient['storage'] extends never ? never : ReturnType<typeof vi.fn>
): { client: SignedUrlCapableClient; from: ReturnType<typeof vi.fn> } {
  const from = vi.fn(() => ({ createSignedUrls: impl }));
  return { client: { storage: { from } } as unknown as SignedUrlCapableClient, from };
}

beforeEach(() => {
  __resetInventoryImageUrlCache();
  vi.restoreAllMocks();
});

afterEach(() => {
  __resetInventoryImageUrlCache();
});

describe('isInventoryStoragePath', () => {
  it('스토리지 경로를 경로로 판정한다', () => {
    expect(isInventoryStoragePath(PATH_A)).toBe(true);
    expect(isInventoryStoragePath('user_1/beauty/x_original.png')).toBe(true);
  });

  it('이미 렌더 가능한 값은 경로가 아니다', () => {
    expect(isInventoryStoragePath('https://cdn.example/x.png')).toBe(false);
    expect(isInventoryStoragePath('http://cdn.example/x.png')).toBe(false);
    expect(isInventoryStoragePath('data:image/png;base64,AAA')).toBe(false);
    expect(isInventoryStoragePath('blob:http://localhost/abc')).toBe(false);
    expect(isInventoryStoragePath('file:///cache/photo.jpg')).toBe(false);
    expect(isInventoryStoragePath('/local/asset.png')).toBe(false);
    expect(isInventoryStoragePath('//cdn.example/x.png')).toBe(false);
  });

  it('빈 값·비문자열은 경로가 아니다', () => {
    expect(isInventoryStoragePath('')).toBe(false);
    expect(isInventoryStoragePath(null)).toBe(false);
    expect(isInventoryStoragePath(undefined)).toBe(false);
    expect(isInventoryStoragePath(123)).toBe(false);
  });
});

describe('resolveInventoryImageUrl', () => {
  it('레거시 절대 URL은 그대로 통과한다 (하위호환)', () => {
    const legacy = 'https://proj.supabase.co/storage/v1/object/public/inventory-images/u/x.png';
    expect(resolveInventoryImageUrl(legacy)).toBe(legacy);
  });

  it('경로는 서명 URL로 바뀐다', () => {
    const signed = new Map([[PATH_A, SIGNED_A]]);
    expect(resolveInventoryImageUrl(PATH_A, signed)).toBe(SIGNED_A);
  });

  it('서명하지 못한 경로는 빈 문자열이다 (경로를 그대로 내보내지 않는다)', () => {
    // next/image는 `/`로 시작하지 않는 상대 경로에서 예외를 던져 페이지 전체가 깨진다
    expect(resolveInventoryImageUrl(PATH_A, new Map())).toBe('');
    expect(resolveInventoryImageUrl(PATH_A)).toBe('');
  });

  it('null/undefined는 빈 문자열이다', () => {
    expect(resolveInventoryImageUrl(null)).toBe('');
    expect(resolveInventoryImageUrl(undefined)).toBe('');
  });
});

describe('signInventoryImagePaths', () => {
  it('경로만 골라 한 번에 서명한다 (URL·null은 요청에서 제외)', async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [
        { path: PATH_A, signedUrl: SIGNED_A },
        { path: PATH_B, signedUrl: SIGNED_B },
      ],
      error: null,
    });
    const { client, from } = makeClient(createSignedUrls);

    const result = await signInventoryImagePaths(client, [
      PATH_A,
      'https://cdn.example/legacy.png',
      null,
      PATH_B,
    ]);

    expect(from).toHaveBeenCalledWith(INVENTORY_IMAGE_BUCKET);
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls.mock.calls[0][0]).toEqual([PATH_A, PATH_B]);
    expect(result.get(PATH_A)).toBe(SIGNED_A);
    expect(result.get(PATH_B)).toBe(SIGNED_B);
  });

  it('중복 경로는 한 번만 서명한다', async () => {
    const createSignedUrls = vi
      .fn()
      .mockResolvedValue({ data: [{ path: PATH_A, signedUrl: SIGNED_A }], error: null });
    const { client } = makeClient(createSignedUrls);

    await signInventoryImagePaths(client, [PATH_A, PATH_A, PATH_A]);

    expect(createSignedUrls.mock.calls[0][0]).toEqual([PATH_A]);
  });

  it('서명할 경로가 없으면 요청조차 하지 않는다', async () => {
    const createSignedUrls = vi.fn();
    const { client } = makeClient(createSignedUrls);

    const result = await signInventoryImagePaths(client, ['https://cdn.example/x.png', null]);

    expect(createSignedUrls).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('한 번 서명한 경로는 캐시에서 재사용한다 (next/image 캐시 키 안정화)', async () => {
    const createSignedUrls = vi
      .fn()
      .mockResolvedValue({ data: [{ path: PATH_A, signedUrl: SIGNED_A }], error: null });
    const { client } = makeClient(createSignedUrls);

    await signInventoryImagePaths(client, [PATH_A]);
    const second = await signInventoryImagePaths(client, [PATH_A]);

    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(second.get(PATH_A)).toBe(SIGNED_A);
  });

  it('서명 실패해도 throw하지 않는다 (사진 한 장에 목록 전체가 죽지 않도록)', async () => {
    const createSignedUrls = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const { client } = makeClient(createSignedUrls);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await signInventoryImagePaths(client, [PATH_A]);

    expect(result.size).toBe(0);
  });

  it('클라이언트가 예외를 던져도 삼킨다', async () => {
    const createSignedUrls = vi.fn().mockRejectedValue(new Error('network'));
    const { client } = makeClient(createSignedUrls);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(signInventoryImagePaths(client, [PATH_A])).resolves.toBeInstanceOf(Map);
  });

  // 브라우저에서 storage RLS(`TO authenticated`)에 막히면 옷장 썸네일이 전부 빈칸이 된다.
  // 그 경우 서버(service role + 경로 소유권 검증)를 거쳐 한 번 더 시도해야 한다.
  it('클라이언트 서명이 실패하면 서버 서명 API로 폴백한다 (브라우저)', async () => {
    const createSignedUrls = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const { client } = makeClient(createSignedUrls);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ signedUrls: { [PATH_A]: SIGNED_A } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await signInventoryImagePaths(client, [PATH_A]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/storage/signed-url');
    expect(JSON.parse(init.body as string)).toMatchObject({
      bucket: INVENTORY_IMAGE_BUCKET,
      paths: [PATH_A],
    });
    expect(result.get(PATH_A)).toBe(SIGNED_A);

    vi.unstubAllGlobals();
  });

  it('클라이언트 서명이 성공하면 폴백 API를 부르지 않는다', async () => {
    const createSignedUrls = vi
      .fn()
      .mockResolvedValue({ data: [{ path: PATH_A, signedUrl: SIGNED_A }], error: null });
    const { client } = makeClient(createSignedUrls);

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await signInventoryImagePaths(client, [PATH_A]);

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
