/**
 * S-2 존별 제품 타겟팅 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateZoneProductRecommendations,
  getZoneApplicationTip,
} from '@/lib/analysis/skin-v2/zone-product-targeting';
import type { DetailedZoneId } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';

// =============================================================================
// 헬퍼
// =============================================================================

/** 건강한 메트릭 (관심사 없음) */
function healthyMetrics(): ZoneMetricsV2 {
  return {
    hydration: 75,
    oiliness: 35,
    pores: 80,
    texture: 80,
    pigmentation: 85,
    sensitivity: 20,
    elasticity: 80,
  };
}

/** 건조한 메트릭 */
function dryMetrics(): ZoneMetricsV2 {
  return {
    hydration: 25,
    oiliness: 20,
    pores: 75,
    texture: 70,
    pigmentation: 80,
    sensitivity: 30,
    elasticity: 65,
  };
}

/** 지성 메트릭 */
function oilyMetrics(): ZoneMetricsV2 {
  return {
    hydration: 60,
    oiliness: 85,
    pores: 35,
    texture: 55,
    pigmentation: 70,
    sensitivity: 25,
    elasticity: 70,
  };
}

/** 민감성 메트릭 */
function sensitiveMetrics(): ZoneMetricsV2 {
  return {
    hydration: 45,
    oiliness: 30,
    pores: 65,
    texture: 55,
    pigmentation: 60,
    sensitivity: 75,
    elasticity: 55,
  };
}

/** 전체 존 심각한 메트릭 */
function severeMetrics(): ZoneMetricsV2 {
  return {
    hydration: 15,
    oiliness: 90,
    pores: 20,
    texture: 20,
    pigmentation: 30,
    sensitivity: 80,
    elasticity: 25,
  };
}

/** 모든 12존에 동일 메트릭 적용 */
function makeAllZones(
  metrics: ZoneMetricsV2,
  score: number
): { scores: Record<DetailedZoneId, number>; metrics: Record<DetailedZoneId, ZoneMetricsV2> } {
  const zoneIds: DetailedZoneId[] = [
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

  const scores: Record<string, number> = {};
  const metricsMap: Record<string, ZoneMetricsV2> = {};

  for (const id of zoneIds) {
    scores[id] = score;
    metricsMap[id] = { ...metrics };
  }

  return {
    scores: scores as Record<DetailedZoneId, number>,
    metrics: metricsMap as Record<DetailedZoneId, ZoneMetricsV2>,
  };
}

// =============================================================================
// generateZoneProductRecommendations 테스트
// =============================================================================

describe('generateZoneProductRecommendations', () => {
  it('건강한 존은 추천을 생성하지 않는다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    const result = generateZoneProductRecommendations(scores, metrics);
    expect(result).toHaveLength(0);
  });

  it('건조한 존에 보습 제품을 추천한다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    // 왼쪽 볼만 건조하게 설정
    scores.cheek_left = 35;
    metrics.cheek_left = dryMetrics();

    const result = generateZoneProductRecommendations(scores, metrics);
    expect(result.length).toBeGreaterThanOrEqual(1);

    const cheekRec = result.find((r) => r.zoneId === 'cheek_left');
    expect(cheekRec).toBeDefined();
    expect(cheekRec!.concerns).toContain('건조함');
    expect(
      cheekRec!.products.some((p) => p.category.includes('세럼') || p.category.includes('크림'))
    ).toBe(true);
  });

  it('지성 존에 유분 조절 제품을 추천한다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.nose_tip = 40;
    metrics.nose_tip = oilyMetrics();

    const result = generateZoneProductRecommendations(scores, metrics);
    const noseRec = result.find((r) => r.zoneId === 'nose_tip');
    expect(noseRec).toBeDefined();
    expect(noseRec!.concerns).toContain('과다 유분');
  });

  it('민감한 존에 진정 제품을 추천한다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.cheek_right = 45;
    metrics.cheek_right = sensitiveMetrics();

    const result = generateZoneProductRecommendations(scores, metrics);
    const rec = result.find((r) => r.zoneId === 'cheek_right');
    expect(rec).toBeDefined();
    expect(
      rec!.products.some((p) => p.category.includes('진정') || p.category.includes('시카'))
    ).toBe(true);
  });

  it('존당 최대 3개 제품만 추천한다', () => {
    const { scores, metrics } = makeAllZones(severeMetrics(), 20);
    const result = generateZoneProductRecommendations(scores, metrics);

    for (const rec of result) {
      expect(rec.products.length).toBeLessThanOrEqual(3);
    }
  });

  it('high 우선순위가 먼저 정렬된다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);

    // high 우선순위 존
    scores.forehead_center = 25;
    metrics.forehead_center = severeMetrics();
    // low 우선순위 존
    scores.chin_center = 60;
    metrics.chin_center = { ...healthyMetrics(), hydration: 30 };

    const result = generateZoneProductRecommendations(scores, metrics);
    expect(result.length).toBeGreaterThanOrEqual(2);

    const highIdx = result.findIndex((r) => r.zoneId === 'forehead_center');
    const lowIdx = result.findIndex((r) => r.zoneId === 'chin_center');

    // chin_center가 결과에 있으면 forehead_center가 먼저
    if (highIdx !== -1 && lowIdx !== -1) {
      expect(highIdx).toBeLessThan(lowIdx);
    }
  });

  it('점수 < 40이면 high 우선순위다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.eye_left = 30;
    metrics.eye_left = dryMetrics();

    const result = generateZoneProductRecommendations(scores, metrics);
    const rec = result.find((r) => r.zoneId === 'eye_left');
    expect(rec?.priority).toBe('high');
  });

  it('점수 40-64이면 medium 우선순위다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.cheek_left = 55;
    metrics.cheek_left = { ...healthyMetrics(), hydration: 30 };

    const result = generateZoneProductRecommendations(scores, metrics);
    const rec = result.find((r) => r.zoneId === 'cheek_left');
    expect(rec?.priority).toBe('medium');
  });

  it('점수 65+이면 low 우선순위다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.chin_center = 70;
    metrics.chin_center = { ...healthyMetrics(), hydration: 30 };

    const result = generateZoneProductRecommendations(scores, metrics);
    const rec = result.find((r) => r.zoneId === 'chin_center');
    if (rec) {
      expect(rec.priority).toBe('low');
    }
  });

  it('눈가 존 특화 관심사(눈가 잔주름)에 아이크림을 추천한다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.eye_right = 40;
    metrics.eye_right = { ...healthyMetrics(), elasticity: 35 };

    const result = generateZoneProductRecommendations(scores, metrics);
    const rec = result.find((r) => r.zoneId === 'eye_right');
    expect(rec).toBeDefined();
    expect(rec!.concerns).toContain('눈가 잔주름');
    expect(rec!.products.some((p) => p.category === '아이크림')).toBe(true);
  });

  it('코끝 존 특화 관심사(블랙헤드)에 블랙헤드 패치를 추천한다', () => {
    const { scores, metrics } = makeAllZones(healthyMetrics(), 85);
    scores.nose_tip = 45;
    metrics.nose_tip = { ...healthyMetrics(), oiliness: 75 };

    const result = generateZoneProductRecommendations(scores, metrics);
    const rec = result.find((r) => r.zoneId === 'nose_tip');
    expect(rec).toBeDefined();
    expect(rec!.concerns).toContain('블랙헤드 위험');
    expect(rec!.products.some((p) => p.category === '블랙헤드 패치')).toBe(true);
  });

  it('label이 올바른 한국어 존 이름이다', () => {
    const { scores, metrics } = makeAllZones(dryMetrics(), 30);
    const result = generateZoneProductRecommendations(scores, metrics);

    const foreheadRec = result.find((r) => r.zoneId === 'forehead_center');
    expect(foreheadRec?.label).toBe('이마 중앙');

    const eyeRec = result.find((r) => r.zoneId === 'eye_left');
    expect(eyeRec?.label).toBe('왼쪽 눈가');
  });

  it('빈 메트릭 Record를 전달하면 빈 배열을 반환한다', () => {
    const result = generateZoneProductRecommendations(
      {} as Record<DetailedZoneId, number>,
      {} as Record<DetailedZoneId, ZoneMetricsV2>
    );
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// getZoneApplicationTip 테스트
// =============================================================================

describe('getZoneApplicationTip', () => {
  it('눈가 존은 부드러운 도포 팁을 반환한다', () => {
    const tip = getZoneApplicationTip('eye_left', '건조함');
    expect(tip).toContain('약지');
    expect(tip).toContain('두드리듯');
  });

  it('이마 존 + 유분 관심사는 T존 팁을 반환한다', () => {
    const tip = getZoneApplicationTip('forehead_center', '과다 유분');
    expect(tip).toContain('T존');
  });

  it('코 존 + 모공 관심사는 도포 팁을 반환한다', () => {
    const tip = getZoneApplicationTip('nose_tip', '모공 확대');
    expect(tip).toBeDefined();
    expect(tip).toContain('코');
  });

  it('볼 존 + 건조 관심사는 도포 방향 팁을 반환한다', () => {
    const tip = getZoneApplicationTip('cheek_left', '건조함');
    expect(tip).toContain('안쪽에서 바깥쪽');
  });

  it('턱 존 + 여드름 관심사는 스팟 케어 팁을 반환한다', () => {
    const tip = getZoneApplicationTip('chin_left', '턱 여드름 위험');
    expect(tip).toContain('스팟');
  });

  it('매칭되지 않는 조합은 undefined를 반환한다', () => {
    const tip = getZoneApplicationTip('chin_center', '색소침착');
    expect(tip).toBeUndefined();
  });
});
