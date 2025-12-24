/**
 * 친구 활동 피드 관련 타입 및 유틸리티
 * Sprint C - 소셜 확장
 */

// =====================================================
// 활동 타입 정의
// =====================================================

export type ActivityType =
  | 'workout_complete'
  | 'challenge_join'
  | 'challenge_complete'
  | 'streak_achieved'
  | 'level_up'
  | 'badge_earned';

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: ActivityMetadata;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  createdAt: Date;
}

export interface ActivityMetadata {
  // 운동 완료
  workoutType?: string;
  duration?: number; // 분
  caloriesBurned?: number;
  // 챌린지
  challengeId?: string;
  challengeName?: string;
  challengeProgress?: number; // 0-100
  // 스트릭
  streakDays?: number;
  streakType?: 'workout' | 'nutrition';
  // 레벨업
  newLevel?: number;
  // 뱃지
  badgeId?: string;
  badgeName?: string;
  badgeIcon?: string;
}

// DB Row 타입
export interface ActivityRow {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata: ActivityMetadata | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // 조인된 사용자 정보
  user_name?: string;
  user_avatar?: string | null;
  // 현재 사용자의 좋아요 여부
  is_liked?: boolean;
}

// Supabase 조인 쿼리 결과 타입
export interface RawActivityData {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata: ActivityMetadata | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users: {
    full_name: string;
    avatar_url: string | null;
  };
  activity_likes: { user_id: string }[];
}

// =====================================================
// 변환 함수
// =====================================================

export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '익명',
    userAvatar: row.user_avatar || null,
    type: row.type,
    title: row.title,
    description: row.description,
    metadata: row.metadata || undefined,
    likesCount: row.likes_count,
    isLiked: row.is_liked || false,
    commentsCount: row.comments_count,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Supabase 조인 쿼리 결과를 Activity로 변환
 */
export function transformToActivity(
  raw: RawActivityData,
  currentUserId: string
): Activity {
  const isLiked = raw.activity_likes.some(
    (like) => like.user_id === currentUserId
  );

  return {
    id: raw.id,
    userId: raw.user_id,
    userName: raw.users.full_name,
    userAvatar: raw.users.avatar_url,
    type: raw.type,
    title: raw.title,
    description: raw.description,
    metadata: raw.metadata || undefined,
    likesCount: raw.likes_count,
    isLiked,
    commentsCount: raw.comments_count,
    createdAt: new Date(raw.created_at),
  };
}

// =====================================================
// 활동 타입별 설정
// =====================================================

export interface ActivityTypeConfig {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  workout_complete: {
    icon: '💪',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: '운동 완료',
  },
  challenge_join: {
    icon: '🎯',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: '챌린지 참여',
  },
  challenge_complete: {
    icon: '🏆',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: '챌린지 완료',
  },
  streak_achieved: {
    icon: '🔥',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: '연속 달성',
  },
  level_up: {
    icon: '⬆️',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: '레벨 업',
  },
  badge_earned: {
    icon: '🏅',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: '뱃지 획득',
  },
};

export function getActivityConfig(type: ActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIG[type];
}

// =====================================================
// 상대 시간 포맷
// =====================================================

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return '방금 전';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}주 전`;
  } else if (diffMonths < 12) {
    return `${diffMonths}개월 전`;
  } else {
    return date.toLocaleDateString('ko-KR');
  }
}

// =====================================================
// 활동 생성 헬퍼
// =====================================================

export function createWorkoutActivity(
  userId: string,
  userName: string,
  workoutType: string,
  duration: number,
  caloriesBurned?: number
): Omit<Activity, 'id' | 'createdAt' | 'likesCount' | 'isLiked' | 'commentsCount'> {
  return {
    userId,
    userName,
    userAvatar: null,
    type: 'workout_complete',
    title: `${workoutType} 운동 완료!`,
    description: `${duration}분간 운동을 완료했어요${caloriesBurned ? ` (${caloriesBurned}kcal 소모)` : ''}.`,
    metadata: {
      workoutType,
      duration,
      caloriesBurned,
    },
  };
}

export function createStreakActivity(
  userId: string,
  userName: string,
  streakDays: number,
  streakType: 'workout' | 'nutrition'
): Omit<Activity, 'id' | 'createdAt' | 'likesCount' | 'isLiked' | 'commentsCount'> {
  const typeLabel = streakType === 'workout' ? '운동' : '식단';
  return {
    userId,
    userName,
    userAvatar: null,
    type: 'streak_achieved',
    title: `${streakDays}일 연속 ${typeLabel} 달성!`,
    description: `${streakDays}일 연속으로 ${typeLabel}을 기록했어요.`,
    metadata: {
      streakDays,
      streakType,
    },
  };
}

export function createLevelUpActivity(
  userId: string,
  userName: string,
  newLevel: number
): Omit<Activity, 'id' | 'createdAt' | 'likesCount' | 'isLiked' | 'commentsCount'> {
  return {
    userId,
    userName,
    userAvatar: null,
    type: 'level_up',
    title: `레벨 ${newLevel} 달성!`,
    description: `축하해요! 레벨 ${newLevel}이 되었습니다.`,
    metadata: {
      newLevel,
    },
  };
}

export function createChallengeCompleteActivity(
  userId: string,
  userName: string,
  challengeName: string,
  challengeId?: string
): Omit<Activity, 'id' | 'createdAt' | 'likesCount' | 'isLiked' | 'commentsCount'> {
  return {
    userId,
    userName,
    userAvatar: null,
    type: 'challenge_complete',
    title: '챌린지 완료!',
    description: `"${challengeName}" 챌린지를 성공적으로 완료했어요.`,
    metadata: {
      challengeId,
      challengeName,
      challengeProgress: 100,
    },
  };
}
