/**
 * 분석 모듈 공개 API
 */
export {
  savePersonalColorResult,
  saveSkinResult,
  saveBodyResult,
  saveHairResult,
  saveMakeupResult,
} from './saveResult';

// 결론 카드("그래서, 이렇게 하세요") 조립 로직 — ADR-111 표현 원칙 1
export {
  buildSkinTopActions,
  buildPersonalColorTopActions,
  buildBodyTopActions,
  buildHairTopActions,
  buildMakeupTopActions,
} from './top-actions';
export type { TopAction, TopActionSwatch } from './top-actions';

// 헤어 두피 주의 성분 + 고민 안내 (웹 hair-analysis.ts 포팅)
export { getHairCautionIngredients, getScalpConcernNotice } from './hair-guidance';
