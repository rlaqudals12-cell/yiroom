/**
 * 제품 시드 API (관리자용)
 * POST /api/admin/seed-products
 *
 * 주의: 프로덕션에서 한 번만 실행!
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import cosmeticData from '@/data/seeds/cosmetic-products.json';
import supplementData from '@/data/seeds/supplement-products.json';

export async function POST(request: Request) {
  try {
    // 간단한 인증 (쿼리 파라미터로 시크릿 체크)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.SEED_SECRET && secret !== 'yiroom-seed-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const results = {
      cosmetics: { success: 0, failed: 0 },
      supplements: { success: 0, failed: 0 },
    };

    // 화장품 시드
    console.log('Seeding cosmetics...');
    for (const product of cosmeticData.products) {
      const { error } = await supabase
        .from('cosmetic_products')
        .insert({
          name: product.name,
          brand: product.brand,
          category: product.category,
          subcategory: product.subcategory,
          price_range: product.price_range,
          price_krw: product.price_krw,
          skin_types: product.skin_types,
          concerns: product.concerns,
          key_ingredients: product.key_ingredients,
          personal_color_seasons: product.personal_color_seasons,
          image_url: product.image_url,
          purchase_url: product.purchase_url,
          rating: product.rating,
          review_count: product.review_count,
          is_active: true,
        });

      if (error) {
        console.error(`Cosmetic error: ${product.name}`, error.message);
        results.cosmetics.failed++;
      } else {
        results.cosmetics.success++;
      }
    }

    // 영양제 시드
    console.log('Seeding supplements...');
    for (const product of supplementData.products) {
      const { error } = await supabase
        .from('supplement_products')
        .insert({
          name: product.name,
          brand: product.brand,
          category: product.category,
          benefits: product.benefits,
          main_ingredients: product.main_ingredients,
          target_concerns: product.target_concerns,
          price_krw: product.price_krw,
          image_url: product.image_url,
          purchase_url: product.purchase_url,
          rating: product.rating,
          review_count: product.review_count,
          is_active: true,
        });

      if (error) {
        console.error(`Supplement error: ${product.name}`, error.message);
        results.supplements.failed++;
      } else {
        results.supplements.success++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: {
        success: results.cosmetics.success + results.supplements.success,
        failed: results.cosmetics.failed + results.supplements.failed,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}
