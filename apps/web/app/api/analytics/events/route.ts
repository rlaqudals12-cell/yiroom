/**
 * Analytics 이벤트 수집 API
 * POST /api/analytics/events
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsEventInput } from '@/types/analytics';

interface EventsPayload {
  sessionId: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  events: AnalyticsEventInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventsPayload;

    const { sessionId, deviceType, browser, os, events } = body;

    // 필수 필드 검증
    if (!sessionId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: 'sessionId and events are required' },
        { status: 400 }
      );
    }

    // 이벤트 개수 제한
    if (events.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Too many events (max 100)' },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 저장 구현
    // const supabase = createClerkSupabaseClient();
    // await supabase.from('analytics_events').insert(...)

    // 현재는 로깅만
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics API] Received events:', {
        sessionId,
        deviceType,
        browser,
        os,
        eventCount: events.length,
        events: events.map((e) => ({ type: e.eventType, name: e.eventName })),
      });
    }

    return NextResponse.json({
      success: true,
      received: events.length,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
