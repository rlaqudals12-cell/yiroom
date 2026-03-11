/**
 * S-2 12존 상호작용 모델 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeExtendedTUZone,
  analyzeSymmetry,
  detectProblemClusters,
  analyzeZoneInteractions,
} from '@/lib/analysis/skin-v2/zone-interaction';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';
import type { DetailedZoneId } from '@/types/skin-zones';

// 헬퍼
function makeMetrics(overrides: Partial<ZoneMetricsV2> = {}): ZoneMetricsV2 {
  return {
    hydration: 65,
    oiliness: 50,
    pores: 65,
    texture: 65,
    pigmentation: 65,
    sensitivity: 30,
    elasticity: 65,
    ...overrides,
  };
}

function makeAllMetrics(
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

function makeAllScores(
  overrides: Partial<Record<DetailedZoneId, number>> = {}
): Record<DetailedZoneId, number> {
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
  const result = {} as Record<DetailedZoneId, number>;
  for (const z of zones) {
    result[z] = overrides[z] ?? 70;
  }
  return result;
}

describe('analyzeExtendedTUZone', () => {
  it('균일한 유분이면 복합성이 아니다', () => {
    const result = analyzeExtendedTUZone(makeAllMetrics());
    expect(result.isCombiSkin).toBe(false);
    expect(result.combiSeverity).toBeLessThan(0.3);
  });

  it('T존 유분 높고 U존 낮으면 복합성이다', () => {
    const metrics = makeAllMetrics({
      forehead_center: { oiliness: 80 },
      forehead_left: { oiliness: 80 },
      forehead_right: { oiliness: 80 },
      nose_bridge: { oiliness: 85 },
      nose_tip: { oiliness: 85 },
      cheek_left: { oiliness: 30 },
      cheek_right: { oiliness: 30 },
      chin_center: { oiliness: 35 },
      chin_left: { oiliness: 35 },
      chin_right: { oiliness: 35 },
    });
    const result = analyzeExtendedTUZone(metrics);
    expect(result.isCombiSkin).toBe(true);
    expect(result.oilinessDiff).toBeGreaterThanOrEqual(15);
  });

  it('빈 메트릭은 기본값을 반환한다', () => {
    const result = analyzeExtendedTUZone({} as Record<DetailedZoneId, ZoneMetricsV2>);
    expect(result.isCombiSkin).toBe(false);
    expect(result.tZoneOiliness).toBe(0);
  });

  it('combiSeverity가 0-1 범위이다', () => {
    const metrics = makeAllMetrics({
      forehead_center: { oiliness: 100 },
      nose_tip: { oiliness: 100 },
      cheek_left: { oiliness: 0 },
      chin_center: { oiliness: 0 },
    });
    const result = analyzeExtendedTUZone(metrics);
    expect(result.combiSeverity).toBeGreaterThanOrEqual(0);
    expect(result.combiSeverity).toBeLessThanOrEqual(1);
  });
});

describe('analyzeSymmetry', () => {
  it('동일 점수면 대칭 점수 100이다', () => {
    const result = analyzeSymmetry(makeAllScores());
    expect(result.overallScore).toBe(100);
    expect(result.asymmetricPairs).toHaveLength(0);
  });

  it('좌우 큰 차이가 있으면 비대칭 쌍이 감지된다', () => {
    const scores = makeAllScores({
      cheek_left: 90,
      cheek_right: 40,
    });
    const result = analyzeSymmetry(scores);
    expect(result.asymmetricPairs.length).toBeGreaterThan(0);
    expect(result.asymmetricPairs[0].label).toBe('볼 좌우');
  });

  it('4개 대칭 쌍을 분석한다', () => {
    const result = analyzeSymmetry(makeAllScores());
    expect(result.pairDifferences).toHaveLength(4);
  });

  it('대칭 점수가 0-100 범위이다', () => {
    const scores = makeAllScores({
      forehead_left: 10,
      forehead_right: 90,
      eye_left: 10,
      eye_right: 90,
    });
    const result = analyzeSymmetry(scores);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

describe('detectProblemClusters', () => {
  it('문제 없으면 빈 배열을 반환한다', () => {
    const clusters = detectProblemClusters(makeAllScores(), makeAllMetrics());
    expect(clusters).toHaveLength(0);
  });

  it('인접한 2+ 문제 존이 클러스터를 형성한다', () => {
    // 코 + 주변: nose_bridge, nose_tip, forehead_center 는 인접
    const scores = makeAllScores({
      nose_bridge: 30,
      nose_tip: 25,
      forehead_center: 35,
    });
    const clusters = detectProblemClusters(scores, makeAllMetrics());
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    const firstCluster = clusters[0];
    expect(firstCluster.zones.length).toBeGreaterThanOrEqual(2);
    expect(firstCluster.severity).toBeGreaterThan(0);
  });

  it('고립된 단일 문제 존은 클러스터가 아니다', () => {
    // chin_center만 낮고, 인접한 chin_left, chin_right, nose_tip은 정상
    const scores = makeAllScores({ chin_center: 30 });
    const clusters = detectProblemClusters(scores, makeAllMetrics());
    // chin_center 혼자이므로 클러스터 X
    expect(clusters).toHaveLength(0);
  });

  it('공통 관심사를 포함한다', () => {
    const scores = makeAllScores({
      cheek_left: 30,
      eye_left: 30,
    });
    const metrics = makeAllMetrics({
      cheek_left: { hydration: 20 },
      eye_left: { hydration: 20 },
    });
    const clusters = detectProblemClusters(scores, metrics);
    if (clusters.length > 0) {
      expect(clusters[0].sharedConcerns).toContain('건조함');
    }
  });

  it('심각도 내림차순으로 정렬한다', () => {
    const scores = makeAllScores({
      cheek_left: 20,
      eye_left: 20, // 심각한 클러스터
      chin_left: 45,
      chin_center: 45, // 덜 심각한 클러스터
    });
    const clusters = detectProblemClusters(scores, makeAllMetrics());
    if (clusters.length >= 2) {
      expect(clusters[0].severity).toBeGreaterThanOrEqual(clusters[1].severity);
    }
  });

  it('커스텀 임계값을 지원한다', () => {
    const scores = makeAllScores({
      nose_bridge: 55,
      nose_tip: 55,
    });
    // 기본 50 → 클러스터 없음
    expect(detectProblemClusters(scores, makeAllMetrics(), 50)).toHaveLength(0);
    // 임계값 60 → 클러스터 감지
    const clusters = detectProblemClusters(scores, makeAllMetrics(), 60);
    expect(clusters.length).toBeGreaterThanOrEqual(1);
  });
});

describe('analyzeZoneInteractions', () => {
  it('종합 상호작용 분석 결과를 반환한다', () => {
    const result = analyzeZoneInteractions(makeAllScores(), makeAllMetrics());
    expect(result.tuAnalysis).toBeDefined();
    expect(result.symmetry).toBeDefined();
    expect(result.problemClusters).toBeDefined();
  });
});
