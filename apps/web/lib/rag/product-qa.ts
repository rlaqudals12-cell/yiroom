/**
 * 제품 Q&A RAG 시스템
 * @description 제품 관련 질문에 AI 기반 답변 제공
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ragLogger } from '@/lib/utils/logger';
import type { AnyProduct, ProductType, CosmeticProduct, SupplementProduct } from '@/types/product';

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
 * 제품 Q&A 답변 생성
 */
export async function askProductQuestion(request: ProductQARequest): Promise<ProductQAResponse> {
  if (!genAI) {
    return {
      answer: '죄송합니다. 현재 AI 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      confidence: 'low',
    };
  }

  try {
    // 2025-12-22: Gemini 3 Flash로 통일 (무료 티어 + 성능 향상)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      safetySettings,
    });

    const prompt = buildQAPrompt(request);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // JSON 파싱 시도
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ProductQAResponse;
        return {
          answer: parsed.answer || '답변을 생성할 수 없습니다.',
          confidence: parsed.confidence || 'medium',
          relatedTopics: parsed.relatedTopics,
          warning: parsed.warning,
        };
      }
    } catch {
      // JSON 파싱 실패 시 텍스트 그대로 반환
    }

    return {
      answer: text.slice(0, 500),
      confidence: 'medium',
    };
  } catch (error) {
    ragLogger.error('Product Q&A 오류:', error);
    return {
      answer: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.',
      confidence: 'low',
    };
  }
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
