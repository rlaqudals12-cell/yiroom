import { addToWishlist, getWishlist, isInWishlist, removeFromWishlist } from '@/lib/wishlist';

const mockFetch = jest.fn();

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('모바일 위시리스트 인증 API', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_YIROOM_API_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_YIROOM_API_URL = 'https://api.example.com';
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    else process.env.EXPO_PUBLIC_YIROOM_API_URL = originalApiUrl;
  });

  beforeEach(() => mockFetch.mockReset());

  it('서버가 실제 제품 테이블에서 확인한 optional 메타만 목록에 사용한다', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          items: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              clerkUserId: 'user-1',
              productType: 'health_food',
              productId: '22222222-2222-4222-8222-222222222222',
              createdAt: '2026-08-21T00:00:00.000Z',
              name: '단백질 바',
              brand: '이룸랩',
            },
          ],
        },
      })
    );

    await expect(getWishlist('jwt-token')).resolves.toEqual([
      expect.objectContaining({ productType: 'health_food', name: '단백질 바' }),
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/wishlist',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      })
    );
  });

  it('DB enum을 그대로 사용해 상태 조회·추가·삭제한다', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { isWishlisted: false } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { isWishlisted: true } }, 201))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { isWishlisted: false } }));
    const productId = '22222222-2222-4222-8222-222222222222';

    await expect(isInWishlist('jwt-token', 'workout_equipment', productId)).resolves.toBe(false);
    await expect(
      addToWishlist('jwt-token', { productType: 'workout_equipment', productId })
    ).resolves.toBe(true);
    await expect(removeFromWishlist('jwt-token', 'workout_equipment', productId)).resolves.toBe(
      true
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/wishlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ productType: 'workout_equipment', productId }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/api/wishlist',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ productType: 'workout_equipment', productId }),
      })
    );
  });

  it('토큰이 없으면 네트워크 요청 전에 실패한다', async () => {
    await expect(getWishlist('')).rejects.toMatchObject({ status: 401, code: 'AUTH_ERROR' });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
