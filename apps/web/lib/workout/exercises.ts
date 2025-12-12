import { Exercise } from '@/types/workout';
import { workoutCache, createCacheKey } from '@/lib/cache';
import upperBodyExercises from '@/data/exercises/upper-body.json';
import lowerCoreCadioExercises from '@/data/exercises/lower-core-cardio.json';

// 모든 운동 데이터 합치기
const allExercises: Exercise[] = [
  ...(upperBodyExercises as Exercise[]),
  ...(lowerCoreCadioExercises as Exercise[]),
];

// 카테고리별 운동 캐시 (빌드 타임에 생성)
const exercisesByCategory = new Map<string, Exercise[]>();
allExercises.forEach((ex) => {
  const existing = exercisesByCategory.get(ex.category) || [];
  existing.push(ex);
  exercisesByCategory.set(ex.category, existing);
});

// ID로 빠른 조회를 위한 인덱스
const exerciseById = new Map<string, Exercise>(
  allExercises.map((ex) => [ex.id, ex])
);

/**
 * ID로 운동 찾기 (O(1) 인덱스 조회)
 */
export function getExerciseById(id: string): Exercise | undefined {
  return exerciseById.get(id);
}

/**
 * 모든 운동 가져오기
 */
export function getAllExercises(): Exercise[] {
  return allExercises;
}

/**
 * 카테고리별 운동 가져오기 (O(1) 인덱스 조회)
 */
export function getExercisesByCategory(category: string): Exercise[] {
  return exercisesByCategory.get(category) || [];
}

// 운동 타입에 따른 카테고리 우선순위 (상수화)
const CATEGORY_PRIORITY: Record<string, string[]> = {
  toner: ['upper', 'lower', 'core'],
  builder: ['upper', 'lower'],
  burner: ['cardio', 'lower', 'core'],
  mover: ['cardio', 'lower'],
  flexer: ['core', 'lower', 'upper'],
};

// 신체 고민에 따른 부위 매핑 (상수화)
const CONCERN_TO_BODY_PARTS: Record<string, string[]> = {
  belly: ['abs', 'waist'],
  thigh: ['thigh'],
  arm: ['arm'],
  back: ['back'],
  hip: ['hip'],
  calf: ['calf'],
  shoulder: ['shoulder'],
  overall: ['chest', 'back', 'abs', 'thigh'],
};

/**
 * 운동 타입에 맞는 추천 운동 가져오기 (캐싱 적용)
 * @param workoutType 운동 타입 (toner, builder, burner, mover, flexer)
 * @param concerns 신체 고민 (belly, thigh, arm 등)
 * @param limit 최대 개수
 */
export function getRecommendedExercises(
  workoutType: string,
  concerns: string[] = [],
  limit = 10
): Exercise[] {
  // 캐시 키 생성
  const cacheKey = createCacheKey('recommended', workoutType, concerns, limit);

  // 캐시에서 조회
  const cached = workoutCache.get(cacheKey) as Exercise[] | undefined;
  if (cached) {
    return cached;
  }

  // 관련 부위 추출
  const targetBodyParts = concerns.flatMap((c) => CONCERN_TO_BODY_PARTS[c] || []);

  // 점수 계산 함수
  const scoreExercise = (ex: Exercise): number => {
    let score = 0;

    // 카테고리 우선순위 점수
    const priorities = CATEGORY_PRIORITY[workoutType] || [];
    const categoryIndex = priorities.indexOf(ex.category);
    if (categoryIndex >= 0) {
      score += (priorities.length - categoryIndex) * 10;
    }

    // 타겟 부위 일치 점수
    const matchingParts = ex.bodyParts.filter((p) => targetBodyParts.includes(p));
    score += matchingParts.length * 5;

    // 난이도 균형 (beginner 우선)
    if (ex.difficulty === 'beginner') score += 3;
    if (ex.difficulty === 'intermediate') score += 2;
    if (ex.difficulty === 'advanced') score += 1;

    return score;
  };

  // 점수순 정렬 후 상위 N개 반환
  const result = [...allExercises]
    .map((ex) => ({ ex, score: scoreExercise(ex) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ ex }) => ex);

  // 결과 캐싱 (10분간 유지)
  workoutCache.set(cacheKey, result);

  return result;
}

/**
 * 대체 운동 가져오기
 * 같은 부위를 타겟으로 하는 유사한 운동 추천
 * @param exercise 현재 운동
 * @param limit 최대 개수
 */
export function getAlternativeExercises(
  exercise: Exercise,
  limit = 3
): Exercise[] {
  return allExercises
    .filter((ex) => {
      // 자기 자신 제외
      if (ex.id === exercise.id) return false;

      // 같은 카테고리 또는 타겟 부위가 겹치는 운동
      const sameCategoryOrParts =
        ex.category === exercise.category ||
        ex.bodyParts.some((part) => exercise.bodyParts.includes(part));

      return sameCategoryOrParts;
    })
    .sort((a, b) => {
      // 부위 일치도가 높은 순
      const aMatch = a.bodyParts.filter((p) => exercise.bodyParts.includes(p)).length;
      const bMatch = b.bodyParts.filter((p) => exercise.bodyParts.includes(p)).length;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
