/**
 * 사용자에게 노출하는 분석 5축의 정본.
 *
 * 자세·구강처럼 코드만 보존하는 숨김 모듈은 제네릭 이력/비교 화면의
 * 쿼리 파라미터로도 다시 노출하지 않는다.
 */
export const VISIBLE_ANALYSIS_MODULES = [
  'personal-color',
  'skin',
  'body',
  'hair',
  'makeup',
] as const;

export type VisibleAnalysisModule = (typeof VISIBLE_ANALYSIS_MODULES)[number];

const VISIBLE_ANALYSIS_MODULE_SET = new Set<string>(VISIBLE_ANALYSIS_MODULES);

export function isVisibleAnalysisModule(value: unknown): value is VisibleAnalysisModule {
  return typeof value === 'string' && VISIBLE_ANALYSIS_MODULE_SET.has(value);
}

/** 숨김·미지원·잘못된 쿼리 값은 호출 화면이 정한 안전한 기본값으로 되돌린다. */
export function resolveVisibleAnalysisModule(
  value: unknown,
  fallback: VisibleAnalysisModule
): VisibleAnalysisModule {
  return isVisibleAnalysisModule(value) ? value : fallback;
}
