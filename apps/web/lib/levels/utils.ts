/**
 * 등급 시스템 유틸리티 함수
 * @see docs/SPEC-LEVEL-SYSTEM.md
 */

import {
  LEVEL_THRESHOLDS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_NAMES,
  MAX_LEVEL,
  type Level,
} from './constants';

/**
 * 활동 수에서 레벨 계산
 * 하락 없음 원칙: 항상 가장 높은 달성 레벨 반환
 */
export function calculateLevel(activityCount: number): Level {
  if (activityCount >= LEVEL_THRESHOLDS[5]) return 5;
  if (activityCount >= LEVEL_THRESHOLDS[4]) return 4;
  if (activityCount >= LEVEL_THRESHOLDS[3]) return 3;
  if (activityCount >= LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

/**
 * 다음 레벨까지 필요한 활동 수 계산
 */
export function getNextLevelThreshold(currentLevel: Level): number | null {
  if (currentLevel >= MAX_LEVEL) return null;
  const nextLevel = (currentLevel + 1) as Level;
  return LEVEL_THRESHOLDS[nextLevel];
}

/**
 * 다음 레벨까지 진행률 계산 (0-100)
 */
export function calculateProgress(activityCount: number, currentLevel: Level): number {
  if (currentLevel >= MAX_LEVEL) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = LEVEL_THRESHOLDS[(currentLevel + 1) as Level];

  const progressInLevel = activityCount - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;

  return Math.min(100, Math.round((progressInLevel / levelRange) * 100));
}

/**
 * 레벨 정보 객체 반환
 */
export function getLevelInfo(level: Level) {
  return {
    level,
    name: LEVEL_NAMES[level],
    icon: LEVEL_ICONS[level],
    color: LEVEL_COLORS[level],
    threshold: LEVEL_THRESHOLDS[level],
  };
}

/**
 * 전체 레벨 정보 목록
 */
export function getAllLevels() {
  return ([1, 2, 3, 4, 5] as Level[]).map(getLevelInfo);
}

/**
 * 레벨 색상 CSS 변수 생성
 */
export function getLevelColorStyle(level: Level): React.CSSProperties {
  return {
    '--level-color': LEVEL_COLORS[level].hex,
  } as React.CSSProperties;
}

/**
 * 레벨 Tailwind 클래스 반환
 */
export function getLevelTailwindClass(level: Level, type: 'bg' | 'text' | 'border' = 'bg'): string {
  const colorClass = LEVEL_COLORS[level].tailwind;
  return `${type}-${colorClass}`;
}

/**
 * 사용자 레벨 상태 계산
 */
export interface UserLevelState {
  level: Level;
  totalActivityCount: number;
  nextLevelThreshold: number | null;
  progress: number;
  levelInfo: ReturnType<typeof getLevelInfo>;
}

export function calculateUserLevelState(totalActivityCount: number): UserLevelState {
  const level = calculateLevel(totalActivityCount);
  const nextLevelThreshold = getNextLevelThreshold(level);
  const progress = calculateProgress(totalActivityCount, level);
  const levelInfo = getLevelInfo(level);

  return {
    level,
    totalActivityCount,
    nextLevelThreshold,
    progress,
    levelInfo,
  };
}
