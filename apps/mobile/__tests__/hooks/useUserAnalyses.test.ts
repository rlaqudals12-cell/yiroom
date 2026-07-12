/**
 * useUserAnalyses — prod 스키마 정합 + 점수 null 가드 회귀 테스트
 *
 * 회귀 배경(에뮬 실측): 5축을 완료한 계정인데 홈 정체성 카드가 "1/5"로 뜨고
 * 헤어 카드에 "직모 · null점"이 노출됐다. 근본 원인 2가지를 고정한다.
 *  1) select 절이 prod에 없는 컬럼(tone·color_palette·concerns·bmi·makeup_style·color_recommendations)을
 *     요청 → 해당 쿼리가 런타임 에러로 죽어 집계에서 누락. 이제 select는 prod 실재 컬럼만 요청한다.
 *  2) 헤어 overall_score가 null이면 "null점"을 만들지 않고 타입 라벨만 노출한다.
 */
import { renderHook, waitFor } from '@testing-library/react-native';

// prod information_schema로 실측한 각 테이블의 실재 컬럼 집합 (2026-07-12).
// select가 이 집합을 벗어나면 런타임 Postgres 에러 → 테스트로 고정.
const REAL_COLUMNS: Record<string, Set<string>> = {
  personal_color_assessments: new Set([
    'id',
    'user_id',
    'clerk_user_id',
    'questionnaire_answers',
    'face_image_url',
    'season',
    'undertone',
    'confidence',
    'season_scores',
    'image_analysis',
    'best_colors',
    'worst_colors',
    'makeup_recommendations',
    'fashion_recommendations',
    'created_at',
    'left_image_url',
    'right_image_url',
    'images_count',
    'analysis_reliability',
    'session_id',
    'wrist_image_url',
    'season_subtype',
  ]),
  skin_analyses: new Set([
    'id',
    'user_id',
    'clerk_user_id',
    'image_url',
    'skin_type',
    'hydration',
    'oil_level',
    'pores',
    'pigmentation',
    'wrinkles',
    'sensitivity',
    'overall_score',
    'recommendations',
    'products',
    'ingredient_warnings',
    'personal_color_season',
    'foundation_recommendation',
    'created_at',
    'problem_areas',
    'image_consent_id',
    'skin_vitality_score',
    'vitality_factors',
    'session_id',
  ]),
  body_analyses: new Set([
    'id',
    'user_id',
    'clerk_user_id',
    'image_url',
    'height',
    'weight',
    'body_type',
    'shoulder',
    'waist',
    'hip',
    'ratio',
    'strengths',
    'improvements',
    'style_recommendations',
    'personal_color_season',
    'color_recommendations',
    'target_weight',
    'target_date',
    'created_at',
    'left_side_image_url',
    'right_side_image_url',
    'back_image_url',
    'session_id',
    'body_ratios',
    'measurement_source',
  ]),
  hair_analyses: new Set([
    'id',
    'clerk_user_id',
    'image_url',
    'hair_type',
    'hair_thickness',
    'scalp_type',
    'hydration',
    'scalp_health',
    'damage_level',
    'density',
    'elasticity',
    'shine',
    'overall_score',
    'concerns',
    'recommendations',
    'created_at',
    'updated_at',
    'session_id',
    'face_shape',
  ]),
  makeup_analyses: new Set([
    'id',
    'clerk_user_id',
    'image_url',
    'undertone',
    'eye_shape',
    'lip_shape',
    'face_shape',
    'skin_texture',
    'skin_tone_uniformity',
    'hydration',
    'pore_visibility',
    'oil_balance',
    'overall_score',
    'concerns',
    'recommendations',
    'analysis_reliability',
    'created_at',
    'session_id',
  ]),
};

// select 문자열 기록 + 테이블별 canned 응답
const selectCalls: Record<string, string> = {};
const responses: Record<string, { data: unknown; error: unknown }> = {
  personal_color_assessments: {
    data: {
      id: 'pc1',
      season: 'Spring',
      undertone: 'Warm',
      best_colors: ['#ffcc00'],
      created_at: '2026-07-01T00:00:00Z',
    },
    error: null,
  },
  skin_analyses: {
    data: [
      {
        id: 's1',
        skin_type: 'combination',
        overall_score: 82,
        recommendations: { primaryConcerns: ['redness'] },
        created_at: '2026-07-02T00:00:00Z',
      },
    ],
    error: null,
  },
  body_analyses: {
    data: {
      id: 'b1',
      body_type: 'straight',
      height: 170,
      weight: 65,
      created_at: '2026-07-03T00:00:00Z',
    },
    error: null,
  },
  // 핵심: overall_score가 null인 헤어 (통합 분석이 종합점수를 저장하지 않는 정상 상태)
  hair_analyses: {
    data: {
      id: 'h1',
      hair_type: 'straight',
      overall_score: null,
      damage_level: 2,
      concerns: [],
      created_at: '2026-07-04T00:00:00Z',
    },
    error: null,
  },
  makeup_analyses: {
    data: {
      id: 'm1',
      undertone: 'warm',
      overall_score: 88,
      face_shape: 'oval',
      recommendations: {},
      created_at: '2026-07-05T00:00:00Z',
    },
    error: null,
  },
};

function builderFor(table: string) {
  const resp = responses[table] ?? { data: null, error: null };
  // select→order→limit 체인, 종단은 maybeSingle(단건) 또는 await(피부 목록)
  const b: Record<string, unknown> = {
    select: (cols: string) => {
      selectCalls[table] = cols;
      return b;
    },
    order: () => b,
    limit: () => b,
    single: () => Promise.resolve(resp),
    maybeSingle: () => Promise.resolve(resp),
    then: (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(resp).then(onFulfilled, onRejected),
  };
  return b;
}

const mockClient = { from: (t: string) => builderFor(t) };

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'clerk_1' }, isLoaded: true }),
}));

jest.mock('@/lib/supabase', () => ({
  useClerkSupabaseClient: () => mockClient,
}));

import { useUserAnalyses } from '../../hooks/useUserAnalyses';

function columnsOf(select: string): string[] {
  return select
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

describe('useUserAnalyses — prod 스키마 정합', () => {
  it('모든 select 절이 prod 실재 컬럼만 요청한다 (없는 컬럼 요청 금지)', async () => {
    renderHook(() => useUserAnalyses());
    await waitFor(() => expect(Object.keys(selectCalls).length).toBe(5));

    for (const [table, real] of Object.entries(REAL_COLUMNS)) {
      const cols = columnsOf(selectCalls[table]);
      expect(cols.length).toBeGreaterThan(0);
      for (const col of cols) {
        // 실패 시 어떤 테이블/컬럼이 스키마를 벗어났는지 드러나게 단언
        expect({ table, col, present: real.has(col) }).toEqual({ table, col, present: true });
      }
    }
  });

  it('제거된 유령 컬럼을 더 이상 요청하지 않는다', async () => {
    renderHook(() => useUserAnalyses());
    await waitFor(() => expect(Object.keys(selectCalls).length).toBe(5));

    expect(selectCalls.personal_color_assessments).not.toMatch(/\btone\b/);
    expect(selectCalls.personal_color_assessments).not.toContain('color_palette');
    expect(selectCalls.skin_analyses).not.toMatch(/\bconcerns\b/);
    expect(selectCalls.body_analyses).not.toContain('bmi');
    expect(selectCalls.makeup_analyses).not.toContain('makeup_style');
    expect(selectCalls.makeup_analyses).not.toContain('color_recommendations');
  });
});

describe('useUserAnalyses — 점수 null 가드', () => {
  it('헤어 overall_score가 null이면 "null점"을 렌더하지 않고 타입 라벨만 노출', async () => {
    const { result } = renderHook(() => useUserAnalyses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const hair = result.current.analyses.find((a) => a.type === 'hair');
    expect(hair).toBeDefined();
    expect(hair?.summary).toBe('직모');
    expect(hair?.summary).not.toContain('null');
    expect(hair?.summary).not.toContain('점');
    // 점수가 없으면 hairScore 자체를 싣지 않는다
    expect(hair?.hairScore).toBeUndefined();
  });

  it('5축이 모두 집계된다 (스키마 정합으로 누락 복구)', async () => {
    const { result } = renderHook(() => useUserAnalyses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const types = result.current.analyses.map((a) => a.type).sort();
    expect(types).toEqual(['body', 'hair', 'makeup', 'personal-color', 'skin']);

    // 점수가 있는 축은 정상적으로 "N점"을 노출
    const skin = result.current.analyses.find((a) => a.type === 'skin');
    expect(skin?.summary).toBe('피부 점수 82점');
    expect(skin?.summary).not.toContain('null');
  });

  it('파생 BMI가 실재 height/weight에서 계산된다', async () => {
    const { result } = renderHook(() => useUserAnalyses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 170cm / 65kg → 22.5
    expect(result.current.bodyAnalysis?.bmi).toBeCloseTo(22.5, 1);
  });
});
