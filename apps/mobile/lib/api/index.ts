/**
 * API 유틸리티 모듈
 *
 * @module lib/api
 */
export { checkRateLimit, incrementRateLimit, getRateLimitInfo } from './rate-limit';

// 통합 분석 HTTP 클라이언트 (웹 API 재사용) — ADR-102
export { requestIntegratedAnalysis, IntegratedApiError } from './integrated';
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
