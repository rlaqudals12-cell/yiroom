/**
 * 계정 파기 커버리지 회귀 방지 (마이그레이션 소스 스캔)
 *
 * 배경 (2026-08 수리): 계정 삭제 라우트와 GDPR 하드삭제 크론이 서로 다른 테이블 목록을
 * 들고 있었고, 양쪽 어디에도 없는 사용자 테이블(옷장·캡슐·안전프로필·알림·쇼핑 취향 등)의
 * clerk_user_id 데이터가 계정 삭제 후 영구 잔존했다.
 *
 * 이 테스트는 마이그레이션 SQL을 직접 파싱해 `clerk_user_id` 컬럼을 가진 테이블을 전부 찾고,
 * 정본 목록(DELETION_TABLES) 또는 명시 예외(DELETION_EXEMPT_TABLES)에 없으면 실패시킨다.
 * → 새 사용자 테이블을 만들면 "파기할지 말지"를 반드시 결정하게 된다.
 *
 * ⚠️ 마이그레이션 디렉토리가 루트 `supabase/`와 `apps/web/supabase/` 두 곳이라 양쪽 다 스캔한다.
 *
 * @see types/gdpr.ts (단일 정본) · lib/api/user-rows-purge.ts (공용 파기 로직)
 * @note 기법 참조: apps/mobile/__tests__/lib/inventory/inventoryTable.test.ts (소스 스캔)
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { DELETION_TABLES, DELETION_EXEMPT_TABLES } from '@/types/gdpr';

const WEB_ROOT = path.resolve(__dirname, '../../..');
const REPO_ROOT = path.resolve(WEB_ROOT, '../..');
const MIGRATION_DIRS = [
  path.join(REPO_ROOT, 'supabase', 'migrations'),
  path.join(WEB_ROOT, 'supabase', 'migrations'),
];

/** 롤백 스크립트는 실제 스키마가 아니다 (DROP만 들어 있음) */
const EXCLUDED_DIR = 'rollback';

function collectSqlFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === EXCLUDED_DIR) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSqlFiles(full, acc);
    else if (entry.name.endsWith('.sql')) acc.push(full);
  }
  return acc;
}

/** SQL 주석 제거 — 주석 속 'clerk_user_id' 언급을 컬럼으로 오인하지 않도록 */
function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
}

function normalizeTableName(raw: string): string {
  return raw
    .replace(/public\./i, '')
    .replace(/"/g, '')
    .toLowerCase();
}

// 테이블명 문자군은 \w(=[A-Za-z0-9_]) + 스키마 접두사(.)·인용부호(")
const CREATE_TABLE_RE =
  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(([\s\S]*?)\n\s*\)\s*;/gi;
const ALTER_TABLE_RE = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([\w."]+)([^;]*);/gi;
const DROP_TABLE_RE = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([\w."]+)/gi;
const CLERK_COLUMN_RE = /(^|,)\s*clerk_user_id\s+[A-Za-z]/m;
const ADD_CLERK_COLUMN_RE = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?clerk_user_id/i;

/** 마이그레이션에서 clerk_user_id 컬럼을 가진 (그리고 삭제되지 않은) 테이블 수집 */
function collectClerkUserTables(): { tables: Set<string>; scannedFiles: number } {
  const tables = new Set<string>();
  const dropped = new Set<string>();
  const files = MIGRATION_DIRS.flatMap((dir) => collectSqlFiles(dir));

  for (const file of files) {
    const sql = stripSqlComments(fs.readFileSync(file, 'utf8'));

    for (const match of sql.matchAll(CREATE_TABLE_RE)) {
      if (CLERK_COLUMN_RE.test(match[2])) tables.add(normalizeTableName(match[1]));
    }
    for (const match of sql.matchAll(ALTER_TABLE_RE)) {
      if (ADD_CLERK_COLUMN_RE.test(match[2])) tables.add(normalizeTableName(match[1]));
    }
    for (const match of sql.matchAll(DROP_TABLE_RE)) {
      dropped.add(normalizeTableName(match[1]));
    }
  }

  for (const table of dropped) tables.delete(table);
  return { tables, scannedFiles: files.length };
}

describe('계정 파기 커버리지 — clerk_user_id 테이블 전수', () => {
  const { tables, scannedFiles } = collectClerkUserTables();

  it('마이그레이션 스캔이 실제로 동작한다 (경로 오타로 항상 통과하지 않도록)', () => {
    expect(scannedFiles).toBeGreaterThan(50);
    expect(tables.size).toBeGreaterThan(50);
    // 대표 테이블이 잡히는지 — 파서가 헛도는 경우 방지
    expect(tables.has('skin_analyses')).toBe(true);
    expect(tables.has('user_inventory')).toBe(true);
  });

  it('clerk_user_id를 가진 모든 테이블이 파기 목록 또는 명시 예외에 있다', () => {
    const covered = new Set<string>([...DELETION_TABLES, ...Object.keys(DELETION_EXEMPT_TABLES)]);

    const uncovered = [...tables].filter((table) => !covered.has(table)).sort();

    // 실패 시 메시지가 곧 할 일 목록: DELETION_TABLES에 추가하거나 예외 사유를 적는다
    expect(uncovered).toEqual([]);
  });

  it('예외 테이블에는 사유가 적혀 있다', () => {
    for (const [table, reason] of Object.entries(DELETION_EXEMPT_TABLES)) {
      expect(reason.length, `${table} 예외 사유 누락`).toBeGreaterThan(10);
    }
  });

  it('users는 파기 루프가 아니라 마지막 단독 삭제 대상이다 (FK CASCADE 기점)', () => {
    expect((DELETION_TABLES as readonly string[]).includes('users')).toBe(false);
    expect(DELETION_EXEMPT_TABLES.users).toBeDefined();
  });

  it('정본 목록에 중복이 없다', () => {
    expect(new Set(DELETION_TABLES).size).toBe(DELETION_TABLES.length);
  });

  it('2026-08 감사에서 확인된 누락 테이블이 전부 포함돼 있다', () => {
    const confirmedGaps = [
      'user_product_shelf',
      'beauty_profiles',
      'capsules',
      'daily_capsules',
      'safety_profiles',
      'connection_awareness',
      'connection_awareness_stats',
      'smart_notifications',
      'user_size_history',
      'user_shopping_preferences',
      'price_watches',
      'user_body_measurements',
      // 목록에 있던 이름이 실재하지 않아 빠져 있던 것들
      'coach_sessions', // 'coach_chat_history'는 존재하지 않는 테이블명
      'posture_analyses', // 'posture_assessments'는 존재하지 않는 테이블명
    ];

    for (const table of confirmedGaps) {
      expect((DELETION_TABLES as readonly string[]).includes(table), `${table} 누락`).toBe(true);
    }
  });
});
