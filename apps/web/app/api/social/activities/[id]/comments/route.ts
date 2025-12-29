import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

/**
 * 댓글 조회/작성
 *
 * GET /api/social/activities/[id]/comments - 댓글 목록 조회
 * POST /api/social/activities/[id]/comments - 댓글 작성
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: activityId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = createClerkSupabaseClient();

    const { data: comments, error } = await supabase
      .from('activity_comments')
      .select(`
        id,
        clerk_user_id,
        content,
        created_at,
        users:clerk_user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[Comments] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // 변환
    const transformedComments = (comments || []).map((comment) => ({
      id: comment.id,
      userId: comment.clerk_user_id,
      userName: (comment.users as { full_name?: string })?.full_name || '익명',
      userAvatar: (comment.users as { avatar_url?: string | null })?.avatar_url || null,
      content: comment.content,
      createdAt: comment.created_at,
      isOwn: comment.clerk_user_id === userId,
    }));

    return NextResponse.json({
      success: true,
      data: transformedComments,
    });
  } catch (error) {
    console.error('[Comments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Content too long (max 500 chars)' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    // 댓글 추가
    const { data: comment, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        clerk_user_id: userId,
        content: content.trim(),
      })
      .select(`
        id,
        clerk_user_id,
        content,
        created_at
      `)
      .single();

    if (error) {
      console.error('[Add Comment] Error:', error);
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        id: comment.id,
        userId: comment.clerk_user_id,
        userName: user?.full_name || '익명',
        userAvatar: user?.avatar_url || null,
        content: comment.content,
        createdAt: comment.created_at,
        isOwn: true,
      },
    });
  } catch (error) {
    console.error('[Add Comment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    // 본인 댓글만 삭제 가능
    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Delete Comment] Error:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Delete Comment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
