/**
 * 기존 allergies/injuries 데이터를 user_preferences로 마이그레이션
 *
 * 실행: npx tsx scripts/migrate-preferences.ts
 *
 * @description
 * - nutrition_analyses.allergies[] → user_preferences (nutrition/allergen)
 * - nutrition_settings.disliked_foods[] → user_preferences (nutrition/food)
 * - workout_analyses.injuries[] → user_preferences (workout/body_part)
 */

import { createClient } from '@supabase/supabase-js';

// 환경변수 확인
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 통계
const stats = {
  allergies: { found: 0, migrated: 0, skipped: 0, errors: 0 },
  dislikedFoods: { found: 0, migrated: 0, skipped: 0, errors: 0 },
  injuries: { found: 0, migrated: 0, skipped: 0, errors: 0 },
};

/**
 * 알레르기 마이그레이션 (nutrition_analyses)
 */
async function migrateAllergies() {
  console.log('\n📋 알레르기 마이그레이션 시작...');

  const { data: analyses, error } = await supabase
    .from('nutrition_analyses')
    .select('clerk_user_id, allergies')
    .not('allergies', 'is', null);

  if (error) {
    console.error('❌ nutrition_analyses 조회 실패:', error.message);
    return;
  }

  if (!analyses || analyses.length === 0) {
    console.log('   데이터 없음');
    return;
  }

  for (const analysis of analyses) {
    const allergies = analysis.allergies as string[];
    if (!allergies || allergies.length === 0) continue;

    stats.allergies.found += allergies.length;

    for (const allergy of allergies) {
      // 중복 체크
      const { count } = await supabase
        .from('user_preferences')
        .select('id', { count: 'exact', head: true })
        .eq('clerk_user_id', analysis.clerk_user_id)
        .eq('domain', 'nutrition')
        .eq('item_type', 'allergen')
        .eq('item_name', allergy);

      if (count && count > 0) {
        stats.allergies.skipped++;
        continue;
      }

      // 삽입
      const { error: insertError } = await supabase.from('user_preferences').insert({
        clerk_user_id: analysis.clerk_user_id,
        domain: 'nutrition',
        item_type: 'allergen',
        item_name: allergy,
        is_favorite: false,
        avoid_level: 'cannot',
        avoid_reason: 'allergy',
        priority: 5,
        source: 'analysis',
      });

      if (insertError) {
        console.error(`   ❌ ${allergy} 삽입 실패:`, insertError.message);
        stats.allergies.errors++;
      } else {
        stats.allergies.migrated++;
      }
    }
  }

  console.log(
    `   ✅ 알레르기: ${stats.allergies.migrated}개 마이그레이션, ${stats.allergies.skipped}개 스킵`
  );
}

/**
 * 기피 음식 마이그레이션 (nutrition_settings)
 */
async function migrateDislikedFoods() {
  console.log('\n📋 기피 음식 마이그레이션 시작...');

  const { data: settings, error } = await supabase
    .from('nutrition_settings')
    .select('clerk_user_id, disliked_foods')
    .not('disliked_foods', 'is', null);

  if (error) {
    console.error('❌ nutrition_settings 조회 실패:', error.message);
    return;
  }

  if (!settings || settings.length === 0) {
    console.log('   데이터 없음');
    return;
  }

  for (const setting of settings) {
    const foods = setting.disliked_foods as string[];
    if (!foods || foods.length === 0) continue;

    stats.dislikedFoods.found += foods.length;

    for (const food of foods) {
      // 중복 체크
      const { count } = await supabase
        .from('user_preferences')
        .select('id', { count: 'exact', head: true })
        .eq('clerk_user_id', setting.clerk_user_id)
        .eq('domain', 'nutrition')
        .eq('item_type', 'food')
        .eq('item_name', food);

      if (count && count > 0) {
        stats.dislikedFoods.skipped++;
        continue;
      }

      // 삽입
      const { error: insertError } = await supabase.from('user_preferences').insert({
        clerk_user_id: setting.clerk_user_id,
        domain: 'nutrition',
        item_type: 'food',
        item_name: food,
        is_favorite: false,
        avoid_level: 'avoid',
        avoid_reason: 'taste',
        priority: 3,
        source: 'user',
      });

      if (insertError) {
        console.error(`   ❌ ${food} 삽입 실패:`, insertError.message);
        stats.dislikedFoods.errors++;
      } else {
        stats.dislikedFoods.migrated++;
      }
    }
  }

  console.log(
    `   ✅ 기피 음식: ${stats.dislikedFoods.migrated}개 마이그레이션, ${stats.dislikedFoods.skipped}개 스킵`
  );
}

/**
 * 부상 마이그레이션 (workout_analyses)
 */
async function migrateInjuries() {
  console.log('\n📋 부상 마이그레이션 시작...');

  const { data: analyses, error } = await supabase
    .from('workout_analyses')
    .select('clerk_user_id, injuries')
    .not('injuries', 'is', null);

  if (error) {
    console.error('❌ workout_analyses 조회 실패:', error.message);
    return;
  }

  if (!analyses || analyses.length === 0) {
    console.log('   데이터 없음');
    return;
  }

  for (const analysis of analyses) {
    const injuries = analysis.injuries as string[];
    if (!injuries || injuries.length === 0) continue;

    stats.injuries.found += injuries.length;

    for (const injury of injuries) {
      // 중복 체크
      const { count } = await supabase
        .from('user_preferences')
        .select('id', { count: 'exact', head: true })
        .eq('clerk_user_id', analysis.clerk_user_id)
        .eq('domain', 'workout')
        .eq('item_type', 'body_part')
        .eq('item_name', injury);

      if (count && count > 0) {
        stats.injuries.skipped++;
        continue;
      }

      // 삽입
      const { error: insertError } = await supabase.from('user_preferences').insert({
        clerk_user_id: analysis.clerk_user_id,
        domain: 'workout',
        item_type: 'body_part',
        item_name: injury,
        is_favorite: false,
        avoid_level: 'avoid',
        avoid_reason: 'injury',
        priority: 4,
        source: 'analysis',
      });

      if (insertError) {
        console.error(`   ❌ ${injury} 삽입 실패:`, insertError.message);
        stats.injuries.errors++;
      } else {
        stats.injuries.migrated++;
      }
    }
  }

  console.log(
    `   ✅ 부상: ${stats.injuries.migrated}개 마이그레이션, ${stats.injuries.skipped}개 스킵`
  );
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 User Preferences 마이그레이션 시작');
  console.log('   대상: allergies, dislikedFoods, injuries → user_preferences');

  const startTime = Date.now();

  await migrateAllergies();
  await migrateDislikedFoods();
  await migrateInjuries();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n📊 마이그레이션 완료 요약');
  console.log('─'.repeat(50));
  console.log(
    `   알레르기:   ${stats.allergies.migrated}개 성공, ${stats.allergies.skipped}개 스킵, ${stats.allergies.errors}개 에러`
  );
  console.log(
    `   기피 음식:  ${stats.dislikedFoods.migrated}개 성공, ${stats.dislikedFoods.skipped}개 스킵, ${stats.dislikedFoods.errors}개 에러`
  );
  console.log(
    `   부상:       ${stats.injuries.migrated}개 성공, ${stats.injuries.skipped}개 스킵, ${stats.injuries.errors}개 에러`
  );
  console.log('─'.repeat(50));

  const totalMigrated =
    stats.allergies.migrated + stats.dislikedFoods.migrated + stats.injuries.migrated;
  const totalErrors = stats.allergies.errors + stats.dislikedFoods.errors + stats.injuries.errors;

  console.log(`   총 마이그레이션: ${totalMigrated}개`);
  console.log(`   총 에러: ${totalErrors}개`);
  console.log(`   소요 시간: ${duration}초`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 마이그레이션 실패:', error);
  process.exit(1);
});
