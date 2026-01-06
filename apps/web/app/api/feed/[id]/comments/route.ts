import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getComments, createComment, deleteComment } from '@/lib/feed';
import type { CreateCommentInput } from '@/lib/feed';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/feed/[id]/comments
 * 댓글 목록 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const comments = await getComments(id);

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('[Feed API] GET comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed/[id]/comments
 * 댓글 작성
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const input: CreateCommentInput = {
      post_id: id,
      content: body.content,
      parent_id: body.parent_id,
    };

    const comment = await createComment(userId, input);

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('[Feed API] POST comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feed/[id]/comments
 * 댓글 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { success: false, error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    await deleteComment(commentId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feed API] DELETE comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
