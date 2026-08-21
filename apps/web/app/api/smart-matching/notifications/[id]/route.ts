/**
 * 개별 알림 API
 * PATCH - 읽음 처리
 * DELETE - 알림 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { markAsRead, deleteNotification } from '@/lib/smart-matching';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

const paramsSchema = z.object({ id: z.string().uuid() });

function errorResponse(
  code: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR',
  message: string,
  userMessage: string,
  status: number
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, userMessage } }, { status });
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid notification id',
        '알림 정보를 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    const { id } = parsed.data;
    const success = await markAsRead(id, db, userId);

    if (!success) {
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to mark notification as read',
        '알림을 읽음 처리하지 못했습니다.',
        500
      );
    }

    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error('[API] Notification PATCH error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to mark notification as read',
      '알림을 읽음 처리하지 못했습니다.',
      500
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid notification id',
        '알림 정보를 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    const { id } = parsed.data;
    const success = await deleteNotification(id, db, userId);

    if (!success) {
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to delete notification',
        '알림을 삭제하지 못했습니다.',
        500
      );
    }

    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error('[API] Notification DELETE error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to delete notification',
      '알림을 삭제하지 못했습니다.',
      500
    );
  }
}
