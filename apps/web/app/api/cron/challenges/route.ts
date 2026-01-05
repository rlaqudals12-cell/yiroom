/**
 * 챌린지 Cron Job API
 * GET /api/cron/challenges
 *
 * 정기적으로 실행되어:
 * 1. 만료된 진행 중 챌린지를 실패 처리
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/challenges",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * 또는 GitHub Actions, 외부 Cron 서비스에서 호출
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { processExpiredChallenges } from '@/lib/challenges';

// Cron 인증 토큰 (환경변수로 설정)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (Vercel Cron 또는 수동 호출 시)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    // CRON_SECRET이 설정된 경우 인증 필요
    if (CRON_SECRET) {
      const token = authHeader?.replace('Bearer ', '') || cronSecret;
      if (token !== CRON_SECRET) {
        console.warn('[Cron] Unauthorized attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Processing expired challenges...');

    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = createServiceRoleClient();

    // 만료된 챌린지 실패 처리
    const failedCount = await processExpiredChallenges(supabase);

    console.log(`[Cron] Processed ${failedCount} expired challenges`);

    return NextResponse.json({
      success: true,
      processed: {
        expired: failedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST도 지원 (일부 Cron 서비스용)
export async function POST(request: NextRequest) {
  return GET(request);
}
