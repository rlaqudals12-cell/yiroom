/**
 * 분석 5축 변동 주기 그룹 (ADR-109 / SDD-PROFILE-CENTRIC-ANALYSIS)
 *
 * 축마다 "변하는 속도"가 다르다. 프로필 중심 모델은 이 단일 상수로
 * (1) 프로필 카드 아이콘(🔒/🔄/📅), (2) 갱신주기 프롬프트, (3) 2층 추천 레이어 규칙을 공유한다.
 *
 * - identity 🔒  : 평생 고정 (퍼스널컬러 언더톤). 직접 재분석 전 불변.
 * - slow     🔄  : 천천히 변함 (체형·얼굴형 — 체중·나이). 재확인 프롬프트.
 * - condition 📅 : 매일 변함 (피부). 메이크업은 PC(identity)+피부(condition) 파생이라 condition로 취급.
 *
 * 순수 상수 — 플랫폼 의존 없음 (packages/shared 규칙).
 */

export type CadenceGroup = 'identity' | 'slow' | 'condition';

/** 분석 축 코드 → 변동 그룹. (통합 분석 5축) */
export const AXIS_CADENCE = {
  personal_color: 'identity',
  body: 'slow',
  hair: 'slow',
  skin: 'condition',
  makeup: 'condition',
} as const satisfies Record<string, CadenceGroup>;

export type CadenceAxis = keyof typeof AXIS_CADENCE;

/**
 * 그룹별 표시 메타 (아이콘 의미 — 실제 아이콘 매핑은 UI 레이어).
 *
 * label은 성격 서술형 — "평생"/"천천히" 같은 명사·부사 단독 라벨은
 * 주어·서술어가 없어 기획자조차 해석이 애매했음(2026-07-06 사용자 피드백).
 * hint는 툴팁/보조 설명용으로 재분석 필요 여부까지 안내.
 */
export const CADENCE_META: Record<CadenceGroup, { label: string; hint: string }> = {
  identity: { label: '변하지 않아요', hint: '타고난 정체성이라 재분석이 필요 없어요' },
  slow: { label: '천천히 변해요', hint: '체중·시간에 따라 가끔 변해요 — 달라졌을 때만 다시' },
  condition: {
    label: '매일 달라져요',
    hint: '오늘의 컨디션이에요 — 자주 확인할수록 추이가 쌓여요',
  },
};

/** 축의 변동 그룹 조회 (미상 축은 condition 보수적 기본값). */
export function getAxisCadence(axis: string): CadenceGroup {
  return (AXIS_CADENCE as Record<string, CadenceGroup>)[axis] ?? 'condition';
}

/**
 * 프로필 카드 변동 뱃지 노출 축 — 양 극단 2축만.
 *
 * 왜 (2026-07-06 제품 결정, P0/P4):
 * - 퍼스널컬러 "변하지 않아요" = 자산감, 피부 "매일 달라져요" = 재방문 넛지 — 명확한 가치.
 * - 체형·헤어 "천천히 변해요"는 카드의 "N일 전" 대비 추가 정보가 미미하고 혼란 유발.
 * - 메이크업은 측정이 아닌 표현 레이어(M-1)라 추구미에 따라 달라짐 —
 *   변동 주기 뱃지를 붙이는 것 자체가 과한 주장(범주 오류).
 * 내부 분류(AXIS_CADENCE — 추천 레이어·갱신 프롬프트)는 그대로, 카드 노출만 제한.
 */
const CADENCE_BADGE_AXES: ReadonlySet<string> = new Set(['personal_color', 'skin']);

/** 프로필 카드에서 변동 뱃지를 보여줄 축인지 ('personal-color'/'personal_color' 표기 모두 수용). */
export function shouldShowCadenceBadge(axis: string): boolean {
  return CADENCE_BADGE_AXES.has(axis.replace(/-/g, '_'));
}
