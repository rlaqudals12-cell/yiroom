/**
 * 연령 검증 모듈
 *
 * 한국 법률 기반 연령 제한 (만 14세 미만 서비스 이용 제한)
 *
 * @module lib/age-verification
 */

// ─── 상수 ─────────────────────────────────────────────

/** 최소 이용 연령 (한국 개인정보보호법) */
export const MINIMUM_AGE = 14;

// ─── 타입 ─────────────────────────────────────────────

export interface AgeVerificationResult {
  isVerified: boolean;
  age: number;
  isMinor: boolean;
  message: string;
}

// ─── 핵심 함수 ───────────────────────────────────────

/**
 * 생년월일로 만 나이 계산
 *
 * 한국식 만 나이 기준 (2023년 민법 개정)
 */
export function calculateAge(birthDate: Date, referenceDate?: Date): number {
  const ref = referenceDate ?? new Date();
  let age = ref.getFullYear() - birthDate.getFullYear();

  const monthDiff = ref.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * 미성년자 여부 확인
 */
export function isMinor(birthDate: Date): boolean {
  return calculateAge(birthDate) < MINIMUM_AGE;
}

/**
 * 연령 검증 전체 플로우
 */
export function verifyAge(birthDate: Date): AgeVerificationResult {
  const age = calculateAge(birthDate);
  const minor = age < MINIMUM_AGE;

  return {
    isVerified: !minor,
    age,
    isMinor: minor,
    message: minor
      ? `만 ${MINIMUM_AGE}세 미만은 서비스를 이용할 수 없어요`
      : '연령 인증이 완료되었어요',
  };
}

// ─── 생년월일 검증 ───────────────────────────────────

/**
 * YYYY-MM-DD 형식 유효성 검사
 */
export function isValidBirthDate(dateStr: string): boolean {
  // 형식 검사
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 범위 검사
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // 월별 일수 검사
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;

  // 미래 날짜 검사
  const date = new Date(year, month - 1, day);
  if (date.getTime() > Date.now()) return false;

  return true;
}

/**
 * 생년월일 문자열 → Date 파싱
 */
export function parseBirthDate(dateStr: string): Date | null {
  if (!isValidBirthDate(dateStr)) return null;

  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ─── 연령 제한 라우트 ────────────────────────────────

const AGE_RESTRICTED_ROUTES = [
  '/(analysis)',
  '/(tabs)',
  '/settings',
  '/products',
];

const EXEMPT_ROUTES = [
  '/(auth)',
  '/sign-in',
  '/sign-up',
  '/age-restricted',
];

/**
 * 연령 검증이 필요한 라우트인지 확인
 */
export function isAgeVerificationRequiredRoute(pathname: string): boolean {
  // 면제 라우트 확인
  if (EXEMPT_ROUTES.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // 제한 라우트 확인
  return AGE_RESTRICTED_ROUTES.some((route) => pathname.startsWith(route));
}

// ─── 유틸리티 ─────────────────────────────────────────

/**
 * 연령 표시용 포맷 (만 나이)
 */
export function formatAge(birthDate: Date): string {
  const age = calculateAge(birthDate);
  return `만 ${age}세`;
}

/**
 * 연령대 분류
 */
export function getAgeGroup(age: number): string {
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  return '50대 이상';
}
