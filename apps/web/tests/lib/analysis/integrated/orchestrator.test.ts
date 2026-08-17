/**
 * 통합 분석 오케스트레이터 테스트
 *
 * 2026-08 외부 리뷰 확정 결함 2건의 회귀 방지:
 * - #1 선택 재분석에서 제외한 축이 M-1 입력에서 사라져 "메이크업만 재분석"이 항상 실패
 * - #2 finalize 실패를 삼키고 성공을 반환 → 세션은 pending인데 클라는 완료로 알고 마커 삭제
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  carryLatestPersonalColor: vi.fn(),
  carryLatestSkin: vi.fn(),
  carryLatestHair: vi.fn(),
}));

vi.mock('@/lib/analysis/integrated/internal/storage-uploader', () => ({
  uploadSessionImages: vi.fn(async () => ({
    faceImageUrl: 'face/path.jpg',
    bodyImageUrl: null,
  })),
}));

vi.mock('@/lib/analysis/integrated/internal/session-store', () => ({
  createSession: mocks.createSession,
  finalizeSession: mocks.finalizeSession,
  markSessionFailed: mocks.markSessionFailed,
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

vi.mock('@/lib/analysis/integrated/internal/profile-fallback', () => ({
  carryLatestPersonalColor: mocks.carryLatestPersonalColor,
  carryLatestSkin: mocks.carryLatestSkin,
  carryLatestHair: mocks.carryLatestHair,
}));

vi.mock('@/lib/analysis/integrated/internal/persona-composer', () => ({
  composePersona: vi.fn(async () => null),
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

const USER = 'user_test_1';

function baseInput(overrides: Partial<IntegratedAnalysisInput> = {}): IntegratedAnalysisInput {
  return {
    faceImageBase64: 'data:image/jpeg;base64,face',
    questionnaire: {
      skin: { selfReportedType: 'unknown', concerns: [] },
      hair: {},
      body: {},
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createSession.mockResolvedValue({ created_at: '2026-08-17T00:00:00.000Z' });
  mocks.finalizeSession.mockResolvedValue({});
  mocks.runPersonalColorAxis.mockResolvedValue(pcOk);
  mocks.runSkinAxis.mockResolvedValue(skinOk);
  mocks.runBodyAxis.mockResolvedValue(bodyOk);
  mocks.runHairAxis.mockResolvedValue(hairOk);
  mocks.runMakeupComposer.mockResolvedValue(makeupOk);
  mocks.carryLatestPersonalColor.mockResolvedValue(null);
  mocks.carryLatestSkin.mockResolvedValue(null);
  mocks.carryLatestHair.mockResolvedValue(null);
});

describe('runIntegratedAnalysis — 선택 재분석 축 승계 (외부 리뷰 #1)', () => {
  it('메이크업만 재분석해도 저장된 최신 PC·S를 승계해 composer가 실행된다', async () => {
    mocks.carryLatestPersonalColor.mockResolvedValue({
      data: { season: 'autumn', tone: 'true-autumn', undertone: 'warm', confidence: 90 },
      usedFallback: false,
    });
    mocks.carryLatestSkin.mockResolvedValue({
      data: { skinType: 'oily', overallScore: 62 },
      usedFallback: false,
    });
    mocks.carryLatestHair.mockResolvedValue({
      data: { faceShape: 'heart' },
      usedFallback: false,
    });

    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['makeup'] }), USER);

    // 제외 축은 실행되지 않는다 (cadence locking 유지)
    expect(mocks.runPersonalColorAxis).not.toHaveBeenCalled();
    expect(mocks.runSkinAxis).not.toHaveBeenCalled();

    expect(mocks.runMakeupComposer).toHaveBeenCalledTimes(1);
    const [, , pcArg, skinArg, hairArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg).toEqual({
      success: true,
      usedFallback: false,
      data: { season: 'autumn', tone: 'true-autumn', undertone: 'warm', confidence: 90 },
    });
    expect(skinArg).toEqual({
      success: true,
      usedFallback: false,
      data: { skinType: 'oily', overallScore: 62 },
    });
    // 얼굴형도 실측 승계 — 재분석할수록 결과가 빈약해지지 않는다
    expect(hairArg).toEqual({
      success: true,
      usedFallback: false,
      data: { faceShape: 'heart' },
    });
  });

  it('승계한 진단이 Mock이었으면 폴백 표시도 함께 승계한다 (정직성)', async () => {
    mocks.carryLatestPersonalColor.mockResolvedValue({
      data: { season: 'winter', tone: 'true-winter', undertone: 'cool', confidence: 40 },
      usedFallback: true,
    });
    mocks.carryLatestSkin.mockResolvedValue({
      data: { skinType: 'normal', overallScore: 70 },
      usedFallback: false,
    });

    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['makeup'] }), USER);

    const [, , pcArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg.usedFallback).toBe(true);
  });

  it('승계할 실측 진단이 없으면 센티널을 유지해 composer가 정직하게 실패한다', async () => {
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

  it('이번에 재실행한 축은 승계하지 않고 실행 결과를 그대로 쓴다', async () => {
    await runIntegratedAnalysis(
      baseInput({ mode: 'update', axes: ['personal_color', 'skin', 'makeup'] }),
      USER
    );

    expect(mocks.carryLatestPersonalColor).not.toHaveBeenCalled();
    expect(mocks.carryLatestSkin).not.toHaveBeenCalled();
    const [, , pcArg, skinArg] = mocks.runMakeupComposer.mock.calls[0];
    expect(pcArg).toBe(pcOk);
    expect(skinArg).toBe(skinOk);
  });

  it('makeup 미선택이면 승계 조회조차 하지 않는다 (불필요한 DB 왕복 없음)', async () => {
    await runIntegratedAnalysis(baseInput({ mode: 'update', axes: ['skin'] }), USER);

    expect(mocks.runMakeupComposer).not.toHaveBeenCalled();
    expect(mocks.carryLatestPersonalColor).not.toHaveBeenCalled();
    expect(mocks.carryLatestHair).not.toHaveBeenCalled();
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
