/**
 * 날씨 API 클라이언트 테스트
 *
 * @module tests/lib/weather/index
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentWeather, getWeatherWithGeolocation } from '@/lib/weather';

// fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('lib/weather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getCurrentWeather 테스트
  // ---------------------------------------------------------------------------

  describe('getCurrentWeather', () => {
    it('성공적으로 날씨 데이터를 반환한다', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 15.5,
          precipitation: 0.2,
          weather_code: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getCurrentWeather();

      expect(result).not.toBeNull();
      expect(result?.temp).toBe(16); // 반올림
      expect(result?.precipitation).toBe(20); // 0.2 * 100
      expect(result?.condition).toBe('맑음');
    });

    it('API 에러 시 null을 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await getCurrentWeather();

      expect(result).toBeNull();
    });

    it('네트워크 에러 시 null을 반환한다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getCurrentWeather();

      expect(result).toBeNull();
    });

    it('사용자 지정 좌표로 API를 호출한다', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 20,
          precipitation: 0,
          weather_code: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getCurrentWeather(35.1796, 129.0756); // 부산

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('latitude=35.1796');
      expect(calledUrl).toContain('longitude=129.0756');
    });

    it('기본 좌표(서울)로 API를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 10,
              precipitation: 0,
              weather_code: 0,
            },
          }),
      });

      await getCurrentWeather();

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('latitude=37.5665');
      expect(calledUrl).toContain('longitude=126.978');
    });

    it.each([
      [0, '맑음'],
      [1, '대체로 맑음'],
      [3, '흐림'],
      [61, '가벼운 비'],
      [71, '가벼운 눈'],
      [95, '천둥번개'],
      [999, '알 수 없음'], // 알 수 없는 코드
    ])('날씨 코드 %i를 "%s"로 변환한다', async (code, expectedCondition) => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 10,
              precipitation: 0,
              weather_code: code,
            },
          }),
      });

      const result = await getCurrentWeather();

      expect(result?.condition).toBe(expectedCondition);
    });

    it('API URL에 필요한 파라미터가 포함된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 10,
              precipitation: 0,
              weather_code: 0,
            },
          }),
      });

      await getCurrentWeather();

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('api.open-meteo.com');
      expect(calledUrl).toContain('current=temperature_2m');
      expect(calledUrl).toContain('precipitation');
      expect(calledUrl).toContain('weather_code');
      expect(calledUrl).toContain('timezone=Asia%2FSeoul');
    });
  });

  // ---------------------------------------------------------------------------
  // getWeatherWithGeolocation 테스트
  // ---------------------------------------------------------------------------

  describe('getWeatherWithGeolocation', () => {
    const originalWindow = global.window;
    const originalNavigator = global.navigator;

    afterEach(() => {
      (global as Record<string, unknown>).window = originalWindow;
      (global as Record<string, unknown>).navigator = originalNavigator;
    });

    it('서버 환경(window undefined)에서 기본 위치로 호출한다', async () => {
      (global as Record<string, unknown>).window = undefined;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 10,
              precipitation: 0,
              weather_code: 0,
            },
          }),
      });

      const result = await getWeatherWithGeolocation();

      expect(result).not.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('geolocation 미지원 브라우저에서 기본 위치로 호출한다', async () => {
      (global as Record<string, unknown>).window = {};
      (global as Record<string, unknown>).navigator = {};

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 10,
              precipitation: 0,
              weather_code: 0,
            },
          }),
      });

      const result = await getWeatherWithGeolocation();

      expect(result).not.toBeNull();
    });

    it('geolocation 권한 거부 시 기본 위치로 호출한다', async () => {
      (global as Record<string, unknown>).window = {};
      (global as Record<string, unknown>).navigator = {
        geolocation: {
          getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback | null) => {
            if (error) {
              error({
                code: 1, // PERMISSION_DENIED
                message: 'Permission denied',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
              });
            }
          },
          clearWatch: () => {},
          watchPosition: () => 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 10,
              precipitation: 0,
              weather_code: 0,
            },
          }),
      });

      const result = await getWeatherWithGeolocation();

      expect(result).not.toBeNull();
    });

    it('geolocation 성공 시 사용자 위치로 호출한다', async () => {
      (global as Record<string, unknown>).window = {};
      (global as Record<string, unknown>).navigator = {
        geolocation: {
          getCurrentPosition: (success: PositionCallback) => {
            success({
              coords: {
                latitude: 35.1796,
                longitude: 129.0756,
                accuracy: 100,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON: () => ({}),
              },
              timestamp: Date.now(),
              toJSON: () => ({}),
            } as unknown as GeolocationPosition);
          },
          clearWatch: () => {},
          watchPosition: () => 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 15,
              precipitation: 0,
              weather_code: 0,
            },
          }),
      });

      const result = await getWeatherWithGeolocation();

      expect(result).not.toBeNull();
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('latitude=35.1796');
      expect(calledUrl).toContain('longitude=129.0756');
    });
  });
});
