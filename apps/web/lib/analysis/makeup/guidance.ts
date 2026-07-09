/**
 * M-1 메이크업 초보자 가이던스 유틸
 *
 * 창업자 피드백(W2) 대응:
 *  - 전문 용어 쉬운 풀이 (extractGlossaryTerms)
 *  - 상황별(데일리/풀메이크업) 팁 재구성 (buildSituationalTips) — 새 AI 없이 기존 추천 데이터 재사용
 *  - 보유 화장품 카테고리 감지 (detectMakeupShelfCategory) — "내 ○○ 활용" 배지용
 *
 * @module lib/analysis/makeup/guidance
 */

import type { MakeupAnalysisResult, ColorRecommendation } from '@/lib/mock/makeup-analysis';

// ColorRecommendation의 category와 동일 (메이크업 5개 카테고리)
export type MakeupShelfCategory = ColorRecommendation['category'];

// 상황별 팁 그룹 (makeupTips와 동일 형태 → 동일 UI로 렌더)
export interface MakeupTipGroup {
  category: string;
  tips: string[];
}

export interface SituationalMakeupTips {
  daily: MakeupTipGroup[];
  full: MakeupTipGroup[];
}

// ============================================================================
// 1. 전문 용어 쉬운 풀이
// ============================================================================

/**
 * 메이크업 전문 용어 → 초보자용 쉬운 설명
 *
 * 왜: "뉴트럴한 이목구비" 같은 AI/프리셋 요약 표현을 사용자가 이해 못 함.
 * 요약 텍스트를 스캔해 해당 용어의 쉬운 풀이를 병기한다.
 */
export const MAKEUP_TERM_GLOSSARY: Record<string, string> = {
  뉴트럴: '웜/쿨 어느 쪽도 아닌 중간 톤이에요',
  웜톤: '노란기가 도는 따뜻한 피부톤이에요',
  쿨톤: '붉은·푸른기가 도는 차가운 피부톤이에요',
  언더톤: '피부 속에서 비치는 기본 색조예요',
  컨투어링: '얼굴에 음영을 넣어 입체감을 주는 기법이에요',
  컨투어: '얼굴에 음영을 넣어 입체감을 주는 기법이에요',
  쉐딩: '어두운 색으로 음영을 넣어 갸름해 보이게 하는 기법이에요',
  하이라이터: '밝은 색으로 도드라지게 표현하는 제품이에요',
  하이라이트: '밝은 색으로 도드라지게 표현하는 부분이에요',
  그라데이션: '색을 번지듯 자연스럽게 이어 바르는 방법이에요',
  오버립: '원래 입술선보다 살짝 넓게 그려 도톰해 보이게 하는 기법이에요',
  프라이머: '메이크업 전 피부결·모공을 정돈하는 베이스 단계예요',
  T존: '이마와 코로 이어지는, 유분이 많은 부위예요',
  펄: '미세하게 반짝이는 입자예요',
  매트: '광 없이 매끈하게 마무리되는 질감이에요',
  MLBB: '내 입술 같은 자연스러운 색이에요 (My Lips But Better)',
};

export interface GlossaryHit {
  term: string;
  easy: string;
}

/**
 * 텍스트에서 전문 용어를 찾아 쉬운 풀이 목록을 반환 (등장 순서, 중복 제거)
 *
 * @param text 요약/인사이트 등 사용자 대면 텍스트
 */
export function extractGlossaryTerms(text: string | undefined | null): GlossaryHit[] {
  if (!text) return [];
  const hits: GlossaryHit[] = [];
  const seen = new Set<string>();
  // 텍스트 등장 위치 순으로 정렬해 자연스러운 순서 유지
  const found = Object.keys(MAKEUP_TERM_GLOSSARY)
    .map((term) => ({ term, idx: text.indexOf(term) }))
    .filter((t) => t.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  for (const { term } of found) {
    const easy = MAKEUP_TERM_GLOSSARY[term];
    // "컨투어링"과 "컨투어"처럼 설명이 같으면 한 번만 노출
    if (seen.has(easy)) continue;
    seen.add(easy);
    hits.push({ term, easy });
  }
  return hits;
}

// ============================================================================
// 2. 상황별(데일리 / 풀메이크업) 팁 재구성
// ============================================================================

// 카테고리별 첫 컬러 이름 (없으면 null)
function firstColorName(recs: ColorRecommendation[], category: MakeupShelfCategory): string | null {
  const group = recs.find((r) => r.category === category);
  return group?.colors[0]?.name ?? null;
}

/**
 * 기존 추천 색상·고민 데이터에서 상황별 메이크업 팁을 규칙 기반으로 재구성한다.
 *
 * - 데일리: 베이스 가볍게 + 립 중심
 * - 풀메이크업: 베이스 커버 + 아이 강조
 *
 * 왜: 새 AI 호출 없이(정직성) 이미 산출된 색/고민만 재배열해 상황별 안내를 제공.
 */
export function buildSituationalTips(result: MakeupAnalysisResult): SituationalMakeupTips {
  const recs = result.colorRecommendations;
  const concerns = result.concerns;
  const lip = firstColorName(recs, 'lip');
  const eye = firstColorName(recs, 'eyeshadow');
  const blush = firstColorName(recs, 'blush');
  const contour = firstColorName(recs, 'contour');

  // --- 데일리: 가볍게, 립 중심 ---
  const dailyBase: string[] = ['톤업 선크림이나 쿠션으로 얇게 베이스만 정돈하세요'];
  if (concerns.includes('oily-tzone')) {
    dailyBase.push('T존만 페이스 파우더로 가볍게 눌러 번들거림을 잡으세요');
  }
  if (concerns.includes('dark-circles')) {
    dailyBase.push('컨실러는 눈 밑에만 소량 발라 자연스럽게 커버하세요');
  }

  const dailyPoint: string[] = [];
  dailyPoint.push(
    lip
      ? `${lip} 립 하나만 발라도 생기가 살아나요`
      : '혈색이 도는 립 하나로 데일리 포인트를 완성하세요'
  );
  if (blush) {
    dailyPoint.push(`${blush} 블러셔를 볼 안쪽에 살짝 올리면 더 화사해요`);
  }

  const daily: MakeupTipGroup[] = [
    { category: '베이스 (가볍게)', tips: dailyBase },
    { category: '포인트 (립 중심)', tips: dailyPoint },
  ];

  // --- 풀메이크업: 커버, 아이 강조 ---
  const fullBase: string[] = [
    '파운데이션을 얇게 여러 번 쌓아 커버하고, 컨실러로 잡티를 가려주세요',
    '페이스 파우더로 전체를 고정해 지속력을 높이세요',
  ];

  const fullEye: string[] = [];
  fullEye.push(
    eye
      ? `${eye} 아이섀도로 그라데이션한 뒤 아이라인으로 또렷하게 마무리하세요`
      : '아이섀도를 그라데이션한 뒤 아이라인으로 눈매를 또렷하게 하세요'
  );
  fullEye.push('마스카라로 속눈썹을 올려 눈매를 강조하세요');

  const fullFinish: string[] = [];
  if (contour) {
    fullFinish.push(`${contour} 컨투어로 윤곽에 음영을 넣어 입체감을 살리세요`);
  } else {
    fullFinish.push('컨투어로 윤곽에 음영을 넣어 입체감을 살리세요');
  }
  fullFinish.push(
    lip ? `${lip} 립으로 마무리하면 완성도가 높아져요` : '또렷한 립으로 마무리하세요'
  );

  const full: MakeupTipGroup[] = [
    { category: '베이스 (커버)', tips: fullBase },
    { category: '아이 (강조)', tips: fullEye },
    { category: '마무리', tips: fullFinish },
  ];

  return { daily, full };
}

// ============================================================================
// 3. 보유 화장품 카테고리 감지 (shelf 배지용)
// ============================================================================

// 메이크업 카테고리별 키워드 (구체적인 것부터 검사)
const MAKEUP_CATEGORY_KEYWORDS: { category: MakeupShelfCategory; keywords: string[] }[] = [
  {
    category: 'lip',
    keywords: [
      '립스틱',
      'lipstick',
      '립틴트',
      '틴트',
      'tint',
      '립글로스',
      '글로스',
      'gloss',
      '립밤',
      'lip',
      '루즈',
    ],
  },
  {
    category: 'eyeshadow',
    keywords: [
      '아이섀도',
      '아이 섀도',
      '섀도우',
      '섀도',
      'eyeshadow',
      'eye shadow',
      '아이팔레트',
      '아이 팔레트',
    ],
  },
  {
    category: 'blush',
    keywords: ['블러셔', '블러쉬', 'blush', '볼터치', '치크', 'cheek'],
  },
  {
    category: 'contour',
    keywords: [
      '컨투어',
      'contour',
      '쉐이딩',
      '쉐딩',
      'shading',
      '하이라이터',
      'highlighter',
      '브론저',
      'bronzer',
    ],
  },
  {
    category: 'foundation',
    keywords: [
      '파운데이션',
      'foundation',
      '파데',
      '쿠션',
      'cushion',
      '컨실러',
      'concealer',
      'bb크림',
      'bb 크림',
      '비비크림',
      '비비 크림',
      'cc크림',
      '씨씨크림',
      '페이스 파우더',
      '페이스파우더',
    ],
  },
];

/**
 * 제품명/브랜드로 메이크업 카테고리 추측 (없으면 null)
 *
 * 왜: 스킨케어용 detectProductCategory는 메이크업 카테고리를 지원하지 않으므로
 * 메이크업 전용 경량 매처를 별도 제공한다.
 */
export function detectMakeupShelfCategory(product: {
  productName?: string;
  productBrand?: string;
}): MakeupShelfCategory | null {
  const searchText = [product.productName, product.productBrand]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!searchText) return null;

  for (const { category, keywords } of MAKEUP_CATEGORY_KEYWORDS) {
    if (keywords.some((k) => searchText.includes(k.toLowerCase()))) {
      return category;
    }
  }
  return null;
}
