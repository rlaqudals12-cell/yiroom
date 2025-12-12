/**
 * N-1 즐겨찾기 개별 API (Task 2.15)
 *
 * DELETE /api/nutrition/favorites/[id] - 즐겨찾기 삭제
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/nutrition/favorites/[id]
 * 즐겨찾기에서 음식 삭제
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = createServiceRoleClient();

    // 본인의 즐겨찾기만 삭제 가능
    const { data, error } = await supabase
      .from('favorite_foods')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[N-1] Favorite delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete favorite' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '즐겨찾기에서 삭제되었습니다',
      deleted: data,
    });
  } catch (error) {
    console.error('[N-1] Favorite delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
