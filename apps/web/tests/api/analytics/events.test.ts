/**
 * Analytics 이벤트 수집 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/analytics/events/route';
import { NextRequest } from 'next/server';

describe('POST /api/analytics/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이벤트를 성공적으로 수신한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_test123',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        events: [
          {
            eventType: 'page_view',
            eventName: 'Page View: /dashboard',
            eventData: { duration: 45 },
            pagePath: '/dashboard',
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.received).toBe(1);
  });

  it('여러 이벤트를 한 번에 수신한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_test123',
        events: [
          { eventType: 'page_view', eventName: 'Page 1', pagePath: '/page1' },
          { eventType: 'page_view', eventName: 'Page 2', pagePath: '/page2' },
          { eventType: 'button_click', eventName: 'Button Click', eventData: { buttonId: 'btn1' } },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.received).toBe(3);
  });

  it('sessionId가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        events: [{ eventType: 'page_view', eventName: 'Test' }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('sessionId');
  });

  it('events가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_test123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('events');
  });

  it('events가 배열이 아니면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_test123',
        events: 'not an array',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('이벤트가 100개를 초과하면 400 에러를 반환한다', async () => {
    const manyEvents = Array.from({ length: 101 }, (_, i) => ({
      eventType: 'page_view',
      eventName: `Event ${i}`,
    }));

    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_test123',
        events: manyEvents,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Too many events');
  });

  it('디바이스 정보를 함께 수신한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_test123',
        deviceType: 'mobile',
        browser: 'Safari',
        os: 'iOS',
        events: [{ eventType: 'page_view', eventName: 'Mobile Page View' }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
