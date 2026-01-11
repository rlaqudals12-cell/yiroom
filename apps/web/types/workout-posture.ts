/**
 * 운동 자세 분석 타입
 * - Phase E 피부 분석 확대 뷰어 패턴 재사용
 */

export type PostureIssueType =
  | 'shoulder_alignment' // 어깨 정렬
  | 'hip_alignment' // 골반 정렬
  | 'knee_angle' // 무릎 각도
  | 'spine_curve' // 척추 곡률
  | 'head_position' // 머리 위치
  | 'foot_placement' // 발 위치
  | 'arm_angle' // 팔 각도
  | 'core_engagement'; // 코어 활성화

export type PostureSeverity = 'good' | 'warning' | 'critical';

export interface PostureLocation {
  x: number; // 0-100 (이미지 기준 %)
  y: number; // 0-100
  radius: number; // 영역 크기 (8-16)
}

export interface PostureIssue {
  id: string;
  type: PostureIssueType;
  severity: PostureSeverity;
  location: PostureLocation;
  currentAngle?: number; // 현재 각도
  idealAngle?: number; // 이상적 각도
  description: string; // "어깨가 앞으로 말려있어요"
  correction: string; // "가슴을 펴고 어깨를 뒤로 당겨주세요"
  relatedExerciseId?: string; // 교정 운동 ID
}

// 마커 색상 매핑 (심각도 기반)
export const POSTURE_MARKER_COLORS: Record<PostureSeverity, string> = {
  good: '#10B981', // 초록 (에메랄드)
  warning: '#F59E0B', // 노랑 (앰버)
  critical: '#EF4444', // 빨강
};

// 자세 유형 한글 라벨
export const POSTURE_TYPE_LABELS: Record<PostureIssueType, string> = {
  shoulder_alignment: '어깨',
  hip_alignment: '골반',
  knee_angle: '무릎',
  spine_curve: '척추',
  head_position: '머리',
  foot_placement: '발',
  arm_angle: '팔',
  core_engagement: '코어',
};

// 심각도 한글 라벨
export const POSTURE_SEVERITY_LABELS: Record<PostureSeverity, string> = {
  good: '좋음',
  warning: '주의',
  critical: '교정 필요',
};

// 심각도 스타일
export const POSTURE_SEVERITY_STYLES: Record<PostureSeverity, string> = {
  good: 'text-emerald-700 bg-emerald-100',
  warning: 'text-amber-700 bg-amber-100',
  critical: 'text-rose-700 bg-rose-100',
};
