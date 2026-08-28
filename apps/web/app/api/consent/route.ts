import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { checkConsentEligibility, LATEST_CONSENT_VERSION } from '@/lib/consent/version-check';
import {
  clearAnalysisImagePointers,
  IMAGE_CONSENT_STORAGE_BUCKETS,
  purgeUserStorageBuckets,
} from '@/lib/api/storage-purge';

/**
 * 이미지 저장 동의 API
 * SDD-VISUAL-SKIN-REPORT.md §4.3
 */

// 유효한 분석 타입
const VALID_ANALYSIS_TYPES = ['skin', 'body', 'personal-color', 'hair', 'makeup', 'twin'] as const;
type AnalysisType = (typeof VALID_ANALYSIS_TYPES)[number];

/**
 * GET /api/consent?analysisType=skin
 * 동의 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 분석 타입 파라미터
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('analysisType') as AnalysisType | null;

    if (!analysisType || !VALID_ANALYSIS_TYPES.includes(analysisType)) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Service Role로 동의 상태 조회
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('image_consents')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('analysis_type', analysisType)
      .maybeSingle();

    if (error) {
      console.error('[Consent API] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch consent' }, { status: 500 });
    }

    return NextResponse.json({ consent: data });
  } catch (err) {
    console.error('[Consent API] GET exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/consent
 * 동의 저장
 * Body: { analysisType: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Body 파싱
    const body = await request.json();
    const { analysisType } = body as { analysisType: AnalysisType };

    if (!analysisType || !VALID_ANALYSIS_TYPES.includes(analysisType)) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 파기 대기 행을 재동의로 덮으면 cron의 사진 삭제 재시도가 끊긴다.
    const { data: existingConsent, error: existingConsentError } = await supabase
      .from('image_consents')
      .select(
        'id, consent_given, withdrawal_at, retention_until, cleanup_reconciled_at, updated_at'
      )
      .eq('clerk_user_id', userId)
      .eq('analysis_type', analysisType)
      .maybeSingle();

    if (existingConsentError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONSENT_STATUS_CHECK_FAILED',
            message: 'Failed to verify current image storage consent state',
            userMessage: '사진 저장 설정을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
        },
        { status: 500 }
      );
    }

    if (
      existingConsent?.consent_given === false &&
      existingConsent.withdrawal_at &&
      (existingConsent.retention_until || existingConsent.cleanup_reconciled_at === null)
    ) {
      const isPurgeRetry = Boolean(existingConsent.retention_until);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PURGE_PENDING',
            message: isPurgeRetry
              ? 'Stored image cleanup is still pending'
              : 'Stored image cleanup confirmation is still pending',
            userMessage: isPurgeRetry
              ? '이전 사진 삭제가 아직 끝나지 않았습니다. 개인정보 설정에서 삭제를 다시 시도해주세요.'
              : '사진 삭제 확인을 마무리하고 있습니다. 확인이 끝난 뒤 다시 동의할 수 있습니다.',
            details: { retryable: isPurgeRetry },
          },
        },
        { status: 409 }
      );
    }

    // 14세 미만 동의 자격 검증 (PIPA 준수)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('birth_date')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[Consent API] Failed to verify age:', profileError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGE_VERIFICATION_FAILED',
            message: 'Failed to verify age for image storage consent',
            userMessage: '연령 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
        },
        { status: 500 }
      );
    }

    const eligibility = checkConsentEligibility(userProfile?.birth_date);

    if (!eligibility.canConsent) {
      return NextResponse.json(
        {
          error:
            eligibility.reason === 'under_age'
              ? '14세 미만은 이미지 저장 동의를 할 수 없습니다'
              : '생년월일 정보가 필요합니다. 프로필에서 입력해주세요.',
          reason: eligibility.reason,
          requiredAction: eligibility.requiredAction,
        },
        { status: 403 }
      );
    }

    // 보관 기한 계산 (1년)
    const retentionUntil = new Date();
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 1);

    const consentValues = {
      clerk_user_id: userId,
      analysis_type: analysisType,
      consent_given: true,
      consent_version: LATEST_CONSENT_VERSION,
      consent_at: new Date().toISOString(),
      retention_until: retentionUntil.toISOString(),
      withdrawal_at: null, // 재동의 시 철회일 초기화
      cleanup_reconciled_at: null,
    };

    // 기존 행은 updated_at CAS로 갱신한다. 조회 직후 DELETE가 시작되면 새 동의로 덮지 않는다.

    const mutation = existingConsent
      ? await supabase
          .from('image_consents')
          .update(consentValues)
          .eq('id', existingConsent.id)
          .eq('updated_at', existingConsent.updated_at)
          .select()
          .maybeSingle()
      : await supabase.from('image_consents').insert(consentValues).select().single();
    const { data, error } = mutation;

    if (error) {
      console.error('[Consent API] POST error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONSENT_STATE_CHANGED',
              message: 'Image storage consent state changed while saving',
              userMessage: '사진 저장 설정이 변경되었습니다. 다시 확인한 뒤 시도해주세요.',
            },
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONSENT_STATE_CHANGED',
            message: 'Image storage consent state changed while saving',
            userMessage: '사진 저장 설정이 변경되었습니다. 다시 확인한 뒤 시도해주세요.',
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ consent: data, message: '동의가 저장되었습니다' });
  } catch (err) {
    console.error('[Consent API] POST exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/consent?analysisType=skin
 * 동의 철회 + 이미지 삭제 (GDPR/PIPA 준수)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    // 분석 타입 파라미터
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('analysisType') as AnalysisType | null;

    if (!analysisType || !VALID_ANALYSIS_TYPES.includes(analysisType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ANALYSIS_TYPE',
            message: 'Invalid analysis type',
            userMessage: '올바른 분석 유형을 선택해주세요.',
          },
        },
        { status: 400 }
      );
    }

    // Service Role 클라이언트로 스토리지 접근 (RLS 우회)
    const supabase = createServiceRoleClient();
    const bucketName = IMAGE_CONSENT_STORAGE_BUCKETS[analysisType];
    const withdrawalAt = new Date().toISOString();

    // 새 업로드가 파기 작업과 경합하지 않도록 저장 게이트를 가장 먼저 닫는다.
    const { error: revokeError } = await supabase
      .from('image_consents')
      .update({
        consent_given: false,
        withdrawal_at: withdrawalAt,
        cleanup_reconciled_at: null,
      })
      .eq('clerk_user_id', userId)
      .eq('analysis_type', analysisType);

    if (revokeError) {
      console.error('[Consent API] DELETE revoke error:', revokeError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONSENT_REVOKE_FAILED',
            message: 'Failed to revoke image storage consent',
            userMessage: '동의를 철회하지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
        },
        { status: 500 }
      );
    }

    const purge = await purgeUserStorageBuckets(supabase, userId, [bucketName]);
    const pointerCleanup = await clearAnalysisImagePointers(supabase, userId, analysisType);
    const failedTargets = [
      ...purge.failedBuckets,
      ...(pointerCleanup.failedTarget ? [pointerCleanup.failedTarget] : []),
    ];

    if (failedTargets.length === 0) {
      // false + withdrawal_at + retention_until은 파기 대기 상태다. 모두 지운 뒤에만 완료 표식을 남긴다.
      const { error: finalizeError, count: finalizedRows } = await supabase
        .from('image_consents')
        .update({ retention_until: null }, { count: 'exact' })
        .eq('clerk_user_id', userId)
        .eq('analysis_type', analysisType)
        .eq('consent_given', false)
        .eq('withdrawal_at', withdrawalAt);
      if (finalizeError) failedTargets.push('db:image_consents:purge-finalize');
      if (!finalizeError && finalizedRows === 0) {
        // purge 중 재동의된 행을 과거 DELETE가 완료 상태로 덮어쓰지 않는다.
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONSENT_STATE_CHANGED',
              message: 'Image storage consent changed while cleanup was running',
              userMessage:
                '사진 저장 설정이 처리 중 변경되었습니다. 현재 설정을 다시 확인해주세요.',
              details: {
                consentRevoked: false,
                deletedImages: purge.deleted,
                retryable: false,
              },
            },
          },
          { status: 409 }
        );
      }
    }

    if (failedTargets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONSENT_REVOKED_PURGE_INCOMPLETE',
            message: 'Consent revoked but stored image cleanup was incomplete',
            userMessage:
              '원본 사진 저장 동의는 철회됐지만 일부 사진을 삭제하지 못했습니다. 다시 시도해주세요.',
            details: {
              consentRevoked: true,
              deletedImages: purge.deleted,
              failedTargets,
              retryable: true,
            },
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisType,
        consentRevoked: true,
        deletedImages: purge.deleted,
        imagePointersCleared: pointerCleanup.cleared,
      },
    });
  } catch (err) {
    console.error('[Consent API] DELETE exception:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '동의 철회 중 오류가 발생했습니다. 다시 시도해주세요.',
        },
      },
      { status: 500 }
    );
  }
}
