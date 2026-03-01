/**
 * 동의 버전 관리 모듈
 *
 * 이미지 저장 동의 버전 추적, 재동의 판단, 미성년자 검증
 *
 * @module lib/consent
 * @see docs/specs/SDD-VISUAL-SKIN-REPORT.md §4.10
 */

// 동의 정보 타입
export interface ImageConsent {
  consent_given: boolean;
  consent_version: string;
  consent_date?: string;
  retention_until?: string;
}

// 동의 버전 히스토리
export const CONSENT_VERSIONS = {
  'v1.0': { date: '2026-01-08', changes: '최초 버전' },
} as const;

export const LATEST_CONSENT_VERSION = 'v1.0';

/**
 * 재동의 필요 여부 확인
 *
 * 기존 동의가 있고, 버전이 다르면 재동의 필요
 */
export function shouldRequestReconsent(
  currentConsent: ImageConsent | null,
  latestVersion: string = LATEST_CONSENT_VERSION
): boolean {
  if (!currentConsent) return false;
  if (!currentConsent.consent_given) return false;
  return currentConsent.consent_version !== latestVersion;
}

/**
 * 버전 간 변경 사항 조회
 */
export function getVersionChanges(fromVersion: string, toVersion: string): string[] {
  const changes: string[] = [];
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
 */
export function calculateRetentionUntil(consentDate: Date = new Date()): string {
  const retention = new Date(consentDate);
  retention.setFullYear(retention.getFullYear() + 1);
  return retention.toISOString();
}

/**
 * 동의 만료까지 남은 일수
 *
 * @returns 남은 일수 (음수면 만료됨), null이면 만료일 없음
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
 * 생년월일 미입력 시 동의 허용 (묵시적 성인 확인)
 */
export function checkConsentEligibility(birthdate: string | null | undefined): {
  canConsent: boolean;
  reason?: 'under_age' | 'no_birthdate';
  requiredAction?: string;
  ageUnverified?: boolean;
} {
  if (!birthdate) {
    return { canConsent: true, ageUnverified: true };
  }

  const birth = new Date(birthdate);
  const today = new Date();

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
