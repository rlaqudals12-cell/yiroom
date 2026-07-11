import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateCoachResponse, getUserContext, type CoachMessage } from '@/lib/coach';
import { searchSkinProducts } from '@/lib/coach/skin-rag';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { detectCrisis, CRISIS_RESPONSE_MESSAGE } from '@/lib/safety';
import {
  filterCoachResponse,
  needsDisclaimer,
  COACH_DISCLAIMER,
} from '@/lib/coach/hallucination-filter';

/**
 * AI 웰니스 코치 채팅 API
 *
 * POST /api/coach/chat
 * Body: {
 *   message: string,       // 사용자 메시지 (최대 2000자)
 *   chatHistory?: CoachMessage[] // 이전 대화 기록 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   suggestedQuestions?: string[],
 *   products?: SkinProductMatch[] // 피부 관련 질문 시 제품 추천
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(req, userId);
    if (!rateLimitResult.success) {
      return (
        rateLimitResult.response ??
        NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
      );
    }

    const body = await req.json();
    const { message, chatHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 메시지 길이 제한
    if (message.length > 2000) {
      return NextResponse.json({ error: '메시지가 너무 깁니다 (최대 2000자)' }, { status: 400 });
    }

    // 위기 상황 감지 — 즉시 전문 상담 안내
    if (detectCrisis(message)) {
      return NextResponse.json({
        success: true,
        message: CRISIS_RESPONSE_MESSAGE,
        suggestedQuestions: [],
      });
    }

    // 사용자 컨텍스트 조회
    const userContext = await getUserContext(userId);

    // 피부 관련 질문인지 확인
    const isSkinQuestion = detectSkinQuestion(message);

    // AI 응답 생성 + 피부 관련이면 제품 검색 병렬 실행
    const [response, products] = await Promise.all([
      generateCoachResponse({
        message,
        userContext,
        chatHistory: chatHistory as CoachMessage[] | undefined,
        // 옷장 RAG용 — auth()에서 파생 (클라이언트 본문 신뢰 금지)
        userId,
      }),
      isSkinQuestion ? searchSkinProducts(userContext, message, 3) : Promise.resolve([]),
    ]);

    // 환각/안전성 필터링 — 스트리밍 route(app/api/coach/stream)와 동일 정책 미러링.
    // 미정화 Gemini 출력(치료·100% 효과 등)이 그대로 노출되지 않도록 정화 + 면책 부착
    // (원문 기준으로 판정: sanitize 후에도 트리거 키워드가 남으므로 무해).
    const filterResult = filterCoachResponse(response.message);
    let safeMessage = filterResult.isClean ? response.message : filterResult.sanitizedText;
    if (needsDisclaimer(response.message)) {
      safeMessage += `\n\n${COACH_DISCLAIMER}`;
    }

    return NextResponse.json({
      success: true,
      message: safeMessage,
      suggestedQuestions: response.suggestedQuestions,
      products: products.length > 0 ? products : undefined,
    });
  } catch (error) {
    console.error('[Coach API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

/**
 * 피부 관련 질문 감지
 */
function detectSkinQuestion(message: string): boolean {
  const lowerMsg = message.toLowerCase();

  // 피부 고민 키워드
  const skinKeywords = [
    '피부',
    '스킨케어',
    '보습',
    '건조',
    '지성',
    '트러블',
    '여드름',
    '주름',
    '미백',
    '모공',
    '민감',
    '홍조',
    '잡티',
    '각질',
    '다크서클',
    '세럼',
    '크림',
    '토너',
    '로션',
    '선크림',
    '클렌징',
    '레티놀',
    '비타민',
    '나이아신',
    '히알루론',
    '세라마이드',
  ];

  return skinKeywords.some((kw) => lowerMsg.includes(kw));
}
