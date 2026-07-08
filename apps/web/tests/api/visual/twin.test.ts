/**
 * /api/visual/twin 테스트 (ADR-115) — 생성/조회
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

vi.mock('@/lib/visual-expression/twin', () => ({
  generateTwin: vi.fn(),
  getMyTwin: vi.fn(),
  TwinGenerationError: class TwinGenerationError extends Error {},
}));
vi.mock('@/lib/visual-expression', () => ({
  checkAndConsumeBudget: vi.fn(),
}));

import { GET, POST } from '@/app/api/visual/twin/route';
import { generateTwin, getMyTwin, TwinGenerationError } from '@/lib/visual-expression/twin';
import { checkAndConsumeBudget } from '@/lib/visual-expression';

const VALID_FACE = 'data:image/jpeg;base64,' + 'A'.repeat(200);

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/visual/twin', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const PENDING = { id: 't-1', imageUrl: 'https://signed/t-1', status: 'pending', aiGenerated: true };

describe('POST /api/visual/twin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: true, remaining: 4, limit: 5 });
    vi.mocked(generateTwin).mockResolvedValue(PENDING as never);
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    expect(res.status).toBe(401);
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('인증 + 정상 입력이면 pending 트윈을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('pending');
    expect(data.aiGenerated).toBe(true);
    expect(generateTwin).toHaveBeenCalledOnce();
  });

  it('셀카가 이미지 형식이 아니면 400을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ faceImageBase64: 'not-image' }));
    expect(res.status).toBe(400);
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('상한 초과 시 429 + VISUAL_BUDGET_EXCEEDED를 반환한다(예산 공유)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: false, remaining: 0, limit: 5 });
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    const data = await res.json();
    expect(res.status).toBe(429);
    expect(data.code).toBe('VISUAL_BUDGET_EXCEEDED');
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('생성 실패(TwinGenerationError) 시 정직하게 500을 반환한다(가짜 트윈 금지)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(generateTwin).mockRejectedValue(
      new TwinGenerationError('지금은 트윈을 만들 수 없어요')
    );
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    expect(res.status).toBe(500);
  });
});

describe('GET /api/visual/twin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('내 트윈이 없으면 { twin: null }을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getMyTwin).mockResolvedValue(null);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.twin).toBeNull();
  });

  it('내 트윈이 있으면 레코드를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getMyTwin).mockResolvedValue(PENDING as never);
    const res = await GET();
    const data = await res.json();
    expect(data.twin.id).toBe('t-1');
  });
});
