// 동의 버전 관리 유틸리티
// SDD-VISUAL-SKIN-REPORT.md §4.10

import type { ImageConsent } from '@/components/analysis/consent/types';

// 동의 버전 정보
export const CONSENT_VERSIONS = {
  'v1.0': { date: '2026-01-08', changes: '최초 버전' },
  // 향후 버전 추가 시 여기에 기록
} as const;

// 현재 최신 버전
export const LATEST_CONSENT_VERSION = 'v1.0';

/**
 * 재동의가 필요한지 확인
 * 기존 동의가 있고, 버전이 다르면 재동의 필요
 *
 * @param currentConsent - 현재 저장된 동의 정보
 * @param latestVersion - 최신 동의서 버전 (기본: LATEST_CONSENT_VERSION)
 * @returns 재동의 필요 여부
 *
 * @example
 * ```tsx
 * if (shouldRequestReconsent(userConsent)) {
 *   setShowReconsentModal(true);
 * }
 * ```
 */
export function shouldRequestReconsent(
  currentConsent: ImageConsent | null,
  latestVersion: string = LATEST_CONSENT_VERSION
): boolean {
  if (!currentConsent) return false;
  if (!currentConsent.consent_given) return false;

  // 버전이 다르면 재동의 필요
  return currentConsent.consent_version !== latestVersion;
}

/**
 * 버전 변경 사항 조회
 *
 * @param fromVersion - 이전 버전
 * @param toVersion - 새 버전
 * @returns 변경 사항 배열
 */
export function getVersionChanges(fromVersion: string, toVersion: string): string[] {
  const changes: string[] = [];

  // 버전 순서대로 변경 사항 수집
  const versions = Object.keys(CONSENT_VERSIONS);
  const fromIndex = versions.indexOf(fromVersion);
  const toIndex = versions.indexOf(toVersion);

  if (fromIndex < 0 || toIndex < 0 || fromIndex >= toIndex) {
    return changes;
  }

  for (let i = fromIndex + 1; i <= toIndex; i++) {
    const version = versions[i] as keyof typeof CONSENT_VERSIONS;
    const info = CONSENT_VERSIONS[version];
    if (info) {
      changes.push(`${version}: ${info.changes}`);
    }
  }

  return changes;
}

/**
 * 동의 만료일 계산 (동의일 + 1년)
 *
 * @param consentDate - 동의일 (기본: 현재)
 * @returns ISO 형식 만료일 문자열
 */
export function calculateRetentionUntil(consentDate: Date = new Date()): string {
  const retention = new Date(consentDate);
  retention.setFullYear(retention.getFullYear() + 1);
  return retention.toISOString();
}

/**
 * 동의 만료까지 남은 일수 계산
 *
 * @param retentionUntil - 만료일
 * @returns 남은 일수 (음수면 만료됨)
 */
export function getDaysUntilExpiry(retentionUntil: string | null): number | null {
  if (!retentionUntil) return null;

  const expiry = new Date(retentionUntil);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 미성년자 동의 자격 체크 (14세 이상)
 *
 * @param birthdate - 생년월일 (YYYY-MM-DD)
 * @returns 동의 가능 여부 및 이유
 *
 * 참고: 생년월일이 미입력인 경우 동의 허용 (사용자가 14세 이상임을 묵시적으로 확인)
 * 14세 미만으로 확인된 경우에만 동의 불가
 */
export function checkConsentEligibility(birthdate: string | null | undefined): {
  canConsent: boolean;
  reason?: 'under_age' | 'no_birthdate';
  requiredAction?: string;
  ageUnverified?: boolean;
} {
  // 생년월일 미입력: 동의 허용 (묵시적 성인 확인)
  // UX 개선: 대부분의 사용자는 성인이며, 생년월일 미입력으로 기능 차단은 과도함
  if (!birthdate) {
    console.warn('[Consent] No birthdate provided - allowing consent (implicit age confirmation)');
    return {
      canConsent: true,
      ageUnverified: true,
    };
  }

  const birth = new Date(birthdate);
  const today = new Date();

  // 나이 계산
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 14) {
    return {
      canConsent: false,
      reason: 'under_age',
      requiredAction: '14세 미만은 이미지 저장 기능을 이용할 수 없어요',
    };
  }

  return { canConsent: true };
}
