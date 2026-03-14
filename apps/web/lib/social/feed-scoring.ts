/**
 * 소셜 피드 스코어링 알고리즘
 * @description 활동 피드 랭킹 및 정렬을 위한 점수 계산
 */

import type { Activity, ActivityType } from './activity';

// ============================================
// 타입
// ============================================

export interface FeedScoreResult {
  /** 종합 점수 (높을수록 상단) */
  score: number;
  /** 시간 감쇠 점수 */
  recencyScore: number;
  /** 인기도 점수 */
  popularityScore: number;
  /** 활동 유형 가중치 */
  typeWeight: number;
  /** 친밀도 점수 */
  affinityScore: number;
}

export interface FeedScoringOptions {
  /** 현재 사용자 ID */
  currentUserId: string;
  /** 친한 친구 ID 목록 (더 높은 친밀도) */
  closeFriendIds?: string[];
  /** 시간 감쇠 반감기 (시간 단위, 기본 24) */
  halfLifeHours?: number;
}

// ============================================
// 상수
// ============================================

/** 활동 유형별 기본 가중치 (높을수록 중요) */
const TYPE_WEIGHTS: Record<ActivityType, number> = {
  challenge_complete: 1.5, // 챌린지 완료 (희귀)
  streak_achieved: 1.4, // 스트릭 달성 (동기부여)
  level_up: 1.3, // 레벨업 (축하)
  badge_earned: 1.2, // 뱃지 획득
  workout_complete: 1.0, // 운동 완료 (일상)
  challenge_join: 0.8, // 챌린지 참여 (시작)
};

/** 인기도 점수 가중치 */
const LIKES_WEIGHT = 1.0;
const COMMENTS_WEIGHT = 2.0;

/** 친밀도 점수 */
const CLOSE_FRIEND_BONUS = 1.5;
const REGULAR_FRIEND_SCORE = 1.0;
const SELF_SCORE = 0.5; // 본인 활동은 약간 낮게

// ============================================
// 스코어링 함수
// ============================================

/**
 * 시간 감쇠 점수 (지수 감쇠)
 * 최근 활동일수록 높은 점수, 반감기 기준으로 감쇠
 */
export function calculateRecencyScore(
  createdAt: Date,
  now: Date = new Date(),
  halfLifeHours: number = 24
): number {
  const ageMs = now.getTime() - createdAt.getTime();
  const ageHours = Math.max(0, ageMs / (1000 * 60 * 60));

  // 지수 감쇠: score = 2^(-age/halfLife)
  return Math.pow(2, -ageHours / halfLifeHours);
}

/**
 * 인기도 점수 (로그 스케일)
 * 좋아요/댓글 수에 따른 점수, 로그 스케일로 급격한 증가 방지
 */
export function calculatePopularityScore(likesCount: number, commentsCount: number): number {
  const rawScore = likesCount * LIKES_WEIGHT + commentsCount * COMMENTS_WEIGHT;
  // log(1 + x)로 0부터 시작, 급격한 증가 방지
  return Math.log1p(rawScore);
}

/**
 * 친밀도 점수
 */
export function calculateAffinityScore(
  activityUserId: string,
  currentUserId: string,
  closeFriendIds: string[] = []
): number {
  if (activityUserId === currentUserId) return SELF_SCORE;
  if (closeFriendIds.includes(activityUserId)) return CLOSE_FRIEND_BONUS;
  return REGULAR_FRIEND_SCORE;
}

/**
 * 활동 유형 가중치
 */
export function getTypeWeight(type: ActivityType): number {
  return TYPE_WEIGHTS[type] ?? 1.0;
}

/**
 * 종합 피드 점수 계산
 */
export function calculateFeedScore(
  activity: Activity,
  options: FeedScoringOptions,
  now: Date = new Date()
): FeedScoreResult {
  const halfLifeHours = options.halfLifeHours ?? 24;

  const recencyScore = calculateRecencyScore(activity.createdAt, now, halfLifeHours);
  const popularityScore = calculatePopularityScore(activity.likesCount, activity.commentsCount);
  const typeWeight = getTypeWeight(activity.type);
  const affinityScore = calculateAffinityScore(
    activity.userId,
    options.currentUserId,
    options.closeFriendIds
  );

  // 종합 점수 = 시간감쇠 × (유형가중치 + 인기도) × 친밀도
  const score = recencyScore * (typeWeight + popularityScore) * affinityScore;

  return {
    score,
    recencyScore,
    popularityScore,
    typeWeight,
    affinityScore,
  };
}

/**
 * 활동 목록을 피드 점수로 정렬
 */
export function rankFeedActivities(
  activities: Activity[],
  options: FeedScoringOptions,
  now: Date = new Date()
): Array<Activity & { feedScore: FeedScoreResult }> {
  return activities
    .map((activity) => ({
      ...activity,
      feedScore: calculateFeedScore(activity, options, now),
    }))
    .sort((a, b) => b.feedScore.score - a.feedScore.score);
}

/**
 * 다양성 보정: 같은 사용자의 연속 활동 방지
 * 정렬된 피드에서 같은 사용자가 연속 3개 이상 나오면 순서 조정
 */
export function applyDiversityBoost(
  sortedActivities: Array<Activity & { feedScore: FeedScoreResult }>,
  maxConsecutive: number = 2
): Array<Activity & { feedScore: FeedScoreResult }> {
  if (sortedActivities.length <= maxConsecutive) return [...sortedActivities];

  const result: Array<Activity & { feedScore: FeedScoreResult }> = [];
  const deferred: Array<Activity & { feedScore: FeedScoreResult }> = [];

  for (const activity of sortedActivities) {
    // 마지막 maxConsecutive개가 같은 사용자인지 확인
    const recentSameUser = result.slice(-maxConsecutive).every((a) => a.userId === activity.userId);

    if (result.length >= maxConsecutive && recentSameUser) {
      deferred.push(activity);
    } else {
      result.push(activity);
    }
  }

  // 지연된 활동들을 끝에 추가
  result.push(...deferred);
  return result;
}
