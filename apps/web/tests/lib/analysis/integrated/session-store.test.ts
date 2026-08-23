/** @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조) */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  updates: [] as Array<Record<string, unknown>>,
  agreement: {
    data: { biometric_agreed: true } as { biometric_agreed: boolean } | null,
    error: null as { message: string } | null,
  },
}));

vi.mock('@/lib/supabase/service-role', () => {
  const selectedRow = (payload: Record<string, unknown>) => ({
    id: 'sess-1',
    clerk_user_id: 'user_1',
    face_image_url: null,
    body_image_url: null,
    questionnaire: {},
    status: 'pending',
    axes_completed: [],
    axes_failed: [],
    used_fallback: [],
    persona: null,
    created_at: '2026-08-23T00:00:00.000Z',
    completed_at: null,
    ...payload,
  });

  const makeMutationResult = (payload: Record<string, unknown>) => {
    const result = { data: null, error: null };
    const query = {
      select: () => ({
        single: async () => ({ data: selectedRow(payload), error: null }),
      }),
      then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    };
    return query;
  };

  const insert = (payload: Record<string, unknown>) => {
    captured.inserts.push(payload);
    return {
      select: () => ({
        single: async () => ({ data: selectedRow(payload), error: null }),
      }),
    };
  };
  const update = (payload: Record<string, unknown>) => {
    captured.updates.push(payload);
    return { eq: () => makeMutationResult(payload) };
  };
  const agreementQuery = {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => captured.agreement,
      }),
    }),
  };
  return {
    createServiceRoleClient: () => ({
      from: (table: string) => (table === 'user_agreements' ? agreementQuery : { insert, update }),
    }),
  };
});

import {
  attachSessionImagePointers,
  assertBiometricConsentForImageAttach,
  clearSessionImagePointers,
  createSession,
  recordSessionImageCleanupPending,
  recordSessionImageStorageFailure,
} from '@/lib/analysis/integrated/internal/session-store';
import { CLIENT_REQUEST_ID_KEY } from '@/lib/analysis/integrated';

beforeEach(() => {
  captured.inserts = [];
  captured.updates = [];
  captured.agreement = { data: { biometric_agreed: true }, error: null };
});

const base = {
  clerkUserId: 'user_1',
  faceImageUrl: 'face.jpg',
  bodyImageUrl: null,
  questionnaire: { skin: { selfReportedType: 'dry' } },
};

describe('session-store — 이미지 저장 원자 경계', () => {
  it('포인터 부착 직전 글로벌 생체 동의를 fail-closed로 재확인한다', async () => {
    await expect(assertBiometricConsentForImageAttach('user_1')).resolves.toBeUndefined();

    captured.agreement = { data: { biometric_agreed: false }, error: null };
    await expect(assertBiometricConsentForImageAttach('user_1')).rejects.toThrow(
      'biometric consent is not active'
    );

    captured.agreement = { data: null, error: { message: 'db unavailable' } };
    await expect(assertBiometricConsentForImageAttach('user_1')).rejects.toThrow(
      'biometric consent is not active'
    );
  });

  it('clientRequestId를 null-pointer pending 세션의 questionnaire 예약 키로 저장한다', async () => {
    await createSession({
      ...base,
      faceImageUrl: null,
      bodyImageUrl: null,
      clientRequestId: 'req-abc',
    });

    expect(captured.inserts[0]).toMatchObject({
      face_image_url: null,
      body_image_url: null,
      status: 'pending',
    });
    const questionnaire = captured.inserts[0].questionnaire as Record<string, unknown>;
    expect(questionnaire[CLIENT_REQUEST_ID_KEY]).toBe('req-abc');
    expect(questionnaire.skin).toEqual({ selfReportedType: 'dry' });
  });

  it('업로드 성공 뒤 포인터만 별도 부착한다', async () => {
    await attachSessionImagePointers({
      sessionId: 'sess-1',
      faceImageUrl: 'user_1/sess-1/face.jpg',
      bodyImageUrl: 'user_1/sess-1/body.webp',
    });

    expect(captured.updates[0]).toEqual({
      face_image_url: 'user_1/sess-1/face.jpg',
      body_image_url: 'user_1/sess-1/body.webp',
      image_cleanup_pending: false,
    });
  });

  it('불확실한 attach 응답 뒤 포인터를 멱등하게 비운다', async () => {
    await clearSessionImagePointers('sess-1');
    expect(captured.updates[0]).toEqual({
      face_image_url: null,
      body_image_url: null,
      image_cleanup_pending: false,
    });
  });

  it('정리 확인된 선택 저장 실패는 비민감 코드와 시각만 기록한다', async () => {
    await recordSessionImageStorageFailure({
      sessionId: 'sess-1',
      questionnaire: { imageStorageConsent: true },
      failure: 'upload_failed',
      failedAt: '2026-08-23T01:00:00.000Z',
    });

    expect(captured.updates[0]).toEqual({
      questionnaire: {
        imageStorageConsent: true,
        _imageStorageFailure: 'upload_failed',
        _imageStorageFailureAt: '2026-08-23T01:00:00.000Z',
      },
    });
  });

  it('rollback 실패 후보 경로를 failed session의 즉시 재시도 큐로 소유시킨다', async () => {
    await recordSessionImageCleanupPending({
      sessionId: 'sess-1',
      questionnaire: { imageStorageConsent: true },
      failure: 'cleanup_failed',
      faceImageUrl: 'user_1/sess-1/face.jpg',
      bodyImageUrl: null,
      failedAt: '2026-08-23T01:00:00.000Z',
    });

    expect(captured.updates[0]).toEqual({
      face_image_url: 'user_1/sess-1/face.jpg',
      body_image_url: null,
      image_cleanup_pending: true,
      questionnaire: {
        imageStorageConsent: true,
        _imageStorageFailure: 'cleanup_failed',
        _imageStorageFailureAt: '2026-08-23T01:00:00.000Z',
        _imageStorageCleanupPending: true,
      },
    });
  });
});
