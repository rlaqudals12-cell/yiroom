/**
 * 통합 헬스체크 API
 *
 * DB 스키마, Clerk 통합, Supabase 연결 상태를 한 번에 확인.
 *
 * @route GET /api/health
 * @auth 불필요 (proxy.ts에서 공개 라우트)
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface HealthCheckResult {
  status: 'ok' | 'warning' | 'error';
  checks: {
    supabase: {
      status: 'ok' | 'error';
      latencyMs: number;
      message: string;
    };
    dbSchema: {
      status: 'ok' | 'warning' | 'error';
      message: string;
    };
    clerk: {
      status: 'ok' | 'warning' | 'error';
      message: string;
    };
  };
  checkedAt: string;
}

export async function GET(request: Request): Promise<NextResponse<HealthCheckResult>> {
  const baseUrl = new URL(request.url).origin;

  // 모든 체크를 병렬 실행
  const [supabaseResult, dbSchemaResult, clerkResult] = await Promise.allSettled([
    checkSupabase(),
    fetchSubCheck(`${baseUrl}/api/health/db-schema`),
    fetchSubCheck(`${baseUrl}/api/health/clerk`),
  ]);

  const supabase =
    supabaseResult.status === 'fulfilled'
      ? supabaseResult.value
      : { status: 'error' as const, latencyMs: 0, message: '연결 실패' };

  const dbSchemaStatus =
    dbSchemaResult.status === 'fulfilled'
      ? toStatusType(dbSchemaResult.value.status)
      : ('error' as const);
  const dbSchema = {
    status: dbSchemaStatus,
    message: dbSchemaResult.status === 'fulfilled' ? dbSchemaResult.value.message : '검사 실패',
  };

  const clerkStatus =
    clerkResult.status === 'fulfilled'
      ? toStatusType(clerkResult.value.status)
      : ('error' as const);
  const clerk = {
    status: clerkStatus,
    message: clerkResult.status === 'fulfilled' ? summarizeClerk(clerkResult.value) : '검사 실패',
  };

  // 전체 상태 결정
  const statuses = [supabase.status, dbSchema.status, clerk.status];
  const overall = statuses.includes('error')
    ? 'error'
    : statuses.includes('warning')
      ? 'warning'
      : 'ok';

  return NextResponse.json({
    status: overall,
    checks: {
      supabase,
      dbSchema,
      clerk,
    },
    checkedAt: new Date().toISOString(),
  });
}

/** Supabase 연결 상태 + 지연시간 측정 */
async function checkSupabase(): Promise<{
  status: 'ok' | 'error';
  latencyMs: number;
  message: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    const start = Date.now();
    const { error } = await supabase.from('users').select('id').limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      return { status: 'error', latencyMs, message: `쿼리 에러: ${error.code}` };
    }

    return {
      status: 'ok',
      latencyMs,
      message: `정상 (${latencyMs}ms)`,
    };
  } catch {
    return { status: 'error', latencyMs: 0, message: 'Supabase 연결 실패' };
  }
}

/** 하위 헬스체크 엔드포인트 호출 */
async function fetchSubCheck(
  url: string
): Promise<{ status: string; message: string; [key: string]: unknown }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    return { status: 'error', message: `HTTP ${response.status}` };
  }
  return response.json();
}

/** string → StatusType 변환 */
type StatusType = 'ok' | 'warning' | 'error';
function toStatusType(s: string): StatusType {
  if (s === 'ok' || s === 'warning' || s === 'error') return s;
  return 'error';
}

/** Clerk 헬스체크 결과 요약 */
function summarizeClerk(data: {
  status: string;
  checks?: { clockOffset?: { message?: string } };
}): string {
  if (data.status === 'ok') return '정상';
  if (data.checks?.clockOffset?.message) return data.checks.clockOffset.message;
  return '문제 감지';
}
