/**
 * POST /api/visual/beautify 테스트 (ADR-113)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

vi.mock('@/lib/visual-expression', () => ({
  beautifyForShare: vi.fn(),
  checkAndConsumeBudget: vi.fn(),
}));

import { POST } from '@/app/api/visual/beautify/route';
import { beautifyForShare, checkAndConsumeBudget } from '@/lib/visual-expression';

const VALID_IMAGE = 'data:image/jpeg;base64,' + 'A'.repeat(200);

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/visual/beautify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/visual/beautify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: true, remaining: 4, limit: 5 });
    vi.mocked(beautifyForShare).mockResolvedValue({
      imageBase64: 'data:image/png;base64,ZZZ',
      aiEdited: true,
      model: 'gemini-2.5-flash-image',
    });
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(makeReq({ imageBase64: VALID_IMAGE }));
    expect(res.status).toBe(401);
  });

  it('인증 + 정상 입력이면 보정 결과를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ imageBase64: VALID_IMAGE }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.aiEdited).toBe(true);
    expect(beautifyForShare).toHaveBeenCalledOnce();
  });

  it('잘못된 이미지 형식이면 400을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ imageBase64: 'not-image' }));
    expect(res.status).toBe(400);
    expect(beautifyForShare).not.toHaveBeenCalled();
  });

  it('상한 초과 시 429 + VISUAL_BUDGET_EXCEEDED를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: false, remaining: 0, limit: 5 });
    const res = await POST(makeReq({ imageBase64: VALID_IMAGE }));
    const data = await res.json();
    expect(res.status).toBe(429);
    expect(data.code).toBe('VISUAL_BUDGET_EXCEEDED');
    expect(beautifyForShare).not.toHaveBeenCalled();
  });
});
