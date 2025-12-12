/**
 * 연예인 DB 유틸리티 (Task 4.3)
 *
 * 연예인 루틴 데이터를 로드하고 필터링하는 함수들
 */

import { Celebrity, BodyType, PersonalColorSeason, CelebrityCategory } from '@/types/workout';
import celebritiesData from '@/data/celebrities/celebrities.json';

// 타입 캐스팅 (JSON은 리터럴 타입을 추론하지 못함)
const celebrities: Celebrity[] = celebritiesData as Celebrity[];

/**
 * 모든 연예인 데이터 가져오기
 */
export function getAllCelebrities(): Celebrity[] {
  return celebrities.filter((celeb) => celeb.isActive);
}

/**
 * ID로 연예인 찾기
 */
export function getCelebrityById(id: string): Celebrity | undefined {
  return celebrities.find((celeb) => celeb.id === id && celeb.isActive);
}

/**
 * 체형으로 연예인 필터링
 */
export function getCelebritiesByBodyType(bodyType: BodyType): Celebrity[] {
  return celebrities.filter(
    (celeb) => celeb.bodyType === bodyType && celeb.isActive
  );
}

/**
 * 퍼스널 컬러로 연예인 필터링
 */
export function getCelebritiesByPersonalColor(
  personalColor: PersonalColorSeason
): Celebrity[] {
  return celebrities.filter(
    (celeb) => celeb.personalColor === personalColor && celeb.isActive
  );
}

/**
 * 카테고리로 연예인 필터링
 */
export function getCelebritiesByCategory(
  category: CelebrityCategory
): Celebrity[] {
  return celebrities.filter(
    (celeb) => celeb.category === category && celeb.isActive
  );
}

/**
 * 체형 + 퍼스널 컬러로 연예인 매칭
 * (사용자와 같은 체형+PC 타입 연예인 찾기)
 */
export function getMatchingCelebrities(
  bodyType: BodyType,
  personalColor: PersonalColorSeason
): Celebrity[] {
  return celebrities.filter(
    (celeb) =>
      celeb.bodyType === bodyType &&
      celeb.personalColor === personalColor &&
      celeb.isActive
  );
}

/**
 * 체형 또는 퍼스널 컬러가 일치하는 연예인 찾기
 * (정확히 일치하는 연예인이 없을 때 사용)
 */
export function getSimilarCelebrities(
  bodyType: BodyType,
  personalColor: PersonalColorSeason,
  limit: number = 5
): Celebrity[] {
  // 1순위: 체형+PC 모두 일치
  const exactMatch = getMatchingCelebrities(bodyType, personalColor);
  if (exactMatch.length >= limit) {
    return exactMatch.slice(0, limit);
  }

  // 2순위: 체형만 일치
  const bodyTypeMatch = getCelebritiesByBodyType(bodyType).filter(
    (celeb) => !exactMatch.includes(celeb)
  );

  // 3순위: PC만 일치
  const pcMatch = getCelebritiesByPersonalColor(personalColor).filter(
    (celeb) => !exactMatch.includes(celeb) && !bodyTypeMatch.includes(celeb)
  );

  return [...exactMatch, ...bodyTypeMatch, ...pcMatch].slice(0, limit);
}

/**
 * 랜덤 연예인 추천 (카테고리별)
 */
export function getRandomCelebrities(count: number = 3): Celebrity[] {
  const activeCelebrities = getAllCelebrities();
  const shuffled = [...activeCelebrities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 연예인 통계 정보
 */
export function getCelebrityStats(): {
  total: number;
  byCategory: Record<CelebrityCategory, number>;
  byBodyType: Record<string, number>;
  byPersonalColor: Record<string, number>;
} {
  const activeCelebrities = getAllCelebrities();

  const byCategory = activeCelebrities.reduce(
    (acc, celeb) => {
      acc[celeb.category] = (acc[celeb.category] || 0) + 1;
      return acc;
    },
    {} as Record<CelebrityCategory, number>
  );

  const byBodyType = activeCelebrities.reduce(
    (acc, celeb) => {
      acc[celeb.bodyType] = (acc[celeb.bodyType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const byPersonalColor = activeCelebrities.reduce(
    (acc, celeb) => {
      acc[celeb.personalColor] = (acc[celeb.personalColor] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: activeCelebrities.length,
    byCategory,
    byBodyType,
    byPersonalColor,
  };
}
