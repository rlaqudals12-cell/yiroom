/**
 * 스캔 판정 API 테스트 — /api/scan/analyze (ADR-112)
 * - 하위호환(overallScore 등) 유지 + regulatory(L1)/timelines(L4) 포함 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Clerk auth mock (비로그인 → 사용자 분석 스킵, L1/L4만 검증)
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// cosmetic_ingredients 단일 쿼리 mock 행 (향료 = 알레르겐)
const cosmeticRows = [
  {
    name_ko: '향료',
    name_en: 'Fragrance',
    name_inci: 'FRAGRANCE',
    aliases: ['parfum'],
    ewg_score: 6,
    is_caution_20: false,
    is_allergen: true,
    allergen_type: '착향제',
  },
];

const limitFn = () => Promise.resolve({ data: cosmeticRows, error: null });
const selectFn = () => ({ limit: limitFn });
const fromFn = () => ({ select: selectFn });

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({ from: fromFn }),
}));

import { POST } from '@/app/api/scan/analyze/route';
import { auth } from '@clerk/nextjs/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('/api/scan/analyze', 'http://localhost'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ingredients = [
  { order: 1, inciName: 'FRAGRANCE', nameKo: '향료' },
  { order: 2, inciName: 'RETINOL', nameKo: '레티놀' },
];

describe('POST /api/scan/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
  });

  it('성분 없으면 400', async () => {
    const response = await POST(createRequest({ ingredients: [] }));
    expect(response.status).toBe(400);
  });

  it('기존 호환성 필드를 유지한다 (하위호환)', async () => {
    const response = await POST(createRequest({ ingredients }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.overallScore).toBe('number');
    expect(data.skinCompatibility).toBeDefined();
    expect(data.ingredientAnalysis).toBeDefined();
  });

  it('regulatory(L1)에 알레르겐 항목을 포함한다', async () => {
    const response = await POST(createRequest({ ingredients }));
    const data = await response.json();

    expect(Array.isArray(data.regulatory)).toBe(true);
    expect(data.regulatory.some((r: { kind: string }) => r.kind === 'allergen25')).toBe(true);
  });

  it('timelines(L4)에 레티놀 타임라인을 포함한다', async () => {
    const response = await POST(createRequest({ ingredients }));
    const data = await response.json();

    expect(Array.isArray(data.timelines)).toBe(true);
    const retinol = data.timelines.find((t: { name: string }) => t.name === '레티놀');
    expect(retinol).toBeDefined();
    expect(retinol.sourceUrl).toMatch(/^https?:\/\//);
  });
});
