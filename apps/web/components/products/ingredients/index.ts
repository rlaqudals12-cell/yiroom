/**
 * 화장품 성분 컴포넌트 모듈
 * @description EWG 등급, 주의 성분, 피부타입 분석 UI
 */

// 메인 섹션
export {
  IngredientAnalysisSection,
  IngredientAnalysisSectionSkeleton,
} from './IngredientAnalysisSection';
export { IngredientAnalysisSectionDynamic } from './IngredientAnalysisDynamic';

// 배지 및 알림
export { IngredientEWGBadge, EWGScoreBar } from './IngredientEWGBadge';
export { IngredientCautionAlert } from './IngredientCautionAlert';

// 필터
export {
  IngredientFilterTabs,
  FunctionSubFilter,
  type IngredientFilterType,
} from './IngredientFilterTabs';

// 카드 및 리스트
export { IngredientCard, IngredientCardSkeleton } from './IngredientCard';
export { IngredientList } from './IngredientList';

// 차트 및 분석
export { IngredientFunctionChart, EWGDistributionChart } from './IngredientFunctionChart';
export { SkinTypeAnalysis, SkinTypeBadge } from './SkinTypeAnalysis';

// AI 분석
export { AIIngredientSummary } from './AIIngredientSummary';
