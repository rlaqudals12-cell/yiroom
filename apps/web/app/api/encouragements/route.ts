import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 프리셋 응원 메시지
const PRESET_MESSAGES = [
  '오늘도 화이팅!',
  '잘하고 있어요!',
  '멋져요!',
  '응원할게요!',
  '함께 해요!',
] as const;

/**
 * 받은 응원 목록 조회
 * GET /api/encouragements?unread=true
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = createServiceRoleClient();

    // 받은 응원 조회
    let query = supabase
      .from('encouragements')
      .select(
        `
        *,
        from_user:users!encouragements_from_user_id_fkey(
          clerk_user_id,
          first_name,
          last_name,
          image_url
        )
      `
      )
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: encouragements, error } = await query;

    if (error) {
      console.error('[Encouragement] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch encouragements' }, { status: 500 });
    }

    // 읽지 않은 수 카운트
    const { count: unreadCount } = await supabase
      .from('encouragements')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({
      encouragements: encouragements || [],
      unreadCount: unreadCount || 0,
      presetMessages: PRESET_MESSAGES,
    });
  } catch (error) {
    console.error('[Encouragement] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 응원 메시지 보내기
 * POST /api/encouragements
 */
export async function POST(req: Request) {
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

    const { toUserId, message, messageType = 'custom', activityType, activityId } = body;

    // 필수 필드 검증
    if (!toUserId || !message) {
      return NextResponse.json({ error: 'toUserId and message are required' }, { status: 400 });
    }

    // 자기 자신에게 응원 불가
    if (toUserId === userId) {
      return NextResponse.json({ error: 'Cannot send encouragement to yourself' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 친구 관계 확인
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${userId})`
      )
      .single();

    if (friendshipError || !friendship) {
      return NextResponse.json(
        { error: 'Can only send encouragement to friends' },
        { status: 403 }
      );
    }

    // 응원 메시지 저장
    const { data: encouragement, error: insertError } = await supabase
      .from('encouragements')
      .insert({
        from_user_id: userId,
        to_user_id: toUserId,
        message,
        message_type: messageType,
        activity_type: activityType || null,
        activity_id: activityId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Encouragement] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to send encouragement' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      encouragement,
    });
  } catch (error) {
    console.error('[Encouragement] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 응원 읽음 처리
 * PATCH /api/encouragements
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

    const { encouragementIds, markAll = false } = body;

    const supabase = createServiceRoleClient();

    if (markAll) {
      // 모든 응원 읽음 처리
      const { error } = await supabase
        .from('encouragements')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('to_user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[Encouragement] Mark all read error:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }
    } else if (encouragementIds && Array.isArray(encouragementIds)) {
      // 선택한 응원만 읽음 처리
      const { error } = await supabase
        .from('encouragements')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('to_user_id', userId)
        .in('id', encouragementIds);

      if (error) {
        console.error('[Encouragement] Mark read error:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: 'encouragementIds array or markAll flag required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Encouragement] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
