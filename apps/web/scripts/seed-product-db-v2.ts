/**
 * Product DB v2 시드 스크립트
 * @description 운동 기구 및 건강식품 시드 데이터 삽입
 * @usage npx tsx scripts/seed-product-db-v2.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 시드 데이터 파일 경로
const SEED_DIR = path.join(__dirname, '../data/seeds');

interface WorkoutEquipmentSeed {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price_krw?: number;
  price_range?: string;
  weight_kg?: number;
  weight_range?: string;
  material?: string;
  size?: string;
  color_options?: string[];
  target_muscles?: string[];
  exercise_types?: string[];
  skill_level?: string;
  use_location?: string;
  // rating/review_count 없음 — 실측 평점 소스가 없어 지어내지 않는다 (정직 원칙)
  features?: string[];
  pros?: string[];
  cons?: string[];
}

interface HealthFoodSeed {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price_krw?: number;
  price_per_serving?: number;
  serving_size?: string;
  servings_per_container?: number;
  calories_per_serving?: number;
  protein_g?: number;
  carbs_g?: number;
  sugar_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  additional_nutrients?: Array<{
    name: string;
    amount: number;
    unit: string;
    daily_value_percent?: number;
  }>;
  flavor_options?: string[];
  dietary_info?: string[];
  allergens?: string[];
  benefits?: string[];
  best_time?: string;
  target_users?: string[];
  // rating/review_count/taste_rating/mixability_rating 없음 — 실측 없음 = 지어내지 않는다
  features?: string[];
}

// 운동 기구 시드 데이터 삽입
async function seedWorkoutEquipment(): Promise<number> {
  const filePath = path.join(SEED_DIR, 'products-workout-equipment.json');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    return 0;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data: { workout_equipment: WorkoutEquipmentSeed[] } = JSON.parse(rawData);

  console.log(`📦 운동 기구 ${data.workout_equipment.length}개 삽입 중...`);

  let successCount = 0;

  for (const item of data.workout_equipment) {
    const { error } = await supabase.from('workout_equipment').upsert(
      {
        name: item.name,
        brand: item.brand,
        category: item.category,
        subcategory: item.subcategory,
        price_krw: item.price_krw,
        price_range: item.price_range,
        weight_kg: item.weight_kg,
        weight_range: item.weight_range,
        material: item.material,
        size: item.size,
        color_options: item.color_options,
        target_muscles: item.target_muscles,
        exercise_types: item.exercise_types,
        skill_level: item.skill_level,
        use_location: item.use_location,
        // rating/review_count 미삽입 — 실측 없음 = null 유지 (지어내지 않는다)
        features: item.features,
        pros: item.pros,
        cons: item.cons,
        is_active: true,
      },
      { onConflict: 'name,brand' }
    );

    if (error) {
      console.error(`  ❌ ${item.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${item.name}`);
      successCount++;
    }
  }

  return successCount;
}

// 건강식품 시드 데이터 삽입
async function seedHealthFoods(): Promise<number> {
  const filePath = path.join(SEED_DIR, 'products-health-foods.json');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    return 0;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data: { health_foods: HealthFoodSeed[] } = JSON.parse(rawData);

  console.log(`📦 건강식품 ${data.health_foods.length}개 삽입 중...`);

  let successCount = 0;

  for (const item of data.health_foods) {
    const { error } = await supabase.from('health_foods').upsert(
      {
        name: item.name,
        brand: item.brand,
        category: item.category,
        subcategory: item.subcategory,
        price_krw: item.price_krw,
        price_per_serving: item.price_per_serving,
        serving_size: item.serving_size,
        servings_per_container: item.servings_per_container,
        calories_per_serving: item.calories_per_serving,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        sugar_g: item.sugar_g,
        fat_g: item.fat_g,
        fiber_g: item.fiber_g,
        sodium_mg: item.sodium_mg,
        additional_nutrients: item.additional_nutrients,
        flavor_options: item.flavor_options,
        dietary_info: item.dietary_info,
        allergens: item.allergens,
        benefits: item.benefits,
        best_time: item.best_time,
        target_users: item.target_users,
        // rating/review_count/taste_rating/mixability_rating 미삽입 — 실측 없음 (지어내지 않는다)
        features: item.features,
        is_active: true,
      },
      { onConflict: 'name,brand' }
    );

    if (error) {
      console.error(`  ❌ ${item.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${item.name}`);
      successCount++;
    }
  }

  return successCount;
}

// 메인 실행
async function main() {
  console.log('🚀 Product DB v2 시드 시작\n');
  console.log('='.repeat(50));

  // 운동 기구 시드
  console.log('\n📊 운동 기구 시드\n');
  const equipmentCount = await seedWorkoutEquipment();

  // 건강식품 시드
  console.log('\n📊 건강식품 시드\n');
  const foodCount = await seedHealthFoods();

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('✨ 시드 완료!');
  console.log(`   - 운동 기구: ${equipmentCount}개`);
  console.log(`   - 건강식품: ${foodCount}개`);
  console.log(`   - 총: ${equipmentCount + foodCount}개`);
}

main().catch(console.error);
