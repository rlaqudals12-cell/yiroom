/**
 * 격려 메시지 시스템 테스트
 *
 * @module tests/lib/messages/encouragement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SUCCESS_MESSAGES,
  STREAK_MESSAGES,
  CHECKIN_MESSAGES,
  WORKOUT_MESSAGES,
  NUTRITION_MESSAGES,
  GOAL_ACHIEVED_MESSAGES,
  BADGE_EARNED_MESSAGES,
  LEVEL_UP_MESSAGES,
  EMPTY_STATE_MESSAGES,
  getTimeBasedGreeting,
  getRandomMessage,
  getStreakMessage,
  getSuccessToastMessage,
} from '@/lib/messages/encouragement';

describe('lib/messages/encouragement', () => {
  // ---------------------------------------------------------------------------
  // 상수 배열 테스트
  // ---------------------------------------------------------------------------

  describe('메시지 상수', () => {
    it('SUCCESS_MESSAGES가 비어있지 않다', () => {
      expect(SUCCESS_MESSAGES.length).toBeGreaterThan(0);
    });

    it('STREAK_MESSAGES.start가 비어있지 않다', () => {
      expect(STREAK_MESSAGES.start.length).toBeGreaterThan(0);
    });

    it('STREAK_MESSAGES.maintain이 비어있지 않다', () => {
      expect(STREAK_MESSAGES.maintain.length).toBeGreaterThan(0);
    });

    it('STREAK_MESSAGES.growing이 비어있지 않다', () => {
      expect(STREAK_MESSAGES.growing.length).toBeGreaterThan(0);
    });

    it('STREAK_MESSAGES.master가 비어있지 않다', () => {
      expect(STREAK_MESSAGES.master.length).toBeGreaterThan(0);
    });

    it('STREAK_MESSAGES.warning이 비어있지 않다', () => {
      expect(STREAK_MESSAGES.warning.length).toBeGreaterThan(0);
    });

    it('STREAK_MESSAGES.broken이 비어있지 않다', () => {
      expect(STREAK_MESSAGES.broken.length).toBeGreaterThan(0);
    });

    it('CHECKIN_MESSAGES가 비어있지 않다', () => {
      expect(CHECKIN_MESSAGES.length).toBeGreaterThan(0);
    });

    it('WORKOUT_MESSAGES가 비어있지 않다', () => {
      expect(WORKOUT_MESSAGES.length).toBeGreaterThan(0);
    });

    it('NUTRITION_MESSAGES가 비어있지 않다', () => {
      expect(NUTRITION_MESSAGES.length).toBeGreaterThan(0);
    });

    it('GOAL_ACHIEVED_MESSAGES가 비어있지 않다', () => {
      expect(GOAL_ACHIEVED_MESSAGES.length).toBeGreaterThan(0);
    });

    it('BADGE_EARNED_MESSAGES가 비어있지 않다', () => {
      expect(BADGE_EARNED_MESSAGES.length).toBeGreaterThan(0);
    });

    it('LEVEL_UP_MESSAGES가 비어있지 않다', () => {
      expect(LEVEL_UP_MESSAGES.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // EMPTY_STATE_MESSAGES 테스트
  // ---------------------------------------------------------------------------

  describe('EMPTY_STATE_MESSAGES', () => {
    const expectedKeys = [
      'workout',
      'nutrition',
      'streak',
      'analysis',
      'products',
      'challenge',
      'friends',
    ];

    it.each(expectedKeys)('%s 상태 메시지가 필수 필드를 포함한다', (key) => {
      const message = EMPTY_STATE_MESSAGES[key as keyof typeof EMPTY_STATE_MESSAGES];
      expect(message).toHaveProperty('title');
      expect(message).toHaveProperty('description');
      expect(message).toHaveProperty('cta');
      expect(message).toHaveProperty('emoji');
    });

    it('모든 빈 상태 메시지의 title이 문자열이다', () => {
      Object.values(EMPTY_STATE_MESSAGES).forEach((msg) => {
        expect(typeof msg.title).toBe('string');
        expect(msg.title.length).toBeGreaterThan(0);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTimeBasedGreeting 테스트
  // ---------------------------------------------------------------------------

  describe('getTimeBasedGreeting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('아침(5-11시)에 아침 인사를 반환한다', () => {
      vi.setSystemTime(new Date('2026-01-31T08:00:00'));
      expect(getTimeBasedGreeting()).toContain('아침');
    });

    it('오후(12-16시)에 오후 인사를 반환한다', () => {
      vi.setSystemTime(new Date('2026-01-31T14:00:00'));
      expect(getTimeBasedGreeting()).toContain('오후');
    });

    it('저녁(17-20시)에 저녁 인사를 반환한다', () => {
      vi.setSystemTime(new Date('2026-01-31T19:00:00'));
      expect(getTimeBasedGreeting()).toContain('저녁');
    });

    it('밤(21시 이후)에 수고 메시지를 반환한다', () => {
      vi.setSystemTime(new Date('2026-01-31T23:00:00'));
      expect(getTimeBasedGreeting()).toContain('수고');
    });

    it('새벽(0-4시)에 수고 메시지를 반환한다', () => {
      vi.setSystemTime(new Date('2026-01-31T03:00:00'));
      expect(getTimeBasedGreeting()).toContain('수고');
    });
  });

  // ---------------------------------------------------------------------------
  // getRandomMessage 테스트
  // ---------------------------------------------------------------------------

  describe('getRandomMessage', () => {
    it('배열에서 메시지를 반환한다', () => {
      const messages = ['a', 'b', 'c'] as const;
      const result = getRandomMessage(messages);
      expect(messages).toContain(result);
    });

    it('단일 요소 배열에서 해당 요소를 반환한다', () => {
      const messages = ['only'] as const;
      expect(getRandomMessage(messages)).toBe('only');
    });

    it('여러 번 호출해도 배열 내 값을 반환한다', () => {
      const messages = ['x', 'y', 'z'] as const;
      for (let i = 0; i < 10; i++) {
        expect(messages).toContain(getRandomMessage(messages));
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getStreakMessage 테스트
  // ---------------------------------------------------------------------------

  describe('getStreakMessage', () => {
    it('비활성 스트릭에서 broken 메시지를 반환한다', () => {
      const result = getStreakMessage(5, false);
      expect(STREAK_MESSAGES.broken).toContain(result);
    });

    it('스트릭 1일차에 start 메시지를 반환한다', () => {
      const result = getStreakMessage(1, true);
      expect(STREAK_MESSAGES.start).toContain(result);
    });

    it('스트릭 2-6일차에 maintain 메시지를 반환한다', () => {
      for (const streak of [2, 3, 4, 5, 6]) {
        const result = getStreakMessage(streak, true);
        expect(STREAK_MESSAGES.maintain).toContain(result);
      }
    });

    it('스트릭 7-29일차에 growing 메시지를 반환한다', () => {
      for (const streak of [7, 14, 21, 29]) {
        const result = getStreakMessage(streak, true);
        expect(STREAK_MESSAGES.growing).toContain(result);
      }
    });

    it('스트릭 30일 이상에 master 메시지를 반환한다', () => {
      for (const streak of [30, 50, 100, 365]) {
        const result = getStreakMessage(streak, true);
        expect(STREAK_MESSAGES.master).toContain(result);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getSuccessToastMessage 테스트
  // ---------------------------------------------------------------------------

  describe('getSuccessToastMessage', () => {
    it('context 없이 호출하면 SUCCESS_MESSAGES에서 반환한다', () => {
      const result = getSuccessToastMessage();
      expect(SUCCESS_MESSAGES).toContain(result);
    });

    it('workout context에서 WORKOUT_MESSAGES를 반환한다', () => {
      const result = getSuccessToastMessage('workout');
      expect(WORKOUT_MESSAGES).toContain(result);
    });

    it('nutrition context에서 NUTRITION_MESSAGES를 반환한다', () => {
      const result = getSuccessToastMessage('nutrition');
      expect(NUTRITION_MESSAGES).toContain(result);
    });

    it('checkin context에서 CHECKIN_MESSAGES를 반환한다', () => {
      const result = getSuccessToastMessage('checkin');
      expect(CHECKIN_MESSAGES).toContain(result);
    });

    it('goal context에서 GOAL_ACHIEVED_MESSAGES를 반환한다', () => {
      const result = getSuccessToastMessage('goal');
      expect(GOAL_ACHIEVED_MESSAGES).toContain(result);
    });

    it('badge context에서 BADGE_EARNED_MESSAGES를 반환한다', () => {
      const result = getSuccessToastMessage('badge');
      expect(BADGE_EARNED_MESSAGES).toContain(result);
    });

    it('level context에서 LEVEL_UP_MESSAGES를 반환한다', () => {
      const result = getSuccessToastMessage('level');
      expect(LEVEL_UP_MESSAGES).toContain(result);
    });
  });
});
