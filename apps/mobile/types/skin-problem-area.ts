/**
 * 피부 문제 영역 타입
 * Phase E - SDD-PHASE-E-SKIN-ZOOM.md
 */

export type ProblemAreaType =
  | 'pores'
  | 'pigmentation'
  | 'dryness'
  | 'wrinkles'
  | 'acne'
  | 'oiliness'
  | 'redness'
  | 'darkCircles';

export type ProblemSeverity = 'mild' | 'moderate' | 'severe';

export interface ProblemLocation {
  x: number; // 0-100 (이미지 기준 %)
  y: number; // 0-100
  radius: number; // 영역 크기 (5-20)
}

export interface ProblemArea {
  id: string;
  type: ProblemAreaType;
  severity: ProblemSeverity;
  location: ProblemLocation;
  description: string;
  recommendations: string[];
}

// 마커 색상 매핑
export const MARKER_COLORS: Record<ProblemAreaType, string> = {
  pores: '#EF4444', // 빨강
  pigmentation: '#F59E0B', // 주황
  dryness: '#3B82F6', // 파랑
  wrinkles: '#8B5CF6', // 보라
  acne: '#EC4899', // 핑크
  oiliness: '#10B981', // 초록
  redness: '#F97316', // 오렌지
  darkCircles: '#6366F1', // 인디고
};

// 문제 유형 한글 라벨
export const PROBLEM_TYPE_LABELS: Record<ProblemAreaType, string> = {
  pores: '모공',
  pigmentation: '색소침착',
  dryness: '건조함',
  wrinkles: '주름',
  acne: '트러블',
  oiliness: '유분',
  redness: '붉은기',
  darkCircles: '다크서클',
};

// 심각도 한글 라벨
export const SEVERITY_LABELS: Record<ProblemSeverity, string> = {
  mild: '가벼움',
  moderate: '보통',
  severe: '심함',
};

// 심각도 색상
export const SEVERITY_COLORS: Record<ProblemSeverity, string> = {
  mild: 'text-emerald-600 bg-emerald-50',
  moderate: 'text-amber-600 bg-amber-50',
  severe: 'text-rose-600 bg-rose-50',
};
