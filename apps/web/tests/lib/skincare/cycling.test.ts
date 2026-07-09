/**
 * 스킨 사이클링 엔진 테스트
 * @see lib/skincare/cycling.ts
 */
import { describe, it, expect } from 'vitest';
import { composeWeeklyCycle, getEveningCycle, CYCLE_LABELS } from '@/lib/skincare/cycling';
import type { ActiveCategory } from '@/lib/skincare/active-categories';
import type { CarePhase } from '@/lib/skincare/care-phase';

const GOAL_PHASE: CarePhase = { phase: 'goal', label: '목표 단계', message: '목표 집중 단계예요' };
const BARRIER_PHASE: CarePhase = {
  phase: 'barrier',
  label: '장벽 회복 단계',
  message: '지금은 장벽 회복이 먼저예요',
};

function actives(...cats: ActiveCategory[]): Set<ActiveCategory> {
  return new Set(cats);
}

function countFocus(days: { focus: string }[], focus: string): number {
  return days.filter((d) => d.focus === focus).length;
}

describe('composeWeeklyCycle', () => {
  it('should 7일 구성', () => {
    const { days } = composeWeeklyCycle(new Set(), 100, GOAL_PHASE);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.dow)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('should 레티노이드+산 보유 (비민감) → 레티3·각질2·회복2', () => {
    const owned = actives('retinoid', 'exfoliantBHA');
    const { days } = composeWeeklyCycle(owned, 80, GOAL_PHASE);
    expect(countFocus(days, 'retinoid')).toBe(3);
    expect(countFocus(days, 'exfoliation')).toBe(2);
    expect(countFocus(days, 'recovery')).toBe(2);
  });

  it('should 민감(<40) → 활성 일수 축소 (레티2·각질1·회복4)', () => {
    const owned = actives('retinoid', 'exfoliantAHA');
    const { days } = composeWeeklyCycle(owned, 30, GOAL_PHASE);
    expect(countFocus(days, 'retinoid')).toBe(2);
    expect(countFocus(days, 'exfoliation')).toBe(1);
    expect(countFocus(days, 'recovery')).toBe(4);
  });

  it('should 레티노이드의 날과 각질의 날은 절대 같은 요일 아님', () => {
    const owned = actives('retinoid', 'exfoliantAHA', 'exfoliantBHA');
    const { days } = composeWeeklyCycle(owned, 80, GOAL_PHASE);
    const retDows = days.filter((d) => d.focus === 'retinoid').map((d) => d.dow);
    const exfDows = days.filter((d) => d.focus === 'exfoliation').map((d) => d.dow);
    expect(retDows.some((d) => exfDows.includes(d))).toBe(false);
  });

  it('should 활성 미보유 → 해당 포커스 미배정 (지어내지 않음)', () => {
    const { days } = composeWeeklyCycle(new Set(), 80, GOAL_PHASE);
    expect(countFocus(days, 'retinoid')).toBe(0);
    expect(countFocus(days, 'exfoliation')).toBe(0);
    expect(countFocus(days, 'recovery')).toBe(7);
  });

  it('should 레티노이드만 보유 → 각질의 날 0', () => {
    const { days } = composeWeeklyCycle(actives('retinoid'), 80, GOAL_PHASE);
    expect(countFocus(days, 'retinoid')).toBe(3);
    expect(countFocus(days, 'exfoliation')).toBe(0);
  });

  it('should 장벽 회복 단계 → 활성 보유해도 전부 회복의 날', () => {
    const owned = actives('retinoid', 'exfoliantAHA');
    const { days } = composeWeeklyCycle(owned, 80, BARRIER_PHASE);
    expect(countFocus(days, 'recovery')).toBe(7);
  });

  it('should 결정론적 (같은 입력 → 같은 출력)', () => {
    const owned = actives('retinoid', 'exfoliantBHA');
    const a = composeWeeklyCycle(owned, 50, GOAL_PHASE);
    const b = composeWeeklyCycle(owned, 50, GOAL_PHASE);
    expect(a).toEqual(b);
  });
});

describe('getEveningCycle', () => {
  it('should 오늘 요일의 주기와 문헌 인용형 근거 반환', () => {
    const owned = actives('retinoid');
    // dow 1(월) = 레티노이드 슬롯
    const monday = new Date('2026-07-13T20:00:00'); // 월요일
    const cycle = getEveningCycle(monday, owned, 80, GOAL_PHASE);
    expect(cycle.focus).toBe('retinoid');
    expect(cycle.label).toBe(CYCLE_LABELS.retinoid);
    expect(cycle.reason).toContain('문헌');
  });

  it('should 활성 미보유 → 회복의 날', () => {
    const cycle = getEveningCycle(new Date('2026-07-13T20:00:00'), new Set(), 80, GOAL_PHASE);
    expect(cycle.focus).toBe('recovery');
  });

  it("should 근거 문구에 '치료·처방' 없음", () => {
    for (const owned of [new Set<ActiveCategory>(), actives('retinoid', 'exfoliantAHA')]) {
      for (let dow = 0; dow < 7; dow++) {
        const date = new Date(2026, 6, 12 + dow); // 7/12(일)~7/18(토)
        const cycle = getEveningCycle(date, owned, 80, GOAL_PHASE);
        expect(cycle.reason).not.toMatch(/치료|처방/);
      }
    }
  });
});
