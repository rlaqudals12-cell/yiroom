/**
 * 메이크업 전용 RAG 검색
 * @description 메이크업 추천 Q&A + 제품 추천을 위한 RAG 시스템
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';

/** RAG 검색 결과 */
export interface MakeupProductMatch {
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

/** 메이크업 컨텍스트 기반 제품 검색 */
export async function searchMakeupProducts(
  userContext: UserContext | null,
  query: string,
  limit = 3
): Promise<MakeupProductMatch[]> {
  try {
    const supabase = createClerkSupabaseClient();

    // 사용자 메이크업/퍼스널컬러 정보 추출
    const undertone = userContext?.makeupAnalysis?.undertone;
    const faceShape = userContext?.makeupAnalysis?.faceShape;
    const season = userContext?.personalColor?.season;
    const recommendedStyles = userContext?.makeupAnalysis?.recommendedStyles || [];

    // 질문에서 메이크업 키워드 추출
    const queryKeywords = extractMakeupKeywords(query);

    // cosmetic_products에서 메이크업 카테고리 제품 검색
    const { data, error } = await supabase
      .from('cosmetic_products')
      .select('id, name, brand, category, key_ingredients, concerns, skin_types, price_krw')
      .eq('is_active', true)
      .eq('category', 'makeup')
      .limit(limit * 3);

    if (error) {
      coachLogger.error('[MakeupRAG] DB query error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 매칭 점수 계산 및 정렬
    const scoredProducts: MakeupProductMatch[] = data.map((product) => {
      const productConcerns = (product.concerns as string[]) || [];
      const productIngredients = (product.key_ingredients as string[]) || [];

      const { score, reasons } = calculateMakeupMatchScore({
        undertone,
        faceShape,
        season,
        recommendedStyles,
        queryKeywords,
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
        price: product.price_krw,
        matchScore: score,
        matchReasons: reasons,
      };
    });

    return scoredProducts.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  } catch (error) {
    coachLogger.error('[MakeupRAG] Search error:', error);
    return [];
  }
}

/** 매칭 점수 계산 */
function calculateMakeupMatchScore(params: {
  undertone?: string;
  faceShape?: string;
  season?: string;
  recommendedStyles: string[];
  queryKeywords: string[];
  productConcerns: string[];
  productIngredients: string[];
}): { score: number; reasons: string[] } {
  let score = 50; // 기본 점수 (이미 makeup 카테고리 필터 적용)
  const reasons: string[] = [];

  const { undertone, season, queryKeywords, productConcerns, productIngredients } = params;

  // 1. 언더톤 매칭 (+20점)
  if (undertone) {
    const toneMatch = productConcerns.some(
      (c) => c.includes(undertone) || c.includes('웜톤') || c.includes('쿨톤')
    );
    if (toneMatch) {
      score += 20;
      reasons.push(`${undertone} 언더톤에 적합`);
    }
  }

  // 2. 퍼스널 컬러 시즌 매칭 (+15점)
  if (season) {
    const seasonMatch = productConcerns.some((c) => c.includes(season));
    if (seasonMatch) {
      score += 15;
      reasons.push(`${season} 시즌 컬러 맞춤`);
    }
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

  // 4. 메이크업 타입별 보정 (+5점)
  const makeupTypes = ['립', '아이', '파운데이션', '블러셔', '컨실러', '브로우'];
  const hasTypeMatch = makeupTypes.some(
    (t) => queryKeywords.some((kw) => kw.includes(t)) && productConcerns.some((c) => c.includes(t))
  );
  if (hasTypeMatch) {
    score += 5;
    reasons.push('메이크업 타입 일치');
  }

  return { score: Math.min(score, 100), reasons };
}

/** 질문에서 메이크업 관련 키워드 추출 */
function extractMakeupKeywords(query: string): string[] {
  const keywords: string[] = [];
  const lowerQuery = query.toLowerCase();

  const makeupKeywords = [
    '립스틱',
    '립',
    '틴트',
    '립글로스',
    '파운데이션',
    '쿠션',
    'bb크림',
    'cc크림',
    '아이섀도',
    '아이라이너',
    '마스카라',
    '아이',
    '블러셔',
    '하이라이터',
    '컨투어링',
    '셰이딩',
    '컨실러',
    '프라이머',
    '세팅',
    '브로우',
    '눈썹',
    '웜톤',
    '쿨톤',
    '언더톤',
    '피부톤',
    '데일리',
    '출근',
    '면접',
    '결혼식',
    '파티',
  ];

  makeupKeywords.forEach((kw) => {
    if (lowerQuery.includes(kw)) keywords.push(kw);
  });

  return keywords;
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatMakeupProductsForPrompt(products: MakeupProductMatch[]): string {
  if (products.length === 0) return '';

  let context = '\n\n## 추천 메이크업 제품\n';
  products.forEach((p, i) => {
    context += `${i + 1}. ${p.brand} ${p.name}\n`;
    context += `   - 주요 특징: ${p.concerns.slice(0, 3).join(', ') || '정보 없음'}\n`;
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
