import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 친구 활동 알림 조회
 * GET /api/notifications/friend-activities?unread=true
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const supabase = createServiceRoleClient();

    // 친구 활동 알림 조회
    let query = supabase
      .from('friend_activity_notifications')
      .select(
        `
        *,
        friend:users!friend_activity_notifications_friend_id_fkey(
          clerk_user_id,
          first_name,
          last_name,
          image_url
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('[FriendActivity] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // 읽지 않은 수 카운트
    const { count: unreadCount } = await supabase
      .from('friend_activity_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('[FriendActivity] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 친구 활동 알림 읽음 처리
 * PATCH /api/notifications/friend-activities
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { notificationIds, markAll = false } = body;

    const supabase = createServiceRoleClient();

    if (markAll) {
      // 모든 알림 읽음 처리
      const { error } = await supabase
        .from('friend_activity_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[FriendActivity] Mark all read error:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 선택한 알림만 읽음 처리
      const { error } = await supabase
        .from('friend_activity_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', notificationIds);

      if (error) {
        console.error('[FriendActivity] Mark read error:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: 'notificationIds array or markAll flag required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FriendActivity] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
