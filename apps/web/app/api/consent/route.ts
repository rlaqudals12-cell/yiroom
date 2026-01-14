import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { LATEST_CONSENT_VERSION } from '@/components/analysis/consent';
import { checkConsentEligibility } from '@/lib/consent/version-check';

/**
 * 이미지 저장 동의 API
 * SDD-VISUAL-SKIN-REPORT.md §4.3
 */

// 유효한 분석 타입
const VALID_ANALYSIS_TYPES = ['skin', 'body', 'personal-color'] as const;
type AnalysisType = (typeof VALID_ANALYSIS_TYPES)[number];

// 분석 타입별 스토리지 버킷 매핑
const ANALYSIS_STORAGE_BUCKETS: Record<AnalysisType, string> = {
  skin: 'skin-images',
  body: 'body-images',
  'personal-color': 'personal-color-images',
};

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

    // 14세 미만 동의 자격 검증 (PIPA 준수)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('birth_date')
      .eq('clerk_user_id', userId)
      .single();

    console.log('[Consent API] User profile:', userProfile, 'Error:', profileError);

    const eligibility = checkConsentEligibility(userProfile?.birth_date);
    console.log('[Consent API] Eligibility check:', eligibility);

    if (!eligibility.canConsent) {
      console.log('[Consent API] 동의 불가:', eligibility.reason);
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

    // upsert로 기존 동의 업데이트 또는 새로 생성
    const { data, error } = await supabase
      .from('image_consents')
      .upsert(
        {
          clerk_user_id: userId,
          analysis_type: analysisType,
          consent_given: true,
          consent_version: LATEST_CONSENT_VERSION,
          consent_at: new Date().toISOString(),
          retention_until: retentionUntil.toISOString(),
          withdrawal_at: null, // 재동의 시 철회일 초기화
        },
        {
          onConflict: 'clerk_user_id,analysis_type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Consent API] POST error:', error);
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 분석 타입 파라미터
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('analysisType') as AnalysisType | null;

    if (!analysisType || !VALID_ANALYSIS_TYPES.includes(analysisType)) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Service Role 클라이언트로 스토리지 접근 (RLS 우회)
    const supabase = createServiceRoleClient();
    const bucketName = ANALYSIS_STORAGE_BUCKETS[analysisType];

    // 사용자 이미지 폴더 조회 및 삭제
    let deletedImagesCount = 0;
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(userId);

      if (listError) {
        console.warn(`[Consent API] Storage list error (${bucketName}):`, listError);
        // 버킷이 없거나 빈 경우 무시하고 계속 진행
      } else if (files && files.length > 0) {
        // 파일 경로 생성
        const filePaths = files.map((file) => `${userId}/${file.name}`);

        const { error: deleteError } = await supabase.storage.from(bucketName).remove(filePaths);

        if (deleteError) {
          console.error(`[Consent API] Storage delete error:`, deleteError);
          // 스토리지 삭제 실패해도 동의 철회는 진행
        } else {
          deletedImagesCount = filePaths.length;
          console.log(`[Consent API] Deleted ${deletedImagesCount} images from ${bucketName}`);
        }
      }
    } catch (storageErr) {
      console.error('[Consent API] Storage operation failed:', storageErr);
      // 스토리지 에러 시에도 동의 철회는 진행
    }

    // 동의 철회 (soft delete - consent_given = false)
    const { error } = await supabase
      .from('image_consents')
      .update({
        consent_given: false,
        withdrawal_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)
      .eq('analysis_type', analysisType);

    if (error) {
      console.error('[Consent API] DELETE error:', error);
      return NextResponse.json({ error: 'Failed to revoke consent' }, { status: 500 });
    }

    return NextResponse.json({
      message: '동의가 철회되었습니다',
      deletedImages: deletedImagesCount,
    });
  } catch (err) {
    console.error('[Consent API] DELETE exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
