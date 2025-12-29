/**
 * 룩북 피드 API 라우트
 * GET: 룩북 피드 조회 (공개 포스트)
 * POST: 룩북 포스트 생성
 * DELETE: 룩북 포스트 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor'); // 페이지네이션용
    const bodyType = searchParams.get('bodyType');
    const personalColor = searchParams.get('personalColor');
    const myPosts = searchParams.get('myPosts') === 'true';

    const supabase = createClerkSupabaseClient();

    let query = supabase
      .from('lookbook_posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // 다음 페이지 여부 확인용

    // 내 포스트만 보기
    if (myPosts && userId) {
      query = supabase
        .from('lookbook_posts')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit + 1);
    }

    // 필터
    if (bodyType) {
      query = query.eq('body_type', bodyType);
    }
    if (personalColor) {
      query = query.eq('personal_color', personalColor);
    }

    // 커서 기반 페이지네이션
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Lookbook] Error fetching:', error);
      return NextResponse.json({ error: '룩북을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    const posts = data || [];
    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1]?.created_at : null;

    return NextResponse.json({
      posts: resultPosts,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('[Lookbook] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, caption, bodyType, personalColor, outfitItems = [], isPublic = true } = body;

    // 유효성 검사
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 });
    }
    if (bodyType && !['S', 'W', 'N'].includes(bodyType)) {
      return NextResponse.json({ error: '유효하지 않은 체형입니다.' }, { status: 400 });
    }
    if (personalColor && !['Spring', 'Summer', 'Autumn', 'Winter'].includes(personalColor)) {
      return NextResponse.json({ error: '유효하지 않은 퍼스널컬러입니다.' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('lookbook_posts')
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl,
        caption: caption || null,
        body_type: bodyType || null,
        personal_color: personalColor || null,
        outfit_items: outfitItems,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) {
      console.error('[Lookbook] Error creating:', error);
      return NextResponse.json({ error: '포스트 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Lookbook] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '포스트 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    const { error } = await supabase
      .from('lookbook_posts')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Lookbook] Error deleting:', error);
      return NextResponse.json({ error: '포스트 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Lookbook] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
