import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkDailyItem } from '@/lib/capsule';

/**
 * PATCH /api/capsule/[id]/check
 * Daily Capsule 아이템 체크/해제
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const { itemId, isChecked } = await req.json();

    if (!itemId || typeof isChecked !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'itemId와 isChecked가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await checkDailyItem(id, itemId, isChecked);

    if (!result) {
      return NextResponse.json(
        { success: false, error: '캡슐을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Capsule API] PATCH check error:', error);
    return NextResponse.json(
      { success: false, error: '체크 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
