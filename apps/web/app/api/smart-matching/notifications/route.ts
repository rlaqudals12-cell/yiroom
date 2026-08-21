/**
 * 스마트 알림 API
 * GET - 알림 목록 조회
 * POST - 알림 생성 (시스템용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAllAsRead,
} from '@/lib/smart-matching';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

const notificationTypeSchema = z.enum([
  'product_running_low',
  'expiry_approaching',
  'price_drop',
  'back_in_stock',
  'new_recommendation',
  'size_available',
  'similar_product',
  'reorder_reminder',
]);

const querySchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  type: notificationTypeSchema.optional(),
  count: z.enum(['true', 'false']).optional(),
});

const markAllSchema = z.object({ action: z.literal('markAllAsRead') }).strict();
const createSchema = z
  .object({
    notificationType: notificationTypeSchema,
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(500),
    imageUrl: z.string().url().max(2048).optional(),
    productId: z.string().uuid().optional(),
    inventoryItemId: z.string().uuid().optional(),
    actionUrl: z.string().trim().min(1).max(2048).optional(),
    scheduledFor: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

function errorResponse(
  code: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR',
  message: string,
  userMessage: string,
  status: number
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, userMessage } }, { status });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      unread: searchParams.get('unread') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      count: searchParams.get('count') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid notification query',
        '알림 조회 조건을 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    const unreadOnly = parsed.data.unread === 'true';
    const countOnly = parsed.data.count === 'true';

    if (countOnly) {
      const count = await getUnreadCount(userId, db);
      return NextResponse.json({ success: true, data: { unreadCount: count } });
    }

    const notifications = await getNotifications(
      userId,
      {
        unreadOnly,
        type: parsed.data.type,
        limit: 50,
      },
      db
    );

    const unreadCount = await getUnreadCount(userId, db);

    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    console.error('[API] Notifications GET error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to get notifications',
      '알림을 불러오지 못했습니다.',
      500
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const body: unknown = await request.json().catch(() => null);
    const markAll = markAllSchema.safeParse(body);

    // 전체 읽음 처리
    if (markAll.success) {
      const db = createClerkSupabaseClient();
      const success = await markAllAsRead(userId, db);
      if (!success) {
        return errorResponse(
          'INTERNAL_ERROR',
          'Failed to mark notifications as read',
          '알림을 읽음 처리하지 못했습니다.',
          500
        );
      }
      return NextResponse.json({ success: true, data: { success: true } });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid notification payload',
        '알림 내용을 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    const result = await createNotification(
      {
        clerkUserId: userId,
        ...parsed.data,
        scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
      },
      db
    );

    if (!result) {
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to create notification',
        '알림을 만들지 못했습니다.',
        500
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('[API] Notifications POST error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to process notification request',
      '알림 요청을 처리하지 못했습니다.',
      500
    );
  }
}
