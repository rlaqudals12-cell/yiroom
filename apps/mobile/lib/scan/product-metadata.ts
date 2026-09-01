/**
 * OCR 제품명에서 스캔 판정에 쓸 메이크업 메타데이터를 보수적으로 복원한다.
 * 카테고리 키워드는 웹 `detectMakeupShelfCategory` 정본을 그대로 미러한다.
 */

export type ScanMakeupCategory = 'lip' | 'eyeshadow' | 'blush' | 'contour' | 'foundation';

export interface ScanProductMetadata {
  category?: ScanMakeupCategory;
  color?: string;
}

const MAKEUP_CATEGORY_KEYWORDS: {
  category: ScanMakeupCategory;
  keywords: readonly string[];
}[] = [
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

// 기존 스캔 정성 키워드만 사용한다. 이름을 수치나 HEX로 변환하지 않는다.
const COLOR_NAME_KEYWORDS = [
  'coral',
  'peach',
  'orange',
  'gold',
  'bronze',
  'warm',
  'pink',
  'berry',
  'mauve',
  'plum',
  'rose',
  'cool',
  '코랄',
  '피치',
  '복숭아',
  '오렌지',
  '주황',
  '골드',
  '금색',
  '브론즈',
  '웜',
  '살구',
  '테라코타',
  '핑크',
  '베리',
  '모브',
  '플럼',
  '자두',
  '로즈',
  '쿨',
  '라벤더',
] as const;

const EXACT_HEX_PATTERN = /#[0-9a-fA-F]{6}(?![0-9a-fA-F])/;
const SHORT_HEX_PATTERN = /#[0-9a-fA-F]{3}(?![0-9a-fA-F])/;

/** 웹 `detectMakeupShelfCategory`와 동일한 제품명/브랜드 카테고리 감지. */
export function detectMakeupShelfCategory(product: {
  productName?: string;
  productBrand?: string;
}): ScanMakeupCategory | null {
  const searchText = [product.productName, product.productBrand]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!searchText) return null;

  for (const { category, keywords } of MAKEUP_CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

/** 제품명에 실제로 표기된 HEX 또는 색 이름만 반환한다. */
function detectProductColor(productName?: string): string | undefined {
  if (!productName) return undefined;

  const exactHex = productName.match(EXACT_HEX_PATTERN)?.[0];
  if (exactHex) return exactHex.toUpperCase();
  if (SHORT_HEX_PATTERN.test(productName)) return undefined;

  const lowerName = productName.toLowerCase();
  return COLOR_NAME_KEYWORDS.find((keyword) => lowerName.includes(keyword.toLowerCase()));
}

/** OCR 결과와 스캔 판정 사이의 제품 메타데이터 브리지. */
export function detectScanProductMetadata(product: {
  productName?: string;
  brandName?: string;
}): ScanProductMetadata {
  const category = detectMakeupShelfCategory({
    productName: product.productName,
    productBrand: product.brandName,
  });

  // 비메이크업 제품의 색 단어를 색조 적합도로 오인하지 않는다.
  if (!category) return {};

  const color = detectProductColor(product.productName);
  return {
    category,
    ...(color ? { color } : {}),
  };
}
