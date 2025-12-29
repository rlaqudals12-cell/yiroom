/**
 * AI 채팅 컨텍스트 수집기
 * @description 사용자 분석 결과 및 프로필 데이터 수집
 */

import type { ChatContext } from '@/types/chat';

/**
 * Mock 컨텍스트 생성 (개발용)
 */
export function generateMockContext(): ChatContext {
  return {
    skinAnalysis: {
      skinType: '복합성 (T존 지성, U존 건성)',
      moisture: 42,
      concerns: ['모공', '건조함', '칙칙한 피부톤'],
      recommendedIngredients: ['히알루론산', '나이아신아마이드', '세라마이드'],
      analyzedAt: '2025-01-15',
    },
    personalColor: {
      season: '봄',
      tone: '웜톤',
      bestColors: ['코랄', '피치', '아이보리', '살몬핑크'],
      worstColors: ['블랙', '버건디', '네이비'],
      analyzedAt: '2025-01-10',
    },
    bodyAnalysis: {
      bodyType: '역삼각형',
      bmi: 22.5,
      muscleBalance: '상체 발달, 하체 보통',
      analyzedAt: '2025-01-12',
    },
    workoutPlan: {
      goal: '근력 강화',
      level: '중급',
      frequency: 4,
    },
    nutritionGoals: {
      dailyCalories: 2000,
      proteinTarget: 120,
    },
    recentProducts: [
      { id: 'prod_001', name: '세라마이드 토너', category: '스킨케어' },
      { id: 'prod_002', name: '비타민C 세럼', category: '스킨케어' },
      { id: 'prod_003', name: '프로틴 파우더', category: '건강식품' },
    ],
  };
}

/**
 * 사용자 컨텍스트 수집 (실제 구현)
 * @param clerkUserId Clerk 사용자 ID
 */
export async function fetchUserContext(clerkUserId: string): Promise<ChatContext> {
  // TODO: 실제 Supabase에서 사용자 데이터 조회
  // const supabase = createClerkSupabaseClient();
  // const skinAnalysis = await supabase.from('skin_analyses')...
  // const personalColor = await supabase.from('personal_color_assessments')...

  // 현재는 Mock 데이터 반환
  console.log(`[Chat Context] Fetching context for user: ${clerkUserId}`);

  // 개발 환경에서는 Mock 데이터 사용
  return generateMockContext();
}

/**
 * 컨텍스트 요약 생성
 * @description 긴 컨텍스트를 짧게 요약
 */
export function summarizeContext(context: ChatContext): string {
  const summaries: string[] = [];

  if (context.skinAnalysis) {
    summaries.push(`피부: ${context.skinAnalysis.skinType}, 수분 ${context.skinAnalysis.moisture}%`);
  }

  if (context.personalColor) {
    summaries.push(`컬러: ${context.personalColor.season} ${context.personalColor.tone}`);
  }

  if (context.bodyAnalysis) {
    summaries.push(`체형: ${context.bodyAnalysis.bodyType}, BMI ${context.bodyAnalysis.bmi}`);
  }

  if (context.workoutPlan) {
    summaries.push(`운동: ${context.workoutPlan.goal} (주 ${context.workoutPlan.frequency}회)`);
  }

  return summaries.join(' | ');
}

/**
 * 컨텍스트 유효성 검사
 */
export function hasValidContext(context: ChatContext): boolean {
  return !!(
    context.skinAnalysis ||
    context.personalColor ||
    context.bodyAnalysis ||
    context.workoutPlan ||
    context.nutritionGoals
  );
}

/**
 * 관련 분석 유형 추출
 * @description 질문 내용에 따라 관련 분석 유형 반환
 */
export function detectRelatedAnalysis(
  message: string
): 'skin' | 'personal-color' | 'body' | 'nutrition' | 'workout' | 'product' | null {
  const lowerMessage = message.toLowerCase();

  // 키워드 매칭
  const skinKeywords = ['피부', '스킨', '보습', '모공', '여드름', '주름', '세안', '클렌징'];
  const colorKeywords = ['컬러', '색상', '립', '아이섀도', '블러셔', '톤', '웜톤', '쿨톤'];
  const bodyKeywords = ['체형', '몸', '다이어트', '체중', '살', '지방'];
  const nutritionKeywords = ['영양', '칼로리', '단백질', '탄수화물', '비타민', '식단', '음식'];
  const workoutKeywords = ['운동', '헬스', '근육', '스트레칭', '유산소', '웨이트'];
  const productKeywords = ['제품', '추천', '성분', '브랜드', '가격'];

  if (skinKeywords.some((k) => lowerMessage.includes(k))) return 'skin';
  if (colorKeywords.some((k) => lowerMessage.includes(k))) return 'personal-color';
  if (bodyKeywords.some((k) => lowerMessage.includes(k))) return 'body';
  if (nutritionKeywords.some((k) => lowerMessage.includes(k))) return 'nutrition';
  if (workoutKeywords.some((k) => lowerMessage.includes(k))) return 'workout';
  if (productKeywords.some((k) => lowerMessage.includes(k))) return 'product';

  return null;
}
