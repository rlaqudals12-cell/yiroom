import { describe, it, expect } from 'vitest';
import {
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
  calculatePercentile,
  formatRank,
  formatScore,
} from '@/lib/leaderboard/constants';

describe('리더보드 상수', () => {
  describe('getWeekStartDate', () => {
    it('월요일을 반환', () => {
      // 2024년 1월 10일 수요일
      const date = new Date('2024-01-10');
      const result = getWeekStartDate(date);
      expect(result).toBe('2024-01-08'); // 월요일
    });

    it('일요일 입력 시 전주 월요일 반환', () => {
      // 2024년 1월 14일 일요일
      const date = new Date('2024-01-14');
      const result = getWeekStartDate(date);
      expect(result).toBe('2024-01-08'); // 전주 월요일
    });
  });

  describe('getWeekEndDate', () => {
    it('일요일을 반환', () => {
      const date = new Date('2024-01-10');
      const result = getWeekEndDate(date);
      expect(result).toBe('2024-01-14'); // 일요일
    });
  });

  describe('getMonthStartDate', () => {
    it('월 첫째 날 반환', () => {
      const date = new Date('2024-01-15');
      const result = getMonthStartDate(date);
      expect(result).toBe('2024-01-01');
    });
  });

  describe('getMonthEndDate', () => {
    it('월 마지막 날 반환 (1월)', () => {
      const date = new Date('2024-01-15');
      const result = getMonthEndDate(date);
      expect(result).toBe('2024-01-31');
    });

    it('윤년 2월 마지막 날 반환', () => {
      const date = new Date('2024-02-15');
      const result = getMonthEndDate(date);
      expect(result).toBe('2024-02-29');
    });
  });

  describe('calculatePercentile', () => {
    it('1위는 상위 100%', () => {
      expect(calculatePercentile(1, 100)).toBe(100);
    });

    it('50위는 상위 51%', () => {
      expect(calculatePercentile(50, 100)).toBe(51);
    });

    it('100위는 상위 1%', () => {
      expect(calculatePercentile(100, 100)).toBe(1);
    });

    it('총 참가자 0이면 0 반환', () => {
      expect(calculatePercentile(1, 0)).toBe(0);
    });
  });

  describe('formatRank', () => {
    it('1위 포맷팅', () => {
      expect(formatRank(1)).toBe('1위');
    });

    it('0이하면 - 반환', () => {
      expect(formatRank(0)).toBe('-');
      expect(formatRank(-1)).toBe('-');
    });
  });

  describe('formatScore', () => {
    it('XP 카테고리 포맷팅', () => {
      expect(formatScore(1234, 'xp')).toBe('1,234 XP');
    });

    it('레벨 카테고리 포맷팅', () => {
      expect(formatScore(25, 'level')).toBe('Lv.25');
    });

    it('일반 카테고리 포맷팅', () => {
      expect(formatScore(1234, 'workout')).toBe('1,234');
    });
  });
});
