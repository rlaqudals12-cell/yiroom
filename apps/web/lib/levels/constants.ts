/**
 * 등급 시스템 상수 정의
 * @see docs/SPEC-LEVEL-SYSTEM.md
 */

// 레벨 정의
export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 30,
  3: 100,
  4: 300,
  5: 1000,
} as const;

// 레벨 색상
export const LEVEL_COLORS = {
  1: { name: 'Slate', hex: '#94A3B8', tailwind: 'slate-400' },
  2: { name: 'Teal', hex: '#14B8A6', tailwind: 'teal-500' },
  3: { name: 'Blue', hex: '#3B82F6', tailwind: 'blue-500' },
  4: { name: 'Violet', hex: '#8B5CF6', tailwind: 'violet-500' },
  5: { name: 'Amber', hex: '#F59E0B', tailwind: 'amber-500' },
} as const;

// 레벨 아이콘 (채워지는 원)
export const LEVEL_ICONS = {
  1: '○', // 빈 원
  2: '◐', // 왼쪽 반 채움
  3: '◑', // 오른쪽 반 채움
  4: '◕', // 거의 채움
  5: '●', // 꽉 채움
} as const;

// 레벨 이름
export const LEVEL_NAMES = {
  1: 'Lv.1',
  2: 'Lv.2',
  3: 'Lv.3',
  4: 'Lv.4',
  5: 'Lv.5',
} as const;

// 활동 포인트
export const ACTIVITY_POINTS = {
  workout: 1,
  meal: 1,
  water: 1,
  analysis: 2,
  review: 3,
  checkin: 1,
} as const;

// 활동 유형
export type ActivityType = keyof typeof ACTIVITY_POINTS;

// 레벨 타입
export type Level = 1 | 2 | 3 | 4 | 5;

// 최대 레벨
export const MAX_LEVEL = 5;

// 일일 최대 카운트 (같은 유형)
export const DAILY_MAX_COUNT_PER_TYPE = 5;
