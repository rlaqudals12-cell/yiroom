/**
 * 피부 목표 API 테스트 (ADR-117 루틴 v2)
 * @see app/api/user/skin-goals/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

const mockGetProfile = vi.fn();
const mockUpdateField = vi.fn();
vi.mock('@/lib/capsule', () => ({
  getBeautyProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateBeautyProfileField: (...args: unknown[]) => mockUpdateField(...args),
}));

const { GET, PATCH } = await import('@/app/api/user/skin-goals/route');

function patchReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/user/skin-goals', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('/api/user/skin-goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateField.mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('미인증 → 401', async () => {
      mockAuth.mockResolvedValue({ userId: null });
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('저장된 목표 반환', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetProfile.mockResolvedValue({ skin: { userGoals: ['brightening', 'acne'] } });
      const res = await GET();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.goals).toEqual(['brightening', 'acne']);
    });

    it('목표 없으면 빈 배열', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetProfile.mockResolvedValue({ skin: { type: 'dry' } });
      const res = await GET();
      const data = await res.json();
      expect(data.goals).toEqual([]);
    });
  });

  describe('PATCH', () => {
    it('미인증 → 401', async () => {
      mockAuth.mockResolvedValue({ userId: null });
      const res = await PATCH(patchReq({ goals: ['acne'] }));
      expect(res.status).toBe(401);
    });

    it('잘못된 목표 값 → 400 (zod)', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      const res = await PATCH(patchReq({ goals: ['not_a_goal'] }));
      expect(res.status).toBe(400);
      expect(mockUpdateField).not.toHaveBeenCalled();
    });

    it('잘못된 JSON → 400', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      const badReq = new NextRequest('http://localhost/api/user/skin-goals', {
        method: 'PATCH',
        body: 'not json',
      });
      const res = await PATCH(badReq);
      expect(res.status).toBe(400);
    });

    it('유효 목표 저장 → 기존 skin 필드 보존 + userGoals 병합', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetProfile.mockResolvedValue({
        skin: { type: 'combination', concerns: ['dryness'], scores: { hydration: 50 } },
      });
      const res = await PATCH(patchReq({ goals: ['brightening', 'hydration'] }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.goals).toEqual(['brightening', 'hydration']);
      expect(mockUpdateField).toHaveBeenCalledWith('user_1', 'S', {
        type: 'combination',
        concerns: ['dryness'],
        scores: { hydration: 50 },
        userGoals: ['brightening', 'hydration'],
      });
    });

    it('중복 목표 제거', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetProfile.mockResolvedValue({ skin: undefined });
      const res = await PATCH(patchReq({ goals: ['acne', 'acne', 'sebum'] }));
      const data = await res.json();
      expect(data.goals).toEqual(['acne', 'sebum']);
    });

    it('빈 배열 허용 (목표 해제)', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetProfile.mockResolvedValue({ skin: { type: 'dry' } });
      const res = await PATCH(patchReq({ goals: [] }));
      expect(res.status).toBe(200);
    });
  });
});
