/**
 * L-2-3: 목적별 운동 Best 5 생성기
 *
 * 사용자 목표와 프로필에 따라 최적의 운동 5개를 추천
 *
 * @see docs/SPEC-PHASE-L-M.md §3.2
 */

import { Exercise, BodyType } from '@/types/workout';
import { PostureType } from '@/lib/mock/posture-analysis';
import { getExerciseById, getAllExercises } from './exercises';

// 운동 목표
export type ExerciseGoal =
  | 'posture_correction' // 자세 교정
  | 'weight_loss' // 체중 감량
  | 'muscle_gain' // 근육 증가
  | 'flexibility' // 유연성
  | 'endurance'; // 지구력

// 운동 추천 결과
export interface ExerciseRecommendation {
  exercise: Exercise;
  reason: string; // 추천 이유
  priority: number; // 우선순위 점수 (높을수록 중요)
}

// Best 5 결과
export interface Best5Result {
  goal: ExerciseGoal;
  goalLabel: string;
  exercises: ExerciseRecommendation[];
  totalDuration: number; // 총 예상 소요 시간 (분)
  estimatedCalories: number; // 총 예상 소모 칼로리
  tips: string[]; // 목표별 운동 팁
}

// 자세 문제별 교정 운동 매핑 (운동 ID)
const POSTURE_EXERCISES: Record<PostureType, string[]> = {
  forward_head: [
    'neck-stretch',
    'chin-tuck',
    'upper-trap-stretch',
    'wall-angel',
    'thoracic-extension',
  ],
  rounded_shoulders: [
    'chest-stretch',
    'band-pull-apart',
    'face-pull',
    'external-rotation',
    'prone-y-raise',
  ],
  swayback: ['dead-bug', 'hip-flexor-stretch', 'glute-bridge', 'plank', 'bird-dog'],
  flatback: ['cat-cow', 'lumbar-extension', 'superman', 'child-pose', 'cobra'],
  lordosis: ['pelvic-tilt', 'glute-bridge', 'plank', 'dead-bug', 'hamstring-stretch'],
  ideal: ['full-body-stretch', 'light-cardio', 'yoga-flow', 'foam-rolling', 'breathing'],
};

// 목표별 추천 운동 ID (우선순위 높은 순)
const GOAL_EXERCISES: Record<ExerciseGoal, string[]> = {
  weight_loss: [
    'burpee',
    'mountain-climber',
    'jumping-jack',
    'high-knees',
    'squat-jump',
    'bicycle-crunch',
    'plank',
  ],
  muscle_gain: [
    'push-up',
    'pull-up',
    'squat',
    'deadlift',
    'bench-press',
    'shoulder-press',
    'dumbbell-row',
  ],
  flexibility: [
    'forward-fold',
    'pigeon-pose',
    'cat-cow',
    'child-pose',
    'downward-dog',
    'spinal-twist',
    'hamstring-stretch',
  ],
  endurance: [
    'running',
    'cycling',
    'rowing',
    'jump-rope',
    'burpee',
    'mountain-climber',
    'plank-hold',
  ],
  posture_correction: [], // 동적으로 자세 타입에 따라 결정
};

// 목표별 라벨
export const GOAL_LABELS: Record<ExerciseGoal, string> = {
  posture_correction: '자세 교정',
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  flexibility: '유연성',
  endurance: '지구력',
};

// 목표별 아이콘
export const GOAL_ICONS: Record<ExerciseGoal, string> = {
  posture_correction: '🧘',
  weight_loss: '🔥',
  muscle_gain: '💪',
  flexibility: '🤸',
  endurance: '🏃',
};

// 목표별 운동 팁
const GOAL_TIPS: Record<ExerciseGoal, string[]> = {
  posture_correction: [
    '운동 전후 스트레칭을 충분히 하세요',
    '자세 교정은 꾸준함이 핵심입니다',
    '거울을 보면서 정확한 자세로 운동하세요',
  ],
  weight_loss: [
    '유산소 운동은 20분 이상 지속하세요',
    '운동 전 가벼운 탄수화물 섭취를 권장해요',
    '일주일에 3-5회 규칙적으로 운동하세요',
  ],
  muscle_gain: [
    '근육 성장을 위해 충분한 단백질 섭취가 중요해요',
    '세트 간 60-90초 휴식을 취하세요',
    '점진적으로 무게를 늘려가세요',
  ],
  flexibility: [
    '무리하게 스트레칭하지 마세요',
    '호흡을 깊게 하면서 30초 이상 유지하세요',
    '따뜻한 상태에서 스트레칭이 더 효과적이에요',
  ],
  endurance: [
    '처음부터 무리하지 말고 점진적으로 강도를 높이세요',
    '운동 중 충분한 수분 섭취가 중요해요',
    '심박수를 체크하며 적정 강도를 유지하세요',
  ],
};

/**
 * 목적별 운동 Best 5 생성
 *
 * @param goal 운동 목표
 * @param userProfile 사용자 프로필 (선택)
 * @returns Best 5 추천 결과
 */
export function generateBest5(
  goal: ExerciseGoal,
  userProfile?: {
    postureType?: PostureType;
    bodyType?: BodyType;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): Best5Result {
  let exerciseIds: string[] = [];

  // 자세 교정 목표이고 자세 타입이 있으면 해당 자세 운동 선택
  if (goal === 'posture_correction' && userProfile?.postureType) {
    exerciseIds = POSTURE_EXERCISES[userProfile.postureType] || [];
  } else {
    exerciseIds = GOAL_EXERCISES[goal] || [];
  }

  // 모든 운동 데이터 가져오기
  const allExercises = getAllExercises();

  // 운동 ID로 운동 정보 조회 및 점수 계산
  const recommendations: ExerciseRecommendation[] = exerciseIds
    .map((id, index) => {
      // ID로 직접 찾기 시도
      let exercise = getExerciseById(id);

      // 없으면 이름으로 찾기 (fallback)
      if (!exercise) {
        exercise = allExercises.find(
          (ex) =>
            ex.id === id || ex.name.toLowerCase().includes(id.toLowerCase().replace(/-/g, ' '))
        );
      }

      if (!exercise) {
        return null;
      }

      // 우선순위 점수 (배열 순서 기반)
      const priority = exerciseIds.length - index;

      // 추천 이유 생성
      let reason = '';
      if (goal === 'posture_correction' && userProfile?.postureType) {
        reason = `${userProfile.postureType === 'ideal' ? '좋은 자세 유지' : '자세 교정'}에 효과적`;
      } else {
        reason = getRecommendationReason(exercise, goal, userProfile);
      }

      return {
        exercise,
        reason,
        priority,
      };
    })
    .filter((rec): rec is ExerciseRecommendation => rec !== null)
    .slice(0, 5); // 상위 5개만 선택

  // 부족하면 유사한 운동으로 채우기
  if (recommendations.length < 5) {
    const existingIds = new Set(recommendations.map((r) => r.exercise.id));
    const similarExercises = findSimilarExercises(goal, allExercises, userProfile).filter(
      (ex) => !existingIds.has(ex.id)
    );

    const needed = 5 - recommendations.length;
    for (let i = 0; i < needed && i < similarExercises.length; i++) {
      recommendations.push({
        exercise: similarExercises[i],
        reason: getRecommendationReason(similarExercises[i], goal, userProfile),
        priority: recommendations.length + 1,
      });
    }
  }

  // 총 소요 시간 및 칼로리 계산
  const totalDuration = recommendations.reduce((sum, _rec) => {
    // 기본 10분으로 가정 (운동마다 다를 수 있음)
    return sum + 10;
  }, 0);

  const estimatedCalories = recommendations.reduce((sum, rec) => {
    // 10분 기준 칼로리 (운동마다 caloriesPerMinute가 있으면 사용)
    const caloriesPerMinute = rec.exercise.caloriesPerMinute || 5;
    return sum + caloriesPerMinute * 10;
  }, 0);

  return {
    goal,
    goalLabel: GOAL_LABELS[goal],
    exercises: recommendations,
    totalDuration,
    estimatedCalories: Math.round(estimatedCalories),
    tips: GOAL_TIPS[goal],
  };
}

/**
 * 추천 이유 생성
 */
function getRecommendationReason(
  exercise: Exercise,
  goal: ExerciseGoal,
  userProfile?: {
    postureType?: PostureType;
    bodyType?: BodyType;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): string {
  const reasons: string[] = [];

  // 목표별 이유
  if (goal === 'weight_loss' && exercise.caloriesPerMinute > 8) {
    reasons.push('높은 칼로리 소모');
  }
  if (goal === 'muscle_gain' && exercise.category === 'upper') {
    reasons.push('상체 근력 강화');
  }
  if (goal === 'muscle_gain' && exercise.category === 'lower') {
    reasons.push('하체 근력 강화');
  }
  if (goal === 'flexibility' && exercise.style === 'stretching') {
    reasons.push('유연성 향상');
  }
  if (goal === 'endurance' && exercise.category === 'cardio') {
    reasons.push('심폐지구력 향상');
  }

  // 난이도 적합성
  if (userProfile?.fitnessLevel === 'beginner' && exercise.difficulty === 'beginner') {
    reasons.push('초보자에게 적합');
  }

  // 기본 이유
  if (reasons.length === 0) {
    reasons.push(`${exercise.category === 'cardio' ? '유산소' : exercise.category} 운동`);
  }

  return reasons.join(', ');
}

/**
 * 유사한 운동 찾기
 */
function findSimilarExercises(
  goal: ExerciseGoal,
  allExercises: Exercise[],
  userProfile?: {
    postureType?: PostureType;
    bodyType?: BodyType;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): Exercise[] {
  // 목표에 따른 카테고리 필터링
  const relevantCategories: string[] = [];
  if (goal === 'weight_loss' || goal === 'endurance') {
    relevantCategories.push('cardio', 'lower');
  }
  if (goal === 'muscle_gain') {
    relevantCategories.push('upper', 'lower', 'core');
  }
  if (goal === 'flexibility' || goal === 'posture_correction') {
    relevantCategories.push('core');
  }

  const filtered = allExercises.filter((ex) => {
    // 카테고리 필터
    if (relevantCategories.length > 0 && !relevantCategories.includes(ex.category)) {
      return false;
    }

    // 난이도 필터 (초보자는 beginner/intermediate만)
    if (userProfile?.fitnessLevel === 'beginner' && ex.difficulty === 'advanced') {
      return false;
    }

    return true;
  });

  // 점수 기반 정렬
  return filtered
    .map((ex) => ({
      exercise: ex,
      score: calculateExerciseScore(ex, goal, userProfile),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.exercise);
}

/**
 * 운동 점수 계산
 */
function calculateExerciseScore(
  exercise: Exercise,
  goal: ExerciseGoal,
  userProfile?: {
    postureType?: PostureType;
    bodyType?: BodyType;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): number {
  let score = 0;

  // 목표별 점수
  if (goal === 'weight_loss') {
    score += (exercise.caloriesPerMinute || 0) * 2;
    if (exercise.category === 'cardio') score += 10;
  }

  if (goal === 'muscle_gain') {
    if (exercise.category === 'upper' || exercise.category === 'lower') score += 10;
    if (exercise.equipment.length > 0) score += 5;
  }

  if (goal === 'flexibility') {
    if (exercise.style === 'stretching' || exercise.style === 'yoga') score += 15;
  }

  if (goal === 'endurance') {
    if (exercise.category === 'cardio') score += 10;
    if (exercise.met && exercise.met > 6) score += 5;
  }

  // 난이도 적합성
  if (userProfile?.fitnessLevel === 'beginner' && exercise.difficulty === 'beginner') {
    score += 5;
  }
  if (userProfile?.fitnessLevel === 'intermediate' && exercise.difficulty === 'intermediate') {
    score += 5;
  }
  if (userProfile?.fitnessLevel === 'advanced' && exercise.difficulty === 'advanced') {
    score += 5;
  }

  return score;
}
