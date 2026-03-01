/**
 * 보안 모듈
 *
 * PII 마스킹, 로깅 정화 (GDPR/PIPA 준수)
 *
 * @module lib/security
 */

// ---- 민감 필드 목록 ----

const PII_FIELDS = [
  'email', 'phone', 'phoneNumber',
  'birthDate', 'birth_date', 'birthYear', 'birth_year',
  'address', 'clerk_user_id', 'clerkUserId', 'userId', 'user_id',
  'faceImage', 'face_image', 'faceImageUrl', 'face_image_url',
  'bodyImage', 'body_image', 'bodyImageUrl', 'body_image_url',
  'skinImage', 'skin_image', 'wristImage', 'wrist_image',
  'imageUrl', 'image_url',
  'name', 'fullName', 'full_name', 'firstName', 'first_name',
  'lastName', 'last_name',
  'password', 'token', 'accessToken', 'refreshToken',
  'apiKey', 'api_key', 'secret', 'ssn', 'socialSecurityNumber',
] as const;

const PII_FIELD_SET = new Set<string>(PII_FIELDS);

// ---- 개별 마스킹 함수 ----

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

function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '[REDACTED]';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '[REDACTED_PHONE]';

  const visible = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 4);

  if (phone.includes('-')) {
    return `${masked.slice(0, 3)}-****-${visible}`;
  }
  return `${masked}${visible}`;
}

function maskUserId(userId: string): string {
  if (!userId || typeof userId !== 'string') return '[REDACTED]';
  if (userId.length <= 8) return '[REDACTED_ID]';
  return `${userId.slice(0, 8)}***`;
}

function maskImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '[REDACTED]';
  if (url.startsWith('http') || url.startsWith('data:image')) {
    return '[IMAGE_URL_REDACTED]';
  }
  if (url.includes('/') || url.includes('\\')) {
    return '[IMAGE_PATH_REDACTED]';
  }
  return '[REDACTED]';
}

function maskBirthDate(date: string): string {
  if (!date || typeof date !== 'string') return '[REDACTED]';
  const isoMatch = date.match(/^(\d{4})-\d{2}-\d{2}/);
  if (isoMatch) return `${isoMatch[1]}-**-**`;
  const yearMatch = date.match(/^(\d{4})/);
  if (yearMatch) return `${yearMatch[1]}****`;
  return '[REDACTED_DATE]';
}

function maskGeneral(value: string, visibleChars = 2): string {
  if (!value || typeof value !== 'string') return '[REDACTED]';
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  return value.slice(0, visibleChars) + '***';
}

// ---- 공개 API ----

/** PII 마스킹 함수 모음 */
export const redactPii = {
  email: maskEmail,
  phone: maskPhone,
  userId: maskUserId,
  imageUrl: maskImageUrl,
  birthDate: maskBirthDate,
  general: maskGeneral,

  /** 필드명에 따라 자동 마스킹 */
  auto: (fieldName: string, value: unknown): unknown => {
    if (value === null || value === undefined) return value;

    const lowerField = fieldName.toLowerCase();

    if (typeof value !== 'string') {
      if (typeof value === 'number' && lowerField.includes('year')) return value;
      if (typeof value === 'number') return '[REDACTED_NUMBER]';
      return value;
    }

    if (lowerField.includes('email')) return maskEmail(value);
    if (lowerField.includes('phone')) return maskPhone(value);
    if (lowerField.includes('user') && lowerField.includes('id')) return maskUserId(value);
    if (lowerField === 'clerk_user_id' || lowerField === 'clerkuserid') return maskUserId(value);
    if ((lowerField.includes('image') || lowerField.includes('url')) &&
        (value.startsWith('http') || value.startsWith('data:'))) return maskImageUrl(value);
    if (lowerField.includes('birth') && lowerField.includes('date')) return maskBirthDate(value);
    if (lowerField.includes('password') || lowerField.includes('token') ||
        lowerField.includes('secret') || lowerField.includes('key')) return '[REDACTED_SECRET]';
    if (lowerField.includes('name')) return maskGeneral(value, 2);
    if (lowerField.includes('address')) return maskGeneral(value, 5);

    return maskGeneral(value, 3);
  },
};

/** 필드가 PII인지 확인 */
export function isPiiField(fieldName: string): boolean {
  if (PII_FIELD_SET.has(fieldName)) return true;

  const lowerField = fieldName.toLowerCase();
  const camelCase = lowerField.replace(/_([a-z])/g, (_, char: string) =>
    char.toUpperCase()
  );
  if (PII_FIELD_SET.has(camelCase)) return true;

  for (const piiField of PII_FIELDS) {
    if (lowerField.includes(piiField.toLowerCase())) return true;
  }

  return false;
}

/** 객체 전체를 로깅용으로 정화 (재귀적) */
export function sanitizeForLogging(data: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (isPiiField(key)) {
        sanitized[key] = redactPii.auto(key, value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForLogging(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

/** 에러 객체를 안전하게 로깅 */
export function sanitizeError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        '[EMAIL_REDACTED]'
      ).replace(
        /user_[a-zA-Z0-9]+/g,
        '[USER_ID_REDACTED]'
      ),
      stack: error.stack ? error.stack.replace(
        /C:\\Users\\[^\\]+\\/g,
        'C:\\Users\\[USER]\\'
      ) : undefined,
    };
  }

  return { name: 'UnknownError', message: String(error) };
}

/** 안전한 JSON 문자열 생성 */
export function safeStringify(data: unknown, indent = 2): string {
  const sanitized = sanitizeForLogging(data);
  try {
    return JSON.stringify(sanitized, null, indent);
  } catch {
    return '[STRINGIFY_FAILED]';
  }
}
