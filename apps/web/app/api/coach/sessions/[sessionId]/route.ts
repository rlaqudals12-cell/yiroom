import { auth } from '@clerk/nextjs/server';
import {
  getSessionMessages,
  saveCoachMessage,
  deleteCoachSession,
  updateSessionCategory,
} from '@/lib/coach/history';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * GET /api/coach/sessions/[sessionId]
 * 특정 세션의 메시지 조회
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const messages = await getSessionMessages(sessionId);

    return Response.json({ messages });
  } catch (error) {
    console.error('[Coach Session API] GET error:', error);
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST /api/coach/sessions/[sessionId]
 * 세션에 메시지 추가
 *
 * Body: {
 *   role: 'user' | 'assistant',
 *   content: string,
 *   suggestedQuestions?: string[]
 * }
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { role, content, suggestedQuestions } = body;

    if (!role || !content) {
      return Response.json({ error: 'Role and content are required' }, { status: 400 });
    }

    const messageId = await saveCoachMessage(sessionId, role, content, suggestedQuestions);

    if (!messageId) {
      return Response.json({ error: 'Failed to save message' }, { status: 500 });
    }

    return Response.json({ messageId });
  } catch (error) {
    console.error('[Coach Session API] POST error:', error);
    return Response.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

/**
 * PATCH /api/coach/sessions/[sessionId]
 * 세션 업데이트 (카테고리 변경 등)
 *
 * Body: {
 *   category?: string
 * }
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { category } = body;

    if (category) {
      await updateSessionCategory(sessionId, category);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Coach Session API] PATCH error:', error);
    return Response.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

/**
 * DELETE /api/coach/sessions/[sessionId]
 * 세션 삭제
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const success = await deleteCoachSession(sessionId);

    if (!success) {
      return Response.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Coach Session API] DELETE error:', error);
    return Response.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
