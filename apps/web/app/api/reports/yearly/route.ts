import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getYearlyStats } from '@/lib/reports/yearlyAggregator';

/**
 * 연간 통계 조회
 *
 * GET /api/reports/yearly
 * Query: { year?: number }
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || '2025', 10);

    // 연도 유효성 검사
    if (year < 2024 || year > new Date().getFullYear()) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    // 사용자 이름 조회
    const user = await currentUser();
    const userName = user?.firstName || user?.username || '';

    // 연간 통계 조회
    const stats = await getYearlyStats(userId, year);

    return NextResponse.json({
      success: true,
      stats,
      userName,
    });
  } catch (error) {
    console.error('[Yearly Report] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
