/**
 * S-2 12존 히트맵 데이터 준비 모듈
 * 인터랙티브 얼굴 존 히트맵의 데이터 레이어
 *
 * @description 12존 점수/메트릭을 히트맵 시각화용 데이터로 변환합니다.
 * 점수 → 색상, 불투명도, 상태 매핑 및 SVG 좌표 제공.
 * @see types/skin-zones.ts - 12존 타입 정의
 * @see ./twelve-zone-extractor.ts - 존 관심사 분석
 */

import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from './types';
import { analyzeDetailedZoneConcerns } from './twelve-zone-extractor';

// =============================================================================
// 타입
// =============================================================================

/** 히트맵 상태 레벨 */
export type HeatmapStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/** 히트맵 존 데이터 */
export interface HeatmapZoneData {
  /** 존 ID */
  zoneId: DetailedZoneId;
  /** 한국어 라벨 */
  label: string;
  /** 종합 점수 (0-100) */
  score: number;
  /** 점수 기반 색상 (HEX) */
  colorHex: string;
  /** 심각도 기반 불투명도 (0.3-1.0, 낮은 점수일수록 높음) */
  opacity: number;
  /** 상태 */
  status: HeatmapStatus;
  /** 주요 관심사 (최대 2개) */
  topConcerns: string[];
}

/** 히트맵 전체 데이터 */
export interface HeatmapData {
  /** 12존 히트맵 데이터 */
  zones: HeatmapZoneData[];
  /** 최악 존 */
  worstZone: HeatmapZoneData;
  /** 최고 존 */
  bestZone: HeatmapZoneData;
  /** 전체 평균 점수 */
  averageScore: number;
  /** 색상 스케일 그라디언트 끝점 */
  colorScale: { min: string; max: string };
}

/** SVG 타원 좌표 (viewBox 0-100) */
export interface ZoneEllipsePosition {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// =============================================================================
// 상수
// =============================================================================

/** 점수 구간별 색상 매핑 */
const SCORE_COLOR_RANGES = [
  { max: 30, color: '#EF4444' }, // 빨강 (심각)
  { max: 50, color: '#F97316' }, // 주황 (나쁨)
  { max: 65, color: '#EAB308' }, // 노랑 (보통)
  { max: 80, color: '#22C55E' }, // 초록 (양호)
  { max: 100, color: '#10B981' }, // 에메랄드 (우수)
] as const;

/** 점수 구간별 상태 매핑 */
const SCORE_STATUS_RANGES: Array<{ max: number; status: HeatmapStatus }> = [
  { max: 30, status: 'critical' },
  { max: 50, status: 'poor' },
  { max: 65, status: 'fair' },
  { max: 80, status: 'good' },
  { max: 100, status: 'excellent' },
];

/** 12존 SVG 타원 좌표 (viewBox 0-100 기준 정규화) */
const ZONE_POSITIONS: Record<DetailedZoneId, ZoneEllipsePosition> = {
  forehead_center: { cx: 50, cy: 18, rx: 12, ry: 8 },
  forehead_left: { cx: 32, cy: 20, rx: 10, ry: 7 },
  forehead_right: { cx: 68, cy: 20, rx: 10, ry: 7 },
  eye_left: { cx: 35, cy: 35, rx: 8, ry: 5 },
  eye_right: { cx: 65, cy: 35, rx: 8, ry: 5 },
  nose_bridge: { cx: 50, cy: 38, rx: 5, ry: 8 },
  nose_tip: { cx: 50, cy: 50, rx: 6, ry: 5 },
  cheek_left: { cx: 28, cy: 52, rx: 12, ry: 10 },
  cheek_right: { cx: 72, cy: 52, rx: 12, ry: 10 },
  chin_center: { cx: 50, cy: 75, rx: 10, ry: 7 },
  chin_left: { cx: 38, cy: 70, rx: 8, ry: 6 },
  chin_right: { cx: 62, cy: 70, rx: 8, ry: 6 },
};

// =============================================================================
// 공개 함수
// =============================================================================

/**
 * 점수를 HEX 색상으로 변환
 * - 0-30: #EF4444 (빨강, 심각)
 * - 31-50: #F97316 (주황, 나쁨)
 * - 51-65: #EAB308 (노랑, 보통)
 * - 66-80: #22C55E (초록, 양호)
 * - 81-100: #10B981 (에메랄드, 우수)
 */
export function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  for (const range of SCORE_COLOR_RANGES) {
    if (clamped <= range.max) {
      return range.color;
    }
  }
  return SCORE_COLOR_RANGES[SCORE_COLOR_RANGES.length - 1].color;
}

/**
 * 점수를 불투명도로 변환 (심각도 역비례)
 * 낮은 점수 → 높은 불투명도 (문제 영역이 더 눈에 띔)
 * @returns 0.3 (점수 100) ~ 1.0 (점수 0)
 */
export function scoreToOpacity(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  // 선형 보간: score 0 → 1.0, score 100 → 0.3
  const opacity = 1.0 - (clamped / 100) * 0.7;
  // 소수점 2자리 반올림
  return Math.round(opacity * 100) / 100;
}

/**
 * 점수를 상태 레이블로 변환
 */
export function getScoreStatus(score: number): HeatmapStatus {
  const clamped = Math.max(0, Math.min(100, score));
  for (const range of SCORE_STATUS_RANGES) {
    if (clamped <= range.max) {
      return range.status;
    }
  }
  return 'excellent';
}

/**
 * 존별 SVG 타원 좌표 반환 (viewBox 0-100)
 * 얼굴 다이어그램에서 존 인디케이터 위치 지정에 사용
 */
export function getZonePosition(zoneId: DetailedZoneId): ZoneEllipsePosition {
  return ZONE_POSITIONS[zoneId];
}

/**
 * 12존 점수/메트릭 → 히트맵 데이터 변환 (메인 함수)
 *
 * @param zoneScores - 존별 종합 점수 (0-100)
 * @param zoneMetrics - 존별 상세 메트릭
 * @returns 히트맵 시각화용 데이터
 */
export function prepareHeatmapData(
  zoneScores: Record<DetailedZoneId, number>,
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): HeatmapData {
  const zoneIds = Object.keys(zoneScores) as DetailedZoneId[];

  const zones: HeatmapZoneData[] = zoneIds.map((zoneId) => {
    const score = zoneScores[zoneId];
    const metrics = zoneMetrics[zoneId];

    // 관심사 분석 (twelve-zone-extractor 재사용)
    const allConcerns = metrics ? analyzeDetailedZoneConcerns(zoneId, metrics) : [];

    return {
      zoneId,
      label: DETAILED_ZONE_LABELS[zoneId],
      score,
      colorHex: scoreToColor(score),
      opacity: scoreToOpacity(score),
      status: getScoreStatus(score),
      topConcerns: allConcerns.slice(0, 2),
    };
  });

  // 점수 기준 정렬으로 최악/최고 존 결정
  const sorted = [...zones].sort((a, b) => a.score - b.score);
  const worstZone = sorted[0];
  const bestZone = sorted[sorted.length - 1];

  // 평균 점수
  const totalScore = zones.reduce((sum, z) => sum + z.score, 0);
  const averageScore = zones.length > 0 ? Math.round(totalScore / zones.length) : 0;

  return {
    zones,
    worstZone,
    bestZone,
    averageScore,
    colorScale: {
      min: SCORE_COLOR_RANGES[0].color,
      max: SCORE_COLOR_RANGES[SCORE_COLOR_RANGES.length - 1].color,
    },
  };
}
