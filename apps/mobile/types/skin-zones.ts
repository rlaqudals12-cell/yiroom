/**
 * 피부 존 분석 타입 정의
 * @description 6존 기본 시스템 + 12존 세부 시스템
 * @version 1.0
 * @date 2026-01-09
 */

// ============================================
// 기본 6존 시스템 (Phase 1)
// ============================================

/** 기본 6존 ID */
export type ZoneId = 'forehead' | 'tZone' | 'eyes' | 'cheeks' | 'uZone' | 'chin';

/** 존 상태 레벨 */
export type ZoneStatusLevel = 'good' | 'normal' | 'warning';

/** 존 상태 정보 */
export interface ZoneStatus {
  /** 점수 (0-100) */
  score: number;
  /** 상태 레벨 */
  status: ZoneStatusLevel;
  /** 존 이름 (한국어) */
  label: string;
  /** 우려사항 목록 */
  concerns?: string[];
}

/** 6존 맵 데이터 */
export type ZoneMap = Record<ZoneId, ZoneStatus>;

// ============================================
// 세부 12존 시스템 (Phase 3)
// ============================================

/** 세부 12존 ID */
export type DetailedZoneId =
  // 이마 영역 (3)
  | 'forehead_center'
  | 'forehead_left'
  | 'forehead_right'
  // 눈가 영역 (2)
  | 'eye_left'
  | 'eye_right'
  // 볼 영역 (2)
  | 'cheek_left'
  | 'cheek_right'
  // 코 영역 (2)
  | 'nose_bridge'
  | 'nose_tip'
  // 턱 영역 (3)
  | 'chin_center'
  | 'chin_left'
  | 'chin_right';

/** 세부 존 상태 레벨 (5단계) */
export type DetailedStatusLevel = 'excellent' | 'good' | 'normal' | 'warning' | 'critical';

/** 이전 분석 대비 변화 */
export interface ZoneChange {
  /** 변화 방향 */
  change: 'improved' | 'same' | 'declined';
  /** 점수 차이 */
  scoreDiff: number;
}

/** 세부 존 상태 정보 */
export interface DetailedZoneStatus {
  /** 존 ID */
  zoneId: DetailedZoneId;
  /** 점수 (0-100) */
  score: number;
  /** 상태 레벨 */
  status: DetailedStatusLevel;
  /** 우려사항 목록 */
  concerns: string[];
  /** 관리법 추천 */
  recommendations: string[];
  /** 이전 분석 대비 변화 (선택) */
  comparedToPrevious?: ZoneChange;
}

/** 12존 맵 데이터 */
export type DetailedZoneMap = Record<DetailedZoneId, DetailedZoneStatus>;

// ============================================
// 존 매핑 (6존 ↔ 12존)
// ============================================

/** 6존 → 12존 매핑 */
export const ZONE_TO_DETAILED_MAPPING: Record<ZoneId, DetailedZoneId[]> = {
  forehead: ['forehead_center', 'forehead_left', 'forehead_right'],
  eyes: ['eye_left', 'eye_right'],
  tZone: ['nose_bridge', 'nose_tip'],
  cheeks: ['cheek_left', 'cheek_right'],
  uZone: ['chin_left', 'chin_right'],
  chin: ['chin_center'],
};

/** 12존 → 6존 매핑 */
export const DETAILED_TO_ZONE_MAPPING: Record<DetailedZoneId, ZoneId> = {
  forehead_center: 'forehead',
  forehead_left: 'forehead',
  forehead_right: 'forehead',
  eye_left: 'eyes',
  eye_right: 'eyes',
  cheek_left: 'cheeks',
  cheek_right: 'cheeks',
  nose_bridge: 'tZone',
  nose_tip: 'tZone',
  chin_center: 'chin',
  chin_left: 'uZone',
  chin_right: 'uZone',
};

// ============================================
// 존 메타데이터
// ============================================

/** 6존 한국어 라벨 */
export const ZONE_LABELS: Record<ZoneId, string> = {
  forehead: '이마',
  tZone: 'T존',
  eyes: '눈가',
  cheeks: '볼',
  uZone: 'U존',
  chin: '턱',
};

/** 12존 한국어 라벨 */
export const DETAILED_ZONE_LABELS: Record<DetailedZoneId, string> = {
  forehead_center: '이마 중앙',
  forehead_left: '왼쪽 이마',
  forehead_right: '오른쪽 이마',
  eye_left: '왼쪽 눈가',
  eye_right: '오른쪽 눈가',
  cheek_left: '왼쪽 볼',
  cheek_right: '오른쪽 볼',
  nose_bridge: '콧등',
  nose_tip: '코끝',
  chin_center: '턱 중앙',
  chin_left: '왼쪽 턱선',
  chin_right: '오른쪽 턱선',
};

/** 12존 설명 (주요 관심사) */
export const DETAILED_ZONE_DESCRIPTIONS: Record<DetailedZoneId, string> = {
  forehead_center: 'T존 상단, 피지 분비 활발',
  forehead_left: '헤어라인 접촉 영역',
  forehead_right: '헤어라인 접촉 영역',
  eye_left: '다크서클, 잔주름 집중',
  eye_right: '다크서클, 잔주름 집중',
  cheek_left: '홍조, 모공 확대 주의',
  cheek_right: '홍조, 모공 확대 주의',
  nose_bridge: '블랙헤드, 각질 집중',
  nose_tip: '피지, 모공 관리 필요',
  chin_center: '여드름 발생 빈도 높음',
  chin_left: '턱선 탄력 체크',
  chin_right: '턱선 탄력 체크',
};

// ============================================
// 상태 레벨 유틸리티
// ============================================

/** 점수 → 3단계 상태 변환 */
export function getZoneStatusLevel(score: number): ZoneStatusLevel {
  if (score >= 71) return 'good';
  if (score >= 41) return 'normal';
  return 'warning';
}

/** 점수 → 5단계 상태 변환 */
export function getDetailedStatusLevel(score: number): DetailedStatusLevel {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'normal';
  if (score >= 30) return 'warning';
  return 'critical';
}

/** 상태 레벨별 색상 (Tailwind) */
export const STATUS_COLORS: Record<DetailedStatusLevel | ZoneStatusLevel, string> = {
  excellent: 'text-emerald-500',
  good: 'text-green-500',
  normal: 'text-yellow-500',
  warning: 'text-orange-500',
  critical: 'text-red-500',
};

/** 상태 레벨별 배경색 (Tailwind) */
export const STATUS_BG_COLORS: Record<DetailedStatusLevel | ZoneStatusLevel, string> = {
  excellent: 'bg-emerald-500/20',
  good: 'bg-green-500/20',
  normal: 'bg-yellow-500/20',
  warning: 'bg-orange-500/20',
  critical: 'bg-red-500/20',
};

// ============================================
// SVG 좌표 (터치 영역)
// ============================================

/** 6존 SVG 터치 영역 (viewBox="0 0 200 280") */
export const ZONE_SVG_AREAS: Record<
  ZoneId,
  { x: number; y: number; width: number; height: number }
> = {
  forehead: { x: 30, y: 30, width: 140, height: 60 },
  tZone: { x: 70, y: 90, width: 60, height: 120 },
  eyes: { x: 30, y: 100, width: 140, height: 40 },
  cheeks: { x: 20, y: 130, width: 160, height: 60 },
  uZone: { x: 30, y: 180, width: 140, height: 60 },
  chin: { x: 70, y: 230, width: 60, height: 40 },
};

/** 12존 SVG 터치 영역 (viewBox="0 0 200 280") */
export const DETAILED_ZONE_SVG_AREAS: Record<
  DetailedZoneId,
  { x: number; y: number; width: number; height: number }
> = {
  // 이마 (y: 30-90)
  forehead_center: { x: 70, y: 30, width: 60, height: 50 },
  forehead_left: { x: 30, y: 35, width: 45, height: 45 },
  forehead_right: { x: 125, y: 35, width: 45, height: 45 },
  // 눈가 (y: 90-130)
  eye_left: { x: 30, y: 95, width: 55, height: 35 },
  eye_right: { x: 115, y: 95, width: 55, height: 35 },
  // 볼 (y: 130-190)
  cheek_left: { x: 20, y: 135, width: 55, height: 55 },
  cheek_right: { x: 125, y: 135, width: 55, height: 55 },
  // 코 (y: 90-180)
  nose_bridge: { x: 80, y: 100, width: 40, height: 45 },
  nose_tip: { x: 80, y: 145, width: 40, height: 35 },
  // 턱 (y: 190-270)
  chin_center: { x: 70, y: 230, width: 60, height: 40 },
  chin_left: { x: 35, y: 195, width: 50, height: 45 },
  chin_right: { x: 115, y: 195, width: 50, height: 45 },
};

// ============================================
// 12존 → 6존 집계
// ============================================

/** 12존 데이터를 6존으로 집계 */
export function aggregateToSixZones(detailedZones: DetailedZoneMap): ZoneMap {
  const result: Partial<ZoneMap> = {};

  for (const [zoneId, detailedZoneIds] of Object.entries(ZONE_TO_DETAILED_MAPPING)) {
    const scores = detailedZoneIds.map((dzId) => detailedZones[dzId]?.score ?? 0);
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const concerns = detailedZoneIds.flatMap((dzId) => detailedZones[dzId]?.concerns ?? []);
    const uniqueConcerns = [...new Set(concerns)];

    result[zoneId as ZoneId] = {
      score: avgScore,
      status: getZoneStatusLevel(avgScore),
      label: ZONE_LABELS[zoneId as ZoneId],
      concerns: uniqueConcerns.slice(0, 3), // 최대 3개
    };
  }

  return result as ZoneMap;
}
