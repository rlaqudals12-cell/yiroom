import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

/**
 * 좋아요 토글
 *
 * POST /api/social/activities/[id]/like - 좋아요 추가
 * DELETE /api/social/activities/[id]/like - 좋아요 취소
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: activityId } = await params;
    const supabase = createClerkSupabaseClient();

    // 이미 좋아요 했는지 확인
    const { data: existing } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, isLiked: true, message: 'Already liked' });
    }

    // 좋아요 추가
    const { error } = await supabase
      .from('activity_likes')
      .insert({
        activity_id: activityId,
        clerk_user_id: userId,
      });

    if (error) {
      console.error('[Like] Error:', error);
      return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isLiked: true });
  } catch (error) {
    console.error('[Like] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: activityId } = await params;
    const supabase = createClerkSupabaseClient();

    // 좋아요 삭제
    const { error } = await supabase
      .from('activity_likes')
      .delete()
      .eq('activity_id', activityId)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Unlike] Error:', error);
      return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isLiked: false });
  } catch (error) {
    console.error('[Unlike] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
