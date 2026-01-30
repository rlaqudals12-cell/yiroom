# SEC-1-R1: JWT 토큰 보안

> Clerk 인증 기반 JWT 보안 및 세션 관리 심화 전략

## 1. 리서치 배경

### 1.1 현재 상황

이룸 프로젝트는 Clerk를 인증 제공자로 사용하며, Supabase와 연동하여 RLS(Row Level Security)를 적용합니다. JWT 토큰의 안전한 관리와 세션 보안이 핵심입니다.

### 1.2 리서치 목표

- Clerk JWT 토큰 라이프사이클 이해
- 세션 토큰 보안 최적화
- Supabase RLS 연동 강화

## 2. JWT 보안 핵심 원리

### 2.1 Clerk 토큰 구조

```typescript
// Clerk JWT Payload 구조
interface ClerkJWTPayload {
  // 표준 클레임
  sub: string;           // Clerk User ID
  iat: number;           // Issued At (발급 시간)
  exp: number;           // Expiration (만료 시간)
  nbf: number;           // Not Before
  iss: string;           // Issuer (https://clerk.{instance}.com)

  // Clerk 커스텀 클레임
  azp: string;           // Authorized Party (클라이언트 ID)
  sid: string;           // Session ID
  org_id?: string;       // Organization ID (있는 경우)
  org_role?: string;     // Organization Role

  // 커스텀 메타데이터
  metadata?: {
    role?: string;
    level?: string;
  };
}
```

### 2.2 토큰 유효시간 전략

```typescript
// lib/auth/token-config.ts

// Clerk 토큰 유효시간 설정
export const TOKEN_CONFIG = {
  // 세션 토큰: 60초 (Clerk 기본값)
  // - 짧은 유효시간으로 탈취 시 피해 최소화
  // - Clerk SDK가 자동 갱신 처리
  sessionTokenLifetime: 60,

  // Refresh Token 회전
  // - 사용할 때마다 새 토큰 발급
  // - 기존 토큰은 즉시 무효화
  refreshTokenRotation: true,

  // 비활성 세션 타임아웃 (24시간)
  inactivityTimeout: 24 * 60 * 60 * 1000,

  // 절대 세션 타임아웃 (7일)
  absoluteTimeout: 7 * 24 * 60 * 60 * 1000,
};
```

### 2.3 토큰 검증 플로우

```typescript
// lib/auth/verify-token.ts
import { verifyToken } from '@clerk/backend';

export interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  sessionId?: string;
  error?: string;
}

export async function verifyClerkToken(
  token: string
): Promise<TokenVerificationResult> {
  try {
    // Clerk SDK를 통한 토큰 검증
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      // 허용된 발급자 검증
      issuer: [
        `https://clerk.${process.env.CLERK_INSTANCE}.com`,
      ],
      // 허용된 클라이언트 검증
      authorizedParties: [
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      ],
      // 클럭 스큐 허용 (5초)
      clockSkewInMs: 5000,
    });

    return {
      valid: true,
      userId: payload.sub,
      sessionId: payload.sid,
    };
  } catch (error) {
    if (error instanceof Error) {
      // 에러 유형별 처리
      if (error.message.includes('expired')) {
        return { valid: false, error: 'TOKEN_EXPIRED' };
      }
      if (error.message.includes('signature')) {
        return { valid: false, error: 'INVALID_SIGNATURE' };
      }
    }
    return { valid: false, error: 'VERIFICATION_FAILED' };
  }
}
```

## 3. Supabase RLS 연동

### 3.1 JWT 클레임 추출 함수

```sql
-- Supabase에서 Clerk JWT 클레임 추출
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE SQL STABLE;

-- 세션 ID 추출 (감사 로깅용)
CREATE OR REPLACE FUNCTION auth.clerk_session_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sid',
    ''
  );
$$ LANGUAGE SQL STABLE;
```

### 3.2 RLS 정책 적용

```sql
-- 사용자 본인 데이터만 접근
CREATE POLICY "user_own_data_policy" ON user_profiles
  FOR ALL
  USING (clerk_user_id = auth.clerk_user_id());

-- 분석 결과 접근 정책
CREATE POLICY "analysis_results_policy" ON skin_analysis_results
  FOR ALL
  USING (clerk_user_id = auth.clerk_user_id());

-- 공유된 결과 조회 허용
CREATE POLICY "shared_results_view_policy" ON shared_results
  FOR SELECT
  USING (
    clerk_user_id = auth.clerk_user_id()
    OR is_public = true
    OR share_token IS NOT NULL
  );
```

### 3.3 Supabase 클라이언트 구성

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

export function useClerkSupabaseClient() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: async () => {
            // Clerk 세션에서 Supabase용 토큰 가져오기
            const token = await session?.getToken({
              template: 'supabase',
            });

            return {
              Authorization: token ? `Bearer ${token}` : '',
            };
          },
        },
        auth: {
          persistSession: false,  // Clerk가 세션 관리
          autoRefreshToken: false,
        },
      }
    );
  }, [session]);
}
```

## 4. 보안 강화 패턴

### 4.1 토큰 재사용 공격 방지

```typescript
// lib/auth/token-nonce.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// 토큰 논스 검증 (Replay Attack 방지)
export async function validateTokenNonce(
  sessionId: string,
  tokenNonce: string
): Promise<boolean> {
  const key = `token_nonce:${sessionId}`;
  const lastNonce = await redis.get<string>(key);

  // 논스가 이전과 동일하면 재사용 공격 의심
  if (lastNonce === tokenNonce) {
    console.warn('[Security] Possible token replay attack detected');
    return false;
  }

  // 새 논스 저장 (60초 TTL)
  await redis.set(key, tokenNonce, { ex: 60 });
  return true;
}
```

### 4.2 세션 바인딩 강화

```typescript
// lib/auth/session-binding.ts

interface SessionContext {
  userAgent: string;
  ipAddress: string;
  geoLocation?: string;
}

export async function validateSessionBinding(
  sessionId: string,
  currentContext: SessionContext
): Promise<{ valid: boolean; reason?: string }> {
  const storedContext = await getStoredSessionContext(sessionId);

  if (!storedContext) {
    // 새 세션 - 컨텍스트 저장
    await storeSessionContext(sessionId, currentContext);
    return { valid: true };
  }

  // User-Agent 변경 감지
  if (storedContext.userAgent !== currentContext.userAgent) {
    return {
      valid: false,
      reason: 'USER_AGENT_CHANGED'
    };
  }

  // IP 대역 변경 감지 (같은 /24 서브넷 허용)
  if (!isSameSubnet(storedContext.ipAddress, currentContext.ipAddress)) {
    // 경고만 로깅, 차단하지 않음 (모바일 환경 고려)
    console.warn('[Session] IP subnet changed', {
      sessionId,
      from: storedContext.ipAddress,
      to: currentContext.ipAddress,
    });
  }

  return { valid: true };
}
```

### 4.3 강제 로그아웃 구현

```typescript
// lib/auth/force-logout.ts
import { clerkClient } from '@clerk/nextjs/server';

// 특정 세션 무효화
export async function revokeSession(
  userId: string,
  sessionId: string
): Promise<void> {
  await clerkClient.sessions.revokeSession(sessionId);

  // 감사 로그
  await logAudit('session.revoked', {
    userId,
    sessionId,
    reason: 'manual_revocation',
  });
}

// 모든 세션 무효화 (비밀번호 변경 시 등)
export async function revokeAllSessions(
  userId: string,
  exceptCurrentSession?: string
): Promise<void> {
  const sessions = await clerkClient.sessions.getSessionList({
    userId,
  });

  for (const session of sessions.data) {
    if (session.id !== exceptCurrentSession) {
      await clerkClient.sessions.revokeSession(session.id);
    }
  }

  await logAudit('session.revoked_all', {
    userId,
    count: sessions.data.length,
  });
}
```

## 5. 미들웨어 보안

### 5.1 인증 미들웨어

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
  // 공개 라우트
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/(.*)',
    '/api/public/(.*)',
  ],

  // 인증 후 처리
  afterAuth(auth, req) {
    // 인증되지 않은 보호 라우트 접근
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // 추가 보안 헤더
    const response = NextResponse.next();

    // CSRF 토큰 검증 (상태 변경 요청)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const csrfToken = req.headers.get('x-csrf-token');
      // CSRF 검증 로직...
    }

    return response;
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### 5.2 API 라우트 보호

```typescript
// lib/auth/protect-api.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (
  request: NextRequest,
  context: { userId: string; sessionId: string }
) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler) {
  return async function (request: NextRequest): Promise<NextResponse> {
    const { userId, sessionId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 세션 컨텍스트 검증
    const context = extractRequestContext(request);
    const validation = await validateSessionBinding(sessionId!, context);

    if (!validation.valid) {
      // 의심스러운 세션 - 강제 로그아웃
      await revokeSession(userId, sessionId!);

      return NextResponse.json(
        { error: 'Session invalidated', reason: validation.reason },
        { status: 401 }
      );
    }

    return handler(request, { userId, sessionId: sessionId! });
  };
}
```

## 6. 구현 체크리스트

### 6.1 P0 (필수 구현)

- [ ] Clerk JWT 템플릿 Supabase 연동 설정
- [ ] RLS 정책에 `auth.clerk_user_id()` 적용
- [ ] 미들웨어 인증 검증 적용
- [ ] API 라우트 `withAuth` 래퍼 적용

### 6.2 P1 (권장 구현)

- [ ] 세션 바인딩 검증 (User-Agent, IP)
- [ ] 토큰 재사용 공격 감지
- [ ] 의심스러운 활동 로깅
- [ ] 강제 로그아웃 API

### 6.3 P2 (고급 구현)

- [ ] Redis 기반 세션 블랙리스트
- [ ] 디바이스 핑거프린팅
- [ ] 이상 접근 패턴 감지
- [ ] MFA 연동 강화

## 7. 참고 자료

- [Clerk JWT Customization](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase RLS with Custom JWT](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
