/**
 * 계절별 헤어케어 추천 시스템 테스트
 *
 * @module tests/lib/analysis/hair/seasonal-recommender
 */

import { describe, it, expect } from 'vitest';
import {
  getCurrentSeason,
  getSeasonalRecommendation,
  getYearlyCarePlan,
} from '@/lib/analysis/hair/seasonal-recommender';
import type { Season } from '@/lib/analysis/hair/seasonal-recommender';

// =============================================================================
// getCurrentSeason
// =============================================================================

describe('getCurrentSeason', () => {
  it('3-5월은 봄이다', () => {
    expect(getCurrentSeason(new Date('2026-03-15'))).toBe('spring');
    expect(getCurrentSeason(new Date('2026-04-01'))).toBe('spring');
    expect(getCurrentSeason(new Date('2026-05-31'))).toBe('spring');
  });

  it('6-8월은 여름이다', () => {
    expect(getCurrentSeason(new Date('2026-06-01'))).toBe('summer');
    expect(getCurrentSeason(new Date('2026-07-15'))).toBe('summer');
    expect(getCurrentSeason(new Date('2026-08-31'))).toBe('summer');
  });

  it('9-11월은 가을이다', () => {
    expect(getCurrentSeason(new Date('2026-09-01'))).toBe('autumn');
    expect(getCurrentSeason(new Date('2026-11-30'))).toBe('autumn');
  });

  it('12-2월은 겨울이다', () => {
    expect(getCurrentSeason(new Date('2026-12-01'))).toBe('winter');
    expect(getCurrentSeason(new Date('2026-01-15'))).toBe('winter');
    expect(getCurrentSeason(new Date('2026-02-28'))).toBe('winter');
  });
});

// =============================================================================
// getSeasonalRecommendation
// =============================================================================

describe('getSeasonalRecommendation', () => {
  it('계절별 추천을 반환한다', () => {
    const rec = getSeasonalRecommendation('2b', { season: 'summer' });

    expect(rec.season).toBe('summer');
    expect(rec.seasonLabel).toBe('여름');
    expect(rec.hazards.length).toBeGreaterThan(0);
    expect(rec.hazardLabels.length).toBe(rec.hazards.length);
    expect(rec.generalTips.length).toBeGreaterThan(0);
    expect(rec.productCategories.length).toBeGreaterThan(0);
  });

  it('여름에는 UV 관련 hazard를 포함한다', () => {
    const rec = getSeasonalRecommendation('1a', { season: 'summer' });
    expect(rec.hazards).toContain('uv-damage');
    expect(rec.hazards).toContain('humidity-frizz');
  });

  it('겨울에는 건조/정전기 hazard를 포함한다', () => {
    const rec = getSeasonalRecommendation('1a', { season: 'winter' });
    expect(rec.hazards).toContain('cold-dry');
    expect(rec.hazards).toContain('static');
  });

  it('텍스처 그룹 1(직모)은 여름에 볼륨 팁을 포함한다', () => {
    const rec = getSeasonalRecommendation('1b', { season: 'summer' });
    expect(rec.textureTips.some((t) => t.includes('볼륨'))).toBe(true);
  });

  it('텍스처 그룹 3(곱슬)은 겨울에 LOC 메서드를 추천한다', () => {
    const rec = getSeasonalRecommendation('3b', { season: 'winter' });
    expect(rec.textureTips.some((t) => t.includes('LOC'))).toBe(true);
  });

  it('텍스처 그룹 4(코일리)는 겨울에 프리푸 트리트먼트를 추천한다', () => {
    const rec = getSeasonalRecommendation('4a', { season: 'winter' });
    expect(rec.textureTips.some((t) => t.includes('프리푸'))).toBe(true);
  });

  it('높은 습도(>70)에서 안티-프리즈 팁을 추가한다', () => {
    const rec = getSeasonalRecommendation('2b', { season: 'summer', humidity: 80 });
    expect(rec.generalTips.some((t) => t.includes('안티-프리즈'))).toBe(true);
  });

  it('낮은 습도(<30)에서 보습 강화 팁을 추가한다', () => {
    const rec = getSeasonalRecommendation('2b', { season: 'winter', humidity: 20 });
    expect(rec.generalTips.some((t) => t.includes('보습 강화'))).toBe(true);
  });

  it('UV 지수 6 이상이면 모자 착용 팁을 추가한다', () => {
    const rec = getSeasonalRecommendation('1a', { season: 'summer', uvIndex: 8 });
    expect(rec.generalTips.some((t) => t.includes('모자'))).toBe(true);
  });

  it('여름에 곱슬/코일리(그룹 3+)는 수영장 염소 경고를 포함한다', () => {
    const rec = getSeasonalRecommendation('3c', { season: 'summer' });
    expect(rec.warnings.some((w) => w.includes('염소'))).toBe(true);
  });

  it('겨울에 곱슬/코일리(그룹 3+)는 빗질 경고를 포함한다', () => {
    const rec = getSeasonalRecommendation('4b', { season: 'winter' });
    expect(rec.warnings.some((w) => w.includes('빗질') || w.includes('디탱글링'))).toBe(true);
  });

  it('여름에 직모(그룹 1)는 볼륨 파우더를 추천한다', () => {
    const rec = getSeasonalRecommendation('1a', { season: 'summer' });
    expect(rec.productCategories).toContain('볼륨 파우더');
  });

  it('겨울에 코일리(그룹 4)는 시어버터 크림을 추천한다', () => {
    const rec = getSeasonalRecommendation('4c', { season: 'winter' });
    expect(rec.productCategories).toContain('시어버터 크림');
  });

  it('context 없이 호출하면 현재 계절 기준으로 반환한다', () => {
    const rec = getSeasonalRecommendation('2a');
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    expect(seasons).toContain(rec.season);
  });
});

// =============================================================================
// getYearlyCarePlan
// =============================================================================

describe('getYearlyCarePlan', () => {
  it('4계절 추천을 반환한다', () => {
    const plan = getYearlyCarePlan('2b');
    expect(plan).toHaveLength(4);
    expect(plan[0].season).toBe('spring');
    expect(plan[1].season).toBe('summer');
    expect(plan[2].season).toBe('autumn');
    expect(plan[3].season).toBe('winter');
  });

  it('각 계절 추천이 유효한 구조를 가진다', () => {
    const plan = getYearlyCarePlan('3a');
    plan.forEach((rec) => {
      expect(rec.seasonLabel).toBeTruthy();
      expect(rec.hazards.length).toBeGreaterThan(0);
      expect(rec.generalTips.length).toBeGreaterThan(0);
      expect(rec.productCategories.length).toBeGreaterThan(0);
    });
  });

  it('각 텍스처 코드에 대해 연간 플랜을 생성할 수 있다', () => {
    const codes = ['1a', '2c', '3b', '4c'] as const;
    codes.forEach((code) => {
      const plan = getYearlyCarePlan(code);
      expect(plan).toHaveLength(4);
    });
  });
});
