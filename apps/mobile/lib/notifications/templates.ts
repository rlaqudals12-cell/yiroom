/**
 * 알림 템플릿 정의
 * 웹과 동기화된 알림 템플릿 시스템
 */

// ============================================================
// 알림 카테고리 및 타입
// ============================================================

export type NotificationCategory = 'workout' | 'nutrition' | 'social' | 'achievement' | 'system';

export type NotificationType =
  // 운동 관련
  | 'workout_reminder'
  | 'workout_complete'
  | 'workout_streak'
  | 'workout_streak_warning'
  // 영양 관련
  | 'nutrition_reminder'
  | 'nutrition_goal'
  | 'water_reminder'
  | 'fasting_end'
  // 소셜 관련
  | 'friend_request'
  | 'friend_accepted'
  | 'challenge_invite'
  | 'challenge_complete'
  // 성취 관련
  | 'level_up'
  | 'badge_earned'
  | 'wellness_score'
  | 'weekly_report'
  // 시스템
  | 'daily_checkin'
  | 'test';

// ============================================================
// 템플릿 정의
// ============================================================

export interface NotificationTemplate {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  icon?: string;
  action?: {
    label: string;
    route: string;
  };
}

export type TemplateVariables = Record<string, string | number>;

// ============================================================
// 템플릿 맵
// ============================================================

export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  Omit<NotificationTemplate, 'type'>
> = {
  // 운동 관련
  workout_reminder: {
    category: 'workout',
    title: '💪 운동할 시간이에요!',
    body: '오늘의 운동 루틴을 확인해보세요.',
    action: { label: '운동 시작', route: '/(tabs)/workout' },
  },
  workout_complete: {
    category: 'workout',
    title: '🎉 운동 완료!',
    body: '{{duration}}분간 {{workout_type}} 운동을 완료했어요!',
    action: { label: '기록 보기', route: '/(tabs)/workout' },
  },
  workout_streak: {
    category: 'workout',
    title: '🔥 {{streak}}일 연속 달성!',
    body: '대단해요! {{streak}}일 연속으로 운동을 기록했어요.',
    action: { label: '기록 확인', route: '/(tabs)/workout' },
  },
  workout_streak_warning: {
    category: 'workout',
    title: '🏃 {{streak}}일 연속 기록이 끊길 위험!',
    body: '오늘 운동 기록을 남기면 연속 기록이 유지됩니다.',
    action: { label: '운동 기록', route: '/(tabs)/workout' },
  },

  // 영양 관련
  nutrition_reminder: {
    category: 'nutrition',
    title: '🍽️ 식단 기록 시간이에요!',
    body: '오늘 먹은 음식을 기록해보세요.',
    action: { label: '기록하기', route: '/(tabs)/nutrition' },
  },
  nutrition_goal: {
    category: 'nutrition',
    title: '🎯 영양 목표 달성!',
    body: '오늘 {{nutrient}} 목표를 달성했어요!',
    action: { label: '자세히 보기', route: '/(tabs)/nutrition' },
  },
  water_reminder: {
    category: 'nutrition',
    title: '💧 수분 섭취 시간!',
    body: '물 한 잔 마시는 건 어떨까요? 현재 {{current}}ml/{{target}}ml',
    action: { label: '기록하기', route: '/(tabs)/nutrition' },
  },
  fasting_end: {
    category: 'nutrition',
    title: '⏰ 단식 종료!',
    body: '{{hours}}시간 단식을 완료했어요. 건강한 식사하세요!',
    action: { label: '식단 기록', route: '/(tabs)/nutrition' },
  },

  // 소셜 관련
  friend_request: {
    category: 'social',
    title: '👋 새 친구 요청!',
    body: '{{name}}님이 친구 요청을 보냈어요.',
    action: { label: '확인하기', route: '/(social)/friends' },
  },
  friend_accepted: {
    category: 'social',
    title: '🤝 친구가 되었어요!',
    body: '{{name}}님과 친구가 되었습니다.',
    action: { label: '프로필 보기', route: '/(social)/friends' },
  },
  challenge_invite: {
    category: 'social',
    title: '🎯 챌린지 초대!',
    body: '{{name}}님이 "{{challenge}}" 챌린지에 초대했어요.',
    action: { label: '참여하기', route: '/(challenges)' },
  },
  challenge_complete: {
    category: 'social',
    title: '🏆 챌린지 완료!',
    body: '"{{challenge}}" 챌린지를 성공적으로 완료했어요!',
    action: { label: '결과 보기', route: '/(challenges)' },
  },

  // 성취 관련
  level_up: {
    category: 'achievement',
    title: '⬆️ 레벨 업!',
    body: '축하해요! 레벨 {{level}}이 되었습니다!',
    action: { label: '보상 확인', route: '/(tabs)/profile' },
  },
  badge_earned: {
    category: 'achievement',
    title: '🏅 새 뱃지 획득!',
    body: '"{{badge}}" 뱃지를 획득했어요!',
    action: { label: '뱃지 보기', route: '/(tabs)/profile' },
  },
  wellness_score: {
    category: 'achievement',
    title: '✨ 이번 주 웰니스 점수',
    body: '이번 주 웰니스 점수는 {{score}}점이에요! {{grade}}등급입니다.',
    action: { label: '자세히 보기', route: '/(tabs)/profile' },
  },
  weekly_report: {
    category: 'achievement',
    title: '📊 주간 리포트 도착!',
    body: '이번 주 활동을 분석한 리포트가 준비됐어요.',
    action: { label: '리포트 보기', route: '/reports' },
  },

  // 시스템
  daily_checkin: {
    category: 'system',
    title: '✨ 오늘의 나 체크인하기',
    body: '30초만 투자해서 오늘의 상태를 기록해보세요.',
    action: { label: '체크인', route: '/(tabs)' },
  },
  test: {
    category: 'system',
    title: '🎉 알림 설정 완료!',
    body: '이룸에서 리마인더 알림을 받을 준비가 되었습니다.',
  },
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 템플릿 변수 치환
 */
export function interpolateTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(variables[key] ?? `{{${key}}}`);
  });
}

/**
 * 알림 생성
 */
export function createNotification(
  type: NotificationType,
  variables?: TemplateVariables
): NotificationTemplate {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const title = variables ? interpolateTemplate(template.title, variables) : template.title;

  const body = variables ? interpolateTemplate(template.body, variables) : template.body;

  return {
    type,
    category: template.category,
    title,
    body,
    icon: template.icon,
    action: template.action,
  };
}

/**
 * 카테고리별 알림 타입 가져오기
 */
export function getNotificationTypesByCategory(category: NotificationCategory): NotificationType[] {
  return (
    Object.entries(NOTIFICATION_TEMPLATES) as [
      NotificationType,
      (typeof NOTIFICATION_TEMPLATES)[NotificationType],
    ][]
  )
    .filter(([, template]) => template.category === category)
    .map(([type]) => type);
}

// ============================================================
// 카테고리 라벨 및 아이콘
// ============================================================

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  workout: '운동',
  nutrition: '영양',
  social: '소셜',
  achievement: '성취',
  system: '시스템',
};

export const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  workout: '💪',
  nutrition: '🍽️',
  social: '👥',
  achievement: '🏆',
  system: '⚙️',
};
