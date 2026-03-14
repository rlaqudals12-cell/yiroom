/**
 * 건강 데이터 동의 관리
 * @description GDPR 준수 동의 플로우 유틸리티
 */

import type { ConsentScope, HealthDataConsent, HealthPlatform } from './types';

// ============================================
// 상수
// ============================================

/** 기본 데이터 보관 기간 (일) */
export const DEFAULT_RETENTION_DAYS = 365;

/** 동의 범위 설명 (한국어) */
export const CONSENT_SCOPE_DESCRIPTIONS: Record<
  ConsentScope,
  {
    title: string;
    description: string;
    purpose: string;
  }
> = {
  sleep: {
    title: '수면 데이터',
    description: '수면 시간, 수면 단계(깊은잠/렘수면), 수면 품질',
    purpose: '피부 재생 분석, 운동 강도 조절에 활용해요',
  },
  heart_rate: {
    title: '심박수 데이터',
    description: '안정 시 심박수, 평균/최대 심박수, 심박 변이도(HRV)',
    purpose: '운동 강도 자동 조절, 스트레스 수준 파악에 활용해요',
  },
  steps: {
    title: '걸음수 데이터',
    description: '일일 걸음수, 이동 거리',
    purpose: '활동량 기반 칼로리 계산에 활용해요',
  },
  activity: {
    title: '활동 데이터',
    description: '운동 시간, 소모 칼로리, 이동 거리',
    purpose: '운동 기록 자동 입력, 영양 섭취 목표 조정에 활용해요',
  },
  stress: {
    title: '스트레스 데이터',
    description: 'HRV 기반 스트레스 수준 추정',
    purpose: '스트레스→피부 영향 분석, 명상 가이드 제공에 활용해요',
  },
};

// ============================================
// 동의 생성 / 검증
// ============================================

/**
 * 새 동의 객체 생성
 */
export function createConsent(
  userId: string,
  platform: HealthPlatform,
  scopes: ConsentScope[],
  retentionDays: number = DEFAULT_RETENTION_DAYS
): HealthDataConsent {
  return {
    userId,
    platform,
    scopes: [...new Set(scopes)], // 중복 제거
    consentedAt: new Date().toISOString(),
    revokedAt: null,
    retentionDays,
  };
}

/**
 * 동의가 유효한지 확인
 */
export function isConsentValid(consent: HealthDataConsent): boolean {
  // 철회된 동의
  if (consent.revokedAt !== null) return false;

  // 보관 기간 초과
  const consentDate = new Date(consent.consentedAt);
  const expiryDate = new Date(consentDate);
  expiryDate.setDate(expiryDate.getDate() + consent.retentionDays);

  return new Date() < expiryDate;
}

/**
 * 특정 범위에 대한 동의가 있는지 확인
 */
export function hasConsentForScope(consent: HealthDataConsent, scope: ConsentScope): boolean {
  if (!isConsentValid(consent)) return false;
  return consent.scopes.includes(scope);
}

/**
 * 동의 철회
 */
export function revokeConsent(consent: HealthDataConsent): HealthDataConsent {
  return {
    ...consent,
    revokedAt: new Date().toISOString(),
  };
}

/**
 * 동의 범위 업데이트 (새 동의 생성)
 */
export function updateConsentScopes(
  consent: HealthDataConsent,
  newScopes: ConsentScope[]
): HealthDataConsent {
  return {
    ...consent,
    scopes: [...new Set(newScopes)],
    consentedAt: new Date().toISOString(), // 재동의
    revokedAt: null,
  };
}

/**
 * 보관 기간 만료까지 남은 일수
 */
export function getRetentionRemainingDays(consent: HealthDataConsent): number {
  if (consent.revokedAt !== null) return 0;

  const consentDate = new Date(consent.consentedAt);
  const expiryDate = new Date(consentDate);
  expiryDate.setDate(expiryDate.getDate() + consent.retentionDays);

  const remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return Math.max(0, remaining);
}

/**
 * GDPR 데이터 삭제 기한 계산
 * 동의 철회 후 30일 이내 삭제 필요
 */
export function getDataDeletionDeadline(consent: HealthDataConsent): string | null {
  if (consent.revokedAt === null) return null;

  const revokedDate = new Date(consent.revokedAt);
  revokedDate.setDate(revokedDate.getDate() + 30);
  return revokedDate.toISOString();
}
