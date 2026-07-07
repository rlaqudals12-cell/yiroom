/**
 * 스타일 리포트 공개 공유 테스트
 * @see lib/share/report.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReportShare, getSharedReport } from '@/lib/share/report';

// 테이블별 fixture — from(table) 체인의 maybeSingle이 이 값을 반환
const fixtures: Record<string, unknown> = {};
let insertedRows: Array<Record<string, unknown>> = [];

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        is: () => builder,
        maybeSingle: () => Promise.resolve({ data: fixtures[table] ?? null, error: null }),
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
    fixtures['report_shares'] = { session_id: 's1' };
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

  it('누락 축은 null로 우아하게 생략된다 (partial 세션)', async () => {
    fixtures['report_shares'] = { session_id: 's1' };
    fixtures['integrated_analysis_sessions'] = {
      created_at: '2026-07-08T00:00:00Z',
      persona: null,
    };
    fixtures['skin_analyses'] = { skin_type: 'dry', overall_score: null };

    const report = await getSharedReport(VALID_TOKEN);
    expect(report!.personalColor).toBeNull();
    expect(report!.skin?.skinType).toBe('dry');
    expect(report!.body).toBeNull();
  });
});
