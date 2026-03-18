/**
 * 시간대×요일 기반 동적 문맥 제안
 * 사용자의 현재 시간과 요일에 따라 적절한 액션을 추천
 */

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ContextSuggestion {
  message: string;
  actionLabel: string;
  route: string;
  icon: string;
  /** 모듈 색상 키 (GlassCard 배경 틴트용) */
  moduleColor: 'skin' | 'workout' | 'nutrition' | 'personalColor' | 'body';
}

/** 시간대 판별 */
export function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/** 주말 여부 (0=일, 6=토) */
function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 시간대×요일 기반 문맥 제안 생성
 * @param hour 현재 시간 (0-23)
 * @param dayOfWeek 요일 (0=일, 1=월, ..., 6=토)
 * @param hasCompletedWorkout 오늘 운동 완료 여부
 * @param hasMealLogged 오늘 식사 기록 여부
 */
export function getContextSuggestion(
  hour: number,
  dayOfWeek: number,
  hasCompletedWorkout: boolean,
  hasMealLogged: boolean
): ContextSuggestion {
  const slot = getTimeSlot(hour);
  const weekend = isWeekend(dayOfWeek);

  // 아침 (6-11)
  if (slot === 'morning') {
    if (!hasMealLogged) {
      return {
        message: '좋은 아침! 아침 식사를 기록해보세요',
        actionLabel: '식사 기록하기',
        route: '/(tabs)/records',
        icon: 'Apple',
        moduleColor: 'nutrition',
      };
    }
    return {
      message: '오늘의 스킨케어 루틴을 확인해보세요',
      actionLabel: '루틴 확인',
      route: '/(capsule)/daily',
      icon: 'Sparkles',
      moduleColor: 'skin',
    };
  }

  // 오후 (12-16)
  if (slot === 'afternoon') {
    if (!hasMealLogged) {
      return {
        message: '점심 기록하고 영양 밸런스를 확인해요',
        actionLabel: '점심 기록하기',
        route: '/(tabs)/records',
        icon: 'UtensilsCrossed',
        moduleColor: 'nutrition',
      };
    }
    if (weekend) {
      return {
        message: '여유로운 주말, 스타일링 추천을 확인해보세요',
        actionLabel: '스타일 추천',
        route: '/(analysis)/personal-color',
        icon: 'Palette',
        moduleColor: 'personalColor',
      };
    }
    return {
      message: '오후 에너지 충전! 간식 기록도 잊지 마세요',
      actionLabel: '간식 기록',
      route: '/(tabs)/records',
      icon: 'Cookie',
      moduleColor: 'nutrition',
    };
  }

  // 저녁 (17-21)
  if (slot === 'evening') {
    if (!hasCompletedWorkout) {
      return {
        message: '저녁 운동으로 하루를 마무리해보세요',
        actionLabel: '운동 기록하기',
        route: '/(workout)/onboarding',
        icon: 'Dumbbell',
        moduleColor: 'workout',
      };
    }
    return {
      message: '오늘의 저녁 식사를 기록해보세요',
      actionLabel: '저녁 기록',
      route: '/(tabs)/records',
      icon: 'UtensilsCrossed',
      moduleColor: 'nutrition',
    };
  }

  // 밤 (22-5)
  return {
    message: '오늘 하루를 마무리하며 기록을 확인해요',
    actionLabel: '오늘 리뷰',
    route: '/(tabs)/records',
    icon: 'Moon',
    moduleColor: 'skin',
  };
}
