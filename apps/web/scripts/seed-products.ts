/**
 * Product DB 시드 스크립트
 * @description 초기 제품 데이터를 Supabase에 입력
 * @usage npx tsx scripts/seed-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('필요한 환경 변수:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Service Role 클라이언트 (RLS 우회)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CosmeticSeedProduct {
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price_range: string;
  price_krw: number;
  skin_types: string[] | null;
  concerns: string[] | null;
  key_ingredients: string[] | null;
  avoid_ingredients: string[] | null;
  personal_color_seasons: string[] | null;
  hair_types?: string[] | null;
  scalp_types?: string[] | null;
  face_shapes?: string[] | null;
  undertones?: string[] | null;
  image_url: string | null;
  purchase_url: string | null;
  // rating/review_count 없음 — 시드에 실측 평점 소스가 없어 지어내지 않는다 (정직 원칙)
}

interface SupplementSeedProduct {
  name: string;
  brand: string;
  category: string;
  benefits: string[];
  main_ingredients: { name: string; amount: number; unit: string }[];
  target_concerns: string[];
  price_krw: number;
  dosage: string;
  serving_size: number;
  total_servings: number;
  image_url: string | null;
  purchase_url: string | null;
  // rating/review_count 없음 — 실측 평점 소스가 없어 지어내지 않는다 (정직 원칙)
  warnings: string[];
}

async function seedCosmeticProducts() {
  console.log('\n📦 화장품 데이터 입력 시작...');

  const seedPath = path.join(__dirname, '../data/seeds/cosmetic-products.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const products: CosmeticSeedProduct[] = seedData.products;

  console.log(`  총 ${products.length}개 제품 발견`);

  // 배치 삽입 (프로덕션 DB 스키마에 맞춤)
  const { error } = await supabase.from('cosmetic_products').insert(
    products.map((p) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory,
      price_range: p.price_range,
      price_krw: p.price_krw,
      skin_types: p.skin_types,
      concerns: p.concerns,
      key_ingredients: p.key_ingredients,
      personal_color_seasons: p.personal_color_seasons,
      hair_types: p.hair_types ?? [],
      scalp_types: p.scalp_types ?? [],
      face_shapes: p.face_shapes ?? [],
      undertones: p.undertones ?? [],
      image_url: p.image_url,
      purchase_url: p.purchase_url,
      // rating/review_count는 삽입하지 않음 — 실측 없음 = null 유지 (지어내지 않는다)
      is_active: true,
    }))
  );

  if (error) {
    console.error('  ❌ 화장품 입력 실패:', error.message);
    return false;
  }

  console.log(`  ✅ ${products.length}개 화장품 입력 완료`);
  return true;
}

async function seedSupplementProducts() {
  console.log('\n💊 영양제 데이터 입력 시작...');

  const seedPath = path.join(__dirname, '../data/seeds/supplement-products.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const products: SupplementSeedProduct[] = seedData.products;

  console.log(`  총 ${products.length}개 제품 발견`);

  // 배치 삽입 (프로덕션 DB 스키마에 맞춤)
  const { error } = await supabase.from('supplement_products').insert(
    products.map((p) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      benefits: p.benefits,
      main_ingredients: p.main_ingredients,
      target_concerns: p.target_concerns,
      price_krw: p.price_krw,
      image_url: p.image_url,
      purchase_url: p.purchase_url,
      // rating/review_count는 삽입하지 않음 — 실측 없음 = null 유지 (지어내지 않는다)
      is_active: true,
    }))
  );

  if (error) {
    console.error('  ❌ 영양제 입력 실패:', error.message);
    return false;
  }

  console.log(`  ✅ ${products.length}개 영양제 입력 완료`);
  return true;
}

async function verifyData() {
  console.log('\n🔍 데이터 검증...');

  const { count: cosmeticCount } = await supabase
    .from('cosmetic_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: supplementCount } = await supabase
    .from('supplement_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`  화장품: ${cosmeticCount}개`);
  console.log(`  영양제: ${supplementCount}개`);
  console.log(`  총: ${(cosmeticCount || 0) + (supplementCount || 0)}개`);
}

async function main() {
  console.log('🚀 Product DB 시드 시작');
  console.log('='.repeat(40));

  const cosmeticSuccess = await seedCosmeticProducts();
  const supplementSuccess = await seedSupplementProducts();

  if (cosmeticSuccess && supplementSuccess) {
    await verifyData();
    console.log('\n✅ 시드 완료!');
  } else {
    console.log('\n⚠️ 일부 데이터 입력 실패');
  }
}

main().catch(console.error);
