/**
 * 브리핑 모듈 공개 API (ADR-114)
 *
 * @module lib/briefing
 * @description 전속 뷰티팀의 "아침 메시지"를 규칙으로 조립(AI 호출 없음).
 */

export {
  composeBriefing,
  getTimeSlot,
  TONE_GUIDE,
  type Briefing,
  type BriefingInput,
  type BriefingSkinTrend,
  type BriefingRecentProduct,
  type BriefingCapsulePriority,
  type TimeSlot,
} from './compose';
