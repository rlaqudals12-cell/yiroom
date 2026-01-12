/**
 * Visual Analysis Components
 * @description S-1+ 광원 시뮬레이션, PC-1+ 드레이핑, 시너지 인사이트 컴포넌트
 */

// Phase 1: S-1+ 광원 시뮬레이션
export { default as LightModeTab, LightModeLegend } from './LightModeTab';
export { default as SkinHeatmapCanvas, HeatmapMetrics } from './SkinHeatmapCanvas';

// Phase 2: PC-1+ 드레이핑 시뮬레이션
export { default as DrapeColorPalette } from './DrapeColorPalette';
export { default as DrapeSimulator } from './DrapeSimulator';

// Phase 3: 시너지 인사이트
export {
  default as SynergyInsightCard,
  SynergyScoreBadge,
  SynergyInline,
} from './SynergyInsightCard';

// 페이지 통합용 탭 컴포넌트
export { default as VisualAnalysisTab } from './VisualAnalysisTab';
export { default as DrapingSimulationTab } from './DrapingSimulationTab';
export { default as BodyStylingTab } from './BodyStylingTab';

// Phase L-2: 자세 교정 시스템
export { default as PostureSimulator } from './PostureSimulator';
