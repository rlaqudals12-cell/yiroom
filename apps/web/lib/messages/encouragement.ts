/**
 * 격려 메시지 시스템
 * - 사용자 행동에 대한 긍정적 피드백 제공
 * - 감정적 디자인을 통한 참여도 향상
 */

// 성공 메시지 (일반)
export const SUCCESS_MESSAGES = [
  '잘하셨어요! 👏',
  '멋져요! ✨',
  '최고예요! 🎉',
  '훌륭해요! 💪',
  '대단해요! 🌟',
  '완벽해요! 💯',
  '굉장해요! 🔥',
  '정말 잘했어요! 👍',
] as const;

// 스트릭 관련 메시지
export const STREAK_MESSAGES = {
  // 스트릭 시작
  start: [
    '첫 걸음을 내딛었어요! 🚀',
    '새로운 시작이에요! 🌱',
    '오늘부터 시작! 💫',
  ],
  // 스트릭 유지 (3-6일)
  maintain: [
    '꾸준함이 빛나요! ✨',
    '잘 하고 있어요! 💪',
    '이 조자도 유지해요! 🔥',
    '습관이 되어가고 있어요! 🌟',
  ],
  // 스트릭 성장 (7일+)
  growing: [
    '일주일 연속! 대단해요! 🎊',
    '멈추지 않는 당신! 🏃‍♂️',
    '진짜 실력자네요! 👑',
    '습관의 힘을 보여주고 있어요! 💎',
  ],
  // 스트릭 마스터 (30일+)
  master: [
    '한 달 연속! 전설이에요! 🏆',
    '당신은 진정한 마스터! 👸',
    '포기를 모르는 챔피언! 🥇',
    '놀라운 의지력이에요! ⭐',
  ],
  // 스트릭 위험 경고
  warning: [
    '오늘 기록하면 스트릭 유지! ⚡',
    '잠깐! 스트릭이 끊길 수 있어요 🔔',
    '조금만 더 힘내요! 💪',
  ],
  // 스트릭 끊김
  broken: [
    '괜찮아요, 다시 시작하면 돼요 🌈',
    '누구나 쉬어갈 수 있어요 ☕',
    '오늘부터 새로운 기록! 🌱',
    '다시 도전하는 것도 용기예요 💪',
  ],
} as const;

// 체크인 완료 메시지
export const CHECKIN_MESSAGES = [
  '오늘도 나를 돌봐주셨네요 💝',
  '자기 관리의 달인! 🌟',
  '오늘의 나와 대화했어요 💬',
  '스스로를 아끼는 멋진 습관이에요 ✨',
  '오늘 하루도 수고했어요 🌸',
] as const;

// 운동 완료 메시지
export const WORKOUT_MESSAGES = [
  '땀 흘린 만큼 성장해요! 💪',
  '오늘도 한 걸음 더 강해졌어요! 🏋️',
  '당신의 노력이 빛나요! ✨',
  '몸이 고마워하고 있어요! 🙏',
  '운동 완료! 기분 좋죠? 😊',
] as const;

// 식단 기록 메시지
export const NUTRITION_MESSAGES = [
  '건강한 선택이에요! 🥗',
  '균형 잡힌 식사 좋아요! 🍽️',
  '몸에 좋은 영양을 채웠어요! 💚',
  '오늘의 식단 기록 완료! 📝',
  '먹는 것도 자기 관리예요! 🌿',
] as const;

// 목표 달성 메시지
export const GOAL_ACHIEVED_MESSAGES = [
  '목표 달성! 정말 대단해요! 🎯',
  '해냈어요! 축하해요! 🎊',
  '당신의 노력이 결실을 맺었어요! 🌻',
  '불가능은 없어요! 증명했네요! ��',
  '목표를 향한 여정이 아름다워요! 🌈',
] as const;

// 배지 획득 메시지
export const BADGE_EARNED_MESSAGES = [
  '새 배지 획득! 🏅',
  '컬렉션에 추가! 🎖️',
  '업적 달성! 자랑스러워요! 🏆',
  '또 하나의 성취! 👏',
] as const;

// 레벨업 메시지
export const LEVEL_UP_MESSAGES = [
  '레벨 업! 성장하고 있어요! 📈',
  '한 단계 더 높이! 🪜',
  '경험치가 쌓여가요! ⭐',
  '실력이 늘고 있어요! 💫',
] as const;

// 빈 상태 격려 메시지
export const EMPTY_STATE_MESSAGES = {
  workout: {
    title: '아직 운동 기록이 없어요',
    description: '첫 운동을 시작하면 여기에 기록이 쌓여요!',
    cta: '운동 시작하기',
    emoji: '🏃‍♂️',
  },
  nutrition: {
    title: '오늘 식사를 기록해보세요',
    description: '무엇을 먹었는지 기록하면 건강 관리가 쉬워져요',
    cta: '식사 기록하기',
    emoji: '🍽️',
  },
  streak: {
    title: '스트릭을 시작해보세요',
    description: '매일 기록하면 연속 기록이 쌓여요',
    cta: '오늘부터 시작',
    emoji: '🔥',
  },
  analysis: {
    title: '나를 알아가는 여정을 시작해요',
    description: '퍼스널컬러, 피부, 체형 분석으로 맞춤 추천을 받아보세요',
    cta: '분석 시작하기',
    emoji: '✨',
  },
  products: {
    title: '추천 제품을 찾아보세요',
    description: '분석 결과를 바탕으로 딱 맞는 제품을 추천해드려요',
    cta: '제품 둘러보기',
    emoji: '🛍️',
  },
  challenge: {
    title: '챌린지에 참여해보세요',
    description: '다른 사용자들과 함께 목표를 달성해보세요',
    cta: '챌린지 찾아보기',
    emoji: '🎯',
  },
  friends: {
    title: '친구를 추가해보세요',
    description: '친구와 함께하면 더 즐거워요',
    cta: '친구 찾기',
    emoji: '👋',
  },
} as const;

// 시간대별 인사 메시지
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return '좋은 아침이에요! ☀️';
  } else if (hour >= 12 && hour < 17) {
    return '좋은 오후예요! 🌤️';
  } else if (hour >= 17 && hour < 21) {
    return '좋은 저녁이에요! 🌆';
  } else {
    return '오늘 하루도 수고했어요! 🌙';
  }
}

// 랜덤 메시지 선택 유틸리티
export function getRandomMessage<T>(messages: readonly T[]): T {
  return messages[Math.floor(Math.random() * messages.length)];
}

// 스트릭 수에 따른 메시지 반환
export function getStreakMessage(streak: number, isActive: boolean): string {
  if (!isActive) {
    return getRandomMessage(STREAK_MESSAGES.broken);
  }

  if (streak === 1) {
    return getRandomMessage(STREAK_MESSAGES.start);
  } else if (streak >= 30) {
    return getRandomMessage(STREAK_MESSAGES.master);
  } else if (streak >= 7) {
    return getRandomMessage(STREAK_MESSAGES.growing);
  } else {
    return getRandomMessage(STREAK_MESSAGES.maintain);
  }
}

// 토스트 메시지용 래퍼
export function getSuccessToastMessage(context?: 'workout' | 'nutrition' | 'checkin' | 'goal' | 'badge' | 'level'): string {
  switch (context) {
    case 'workout':
      return getRandomMessage(WORKOUT_MESSAGES);
    case 'nutrition':
      return getRandomMessage(NUTRITION_MESSAGES);
    case 'checkin':
      return getRandomMessage(CHECKIN_MESSAGES);
    case 'goal':
      return getRandomMessage(GOAL_ACHIEVED_MESSAGES);
    case 'badge':
      return getRandomMessage(BADGE_EARNED_MESSAGES);
    case 'level':
      return getRandomMessage(LEVEL_UP_MESSAGES);
    default:
      return getRandomMessage(SUCCESS_MESSAGES);
  }
}
