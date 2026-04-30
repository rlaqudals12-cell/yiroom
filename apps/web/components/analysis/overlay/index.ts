/**
 * P1-5: overlay/ barrel export — 공개 API
 *
 * @module components/analysis/overlay
 * @description 7모듈 시각적 오버레이 컴포넌트 공개 인터페이스.
 * P8 모듈 경계 준수: 외부는 index.ts를 통해서만 import.
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md 섹션 7
 */

// =============================================================================
// Phase 1: 공통 인프라
// =============================================================================

// P1-1: 오버레이 공통 래퍼
export { AnalysisOverlayBase } from './AnalysisOverlayBase';
export type { AnalysisOverlayBaseProps, OverlayDimensions } from './AnalysisOverlayBase';

// P1-3: 강점/전체 보기 토글
export { StrengthHighlightToggle } from './StrengthHighlightToggle';
export type { StrengthHighlightToggleProps } from './StrengthHighlightToggle';

// P1-4: 스캐닝 애니메이션
export { ScanningAnimation } from './ScanningAnimation';
export type { ScanningAnimationProps, ScanType } from './ScanningAnimation';

// P1-0: face-api.js 모델 로딩 싱글턴 (internal이지만 3모듈 공유)
export {
  loadFaceModels,
  detectFaceLandmarks,
  isFaceModelsLoaded,
} from './internal/face-model-loader';

// P1-2: 디자인 토큰 (internal이지만 모듈별 오버레이에서 사용)
export { OVERLAY_TOKENS, SCORE_COLORS, getZoneStyle } from './internal/overlay-tokens';
export type { OverlayMode, OverlayTokens } from './internal/overlay-tokens';

// =============================================================================
// Phase 2: 모듈별 오버레이 (Phase 2 구현 후 활성화)
// =============================================================================

// A-3: 피부 히트맵 오버레이
export { FaceHeatmapOverlay } from './FaceHeatmapOverlay';
export type { FaceHeatmapOverlayProps } from './FaceHeatmapOverlay';

// A-6: 메이크업 페이스맵 오버레이
export { MakeupFaceMapOverlay } from './MakeupFaceMapOverlay';
export type { MakeupFaceMapOverlayProps } from './MakeupFaceMapOverlay';

// A-9: 헤어 얼굴형 윤곽 오버레이
export { FaceOutlineOverlay } from './FaceOutlineOverlay';
export type { FaceOutlineOverlayProps, HairStyleRecommendation } from './FaceOutlineOverlay';

// B-3: 체형 스켈레톤 오버레이
export { PoseSkeletonOverlay } from './PoseSkeletonOverlay';
export type { PoseSkeletonOverlayProps } from './PoseSkeletonOverlay';

// B-6: 자세 정렬선 오버레이
export { PostureAlignmentOverlay } from './PostureAlignmentOverlay';
export type { PostureAlignmentOverlayProps } from './PostureAlignmentOverlay';

// C-4: 구강 치아 도식 — ADR-098 Phase 1 OH-1 제거 시 누락된 잔존 정리됨

// =============================================================================
// Phase 3: 익명 공유
// =============================================================================

// S-1: 익명 얼굴 템플릿
export { AnonymousFaceTemplate } from './anonymous/AnonymousFaceTemplate';
export type {
  AnonymousFaceTemplateProps,
  AnonymousFaceShape,
  AnonymousSkinTone,
} from './anonymous/AnonymousFaceTemplate';

// S-2: 익명 체형 템플릿
export { AnonymousBodyTemplate } from './anonymous/AnonymousBodyTemplate';
export type {
  AnonymousBodyTemplateProps,
  AnonymousBodyType,
} from './anonymous/AnonymousBodyTemplate';

// S-3: 공유 모드 토글
export { ShareModeToggle } from './anonymous/ShareModeToggle';
export type { ShareModeToggleProps, ShareMode } from './anonymous/ShareModeToggle';
