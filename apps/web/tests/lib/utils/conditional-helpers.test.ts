/**
 * 조건부 헬퍼 유틸리티 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  classifyByRange,
  selectByKey,
  getTrendDirection,
  getTrendColorClass,
  mapToClass,
  assessImpact,
  mapTypeToData,
  selectText,
  selectByCondition,
} from '@/lib/utils/conditional-helpers';

describe('conditional-helpers', () => {
  // ============================================
  // classifyByRange
  // ============================================
  describe('classifyByRange', () => {
    const ranges = [
      { max: 30, result: 'low' },
      { max: 60, result: 'medium' },
      { result: 'high' },
    ] as const;

    it('하한 범위 → low', () => {
      expect(classifyByRange(20, ranges)).toBe('low');
    });

    it('중간 범위 → medium', () => {
      expect(classifyByRange(45, ranges)).toBe('medium');
    });

    it('상한 범위 → high', () => {
      expect(classifyByRange(75, ranges)).toBe('high');
    });

    it('경계값 30 → medium (max는 exclusive)', () => {
      expect(classifyByRange(30, ranges)).toBe('medium');
    });

    it('매칭 없을 때 defaultResult 반환', () => {
      const narrow = [{ min: 10, max: 20, result: 'match' }];
      expect(classifyByRange(5, narrow, 'default')).toBe('default');
    });

    it('매칭 없고 default 없으면 undefined', () => {
      const narrow = [{ min: 10, max: 20, result: 'match' }];
      expect(classifyByRange(5, narrow)).toBeUndefined();
    });
  });

  // ============================================
  // selectByKey
  // ============================================
  describe('selectByKey', () => {
    const map = { a: 1, b: 2, c: 3 };

    it('존재하는 키 → 값 반환', () => {
      expect(selectByKey('a', map)).toBe(1);
    });

    it('없는 키 → defaultValue', () => {
      expect(selectByKey('z' as 'a', map, 99)).toBe(99);
    });

    it('null 키 → defaultValue', () => {
      expect(selectByKey(null, map, 0)).toBe(0);
    });

    it('undefined 키 → defaultValue', () => {
      expect(selectByKey(undefined, map, -1)).toBe(-1);
    });
  });

  // ============================================
  // getTrendDirection
  // ============================================
  describe('getTrendDirection', () => {
    it('양수 → up', () => {
      expect(getTrendDirection(5)).toBe('up');
    });

    it('음수 → down', () => {
      expect(getTrendDirection(-3)).toBe('down');
    });

    it('0 → neutral', () => {
      expect(getTrendDirection(0)).toBe('neutral');
    });

    it('threshold 내 → neutral', () => {
      expect(getTrendDirection(2, 5)).toBe('neutral');
      expect(getTrendDirection(-2, 5)).toBe('neutral');
    });

    it('threshold 초과 → up/down', () => {
      expect(getTrendDirection(10, 5)).toBe('up');
      expect(getTrendDirection(-10, 5)).toBe('down');
    });
  });

  // ============================================
  // getTrendColorClass
  // ============================================
  describe('getTrendColorClass', () => {
    it('up → green', () => {
      expect(getTrendColorClass('up')).toContain('green');
    });

    it('down → red', () => {
      expect(getTrendColorClass('down')).toContain('red');
    });

    it('neutral → muted', () => {
      expect(getTrendColorClass('neutral')).toContain('muted');
    });

    it('inverted: up → red', () => {
      expect(getTrendColorClass('up', { inverted: true })).toContain('red');
    });

    it('inverted: down → green', () => {
      expect(getTrendColorClass('down', { inverted: true })).toContain('green');
    });
  });

  // ============================================
  // mapToClass
  // ============================================
  describe('mapToClass', () => {
    const classMap = { A: 'bg-green', B: 'bg-blue' };

    it('매칭 키 → 클래스 반환', () => {
      expect(mapToClass('A', classMap)).toBe('bg-green');
    });

    it('없는 키 → 기본 클래스', () => {
      expect(mapToClass('C' as 'A', classMap, 'bg-gray')).toBe('bg-gray');
    });

    it('null → 기본 클래스', () => {
      expect(mapToClass(null, classMap, 'bg-gray')).toBe('bg-gray');
    });
  });

  // ============================================
  // assessImpact
  // ============================================
  describe('assessImpact', () => {
    const thresholds = { positiveMin: 60, negativeMax: 30 };

    it('높은 값 → positive', () => {
      expect(assessImpact(80, thresholds)).toBe('positive');
    });

    it('낮은 값 → negative', () => {
      expect(assessImpact(20, thresholds)).toBe('negative');
    });

    it('중간 값 → neutral', () => {
      expect(assessImpact(45, thresholds)).toBe('neutral');
    });

    it('경계값 60 → positive', () => {
      expect(assessImpact(60, thresholds)).toBe('positive');
    });

    it('경계값 30 → negative', () => {
      expect(assessImpact(30, thresholds)).toBe('negative');
    });
  });

  // ============================================
  // mapTypeToData
  // ============================================
  describe('mapTypeToData', () => {
    it('타입에 맞는 데이터 반환', () => {
      const mapping = {
        S: { line: 'angular' },
        W: { line: 'rounded' },
      };
      expect(mapTypeToData('S', mapping)).toEqual({ line: 'angular' });
    });

    it('defaults와 병합', () => {
      const mapping = { S: { line: 'angular', bone: 'small' } };
      const defaults = { bone: 'medium', line: 'default' };
      const result = mapTypeToData('S', mapping, defaults);
      expect(result).toEqual({ bone: 'small', line: 'angular' });
    });

    it('없는 타입 → defaults만 반환', () => {
      const mapping = { S: { line: 'angular' } };
      const defaults = { line: 'default' };
      expect(mapTypeToData('X' as 'S', mapping, defaults)).toEqual({ line: 'default' });
    });
  });

  // ============================================
  // selectText
  // ============================================
  describe('selectText', () => {
    const texts = { ko: '완료', en: 'Done' };

    it('존재하는 언어 → 해당 텍스트', () => {
      expect(selectText('ko', texts)).toBe('완료');
    });

    it('없는 언어 → 첫 번째 값 폴백', () => {
      expect(selectText('ja' as 'ko', texts)).toBe('완료');
    });
  });

  // ============================================
  // selectByCondition
  // ============================================
  describe('selectByCondition', () => {
    it('true → trueValue', () => {
      expect(selectByCondition(true, 'yes', 'no')).toBe('yes');
    });

    it('false → falseValue', () => {
      expect(selectByCondition(false, 'yes', 'no')).toBe('no');
    });

    it('null → neutralValue', () => {
      expect(selectByCondition(null, 'yes', 'no', 'maybe')).toBe('maybe');
    });

    it('undefined + neutralValue 없음 → falseValue', () => {
      expect(selectByCondition(undefined, 'yes', 'no')).toBe('no');
    });
  });
});
