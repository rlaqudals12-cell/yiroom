/**
 * 날씨 API 테스트
 * GET /api/weather
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WeatherApiResponse } from '@/types/weather';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

import { GET } from '@/app/api/weather/route';

// Mock weatherService
vi.mock('@/lib/style/weatherService', () => ({
  getWeatherByRegion: vi.fn(),
  getWeatherByCoords: vi.fn(),
  generateMockWeather: vi.fn().mockReturnValue({
    region: 'seoul',
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
    cachedAt: '2025-01-15T10:00:00Z',
  }),
}));

import {
  getWeatherByRegion,
  getWeatherByCoords,
  generateMockWeather,
} from '@/lib/style/weatherService';

// 헬퍼 함수
function createRequest(url: string): Request {
  return new Request(url);
}

describe('Weather API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user-1' });
  });

  describe('GET /api/weather', () => {
    it('기본값으로 서울 날씨를 반환한다', async () => {
      const mockWeather = {
        region: 'seoul',
        location: '서울',
        current: { temp: 15, feelsLike: 13 },
        forecast: [],
      };
      vi.mocked(getWeatherByRegion).mockResolvedValueOnce(mockWeather as never);

      const request = createRequest('http://localhost/api/weather');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWeatherByRegion).toHaveBeenCalledWith('seoul');

      const data = (await response.json()) as WeatherApiResponse;
      expect(data.locationSource).toBe('default');
      expect(data.usedFallback).toBe(false);
    });

    it('지역 코드로 날씨를 조회한다', async () => {
      const mockWeather = {
        region: 'busan',
        location: '부산',
        current: { temp: 18, feelsLike: 16 },
        forecast: [],
      };
      vi.mocked(getWeatherByRegion).mockResolvedValueOnce(mockWeather as never);

      const request = createRequest('http://localhost/api/weather?region=busan');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWeatherByRegion).toHaveBeenCalledWith('busan');

      const data = (await response.json()) as WeatherApiResponse;
      expect(data.region).toBe('busan');
      expect(data.locationSource).toBe('region');
    });

    it('같은 지역 캐시를 써도 요청별 위치 출처를 응답에서 다시 붙인다', async () => {
      const cachedWeather = {
        region: 'seoul',
        location: '서울',
        current: { temp: 15, feelsLike: 13 },
        forecast: [],
      };
      vi.mocked(getWeatherByRegion).mockResolvedValue(cachedWeather as never);

      const defaultResponse = await GET(createRequest('http://localhost/api/weather'));
      const regionResponse = await GET(createRequest('http://localhost/api/weather?region=seoul'));

      expect((await defaultResponse.json()).locationSource).toBe('default');
      expect((await regionResponse.json()).locationSource).toBe('region');
    });

    it('잘못된 지역 코드는 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/weather?region=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid region');
      expect(data.validRegions).toBeDefined();
    });

    it('위도/경도로 날씨를 조회한다', async () => {
      const mockWeather = {
        region: 'seoul',
        location: '서울',
        current: { temp: 15 },
        forecast: [],
      };
      vi.mocked(getWeatherByCoords).mockResolvedValueOnce(mockWeather as never);

      const request = createRequest('http://localhost/api/weather?lat=37.5665&lon=126.978');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWeatherByCoords).toHaveBeenCalledWith(37.5665, 126.978);

      const data = (await response.json()) as WeatherApiResponse;
      expect(data.locationSource).toBe('geolocation');
    });

    it('잘못된 좌표는 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/weather?lat=abc&lon=def');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid coordinates');
    });

    it('한국 범위 밖의 좌표는 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/weather?lat=50&lon=100');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Korea');
    });

    it('API 에러 시 Mock 데이터를 반환한다', async () => {
      vi.mocked(getWeatherByRegion).mockRejectedValueOnce(new Error('API Error'));

      const request = createRequest('http://localhost/api/weather?region=seoul');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(generateMockWeather).toHaveBeenCalled();

      const data = (await response.json()) as WeatherApiResponse;
      expect(data.usedFallback).toBe(true);
      expect(data.locationSource).toBe('default');
    });

    it('인증되지 않은 요청은 날씨 서비스 호출 전에 401을 반환한다', async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const response = await GET(createRequest('http://localhost/api/weather'));

      expect(response.status).toBe(401);
      expect(getWeatherByRegion).not.toHaveBeenCalled();
      const data = await response.json();
      expect(data.error.userMessage).toBe('로그인이 필요합니다.');
    });
  });
});
