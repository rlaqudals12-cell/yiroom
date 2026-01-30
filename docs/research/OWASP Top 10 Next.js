# P0-4-R1: OWASP Top 10 및 Next.js 보안 심층 리서치

## 1. 핵심 요약

**Next.js 16 + Supabase + Clerk 스택**에서 OWASP Top 10 취약점을 방어하려면 **다층 방어(Defense in Depth)** 전략이 필수입니다. 2025년 공개된 **CVE-2025-29927**(미들웨어 인증 우회, CVSS 9.1)과 **CVE-2025-55182**(RSC RCE, CVSS 10.0)은 단일 계층 인증의 위험성을 명확히 보여주며, 미들웨어→서버 컴포넌트→DAL→RLS의 4단계 검증이 요구됩니다. Supabase PostgREST는 자동 파라미터화로 SQL Injection을 기본 방어하지만, `.or()` 필터의 문자열 보간과 동적 테이블명 사용은 여전히 위험합니다. React의 JSX 자동 이스케이핑은 XSS 기본 방어를 제공하나, `dangerouslySetInnerHTML` 사용 시 DOMPurify 필수 적용이 요구되며, CSP nonce 기반 설정을 통해 추가 보호 계층을 구축해야 합니다.

---

## 2. 상세 내용

### 2.1 OWASP Top 10 취약점 및 Next.js 대응

#### A01:2021 Broken Access Control (접근 제어 실패)

OWASP 2021 1위 취약점으로, 테스트된 애플리케이션의 **94%**에서 발견됩니다. IDOR(Insecure Direct Object References), 강제 브라우징, 함수 수준 접근 제어 누락이 주요 공격 벡터입니다.

**Next.js 대응 전략 - 계층적 인증:**

```typescript
// lib/dal.ts - Data Access Layer (핵심 보안 계층)
import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { cache } from 'react';

// React cache로 렌더링 내 인증 검증 메모이제이션
export const verifyAuth = cache(async () => {
  const session = await auth();
  if (!session.userId) {
    throw new Error('Unauthorized');
  }
  return session;
});

export async function getDocument(documentId: string) {
  const { userId } = await verifyAuth();
  
  const document = await db.document.findUnique({
    where: { id: documentId }
  });
  
  // IDOR 방지: 소유권 검증 필수
  if (!document || document.userId !== userId) {
    throw new Error('Document not found or access denied');
  }
  
  return document;
}
```

#### A02:2021 Cryptographic Failures (암호화 실패)

민감 데이터 노출, 약한 암호화 알고리즘(MD5, SHA1), 부적절한 키 관리가 주요 원인입니다.

**환경변수 보안 - NEXT_PUBLIC_ 위험성:**

```typescript
// .env.local - 올바른 설정
// ❌ 절대 금지: 클라이언트 번들에 노출됨
// NEXT_PUBLIC_DATABASE_URL=postgresql://...
// NEXT_PUBLIC_API_SECRET=secret123

// ✅ 서버 전용 비밀키
DATABASE_URL=postgresql://user:password@host:5432/db
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLERK_SECRET_KEY=sk_live_xxx

// ✅ 공개 가능한 설정만 NEXT_PUBLIC_ 사용
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
```

```typescript
// lib/env.ts - Zod를 통한 환경변수 검증
import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const serverEnv = serverEnvSchema.parse(process.env);
```

**보안 쿠키 설정:**

```typescript
// lib/session.ts
import { cookies } from 'next/headers';

export async function setSecureCookie(name: string, value: string) {
  const cookieStore = await cookies();
  
  cookieStore.set({
    name,
    value,
    httpOnly: true,        // XSS 통한 쿠키 접근 차단
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',       // CSRF 기본 보호
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7일
  });
}
```

#### A03:2021 Injection (인젝션)

SQL, NoSQL, OS 명령어, LDAP 인젝션을 포함하며, 2.2절에서 상세히 다룹니다.

#### A04:2021 Insecure Design (불안전한 설계)

설계 및 아키텍처 결함으로, 완벽한 구현으로도 해결 불가능한 근본적 취약점입니다.

**레이트 리미팅 구현 (Upstash Redis):**

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 분당 100 요청
  analytics: true,
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }
  }
  
  return NextResponse.next();
}
```

#### A05:2021 Security Misconfiguration (보안 구성 오류)

테스트된 애플리케이션의 **90%**에서 발견되는 취약점입니다.

**next.config.ts 보안 헤더 설정:**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // X-Powered-By 헤더 제거
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  experimental: {
    sri: { algorithm: 'sha384' }, // Subresource Integrity
  },
};

export default nextConfig;
```

#### A06:2021 Vulnerable and Outdated Components (취약하고 오래된 컴포넌트)

**의존성 보안 관리:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      security-updates:
        applies-to: security-updates
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

```json
// package.json scripts
{
  "scripts": {
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix",
    "security:check": "npx socket npm audit"
  }
}
```

#### A07:2021 Identification and Authentication Failures (식별 및 인증 실패)

**Clerk 미들웨어 보안 설정:**

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/protected(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
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

#### A08:2021 Software and Data Integrity Failures (소프트웨어 및 데이터 무결성 실패)

**CI/CD 보안 및 SRI:**

```typescript
// app/layout.tsx - Script with SRI
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://cdn.example.com/analytics.js"
          integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K..."
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### A09:2021 Security Logging and Monitoring Failures (보안 로깅 및 모니터링 실패)

**구조화된 보안 로깅 (Pino):**

```typescript
// lib/logger.ts
import pino from 'pino';

const redactPaths = [
  'password', 'secret', 'token', 'authorization',
  '*.password', 'req.headers.authorization', 'req.headers.cookie',
];

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// lib/audit.ts - 보안 이벤트 로깅
export async function logSecurityEvent(event: {
  type: 'auth.login' | 'auth.logout' | 'access.denied' | 'data.export';
  userId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}) {
  logger.info({
    ...event,
    timestamp: new Date().toISOString(),
    correlationId: crypto.randomUUID(),
  });
}
```

#### A10:2021 Server-Side Request Forgery (SSRF)

Next.js는 **CVE-2024-34351** (Server Actions SSRF, v14.1.1에서 수정) 등 SSRF 취약점 이력이 있습니다.

**URL 검증 유틸리티:**

```typescript
// lib/security/url-validator.ts
import { z } from 'zod';

const ALLOWED_DOMAINS = new Set(['api.example.com', 'cdn.example.com']);

const BLOCKED_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./, /^169\.254\./, /localhost/i, /0\.0\.0\.0/,
];

export function validateExternalUrl(input: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const url = new URL(input);
    
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS allowed' };
    }
    
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(url.hostname)) {
        return { valid: false, error: 'Blocked address' };
      }
    }
    
    if (!ALLOWED_DOMAINS.has(url.hostname)) {
      return { valid: false, error: 'Domain not allowed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function safeFetch(url: string, options?: RequestInit) {
  const validation = validateExternalUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  return fetch(url, { ...options, redirect: 'error' });
}
```

---

### 2.2 Injection 방지

#### SQL Injection - Supabase PostgREST 자동 파라미터화

Supabase는 PostgREST를 통해 **자동으로 모든 입력을 파라미터화**합니다. 클라이언트 라이브러리의 쿼리는 HTTP 쿼리 문자열로 변환되며, 원시 SQL이 아닙니다.

```typescript
// ✅ 안전: 자동 파라미터화됨
const { data, error } = await supabase
  .from('users')
  .select('id, username, email')
  .eq('username', userInput)  // userInput이 안전하게 처리됨
  .single();

// ✅ 안전: RPC 호출도 파라미터화됨
const { data } = await supabase.rpc('get_user_posts', {
  user_id: userId,
  limit_count: 10,
});
```

**위험한 패턴 - 반드시 피해야 함:**

```typescript
// ❌ 위험: .or() 필터에서 문자열 보간
const { data } = await supabase
  .from('userdata')
  .select()
  .or(`account_id.is.null,account_id.eq.${accountId}`);
// accountId = '0,account_id.gte.1' → 데이터 유출 가능

// ❌ 위험: 동적 테이블명
const tableName = req.body.tableName;
const { data } = await supabase.from(tableName).select();

// ✅ 안전: 테이블명 화이트리스트
const allowedTables = ['posts', 'comments', 'profiles'] as const;
type AllowedTable = typeof allowedTables[number];

const tableName = allowedTables.includes(input as AllowedTable) ? input : null;
if (!tableName) throw new Error('Invalid table');
```

#### Zod/Valibot 입력 검증 패턴

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// 사용자 입력 스키마
export const UserInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z가-힣\s]+$/),
  password: z.string()
    .min(8, '최소 8자 이상')
    .regex(/[A-Z]/, '대문자 포함 필수')
    .regex(/[0-9]/, '숫자 포함 필수')
    .regex(/[^A-Za-z0-9]/, '특수문자 포함 필수'),
});

// 파일 업로드 스키마
export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(f => f.size > 0, '파일 필수')
    .refine(f => f.size <= 5 * 1024 * 1024, '5MB 이하')
    .refine(
      f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      'JPEG, PNG, WebP만 허용'
    ),
});

// Server Action 사용 예시
'use server';
import { UserInputSchema } from '@/lib/validation/schemas';

export async function createUser(formData: FormData) {
  const result = UserInputSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
  });
  
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }
  
  // 검증된 데이터로 안전하게 진행
  const { email, name, password } = result.data;
  // ...
}
```

#### NoSQL Injection 방지

```typescript
// MongoDB 사용 시 주의사항
import mongoSanitize from 'express-mongo-sanitize';

// Express 미들웨어로 MongoDB 연산자 제거
app.use(mongoSanitize({ replaceWith: '_' }));

// ✅ 안전: 명시적 타입 캐스팅
const username = String(req.body.username);
const user = await User.findOne({ 
  username: { $eq: username }  // 명시적 $eq 사용
});
```

#### Command Injection 방지

```typescript
// ❌ 극도로 위험: 절대 금지
import { exec } from 'child_process';
exec(`cat ${filename}`);  // filename에 "; rm -rf /" 가능

// ✅ 안전: execFile + 인자 배열 사용
import { execFile } from 'child_process';

function safeReadFile(filename: string) {
  // 파일명 검증
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }
  
  return new Promise((resolve, reject) => {
    execFile('cat', [filename], { shell: false }, (err, stdout) => {
      if (err) reject(err);
      resolve(stdout);
    });
  });
}

// ✅ 더 좋음: Node.js 내장 API 사용
import { readFile } from 'fs/promises';
import path from 'path';

async function safeReadFile(filename: string) {
  const safePath = path.resolve('/safe/base/', filename);
  if (!safePath.startsWith('/safe/base/')) {
    throw new Error('Path traversal detected');
  }
  return readFile(safePath, 'utf-8');
}
```

---

### 2.3 XSS 방지

#### React 기본 이스케이프 메커니즘

React는 JSX 표현식에서 **자동으로 HTML 엔티티를 이스케이프**합니다:

```tsx
// ✅ 안전: 자동 이스케이프됨
const userInput = '<script>alert("XSS")</script>';
return <div>{userInput}</div>;
// 렌더링: &lt;script&gt;alert("XSS")&lt;/script&gt;
```

**React가 보호하지 않는 경우:**
- `dangerouslySetInnerHTML` 사용
- `javascript:` 프로토콜 URL
- 직접 DOM 조작 (refs 사용)

```tsx
// ❌ 취약: javascript: 프로토콜
const userUrl = "javascript:alert('XSS')";
<a href={userUrl}>Click</a>  // 실행됨!

// ✅ 안전: URL 검증
function SafeLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isSafe = href.startsWith('https://') || href.startsWith('/');
  return isSafe ? <a href={href}>{children}</a> : <span>{children}</span>;
}
```

#### DOMPurify 활용

```typescript
// components/SafeHTML.tsx
'use client';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface SafeHTMLProps {
  content: string;
  className?: string;
}

export function SafeHTML({ content, className }: SafeHTMLProps) {
  const sanitizedHTML = useMemo(() => ({
    __html: DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    }),
  }), [content]);

  return <div className={className} dangerouslySetInnerHTML={sanitizedHTML} />;
}
```

```typescript
// Server-side sanitization (isomorphic-dompurify)
import DOMPurify from 'isomorphic-dompurify';

// DOMPurify 훅으로 링크 보안 강화
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}
```

#### CSP Nonce 기반 구현

```typescript
// middleware.ts - Nonce 생성 및 CSP 설정
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''};
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://api.clerk.com ${isDev ? 'ws:' : ''};
    frame-src https://clerk.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    { source: '/((?!api|_next/static|_next/image|favicon.ico).*)' },
  ],
};
```

```tsx
// app/layout.tsx - Nonce 사용
import { headers } from 'next/headers';
import Script from 'next/script';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang="ko">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
          nonce={nonce}
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

### 2.4 CSRF 방지

#### Server Actions 내장 CSRF 보호

Next.js Server Actions는 **자동 CSRF 보호**를 제공합니다:
- POST 메서드만 허용
- Origin/Host 헤더 검증
- 암호화된 액션 ID

```typescript
// 다중 도메인 환경 설정
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
};
```

#### SameSite 쿠키 설정

| 값 | 동작 | 용도 |
|---|---|---|
| `Strict` | 동일 사이트 요청만 쿠키 전송 | 최고 보안, 외부 링크 시 로그아웃 |
| `Lax` (기본) | 동일 사이트 + 안전한 최상위 탐색 | 보안과 UX 균형 |
| `None` | 모든 요청에 쿠키 전송 (Secure 필수) | 크로스 사이트 필요 시 |

```typescript
// Clerk 쿠키는 자동으로 SameSite=Lax 설정
// Supabase 쿠키 설정
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
            })
          );
        },
      },
    }
  );
}
```

#### API Routes CSRF 보호 (Double Submit Cookie)

```typescript
// lib/csrf/double-submit.ts
import { createHmac, randomBytes } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET!;

export function generateCsrfToken(sessionId: string) {
  const randomValue = randomBytes(32).toString('hex');
  const message = `${sessionId}:${randomValue}`;
  const hmac = createHmac('sha256', CSRF_SECRET).update(message).digest('hex');
  
  return { token: `${hmac}.${randomValue}`, cookie: `${hmac}.${randomValue}` };
}

export function verifyCsrfToken(
  requestToken: string,
  cookieToken: string,
  sessionId: string
): boolean {
  if (requestToken !== cookieToken) return false;
  
  const [hmac, randomValue] = requestToken.split('.');
  const message = `${sessionId}:${randomValue}`;
  const expectedHmac = createHmac('sha256', CSRF_SECRET).update(message).digest('hex');
  
  return hmac === expectedHmac;
}
```

---

### 2.5 인증/인가 취약점 점검

#### CVE-2025-29927: Next.js 미들웨어 인증 우회

**CVSS 9.1 Critical** - 2025년 3월 21일 공개

**취약점 원인:** `x-middleware-subrequest` 헤더가 미들웨어 경로와 일치하면 Next.js가 내부 서브요청으로 간주하여 **미들웨어 실행을 건너뜀**.

**영향 버전:**
| 버전 | 취약 범위 | 패치 버전 |
|-----|---------|---------|
| 15.x | 15.0.0 - 15.2.2 | **15.2.3+** |
| 14.x | 14.0.0 - 14.2.24 | **14.2.25+** |
| 13.x | 13.0.0 - 13.5.6 | **13.5.9+** |

**공격 방법:**
```bash
curl -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware" \
  https://target.com/admin/dashboard
```

**방어 조치:**
1. 즉시 패치 버전으로 업그레이드
2. 리버스 프록시에서 헤더 제거:
```nginx
proxy_set_header x-middleware-subrequest "";
```

#### CVE-2025-55182: React Server Components RCE (React2Shell)

**CVSS 10.0 Critical** - 2025년 12월 3일 공개

**취약점:** RSC "Flight" 프로토콜의 역직렬화 취약점으로, **인증 없이 RCE 가능**.

**영향 버전:** React 19.0-19.2.0, Next.js 15.x-16.x (취약한 RSC 패키지 사용 시)

**패치:** `react@19.2.3+`, `next@15.5.7+` 또는 `16.0.7+`

#### 다층 인증 전략 (Defense in Depth)

```typescript
// 1단계: 미들웨어 (낙관적 검사)
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// 2단계: Server Component (페이지 수준 검사)
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // 3단계: DAL에서 데이터 조회 시 재검증
  const userData = await getUserData(userId);
  
  return <Dashboard data={userData} />;
}

// 3단계: Data Access Layer (핵심)
// lib/dal/users.ts
import { auth } from '@clerk/nextjs/server';
import { cache } from 'react';

export const verifyAuth = cache(async () => {
  const session = await auth();
  if (!session.userId) {
    throw new Error('Unauthorized');
  }
  return session;
});

export async function getUserData(requestedUserId: string) {
  const { userId, sessionClaims } = await verifyAuth();
  
  const isAdmin = sessionClaims?.metadata?.role === 'admin';
  const isOwnData = userId === requestedUserId;
  
  if (!isAdmin && !isOwnData) {
    throw new Error('Forbidden');
  }
  
  return db.user.findUnique({ where: { id: requestedUserId } });
}
```

**4단계: Supabase RLS (최종 방어선)**

```sql
-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can view all profiles" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

#### RBAC 구현 패턴

```typescript
// lib/rbac/roles.ts
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum Permission {
  CREATE_POST = 'create:post',
  EDIT_POST = 'edit:post',
  DELETE_POST = 'delete:post',
  MANAGE_USERS = 'manage:users',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [Permission.CREATE_POST, Permission.EDIT_POST, Permission.DELETE_POST],
  [UserRole.EDITOR]: [Permission.CREATE_POST, Permission.EDIT_POST],
  [UserRole.VIEWER]: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Server Action에서 권한 검사
'use server';
import { auth } from '@clerk/nextjs/server';
import { hasPermission, Permission, UserRole } from '@/lib/rbac/roles';

export async function deletePost(postId: string) {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) throw new Error('Unauthorized');
  
  const userRole = sessionClaims?.publicMetadata?.role as UserRole;
  
  if (!hasPermission(userRole, Permission.DELETE_POST)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  // 비관리자는 자신의 게시물만 삭제 가능
  const post = await db.post.findUnique({ where: { id: postId } });
  
  if (userRole !== UserRole.ADMIN && post?.authorId !== userId) {
    throw new Error('Forbidden: Can only delete own posts');
  }
  
  await db.post.delete({ where: { id: postId } });
}
```

---

## 3. 구현 시 필수 사항

### 보안 체크리스트

- [ ] **Next.js 버전 확인**: 15.2.3+, 14.2.25+ (CVE-2025-29927 패치)
- [ ] **React 버전 확인**: 19.2.3+ (CVE-2025-55182 패치)
- [ ] **다층 인증 구현**: 미들웨어 → Server Component → DAL → RLS
- [ ] **환경변수 검증**: NEXT_PUBLIC_에 비밀키 노출 금지
- [ ] **보안 헤더 설정**: HSTS, X-Frame-Options, CSP, X-Content-Type-Options
- [ ] **CSP 구현**: Nonce 기반 또는 strict-dynamic
- [ ] **입력 검증**: Zod/Valibot으로 모든 사용자 입력 검증
- [ ] **SQL Injection 방지**: Supabase 표준 쿼리 사용, .or() 문자열 보간 금지
- [ ] **XSS 방지**: dangerouslySetInnerHTML 사용 시 DOMPurify 필수
- [ ] **CSRF 보호**: Server Actions 사용, API Routes에는 수동 보호 추가
- [ ] **레이트 리미팅**: 로그인, API 엔드포인트에 적용
- [ ] **의존성 감사**: npm audit, Dependabot, Socket.dev 활성화
- [ ] **보안 로깅**: 인증 실패, 권한 거부, 민감 작업 기록
- [ ] **쿠키 보안**: HttpOnly, Secure, SameSite 설정

---

## 4. 코드 예시

### 완전한 보안 Server Action 패턴

```typescript
// app/actions/secure-action.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { hasPermission, Permission, UserRole } from '@/lib/rbac/roles';
import { logSecurityEvent } from '@/lib/audit';
import { db } from '@/lib/db';

// 1. 입력 스키마 정의
const CreateProfileSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z가-힣\s]+$/),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

// 2. 타입 정의
type ActionResult = 
  | { success: true; data: unknown }
  | { success: false; error: string; details?: unknown };

// 3. Server Action 구현
export async function createProfile(formData: FormData): Promise<ActionResult> {
  // 3.1 인증 검증 (미들웨어 우회 대비)
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    await logSecurityEvent({ type: 'access.denied', metadata: { action: 'createProfile' } });
    return { success: false, error: 'Unauthorized' };
  }
  
  // 3.2 권한 검증
  const userRole = sessionClaims?.publicMetadata?.role as UserRole;
  if (!hasPermission(userRole, Permission.CREATE_POST)) {
    await logSecurityEvent({ type: 'access.denied', userId, metadata: { permission: 'CREATE_POST' } });
    return { success: false, error: 'Forbidden' };
  }
  
  // 3.3 입력 검증
  const rawData = {
    name: formData.get('name'),
    bio: formData.get('bio'),
    website: formData.get('website'),
  };
  
  const validation = CreateProfileSchema.safeParse(rawData);
  
  if (!validation.success) {
    return { 
      success: false, 
      error: 'Validation failed', 
      details: validation.error.flatten().fieldErrors 
    };
  }
  
  // 3.4 데이터베이스 작업 (RLS가 추가 보호)
  try {
    const profile = await db.profile.create({
      data: {
        ...validation.data,
        userId, // 항상 인증된 사용자 ID 사용
      },
    });
    
    // 3.5 보안 로깅
    await logSecurityEvent({ 
      type: 'data.export', 
      userId, 
      metadata: { action: 'profile_created', profileId: profile.id } 
    });
    
    revalidatePath('/profile');
    return { success: true, data: profile };
  } catch (error) {
    console.error('Profile creation failed:', error);
    return { success: false, error: 'Database error' };
  }
}
```

### 완전한 미들웨어 설정

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 레이트 리미터 설정
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

// 라우트 매처
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/api/protected(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // 1. CSP Nonce 생성
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // 2. 레이트 리미팅 (API 라우트)
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }
  
  // 3. 인증 검사
  if (isAdminRoute(request)) {
    await auth.protect((has) => has({ role: 'org:admin' }));
  } else if (isProtectedRoute(request)) {
    await auth.protect();
  }
  
  // 4. CSP 헤더 설정
  const isDev = process.env.NODE_ENV === 'development';
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://clerk.com ${isDev ? "'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: https://img.clerk.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://api.clerk.com ${isDev ? 'ws:' : ''};
    frame-src https://clerk.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  
  // 5. 보안 헤더 추가
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

## 5. 참고 자료

**공식 문서:**
- OWASP Top 10 2021: https://owasp.org/Top10/
- Next.js Security: https://nextjs.org/docs/app/guides/security
- Clerk Security: https://clerk.com/docs/security
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

**CVE 정보:**
- CVE-2025-29927 (Next.js Middleware Bypass): NVD/GitHub Security Advisories
- CVE-2025-55182 (React RSC RCE): React Security Updates

**도구:**
- DOMPurify: https://github.com/cure53/DOMPurify
- Zod: https://zod.dev
- Upstash Ratelimit: https://github.com/upstash/ratelimit
- Socket.dev: https://socket.dev

**보안 가이드:**
- OWASP CSRF Prevention Cheat Sheet
- OWASP XSS Prevention Cheat Sheet
- Google Strict CSP Guide: https://csp.withgoogle.com/docs/strict-csp.html