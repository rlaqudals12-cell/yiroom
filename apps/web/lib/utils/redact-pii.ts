/**
 * PII (개인식별정보) 필터링 유틸리티
 * @description 로깅 시 민감 정보 자동 마스킹 (GDPR/PIPA 준수)
 *
 * 마스킹 대상:
 * - email: 이메일 주소
 * - phone: 전화번호
 * - birthDate: 생년월일
 * - clerk_user_id: 사용자 식별자
 * - faceImage, bodyImage: 이미지 URL
 * - address: 주소
 * - name: 실명
 *
 * 사용법:
 * ```typescript
 * import { redactPii, sanitizeForLogging } from '@/lib/utils/redact-pii';
 *
 * // 문자열 마스킹
 * logger.info('User email:', redactPii.email('user@example.com'));
 *
 * // 객체 전체 마스킹
 * const safeData = sanitizeForLogging(userObject);
 * logger.info('User data:', safeData);
 * ```
 */

// 민감 필드 목록 (JSON key 기준)
const PII_FIELDS = [
  'email',
  'phone',
  'phoneNumber',
  'birthDate',
  'birth_date',
  'birthYear',
  'birth_year',
  'address',
  'clerk_user_id',
  'clerkUserId',
  'userId',
  'user_id',
  'faceImage',
  'face_image',
  'faceImageUrl',
  'face_image_url',
  'bodyImage',
  'body_image',
  'bodyImageUrl',
  'body_image_url',
  'skinImage',
  'skin_image',
  'wristImage',
  'wrist_image',
  'imageUrl',
  'image_url',
  'name',
  'fullName',
  'full_name',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'ssn',
  'socialSecurityNumber',
] as const;

// 민감 필드 Set (빠른 조회용)
const PII_FIELD_SET = new Set<string>(PII_FIELDS);

/**
 * 이메일 마스킹
 * @example user@example.com → u***@e***.com
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '[REDACTED]';

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '[REDACTED_EMAIL]';

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  const dotIndex = domainPart.lastIndexOf('.');

  const maskedLocal = localPart.length > 1 ? localPart[0] + '***' : '*';
  const maskedDomain =
    dotIndex > 0
      ? domainPart[0] + '***' + domainPart.slice(dotIndex)
      : '[REDACTED_DOMAIN]';

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * 전화번호 마스킹
 * @example 010-1234-5678 → 010-****-5678
 */
function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '[REDACTED]';

  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '[REDACTED_PHONE]';

  // 마지막 4자리만 보존
  const visible = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 4);

  // 원래 형식 유지 시도
  if (phone.includes('-')) {
    return `${masked.slice(0, 3)}-****-${visible}`;
  }
  return `${masked}${visible}`;
}

/**
 * 사용자 ID 마스킹
 * @example user_2abc123xyz → user_2ab***
 */
function maskUserId(userId: string): string {
  if (!userId || typeof userId !== 'string') return '[REDACTED]';

  if (userId.length <= 8) return '[REDACTED_ID]';

  return `${userId.slice(0, 8)}***`;
}

/**
 * 이미지 URL 마스킹
 * @example https://storage.../user_123/face.jpg → [IMAGE_URL_REDACTED]
 */
function maskImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '[REDACTED]';

  // URL인지 확인
  if (url.startsWith('http') || url.startsWith('data:image')) {
    return '[IMAGE_URL_REDACTED]';
  }

  // 파일 경로 형식
  if (url.includes('/') || url.includes('\\')) {
    return '[IMAGE_PATH_REDACTED]';
  }

  return '[REDACTED]';
}

/**
 * 생년월일 마스킹
 * @example 1990-05-15 → 1990-**-**
 */
function maskBirthDate(date: string): string {
  if (!date || typeof date !== 'string') return '[REDACTED]';

  // ISO 형식 (YYYY-MM-DD)
  const isoMatch = date.match(/^(\d{4})-\d{2}-\d{2}/);
  if (isoMatch) {
    return `${isoMatch[1]}-**-**`;
  }

  // 년도만 추출 가능한 경우
  const yearMatch = date.match(/^(\d{4})/);
  if (yearMatch) {
    return `${yearMatch[1]}****`;
  }

  return '[REDACTED_DATE]';
}

/**
 * 일반 문자열 마스킹
 * @example John Doe → Jo***
 */
function maskGeneral(value: string, visibleChars = 2): string {
  if (!value || typeof value !== 'string') return '[REDACTED]';

  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }

  return value.slice(0, visibleChars) + '***';
}

/**
 * 개별 PII 마스킹 함수들
 */
export const redactPii = {
  email: maskEmail,
  phone: maskPhone,
  userId: maskUserId,
  imageUrl: maskImageUrl,
  birthDate: maskBirthDate,
  general: maskGeneral,

  /**
   * 필드명에 따라 자동으로 적절한 마스킹 적용
   */
  auto: (fieldName: string, value: unknown): unknown => {
    if (value === null || value === undefined) return value;

    const lowerField = fieldName.toLowerCase();

    // 타입 체크
    if (typeof value !== 'string') {
      // 숫자인 경우 (birthYear 등)
      if (typeof value === 'number') {
        if (lowerField.includes('year')) {
          return value; // 년도는 유지
        }
        return '[REDACTED_NUMBER]';
      }
      return value;
    }

    // 이메일
    if (lowerField.includes('email')) {
      return maskEmail(value);
    }

    // 전화번호
    if (lowerField.includes('phone')) {
      return maskPhone(value);
    }

    // 사용자 ID
    if (lowerField.includes('user') && lowerField.includes('id')) {
      return maskUserId(value);
    }
    if (lowerField === 'clerk_user_id' || lowerField === 'clerkuserid') {
      return maskUserId(value);
    }

    // 이미지 URL
    if (lowerField.includes('image') || lowerField.includes('url')) {
      if (value.startsWith('http') || value.startsWith('data:')) {
        return maskImageUrl(value);
      }
    }

    // 생년월일
    if (lowerField.includes('birth') && lowerField.includes('date')) {
      return maskBirthDate(value);
    }

    // 비밀번호/토큰/시크릿
    if (
      lowerField.includes('password') ||
      lowerField.includes('token') ||
      lowerField.includes('secret') ||
      lowerField.includes('key')
    ) {
      return '[REDACTED_SECRET]';
    }

    // 이름
    if (lowerField.includes('name')) {
      return maskGeneral(value, 2);
    }

    // 주소
    if (lowerField.includes('address')) {
      return maskGeneral(value, 5);
    }

    // 기타 민감 필드
    return maskGeneral(value, 3);
  },
};

/**
 * 객체 전체를 로깅용으로 정화 (재귀적)
 * @description 민감 필드를 자동으로 마스킹하여 반환
 */
export function sanitizeForLogging(data: unknown, depth = 0): unknown {
  // 최대 깊이 제한 (순환 참조 방지)
  if (depth > 10) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // null/undefined 처리
  if (data === null || data === undefined) {
    return data;
  }

  // 배열 처리
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item, depth + 1));
  }

  // 객체 처리
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // 민감 필드인지 확인
      if (isPiiField(key)) {
        sanitized[key] = redactPii.auto(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // 중첩 객체 재귀 처리
        sanitized[key] = sanitizeForLogging(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // 기본값 반환 (문자열, 숫자, boolean 등)
  return data;
}

/**
 * 필드가 PII인지 확인
 */
export function isPiiField(fieldName: string): boolean {
  // 정확히 일치
  if (PII_FIELD_SET.has(fieldName)) {
    return true;
  }

  // 소문자 변환 후 일치
  const lowerField = fieldName.toLowerCase();

  // snake_case → camelCase 변환 후 확인
  const camelCase = lowerField.replace(/_([a-z])/g, (_, char) =>
    char.toUpperCase()
  );
  if (PII_FIELD_SET.has(camelCase)) {
    return true;
  }

  // 부분 매칭 (image, user_id 등)
  for (const piiField of PII_FIELDS) {
    if (lowerField.includes(piiField.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * 에러 객체를 안전하게 로깅
 * @description 에러 스택에서 민감 정보 제거
 */
export function sanitizeError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeStackTrace(error.stack) : undefined,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * 에러 메시지에서 민감 정보 제거
 */
function sanitizeErrorMessage(message: string): string {
  // 이메일 패턴 마스킹
  let sanitized = message.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // 전화번호 패턴 마스킹 (한국 형식)
  sanitized = sanitized.replace(
    /\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
    '[PHONE_REDACTED]'
  );

  // Clerk user ID 패턴 마스킹
  sanitized = sanitized.replace(/user_[a-zA-Z0-9]+/g, '[USER_ID_REDACTED]');

  // URL 경로에서 사용자 ID 마스킹
  sanitized = sanitized.replace(
    /\/users?\/[a-z0-9_-]+/gi,
    '/user/[ID_REDACTED]'
  );

  return sanitized;
}

/**
 * 스택 트레이스에서 민감 경로 제거
 */
function sanitizeStackTrace(stack: string): string {
  // 파일 경로에서 사용자 이름 제거
  let sanitized = stack.replace(
    /\/home\/[^/]+\//g,
    '/home/[USER]/'
  );
  sanitized = sanitized.replace(
    /C:\\Users\\[^\\]+\\/g,
    'C:\\Users\\[USER]\\'
  );

  // node_modules 경로 단축
  sanitized = sanitized.replace(
    /node_modules\/[^)]+/g,
    'node_modules/[...]'
  );

  return sanitized;
}

/**
 * 로그 출력용 안전한 JSON 문자열 생성
 */
export function safeStringify(data: unknown, indent = 2): string {
  const sanitized = sanitizeForLogging(data);
  try {
    return JSON.stringify(sanitized, null, indent);
  } catch {
    return '[STRINGIFY_FAILED]';
  }
}
