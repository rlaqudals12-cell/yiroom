/**
 * Daily Capsule API
 *
 * POST — Daily Capsule 생성/조회 (날짜 캐싱)
 * @see docs/adr/ADR-073-one-button-daily.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateDailyCapsule, getTodayDailyCapsule } from '@/lib/capsule/daily';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const daily = await generateDailyCapsule(userId);

    return NextResponse.json({
      success: true,
      data: daily,
    });
  } catch (error) {
    console.error('[API] POST /capsule/daily error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const daily = await getTodayDailyCapsule(userId);

    return NextResponse.json({
      success: true,
      data: daily,
    });
  } catch (error) {
    console.error('[API] GET /capsule/daily error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
