/**
 * 콘텐츠 적응 모듈
 *
 * 성별 적응형 용어, 제품 카테고리 필터링, 액세서리 추천
 *
 * @module lib/content
 */

// ─── 타입 ────────────────────────────────────────────

export type GenderPreference = 'male' | 'female' | 'neutral';
export type StylePreference = 'masculine' | 'feminine' | 'unisex';

export interface UserGenderProfile {
  gender: GenderPreference;
  stylePreference: StylePreference;
}

export interface AccessoryRecommendation {
  category: string;
  items: string[];
  season: string;
}

// ─── 성별 적응형 용어 ───────────────────────────────

const ADAPTIVE_TERMS: Record<string, Record<GenderPreference, string>> = {
  화사한: { female: '화사한', male: '깔끔한', neutral: '밝은' },
  여성스러운: { female: '여성스러운', male: '세련된', neutral: '우아한' },
  귀여운: { female: '귀여운', male: '캐주얼한', neutral: '편안한' },
  섹시한: { female: '섹시한', male: '시크한', neutral: '매력적인' },
  단정한: { female: '단정한', male: '단정한', neutral: '단정한' },
  화려한: { female: '화려한', male: '임팩트 있는', neutral: '눈에 띄는' },
};

/**
 * 성별에 맞게 용어 적응
 */
export function getGenderAdaptiveTerm(
  term: string,
  gender: GenderPreference
): string {
  return ADAPTIVE_TERMS[term]?.[gender] ?? term;
}

// ─── 제품 카테고리 필터링 ────────────────────────────

const EXCLUDED_CATEGORIES: Record<GenderPreference, string[]> = {
  male: ['lipstick', 'blush', 'eyeshadow_palette', 'nail_polish'],
  female: ['tie', 'cufflinks', 'beard_oil'],
  neutral: [],
};

/**
 * 성별에 맞게 카테고리 필터링
 */
export function filterCategoriesByGender(
  categories: string[],
  gender: GenderPreference
): string[] {
  const excluded = EXCLUDED_CATEGORIES[gender] ?? [];
  return categories.filter((cat) => !excluded.includes(cat));
}

/**
 * 제품 카테고리 한국어 라벨
 */
export function getProductCategoryLabel(
  category: string,
  gender: GenderPreference
): string {
  const labels: Record<string, Record<GenderPreference, string>> = {
    moisturizer: { female: '수분크림', male: '수분크림', neutral: '수분크림' },
    sunscreen: { female: '선크림', male: '선크림', neutral: '선크림' },
    cleanser: { female: '클렌저', male: '클렌저', neutral: '클렌저' },
    toner: { female: '토너', male: '토너', neutral: '토너' },
    serum: { female: '세럼', male: '에센스', neutral: '세럼' },
    fragrance: { female: '향수', male: '코롱', neutral: '향수' },
  };

  return labels[category]?.[gender] ?? category;
}

/**
 * 스타일 섹션 제목
 */
export function getStyleSectionTitle(
  section: string,
  gender: GenderPreference
): string {
  const titles: Record<string, Record<GenderPreference, string>> = {
    recommended: {
      female: '추천 스타일',
      male: '추천 스타일',
      neutral: '추천 스타일',
    },
    accessories: {
      female: '액세서리 추천',
      male: '소품 추천',
      neutral: '액세서리 추천',
    },
    colors: {
      female: '어울리는 색상',
      male: '어울리는 색상',
      neutral: '어울리는 색상',
    },
  };

  return titles[section]?.[gender] ?? section;
}

// ─── 액세서리 추천 ───────────────────────────────────

const ACCESSORY_RECOMMENDATIONS: Record<
  GenderPreference,
  Record<string, string[]>
> = {
  female: {
    spring: ['스카프', '가벼운 목걸이', '토트백', '뮬'],
    summer: ['선글라스', '라피아 모자', '미니백', '샌들'],
    autumn: ['베레모', '체인 목걸이', '숄더백', '로퍼'],
    winter: ['머플러', '가죽 장갑', '크로스백', '첼시 부츠'],
  },
  male: {
    spring: ['캡 모자', '시계', '백팩', '스니커즈'],
    summer: ['선글라스', '버킷햇', '크로스백', '슬리퍼'],
    autumn: ['비니', '시계', '토트백', '부츠'],
    winter: ['머플러', '가죽 장갑', '메신저백', '워커'],
  },
  neutral: {
    spring: ['캡 모자', '미니멀 목걸이', '토트백', '로퍼'],
    summer: ['선글라스', '버킷햇', '에코백', '스니커즈'],
    autumn: ['베레모', '레이어드 목걸이', '숄더백', '첼시 부츠'],
    winter: ['머플러', '니트 장갑', '크로스백', '패딩 부츠'],
  },
};

/**
 * 성별/시즌별 액세서리 추천
 */
export function getAccessoryRecommendations(
  gender: GenderPreference,
  season?: string
): AccessoryRecommendation[] {
  const recs = ACCESSORY_RECOMMENDATIONS[gender] ?? ACCESSORY_RECOMMENDATIONS.neutral;

  if (season) {
    const items = recs[season];
    return items ? [{ category: '액세서리', items, season }] : [];
  }

  return Object.entries(recs).map(([s, items]) => ({
    category: '액세서리',
    items,
    season: s,
  }));
}

// ─── 프로필 유틸리티 ─────────────────────────────────

/**
 * 유효한 성별 프로필인지 검증
 */
export function isValidGenderProfile(profile: unknown): profile is UserGenderProfile {
  if (typeof profile !== 'object' || profile === null) return false;
  const p = profile as Record<string, unknown>;
  return (
    ['male', 'female', 'neutral'].includes(p.gender as string) &&
    ['masculine', 'feminine', 'unisex'].includes(p.stylePreference as string)
  );
}

/**
 * 기본 성별 프로필
 */
export function createDefaultGenderProfile(): UserGenderProfile {
  return { gender: 'neutral', stylePreference: 'unisex' };
}
