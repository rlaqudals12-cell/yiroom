/**
 * S-2 12존 상호작용 모델
 * T존-U존 확장 비율, 좌우 대칭, 인접 문제 클러스터 감지
 *
 * @description 12존 점수 간의 관계를 분석하여 피부 상태 패턴을 도출합니다.
 * @see docs/principles/skin-physiology.md
 * @see types/skin-zones.ts - DetailedZoneId
 */

import type { DetailedZoneId } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from './types';

// =============================================================================
// 타입
// =============================================================================

/** T존/U존 확장 분석 */
export interface ExtendedTUAnalysis {
  /** T존 평균 유분 */
  tZoneOiliness: number;
  /** U존 평균 유분 */
  uZoneOiliness: number;
  /** T-U 유분 차이 */
  oilinessDiff: number;
  /** T존 평균 수분 */
  tZoneHydration: number;
  /** U존 평균 수분 */
  uZoneHydration: number;
  /** T-U 수분 차이 */
  hydrationDiff: number;
  /** 복합성 피부 여부 */
  isCombiSkin: boolean;
  /** 복합성 심각도 (0=동일, 1=극단적) */
  combiSeverity: number;
}

/** 좌우 대칭 분석 */
export interface SymmetryAnalysis {
  /** 전체 대칭 점수 (0-100, 100=완전 대칭) */
  overallScore: number;
  /** 각 쌍별 차이 */
  pairDifferences: SymmetryPair[];
  /** 비대칭 쌍 (차이 > 15점) */
  asymmetricPairs: SymmetryPair[];
}

/** 대칭 쌍 비교 */
export interface SymmetryPair {
  leftZone: DetailedZoneId;
  rightZone: DetailedZoneId;
  leftScore: number;
  rightScore: number;
  difference: number;
  label: string;
}

/** 문제 클러스터 */
export interface ProblemCluster {
  /** 클러스터 중심 존 */
  centerZone: DetailedZoneId;
  /** 포함된 존 */
  zones: DetailedZoneId[];
  /** 공통 문제 */
  sharedConcerns: string[];
  /** 클러스터 심각도 (0-100) */
  severity: number;
}

/** 존 상호작용 종합 결과 */
export interface ZoneInteractionAnalysis {
  tuAnalysis: ExtendedTUAnalysis;
  symmetry: SymmetryAnalysis;
  problemClusters: ProblemCluster[];
}

// =============================================================================
// 존 그룹 정의
// =============================================================================

/** T존 세부 존 */
const T_ZONE_IDS: DetailedZoneId[] = [
  'forehead_center',
  'forehead_left',
  'forehead_right',
  'nose_bridge',
  'nose_tip',
];

/** U존 세부 존 */
const U_ZONE_IDS: DetailedZoneId[] = [
  'cheek_left',
  'cheek_right',
  'chin_center',
  'chin_left',
  'chin_right',
];

/** 좌우 대칭 쌍 */
const SYMMETRY_PAIRS: { left: DetailedZoneId; right: DetailedZoneId; label: string }[] = [
  { left: 'forehead_left', right: 'forehead_right', label: '이마 좌우' },
  { left: 'eye_left', right: 'eye_right', label: '눈가 좌우' },
  { left: 'cheek_left', right: 'cheek_right', label: '볼 좌우' },
  { left: 'chin_left', right: 'chin_right', label: '턱 좌우' },
];

/** 인접 존 그래프 (물리적으로 인접한 존) */
const ADJACENT_ZONES: Record<DetailedZoneId, DetailedZoneId[]> = {
  forehead_center: ['forehead_left', 'forehead_right', 'nose_bridge'],
  forehead_left: ['forehead_center', 'eye_left'],
  forehead_right: ['forehead_center', 'eye_right'],
  eye_left: ['forehead_left', 'cheek_left', 'nose_bridge'],
  eye_right: ['forehead_right', 'cheek_right', 'nose_bridge'],
  cheek_left: ['eye_left', 'nose_tip', 'chin_left'],
  cheek_right: ['eye_right', 'nose_tip', 'chin_right'],
  nose_bridge: ['forehead_center', 'eye_left', 'eye_right', 'nose_tip'],
  nose_tip: ['nose_bridge', 'cheek_left', 'cheek_right', 'chin_center'],
  chin_center: ['nose_tip', 'chin_left', 'chin_right'],
  chin_left: ['cheek_left', 'chin_center'],
  chin_right: ['cheek_right', 'chin_center'],
};

// =============================================================================
// T존-U존 확장 분석
// =============================================================================

/**
 * T존-U존 확장 비율 분석
 * 12존 기반으로 T/U 영역을 세분화하여 복합성 피부 판별
 */
export function analyzeExtendedTUZone(
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): ExtendedTUAnalysis {
  const tMetrics = T_ZONE_IDS.map((id) => zoneMetrics[id]).filter(Boolean);
  const uMetrics = U_ZONE_IDS.map((id) => zoneMetrics[id]).filter(Boolean);

  if (tMetrics.length === 0 || uMetrics.length === 0) {
    return {
      tZoneOiliness: 0,
      uZoneOiliness: 0,
      oilinessDiff: 0,
      tZoneHydration: 0,
      uZoneHydration: 0,
      hydrationDiff: 0,
      isCombiSkin: false,
      combiSeverity: 0,
    };
  }

  const tZoneOiliness = avg(tMetrics.map((m) => m.oiliness));
  const uZoneOiliness = avg(uMetrics.map((m) => m.oiliness));
  const oilinessDiff = tZoneOiliness - uZoneOiliness;

  const tZoneHydration = avg(tMetrics.map((m) => m.hydration));
  const uZoneHydration = avg(uMetrics.map((m) => m.hydration));
  const hydrationDiff = tZoneHydration - uZoneHydration;

  // 복합성 판별: T존 유분 > U존 유분 15+ 포인트
  const isCombiSkin = Math.abs(oilinessDiff) >= 15;
  // 심각도: 차이를 0-1 스케일로 정규화 (50점 차이 = 1.0)
  const combiSeverity = Math.min(1, Math.abs(oilinessDiff) / 50);

  return {
    tZoneOiliness: Math.round(tZoneOiliness),
    uZoneOiliness: Math.round(uZoneOiliness),
    oilinessDiff: Math.round(oilinessDiff),
    tZoneHydration: Math.round(tZoneHydration),
    uZoneHydration: Math.round(uZoneHydration),
    hydrationDiff: Math.round(hydrationDiff),
    isCombiSkin,
    combiSeverity: Math.round(combiSeverity * 100) / 100,
  };
}

// =============================================================================
// 좌우 대칭 분석
// =============================================================================

/**
 * 좌우 대칭 분석
 * 대칭 쌍의 점수 차이를 측정하여 비대칭 패턴 감지
 */
export function analyzeSymmetry(zoneScores: Record<DetailedZoneId, number>): SymmetryAnalysis {
  const pairDifferences: SymmetryPair[] = SYMMETRY_PAIRS.map(({ left, right, label }) => {
    const leftScore = zoneScores[left] ?? 0;
    const rightScore = zoneScores[right] ?? 0;
    return {
      leftZone: left,
      rightZone: right,
      leftScore,
      rightScore,
      difference: Math.abs(leftScore - rightScore),
      label,
    };
  });

  // 비대칭: 15점 이상 차이
  const asymmetricPairs = pairDifferences.filter((p) => p.difference > 15);

  // 전체 대칭 점수: 100 - 평균 차이 (0-100)
  const avgDiff = pairDifferences.length > 0 ? avg(pairDifferences.map((p) => p.difference)) : 0;
  const overallScore = Math.round(Math.max(0, Math.min(100, 100 - avgDiff * 2)));

  return { overallScore, pairDifferences, asymmetricPairs };
}

// =============================================================================
// 인접 문제 클러스터 감지
// =============================================================================

/**
 * 인접한 2+ 문제 존을 클러스터로 그룹화
 * 점수 50 미만인 존을 문제 존으로 판별, BFS로 인접 그룹 탐색
 */
export function detectProblemClusters(
  zoneScores: Record<DetailedZoneId, number>,
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>,
  threshold = 50
): ProblemCluster[] {
  // 문제 존 식별
  const problemZones = new Set<DetailedZoneId>();
  for (const [zoneId, score] of Object.entries(zoneScores) as [DetailedZoneId, number][]) {
    if (score < threshold) {
      problemZones.add(zoneId);
    }
  }

  // BFS로 인접 클러스터 탐색
  const visited = new Set<DetailedZoneId>();
  const clusters: ProblemCluster[] = [];

  for (const zoneId of problemZones) {
    if (visited.has(zoneId)) continue;

    const cluster = bfsCluster(zoneId, problemZones, visited);

    // 2개 이상 인접 존만 클러스터
    if (cluster.length >= 2) {
      const sharedConcerns = findSharedConcerns(cluster, zoneMetrics);
      const avgScore = avg(cluster.map((id) => zoneScores[id] ?? 0));
      const severity = Math.round(100 - avgScore);

      clusters.push({
        centerZone: cluster[0],
        zones: cluster,
        sharedConcerns,
        severity,
      });
    }
  }

  // 심각도 내림차순 정렬
  return clusters.sort((a, b) => b.severity - a.severity);
}

// =============================================================================
// 종합 상호작용 분석
// =============================================================================

/**
 * 12존 종합 상호작용 분석
 */
export function analyzeZoneInteractions(
  zoneScores: Record<DetailedZoneId, number>,
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): ZoneInteractionAnalysis {
  return {
    tuAnalysis: analyzeExtendedTUZone(zoneMetrics),
    symmetry: analyzeSymmetry(zoneScores),
    problemClusters: detectProblemClusters(zoneScores, zoneMetrics),
  };
}

// =============================================================================
// 내부 헬퍼
// =============================================================================

/** BFS로 인접 문제 존 클러스터 탐색 */
function bfsCluster(
  start: DetailedZoneId,
  problemZones: Set<DetailedZoneId>,
  visited: Set<DetailedZoneId>
): DetailedZoneId[] {
  const cluster: DetailedZoneId[] = [];
  const queue: DetailedZoneId[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    cluster.push(current);

    const neighbors = ADJACENT_ZONES[current] ?? [];
    for (const neighbor of neighbors) {
      if (problemZones.has(neighbor) && !visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return cluster;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 클러스터 내 공통 문제 찾기
 * 메트릭 임계값 기반으로 공통된 문제 키워드 반환
 */
function findSharedConcerns(
  zones: DetailedZoneId[],
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): string[] {
  // 각 메트릭별로 문제 존 비율 계산
  const concerns: string[] = [];
  const metrics = zones.map((id) => zoneMetrics[id]).filter(Boolean);
  if (metrics.length === 0) return concerns;

  const count = metrics.length;
  // 50% 이상의 존이 해당 문제를 가지면 공통 문제
  const halfCount = count / 2;

  if (metrics.filter((m) => m.hydration < 40).length >= halfCount) concerns.push('건조함');
  if (metrics.filter((m) => m.oiliness > 70).length >= halfCount) concerns.push('과다 유분');
  if (metrics.filter((m) => m.pores < 50).length >= halfCount) concerns.push('모공 확대');
  if (metrics.filter((m) => m.texture < 50).length >= halfCount) concerns.push('피부결 거침');
  if (metrics.filter((m) => m.pigmentation < 60).length >= halfCount) concerns.push('색소침착');
  if (metrics.filter((m) => m.sensitivity > 60).length >= halfCount) concerns.push('민감함');
  if (metrics.filter((m) => m.elasticity < 50).length >= halfCount) concerns.push('탄력 저하');

  return concerns;
}
