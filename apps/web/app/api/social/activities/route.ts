import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { transformToActivity, type RawActivityData } from '@/lib/social/activity';

/**
 * 친구 활동 목록 조회
 *
 * GET /api/social/activities
 * Query: { page?: number, limit?: number }
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const supabase = createClerkSupabaseClient();

    // 친구 목록 조회
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    const friendIds = friendships?.map((f) => f.friend_id) || [];

    // 본인 + 친구 활동 조회
    const userIds = [userId, ...friendIds];

    const { data: activities, error } = await supabase
      .from('social_activities')
      .select(`
        id,
        clerk_user_id,
        activity_type,
        title,
        description,
        metadata,
        likes_count,
        comments_count,
        created_at,
        users:clerk_user_id (
          full_name,
          avatar_url
        ),
        activity_likes:activity_likes (
          clerk_user_id
        )
      `)
      .in('clerk_user_id', userIds)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Social Activities] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // RawActivityData 타입으로 변환
    const transformedActivities = (activities || []).map((activity) => {
      // activity_likes를 user_id 형식으로 매핑
      const likes = (activity.activity_likes as { clerk_user_id: string }[] | null) || [];
      const mappedLikes = likes.map((like) => ({ user_id: like.clerk_user_id }));

      // Supabase가 반환하는 타입을 RawActivityData로 변환
      const raw: RawActivityData = {
        id: activity.id,
        user_id: activity.clerk_user_id,
        type: activity.activity_type as RawActivityData['type'],
        title: activity.title,
        description: activity.description || '',
        metadata: activity.metadata as RawActivityData['metadata'],
        likes_count: activity.likes_count,
        comments_count: activity.comments_count,
        created_at: activity.created_at,
        users: {
          full_name: (activity.users as { full_name?: string })?.full_name || '익명',
          avatar_url: (activity.users as { avatar_url?: string | null })?.avatar_url || null,
        },
        activity_likes: mappedLikes,
      };
      return transformToActivity(raw, userId);
    });

    return NextResponse.json({
      success: true,
      data: transformedActivities,
      hasMore: transformedActivities.length === limit,
      page,
    });
  } catch (error) {
    console.error('[Social Activities] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
