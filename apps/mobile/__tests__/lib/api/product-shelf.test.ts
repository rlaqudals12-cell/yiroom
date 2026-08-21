import {
  addProductShelfItem,
  getProductShelf,
  getProductShelfItem,
  updateProductShelfItem,
} from '@/lib/api/product-shelf';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const API_ITEM = {
  id: 'shelf-1',
  clerkUserId: 'user-1',
  productName: '수분 크림',
  productBrand: '이룸랩',
  productIngredients: [{ name: '히알루론산' }],
  scannedAt: '2026-08-18T00:00:00.000Z',
  scanMethod: 'ocr',
  status: 'owned',
  expiresAt: '2027-01-01T00:00:00.000Z',
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};

describe('제품함 웹 API 클라이언트', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('목록을 공용 base URL과 모바일 인증 헤더로 조회한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [API_ITEM], total: 1 }),
    });

    const result = await getProductShelf('jwt-token', 'https://api.example.com');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/scan/shelf?limit=100&offset=0',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
    expect(result.items[0]).toMatchObject({
      id: 'shelf-1',
      productName: '수분 크림',
      status: 'owned',
    });
  });

  it('상세 조회와 상태 변경도 동일한 인증 경계를 사용한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => API_ITEM })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...API_ITEM, status: 'used_up' }),
      });

    await expect(
      getProductShelfItem('shelf/1', 'jwt-token', 'https://api.example.com')
    ).resolves.toMatchObject({ id: 'shelf-1' });
    await expect(
      updateProductShelfItem(
        'shelf/1',
        { status: 'used_up' },
        'jwt-token',
        'https://api.example.com'
      )
    ).resolves.toMatchObject({ status: 'used_up' });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/scan/shelf/shelf%2F1',
      expect.objectContaining({ method: 'GET' })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/scan/shelf/shelf%2F1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'used_up' }),
      })
    );
  });

  it('제품 추가는 인증된 기존 POST 경계를 사용한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: API_ITEM }),
    });

    await expect(
      addProductShelfItem(
        {
          productId: '22222222-2222-4222-8222-222222222222',
          productName: '수분 크림',
          productBrand: '이룸랩',
          productBarcode: '8801234567890',
          scanMethod: 'barcode',
          status: 'owned',
        },
        'jwt-token',
        'https://api.example.com'
      )
    ).resolves.toMatchObject({ id: 'shelf-1', productName: '수분 크림' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/scan/shelf',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
        body: expect.stringContaining('"scanMethod":"barcode"'),
      })
    );
  });

  it('오류 응답을 빈 제품함으로 위장하지 않는다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'failed' }),
    });

    await expect(getProductShelf('jwt-token', 'https://api.example.com')).rejects.toThrow(
      '제품함을 불러오지 못했어요'
    );
  });
});
