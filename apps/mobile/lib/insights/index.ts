/**
 * 교차 모듈 인사이트 모듈
 *
 * 분석 결과, 운동, 영양 데이터를 교차 분석하여 개인화된 인사이트 생성
 *
 * @module lib/insights
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export interface UserInsight {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
  icon: string;
  score: number;
  createdAt: string;
}

export type InsightCategory =
  | 'skin_workout'
  | 'nutrition_skin'
  | 'workout_nutrition'
  | 'color_product'
  | 'streak_motivation'
  | 'wellness_overall'
  | 'seasonal'
  | 'reminder';

export type InsightPriority = 'high' | 'medium' | 'low';

export interface AnalysisDataBundle {
  personalColor: { season: string; confidence: number } | null;
  skinAnalysis: { skinType: string; scores: Record<string, number> } | null;
  bodyAnalysis: { bodyType: string; overallScore: number } | null;
  workoutStats: { weeklyMinutes: number; weeklyDays: number; streak: number };
  nutritionStats: { avgCalories: number; avgProtein: number; waterRatio: number };
  level: number;
  totalXp: number;
}

export interface AnalysisProgress {
  totalAnalyses: number;
  completedTypes: string[];
  missingTypes: string[];
  lastAnalysisDate: string | null;
}

// ─── 인사이트 생성 ────────────────────────────────────

/**
 * 분석 데이터 번들 가져오기
 */
export async function fetchAnalysisDataBundle(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisDataBundle> {
  // 병렬 쿼리
  const [pcResult, skinResult, bodyResult, levelResult] = await Promise.all([
    supabase
      .from('personal_color_assessments')
      .select('season, confidence')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('skin_assessments')
      .select('skin_type, scores')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('body_assessments')
      .select('body_type, overall_score')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_levels')
      .select('level, total_xp')
      .eq('clerk_user_id', userId)
      .maybeSingle(),
  ]);

  return {
    personalColor: pcResult.data
      ? { season: pcResult.data.season, confidence: pcResult.data.confidence }
      : null,
    skinAnalysis: skinResult.data
      ? { skinType: skinResult.data.skin_type, scores: skinResult.data.scores ?? {} }
      : null,
    bodyAnalysis: bodyResult.data
      ? { bodyType: bodyResult.data.body_type, overallScore: bodyResult.data.overall_score }
      : null,
    workoutStats: { weeklyMinutes: 0, weeklyDays: 0, streak: 0 },
    nutritionStats: { avgCalories: 0, avgProtein: 0, waterRatio: 0 },
    level: levelResult.data?.level ?? 1,
    totalXp: levelResult.data?.total_xp ?? 0,
  };
}

/**
 * 분석 진행 상황
 */
export async function getAnalysisProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisProgress> {
  const allTypes = ['personal-color', 'skin', 'body', 'hair', 'makeup', 'oral-health', 'posture', 'nail'];
  const tableMap: Record<string, string> = {
    'personal-color': 'personal_color_assessments',
    skin: 'skin_assessments',
    body: 'body_assessments',
    hair: 'hair_assessments',
    makeup: 'makeup_assessments',
    'oral-health': 'oral_health_assessments',
    posture: 'posture_assessments',
    nail: 'nail_assessments',
  };

  const completedTypes: string[] = [];
  let lastDate: string | null = null;
  let totalAnalyses = 0;

  // 각 분석 타입별 확인
  for (const type of allTypes) {
    const table = tableMap[type];
    if (!table) continue;

    const { count, data } = await supabase
      .from(table)
      .select('created_at', { count: 'exact' })
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if ((count ?? 0) > 0) {
      completedTypes.push(type);
      totalAnalyses += count ?? 0;

      if (data?.[0]?.created_at) {
        if (!lastDate || data[0].created_at > lastDate) {
          lastDate = data[0].created_at;
        }
      }
    }
  }

  const missingTypes = allTypes.filter((t) => !completedTypes.includes(t));

  return {
    totalAnalyses,
    completedTypes,
    missingTypes,
    lastAnalysisDate: lastDate,
  };
}

// ─── 인사이트 로직 ────────────────────────────────────

/**
 * 사용자 인사이트 생성
 */
export function generateUserInsights(
  data: AnalysisDataBundle,
  progress: AnalysisProgress
): UserInsight[] {
  const insights: UserInsight[] = [];
  const now = new Date().toISOString();

  // 1. 미완료 분석 추천
  if (progress.missingTypes.length > 0) {
    const missingLabel = ANALYSIS_TYPE_LABELS[progress.missingTypes[0]] ?? progress.missingTypes[0];
    insights.push({
      id: `insight-missing-${progress.missingTypes[0]}`,
      category: 'reminder',
      priority: 'high',
      title: `${missingLabel} 분석을 아직 안 해봤어요`,
      description: `${missingLabel} 분석으로 더 완전한 뷰티 프로필을 만들어보세요`,
      actionLabel: `${missingLabel} 분석 시작`,
      actionRoute: `/(analysis)/${progress.missingTypes[0]}`,
      icon: '🔬',
      score: 90,
      createdAt: now,
    });
  }

  // 2. 피부 + 운동 교차 인사이트
  if (data.skinAnalysis && data.workoutStats.weeklyDays > 0) {
    const hydration = data.skinAnalysis.scores?.hydration ?? 50;
    if (hydration < 60 && data.workoutStats.weeklyMinutes > 120) {
      insights.push({
        id: 'insight-skin-workout-hydration',
        category: 'skin_workout',
        priority: 'medium',
        title: '운동 후 피부 수분 보충이 필요해요',
        description: '활발한 운동으로 수분 손실이 있을 수 있어요. 운동 후 수분 보충에 신경 써보세요',
        actionLabel: '피부 분석 다시 받기',
        actionRoute: '/(analysis)/skin',
        icon: '💧',
        score: 75,
        createdAt: now,
      });
    }
  }

  // 3. 영양 + 피부 교차 인사이트
  if (data.skinAnalysis && data.nutritionStats.avgProtein > 0) {
    const sensitivity = data.skinAnalysis.scores?.sensitivity ?? 50;
    if (sensitivity > 60) {
      insights.push({
        id: 'insight-nutrition-skin-sensitivity',
        category: 'nutrition_skin',
        priority: 'medium',
        title: '피부 민감도를 낮추는 식단 팁',
        description: '항산화 식품(베리류, 녹차)이 피부 민감도를 낮추는 데 도움돼요',
        actionLabel: '영양 기록하기',
        actionRoute: '/(tabs)/nutrition',
        icon: '🫐',
        score: 70,
        createdAt: now,
      });
    }
  }

  // 4. 퍼스널컬러 + 제품 추천
  if (data.personalColor) {
    insights.push({
      id: 'insight-color-product',
      category: 'color_product',
      priority: 'low',
      title: `${SEASON_LABELS[data.personalColor.season] ?? data.personalColor.season} 시즌에 맞는 제품을 찾아보세요`,
      description: '퍼스널컬러에 맞는 제품을 사용하면 피부톤이 더 밝아 보여요',
      actionLabel: '추천 제품 보기',
      actionRoute: '/(tabs)/index',
      icon: '🎨',
      score: 60,
      createdAt: now,
    });
  }

  // 5. 스트릭 동기부여
  if (data.workoutStats.streak >= 3) {
    insights.push({
      id: 'insight-streak-motivation',
      category: 'streak_motivation',
      priority: 'low',
      title: `${data.workoutStats.streak}일 연속 기록 중!`,
      description: '꾸준함이 변화를 만들어요. 오늘도 이어가볼까요?',
      actionLabel: '오늘 기록하기',
      actionRoute: '/(tabs)/records',
      icon: '🔥',
      score: 55,
      createdAt: now,
    });
  }

  // 6. 레벨업 근접 알림
  if (data.totalXp > 0) {
    const currentLevel = data.level;
    const nextLevelXp = 50 * (currentLevel + 1) * currentLevel;
    const remaining = nextLevelXp - data.totalXp;
    if (remaining > 0 && remaining < 50) {
      insights.push({
        id: 'insight-level-up-soon',
        category: 'wellness_overall',
        priority: 'medium',
        title: `레벨 ${currentLevel + 1}까지 ${remaining}XP 남았어요!`,
        description: '조금만 더 활동하면 레벨업할 수 있어요',
        actionLabel: '활동하기',
        actionRoute: '/(tabs)/index',
        icon: '⬆️',
        score: 80,
        createdAt: now,
      });
    }
  }

  // 점수순 정렬
  return insights.sort((a, b) => b.score - a.score);
}

// ─── 상수 ─────────────────────────────────────────────

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  'personal-color': '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
  'oral-health': '구강건강',
  posture: '자세',
  nail: '네일',
};

const SEASON_LABELS: Record<string, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

// ─── 공개 유틸리티 ────────────────────────────────────

/**
 * 인사이트 필터링
 */
export function filterInsights(
  insights: UserInsight[],
  category?: InsightCategory,
  priority?: InsightPriority
): UserInsight[] {
  return insights.filter((insight) => {
    if (category && insight.category !== category) return false;
    if (priority && insight.priority !== priority) return false;
    return true;
  });
}

/**
 * 상위 N개 인사이트
 */
export function getTopInsights(
  insights: UserInsight[],
  limit = 3
): UserInsight[] {
  return insights.slice(0, limit);
}
