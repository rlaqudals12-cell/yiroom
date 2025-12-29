/**
 * 스마트 알림 API
 * GET - 알림 목록 조회
 * POST - 알림 생성 (시스템용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAllAsRead,
} from '@/lib/smart-matching';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');
    const countOnly = searchParams.get('count') === 'true';

    if (countOnly) {
      const count = await getUnreadCount(userId);
      return NextResponse.json({ unreadCount: count });
    }

    const notifications = await getNotifications(userId, {
      unreadOnly,
      type: type as import('@/types/smart-matching').NotificationType | undefined,
      limit: 50,
    });

    const unreadCount = await getUnreadCount(userId);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('[API] Notifications GET error:', error);
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

    // 전체 읽음 처리
    if (body.action === 'markAllAsRead') {
      const success = await markAllAsRead(userId);
      return NextResponse.json({ success });
    }

    // 알림 생성 (시스템 내부용)
    if (!body.notificationType || !body.title || !body.message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const result = await createNotification({
      clerkUserId: userId,
      notificationType: body.notificationType,
      title: body.title,
      message: body.message,
      imageUrl: body.imageUrl,
      productId: body.productId,
      inventoryItemId: body.inventoryItemId,
      actionUrl: body.actionUrl,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: '알림 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Notifications POST error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
