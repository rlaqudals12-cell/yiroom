/**
 * 제품 Q&A 공용 모듈 (클라이언트 안전)
 *
 * @description 타입 · FAQ 템플릿 · 클라이언트 호출부만 포함한다.
 * 프롬프트/Gemini 로직은 server-only인 product-qa.ts에만 두어 브라우저 번들 노출을 막는다.
 * 클라이언트는 askProductQuestionClient로 서버 라우트(/api/products/qa)를 호출한다.
 */

import type { AnyProduct, ProductType } from '@/types/product';

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
 * 자주 묻는 질문 템플릿
 * (프롬프트가 아니라 사용자에게 보여주는 버튼 문구이므로 클라이언트 안전)
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

/**
 * 제품 Q&A 서버 라우트 호출 (클라이언트 전용 진입점)
 * - 프롬프트는 서버에만 있으므로 클라이언트는 이 함수로 라우트를 호출한다.
 */
export async function askProductQuestionClient(
  request: ProductQARequest
): Promise<ProductQAResponse> {
  const response = await fetch('/api/products/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`제품 Q&A 요청 실패: ${response.status}`);
  }

  return response.json();
}
