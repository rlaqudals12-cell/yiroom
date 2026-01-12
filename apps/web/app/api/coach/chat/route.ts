import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateCoachResponse, getUserContext, type CoachMessage } from '@/lib/coach';
import { searchSkinProducts } from '@/lib/coach/skin-rag';

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
 *   suggestedQuestions?: string[],
 *   products?: SkinProductMatch[] // 피부 관련 질문 시 제품 추천
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
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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
      }),
      isSkinQuestion ? searchSkinProducts(userContext, message, 3) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      message: response.message,
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
