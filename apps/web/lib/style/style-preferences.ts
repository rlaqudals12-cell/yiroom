/**
 * 스타일 탭 - 선호 스타일 옵션 + 표면 분기 순수 로직
 * @description user_preferences(domain='style', itemType='fashion_style')로 저장되는
 *              취향 칩 옵션과, 신체정보 배너/맞춤 아이템 빈 상태 분기 헬퍼.
 *              UI 컴포넌트에서 재사용 + 단위 테스트 가능하도록 순수 함수로 분리.
 */

/** 선호 스타일 옵션 (다중선택 칩) */
export interface StylePreferenceOption {
  /** 저장/식별용 영문 값 (itemNameEn) */
  value: string;
  /** 화면 표기 한글명 (itemName) */
  label: string;
}

/**
 * 선호 스타일 목록 (5~7종)
 * - itemName(한글) = 저장 키, itemNameEn(영문) = 참조값
 */
export const STYLE_PREFERENCE_OPTIONS: StylePreferenceOption[] = [
  { value: 'casual', label: '캐주얼' },
  { value: 'minimal', label: '미니멀' },
  { value: 'street', label: '스트릿' },
  { value: 'classic', label: '클래식' },
  { value: 'lovely', label: '러블리' },
  { value: 'sporty', label: '스포티' },
  { value: 'formal', label: '포멀' },
];

/**
 * 신체정보 입력 배너 표시 여부
 *
 * @description 키/몸무게는 여러 소스에 중복 저장될 수 있다(체형 분석·내 정보·측정값).
 *   한 소스라도 키가 있으면 재사용하고 배너를 숨겨 중복 입력을 요구하지 않는다(One Canon).
 *
 * @param apiHasMeasurements /api/user/measurements 결과 (null=확인 중)
 * @param bodyHeight body_analyses.height (분석으로 이미 확보된 키)
 * @returns 어떤 소스에도 키가 없을 때만 true
 */
export function shouldShowMeasurementBanner(
  apiHasMeasurements: boolean | null,
  bodyHeight: number | null
): boolean {
  // 확인 중(null)이거나 측정값 존재 → 배너 숨김
  if (apiHasMeasurements !== false) return false;
  // 체형 분석에 키가 있으면 그 값을 재사용 → 배너 숨김
  if (bodyHeight != null && bodyHeight > 0) return false;
  return true;
}

/** 맞춤 아이템 섹션 빈 상태 (정직한 안내 + 실제 행동 경로) */
export interface MatchedItemsEmptyState {
  message: string;
  /** null이면 CTA 없음 — 같은 경로 진입이 페이지의 주인공 CTA로 이미 존재해 중복 제거 */
  ctaLabel: string | null;
  ctaHref: string | null;
}

/**
 * "내 체형 맞춤 아이템" 빈 상태 안내
 *
 * @description 패션 상품 DB가 없어 쇼핑 매칭 아이템은 제공하지 않는다.
 *   "준비하고 있어요"(가짜 로딩 암시) 대신 정직하게 안내한다.
 *   옷장 등록·옷장 코디 경로는 "오늘의 코디" 섹션이 주인공 CTA로 이미 제공하므로
 *   여기서는 CTA를 반복하지 않는다(진입 1곳 원칙 — /closet/recommend 중복 제거).
 *
 * @param hasAnalysis 체형/컬러 분석 완료 여부
 * @param hasCloset 옷장에 등록된 옷 존재 여부
 */
export function getMatchedItemsEmptyState(
  hasAnalysis: boolean,
  hasCloset: boolean
): MatchedItemsEmptyState {
  if (!hasAnalysis) {
    // 분석 유도만 이 섹션의 고유 경로 — 텍스트 링크로 제공 (주인공 CTA는 옷장 등록)
    return {
      message: '체형을 분석하면 내 컬러·체형에 맞춰 코디를 도와드려요',
      ctaLabel: '체형 분석하기',
      ctaHref: '/analysis/body',
    };
  }

  // 분석은 했지만 쇼핑 매칭 아이템은 미제공 → 위 "오늘의 코디" 섹션이 실제 경로 (CTA 중복 금지)
  if (hasCloset) {
    return {
      message:
        '맞춤 쇼핑 아이템은 아직 준비되지 않았어요. 지금은 위 오늘의 코디에서 내 옷으로 추천을 받아보세요',
      ctaLabel: null,
      ctaHref: null,
    };
  }

  return {
    message:
      '맞춤 쇼핑 아이템은 아직 준비되지 않았어요. 위에서 옷장에 옷을 등록하면 내 옷으로 코디를 추천해드려요',
    ctaLabel: null,
    ctaHref: null,
  };
}
