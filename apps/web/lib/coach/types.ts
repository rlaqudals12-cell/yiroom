/**
 * AI 웰니스 코치 공유 타입 및 유틸리티
 * 클라이언트와 서버 모두에서 사용 가능
 */

/**
 * 피부 분석 스코어 타입
 */
export interface SkinScores {
  moisture?: number;
  oil?: number;
  sensitivity?: number;
}

/**
 * 사용자 컨텍스트 타입
 */
export interface UserContext {
  personalColor?: {
    season: string;
    tone?: string;
  };
  skinAnalysis?: {
    skinType: string;
    concerns?: string[];
    scores?: SkinScores;
    // Phase D: 피부 일기 연동
    recentCondition?: number; // 최근 7일 평균 피부 컨디션 (1-5점)
    routineCompletionRate?: {
      morning: number; // 아침 루틴 완료율 (0-100%)
      evening: number; // 저녁 루틴 완료율 (0-100%)
    };
    recentFactors?: {
      avgSleep?: number; // 평균 수면 시간
      avgWater?: number; // 평균 수분 섭취 (ml)
      avgStress?: number; // 평균 스트레스 (1-5점)
    };
  };
  bodyAnalysis?: {
    bodyType: string;
    bmi?: number;
    height?: number;
    weight?: number;
  };
  hairAnalysis?: {
    hairType: string;
    scalpType: string;
    overallScore: number;
    concerns?: string[];
  };
  makeupAnalysis?: {
    undertone: string;
    faceShape: string;
    eyeShape?: string;
    overallScore: number;
    recommendedStyles?: string[];
  };
  workout?: {
    workoutType?: string;
    goal?: string;
    frequency?: number;
    streak?: number;
    lastWorkout?: string;
  };
  nutrition?: {
    goal?: string;
    targetCalories?: number;
    streak?: number;
    todayCalories?: number;
  };
  recentActivity?: {
    todayWorkout?: string;
    todayCalories?: number;
    waterIntake?: number;
  };
  // 주간 요약 (부담 없는 인사이트용)
  weeklySummary?: {
    workoutCount?: number;
    avgCalories?: number;
    avgProtein?: number;
    avgCarbs?: number;
    avgFat?: number;
  };
}

/**
 * 컨텍스트 요약 문자열 생성 (디버그/로깅용)
 */
export function summarizeContext(context: UserContext | null): string {
  if (!context) return '컨텍스트 없음';

  const parts: string[] = [];

  if (context.personalColor) {
    parts.push(`PC:${context.personalColor.season}`);
  }
  if (context.skinAnalysis) {
    parts.push(`피부:${context.skinAnalysis.skinType}`);
  }
  if (context.bodyAnalysis) {
    parts.push(`체형:${context.bodyAnalysis.bodyType}`);
  }
  if (context.hairAnalysis) {
    parts.push(`헤어:${context.hairAnalysis.hairType}`);
  }
  if (context.makeupAnalysis) {
    parts.push(`메이크업:${context.makeupAnalysis.undertone}`);
  }
  if (context.workout?.streak) {
    parts.push(`운동스트릭:${context.workout.streak}일`);
  }
  if (context.nutrition?.streak) {
    parts.push(`영양스트릭:${context.nutrition.streak}일`);
  }

  return parts.length > 0 ? parts.join(', ') : '기본 정보만';
}
