/**
 * lib/security 모듈 테스트
 *
 * PII 마스킹, 로깅 정화, GDPR/PIPA 준수
 */

import {
  redactPii,
  isPiiField,
  sanitizeForLogging,
  sanitizeError,
  safeStringify,
} from '../../../lib/security';

describe('redactPii.email', () => {
  it('이메일 로컬 파트 마스킹', () => {
    const result = redactPii.email('test@example.com');
    expect(result).toBe('t***@e***.com');
  });

  it('빈 문자열은 [REDACTED] 반환', () => {
    expect(redactPii.email('')).toBe('[REDACTED]');
  });

  it('@ 없는 문자열은 [REDACTED_EMAIL] 반환', () => {
    expect(redactPii.email('invalid')).toBe('[REDACTED_EMAIL]');
  });
});

describe('redactPii.phone', () => {
  it('전화번호 끝 4자리만 노출', () => {
    const result = redactPii.phone('010-1234-5678');
    expect(result).toContain('5678');
    expect(result).toContain('****');
  });

  it('짧은 번호는 [REDACTED_PHONE]', () => {
    expect(redactPii.phone('12')).toBe('[REDACTED_PHONE]');
  });

  it('빈 문자열은 [REDACTED]', () => {
    expect(redactPii.phone('')).toBe('[REDACTED]');
  });
});

describe('redactPii.userId', () => {
  it('긴 ID는 앞 8자 + ***', () => {
    expect(redactPii.userId('user_1234567890abc')).toBe('user_123***');
  });

  it('짧은 ID는 [REDACTED_ID]', () => {
    expect(redactPii.userId('short')).toBe('[REDACTED_ID]');
  });
});

describe('redactPii.imageUrl', () => {
  it('HTTP URL 마스킹', () => {
    expect(redactPii.imageUrl('https://example.com/face.jpg')).toBe('[IMAGE_URL_REDACTED]');
  });

  it('data URI 마스킹', () => {
    expect(redactPii.imageUrl('data:image/jpeg;base64,abc123')).toBe('[IMAGE_URL_REDACTED]');
  });

  it('파일 경로 마스킹', () => {
    expect(redactPii.imageUrl('/images/face.jpg')).toBe('[IMAGE_PATH_REDACTED]');
  });
});

describe('redactPii.birthDate', () => {
  it('ISO 날짜에서 연도만 노출', () => {
    expect(redactPii.birthDate('1990-05-15')).toBe('1990-**-**');
  });

  it('연도만 있는 경우', () => {
    expect(redactPii.birthDate('1990')).toBe('1990****');
  });

  it('빈 문자열은 [REDACTED]', () => {
    expect(redactPii.birthDate('')).toBe('[REDACTED]');
  });
});

describe('redactPii.auto', () => {
  it('email 필드 자동 감지', () => {
    const result = redactPii.auto('userEmail', 'test@example.com');
    expect(result).toContain('***');
    expect(result).not.toContain('test@');
  });

  it('password 필드 완전 마스킹', () => {
    expect(redactPii.auto('password', 'secret123')).toBe('[REDACTED_SECRET]');
  });

  it('token 필드 완전 마스킹', () => {
    expect(redactPii.auto('accessToken', 'abc123')).toBe('[REDACTED_SECRET]');
  });

  it('null/undefined 통과', () => {
    expect(redactPii.auto('email', null)).toBeNull();
    expect(redactPii.auto('email', undefined)).toBeUndefined();
  });
});

describe('isPiiField', () => {
  it('PII 필드 감지', () => {
    expect(isPiiField('email')).toBe(true);
    expect(isPiiField('phone')).toBe(true);
    expect(isPiiField('clerk_user_id')).toBe(true);
    expect(isPiiField('faceImage')).toBe(true);
  });

  it('비-PII 필드는 false', () => {
    expect(isPiiField('id')).toBe(false);
    expect(isPiiField('createdAt')).toBe(false);
    expect(isPiiField('score')).toBe(false);
  });
});

describe('sanitizeForLogging', () => {
  it('PII 필드가 마스킹됨', () => {
    const data = {
      email: 'test@example.com',
      name: 'Kim',
      score: 85,
    };
    const result = sanitizeForLogging(data) as Record<string, unknown>;
    expect(result.email).not.toBe('test@example.com');
    expect(result.name).not.toBe('Kim');
    expect(result.score).toBe(85);
  });

  it('null/undefined 통과', () => {
    expect(sanitizeForLogging(null)).toBeNull();
    expect(sanitizeForLogging(undefined)).toBeUndefined();
  });

  it('중첩 객체 재귀 처리', () => {
    const data = {
      user: { email: 'test@example.com' },
      count: 5,
    };
    const result = sanitizeForLogging(data) as Record<string, unknown>;
    const user = result.user as Record<string, unknown>;
    expect(user.email).not.toBe('test@example.com');
    expect(result.count).toBe(5);
  });

  it('배열 처리', () => {
    const data = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
    const result = sanitizeForLogging(data) as Array<Record<string, unknown>>;
    expect(result).toHaveLength(2);
  });

  it('깊이 제한 (10레벨)', () => {
    let nested: Record<string, unknown> = { value: 'deep' };
    for (let i = 0; i < 15; i++) {
      nested = { inner: nested };
    }
    // 깊이 초과해도 에러 없음
    expect(() => sanitizeForLogging(nested)).not.toThrow();
  });
});

describe('sanitizeError', () => {
  it('Error 객체에서 이메일 마스킹', () => {
    const error = new Error('Failed for user test@example.com');
    const result = sanitizeError(error);
    expect(result.message).not.toContain('test@example.com');
    expect(result.message).toContain('[EMAIL_REDACTED]');
  });

  it('Error 객체에서 userId 마스킹', () => {
    const error = new Error('User user_abc123 not found');
    const result = sanitizeError(error);
    expect(result.message).toContain('[USER_ID_REDACTED]');
  });

  it('non-Error 객체 처리', () => {
    const result = sanitizeError('string error');
    expect(result.name).toBe('UnknownError');
    expect(result.message).toBe('string error');
  });
});

describe('safeStringify', () => {
  it('정상 객체를 JSON 문자열로 변환', () => {
    const result = safeStringify({ key: 'value' });
    expect(result).toContain('"key"');
  });

  it('PII 마스킹 후 변환', () => {
    const result = safeStringify({ email: 'test@example.com' });
    expect(result).not.toContain('test@example.com');
  });
});
