/**
 * 시간대별 인사말 유틸리티 테스트
 * K-5 프로필 리디자인 - 주변 개인화
 */

import { describe, it, expect } from 'vitest';
import {
  getTimeOfDay,
  getGreeting,
  getGreetingWithEmoji,
  TIME_GREETINGS,
  TIME_EMOJIS,
  type TimeOfDay,
} from '@/lib/utils/greeting';

describe('getTimeOfDay', () => {
  it('새벽 5시는 아침으로 판단한다', () => {
    const date = new Date('2026-01-12T05:00:00');
    expect(getTimeOfDay(date)).toBe('morning');
  });

  it('오전 11시는 아침으로 판단한다', () => {
    const date = new Date('2026-01-12T11:00:00');
    expect(getTimeOfDay(date)).toBe('morning');
  });

  it('정오 12시는 오후로 판단한다', () => {
    const date = new Date('2026-01-12T12:00:00');
    expect(getTimeOfDay(date)).toBe('afternoon');
  });

  it('오후 4시는 오후로 판단한다', () => {
    const date = new Date('2026-01-12T16:00:00');
    expect(getTimeOfDay(date)).toBe('afternoon');
  });

  it('오후 5시는 저녁으로 판단한다', () => {
    const date = new Date('2026-01-12T17:00:00');
    expect(getTimeOfDay(date)).toBe('evening');
  });

  it('오후 8시는 저녁으로 판단한다', () => {
    const date = new Date('2026-01-12T20:00:00');
    expect(getTimeOfDay(date)).toBe('evening');
  });

  it('오후 9시는 밤으로 판단한다', () => {
    const date = new Date('2026-01-12T21:00:00');
    expect(getTimeOfDay(date)).toBe('night');
  });

  it('새벽 4시는 밤으로 판단한다', () => {
    const date = new Date('2026-01-12T04:00:00');
    expect(getTimeOfDay(date)).toBe('night');
  });
});

describe('getGreeting', () => {
  it('사용자 이름 없이 인사말을 반환한다', () => {
    const greeting = getGreeting();
    // 시간대에 따른 인사말 중 하나여야 함
    const allGreetings = Object.values(TIME_GREETINGS).flat();
    expect(allGreetings).toContain(greeting);
  });

  it('사용자 이름을 포함한 인사말을 반환한다', () => {
    const greeting = getGreeting('홍길동');
    expect(greeting).toContain('홍길동님');
  });

  it('특정 시간대의 인사말을 반환한다', () => {
    const morningDate = new Date('2026-01-12T08:00:00');
    const greeting = getGreeting('테스트', morningDate);
    expect(greeting).toContain('테스트님');
    // 아침 인사말 중 하나여야 함
    const matchesGreeting = TIME_GREETINGS.morning.some((g) => greeting.includes(g));
    expect(matchesGreeting).toBe(true);
  });
});

describe('getGreetingWithEmoji', () => {
  it('인사말, 이모지, 시간대를 반환한다', () => {
    const result = getGreetingWithEmoji();
    expect(result).toHaveProperty('greeting');
    expect(result).toHaveProperty('emoji');
    expect(result).toHaveProperty('timeOfDay');
  });

  it('시간대에 맞는 이모지를 반환한다', () => {
    const morningDate = new Date('2026-01-12T08:00:00');
    const result = getGreetingWithEmoji(undefined, morningDate);
    expect(result.emoji).toBe('🌅');
    expect(result.timeOfDay).toBe('morning');
  });

  it('저녁 시간대에 맞는 이모지를 반환한다', () => {
    const eveningDate = new Date('2026-01-12T18:00:00');
    const result = getGreetingWithEmoji(undefined, eveningDate);
    expect(result.emoji).toBe('🌆');
    expect(result.timeOfDay).toBe('evening');
  });
});

describe('TIME_GREETINGS', () => {
  it('모든 시간대에 인사말이 정의되어 있다', () => {
    const timeOfDays: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    for (const tod of timeOfDays) {
      expect(TIME_GREETINGS[tod]).toBeDefined();
      expect(TIME_GREETINGS[tod].length).toBeGreaterThan(0);
    }
  });
});

describe('TIME_EMOJIS', () => {
  it('모든 시간대에 이모지가 정의되어 있다', () => {
    expect(TIME_EMOJIS.morning).toBe('🌅');
    expect(TIME_EMOJIS.afternoon).toBe('☀️');
    expect(TIME_EMOJIS.evening).toBe('🌆');
    expect(TIME_EMOJIS.night).toBe('🌙');
  });
});
