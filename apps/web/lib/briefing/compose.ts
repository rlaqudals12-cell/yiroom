/**
 * 브리핑 조립 — 전속 뷰티팀이 매일 건네는 "아침 메시지" (ADR-114 결정 4)
 *
 * AI 호출 없음. 입력 데이터에서 규칙으로 문장을 조립하는 순수 함수.
 * 화법 4요소를 코드로 강제한다:
 *  ① 말을 건다      — 1인칭 대화체 해요체, 관찰 → 조언 순서
 *  ② 기억한다        — 피부 추이·제품함 후속을 근거와 함께 언급
 *  ③ 일관 인격       — TONE_GUIDE 상수로 톤을 고정
 *  ④ 묻기 전에 결정  — 관찰 우선순위(피부 추이 > 제품함 후속 > 최근 분석 경과)
 *
 * 정직성 가드(테스트 고정):
 *  - 실데이터 없는 문장은 생략한다(일반론 채움 금지). 관찰/조언은 전부 입력 조건부.
 *  - 관찰에는 근거 수치(±점) 또는 대상명(제품명 등)을 반드시 포함한다.
 *  - 금지 표현(치료·보장·사라져 등)이 포함된 문장은 걸러낸다.
 *  - 인사/맺음말은 프레이밍(대화의 문을 여닫는 문장)이므로 항상 존재한다.
 *
 * @see docs/adr/ADR-114-beauty-team-ia.md §결정 4
 */

/** 시간대 구분 — 인사/맺음말 톤 결정 */
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

/** 화법 가이드 — 팀의 일관된 인격을 코드로 명문화 (테스트가 이 상수를 검증) */
export const TONE_GUIDE = {
  /** 1인칭 대화체 해요체 */
  person: '1인칭 대화체 해요체',
  /** 관찰을 먼저, 조언을 나중에 */
  order: '관찰 → 조언',
  /** 권유 어미로 마무리 (~어때요?, ~챙겨요, ~봐요) */
  invite: ['어때요', '챙겨봐요', '봐요', '볼까요', '있어요'],
  /** 정직성 가드: 이 표현이 들어간 문장은 출력하지 않는다 */
  forbidden: ['치료', '완치', '보장', '사라져', '사라집니다', '즉시 효과'] as const,
} as const;

/** 관찰 fallback(최근 분석 경과)을 낼 최소 경과일 — 이보다 짧으면 "관찰할 변화"가 아님 */
const STALE_ANALYSIS_DAYS = 3;

/** 조언 최대 개수 — 인지 부담 방지(한 번에 1~2개) */
const MAX_ADVICE = 2;

/** 피부 점수 직전 대비 추이 */
export interface BriefingSkinTrend {
  direction: 'up' | 'down' | 'flat';
  /** 부호 있는 변화량(양수=개선). flat이면 0 */
  delta: number;
  /** 마지막 피부 분석 경과일 */
  daysSinceLast?: number | null;
}

/**
 * 제품함 후속 응답 — "지난번 담아둔 ○○, 잘 맞고 있어요?"에 대한 사용자의 답.
 * 'positive' = "잘 맞아요", 'negative' = "글쎄요".
 */
export type ShelfFeedback = 'positive' | 'negative';

/**
 * 제품함 후속 응답을 기존 rating(1~5, user_product_shelf) 값 체계 위에 얹은 2択 매핑.
 * 새 컬럼/테이블 없이 rating을 그대로 재사용한다 — "잘 맞아요"=높은 별점, "글쎄요"=낮은 별점.
 * (DB 제약: rating INTEGER CHECK (1..5) — 두 값 모두 이 범위 안에 있어야 저장된다.)
 */
export const SHELF_FEEDBACK_RATING: Record<ShelfFeedback, number> = {
  positive: 5,
  negative: 2,
} as const;

/**
 * 저장된 rating(1~5) → 브리핑 후속 응답으로 해석.
 * 4점 이상=긍정, 1~3점=부정, 그 외(null·NaN·범위밖)=미응답(지어내지 않음).
 */
export function ratingToFeedback(rating?: number | null): ShelfFeedback | null {
  if (typeof rating !== 'number' || Number.isNaN(rating)) return null;
  if (rating >= 4) return 'positive';
  if (rating >= 1) return 'negative';
  return null;
}

/** 최근 제품함에 담은 아이템 */
export interface BriefingRecentProduct {
  name: string;
  addedDaysAgo?: number | null;
  /**
   * 제품함 아이템 id — 응답 저장(PUT /api/scan/shelf/[id]) 대상.
   * 문장 조립엔 쓰이지 않지만, 미응답 후속 질문에 응답 버튼을 달 때 필요하다(shelfFollowup).
   */
  shelfItemId?: string | null;
  /** 이 제품에 대한 사용자의 이전 응답(있으면 회고, 없으면 다시 질문). 지어내지 않음 */
  feedback?: ShelfFeedback | null;
  /** 응답을 남긴 지 경과일(응답이 있을 때만 — 회고 문장의 "언제 대비") */
  feedbackDaysAgo?: number | null;
  /**
   * 부정 응답 시 제시할 대안 제품명(있을 때만).
   * 대안 조회는 이 모듈이 하지 않는다 — 호출부가 기존 교체 제안 파이프라인에서 주입한다(중복 구현 금지).
   * 없으면 정직한 안내("다른 제품을 찾아볼까요?")로 대체한다.
   */
  alternativeName?: string | null;
}

/** 오늘 캡슐의 우선 항목 1개 */
export interface BriefingCapsulePriority {
  name: string;
  reason?: string | null;
}

/** composeBriefing 입력 — 전부 optional(호출부가 기존 훅/API에서 수집해 주입) */
export interface BriefingInput {
  userName?: string | null;
  now?: Date;
  /**
   * 인사/맺음말 톤을 정할 시각(0~23). 서버(UTC) 라우트가 사용자 타임존 기준 시(hour)를 주입한다.
   * 미지정 시 now.getHours()(브라우저 로컬) 사용 — 웹 홈은 그대로 로컬 시각을 쓴다.
   */
  hour?: number;
  skinTrend?: BriefingSkinTrend | null;
  recentProduct?: BriefingRecentProduct | null;
  /** 아무 축이든 마지막 분석 경과일(관찰 fallback) */
  lastAnalysisDaysAgo?: number | null;
  /** 날씨 기반 조언 문장(EnvironmentAdvice 팁) */
  weatherTip?: string | null;
  capsulePriority?: BriefingCapsulePriority | null;
  hasIntegratedSession?: boolean;
}

/** 브리핑 출력 — 문장 단위 */
export interface Briefing {
  greeting: string;
  /** 데이터가 있을 때만 존재(없으면 생략) */
  observation?: string;
  /** 0~2개(데이터 없으면 빈 배열) */
  advice: string[];
  closing: string;
  /**
   * 관찰이 "제품함 후속 질문(응답 대기)"일 때만 존재 — 폐루프 v1(고객 노트).
   * 웹 홈은 이 정보로 응답 버튼(잘 맞아요/글쎄요)을 렌더해 rating을 저장한다.
   * 이미 응답이 있으면(feedback) 관찰은 회고 문장이 되고 이 필드는 생략된다.
   * 모바일은 아직 이 필드를 렌더하지 않는다(응답 버튼은 후속 배치, 계약은 하위호환).
   */
  shelfFollowup?: { shelfItemId: string; productName: string };
}

const GREETING_BY_SLOT: Record<TimeSlot, string> = {
  morning: '좋은 아침이에요',
  afternoon: '좋은 오후예요',
  evening: '좋은 저녁이에요',
  night: '늦은 시간까지 고생 많았어요',
};

const CLOSING_BY_SLOT: Record<TimeSlot, string> = {
  morning: '오늘도 곁에서 도울게요.',
  afternoon: '오늘도 곁에서 도울게요.',
  evening: '오늘 하루도 수고 많았어요. 푹 쉬어요.',
  night: '오늘 하루도 수고 많았어요. 푹 쉬어요.',
};

/** 시각(0~23시) → 시간대 */
export function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/** 실이름만 통과(공백/빈 문자열 → 이름 생략) */
function normalizeName(name?: string | null): string | undefined {
  const trimmed = name?.trim();
  return trimmed ? trimmed : undefined;
}

/** 경과일 → 사람이 읽는 라벨 (관찰 문장에서 "언제 대비"인지) */
function elapsedLabel(days?: number | null): string {
  if (days == null) return '지난번';
  if (days <= 0) return '방금';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

/** 금지 표현이 없는 깨끗한 문장인지 */
function isClean(sentence: string): boolean {
  return !TONE_GUIDE.forbidden.some((word) => sentence.includes(word));
}

function composeGreeting(slot: TimeSlot, name?: string): string {
  const base = GREETING_BY_SLOT[slot];
  return name ? `${name}님, ${base}` : base;
}

function composeClosing(slot: TimeSlot): string {
  return CLOSING_BY_SLOT[slot];
}

/** 피부 추이 관찰 — 항상 근거 수치(±점)를 동반 */
function skinObservation(trend: BriefingSkinTrend): string {
  const when = elapsedLabel(trend.daysSinceLast);
  const magnitude = Math.abs(trend.delta);
  if (trend.direction === 'up') {
    return `${when}보다 피부 컨디션이 올라왔어요 (+${magnitude}점)`;
  }
  if (trend.direction === 'down') {
    return `${when}보다 피부 컨디션이 살짝 내려갔어요 (-${magnitude}점)`;
  }
  return `${when}보다 피부 컨디션에 큰 변화는 없어요 (±0점)`;
}

/** 관찰 결과 — 문장 + (응답 대기 후속 질문일 때만) 후속 정보 */
interface ObservationResult {
  text: string;
  shelfFollowup?: { shelfItemId: string; productName: string };
}

/**
 * 제품함 후속 관찰 — 폐루프 v1(고객 노트).
 *  - 이전 응답이 있으면 그 답을 기억해 회고한다(긍정=오늘도 챙김 / 부정=대안·재탐색).
 *  - 응답이 없으면 다시 묻고, 응답 버튼용 정보(shelfItemId)를 함께 낸다.
 * 전부 실데이터 조건부 — 응답을 지어내지 않는다(feedback 없으면 회고 없음).
 */
function shelfObservation(product: BriefingRecentProduct): ObservationResult {
  const feedback = product.feedback ?? null;

  // 긍정 회고 — "잘 맞는다고 하셨던 ○○, 오늘도 루틴에 넣어뒀어요"
  if (feedback === 'positive') {
    return { text: `잘 맞는다고 하셨던 ${product.name}, 오늘도 루틴에 넣어뒀어요` };
  }

  // 부정 회고 — 언제 그랬는지(근거) + 대안(있으면) 또는 정직한 재탐색 안내
  if (feedback === 'negative') {
    const when = elapsedLabel(product.feedbackDaysAgo);
    const alt = product.alternativeName?.trim();
    return {
      text: alt
        ? `${when} ${product.name}가 잘 안 맞는다고 하셨죠. 대신 ${alt} 어때요?`
        : `${when} ${product.name}가 잘 안 맞는다고 하셨죠. 다른 제품을 찾아볼까요?`,
    };
  }

  // 미응답 — 다시 묻는다(기존 화법 유지). 응답 버튼을 달 수 있게 shelfItemId를 함께 낸다.
  const result: ObservationResult = { text: `지난번 담아둔 ${product.name}, 잘 맞고 있어요?` };
  if (product.shelfItemId) {
    result.shelfFollowup = { shelfItemId: product.shelfItemId, productName: product.name };
  }
  return result;
}

/**
 * 관찰 문장 1개 선택 — 우선순위: 피부 추이 > 제품함 후속 > 최근 분석 경과.
 * 어떤 데이터도 없으면 undefined(생략).
 */
function composeObservation(input: BriefingInput): ObservationResult | undefined {
  // 1순위: 피부 추이(오늘의 컨디션)
  if (input.skinTrend) {
    return { text: skinObservation(input.skinTrend) };
  }
  // 2순위: 제품함 후속(대상명 포함) — 응답 여부에 따라 회고/재질문
  if (input.recentProduct?.name) {
    return shelfObservation(input.recentProduct);
  }
  // 3순위: 오래된 분석만(며칠 이상 경과했을 때만 — 근거 수치 N일 동반)
  if (
    typeof input.lastAnalysisDaysAgo === 'number' &&
    input.lastAnalysisDaysAgo >= STALE_ANALYSIS_DAYS
  ) {
    return {
      text: `마지막으로 함께 살펴본 지 ${input.lastAnalysisDaysAgo}일 됐어요. 오늘 다시 볼까요?`,
    };
  }
  return undefined;
}

/** 조언 문장 조립 — 캡슐 우선 항목 + 날씨 팁에서, 데이터 없으면 빈 배열 */
function composeAdvice(input: BriefingInput): string[] {
  const items: string[] = [];

  // 캡슐 우선 항목 → 권유 어미로
  if (input.capsulePriority?.name) {
    const { name, reason } = input.capsulePriority;
    items.push(reason ? `오늘은 ${name} 챙겨봐요 — ${reason}` : `오늘은 ${name} 챙겨봐요`);
  }

  // 날씨 팁(EnvironmentAdvice 엔진 문장) 그대로
  const tip = input.weatherTip?.trim();
  if (tip) {
    items.push(tip);
  }

  // 정직성 가드: 금지 표현 제거 후 최대 2개
  return items.filter(isClean).slice(0, MAX_ADVICE);
}

/**
 * 브리핑 조립 — 순수 함수.
 * greeting/closing은 항상, observation/advice는 입력 데이터가 있을 때만.
 */
export function composeBriefing(input: BriefingInput = {}): Briefing {
  const now = input.now ?? new Date();
  // 서버(UTC)에선 now.getHours()가 UTC 시라 인사가 어긋난다 → 라우트가 주입한 hour 우선.
  const slot = getTimeSlot(input.hour ?? now.getHours());
  const name = normalizeName(input.userName);

  const observation = composeObservation(input);
  const briefing: Briefing = {
    greeting: composeGreeting(slot, name),
    advice: composeAdvice(input),
    closing: composeClosing(slot),
  };
  if (observation) {
    briefing.observation = observation.text;
    if (observation.shelfFollowup) {
      briefing.shelfFollowup = observation.shelfFollowup;
    }
  }
  return briefing;
}
