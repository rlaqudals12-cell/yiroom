/**
 * 분석 결과 기반 맞춤 제품 매칭 API
 *
 * AnalysisMatchedProducts 컴포넌트에서 호출
 * 사용자 프로필 + 분석 결과 → 매칭 점수 순 제품 반환
 *
 * @route GET /api/products/matched
 * @auth optional (비인증 시 기본 추천)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('analysisType') ?? 'skin';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '4', 10), 12);
    const skinType = searchParams.get('skinType');
    const personalColorSeason = searchParams.get('personalColorSeason');

    const supabase = createServiceRoleClient();

    // 분석 타입에 따른 제품 카테고리
    const categoryMap: Record<string, string> = {
      skin: 'skincare',
      'personal-color': 'cosmetic',
      hair: 'haircare',
      makeup: 'cosmetic',
      nutrition: 'supplement',
    };

    const category = categoryMap[analysisType] ?? 'skincare';

    // 기본 쿼리: 해당 카테고리 제품 조회
    let query = supabase
      .from('cosmetic_products')
      .select('id, name, brand, price, image_url, category, rating, skin_types, color_tones')
      .eq('is_active', true)
      .limit(limit * 3); // 매칭 후 필터링을 위해 넉넉히 조회

    // 카테고리 필터
    if (category !== 'cosmetic') {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error || !products) {
      return NextResponse.json({ success: true, products: [] });
    }

    // 매칭 점수 계산
    const matched = products
      .map((product) => {
        let matchScore = 50; // 기본 점수
        const matchReasons: string[] = [];

        // 피부 타입 매칭
        if (skinType && product.skin_types) {
          const skinTypes = Array.isArray(product.skin_types)
            ? product.skin_types
            : [product.skin_types];
          if (skinTypes.includes(skinType) || skinTypes.includes('all')) {
            matchScore += 20;
            matchReasons.push(`${skinType} 피부에 적합`);
          }
        }

        // 퍼스널컬러 매칭
        if (personalColorSeason && product.color_tones) {
          const tones = Array.isArray(product.color_tones)
            ? product.color_tones
            : [product.color_tones];
          const seasonToneMap: Record<string, string> = {
            spring: 'warm',
            summer: 'cool',
            autumn: 'warm',
            winter: 'cool',
          };
          const targetTone = seasonToneMap[personalColorSeason];
          if (targetTone && tones.includes(targetTone)) {
            matchScore += 15;
            matchReasons.push('퍼스널컬러 톤 매칭');
          }
        }

        // 평점 보너스
        if (product.rating && product.rating >= 4.0) {
          matchScore += 10;
        }

        return {
          product,
          matchScore: Math.min(matchScore, 100),
          matchReasons,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      products: matched,
      analysisType,
      totalMatched: matched.length,
    });
  } catch (error) {
    console.error('[Products/Matched] Error:', error);
    return NextResponse.json({ success: true, products: [] });
  }
}
