/**
 * 시간대 → 활성 루틴 그룹 판정 (verdict-first '지금 블록')
 *
 * 경계: <11시 아침 / ≥17시 저녁 / 그 외(11~16시) '언제든'
 */

import { describe, it, expect } from 'vitest';
import {
  getActiveTimeGroup,
  getTimeGroupPriority,
  selectCurrentCapsuleAction,
} from '@/lib/capsule/time-of-day';

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

describe('selectCurrentCapsuleAction', () => {
  const items = [
    { id: 'morning', isChecked: false, timeOfDay: 'morning' as const },
    { id: 'anytime', isChecked: false, timeOfDay: 'anytime' as const },
    { id: 'evening', isChecked: false, timeOfDay: 'evening' as const },
  ];

  it('현재 시간대의 첫 미완료 행동을 우선한다', () => {
    expect(selectCurrentCapsuleAction(items, 9)?.id).toBe('morning');
    expect(selectCurrentCapsuleAction(items, 13)?.id).toBe('anytime');
    expect(selectCurrentCapsuleAction(items, 20)?.id).toBe('evening');
  });

  it('현재 그룹이 끝났으면 다음 시간대의 미완료 행동을 고른다', () => {
    const morningDone = items.map((item) =>
      item.id === 'morning' ? { ...item, isChecked: true } : item
    );
    expect(selectCurrentCapsuleAction(morningDone, 9)?.id).toBe('anytime');
  });

  it('모든 행동을 마쳤으면 완료 행 재노출 없이 null을 반환한다', () => {
    const completed = items.map((item) => ({ ...item, isChecked: true }));
    expect(selectCurrentCapsuleAction(completed, 20)).toBeNull();
  });
});
