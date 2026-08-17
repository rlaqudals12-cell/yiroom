/**
 * 세션 Store 테스트 — 이탈 복구 상관 ID 저장
 *
 * 2026-08 외부 리뷰 #3: 복구 판정이 시각 비교(±2분)라 직전 세션을 오연결했다.
 * 전용 컬럼이 없어(마이그레이션은 수동 gap-apply) questionnaire JSONB 예약 키에 담는다.
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const captured = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/lib/supabase/service-role', () => {
  const insert = (payload: Record<string, unknown>) => {
    captured.inserts.push(payload);
    const single = async (): Promise<{ data: unknown; error: null }> => ({
      data: { id: 'sess-1', ...payload },
      error: null,
    });
    return { select: () => ({ single }) };
  };
  return { createServiceRoleClient: () => ({ from: () => ({ insert }) }) };
});

import { createSession } from '@/lib/analysis/integrated/internal/session-store';
import { CLIENT_REQUEST_ID_KEY } from '@/lib/analysis/integrated';

beforeEach(() => {
  captured.inserts = [];
});

const base = {
  clerkUserId: 'user_1',
  faceImageUrl: 'face.jpg',
  bodyImageUrl: null,
  questionnaire: { skin: { selfReportedType: 'dry' } },
};

describe('createSession — 상관 ID 저장', () => {
  it('clientRequestId를 questionnaire 예약 키로 함께 저장한다', async () => {
    await createSession({ ...base, clientRequestId: 'req-abc' });

    const questionnaire = captured.inserts[0].questionnaire as Record<string, unknown>;
    expect(questionnaire[CLIENT_REQUEST_ID_KEY]).toBe('req-abc');
    // 문진 내용은 그대로 보존 (예약 키가 덮어쓰지 않는다)
    expect(questionnaire.skin).toEqual({ selfReportedType: 'dry' });
  });

  it('상관 ID가 없으면 questionnaire를 손대지 않는다 (구 클라이언트 호환)', async () => {
    await createSession(base);

    expect(captured.inserts[0].questionnaire).toEqual(base.questionnaire);
    expect(captured.inserts[0].questionnaire).not.toHaveProperty(CLIENT_REQUEST_ID_KEY);
  });
});
