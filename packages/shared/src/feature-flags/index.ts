/**
 * 정적 Feature Flags (빌드타임 상수)
 *
 * DB 기반 런타임 킬스위치(apps/web/lib/admin/feature-flags.ts)와 다름.
 * 이 파일은 "코드 경로를 토글하는" 목적: UI 숨김/복원, 실험 기능 진입점 차단 등.
 *
 * 근거: ADR-098 — 이룸 정체성 재정의 v2 (2026-04-22)
 */

export const FEATURE_FLAGS = {
  /**
   * W-1 (운동) + N-1 (영양) UI 노출 여부.
   *
   * false: UI 숨김 (코드/DB는 유지). 재검토 시점까지 Navbar/홈/대시보드/온보딩에서 진입점 차단.
   * true:  전체 UI 복원 (Phase 2 진입 시).
   *
   * 재검토 조건: MAU 10만+ 또는 "동반자 단계" 진입 (ADR-098 섹션 0.4)
   */
  WELLNESS_PHASE2: false,

  /**
   * C-1 결과 페이지 섹션 3: 옷장 조합 노출 여부.
   *
   * false: "준비 중" CTA만 노출 (Phase 1.5 대기)
   * true:  인벤토리 연동 섹션 활성화
   *
   * 재검토 조건: 웹 인벤토리 등록 UI 구현 완료 (Phase 1.5)
   */
  CLOSET_INTEGRATION: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * 플래그 값 조회 (타입 안전성).
 *
 * @example
 * if (isFeatureEnabled('WELLNESS_PHASE2')) { ... }
 */
export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[key];
}
