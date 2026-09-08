import { auth } from '@clerk/nextjs/server';
import { generateCoachResponse, getUserContext } from '@/lib/coach';
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
  try {
    const { userId } = await auth();
    if (!userId) return coachError(401, 'Unauthorized');
    const parsed = coachRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return coachError(400, 'Invalid coach request');
    const { message, chatHistory, imageBase64, locale } = parsed.data;
    const response = detectCrisis(message)
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
    const data = { ...response, message: safeCoachMessage(response.message) };
    // 기존 모바일 최상위 필드와 표준 봉투를 함께 제공한다.
    return Response.json({ success: true, data, ...data });
  } catch (error) {
    console.error('[Coach API] Error:', error);
    return coachError(500, 'Failed to generate response');
  } finally {
    deadline.dispose();
  }
}
