import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/lib/api/notifications';
import type { NotificationSettings } from '@/types/notifications';

/**
 * 알림 설정 API
 * GET: 사용자 알림 설정 조회
 * POST: 알림 설정 저장 (upsert)
 */

// GET: 알림 설정 조회
export async function GET() {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DB에서 설정 조회
    const result = await getUserNotificationSettings(userId);

    if (result.error) {
      console.error('[Notifications API] GET error:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch notification settings', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.settings,
      hasSettings: result.settings !== null,
    });
  } catch (error) {
    console.error('[Notifications API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: 알림 설정 저장
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 필수 필드 검증 (enabled는 반드시 있어야 함)
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing required field: enabled' }, { status: 400 });
    }

    // 기본값과 병합하여 완전한 설정 객체 생성
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...body,
    };

    // DB에 저장
    const result = await saveUserNotificationSettings(userId, settings);

    if (!result.success || result.error) {
      console.error('[Notifications API] POST error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save notification settings', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.settings,
    });
  } catch (error) {
    console.error('[Notifications API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
