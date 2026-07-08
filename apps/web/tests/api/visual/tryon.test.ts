/**
 * /api/visual/tryon 테스트 (ADR-113)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

vi.mock('@/lib/visual-expression', () => ({
  isTryonAvailable: vi.fn(),
  generateTryon: vi.fn(),
  checkAndConsumeBudget: vi.fn(),
}));

import { GET, POST } from '@/app/api/visual/tryon/route';
import { isTryonAvailable, generateTryon, checkAndConsumeBudget } from '@/lib/visual-expression';

const VALID_BODY = {
  modelImageBase64: 'data:image/jpeg;base64,' + 'A'.repeat(200),
  garmentImageUrl: 'https://example.com/garment.jpg',
  category: 'tops',
};

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/visual/tryon', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('GET /api/visual/tryon (availability)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('키가 없으면 available:false를 반환한다', async () => {
    vi.mocked(isTryonAvailable).mockReturnValue(false);
    const res = await GET();
    const data = await res.json();
    expect(data.available).toBe(false);
  });

  it('키가 있으면 available:true를 반환한다', async () => {
    vi.mocked(isTryonAvailable).mockReturnValue(true);
    const res = await GET();
    const data = await res.json();
    expect(data.available).toBe(true);
  });
});

describe('POST /api/visual/tryon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: true, remaining: 4, limit: 5 });
    vi.mocked(generateTryon).mockResolvedValue({
      imageUrl: 'https://cdn.fashn.ai/r.jpg',
      aiGenerated: true,
    });
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(isTryonAvailable).mockReturnValue(true);
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('키가 없으면(isTryonAvailable=false) 404를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(isTryonAvailable).mockReturnValue(false);
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(404);
    expect(generateTryon).not.toHaveBeenCalled();
  });

  it('인증 + 키 + 정상 입력이면 착장 결과를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(isTryonAvailable).mockReturnValue(true);
    const res = await POST(makeReq(VALID_BODY));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.aiGenerated).toBe(true);
    expect(generateTryon).toHaveBeenCalledOnce();
  });

  it('상한 초과 시 429를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(isTryonAvailable).mockReturnValue(true);
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: false, remaining: 0, limit: 5 });
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(429);
    expect(generateTryon).not.toHaveBeenCalled();
  });
});
