/**
 * 피부 전용 RAG 검색
 * @description Phase D - 피부 고민 Q&A + 제품 추천을 위한 RAG 시스템
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';

/** RAG 검색 결과 */
export interface SkinProductMatch {
  id: string;
  name: string;
  brand: string;
  category: string;
  keyIngredients: string[];
  concerns: string[];
  skinTypes: string[];
  price: number | null;
  matchScore: number; // 0-100
  matchReasons: string[];
}

/** 피부 컨텍스트 기반 제품 검색 */
export async function searchSkinProducts(
  userContext: UserContext | null,
  query: string,
  limit = 3
): Promise<SkinProductMatch[]> {
  try {
    const supabase = createClerkSupabaseClient();

    // 사용자 피부 정보 추출
    const skinType = userContext?.skinAnalysis?.skinType;
    const concerns = userContext?.skinAnalysis?.concerns || [];
    const recentCondition = userContext?.skinAnalysis?.recentCondition;

    // 질문에서 성분/고민 키워드 추출
    const queryKeywords = extractSkinKeywords(query);

    // 기본 쿼리
    let dbQuery = supabase
      .from('cosmetic_products')
      .select('id, name, brand, category, key_ingredients, concerns, skin_types, price_krw')
      .eq('is_active', true)
      .limit(limit * 2); // 매칭 점수 계산 후 필터링 위해 여유

    // 피부 타입 필터 (soft filter - contains 사용)
    if (skinType && skinType !== '알 수 없음') {
      dbQuery = dbQuery.contains('skin_types', [skinType]);
    }

    const { data, error } = await dbQuery;

    if (error) {
      coachLogger.error('[SkinRAG] DB query error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 매칭 점수 계산 및 정렬
    const scoredProducts: SkinProductMatch[] = data.map((product) => {
      const productConcerns = (product.concerns as string[]) || [];
      const productIngredients = (product.key_ingredients as string[]) || [];
      const productSkinTypes = (product.skin_types as string[]) || [];

      const { score, reasons } = calculateMatchScore({
        userSkinType: skinType,
        userConcerns: concerns,
        userCondition: recentCondition,
        queryKeywords,
        productSkinTypes,
        productConcerns,
        productIngredients,
      });

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        keyIngredients: productIngredients.slice(0, 5),
        concerns: productConcerns,
        skinTypes: productSkinTypes,
        price: product.price_krw,
        matchScore: score,
        matchReasons: reasons,
      };
    });

    // 매칭 점수 기준 정렬 후 상위 N개 반환
    return scoredProducts.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  } catch (error) {
    coachLogger.error('[SkinRAG] Search error:', error);
    return [];
  }
}

/** 매칭 점수 계산 */
function calculateMatchScore(params: {
  userSkinType?: string;
  userConcerns: string[];
  userCondition?: number;
  queryKeywords: string[];
  productSkinTypes: string[];
  productConcerns: string[];
  productIngredients: string[];
}): { score: number; reasons: string[] } {
  let score = 50; // 기본 점수
  const reasons: string[] = [];

  const {
    userSkinType,
    userConcerns,
    userCondition,
    queryKeywords,
    productSkinTypes,
    productConcerns,
    productIngredients,
  } = params;

  // 1. 피부 타입 매칭 (+20점)
  if (userSkinType && productSkinTypes.some((t) => t.includes(userSkinType))) {
    score += 20;
    reasons.push(`${userSkinType} 피부에 적합`);
  }

  // 2. 고민 매칭 (고민당 +10점, 최대 +30점)
  const matchedConcerns = userConcerns.filter((c) => productConcerns.some((pc) => pc.includes(c)));
  if (matchedConcerns.length > 0) {
    score += Math.min(matchedConcerns.length * 10, 30);
    reasons.push(`${matchedConcerns.join(', ')} 고민 개선`);
  }

  // 3. 질문 키워드 매칭 (+10점)
  const hasKeywordMatch = queryKeywords.some(
    (kw) =>
      productConcerns.some((c) => c.includes(kw)) || productIngredients.some((i) => i.includes(kw))
  );
  if (hasKeywordMatch) {
    score += 10;
    reasons.push('질문 키워드 일치');
  }

  // 4. 컨디션 기반 보정 (컨디션 낮으면 진정/보습 제품 우대)
  if (userCondition && userCondition < 3) {
    const hasCalmingIngredient = productIngredients.some(
      (i) =>
        i.includes('세라마이드') ||
        i.includes('히알루론산') ||
        i.includes('판테놀') ||
        i.includes('알로에')
    );
    if (hasCalmingIngredient) {
      score += 10;
      reasons.push('피부 컨디션 회복에 도움');
    }
  }

  return { score: Math.min(score, 100), reasons };
}

/** 질문에서 피부 관련 키워드 추출 */
function extractSkinKeywords(query: string): string[] {
  const keywords: string[] = [];
  const lowerQuery = query.toLowerCase();

  // 고민 키워드
  const concernKeywords = [
    '건조',
    '지성',
    '트러블',
    '여드름',
    '주름',
    '미백',
    '탄력',
    '모공',
    '민감',
    '홍조',
    '잡티',
    '각질',
    '다크서클',
  ];
  concernKeywords.forEach((kw) => {
    if (lowerQuery.includes(kw)) keywords.push(kw);
  });

  // 성분 키워드
  const ingredientKeywords = [
    '레티놀',
    '비타민c',
    '나이아신아마이드',
    '히알루론산',
    '세라마이드',
    'aha',
    'bha',
    '펩타이드',
    '콜라겐',
  ];
  ingredientKeywords.forEach((kw) => {
    if (lowerQuery.includes(kw)) keywords.push(kw);
  });

  return keywords;
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatSkinProductsForPrompt(products: SkinProductMatch[]): string {
  if (products.length === 0) return '';

  let context = '\n\n## 추천 스킨케어 제품\n';
  products.forEach((p, i) => {
    context += `${i + 1}. ${p.brand} ${p.name} (${p.category})\n`;
    context += `   - 주요 성분: ${p.keyIngredients.join(', ') || '정보 없음'}\n`;
    context += `   - 매칭률: ${p.matchScore}%\n`;
    if (p.matchReasons.length > 0) {
      context += `   - 추천 이유: ${p.matchReasons.join(', ')}\n`;
    }
    if (p.price) {
      context += `   - 가격: ${p.price.toLocaleString()}원\n`;
    }
  });

  return context;
}
