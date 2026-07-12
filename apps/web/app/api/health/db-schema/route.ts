/**
 * DB 스키마 헬스체크 API
 *
 * 원격 Supabase에 필수 테이블/컬럼이 존재하는지 검증.
 * 누락된 컬럼이 있으면 해당 마이그레이션 파일명을 반환.
 *
 * @route GET /api/health/db-schema
 * @auth CRON_SECRET(Bearer) 또는 관리자 — 내부 스키마·마이그레이션명이 노출되므로 보호
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { isAdmin } from '@/lib/admin/auth';
import { POST_CREATION_COLUMNS, REQUIRED_TABLES } from '@/lib/db/expected-schema';
import { selectByCondition } from '@/lib/utils/conditional-helpers';

interface MissingColumn {
  table: string;
  column: string;
  migration: string;
  addedDate: string;
}

interface SchemaCheckResult {
  status: 'ok' | 'warning' | 'error';
  missingTables: string[];
  missingColumns: MissingColumn[];
  checkedAt: string;
  message: string;
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- API route handler
export async function GET(request: NextRequest): Promise<NextResponse<SchemaCheckResult>> {
  // 인증: CRON_SECRET(Bearer) 또는 관리자.
  // 미인증 호출은 전체 상태(ok/warning/error)만 받고, 내부 테이블·컬럼·
  // 마이그레이션명 등 상세는 가린다. (통합 /api/health 집계가 서버-투-서버로
  // 이 라우트를 무인증 호출하므로 상태 자체는 계속 노출해 집계가 정직하게 동작하되,
  // 실제 민감 정보인 스키마 이름 목록만 인증된 호출에만 반환한다.)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
  const isAuthed = hasCronAuth || (await isAdmin());

  try {
    const supabase = createServiceRoleClient();

    // 1. 필수 테이블 존재 확인
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables' as string)
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [...REQUIRED_TABLES]);

    // information_schema 직접 쿼리 불가 시 RPC 또는 raw SQL 사용
    let existingTables: string[] = [];
    let missingTables: string[] = [];

    if (tableError) {
      // Supabase에서 information_schema 직접 접근 불가 → 각 테이블에 .select() 시도
      for (const table of REQUIRED_TABLES) {
        const { error } = await supabase.from(table).select('id').limit(0);
        if (!error) {
          existingTables.push(table);
        } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
          missingTables.push(table);
        } else {
          // 테이블 존재하지만 다른 에러 (RLS 등) → 존재하는 것으로 간주
          existingTables.push(table);
        }
      }
    } else {
      existingTables = (tableData ?? []).map((r: { table_name: string }) => r.table_name);
      missingTables = [...REQUIRED_TABLES].filter((t) => !existingTables.includes(t));
    }

    // 2. 추가된 컬럼 존재 확인
    const missingColumns: MissingColumn[] = [];

    // 존재하는 테이블의 컬럼만 검사
    const tablesToCheck = [
      ...new Set(
        POST_CREATION_COLUMNS.map((c) => c.table).filter((t) => existingTables.includes(t))
      ),
    ];

    for (const table of tablesToCheck) {
      // 테이블에서 아무 row나 가져와서 컬럼 확인 (limit 0 + select)
      const columnsToCheck = POST_CREATION_COLUMNS.filter((c) => c.table === table);

      for (const col of columnsToCheck) {
        const { error } = await supabase.from(table).select(col.column).limit(0);

        if (error && (error.message?.includes('does not exist') || error.code === '42703')) {
          missingColumns.push({
            table: col.table,
            column: col.column,
            migration: col.migration,
            addedDate: col.addedDate,
          });
        }
      }
    }

    // 3. 결과 조합
    const hasMissing = missingTables.length > 0 || missingColumns.length > 0;
    const status =
      missingTables.length > 0
        ? 'error'
        : selectByCondition(missingColumns.length > 0, 'warning', 'ok');

    const messageParts: string[] = [];
    if (missingTables.length > 0) {
      messageParts.push(`${missingTables.length}개 테이블 누락`);
    }
    if (missingColumns.length > 0) {
      const migrations = [...new Set(missingColumns.map((c) => c.migration))];
      messageParts.push(`${migrations.length}개 마이그레이션 미적용`);
    }

    // 미인증 호출: 상세(테이블·컬럼·마이그레이션명)를 가리고 상태만 반환
    if (!isAuthed) {
      return NextResponse.json({
        status,
        missingTables: [],
        missingColumns: [],
        checkedAt: new Date().toISOString(),
        message: hasMissing ? '스키마 점검 필요 (상세는 인증 필요)' : '스키마 정상',
      });
    }

    return NextResponse.json({
      status,
      missingTables,
      missingColumns,
      checkedAt: new Date().toISOString(),
      message: hasMissing ? messageParts.join(', ') : '스키마 정상',
    });
  } catch (error) {
    console.error('[Health] DB schema check error:', error);

    return NextResponse.json(
      {
        status: 'error' as const,
        missingTables: [],
        missingColumns: [],
        checkedAt: new Date().toISOString(),
        message: 'DB 연결 실패',
      },
      { status: 500 }
    );
  }
}
