/**
 * 알림 설정 API
 * GET: 사용자 알림 설정 조회
 * POST: 사용자 알림 설정 저장 (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  getUserNotificationSettings,
  patchUserNotificationSettings,
  saveUserNotificationSettings,
} from '@/lib/api/notifications';
import type { NotificationSettings } from '@/types/notifications';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const notificationPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    workoutReminder: z.boolean().optional(),
    workoutReminderTime: timeSchema.optional(),
    streakWarning: z.boolean().optional(),
    nutritionReminder: z.boolean().optional(),
    mealReminderBreakfast: timeSchema.optional(),
    mealReminderLunch: timeSchema.optional(),
    mealReminderDinner: timeSchema.optional(),
    waterReminder: z.boolean().optional(),
    waterReminderInterval: z.number().int().min(1).max(4).optional(),
    socialNotifications: z.boolean().optional(),
    achievementNotifications: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length === 1, '한 번에 한 설정만 변경할 수 있습니다.');

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getUserNotificationSettings(userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: result.settings,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as NotificationSettings;

  const result = await saveUserNotificationSettings(userId, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: result.settings,
  });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          userMessage: '로그인이 필요합니다.',
        },
      },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = notificationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.message,
          userMessage: '알림 설정 값을 확인해 주세요.',
        },
      },
      { status: 400 }
    );
  }

  const result = await patchUserNotificationSettings(userId, parsed.data);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: result.error ?? 'Failed to save notification settings',
          userMessage: '알림 설정을 저장하지 못했습니다. 다시 시도해 주세요.',
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: result.settings });
}
