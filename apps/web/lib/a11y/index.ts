/**
 * 접근성(A11y) 유틸리티 모듈
 *
 * WCAG 2.1 AA 준수를 위한 유틸리티 모음
 *
 * @see SDD-ACCESSIBILITY-GUIDELINES.md
 */

// 색상 대비 유틸리티
export {
  // 타입
  type RGBColor,
  type ContrastResult,
  // 상수
  CONTRAST_THRESHOLDS,
  BRAND_CONTRAST_MATRIX,
  // 함수
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  checkContrast,
  isReadable,
  getReadableTextColor,
  adjustBrightness,
  adjustForContrast,
} from './contrast-utils';

// WCAG 체크리스트
export {
  // 타입
  type CheckStatus,
  type WCAGCheckItem,
  type WCAGCheckResult,
  // 상수
  WCAG_CHECKLIST,
  ANALYSIS_MODULE_CHECKLIST,
  CATEGORY_LABELS,
  LEVEL_DESCRIPTIONS,
  // 함수
  calculateCheckResult,
  filterByCategory,
  filterByLevel,
  getModuleChecklist,
  getCheckItemById,
} from './wcag-checklist';

// ARIA 유틸리티
export {
  // 타입
  type AriaLabelledByProps,
  type AriaDescribedByProps,
  type AnalysisCardAriaProps,
  type ConfidenceLevelInfo,
  // 상수
  SR_ONLY_CLASS,
  // 함수
  generateId,
  resetIdCounter,
  announce,
  announceAnalysisComplete,
  announceProgress,
  announceError,
  createLabelledBy,
  createDescribedBy,
  getAnalysisCardAriaProps,
  getConfidenceLevel,
  getSrOnlyProps,
} from './aria-utils';

// 키보드 네비게이션 유틸리티
export {
  // 타입
  type KeyCode,
  type NavigationDirection,
  type ListNavigationOptions,
  // 상수
  KEYS,
  FOCUSABLE_SELECTOR,
  // 함수
  isKey,
  isOneOfKeys,
  isActivationKey,
  isArrowKey,
  getFocusableElements,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  handleListKeyDown,
  handleTabListKeyDown,
  setRovingTabIndex,
  createSkipLink,
} from './keyboard-utils';

// 포커스 트랩 유틸리티
export {
  // 타입
  type FocusTrapOptions,
  type FocusTrap,
  // 함수
  createFocusTrap,
  trapFocus,
} from './focus-trap';

// 스크린리더 유틸리티
export {
  // 타입
  type AriaValidationResult,
  type AriaIssue,
  type LandmarkValidation,
  type ScreenReaderTestItem,
  // 함수
  getAccessibleName,
  getAccessibleDescription,
  getElementRole,
  validateAriaAttributes,
  validateContainer,
  validateLandmarks,
  formatValidationResults,
  // 상수
  SCREEN_READER_CHECKLIST,
} from './screen-reader-utils';
