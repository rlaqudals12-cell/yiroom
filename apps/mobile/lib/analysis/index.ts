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

// 진단지 지표 평문 포맷 — 등급·색상 방향성 부여 금지
export { formatReportReading } from './report-readings';

// 저장 결과 재방문 경계 — historyId 정확 조회 또는 최신 1건
export {
  loadStoredAnalysisRecord,
  readStoredFallbackFlag,
  resolveStoredFallback,
  finiteNumber,
  storedRecord,
  stringArray,
  StoredResultError,
} from './stored-result-loader';
export type { StoredAnalysisAxis, StoredAnalysisRecord } from './stored-result-loader';
