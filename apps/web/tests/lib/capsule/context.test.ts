/**
 * 컨텍스트 수집 테스트
 * @see lib/capsule/context.ts
 */

import { describe, it, expect } from 'vitest';
import { getDayOfWeek, getSeason } from '@/lib/capsule/context';

// =============================================================================
// 테스트
// =============================================================================

describe('Context', () => {
  // =========================================================================
  // getDayOfWeek
  // =========================================================================

  describe('getDayOfWeek', () => {
    it('should return mon for Monday', () => {
      // 2026-03-02 is Monday
      const monday = new Date('2026-03-02T10:00:00');
      expect(getDayOfWeek(monday)).toBe('mon');
    });

    it('should return sun for Sunday', () => {
      // 2026-03-01 is Sunday
      const sunday = new Date('2026-03-01T10:00:00');
      expect(getDayOfWeek(sunday)).toBe('sun');
    });

    it('should return sat for Saturday', () => {
      // 2026-02-28 is Saturday
      const saturday = new Date('2026-02-28T10:00:00');
      expect(getDayOfWeek(saturday)).toBe('sat');
    });

    it('should return wed for Wednesday', () => {
      // 2026-03-04 is Wednesday
      const wednesday = new Date('2026-03-04T10:00:00');
      expect(getDayOfWeek(wednesday)).toBe('wed');
    });
  });

  // =========================================================================
  // getSeason
  // =========================================================================

  describe('getSeason', () => {
    it('should return spring for March', () => {
      expect(getSeason(new Date('2026-03-15'))).toBe('spring');
    });

    it('should return spring for April', () => {
      expect(getSeason(new Date('2026-04-15'))).toBe('spring');
    });

    it('should return spring for May', () => {
      expect(getSeason(new Date('2026-05-15'))).toBe('spring');
    });

    it('should return summer for June', () => {
      expect(getSeason(new Date('2026-06-15'))).toBe('summer');
    });

    it('should return summer for August', () => {
      expect(getSeason(new Date('2026-08-15'))).toBe('summer');
    });

    it('should return autumn for September', () => {
      expect(getSeason(new Date('2026-09-15'))).toBe('autumn');
    });

    it('should return autumn for November', () => {
      expect(getSeason(new Date('2026-11-15'))).toBe('autumn');
    });

    it('should return winter for December', () => {
      expect(getSeason(new Date('2026-12-15'))).toBe('winter');
    });

    it('should return winter for January', () => {
      expect(getSeason(new Date('2026-01-15'))).toBe('winter');
    });

    it('should return winter for February', () => {
      expect(getSeason(new Date('2026-02-15'))).toBe('winter');
    });
  });
});
