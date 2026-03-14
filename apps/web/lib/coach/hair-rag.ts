/**
 * 헤어 전용 RAG 검색
 * @description 헤어/두피 고민 Q&A + 제품 추천을 위한 RAG 시스템
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';

/** RAG 검색 결과 */
export interface HairProductMatch {
  id: string;
  name: string;
  brand: string;
  category: string;
  keyIngredients: string[];
  concerns: string[];
  price: number | null;
  matchScore: number;
  matchReasons: string[];
}

/** 헤어 컨텍스트 기반 제품 검색 */
export async function searchHairProducts(
  userContext: UserContext | null,
  query: string,
  limit = 3
): Promise<HairProductMatch[]> {
  try {
    const supabase = createClerkSupabaseClient();

    // 사용자 헤어 정보 추출
    const hairType = userContext?.hairAnalysis?.hairType;
    const scalpType = userContext?.hairAnalysis?.scalpType;
    const concerns = userContext?.hairAnalysis?.concerns || [];

    // 질문에서 헤어 키워드 추출
    const queryKeywords = extractHairKeywords(query);

    // cosmetic_products에서 헤어 관련 제품 검색
    // category 필터 대신 concerns/key_ingredients에 헤어 관련 키워드가 있는 제품
    const { data, error } = await supabase
      .from('cosmetic_products')
      .select('id, name, brand, category, key_ingredients, concerns, skin_types, price_krw')
      .eq('is_active', true)
      .limit(limit * 3);

    if (error) {
      coachLogger.error('[HairRAG] DB query error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 헤어 관련 제품 필터링 + 매칭 점수 계산
    const scoredProducts: HairProductMatch[] = data
      .map((product) => {
        const productConcerns = (product.concerns as string[]) || [];
        const productIngredients = (product.key_ingredients as string[]) || [];

        const { score, reasons } = calculateHairMatchScore({
          hairType,
          scalpType,
          userConcerns: concerns,
          queryKeywords,
          productConcerns,
          productIngredients,
          productCategory: product.category,
        });

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          keyIngredients: productIngredients.slice(0, 5),
          concerns: productConcerns,
          price: product.price_krw,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      // 헤어 관련성 있는 제품만 (점수 40 이상)
      .filter((p) => p.matchScore >= 40);

    return scoredProducts.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  } catch (error) {
    coachLogger.error('[HairRAG] Search error:', error);
    return [];
  }
}

/** 매칭 점수 계산 */
function calculateHairMatchScore(params: {
  hairType?: string;
  scalpType?: string;
  userConcerns: string[];
  queryKeywords: string[];
  productConcerns: string[];
  productIngredients: string[];
  productCategory: string;
}): { score: number; reasons: string[] } {
  let score = 30; // 기본 점수
  const reasons: string[] = [];

  const { hairType, scalpType, userConcerns, queryKeywords, productConcerns, productIngredients } =
    params;

  // 1. 헤어/두피 관련 제품인지 (+20점)
  const hairRelatedTerms = ['샴푸', '컨디셔너', '트리트먼트', '헤어', '두피', '탈모', '모발'];
  const isHairProduct =
    hairRelatedTerms.some((t) => productConcerns.some((c) => c.includes(t))) ||
    hairRelatedTerms.some((t) => productIngredients.some((i) => i.includes(t)));

  if (isHairProduct) {
    score += 20;
    reasons.push('헤어 전용 제품');
  }

  // 1-1. 모발 타입 매칭 (+10점)
  if (hairType && productConcerns.some((c) => c.includes(hairType))) {
    score += 10;
    reasons.push(`${hairType} 모발에 적합`);
  }

  // 2. 두피 타입 매칭 (+15점)
  if (scalpType && productConcerns.some((c) => c.includes(scalpType))) {
    score += 15;
    reasons.push(`${scalpType} 두피에 적합`);
  }

  // 3. 모발 고민 매칭 (고민당 +10점, 최대 +30점)
  const matchedConcerns = userConcerns.filter((c) => productConcerns.some((pc) => pc.includes(c)));
  if (matchedConcerns.length > 0) {
    score += Math.min(matchedConcerns.length * 10, 30);
    reasons.push(`${matchedConcerns.join(', ')} 개선`);
  }

  // 4. 질문 키워드 매칭 (+10점)
  const hasKeywordMatch = queryKeywords.some(
    (kw) =>
      productConcerns.some((c) => c.includes(kw)) || productIngredients.some((i) => i.includes(kw))
  );
  if (hasKeywordMatch) {
    score += 10;
    reasons.push('질문 키워드 일치');
  }

  return { score: Math.min(score, 100), reasons };
}

/** 질문에서 헤어 관련 키워드 추출 */
function extractHairKeywords(query: string): string[] {
  const keywords: string[] = [];
  const lowerQuery = query.toLowerCase();

  const hairKeywords = [
    '탈모',
    '두피',
    '비듬',
    '각질',
    '건조',
    '지성',
    '가려움',
    '모발',
    '머릿결',
    '손상모',
    '염색',
    '펌',
    '볼륨',
    '샴푸',
    '컨디셔너',
    '트리트먼트',
    '헤어팩',
    '두피케어',
    '비오틴',
    '케라틴',
    '판테놀',
    '카페인',
  ];

  hairKeywords.forEach((kw) => {
    if (lowerQuery.includes(kw)) keywords.push(kw);
  });

  return keywords;
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatHairProductsForPrompt(products: HairProductMatch[]): string {
  if (products.length === 0) return '';

  let context = '\n\n## 추천 헤어케어 제품\n';
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
