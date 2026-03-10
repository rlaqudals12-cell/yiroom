/**
 * Safety 모듈 공개 API (Barrel Export)
 *
 * @module lib/safety
 * @description 안전성 프로필 관리, 4단계 안전성 파이프라인, AES-256-GCM 암호화
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 * @see docs/specs/SDD-SAFETY-PROFILE.md
 */

// 파이프라인
export { checkProductSafety } from './pipeline';

// 저장소
export { getSafetyProfile, upsertSafetyProfile } from './repository';

// 면책 문구
export { getDisclaimer, DISCLAIMER_GLOBAL } from './disclaimer';

// 암호화 유틸리티
export { isEncryptionAvailable } from './crypto';

// 타입
export type {
  SafetyProfile,
  SafetyReport,
  SafetyAlert,
  SafetyLevel,
  SafetyAlertType,
  SafetyAction,
  SafetyGrade,
  SafetyCheckInput,
} from './types';
