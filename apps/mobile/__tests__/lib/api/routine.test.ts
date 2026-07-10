/**
 * 모바일 오늘의 맞춤 루틴 HTTP 클라이언트 테스트 (ADR-118)
 *
 * @see lib/api/routine.ts
 * 검증: 성공 캐시, 오프라인/서버 실패 시 캐시 폴백(stale), 캐시 없을 때 throw, 요청 헤더, 분석 0건.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchDailyRoutine, RoutineApiError, type DailyRoutineData } from '@/lib/api/routine';

const BASE = 'https://api.test';

const mockData: DailyRoutineData = {
  date: '2026-07-10',
  hasSkinAnalysis: true,
  skinType: 'combination',
  skinTypeLabel: '복합성',
  carePhase: { phase: 'barrier', label: '장벽 회복 단계', message: '지금은 장벽 회복이 먼저예요' },
  goals: [{ id: 'hydration', label: '수분' }],
  morning: [
    {
      order: 1,
      category: 'cleanser',
      name: '클렌저',
      specName: '약산성 클렌저',
      purpose: '노폐물 제거',
      tips: [],
      isOptional: false,
      howto: { amount: '500원 동전 크기', method: '거품을 내서 세안' },
    },
  ],
  evening: [],
  eveningFocus: { focus: 'recovery', label: '회복의 날', reason: '진정에 집중해요' },
  weeklyCycle: Array.from({ length: 7 }, (_, dow) => ({
    dow,
    focus: 'recovery' as const,
    label: '회복의 날',
  })),
};

function okResponse(data: DailyRoutineData) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  };
}

describe('fetchDailyRoutine', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('성공 시 신선한 루틴(stale:false)을 반환하고 캐시에 저장한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;

    const result = await fetchDailyRoutine('token-1', BASE);
    expect(result.stale).toBe(false);
    expect(result.data.morning?.[0]?.specName).toBe('약산성 클렌저');

    const cached = await AsyncStorage.getItem('routine:latest');
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached as string).date).toBe('2026-07-10');
  });

  it('요청에 Bearer 토큰과 x-yiroom-client:mobile 헤더를 담는다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse(mockData));
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchDailyRoutine('token-abc', BASE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/routine/daily`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
  });

  it('분석 0건 응답(hasSkinAnalysis:false)을 그대로 전달한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ success: true, data: { date: '2026-07-10', hasSkinAnalysis: false } }),
    }) as unknown as typeof fetch;

    const result = await fetchDailyRoutine('token-1', BASE);
    expect(result.stale).toBe(false);
    expect(result.data.hasSkinAnalysis).toBe(false);
    expect(result.data.morning).toBeUndefined();
  });

  it('네트워크 실패 + 캐시 있으면 마지막 루틴을 stale로 반환한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;
    await fetchDailyRoutine('token-1', BASE);

    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const result = await fetchDailyRoutine('token-1', BASE);

    expect(result.stale).toBe(true);
    expect(result.data.date).toBe('2026-07-10');
  });

  it('네트워크 실패 + 캐시 없으면 NETWORK_ERROR를 던진다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(fetchDailyRoutine('token-1', BASE)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('서버 오류(500) + 캐시 없으면 RoutineApiError를 던진다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '서버 오류', code: 'INTERNAL_ERROR' }),
    }) as unknown as typeof fetch;

    await expect(fetchDailyRoutine('token-1', BASE)).rejects.toBeInstanceOf(RoutineApiError);
  });

  it('서버 오류라도 캐시가 있으면 stale로 폴백한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(mockData)) as unknown as typeof fetch;
    await fetchDailyRoutine('token-1', BASE);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '서버 오류', code: 'INTERNAL_ERROR' }),
    }) as unknown as typeof fetch;

    const result = await fetchDailyRoutine('token-1', BASE);
    expect(result.stale).toBe(true);
    expect(result.data.hasSkinAnalysis).toBe(true);
  });

  it('baseUrl이 없으면 CONFIG_ERROR를 던진다', async () => {
    const prev = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(fetchDailyRoutine('token-1')).rejects.toMatchObject({ code: 'CONFIG_ERROR' });
    } finally {
      if (prev !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = prev;
    }
  });
});
