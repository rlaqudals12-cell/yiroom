/**
 * 계정 삭제 API
 * DELETE /api/user/account
 *
 * GDPR Art.17 삭제권 및 App Store 5.1.1(v) 준수
 */
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { DeleteAccountRequest, DeleteAccountResponse } from '@/types/user-data';

// 삭제할 테이블 순서 (외래키 제약 고려)
const TABLES_TO_DELETE = [
  'challenge_participations',
  'user_badges',
  'user_levels',
  'wellness_scores',
  'friendships',
  'user_wishlists',
  'daily_nutrition_summary',
  'water_records',
  'meal_records',
  'workout_logs',
  'workout_plans',
  'workout_analyses',
  'body_analyses',
  'skin_analyses',
  'personal_color_assessments',
  'nutrition_settings',
  'feedback',
  'users', // 마지막에 삭제
];

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
    const deletionErrors: string[] = [];

    for (const table of TABLES_TO_DELETE) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('clerk_user_id', userId);

        if (error) {
          // 테이블이 없거나 컬럼이 없는 경우 무시
          if (!error.message.includes('does not exist')) {
            console.error(`[ACCOUNT-DELETE] Failed to delete from ${table}:`, error);
            deletionErrors.push(table);
          }
        }
      } catch (tableError) {
        console.error(`[ACCOUNT-DELETE] Error deleting from ${table}:`, tableError);
        deletionErrors.push(table);
      }
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
