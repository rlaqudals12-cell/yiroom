/**
 * 운동 전용 RAG 검색
 * @description Phase K - 사용자 운동 계획/기록 기반 맞춤 운동 추천을 위한 RAG 시스템
 *
 * 실제 운동 데이터베이스 (lib/workout/exercises.ts)와 연결됨.
 * 총 60+ 운동 데이터 (upper-body, lower-core-cardio, pilates, yoga, stretching)
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';
import { getAllExercises, getRecommendedExercises } from '@/lib/workout/exercises';
import type { Exercise } from '@/types/workout';

/** 운동 목표 */
type WorkoutGoal = 'strength' | 'cardio' | 'flexibility' | 'weight_loss' | 'muscle_gain';

/** 운동 추천 결과 */
export interface ExerciseRecommendation {
  id: string;
  name: string;
  category: string;
  targetMuscle: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // 분
  calories: number;
  matchScore: number;
  matchReason: string;
  equipment?: string[];
}

/** 운동 검색 결과 */
export interface WorkoutSearchResult {
  hasWorkoutPlan: boolean;
  todayWorkout: ExerciseRecommendation | null;
  recommendations: ExerciseRecommendation[];
  goalTips: string[];
  recentProgress: string | null;
}

/** 질문 의도 분석 */
type WorkoutIntent =
  | 'today'
  | 'muscle'
  | 'cardio'
  | 'stretch'
  | 'home'
  | 'recommendation'
  | 'general';

/** 질문에서 운동 목표 추출 */
function detectWorkoutGoal(query: string): WorkoutGoal | null {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('근력') || lowerQuery.includes('웨이트') || lowerQuery.includes('힘')) {
    return 'strength';
  }
  if (
    lowerQuery.includes('유산소') ||
    lowerQuery.includes('달리기') ||
    lowerQuery.includes('런닝') ||
    lowerQuery.includes('조깅')
  ) {
    return 'cardio';
  }
  if (
    lowerQuery.includes('스트레칭') ||
    lowerQuery.includes('유연성') ||
    lowerQuery.includes('요가')
  ) {
    return 'flexibility';
  }
  if (
    lowerQuery.includes('다이어트') ||
    lowerQuery.includes('살빼') ||
    lowerQuery.includes('체중 감량')
  ) {
    return 'weight_loss';
  }
  if (lowerQuery.includes('벌크업') || lowerQuery.includes('근육') || lowerQuery.includes('증량')) {
    return 'muscle_gain';
  }

  return null;
}

/** 질문 의도 추출 */
function analyzeWorkoutIntent(query: string): WorkoutIntent {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('오늘') || lowerQuery.includes('지금') || lowerQuery.includes('당장')) {
    return 'today';
  }
  if (
    lowerQuery.includes('근육') ||
    lowerQuery.includes('웨이트') ||
    lowerQuery.includes('덤벨') ||
    lowerQuery.includes('스쿼트')
  ) {
    return 'muscle';
  }
  if (lowerQuery.includes('유산소') || lowerQuery.includes('런닝') || lowerQuery.includes('걷기')) {
    return 'cardio';
  }
  if (
    lowerQuery.includes('스트레칭') ||
    lowerQuery.includes('풀기') ||
    lowerQuery.includes('유연')
  ) {
    return 'stretch';
  }
  if (lowerQuery.includes('집') || lowerQuery.includes('홈트') || lowerQuery.includes('맨몸')) {
    return 'home';
  }
  if (lowerQuery.includes('추천') || lowerQuery.includes('알려')) {
    return 'recommendation';
  }

  return 'general';
}

/** 목표별 운동 팁 */
const GOAL_TIPS: Record<WorkoutGoal, string[]> = {
  strength: [
    '근력 운동은 세트 간 2-3분 휴식이 효과적이에요',
    '점진적 과부하 원칙을 지켜주세요',
    '복합 운동(스쿼트, 데드리프트)을 먼저 하세요',
    '주 3-4회, 근육별 충분한 휴식을 주세요',
  ],
  cardio: [
    '심박수 130-150bpm을 유지하세요',
    '20분 이상 지속하면 지방 연소 효과가 높아요',
    '인터벌 트레이닝으로 효율을 높이세요',
    '충분한 수분 섭취를 잊지 마세요',
  ],
  flexibility: [
    '운동 전 동적 스트레칭, 후 정적 스트레칭이 좋아요',
    '각 스트레칭 동작은 15-30초 유지하세요',
    '통증이 느껴지면 즉시 멈추세요',
    '매일 10분씩 꾸준히 하는 게 중요해요',
  ],
  weight_loss: [
    '유산소와 근력 운동을 병행하세요',
    '식이 조절과 함께 하면 효과가 배가 돼요',
    '무리한 감량보다 주 0.5-1kg 목표로 하세요',
    'HIIT 운동이 칼로리 소모에 효과적이에요',
  ],
  muscle_gain: [
    '단백질 섭취를 충분히 하세요 (체중 1kg당 1.6-2.2g)',
    '운동 후 30분 내 영양 보충이 중요해요',
    '수면을 7-8시간 충분히 취하세요',
    '근육별 48-72시간 휴식을 주세요',
  ],
};

/** 의도별 팁 */
const INTENT_TIPS: Record<WorkoutIntent, string[]> = {
  today: ['오늘 컨디션에 맞는 운동을 선택하세요', '준비운동 5-10분은 필수예요'],
  muscle: ['정확한 자세가 부상 예방에 중요해요', '호흡을 의식하면서 운동하세요'],
  cardio: ['천천히 시작해서 점점 강도를 높이세요', '운동 전후 수분 섭취를 충분히 하세요'],
  stretch: ['부드럽게 늘려주세요, 반동은 금물이에요', '호흡을 내쉬면서 스트레칭하세요'],
  home: ['요가매트 하나로 다양한 운동이 가능해요', '맨몸 운동도 효과적이에요'],
  recommendation: ['체력 수준에 맞는 운동을 선택하세요', '목표에 맞는 운동을 추천해드릴게요'],
  general: ['규칙적인 운동 습관이 가장 중요해요', '무리하지 말고 꾸준히 하세요'],
};

// ============================================
// 운동 DB → RAG 변환 함수
// ============================================

/**
 * Exercise 카테고리 → RAG 카테고리 매핑
 * DB: 'upper' | 'lower' | 'core' | 'cardio'
 * RAG: 'strength' | 'cardio' | 'core' | 'hiit' | 'flexibility'
 */
function mapCategoryToRAG(category: string): string {
  const mapping: Record<string, string> = {
    upper: 'strength',
    lower: 'strength',
    core: 'core',
    cardio: 'cardio',
  };
  return mapping[category] || 'general';
}

/**
 * BodyPart → 한국어 부위명 매핑
 */
function mapBodyPartsToKorean(bodyParts: string[]): string[] {
  const mapping: Record<string, string> = {
    chest: '가슴',
    back: '등',
    shoulder: '어깨',
    arm: '팔',
    thigh: '허벅지',
    calf: '종아리',
    hip: '엉덩이',
    abs: '복근',
    waist: '허리',
  };
  return bodyParts.map((part) => mapping[part] || part);
}

/**
 * Exercise → ExerciseRecommendation 변환
 */
function convertToRecommendation(exercise: Exercise): ExerciseRecommendation {
  // 예상 운동 시간 (기본 15분, 카테고리별 조정)
  const durationMap: Record<string, number> = {
    upper: 15,
    lower: 15,
    core: 10,
    cardio: 30,
  };
  const duration = durationMap[exercise.category] || 15;

  // 칼로리 계산 (MET * 체중(60kg 기준) * 시간(분) / 60)
  const calories = Math.round(exercise.met * 60 * (duration / 60));

  return {
    id: exercise.id,
    name: exercise.name,
    category: mapCategoryToRAG(exercise.category),
    targetMuscle: mapBodyPartsToKorean(exercise.bodyParts),
    difficulty: exercise.difficulty,
    duration,
    calories,
    matchScore: 0, // 나중에 계산
    matchReason: '',
    equipment: exercise.equipment,
  };
}

/**
 * 운동 DB에서 RAG용 운동 목록 가져오기
 */
function getExercisesForRAG(): ExerciseRecommendation[] {
  const exercises = getAllExercises();
  return exercises.map(convertToRecommendation);
}

/**
 * 운동 필터링 (목표/의도 기반)
 *
 * @param exercises - 전체 운동 목록
 * @param goal - 사용자 운동 목표
 * @param intent - 질문 의도
 * @returns 필터링된 운동 목록
 */
function filterExercisesByGoal(
  exercises: ExerciseRecommendation[],
  goal: WorkoutGoal | null,
  intent: WorkoutIntent
): ExerciseRecommendation[] {
  let filtered = exercises;

  if (goal) {
    switch (goal) {
      case 'strength':
      case 'muscle_gain':
        // 근력: strength, core 카테고리
        filtered = exercises.filter((e) => e.category === 'strength' || e.category === 'core');
        break;
      case 'cardio':
      case 'weight_loss':
        // 유산소/다이어트: cardio, 또는 고칼로리 운동
        filtered = exercises.filter((e) => e.category === 'cardio' || e.calories > 150);
        break;
      case 'flexibility':
        // 유연성: core (스트레칭류 포함) 또는 저강도 운동
        filtered = exercises.filter(
          (e) => e.category === 'core' || e.difficulty === 'beginner'
        );
        break;
    }
  }

  // 의도에 따른 추가 필터링
  switch (intent) {
    case 'home':
      // 홈트: 장비 없는 운동만
      filtered = filtered.filter((e) => !e.equipment || e.equipment.length === 0);
      break;
    case 'stretch':
      // 스트레칭: 저강도, 코어 카테고리
      filtered = filtered.filter(
        (e) => e.difficulty === 'beginner' || e.category === 'core'
      );
      break;
    case 'muscle':
      // 근육: 근력 운동
      filtered = filtered.filter((e) => e.category === 'strength');
      break;
    case 'cardio':
      // 유산소: cardio 카테고리
      filtered = filtered.filter((e) => e.category === 'cardio');
      break;
  }

  return filtered.length > 0 ? filtered : exercises;
}

/** 운동 기반 검색 */
export async function searchWorkoutItems(
  userContext: UserContext | null,
  query: string,
  userId?: string
): Promise<WorkoutSearchResult> {
  try {
    const goal = detectWorkoutGoal(query) || (userContext?.workout?.goal as WorkoutGoal) || null;
    const intent = analyzeWorkoutIntent(query);

    const result: WorkoutSearchResult = {
      hasWorkoutPlan: false,
      todayWorkout: null,
      recommendations: [],
      goalTips: goal ? GOAL_TIPS[goal] : INTENT_TIPS[intent],
      recentProgress: null,
    };

    // userId가 있으면 운동 계획/기록에서 검색
    if (userId) {
      const supabase = createClerkSupabaseClient();

      // 오늘의 운동 계획 조회
      // today는 향후 날짜별 필터링에 사용 예정: new Date().toISOString().split('T')[0]
      const { data: workoutPlan, error: planError } = await supabase
        .from('workout_plans')
        .select('id, exercises, frequency')
        .eq('clerk_user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        coachLogger.error('[WorkoutRAG] DB query error:', planError);
      }

      if (workoutPlan) {
        result.hasWorkoutPlan = true;

        // 운동 계획에서 오늘의 운동 추출
        const exercises = workoutPlan.exercises as Array<{
          name: string;
          category?: string;
          sets?: number;
          reps?: number;
        }>;
        if (exercises && exercises.length > 0) {
          // 요일별 운동 선택 (간단한 로직)
          const dayOfWeek = new Date().getDay();
          const todayExercise = exercises[dayOfWeek % exercises.length];

          result.todayWorkout = {
            id: 'today',
            name: todayExercise.name,
            category: todayExercise.category || 'general',
            targetMuscle: [],
            difficulty: 'intermediate',
            duration: 30,
            calories: 200,
            matchScore: 95,
            matchReason: '오늘 예정된 운동',
            equipment: [],
          };
        }
      }

      // 최근 운동 기록 조회
      const { data: recentLogs, error: logError } = await supabase
        .from('workout_logs')
        .select('exercise_name, completed_at, duration_minutes')
        .eq('clerk_user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (!logError && recentLogs && recentLogs.length > 0) {
        const totalMinutes = recentLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
        result.recentProgress = `최근 운동: ${recentLogs[0].exercise_name} (${totalMinutes}분 누적)`;
      }
    }

    // 추천 운동 생성 (실제 운동 DB에서 가져오기)
    const allExercisesForRAG = getExercisesForRAG();
    const filtered = filterExercisesByGoal(allExercisesForRAG, goal, intent);

    result.recommendations = filtered
      .map((exercise) => {
        let score = 50;
        const reasons: string[] = [];

        // 목표 매칭
        if (goal) {
          if ((goal === 'strength' || goal === 'muscle_gain') && exercise.category === 'strength') {
            score += 30;
            reasons.push('근력 강화 목표에 적합');
          }
          if ((goal === 'cardio' || goal === 'weight_loss') && exercise.category === 'cardio') {
            score += 30;
            reasons.push('유산소/다이어트 목표에 적합');
          }
          if (goal === 'flexibility' && exercise.category === 'flexibility') {
            score += 30;
            reasons.push('유연성 향상 목표에 적합');
          }
        }

        // 난이도 기반 점수 (초보자면 쉬운 운동 우선)
        if (userContext?.workout?.fitnessLevel === 'beginner') {
          if (exercise.difficulty === 'beginner') {
            score += 15;
            reasons.push('초보자에게 적합');
          }
        }

        // 홈트 의도면 장비 없는 운동 우선
        if (intent === 'home' && (!exercise.equipment || exercise.equipment.length === 0)) {
          score += 20;
          reasons.push('장비 없이 가능');
        }

        return {
          ...exercise,
          matchScore: Math.min(score, 100),
          matchReason: reasons.join(', ') || '기본 추천',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    return result;
  } catch (error) {
    coachLogger.error('[WorkoutRAG] Search error:', error);
    return {
      hasWorkoutPlan: false,
      todayWorkout: null,
      recommendations: [],
      goalTips: ['규칙적인 운동 습관을 만들어보세요!'],
      recentProgress: null,
    };
  }
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatWorkoutForPrompt(result: WorkoutSearchResult): string {
  if (result.recommendations.length === 0 && !result.todayWorkout) {
    if (result.goalTips.length > 0) {
      let context = '\n\n## 운동 팁\n';
      result.goalTips.forEach((tip) => {
        context += `- ${tip}\n`;
      });
      return context;
    }
    return '';
  }

  let context = '\n\n## 운동 추천\n';

  // 최근 운동 진행 상황
  if (result.recentProgress) {
    context += `\n### 최근 활동\n${result.recentProgress}\n`;
  }

  // 오늘의 운동
  if (result.todayWorkout) {
    context += `\n### 오늘의 운동\n`;
    context += `**${result.todayWorkout.name}** (${result.todayWorkout.duration}분)\n`;
    context += `- ${result.todayWorkout.matchReason}\n`;
    context += '\n';
  }

  // 추천 운동
  if (result.recommendations.length > 0) {
    context += '\n### 추천 운동\n';
    result.recommendations.forEach((exercise, i) => {
      context += `${i + 1}. ${exercise.name}\n`;
      context += `   - 카테고리: ${exercise.category}\n`;
      context += `   - 시간: ${exercise.duration}분 | 칼로리: ${exercise.calories}kcal\n`;
      context += `   - 난이도: ${exercise.difficulty}\n`;
      context += `   - 매칭률: ${exercise.matchScore}%\n`;
      if (exercise.matchReason) {
        context += `   - ${exercise.matchReason}\n`;
      }
      if (exercise.targetMuscle.length > 0) {
        context += `   - 타겟: ${exercise.targetMuscle.join(', ')}\n`;
      }
    });
  }

  // 운동 팁
  if (result.goalTips.length > 0) {
    context += '\n### 운동 팁\n';
    result.goalTips.forEach((tip) => {
      context += `- ${tip}\n`;
    });
  }

  return context;
}
