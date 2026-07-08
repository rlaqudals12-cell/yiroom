/**
 * 통합 분석 플로우 공개 API (Barrel Export)
 *
 * @module lib/analysis/integrated
 * @description
 *   ADR-099 통합 분석 플로우 — 5축 병렬 분석 모듈의 공개 API.
 *   외부 코드는 이 파일을 통해서만 import 해야 함 (P8 캡슐화).
 *
 * @see docs/adr/ADR-099-integrated-analysis-flow.md
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md
 * @see ./BOUNDARIES.md — 모듈 경계 정의
 *
 * @example
 * ```typescript
 * import {
 *   runIntegratedAnalysis,
 *   integratedAnalysisInputSchema,
 *   type IntegratedAnalysisResult,
 * } from '@/lib/analysis/integrated';
 *
 * const input = integratedAnalysisInputSchema.parse(body);
 * const result = await runIntegratedAnalysis(input, userId);
 * ```
 */

// 오케스트레이션 진입점
export { runIntegratedAnalysis } from './orchestrator';

// 액션 플랜 (ADR-104 체크리스트 #2) — 결과 페이지에서 동적 계산
export { composeActionPlan } from './action-plan';
export type { ActionPlan, ActionItem, ActionHorizon, ComposeActionPlanInput } from './action-plan';

// 축 조합 인사이트 (ADR-104 체크리스트 #4) — 결과 페이지에서 동적 계산
export { composeCrossInsights } from './cross-insights';
export type { CrossInsight, CrossInsights, ComposeCrossInsightsInput } from './cross-insights';

// ADR-109 Phase 3: 2층 추천 분류 (고정/오늘)
export { splitInsightsByCadence, recLayerForInsight } from './recommendation-engine';
export type { RecLayer, LayeredInsights } from './recommendation-engine';

// 통합 큐레이션 (ADR-104 체크리스트 #5) — 세션 기반 제품 세트
export { composeCuration } from './curation';
export type { Curation, CurationItem, CurationCategory, ComposeCurationInput } from './curation';

// 소비자 눈높이 라벨 헬퍼 (원시 영문값 → 한국어) — 요약 카드/상세 아코디언에서 사용
export {
  seasonKo,
  seasonShortKo,
  undertoneKo,
  skinTypeKo,
  faceShapeKo,
  bodyDescKo,
} from './labels';

// 실제 제품 인라인 매칭 타입 (함수는 server 전용 internal/product-matcher 직접 import)
export type { CurationProduct } from './internal/product-matcher';

// 입력 Zod 스키마 (API route에서 사용)
export {
  integratedAnalysisInputSchema,
  skinQuestionnaireSchema,
  hairQuestionnaireSchema,
  bodyQuestionnaireSchema,
  AXIS_CODES,
} from './types';

// 공개 타입
export type {
  IntegratedAnalysisInput,
  IntegratedAnalysisResult,
  AxisCode,
  AxisResult,
  AxisError,
  AxisErrorCode,
  SessionStatus,
  SkinQuestionnaire,
  HairQuestionnaire,
  BodyQuestionnaire,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
  PersonaProfile,
  IntegratedSessionRow,
  RecommendationGender,
  RecommendationSituation,
} from './types';

// 추천 분기용 상수 (성별/상황 옵션 — UI 렌더링)
export { RECOMMENDATION_GENDERS, RECOMMENDATION_SITUATIONS } from './types';

// 내부 구현(internal/)은 외부에 노출하지 않음
