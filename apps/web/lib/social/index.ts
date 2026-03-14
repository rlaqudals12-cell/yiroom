/**
 * 소셜 모듈 공개 API
 *
 * @module lib/social
 * @description 친구 활동 피드, 피드 스코어링, 활동 생성
 */

// 활동 타입 및 유틸리티
export {
  ACTIVITY_TYPE_CONFIG,
  createWorkoutActivity,
  createStreakActivity,
  createLevelUpActivity,
  createChallengeCompleteActivity,
  formatRelativeTime,
  transformToActivity,
} from './activity';

export type { ActivityType, Activity, ActivityMetadata, ActivityTypeConfig } from './activity';

// 피드 스코어링
export {
  calculateRecencyScore,
  calculatePopularityScore,
  calculateAffinityScore,
  getTypeWeight,
  calculateFeedScore,
  rankFeedActivities,
  applyDiversityBoost,
} from './feed-scoring';

export type { FeedScoreResult, FeedScoringOptions } from './feed-scoring';
