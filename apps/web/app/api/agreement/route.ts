import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  mapDbAgreementToFrontend,
} from '@/components/agreement';

/**
 * 서비스 약관동의 API
 * SDD-TERMS-AGREEMENT.md §5
 */

/**
 * GET /api/agreement
 * 동의 상태 조회
 */
export async function GET() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // 동의 정보 조회
    const { data, error } = await supabase
      .from('user_agreements')
      .select('*')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Agreement API] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch agreement' }, { status: 500 });
    }

    // 동의 정보가 없거나 필수 동의가 false인 경우
    if (!data || !data.terms_agreed || !data.privacy_agreed) {
      return NextResponse.json({
        hasAgreed: false,
        agreement: null,
      });
    }

    // 약관 버전이 다른 경우 (재동의 필요)
    if (
      data.terms_version !== CURRENT_TERMS_VERSION ||
      data.privacy_version !== CURRENT_PRIVACY_VERSION
    ) {
      return NextResponse.json({
        hasAgreed: false,
        agreement: mapDbAgreementToFrontend(data),
        requiresUpdate: true,
        reason: 'version_mismatch',
      });
    }

    return NextResponse.json({
      hasAgreed: true,
      agreement: mapDbAgreementToFrontend(data),
    });
  } catch (err) {
    console.error('[Agreement API] GET exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/agreement
 * 동의 저장
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Body 파싱
    const body = await request.json();
    const { termsAgreed, privacyAgreed, marketingAgreed } = body as {
      termsAgreed: boolean;
      privacyAgreed: boolean;
      marketingAgreed: boolean;
    };

    // 필수 동의 검증
    const missingAgreements: string[] = [];
    if (!termsAgreed) missingAgreements.push('terms');
    if (!privacyAgreed) missingAgreements.push('privacy');

    if (missingAgreements.length > 0) {
      return NextResponse.json(
        {
          error: '필수 약관에 동의해주세요',
          missingAgreements,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // upsert로 기존 동의 업데이트 또는 새로 생성
    const { data, error } = await supabase
      .from('user_agreements')
      .upsert(
        {
          clerk_user_id: userId,
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: marketingAgreed ?? false,
          terms_version: CURRENT_TERMS_VERSION,
          privacy_version: CURRENT_PRIVACY_VERSION,
          terms_agreed_at: now,
          privacy_agreed_at: now,
          marketing_agreed_at: marketingAgreed ? now : null,
          marketing_withdrawn_at: null,
        },
        {
          onConflict: 'clerk_user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Agreement API] POST error:', error);
      return NextResponse.json({ error: 'Failed to save agreement' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        agreement: mapDbAgreementToFrontend(data),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Agreement API] POST exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/agreement
 * 마케팅 동의 변경 (설정에서 사용)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Body 파싱
    const body = await request.json();
    const { marketingAgreed } = body as { marketingAgreed: boolean };

    if (typeof marketingAgreed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 마케팅 동의 상태 업데이트
    const { data, error } = await supabase
      .from('user_agreements')
      .update({
        marketing_agreed: marketingAgreed,
        marketing_agreed_at: marketingAgreed ? now : null,
        marketing_withdrawn_at: marketingAgreed ? null : now,
      })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Agreement API] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update marketing consent' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agreement: mapDbAgreementToFrontend(data),
    });
  } catch (err) {
    console.error('[Agreement API] PATCH exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
