/**
 * /api/visual/twin 테스트 (ADR-115) — 생성/조회
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

vi.mock('@/lib/visual-expression/twin', () => ({
  deleteTwin: vi.fn(),
  generateTwin: vi.fn(),
  getMyTwin: vi.fn(),
  TwinGenerationError: class TwinGenerationError extends Error {},
}));
vi.mock('@/lib/visual-expression', () => ({
  checkAndConsumeBudget: vi.fn(),
  refundBudget: vi.fn(),
}));
vi.mock('@/lib/api/twin-consent', () => ({
  queueTwinCleanupAfterRollbackFailure: vi.fn(),
  requireTwinConsent: vi.fn(),
}));

import { GET, POST } from '@/app/api/visual/twin/route';
import {
  deleteTwin,
  generateTwin,
  getMyTwin,
  TwinGenerationError,
} from '@/lib/visual-expression/twin';
import { checkAndConsumeBudget, refundBudget } from '@/lib/visual-expression';
import { queueTwinCleanupAfterRollbackFailure, requireTwinConsent } from '@/lib/api/twin-consent';

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
    vi.mocked(requireTwinConsent).mockResolvedValue(null);
    vi.mocked(checkAndConsumeBudget).mockResolvedValue({ allowed: true, remaining: 4, limit: 5 });
    vi.mocked(generateTwin).mockResolvedValue(PENDING as never);
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    expect(res.status).toBe(401);
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('생체 또는 AI 아바타 저장 동의가 없으면 생성·예산 소비 전에 403으로 막는다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(requireTwinConsent).mockResolvedValueOnce(
      NextResponse.json({ error: 'consent required' }, { status: 403 })
    );

    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));

    expect(res.status).toBe(403);
    expect(checkAndConsumeBudget).not.toHaveBeenCalled();
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('인증 + 정상 입력이면 pending 트윈을 반환한다(성공 시 환불 없음)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('pending');
    expect(data.aiGenerated).toBe(true);
    expect(generateTwin).toHaveBeenCalledOnce();
    // 성공 경로에서는 예산을 되돌리지 않는다
    expect(refundBudget).not.toHaveBeenCalled();
    expect(requireTwinConsent).toHaveBeenCalledTimes(2);
  });

  it('다른 탭에서 생성 중 동의를 철회하면 저장 결과를 롤백하고 403으로 닫는다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const withdrawn = NextResponse.json({ error: 'consent withdrawn' }, { status: 403 });
    vi.mocked(requireTwinConsent).mockResolvedValueOnce(null).mockResolvedValueOnce(withdrawn);

    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));

    expect(res.status).toBe(403);
    expect(generateTwin).toHaveBeenCalledOnce();
    expect(deleteTwin).toHaveBeenCalledWith('user-1', 't-1');
    expect(queueTwinCleanupAfterRollbackFailure).not.toHaveBeenCalled();
    expect(refundBudget).toHaveBeenCalledWith('user-1');
  });

  it('철회 경합 롤백 실패도 결과를 반환하지 않고 cleanup 재시도를 예약한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const withdrawn = NextResponse.json({ error: 'consent withdrawn' }, { status: 403 });
    vi.mocked(requireTwinConsent).mockResolvedValueOnce(null).mockResolvedValueOnce(withdrawn);
    vi.mocked(deleteTwin).mockRejectedValueOnce(new Error('storage unavailable'));

    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));

    expect(res.status).toBe(403);
    expect(queueTwinCleanupAfterRollbackFailure).toHaveBeenCalledWith('user-1');
    expect(refundBudget).toHaveBeenCalledWith('user-1');
  });

  it('셀카가 이미지 형식이 아니면 400을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ faceImageBase64: 'not-image' }));
    expect(res.status).toBe(400);
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('상한 초과 시 429 + VISUAL_BUDGET_EXCEEDED를 반환한다(예산 공유)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(checkAndConsumeBudget).mockResolvedValue({ allowed: false, remaining: 0, limit: 5 });
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    const data = await res.json();
    expect(res.status).toBe(429);
    expect(data.code).toBe('VISUAL_BUDGET_EXCEEDED');
    expect(generateTwin).not.toHaveBeenCalled();
  });

  it('생성 실패(TwinGenerationError) 시 정직하게 500을 반환하고 예산을 환불한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(generateTwin).mockRejectedValue(
      new TwinGenerationError('지금은 트윈을 만들 수 없어요')
    );
    const res = await POST(makeReq({ faceImageBase64: VALID_FACE }));
    expect(res.status).toBe(500);
    // 실패한 시도는 일 5회 상한에 계산하지 않도록 소비분을 되돌린다
    expect(refundBudget).toHaveBeenCalledWith('user-1');
  });

  it('상한 초과로 생성을 건너뛴 경우엔 환불하지 않는다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(checkAndConsumeBudget).mockResolvedValue({ allowed: false, remaining: 0, limit: 5 });
    await POST(makeReq({ faceImageBase64: VALID_FACE }));
    expect(refundBudget).not.toHaveBeenCalled();
  });
});

describe('GET /api/visual/twin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireTwinConsent).mockResolvedValue(null);
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('현재 동의를 확인할 수 없으면 저장 아바타를 조회하지 않는다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(requireTwinConsent).mockResolvedValueOnce(
      NextResponse.json({ error: 'consent required' }, { status: 403 })
    );

    const res = await GET();

    expect(res.status).toBe(403);
    expect(getMyTwin).not.toHaveBeenCalled();
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
