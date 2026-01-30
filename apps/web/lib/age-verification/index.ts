/**
 * 연령 검증 모듈
 * 한국 청소년보호법: 만 14세 미만 정보 수집 금지
 *
 * @module lib/age-verification
 */

// 최소 이용 연령 (한국 법률)
export const MINIMUM_AGE = 14;

/**
 * 생년월일에서 만 나이 계산
 *
 * @param birthDate - 생년월일 (YYYY-MM-DD 또는 Date)
 * @param referenceDate - 기준일 (기본: 오늘)
 * @returns 만 나이
 */
export function calculateAge(
  birthDate: string | Date,
  referenceDate: Date = new Date()
): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();

  // 생일이 아직 지나지 않은 경우
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 미성년자(만 14세 미만) 여부 확인
 *
 * @param birthDate - 생년월일 (YYYY-MM-DD 또는 Date)
 * @returns 만 14세 미만이면 true
 */
export function isMinor(birthDate: string | Date | null | undefined): boolean {
  if (!birthDate) return false; // null/undefined는 미성년자로 간주하지 않음 (별도 처리 필요)

  const age = calculateAge(birthDate);
  return age < MINIMUM_AGE;
}

/**
 * 연령 검증 결과 타입
 */
export interface AgeVerificationResult {
  /** 서비스 이용 가능 여부 */
  canUseService: boolean;
  /** 생년월일 입력 필요 여부 */
  needsBirthDate: boolean;
  /** 미성년자 여부 (14세 미만) */
  isMinor: boolean;
  /** 만 나이 (생년월일이 있는 경우) */
  age?: number;
  /** 안내 메시지 */
  message?: string;
}

/**
 * 사용자 연령 검증
 * 생년월일 유무와 나이에 따라 서비스 이용 가능 여부 판단
 *
 * @param birthDate - 생년월일 (null이면 미입력)
 * @returns 검증 결과
 *
 * @example
 * ```tsx
 * const result = verifyAge(user.birthDate);
 * if (result.needsBirthDate) {
 *   redirect('/complete-profile');
 * }
 * if (result.isMinor) {
 *   redirect('/age-restricted');
 * }
 * ```
 */
export function verifyAge(birthDate: string | Date | null | undefined): AgeVerificationResult {
  // 1. 생년월일 미입력
  if (!birthDate) {
    return {
      canUseService: false,
      needsBirthDate: true,
      isMinor: false,
      message: '서비스 이용을 위해 생년월일을 입력해 주세요.',
    };
  }

  // 2. 나이 계산
  const age = calculateAge(birthDate);

  // 3. 만 14세 미만
  if (age < MINIMUM_AGE) {
    return {
      canUseService: false,
      needsBirthDate: false,
      isMinor: true,
      age,
      message: `만 ${MINIMUM_AGE}세 이상만 서비스를 이용할 수 있습니다.`,
    };
  }

  // 4. 이용 가능
  return {
    canUseService: true,
    needsBirthDate: false,
    isMinor: false,
    age,
  };
}

/**
 * 생년월일 유효성 검사
 *
 * @param birthDate - 검증할 생년월일
 * @returns 유효한 형식이면 true
 */
export function isValidBirthDate(birthDate: string): boolean {
  // YYYY-MM-DD 형식 검사
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(birthDate)) return false;

  // 파싱
  const [year, month, day] = birthDate.split('-').map(Number);

  // 기본 범위 검사
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // 월별 최대 일수 확인
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // 윤년 확인
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (isLeapYear) {
    daysInMonth[1] = 29;
  }

  if (day > daysInMonth[month - 1]) return false;

  // Date 객체로 실제 유효성 확인
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  // 미래 날짜가 아닌지 확인
  if (date > new Date()) return false;

  // 너무 오래된 날짜가 아닌지 확인 (150년 이내)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) return false;

  return true;
}
