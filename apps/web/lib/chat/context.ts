/**
 * AI 채팅 컨텍스트 수집기
 * @description 사용자 분석 결과 및 프로필 데이터 수집
 */

import { chatLogger } from '@/lib/utils/logger';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
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
  chatLogger.debug(`Fetching context for user: ${clerkUserId}`);

  try {
    const supabase = createClerkSupabaseClient();

    // 병렬로 모든 분석 데이터 조회
    const [skinResult, pcResult, bodyResult, workoutResult, nutritionResult] = await Promise.all([
      supabase
        .from('skin_analyses')
        .select('skin_type, moisture_level, concerns, created_at')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('personal_color_assessments')
        .select('result_season, result_tone, best_colors, worst_colors, created_at')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('body_analyses')
        .select('body_type, weight, height, bmi, created_at')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('workout_plans')
        .select('workout_goal, fitness_level, workout_frequency')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('users')
        .select('nutrition_goal, daily_calorie_target, protein_target')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle(),
    ]);

    const context: ChatContext = {};

    // 피부 분석 데이터
    if (skinResult.data) {
      const skinTypeMap: Record<string, string> = {
        dry: '건성',
        oily: '지성',
        combination: '복합성',
        sensitive: '민감성',
        normal: '중성',
      };
      context.skinAnalysis = {
        skinType: skinTypeMap[skinResult.data.skin_type] || skinResult.data.skin_type,
        moisture: skinResult.data.moisture_level || 50,
        concerns: skinResult.data.concerns || [],
        recommendedIngredients: [], // 피부 분석 결과에서 추출 가능
        analyzedAt: skinResult.data.created_at?.split('T')[0] || '',
      };
    }

    // 퍼스널 컬러 데이터
    if (pcResult.data) {
      context.personalColor = {
        season: pcResult.data.result_season,
        tone: pcResult.data.result_tone,
        bestColors: pcResult.data.best_colors || [],
        worstColors: pcResult.data.worst_colors || [],
        analyzedAt: pcResult.data.created_at?.split('T')[0],
      };
    }

    // 체형 분석 데이터
    if (bodyResult.data) {
      const bodyTypeMap: Record<string, string> = {
        S: '스트레이트',
        W: '웨이브',
        N: '내추럴',
      };
      context.bodyAnalysis = {
        bodyType: bodyTypeMap[bodyResult.data.body_type] || bodyResult.data.body_type,
        bmi: bodyResult.data.bmi || 22,
        muscleBalance: '보통', // 기본값
        analyzedAt: bodyResult.data.created_at?.split('T')[0] || '',
      };
    }

    // 운동 계획 데이터
    if (workoutResult.data) {
      context.workoutPlan = {
        goal: workoutResult.data.workout_goal,
        level: workoutResult.data.fitness_level,
        frequency: workoutResult.data.workout_frequency,
      };
    }

    // 영양 목표 데이터
    if (nutritionResult.data) {
      context.nutritionGoals = {
        dailyCalories: nutritionResult.data.daily_calorie_target,
        proteinTarget: nutritionResult.data.protein_target,
      };
    }

    // 유효한 컨텍스트가 없으면 Mock 반환
    if (!hasValidContext(context)) {
      chatLogger.debug('No valid context found, using mock data');
      return generateMockContext();
    }

    return context;
  } catch (error) {
    chatLogger.error('Failed to fetch user context:', error);
    return generateMockContext();
  }
}

/**
 * 컨텍스트 요약 생성
 * @description 긴 컨텍스트를 짧게 요약
 */
export function summarizeContext(context: ChatContext): string {
  const summaries: string[] = [];

  if (context.skinAnalysis) {
    summaries.push(
      `피부: ${context.skinAnalysis.skinType}, 수분 ${context.skinAnalysis.moisture}%`
    );
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
