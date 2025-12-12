/**
 * 연예인 루틴 매칭 로직 (Task 4.4)
 *
 * 사용자의 체형과 퍼스널 컬러에 맞는 연예인 루틴을 매칭합니다.
 * Task 6.3: 캐싱 최적화 적용
 */

import {
  Celebrity,
  BodyType,
  PersonalColorSeason,
  CelebrityMatchResult,
  CelebrityMatchOptions,
  CelebrityMatchType,
  RoutineType,
} from '@/types/workout';
import { getAllCelebrities } from './celebrities';
import { celebrityCache, createCacheKey } from './cache';

// 체형 타입 한글 레이블
const BODY_TYPE_LABELS: Record<BodyType, string> = {
  X: 'X자',
  A: 'A자',
  V: 'V자',
  H: 'H자',
  O: 'O자',
  I: 'I자',
  Y: 'Y자',
  '8': '8자',
};

// PC 타입 한글 레이블
const PC_LABELS: Record<PersonalColorSeason, string> = {
  Spring: '봄 웜',
  Summer: '여름 쿨',
  Autumn: '가을 웜',
  Winter: '겨울 쿨',
};

/**
 * 매칭 점수 계산
 * - 정확 매칭 (체형+PC): 100점
 * - 체형만 매칭: 70점
 * - PC만 매칭: 50점
 */
function calculateMatchScore(matchType: CelebrityMatchType): number {
  switch (matchType) {
    case 'exact':
      return 100;
    case 'bodyType':
      return 70;
    case 'personalColor':
      return 50;
    default:
      return 0;
  }
}

/**
 * 매칭 이유 텍스트 생성
 */
function generateMatchReason(
  celebrity: Celebrity,
  userBodyType: BodyType,
  userPC: PersonalColorSeason,
  matchType: CelebrityMatchType
): string {
  const bodyTypeLabel = BODY_TYPE_LABELS[celebrity.bodyType];
  const pcLabel = PC_LABELS[celebrity.personalColor];

  switch (matchType) {
    case 'exact':
      return `같은 ${bodyTypeLabel} 체형 + ${pcLabel} 타입`;
    case 'bodyType':
      return `같은 ${bodyTypeLabel} 체형`;
    case 'personalColor':
      return `같은 ${pcLabel} 타입`;
    default:
      return '';
  }
}

/**
 * 연예인 루틴 매칭 (캐싱 적용)
 *
 * @param bodyType - 사용자 체형
 * @param personalColor - 사용자 퍼스널 컬러
 * @param options - 매칭 옵션
 * @returns 매칭된 연예인 결과 배열 (점수 순 정렬)
 */
export function matchCelebrityRoutines(
  bodyType: BodyType,
  personalColor: PersonalColorSeason,
  options: CelebrityMatchOptions = {}
): CelebrityMatchResult[] {
  const {
    limit = 5,
    category,
    routineType,
    includePartialMatch = true,
  } = options;

  // 캐시 키 생성
  const cacheKey = createCacheKey(
    'celebrity-match',
    bodyType,
    personalColor,
    limit,
    category,
    routineType,
    includePartialMatch
  );

  // 캐시에서 조회
  const cached = celebrityCache.get(cacheKey) as CelebrityMatchResult[] | undefined;
  if (cached) {
    return cached;
  }

  const celebrities = getAllCelebrities();
  const results: CelebrityMatchResult[] = [];

  for (const celebrity of celebrities) {
    // 카테고리 필터
    if (category && celebrity.category !== category) {
      continue;
    }

    // 루틴 타입 필터
    if (routineType) {
      const hasRoutineType = celebrity.routines.some(
        (r) => r.type === routineType
      );
      if (!hasRoutineType) {
        continue;
      }
    }

    // 매칭 타입 결정
    const isBodyTypeMatch = celebrity.bodyType === bodyType;
    const isPCMatch = celebrity.personalColor === personalColor;

    let matchType: CelebrityMatchType | null = null;

    if (isBodyTypeMatch && isPCMatch) {
      matchType = 'exact';
    } else if (isBodyTypeMatch && includePartialMatch) {
      matchType = 'bodyType';
    } else if (isPCMatch && includePartialMatch) {
      matchType = 'personalColor';
    }

    // 매칭되지 않으면 스킵
    if (!matchType) {
      continue;
    }

    // 추천 루틴 선택 (루틴 타입 필터 적용 또는 첫 번째)
    let recommendedRoutine = celebrity.routines[0] || null;
    if (routineType) {
      recommendedRoutine =
        celebrity.routines.find((r) => r.type === routineType) ||
        recommendedRoutine;
    }

    results.push({
      celebrity,
      matchType,
      matchScore: calculateMatchScore(matchType),
      matchReason: generateMatchReason(
        celebrity,
        bodyType,
        personalColor,
        matchType
      ),
      recommendedRoutine,
    });
  }

  // 점수 순 정렬 (높은 점수 우선)
  results.sort((a, b) => b.matchScore - a.matchScore);

  const finalResults = results.slice(0, limit);

  // 결과 캐싱 (30분간 유지)
  celebrityCache.set(cacheKey, finalResults);

  return finalResults;
}

/**
 * 정확히 일치하는 연예인만 찾기
 */
export function findExactMatchCelebrities(
  bodyType: BodyType,
  personalColor: PersonalColorSeason,
  limit: number = 5
): CelebrityMatchResult[] {
  return matchCelebrityRoutines(bodyType, personalColor, {
    limit,
    includePartialMatch: false,
  });
}

/**
 * 특정 루틴 타입으로 연예인 매칭
 */
export function matchCelebritiesByRoutineType(
  bodyType: BodyType,
  personalColor: PersonalColorSeason,
  routineType: RoutineType,
  limit: number = 5
): CelebrityMatchResult[] {
  return matchCelebrityRoutines(bodyType, personalColor, {
    limit,
    routineType,
    includePartialMatch: true,
  });
}

/**
 * 매칭 결과에서 추천 문구 생성
 * 예: "X자 체형 + 여름 쿨 타입 연예인의 운동법"
 */
export function generateMatchingTitle(
  bodyType: BodyType,
  personalColor: PersonalColorSeason
): string {
  const bodyTypeLabel = BODY_TYPE_LABELS[bodyType];
  const pcLabel = PC_LABELS[personalColor];
  return `${bodyTypeLabel} 체형 + ${pcLabel} 타입 연예인의 운동법`;
}

/**
 * 연예인 카드용 표시 텍스트 생성
 */
export function generateCelebrityDisplayInfo(celebrity: Celebrity): {
  name: string;
  group: string | null;
  bodyType: string;
  personalColor: string;
  routineTypes: string[];
} {
  const routineTypes = celebrity.routines.map((r) => {
    const typeLabels: Record<RoutineType, string> = {
      PILATES: '필라테스',
      WEIGHT: '웨이트',
      CARDIO: '유산소',
      YOGA: '요가',
      DANCE: '댄스',
      HOME: '홈트',
    };
    return typeLabels[r.type];
  });

  return {
    name: celebrity.name,
    group: celebrity.group || null,
    bodyType: BODY_TYPE_LABELS[celebrity.bodyType],
    personalColor: PC_LABELS[celebrity.personalColor],
    routineTypes: [...new Set(routineTypes)], // 중복 제거
  };
}

/**
 * 매칭 결과가 없을 때 대안 추천
 */
export function getAlternativeRecommendations(
  bodyType: BodyType,
  personalColor: PersonalColorSeason,
  limit: number = 3
): CelebrityMatchResult[] {
  // 부분 매칭만으로 추천
  const bodyTypeMatches = matchCelebrityRoutines(bodyType, personalColor, {
    limit: limit * 2,
    includePartialMatch: true,
  });

  // 정확 매칭이 없으면 부분 매칭 반환
  const exactMatches = bodyTypeMatches.filter((r) => r.matchType === 'exact');
  if (exactMatches.length === 0) {
    return bodyTypeMatches.slice(0, limit);
  }

  return exactMatches.slice(0, limit);
}

/**
 * 연예인 매칭 통계
 */
export function getMatchingStats(
  bodyType: BodyType,
  personalColor: PersonalColorSeason
): {
  exactCount: number;
  bodyTypeCount: number;
  pcCount: number;
  totalAvailable: number;
} {
  const allResults = matchCelebrityRoutines(bodyType, personalColor, {
    limit: 100,
    includePartialMatch: true,
  });

  return {
    exactCount: allResults.filter((r) => r.matchType === 'exact').length,
    bodyTypeCount: allResults.filter((r) => r.matchType === 'bodyType').length,
    pcCount: allResults.filter((r) => r.matchType === 'personalColor').length,
    totalAvailable: getAllCelebrities().length,
  };
}
