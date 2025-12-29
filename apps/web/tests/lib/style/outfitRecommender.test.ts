/**
 * 코디 추천 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  recommendOutfit,
  adjustForOccasion,
} from '@/lib/style/outfitRecommender';
import type { WeatherData } from '@/types/weather';

// Mock 날씨 데이터 생성
function createMockWeather(overrides: Partial<WeatherData['current']> = {}): WeatherData {
  return {
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
      ...overrides,
    },
    forecast: [
      {
        time: '15:00',
        temp: 17,
        feelsLike: 15,
        precipitation: 10,
        description: '맑음',
        icon: '01d',
      },
    ],
    cachedAt: new Date().toISOString(),
  };
}

describe('recommendOutfit', () => {
  describe('기온 기반 레이어링', () => {
    it('한파(-5°C 이하)에 4겹 레이어링을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: -10 });
      const result = recommendOutfit(weather);

      expect(result.layers.length).toBeGreaterThanOrEqual(3);
      expect(result.layers.some((l) => l.type === 'outer')).toBe(true);
    });

    it('매우 추운 날(-5~5°C)에 3겹 레이어링을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 0 });
      const result = recommendOutfit(weather);

      expect(result.layers.some((l) => l.type === 'outer')).toBe(true);
    });

    it('추운 날(5~12°C)에 2겹 레이어링을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 8 });
      const result = recommendOutfit(weather);

      expect(result.layers.some((l) => l.type === 'outer')).toBe(true);
    });

    it('선선한 날(12~18°C)에 가벼운 아우터를 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 15 });
      const result = recommendOutfit(weather);

      expect(result.layers.some((l) => l.type === 'outer')).toBe(true);
    });

    it('따뜻한 날(18~23°C)에 아우터 없이 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 20 });
      const result = recommendOutfit(weather);

      // 아우터 없거나 선택적
      const outerLayers = result.layers.filter((l) => l.type === 'outer');
      expect(outerLayers.length).toBeLessThanOrEqual(1);
    });

    it('더운 날(28°C+)에 얇은 옷을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 30 });
      const result = recommendOutfit(weather);

      expect(result.layers.some((l) => l.type === 'outer')).toBe(false);
    });
  });

  describe('강수 대응', () => {
    it('강수 확률 50% 이상이면 우산을 추천한다', () => {
      const weather = createMockWeather({ precipitation: 60 });
      const result = recommendOutfit(weather);

      expect(result.accessories).toContain('우산');
    });

    it('강수 확률 70% 이상이면 레인부츠도 추천한다', () => {
      const weather = createMockWeather({ precipitation: 80 });
      const result = recommendOutfit(weather);

      expect(result.accessories).toContain('레인부츠');
    });

    it('강수 확률 30% 이상이면 접이식 우산을 추천한다', () => {
      const weather = createMockWeather({ precipitation: 40 });
      const result = recommendOutfit(weather);

      expect(result.accessories).toContain('접이식 우산');
    });

    it('강수 확률 30% 미만이면 우산을 추천하지 않는다', () => {
      const weather = createMockWeather({ precipitation: 20 });
      const result = recommendOutfit(weather);

      expect(result.accessories.some((a) => a.includes('우산'))).toBe(false);
    });
  });

  describe('UV 대응', () => {
    it('UV 지수 7 이상이면 선글라스, 모자, 카디건을 추천한다', () => {
      const weather = createMockWeather({ uvi: 8 });
      const result = recommendOutfit(weather);

      expect(result.accessories).toContain('선글라스');
      expect(result.accessories.some((a) => a.includes('모자'))).toBe(true);
    });

    it('UV 지수 5~7이면 선글라스와 모자를 추천한다', () => {
      const weather = createMockWeather({ uvi: 6 });
      const result = recommendOutfit(weather);

      expect(result.accessories).toContain('선글라스');
      expect(result.accessories).toContain('모자');
    });

    it('UV 지수 3~5이면 선글라스만 추천한다', () => {
      const weather = createMockWeather({ uvi: 4 });
      const result = recommendOutfit(weather);

      expect(result.accessories).toContain('선글라스');
      expect(result.accessories).not.toContain('모자');
    });

    it('UV 지수 3 미만이면 UV 아이템을 추천하지 않는다', () => {
      const weather = createMockWeather({ uvi: 2 });
      const result = recommendOutfit(weather);

      expect(result.accessories).not.toContain('선글라스');
    });
  });

  describe('체형별 추천', () => {
    it('S 체형에 맞는 아이템을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 10 });
      const result = recommendOutfit(weather, 'S');

      // 스트레이트 체형 언급이 있어야 함
      const bottomLayer = result.layers.find((l) => l.type === 'bottom');
      expect(bottomLayer?.reason).toContain('스트레이트');
    });

    it('W 체형에 맞는 아이템을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 10 });
      const result = recommendOutfit(weather, 'W');

      const bottomLayer = result.layers.find((l) => l.type === 'bottom');
      expect(bottomLayer?.reason).toContain('웨이브');
    });

    it('N 체형에 맞는 아이템을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 10 });
      const result = recommendOutfit(weather, 'N');

      const bottomLayer = result.layers.find((l) => l.type === 'bottom');
      expect(bottomLayer?.reason).toContain('내추럴');
    });
  });

  describe('퍼스널컬러 적용', () => {
    it('봄 웜톤에 맞는 색상을 추천한다', () => {
      const weather = createMockWeather();
      const result = recommendOutfit(weather, 'N', 'spring_warm');

      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.colors.some((c) => ['아이보리', '코랄', '피치'].includes(c))).toBe(true);
    });

    it('겨울 쿨톤에 맞는 색상을 추천한다', () => {
      const weather = createMockWeather();
      const result = recommendOutfit(weather, 'N', 'winter_cool');

      expect(result.colors.some((c) => ['블랙', '네이비', '화이트'].includes(c))).toBe(true);
    });

    it('퍼스널컬러 미지정 시 기본 색상을 추천한다', () => {
      const weather = createMockWeather();
      const result = recommendOutfit(weather, 'N', '');

      expect(result.colors.length).toBeGreaterThan(0);
    });
  });

  describe('소재 추천', () => {
    it('추운 날에 울, 캐시미어를 추천한다', () => {
      const weather = createMockWeather({ feelsLike: -5 });
      const result = recommendOutfit(weather);

      expect(result.materials.some((m) => m.includes('울') || m.includes('캐시미어'))).toBe(true);
    });

    it('더운 날에 린넨, 면을 추천한다', () => {
      const weather = createMockWeather({ feelsLike: 30 });
      const result = recommendOutfit(weather);

      expect(result.materials.some((m) => m.includes('린넨') || m.includes('면'))).toBe(true);
    });
  });

  describe('팁 생성', () => {
    it('날씨 요약을 포함한다', () => {
      const weather = createMockWeather({ temp: 15, feelsLike: 13 });
      const result = recommendOutfit(weather);

      expect(result.weatherSummary).toContain('서울');
      expect(result.weatherSummary).toContain('15');
    });

    it('습도가 높으면 통기성 팁을 제공한다', () => {
      const weather = createMockWeather({ humidity: 85 });
      const result = recommendOutfit(weather);

      expect(result.tips.some((t) => t.includes('통기성'))).toBe(true);
    });

    it('바람이 강하면 방풍 팁을 제공한다', () => {
      const weather = createMockWeather({ windSpeed: 7 });
      const result = recommendOutfit(weather);

      expect(result.tips.some((t) => t.includes('바람') || t.includes('머플러'))).toBe(true);
    });
  });
});

describe('adjustForOccasion', () => {
  const baseRecommendation = recommendOutfit(createMockWeather());

  it('포멀 상황에 맞게 조정한다', () => {
    const adjusted = adjustForOccasion(baseRecommendation, 'formal');

    expect(adjusted.layers.some((l) => l.name.includes('셔츠') || l.name.includes('블레이저'))).toBe(true);
    expect(adjusted.tips.some((t) => t.includes('포멀') || t.includes('액세서리'))).toBe(true);
  });

  it('운동 상황에 맞게 조정한다', () => {
    const adjusted = adjustForOccasion(baseRecommendation, 'workout');

    expect(adjusted.layers.some((l) => l.name.includes('기능성') || l.name.includes('운동'))).toBe(true);
    expect(adjusted.materials.some((m) => m.includes('폴리에스터') || m.includes('드라이핏'))).toBe(true);
  });

  it('데이트 상황에 맞게 조정한다', () => {
    const adjusted = adjustForOccasion(baseRecommendation, 'date');

    expect(adjusted.tips.some((t) => t.includes('깔끔') || t.includes('향수'))).toBe(true);
  });

  it('캐주얼 상황은 기본 추천을 유지한다', () => {
    const adjusted = adjustForOccasion(baseRecommendation, 'casual');

    expect(adjusted.layers).toEqual(baseRecommendation.layers);
  });
});
