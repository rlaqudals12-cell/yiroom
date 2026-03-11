/**
 * S-2 12존 스코어러 테스트
 */

import { describe, it, expect } from 'vitest';
import { scoreDetailedZone, analyzeTwelveZones } from '@/lib/analysis/skin-v2/twelve-zone-scorer';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';
import type { DetailedZoneId } from '@/types/skin-zones';

// 헬퍼: 기본 메트릭 생성
function makeMetrics(overrides: Partial<ZoneMetricsV2> = {}): ZoneMetricsV2 {
  return {
    hydration: 70,
    oiliness: 50,
    pores: 70,
    texture: 70,
    pigmentation: 70,
    sensitivity: 30,
    elasticity: 70,
    ...overrides,
  };
}

// 12존 전체 메트릭 생성
function makeAllZoneMetrics(
  overrides: Partial<Record<DetailedZoneId, Partial<ZoneMetricsV2>>> = {}
): Record<DetailedZoneId, ZoneMetricsV2> {
  const zones: DetailedZoneId[] = [
    'forehead_center',
    'forehead_left',
    'forehead_right',
    'eye_left',
    'eye_right',
    'cheek_left',
    'cheek_right',
    'nose_bridge',
    'nose_tip',
    'chin_center',
    'chin_left',
    'chin_right',
  ];
  const result = {} as Record<DetailedZoneId, ZoneMetricsV2>;
  for (const z of zones) {
    result[z] = makeMetrics(overrides[z]);
  }
  return result;
}

describe('scoreDetailedZone', () => {
  it('균형 잡힌 메트릭은 높은 점수를 반환한다', () => {
    const score = scoreDetailedZone(makeMetrics());
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('유분 50이 최적값이다 (oiliness 점수 최대)', () => {
    const balanced = scoreDetailedZone(makeMetrics({ oiliness: 50 }));
    const high = scoreDetailedZone(makeMetrics({ oiliness: 90 }));
    const low = scoreDetailedZone(makeMetrics({ oiliness: 10 }));
    expect(balanced).toBeGreaterThan(high);
    expect(balanced).toBeGreaterThan(low);
  });

  it('민감도가 높으면 점수가 낮아진다', () => {
    const low = scoreDetailedZone(makeMetrics({ sensitivity: 10 }));
    const high = scoreDetailedZone(makeMetrics({ sensitivity: 90 }));
    expect(low).toBeGreaterThan(high);
  });

  it('모든 메트릭 0이면 0점에 가깝다', () => {
    const score = scoreDetailedZone({
      hydration: 0,
      oiliness: 0,
      pores: 0,
      texture: 0,
      pigmentation: 0,
      sensitivity: 100,
      elasticity: 0,
    });
    expect(score).toBeLessThanOrEqual(10);
  });

  it('0-100 범위를 벗어나지 않는다', () => {
    const score1 = scoreDetailedZone(makeMetrics({ hydration: 100, elasticity: 100 }));
    const score2 = scoreDetailedZone({
      hydration: 0,
      oiliness: 100,
      pores: 0,
      texture: 0,
      pigmentation: 0,
      sensitivity: 100,
      elasticity: 0,
    });
    expect(score1).toBeLessThanOrEqual(100);
    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score2).toBeGreaterThanOrEqual(0);
  });
});

describe('analyzeTwelveZones', () => {
  it('12존 전체 분석 결과를 반환한다', () => {
    const result = analyzeTwelveZones(makeAllZoneMetrics());
    expect(result.detailedZones).toBeDefined();
    expect(Object.keys(result.detailedZones)).toHaveLength(12);
    expect(result.vitalityScore).toBeGreaterThan(0);
    expect(result.worstZones).toHaveLength(3);
    expect(result.bestZones).toHaveLength(3);
  });

  it('6존 역호환 집계를 포함한다', () => {
    const result = analyzeTwelveZones(makeAllZoneMetrics());
    const sixZone = result.sixZoneAggregation;
    // 7개 SkinZoneType 중 실제 매핑되는 6개 (lipArea 제외)
    expect(Object.keys(sixZone).length).toBeGreaterThanOrEqual(5);
    for (const entry of Object.values(sixZone)) {
      expect(entry.score).toBeGreaterThanOrEqual(0);
      expect(entry.metrics).toBeDefined();
    }
  });

  it('나쁜 존이 worstZones에 포함된다', () => {
    const metrics = makeAllZoneMetrics({
      nose_tip: {
        hydration: 10,
        oiliness: 90,
        pores: 10,
        texture: 10,
        pigmentation: 10,
        sensitivity: 90,
        elasticity: 10,
      },
    });
    const result = analyzeTwelveZones(metrics);
    expect(result.worstZones).toContain('nose_tip');
  });

  it('좋은 존이 bestZones에 포함된다', () => {
    const metrics = makeAllZoneMetrics({
      cheek_left: {
        hydration: 95,
        oiliness: 50,
        pores: 95,
        texture: 95,
        pigmentation: 95,
        sensitivity: 5,
        elasticity: 95,
      },
    });
    const result = analyzeTwelveZones(metrics);
    expect(result.bestZones).toContain('cheek_left');
  });

  it('바이탈리티 점수가 0-100 범위이다', () => {
    const result = analyzeTwelveZones(makeAllZoneMetrics());
    expect(result.vitalityScore).toBeGreaterThanOrEqual(0);
    expect(result.vitalityScore).toBeLessThanOrEqual(100);
  });

  it('각 존에 status, concerns, recommendations가 존재한다', () => {
    const result = analyzeTwelveZones(makeAllZoneMetrics());
    for (const zone of Object.values(result.detailedZones)) {
      expect(zone.status).toBeDefined();
      expect(Array.isArray(zone.concerns)).toBe(true);
      expect(Array.isArray(zone.recommendations)).toBe(true);
    }
  });
});
