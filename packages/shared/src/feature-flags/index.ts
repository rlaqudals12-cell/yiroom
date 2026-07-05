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

  /**
   * 날씨 기반 코디 추천 노출 여부.
   *
   * false: 홈 환경 조언 카드·/style/weather 진입점 숨김 (시각 정체성 5축 외 부가 기능).
   * true:  복원.
   *
   * 근거: 기능 과잉 정리 (2026-05-16). 정체성·수익 퍼널 비기여.
   */
  WEATHER: false,

  /**
   * 소셜 피드(UGC) 노출 여부.
   *
   * false: /feed 진입점 숨김 (게이미피케이션·소셜, 정체성·수익 비기여).
   * true:  복원.
   *
   * 근거: 기능 과잉 정리 (2026-05-16). 친구/리더보드/챌린지는 별도 유지.
   */
  SOCIAL_FEED: false,

  /**
   * 배지(게이미피케이션 보상) 노출 여부.
   *
   * false: /badges·/profile/badges·프로필 배지 섹션 숨김.
   * true:  복원.
   *
   * 근거: 기능 과잉 정리 (2026-05-16). 참여도 보상만, 정체성·수익 비기여.
   */
  BADGES: false,

  /**
   * 프로필 중심 홈 노출 여부 (ADR-109).
   *
   * false: 기존 홈(분석 도구 메뉴 + 3-상태 위젯) 유지.
   * true:  "채워지는 5축 정체성 프로필 카드" 홈으로 전환.
   *
   * 근거: ADR-109 프로필 중심 분석 아키텍처. 점진 출시·즉시 롤백용 게이트.
   * 재검토 조건: Phase 1(프로필 카드 홈) 안정화 후 ON.
   */
  PROFILE_HOME: true,

  /**
   * 홈 위젯 순서 편집(드래그 재배치, WS-11) 진입점 노출 여부.
   *
   * false: "순서 편집" 버튼 숨김 (드래그 코드·저장된 커스텀 순서는 유지).
   * true:  복원.
   *
   * 근거: 기능 과잉 정리 (2026-07-06, P0). 사용자 0명 단계에서 위젯 재배치 수요 없음 —
   * 상시 노출 진입점이 인지 부담만 추가. 파워유저 수요 확인 시 ON.
   */
  WIDGET_REORDER: false,
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
