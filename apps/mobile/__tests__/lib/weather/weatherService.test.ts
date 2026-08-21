/**
 * 모바일 날씨 thin client·폴백 정직성 회귀 테스트
 */

jest.mock('@/lib/api/base-url', () => ({
  getApiBaseUrl: () => 'https://yiroom.test',
}));

import {
  clearWeatherCache,
  findNearestRegion,
  generateMockWeather,
  getWeatherByRegion,
} from '@/lib/weather/weatherService';

const LIVE_WEATHER = {
  region: 'seoul' as const,
  location: '서울',
  current: {
    temp: 15,
    feelsLike: 13,
    humidity: 60,
    windSpeed: 2.5,
    uvi: 4,
    description: '맑음',
    icon: '01d',
    precipitation: 10,
  },
  forecast: [],
  cachedAt: '2026-08-21T00:00:00.000Z',
  usedFallback: false,
  locationSource: 'default' as const,
};

describe('weatherService', () => {
  beforeEach(() => {
    clearWeatherCache();
    global.fetch = jest.fn();
  });

  it('인증 토큰으로 웹 API를 호출하고 서버 위치 출처를 전파한다', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(LIVE_WEATHER),
    } as unknown as Response);

    const result = await getWeatherByRegion('seoul', 'clerk-token', 'default');

    expect(global.fetch).toHaveBeenCalledWith('https://yiroom.test/api/weather', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer clerk-token',
      },
    });
    expect(result.locationSource).toBe('default');
    expect(result.usedFallback).toBe(false);
  });

  it('명시 지역은 region 쿼리로 요청한다', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        ...LIVE_WEATHER,
        region: 'busan',
        location: '부산',
        locationSource: 'region',
      }),
    } as unknown as Response);

    const result = await getWeatherByRegion('busan', 'clerk-token', 'region');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://yiroom.test/api/weather?region=busan',
      expect.any(Object)
    );
    expect(result.locationSource).toBe('region');
  });

  it('서울 기본값 캐시를 명시 지역 요청에 재사용하지 않는다', async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(LIVE_WEATHER),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ ...LIVE_WEATHER, locationSource: 'region' }),
      } as unknown as Response);

    await getWeatherByRegion('seoul', 'clerk-token', 'default');
    const explicitRegion = await getWeatherByRegion('seoul', 'clerk-token', 'region');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(explicitRegion.locationSource).toBe('region');
  });

  it('웹 API 실패는 출처가 표시된 placeholder로 낮춘다', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const result = await getWeatherByRegion('seoul', 'expired-token', 'default');

    expect(result.usedFallback).toBe(true);
    expect(result.locationSource).toBe('default');
  });

  it('기존 좌표→지원 지역 공개 계약을 유지한다', () => {
    expect(findNearestRegion(35.1796, 129.0756)).toBe('busan');
  });

  it('Mock 출처를 usedFallback으로 명시한다', () => {
    expect(generateMockWeather('seoul').usedFallback).toBe(true);
  });

  it('Math.random 없이 같은 지역에 같은 예시값을 만든다', () => {
    const randomSpy = jest.spyOn(Math, 'random');

    const first = generateMockWeather('seoul');
    const second = generateMockWeather('seoul');

    expect(randomSpy).not.toHaveBeenCalled();
    expect(second.current).toEqual(first.current);
    expect(second.forecast).toEqual(first.forecast);

    randomSpy.mockRestore();
  });
});
