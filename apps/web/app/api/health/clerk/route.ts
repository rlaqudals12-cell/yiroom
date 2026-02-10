/**
 * Clerk 통합 헬스체크 API
 *
 * 시스템 시계 오프셋, Clerk 연결 상태, Supabase JWT 연동을 검증.
 *
 * @route GET /api/health/clerk
 * @auth 불필요 (proxy.ts에서 공개 라우트)
 */

import { NextResponse } from 'next/server';

interface ClerkCheckResult {
  status: 'ok' | 'warning' | 'error';
  checks: {
    clockOffset: {
      status: 'ok' | 'warning' | 'error';
      offsetMs: number;
      message: string;
    };
    clerkEnv: {
      status: 'ok' | 'error';
      message: string;
    };
    supabaseEnv: {
      status: 'ok' | 'error';
      message: string;
    };
  };
  checkedAt: string;
}

export async function GET(): Promise<NextResponse<ClerkCheckResult>> {
  try {
    // 1. 시스템 시계 오프셋 확인 (외부 시간 API 사용)
    let clockOffset = 0;
    let clockStatus: 'ok' | 'warning' | 'error' = 'ok';
    let clockMessage = '';

    try {
      const before = Date.now();
      const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
        signal: AbortSignal.timeout(3000),
      });
      const after = Date.now();

      if (response.ok) {
        const data = await response.json();
        const serverTime = new Date(data.utc_datetime).getTime();
        // 네트워크 지연 보정
        const localTime = (before + after) / 2;
        clockOffset = Math.abs(serverTime - localTime);

        if (clockOffset > 10000) {
          clockStatus = 'error';
          clockMessage = `시계 오프셋 ${(clockOffset / 1000).toFixed(1)}초 - Clerk JWT 오류 발생 가능. w32tm /resync /force 실행 필요`;
        } else if (clockOffset > 5000) {
          clockStatus = 'warning';
          clockMessage = `시계 오프셋 ${(clockOffset / 1000).toFixed(1)}초 - 주의 필요`;
        } else {
          clockMessage = `시계 오프셋 ${clockOffset}ms (정상)`;
        }
      } else {
        clockMessage = '시간 서버 응답 오류 (무시 가능)';
      }
    } catch {
      clockMessage = '시간 서버 연결 실패 (무시 가능)';
    }

    // 2. Clerk 환경 변수 확인
    const hasClerkPublishable = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const hasClerkSecret = !!process.env.CLERK_SECRET_KEY;
    const clerkEnvOk = hasClerkPublishable && hasClerkSecret;

    // 3. Supabase 환경 변수 확인
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasSupabaseService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseEnvOk = hasSupabaseUrl && hasSupabaseAnon && hasSupabaseService;

    // 4. 전체 상태 결정
    const overall =
      !clerkEnvOk || !supabaseEnvOk
        ? 'error'
        : clockStatus === 'error'
          ? 'error'
          : clockStatus === 'warning'
            ? 'warning'
            : 'ok';

    return NextResponse.json({
      status: overall,
      checks: {
        clockOffset: {
          status: clockStatus,
          offsetMs: clockOffset,
          message: clockMessage,
        },
        clerkEnv: {
          status: clerkEnvOk ? 'ok' : 'error',
          message: clerkEnvOk
            ? 'Clerk 환경 변수 정상'
            : `누락: ${[
                !hasClerkPublishable && 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
                !hasClerkSecret && 'CLERK_SECRET_KEY',
              ]
                .filter(Boolean)
                .join(', ')}`,
        },
        supabaseEnv: {
          status: supabaseEnvOk ? 'ok' : 'error',
          message: supabaseEnvOk
            ? 'Supabase 환경 변수 정상'
            : `누락: ${[
                !hasSupabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
                !hasSupabaseAnon && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                !hasSupabaseService && 'SUPABASE_SERVICE_ROLE_KEY',
              ]
                .filter(Boolean)
                .join(', ')}`,
        },
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health] Clerk check error:', error);

    return NextResponse.json(
      {
        status: 'error' as const,
        checks: {
          clockOffset: { status: 'error' as const, offsetMs: 0, message: '검사 실패' },
          clerkEnv: { status: 'error' as const, message: '검사 실패' },
          supabaseEnv: { status: 'error' as const, message: '검사 실패' },
        },
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
