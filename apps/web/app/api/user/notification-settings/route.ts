/**
 * 알림 설정 API
 * GET: 사용자 알림 설정 조회
 * POST: 사용자 알림 설정 저장 (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserNotificationSettings, saveUserNotificationSettings } from '@/lib/api/notifications';
import type { NotificationSettings } from '@/types/notifications';

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
