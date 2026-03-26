/**
 * AI 코치 응답 환각/안전성 필터 (모바일)
 * @description 의료 주장, 위험한 제품 추천, 사실 모순 등을 감지하여 안전한 응답 보장
 * 웹 버전(apps/web/lib/coach/hallucination-filter.ts)과 동일한 순수 로직
 */

/** 필터링 결과 */
export interface FilterResult {
  isClean: boolean;
  violations: FilterViolation[];
  sanitizedText: string;
}

/** 위반 항목 */
export interface FilterViolation {
  type: 'medical_claim' | 'unsafe_ingredient' | 'absolute_promise' | 'price_claim';
  matched: string;
  severity: 'high' | 'medium';
}

// 의료 행위 관련 금지 표현 (진단/처방/치료)
const MEDICAL_CLAIM_PATTERNS: RegExp[] = [
  /치료(할 수|합니다|해요|됩니다|가 됩니다)/,
  /완치(할 수|합니다|해요|됩니다)/,
  /처방(할게요|합니다|해요|드려요|해 드릴게요)/,
  /진단(해|합니다|해요|하면)/,
  /[이가] 낫(습니다|아요|겠)/,
  /반드시 (나을|호전|개선될)/,
  /병원.{0,5}갈 필요.{0,5}없/,
  /약.{0,5}대신/,
  /의사.{0,5}필요 없/,
];

// 절대적 효과 보장 표현
const ABSOLUTE_PROMISE_PATTERNS: RegExp[] = [
  /100% (효과|개선|해결)/,
  /확실(히|하게) (효과|개선|해결)/,
  /반드시 (효과|개선|해결|좋아)/,
  /무조건 (효과|좋아|개선|해결)/,
  /절대(로)? (안전|효과)/,
  /보장(합니다|해요|드려요)/,
];

// 위험한 성분 조합 경고 (레티놀+AHA 등)
const UNSAFE_INGREDIENT_COMBINATIONS: {
  ingredients: [string, string];
  warning: string;
}[] = [
  {
    ingredients: ['레티놀', 'AHA'],
    warning: '레티놀과 AHA는 동시 사용 시 자극이 심할 수 있어요',
  },
  {
    ingredients: ['레티놀', 'BHA'],
    warning: '레티놀과 BHA는 동시 사용 시 자극이 심할 수 있어요',
  },
  {
    ingredients: ['레티놀', '비타민C'],
    warning: '레티놀과 비타민C는 각각 아침/저녁으로 분리 사용을 권장해요',
  },
  {
    ingredients: ['나이아신아마이드', 'AHA'],
    warning: '나이아신아마이드와 AHA는 pH 차이로 효과가 감소할 수 있어요',
  },
];

// 구체적 가격 언급 패턴 (할인가 등 변동 정보)
const PRICE_CLAIM_PATTERNS: RegExp[] = [
  /현재.{0,10}할인/,
  /지금.{0,10}세일/,
  /오늘.{0,5}(까지|만|한정)/,
  /\d{1,3}% ?할인/,
];

/**
 * AI 응답 필터링
 * @param text AI가 생성한 응답 텍스트
 * @returns 필터링 결과 (위반 여부, 위반 목록, 정화된 텍스트)
 */
export function filterCoachResponse(text: string): FilterResult {
  const violations: FilterViolation[] = [];

  // 1. 의료 주장 검사
  for (const pattern of MEDICAL_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'medical_claim',
        matched: match[0],
        severity: 'high',
      });
    }
  }

  // 2. 절대적 효과 보장 검사
  for (const pattern of ABSOLUTE_PROMISE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'absolute_promise',
        matched: match[0],
        severity: 'medium',
      });
    }
  }

  // 3. 가격 변동 정보 검사
  for (const pattern of PRICE_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'price_claim',
        matched: match[0],
        severity: 'medium',
      });
    }
  }

  // 정화: 위반 텍스트 대체
  let sanitizedText = text;
  for (const violation of violations) {
    if (violation.type === 'medical_claim') {
      sanitizedText = sanitizedText.replace(violation.matched, '(전문가 상담을 권장드려요)');
    } else if (violation.type === 'absolute_promise') {
      sanitizedText = sanitizedText.replace(violation.matched, '도움이 될 수 있어요');
    } else if (violation.type === 'price_claim') {
      sanitizedText = sanitizedText.replace(violation.matched, '(가격은 변동될 수 있어요)');
    }
  }

  return {
    isClean: violations.length === 0,
    violations,
    sanitizedText,
  };
}

/**
 * 성분 조합 안전성 검사
 * @param ingredients 사용자가 함께 사용하려는 성분 목록
 * @returns 위험한 조합 경고 목록
 */
export function checkIngredientSafety(ingredients: string[]): string[] {
  const warnings: string[] = [];
  const lowerIngredients = ingredients.map((i) => i.toLowerCase());

  for (const combo of UNSAFE_INGREDIENT_COMBINATIONS) {
    const [a, b] = combo.ingredients;
    const hasA = lowerIngredients.some((i) => i.includes(a.toLowerCase()));
    const hasB = lowerIngredients.some((i) => i.includes(b.toLowerCase()));

    if (hasA && hasB) {
      warnings.push(combo.warning);
    }
  }

  return warnings;
}

/**
 * 응답에 면책 조항이 필요한지 확인
 * @param text AI 응답 텍스트
 * @returns 면책 조항 필요 여부
 */
export function needsDisclaimer(text: string): boolean {
  const disclaimerTriggers = [
    '약',
    '영양제',
    '보충제',
    '알레르기',
    '아토피',
    '습진',
    '피부염',
    '여드름 약',
    '처방',
    '클리닉',
  ];

  const lowerText = text.toLowerCase();
  return disclaimerTriggers.some((trigger) => lowerText.includes(trigger));
}

/** 표준 면책 조항 */
export const COACH_DISCLAIMER =
  '💡 이 정보는 참고용이에요. 증상이 지속되면 전문가 상담을 권장드려요.';
