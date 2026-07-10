/**
 * 오늘의 맞춤 루틴 API 테스트 (ADR-118)
 *
 * GET /api/routine/daily — 웹 조립 정본(assembleDailyRoutine)을 서버에서 실행해 반환.
 * 검증: 인증(401), 분석 0건(hasSkinAnalysis:false), 분석 있을 때 응답 shape.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Clerk 인증
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// 화장대·목표·어필리에이트는 조립의 곁가지 — 빈 값으로 고정(조립 자체 로직 검증에 집중)
vi.mock('@/lib/scan/product-shelf', () => ({
  getShelfItems: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));
vi.mock('@/lib/capsule', () => ({
  getBeautyProfile: vi.fn().mockResolvedValue({ skin: { userGoals: [] } }),
}));
vi.mock('@/lib/affiliate/products', () => ({
  getRecommendedProductsBySkin: vi.fn().mockResolvedValue([]),
}));

// skin_analyses 조회용 Supabase mock — .select().order().limit().single()
const mockSingle = vi.fn();
const createMockSupabase = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: mockSingle,
  };
  return { from: vi.fn().mockReturnValue(builder) };
};

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => createMockSupabase(),
}));

import { GET } from '@/app/api/routine/daily/route';
import { auth } from '@clerk/nextjs/server';

const skinRow = {
  id: 'skin-1',
  skin_type: 'combination',
  hydration: 35, // ≤40 → dryness 파생 → 장벽 회복 단계
  oil_level: 60,
  pores: 55,
  pigmentation: 70,
  wrinkles: 65,
  sensitivity: 30, // ≤40 → sensitivity + barrier
  created_at: '2026-07-10T00:00:00Z',
};

describe('GET /api/routine/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    mockSingle.mockResolvedValue({ data: skinRow, error: null });
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const response = await GET();
    expect(response.status).toBe(401);
    // CORS 헤더가 붙어야 한다(모바일 크로스 오리진)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('피부 분석이 0건이면 hasSkinAnalysis:false를 반환한다', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.hasSkinAnalysis).toBe(false);
    expect(body.data.morning).toBeUndefined();
    expect(typeof body.data.date).toBe('string');
  });

  it('분석이 있으면 조립된 루틴 응답 shape를 반환한다', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const { data } = body;
    expect(data.hasSkinAnalysis).toBe(true);
    expect(data.skinType).toBe('combination');
    expect(typeof data.skinTypeLabel).toBe('string');

    // 케어 단계 — 수분·민감 저하로 장벽 회복 단계
    expect(data.carePhase.phase).toBe('barrier');
    expect(typeof data.carePhase.label).toBe('string');
    expect(typeof data.carePhase.message).toBe('string');

    // 아침/저녁 스텝 — 비어 있지 않고, 각 스텝에 howto가 부착됨
    expect(Array.isArray(data.morning)).toBe(true);
    expect(data.morning.length).toBeGreaterThan(0);
    expect(Array.isArray(data.evening)).toBe(true);
    expect(data.evening.length).toBeGreaterThan(0);
    const cleanser = data.morning.find((s: { category: string }) => s.category === 'cleanser');
    expect(cleanser).toBeTruthy();
    expect(cleanser.howto).not.toBeNull();
    expect(typeof cleanser.howto.amount).toBe('string');
    // 클렌저는 상태 기반 스펙명이 붙는다
    expect(typeof cleanser.specName).toBe('string');

    // 저녁 포커스 + 주간 7칸 사이클
    expect(typeof data.eveningFocus.focus).toBe('string');
    expect(typeof data.eveningFocus.label).toBe('string');
    expect(data.weeklyCycle).toHaveLength(7);

    // 목표 — 저장된 목표 없으므로 빈 배열
    expect(data.goals).toEqual([]);
  });
});
