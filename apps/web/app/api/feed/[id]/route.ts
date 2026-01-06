import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/lib/feed';
import type { UpdatePostInput } from '@/lib/feed';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/feed/[id]
 * 단일 포스트 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    const post = await getPostById(id, userId || undefined);

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('[Feed API] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch post' }, { status: 500 });
  }
}

/**
 * PATCH /api/feed/[id]
 * 포스트 수정
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as UpdatePostInput;

    const post = await updatePost(id, userId, body);

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('[Feed API] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 });
  }
}

/**
 * DELETE /api/feed/[id]
 * 포스트 삭제
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await deletePost(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feed API] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete post' }, { status: 500 });
  }
}
