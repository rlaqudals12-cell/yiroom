/**
 * 스타일 리포트 공개 공유 테스트
 * @see lib/share/report.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReportShare, getSharedReport } from '@/lib/share/report';

// 테이블별 fixture — from(table) 체인의 maybeSingle이 이 값을 반환
const fixtures: Record<string, unknown> = {};
const latestFixtures: Record<string, unknown> = {};
let insertedRows: Array<Record<string, unknown>> = [];

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      const state = { isLatest: false };
      const builder = {
        select: () => builder,
        eq: () => builder,
        lte: () => builder,
        in: () => Promise.resolve({ data: [], error: null }),
        is: () => builder,
        order: () => {
          state.isLatest = true;
          return builder;
        },
        limit: () => builder,
        maybeSingle: () =>
          Promise.resolve({
            data: (state.isLatest ? latestFixtures[table] : fixtures[table]) ?? null,
            error: null,
          }),
        insert: (row: Record<string, unknown>) => {
          insertedRows.push({ table, ...row });
          return Promise.resolve({ error: null });
        },
      };
      return builder;
    },
  }),
}));

const VALID_TOKEN = 'a'.repeat(32);

beforeEach(() => {
  for (const key of Object.keys(fixtures)) delete fixtures[key];
  for (const key of Object.keys(latestFixtures)) delete latestFixtures[key];
  insertedRows = [];
});

describe('createReportShare', () => {
  it('세션 소유자가 아니면 null (service-role은 RLS 우회라 명시 검증)', async () => {
    fixtures['integrated_analysis_sessions'] = null;
    expect(await createReportShare('user_x', 'session-1')).toBeNull();
  });

  it('기존 유효 토큰이 있으면 재사용한다', async () => {
    fixtures['integrated_analysis_sessions'] = { id: 'session-1' };
    fixtures['report_shares'] = { token: VALID_TOKEN };
    const result = await createReportShare('user_1', 'session-1');
    expect(result?.token).toBe(VALID_TOKEN);
    expect(insertedRows).toHaveLength(0);
  });

  it('토큰이 없으면 32자 hex 토큰을 발급한다', async () => {
    fixtures['integrated_analysis_sessions'] = { id: 'session-1' };
    fixtures['report_shares'] = null;
    const result = await createReportShare('user_1', 'session-1');
    expect(result?.token).toMatch(/^[a-f0-9]{32}$/);
    expect(insertedRows[0]).toMatchObject({ clerk_user_id: 'user_1', session_id: 'session-1' });
  });
});

describe('getSharedReport', () => {
  it('형식이 틀린 토큰은 쿼리 없이 거부한다', async () => {
    expect(await getSharedReport('short')).toBeNull();
    expect(await getSharedReport('../../../etc/passwd'.padEnd(32, 'x'))).toBeNull();
  });

  it('무효 토큰은 null', async () => {
    fixtures['report_shares'] = null;
    expect(await getSharedReport(VALID_TOKEN)).toBeNull();
  });

  it('사진·식별 필드가 결과 타입에 존재하지 않는다 (화이트리스트 추출)', async () => {
    fixtures['report_shares'] = { session_id: 's1', clerk_user_id: 'user_1' };
    fixtures['integrated_analysis_sessions'] = {
      created_at: '2026-07-08T00:00:00Z',
      persona: { oneLine: '부드러운 여름의 사람', narrative: '...' },
    };
    fixtures['personal_color_assessments'] = {
      season: 'Summer',
      undertone: 'cool',
      best_colors: [{ hex: '#AABBCC', name: '더스티 블루' }, { broken: true }],
    };
    fixtures['skin_analyses'] = {
      skin_type: 'combination',
      overall_score: 78,
      foundation_recommendation: '쿨 베이지',
    };
    fixtures['body_analyses'] = {
      body_type: 'W',
      style_recommendations: { tops: ['보트넥'], bottoms: ['일자핏'] },
    };

    const report = await getSharedReport(VALID_TOKEN);
    expect(report).not.toBeNull();
    const json = JSON.stringify(report);
    // 식별/사진 흔적 없음
    expect(json).not.toContain('image');
    expect(json).not.toContain('clerk');
    // persona 객체에서 한 줄만 추출
    expect(report!.persona).toBe('부드러운 여름의 사람');
    // best_colors 방어적 정규화 (hex 없는 항목 제거)
    expect(report!.personalColor?.bestColors).toEqual([{ hex: '#AABBCC', name: '더스티 블루' }]);
    // style_recommendations 중첩 객체에서 팁 평탄화
    expect(report!.body?.styleTips).toEqual(['보트넥', '일자핏']);
  });

  /**
   * 실제 통합 경로(axis-adapters·makeup-composer)가 저장하는 형상 그대로.
   * - best_colors = hex **문자열 배열** (`palette.mainColors: string[]`)
   * - makeup.recommendations = **JSONB 객체** (배열 아님)
   * 옛 구현은 객체에 `.filter()`를 호출해 공개 리포트가 통째로 500이었고,
   * 문자열 팔레트는 전부 버려 색이 하나도 안 나왔다.
   */
  function seedIntegratedSession(): void {
    fixtures['report_shares'] = { session_id: 's1', clerk_user_id: 'user_1' };
    fixtures['integrated_analysis_sessions'] = {
      created_at: '2026-08-17T00:00:00Z',
      persona: { oneLine: '따뜻한 가을의 사람' },
      used_fallback: [],
    };
    fixtures['personal_color_assessments'] = {
      season: 'Autumn',
      undertone: 'warm',
      best_colors: ['#D2B48C', '#BC8F8F', '#A0522D', '#8B4513'],
      image_analysis: { version: 2, source: 'integrated', usedFallback: false },
    };
    fixtures['skin_analyses'] = {
      skin_type: 'combination',
      overall_score: 72,
      foundation_recommendation: '웜 베이지',
      recommendations: { version: 2, source: 'integrated', usedFallback: false },
    };
    fixtures['body_analyses'] = {
      body_type: 'N',
      style_recommendations: { tops: ['보트넥'], bottoms: ['일자핏'], avoid: ['오버핏'] },
    };
    fixtures['hair_analyses'] = {
      hair_type: 'straight',
      scalp_type: 'normal',
      face_shape: 'oval',
      recommendations: { version: 2, source: 'integrated', usedFallback: false },
    };
    fixtures['makeup_analyses'] = {
      undertone: 'warm',
      recommendations: {
        baseRecommendation: '복합성 피부에는 세미 매트 피니시 + 중간 커버가 어울려요.',
        lipPalette: ['#D2B48C', '#BC8F8F'],
        eyeshadowPalette: ['#A0522D'],
        tutorialSteps: ['1. 세미 매트 피니시의 베이스 제품으로 시작'],
        source: 'integrated',
        usedMock: false,
        measured: { faceShape: true, eyeShape: false, lipShape: false },
      },
    };
  }

  it('통합 경로 실형상(메이크업 객체)에서 크래시하지 않는다', async () => {
    seedIntegratedSession();

    const report = await getSharedReport(VALID_TOKEN);

    expect(report).not.toBeNull();
    // 객체에서 사람이 읽는 문장만 추출 (hex 팔레트·플래그는 문장이 아니다)
    expect(report!.makeup?.recommendations).toContain(
      '복합성 피부에는 세미 매트 피니시 + 중간 커버가 어울려요.'
    );
    expect(report!.makeup?.recommendations.every((r) => typeof r === 'string')).toBe(true);
    // usedMock/measured 같은 내부 플래그가 문장으로 새지 않는다
    expect(JSON.stringify(report!.makeup?.recommendations)).not.toContain('usedMock');
  });

  it('통합 경로의 hex 문자열 팔레트를 버리지 않는다', async () => {
    seedIntegratedSession();

    const report = await getSharedReport(VALID_TOKEN);

    expect(report!.personalColor?.bestColors).toEqual([
      { hex: '#D2B48C', name: '' },
      { hex: '#BC8F8F', name: '' },
      { hex: '#A0522D', name: '' },
      { hex: '#8B4513', name: '' },
    ]);
  });

  it('단독 경로 메이크업 객체(insight/tips)도 같은 정규화기로 처리한다', async () => {
    seedIntegratedSession();
    fixtures['makeup_analyses'] = {
      undertone: 'cool',
      recommendations: {
        insight: '쿨톤에는 로즈 계열 립이 어울려요.',
        tips: ['블러셔는 연하게', '아이라인은 브라운으로'],
        styles: [{ name: '데일리' }],
        analysisReliability: 'medium',
        usedMock: false,
      },
    };

    const report = await getSharedReport(VALID_TOKEN);

    expect(report!.makeup?.recommendations[0]).toBe('쿨톤에는 로즈 계열 립이 어울려요.');
    expect(report!.makeup?.recommendations).toContain('블러셔는 연하게');
  });

  it('레거시 문자열 배열 recommendations도 그대로 지원한다 (하위호환)', async () => {
    seedIntegratedSession();
    fixtures['makeup_analyses'] = {
      undertone: 'neutral',
      recommendations: ['가벼운 베이스', '코랄 립', '브라운 섀도', '넘치는 항목'],
    };

    const report = await getSharedReport(VALID_TOKEN);

    expect(report!.makeup?.recommendations).toEqual(['가벼운 베이스', '코랄 립', '브라운 섀도']);
  });

  it('색 형상 3종(문자열·{hex,name}·{color})을 모두 수용하고 깨진 값은 버린다', async () => {
    seedIntegratedSession();
    fixtures['personal_color_assessments'] = {
      season: 'Summer',
      undertone: 'cool',
      best_colors: [
        '#AABBCC',
        { hex: '#123456', name: '더스티 블루' },
        { color: '#ABC' },
        { broken: true },
        'not-a-color',
        null,
      ],
      image_analysis: null,
    };

    const report = await getSharedReport(VALID_TOKEN);

    expect(report!.personalColor?.bestColors).toEqual([
      { hex: '#AABBCC', name: '' },
      { hex: '#123456', name: '더스티 블루' },
      { hex: '#ABC', name: '' },
    ]);
  });

  describe('폴백(Mock) 정직 고지', () => {
    it('폴백이 없으면 fallbackAxes는 비어 있다', async () => {
      seedIntegratedSession();

      const report = await getSharedReport(VALID_TOKEN);

      expect(report!.fallbackAxes).toEqual([]);
    });

    it('세션 used_fallback(정본)을 그대로 노출한다 — 소유자와 같은 근거', async () => {
      seedIntegratedSession();
      fixtures['integrated_analysis_sessions'] = {
        created_at: '2026-08-17T00:00:00Z',
        persona: null,
        used_fallback: ['skin', 'personal_color', 'body'],
      };

      const report = await getSharedReport(VALID_TOKEN);

      // taxonomy 순서로 고정 (표시 순서가 세션 배열 순서에 흔들리지 않는다)
      expect(report!.fallbackAxes).toEqual(['personal_color', 'skin', 'body']);
    });

    it('세션 집계가 비어도 행에 남은 축별 플래그로 고지한다', async () => {
      seedIntegratedSession();
      fixtures['personal_color_assessments'] = {
        season: 'Autumn',
        undertone: 'warm',
        best_colors: ['#D2B48C'],
        image_analysis: { usedFallback: true },
      };
      fixtures['skin_analyses'] = {
        skin_type: 'dry',
        overall_score: 60,
        recommendations: { usedFallback: true },
      };
      fixtures['hair_analyses'] = {
        hair_type: 'wavy',
        scalp_type: 'normal',
        face_shape: 'oval',
        recommendations: { usedFallback: true },
      };
      fixtures['makeup_analyses'] = {
        undertone: 'warm',
        recommendations: { baseRecommendation: '샘플 문구', usedMock: true },
      };

      const report = await getSharedReport(VALID_TOKEN);

      expect(report!.fallbackAxes).toEqual(['personal_color', 'skin', 'hair', 'makeup']);
    });

    it('알 수 없는 축 코드는 걸러낸다 (라벨 없는 코드 노출 방지)', async () => {
      seedIntegratedSession();
      fixtures['integrated_analysis_sessions'] = {
        created_at: '2026-08-17T00:00:00Z',
        persona: null,
        used_fallback: ['skin', 'oral_health', 42, null],
      };

      const report = await getSharedReport(VALID_TOKEN);

      expect(report!.fallbackAxes).toEqual(['skin']);
    });

    it('내부 JSONB(image_analysis·recommendations)는 공개 payload에 새지 않는다', async () => {
      seedIntegratedSession();
      fixtures['personal_color_assessments'] = {
        season: 'Autumn',
        undertone: 'warm',
        best_colors: ['#D2B48C'],
        // 촬영 조건 등 내부 메타 — 플래그만 읽고 payload로 나가면 안 된다
        image_analysis: { usedFallback: true, capture: { lux: 320 }, contrastLevel: 'high' },
      };

      const report = await getSharedReport(VALID_TOKEN);
      const json = JSON.stringify(report);

      expect(json).not.toContain('capture');
      expect(json).not.toContain('contrastLevel');
      expect(json).not.toContain('image_analysis');
    });
  });

  it('partial 세션도 소유자와 같은 최신 프로필 축을 공유한다', async () => {
    fixtures['report_shares'] = { session_id: 's1', clerk_user_id: 'user_1' };
    fixtures['integrated_analysis_sessions'] = {
      created_at: '2026-07-08T00:00:00Z',
      persona: null,
    };
    fixtures['skin_analyses'] = { skin_type: 'dry', overall_score: null };
    latestFixtures['personal_color_assessments'] = {
      id: 'pc-old',
      season: 'Autumn',
      undertone: 'warm',
      best_colors: ['#A0522D'],
      image_analysis: { usedMock: true },
    };

    const report = await getSharedReport(VALID_TOKEN);
    expect(report!.personalColor?.season).toBe('Autumn');
    expect(report!.skin?.skinType).toBe('dry');
    expect(report!.body).toBeNull();
    expect(report!.fallbackAxes).toContain('personal_color');
  });
});
