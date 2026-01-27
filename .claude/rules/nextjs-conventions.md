---
paths:
  - 'apps/web/**'
  - '**/app/**'
  - '**/proxy.ts'
---

# Next.js 16 규칙

> apps/web 및 App Router 관련 파일에만 적용

---

## App Router 구조

### 폴더 구조

```
apps/web/app/
├── (main)/                  # 메인 레이아웃 그룹
│   ├── layout.tsx           # 공통 레이아웃
│   ├── dashboard/
│   │   └── page.tsx
│   └── analysis/
│       ├── page.tsx
│       └── [type]/
│           └── result/[id]/
│               └── page.tsx
├── (auth)/                  # 인증 레이아웃 그룹
│   ├── sign-in/[[...sign-in]]/
│   └── sign-up/[[...sign-up]]/
├── api/                     # API 라우트
│   ├── analyze/
│   └── coach/
└── globals.css
```

### 라우트 그룹 규칙

| 패턴          | 용도          | 예시               |
| ------------- | ------------- | ------------------ |
| `(group)`     | 레이아웃 그룹 | `(main)`, `(auth)` |
| `[param]`     | 동적 라우트   | `[id]`, `[type]`   |
| `[...slug]`   | 캐치올        | `[...rest]`        |
| `[[...slug]]` | 선택적 캐치올 | `[[...sign-in]]`   |

---

## Server Components vs Client Components

### 기본 원칙

```typescript
// Server Component (기본값)
// - async/await 사용 가능
// - 직접 DB 접근 가능
// - 브라우저 API 불가

export default async function Page() {
  const data = await fetchData();  // 서버에서 실행
  return <div>{data.title}</div>;
}

// Client Component
// 'use client' 필수
// - hooks 사용 가능
// - 브라우저 API 사용 가능
// - async 불가

'use client';
export default function Interactive() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(true)}>Click</button>;
}
```

### 선택 가이드

| 필요 기능           | 컴포넌트 타입 |
| ------------------- | ------------- |
| DB 직접 접근        | Server        |
| SEO 메타데이터      | Server        |
| useState/useEffect  | Client        |
| onClick/onChange    | Client        |
| window/localStorage | Client        |

---

## Data Fetching 패턴

### Server Component에서 Fetch

```typescript
// app/(main)/products/page.tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function ProductsPage() {
  const supabase = await createClerkSupabaseClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .limit(20);

  return <ProductList products={products ?? []} />;
}
```

### 캐싱 전략

```typescript
// 재검증 설정
export const revalidate = 60; // 60초마다 재검증

// 또는 동적 렌더링 강제
export const dynamic = 'force-dynamic';
```

### Loading & Error UI

```typescript
// loading.tsx (같은 폴더)
export default function Loading() {
  return <Skeleton />;
}

// error.tsx (같은 폴더)
'use client';
export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <p>문제가 발생했습니다: {error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

---

## 서버 문제 해결

### 빠른 해결

```bash
cd apps/web
npm run dev:reset   # 포트 종료 + 캐시 삭제 + 재시작
npm run preflight   # 사전 검사만
```

### 포트 충돌

```bash
netstat -ano | findstr ":3000"
taskkill /F /PID <PID>
```

### 캐시 문제

```bash
rm -rf apps/web/.next
```

---

## Clerk/Proxy 설정

### proxy.ts 공개 라우트

```typescript
const isPublicRoute = createRouteMatcher([
  '/',
  '/home',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/announcements',
  '/help(.*)',
  '/api/webhooks(.*)',
]);
```

### 무한 로딩 디버깅

1. `curl -sI http://localhost:3000/home`
2. 404 → proxy.ts 확인
3. 307 → 공개 라우트에 추가 필요
4. 200 + 빈 화면 → 클라이언트 렌더링 문제

### Clerk 헤더 확인

```
x-clerk-auth-reason: protect-rewrite
x-clerk-auth-status: signed-out
```

---

## Metadata & SEO

### 정적 메타데이터

```typescript
// layout.tsx 또는 page.tsx
export const metadata: Metadata = {
  title: '이룸 | 퍼스널컬러 분석',
  description: 'AI 기반 퍼스널컬러 분석',
};
```

### 동적 메타데이터

```typescript
// page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const analysis = await getAnalysis(params.id);
  return {
    title: `${analysis.type} 분석 결과 | 이룸`,
  };
}
```

---

## Next.js 16 특이사항

- `middleware.ts` → `proxy.ts` (동시 존재 불가)
- `middleware()` → `proxy()` 함수명 변경
- Turbopack 캐시 문제 → `.next` 삭제
- React 19 호환 (use hook, Server Actions)

---

## 디버깅 체크리스트

- [ ] 포트 확인 및 종료
- [ ] `.next` 삭제
- [ ] `middleware.ts` 존재 시 삭제
- [ ] curl로 HTTP 응답 확인
- [ ] Clerk 헤더 확인
- [ ] proxy.ts 공개 라우트 확인
- [ ] 'use client' 누락 확인 (hooks 사용 시)

---

## 관련 문서

- [api-design.md](./api-design.md) - API 라우트 설계
- [react-patterns.md](./react-patterns.md) - React 컴포넌트 패턴
- [performance-guidelines.md](./performance-guidelines.md) - 성능 최적화

---

**Version**: 2.0 | **Updated**: 2026-01-19 | Server Components, Data Fetching 추가
