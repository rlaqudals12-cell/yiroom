/**
 * 진단지 프리미티브 공개 API (P8 barrel)
 *
 * 왜 barrel: 진단지 문법(ADR-120 — 아이브로우 → 세리프 히어로 → 러닝넘버 섹션 →
 * 속성표 → 신뢰 푸터)을 PC·피부·헤어·메이크업·체형 결과가 공유하기 위한 공용 모듈.
 * 정본 렌더링은 PC AnalysisResult에서 추출 — 픽셀 동일 유지가 계약.
 */
export { ReportEyebrow, type ReportEyebrowProps } from './ReportEyebrow';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';
export { AttrRow, RowTable, type AttrRowProps, type RowTableProps } from './RowTable';
export { SpectrumRow, type SpectrumRowProps } from './SpectrumRow';
export { TrustFooter, getConfidenceGrade, type TrustFooterProps } from './TrustFooter';
