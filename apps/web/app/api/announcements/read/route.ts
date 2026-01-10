/**
 * 공지사항 읽음 표시 API
 * POST /api/announcements/read
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markAnnouncementAsRead } from '@/lib/api/announcements';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId || typeof announcementId !== 'string') {
      return NextResponse.json({ error: 'announcementId is required' }, { status: 400 });
    }

    const success = await markAnnouncementAsRead(announcementId, userId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] announcements/read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
