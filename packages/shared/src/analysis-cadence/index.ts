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

/** 그룹별 표시 메타 (아이콘 의미 — 실제 아이콘 매핑은 UI 레이어). */
export const CADENCE_META: Record<CadenceGroup, { label: string; hint: string }> = {
  identity: { label: '평생', hint: '거의 변하지 않아요' },
  slow: { label: '천천히', hint: '체중·시간에 따라 가끔 변해요' },
  condition: { label: '오늘', hint: '컨디션에 따라 자주 변해요' },
};

/** 축의 변동 그룹 조회 (미상 축은 condition 보수적 기본값). */
export function getAxisCadence(axis: string): CadenceGroup {
  return (AXIS_CADENCE as Record<string, CadenceGroup>)[axis] ?? 'condition';
}
