/**
 * useTimeGreeting 훅 테스트
 * 시간대별 인사말 기능 검증
 */

import { describe, it, expect } from 'vitest';
import { getTimeGreeting } from '@/hooks/useTimeGreeting';

describe('getTimeGreeting', () => {
  describe('아침 시간대 (05:00-11:59)', () => {
    it('5시에는 "좋은 아침"을 반환한다', () => {
      expect(getTimeGreeting(5)).toBe('좋은 아침');
    });

    it('8시에는 "좋은 아침"을 반환한다', () => {
      expect(getTimeGreeting(8)).toBe('좋은 아침');
    });

    it('11시에는 "좋은 아침"을 반환한다', () => {
      expect(getTimeGreeting(11)).toBe('좋은 아침');
    });
  });

  describe('오후 시간대 (12:00-17:59)', () => {
    it('12시에는 "좋은 오후"를 반환한다', () => {
      expect(getTimeGreeting(12)).toBe('좋은 오후');
    });

    it('15시에는 "좋은 오후"를 반환한다', () => {
      expect(getTimeGreeting(15)).toBe('좋은 오후');
    });

    it('17시에는 "좋은 오후"를 반환한다', () => {
      expect(getTimeGreeting(17)).toBe('좋은 오후');
    });
  });

  describe('저녁 시간대 (18:00-21:59)', () => {
    it('18시에는 "좋은 저녁"을 반환한다', () => {
      expect(getTimeGreeting(18)).toBe('좋은 저녁');
    });

    it('20시에는 "좋은 저녁"을 반환한다', () => {
      expect(getTimeGreeting(20)).toBe('좋은 저녁');
    });

    it('21시에는 "좋은 저녁"을 반환한다', () => {
      expect(getTimeGreeting(21)).toBe('좋은 저녁');
    });
  });

  describe('밤 시간대 (22:00-04:59)', () => {
    it('22시에는 "좋은 밤"을 반환한다', () => {
      expect(getTimeGreeting(22)).toBe('좋은 밤');
    });

    it('0시(자정)에는 "좋은 밤"을 반환한다', () => {
      expect(getTimeGreeting(0)).toBe('좋은 밤');
    });

    it('3시에는 "좋은 밤"을 반환한다', () => {
      expect(getTimeGreeting(3)).toBe('좋은 밤');
    });

    it('4시에는 "좋은 밤"을 반환한다', () => {
      expect(getTimeGreeting(4)).toBe('좋은 밤');
    });
  });

  describe('경계값 테스트', () => {
    it('4시 59분(4시)은 "좋은 밤"', () => {
      expect(getTimeGreeting(4)).toBe('좋은 밤');
    });

    it('5시 00분(5시)은 "좋은 아침"', () => {
      expect(getTimeGreeting(5)).toBe('좋은 아침');
    });

    it('11시 59분(11시)은 "좋은 아침"', () => {
      expect(getTimeGreeting(11)).toBe('좋은 아침');
    });

    it('12시 00분(12시)은 "좋은 오후"', () => {
      expect(getTimeGreeting(12)).toBe('좋은 오후');
    });

    it('17시 59분(17시)은 "좋은 오후"', () => {
      expect(getTimeGreeting(17)).toBe('좋은 오후');
    });

    it('18시 00분(18시)은 "좋은 저녁"', () => {
      expect(getTimeGreeting(18)).toBe('좋은 저녁');
    });

    it('21시 59분(21시)은 "좋은 저녁"', () => {
      expect(getTimeGreeting(21)).toBe('좋은 저녁');
    });

    it('22시 00분(22시)은 "좋은 밤"', () => {
      expect(getTimeGreeting(22)).toBe('좋은 밤');
    });
  });

  describe('기본값 (hour 미제공)', () => {
    it('hour 없이 호출하면 현재 시간 기반 인사를 반환한다', () => {
      const result = getTimeGreeting();
      expect(['좋은 아침', '좋은 오후', '좋은 저녁', '좋은 밤']).toContain(result);
    });
  });
});
