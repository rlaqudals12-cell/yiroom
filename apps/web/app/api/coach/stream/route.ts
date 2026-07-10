import { auth } from '@clerk/nextjs/server';
import { getUserContext, generateCoachResponseStream, type CoachMessage } from '@/lib/coach';
import { createCoachSession, saveCoachMessage } from '@/lib/coach/history';
import { detectCrisis, CRISIS_RESPONSE_MESSAGE } from '@/lib/safety';
import {
  filterCoachResponse,
  needsDisclaimer,
  COACH_DISCLAIMER,
} from '@/lib/coach/hallucination-filter';

/**
 * AI 웰니스 코치 스트리밍 API (SSE)
 *
 * POST /api/coach/stream
 * Body: {
 *   message: string,       // 사용자 메시지 (최대 2000자)
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
    const { message, chatHistory, imageBase64, sessionId: clientSessionId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 이미지 검증 — dataURL 형식 + 크기 제한 (base64 ~6MB ≈ 원본 4.5MB)
    if (imageBase64 !== undefined) {
      if (
        typeof imageBase64 !== 'string' ||
        !imageBase64.startsWith('data:image/') ||
        imageBase64.length > 6_000_000
      ) {
        return new Response(
          JSON.stringify({ error: '이미지 형식이 올바르지 않거나 너무 큽니다' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 메시지 길이 제한
    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: '메시지가 너무 깁니다 (최대 2000자)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 위기 상황 감지 — SSE 형식으로 즉시 전문 상담 안내
    if (detectCrisis(message)) {
      const encoder = new TextEncoder();
      const crisisStream = new ReadableStream({
        start(controller) {
          const chunkData = JSON.stringify({ type: 'chunk', content: CRISIS_RESPONSE_MESSAGE });
          controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
          const doneData = JSON.stringify({ type: 'done', suggestedQuestions: [] });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          controller.close();
        },
      });
      return new Response(crisisStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 사용자 컨텍스트 조회
    const userContext = await getUserContext(userId);

    // 대화 저장 — 세션 확보 + 사용자 메시지 기록 (2026-07-08 배선:
    // 테이블·리포지토리·패널 전부 있었지만 라이브 채팅이 호출하지 않던 유령 기능)
    // 저장 실패가 채팅을 깨면 안 되므로 전 과정 방어적.
    let sessionId: string | null = typeof clientSessionId === 'string' ? clientSessionId : null;
    try {
      if (!sessionId) {
        const session = await createCoachSession(userId, message);
        sessionId = session?.id ?? null;
      }
      if (sessionId) {
        await saveCoachMessage(sessionId, 'user', imageBase64 ? `[사진 첨부] ${message}` : message);
      }
    } catch (e) {
      console.error('[Coach Stream] 세션/메시지 저장 실패 (채팅은 계속):', e);
      sessionId = null;
    }

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
            imageBase64,
            // 옷장 RAG용 — auth()에서 파생 (클라이언트 본문 신뢰 금지)
            userId,
          });

          // 청크별 전송 + 전체 텍스트 축적 (환각 필터용)
          let fullText = '';
          for await (const chunk of generator) {
            fullText += chunk;
            const data = JSON.stringify({ type: 'chunk', content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // 환각/안전성 필터링 (전체 텍스트 기반)
          const filterResult = filterCoachResponse(fullText);
          if (!filterResult.isClean) {
            // 위반 발견 시 정화된 텍스트로 교체 이벤트 전송
            const replaceData = JSON.stringify({
              type: 'replace',
              content: filterResult.sanitizedText,
            });
            controller.enqueue(encoder.encode(`data: ${replaceData}\n\n`));
          }

          // 면책 조항 필요 시 추가 청크 전송
          if (needsDisclaimer(fullText)) {
            const disclaimerData = JSON.stringify({
              type: 'chunk',
              content: `\n\n${COACH_DISCLAIMER}`,
            });
            controller.enqueue(encoder.encode(`data: ${disclaimerData}\n\n`));
          }

          // 추천 질문 생성 (전체 응답 기반)
          const suggestedQuestions = generateSuggestedQuestions(message);

          // assistant 메시지 저장 (필터 반영된 최종 텍스트)
          if (sessionId) {
            const finalText = filterResult.isClean ? fullText : filterResult.sanitizedText;
            saveCoachMessage(sessionId, 'assistant', finalText, suggestedQuestions).catch((e) =>
              console.error('[Coach Stream] assistant 저장 실패:', e)
            );
          }

          // 완료 이벤트 전송 — sessionId를 클라에 돌려줘 후속 메시지가 같은 세션에 쌓이게
          const doneData = JSON.stringify({
            type: 'done',
            suggestedQuestions,
            ...(sessionId ? { sessionId } : {}),
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
