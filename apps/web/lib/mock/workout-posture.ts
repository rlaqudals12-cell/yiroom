/**
 * 운동 자세 분석 Mock 데이터
 * - 테스트 및 AI Fallback용
 */

import type { PostureIssue } from '@/types/workout-posture';

// 개발/테스트용 Mock 데이터 (스쿼트 자세)
export const MOCK_SQUAT_POSTURE_ISSUES: PostureIssue[] = [
  {
    id: 'squat-1',
    type: 'knee_angle',
    severity: 'warning',
    location: { x: 45, y: 65, radius: 12 },
    currentAngle: 85,
    idealAngle: 90,
    description: '무릎이 발끝보다 앞으로 나가고 있어요.',
    correction: '무릎이 발끝 선상에 오도록 엉덩이를 더 뒤로 빼주세요.',
    relatedExerciseId: 'wall-squat',
  },
  {
    id: 'squat-2',
    type: 'spine_curve',
    severity: 'good',
    location: { x: 50, y: 40, radius: 10 },
    description: '척추가 중립 자세를 잘 유지하고 있어요.',
    correction: '현재 자세를 유지하세요.',
  },
  {
    id: 'squat-3',
    type: 'foot_placement',
    severity: 'warning',
    location: { x: 40, y: 85, radius: 10 },
    description: '발 간격이 좁아 균형이 불안정해요.',
    correction: '발을 어깨 너비보다 약간 넓게 벌려주세요.',
    relatedExerciseId: 'goblet-squat',
  },
];

// 플랭크 자세 Mock
export const MOCK_PLANK_POSTURE_ISSUES: PostureIssue[] = [
  {
    id: 'plank-1',
    type: 'hip_alignment',
    severity: 'critical',
    location: { x: 50, y: 45, radius: 14 },
    description: '엉덩이가 너무 높이 올라가 있어요.',
    correction: '코어에 힘을 주고 엉덩이를 낮춰 몸이 일직선이 되도록 해주세요.',
    relatedExerciseId: 'dead-bug',
  },
  {
    id: 'plank-2',
    type: 'head_position',
    severity: 'warning',
    location: { x: 25, y: 30, radius: 10 },
    description: '고개가 숙여져 있어요.',
    correction: '시선을 바닥에서 약간 앞쪽을 보며 목이 척추와 일직선이 되도록 해주세요.',
  },
  {
    id: 'plank-3',
    type: 'shoulder_alignment',
    severity: 'good',
    location: { x: 35, y: 35, radius: 10 },
    description: '어깨가 손목 위에 잘 정렬되어 있어요.',
    correction: '현재 자세를 유지하세요.',
  },
];

// 데드리프트 자세 Mock
export const MOCK_DEADLIFT_POSTURE_ISSUES: PostureIssue[] = [
  {
    id: 'deadlift-1',
    type: 'spine_curve',
    severity: 'critical',
    location: { x: 50, y: 35, radius: 14 },
    currentAngle: 25,
    idealAngle: 0,
    description: '허리가 둥글게 말려 있어 부상 위험이 있어요.',
    correction: '가슴을 펴고 허리를 곧게 유지하세요. 바벨을 몸에 가깝게 붙이세요.',
    relatedExerciseId: 'cat-cow',
  },
  {
    id: 'deadlift-2',
    type: 'arm_angle',
    severity: 'good',
    location: { x: 55, y: 50, radius: 10 },
    description: '팔이 바닥에 수직으로 잘 내려가 있어요.',
    correction: '현재 자세를 유지하세요.',
  },
];

// 운동 타입별 Mock 가져오기
export function getMockPostureIssues(exerciseType: string): PostureIssue[] {
  const mockMap: Record<string, PostureIssue[]> = {
    squat: MOCK_SQUAT_POSTURE_ISSUES,
    plank: MOCK_PLANK_POSTURE_ISSUES,
    deadlift: MOCK_DEADLIFT_POSTURE_ISSUES,
  };

  return mockMap[exerciseType.toLowerCase()] || MOCK_SQUAT_POSTURE_ISSUES;
}

// 심각도별 필터
export function getIssuesBySeverity(
  issues: PostureIssue[],
  severity: PostureIssue['severity']
): PostureIssue[] {
  return issues.filter((issue) => issue.severity === severity);
}

// 문제가 있는 이슈만 필터 (good 제외)
export function getProblematicIssues(issues: PostureIssue[]): PostureIssue[] {
  return issues.filter((issue) => issue.severity !== 'good');
}
