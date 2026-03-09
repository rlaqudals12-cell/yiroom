import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { blockUser, unblockUser, getBlockedUserIds } from '@/lib/feed';

/**
 * GET /api/user/blocks
 * 차단 목록 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요.' }, { status: 401 });
    }

    const blockedUserIds = await getBlockedUserIds(userId);

    return NextResponse.json({ success: true, blockedUserIds });
  } catch (error) {
    console.error('[User API] Get blocks error:', error);
    return NextResponse.json(
      { success: false, error: '차단 목록을 불러오지 못했어요.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/blocks
 * 사용자 차단
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요.' }, { status: 401 });
    }

    const body = await req.json();
    const { blockedUserId } = body;

    if (!blockedUserId || typeof blockedUserId !== 'string') {
      return NextResponse.json(
        { success: false, error: '차단할 사용자를 지정해주세요.' },
        { status: 400 }
      );
    }

    if (blockedUserId === userId) {
      return NextResponse.json(
        { success: false, error: '자기 자신을 차단할 수 없어요.' },
        { status: 400 }
      );
    }

    const block = await blockUser(userId, blockedUserId);

    return NextResponse.json({ success: true, block });
  } catch (error) {
    // 중복 차단 (UNIQUE 제약 위반)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { success: false, error: '이미 차단한 사용자예요.' },
        { status: 409 }
      );
    }

    console.error('[User API] Block user error:', error);
    return NextResponse.json(
      { success: false, error: '사용자 차단에 실패했어요.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/blocks
 * 차단 해제
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요.' }, { status: 401 });
    }

    const body = await req.json();
    const { blockedUserId } = body;

    if (!blockedUserId || typeof blockedUserId !== 'string') {
      return NextResponse.json(
        { success: false, error: '차단 해제할 사용자를 지정해주세요.' },
        { status: 400 }
      );
    }

    await unblockUser(userId, blockedUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[User API] Unblock user error:', error);
    return NextResponse.json({ success: false, error: '차단 해제에 실패했어요.' }, { status: 500 });
  }
}
