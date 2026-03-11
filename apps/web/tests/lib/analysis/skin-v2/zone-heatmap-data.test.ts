/**
 * S-2 12존 히트맵 데이터 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';
import {
  scoreToColor,
  scoreToOpacity,
  getScoreStatus,
  getZonePosition,
  prepareHeatmapData,
} from '@/lib/analysis/skin-v2/zone-heatmap-data';

// =============================================================================
// 테스트 데이터
// =============================================================================

const ALL_ZONE_IDS: DetailedZoneId[] = [
  'forehead_center',
  'forehead_left',
  'forehead_right',
  'eye_left',
  'eye_right',
  'nose_bridge',
  'nose_tip',
  'cheek_left',
  'cheek_right',
  'chin_center',
  'chin_left',
  'chin_right',
];

/** 기본 메트릭 (양호 상태) */
function makeMockMetrics(overrides: Partial<ZoneMetricsV2> = {}): ZoneMetricsV2 {
  return {
    hydration: 65,
    oiliness: 40,
    pores: 70,
    texture: 68,
    pigmentation: 72,
    sensitivity: 25,
    elasticity: 70,
    ...overrides,
  };
}

/** 12존 점수 생성 (기본값 75) */
function makeMockScores(defaultScore = 75): Record<DetailedZoneId, number> {
  const scores: Partial<Record<DetailedZoneId, number>> = {};
  for (const id of ALL_ZONE_IDS) {
    scores[id] = defaultScore;
  }
  return scores as Record<DetailedZoneId, number>;
}

/** 12존 메트릭 생성 */
function makeMockAllMetrics(
  overrides: Partial<ZoneMetricsV2> = {}
): Record<DetailedZoneId, ZoneMetricsV2> {
  const result: Partial<Record<DetailedZoneId, ZoneMetricsV2>> = {};
  for (const id of ALL_ZONE_IDS) {
    result[id] = makeMockMetrics(overrides);
  }
  return result as Record<DetailedZoneId, ZoneMetricsV2>;
}

// =============================================================================
// scoreToColor
// =============================================================================

describe('scoreToColor', () => {
  it('0-30 구간은 빨강(#EF4444)을 반환한다', () => {
    expect(scoreToColor(0)).toBe('#EF4444');
    expect(scoreToColor(15)).toBe('#EF4444');
    expect(scoreToColor(30)).toBe('#EF4444');
  });

  it('31-50 구간은 주황(#F97316)을 반환한다', () => {
    expect(scoreToColor(31)).toBe('#F97316');
    expect(scoreToColor(50)).toBe('#F97316');
  });

  it('51-65 구간은 노랑(#EAB308)을 반환한다', () => {
    expect(scoreToColor(51)).toBe('#EAB308');
    expect(scoreToColor(65)).toBe('#EAB308');
  });

  it('66-80 구간은 초록(#22C55E)을 반환한다', () => {
    expect(scoreToColor(66)).toBe('#22C55E');
    expect(scoreToColor(80)).toBe('#22C55E');
  });

  it('81-100 구간은 에메랄드(#10B981)를 반환한다', () => {
    expect(scoreToColor(81)).toBe('#10B981');
    expect(scoreToColor(100)).toBe('#10B981');
  });

  it('범위 밖 값은 클램핑된다', () => {
    expect(scoreToColor(-10)).toBe('#EF4444');
    expect(scoreToColor(150)).toBe('#10B981');
  });
});

// =============================================================================
// scoreToOpacity
// =============================================================================

describe('scoreToOpacity', () => {
  it('점수 0은 최대 불투명도(1.0)를 반환한다', () => {
    expect(scoreToOpacity(0)).toBe(1.0);
  });

  it('점수 100은 최소 불투명도(0.3)를 반환한다', () => {
    expect(scoreToOpacity(100)).toBe(0.3);
  });

  it('점수 50은 중간값을 반환한다', () => {
    const opacity = scoreToOpacity(50);
    expect(opacity).toBe(0.65);
  });

  it('결과는 0.3-1.0 범위 내에 있다', () => {
    for (let s = 0; s <= 100; s += 10) {
      const op = scoreToOpacity(s);
      expect(op).toBeGreaterThanOrEqual(0.3);
      expect(op).toBeLessThanOrEqual(1.0);
    }
  });

  it('범위 밖 값은 클램핑된다', () => {
    expect(scoreToOpacity(-50)).toBe(1.0);
    expect(scoreToOpacity(200)).toBe(0.3);
  });
});

// =============================================================================
// getScoreStatus
// =============================================================================

describe('getScoreStatus', () => {
  it.each([
    [0, 'critical'],
    [30, 'critical'],
    [31, 'poor'],
    [50, 'poor'],
    [51, 'fair'],
    [65, 'fair'],
    [66, 'good'],
    [80, 'good'],
    [81, 'excellent'],
    [100, 'excellent'],
  ] as const)('점수 %i → %s', (score, expected) => {
    expect(getScoreStatus(score)).toBe(expected);
  });
});

// =============================================================================
// getZonePosition
// =============================================================================

describe('getZonePosition', () => {
  it('12존 모두 좌표를 반환한다', () => {
    for (const id of ALL_ZONE_IDS) {
      const pos = getZonePosition(id);
      expect(pos).toHaveProperty('cx');
      expect(pos).toHaveProperty('cy');
      expect(pos).toHaveProperty('rx');
      expect(pos).toHaveProperty('ry');
    }
  });

  it('모든 좌표가 0-100 viewBox 범위 내에 있다', () => {
    for (const id of ALL_ZONE_IDS) {
      const pos = getZonePosition(id);
      expect(pos.cx).toBeGreaterThanOrEqual(0);
      expect(pos.cx).toBeLessThanOrEqual(100);
      expect(pos.cy).toBeGreaterThanOrEqual(0);
      expect(pos.cy).toBeLessThanOrEqual(100);
      expect(pos.rx).toBeGreaterThan(0);
      expect(pos.ry).toBeGreaterThan(0);
    }
  });

  it('좌우 대칭 존의 cx가 대칭 배치된다', () => {
    // forehead_left/right
    const fl = getZonePosition('forehead_left');
    const fr = getZonePosition('forehead_right');
    expect(fl.cx + fr.cx).toBe(100);

    // eye_left/right
    const el = getZonePosition('eye_left');
    const er = getZonePosition('eye_right');
    expect(el.cx + er.cx).toBe(100);

    // cheek_left/right
    const cl = getZonePosition('cheek_left');
    const cr = getZonePosition('cheek_right');
    expect(cl.cx + cr.cx).toBe(100);

    // chin_left/right
    const chl = getZonePosition('chin_left');
    const chr = getZonePosition('chin_right');
    expect(chl.cx + chr.cx).toBe(100);
  });

  it('중앙 존(forehead_center, nose_bridge, nose_tip, chin_center)의 cx가 50이다', () => {
    expect(getZonePosition('forehead_center').cx).toBe(50);
    expect(getZonePosition('nose_bridge').cx).toBe(50);
    expect(getZonePosition('nose_tip').cx).toBe(50);
    expect(getZonePosition('chin_center').cx).toBe(50);
  });
});

// =============================================================================
// prepareHeatmapData
// =============================================================================

describe('prepareHeatmapData', () => {
  it('12존 데이터를 모두 반환한다', () => {
    const scores = makeMockScores(70);
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    expect(result.zones).toHaveLength(12);
  });

  it('각 존에 필수 필드가 포함된다', () => {
    const scores = makeMockScores(60);
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    for (const zone of result.zones) {
      expect(zone.zoneId).toBeTruthy();
      expect(zone.label).toBeTruthy();
      expect(typeof zone.score).toBe('number');
      expect(zone.colorHex).toMatch(/^#[A-F0-9]{6}$/);
      expect(zone.opacity).toBeGreaterThanOrEqual(0.3);
      expect(zone.opacity).toBeLessThanOrEqual(1.0);
      expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(zone.status);
      expect(Array.isArray(zone.topConcerns)).toBe(true);
      expect(zone.topConcerns.length).toBeLessThanOrEqual(2);
    }
  });

  it('한국어 라벨이 DETAILED_ZONE_LABELS와 일치한다', () => {
    const scores = makeMockScores(80);
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    for (const zone of result.zones) {
      expect(zone.label).toBe(DETAILED_ZONE_LABELS[zone.zoneId]);
    }
  });

  it('worstZone은 가장 낮은 점수를 가진다', () => {
    const scores = makeMockScores(70);
    scores.nose_tip = 20; // 최악 존 설정
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    expect(result.worstZone.zoneId).toBe('nose_tip');
    expect(result.worstZone.score).toBe(20);
  });

  it('bestZone은 가장 높은 점수를 가진다', () => {
    const scores = makeMockScores(70);
    scores.cheek_left = 95; // 최고 존 설정
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    expect(result.bestZone.zoneId).toBe('cheek_left');
    expect(result.bestZone.score).toBe(95);
  });

  it('averageScore가 올바르게 계산된다', () => {
    const scores = makeMockScores(60);
    scores.forehead_center = 80;
    scores.nose_tip = 40;
    // 나머지 10존 = 60, 합계 = 10*60 + 80 + 40 = 720
    // 평균 = 720 / 12 = 60
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    expect(result.averageScore).toBe(60);
  });

  it('colorScale에 min/max 색상이 포함된다', () => {
    const scores = makeMockScores(50);
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    expect(result.colorScale.min).toBe('#EF4444');
    expect(result.colorScale.max).toBe('#10B981');
  });

  it('메트릭 기반 topConcerns가 생성된다', () => {
    const scores = makeMockScores(40);
    // 건조함 + 과다 유분 조건 설정
    const metrics = makeMockAllMetrics({
      hydration: 30, // < 40 → 건조함
      oiliness: 80, // > 70 → 과다 유분
      pores: 40, // < 50 → 모공 확대
    });
    const result = prepareHeatmapData(scores, metrics);

    // 관심사가 있어야 하며 최대 2개
    for (const zone of result.zones) {
      expect(zone.topConcerns.length).toBeGreaterThan(0);
      expect(zone.topConcerns.length).toBeLessThanOrEqual(2);
    }
  });

  it('모든 점수가 동일할 때 worstZone과 bestZone의 점수가 같다', () => {
    const scores = makeMockScores(50);
    const metrics = makeMockAllMetrics();
    const result = prepareHeatmapData(scores, metrics);

    expect(result.worstZone.score).toBe(50);
    expect(result.bestZone.score).toBe(50);
  });
});
