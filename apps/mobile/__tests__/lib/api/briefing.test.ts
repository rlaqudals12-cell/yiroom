/**
 * 모바일 브리핑 HTTP 클라이언트 테스트 (ADR-118)
 *
 * @see lib/api/briefing.ts
 * 검증: 성공 캐시, 오프라인/서버 실패 시 캐시 폴백(stale), 캐시 없을 때 throw, 요청 헤더.
 */

import { DEFAULT_API_BASE_URL } from '@/lib/api/base-url';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearBriefingCache,
  fetchBriefing,
  BriefingApiError,
  type BriefingData,
} from '@/lib/api/briefing';

const BASE = 'https://api.test';
const USER_A = 'user-a';

const mockData: BriefingData = {
  date: '2026-07-10',
  timeSlot: 'morning',
  briefing: {
    greeting: '지민님, 좋은 아침이에요',
    advice: ['SPF50 선크림 챙겨봐요'],
    closing: '오늘도 곁에서 도울게요.',
  },
  myColors: { analysisId: 'pc-9', colors: [{ name: '코랄', hex: '#FF7F50' }] },
  todayStyle: { fashionTip: '가벼운 아우터', outfit: null },
  hasAnalyses: true,
};

function okResponse(data: BriefingData) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  };
}

describe('fetchBriefing', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('성공 시 신선한 브리핑(stale:false)을 반환하고 캐시에 저장한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;

    const result = await fetchBriefing('token-1', USER_A, BASE);
    expect(result.stale).toBe(false);
    expect(result.data.myColors?.analysisId).toBe('pc-9');

    // 캐시 저장 확인 — latest 키에 직렬화되어 있어야 함
    const cached = await AsyncStorage.getItem(`briefing:${USER_A}:latest`);
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached as string).date).toBe('2026-07-10');
  });

  it('요청에 Bearer 토큰과 x-yiroom-client:mobile 헤더를 담는다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse(mockData));
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchBriefing('token-abc', USER_A, BASE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/briefing`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
  });

  it('네트워크 실패 + 캐시 있으면 마지막 브리핑을 stale로 반환한다', async () => {
    // 1) 먼저 성공으로 캐시를 채운다
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;
    await fetchBriefing('token-1', USER_A, BASE);

    // 2) 네트워크 실패
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const result = await fetchBriefing('token-1', USER_A, BASE);

    expect(result.stale).toBe(true);
    expect(result.data.date).toBe('2026-07-10');
  });

  it('네트워크 실패 + 캐시 없으면 NETWORK_ERROR를 던진다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(fetchBriefing('token-1', USER_A, BASE)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('서버 오류(500) + 캐시 없으면 BriefingApiError를 던진다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '서버 오류', code: 'INTERNAL_ERROR' }),
    }) as unknown as typeof fetch;

    await expect(fetchBriefing('token-1', USER_A, BASE)).rejects.toBeInstanceOf(BriefingApiError);
  });

  it('서버 오류라도 캐시가 있으면 stale로 폴백한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;
    await fetchBriefing('token-1', USER_A, BASE);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '서버 오류', code: 'INTERNAL_ERROR' }),
    }) as unknown as typeof fetch;

    const result = await fetchBriefing('token-1', USER_A, BASE);
    expect(result.stale).toBe(true);
    expect(result.data.hasAnalyses).toBe(true);
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
      await Promise.resolve(fetchBriefing('token-1', USER_A)).catch(() => undefined);

      const calledUrl = String(fetchMock.mock.calls[0][0]);
      expect(calledUrl.startsWith(`${DEFAULT_API_BASE_URL}/api/`)).toBe(true);
    } finally {
      if (originalYiroom !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalYiroom;
      if (originalApi !== undefined) process.env.EXPO_PUBLIC_API_URL = originalApi;
    }
  });

  it('A 계정 캐시가 있어도 B 계정의 오프라인 요청에는 절대 반환하지 않는다', async () => {
    const userAData: BriefingData = {
      ...mockData,
      todayStyle: {
        ...mockData.todayStyle,
        closetItemCount: 3,
        closetOutfit: {
          items: [
            {
              id: 'private-a',
              name: 'A의 옷',
              role: '상의',
              imageUrl: 'https://signed.example/a.jpg?token=private-a',
            },
          ],
          warnings: [],
        },
      },
    };
    global.fetch = jest.fn().mockResolvedValue(okResponse(userAData)) as unknown as typeof fetch;
    await fetchBriefing('token-a', USER_A, BASE);

    const cached = await AsyncStorage.getItem(`briefing:${USER_A}:latest`);
    expect(cached).not.toContain('private-a');
    expect(JSON.parse(cached as string).todayStyle.closetOutfit).toBeNull();

    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(fetchBriefing('token-b', 'user-b', BASE)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    const ownResult = await fetchBriefing('token-a', USER_A, BASE);
    expect(ownResult.data.todayStyle.closetOutfit).toBeNull();
  });

  it('로그아웃 시 해당 계정의 날짜별 브리핑과 서명 URL 캐시를 모두 폐기한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;
    await fetchBriefing('token-a', USER_A, BASE);

    await clearBriefingCache(USER_A);

    expect(
      (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(`briefing:${USER_A}:`))
    ).toHaveLength(0);
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(fetchBriefing('token-a', USER_A, BASE)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});
