/**
 * 룩북 좋아요 API 라우트
 * POST: 좋아요 추가
 * DELETE: 좋아요 취소
 * GET: 좋아요 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ isLiked: false });
    }

    const { id: postId } = await params;
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('lookbook_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Lookbook Like] Error checking:', error);
      return NextResponse.json({ error: '좋아요 상태 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('[Lookbook Like] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id: postId } = await params;
    const supabase = createClerkSupabaseClient();

    // 이미 좋아요했는지 확인
    const { data: existing } = await supabase
      .from('lookbook_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('clerk_user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ message: '이미 좋아요한 포스트입니다.' }, { status: 200 });
    }

    // 좋아요 추가
    const { error } = await supabase
      .from('lookbook_likes')
      .insert({
        post_id: postId,
        clerk_user_id: userId,
      });

    if (error) {
      console.error('[Lookbook Like] Error creating:', error);
      return NextResponse.json({ error: '좋아요 추가 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isLiked: true }, { status: 201 });
  } catch (error) {
    console.error('[Lookbook Like] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id: postId } = await params;
    const supabase = createClerkSupabaseClient();

    const { error } = await supabase
      .from('lookbook_likes')
      .delete()
      .eq('post_id', postId)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Lookbook Like] Error deleting:', error);
      return NextResponse.json({ error: '좋아요 취소 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isLiked: false });
  } catch (error) {
    console.error('[Lookbook Like] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
