/**
 * 제품 스캔 컴포넌트 통합 export
 *
 * 정본 판정 = ScanVerdict("나와의 적합도", ADR-112).
 * ScanResult(성분 안전성 리스트)는 하위 빌딩 블록으로 유지된다.
 */

export { ScanVerdict } from './ScanVerdict';
export type { ScanVerdictProps, OcrConfidence } from './ScanVerdict';

export { ScanResult } from './ScanResult';
export type { IngredientSafety, ScannedIngredient } from './ScanResult';

export { ScanCamera } from './ScanCamera';
export { BarcodeInput } from './BarcodeInput';
export { IngredientConflictAlert } from './IngredientConflictAlert';
