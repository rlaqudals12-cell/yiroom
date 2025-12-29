/**
 * AI 채팅 프롬프트 빌더
 * @description 시스템 프롬프트 및 컨텍스트 구성
 */

import type { ChatContext, ChatMessage } from '@/types/chat';

/**
 * 시스템 프롬프트
 */
export const SYSTEM_PROMPT = `당신은 이룸(Yiroom)의 AI 웰니스 상담사입니다.

## 역할
- 사용자의 피부, 건강, 운동, 영양에 대한 질문에 친절하고 전문적으로 답변
- 사용자의 분석 결과를 참고하여 개인 맞춤형 조언 제공
- 적절한 제품이 있다면 자연스럽게 추천

## 답변 원칙
1. 친근하고 정중한 존댓말 사용
2. 의학적 진단이나 처방은 절대 하지 않음
3. "~일 수 있어요", "~를 권장드려요" 등 부드러운 표현 사용
4. 확실하지 않은 정보는 "전문가 상담을 권장드려요"로 안내
5. 답변은 간결하게 (200자 내외), 필요시 항목별 정리

## 제품 추천 시
- 사용자의 분석 결과와 연관된 제품만 추천
- 추천 이유를 간단히 설명
- [PRODUCT:product_id:product_name:reason] 형식으로 표시

## 금지 사항
- 의료 진단 및 처방
- 경쟁 서비스 언급
- 부정적이거나 불안을 조성하는 표현
- 개인정보 요청`;

/**
 * 사용자 컨텍스트 프롬프트 생성
 */
export function buildContextPrompt(context: ChatContext): string {
  const sections: string[] = [];

  sections.push('## 사용자 분석 결과\n');

  // 피부 분석
  if (context.skinAnalysis) {
    const skin = context.skinAnalysis;
    sections.push(`### 피부 분석 (${skin.analyzedAt})
- 피부 타입: ${skin.skinType}
- 수분도: ${skin.moisture}%${skin.moisture < 50 ? ' (낮음)' : ''}
- 주요 고민: ${skin.concerns.join(', ')}
- 추천 성분: ${skin.recommendedIngredients.join(', ')}`);
  }

  // 퍼스널컬러
  if (context.personalColor) {
    const pc = context.personalColor;
    sections.push(`### 퍼스널컬러
- 시즌: ${pc.season} ${pc.tone}
- 베스트 컬러: ${pc.bestColors.join(', ')}
- 피해야 할 컬러: ${pc.worstColors.join(', ')}`);
  }

  // 체형 분석
  if (context.bodyAnalysis) {
    const body = context.bodyAnalysis;
    sections.push(`### 체형 분석 (${body.analyzedAt})
- 체형: ${body.bodyType}
- BMI: ${body.bmi}
- 근육 밸런스: ${body.muscleBalance}`);
  }

  // 운동 계획
  if (context.workoutPlan) {
    const workout = context.workoutPlan;
    sections.push(`### 운동 계획
- 목표: ${workout.goal}
- 레벨: ${workout.level}
- 주 ${workout.frequency}회`);
  }

  // 영양 목표
  if (context.nutritionGoals) {
    const nutrition = context.nutritionGoals;
    sections.push(`### 영양 목표
- 일일 칼로리: ${nutrition.dailyCalories}kcal
- 단백질 목표: ${nutrition.proteinTarget}g`);
  }

  // 최근 관심 제품
  if (context.recentProducts && context.recentProducts.length > 0) {
    const products = context.recentProducts.slice(0, 5);
    sections.push(`### 최근 관심 제품
${products.map((p) => `- ${p.name} (${p.category})`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * 대화 히스토리 프롬프트 생성
 */
export function buildHistoryPrompt(messages: ChatMessage[], maxMessages = 10): string {
  const recent = messages.slice(-maxMessages);

  if (recent.length === 0) {
    return '';
  }

  const history = recent
    .map((msg) => {
      const role = msg.role === 'user' ? '사용자' : 'AI';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');

  return `## 이전 대화\n${history}`;
}

/**
 * 전체 프롬프트 조합
 */
export function buildFullPrompt(
  userMessage: string,
  context: ChatContext,
  history: ChatMessage[]
): string {
  const parts: string[] = [SYSTEM_PROMPT];

  // 사용자 컨텍스트 추가
  const contextPrompt = buildContextPrompt(context);
  if (contextPrompt.length > 50) {
    // 최소 내용이 있을 때만
    parts.push(contextPrompt);
  }

  // 대화 히스토리 추가
  const historyPrompt = buildHistoryPrompt(history);
  if (historyPrompt) {
    parts.push(historyPrompt);
  }

  // 현재 질문
  parts.push(`## 현재 질문\n사용자: ${userMessage}`);

  return parts.join('\n\n---\n\n');
}

/**
 * 제품 추천 파싱
 * [PRODUCT:product_id:product_name:reason] 형식 파싱
 */
export function parseProductRecommendations(
  response: string
): { cleanedResponse: string; products: Array<{ productId: string; productName: string; reason: string }> } {
  const productPattern = /\[PRODUCT:([^:]+):([^:]+):([^\]]+)\]/g;
  const products: Array<{ productId: string; productName: string; reason: string }> = [];

  let match;
  while ((match = productPattern.exec(response)) !== null) {
    products.push({
      productId: match[1],
      productName: match[2],
      reason: match[3],
    });
  }

  // 태그 제거
  const cleanedResponse = response.replace(productPattern, '').trim();

  return { cleanedResponse, products };
}
