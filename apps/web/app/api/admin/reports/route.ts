/**
 * 관리자 신고 관리 API
 * GET /api/admin/reports - 신고 목록 조회 (필터: status)
 * PATCH /api/admin/reports - 신고 상태 업데이트 (resolve/dismiss)
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { ReportStatus } from '@/lib/feed/types';

const VALID_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed'];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    if (!VALID_STATUSES.includes(status as ReportStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('feed_reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Admin Reports API] GET error:', error);
      return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('[Admin Reports API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, status } = body as {
      reportId: string;
      status: ReportStatus;
    };

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('feed_reports')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('id', reportId);

    if (error) {
      console.error('[Admin Reports API] PATCH error:', error);
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Reports API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
