/**
 * 제품 Q&A RAG 시스템 (server-only)
 * @description 제품 관련 질문에 AI 기반 답변 제공.
 * 프롬프트 IP가 브라우저 번들에 새지 않도록 server-only로 잠근다.
 * 클라이언트는 @/lib/rag/product-qa-shared의 askProductQuestionClient로 호출한다.
 */

// 서버 전용 가드 — 클라이언트에서 import 시 빌드 에러로 프롬프트 노출을 원천 차단
import 'server-only';

import {
  generateContent,
  isGeminiAvailable,
  HarmCategory,
  HarmBlockThreshold,
} from '@/lib/gemini/client';
import type { GeminiSafetySetting } from '@/lib/gemini/client';
import { ragLogger } from '@/lib/utils/logger';
import type { AnyProduct, ProductType, CosmeticProduct, SupplementProduct } from '@/types/product';
import { extractJsonObject } from '@/lib/utils/json-extract';
import type { ProductQARequest, ProductQAResponse } from './product-qa-shared';

// 공용 타입 재노출 (기존 import 경로 호환)
export type { ProductQARequest, ProductQAResponse } from './product-qa-shared';

// =============================================================================
// 상수 정의
// =============================================================================

/** API 타임아웃 (5초 - RAG는 프롬프트가 길어 여유 필요) */
const TIMEOUT_MS = 5000;

/** 최대 재시도 횟수 */
const MAX_RETRIES = 2;

// 안전 설정
const safetySettings: GeminiSafetySetting[] = [
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
  // Mock 모드 또는 API 키 미설정
  if (!isGeminiAvailable()) {
    ragLogger.info('[RAG] Gemini not available, using mock');
    return generateMockQAResponse(request.question);
  }

  const prompt = buildQAPrompt(request);

  // 재시도 로직
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 타임아웃 적용
      const result = await withTimeout(
        generateContent({
          contents: prompt,
          config: { safetySettings },
        }),
        TIMEOUT_MS
      );
      const text = result.text;

      // JSON 파싱 시도 (문자열 탐색으로 ReDoS 방지)
      const jsonStr = extractJsonObject(text);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr) as ProductQAResponse;
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
