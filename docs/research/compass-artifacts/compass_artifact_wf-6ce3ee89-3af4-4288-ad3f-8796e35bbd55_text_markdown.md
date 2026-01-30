# Next.js 16 Server Components 데이터 패칭 완벽 가이드

Next.js 16과 React 19는 데이터 패칭의 패러다임을 근본적으로 변화시켰습니다. 새로운 `'use cache'` 디렉티브와 선언적 캐싱 API는 개발자에게 더 세밀한 제어권을 부여하며, Supabase와의 통합 시 Row Level Security(RLS)를 활용한 안전한 데이터 접근이 가능합니다. 본 가이드는 이룸(Yiroom) 플랫폼의 기술 스택에 최적화된 **실무 적용 가능한 패턴**과 **의사결정 기준**을 제공합니다.

---

## Server Components 직접 fetch vs API 라우트 선택 기준

Server Components에서의 데이터 패칭은 크게 두 가지 방식으로 나뉩니다. **직접 fetch**는 컴포넌트 내에서 데이터베이스나 외부 API에 바로 접근하는 방식이고, **API 라우트**는 `/api/*` 경로를 통해 HTTP 엔드포인트를 생성하는 방식입니다.

직접 fetch 방식은 **추가적인 HTTP 라운드트립을 제거**하여 성능상 이점을 제공합니다. Server Components는 서버에서 실행되므로 데이터베이스에 직접 접근해도 클라이언트에 민감한 정보가 노출되지 않습니다. 또한 Next.js 16의 `'use cache'` 디렉티브와 자연스럽게 통합되어 선언적 캐싱이 가능합니다.

```typescript
// app/products/page.tsx - 직접 fetch 패턴 (권장)
import { cacheLife, cacheTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getProducts(categoryId?: string) {
  'use cache'
  cacheTag('products', categoryId ? `category-${categoryId}` : 'all-products')
  cacheLife('hours')
  
  const supabase = await createClient()
  const query = supabase
    .from('products')
    .select('id, name, name_ko, price, image_url, brand:brands(name)')
    .order('created_at', { ascending: false })
  
  if (categoryId) {
    query.eq('category_id', categoryId)
  }
  
  const { data, error } = await query
  if (error) throw new Error('제품 목록을 불러올 수 없습니다')
  
  return data
}

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductGrid products={products} />
}
```

API 라우트는 **외부 클라이언트**(모바일 앱, 서드파티)가 접근해야 하거나, **웹훅 수신**(결제 알림, Supabase 실시간 이벤트), **명시적 HTTP 메서드 제어**가 필요한 경우에 사용합니다.

| 시나리오 | 권장 방식 | 이유 |
|---------|----------|------|
| 제품 목록 페이지 | 직접 fetch | 내부 데이터, 캐시 가능, 라운드트립 없음 |
| 사용자 프로필 (인증 필요) | 직접 fetch + Clerk | RLS 자동 적용 |
| 모바일 앱 API | API Route | 외부 클라이언트 접근 |
| 결제 웹훅 | API Route | 외부 서비스 콜백 |
| AI 분석 결과 저장 | Server Action | 뮤테이션 + revalidation |

---

## Next.js 16 캐싱 전략: 'use cache' 디렉티브 완전 정복

Next.js 16은 **`'use cache'` 디렉티브**를 통해 선언적 캐싱을 도입했습니다. 이는 Next.js 15에서 실험적이었던 PPR(Partial Prerendering)을 대체하는 정식 기능입니다.

### 기본 설정과 활성화

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // 이룸 플랫폼 커스텀 프로필
    productCatalog: {
      stale: 300,       // 5분간 클라이언트 캐시
      revalidate: 3600, // 1시간마다 서버 갱신
      expire: 86400,    // 24시간 후 만료
    },
    aiAnalysis: {
      stale: 60,        // 1분
      revalidate: 300,  // 5분
      expire: 3600,     // 1시간
    },
    userProfile: {
      stale: 30,        // 30초
      revalidate: 60,   // 1분
      expire: 300,      // 5분
    },
  },
}

export default nextConfig
```

### 세 가지 캐시 모드

`'use cache'` 디렉티브는 세 가지 변형을 지원합니다:

```typescript
// 1. 기본 캐시 - 서버 메모리 LRU
async function getPublicProducts() {
  'use cache'
  cacheLife('hours')
  return await fetchProducts()
}

// 2. 리모트 캐시 - 분산 캐시 (Redis/KV)
async function getGlobalSettings() {
  'use cache: remote'
  cacheLife('days')
  return await fetchSettings()
}

// 3. 프라이빗 캐시 - 사용자별 데이터
async function getUserRecommendations(userId: string) {
  'use cache: private'
  cacheTag(`user-${userId}-recommendations`)
  cacheLife('minutes')
  
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session-id')?.value
  return await fetchRecommendations(userId, sessionId)
}
```

### cacheLife 프리셋과 동작 원리

| 프리셋 | stale | revalidate | expire | 적합한 콘텐츠 |
|--------|-------|------------|--------|--------------|
| `seconds` | 30초 | 1초 | 1분 | 실시간 재고, 가격 |
| `minutes` | 5분 | 1분 | 1시간 | 피드, 알림 |
| `hours` | 5분 | 1시간 | 1일 | 제품 목록, 카테고리 |
| `days` | 5분 | 1일 | 1주 | 블로그, 정책 문서 |
| `max` | 5분 | 30일 | 1년 | 약관, 법적 고지 |

- **stale**: 클라이언트가 서버 확인 없이 캐시를 사용하는 시간
- **revalidate**: 서버가 백그라운드에서 데이터를 갱신하는 주기
- **expire**: 요청 없이 캐시가 완전히 만료되는 시간

### 캐시 무효화 전략

```typescript
'use server'

import { revalidateTag, updateTag, revalidatePath } from 'next/cache'

// 제품 업데이트 후 캐시 무효화
export async function updateProduct(productId: string, data: ProductUpdate) {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', productId)
  
  if (error) throw new Error('제품 업데이트 실패')
  
  // 전략적 캐시 무효화
  updateTag(`product-${productId}`)  // 해당 제품 즉시 갱신
  revalidateTag('products', 'max')   // 제품 목록 stale-while-revalidate
  revalidatePath('/products')        // 제품 페이지 새로고침
}

// AI 분석 결과 저장 후
export async function saveAnalysisResult(result: AnalysisResult) {
  const { userId } = await auth()
  if (!userId) throw new Error('인증 필요')
  
  const supabase = await createServerSupabaseClient()
  
  await supabase.from('analysis_results').insert({
    ...result,
    // user_id는 RLS 기본값으로 자동 설정
  })
  
  // 사용자별 분석 결과 캐시 갱신
  updateTag(`user-${userId}-analysis`)
  revalidatePath('/my-analysis')
}
```

### 캐싱 의사결정 트리

```
데이터 특성 판단
      │
      ├─► 공개 콘텐츠인가?
      │         │
      │         ├─► YES: 'use cache' + cacheLife('hours'/'days')
      │         │        예: 제품 정보, 블로그, 카테고리
      │         │
      │         └─► NO: 사용자별 데이터
      │                   │
      │                   ├─► 민감도 높음: 'use cache: private'
      │                   │   예: 분석 결과, 프로필
      │                   │
      │                   └─► 실시간 필요: 캐시 없이 직접 fetch
      │                       예: 결제 상태, 세션
      │
      ├─► 업데이트 빈도는?
      │         │
      │         ├─► 실시간 (초 단위): cacheLife('seconds')
      │         ├─► 자주 (분 단위): cacheLife('minutes')
      │         ├─► 보통 (시간 단위): cacheLife('hours')
      │         └─► 드물게 (일 단위): cacheLife('days')
      │
      └─► 무효화 트리거는?
                │
                ├─► 사용자 액션: updateTag() - 즉시 반영
                ├─► 웹훅/외부: revalidateTag('tag', 'max')
                └─► 전체 페이지: revalidatePath()
```

---

## Supabase + Server Components 표준 통합 패턴

### 클라이언트 설정 아키텍처

```typescript
// lib/supabase/client.ts - 브라우저용
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// lib/supabase/server.ts - Server Components용
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components는 쿠키 쓰기 불가 - 정상 동작
          }
        },
      },
    }
  )
}
```

### Clerk + Supabase 통합 (권장 패턴)

2025년 4월부터 **네이티브 통합**이 JWT 템플릿보다 권장됩니다:

```typescript
// lib/supabase/clerk-server.ts
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken()
      },
    }
  )
}

// lib/supabase/clerk-client.ts - 클라이언트용
'use client'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useSupabaseClient() {
  const { session } = useSession()
  
  return useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        return session?.getToken() ?? null
      },
    }
  ), [session])
}
```

### RLS 정책 설정 (Clerk 연동)

```sql
-- 분석 결과 테이블
CREATE TABLE analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  analysis_type TEXT NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 자신의 데이터만 조회
CREATE POLICY "사용자는 자신의 분석 결과만 조회"
ON analysis_results FOR SELECT
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

-- 자신의 데이터만 생성
CREATE POLICY "사용자는 자신의 분석 결과만 생성"
ON analysis_results FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- 공개 콘텐츠 (제품, 블로그)
CREATE POLICY "모든 사용자가 제품 조회 가능"
ON products FOR SELECT
TO anon, authenticated
USING (true);
```

### 데이터 접근 패턴별 구현

```typescript
// 패턴 1: 공개 콘텐츠 (캐시 적용)
// app/products/[slug]/page.tsx
import { cacheLife, cacheTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

async function getProduct(slug: string) {
  'use cache'
  cacheTag(`product-${slug}`, 'products')
  cacheLife('hours')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(name, name_ko),
      category:categories(name, name_ko),
      ingredients:product_ingredients(ingredient:ingredients(*))
    `)
    .eq('slug', slug)
    .single()
  
  if (error) return null
  return data
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) notFound()
  
  return <ProductDetails product={product} />
}

// 패턴 2: 인증된 사용자 데이터
// app/my-analysis/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'

export default async function MyAnalysisPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  
  const supabase = createServerSupabaseClient()
  
  // RLS가 자동으로 현재 사용자 데이터만 반환
  const { data: results, error } = await supabase
    .from('analysis_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    throw new Error('분석 결과를 불러올 수 없습니다')
  }
  
  return <AnalysisResultsList results={results} />
}

// 패턴 3: AI 분석 결과 저장 (Server Action)
// app/actions/analysis.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'
import { updateTag, revalidatePath } from 'next/cache'
import { z } from 'zod'

const analysisSchema = z.object({
  analysisType: z.enum(['skin', 'routine', 'ingredients']),
  resultData: z.record(z.unknown()),
})

export async function saveAnalysisResult(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('인증이 필요합니다')
  
  const validated = analysisSchema.parse({
    analysisType: formData.get('analysisType'),
    resultData: JSON.parse(formData.get('resultData') as string),
  })
  
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('analysis_results')
    .insert({
      analysis_type: validated.analysisType,
      result_data: validated.resultData,
    })
    .select()
    .single()
  
  if (error) throw new Error('분석 결과 저장 실패')
  
  // 즉시 캐시 갱신
  updateTag(`user-${userId}-analysis`)
  revalidatePath('/my-analysis')
  
  return data
}
```

---

## Streaming과 Suspense: 병렬 데이터 로딩 최적화

### Waterfall 문제와 해결

순차적 await는 **데이터 폭포(waterfall)** 현상을 일으켜 성능을 저하시킵니다:

```typescript
// ❌ 나쁜 예: 순차 로딩 (총 시간 = A + B + C)
export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await getProduct(slug)      // 200ms 대기
  const reviews = await getReviews(slug)      // 300ms 대기
  const related = await getRelatedProducts(slug) // 200ms 대기
  // 총: 700ms
}

// ✅ 좋은 예: 병렬 로딩 (총 시간 = max(A, B, C))
export default async function ProductPage({ params }) {
  const { slug } = await params
  
  const [product, reviews, related] = await Promise.all([
    getProduct(slug),      // 200ms
    getReviews(slug),      // 300ms  
    getRelatedProducts(slug) // 200ms
  ])
  // 총: 300ms (가장 느린 요청 기준)
  
  return (
    <>
      <ProductDetails product={product} />
      <ReviewSection reviews={reviews} />
      <RelatedProducts products={related} />
    </>
  )
}
```

### Suspense 경계를 활용한 점진적 렌더링

더 나은 UX를 위해 **Suspense 경계**로 독립적인 스트리밍을 구현합니다:

```typescript
// app/products/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) notFound()
  
  return (
    <main className="pb-safe">
      {/* 핵심 콘텐츠 - 즉시 렌더링 */}
      <ProductHeader product={product} />
      <ProductGallery images={product.images} />
      <ProductInfo product={product} />
      
      {/* 리뷰 - 독립 스트리밍 */}
      <section className="mt-8">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews productId={product.id} />
        </Suspense>
      </section>
      
      {/* 성분 분석 - 독립 스트리밍 */}
      <section className="mt-8">
        <Suspense fallback={<IngredientsSkeleton />}>
          <IngredientsAnalysis ingredients={product.ingredients} />
        </Suspense>
      </section>
      
      {/* 관련 제품 - 최하위 우선순위 */}
      <section className="mt-12">
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts 
            categoryId={product.category_id} 
            excludeId={product.id} 
          />
        </Suspense>
      </section>
    </main>
  )
}

// 각 섹션은 독립적인 async 컴포넌트
async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId)
  return <ReviewsList reviews={reviews} />
}

async function RelatedProducts({ 
  categoryId, 
  excludeId 
}: { 
  categoryId: string
  excludeId: string 
}) {
  const products = await getRelatedProducts(categoryId, excludeId)
  return <ProductGrid products={products} title="함께 보면 좋은 제품" />
}
```

### 데이터 의존성 처리

때로는 순차 로딩이 **필수**입니다. 이 경우 Suspense를 중첩하여 가능한 부분을 먼저 보여줍니다:

```typescript
// 브랜드 정보가 제품 데이터에 의존하는 경우
export default async function ProductPage({ params }) {
  const { slug } = await params
  
  // 1단계: 제품 정보 (필수)
  const product = await getProduct(slug)
  if (!product) notFound()
  
  return (
    <>
      <ProductDetails product={product} />
      
      {/* 2단계: 브랜드 제품은 product.brandId가 필요 */}
      <Suspense fallback={<BrandProductsSkeleton />}>
        <BrandProducts brandId={product.brand_id} />
      </Suspense>
    </>
  )
}
```

### 모바일 최적화 스켈레톤 UI

```typescript
// components/skeletons/ProductCardSkeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 이미지 - 1:1 비율 */}
      <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
      {/* 브랜드명 */}
      <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
      {/* 제품명 (한글은 짧음) */}
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      {/* 가격 */}
      <div className="h-4 bg-gray-200 rounded w-20" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// loading.tsx 예시
// app/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div className="animate-pulse" aria-label="로딩 중" role="status">
      {/* 필터 바 스켈레톤 */}
      <div className="flex gap-3 mb-6 px-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-full w-20 flex-shrink-0" />
        ))}
      </div>
      
      {/* 제품 그리드 */}
      <ProductGridSkeleton count={8} />
      
      <span className="sr-only">제품 목록을 불러오는 중입니다</span>
    </div>
  )
}
```

---

## 에러 처리 표준 패턴

### error.tsx 완전 구현

```typescript
// app/error.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ErrorCode = 
  | 'DATABASE_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

const ERROR_MESSAGES: Record<ErrorCode, { 
  title: string
  description: string
  action: string 
}> = {
  DATABASE_ERROR: {
    title: '서비스 일시 중단',
    description: '데이터를 불러오는 중 문제가 발생했습니다.',
    action: '다시 시도'
  },
  AUTH_ERROR: {
    title: '로그인이 필요합니다',
    description: '이 페이지를 보려면 로그인해주세요.',
    action: '로그인하기'
  },
  RATE_LIMITED: {
    title: '요청이 너무 많습니다',
    description: '잠시 후 다시 시도해주세요.',
    action: '1분 후 다시 시도'
  },
  NETWORK_ERROR: {
    title: '연결 오류',
    description: '인터넷 연결을 확인하고 다시 시도해주세요.',
    action: '다시 시도'
  },
  UNKNOWN: {
    title: '오류가 발생했습니다',
    description: '문제가 지속되면 고객센터로 문의해주세요.',
    action: '다시 시도'
  }
}

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  
  const getErrorCode = (error: Error): ErrorCode => {
    const message = error.message.toLowerCase()
    if (message.includes('auth') || message.includes('unauthorized')) return 'AUTH_ERROR'
    if (message.includes('rate') || message.includes('429')) return 'RATE_LIMITED'
    if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR'
    if (message.includes('database') || message.includes('supabase')) return 'DATABASE_ERROR'
    return 'UNKNOWN'
  }
  
  const errorCode = getErrorCode(error)
  const errorContent = ERROR_MESSAGES[errorCode]
  
  useEffect(() => {
    // 에러 로깅 (Sentry 등)
    console.error('[App Error]', {
      message: error.message,
      digest: error.digest,
      code: errorCode,
    })
  }, [error, errorCode])
  
  const handleRetry = async () => {
    if (retryCount >= 3) {
      router.push('/')
      return
    }
    
    setIsRetrying(true)
    
    // 지수 백오프: 1s, 2s, 4s
    await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000))
    
    setRetryCount(prev => prev + 1)
    router.refresh()
    reset()
    setIsRetrying(false)
  }
  
  return (
    <div 
      className="min-h-[400px] flex flex-col items-center justify-center px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 mb-6 text-rose-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {errorContent.title}
      </h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {errorContent.description}
      </p>
      
      {process.env.NODE_ENV === 'development' && error.digest && (
        <p className="text-xs text-gray-400 mb-4 font-mono">
          Error ID: {error.digest}
        </p>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying || retryCount >= 3}
          className="px-6 py-2.5 bg-rose-500 text-white rounded-full font-medium
                     hover:bg-rose-600 disabled:opacity-50 transition-colors"
        >
          {isRetrying ? '재시도 중...' : errorContent.action}
        </button>
        
        <Link
          href="/"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-full
                     font-medium hover:bg-gray-50 transition-colors"
        >
          홈으로
        </Link>
      </div>
      
      {retryCount >= 3 && (
        <p className="mt-6 text-sm text-gray-500">
          문제가 계속되시면{' '}
          <a href="/support" className="text-rose-500 hover:underline">
            고객센터
          </a>
          로 문의해주세요.
        </p>
      )}
    </div>
  )
}
```

### not-found.tsx 구현

```typescript
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-6" aria-hidden="true">
        🔍
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        페이지를 찾을 수 없습니다
      </h1>
      
      <p className="text-gray-600 text-center mb-8 max-w-md">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium
                     hover:bg-rose-600 transition-colors"
        >
          홈으로 가기
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 border border-gray-300 rounded-full font-medium
                     hover:bg-gray-50 transition-colors"
        >
          제품 둘러보기
        </Link>
      </div>
    </main>
  )
}
```

### 에러 처리 의사결정 트리

```
에러 발생
     │
     ├─► 예상된 에러인가? (인증, 유효성, 404)
     │         │
     │         ├─► YES → 에러를 throw하지 않고 상태로 반환
     │         │        - notFound() 호출
     │         │        - useActionState로 폼 에러 처리
     │         │        - redirect('/login')
     │         │
     │         └─► NO → Error Boundary로 전파 (throw)
     │
     ├─► 어디서 발생했는가?
     │         │
     │         ├─► Server Component → error.tsx에서 처리
     │         ├─► Client Component → error.tsx에서 처리
     │         ├─► Event Handler → try/catch + useState
     │         ├─► Root Layout → global-error.tsx에서 처리
     │         └─► API Route → Response 객체로 반환
     │
     └─► 재시도 가능한가?
               │
               ├─► 네트워크/타임아웃 → 재시도 버튼 표시
               ├─► Rate Limited → 카운트다운 + 자동 재시도
               ├─► 인증 오류 → 로그인 페이지로 리다이렉트
               └─► 유효성 오류 → 인라인 에러 메시지
```

---

## 실무 적용 완성 예제: 이룸 제품 상세 페이지

```typescript
// app/products/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { cacheLife, cacheTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'

// 타입 정의
interface Product {
  id: string
  slug: string
  name: string
  name_ko: string
  description: string
  price: number
  images: string[]
  brand: { name: string; name_ko: string }
  category: { name: string; name_ko: string }
  ingredients: Array<{
    ingredient: {
      id: string
      name_ko: string
      inci_name: string
      safety_grade: string
    }
  }>
}

// 공개 제품 데이터 (캐시 적용)
async function getProduct(slug: string): Promise<Product | null> {
  'use cache'
  cacheTag(`product-${slug}`, 'products')
  cacheLife('hours')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(name, name_ko),
      category:categories(name, name_ko),
      ingredients:product_ingredients(
        ingredient:ingredients(id, name_ko, inci_name, safety_grade)
      )
    `)
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('[Product]', error)
    return null
  }
  
  return data as Product
}

// 리뷰 데이터 (캐시 적용)
async function getProductReviews(productId: string) {
  'use cache'
  cacheTag(`reviews-${productId}`)
  cacheLife('minutes')
  
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, user_nickname')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20)
  
  return data ?? []
}

// 사용자별 데이터 (인증 필요, 캐시 미적용)
async function getUserAnalysisForProduct(productId: string, userId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data } = await supabase
    .from('user_product_analysis')
    .select('*')
    .eq('product_id', productId)
    .single()
  
  return data
}

// 관련 제품 (캐시 적용)
async function getRelatedProducts(categoryId: string, excludeId: string) {
  'use cache'
  cacheTag(`category-${categoryId}`, 'products')
  cacheLife('days')
  
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, slug, name_ko, price, images')
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .limit(4)
  
  return data ?? []
}

// 메인 페이지 컴포넌트
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) notFound()
  
  // 인증 상태 확인 (선택적)
  const { userId } = await auth()
  
  return (
    <main className="pb-safe">
      {/* 핵심 정보 - 즉시 렌더링 */}
      <ProductHeader product={product} />
      <ProductGallery images={product.images} />
      <ProductInfo product={product} />
      
      {/* 성분 분석 */}
      <section className="mt-8 px-4">
        <h2 className="text-lg font-bold mb-4">성분 분석</h2>
        <IngredientsTable ingredients={product.ingredients} />
      </section>
      
      {/* 사용자 맞춤 분석 (로그인 시) */}
      {userId && (
        <Suspense fallback={<PersonalAnalysisSkeleton />}>
          <PersonalAnalysis productId={product.id} userId={userId} />
        </Suspense>
      )}
      
      {/* 리뷰 - 독립 스트리밍 */}
      <section className="mt-8">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviewsSection productId={product.id} />
        </Suspense>
      </section>
      
      {/* 관련 제품 - 최하위 우선순위 */}
      <section className="mt-12">
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProductsSection 
            categoryId={product.category.id} 
            excludeId={product.id} 
          />
        </Suspense>
      </section>
    </main>
  )
}

// Async 서브 컴포넌트들
async function PersonalAnalysis({ 
  productId, 
  userId 
}: { 
  productId: string
  userId: string 
}) {
  const analysis = await getUserAnalysisForProduct(productId, userId)
  
  if (!analysis) {
    return (
      <section className="mt-8 px-4">
        <div className="bg-rose-50 rounded-xl p-4">
          <p className="text-gray-600">AI 피부 분석을 통해 이 제품과의 궁합을 확인해보세요.</p>
          <Link href="/analysis" className="text-rose-500 font-medium">
            분석 시작하기 →
          </Link>
        </div>
      </section>
    )
  }
  
  return (
    <section className="mt-8 px-4">
      <h2 className="text-lg font-bold mb-4">나의 피부 적합도</h2>
      <CompatibilityScore score={analysis.compatibility_score} />
    </section>
  )
}

async function ProductReviewsSection({ productId }: { productId: string }) {
  const reviews = await getProductReviews(productId)
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold mb-4">리뷰 ({reviews.length})</h2>
      <ReviewsList reviews={reviews} />
    </div>
  )
}

async function RelatedProductsSection({ 
  categoryId, 
  excludeId 
}: { 
  categoryId: string
  excludeId: string 
}) {
  const products = await getRelatedProducts(categoryId, excludeId)
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold mb-4">함께 보면 좋은 제품</h2>
      <ProductGrid products={products} />
    </div>
  )
}
```

---

## 핵심 요약

**캐싱 전략**은 데이터 특성에 따라 선택합니다. 공개 콘텐츠는 `'use cache'`와 `cacheLife('hours'/'days')`를, 사용자별 데이터는 `'use cache: private'`를 사용하고, 실시간 데이터는 캐시 없이 직접 fetch합니다.

**Supabase 통합**에서는 Clerk 네이티브 통합을 사용하고, RLS 정책에서 `auth.jwt()->>'sub'`로 Clerk 사용자 ID에 접근합니다. Server Components에서는 쿠키 기반 세션을 사용할 수 없으므로 토큰 기반 인증을 활용합니다.

**성능 최적화**의 핵심은 **waterfall 방지**입니다. 독립적인 데이터는 `Promise.all`로 병렬 로딩하고, Suspense 경계로 감싸 점진적 렌더링을 구현합니다. 모바일 사용자를 위해 above-the-fold 콘텐츠를 최우선으로 렌더링합니다.

**에러 처리**는 예상 가능한 에러(인증, 404)와 예외적 에러를 구분합니다. 예상 에러는 명시적으로 처리하고(`notFound()`, `redirect()`), 예외는 error.tsx로 전파하여 사용자 친화적 복구 UI를 제공합니다.