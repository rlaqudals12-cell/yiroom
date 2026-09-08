import { auth } from '@clerk/nextjs/server';
import { getUserContext, generateCoachResponse } from '@/lib/coach';
import { createCoachSession, saveCoachMessage } from '@/lib/coach/history';
import { detectCrisis, CRISIS_RESPONSE_MESSAGE } from '@/lib/safety';
import {
  coachRequestSchema,
  coachError,
  safeCoachMessage,
  coachDeadline,
  boundedCoachData,
} from '../request';

/**
 * AI 호출 라우트는 함수 실행 시간을 명시한다.
 * 코어 deadline 12초 + 인증·파싱·정산 여유를 담지 못하면
 * 우아한 폴백 대신 플랫폼 타임아웃(502/504)이 사용자에게 노출된다.
 */
export const maxDuration = 30;

export async function POST(req: Request) {
  const deadline = coachDeadline(req.signal);
  let cancelled = false;
  try {
    const { userId } = await auth();
    if (!userId) {
      deadline.dispose();
      return coachError(401, 'Unauthorized');
    }
    const parsed = coachRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      deadline.dispose();
      return coachError(400, 'Invalid coach request');
    }
    const { message, chatHistory, imageBase64, locale } = parsed.data;
    const crisis = detectCrisis(message);
    let sessionId: string | null = parsed.data.sessionId ?? null;
    if (!crisis) {
      try {
        if (!sessionId)
          sessionId =
            (
              await boundedCoachData(
                createCoachSession(userId, message),
                deadline.controller.signal,
                null
              )
            )?.id ?? null;
        if (sessionId)
          await boundedCoachData(
            saveCoachMessage(sessionId, 'user', imageBase64 ? `[사진 첨부] ${message}` : message),
            deadline.controller.signal,
            null
          );
      } catch (error) {
        console.error('[Coach Stream] History error:', error);
        sessionId = null;
      }
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: object) => {
          if (!cancelled) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        try {
          const response = crisis
            ? {
                message: CRISIS_RESPONSE_MESSAGE,
                suggestedQuestions: [],
                usedFallback: false,
                confidence: 'normal' as const,
              }
            : await generateCoachResponse({
                message,
                chatHistory,
                imageBase64,
                locale,
                userId,
                signal: deadline.controller.signal,
                userContext: await boundedCoachData(
                  getUserContext(userId),
                  deadline.controller.signal,
                  null
                ),
              });
          // 완성된 본문을 먼저 검증해 위해 문장이 선노출되지 않게 한다.
          const finalText = safeCoachMessage(response.message);
          send({ type: 'chunk', content: finalText });
          if (sessionId) {
            await boundedCoachData(
              saveCoachMessage(
                sessionId,
                'assistant',
                finalText,
                response.suggestedQuestions,
                response
              ),
              deadline.controller.signal,
              null
            ).catch((error) => console.error('[Coach Stream] Message save error:', error));
          }
          send({
            ...response,
            type: 'done',
            message: finalText,
            ...(sessionId ? { sessionId } : {}),
          });
        } catch (error) {
          console.error('[Coach Stream] Error:', error);
          send({ type: 'error', message: '응답 생성 중 오류가 발생했어요.' });
        } finally {
          deadline.dispose();
          if (!cancelled) controller.close();
        }
      },
      cancel() {
        cancelled = true;
        deadline.controller.abort();
        deadline.dispose();
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
    deadline.dispose();
    return coachError(500, 'Failed to start stream');
  }
}
