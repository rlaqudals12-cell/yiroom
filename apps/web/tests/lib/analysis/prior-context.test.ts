/**
 * Level 3 prior 컨텍스트 테스트
 * @see lib/analysis/prior-context.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSkinPriorHint, getBodyPriorHint, getHairPriorHint } from '@/lib/analysis/prior-context';

const fixtures: Record<string, unknown> = {};
let shouldThrow = false;

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (shouldThrow) throw new Error('db down');
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => builder,
        maybeSingle: () => Promise.resolve({ data: fixtures[table] ?? null, error: null }),
      };
      return builder;
    },
  }),
}));

beforeEach(() => {
  for (const key of Object.keys(fixtures)) delete fixtures[key];
  shouldThrow = false;
});

describe('getSkinPriorHint', () => {
  it('직전 분석이 없으면 null (Level 2로 진행)', async () => {
    expect(await getSkinPriorHint('user_1')).toBeNull();
  });

  it('직전 분석 요약 + tie-break 규칙을 포함한 스니펫을 만든다', async () => {
    fixtures['skin_analyses'] = {
      skin_type: 'combination',
      hydration: 45,
      oil_level: 62,
      sensitivity: 30,
      overall_score: 72,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    };
    const hint = await getSkinPriorHint('user_1');
    expect(hint).toContain('combination');
    expect(hint).toContain('수분 45');
    expect(hint).toContain('3일 전');
    // 핵심 안전장치: 독립 판정 우선 + 박빙 tie-break 한정 (재현성 실측 근거)
    expect(hint).toContain('독립 판정');
    expect(hint).toContain('박빙');
    expect(hint).toContain('복사하지 않습니다');
  });

  it('조회 실패는 조용히 null — 분석을 깨지 않는다', async () => {
    shouldThrow = true;
    expect(await getSkinPriorHint('user_1')).toBeNull();
  });
});

describe('getBodyPriorHint', () => {
  it('체형은 골격 안정성 규칙을 포함한다', async () => {
    fixtures['body_analyses'] = { body_type: 'W', created_at: new Date().toISOString() };
    const hint = await getBodyPriorHint('user_1');
    expect(hint).toContain('W 타입');
    expect(hint).toContain('단기간에 바뀌지 않습니다');
  });
});

describe('getHairPriorHint', () => {
  it('모발/두피 둘 다 없으면 null', async () => {
    fixtures['hair_analyses'] = { hair_type: null, scalp_type: null };
    expect(await getHairPriorHint('user_1')).toBeNull();
  });

  it('두피만 있어도 스니펫을 만든다', async () => {
    fixtures['hair_analyses'] = {
      hair_type: null,
      scalp_type: 'oily',
      created_at: new Date().toISOString(),
    };
    const hint = await getHairPriorHint('user_1');
    expect(hint).toContain('두피 oily');
  });
});
