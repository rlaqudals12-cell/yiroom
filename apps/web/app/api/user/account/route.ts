/**
 * 계정 삭제 API
 * DELETE /api/user/account
 *
 * GDPR Art.17 삭제권 및 App Store 5.1.1(v) 준수
 */
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { purgeUserStorage } from '@/lib/api/storage-purge';
import type { DeleteAccountRequest, DeleteAccountResponse } from '@/types/user-data';

// 삭제할 테이블 순서 (외래키 제약 고려)
// ⚠️ 5축(PC·S·C·H·M) 분석·트윈·통합세션이 누락되면 생체·개인정보가 잔존하므로 전부 포함한다.
//    존재하지 않는 테이블/컬럼은 아래 삭제 루프가 'does not exist' 에러로 무시한다.
const TABLES_TO_DELETE = [
  'challenge_participations',
  'daily_checkins',
  'user_badges',
  'user_levels',
  'wellness_scores',
  'friendships',
  'user_wishlists',
  'wishlist',
  'daily_nutrition_summary',
  'water_records',
  'meal_records',
  'workout_logs',
  'workout_plans',
  'workout_analyses',
  // 5축 분석 (생체 데이터)
  'personal_color_assessments', // PC축
  'skin_analyses', // S축
  'skin_diary_entries', // S축 다이어리
  'body_analyses', // C축
  'posture_assessments', // C축 자세
  'hair_analyses', // H축 (누락되어 있던 생체 분석)
  'makeup_analyses', // M축 (누락되어 있던 분석)
  'integrated_analysis_sessions', // 통합분석 온보딩 세션 (얼굴·체형 생체)
  'user_twins', // AI 아바타/트윈 (얼굴 유래 생체)
  // 취향·옷장·코치
  'user_preferences',
  'user_preference_items',
  'saved_outfits',
  'user_inventory',
  'coach_chat_history',
  'nutrition_settings',
  'feedback',
  'image_consents', // 생체 이미지 동의 기록 (BIPA/PIPA 파기의무)
  'user_agreements', // 가입 동의 기록
  'users', // 마지막에 삭제 (FK 제약)
];

/**
 * 사용자 소유 DB 행을 테이블별로 삭제한다.
 * 테이블/컬럼 부재('does not exist')는 무시하고, 그 외 실패만 errors로 반환한다.
 */
async function deleteUserTables(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<string[]> {
  const errors: string[] = [];
  for (const table of TABLES_TO_DELETE) {
    try {
      const { error } = await supabase.from(table).delete().eq('clerk_user_id', userId);
      if (error && !error.message.includes('does not exist')) {
        console.error(`[ACCOUNT-DELETE] Failed to delete from ${table}:`, error);
        errors.push(table);
      }
    } catch (tableError) {
      console.error(`[ACCOUNT-DELETE] Error deleting from ${table}:`, tableError);
      errors.push(table);
    }
  }
  return errors;
}

export async function DELETE(request: Request) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 바디 파싱
    let body: DeleteAccountRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

    const { confirmation } = body;

    if (!confirmation) {
      return NextResponse.json(
        { success: false, error: 'CONFIRMATION_REQUIRED', message: '이메일 확인이 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. Clerk에서 사용자 정보 조회 및 이메일 확인
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail || confirmation.toLowerCase() !== userEmail.toLowerCase()) {
      const response: DeleteAccountResponse = {
        success: false,
        error: 'CONFIRMATION_MISMATCH',
        message: '이메일이 일치하지 않습니다.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 4. Supabase 데이터 삭제 (Service Role로 RLS 우회)
    const supabase = createServiceRoleClient();
    const deletionErrors: string[] = await deleteUserTables(supabase, userId);

    // 4-2. 스토리지 사용자 이미지 완전 삭제 (GDPR Art.17 / BIPA·PIPA 파기의무)
    // DB만 지우면 생체/개인 이미지가 스토리지에 고아로 남으므로 계정 삭제 시 직접 파기한다.
    // 재귀 수집 + 전체 버킷 목록은 공유 유틸(purgeUserStorage)로 통일 — 삭제 크론과 동일 로직.
    const purge = await purgeUserStorage(supabase, userId);
    if (purge.failedBuckets.length > 0) {
      console.error('[ACCOUNT-DELETE] Failed to purge storage buckets:', purge.failedBuckets);
      deletionErrors.push(...purge.failedBuckets);
    }

    // 5. Clerk 계정 삭제
    try {
      await client.users.deleteUser(userId);
    } catch (clerkError) {
      console.error('[ACCOUNT-DELETE] Failed to delete Clerk user:', clerkError);
      const response: DeleteAccountResponse = {
        success: false,
        error: 'DELETION_FAILED',
        message: 'Clerk 계정 삭제에 실패했습니다. 고객센터에 문의해주세요.',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // 6. 성공 응답
    const response: DeleteAccountResponse = {
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.',
      deletedAt: new Date().toISOString(),
    };

    // 삭제 오류가 있었지만 Clerk 계정은 삭제됨
    if (deletionErrors.length > 0) {
      console.warn('[ACCOUNT-DELETE] Some tables failed to delete:', deletionErrors);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[ACCOUNT-DELETE] Unexpected error:', error);
    const response: DeleteAccountResponse = {
      success: false,
      error: 'DELETION_FAILED',
      message: '계정 삭제 중 오류가 발생했습니다.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
