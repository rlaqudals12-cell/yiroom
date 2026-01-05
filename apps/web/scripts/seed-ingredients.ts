/**
 * Cosmetic Ingredients 시드 스크립트
 * @description EWG 안전성 등급 기반 화장품 성분 100개 시드 데이터 삽입
 * @usage npx tsx scripts/seed-ingredients.ts
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
const SEED_FILE = path.join(__dirname, '../data/cosmetic-ingredients-seed.json');

interface IngredientSeed {
  name_ko: string;
  name_en: string;
  name_inci: string;
  aliases: string[];
  ewg_score: number;
  ewg_data_availability: 'none' | 'limited' | 'fair' | 'good' | 'robust';
  category: string;
  functions: string[];
  is_caution_20: boolean;
  is_allergen: boolean;
  allergen_type: string | null;
  skin_type_caution: Record<string, string>;
  description: string;
  benefits: string[];
  concerns: string[];
  source: string;
}

interface SeedData {
  version: string;
  updated_at: string;
  source: string;
  total_count: number;
  ingredients: IngredientSeed[];
}

async function seedIngredients() {
  console.log('🌱 Cosmetic Ingredients 시드 데이터 삽입 시작...\n');

  // 시드 데이터 파일 읽기
  if (!fs.existsSync(SEED_FILE)) {
    console.error(`❌ 시드 파일을 찾을 수 없습니다: ${SEED_FILE}`);
    process.exit(1);
  }

  const seedData: SeedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  console.log(`📦 버전: ${seedData.version}`);
  console.log(`📅 업데이트: ${seedData.updated_at}`);
  console.log(`📊 총 성분 수: ${seedData.total_count}\n`);

  // 기존 데이터 확인
  const { count: existingCount } = await supabase
    .from('cosmetic_ingredients')
    .select('*', { count: 'exact', head: true });

  if (existingCount && existingCount > 0) {
    console.log(`⚠️  기존 데이터 ${existingCount}개 발견`);
    console.log('   기존 데이터를 유지하며 중복 성분만 건너뜁니다.\n');
  }

  // 배치 삽입 (10개씩)
  const BATCH_SIZE = 10;
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < seedData.ingredients.length; i += BATCH_SIZE) {
    const batch = seedData.ingredients.slice(i, i + BATCH_SIZE);

    // DB 삽입용 데이터 변환
    const dbData = batch.map((ingredient) => ({
      name_ko: ingredient.name_ko,
      name_en: ingredient.name_en,
      name_inci: ingredient.name_inci,
      aliases: ingredient.aliases,
      ewg_score: ingredient.ewg_score,
      ewg_data_availability: ingredient.ewg_data_availability,
      category: ingredient.category,
      functions: ingredient.functions,
      is_caution_20: ingredient.is_caution_20,
      is_allergen: ingredient.is_allergen,
      allergen_type: ingredient.allergen_type,
      skin_type_caution: ingredient.skin_type_caution,
      description: ingredient.description,
      benefits: ingredient.benefits,
      concerns: ingredient.concerns,
      source: ingredient.source,
    }));

    // upsert로 중복 처리 (name_inci 기준)
    const { data, error } = await supabase
      .from('cosmetic_ingredients')
      .upsert(dbData, {
        onConflict: 'name_inci',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      // name_inci에 unique constraint가 없으면 일반 insert 시도
      const { data: insertData, error: insertError } = await supabase
        .from('cosmetic_ingredients')
        .insert(dbData)
        .select();

      if (insertError) {
        console.error(`❌ 배치 ${Math.floor(i / BATCH_SIZE) + 1} 실패:`, insertError.message);
        failed += batch.length;
      } else {
        inserted += insertData?.length || 0;
      }
    } else {
      inserted += data?.length || 0;
    }

    // 진행률 표시
    const progress = Math.min(100, Math.round(((i + batch.length) / seedData.total_count) * 100));
    process.stdout.write(`\r   진행률: ${progress}% (${i + batch.length}/${seedData.total_count})`);
  }

  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 삽입 완료: ${inserted}개`);
  if (skipped > 0) console.log(`⏭️  건너뜀: ${skipped}개 (중복)`);
  if (failed > 0) console.log(`❌ 실패: ${failed}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 카테고리별 통계
  const { data: stats } = await supabase
    .from('cosmetic_ingredients')
    .select('category')
    .order('category');

  if (stats) {
    const categoryCount = stats.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('📊 카테고리별 성분 수:');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}개`);
      });
  }

  // EWG 등급별 통계
  const { data: ewgStats } = await supabase.from('cosmetic_ingredients').select('ewg_score');

  if (ewgStats) {
    const safe = ewgStats.filter((i) => i.ewg_score <= 2).length;
    const moderate = ewgStats.filter((i) => i.ewg_score >= 3 && i.ewg_score <= 6).length;
    const hazard = ewgStats.filter((i) => i.ewg_score >= 7).length;

    console.log('\n📊 EWG 안전성 등급 분포:');
    console.log(`   🟢 안전 (1-2): ${safe}개`);
    console.log(`   🟡 보통 (3-6): ${moderate}개`);
    console.log(`   🔴 주의 (7-10): ${hazard}개`);
  }

  console.log('\n✨ 시드 삽입 완료!\n');
}

// 실행
seedIngredients().catch((error) => {
  console.error('💥 시드 스크립트 실행 실패:', error);
  process.exit(1);
});
