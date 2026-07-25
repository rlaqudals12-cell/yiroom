/**
 * 퍼스널컬러 분석 컴포넌트 공개 API
 *
 * 왜 barrel: DrapingSection은 통합분석 결과와 PC 결과 페이지 양쪽이 소비하는
 * 공용 컴포넌트라 라우트 프라이빗(_components)에서 승격 — P8 모듈 경계(index.ts 경유).
 */
export { DrapingSection } from './DrapingSection';
export type { DrapingSectionProps } from './DrapingSection';
export { DrapingSectionDynamic } from './DrapingSectionDynamic';
