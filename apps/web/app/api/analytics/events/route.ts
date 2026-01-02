/**
 * Analytics 이벤트 수집 API
 * POST /api/analytics/events
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
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

    // 사용자 ID 가져오기 (선택적)
    const { userId: clerkUserId } = await auth();

    // 개발 환경 로깅
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

    // DB 저장 (Service Role로 RLS 우회 - 익명 사용자도 저장 가능)
    const supabase = createServiceRoleClient();

    // 이벤트 데이터 변환
    const eventsToInsert = events.map((event) => ({
      clerk_user_id: clerkUserId || null,
      session_id: sessionId,
      event_type: event.eventType,
      event_name: event.eventName,
      event_data: event.eventData || {},
      page_path: event.pagePath || null,
      device_type: deviceType || null,
      browser: browser || null,
      os: os || null,
    }));

    const { error } = await supabase.from('analytics_events').insert(eventsToInsert);

    if (error) {
      // 테이블이 없는 경우 조용히 실패 (개발 환경)
      if (error.code === '42P01') {
        console.warn('[Analytics API] Table analytics_events does not exist');
        return NextResponse.json({
          success: true,
          received: events.length,
          stored: false,
        });
      }
      console.error('[Analytics API] DB insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to store events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      received: events.length,
      stored: true,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
