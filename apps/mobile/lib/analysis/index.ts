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
