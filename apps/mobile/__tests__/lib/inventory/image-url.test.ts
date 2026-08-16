/**
 * 인벤토리 이미지 URL 해석 테스트 (모바일)
 *
 * @see lib/inventory/image-url.ts
 * 핵심 계약: `inventory-images`는 **비공개** 버킷이다.
 *   - DB에 저장된 스토리지 경로는 서명 URL로 바뀌어야 화면에 뜬다
 *   - 레거시 절대 URL·로컬 file:// 미리보기는 그대로 통과해야 한다
 *   - 서명 실패는 빈 문자열 — 경로를 그대로 <Image>에 넘기면 조용히 깨진다
 */

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

function makeClient(createSignedUrls: jest.Mock): {
  client: SignedUrlCapableClient;
  from: jest.Mock;
} {
  const from = jest.fn(() => ({ createSignedUrls }));
  return {
    client: { storage: { from } } as unknown as SignedUrlCapableClient,
    from,
  };
}

beforeEach(() => {
  __resetInventoryImageUrlCache();
  jest.clearAllMocks();
});

describe('isInventoryStoragePath', () => {
  it('스토리지 경로를 경로로 판정한다', () => {
    expect(isInventoryStoragePath(PATH_A)).toBe(true);
  });

  it('이미 렌더 가능한 값은 경로가 아니다', () => {
    expect(isInventoryStoragePath('https://cdn.example/x.png')).toBe(false);
    expect(isInventoryStoragePath('file:///cache/photo.jpg')).toBe(false);
    expect(isInventoryStoragePath('data:image/png;base64,AAA')).toBe(false);
    expect(isInventoryStoragePath('/local/asset.png')).toBe(false);
  });

  it('빈 값·비문자열은 경로가 아니다', () => {
    expect(isInventoryStoragePath('')).toBe(false);
    expect(isInventoryStoragePath(null)).toBe(false);
    expect(isInventoryStoragePath(undefined)).toBe(false);
  });
});

describe('resolveInventoryImageUrl', () => {
  it('레거시 절대 URL은 그대로 통과한다', () => {
    const legacy = 'https://proj.supabase.co/storage/v1/object/public/inventory-images/u/x.png';
    expect(resolveInventoryImageUrl(legacy)).toBe(legacy);
  });

  it('경로는 서명 URL로 바뀐다', () => {
    expect(resolveInventoryImageUrl(PATH_A, new Map([[PATH_A, SIGNED_A]]))).toBe(SIGNED_A);
  });

  it('서명하지 못한 경로·null은 빈 문자열이다', () => {
    expect(resolveInventoryImageUrl(PATH_A, new Map())).toBe('');
    expect(resolveInventoryImageUrl(null)).toBe('');
  });
});

describe('signInventoryImagePaths', () => {
  it('경로만 골라 한 번에 서명한다 (URL·null은 제외)', async () => {
    const createSignedUrls = jest.fn().mockResolvedValue({
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

  it('서명할 경로가 없으면 요청조차 하지 않는다', async () => {
    const createSignedUrls = jest.fn();
    const { client } = makeClient(createSignedUrls);

    const result = await signInventoryImagePaths(client, ['https://cdn.example/x.png', null]);

    expect(createSignedUrls).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('한 번 서명한 경로는 캐시에서 재사용한다', async () => {
    const createSignedUrls = jest
      .fn()
      .mockResolvedValue({ data: [{ path: PATH_A, signedUrl: SIGNED_A }], error: null });
    const { client } = makeClient(createSignedUrls);

    await signInventoryImagePaths(client, [PATH_A]);
    const second = await signInventoryImagePaths(client, [PATH_A]);

    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(second.get(PATH_A)).toBe(SIGNED_A);
  });

  it('서명 실패해도 throw하지 않는다 (옷장 목록이 통째로 죽지 않도록)', async () => {
    const createSignedUrls = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const { client } = makeClient(createSignedUrls);

    const result = await signInventoryImagePaths(client, [PATH_A]);

    expect(result.size).toBe(0);
  });

  it('클라이언트가 예외를 던져도 삼킨다', async () => {
    const createSignedUrls = jest.fn().mockRejectedValue(new Error('network'));
    const { client } = makeClient(createSignedUrls);

    await expect(signInventoryImagePaths(client, [PATH_A])).resolves.toBeInstanceOf(Map);
  });
});
