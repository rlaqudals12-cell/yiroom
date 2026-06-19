/**
 * 2층 추천 분류 테스트 (ADR-109 Phase 3)
 * 무손실(입력=identity∪condition) + 레이어 규칙(피부 입력=오늘, 그 외=고정).
 */

import { describe, it, expect } from 'vitest';
import {
  splitInsightsByCadence,
  recLayerForInsight,
} from '@/lib/analysis/integrated/recommendation-engine';
import type { CrossInsight } from '@/lib/analysis/integrated/cross-insights';

function insight(id: string): CrossInsight {
  return { id, combo: id, title: `${id}-title`, body: `${id}-body` };
}

describe('recLayerForInsight', () => {
  it('피부 입력 인사이트 = condition(오늘)', () => {
    expect(recLayerForInsight('pc_s')).toBe('condition');
    expect(recLayerForInsight('s_m')).toBe('condition');
  });
  it('정체성 입력 인사이트 = identity(고정)', () => {
    expect(recLayerForInsight('pc_m')).toBe('identity');
    expect(recLayerForInsight('c_h')).toBe('identity');
    expect(recLayerForInsight('pc_c')).toBe('identity');
  });
  it('미상 id는 보수적으로 identity', () => {
    expect(recLayerForInsight('unknown')).toBe('identity');
  });
});

describe('splitInsightsByCadence', () => {
  const all = ['pc_s', 'pc_m', 'c_h', 's_m', 'pc_c'].map(insight);

  it('무손실 — identity + condition = 입력 전체', () => {
    const { identity, condition } = splitInsightsByCadence(all);
    expect(identity.length + condition.length).toBe(all.length);
    const ids = [...identity, ...condition].map((i) => i.id).sort();
    expect(ids).toEqual([...all].map((i) => i.id).sort());
  });

  it('레이어 분배 정확', () => {
    const { identity, condition } = splitInsightsByCadence(all);
    expect(condition.map((i) => i.id).sort()).toEqual(['pc_s', 's_m']);
    expect(identity.map((i) => i.id).sort()).toEqual(['c_h', 'pc_c', 'pc_m']);
  });

  it('빈 입력 → 빈 두 레이어', () => {
    expect(splitInsightsByCadence([])).toEqual({ identity: [], condition: [] });
  });
});
