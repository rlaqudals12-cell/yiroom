/**
 * 코디 추천 API 테스트
 * GET/POST /api/style/recommend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/style/recommend/route';

// Mock weatherService
vi.mock('@/lib/style/weatherService', () => ({
  getWeatherByRegion: vi.fn().mockResolvedValue({
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

// Mock outfitRecommender
vi.mock('@/lib/style/outfitRecommender', () => ({
  recommendOutfit: vi.fn().mockReturnValue({
    layers: [
      { type: 'outer', name: '트렌치코트', reason: '13°C 체감온도에 적합' },
      { type: 'top', name: '니트', reason: '레이어링하기 좋은 아이템' },
      { type: 'bottom', name: '슬랙스', reason: '스트레이트 체형에 어울리는 핏' },
      { type: 'shoes', name: '로퍼', reason: '13°C에 적합한 신발' },
    ],
    accessories: ['선글라스'],
    colors: ['네이비', '베이지'],
    materials: ['면', '니트'],
    tips: ['오후에 기온이 올라갈 예정이에요.'],
    weatherSummary: '서울 맑음, 15°C (체감 13°C)',
  }),
  adjustForOccasion: vi.fn().mockImplementation((rec, occasion) => {
    if (occasion === 'formal') {
      return {
        ...rec,
        layers: [
          { type: 'outer', name: '블레이저', reason: '포멀한 자리에 적합' },
          ...rec.layers.slice(1),
        ],
      };
    }
    return rec;
  }),
}));

import { getWeatherByRegion } from '@/lib/style/weatherService';
import { recommendOutfit, adjustForOccasion } from '@/lib/style/outfitRecommender';

// 헬퍼 함수
function createRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}

describe('Style Recommend API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/style/recommend', () => {
    it('기본 코디 추천을 반환한다', async () => {
      const request = createRequest('http://localhost/api/style/recommend');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.weather).toBeDefined();
      expect(data.recommendation).toBeDefined();
      expect(data.recommendation.layers.length).toBeGreaterThan(0);
    });

    it('지역 파라미터를 적용한다', async () => {
      const request = createRequest(
        'http://localhost/api/style/recommend?region=busan'
      );
      await GET(request);

      expect(getWeatherByRegion).toHaveBeenCalledWith('busan');
    });

    it('체형 파라미터를 적용한다', async () => {
      const request = createRequest(
        'http://localhost/api/style/recommend?bodyType=S'
      );
      await GET(request);

      expect(recommendOutfit).toHaveBeenCalledWith(
        expect.anything(),
        'S',
        ''
      );
    });

    it('퍼스널컬러 파라미터를 적용한다', async () => {
      const request = createRequest(
        'http://localhost/api/style/recommend?personalColor=spring_warm'
      );
      await GET(request);

      expect(recommendOutfit).toHaveBeenCalledWith(
        expect.anything(),
        'N',
        'spring_warm'
      );
    });

    it('상황 파라미터를 적용한다', async () => {
      const request = createRequest(
        'http://localhost/api/style/recommend?occasion=formal'
      );
      await GET(request);

      expect(adjustForOccasion).toHaveBeenCalledWith(
        expect.anything(),
        'formal'
      );
    });

    it('잘못된 체형은 기본값(N)을 사용한다', async () => {
      const request = createRequest(
        'http://localhost/api/style/recommend?bodyType=invalid'
      );
      await GET(request);

      expect(recommendOutfit).toHaveBeenCalledWith(
        expect.anything(),
        'N',
        ''
      );
    });
  });

  describe('POST /api/style/recommend', () => {
    it('날씨 데이터로 코디 추천을 생성한다', async () => {
      const body = {
        weather: {
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
        },
        bodyType: 'S',
        personalColor: 'spring_warm',
      };

      const request = createRequest('http://localhost/api/style/recommend', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(recommendOutfit).toHaveBeenCalledWith(
        body.weather,
        'S',
        'spring_warm'
      );
    });

    it('날씨 데이터 없으면 400을 반환한다', async () => {
      const body = {
        bodyType: 'S',
      };

      const request = createRequest('http://localhost/api/style/recommend', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Weather data');
    });

    it('상황 파라미터를 적용한다', async () => {
      const body = {
        weather: {
          current: { temp: 15, feelsLike: 13 },
        },
        bodyType: 'S',
        occasion: 'formal',
      };

      const request = createRequest('http://localhost/api/style/recommend', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(adjustForOccasion).toHaveBeenCalledWith(
        expect.anything(),
        'formal'
      );
    });

    it('잘못된 체형은 기본값(N)을 사용한다', async () => {
      const body = {
        weather: {
          current: { temp: 15, feelsLike: 13 },
        },
        bodyType: 'invalid',
      };

      const request = createRequest('http://localhost/api/style/recommend', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(recommendOutfit).toHaveBeenCalledWith(
        expect.anything(),
        'N',
        ''
      );
    });
  });
});
