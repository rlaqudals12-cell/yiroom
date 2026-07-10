/**
 * 아침 브리핑 API 테스트 (ADR-118)
 * GET /api/briefing — 인증, 응답 shape, CORS(모바일 크로스 오리진), 분석 유/무 분기
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Supabase — from/select/order 체이닝, limit이 종단(결과 반환)
const mockLimit = vi.fn();
const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  limit: mockLimit,
};
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.order.mockReturnValue(mockSupabase);

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

// 날씨 — 조회 안 함(브리핑은 날씨 없이도 성립)
vi.mock('@/lib/weather', () => ({
  getCurrentWeather: vi.fn().mockResolvedValue(null),
  generateEnvironmentAdvice: vi.fn(),
}));

import { GET, OPTIONS } from '@/app/api/briefing/route';
import { auth, currentUser } from '@clerk/nextjs/server';

// collectAnalyses의 5개 limit 호출 순서: pc → skin → body → hair → makeup
function queueAnalyses(opts: {
  pc?: unknown[];
  skin?: unknown[];
  body?: unknown[];
  hair?: unknown[];
  makeup?: unknown[];
}): void {
  mockLimit
    .mockResolvedValueOnce({ data: opts.pc ?? [], error: null })
    .mockResolvedValueOnce({ data: opts.skin ?? [], error: null })
    .mockResolvedValueOnce({ data: opts.body ?? [], error: null })
    .mockResolvedValueOnce({ data: opts.hair ?? [], error: null })
    .mockResolvedValueOnce({ data: opts.makeup ?? [], error: null });
}

describe('GET /api/briefing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    vi.mocked(currentUser).mockResolvedValue({ firstName: '지민', username: null } as never);
  });

  it('비인증 요청은 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('분석이 있으면 브리핑 문장·스와치·스타일·시간대를 반환한다', async () => {
    queueAnalyses({
      pc: [
        {
          id: 'pc-9',
          season: 'spring',
          created_at: new Date().toISOString(),
          best_colors: [
            { name: '코랄', hex: '#FF7F50' },
            { name: '골드', hex: '#FFD700' },
          ],
          image_analysis: {},
        },
      ],
      skin: [
        { id: 'skin-1', overall_score: 82, created_at: new Date().toISOString() },
        { id: 'skin-0', overall_score: 80, created_at: new Date().toISOString() },
      ],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    // 시간대 + 날짜
    expect(body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(['morning', 'afternoon', 'evening', 'night']).toContain(body.data.timeSlot);
    // 문장(이름 포함 인사 + 맺음말은 항상 존재)
    expect(body.data.briefing.greeting).toContain('지민');
    expect(typeof body.data.briefing.closing).toBe('string');
    expect(Array.isArray(body.data.briefing.advice)).toBe(true);
    // 스와치
    expect(body.data.myColors.analysisId).toBe('pc-9');
    expect(body.data.myColors.colors).toHaveLength(2);
    // 오늘의 배색(베스트 컬러 → 5블록)
    expect(body.data.todayStyle.outfit.colors).toHaveLength(5);
    expect(body.data.hasAnalyses).toBe(true);
  });

  it('분석이 없으면 hasAnalyses=false, myColors=null, outfit=null', async () => {
    queueAnalyses({});
    const res = await GET();
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.hasAnalyses).toBe(false);
    expect(body.data.myColors).toBeNull();
    expect(body.data.todayStyle.outfit).toBeNull();
    // 인사/맺음말은 프레이밍이라 분석 없어도 존재
    expect(body.data.briefing.greeting).toContain('지민');
  });

  it('모바일 크로스 오리진 CORS 헤더를 포함한다', async () => {
    queueAnalyses({});
    const res = await GET();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('x-yiroom-client');
  });

  it('OPTIONS preflight는 204 + CORS를 반환한다', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});
