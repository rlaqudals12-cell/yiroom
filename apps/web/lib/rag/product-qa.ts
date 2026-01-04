/**
 * 제품 Q&A RAG 시스템
 * @description 제품 관련 질문에 AI 기반 답변 제공
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ragLogger } from '@/lib/utils/logger';
import type { AnyProduct, ProductType, CosmeticProduct, SupplementProduct } from '@/types/product';

// =============================================================================
// 상수 정의
// =============================================================================

/** API 타임아웃 (5초 - RAG는 프롬프트가 길어 여유 필요) */
const TIMEOUT_MS = 5000;

/** 최대 재시도 횟수 */
const MAX_RETRIES = 2;

// API 키 검증
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 안전 설정
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

export interface ProductQARequest {
  question: string;
  product: AnyProduct;
  productType: ProductType;
  userContext?: {
    skinType?: string;
    skinConcerns?: string[];
    allergies?: string[];
  };
}

export interface ProductQAResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  relatedTopics?: string[];
  warning?: string;
}

/**
 * 제품 컨텍스트 생성
 */
function buildProductContext(product: AnyProduct, productType: ProductType): string {
  const baseInfo = `
제품명: ${product.name}
브랜드: ${product.brand}
가격: ${product.priceKrw?.toLocaleString() || '정보 없음'}원
`;

  if (productType === 'cosmetic') {
    const cosmetic = product as CosmeticProduct;
    return `${baseInfo}
카테고리: ${cosmetic.category}
주요 성분: ${cosmetic.keyIngredients?.join(', ') || '정보 없음'}
추천 피부타입: ${cosmetic.skinTypes?.join(', ') || '모든 피부'}
피부 고민: ${cosmetic.concerns?.join(', ') || '정보 없음'}
`;
  }

  if (productType === 'supplement') {
    const supplement = product as SupplementProduct;
    const ingredients = supplement.mainIngredients
      ? supplement.mainIngredients.map((i) => (typeof i === 'string' ? i : i.name)).join(', ')
      : '정보 없음';
    return `${baseInfo}
카테고리: ${supplement.category}
주요 성분: ${ingredients}
효능: ${supplement.benefits?.join(', ') || '정보 없음'}
복용법: ${supplement.dosage || '정보 없음'}
대상: ${supplement.targetConcerns?.join(', ') || '정보 없음'}
`;
  }

  return baseInfo;
}

/**
 * Q&A 프롬프트 생성
 */
function buildQAPrompt(request: ProductQARequest): string {
  const productContext = buildProductContext(request.product, request.productType);

  const userContextStr = request.userContext
    ? `
사용자 정보:
- 피부타입: ${request.userContext.skinType || '알 수 없음'}
- 피부고민: ${request.userContext.skinConcerns?.join(', ') || '없음'}
- 알레르기: ${request.userContext.allergies?.join(', ') || '없음'}
`
    : '';

  return `당신은 뷰티/건강 제품 전문 상담사입니다. 사용자의 질문에 친절하고 정확하게 답변해주세요.

## 제품 정보
${productContext}

${userContextStr}

## 사용자 질문
"${request.question}"

## 답변 가이드라인
1. 제품 정보를 바탕으로 정확하게 답변하세요
2. 불확실한 정보는 "확인이 필요합니다"라고 말해주세요
3. 의료적 조언은 피하고, 전문가 상담을 권유하세요
4. 한국어로 자연스럽게 답변하세요
5. 200자 이내로 간결하게 답변하세요

## 응답 형식 (JSON)
{
  "answer": "답변 내용",
  "confidence": "high" | "medium" | "low",
  "relatedTopics": ["관련 주제1", "관련 주제2"],
  "warning": "주의사항 (있는 경우)"
}
`;
}

/**
 * 타임아웃이 있는 Promise 래퍼
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`[RAG] Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Mock 응답 생성 (AI 실패 시 Fallback)
 */
function generateMockQAResponse(question: string): ProductQAResponse {
  // 질문 유형에 따른 기본 응답
  if (question.includes('민감') || question.includes('피부')) {
    return {
      answer:
        '제품 상세 페이지의 성분 정보를 확인해 주세요. 민감성 피부는 패치 테스트 후 사용을 권장합니다.',
      confidence: 'low',
      relatedTopics: ['성분 확인', '패치 테스트'],
    };
  }
  if (question.includes('사용') || question.includes('언제')) {
    return {
      answer: '제품 라벨의 사용법을 참고해 주세요. 일반적으로 아침저녁 세안 후 사용합니다.',
      confidence: 'low',
      relatedTopics: ['사용법', '스킨케어 루틴'],
    };
  }
  return {
    answer:
      '죄송합니다. 해당 질문에 대한 정확한 답변을 제공하기 어렵습니다. 제품 상세 페이지를 참고해 주세요.',
    confidence: 'low',
  };
}

/**
 * 제품 Q&A 답변 생성
 * - 5초 타임아웃 + 2회 재시도 적용
 */
export async function askProductQuestion(request: ProductQARequest): Promise<ProductQAResponse> {
  // Mock 모드 확인
  if (process.env.FORCE_MOCK_AI === 'true') {
    ragLogger.info('[RAG] Using mock (FORCE_MOCK_AI=true)');
    return generateMockQAResponse(request.question);
  }

  if (!genAI) {
    ragLogger.warn('[RAG] Gemini not configured, using mock');
    return generateMockQAResponse(request.question);
  }

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
    safetySettings,
  });

  const prompt = buildQAPrompt(request);

  // 재시도 로직
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 타임아웃 적용
      const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
      const response = result.response;
      const text = response.text();

      // JSON 파싱 시도
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ProductQAResponse;
        ragLogger.info('[RAG] Q&A completed');
        return {
          answer: parsed.answer || '답변을 생성할 수 없습니다.',
          confidence: parsed.confidence || 'medium',
          relatedTopics: parsed.relatedTopics,
          warning: parsed.warning,
        };
      }

      ragLogger.info('[RAG] Q&A completed (text mode)');
      return {
        answer: text.slice(0, 500),
        confidence: 'medium',
      };
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      ragLogger.warn(
        `[RAG] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        error instanceof Error ? error.message : error
      );

      if (isLastAttempt) {
        ragLogger.error('[RAG] All retries failed, using mock');
        return generateMockQAResponse(request.question);
      }

      // 재시도 전 짧은 대기
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 이론적으로 도달 불가능하지만 타입 안전성을 위해
  return generateMockQAResponse(request.question);
}

/**
 * 자주 묻는 질문 템플릿
 */
export const FAQ_TEMPLATES: Record<ProductType, string[]> = {
  cosmetic: [
    '이 제품 민감성 피부에 괜찮아요?',
    '다른 제품이랑 같이 써도 돼요?',
    '아침/저녁 언제 사용하면 좋아요?',
    '얼마나 오래 사용해야 효과가 나타나요?',
  ],
  supplement: [
    '하루에 몇 알 먹어야 해요?',
    '다른 영양제랑 같이 먹어도 돼요?',
    '공복에 먹어도 괜찮아요?',
    '얼마나 오래 복용해야 효과가 있어요?',
  ],
  workout_equipment: [
    '초보자도 사용할 수 있나요?',
    '어떤 운동에 효과적인가요?',
    '하루에 얼마나 사용하면 좋아요?',
    '주의해야 할 점이 있나요?',
  ],
  health_food: [
    '하루에 얼마나 먹으면 좋아요?',
    '다이어트에 도움이 되나요?',
    '보관은 어떻게 해야 하나요?',
    '어떤 사람에게 추천하나요?',
  ],
};
