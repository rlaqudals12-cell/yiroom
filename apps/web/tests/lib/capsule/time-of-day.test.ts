/**
 * 시간대 → 활성 루틴 그룹 판정 (verdict-first '지금 블록')
 *
 * 경계: <11시 아침 / ≥17시 저녁 / 그 외(11~16시) '언제든'
 */

import { describe, it, expect } from 'vitest';
import { getActiveTimeGroup, getTimeGroupPriority } from '@/lib/capsule/time-of-day';

describe('getActiveTimeGroup', () => {
  it('11시 미만은 아침(morning)이다', () => {
    expect(getActiveTimeGroup(0)).toBe('morning');
    expect(getActiveTimeGroup(7)).toBe('morning');
    expect(getActiveTimeGroup(10)).toBe('morning');
  });

  it('17시 이후는 저녁(evening)이다', () => {
    expect(getActiveTimeGroup(17)).toBe('evening');
    expect(getActiveTimeGroup(20)).toBe('evening');
    expect(getActiveTimeGroup(23)).toBe('evening');
  });

  it('낮 시간대(11~16시)는 다음 실행 가능 그룹인 언제든(anytime)이다', () => {
    expect(getActiveTimeGroup(11)).toBe('anytime');
    expect(getActiveTimeGroup(14)).toBe('anytime');
    expect(getActiveTimeGroup(16)).toBe('anytime');
  });
});

describe('getTimeGroupPriority', () => {
  it('활성 그룹이 항상 첫 순위이고 세 그룹을 모두 포함한다', () => {
    expect(getTimeGroupPriority(9)).toEqual(['morning', 'anytime', 'evening']);
    expect(getTimeGroupPriority(13)).toEqual(['anytime', 'evening', 'morning']);
    expect(getTimeGroupPriority(21)).toEqual(['evening', 'anytime', 'morning']);
  });

  it('getActiveTimeGroup과 첫 순위가 일치한다', () => {
    for (const hour of [0, 10, 11, 16, 17, 23]) {
      expect(getTimeGroupPriority(hour)[0]).toBe(getActiveTimeGroup(hour));
    }
  });
});
