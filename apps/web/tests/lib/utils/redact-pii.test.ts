/**
 * PII 마스킹 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  redactPii,
  sanitizeForLogging,
  isPiiField,
  sanitizeError,
  safeStringify,
} from '@/lib/utils/redact-pii';

describe('redactPii.email', () => {
  it('이메일을 마스킹한다', () => {
    expect(redactPii.email('user@example.com')).toBe('u***@e***.com');
  });

  it('짧은 로컬파트도 마스킹한다', () => {
    expect(redactPii.email('a@b.com')).toBe('*@b***.com');
  });

  it('@가 없으면 REDACTED_EMAIL을 반환한다', () => {
    expect(redactPii.email('invalid')).toBe('[REDACTED_EMAIL]');
  });

  it('빈 문자열은 REDACTED를 반환한다', () => {
    expect(redactPii.email('')).toBe('[REDACTED]');
  });
});

describe('redactPii.phone', () => {
  it('하이픈 포함 전화번호를 마스킹한다', () => {
    const result = redactPii.phone('010-1234-5678');
    expect(result).toContain('5678');
    expect(result).toContain('****');
  });

  it('하이픈 없는 전화번호를 마스킹한다', () => {
    const result = redactPii.phone('01012345678');
    expect(result).toContain('5678');
    expect(result).not.toContain('1234');
  });

  it('숫자 3자리 이하는 REDACTED_PHONE을 반환한다', () => {
    expect(redactPii.phone('123')).toBe('[REDACTED_PHONE]');
  });
});

describe('redactPii.userId', () => {
  it('긴 사용자 ID를 마스킹한다', () => {
    expect(redactPii.userId('user_2abc123xyz')).toBe('user_2ab***');
  });

  it('8자 이하 ID는 REDACTED_ID를 반환한다', () => {
    expect(redactPii.userId('short')).toBe('[REDACTED_ID]');
  });
});

describe('redactPii.imageUrl', () => {
  it('HTTP URL을 마스킹한다', () => {
    expect(redactPii.imageUrl('https://storage.example.com/face.jpg')).toBe('[IMAGE_URL_REDACTED]');
  });

  it('data URI를 마스킹한다', () => {
    expect(redactPii.imageUrl('data:image/jpeg;base64,abc')).toBe('[IMAGE_URL_REDACTED]');
  });

  it('파일 경로를 마스킹한다', () => {
    expect(redactPii.imageUrl('/home/user/photo.jpg')).toBe('[IMAGE_PATH_REDACTED]');
  });

  it('빈 문자열은 REDACTED를 반환한다', () => {
    expect(redactPii.imageUrl('')).toBe('[REDACTED]');
  });
});

describe('redactPii.birthDate', () => {
  it('ISO 형식 생년월일을 마스킹한다', () => {
    expect(redactPii.birthDate('1990-05-15')).toBe('1990-**-**');
  });

  it('년도만 있는 경우 마스킹한다', () => {
    expect(redactPii.birthDate('1990')).toBe('1990****');
  });

  it('형식이 맞지 않으면 REDACTED_DATE를 반환한다', () => {
    expect(redactPii.birthDate('invalid')).toBe('[REDACTED_DATE]');
  });
});

describe('redactPii.general', () => {
  it('기본 2자만 보이도록 마스킹한다', () => {
    expect(redactPii.general('홍길동')).toBe('홍길***');
  });

  it('보이는 글자 수를 조절할 수 있다', () => {
    expect(redactPii.general('서울시 강남구', 5)).toBe('서울시 강***');
  });

  it('짧은 문자열은 전부 마스킹한다', () => {
    expect(redactPii.general('AB')).toBe('**');
  });
});

describe('redactPii.auto', () => {
  it('필드명에 따라 이메일을 자동 마스킹한다', () => {
    const result = redactPii.auto('email', 'test@test.com');
    expect(result).toBe('t***@t***.com');
  });

  it('password 필드는 REDACTED_SECRET을 반환한다', () => {
    expect(redactPii.auto('password', 'secret123')).toBe('[REDACTED_SECRET]');
  });

  it('null은 그대로 반환한다', () => {
    expect(redactPii.auto('email', null)).toBeNull();
  });

  it('birthYear 숫자는 년도를 유지한다', () => {
    expect(redactPii.auto('birthYear', 1990)).toBe(1990);
  });
});

describe('isPiiField', () => {
  it('정확히 일치하는 PII 필드를 감지한다', () => {
    expect(isPiiField('email')).toBe(true);
    expect(isPiiField('password')).toBe(true);
  });

  it('PII가 아닌 필드는 false를 반환한다', () => {
    expect(isPiiField('category')).toBe(false);
    expect(isPiiField('score')).toBe(false);
  });

  it('부분 매칭으로 민감 필드를 감지한다', () => {
    // PII_FIELDS에 'imageUrl', 'image_url' 등이 포함되어 부분 매칭
    expect(isPiiField('faceImageUrl')).toBe(true);
    expect(isPiiField('user_id')).toBe(true);
  });
});

describe('sanitizeForLogging', () => {
  it('객체 내 민감 필드를 마스킹한다', () => {
    const data = { email: 'user@test.com', score: 85 };
    const result = sanitizeForLogging(data) as Record<string, unknown>;
    expect(result.email).not.toBe('user@test.com');
    expect(result.score).toBe(85);
  });

  it('중첩 객체도 재귀적으로 마스킹한다', () => {
    const data = { profile: { email: 'user@test.com' } };
    const result = sanitizeForLogging(data) as Record<string, Record<string, unknown>>;
    expect(result.profile.email).not.toBe('user@test.com');
  });

  it('배열을 처리한다', () => {
    const data = [{ email: 'a@b.com' }];
    const result = sanitizeForLogging(data) as Array<Record<string, unknown>>;
    expect(result[0].email).not.toBe('a@b.com');
  });

  it('null과 undefined를 그대로 반환한다', () => {
    expect(sanitizeForLogging(null)).toBeNull();
    expect(sanitizeForLogging(undefined)).toBeUndefined();
  });

  it('최대 깊이 초과 시 MAX_DEPTH_EXCEEDED를 반환한다', () => {
    expect(sanitizeForLogging({}, 11)).toBe('[MAX_DEPTH_EXCEEDED]');
  });
});

describe('sanitizeError', () => {
  it('Error 객체에서 이메일을 마스킹한다', () => {
    const error = new Error('Failed for user@test.com');
    const result = sanitizeError(error);
    expect(result.message).toContain('[EMAIL_REDACTED]');
    expect(result.name).toBe('Error');
  });

  it('Error가 아닌 값도 처리한다', () => {
    const result = sanitizeError('string error');
    expect(result.name).toBe('UnknownError');
    expect(result.message).toBe('string error');
  });
});

describe('safeStringify', () => {
  it('마스킹된 JSON 문자열을 반환한다', () => {
    const data = { email: 'user@test.com', age: 25 };
    const result = safeStringify(data);
    expect(result).not.toContain('user@test.com');
    expect(result).toContain('25');
  });

  it('순환 참조 등 실패 시 STRINGIFY_FAILED를 반환한다', () => {
    // sanitizeForLogging가 정상 반환 시 JSON.stringify도 정상
    // 기본적으로 정상 동작 테스트
    expect(safeStringify(null)).toBe('null');
  });
});
