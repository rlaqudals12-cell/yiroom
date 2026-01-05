/**
 * 등급 시스템 모듈
 * @see docs/SPEC-LEVEL-SYSTEM.md
 */

// 상수
export {
  LEVEL_THRESHOLDS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_NAMES,
  ACTIVITY_POINTS,
  MAX_LEVEL,
  DAILY_MAX_COUNT_PER_TYPE,
  type ActivityType,
  type Level,
} from './constants';

// 유틸리티 함수
export {
  calculateLevel,
  getNextLevelThreshold,
  calculateProgress,
  getLevelInfo,
  getAllLevels,
  getLevelColorStyle,
  getLevelTailwindClass,
  calculateUserLevelState,
  type UserLevelState,
} from './utils';

// 활동 트래커
export {
  trackActivity,
  getUserLevel,
  getUserActivityLogs,
  getTodayActivityCount,
  getLevelDefinitions,
} from './activity-tracker';
