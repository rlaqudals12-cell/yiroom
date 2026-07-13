/**
 * API 유틸리티 모듈
 *
 * @module lib/api
 */
export { checkRateLimit, incrementRateLimit, getRateLimitInfo } from './rate-limit';

// 통합 분석 HTTP 클라이언트 (웹 API 재사용) — ADR-102
export { requestIntegratedAnalysis, IntegratedApiError } from './integrated';

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
export type {
  IntegratedAnalysisInput,
  IntegratedAnalysisResult,
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
