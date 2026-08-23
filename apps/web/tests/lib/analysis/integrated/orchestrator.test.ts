/**
 * 통합 분석 오케스트레이터 테스트
 *
 * 2026-08 외부 리뷰 확정 결함 2건의 회귀 방지:
 * - #1 선택 재분석에서 제외한 축이 M-1 입력에서 사라져 "메이크업만 재분석"이 항상 실패
 * - #2 finalize 실패를 삼키고 성공을 반환 → 세션은 pending인데 클라는 완료로 알고 마커 삭제
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  AxisResult,
  BodyAxisData,
  HairAxisData,
  IntegratedAnalysisInput,
  MakeupAxisData,
  PersonalColorAxisData,
  SkinAxisData,
} from '@/lib/analysis/integrated';

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  finalizeSession: vi.fn(),
  markSessionFailed: vi.fn(),
  runPersonalColorAxis: vi.fn(),
  runSkinAxis: vi.fn(),
  runBodyAxis: vi.fn(),
  runHairAxis: vi.fn(),
  runMakeupComposer: vi.fn(),
  fetchProfileSnapshot: vi.fn(),
  composePersona: vi.fn(),
  uploadSessionImages: vi.fn(),
  rollbackUploadedSessionImages: vi.fn(),
  attachSessionImagePointers: vi.fn(),
  assertBiometricConsentForImageAttach: vi.fn(),
  clearSessionImagePointers: vi.fn(),
  recordSessionImageStorageFailure: vi.fn(),
  recordSessionImageCleanupPending: vi.fn(),
}));

vi.mock('@/lib/analysis/integrated/internal/storage-uploader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/analysis/integrated/internal/storage-uploader')>()),
  uploadSessionImages: mocks.uploadSessionImages,
  rollbackUploadedSessionImages: mocks.rollbackUploadedSessionImages,
}));

vi.mock('@/lib/analysis/integrated/internal/session-store', () => ({
  createSession: mocks.createSession,
  finalizeSession: mocks.finalizeSession,
  markSessionFailed: mocks.markSessionFailed,
  attachSessionImagePointers: mocks.attachSessionImagePointers,
  assertBiometricConsentForImageAttach: mocks.assertBiometricConsentForImageAttach,
  clearSessionImagePointers: mocks.clearSessionImagePointers,
  recordSessionImageStorageFailure: mocks.recordSessionImageStorageFailure,
  recordSessionImageCleanupPending: mocks.recordSessionImageCleanupPending,
}));

vi.mock('@/lib/analysis/integrated/internal/axis-adapters', () => ({
  runPersonalColorAxis: mocks.runPersonalColorAxis,
  runSkinAxis: mocks.runSkinAxis,
  runBodyAxis: mocks.runBodyAxis,
  runHairAxis: mocks.runHairAxis,
}));

vi.mock('@/lib/analysis/integrated/internal/makeup-composer', () => ({
  runMakeupComposer: mocks.runMakeupComposer,
}));

vi.mock('@/lib/analysis/integrated/profile-snapshot', () => ({
  fetchIntegratedProfileSnapshot: mocks.fetchProfileSnapshot,
}));

vi.mock('@/lib/analysis/integrated/internal/persona-composer', () => ({
  composePersona: mocks.composePersona,
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({}),
}));

vi.mock('@/lib/api/analysis-helpers/gamification', () => ({
  withGamification: vi.fn(async () => undefined),
}));

vi.mock('@/lib/gamification', () => ({
  addXp: vi.fn(async () => undefined),
}));

import { runIntegratedAnalysis } from '@/lib/analysis/integrated/orchestrator';
import { SessionFinalizeError } from '@/lib/analysis/integrated/orchestrator';
import { createExecutionDeadline } from '@/lib/utils/timeout';
import {
  ImageStorageOperationError,
  ImageStorageRollbackError,
} from '@/lib/analysis/integrated/internal/storage-uploader';

const USER = 'user_test_1';

function baseInput(overrides: Partial<IntegratedAnalysisInput> = {}): IntegratedAnalysisInput {
  return {
    faceImageBase64: 'data:image/jpeg;base64,face',
    questionnaire: {
      skin: { selfReportedType: 'unknown', concerns: [] },
      hair: {},
      body: {},
      imageStorageConsent: false,
    },
    mode: 'full',
    options: { locale: 'ko', skipMakeup: false },
    ...overrides,
  } as IntegratedAnalysisInput;
}

const pcOk: AxisResult<PersonalColorAxisData> = {
  success: true,
  usedFallback: false,
  data: { season: 'spring', tone: 'light-spring', undertone: 'warm', confidence: 88 },
};
const skinOk: AxisResult<SkinAxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'dry', overallScore: 80 },
};
const bodyOk: AxisResult<BodyAxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'rectangle' },
};
const hairOk: AxisResult<HairAxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'oval' },
};
const makeupOk: AxisResult<MakeupAxisData> = {
  success: true,
  usedFallback: false,
  data: { baseRecommendation: '추천' },
};

const EMPTY_AXES = {
  personal_color: null,
  skin: null,
  body: null,
  hair: null,
  makeup: null,
};

function snapshotWith(
  axes: Partial<Record<keyof typeof EMPTY_AXES, Record<string, unknown>>> = {},
  fallbackStates: Partial<Record<keyof typeof EMPTY_AXES, 'used' | 'not_used' | 'unknown'>> = {}
) {
  const mergedAxes = { ...EMPTY_AXES, ...axes };
  const provenance = Object.fromEntries(
    Object.entries(mergedAxes).map(([axis, record]) => [
      axis,
      record
        ? {
            source: 'profile',
            fallbackState: fallbackStates[axis as keyof typeof EMPTY_AXES] ?? 'not_used',
            confidence: 'normal',
            recordId: String(record.id ?? ''),
            sourceSessionId: null,
            sourceCreatedAt: null,
          }
        : null,
    ])
  );
  return {
    axes: mergedAxes,
    provenance,
    axesFromProfile: Object.keys(axes),
    axesFetchFailed: [],
    fallbackAxes: Object.entries(fallbackStates)
      .filter(([, state]) => state === 'used')
      .map(([axis]) => axis),
    unknownAxes: Object.entries(fallbackStates)
      .filter(([, state]) => state === 'unknown')
      .map(([axis]) => axis),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createSession.mockImplementation(
    async (input: { questionnaire: Record<string, unknown> }) => ({
      id: 'session-created',
      created_at: '2026-08-17T00:00:00.000Z',
      used_fallback: [],
      questionnaire: input.questionnaire,
    })
  );
  mocks.finalizeSession.mockResolvedValue({});
  mocks.runPersonalColorAxis.mockResolvedValue(pcOk);
  mocks.runSkinAxis.mockResolvedValue(skinOk);
  mocks.runBodyAxis.mockResolvedValue(bodyOk);
  mocks.runHairAxis.mockResolvedValue(hairOk);
  mocks.runMakeupComposer.mockResolvedValue(makeupOk);
  mocks.fetchProfileSnapshot.mockResolvedValue(snapshotWith());
  mocks.composePersona.mockResolvedValue(null);
  mocks.uploadSessionImages.mockResolvedValue({ faceImageUrl: null, bodyImageUrl: null });
  mocks.attachSessionImagePointers.mockResolvedValue({});
  mocks.assertBiometricConsentForImageAttach.mockResolvedValue(undefined);
  mocks.clearSessionImagePointers.mockResolvedValue(undefined);
  mocks.recordSessionImageStorageFailure.mockResolvedValue(undefined);
  mocks.recordSessionImageCleanupPending.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('runIntegratedAnalysis — 선택 재분석 축 승계 (외부 리뷰 #1)', () => {
  it('메이크업만 재분석해도 같은 스냅샷의 PC·S·H를 composer와 persona가 재사용한다', async () => {
    mocks.fetchProfileSnapshot.mockResolvedValue(
      snapshotWith({
        personal_color: {
          id: 'pc-old',
          season: 'autumn',
          undertone: 'warm',
          confidence: 90,
          image_analysis: { tone: 'true-autumn' },
        },
        skin: { id: 'skin-old', skin_type: 'oily', overall_score: 62 },
        body: { id: 'body-old', body_type: 'N' },
        hair: { id: 'hair-old', face_shape: 'heart' },
      })
    );

    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['makeup'] }), USER);

    expect(mocks.runPersonalColorAxis).not.toHaveBeenCalled();
    expect(mocks.runSkinAxis).not.toHaveBeenCalled();
    expect(mocks.runMakeupComposer).toHaveBeenCalledTimes(1);
    const [, , pcArg, skinArg, hairArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg).toEqual({
      success: true,
      usedFallback: false,
      fallbackState: 'not_used',
      data: {
        id: 'pc-old',
        season: 'autumn',
        tone: 'true-autumn',
        undertone: 'warm',
        confidence: 90,
        palette: [],
      },
    });
    expect(skinArg).toEqual({
      success: true,
      usedFallback: false,
      fallbackState: 'not_used',
      data: { id: 'skin-old', skinType: 'oily', overallScore: 62 },
    });
    expect(hairArg).toEqual({
      success: true,
      usedFallback: false,
      fallbackState: 'not_used',
      data: { id: 'hair-old', faceShape: 'heart', hairType: undefined },
    });
    const [personaAxes] = mocks.composePersona.mock.calls[0];
    expect(personaAxes.personalColor).toBe(pcArg);
    expect(personaAxes.skin).toBe(skinArg);
    expect(personaAxes.hair).toBe(hairArg);
    expect(personaAxes.body).toMatchObject({ success: true, data: { bodyType: 'N' } });
    expect(personaAxes.makeup).toBe(makeupOk);
  });

  it('승계한 진단이 Mock이었으면 폴백 표시도 함께 승계한다 (정직성)', async () => {
    mocks.fetchProfileSnapshot.mockResolvedValue(
      snapshotWith(
        {
          personal_color: {
            id: 'pc-mock',
            season: 'winter',
            undertone: 'cool',
            confidence: 40,
            image_analysis: { tone: 'true-winter' },
          },
          skin: { id: 'skin-old', skin_type: 'normal', overall_score: 70 },
        },
        { personal_color: 'used' }
      )
    );

    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['makeup'] }), USER);

    const [, , pcArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg.usedFallback).toBe(true);
    expect(pcArg.fallbackState).toBe('used');
  });

  it('승계할 진단이 없으면 센티널을 유지해 composer가 정직하게 실패한다', async () => {
    mocks.runMakeupComposer.mockResolvedValue({
      success: false,
      error: {
        code: 'REQUIRES_PC_AND_S',
        message: 'x',
        userMessage: 'y',
        retryable: false,
      },
    });

    const result = await runIntegratedAnalysis(
      baseInput({ mode: 'update', axes: ['makeup'] }),
      USER
    );

    const [, , pcArg, skinArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg.success).toBe(false);
    expect(skinArg.success).toBe(false);
    expect(result.axesFailed).toContain('makeup');
  });

  it('이번에 재실행한 축은 과거 스냅샷으로 덮지 않는다', async () => {
    mocks.fetchProfileSnapshot.mockResolvedValue(
      snapshotWith({
        personal_color: { id: 'pc-old', season: 'winter' },
        skin: { id: 'skin-old', skin_type: 'oily', overall_score: 10 },
      })
    );
    await runIntegratedAnalysis(
      baseInput({ mode: 'update', axes: ['personal_color', 'skin', 'makeup'] }),
      USER
    );

    const [, , pcArg, skinArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg).toBe(pcOk);
    expect(skinArg).toBe(skinOk);
  });

  it('skin-only는 새 skin과 승계 4축을 합쳐 persona를 만들되 완료 집계는 skin만 유지한다', async () => {
    mocks.fetchProfileSnapshot.mockResolvedValue(
      snapshotWith({
        personal_color: { id: 'pc-old', season: 'summer', undertone: 'cool' },
        body: { id: 'body-old', body_type: 'W' },
        hair: { id: 'hair-old', face_shape: 'round' },
        makeup: {
          id: 'makeup-old',
          recommendations: { baseRecommendation: '가벼운 베이스' },
        },
      })
    );

    const result = await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['skin'] }), USER);

    const [personaAxes] = mocks.composePersona.mock.calls[0];
    expect(personaAxes.skin).toBe(skinOk);
    expect(personaAxes.personalColor).toMatchObject({ success: true });
    expect(personaAxes.body).toMatchObject({ success: true, data: { bodyType: 'W' } });
    expect(personaAxes.hair).toMatchObject({ success: true, data: { faceShape: 'round' } });
    expect(personaAxes.makeup).toMatchObject({
      success: true,
      data: { baseRecommendation: '가벼운 베이스' },
    });
    expect(result.axesCompleted).toEqual(['skin']);
    expect(result.axesFailed).toEqual([]);
    expect(mocks.runMakeupComposer).not.toHaveBeenCalled();
    expect(mocks.fetchProfileSnapshot).toHaveBeenCalledTimes(1);
  });

  it('승계할 축 하나라도 조회에 실패하면 축소된 persona를 이번 세션 실측처럼 저장하지 않는다', async () => {
    mocks.fetchProfileSnapshot.mockResolvedValue({
      ...snapshotWith({
        personal_color: { id: 'pc-old', season: 'summer', undertone: 'cool' },
        body: { id: 'body-old', body_type: 'W' },
        makeup: {
          id: 'makeup-old',
          recommendations: { baseRecommendation: '가벼운 베이스' },
        },
      }),
      axesFetchFailed: ['hair'],
    });

    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['skin'] }), USER);

    expect(mocks.composePersona).not.toHaveBeenCalled();
    expect(mocks.finalizeSession).toHaveBeenCalledWith(expect.objectContaining({ persona: null }));
  });

  it('승계 snapshot 전체 조회가 실패해도 선택 축만으로 persona를 축소 재합성하지 않는다', async () => {
    mocks.fetchProfileSnapshot.mockRejectedValue(new Error('snapshot unavailable'));

    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['skin'] }), USER);

    expect(mocks.composePersona).not.toHaveBeenCalled();
    expect(mocks.finalizeSession).toHaveBeenCalledWith(expect.objectContaining({ persona: null }));
  });

  it('선택한 축 실패는 과거 스냅샷으로 덮지 않는다', async () => {
    const skinFailure: AxisResult<SkinAxisData> = {
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: 'skin failed',
        userMessage: '피부 분석에 실패했어요.',
        retryable: true,
      },
    };
    mocks.runSkinAxis.mockResolvedValue(skinFailure);
    mocks.fetchProfileSnapshot.mockResolvedValue(
      snapshotWith({ skin: { id: 'skin-old', skin_type: 'oily', overall_score: 99 } })
    );

    const result = await runIntegratedAnalysis(
      baseInput({ mode: 'update', axes: ['skin', 'body'] }),
      USER
    );

    const [personaAxes] = mocks.composePersona.mock.calls[0];
    expect(personaAxes.skin).toBe(skinFailure);
    expect(result.axesCompleted).toEqual(['body']);
    expect(result.axesFailed).toEqual(['skin']);
  });

  it('full 분석은 프로필 스냅샷을 조회하지 않고 새 5축만 persona에 쓴다', async () => {
    await runIntegratedAnalysis(baseInput(), USER);

    expect(mocks.fetchProfileSnapshot).not.toHaveBeenCalled();
    const [personaAxes] = mocks.composePersona.mock.calls[0];
    expect(personaAxes).toEqual({
      personalColor: pcOk,
      skin: skinOk,
      body: bodyOk,
      hair: hairOk,
      makeup: makeupOk,
    });
  });
});

describe('runIntegratedAnalysis — finalize 일관성 경계 (외부 리뷰 #2)', () => {
  it('finalize가 한 번 실패하면 재시도해 성공으로 마무리한다', async () => {
    mocks.finalizeSession.mockRejectedValueOnce(new Error('transient')).mockResolvedValueOnce({});

    const result = await runIntegratedAnalysis(baseInput(), USER);

    expect(mocks.finalizeSession).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('completed');
  });

  it('재시도까지 실패하면 성공을 반환하지 않고 오류를 전파한다', async () => {
    mocks.finalizeSession.mockRejectedValue(new Error('db down'));

    await expect(runIntegratedAnalysis(baseInput(), USER)).rejects.toBeInstanceOf(
      SessionFinalizeError
    );
    expect(mocks.finalizeSession).toHaveBeenCalledTimes(2);
  });

  it('finalize 실패를 "분석 실패"로 낙인찍지 않는다 (축 결과는 저장돼 있다)', async () => {
    mocks.finalizeSession.mockRejectedValue(new Error('db down'));

    await expect(runIntegratedAnalysis(baseInput(), USER)).rejects.toThrow();
    // pending으로 남아야 상관 ID 복구 조회가 "아직 마무리 안 됨"을 정직하게 알릴 수 있다
    expect(mocks.markSessionFailed).not.toHaveBeenCalled();
  });

  it('축 실행 자체의 예외는 여전히 세션을 failed로 기록한다', async () => {
    // Promise.allSettled가 흡수하지 못하는(밖에서 터지는) 예외 — composer 경로
    mocks.runMakeupComposer.mockRejectedValue(new Error('composer exploded'));

    await expect(runIntegratedAnalysis(baseInput(), USER)).rejects.toThrow('composer exploded');
    expect(mocks.markSessionFailed).toHaveBeenCalledTimes(1);
  });

  it('finalize 재시도도 부모 deadline을 새로 시작하지 않고 응답 여유 전에 끝난다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    mocks.finalizeSession
      .mockRejectedValueOnce(new Error('transient'))
      .mockImplementationOnce(() => new Promise(() => {}));
    const deadline = createExecutionDeadline(8_000);

    const promise = runIntegratedAnalysis(baseInput(), USER, undefined, deadline);
    const assertion = expect(promise).rejects.toBeInstanceOf(SessionFinalizeError);
    await vi.advanceTimersByTimeAsync(7_500);
    await assertion;

    expect(mocks.finalizeSession).toHaveBeenCalledTimes(2);
    expect(mocks.markSessionFailed).not.toHaveBeenCalled();
    expect(performance.now()).toBeLessThan(8_000);
    deadline.clear();
  });
});

describe('runIntegratedAnalysis — 이탈 복구 상관 ID (외부 리뷰 #3)', () => {
  it('clientRequestId를 세션 생성에 전달한다', async () => {
    const requestId = '11111111-2222-4333-8444-555555555555';
    await runIntegratedAnalysis(baseInput({ clientRequestId: requestId }), USER);

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ clientRequestId: requestId })
    );
  });

  it('구 클라이언트(미전송)는 상관 ID 없이 그대로 동작한다', async () => {
    await runIntegratedAnalysis(baseInput(), USER);

    const arg = mocks.createSession.mock.calls[0][0];
    expect(arg).not.toHaveProperty('clientRequestId');
  });
});

describe('runIntegratedAnalysis — 회차별 원본 저장 동의', () => {
  it('null-pointer pending 세션을 먼저 만들고 미동의 boolean을 업로더에 전달한다', async () => {
    await runIntegratedAnalysis(baseInput(), USER);

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        faceImageUrl: null,
        bodyImageUrl: null,
        questionnaire: expect.objectContaining({ imageStorageConsent: false }),
      })
    );
    expect(mocks.uploadSessionImages).toHaveBeenCalledWith(
      expect.any(String),
      USER,
      'data:image/jpeg;base64,face',
      null,
      false,
      undefined
    );
    expect(mocks.createSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.uploadSessionImages.mock.invocationCallOrder[0]
    );
  });

  it('명시 저장이 성공하면 업로드 뒤에만 포인터를 부착한다', async () => {
    const uploaded = {
      faceImageUrl: 'user/session/face.jpg',
      bodyImageUrl: null,
    };
    mocks.uploadSessionImages.mockResolvedValue(uploaded);

    await runIntegratedAnalysis(
      baseInput({
        questionnaire: {
          ...baseInput().questionnaire,
          imageStorageConsent: true,
        },
      }),
      USER
    );

    expect(mocks.uploadSessionImages).toHaveBeenCalledWith(
      expect.any(String),
      USER,
      'data:image/jpeg;base64,face',
      null,
      true,
      undefined
    );
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ faceImageUrl: null, bodyImageUrl: null })
    );
    expect(mocks.attachSessionImagePointers).toHaveBeenCalledWith({
      sessionId: expect.any(String),
      ...uploaded,
    });
    expect(mocks.uploadSessionImages.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.assertBiometricConsentForImageAttach.mock.invocationCallOrder[0]
    );
    expect(mocks.assertBiometricConsentForImageAttach.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.attachSessionImagePointers.mock.invocationCallOrder[0]
    );
  });

  it('업로드 중 글로벌 생체 동의가 철회되면 attach 전에 rollback하고 분석만 계속한다', async () => {
    const uploaded = { faceImageUrl: 'user/session/face.jpg', bodyImageUrl: null };
    const revoked = new Error('biometric consent revoked');
    mocks.uploadSessionImages.mockResolvedValueOnce(uploaded);
    mocks.assertBiometricConsentForImageAttach.mockRejectedValueOnce(revoked);
    mocks.rollbackUploadedSessionImages.mockRejectedValueOnce(
      new ImageStorageOperationError('consent_recheck', revoked)
    );

    const result = await runIntegratedAnalysis(
      baseInput({
        questionnaire: { ...baseInput().questionnaire, imageStorageConsent: true },
      }),
      USER
    );

    expect(result.status).toBe('completed');
    expect(mocks.rollbackUploadedSessionImages).toHaveBeenCalledWith(
      uploaded,
      revoked,
      'consent_recheck'
    );
    expect(mocks.attachSessionImagePointers).not.toHaveBeenCalled();
    expect(mocks.recordSessionImageStorageFailure).toHaveBeenCalledWith(
      expect.objectContaining({ failure: 'consent_revoked' })
    );
  });

  it('동의 철회 뒤 rollback도 실패하면 후보 경로를 영속 큐에 남기고 중단한다', async () => {
    const uploaded = { faceImageUrl: 'user/session/face.jpg', bodyImageUrl: null };
    const revoked = new Error('biometric consent revoked');
    const rollbackFailure = new ImageStorageRollbackError(
      'consent_recheck',
      revoked,
      new Error('remove denied'),
      [uploaded.faceImageUrl]
    );
    mocks.uploadSessionImages.mockResolvedValueOnce(uploaded);
    mocks.assertBiometricConsentForImageAttach.mockRejectedValueOnce(revoked);
    mocks.rollbackUploadedSessionImages.mockRejectedValueOnce(rollbackFailure);

    await expect(
      runIntegratedAnalysis(
        baseInput({
          questionnaire: { ...baseInput().questionnaire, imageStorageConsent: true },
        }),
        USER
      )
    ).rejects.toBe(rollbackFailure);

    expect(mocks.attachSessionImagePointers).not.toHaveBeenCalled();
    expect(mocks.recordSessionImageCleanupPending).toHaveBeenCalledWith(
      expect.objectContaining({
        failure: 'cleanup_failed',
        faceImageUrl: uploaded.faceImageUrl,
      })
    );
    expect(mocks.markSessionFailed).toHaveBeenCalled();
  });

  it('deferred 업로드 중에도 clientRequestId를 가진 pending 세션이 먼저 존재한다', async () => {
    let resolveUpload!: (value: { faceImageUrl: null; bodyImageUrl: null }) => void;
    mocks.uploadSessionImages.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );
    const requestId = '11111111-2222-4333-8444-555555555555';

    const result = runIntegratedAnalysis(baseInput({ clientRequestId: requestId }), USER);
    await vi.waitFor(() => expect(mocks.uploadSessionImages).toHaveBeenCalledTimes(1));

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        clientRequestId: requestId,
        faceImageUrl: null,
        bodyImageUrl: null,
      })
    );
    expect(mocks.runPersonalColorAxis).not.toHaveBeenCalled();

    resolveUpload({ faceImageUrl: null, bodyImageUrl: null });
    await result;
  });

  it('정리가 확인된 선택 저장 실패는 마커를 남기고 5축 분석을 계속한다', async () => {
    mocks.uploadSessionImages.mockRejectedValueOnce(
      new ImageStorageOperationError('face_upload', new Error('upload failed'))
    );

    const result = await runIntegratedAnalysis(
      baseInput({
        questionnaire: { ...baseInput().questionnaire, imageStorageConsent: true },
      }),
      USER
    );

    expect(result.status).toBe('completed');
    expect(mocks.recordSessionImageStorageFailure).toHaveBeenCalledWith(
      expect.objectContaining({ failure: 'upload_failed' })
    );
    expect(mocks.runPersonalColorAxis).toHaveBeenCalledTimes(1);
  });

  it('rollback 실패는 후보 경로를 재시도 큐에 소유시키고 분석을 중단한다', async () => {
    mocks.uploadSessionImages.mockRejectedValueOnce(
      new ImageStorageRollbackError(
        'face_upload',
        new Error('upload failed'),
        new Error('remove denied'),
        ['user/session/face.jpg']
      )
    );

    await expect(
      runIntegratedAnalysis(
        baseInput({
          questionnaire: { ...baseInput().questionnaire, imageStorageConsent: true },
        }),
        USER
      )
    ).rejects.toBeInstanceOf(ImageStorageRollbackError);

    expect(mocks.recordSessionImageCleanupPending).toHaveBeenCalledWith(
      expect.objectContaining({
        failure: 'cleanup_failed',
        faceImageUrl: 'user/session/face.jpg',
      })
    );
    expect(mocks.markSessionFailed).toHaveBeenCalled();
    expect(mocks.runPersonalColorAxis).not.toHaveBeenCalled();
  });

  it('attach 응답 실패는 Storage rollback 뒤 DB 포인터도 멱등하게 비운다', async () => {
    const uploaded = { faceImageUrl: 'user/session/face.jpg', bodyImageUrl: null };
    const attachError = new Error('attach response lost');
    mocks.uploadSessionImages.mockResolvedValueOnce(uploaded);
    mocks.attachSessionImagePointers.mockRejectedValueOnce(attachError);
    mocks.rollbackUploadedSessionImages.mockRejectedValueOnce(
      new ImageStorageOperationError('pointer_attach', attachError)
    );

    await runIntegratedAnalysis(
      baseInput({
        questionnaire: { ...baseInput().questionnaire, imageStorageConsent: true },
      }),
      USER
    );

    expect(mocks.rollbackUploadedSessionImages).toHaveBeenCalledWith(
      uploaded,
      attachError,
      'pointer_attach'
    );
    expect(mocks.clearSessionImagePointers).toHaveBeenCalledWith(expect.any(String));
    expect(mocks.recordSessionImageStorageFailure).toHaveBeenCalledWith(
      expect.objectContaining({ failure: 'pointer_attach_failed' })
    );
  });

  it('attach 보상 뒤 DB 포인터 clear 실패도 cleanup-unconfirmed fatal이다', async () => {
    const uploaded = { faceImageUrl: 'user/session/face.jpg', bodyImageUrl: null };
    const attachError = new Error('attach response lost');
    mocks.uploadSessionImages.mockResolvedValueOnce(uploaded);
    mocks.attachSessionImagePointers.mockRejectedValueOnce(attachError);
    mocks.rollbackUploadedSessionImages.mockRejectedValueOnce(
      new ImageStorageOperationError('pointer_attach', attachError)
    );
    mocks.clearSessionImagePointers.mockRejectedValueOnce(new Error('pointer clear denied'));

    await expect(
      runIntegratedAnalysis(
        baseInput({
          questionnaire: { ...baseInput().questionnaire, imageStorageConsent: true },
        }),
        USER
      )
    ).rejects.toBeInstanceOf(ImageStorageRollbackError);

    expect(mocks.recordSessionImageCleanupPending).toHaveBeenCalledWith(
      expect.objectContaining({ faceImageUrl: 'user/session/face.jpg' })
    );
  });
});

describe('runIntegratedAnalysis — route-wide 절대 deadline', () => {
  it.each([
    ['full 5축', baseInput()],
    ['단일 축 재분석', baseInput({ mode: 'update', axes: ['personal_color'] })],
    ['makeup-only 재분석', baseInput({ mode: 'update', axes: ['makeup'] })],
  ])('%s 조합도 하위 작업이 멈추면 부모 상한 전에 실패 세션을 finalize한다', async (_, input) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    const never = () => new Promise<never>(() => {});
    mocks.runPersonalColorAxis.mockImplementation(never);
    mocks.runSkinAxis.mockImplementation(never);
    mocks.runBodyAxis.mockImplementation(never);
    mocks.runHairAxis.mockImplementation(never);
    mocks.runMakeupComposer.mockImplementation(never);
    const deadline = createExecutionDeadline(12_000);

    const promise = runIntegratedAnalysis(input, USER, undefined, deadline);
    await vi.advanceTimersByTimeAsync(8_000);
    const result = await promise;

    expect(result.status).toBe('failed');
    expect(mocks.finalizeSession).toHaveBeenCalledTimes(1);
    expect(performance.now()).toBeLessThan(12_000);
    deadline.clear();
  });
});
