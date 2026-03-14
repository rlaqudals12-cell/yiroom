/**
 * 날짜 포맷 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import { getDateLocale, formatDate, formatDateTime, formatTime } from '@/lib/utils/date-format';

describe('getDateLocale', () => {
  it('ko를 ko-KR로 변환한다', () => {
    expect(getDateLocale('ko')).toBe('ko-KR');
  });

  it('en을 en-US로 변환한다', () => {
    expect(getDateLocale('en')).toBe('en-US');
  });

  it('ja를 ja-JP로 변환한다', () => {
    expect(getDateLocale('ja')).toBe('ja-JP');
  });

  it('zh를 zh-CN으로 변환한다', () => {
    expect(getDateLocale('zh')).toBe('zh-CN');
  });

  it('알 수 없는 로캘은 기본값 ko-KR을 반환한다', () => {
    expect(getDateLocale('fr')).toBe('ko-KR');
    expect(getDateLocale('')).toBe('ko-KR');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2026-01-15T12:00:00Z');

  it('Date 객체를 포맷한다', () => {
    const result = formatDate(testDate, 'ko');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('문자열 날짜를 포맷한다', () => {
    const result = formatDate('2026-01-15', 'ko');
    expect(result).toBeTruthy();
  });

  it('영어 로캘로 포맷한다', () => {
    const result = formatDate(testDate, 'en');
    expect(result).toBeTruthy();
    // en-US 형식은 M/D/YYYY 또는 January 15, 2026 등
    expect(result).toContain('2026');
  });

  it('옵션을 전달할 수 있다', () => {
    const result = formatDate(testDate, 'ko', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(result).toContain('2026');
  });

  it('알 수 없는 로캘은 ko-KR 기본값을 사용한다', () => {
    const result = formatDate(testDate, 'unknown');
    expect(result).toBeTruthy();
  });
});

describe('formatDateTime', () => {
  const testDate = new Date('2026-01-15T14:30:00Z');

  it('날짜와 시간을 함께 포맷한다', () => {
    const result = formatDateTime(testDate, 'ko');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('문자열 날짜를 받아 처리한다', () => {
    const result = formatDateTime('2026-01-15T14:30:00Z', 'en');
    expect(result).toBeTruthy();
  });

  it('옵션을 전달할 수 있다', () => {
    const result = formatDateTime(testDate, 'ko', {
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(result).toBeTruthy();
  });
});

describe('formatTime', () => {
  const testDate = new Date('2026-01-15T14:30:00Z');

  it('시간만 포맷한다', () => {
    const result = formatTime(testDate, 'ko');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('문자열 날짜에서 시간을 추출한다', () => {
    const result = formatTime('2026-01-15T14:30:00Z', 'en');
    expect(result).toBeTruthy();
  });

  it('일본어 로캘로 시간을 포맷한다', () => {
    const result = formatTime(testDate, 'ja');
    expect(result).toBeTruthy();
  });
});
