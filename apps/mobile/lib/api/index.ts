/**
 * API 유틸리티 모듈
 *
 * @module lib/api
 */

// 웹 API base URL 해석 정본 — 모바일 전체(lib/api·capsule·coach·push·화면)가 여기만 쓴다
export { getApiBaseUrl, getWebHostLabel, DEFAULT_API_BASE_URL } from './base-url';

export { checkRateLimit, incrementRateLimit, getRateLimitInfo } from './rate-limit';

// AI 생성 콘텐츠 신고 — 웹 저장 정본으로 접수하는 thin client
export { submitContentReport, ContentReportApiError } from './reports';
export type {
  ContentReportReceipt,
  ContentReportReason,
  ContentReportTargetType,
  SubmitContentReportInput,
} from './reports';

// 계정 즉시 삭제 HTTP 클라이언트 (DB·스토리지·Clerk 파기는 웹 API가 단일 소유)
export { deleteAccount, AccountApiError } from './account';

// 통합 분석 HTTP 클라이언트 (웹 API 재사용) — ADR-102
export {
  requestIntegratedAnalysis,
  createIntegratedClientRequestId,
  isIntegratedAnalysisResult,
  IntegratedApiError,
  INTEGRATED_REQUEST_TIMEOUT_MS,
} from './integrated';

// 단독 축 분석 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
// 체형(body) + 4축(피부·퍼스널컬러·헤어·메이크업). 실 AI·서버 저장·연령/생체 게이트 정본.
export {
  requestBodyAnalysis,
  BodyApiError,
  type BodyAnalysisApiResult,
  type BodyAnalysisInput,
  type BodyType3,
  type BodyStyleRecommendation,
} from './body';
export {
  requestSkinAnalysis,
  SkinApiError,
  type SkinAnalysisApiResult,
  type SkinAnalysisInput,
} from './skin';
export {
  requestPersonalColorAnalysis,
  PersonalColorApiError,
  type PersonalColorApiResult,
  type PersonalColorAnalysisInput,
} from './personalColor';
export {
  requestHairAnalysis,
  HairApiError,
  type HairAnalysisApiResult,
  type HairAnalysisInput,
} from './hair';
export {
  requestMakeupAnalysis,
  MakeupApiError,
  type MakeupAnalysisApiResult,
  type MakeupAnalysisInput,
} from './makeup';

// 생년월일 조회·저장 HTTP 클라이언트 (웹 API 재사용) — 연령 확인 게이트(만 14세) 대응
export {
  fetchBirthdate,
  saveBirthdate,
  evaluateBirthdateGate,
  BirthdateApiError,
} from './birthdate';
export type { BirthdateStatus, BirthdateGate } from './birthdate';

// 약관·생체정보 동의 HTTP 클라이언트 (웹 API 재사용) — 생체동의 게이트(BIPA/PIPA §23) 대응
export {
  fetchAgreementStatus,
  saveAgreement,
  evaluateAgreementGate,
  AgreementApiError,
} from './agreement';
export type { AgreementStatus, AgreementGate, AgreementChecks, AgreementGender } from './agreement';

// 이용기록 분석·마케팅 선택 동의 (웹 저장 정본)
export {
  fetchConsentPreferences,
  updateConsentPreferences,
  ConsentPreferencesApiError,
} from './consent-preferences';
export type { ConsentPreferences, ConsentPreferencesPatch } from './consent-preferences';

// 생체정보 동의 철회 + 선택 저장 이미지 즉시 파기 (웹 API 정본)
export { revokeBiometricConsent, BiometricConsentApiError } from './biometric-consent';
export type {
  BiometricWithdrawalResult,
  PartialBiometricWithdrawalResult,
} from './biometric-consent';
export type {
  IntegratedAnalysisInput,
  IntegratedAnalysisResult,
  IntegratedAnalysisResponse,
  ReusedIntegratedAnalysisResult,
  PersonaProfile,
  AxisCode,
  AxisResult,
  AxisError,
  AxisData,
  SkinQuestionnaire,
  HairQuestionnaire,
  BodyQuestionnaire,
} from './integrated';

// 아침 브리핑 HTTP 클라이언트 (웹 API 재사용) — ADR-118
export { fetchBriefing, BriefingApiError } from './briefing';
export type {
  BriefingResult,
  BriefingData,
  BriefingSentences,
  BriefingSwatch,
  BriefingMyColors,
  BriefingTodayStyle,
  BriefingOutfitColor,
  BriefingTimeSlot,
} from './briefing';

// AI 트윈(내 AI 아바타) HTTP 클라이언트 (웹 API 재사용) — ADR-115 / ADR-118
export {
  fetchMyTwin,
  generateTwin,
  setTwinStatus,
  deleteTwin,
  composeOnTwin,
  parseTwinRecord,
  approvedOnly,
  subscribeTwinChanged,
  notifyTwinChanged,
  TwinApiError,
  TWIN_BUDGET_EXCEEDED,
} from './twin';
export type { TwinStatus, TwinRecord, TwinGenerateInput, TwinComposeOutput } from './twin';

// 성분표 OCR HTTP 클라이언트 (웹 API 재사용) — 2026-07-16 감사 수리 (APK 키 내장 제거)
export { fetchIngredientOcr, ScanOcrApiError } from './scan';

// 인벤토리 이미지 업로드 HTTP 클라이언트 (웹 API 재사용) — 로컬 file:// 저장으로 인한 사진 유실 수리
export { uploadInventoryImage, createUploadItemId, InventoryUploadError } from './inventory-upload';
export type {
  InventoryUploadOptions,
  InventoryUploadCategory,
  InventoryUploadType,
} from './inventory-upload';

// 공유카드 발급 번호 HTTP 클라이언트 (웹 API 재사용) — E+ 카드 실측 순번
export { fetchIssueNo } from './issue-no';

// 오늘의 맞춤 루틴 HTTP 클라이언트 (웹 API 재사용) — ADR-118
export { fetchDailyRoutine, RoutineApiError } from './routine';
export type {
  DailyRoutineResult,
  DailyRoutineData,
  RoutineStepData,
  StepHowToData,
  CarePhaseData,
  GoalData,
  EveningFocusData,
  WeeklyCycleDay,
  CarePhaseId,
  CyclingFocus,
} from './routine';
