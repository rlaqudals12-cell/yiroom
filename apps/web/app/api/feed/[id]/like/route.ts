import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { toggleInteraction } from '@/lib/feed';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/feed/[id]/like
 * 좋아요 토글
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await toggleInteraction(id, userId, 'like');

    return NextResponse.json({
      success: true,
      liked: result.added,
    });
  } catch (error) {
    console.error('[Feed API] Like error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle like' }, { status: 500 });
  }
}
