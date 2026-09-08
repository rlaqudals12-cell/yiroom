import { COACH_DEADLINE_MS } from '@/lib/coach';
import { z } from 'zod';
import {
  filterCoachResponse,
  needsDisclaimer,
  COACH_DISCLAIMER,
} from '@/lib/coach/hallucination-filter';

// 두 전송 경로가 같은 입력과 안전 계약을 사용해야 검증 우회가 생기지 않는다.
export const coachRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(2000),
    chatHistory: z
      .array(
        z.object({
          id: z.string(),
          role: z.enum(['user', 'assistant']),
          content: z.string().max(2000),
          timestamp: z.coerce.date(),
        })
      )
      .max(100)
      .optional(),
    imageBase64: z.string().startsWith('data:image/').max(6_000_000).optional(),
    sessionId: z.string().uuid().optional(),
    locale: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
  })
  .transform((input) => {
    const history = [...(input.chatHistory ?? [])];
    const last = history.at(-1);
    if (last?.role === 'user' && last.content.trim() === input.message) history.pop();
    return { ...input, chatHistory: input.chatHistory ? history.slice(-5) : undefined };
  });

export function safeCoachMessage(message: string): string {
  const filtered = filterCoachResponse(message);
  const text = filtered.isClean ? message : filtered.sanitizedText;
  return needsDisclaimer(message) && !text.includes(COACH_DISCLAIMER)
    ? `${text}\n\n${COACH_DISCLAIMER}`
    : text;
}

export function coachError(status: number, message: string): Response {
  const errors: Record<number, { code: string; userMessage: string }> = {
    401: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' },
    400: { code: 'VALIDATION_ERROR', userMessage: '입력 정보를 확인해주세요.' },
    500: { code: 'INTERNAL_ERROR', userMessage: '응답을 준비하지 못했어요. 다시 시도해주세요.' },
  };
  return Response.json(
    { success: false, error: { ...(errors[status] ?? errors[500]), message } },
    { status }
  );
}

// 인증 후 컨텍스트·저장·모델을 같은 요청 deadline으로 묶는다.
export function coachDeadline(signal: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(abort, COACH_DEADLINE_MS);
  return {
    controller,
    dispose: () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    },
  };
}

// 선택 데이터와 기록 장애는 상담 응답을 무기한 지연시키지 않는다.
export async function boundedCoachData<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  fallback: T,
  milliseconds = 1000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stop = () => {};
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        stop = () => resolve(fallback);
        timer = setTimeout(stop, milliseconds);
        signal.addEventListener('abort', stop, { once: true });
        if (signal.aborted) stop();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    signal.removeEventListener('abort', stop);
  }
}
