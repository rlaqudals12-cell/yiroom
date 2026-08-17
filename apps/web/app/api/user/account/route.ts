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
import { purgeUserRows } from '@/lib/api/user-rows-purge';
import type { DeleteAccountRequest, DeleteAccountResponse } from '@/types/user-data';

/**
 * 사용자 소유 DB 행을 파기한다.
 *
 * 대상 목록은 `types/gdpr.ts`의 DELETION_TABLES **단일 정본**을 쓴다 — 예전엔 이 라우트와
 * 하드삭제 크론이 서로 다른 목록을 들고 있어, 양쪽 어디에도 없는 테이블(옷장·캡슐·
 * 안전프로필·알림·쇼핑 취향 등)의 데이터가 계정 삭제 후에도 영구 잔존했다.
 *
 * `users` 행은 마지막에 별도 삭제한다 — 자식 테이블 FK CASCADE의 기점이라
 * 먼저 지우면 나머지 삭제 결과를 확인할 수 없다.
 */
async function deleteUserTables(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<string[]> {
  const { failedTables } = await purgeUserRows(supabase, userId, '[ACCOUNT-DELETE]');

  // 계정 행 (FK CASCADE로 clerk_user_id 없는 자식들까지 함께 정리)
  try {
    const { error } = await supabase.from('users').delete().eq('clerk_user_id', userId);
    if (error) {
      console.error('[ACCOUNT-DELETE] Failed to delete from users:', error);
      failedTables.push('users');
    }
  } catch (userError) {
    console.error('[ACCOUNT-DELETE] Error deleting from users:', userError);
    failedTables.push('users');
  }

  return failedTables;
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

    // 5. 파기 실패가 남았으면 Clerk 계정을 지우지 않는다.
    //
    // 왜: Clerk 계정이 사라지면 사용자는 다시 로그인할 수 없고, 남은 행·이미지를
    // 스스로 지울 방법도 없다(재시도 불가). "사진·개인정보는 남았는데 계정만 사라진"
    // 상태가 GDPR Art.17·PIPA 파기의무 위반 그 자체다. 계정을 남겨 재시도를 보장한다.
    if (deletionErrors.length > 0) {
      console.error('[ACCOUNT-DELETE] Aborting Clerk deletion — residual data:', deletionErrors);
      const response: DeleteAccountResponse = {
        success: false,
        error: 'DELETION_FAILED',
        message:
          '일부 데이터를 삭제하지 못해 계정 삭제를 중단했어요. 잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 알려주세요.',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // 6. Clerk 계정 삭제 (DB·스토리지 파기가 모두 성공한 뒤에만)
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

    // 7. 성공 응답 — 여기 도달했다는 건 DB·스토리지·Clerk이 모두 지워졌다는 뜻
    const response: DeleteAccountResponse = {
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.',
      deletedAt: new Date().toISOString(),
    };

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
