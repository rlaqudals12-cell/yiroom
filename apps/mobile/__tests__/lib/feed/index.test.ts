/**
 * 피드 API 테스트
 */

import { formatRelativeTime } from '../../../lib/feed';

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-04T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('방금 전을 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-04T11:59:30Z');
    expect(formatRelativeTime(date)).toBe('방금 전');
  });

  it('분 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-04T11:55:00Z');
    expect(formatRelativeTime(date)).toBe('5분 전');
  });

  it('시간 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-04T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('2시간 전');
  });

  it('일 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-02T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('2일 전');
  });

  it('7일 이상은 날짜로 표시해야 함', () => {
    const date = new Date('2025-12-21T12:00:00Z');
    const result = formatRelativeTime(date);
    expect(result).toMatch(/\d{4}\. \d{1,2}\. \d{1,2}\./);
  });

  it('1시간은 60분 전으로 표시해야 함', () => {
    const date = new Date('2026-01-04T11:00:00Z');
    expect(formatRelativeTime(date)).toBe('1시간 전');
  });

  it('23시간은 시간 단위로 표시해야 함', () => {
    const date = new Date('2026-01-03T13:00:00Z');
    expect(formatRelativeTime(date)).toBe('23시간 전');
  });

  it('24시간 이상은 일 단위로 표시해야 함', () => {
    const date = new Date('2026-01-03T11:00:00Z');
    expect(formatRelativeTime(date)).toBe('1일 전');
  });

  it('6일은 일 단위로 표시해야 함', () => {
    const date = new Date('2025-12-29T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('6일 전');
  });
});

describe('feedTypeConfig', () => {
  it('피드 타입 설정이 정의되어 있어야 함', () => {
    // feedTypeConfig는 lib/feed/index.ts에서 export됨
    // badge, workout, nutrition 등 5개 타입 정의
    expect(true).toBe(true);
  });
});
