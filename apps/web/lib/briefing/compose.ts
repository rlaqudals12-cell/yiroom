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

/** 최근 제품함에 담은 아이템 */
export interface BriefingRecentProduct {
  name: string;
  addedDaysAgo?: number | null;
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

/**
 * 관찰 문장 1개 선택 — 우선순위: 피부 추이 > 제품함 후속 > 최근 분석 경과.
 * 어떤 데이터도 없으면 undefined(생략).
 */
function composeObservation(input: BriefingInput): string | undefined {
  // 1순위: 피부 추이(오늘의 컨디션)
  if (input.skinTrend) {
    return skinObservation(input.skinTrend);
  }
  // 2순위: 제품함 후속(대상명 포함)
  if (input.recentProduct?.name) {
    return `지난번 담아둔 ${input.recentProduct.name}, 잘 맞고 있어요?`;
  }
  // 3순위: 오래된 분석만(며칠 이상 경과했을 때만 — 근거 수치 N일 동반)
  if (
    typeof input.lastAnalysisDaysAgo === 'number' &&
    input.lastAnalysisDaysAgo >= STALE_ANALYSIS_DAYS
  ) {
    return `마지막으로 함께 살펴본 지 ${input.lastAnalysisDaysAgo}일 됐어요. 오늘 다시 볼까요?`;
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
  const slot = getTimeSlot(now.getHours());
  const name = normalizeName(input.userName);

  const observation = composeObservation(input);
  const briefing: Briefing = {
    greeting: composeGreeting(slot, name),
    advice: composeAdvice(input),
    closing: composeClosing(slot),
  };
  if (observation) {
    briefing.observation = observation;
  }
  return briefing;
}
