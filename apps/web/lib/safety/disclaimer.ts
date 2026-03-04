/**
 * 면책 문구 템플릿
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 * @see docs/legal/DISCLAIMER-TEMPLATES.md
 *
 * 3단계 면책 문구 (Level 1-3) + 글로벌 면책
 */

// =============================================================================
// 면책 문구 상수
// =============================================================================

/** 글로벌 면책 문구 (모든 보고서에 포함) */
const GLOBAL_DISCLAIMER =
  '이 정보는 참고용이며 의학적 진단이나 치료를 대체하지 않아요. ' +
  '알레르기나 건강 문제가 있다면 전문가와 상담해주세요.';

/** Level 1: 알레르겐 교차반응 (BLOCK) */
const LEVEL_1_DISCLAIMER =
  '⚠️ 알레르기 교차반응 위험이 감지되었어요. ' +
  '해당 성분이 포함된 제품의 사용을 중단하고, ' +
  '알레르기 전문의와 상담하는 것을 강력히 권장해요. ' +
  GLOBAL_DISCLAIMER;

/** Level 2: 금기사항/상호작용 (WARN) */
const LEVEL_2_DISCLAIMER =
  '⚠️ 건강 상태에 따라 주의가 필요한 성분이 포함되어 있어요. ' +
  '사용 전 피부과 전문의 또는 약사와 상담해주세요. ' +
  GLOBAL_DISCLAIMER;

/** Level 3: EWG 일반 안전성 (INFORM) */
const LEVEL_3_DISCLAIMER = 'ℹ️ 일부 성분에 대해 참고 정보를 제공해요. ' + GLOBAL_DISCLAIMER;

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 경고 레벨에 따른 면책 문구 반환
 *
 * @param maxLevel 보고서 내 최고 경고 레벨 (0=경고 없음, 1-3)
 */
export function getDisclaimer(maxLevel: 0 | 1 | 2 | 3): string {
  switch (maxLevel) {
    case 1:
      return LEVEL_1_DISCLAIMER;
    case 2:
      return LEVEL_2_DISCLAIMER;
    case 3:
      return LEVEL_3_DISCLAIMER;
    default:
      return GLOBAL_DISCLAIMER;
  }
}

/** 글로벌 면책 문구 (외부 참조용) */
export const DISCLAIMER_GLOBAL = GLOBAL_DISCLAIMER;
