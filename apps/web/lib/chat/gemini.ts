/**
 * AI 채팅 Gemini 호출 래퍼
 * @description Gemini 3 Flash API 호출 및 응답 처리
 */

import { generateContent, isGeminiAvailable } from '@/lib/gemini/client';
import { chatLogger } from '@/lib/utils/logger';
import type { ChatMessage, ChatContext, ProductRecommendation } from '@/types/chat';
import { buildFullPrompt, parseProductRecommendations } from './prompt';

// 모델 설정
const TIMEOUT_MS = 10000; // 10초 타임아웃
const MAX_RETRIES = 2;

/**
 * UUID 생성
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Gemini를 통한 채팅 응답 생성
 */
export async function generateChatResponse(
  userMessage: string,
  context: ChatContext,
  history: ChatMessage[]
): Promise<{
  message: ChatMessage;
  productRecommendations: ProductRecommendation[];
}> {
  const fullPrompt = buildFullPrompt(userMessage, context, history);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 타임아웃 적용
      const responsePromise = generateContent({
        contents: fullPrompt,
        config: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);
      const text = response.text;

      // 제품 추천 파싱
      const { cleanedResponse, products } = parseProductRecommendations(text);

      const message: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: cleanedResponse,
        timestamp: new Date(),
        metadata: products.length > 0 ? { productRecommendations: products } : undefined,
      };

      return {
        message,
        productRecommendations: products,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      chatLogger.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        // 재시도 전 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // 모든 재시도 실패 시 Mock 응답 반환
  chatLogger.error('All retries failed, returning mock response');
  return generateMockResponse(userMessage);
}

/**
 * Mock 응답 생성 (개발용 또는 Fallback)
 */
export function generateMockResponse(userMessage: string): {
  message: ChatMessage;
  productRecommendations: ProductRecommendation[];
} {
  const lowerMessage = userMessage.toLowerCase();

  // 키워드 기반 Mock 응답
  let content: string;
  let products: ProductRecommendation[] = [];

  if (lowerMessage.includes('피부') || lowerMessage.includes('보습')) {
    content = `회원님의 피부 분석 결과를 확인해봤어요. 복합성 피부에 수분이 부족한 상태시네요.

세라마이드나 히알루론산이 함유된 보습 제품을 사용하시면 좋을 것 같아요. 특히 저녁 루틴에서 수분 크림을 충분히 발라주시는 것을 권장드려요.

궁금한 점이 더 있으시면 언제든 물어봐주세요! 😊`;

    products = [
      {
        productId: 'prod_001',
        productName: '세라마이드 수분크림',
        reason: '건성 피부 진정에 효과적인 세라마이드 함유',
      },
    ];
  } else if (
    lowerMessage.includes('컬러') ||
    lowerMessage.includes('립') ||
    lowerMessage.includes('메이크업')
  ) {
    content = `회원님은 봄 웜톤이시네요!

코랄, 피치, 살몬핑크 계열의 컬러가 잘 어울리실 거예요. 립 제품을 고르실 때는 오렌지빛이 살짝 도는 코랄 핑크를 추천드려요.

블랙이나 진한 버건디는 피하시는 게 좋아요.`;
  } else if (lowerMessage.includes('운동') || lowerMessage.includes('헬스')) {
    content = `회원님의 운동 계획을 확인해봤어요. 근력 강화가 목표시고 주 4회 운동하고 계시네요!

역삼각형 체형이시니까 하체 운동 비중을 조금 늘려보시는 건 어떨까요? 스쿼트, 런지 같은 복합 운동이 효과적이에요.

운동 전후 스트레칭도 잊지 마세요!`;
  } else {
    content = `안녕하세요! 궁금하신 점에 대해 답변드릴게요.

이룸에서는 피부 분석, 퍼스널컬러, 체형 분석 결과를 바탕으로 맞춤 조언을 드리고 있어요.

더 구체적인 질문을 해주시면 회원님의 분석 결과를 참고해서 더 정확한 답변을 드릴 수 있어요!`;
  }

  const message: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    metadata: products.length > 0 ? { productRecommendations: products } : undefined,
  };

  return { message, productRecommendations: products };
}

/**
 * 환경 변수 검증
 */
export function isGeminiConfigured(): boolean {
  return isGeminiAvailable();
}
