/**
 * Phase D: 피부 상담 SSE 스트리밍 API
 *
 * S-1 분석 결과를 컨텍스트로 활용하여 피부 상담 응답 생성
 * SSE(Server-Sent Events)를 통해 실시간 스트리밍 응답 제공
 */

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  generateConsultationResponse,
  MOCK_PRODUCT_RECOMMENDATIONS,
} from '@/lib/mock/skin-consultation';
import type { SkinConcern, ProductRecommendation } from '@/types/skin-consultation';

// 요청 스키마
const requestSchema = z.object({
  message: z.string().min(1).max(500),
  skinAnalysisId: z.string().optional(),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(10)
    .optional(),
});

// Gemini 클라이언트
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 타임아웃 설정
const AI_TIMEOUT_MS = 3000;
const MAX_RETRIES = 2;

/**
 * S-1 분석 결과 조회
 */
async function fetchSkinAnalysis(userId: string, analysisId?: string): Promise<{
  skinType: string;
  hydration: number;
  oilLevel: number;
  sensitivity: number;
  concerns: string[];
} | null> {
  try {
    const supabase = createClerkSupabaseClient();

    let query = supabase
      .from('skin_analyses')
      .select('skin_type, hydration, oil_level, sensitivity, recommendations')
      .eq('clerk_user_id', userId);

    if (analysisId) {
      query = query.eq('id', analysisId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    // 고민 영역 추출 (점수가 낮은 항목)
    const concerns: string[] = [];
    if (data.hydration < 50) concerns.push('건조함');
    if (data.oil_level > 60) concerns.push('유분 과다');
    if (data.sensitivity > 60) concerns.push('민감성');

    return {
      skinType: data.skin_type,
      hydration: data.hydration,
      oilLevel: data.oil_level,
      sensitivity: data.sensitivity,
      concerns,
    };
  } catch (error) {
    console.error('[Consultation] 분석 결과 조회 실패:', error);
    return null;
  }
}

/**
 * 피부 고민 감지
 */
function detectConcern(message: string): SkinConcern {
  const concernKeywords: Record<SkinConcern, string[]> = {
    dryness: ['건조', '당김', '각질', '수분'],
    oiliness: ['유분', '피지', '번들', '기름'],
    acne: ['트러블', '여드름', '뾰루지'],
    wrinkles: ['주름', '잔주름', '탄력', '노화'],
    pigmentation: ['잡티', '기미', '색소', '칙칙'],
    sensitivity: ['민감', '자극', '홍조', '따가'],
    pores: ['모공', '블랙헤드'],
    general: [],
  };

  for (const [concern, keywords] of Object.entries(concernKeywords)) {
    if (keywords.some((keyword) => message.includes(keyword))) {
      return concern as SkinConcern;
    }
  }

  return 'general';
}

/**
 * 프롬프트 생성 (S-1 컨텍스트 주입)
 */
function buildPrompt(
  message: string,
  skinAnalysis: {
    skinType: string;
    hydration: number;
    oilLevel: number;
    sensitivity: number;
    concerns: string[];
  } | null,
  chatHistory?: Array<{ role: string; content: string }>
): string {
  const contextLines = [];

  if (skinAnalysis) {
    contextLines.push(`[사용자 피부 분석 결과]`);
    contextLines.push(`- 피부 타입: ${skinAnalysis.skinType}`);
    contextLines.push(`- 수분도: ${skinAnalysis.hydration}점`);
    contextLines.push(`- 유분도: ${skinAnalysis.oilLevel}점`);
    contextLines.push(`- 민감도: ${skinAnalysis.sensitivity}점`);
    if (skinAnalysis.concerns.length > 0) {
      contextLines.push(`- 주요 고민: ${skinAnalysis.concerns.join(', ')}`);
    }
    contextLines.push('');
  }

  // 최근 대화 히스토리 (최대 5개)
  if (chatHistory && chatHistory.length > 0) {
    contextLines.push(`[이전 대화]`);
    chatHistory.slice(-5).forEach((msg) => {
      const role = msg.role === 'user' ? '사용자' : 'AI';
      contextLines.push(`${role}: ${msg.content}`);
    });
    contextLines.push('');
  }

  return `당신은 친절한 피부 상담 AI 전문가입니다. 사용자의 피부 분석 결과를 참고하여 맞춤형 조언을 제공합니다.

${contextLines.join('\n')}

[지침]
1. 사용자의 피부 타입과 고민에 맞는 조언을 제공하세요.
2. 추천 성분이나 제품 카테고리를 언급하세요.
3. 실천 가능한 구체적인 팁을 1-2개 포함하세요.
4. 답변은 친근하고 공감하는 톤으로 작성하세요.
5. 답변은 150자 이내로 간결하게 작성하세요.
6. 의료 진단이나 처방은 피하세요.

사용자 질문: ${message}

답변:`;
}

/**
 * Gemini 스트리밍 호출
 */
async function* streamGeminiResponse(prompt: string): AsyncGenerator<string, void, unknown> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

/**
 * Mock 응답 생성 (폴백)
 */
function generateMockStreamResponse(message: string, skinType?: string): {
  content: string;
  products: ProductRecommendation[];
} {
  const concern = detectConcern(message);
  const mockResponse = generateConsultationResponse(concern, skinType);

  return {
    content: mockResponse.message,
    products: mockResponse.products,
  };
}

/**
 * POST /api/analyze/skin/consultation
 *
 * 피부 상담 SSE 스트리밍 API
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 요청 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, skinAnalysisId, chatHistory } = validated.data;

    // 3. S-1 분석 결과 조회
    const skinAnalysis = await fetchSkinAnalysis(userId, skinAnalysisId);

    // 4. 고민 감지
    const concern = detectConcern(message);

    // 5. SSE 스트림 생성
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let usedFallback = false;
        let accumulatedContent = '';

        try {
          // Gemini 스트리밍 시도
          const prompt = buildPrompt(message, skinAnalysis, chatHistory);

          // 타임아웃 래퍼
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS);
          });

          const streamPromise = (async () => {
            for await (const chunk of streamGeminiResponse(prompt)) {
              accumulatedContent += chunk;
              const data = JSON.stringify({ type: 'chunk', content: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          })();

          await Promise.race([streamPromise, timeoutPromise]);
        } catch (error) {
          console.error('[Consultation] Gemini 스트리밍 실패:', error);
          usedFallback = true;

          // Mock 폴백
          const mockResponse = generateMockStreamResponse(message, skinAnalysis?.skinType);
          accumulatedContent = mockResponse.content;

          // Mock 응답을 청크로 전송 (실시간 효과)
          const words = mockResponse.content.split(' ');
          for (const word of words) {
            const chunk = word + ' ';
            const data = JSON.stringify({ type: 'chunk', content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
        }

        // 완료 이벤트 (제품 추천 포함)
        const products = MOCK_PRODUCT_RECOMMENDATIONS[concern] || [];
        const suggestedQuestions = [
          concern === 'dryness' ? '보습 루틴 알려줘' : '피부 관리 루틴 알려줘',
          '추천 성분 더 알려줘',
          '주의해야 할 성분이 있어?',
        ];

        const doneData = JSON.stringify({
          type: 'done',
          usedFallback,
          products,
          suggestedQuestions,
        });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        controller.close();
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
    console.error('[Consultation] API 에러:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'Internal server error' },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
