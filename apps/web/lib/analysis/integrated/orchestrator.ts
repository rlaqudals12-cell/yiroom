/**
 * 통합 분석 오케스트레이터
 *
 * @module lib/analysis/integrated/orchestrator
 * @description
 *   ADR-099 "Promise.allSettled 병렬 + Partial Success" 구현.
 *   4축(PC/S/C/H)을 병렬 실행 → 완료 후 M-1 composer를 조건부 실행.
 *
 * @see docs/adr/ADR-099-integrated-analysis-flow.md §5.2
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §6 ATOM 6
 */

import type {
  AxisCode,
  AxisResult,
  IntegratedAnalysisInput,
  IntegratedAnalysisResult,
  SessionStatus,
} from './types';
import { createSession, finalizeSession, markSessionFailed } from './internal/session-store';
import {
  runPersonalColorAxis,
  runSkinAxis,
  runBodyAxis,
  runHairAxis,
} from './internal/axis-adapters';
import { runMakeupComposer } from './internal/makeup-composer';
import { uploadSessionImages } from './internal/storage-uploader';
import { composePersona } from './internal/persona-composer';

/**
 * Promise.allSettled 결과를 AxisResult로 변환.
 * rejected → UNKNOWN 에러, fulfilled → 그대로.
 */
function settledToAxisResult<T>(
  settled: PromiseSettledResult<AxisResult<T>>,
  axisName: string
): AxisResult<T> {
  if (settled.status === 'fulfilled') {
    return settled.value;
  }
  // 왜: Promise 자체 reject는 adapter에서 처리 못한 예외 — UNKNOWN으로 정규화
  return {
    success: false,
    error: {
      code: 'UNKNOWN',
      message: `${axisName} rejected: ${String(settled.reason)}`,
      userMessage: `${axisName} 분석 중 예상치 못한 오류가 발생했어요.`,
      retryable: true,
    },
  };
}

/**
 * 세션 상태 결정.
 * - 5축 모두 성공 → completed
 * - 1~4축 성공 → partial
 * - 모두 실패 → failed
 */
function determineStatus(
  axesCompleted: AxisCode[],
  axesFailed: AxisCode[]
): Exclude<SessionStatus, 'pending'> {
  if (axesCompleted.length === 0) return 'failed';
  if (axesFailed.length === 0) return 'completed';
  return 'partial';
}

/**
 * 통합 분석 실행 진입점.
 *
 * 흐름:
 * 1. 세션 생성 (pending)
 * 2. PC/S/C/H 4축 병렬 실행 (Promise.allSettled)
 * 3. PC+S 둘 다 성공 시 M-1 composer 실행 (순차, 결과 의존)
 * 4. 세션 finalize (completed/partial/failed)
 * 5. 통합 결과 반환
 *
 * 예외 처리:
 * - 각 축 내부 에러는 adapter에서 AxisResult로 정규화
 * - 세션 생성 자체가 실패하면 throw (복구 불가)
 * - 세션 finalize 실패는 로깅 + markSessionFailed fallback
 */
export async function runIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  clerkUserId: string
): Promise<IntegratedAnalysisResult> {
  // 왜: Storage 경로에 세션 ID가 필요하므로 업로드 전에 먼저 생성
  const sessionId = crypto.randomUUID();

  // 1. 이미지 Storage 업로드 (얼굴 필수, 전신 선택)
  let uploadedUrls: { faceImageUrl: string; bodyImageUrl: string | null };
  try {
    uploadedUrls = await uploadSessionImages(
      sessionId,
      clerkUserId,
      input.faceImageBase64,
      input.bodyImageBase64 ?? null
    );
  } catch (uploadError) {
    // 왜: Storage 업로드 실패는 복구 불가 — 세션을 만들지 않고 throw
    console.error('[Integrated] image upload failed:', uploadError);
    throw uploadError instanceof Error ? uploadError : new Error('이미지 업로드에 실패했어요.');
  }

  // 2. 세션 생성 (업로드된 Storage 경로로)
  const session = await createSession({
    id: sessionId,
    clerkUserId,
    faceImageUrl: uploadedUrls.faceImageUrl,
    bodyImageUrl: uploadedUrls.bodyImageUrl,
    questionnaire: input.questionnaire as unknown as Record<string, unknown>,
  });

  try {
    // 2. 4축 병렬 실행 (Phase F.3: 모든 adapter가 input을 받아 Gemini 호출 가능)
    const [pcSettled, skinSettled, bodySettled, hairSettled] = await Promise.allSettled([
      runPersonalColorAxis(sessionId, clerkUserId, input),
      runSkinAxis(sessionId, clerkUserId, input),
      runBodyAxis(sessionId, clerkUserId, input),
      runHairAxis(sessionId, clerkUserId, input),
    ]);

    const pc = settledToAxisResult(pcSettled, '퍼스널컬러');
    const skin = settledToAxisResult(skinSettled, '피부');
    const body = settledToAxisResult(bodySettled, '체형');
    const hair = settledToAxisResult(hairSettled, '헤어');

    // 3. M-1 composer 실행 (PC+S 의존, skipMakeup 옵션 존중)
    const makeup = input.options.skipMakeup
      ? ({
          success: false,
          error: {
            code: 'REQUIRES_PC_AND_S' as const,
            message: 'skipped by option',
            userMessage: '메이크업 추천이 비활성화됐어요.',
            retryable: false,
          },
        } satisfies AxisResult<never>)
      : await runMakeupComposer(sessionId, clerkUserId, pc, skin);

    // 4. 축 집계
    const axesCompleted: AxisCode[] = [];
    const axesFailed: AxisCode[] = [];
    const usedFallback: AxisCode[] = [];

    const entries: Array<[AxisCode, AxisResult<unknown>]> = [
      ['personal_color', pc],
      ['skin', skin],
      ['body', body],
      ['hair', hair],
      ['makeup', makeup],
    ];

    for (const [code, result] of entries) {
      if (result.success) {
        axesCompleted.push(code);
        if (result.usedFallback) usedFallback.push(code);
      } else {
        axesFailed.push(code);
      }
    }

    const status = determineStatus(axesCompleted, axesFailed);

    // 5. 나 프로필 합성 (ADR-104 체크리스트 #1) — finalize 전에 생성해서 DB에 함께 저장
    // 왜: Gemini 호출 실패해도 null로 반환되고, orchestrator는 계속 진행
    const persona = await composePersona({
      personalColor: pc,
      skin,
      body,
      hair,
      makeup,
    });

    // 6. 세션 finalize (persona 포함)
    try {
      await finalizeSession({
        sessionId,
        status,
        axesCompleted,
        axesFailed,
        usedFallback,
        persona,
      });
    } catch (finalizeError) {
      // 왜: finalize 실패는 치명적이지 않음 — 결과는 이미 각 테이블에 저장됨
      console.error('[Integrated] finalize failed, continuing with result:', finalizeError);
    }

    const now = new Date().toISOString();

    return {
      sessionId,
      status,
      axes: {
        personalColor: pc,
        skin,
        body,
        hair,
        makeup,
      },
      persona,
      axesCompleted,
      axesFailed,
      usedFallback,
      createdAt: session.created_at,
      completedAt: now,
    };
  } catch (orchestratorError) {
    // 왜: 여기 오면 Promise.allSettled 외부의 예외 (createSession은 이미 위에서 처리)
    // 세션을 failed로 마킹하고 에러 전파
    await markSessionFailed(sessionId, ['personal_color', 'skin', 'body', 'hair', 'makeup']);
    throw orchestratorError;
  }
}
