import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateCoachResponse, getUserContext, type CoachMessage } from '@/lib/coach';

/**
 * AI 웰니스 코치 채팅 API
 *
 * POST /api/coach/chat
 * Body: {
 *   message: string,       // 사용자 메시지
 *   chatHistory?: CoachMessage[] // 이전 대화 기록 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   suggestedQuestions?: string[]
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, chatHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 사용자 컨텍스트 조회
    const userContext = await getUserContext(userId);

    // AI 응답 생성
    const response = await generateCoachResponse({
      message,
      userContext,
      chatHistory: chatHistory as CoachMessage[] | undefined,
    });

    return NextResponse.json({
      success: true,
      message: response.message,
      suggestedQuestions: response.suggestedQuestions,
    });
  } catch (error) {
    console.error('[Coach API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
