/**
 * 시드 데이터 마이그레이션 스크립트
 * @description hair_care 카테고리 분할 + hair_types/scalp_types/face_shapes/undertones 추론
 * @usage npx tsx scripts/migrate-seed-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface SeedProduct {
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
  image_url: string | null;
  purchase_url: string | null;
  rating: number;
  review_count: number;
  // 신규 필드
  hair_types?: string[] | null;
  scalp_types?: string[] | null;
  face_shapes?: string[] | null;
  undertones?: string[] | null;
}

// hair_care subcategory → 새 category 매핑
const HAIR_CARE_CATEGORY_MAP: Record<string, string> = {
  shampoo: 'shampoo',
  'scalp-care': 'scalp-care',
  'scalp-oil': 'scalp-care',
  // 나머지는 모두 hair-treatment
};

// 메이크업 subcategory별 얼굴형 추론
const FACE_SHAPE_MAP: Record<string, string[] | null> = {
  // 베이스: 전체 얼굴형 (얼굴형에 따라 도포 방법만 다름)
  foundation: ['oval', 'round', 'square', 'heart', 'oblong'],
  cushion: ['oval', 'round', 'square', 'heart', 'oblong'],
  primer: ['oval', 'round', 'square', 'heart', 'oblong'],
  powder: ['oval', 'round', 'square', 'heart', 'oblong'],
  concealer: ['oval', 'round', 'square', 'heart', 'oblong'],
  'setting-spray': null, // 얼굴형 무관
  // 컨투어: 둥근/각진/긴 얼굴 교정용
  contour: ['round', 'square', 'oblong'],
  // 블러셔/하이라이터: 볼 형태 관련
  blush: ['oval', 'heart', 'round'],
  highlighter: ['oval', 'heart', 'round'],
  // 아이/립/브로우: 얼굴형 무관
  eye: null,
  eyeshadow: null,
  eyeliner: null,
  mascara: null,
  brow: null,
  lip: null,
  'lip-gloss': null,
  'lip-liner': null,
  'multi-palette': null,
  brush: null,
};

// 퍼스널컬러 시즌 → 언더톤 추론
function inferUndertones(seasons: string[] | null): string[] | null {
  if (!seasons || seasons.length === 0) return ['warm', 'cool', 'neutral'];

  const undertones = new Set<string>();
  for (const season of seasons) {
    if (season === 'Spring' || season === 'Autumn') {
      undertones.add('warm');
    } else if (season === 'Summer' || season === 'Winter') {
      undertones.add('cool');
    }
  }

  return undertones.size > 0 ? Array.from(undertones) : ['warm', 'cool', 'neutral'];
}

// skin_types → scalp_types 추론
function inferScalpTypes(skinTypes: string[] | null): string[] {
  if (!skinTypes || skinTypes.length === 0) {
    return ['dry', 'oily', 'normal', 'sensitive'];
  }
  // skin_types의 dry/oily/normal/sensitive만 필터 (combination → oily+dry)
  const validScalpTypes = new Set<string>();
  for (const st of skinTypes) {
    if (['dry', 'oily', 'normal', 'sensitive'].includes(st)) {
      validScalpTypes.add(st);
    } else if (st === 'combination') {
      validScalpTypes.add('oily');
      validScalpTypes.add('dry');
    }
  }
  return validScalpTypes.size > 0
    ? Array.from(validScalpTypes)
    : ['dry', 'oily', 'normal', 'sensitive'];
}

function migrateProduct(product: SeedProduct): SeedProduct {
  const migrated = { ...product };

  // 1. hair_care 카테고리 분할
  if (product.category === 'hair_care') {
    const subcategory = product.subcategory || '';
    migrated.category = HAIR_CARE_CATEGORY_MAP[subcategory] || 'hair-treatment';

    // 헤어케어: hair_types (범용), scalp_types (skin_types에서 추론)
    migrated.hair_types = ['straight', 'wavy', 'curly', 'coily'];
    migrated.scalp_types = inferScalpTypes(product.skin_types);
  }

  // 2. 메이크업 제품: face_shapes + undertones 추론
  if (product.category === 'makeup') {
    const subcategory = product.subcategory || '';
    const faceShapes = FACE_SHAPE_MAP[subcategory];
    migrated.face_shapes = faceShapes ?? null;
    migrated.undertones = inferUndertones(product.personal_color_seasons);
  }

  // 3. 신규 필드 기본값 설정 (null이 아닌 경우만)
  if (migrated.hair_types === undefined) migrated.hair_types = null;
  if (migrated.scalp_types === undefined) migrated.scalp_types = null;
  if (migrated.face_shapes === undefined) migrated.face_shapes = null;
  if (migrated.undertones === undefined) migrated.undertones = null;

  return migrated;
}

function main(): void {
  const seedPath = path.join(__dirname, '../data/seeds/cosmetic-products.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const products: SeedProduct[] = seedData.products;

  console.log(`총 ${products.length}개 제품 마이그레이션 시작\n`);

  // 카테고리 통계 (Before)
  const beforeCategories: Record<string, number> = {};
  for (const p of products) {
    beforeCategories[p.category] = (beforeCategories[p.category] || 0) + 1;
  }
  console.log('Before 카테고리:', JSON.stringify(beforeCategories, null, 2));

  // 마이그레이션
  const migrated = products.map(migrateProduct);

  // 카테고리 통계 (After)
  const afterCategories: Record<string, number> = {};
  let hairTypesCount = 0;
  let scalpTypesCount = 0;
  let faceShapesCount = 0;
  let undertonesCount = 0;

  for (const p of migrated) {
    afterCategories[p.category] = (afterCategories[p.category] || 0) + 1;
    if (p.hair_types && p.hair_types.length > 0) hairTypesCount++;
    if (p.scalp_types && p.scalp_types.length > 0) scalpTypesCount++;
    if (p.face_shapes && p.face_shapes.length > 0) faceShapesCount++;
    if (p.undertones && p.undertones.length > 0) undertonesCount++;
  }

  console.log('\nAfter 카테고리:', JSON.stringify(afterCategories, null, 2));
  console.log(`\nhair_types 설정: ${hairTypesCount}개`);
  console.log(`scalp_types 설정: ${scalpTypesCount}개`);
  console.log(`face_shapes 설정: ${faceShapesCount}개`);
  console.log(`undertones 설정: ${undertonesCount}개`);

  // 검증: hair_care 0개
  if (afterCategories['hair_care']) {
    console.error('\n❌ hair_care 카테고리가 아직 남아있습니다!');
    process.exit(1);
  }

  // 저장
  seedData.products = migrated;
  fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2) + '\n', 'utf-8');
  console.log(`\n✅ ${seedPath} 저장 완료`);
}

main();
