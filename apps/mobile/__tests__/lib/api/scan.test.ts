/**
 * 성분표 OCR HTTP 클라이언트 테스트 (2026-07-16 감사 수리 — thin client 전환)
 *
 * @see lib/api/scan.ts
 * 검증: 성공 응답 반환, 요청 헤더(Bearer + x-yiroom-client), 토큰/설정 누락·서버 실패 throw.
 */

import { DEFAULT_API_BASE_URL } from '@/lib/api/base-url';
import { fetchIngredientOcr, ScanOcrApiError } from '@/lib/api/scan';
import type { OcrResult } from '@/lib/scan/ingredient-ocr';

const BASE = 'https://api.test';

const OCR_OK: OcrResult = {
  success: true,
  productName: 'Miracle Toner',
  ingredients: [{ order: 1, inciName: 'NIACINAMIDE', nameKo: '나이아신아마이드' }],
  confidence: 'high',
  language: 'ko',
};

function okResponse(data: OcrResult) {
  return { ok: true, status: 200, json: () => Promise.resolve(data) };
}

describe('fetchIngredientOcr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('성공 시 서버 OcrResult를 그대로 반환한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(OCR_OK)) as unknown as typeof fetch;

    const result = await fetchIngredientOcr('token-1', 'BASE64', BASE);
    expect(result.success).toBe(true);
    expect(result.ingredients[0]?.inciName).toBe('NIACINAMIDE');
  });

  it('요청에 Bearer 토큰과 x-yiroom-client:mobile 헤더 + image 바디를 담는다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse(OCR_OK));
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchIngredientOcr('token-abc', 'IMG64', BASE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/scan/ocr`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'x-yiroom-client': 'mobile',
        }),
        body: JSON.stringify({ image: 'IMG64' }),
      })
    );
  });

  it('토큰이 없으면 401 ScanOcrApiError를 던진다 (요청 자체를 보내지 않음)', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchIngredientOcr(null, 'IMG64', BASE)).rejects.toMatchObject({
      name: 'ScanOcrApiError',
      status: 401,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('base URL 미설정이면 CONFIG_ERROR 대신 프로덕션 웹으로 폴백한다', async () => {
    // 왜: 두 env 어느 것도 실제 빌드에 설정된 적이 없다. 설정 누락을 에러로 처리하던
    // 옛 계약은 EAS 빌드에서 분석을 전멸시켰다 — 이제는 프로덕션 웹으로 붙는다.
    const originalYiroom = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    const originalApi = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;

    // 네트워크 단계에서 끊어 URL만 관찰한다 (응답 형태는 이 테스트의 관심사가 아님)
    const fetchMock = jest.fn().mockRejectedValue(new Error('stop-after-url'));
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      await Promise.resolve(fetchIngredientOcr('token-1', 'IMG64')).catch(() => undefined);

      const calledUrl = String(fetchMock.mock.calls[0][0]);
      expect(calledUrl.startsWith(`${DEFAULT_API_BASE_URL}/api/`)).toBe(true);
    } finally {
      if (originalYiroom !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalYiroom;
      if (originalApi !== undefined) process.env.EXPO_PUBLIC_API_URL = originalApi;
    }
  });

  it('서버 오류(500) 시 서버 error 메시지로 throw한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'OCR 분석에 실패했습니다' }),
    }) as unknown as typeof fetch;

    await expect(fetchIngredientOcr('token-1', 'IMG64', BASE)).rejects.toThrow(
      'OCR 분석에 실패했습니다'
    );
  });

  it('네트워크 실패 시 NETWORK_ERROR를 던진다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(fetchIngredientOcr('token-1', 'IMG64', BASE)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    // 커스텀 에러 타입 확인
    await expect(fetchIngredientOcr('token-1', 'IMG64', BASE)).rejects.toBeInstanceOf(
      ScanOcrApiError
    );
  });
});
