/**
 * User Preferences Migration Script
 *
 * 레거시 allergies/injuries 데이터를 user_preferences 테이블로 마이그레이션
 *
 * 사용법:
 *   npx tsx scripts/migrate-preferences.ts              # 실제 마이그레이션
 *   npx tsx scripts/migrate-preferences.ts --dry-run   # 드라이 런 (미리보기)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationStats {
  allergies: { total: number; migrated: number; skipped: number; failed: number };
  injuries: { total: number; migrated: number; skipped: number; failed: number };
}

const stats: MigrationStats = {
  allergies: { total: 0, migrated: 0, skipped: 0, failed: 0 },
  injuries: { total: 0, migrated: 0, skipped: 0, failed: 0 },
};

async function migrateAllergies() {
  console.log('\n[1/2] 알레르기 데이터 마이그레이션...');

  try {
    const { data: records, error } = await supabase
      .from('nutrition_onboarding')
      .select('user_id, allergies')
      .not('allergies', 'is', null);

    if (error) {
      console.error('알레르기 데이터 조회 실패:', error.message);
      return;
    }

    if (!records || records.length === 0) {
      console.log('  마이그레이션할 알레르기 데이터 없음');
      return;
    }

    let processed = 0;
    for (const record of records) {
      if (!record.allergies || !Array.isArray(record.allergies)) continue;

      for (const allergy of record.allergies) {
        stats.allergies.total++;

        // 중복 체크
        const { data: existing, error: checkError } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('domain', 'nutrition')
          .eq('category', 'allergy')
          .eq('item_key', allergy)
          .single();

        // PGRST116 = no rows found (정상)
        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`  중복 체크 실패 (${allergy}):`, checkError.message);
          stats.allergies.failed++;
          continue;
        }

        if (existing) {
          stats.allergies.skipped++;
          continue;
        }

        if (!dryRun) {
          const { error: insertError } = await supabase.from('user_preferences').insert({
            user_id: record.user_id,
            domain: 'nutrition',
            category: 'allergy',
            item_key: allergy,
            avoid_level: 'cannot',
            avoid_reason: 'allergy',
          });

          if (insertError) {
            console.error(`  알레르기 삽입 실패 (${allergy}):`, insertError.message);
            stats.allergies.failed++;
          } else {
            stats.allergies.migrated++;
            processed++;
          }
        } else {
          stats.allergies.migrated++;
          processed++;
        }
      }
    }

    console.log(`  처리됨: ${processed}건`);
    console.log(`  - 총합: ${stats.allergies.total}`);
    console.log(`  - 마이그레이션됨: ${stats.allergies.migrated}`);
    console.log(`  - 건너뜀: ${stats.allergies.skipped}`);
    console.log(`  - 실패: ${stats.allergies.failed}`);
  } catch (error) {
    console.error(
      '알레르기 마이그레이션 중 오류:',
      error instanceof Error ? error.message : '알 수 없는 오류'
    );
  }
}

async function migrateInjuries() {
  console.log('\n[2/2] 부상 데이터 마이그레이션...');

  try {
    const { data: records, error } = await supabase
      .from('workout_onboarding')
      .select('user_id, injuries')
      .not('injuries', 'is', null);

    if (error) {
      console.error('부상 데이터 조회 실패:', error.message);
      return;
    }

    if (!records || records.length === 0) {
      console.log('  마이그레이션할 부상 데이터 없음');
      return;
    }

    let processed = 0;
    for (const record of records) {
      if (!record.injuries || !Array.isArray(record.injuries)) continue;

      for (const injury of record.injuries) {
        stats.injuries.total++;

        // 중복 체크
        const { data: existing, error: checkError } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('domain', 'workout')
          .eq('category', 'injury')
          .eq('item_key', injury)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`  중복 체크 실패 (${injury}):`, checkError.message);
          stats.injuries.failed++;
          continue;
        }

        if (existing) {
          stats.injuries.skipped++;
          continue;
        }

        if (!dryRun) {
          const { error: insertError } = await supabase.from('user_preferences').insert({
            user_id: record.user_id,
            domain: 'workout',
            category: 'injury',
            item_key: injury,
            avoid_level: 'avoid',
            avoid_reason: 'injury',
          });

          if (insertError) {
            console.error(`  부상 삽입 실패 (${injury}):`, insertError.message);
            stats.injuries.failed++;
          } else {
            stats.injuries.migrated++;
            processed++;
          }
        } else {
          stats.injuries.migrated++;
          processed++;
        }
      }
    }

    console.log(`  처리됨: ${processed}건`);
    console.log(`  - 총합: ${stats.injuries.total}`);
    console.log(`  - 마이그레이션됨: ${stats.injuries.migrated}`);
    console.log(`  - 건너뜀: ${stats.injuries.skipped}`);
    console.log(`  - 실패: ${stats.injuries.failed}`);
  } catch (error) {
    console.error(
      '부상 마이그레이션 중 오류:',
      error instanceof Error ? error.message : '알 수 없는 오류'
    );
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('사용자 선호도 마이그레이션 스크립트');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('[드라이 런 모드] 실제 데이터 변경 없음');
  }

  await migrateAllergies();
  await migrateInjuries();

  console.log('\n' + '='.repeat(60));
  console.log('마이그레이션 요약');
  console.log('='.repeat(60));
  console.log(`알레르기: ${stats.allergies.migrated}/${stats.allergies.total} 마이그레이션됨`);
  if (stats.allergies.failed > 0) {
    console.log(`  실패: ${stats.allergies.failed}`);
  }
  console.log(`부상: ${stats.injuries.migrated}/${stats.injuries.total} 마이그레이션됨`);
  if (stats.injuries.failed > 0) {
    console.log(`  실패: ${stats.injuries.failed}`);
  }

  const totalMigrated = stats.allergies.migrated + stats.injuries.migrated;
  const totalFailed = stats.allergies.failed + stats.injuries.failed;

  console.log('\n총합');
  console.log(`마이그레이션됨: ${totalMigrated}건`);
  if (totalFailed > 0) {
    console.log(`실패: ${totalFailed}건`);
  }

  if (dryRun) {
    console.log('\n드라이 런 완료. 실제 마이그레이션을 실행하려면:');
    console.log('  npx tsx scripts/migrate-preferences.ts');
  } else {
    console.log('\n마이그레이션 완료!');
  }
}

main().catch((error) => {
  console.error('스크립트 실행 중 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
  process.exit(1);
});
