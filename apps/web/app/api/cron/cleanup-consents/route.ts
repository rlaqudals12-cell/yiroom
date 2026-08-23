/**
 * Cron GDPR 동의 만료 정리 API
 * @description 만료된 이미지 저장 동의 자동 정리 (GDPR/PIPA 준수)
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-consents",
 *     "schedule": "0 18 * * *"  // 매일 03:00 KST (UTC 18:00)
 *   }]
 * }
 *
 * 처리 로직:
 * 1. retention_until이 지난 동의 레코드 조회
 * 2. 각 레코드의 이미지 스토리지에서 삭제
 * 3. 동의 레코드 soft delete (consent_given = false)
 * 4. 통합 분석은 세션 created_at 기준 1년 만료 원본을 명시 경로로 파기
 * 5. 처리 결과 로깅
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  clearAnalysisImagePointers,
  IMAGE_CONSENT_STORAGE_BUCKETS,
  type ImageStorageAnalysisType,
  purgeStoragePrefix,
  purgeUserStorageBuckets,
} from '@/lib/api/storage-purge';

interface ExpiredConsent {
  id: string;
  clerk_user_id: string;
  analysis_type: string;
  retention_until: string | null;
  withdrawal_at: string | null;
  updated_at: string;
  cleanup_reconciled_at?: string | null;
}

interface ExpiredIntegratedSession {
  id: string;
  clerk_user_id: string;
  face_image_url: string | null;
  body_image_url: string | null;
  questionnaire: Record<string, unknown> | null;
  created_at: string;
  image_cleanup_pending?: boolean;
  status: 'pending' | 'partial' | 'completed' | 'failed';
}

interface CleanupResult {
  processed: number;
  deletedImages: number;
  total: number;
  errors?: string[];
  batches?: number;
  remaining?: boolean;
  remainingReason?: 'retryable_failures' | 'time_budget' | 'stalled';
  staleSkipped?: number;
}

const CLEANUP_BATCH_SIZE = 100;
// hard-delete-users의 선행 병합 작업이므로 일반/통합 큐 각각 10초만 사용해 후속 파기 시간을 남긴다.
const CLEANUP_TIME_BUDGET_MS = 10_000;
// 실행 중 세션과 Vercel 지연 응답을 오인 파기하지 않되, 강제 종료 고아는 다음 날 회수한다.
const ABANDONED_SESSION_GRACE_MS = 24 * 60 * 60 * 1000;
// 진행 중 업로드가 모두 끝난 뒤 재검사하도록 통합 세션과 같은 24시간 유예를 둔다.
const IMAGE_CONSENT_RECONCILIATION_GRACE_MS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLERK_USER_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/** DB 포인터는 신뢰하지 않고, 검증된 행 소유자와 UUID로만 Storage prefix를 만든다. */
function buildIntegratedStoragePrefix(session: ExpiredIntegratedSession): string | null {
  if (
    !UUID_PATTERN.test(session.id) ||
    !CLERK_USER_ID_PATTERN.test(session.clerk_user_id) ||
    session.clerk_user_id.length > 255
  ) {
    return null;
  }
  return `${session.clerk_user_id}/${session.id}`;
}

/**
 * 통합 분석은 회차별 questionnaire의 `imageStorageConsent`와 세션 created_at를
 * 동의 여부·시각 정본으로 삼는다. 최대 1년이 지난 동의 저장분만 오래된 순서로
 * 정리한다. 100건은 페이지 크기일 뿐 총량 상한이 아니며, 실행 예산 안에서 반복 배출한다.
 * rollback 실패 표식은 1년을 기다리지 않고 즉시 같은 재시도 큐에서 처리한다.
 */
async function cleanupExpiredIntegratedSessions(
  supabase: ReturnType<typeof createServiceRoleClient>,
  now: string
): Promise<CleanupResult> {
  const retentionCutoff = new Date(now);
  retentionCutoff.setFullYear(retentionCutoff.getFullYear() - 1);
  const abandonedCutoff = new Date(new Date(now).getTime() - ABANDONED_SESSION_GRACE_MS);

  const deadlineAt = performance.now() + CLEANUP_TIME_BUDGET_MS;
  const seen = new Set<string>();
  const failed = new Set<string>();
  let cursor: { createdAt: string; id: string } | null = null;
  const result: CleanupResult = {
    processed: 0,
    deletedImages: 0,
    total: 0,
    errors: [],
    batches: 0,
    remaining: false,
  };

  while (performance.now() < deadlineAt) {
    let query = supabase
      .from('integrated_analysis_sessions')
      .select(
        'id, clerk_user_id, face_image_url, body_image_url, questionnaire, created_at, image_cleanup_pending, status'
      )
      .or(
        `image_cleanup_pending.eq.true,questionnaire->>_imageStorageCleanupPending.eq.true,and(questionnaire->>imageStorageConsent.eq.true,created_at.lt.${retentionCutoff.toISOString()}),and(questionnaire->>imageStorageConsent.eq.true,status.in.(failed,pending),created_at.lt.${abandonedCutoff.toISOString()})`
      )
      // 성공 마커가 있으면 포인터가 null인 세션을 다음 실행에서 다시 매칭하지 않는다.
      .is('questionnaire->>_imageStoragePurgedAt', null);
    if (cursor) {
      query = query.or(
        `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`
      );
    }
    const { data, error } = await query
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(CLEANUP_BATCH_SIZE);

    if (error) {
      throw new Error(`[Cron Cleanup] Failed to fetch integrated sessions: ${error.message}`);
    }
    result.batches!++;
    const sessions = (data ?? []) as ExpiredIntegratedSession[];
    const lastSession = sessions.at(-1);
    if (lastSession) cursor = { createdAt: lastSession.created_at, id: lastSession.id };

    for (const session of sessions) {
      if (seen.has(session.id)) continue;
      seen.add(session.id);

      const storagePrefix = buildIntegratedStoragePrefix(session);
      if (!storagePrefix) {
        failed.add(session.id);
        result.errors!.push(`Integrated storage ownership invalid for session ${session.id}`);
        continue;
      }
      const expectedObjectPrefix = `${storagePrefix}/`;
      const hasUntrustedPointer = [session.face_image_url, session.body_image_url].some(
        (path) => typeof path === 'string' && !path.startsWith(expectedObjectPrefix)
      );
      if (hasUntrustedPointer) {
        // 오염된 포인터 자체는 절대 remove에 넘기지 않고 canonical prefix만 파기한다.
        console.error('[Cron Cleanup audit] integrated pointer ownership mismatch', {
          sessionId: session.id,
        });
      }
      let deletedForSession = 0;
      try {
        // DB 포인터 기록 전에 요청이 죽어도 결정론적 세션 prefix를 재귀 탐색해 원본을 회수한다.
        deletedForSession = await purgeStoragePrefix(
          supabase,
          'integrated-sessions',
          storagePrefix
        );
      } catch {
        failed.add(session.id);
        result.errors!.push(`Integrated storage delete failed for session ${session.id}`);
        continue;
      }

      const questionnaire =
        session.questionnaire && typeof session.questionnaire === 'object'
          ? session.questionnaire
          : {};
      const wasCleanupPending = questionnaire._imageStorageCleanupPending === true;
      const wasAbandoned =
        (session.status === 'failed' || session.status === 'pending') &&
        new Date(session.created_at).getTime() < abandonedCutoff.getTime();
      const { error: pointerError } = await supabase
        .from('integrated_analysis_sessions')
        .update({
          face_image_url: null,
          body_image_url: null,
          image_cleanup_pending: false,
          questionnaire: {
            ...questionnaire,
            _imageStoragePurgedAt: now,
            ...(wasCleanupPending
              ? {
                  _imageStorageCleanupPending: false,
                  _imageStorageFailure: 'cleanup_recovered',
                  _imageStorageCleanupRecoveredAt: now,
                }
              : {}),
            ...(wasAbandoned
              ? {
                  _imageStorageFailure: 'abandoned_session_recovered',
                  _imageStorageAbandonedRecoveredAt: now,
                }
              : {}),
          },
        })
        .eq('id', session.id);

      if (pointerError) {
        failed.add(session.id);
        result.errors!.push(`Integrated pointer cleanup failed for session ${session.id}`);
        continue;
      }

      result.deletedImages += deletedForSession;
      result.processed++;
    }

    if (sessions.length < CLEANUP_BATCH_SIZE) break;
  }

  result.total = seen.size;
  if (performance.now() >= deadlineAt) {
    result.remaining = true;
    result.remainingReason = 'time_budget';
  } else if (failed.size > 0) {
    result.remaining = true;
    result.remainingReason = 'retryable_failures';
  }

  if (result.remaining) {
    console.error('[Cron Cleanup audit] integrated image cleanup backlog remains', {
      processed: result.processed,
      failed: failed.size,
      batches: result.batches,
      reason: result.remainingReason,
    });
  }

  return result;
}

/** 만료 또는 철회 후 파기 대기 중인 일반 축 동의를 시간 예산 안에서 반복 배출한다. */
async function cleanupExpiredImageConsents(
  supabase: ReturnType<typeof createServiceRoleClient>,
  now: string
): Promise<CleanupResult> {
  const deadlineAt = performance.now() + CLEANUP_TIME_BUDGET_MS;
  const seen = new Set<string>();
  const failed = new Set<string>();
  let cursor: { retentionUntil: string; id: string } | null = null;
  const result: CleanupResult = {
    processed: 0,
    deletedImages: 0,
    total: 0,
    errors: [],
    batches: 0,
    remaining: false,
    staleSkipped: 0,
  };

  while (performance.now() < deadlineAt) {
    let query = supabase
      .from('image_consents')
      .select('id, clerk_user_id, analysis_type, retention_until, withdrawal_at, updated_at')
      .or(
        `and(consent_given.eq.true,retention_until.lt.${now}),and(consent_given.eq.false,withdrawal_at.not.is.null,retention_until.not.is.null)`
      );
    if (cursor) {
      query = query.or(
        `retention_until.gt.${cursor.retentionUntil},and(retention_until.eq.${cursor.retentionUntil},id.gt.${cursor.id})`
      );
    }
    const { data, error } = await query
      .order('retention_until', { ascending: true })
      .order('id', { ascending: true })
      .limit(CLEANUP_BATCH_SIZE);

    if (error) {
      throw new Error(`[Cron Cleanup] Failed to fetch expired consents: ${error.message}`);
    }
    result.batches!++;
    const consents = (data ?? []) as ExpiredConsent[];
    const lastConsent = consents.at(-1);
    if (lastConsent) {
      if (!lastConsent.retention_until) {
        result.remaining = true;
        result.remainingReason = 'stalled';
        break;
      }
      cursor = { retentionUntil: lastConsent.retention_until, id: lastConsent.id };
    }

    for (const consent of consents) {
      if (seen.has(consent.id)) continue;
      seen.add(consent.id);

      try {
        if (!(consent.analysis_type in IMAGE_CONSENT_STORAGE_BUCKETS)) {
          failed.add(consent.id);
          result.errors!.push(`Unsupported analysis type ${consent.analysis_type}`);
          continue;
        }
        const analysisType = consent.analysis_type as ImageStorageAnalysisType;
        const bucketName = IMAGE_CONSENT_STORAGE_BUCKETS[analysisType];

        // 파기 전에 CAS로 행을 소유하고 저장 게이트를 닫는다. 0행이면 재동의/다른 cron이
        // 먼저 상태를 바꾼 것이므로 새 업로드를 건드리지 않고 건너뛴다.
        const claimWithdrawalAt = consent.withdrawal_at ?? now;
        const { data: claimedRows, error: claimError } = await supabase
          .from('image_consents')
          .update({
            consent_given: false,
            withdrawal_at: claimWithdrawalAt,
          })
          .eq('id', consent.id)
          .eq('updated_at', consent.updated_at)
          .select('id, updated_at, withdrawal_at');

        if (claimError) {
          failed.add(consent.id);
          result.errors!.push(`Failed to claim consent ${consent.id}`);
          continue;
        }
        const claimed = claimedRows?.[0] as
          | { id: string; updated_at: string; withdrawal_at: string }
          | undefined;
        if (!claimed) {
          result.staleSkipped!++;
          continue;
        }

        const purge = await purgeUserStorageBuckets(supabase, consent.clerk_user_id, [bucketName]);

        if (purge.failedBuckets.length > 0) {
          failed.add(consent.id);
          result.errors!.push(`Storage purge failed for ${consent.analysis_type}`);
          continue;
        }
        result.deletedImages += purge.deleted;

        const pointerCleanup = await clearAnalysisImagePointers(
          supabase,
          consent.clerk_user_id,
          analysisType
        );
        if (!pointerCleanup.cleared) {
          failed.add(consent.id);
          result.errors!.push(`Pointer cleanup failed for ${consent.analysis_type}`);
          continue;
        }

        const { data: finalizedRows, error: updateError } = await supabase
          .from('image_consents')
          .update({
            consent_given: false,
            withdrawal_at: claimWithdrawalAt,
            retention_until: null,
          })
          .eq('id', consent.id)
          .eq('consent_given', false)
          .eq('withdrawal_at', claimWithdrawalAt)
          .eq('updated_at', claimed.updated_at)
          .select('id');

        if (updateError) {
          failed.add(consent.id);
          result.errors!.push(`Failed to update consent ${consent.id}`);
        } else if (!finalizedRows || finalizedRows.length === 0) {
          failed.add(consent.id);
          result.errors!.push(`Consent finalize lost claim ${consent.id}`);
        } else {
          result.processed++;
        }
      } catch {
        failed.add(consent.id);
        result.errors!.push(`Error processing consent ${consent.id}`);
      }
    }

    if (consents.length < CLEANUP_BATCH_SIZE) break;
  }

  result.total = seen.size;
  if (performance.now() >= deadlineAt) {
    result.remaining = true;
    result.remainingReason = 'time_budget';
  } else if (failed.size > 0) {
    result.remaining = true;
    result.remainingReason = 'retryable_failures';
  }

  if (result.remaining) {
    console.error('[Cron Cleanup audit] consent image cleanup backlog remains', {
      processed: result.processed,
      failed: failed.size,
      batches: result.batches,
      reason: result.remainingReason,
    });
  }
  return result;
}

// Vercel Cron 인증 검증
/**
 * DELETE가 끝난 뒤 Storage SDK의 늦은 commit이 생기는 경계를 회수한다.
 * retention_until=NULL 완료 행은 기존 pending 큐와 섞지 않고 withdrawal_at keyset으로 한 번만 순회한다.
 */
async function reconcileCompletedImageConsents(
  supabase: ReturnType<typeof createServiceRoleClient>,
  now: string
): Promise<CleanupResult> {
  const cutoff = new Date(
    new Date(now).getTime() - IMAGE_CONSENT_RECONCILIATION_GRACE_MS
  ).toISOString();
  const deadlineAt = performance.now() + CLEANUP_TIME_BUDGET_MS;
  const seen = new Set<string>();
  const failed = new Set<string>();
  let cursor: { withdrawalAt: string; id: string } | null = null;
  const result: CleanupResult = {
    processed: 0,
    deletedImages: 0,
    total: 0,
    errors: [],
    batches: 0,
    remaining: false,
    staleSkipped: 0,
  };

  while (performance.now() < deadlineAt) {
    let query = supabase
      .from('image_consents')
      .select(
        'id, clerk_user_id, analysis_type, retention_until, withdrawal_at, updated_at, cleanup_reconciled_at'
      )
      .eq('consent_given', false)
      .not('withdrawal_at', 'is', null)
      .is('retention_until', null)
      .is('cleanup_reconciled_at', null)
      .lt('withdrawal_at', cutoff);
    if (cursor) {
      query = query.or(
        `withdrawal_at.gt.${cursor.withdrawalAt},and(withdrawal_at.eq.${cursor.withdrawalAt},id.gt.${cursor.id})`
      );
    }
    const { data, error } = await query
      .order('withdrawal_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(CLEANUP_BATCH_SIZE);

    if (error) {
      throw new Error(`[Cron Cleanup] Failed to fetch reconciliation rows: ${error.message}`);
    }
    result.batches!++;
    const consents = (data ?? []) as ExpiredConsent[];
    const lastConsent = consents.at(-1);
    if (lastConsent?.withdrawal_at) {
      cursor = { withdrawalAt: lastConsent.withdrawal_at, id: lastConsent.id };
    }

    for (const consent of consents) {
      if (seen.has(consent.id)) continue;
      seen.add(consent.id);

      if (!(consent.analysis_type in IMAGE_CONSENT_STORAGE_BUCKETS)) {
        failed.add(consent.id);
        result.errors!.push(`Unsupported reconciliation type ${consent.analysis_type}`);
        continue;
      }

      const analysisType = consent.analysis_type as ImageStorageAnalysisType;
      const bucketName = IMAGE_CONSENT_STORAGE_BUCKETS[analysisType];
      try {
        // retention을 pending으로 바꿔 POST 재동의를 409로 잠근 뒤 purge한다.
        // 중간 실패 시 일반 pending 큐가 다음 cron에서 그대로 재시도한다.
        const { data: claimedRows, error: claimError } = await supabase
          .from('image_consents')
          .update({ retention_until: now, cleanup_reconciled_at: null })
          .eq('id', consent.id)
          .eq('updated_at', consent.updated_at)
          .select('id, updated_at');
        const claimed = claimedRows?.[0] as { id: string; updated_at: string } | undefined;
        if (claimError) {
          failed.add(consent.id);
          result.errors!.push(`Failed to claim reconciliation ${consent.id}`);
          continue;
        }
        if (!claimed) {
          result.staleSkipped!++;
          continue;
        }

        const purge = await purgeUserStorageBuckets(supabase, consent.clerk_user_id, [bucketName]);
        if (purge.failedBuckets.length > 0) {
          failed.add(consent.id);
          result.errors!.push(`Reconciliation storage purge failed for ${consent.analysis_type}`);
          continue;
        }
        result.deletedImages += purge.deleted;

        const pointerCleanup = await clearAnalysisImagePointers(
          supabase,
          consent.clerk_user_id,
          analysisType
        );
        if (!pointerCleanup.cleared) {
          failed.add(consent.id);
          result.errors!.push(`Reconciliation pointer cleanup failed for ${consent.analysis_type}`);
          continue;
        }

        const { data: finalizedRows, error: finalizeError } = await supabase
          .from('image_consents')
          .update({ retention_until: null, cleanup_reconciled_at: now })
          .eq('id', consent.id)
          .eq('updated_at', claimed.updated_at)
          .select('id');
        if (finalizeError || !finalizedRows || finalizedRows.length === 0) {
          failed.add(consent.id);
          result.errors!.push(`Failed to finalize reconciliation ${consent.id}`);
          continue;
        }

        result.processed++;
      } catch {
        failed.add(consent.id);
        result.errors!.push(`Error reconciling consent ${consent.id}`);
      }
    }

    if (consents.length < CLEANUP_BATCH_SIZE) break;
  }

  result.total = seen.size;
  if (performance.now() >= deadlineAt) {
    result.remaining = true;
    result.remainingReason = 'time_budget';
  } else if (failed.size > 0) {
    result.remaining = true;
    result.remainingReason = 'retryable_failures';
  }

  return result;
}

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // 운영에서 secret 미설정은 구성 오류다. 검증 불가능한 x-vercel 헤더를 신뢰하지 않는다.
  return process.env.NODE_ENV === 'development';
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.info('[Cron Cleanup] Starting GDPR consent cleanup...');

  try {
    const supabase = createServiceRoleClient();

    // 1. 일반 축: 만료 + 철회 후 purge-pending 행을 반복 배치로 파기한다.
    const now = new Date().toISOString();
    const result = await cleanupExpiredImageConsents(supabase, now);

    // 24시간 유예가 지난 철회 완료 행은 별도 keyset으로 딱 한 번 재청소한다.
    const reconciliationResult = await reconcileCompletedImageConsents(supabase, now);
    result.processed += reconciliationResult.processed;
    result.deletedImages += reconciliationResult.deletedImages;
    result.total += reconciliationResult.total;
    result.errors!.push(...(reconciliationResult.errors ?? []));

    // 2. 통합 분석: 1년 만료분과 rollback cleanup-pending을 함께 반복 파기한다.
    const integratedResult = await cleanupExpiredIntegratedSessions(supabase, now);
    result.processed += integratedResult.processed;
    result.deletedImages += integratedResult.deletedImages;
    result.total += integratedResult.total;
    result.errors!.push(...(integratedResult.errors ?? []));

    // 3. 기존 합계와 함께 운영 backlog 지표를 반환한다.
    const response = {
      success: true,
      message: 'GDPR cleanup completed',
      processed: result.processed,
      deletedImages: result.deletedImages,
      total: result.total,
      errors: result.errors && result.errors.length > 0 ? result.errors : undefined,
      remaining: Boolean(
        result.remaining || reconciliationResult.remaining || integratedResult.remaining
      ),
      cleanup: {
        imageConsents: {
          batches: result.batches,
          remaining: result.remaining,
          remainingReason: result.remainingReason,
          staleSkipped: result.staleSkipped,
          reconciliation: {
            batches: reconciliationResult.batches,
            remaining: reconciliationResult.remaining,
            remainingReason: reconciliationResult.remainingReason,
            staleSkipped: reconciliationResult.staleSkipped,
          },
        },
        integratedSessions: {
          batches: integratedResult.batches,
          remaining: integratedResult.remaining,
          remainingReason: integratedResult.remainingReason,
        },
      },
      completedAt: new Date().toISOString(),
    };

    console.info('[Cron Cleanup] Result:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Cron Cleanup] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request);
}
