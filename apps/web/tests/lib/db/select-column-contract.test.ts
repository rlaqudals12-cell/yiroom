import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Supabase select() 컬럼 계약 검사.
 *
 * 왜 필요한가: PostgREST는 select 목록에 없는 컬럼이 하나라도 있으면 **쿼리 전체를 400으로 거절**한다.
 * 타입 검사도 테스트도 이걸 못 잡는다(mock이 임의 모양을 돌려주기 때문).
 * 실제로 코치는 `personal_color_assessments.result`·`skin_analyses.concerns`·`body_analyses.bmi`처럼
 * 실재하지 않는 컬럼을 조회해 퍼스널컬러·피부·체형을 **한 번도 읽지 못했다**.
 * 이 테스트는 마이그레이션(정본)과 소스의 select를 대조해 같은 사고를 막는다.
 */

const WEB_ROOT = resolve(__dirname, '../../..');
const REPO_ROOT = resolve(WEB_ROOT, '../..');

const MIGRATION_DIRS = [
  join(WEB_ROOT, 'supabase/migrations'),
  join(REPO_ROOT, 'supabase/migrations'),
];

const COLUMN_TYPES =
  '(TEXT|VARCHAR|CHAR|JSONB|JSON|INT|INTEGER|BIGINT|SMALLINT|NUMERIC|DECIMAL|REAL|FLOAT|DOUBLE|BOOLEAN|BOOL|UUID|TIMESTAMPTZ|TIMESTAMP|DATE|TIME|SERIAL|BIGSERIAL|BYTEA|INET|VECTOR)';

const NON_COLUMN_KEYWORDS = new Set([
  'PRIMARY',
  'FOREIGN',
  'UNIQUE',
  'CHECK',
  'CONSTRAINT',
  'EXCLUDE',
  'LIKE',
]);

/**
 * 숨김 모듈(W-1 운동·N-1 영양·자세·날씨/피드/배지·리더보드·친구)과 관리자 통계처럼
 * UI에서 차단된 표면의 기존 위반. 재노출 전에 함께 고쳐야 하며, **새 항목 추가는 금지**한다.
 * users.metadata(capsule-memo)는 컬럼 gap-apply 대기 상태이고 코드가 실패를 정직하게 알린다.
 */
const KNOWN_GAPS = new Set([
  'app/(main)/home/_components/HomeActivityBar.tsx',
  'app/(main)/nutrition/page.tsx',
  'app/(main)/profile/page.tsx',
  'app/(main)/record/page.tsx',
  'app/(main)/wellness/page.tsx',
  'app/(main)/workout/result/page.tsx',
  'app/api/coach/capsule-memo/route.ts',
  'app/api/nutrition/summary/daily/route.ts',
  'app/api/reports/monthly/route.ts',
  'app/api/reports/weekly/route.ts',
  'app/api/social/activities/[id]/comments/route.ts',
  'hooks/useHomeData.ts',
  'hooks/useUserMatching.ts',
  'lib/admin/stats.ts',
  'lib/admin/user-activity-stats.ts',
  'lib/coach/workout-rag.ts',
  'lib/friends/queries.ts',
  'lib/leaderboard/cron.ts',
  'lib/leaderboard/queries.ts',
  'lib/reports/yearlyAggregator.ts',
  'scripts/migrate-preferences.ts',
]);

/** 코치 컨텍스트는 5축 조회만 검사한다(운동·영양 조회는 숨김 모듈이라 KNOWN_GAPS 테이블로 판정). */
const HIDDEN_MODULE_TABLES = new Set([
  'workout_analyses',
  'workout_logs',
  'workout_plans',
  'workout_streaks',
  'nutrition_settings',
  'daily_nutrition_summary',
  'meal_records',
  'water_records',
  'wellness_scores',
  'mental_health_logs',
  'leaderboard_cache',
  'challenge_participations',
]);

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'coverage', '.turbo', 'tests']);

function readSchema(): Map<string, Set<string>> {
  const schema = new Map<string, Set<string>>();
  const add = (table: string, column: string): void => {
    const key = table.toLowerCase();
    if (!schema.has(key)) schema.set(key, new Set());
    schema.get(key)!.add(column.toLowerCase());
  };

  for (const dir of MIGRATION_DIRS) {
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.sql'));
    } catch {
      continue;
    }

    for (const file of files) {
      const raw = readFileSync(join(dir, file), 'utf-8').replace(/--[^\n]*/g, '');

      const createRe =
        /CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\n\s*\)\s*;/gi;
      for (const match of raw.matchAll(createRe)) {
        const table = match[1];
        if (!schema.has(table.toLowerCase())) schema.set(table.toLowerCase(), new Set());
        for (const line of match[2].split('\n')) {
          const col = new RegExp(`^"?(\\w+)"?\\s+(?:${COLUMN_TYPES}|\\w+\\[\\])`, 'i').exec(
            line.trim()
          );
          if (col && !NON_COLUMN_KEYWORDS.has(col[1].toUpperCase())) add(table, col[1]);
        }
      }

      // ALTER TABLE 한 문장에 ADD COLUMN이 여러 개 올 수 있다.
      const alterRe = /ALTER TABLE\s+(?:IF EXISTS\s+)?(?:public\.)?"?(\w+)"?\s+([\s\S]*?);/gi;
      for (const match of raw.matchAll(alterRe)) {
        for (const add1 of match[2].matchAll(/ADD COLUMN(?: IF NOT EXISTS)?\s+"?(\w+)"?/gi)) {
          add(match[1], add1[1]);
        }
        for (const ren of match[2].matchAll(/RENAME COLUMN\s+"?(\w+)"?\s+TO\s+"?(\w+)"?/gi)) {
          add(match[1], ren[2]);
        }
      }

      // 뷰는 컬럼을 정적으로 알 수 없어 검사 대상에서 제외한다.
      for (const view of raw.matchAll(
        /CREATE (?:OR REPLACE )?(?:MATERIALIZED )?VIEW\s+(?:public\.)?"?(\w+)"?/gi
      )) {
        add(view[1], '__view__');
      }
    }
  }

  return schema;
}

function collectSources(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSources(full, acc);
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.includes('.test.') &&
      !entry.includes('.spec.')
    ) {
      acc.push(full);
    }
  }
  return acc;
}

interface Violation {
  file: string;
  line: number;
  table: string;
  missing: string[];
}

function findViolations(schema: Map<string, Set<string>>): Violation[] {
  const violations: Violation[] = [];
  const selectRe =
    /\.from\(\s*'([a-z_0-9]+)'\s*\)\s*(?:(?:\/\/[^\n]*)?\n\s*)*\.select\(\s*(['"`])([\s\S]*?)\2/g;

  for (const file of collectSources(WEB_ROOT)) {
    const source = readFileSync(file, 'utf-8');
    const rel = relative(WEB_ROOT, file).replace(/\\/g, '/');

    for (const match of source.matchAll(selectRe)) {
      const table = match[1].toLowerCase();
      const selection = match[3];
      const columns = schema.get(table);
      if (!columns || columns.size === 0 || columns.has('__view__')) continue;
      if (selection.includes('*')) continue;
      if (HIDDEN_MODULE_TABLES.has(table)) continue;

      const missing: string[] = [];
      // 조인 구문 table(col, ...)은 별도 테이블이라 이 검사에서 제외한다.
      for (const rawColumn of selection.replace(/\w+\s*(?:!\w+)?\s*\([^)]*\)/g, '').split(',')) {
        let column = rawColumn.trim().split('::')[0].trim();
        if (column.includes(':')) column = column.split(':').slice(1).join(':').trim();
        column = column.replace(/"/g, '').trim().toLowerCase();
        if (!column || column === 'count') continue;
        if (!/^[a-z_0-9]+$/.test(column)) continue;
        if (!columns.has(column)) missing.push(column);
      }

      if (missing.length > 0) {
        violations.push({
          file: rel,
          line: source.slice(0, match.index ?? 0).split('\n').length,
          table,
          missing,
        });
      }
    }
  }

  return violations;
}

describe('Supabase select 컬럼 계약', () => {
  const schema = readSchema();

  it('마이그레이션에서 핵심 테이블 스키마를 읽는다', () => {
    expect(schema.get('personal_color_assessments')?.has('season')).toBe(true);
    expect(schema.get('skin_analyses')?.has('hydration')).toBe(true);
    expect(schema.get('body_analyses')?.has('weight')).toBe(true);
  });

  it('실재하지 않는 컬럼을 조회하는 활성 표면이 없다', () => {
    const violations = findViolations(schema).filter((v) => !KNOWN_GAPS.has(v.file));
    const report = violations
      .map((v) => `${v.file}:${v.line} from('${v.table}') 없는 컬럼: ${v.missing.join(', ')}`)
      .join('\n');

    expect(report).toBe('');
  });

  it('과거에 코치를 침묵시킨 컬럼들이 되살아나지 않는다', () => {
    const context = readFileSync(join(WEB_ROOT, 'lib/coach/context.ts'), 'utf-8');

    expect(context).not.toMatch(/\.select\('result'\)/);
    expect(context).toContain("select('season, undertone, season_subtype')");
    expect(context).toContain(
      "select('skin_type, hydration, oil_level, sensitivity, problem_areas')"
    );
    expect(context).toContain("select('body_type, height, weight')");
  });
});
