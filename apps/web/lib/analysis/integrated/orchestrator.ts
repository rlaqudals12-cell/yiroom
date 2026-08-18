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

import { AXIS_CODES } from './types';
import type {
  AxisCode,
  AxisResult,
  IntegratedAnalysisInput,
  CaptureConditions,
  IntegratedAnalysisResult,
  SessionStatus,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from './types';
import {
  createSession,
  finalizeSession,
  markSessionFailed,
  type FinalizeSessionInput,
} from './internal/session-store';
import {
  runPersonalColorAxis,
  runSkinAxis,
  runBodyAxis,
  runHairAxis,
} from './internal/axis-adapters';
import { runMakeupComposer } from './internal/makeup-composer';
import {
  toBodyAxisData,
  toHairAxisData,
  toMakeupAxisData,
  toPersonalColorAxisData,
  toSkinAxisData,
} from './internal/profile-fallback';
import {
  fetchIntegratedProfileSnapshot,
  type AxisRecord,
  type IntegratedProfileSnapshot,
} from './profile-snapshot';
import { uploadSessionImages } from './internal/storage-uploader';
import { composePersona } from './internal/persona-composer';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { withGamification } from '@/lib/api/analysis-helpers/gamification';
import { addXp } from '@/lib/gamification';
import {
  DeadlineExceededError,
  reserveExecutionDeadline,
  withDeadline,
  type ExecutionDeadline,
} from '@/lib/utils/timeout';

// ADR-109 Phase 2: 통합 경로 게이미피케이션 보존 (개별 route와 동등, 통합은 그간 누락).
const XP_ANALYSIS_COMPLETE = 10;
// 배지가 있는 축만 매핑 (헤어/메이크업은 분석 배지 없음 → XP만). AxisCode(언더스코어) → 배지 타입(하이픈).
const AXIS_BADGE_TYPE: Partial<Record<AxisCode, 'personal-color' | 'skin' | 'body'>> = {
  personal_color: 'personal-color',
  skin: 'skin',
  body: 'body',
};

// 선택 재분석(update)에서 제외된 축의 센티널 결과. 집계·저장·게이미피케이션에서 제외됨 (ADR-109 cadence locking).
const SKIPPED_AXIS = {
  success: false,
  error: {
    code: 'SKIPPED' as const,
    message: 'axis not selected for this update session',
    userMessage: '이번 재분석에서 제외된 축이에요.',
    retryable: false,
  },
} satisfies AxisResult<never>;

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
      code: settled.reason instanceof DeadlineExceededError ? 'AI_TIMEOUT' : 'UNKNOWN',
      message: `${axisName} rejected: ${String(settled.reason)}`,
      userMessage: `${axisName} 분석 중 예상치 못한 오류가 발생했어요.`,
      retryable: true,
    },
  };
}

/** finalize 재시도 간격 (짧은 순간 장애 흡수용 — 함수 예산을 먹지 않는 범위) */
const FINALIZE_RETRY_DELAY_MS = 500;
/** 4축·snapshot 뒤 M-1/persona/finalize에 남겨둘 시간. */
const AXIS_TAIL_RESERVE_MS = 6_000;
/** M-1 뒤 persona/finalize에 남겨둘 시간. */
const MAKEUP_TAIL_RESERVE_MS = 5_000;
/** persona 뒤 finalize에 남겨둘 시간. */
const FINALIZE_RESERVE_MS = 1_500;
/** 최종 응답 직렬화·전송 여유. */
const RESPONSE_RESERVE_MS = 500;

async function awaitIntegratedStage<T>(
  promise: PromiseLike<T>,
  deadline: ExecutionDeadline | undefined,
  message: string
): Promise<T> {
  return deadline ? withDeadline(promise, deadline, message) : Promise.resolve(promise);
}

/**
 * 세션 finalize 실패 (축 결과는 이미 저장됨).
 *
 * 별도 타입인 이유: 이 실패는 "분석 실패"가 아니라 "기록 미완"이다.
 * 세션을 failed로 낙인찍으면 저장된 축 결과가 실패로 위장되므로, 상위 catch가
 * markSessionFailed를 건너뛰도록 구분한다(세션은 pending으로 남아 복구 대상이 된다).
 */
export class SessionFinalizeError extends Error {
  constructor(
    readonly sessionId: string,
    readonly cause: unknown
  ) {
    super(`[Integrated] finalize failed for session ${sessionId}: ${String(cause)}`);
    this.name = 'SessionFinalizeError';
  }
}

/**
 * finalize를 일관성 경계로 취급 — 1회 재시도, 그래도 실패면 오류로 전파.
 *
 * 왜: 예전엔 finalize 실패를 삼키고 성공을 반환했다. 그러면 세션 행은 pending인데
 * 클라이언트는 "완료"로 알고 복구 마커를 지워, 사용자가 결과로 돌아갈 길이 사라졌다
 * (축 결과는 DB에 있는데 아무도 못 찾는 상태). 실패는 실패로 알린다.
 */
async function finalizeSessionWithRetry(
  input: FinalizeSessionInput,
  deadline?: ExecutionDeadline
): Promise<void> {
  try {
    await awaitIntegratedStage(
      finalizeSession(input),
      deadline,
      '[Integrated] finalize deadline exceeded'
    );
    return;
  } catch (firstError) {
    console.error('[Integrated] finalize failed, retrying once:', firstError);
  }

  await awaitIntegratedStage(
    new Promise((resolve) => setTimeout(resolve, FINALIZE_RETRY_DELAY_MS)),
    deadline,
    '[Integrated] finalize retry deadline exceeded'
  );

  try {
    await awaitIntegratedStage(
      finalizeSession(input),
      deadline,
      '[Integrated] finalize retry deadline exceeded'
    );
  } catch (retryError) {
    throw new SessionFinalizeError(input.sessionId, retryError);
  }
}

/**
 * M-1 composer 입력 해석 — 이번 세션에서 재실행하지 않은 축은 프로필 최신값을 승계.
 *
 * 왜: M-1은 PC+S 결과의 조합이라, 메이크업만 다시 분석하면 두 축이 SKIPPED 센티널로
 * 들어와 항상 REQUIRES_PC_AND_S로 실패했다("메이크업만 재분석"이 원천 불가능).
 * 실측된 본인 최신 진단만 승계하며, 그 진단이 Mock이었으면 폴백 표시도 함께 승계한다.
 */
function resolveSnapshotAxis<T>(
  isSelected: boolean,
  liveResult: AxisResult<T>,
  snapshot: IntegratedProfileSnapshot | null,
  axis: AxisCode,
  mapper: (record: AxisRecord) => T | null
): AxisResult<T> {
  if (isSelected) return liveResult;
  const record = snapshot?.axes[axis] ?? null;
  const provenance = snapshot?.provenance[axis] ?? null;
  if (!record || !provenance) return liveResult;
  const data = mapper(record);
  // 핵심 판정이 비어 있는 손상/비호환 레코드를 성공 축으로 지어내지 않는다.
  if (!data) return liveResult;
  return {
    success: true,
    usedFallback: provenance.fallbackState === 'used',
    fallbackState: provenance.fallbackState,
    data,
  };
}

/**
 * partial 재분석 persona는 새 축과 모든 승계 축의 한 시점 스냅샷이 완전할 때만 만든다.
 * 미선택 축 조회 실패를 "축 없음"으로 바꾸면 축소 persona가 정상 갱신처럼 저장된다.
 */
function hasReliablePersonaSnapshot(
  isUpdate: boolean,
  selected: Set<AxisCode>,
  snapshot: IntegratedProfileSnapshot | null
): boolean {
  if (!isUpdate) return true;
  const inheritedAxes = AXIS_CODES.filter((axis) => !selected.has(axis));
  if (inheritedAxes.length === 0) return true;
  if (!snapshot) return false;
  return inheritedAxes.every((axis) => !snapshot.axesFetchFailed.includes(axis));
}

/**
 * 세션을 failed로 기록 — 단, finalize 실패는 예외.
 *
 * finalize 실패는 "분석 실패"가 아니라 "기록 미완"이다. 저장된 축 결과를 failed로
 * 위장하지 않고 pending으로 남겨야 복구(상관 ID 조회)가 정직하게 동작한다.
 */
async function markFailedUnlessFinalizeError(
  sessionId: string,
  error: unknown,
  deadline?: ExecutionDeadline
): Promise<void> {
  if (
    error instanceof SessionFinalizeError ||
    error instanceof DeadlineExceededError ||
    deadline?.expired()
  ) {
    return;
  }
  try {
    await awaitIntegratedStage(
      markSessionFailed(sessionId, ['personal_color', 'skin', 'body', 'hair', 'makeup']),
      deadline,
      '[Integrated] failed-state save deadline exceeded'
    );
  } catch (markError) {
    console.error('[Integrated] failed-state save skipped:', markError);
  }
}

/**
 * M-1 composer 실행 (PC+S 의존, 얼굴형은 H에서 승계).
 *
 * update에서 makeup 미선택이거나 skipMakeup이면 실행하지 않는다.
 * 이번에 재실행하지 않은 PC·S·H는 프로필 최신 진단을 승계한다 — 승계할 진단이 없으면
 * (= 단 한 번도 진단하지 않음) 센티널이 남아 composer가 REQUIRES_PC_AND_S로 정직하게 실패한다.
 */
async function runMakeupAxis(params: {
  sessionId: string;
  clerkUserId: string;
  selected: Set<AxisCode>;
  skipMakeup: boolean;
  live: {
    pc: AxisResult<PersonalColorAxisData>;
    skin: AxisResult<SkinAxisData>;
    hair: AxisResult<HairAxisData>;
  };
  deadline?: ExecutionDeadline;
}): Promise<AxisResult<MakeupAxisData>> {
  const { sessionId, clerkUserId, selected, skipMakeup, live, deadline } = params;
  if (!selected.has('makeup') || skipMakeup) return SKIPPED_AXIS;

  return runMakeupComposer(sessionId, clerkUserId, live.pc, live.skin, live.hair, deadline);
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
  clerkUserId: string,
  capture?: CaptureConditions,
  deadline?: ExecutionDeadline
): Promise<IntegratedAnalysisResult> {
  const selected: Set<AxisCode> =
    input.mode === 'update' && input.axes && input.axes.length > 0
      ? new Set(input.axes)
      : new Set<AxisCode>(['personal_color', 'skin', 'body', 'hair', 'makeup']);

  const axesDeadline = deadline
    ? reserveExecutionDeadline(deadline, AXIS_TAIL_RESERVE_MS)
    : undefined;
  const makeupDeadline = deadline
    ? reserveExecutionDeadline(deadline, MAKEUP_TAIL_RESERVE_MS)
    : undefined;
  const personaDeadline = deadline
    ? reserveExecutionDeadline(deadline, FINALIZE_RESERVE_MS)
    : undefined;
  const finalizeDeadline = deadline
    ? reserveExecutionDeadline(deadline, RESPONSE_RESERVE_MS)
    : undefined;

  // 왜: Storage 경로에 세션 ID가 필요하므로 업로드 전에 먼저 생성
  const sessionId = crypto.randomUUID();

  // 1. 이미지 Storage 업로드 (얼굴 필수, 전신 선택)
  let uploadedUrls: { faceImageUrl: string; bodyImageUrl: string | null };
  try {
    uploadedUrls = await awaitIntegratedStage(
      uploadSessionImages(
        sessionId,
        clerkUserId,
        input.faceImageBase64,
        input.bodyImageBase64 ?? null,
        axesDeadline
      ),
      axesDeadline,
      '[Integrated] image upload deadline exceeded'
    );
  } catch (uploadError) {
    // 왜: Storage 업로드 실패는 복구 불가 — 세션을 만들지 않고 throw
    console.error('[Integrated] image upload failed:', uploadError);
    throw uploadError instanceof Error ? uploadError : new Error('이미지 업로드에 실패했어요.');
  }

  // 2. 세션 생성 (업로드된 Storage 경로로)
  const session = await awaitIntegratedStage(
    createSession({
      id: sessionId,
      clerkUserId,
      faceImageUrl: uploadedUrls.faceImageUrl,
      bodyImageUrl: uploadedUrls.bodyImageUrl,
      questionnaire: input.questionnaire as unknown as Record<string, unknown>,
      // 이탈 복구용 상관 ID — 클라이언트가 보냈을 때만 (구 클라이언트는 미전송)
      ...(input.clientRequestId ? { clientRequestId: input.clientRequestId } : {}),
    }),
    axesDeadline,
    '[Integrated] session creation deadline exceeded'
  );

  // update persona와 M-1이 서로 다른 "최신값"을 읽지 않도록 세션 생성 시점 스냅샷을 1회만 잡는다.
  // 축 AI와 병렬로 조회하되, cutoff는 session.created_at이라 이후 결과가 과거값으로 끼어들지 않는다.
  const profileSnapshotPromise: Promise<IntegratedProfileSnapshot | null> =
    input.mode === 'update'
      ? awaitIntegratedStage(
          fetchIntegratedProfileSnapshot(createServiceRoleClient(), {
            sessionId,
            clerkUserId,
            sessionUsedFallback: session.used_fallback,
            sessionCreatedAt: session.created_at,
          }),
          axesDeadline,
          '[Integrated] profile snapshot deadline exceeded'
        ).catch((error) => {
          console.error('[Integrated] profile snapshot fetch failed:', error);
          return null;
        })
      : Promise.resolve(null);

  try {
    // 2. 선택 축만 병렬 실행 (제외 축은 SKIPPED 센티널 — DB 저장·집계 안 함)
    const [pcSettled, skinSettled, bodySettled, hairSettled] = await Promise.allSettled([
      selected.has('personal_color')
        ? awaitIntegratedStage(
            runPersonalColorAxis(sessionId, clerkUserId, input, capture, axesDeadline),
            axesDeadline,
            '[Integrated personal color] axis deadline exceeded'
          )
        : Promise.resolve<AxisResult<PersonalColorAxisData>>(SKIPPED_AXIS),
      selected.has('skin')
        ? awaitIntegratedStage(
            runSkinAxis(sessionId, clerkUserId, input, capture, axesDeadline),
            axesDeadline,
            '[Integrated skin] axis deadline exceeded'
          )
        : Promise.resolve<AxisResult<SkinAxisData>>(SKIPPED_AXIS),
      selected.has('body')
        ? awaitIntegratedStage(
            runBodyAxis(sessionId, clerkUserId, input, axesDeadline),
            axesDeadline,
            '[Integrated body] axis deadline exceeded'
          )
        : Promise.resolve<AxisResult<BodyAxisData>>(SKIPPED_AXIS),
      selected.has('hair')
        ? awaitIntegratedStage(
            runHairAxis(sessionId, clerkUserId, input, axesDeadline),
            axesDeadline,
            '[Integrated hair] axis deadline exceeded'
          )
        : Promise.resolve<AxisResult<HairAxisData>>(SKIPPED_AXIS),
    ]);

    const pc = settledToAxisResult(pcSettled, '퍼스널컬러');
    const skin = settledToAxisResult(skinSettled, '피부');
    const body = settledToAxisResult(bodySettled, '체형');
    const hair = settledToAxisResult(hairSettled, '헤어');

    const profileSnapshot = await profileSnapshotPromise;
    const resolvedPc = resolveSnapshotAxis(
      selected.has('personal_color'),
      pc,
      profileSnapshot,
      'personal_color',
      toPersonalColorAxisData
    );
    const resolvedSkin = resolveSnapshotAxis(
      selected.has('skin'),
      skin,
      profileSnapshot,
      'skin',
      toSkinAxisData
    );
    const resolvedBody = resolveSnapshotAxis(
      selected.has('body'),
      body,
      profileSnapshot,
      'body',
      toBodyAxisData
    );
    const resolvedHair = resolveSnapshotAxis(
      selected.has('hair'),
      hair,
      profileSnapshot,
      'hair',
      toHairAxisData
    );

    // 3. M-1 composer (상세는 runMakeupAxis 주석 참조)
    let makeup: AxisResult<MakeupAxisData>;
    try {
      makeup = await awaitIntegratedStage(
        runMakeupAxis({
          sessionId,
          clerkUserId,
          selected,
          skipMakeup: input.options.skipMakeup,
          live: { pc: resolvedPc, skin: resolvedSkin, hair: resolvedHair },
          deadline: makeupDeadline,
        }),
        makeupDeadline,
        '[Integrated makeup] deadline exceeded'
      );
    } catch (makeupError) {
      if (!(makeupError instanceof DeadlineExceededError)) throw makeupError;
      makeup = {
        success: false,
        error: {
          code: 'AI_TIMEOUT',
          message: makeupError.message,
          userMessage: '메이크업 추천 처리 시간이 초과되었어요.',
          retryable: true,
        },
      };
    }
    const resolvedMakeup = resolveSnapshotAxis(
      selected.has('makeup'),
      makeup,
      profileSnapshot,
      'makeup',
      toMakeupAxisData
    );

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
      // update에서 제외된 축은 집계 제외 (실패 아님 — 이번 세션에서 미변경, 프로필 최신값 유지)
      if (!selected.has(code)) continue;
      if (result.success) {
        axesCompleted.push(code);
        if (result.usedFallback) usedFallback.push(code);
      } else {
        axesFailed.push(code);
      }
    }

    const status = determineStatus(axesCompleted, axesFailed);
    const personaSnapshotIsReliable = hasReliablePersonaSnapshot(
      input.mode === 'update',
      selected,
      profileSnapshot
    );

    // 5. 나 프로필 합성 (ADR-104 체크리스트 #1) — finalize 전에 생성해서 DB에 함께 저장
    // 왜: Gemini 호출 실패해도 null로 반환되고, orchestrator는 계속 진행
    let persona: Awaited<ReturnType<typeof composePersona>> = null;
    if (axesCompleted.length > 0 && personaSnapshotIsReliable) {
      try {
        persona = await awaitIntegratedStage(
          composePersona(
            {
              personalColor: resolvedPc,
              skin: resolvedSkin,
              body: resolvedBody,
              hair: resolvedHair,
              makeup: resolvedMakeup,
            },
            // locale 전달 → AI 내러티브가 사용자 언어로 생성 (기본 'ko', 회귀 0)
            input.options.locale,
            personaDeadline
          ),
          personaDeadline,
          '[Integrated persona] deadline exceeded'
        );
      } catch (personaError) {
        // composer 자체도 Mock 폴백하지만, 경계 밖 예외/중단까지 세션 finalize를 막지 않는다.
        console.error('[Integrated] persona composition skipped:', personaError);
      }
    } else if (axesCompleted.length > 0) {
      console.error(
        '[Integrated] persona composition skipped: inherited profile snapshot is incomplete'
      );
    }

    // 6. 세션 finalize (persona 포함) — 일관성 경계. 실패하면 성공을 반환하지 않는다.
    await finalizeSessionWithRetry(
      {
        sessionId,
        status,
        axesCompleted,
        axesFailed,
        usedFallback,
        persona,
      },
      finalizeDeadline
    );

    // ADR-109 Phase 2: 완료 축별 게이미피케이션 부여 (개별 분석과 동등 — 통합 경로 누락 보존·수정).
    // 배지 축(PC/피부/체형)은 XP+배지+전체배지, 헤어/메이크업은 XP만. 실패해도 결과 반환엔 영향 없음.
    try {
      const gamiSupabase = createServiceRoleClient();
      for (const code of axesCompleted) {
        const badgeType = AXIS_BADGE_TYPE[code];
        if (badgeType) {
          await awaitIntegratedStage(
            withGamification(gamiSupabase, clerkUserId, badgeType),
            finalizeDeadline,
            '[Integrated] gamification deadline exceeded'
          );
        } else {
          await awaitIntegratedStage(
            addXp(gamiSupabase, clerkUserId, XP_ANALYSIS_COMPLETE),
            finalizeDeadline,
            '[Integrated] gamification deadline exceeded'
          );
        }
      }
    } catch (gamificationError) {
      console.error('[Integrated] Gamification error:', gamificationError);
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
    await markFailedUnlessFinalizeError(sessionId, orchestratorError, deadline);
    throw orchestratorError;
  }
}
