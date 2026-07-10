/**
 * 분석 결과 "그래서, 이렇게 하세요" 조립 (ADR-111 표현 원칙 1: 결론 먼저)
 *
 * @description
 *   각 축의 이미 존재하는 분석 결과 데이터에서 규칙 기반으로 행동 1~3개를 조립한다.
 *   새 AI 호출·새 fetch 없음 (정직성 원칙). 웹 정본(TopActionsCard 조립 로직)의 모바일 패리티.
 *   데이터가 없는 항목은 생략한다 — 지어내지 않는다. (빈 배열 = 카드 미노출)
 */

/** 행동에 딸린 색 견본 */
export interface TopActionSwatch {
  hex: string;
  /** 접근성 라벨용 이름. 색 이름을 알 수 없으면 hex 코드를 그대로 사용 (지어내지 않음) */
  name: string;
}

/** 결론 카드에 표시할 단일 행동 */
export interface TopAction {
  /** 행동 제목 (한 줄, 명령형) */
  title: string;
  /** 왜/어떻게 보조 설명 (한 줄, 선택) */
  detail?: string;
  /** 관련 색 견본 (선택, 최대 3개 렌더) */
  swatches?: TopActionSwatch[];
  /** 더 보러 갈 곳 (선택, expo-router 경로) */
  href?: string;
  /** 링크 라벨 (href 있을 때, 기본 "보러가기") */
  hrefLabel?: string;
}

/** 최대 3개의 유효한(빈 제목 아님) 색 견본만 남긴다 */
function toSwatches(hexes: string[]): TopActionSwatch[] {
  return hexes
    .filter((h) => typeof h === 'string' && h.trim().length > 0)
    .slice(0, 3)
    .map((hex) => ({ hex, name: hex }));
}

/**
 * S-1 피부 — 첫 케어 팁 + 추천 성분 + 주의 성분.
 * (웹 정본: 루틴 첫 스텝 + 추천 성분 + 주의 성분)
 */
export function buildSkinTopActions(input: {
  /** 피부 타입별 스킨케어 팁 */
  tips: string[];
  /** 추천 성분 */
  recommendedIngredients: string[];
  /** 주의 성분 */
  avoidIngredients: string[];
}): TopAction[] {
  const actions: TopAction[] = [];

  // ① 오늘 첫 케어 팁 — 전체 루틴으로 유도
  const firstTip = input.tips[0]?.trim();
  if (firstTip) {
    actions.push({
      title: firstTip,
      href: '/(analysis)/skin/routine',
      hrefLabel: '전체 루틴 보기',
    });
  }

  // ② 추천 성분 1
  const good = input.recommendedIngredients[0]?.trim();
  if (good) {
    actions.push({ title: `'${good}' 성분이 든 제품을 골라보세요` });
  }

  // ③ 주의 성분 1
  const avoid = input.avoidIngredients[0]?.trim();
  if (avoid) {
    actions.push({ title: `'${avoid}' 성분은 피하세요` });
  }

  return actions;
}

/**
 * PC-1 퍼스널 컬러 — 베스트 컬러 + 스타일링 팁 2개.
 * (웹 정본: 베스트 컬러 + 립/그루밍 + 실천 팁 — 모바일은 립 추천 데이터가 없어 스타일링 팁으로 대체)
 */
export function buildPersonalColorTopActions(input: {
  /** 베스트 컬러 hex 목록 */
  bestColors: string[];
  /** 톤/시즌 라벨 (예: "봄 웜톤") */
  toneLabel: string;
  /** 스타일링 팁 */
  stylingTips: string[];
}): TopAction[] {
  const actions: TopAction[] = [];

  // ① 베스트 컬러 3가지부터
  const swatches = toSwatches(input.bestColors);
  if (swatches.length > 0) {
    actions.push({
      title: '베스트 컬러부터 활용해보세요',
      detail: `${input.toneLabel}에 잘 어울리는 컬러예요`,
      swatches,
    });
  }

  // ②③ 스타일링 팁 (최대 2개)
  const tip0 = input.stylingTips[0]?.trim();
  if (tip0) actions.push({ title: tip0 });
  const tip1 = input.stylingTips[1]?.trim();
  if (tip1) actions.push({ title: tip1 });

  return actions;
}

/**
 * C-1 체형 — 추천 스타일 2개 + 피할 스타일.
 * (웹 정본: 추천 스타일 팁 + 추천 아이템 + 피할 것)
 */
export function buildBodyTopActions(input: {
  /** 추천 스타일 목록 */
  recommendations: string[];
  /** 피하면 좋은 아이템 */
  avoidItems: string[];
}): TopAction[] {
  const actions: TopAction[] = [];

  const rec0 = input.recommendations[0]?.trim();
  if (rec0) actions.push({ title: `'${rec0}' 스타일을 활용해보세요` });

  const rec1 = input.recommendations[1]?.trim();
  if (rec1) actions.push({ title: `'${rec1}'도 잘 어울려요` });

  const avoid0 = input.avoidItems[0]?.trim();
  if (avoid0) actions.push({ title: `이건 피하세요 — ${avoid0}` });

  return actions;
}

/**
 * H-1 헤어 — 첫 케어 루틴 + 추천 스타일 + 통합 분석 유도.
 * (웹 정본: 케어 팁 + 추천 성분 + 컷·염색은 통합 분석으로 유도)
 * 컷(×얼굴형)·염색(×퍼스널컬러)은 이 화면에 데이터가 없어 통합 분석으로 정직하게 유도한다.
 */
export function buildHairTopActions(input: {
  /** 케어 루틴 */
  careRoutine: string[];
  /** 추천 헤어스타일 */
  recommendedStyles: string[];
}): TopAction[] {
  const actions: TopAction[] = [];

  const care0 = input.careRoutine[0]?.trim();
  if (care0) actions.push({ title: care0 });

  const style0 = input.recommendedStyles[0]?.trim();
  if (style0) actions.push({ title: `'${style0}' 스타일이 잘 어울려요` });

  // 컷·염색은 얼굴형/퍼스널컬러 교차가 필요 — 통합 분석으로 정직하게 유도 (실존 라우트)
  actions.push({
    title: '어울리는 컷·염색은 통합 분석에서 확인하세요',
    href: '/(analysis)/integrated',
    hrefLabel: '통합 분석 보기',
  });

  return actions;
}

/**
 * M-1 메이크업 — 추천 컬러 + 립/아이 포인트.
 * (웹 정본: 추천 스타일 + 립 컬러 + 퍼스널컬러 연결 — 모바일은 부위별 추천으로 조립)
 */
export function buildMakeupTopActions(input: {
  /** 추천 컬러 hex 목록 */
  bestColors: string[];
  /** 립 메이크업 추천 문구 */
  lip?: string;
  /** 아이 메이크업 추천 문구 */
  eye?: string;
}): TopAction[] {
  const actions: TopAction[] = [];

  // ① 추천 컬러 팔레트
  const swatches = toSwatches(input.bestColors);
  if (swatches.length > 0) {
    actions.push({ title: '추천 컬러부터 발라보세요', swatches });
  }

  // ② 립 포인트
  const lip = input.lip?.trim();
  if (lip) actions.push({ title: '립부터 완성해보세요', detail: lip });

  // ③ 아이 포인트
  const eye = input.eye?.trim();
  if (eye) actions.push({ title: '아이 메이크업 포인트', detail: eye });

  return actions;
}
