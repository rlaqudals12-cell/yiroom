/**
 * 챌린지 시스템 통합 export
 */

// 상수 및 유틸리티
export {
  challengeRowToChallenge,
  userChallengeRowToUserChallenge,
  getDaysSinceStart,
  calculateProgressPercentage,
  isChallengeCompleted,
  getDaysRemaining,
  isChallengeExpired,
  getTodayString,
  calculateTargetEndAt,
} from './constants';

// 조회 함수
export {
  getActiveChallenges,
  getChallengesByDomain,
  getChallengesByDifficulty,
  getChallengeById,
  getChallengeByCode,
  getUserChallenges,
  getActiveUserChallenges,
  getCompletedUserChallenges,
  getUserChallengeByChallenge,
  isUserParticipating,
  getUserChallengeStats,
  type ChallengeStats,
} from './queries';

// 변경 함수
export {
  joinChallenge,
  updateChallengeProgress,
  completeChallenge,
  abandonChallenge,
  failChallenge,
  processExpiredChallenges,
} from './mutations';

// 통합 함수 (운동/영양 기록 시 자동 업데이트)
export {
  updateChallengesByDomain,
  updateChallengesOnWorkout,
  updateChallengesOnNutrition,
  type ChallengeUpdateResult,
} from './integration';

// 타입 re-export
export type {
  Challenge,
  UserChallenge,
  ChallengeRow,
  UserChallengeRow,
  ChallengeDomain,
  ChallengeDifficulty,
  ChallengeStatus,
  ChallengeTarget,
  ChallengeProgress,
  StreakTarget,
  CountTarget,
  DailyTarget,
  CombinedTarget,
  JoinChallengeResult,
  CompleteChallengeResult,
  UpdateProgressResult,
} from '@/types/challenges';

// 상수 re-export
export {
  DOMAIN_NAMES,
  DOMAIN_COLORS,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
  STATUS_NAMES,
} from '@/types/challenges';
