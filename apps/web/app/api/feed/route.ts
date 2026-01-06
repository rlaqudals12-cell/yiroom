import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getFeedPosts, createPost } from '@/lib/feed';
import type { CreatePostInput, FeedListParams, PostType } from '@/lib/feed';

/**
 * GET /api/feed
 * 피드 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);

    const params: FeedListParams = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      post_type: (searchParams.get('post_type') as PostType) || undefined,
      hashtag: searchParams.get('hashtag') || undefined,
      user_id: searchParams.get('user_id') || undefined,
    };

    const { posts, total } = await getFeedPosts(params, userId || undefined);

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / (params.limit || 20)),
      },
    });
  } catch (error) {
    console.error('[Feed API] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feed' }, { status: 500 });
  }
}

/**
 * POST /api/feed
 * 피드 포스트 생성
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as CreatePostInput;

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const post = await createPost(userId, body);

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error('[Feed API] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
  }
}
