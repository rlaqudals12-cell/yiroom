/**
 * API 유틸리티 모듈
 *
 * @module lib/api
 */
export { checkRateLimit, incrementRateLimit, getRateLimitInfo } from './rate-limit';

// 통합 분석 HTTP 클라이언트 (웹 API 재사용) — ADR-102
export { requestIntegratedAnalysis, IntegratedApiError } from './integrated';

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
