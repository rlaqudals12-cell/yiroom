import { auth } from '@clerk/nextjs/server';
import { createCoachSession, getCoachSessions, saveCoachMessage } from '@/lib/coach/history';

/**
 * GET /api/coach/sessions
 * 사용자의 채팅 세션 목록 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getCoachSessions(userId);
    return Response.json({ sessions });
  } catch (error) {
    console.error('[Coach Sessions API] GET error:', error);
    return Response.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * POST /api/coach/sessions
 * 새 채팅 세션 생성 및 첫 메시지 저장
 *
 * Body: {
 *   message?: string // 첫 번째 메시지 (세션 제목 생성용)
 * }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    // 세션 생성
    const session = await createCoachSession(userId, message);

    if (!session) {
      return Response.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // 첫 메시지가 있으면 저장
    if (message) {
      await saveCoachMessage(session.id, 'user', message);
    }

    return Response.json({ session });
  } catch (error) {
    console.error('[Coach Sessions API] POST error:', error);
    return Response.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
