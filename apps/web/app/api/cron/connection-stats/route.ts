import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { redactPii } from '@/lib/utils/redact-pii';
import type { ConnectionStatus } from '@/lib/connection-awareness';

/**
 * ConnectionAwareness 배치 통계 집계
 * POST/GET /api/cron/connection-stats
 *
 * Vercel Cron: 매시간 (0 * * * *)
 * connection_awareness → connection_awareness_stats 물리화
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // 전체 사용자별 상태 카운트 조회
    const { data: rows, error: queryError } = await supabase
      .from('connection_awareness')
      .select('clerk_user_id, status');

    if (queryError) {
      console.error('[CA-Stats Cron] Query error:', queryError);
      return NextResponse.json({ error: 'Failed to query connections' }, { status: 500 });
    }

    // 사용자별 집계
    const userStats = new Map<
      string,
      { total: number; byStatus: Record<ConnectionStatus, number> }
    >();

    for (const row of rows ?? []) {
      const userId = row.clerk_user_id as string;
      const status = row.status as ConnectionStatus;

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          total: 0,
          byStatus: { exposed: 0, recognized: 0, internalized: 0, independent: 0 },
        });
      }

      const stats = userStats.get(userId)!;
      stats.total++;
      if (status in stats.byStatus) {
        stats.byStatus[status]++;
      }
    }

    // 배치 UPSERT
    let upsertCount = 0;
    let errorCount = 0;

    for (const [userId, stats] of userStats) {
      const advanced = stats.byStatus.internalized + stats.byStatus.independent;
      const rate = stats.total > 0 ? advanced / stats.total : 0;

      const { error: upsertError } = await supabase.from('connection_awareness_stats').upsert(
        {
          clerk_user_id: userId,
          total_connections: stats.total,
          exposed_count: stats.byStatus.exposed,
          recognized_count: stats.byStatus.recognized,
          internalized_count: stats.byStatus.internalized,
          independent_count: stats.byStatus.independent,
          internalization_rate: Math.round(rate * 10000) / 10000,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clerk_user_id' }
      );

      if (upsertError) {
        // PII 보호: userId 마스킹 후 로깅
        console.error('[CA-Stats Cron] Upsert error for', redactPii.userId(userId), upsertError);
        errorCount++;
      } else {
        upsertCount++;
      }
    }

    console.info(
      `[CA-Stats Cron] Processed ${userStats.size} users, ${upsertCount} upserted, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      processed: userStats.size,
      upserted: upsertCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('[CA-Stats Cron] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Vercel Cron은 GET도 지원
export async function GET(req: Request): Promise<NextResponse> {
  return POST(req);
}
