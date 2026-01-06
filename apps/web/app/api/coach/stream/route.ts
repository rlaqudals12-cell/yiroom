import { auth } from '@clerk/nextjs/server';
import { getUserContext, generateCoachResponseStream, type CoachMessage } from '@/lib/coach';

/**
 * AI 웰니스 코치 스트리밍 API (SSE)
 *
 * POST /api/coach/stream
 * Body: {
 *   message: string,       // 사용자 메시지
 *   chatHistory?: CoachMessage[] // 이전 대화 기록 (선택)
 * }
 *
 * SSE Response:
 *   data: {"type": "chunk", "content": "텍스트"}
 *   data: {"type": "done", "suggestedQuestions": ["질문1", "질문2"]}
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { message, chatHistory } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 컨텍스트 조회
    const userContext = await getUserContext(userId);

    // SSE 스트림 생성
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 스트리밍 응답 생성
          const generator = generateCoachResponseStream({
            message,
            userContext,
            chatHistory: chatHistory as CoachMessage[] | undefined,
          });

          // 청크별 전송
          for await (const chunk of generator) {
            const data = JSON.stringify({ type: 'chunk', content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // 추천 질문 생성 (전체 응답 기반)
          const suggestedQuestions = generateSuggestedQuestions(message);

          // 완료 이벤트 전송
          const doneData = JSON.stringify({
            type: 'done',
            suggestedQuestions,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          controller.close();
        } catch (error) {
          console.error('[Coach Stream] Error:', error);

          // 에러 이벤트 전송
          const errorData = JSON.stringify({
            type: 'error',
            message: '응답 생성 중 오류가 발생했어요.',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Coach Stream API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to start stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * 추천 질문 생성 (간소화 버전)
 */
function generateSuggestedQuestions(currentQuestion: string): string[] {
  const lowerQ = currentQuestion.toLowerCase();

  // 카테고리별 기본 추천 질문
  if (
    lowerQ.includes('운동') ||
    lowerQ.includes('헬스') ||
    lowerQ.includes('근육') ||
    lowerQ.includes('스트레칭')
  ) {
    return [
      '운동 후에 뭘 먹으면 좋아요?',
      '집에서 할 수 있는 운동 추천해요',
      '근육통이 있을 때 어떻게 해요?',
    ];
  }

  if (
    lowerQ.includes('먹') ||
    lowerQ.includes('음식') ||
    lowerQ.includes('칼로리') ||
    lowerQ.includes('다이어트') ||
    lowerQ.includes('단백질')
  ) {
    return [
      '하루에 물 얼마나 마셔야 해요?',
      '단백질 얼마나 먹어야 해요?',
      '야식이 당길 땐 어떡해요?',
    ];
  }

  if (
    lowerQ.includes('피부') ||
    lowerQ.includes('화장품') ||
    lowerQ.includes('스킨케어') ||
    lowerQ.includes('보습')
  ) {
    return ['스킨케어 루틴 추천해줘', '선크림 꼭 발라야 해요?', '트러블 났을 때 어떻게 해요?'];
  }

  // 기본 추천 질문
  return ['오늘 운동 뭐하면 좋을까요?', '건강한 간식 추천해줘', '수면의 질을 높이려면?'];
}
