/**
 * 프로필 폴백 (유지 축 승계) 테스트
 *
 * 2026-08 외부 리뷰 #1: 선택 재분석에서 제외한 축은 새 세션에 행이 없어 사라졌다.
 * 승계는 **저장된 실측 진단**만 쓰고, 그 진단이 Mock이었으면 폴백 표시도 함께 옮긴다.
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const scenario = vi.hoisted(() => ({
  rows: {} as Record<string, { data: unknown; error: { message: string } | null }>,
  eqCalls: [] as Array<{ table: string; column: string; value: unknown }>,
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from(table: string) {
      const chain = {
        select: () => chain,
        eq: (column: string, value: unknown) => {
          scenario.eqCalls.push({ table, column, value });
          return chain;
        },
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => scenario.rows[table] ?? { data: null, error: null },
      };
      return chain;
    },
  }),
}));

import {
  carryLatestHair,
  carryLatestPersonalColor,
  carryLatestSkin,
  toPersonalColorAxisData,
  toSkinAxisData,
} from '@/lib/analysis/integrated/internal/profile-fallback';

beforeEach(() => {
  scenario.rows = {};
  scenario.eqCalls = [];
});

describe('toPersonalColorAxisData', () => {
  it('DB 대문자 저장값을 도메인 소문자로 정규화한다', () => {
    const data = toPersonalColorAxisData({
      id: 'pc-1',
      season: 'Autumn',
      undertone: 'Warm',
      confidence: 91,
      image_analysis: { tone: 'true-autumn' },
      best_colors: [],
    });

    expect(data.season).toBe('autumn');
    expect(data.undertone).toBe('warm');
    expect(data.tone).toBe('true-autumn');
    expect(data.confidence).toBe(91);
  });

  it('best_colors의 두 저장 형태를 모두 hex 배열로 읽는다', () => {
    const fromObjects = toPersonalColorAxisData({
      id: 'pc-1',
      season: 'Spring',
      best_colors: [{ name: '코랄', hex: '#FF7F50' }, { color: '#FFD700' }],
    });
    const fromStrings = toPersonalColorAxisData({
      id: 'pc-2',
      season: 'Spring',
      best_colors: ['#FF7F50', 'not-a-hex'],
    });

    expect(fromObjects.palette).toEqual(['#FF7F50', '#FFD700']);
    // 형식이 깨진 값은 버린다 (지어내지 않음)
    expect(fromStrings.palette).toEqual(['#FF7F50']);
  });

  it('톤 정보가 없으면 계절로 폴백한다', () => {
    const data = toPersonalColorAxisData({ id: 'pc-1', season: 'Winter' });
    expect(data.tone).toBe('winter');
  });
});

describe('toSkinAxisData', () => {
  it('저장 컬럼을 축 데이터로 옮긴다', () => {
    expect(toSkinAxisData({ id: 's-1', skin_type: 'oily', overall_score: 64 })).toEqual({
      id: 's-1',
      skinType: 'oily',
      overallScore: 64,
    });
  });
});

describe('carryLatest* — 승계 조회', () => {
  it('본인 행만 조회한다 (service_role은 RLS를 우회하므로 직접 필터)', async () => {
    scenario.rows.personal_color_assessments = {
      data: { id: 'pc-1', season: 'Summer' },
      error: null,
    };

    await carryLatestPersonalColor('user_42');

    expect(scenario.eqCalls).toContainEqual({
      table: 'personal_color_assessments',
      column: 'clerk_user_id',
      value: 'user_42',
    });
  });

  it('진단이 없으면 null (지어내지 않음)', async () => {
    await expect(carryLatestPersonalColor('user_42')).resolves.toBeNull();
    await expect(carryLatestSkin('user_42')).resolves.toBeNull();
    await expect(carryLatestHair('user_42')).resolves.toBeNull();
  });

  it('저장 당시 Mock 폴백이었으면 폴백 표시를 함께 승계한다', async () => {
    scenario.rows.personal_color_assessments = {
      data: { id: 'pc-1', season: 'Summer', image_analysis: { usedFallback: true } },
      error: null,
    };
    scenario.rows.skin_analyses = {
      data: { id: 's-1', skin_type: 'dry', recommendations: { usedFallback: true } },
      error: null,
    };
    scenario.rows.hair_analyses = {
      data: { id: 'h-1', face_shape: 'oval', recommendations: { usedFallback: false } },
      error: null,
    };

    expect((await carryLatestPersonalColor('u'))?.usedFallback).toBe(true);
    expect((await carryLatestSkin('u'))?.usedFallback).toBe(true);
    expect((await carryLatestHair('u'))?.usedFallback).toBe(false);
  });

  it('조회 오류는 승계를 포기할 뿐 예외로 흐름을 깨지 않는다', async () => {
    scenario.rows.skin_analyses = { data: null, error: { message: 'db down' } };

    await expect(carryLatestSkin('u')).resolves.toBeNull();
  });
});
