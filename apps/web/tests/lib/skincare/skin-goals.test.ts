/**
 * 피부 목표 병합 테스트
 * @see lib/skincare/skin-goals.ts
 */
import { describe, it, expect } from 'vitest';
import {
  SKIN_GOALS,
  SKIN_GOAL_IDS,
  GOAL_TO_CONCERN,
  getSkinGoalLabel,
  mergeGoalsIntoConcerns,
} from '@/lib/skincare/skin-goals';
import type { SkinConcernId } from '@/lib/mock/skin-analysis';

describe('SKIN_GOALS 정본', () => {
  it('should keep SKIN_GOALS와 SKIN_GOAL_IDS 동기화', () => {
    expect(SKIN_GOALS.map((g) => g.id).sort()).toEqual([...SKIN_GOAL_IDS].sort());
    expect(SKIN_GOALS).toHaveLength(6);
  });

  it('should 모든 목표에 라벨 존재', () => {
    for (const id of SKIN_GOAL_IDS) {
      expect(getSkinGoalLabel(id)).toBeTruthy();
    }
  });

  it('should 모든 목표에 대응 concern 매핑', () => {
    for (const id of SKIN_GOAL_IDS) {
      expect(GOAL_TO_CONCERN[id]).toBeTruthy();
    }
  });
});

describe('mergeGoalsIntoConcerns', () => {
  it('should 목표 concern을 앞에, 파생 concern을 뒤에 병합', () => {
    const derived: SkinConcernId[] = ['dryness', 'pores'];
    const result = mergeGoalsIntoConcerns(derived, ['brightening', 'wrinkle']);
    // 목표(brightening→pigmentation, wrinkle→wrinkles)가 먼저
    expect(result.slice(0, 2)).toEqual(['pigmentation', 'wrinkles']);
    expect(result).toContain('dryness');
    expect(result).toContain('pores');
  });

  it('should 중복 concern 제거 (목표와 파생이 겹칠 때 목표 우선 1회)', () => {
    const derived: SkinConcernId[] = ['pigmentation', 'dryness'];
    const result = mergeGoalsIntoConcerns(derived, ['brightening']);
    expect(result.filter((c) => c === 'pigmentation')).toHaveLength(1);
    expect(result[0]).toBe('pigmentation');
    expect(result).toContain('dryness');
  });

  it('should 목표 없으면 파생 그대로', () => {
    const derived: SkinConcernId[] = ['sensitivity'];
    expect(mergeGoalsIntoConcerns(derived, [])).toEqual(['sensitivity']);
  });

  it('should 결정론적 (같은 입력 → 같은 출력)', () => {
    const derived: SkinConcernId[] = ['pores', 'dryness'];
    const a = mergeGoalsIntoConcerns(derived, ['sebum', 'hydration']);
    const b = mergeGoalsIntoConcerns(derived, ['sebum', 'hydration']);
    expect(a).toEqual(b);
  });
});
