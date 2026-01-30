# Clerk 인증 고도화

> **ID**: AUTH-CLERK-ADVANCED
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/middleware.ts, apps/web/lib/auth/

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// apps/web/proxy.ts (middleware.ts 역할)
✅ clerkMiddleware 적용
✅ auth.protect() 기본 사용
✅ 공개/보호 라우트 분리
✅ Supabase JWT 통합

// 개선 필요 항목
❌ MFA 강제 적용 (민감 작업)
❌ 세션 관리 고도화
❌ 역할 기반 접근 제어 (RBAC)
❌ 보안 강화 (CVE-2025-29927 대응)
❌ 에러 처리 개선
```

---

## 2. 보안 업데이트 (필수)

### 2.1 CVE-2025-29927 대응

```typescript
// ⚠️ 심각: Next.js 11.1.4 ~ 15.2.2 취약점
// x-middleware-subrequest 헤더로 미들웨어 우회 가능

// 해결책 1: Next.js 15.2.3+ 업그레이드 (필수)
// package.json
{
  "dependencies": {
    "next": "^15.2.3"
  }
}

// 해결책 2: 추가 보안 레이어 (권장)
// 데이터 접근 시점에서 재검증
```

### 2.2 Defense in Depth

```typescript
// lib/auth/validate-session.ts
import { auth } from '@clerk/nextjs/server';
import { cache } from 'react';

// 요청 레벨 캐싱으로 중복 검증 방지
export const validateSession = cache(async () => {
  const { userId, sessionId } = await auth();

  if (!userId || !sessionId) {
    throw new Error('Unauthorized');
  }

  return { userId, sessionId };
});

// 데이터 접근 레이어에서 사용
// lib/api/skin.ts
export async function getSkinAnalysis(id: string) {
  const { userId } = await validateSession();

  const { data, error } = await supabase
    .from('skin_analyses')
    .select('*')
    .eq('id', id)
    .eq('clerk_user_id', userId) // 이중 검증
    .single();

  return data;
}
```

---

## 3. MFA (다단계 인증)

### 3.1 MFA 활성화

```typescript
// Clerk Dashboard에서 MFA 활성화:
// 1. Configure > Multi-factor > Enable
// 2. Methods: Authenticator app, SMS

// 사용자별 MFA 상태 확인
import { auth } from '@clerk/nextjs/server';

export async function checkMfaStatus() {
  const { sessionClaims } = await auth();

  return {
    mfaEnabled: sessionClaims?.mfa_enabled === true,
    mfaVerified: sessionClaims?.mfa_verified === true,
  };
}
```

### 3.2 민감 작업 MFA 강제

```typescript
// lib/auth/require-mfa.ts
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function requireMfa() {
  const { sessionClaims } = await auth();

  // MFA 미설정 시 설정 페이지로
  if (!sessionClaims?.mfa_enabled) {
    redirect('/settings/security?setup=mfa');
  }

  // MFA 미인증 시 인증 요청
  if (!sessionClaims?.mfa_verified) {
    redirect('/sign-in?verify=mfa');
  }
}

// 사용: 계정 삭제, 결제 정보 변경 등
// app/settings/delete-account/page.tsx
export default async function DeleteAccountPage() {
  await requireMfa();
  // ...
}
```

### 3.3 Step-Up Authentication

```typescript
// components/auth/StepUpAuth.tsx
'use client';

import { useAuth, useUser } from '@clerk/nextjs';

export function StepUpAuth({
  onVerified,
  children,
}: {
  onVerified: () => void;
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [showVerify, setShowVerify] = useState(false);

  const handleSensitiveAction = async () => {
    // MFA 재인증 필요 여부 확인
    const needsVerification = await checkNeedsReauth();

    if (needsVerification) {
      setShowVerify(true);
    } else {
      onVerified();
    }
  };

  if (showVerify) {
    return (
      <VerifyMfaModal
        onSuccess={() => {
          setShowVerify(false);
          onVerified();
        }}
        onCancel={() => setShowVerify(false)}
      />
    );
  }

  return <div onClick={handleSensitiveAction}>{children}</div>;
}
```

---

## 4. 세션 관리

### 4.1 Clerk 세션 특징

```typescript
// Clerk 자동 처리:
// ✅ 60초 만료 JWT 자동 갱신
// ✅ 탭 간 세션 동기화
// ✅ Secure 쿠키 자동 설정
// ✅ Edge Runtime 네이티브 지원
```

### 4.2 세션 이벤트 처리

```typescript
// components/providers/SessionProvider.tsx
'use client';

import { useAuth, useSession } from '@clerk/nextjs';
import { useEffect } from 'react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;

    // 세션 만료 임박 시 알림
    const expiresAt = new Date(session.expireAt);
    const warningTime = 5 * 60 * 1000; // 5분 전

    const checkExpiry = () => {
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      if (timeUntilExpiry < warningTime && timeUntilExpiry > 0) {
        // 세션 연장 알림 표시
        showSessionExpiryWarning();
      }
    };

    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [session]);

  // 다른 탭에서 로그아웃 시 처리
  useEffect(() => {
    if (!isSignedIn) {
      // 로컬 상태 정리
      clearLocalState();
      // 로그인 페이지로 리다이렉트
      window.location.href = '/sign-in';
    }
  }, [isSignedIn]);

  return <>{children}</>;
}
```

### 4.3 디바이스 관리

```typescript
// app/settings/security/devices/page.tsx
import { auth, clerkClient } from '@clerk/nextjs/server';

export default async function DevicesPage() {
  const { userId } = await auth();
  const client = await clerkClient();

  const sessions = await client.sessions.getSessionList({
    userId,
    status: 'active',
  });

  return (
    <div>
      <h1>활성 세션</h1>
      {sessions.data.map((session) => (
        <DeviceCard
          key={session.id}
          session={session}
          isCurrent={session.id === currentSessionId}
        />
      ))}
    </div>
  );
}
```

---

## 5. 역할 기반 접근 제어 (RBAC)

### 5.1 역할 정의

```typescript
// lib/auth/roles.ts
export const ROLES = {
  user: 'user',
  premium: 'premium',
  admin: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_PERMISSIONS = {
  user: ['read:own', 'write:own', 'analyze:basic'],
  premium: ['read:own', 'write:own', 'analyze:all', 'export'],
  admin: ['read:all', 'write:all', 'analyze:all', 'admin'],
} as const;
```

### 5.2 JWT Claims에 역할 추가

```typescript
// Clerk Dashboard > JWT Templates > Custom Claims
{
  "sub": "{{user.id}}",
  "role": "{{user.publicMetadata.role}}",
  "permissions": "{{user.publicMetadata.permissions}}"
}
```

### 5.3 역할 검증

```typescript
// lib/auth/check-role.ts
import { auth } from '@clerk/nextjs/server';

export async function checkRole(requiredRole: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.role as Role || 'user';

  const roleHierarchy: Role[] = ['user', 'premium', 'admin'];
  const userLevel = roleHierarchy.indexOf(userRole);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);

  return userLevel >= requiredLevel;
}

export async function requireRole(requiredRole: Role) {
  const hasRole = await checkRole(requiredRole);

  if (!hasRole) {
    redirect('/upgrade'); // 또는 403 에러
  }
}

// 사용
// app/(main)/analysis/comprehensive/page.tsx
export default async function ComprehensiveAnalysisPage() {
  await requireRole('premium');
  // ...
}
```

### 5.4 미들웨어 역할 검증

```typescript
// middleware.ts (proxy.ts)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPremiumRoute = createRouteMatcher([
  '/analysis/comprehensive(.*)',
  '/export(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.role as string || 'user';

  if (isPremiumRoute(req) && !['premium', 'admin'].includes(role)) {
    return Response.redirect(new URL('/upgrade', req.url));
  }

  if (isAdminRoute(req) && role !== 'admin') {
    return Response.redirect(new URL('/403', req.url));
  }
});
```

---

## 6. 라우트 보호 패턴

### 6.1 공개/보호 라우트

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about',
  '/privacy',
  '/terms',
  '/api/webhooks(.*)',
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/analysis(.*)',
  '/profile(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### 6.2 API 라우트 보호

```typescript
// app/api/analyze/skin/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 방법 1: auth.protect() - 자동 401 응답
  await auth.protect();

  // 방법 2: 수동 검증 - 커스텀 에러 처리
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: '로그인이 필요합니다' } },
      { status: 401 }
    );
  }

  // ... 비즈니스 로직
}
```

---

## 7. Supabase 통합

### 7.1 JWT 토큰 전달

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: 'supabase' });

          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: token ? `Bearer ${token}` : '',
            },
          });
        },
      },
    }
  );

  return client;
}
```

### 7.2 서버 사이드 Supabase

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function createServerSupabaseClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: 'supabase' });

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
    }
  );
}
```

---

## 8. 에러 처리

### 8.1 인증 에러 컴포넌트

```typescript
// components/auth/AuthError.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthErrorProps {
  error: Error;
  reset: () => void;
}

export function AuthError({ error, reset }: AuthErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // 특정 에러 시 로그인 페이지로
    if (error.message.includes('Unauthorized')) {
      router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [error, router]);

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold mb-4">접근 권한이 없습니다</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => router.push('/sign-in')}>로그인</Button>
        <Button variant="outline" onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
```

### 8.2 글로벌 에러 핸들링

```typescript
// app/global-error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // 인증 에러 특별 처리
  if (error.message.includes('CLERK')) {
    return <AuthError error={error} reset={reset} />;
  }

  return (
    <html>
      <body>
        <h2>문제가 발생했습니다</h2>
        <button onClick={() => reset()}>다시 시도</button>
      </body>
    </html>
  );
}
```

---

## 9. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Next.js 15.2.3+ 업그레이드 (CVE 대응)
- [ ] validateSession 함수로 이중 검증
- [ ] 라우트 보호 정리 (createRouteMatcher)

### 단기 적용 (P1)

- [ ] MFA 활성화 (대시보드)
- [ ] 민감 작업 MFA 강제
- [ ] 역할 기반 접근 제어

### 장기 적용 (P2)

- [ ] 디바이스 관리 UI
- [ ] 세션 만료 알림
- [ ] 감사 로그 강화

---

## 10. 참고 자료

- [Clerk Next.js 15 Integration Guide](https://www.buildwithmatija.com/blog/clerk-authentication-nextjs15-app-router)
- [Clerk Force MFA](https://clerk.com/docs/guides/secure/force-mfa)
- [Next.js Session Management](https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues)
- [Complete Authentication Guide](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)

---

**Version**: 1.0 | **Priority**: P0 Critical
