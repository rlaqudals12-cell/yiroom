# 보안 패턴 원리

> 이 문서는 이룸 플랫폼의 보안 아키텍처 기반 원리를 설명한다.
>
> **소스 리서치**: P0-3-R1, P0-4-R1, P0-5-R1, P0-6-R1, P0-7-R1

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"무결점 보안 아키텍처"

- 제로 트러스트: 모든 요청을 검증, 신뢰 가정 없음
- 다층 방어: 미들웨어 → Server Component → DAL → RLS 4단계 검증
- 자동화된 보안: 코드 변경 시 자동 보안 스캔, 취약점 탐지
- 암호화 완전성: 저장/전송 모든 민감 데이터 암호화
- 감사 추적: 모든 접근/변경 이력 완벽 기록
- 침해 대응: 24시간 이내 취약점 패치 프로세스
- 보안 문화: 모든 팀원이 OWASP Top 10 숙지
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **제3자 서비스** | Clerk, Supabase, Vercel의 보안은 제어 불가 |
| **브라우저 제약** | 클라이언트 사이드 보안은 우회 가능 |
| **성능 트레이드오프** | 과도한 검증은 응답 시간 증가 |
| **제로데이 취약점** | 알려지지 않은 취약점 방어 한계 |
| **인적 요소** | 소셜 엔지니어링 완전 방어 불가 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **OWASP Top 10** | 모든 항목 대응 완료 |
| **다층 방어** | 4단계 검증 체계 구현 |
| **RLS 커버리지** | 모든 테이블 RLS 적용 100% |
| **환경변수 보안** | NEXT_PUBLIC_ 비밀키 노출 0건 |
| **Rate Limiting** | 모든 API 엔드포인트 적용 |
| **감사 로깅** | 민감 작업 100% 로깅 |
| **암호화** | 전송(TLS 1.3), 저장(AES-256) |
| **의존성 보안** | npm audit 0건 high/critical |
| **침투 테스트** | 연간 1회 이상 외부 테스트 |

### 현재 목표

**80%** - MVP 보안 아키텍처

- ✅ 다층 방어 4단계 체계
- ✅ RLS 모든 테이블 적용
- ✅ 환경변수 분리 (서버/클라이언트)
- ✅ HTTPS 강제 (Vercel)
- ✅ Clerk 인증 통합
- ✅ 감사 로깅 (audit_logs)
- ⏳ Rate Limiting 전체 적용 (70%)
- ⏳ npm audit 정기 실행 (60%)
- ⏳ 침투 테스트 (0%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 외부 침투 테스트 | MVP 비용 | Phase 3 |
| SOC 2 인증 | 엔터프라이즈 대상 | Phase 5 |
| WAF 도입 | Vercel Edge 기본 방어 활용 | 트래픽 증가 시 |
| SIEM 구축 | MVP 범위 외 | Phase 4 |

---

## 1. 핵심 보안 원칙

### 1.1 다층 방어 (Defense in Depth)

```
단일 보안 계층에 의존하지 않는다.
모든 계층에서 인증/인가를 재검증한다.
```

**4단계 검증 체계**:

```
요청 → [미들웨어] → [Server Component] → [DAL] → [RLS]
         │              │                  │        │
      낙관적 검사     페이지 검증        데이터 검증   DB 강제
```

| 계층 | 역할 | 우회 시 |
|------|------|---------|
| **미들웨어** | 빠른 사전 필터링 | 다음 계층에서 차단 |
| **Server Component** | 페이지 수준 접근 제어 | DAL에서 차단 |
| **DAL (Data Access Layer)** | 비즈니스 로직 검증 | RLS에서 차단 |
| **RLS (Row Level Security)** | 최종 방어선 | 데이터 노출 차단 |

### 1.2 최소 권한 원칙

```
필요한 최소한의 권한만 부여한다.
기본값은 "거부", 명시적으로 "허용"한다.
```

---

## 2. 환경변수 보안

### 2.1 NEXT_PUBLIC_ 규칙

**핵심 원리**: `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 **클라이언트 번들에 하드코딩**된다.

```
빌드 시: process.env.NEXT_PUBLIC_API_URL
         ↓
번들 후: 'https://api.example.com' (값이 직접 치환)
```

### 2.2 노출 분류

| 노출 금지 (서버 전용) | 노출 가능 (NEXT_PUBLIC_) |
|----------------------|-------------------------|
| `DATABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS 필수) |
| `CLERK_SECRET_KEY` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `JWT_SECRET` | Analytics ID |

### 2.3 검증 패턴

**t3-env**를 통한 빌드 타임 검증:

```typescript
// 검증 실패 시 빌드 중단
export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  },
});
```

### 2.4 유출 방지

| 계층 | 도구 |
|------|------|
| Git | gitleaks, git-secrets, .gitignore |
| 로깅 | Pino redact, PII 마스킹 |
| 에러 | Sentry beforeSend 필터 |

---

## 3. OWASP Top 10 대응

### 3.1 A01: Broken Access Control

**원리**: 접근 제어는 **서버에서 강제**해야 한다. 클라이언트 검증은 우회 가능.

**DAL 패턴**:

```typescript
// 모든 데이터 접근은 DAL을 통해
export const verifyAuth = cache(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return { userId };
});

export async function getUserData(targetId: string) {
  const { userId } = await verifyAuth();

  // IDOR 방지: 소유권 검증
  if (userId !== targetId) {
    throw new Error('Forbidden');
  }

  return db.user.findUnique({ where: { id: targetId } });
}
```

### 3.2 A03: Injection

**원리**: 모든 사용자 입력은 **파라미터화**하여 처리한다.

**Supabase PostgREST**: 자동 파라미터화로 SQL Injection 기본 방어.

```typescript
// 안전: 자동 파라미터화
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userInput);  // userInput이 안전하게 처리

// 위험: .or() 문자열 보간
.or(`id.eq.${userInput}`)  // SQL Injection 가능
```

### 3.3 A07: Identification and Authentication Failures

**CVE-2025-29927** (미들웨어 인증 우회):
- `x-middleware-subrequest` 헤더로 미들웨어 우회 가능
- **해결**: Next.js 15.2.3+, 14.2.25+ 업그레이드

**핵심**: 미들웨어만 의존하지 않고, DAL에서 재검증.

---

## 4. XSS 방어

### 4.1 React 기본 방어

**원리**: React JSX는 자동으로 HTML 엔티티를 이스케이프한다.

```tsx
const userInput = '<script>alert("XSS")</script>';
return <div>{userInput}</div>;
// 렌더링: &lt;script&gt;alert("XSS")&lt;/script&gt;
```

### 4.2 위험 패턴

| 패턴 | 위험도 | 대응 |
|------|--------|------|
| `dangerouslySetInnerHTML` | 높음 | DOMPurify 필수 |
| `javascript:` URL | 높음 | URL 검증 |
| DOM 직접 조작 | 중간 | 지양 |

### 4.3 CSP (Content Security Policy)

**원리**: 허용된 스크립트만 실행 가능하게 제한.

```
script-src 'self' 'nonce-{random}' 'strict-dynamic';
```

**Nonce 기반**: 각 요청마다 랜덤 nonce 생성, 해당 nonce가 있는 스크립트만 실행.

---

## 5. CSRF 방어

### 5.1 Server Actions 내장 보호

**원리**: Next.js Server Actions는 자동 CSRF 보호를 제공.

- POST 메서드만 허용
- Origin/Host 헤더 검증
- 암호화된 액션 ID

### 5.2 SameSite 쿠키

| 값 | 동작 | 권장 |
|-----|------|------|
| `Strict` | 동일 사이트만 | 최고 보안 |
| `Lax` (기본) | 안전한 탐색 허용 | **권장** |
| `None` | 모든 요청 | Secure 필수 |

---

## 6. Row Level Security (RLS)

### 6.1 핵심 원리

```
RLS = 데이터베이스 레벨에서 행 단위 접근 제어
모든 쿼리에 자동으로 WHERE 조건 추가
```

### 6.2 Clerk 통합 핵심

**중요**: Clerk은 문자열 ID 사용. `auth.uid()` 대신 `auth.jwt()->>'sub'` 사용.

```sql
-- 잘못된 방법 (Clerk에서 작동 안 함)
USING (auth.uid() = user_id)

-- 올바른 방법
USING ((SELECT auth.jwt()->>'sub') = user_id)
```

### 6.3 USING vs WITH CHECK

| 절 | 용도 | 적용 대상 |
|----|------|----------|
| **USING** | 기존 행 필터링 | SELECT, UPDATE, DELETE |
| **WITH CHECK** | 새/수정 행 검증 | INSERT, UPDATE |

### 6.4 PERMISSIVE vs RESTRICTIVE

```
(RESTRICTIVE 정책들 AND 결합)
AND
(PERMISSIVE 정책들 OR 결합)
```

**예시**: 본인 데이터 + MFA 필수

```sql
-- 1. 기본 접근 (PERMISSIVE)
CREATE POLICY "base_access" ON data
FOR SELECT USING (user_id = auth.jwt()->>'sub');

-- 2. MFA 요구 (RESTRICTIVE)
CREATE POLICY "require_mfa" ON data
AS RESTRICTIVE
FOR SELECT USING (auth.jwt()->>'aal' = 'aal2');
```

### 6.5 성능 최적화

**핵심**: 함수를 `(SELECT ...)` 로 감싸면 쿼리당 1번만 평가.

```sql
-- 느림: 행마다 함수 호출
USING (auth.jwt()->>'sub' = user_id)

-- 빠름: InitPlan 캐싱 (최대 99% 향상)
USING ((SELECT auth.jwt()->>'sub') = user_id)
```

### 6.6 테이블별 정책 패턴

| 데이터 유형 | SELECT | INSERT | UPDATE | DELETE |
|------------|--------|--------|--------|--------|
| **개인 민감 데이터** | 본인만 | 본인만 | 본인만 | 본인만 |
| **공유 가능 데이터** | 본인+공유대상+공개 | 본인만 | 본인만 | 본인만 |
| **공개 읽기 데이터** | anon 포함 | 관리자만 | 관리자만 | 관리자만 |
| **감사 로그** | 관리자만 | 시스템만 | 금지 | 금지 |
| **이미지 (무결성)** | 본인만 | 본인만 | **금지** | 본인만 |

> **구현 가이드**: [.claude/rules/supabase-db.md](../../.claude/rules/supabase-db.md#rls-정책-상세-가이드) - 5개 패턴, 코드 예제, 디버깅

---

## 7. Rate Limiting

### 7.1 알고리즘 선택

| 알고리즘 | 특성 | 권장 상황 |
|---------|------|----------|
| **Token Bucket** | 버스트 허용 | 스트리밍, 버스트 필요 |
| **Leaky Bucket** | 균일 출력 | 트래픽 평활화 |
| **Fixed Window** | 가장 저렴 | 비용 최소화 |
| **Sliding Window Counter** | 정확도+효율 균형 | **범용 권장** |

### 7.2 권장 제한 수치

| 기능 | 무료 티어 | Pro 티어 |
|------|----------|----------|
| **일반 API (읽기)** | 60/분, 2,000/일 | 300/분, 10,000/일 |
| **일반 API (쓰기)** | 20/분, 500/일 | 100/분, 3,000/일 |
| **AI 이미지 분석** | 2/분, 5/시간, 20/일 | 10/분, 50/시간, 200/일 |

### 7.3 429 응답 설계

**필수 헤더**:

```http
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60
```

**클라이언트 재시도**: Exponential Backoff with Jitter

```
delay = min(baseDelay * 2^attempt, maxDelay) * random(0, 1)
```

### 7.4 식별자 우선순위

1. 인증된 사용자: `userId` (Clerk)
2. 비인증 사용자: `IP` (CF-Connecting-IP > x-real-ip > x-forwarded-for)

---

## 8. 보안 헤더

### 8.1 필수 헤더

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### 8.2 Next.js 설정

```typescript
// next.config.ts
const nextConfig = {
  poweredByHeader: false,  // X-Powered-By 제거
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## 9. 구현 체크리스트

### 9.1 환경변수

- [ ] `NEXT_PUBLIC_`에 비밀키 없음
- [ ] t3-env 빌드 타임 검증 설정
- [ ] .gitignore에 `.env*` 패턴 추가
- [ ] gitleaks pre-commit hook 설치

### 9.2 인증/인가

- [ ] 다층 방어 (미들웨어 → Server Component → DAL → RLS)
- [ ] Next.js 15.2.3+ 업그레이드 (CVE-2025-29927)
- [ ] Clerk + Supabase 네이티브 통합 설정

### 9.3 RLS

- [ ] 모든 public 테이블에 RLS 활성화
- [ ] `auth.jwt()->>'sub'` 사용 (auth.uid() 아님)
- [ ] 함수를 `(SELECT ...)` 로 래핑
- [ ] user_id 컬럼 인덱스 추가
- [ ] 민감 테이블 UPDATE 정책 미생성

### 9.4 입력 검증

- [ ] Zod 스키마로 모든 입력 검증
- [ ] SQL Injection: 문자열 보간 금지
- [ ] XSS: dangerouslySetInnerHTML 시 DOMPurify

### 9.5 Rate Limiting

- [ ] 미들웨어 전역 Rate Limiting
- [ ] AI 엔드포인트 추가 제한
- [ ] 429 응답에 Retry-After 헤더

### 9.6 보안 헤더

- [ ] HSTS, X-Frame-Options, CSP 설정
- [ ] SameSite=Lax 쿠키 설정

---

## 10. JWT 토큰 보안

### 10.1 Clerk JWT 구조

| 필드 | 설명 | 검증 |
|------|------|------|
| `sub` | Clerk 사용자 ID | RLS에서 사용 |
| `iss` | 발급자 | Clerk 도메인 확인 |
| `azp` | Authorized Party | 허용된 클라이언트 검증 |
| `exp` | 만료 시간 | 현재 시간과 비교 |
| `aal` | Authentication Assurance Level | MFA 상태 확인 |

### 10.2 토큰 유효시간

| 토큰 유형 | 이룸 설정 | KISA 권장 | 설명 |
|----------|----------|----------|------|
| 세션 토큰 | 60초 | - | Clerk 자동 갱신 |
| 비활성 타임아웃 | 24시간¹ | 30분 | 마지막 활동 기준 |
| 절대 타임아웃 | 7일¹ | 8시간 | 강제 재인증 |

> ¹ **설정 근거**: 이룸은 웰니스 앱으로 금융 앱보다 민감도가 낮음. 사용자 편의성과 보안 균형을 고려하여 Clerk 기본값 사용. 민감 정보(생체 데이터) 조회 시에는 추가 인증 요청.

### 10.3 세션 바인딩

**원리**: 토큰 탈취 공격 방지를 위해 세션 컨텍스트 검증

```typescript
// 세션 컨텍스트 검증
interface SessionContext {
  userAgent: string;
  ip: string;
}

async function verifySessionContext(
  token: string,
  currentContext: SessionContext
): Promise<boolean> {
  const session = await getSession(token);

  // User-Agent 변경 감지
  if (session.userAgent !== currentContext.userAgent) {
    await flagSuspiciousActivity(session.userId);
    return false;
  }

  return true;
}
```

### 10.4 토큰 재사용 방지

```typescript
// Nonce 기반 재사용 방지
async function verifyNonce(nonce: string): Promise<boolean> {
  const exists = await redis.get(`nonce:${nonce}`);
  if (exists) return false;

  await redis.setex(`nonce:${nonce}`, 300, '1');  // 5분 TTL
  return true;
}
```

---

## 11. API 보안 심화

### 11.1 CORS 화이트리스트

```typescript
const ALLOWED_ORIGINS = [
  'https://yiroom.app',
  'https://www.yiroom.app',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean);

export function corsMiddleware(request: Request): Response | null {
  const origin = request.headers.get('origin');

  // null origin 처리: 로컬 파일, 리다이렉트, 일부 브라우저 프라이버시 모드
  // 프로덕션에서는 null origin 거부, 개발 환경에서만 허용
  if (origin === null) {
    if (process.env.NODE_ENV === 'development') {
      return null; // 개발 환경에서는 허용
    }
    return new Response('Forbidden: null origin not allowed', { status: 403 });
  }

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  return null;
}
```

**⚠️ null origin 주의사항**:
- `file://` 프로토콜에서 열린 HTML의 origin은 `null`
- 일부 리다이렉트 시 origin이 `null`로 설정될 수 있음
- 프로덕션에서는 보안상 null origin 거부 권장

### 11.2 요청 서명 검증

**원리**: HMAC-SHA256으로 요청 무결성 검증

```typescript
interface SignedRequest {
  method: string;
  path: string;
  timestamp: number;
  nonce: string;
  body: string;
}

function signRequest(request: SignedRequest, secret: string): string {
  const payload = `${request.method}:${request.path}:${request.timestamp}:${request.nonce}:${request.body}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(request: Request, body: string, secret: string): boolean {
  const signature = request.headers.get('x-signature');
  const timestamp = parseInt(request.headers.get('x-timestamp') || '0', 10);

  // 5분 이내 요청만 허용
  if (Date.now() - timestamp > 5 * 60 * 1000) return false;

  const expected = signRequest({
    method: request.method,
    path: new URL(request.url).pathname,
    timestamp,
    nonce: request.headers.get('x-nonce') || '',
    body,
  }, secret);

  return crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expected));
}
```

### 11.3 Clerk 웹훅 검증

```typescript
import { Webhook } from 'svix';

export async function verifyClerkWebhook(request: Request): Promise<WebhookEvent> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

  const headers = {
    'svix-id': request.headers.get('svix-id')!,
    'svix-timestamp': request.headers.get('svix-timestamp')!,
    'svix-signature': request.headers.get('svix-signature')!,
  };

  const body = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  return wh.verify(body, headers) as WebhookEvent;
}
```

---

## 12. 이미지 암호화

### 12.1 전송 시 보안 (In Transit)

| 항목 | 설정 |
|------|------|
| TLS 버전 | 1.3 강제 |
| HSTS | max-age=63072000 (2년) |
| 인증서 | Let's Encrypt (자동 갱신) |

### 12.2 저장 시 보안 (At Rest)

| 항목 | 설정 |
|------|------|
| 암호화 | AES-256 (Supabase Storage SSE-S3) |
| 버킷 | 비공개 (Private) |
| 접근 | 서명된 URL (1시간 만료) |

### 12.3 서명된 URL 생성

```typescript
export async function createSignedImageUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('user-images')
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
```

### 12.4 Storage RLS 정책

```sql
-- 본인 폴더에만 업로드 허용
CREATE POLICY "user_upload_own_folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-images'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  );

-- 본인 파일만 조회 허용
CREATE POLICY "user_read_own_files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-images'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  );
```

### 12.5 메타데이터 암호화

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encryptMetadata(data: object): EncryptedData {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);

  return {
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}
```

### 12.6 EXIF 자동 제거

```typescript
import sharp from 'sharp';

export async function processUploadedImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()  // EXIF 회전 정보 적용
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();  // EXIF 자동 제거
}
```

---

## 13. PII 관리

### 13.1 PII 분류 체계

| 민감도 | 데이터 유형 | 처리 방식 |
|--------|------------|----------|
| **높음** | 얼굴 이미지, 생체 데이터 | 암호화 저장, 즉시 삭제 옵션 |
| **중간** | 이메일, 생년월일, 전화번호 | 암호화 저장, 마스킹 로깅 |
| **낮음** | 성별, 연령대, 피부 타입 | 익명화 가능 |

### 13.2 로깅 시 자동 마스킹

```typescript
// lib/utils/redact-pii.ts
const PII_PATTERNS = [
  { key: /email/i, mask: (v: string) => v.replace(/(.{2}).*@(.{2}).*/, '$1***@$2***') },
  { key: /phone/i, mask: (v: string) => v.replace(/(\d{3}).*(\d{4})/, '$1-****-$2') },
  { key: /birthdate|birth/i, mask: () => '[REDACTED]' },
  { key: /image|base64/i, mask: () => '[IMAGE_DATA]' },
  { key: /token|secret|key|password/i, mask: () => '[REDACTED]' },
];

export function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const pattern = PII_PATTERNS.find(p => p.key.test(key));
    result[key] = pattern ? pattern.mask(String(value)) : sanitizeForLogging(value);
  }
  return result;
}
```

### 13.3 익명화 (k-익명성)

```typescript
// 연령대 일반화
export function anonymizeAge(birthdate: string): string {
  const age = calculateAge(birthdate);
  const decade = Math.floor(age / 10) * 10;
  return `${decade}-${decade + 9}`;  // "20-29", "30-39" 등
}

// 지역 일반화
export function anonymizeLocation(city: string): string {
  const regions: Record<string, string> = {
    서울: '수도권', 경기: '수도권', 인천: '수도권',
    부산: '영남권', 대구: '영남권', 울산: '영남권',
    // ...
  };
  return regions[city] || '기타';
}
```

### 13.4 데이터 삭제 (Right to Erasure)

```typescript
export async function deleteAllUserData(userId: string): Promise<void> {
  const tablesToDelete = [
    'product_view_history',
    'supplement_recommendations',
    'skin_analysis_results',
    'personal_color_assessments',
    'body_type_assessments',
    'user_profiles',
  ];

  // 트랜잭션으로 모든 데이터 삭제
  for (const table of tablesToDelete) {
    await supabase.from(table).delete().eq('clerk_user_id', userId);
  }

  // Storage 파일 삭제
  const { data: files } = await supabase.storage
    .from('user-images')
    .list(userId);

  if (files?.length) {
    const paths = files.map(f => `${userId}/${f.name}`);
    await supabase.storage.from('user-images').remove(paths);
  }

  // 감사 로그
  await logAudit('user.data_deleted', { userId, tables: tablesToDelete });
}
```

---

## 14. 의존성 보안

### 14.1 npm 공급망 보안

**2025년 Shai-Hulud 공격 대응**:

```ini
# .npmrc
ignore-scripts=true
package-lock=true
strict-ssl=true
audit-level=moderate
```

### 14.2 버전 고정

```json
// package.json - 정확한 버전 사용
{
  "dependencies": {
    "next": "15.2.3",
    "react": "19.0.0",
    "@clerk/nextjs": "5.0.0"
  },
  "overrides": {
    "minimist": "1.2.8"
  }
}
```

### 14.3 CI/CD 보안 검사

```yaml
# .github/workflows/security.yml
- name: Install (no scripts)
  run: npm ci --ignore-scripts

- name: Security audit
  run: npm audit --audit-level=high

- name: Snyk scan
  uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high
```

### 14.4 Dependabot 설정

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    groups:
      security:
        patterns:
          - "*"
        update-types:
          - security
```

---

## 15. 한국 규정 준수 (KISA)

### 15.1 회원가입 동의

| 항목 | 요구사항 |
|------|---------|
| 필수/선택 분리 | 개인정보 수집 항목별 구분 |
| 사전 체크 금지 | 동의 체크박스 기본값 = unchecked |
| 동의 철회 | 동의만큼 쉽게 철회 가능 |

### 15.2 비밀번호 정책

```typescript
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  forbiddenPatterns: [
    /(.)\1{2,}/,          // 같은 문자 3회 반복 금지
    /^(012|123|234)/,     // 연속 숫자 금지
  ],
};

// bcrypt Salt rounds: KISA 권장 10 이상
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
```

### 15.3 세션 관리

| 항목 | KISA 권장 | 이룸 설정 | 비고 |
|------|----------|----------|------|
| 비활성 타임아웃 | 30분 | 24시간 | 웰니스 앱 특성 반영 |
| 절대 타임아웃 | 8시간 | 7일 | 편의성 우선 |
| 로그인 실패 제한 | 5회 → 계정 잠금 | 5회 | KISA 권장 준수 |
| 세션 ID 재생성 | 로그인 시 필수 | 필수 | Clerk 자동 처리 |

> **참고**: 타임아웃 설정의 상세 근거는 [섹션 10.2](#102-토큰-유효시간) 참조

### 15.4 생성형 AI 고지

```typescript
interface AIDisclosure {
  isAIGenerated: boolean;
  disclaimer: string;
  analysisDate: string;
  modelInfo: string;
  feedbackChannel: string;
}

export function addAIDisclosure<T>(result: T): T & { _aiDisclosure: AIDisclosure } {
  return {
    ...result,
    _aiDisclosure: {
      isAIGenerated: true,
      disclaimer: '이 결과는 AI가 분석한 것으로, 참고용입니다.',
      analysisDate: new Date().toISOString(),
      modelInfo: 'Google Gemini 2.0 Flash',
      feedbackChannel: 'support@yiroom.app',
    },
  };
}
```

---

## 16. 관련 문서

| 문서 | 설명 |
|------|------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 시스템 아키텍처 |
| [DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md) | RLS 정책 상세 |
| [legal-compliance.md](./legal-compliance.md) | 법적 컴플라이언스 |
| `.claude/rules/security-checklist.md` | 보안 체크리스트 |
| `.claude/rules/api-design.md` | API 보안 패턴 |

---

## 17. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-004](../adr/ADR-004-auth-strategy.md) | 인증 전략 | Clerk + RLS |
| [ADR-008](../adr/ADR-008-repository-service-layer.md) | Repository-Service 계층 | DAL 보안 |
| [ADR-009](../adr/ADR-009-library-layering.md) | 라이브러리 계층화 | RLS 정책 |
| [ADR-013](../adr/ADR-013-error-handling.md) | 에러 핸들링 | 보안 에러 처리 |
| [ADR-015](../adr/ADR-015-testing-strategy.md) | 테스트 전략 | 보안 테스트 |
| [ADR-019](../adr/ADR-019-performance-monitoring.md) | 성능 모니터링 | 보안 감사 |
| [ADR-020](../adr/ADR-020-api-versioning.md) | API 버전 관리 | API 보안 |
| [ADR-025](../adr/ADR-025-audit-logging.md) | 감사 로깅 | 개인정보 보호 |
| [ADR-028](../adr/ADR-028-social-feed.md) | 소셜 피드 | RLS 접근 제어 |

---

**Version**: 2.1 | **Created**: 2026-01-16 | **Updated**: 2026-01-19
**소스 리서치**: P0-3-R1, P0-4-R1, P0-5-R1, P0-6-R1, P0-7-R1, SEC-1-R1, SEC-2-R1, SEC-3-R1, SEC-4-R1, SEC-5-R1, SEC-6-R1, SEC-7-R1, SEC-8-R1
