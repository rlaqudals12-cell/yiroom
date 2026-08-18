/**
 * Smart Matching HTTP 클라이언트 회귀 테스트
 *
 * 웹 라우트는 measurements/size-history를 raw JSON으로 반환한다. 모바일이 존재하지 않는
 * wrapper 필드를 읽으면 200 응답이어도 null/빈 배열처럼 보이므로 실제 응답 형상을 고정한다.
 */

import {
  addSizeHistory,
  getMeasurements,
  getSizeHistory,
  saveMeasurements,
} from '../../lib/smart-matching';

const mockFetch = jest.fn();

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('Smart Matching API client', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_YIROOM_API_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_YIROOM_API_URL = 'https://api.example.com';
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    } else {
      process.env.EXPO_PUBLIC_YIROOM_API_URL = originalApiUrl;
    }
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('신체 치수 GET의 raw 응답을 그대로 반환하고 Clerk 토큰을 전달한다', async () => {
    const measurements = {
      height: 170,
      weight: 60,
      preferredFit: 'regular' as const,
    };
    mockFetch.mockResolvedValue(jsonResponse(measurements));

    await expect(getMeasurements('clerk-token')).resolves.toEqual(measurements);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/smart-matching/measurements',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer clerk-token',
        }),
      })
    );
  });

  it('신체 치수 PUT의 raw 응답을 그대로 반환한다', async () => {
    const measurements = {
      height: 171,
      preferredFit: 'loose' as const,
    };
    mockFetch.mockResolvedValue(jsonResponse(measurements));

    await expect(saveMeasurements('clerk-token', measurements)).resolves.toEqual(measurements);
  });

  it('사이즈 기록 GET의 raw 배열을 비우지 않고 반환한다', async () => {
    const history = [
      {
        id: 'history-1',
        brandId: 'brand-1',
        brandName: '브랜드',
        category: 'top',
        size: 'M',
        fit: 'perfect' as const,
        createdAt: '2026-08-18T00:00:00.000Z',
      },
    ];
    mockFetch.mockResolvedValue(jsonResponse(history));

    await expect(getSizeHistory('clerk-token')).resolves.toEqual(history);
  });

  it('사이즈 기록 POST의 raw 객체를 그대로 반환한다', async () => {
    const history = {
      id: 'history-2',
      brandId: 'brand-2',
      brandName: '새 브랜드',
      category: 'bottom',
      size: 'S',
      fit: 'perfect' as const,
      createdAt: '2026-08-18T00:00:00.000Z',
    };
    mockFetch.mockResolvedValue(jsonResponse(history, 201));

    await expect(
      addSizeHistory('clerk-token', {
        brandId: history.brandId,
        brandName: history.brandName,
        category: 'bottom',
        size: history.size,
        fit: history.fit,
      })
    ).resolves.toEqual(history);
  });
});
