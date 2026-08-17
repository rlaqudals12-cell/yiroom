import { describe, it, expect } from 'vitest';
import { generateEnvironmentAdvice } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';

// 기본 날씨 데이터 팩토리
function createWeather(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temp: 22,
    precipitationMm: 0,
    condition: '맑음',
    uvIndex: 3,
    humidity: 50,
    locationSource: 'default' as const,
    ...overrides,
  };
}

describe('generateEnvironmentAdvice', () => {
  describe('UV 지수 기반 조언', () => {
    it('UV 8 이상이면 SPF50+ 필수 + 비타민C 추천', () => {
      const advice = generateEnvironmentAdvice(createWeather({ uvIndex: 9 }));
      expect(advice.skin.some((s) => s.includes('SPF50+'))).toBe(true);
      expect(advice.nutrition.some((n) => n.includes('비타민C'))).toBe(true);
      expect(advice.fashion.some((f) => f.includes('모자'))).toBe(true);
    });

    it('UV 5-7이면 SPF50 권장', () => {
      const advice = generateEnvironmentAdvice(createWeather({ uvIndex: 6 }));
      expect(advice.skin.some((s) => s.includes('SPF50'))).toBe(true);
    });

    it('UV 3-4이면 SPF30 권장', () => {
      const advice = generateEnvironmentAdvice(createWeather({ uvIndex: 3.5 }));
      expect(advice.skin.some((s) => s.includes('SPF30'))).toBe(true);
    });

    it('UV 2 이하이면 UV 관련 조언 없음', () => {
      const advice = generateEnvironmentAdvice(createWeather({ uvIndex: 1 }));
      expect(advice.skin.every((s) => !s.includes('SPF'))).toBe(true);
    });
  });

  describe('습도 기반 조언', () => {
    it('습도 30% 미만이면 보습 강화 + 수분 섭취', () => {
      const advice = generateEnvironmentAdvice(createWeather({ humidity: 20 }));
      expect(advice.skin.some((s) => s.includes('수분 크림'))).toBe(true);
      expect(advice.nutrition.some((n) => n.includes('수분 섭취'))).toBe(true);
    });

    it('습도 80% 초과이면 유분 조절', () => {
      const advice = generateEnvironmentAdvice(createWeather({ humidity: 85 }));
      expect(advice.skin.some((s) => s.includes('유분 조절'))).toBe(true);
    });

    it('습도 50-80%이면 습도 관련 특별 조언 없음', () => {
      const advice = generateEnvironmentAdvice(createWeather({ humidity: 60 }));
      expect(advice.skin.every((s) => !s.includes('습도'))).toBe(true);
    });
  });

  describe('기온 기반 조언', () => {
    it('영하이면 보온 + 워밍업 + 장벽 보호', () => {
      const advice = generateEnvironmentAdvice(createWeather({ temp: -5 }));
      expect(advice.fashion.some((f) => f.includes('보온'))).toBe(true);
      expect(advice.exercise.some((e) => e.includes('워밍업'))).toBe(true);
      expect(advice.skin.some((s) => s.includes('장벽'))).toBe(true);
    });

    it('30도 이상이면 통풍 + 탈수 주의 + 세안', () => {
      const advice = generateEnvironmentAdvice(createWeather({ temp: 33 }));
      expect(advice.fashion.some((f) => f.includes('린넨') || f.includes('면'))).toBe(true);
      expect(advice.exercise.some((e) => e.includes('탈수') || e.includes('수분'))).toBe(true);
      expect(advice.skin.some((s) => s.includes('세안'))).toBe(true);
    });
  });

  // 단위 계약: precipitationMm은 "직전 1시간 강수량(mm)" — 과거의 mm×100 "%" 사칭 회귀 방지
  describe('강수 기반 조언 (mm 단위)', () => {
    it('강수 0.1mm 이상이면 우산 + 실내 운동', () => {
      const advice = generateEnvironmentAdvice(createWeather({ precipitationMm: 0.4 }));
      expect(advice.fashion.some((f) => f.includes('우산'))).toBe(true);
      expect(advice.exercise.some((e) => e.includes('실내'))).toBe(true);
    });

    it('강수 0.1mm 미만(관측 노이즈)이면 비 조언을 하지 않는다', () => {
      const advice = generateEnvironmentAdvice(createWeather({ precipitationMm: 0.05 }));
      expect(advice.fashion.every((f) => !f.includes('우산'))).toBe(true);
      expect(advice.exercise.every((e) => !e.includes('실내'))).toBe(true);
    });

    it('강한 비(2.5mm 이상)면 방수 아우터까지 권한다', () => {
      const advice = generateEnvironmentAdvice(createWeather({ precipitationMm: 4 }));
      expect(advice.fashion[0]).toContain('방수');
    });

    it('관측 시제로 말한다 — "예보" 단언을 쓰지 않는다', () => {
      const advice = generateEnvironmentAdvice(createWeather({ precipitationMm: 1 }));
      expect(advice.fashion[0]).toContain('지금');
      expect(advice.fashion.every((f) => !f.includes('예보'))).toBe(true);
    });

    it('눈일 때는 비가 아니라 눈으로 말한다', () => {
      const advice = generateEnvironmentAdvice(
        createWeather({ precipitationMm: 1, condition: '눈' })
      );
      expect(advice.fashion[0]).toContain('눈');
      expect(advice.fashion[0]).not.toContain('비가');
    });
  });

  // 소비처(홈 브리핑·모바일 브리핑)는 fashion[0] 한 줄만 노출 — 우선순위가 곧 노출 결정
  describe('패션 조언 우선순위 (강수 > 기온 > UV)', () => {
    it('추운 날 비가 오면 한파 조언보다 강수 조언이 먼저다', () => {
      const advice = generateEnvironmentAdvice(createWeather({ temp: -5, precipitationMm: 1 }));
      expect(advice.fashion[0]).toContain('우산');
      expect(advice.fashion.some((f) => f.includes('보온'))).toBe(true);
    });

    it('폭염 + 강한 UV + 비면 강수 > 기온 > UV 순서로 정렬된다', () => {
      const advice = generateEnvironmentAdvice(
        createWeather({ temp: 33, uvIndex: 9, precipitationMm: 1 })
      );
      expect(advice.fashion[0]).toContain('우산');
      expect(advice.fashion[1]).toContain('무더위');
      expect(advice.fashion[2]).toContain('모자');
    });

    it('비가 없으면 기온 조언이 UV 조언보다 먼저다', () => {
      const advice = generateEnvironmentAdvice(createWeather({ temp: 33, uvIndex: 9 }));
      expect(advice.fashion[0]).toContain('무더위');
      expect(advice.fashion[1]).toContain('모자');
    });
  });

  describe('기본 조언', () => {
    it('특이사항 없으면 기본 조언 표시', () => {
      const advice = generateEnvironmentAdvice(
        createWeather({ uvIndex: 1, humidity: 55, temp: 22 })
      );
      expect(advice.skin.length).toBeGreaterThan(0);
      expect(advice.fashion.length).toBeGreaterThan(0);
    });
  });

  describe('복합 조건', () => {
    it('고온+고UV+저습 = 모든 카테고리 조언', () => {
      const advice = generateEnvironmentAdvice(
        createWeather({ temp: 35, uvIndex: 10, humidity: 20 })
      );
      expect(advice.skin.length).toBeGreaterThanOrEqual(3);
      expect(advice.nutrition.length).toBeGreaterThanOrEqual(2);
      expect(advice.fashion.length).toBeGreaterThanOrEqual(1);
      expect(advice.exercise.length).toBeGreaterThanOrEqual(1);
    });
  });
});
