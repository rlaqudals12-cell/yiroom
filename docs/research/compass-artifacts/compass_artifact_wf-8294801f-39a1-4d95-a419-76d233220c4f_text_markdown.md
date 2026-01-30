# Next.js 16 웹 성능 최적화 완벽 가이드 (2026)

**핵심 요약**: 이룸(Yiroom) 플랫폼의 한국 모바일 사용자(70%+)를 위한 **3초 이내 로딩** 목표 달성은 INP ≤200ms, LCP ≤2.5초, CLS ≤0.1의 Core Web Vitals 기준 충족과 **초기 번들 130KB 이하** 유지를 통해 실현 가능합니다. Next.js 16의 Partial Prerendering과 React Server Components를 활용하면 정적 셸을 Edge에서 즉시 제공하면서 동적 AI 분석 결과를 스트리밍할 수 있어, LTE/5G 네트워크 환경에서 Lighthouse 90+ 달성이 현실적입니다.

---

## Core Web Vitals 2026: INP 시대의 성능 기준

2024년 3월 FID를 대체한 **INP(Interaction to Next Paint)**는 페이지 전체 생명주기 동안 모든 사용자 인터랙션의 반응성을 측정합니다. 기존 FID가 첫 번째 인터랙션만 측정한 반면, INP는 클릭, 탭, 키보드 입력 전체를 추적하여 75번째 백분위수 값을 보고합니다.

| 메트릭 | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **INP** | ≤200ms | 200-500ms | >500ms |
| **LCP** | ≤2.5초 | 2.5-4.0초 | >4.0초 |
| **CLS** | ≤0.1 | 0.1-0.25 | >0.25 |

INP의 세 가지 구성 요소는 **입력 지연**(이벤트 핸들러 시작 전 대기), **처리 시간**(콜백 실행), **표현 지연**(다음 프레임 페인팅까지)입니다. 한국 모바일 사용자의 터치 기반 인터랙션에서 특히 중요한 최적화 대상입니다.

### web-vitals 라이브러리를 활용한 측정 구현

```typescript
// lib/analytics.ts
import { onINP, onLCP, onCLS, onFCP, onTTFB } from 'web-vitals/attribution';

interface MetricPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  attribution?: Record<string, unknown>;
}

function sendToAnalytics(metric: MetricPayload) {
  const body = JSON.stringify({
    ...metric,
    page: window.location.pathname,
    timestamp: Date.now(),
    connection: (navigator as any).connection?.effectiveType || 'unknown',
  });
  
  // 페이지 언로드 시에도 데이터 전송 보장
  navigator.sendBeacon('/api/analytics', body);
}

// INP 상세 분석 (디버깅용)
onINP((metric) => {
  sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    attribution: {
      inputDelay: metric.attribution.inputDelay,
      processingDuration: metric.attribution.processingDuration,
      presentationDelay: metric.attribution.presentationDelay,
      interactionTarget: metric.attribution.interactionTarget,
    },
  });
});

onLCP(sendToAnalytics);
onCLS(sendToAnalytics);
```

**INP 최적화의 핵심은 Long Task 분할**입니다. 50ms를 초과하는 작업은 메인 스레드를 블로킹하여 사용자 인터랙션 응답을 지연시킵니다.

```typescript
// utils/yieldToMain.ts
// 장시간 작업을 청크로 분할하여 브라우저에 제어권 반환
async function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function processImagesInChunks(images: ImageData[], analyzer: AIAnalyzer) {
  const results: AnalysisResult[] = [];
  
  for (let i = 0; i < images.length; i++) {
    results.push(await analyzer.analyze(images[i]));
    
    // 매 처리마다 메인 스레드에 제어권 반환
    if (i % 2 === 0) {
      await yieldToMain();
    }
  }
  
  return results;
}
```

---

## Next.js 16 핵심 성능 기능 활용

### Partial Prerendering(PPR): 정적과 동적의 최적 결합

PPR은 Next.js 16의 가장 혁신적인 기능으로, **정적 HTML 셸을 Edge에서 즉시 제공**하면서 동적 콘텐츠는 Suspense 경계 내에서 스트리밍합니다. 이룸 플랫폼처럼 정적 UI와 동적 AI 분석 결과가 혼합된 페이지에 이상적입니다.

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental', // 점진적 도입
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 640, 750, 828, 1080],
    minimumCacheTTL: 2678400, // 31일
  },
  cacheLife: {
    'analysis-results': { stale: 30, revalidate: 60, expire: 300 },
    'product-catalog': { stale: 300, revalidate: 600, expire: 3600 },
  },
};

export default nextConfig;
```

```typescript
// app/analysis/[id]/page.tsx
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';

export const experimental_ppr = true;

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="container max-w-md mx-auto px-4">
      {/* 정적 셸 - Edge에서 즉시 제공 */}
      <AnalysisHeader />
      
      {/* 캐시된 분석 결과 - 셸에 포함 */}
      <CachedAnalysisResults analysisId={id} />
      
      {/* 개인화된 추천 - 스트리밍 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <PersonalizedRecommendations analysisId={id} />
      </Suspense>
    </main>
  );
}

// use cache 디렉티브를 활용한 세분화된 캐싱
async function CachedAnalysisResults({ analysisId }: { analysisId: string }) {
  'use cache';
  cacheLife('analysis-results');
  cacheTag(`analysis-${analysisId}`);
  
  const analysis = await db.analyses.findUnique({
    where: { id: analysisId },
    include: { results: true },
  });
  
  return <AnalysisDisplay analysis={analysis} />;
}
```

### Turbopack: 개발 속도 혁신

Next.js 16에서 Turbopack은 **개발 서버 기본값**으로 설정되어 있으며, 프로덕션 빌드도 지원합니다. Webpack 대비 **Fast Refresh 96.3% 향상**, **로컬 서버 시작 76.7% 단축**이라는 성능 개선을 제공합니다.

```typescript
// next.config.ts - Turbopack 커스터마이징
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      '@': './src',
      '~': './src',
    },
  },
  experimental: {
    turbopackFileSystemCacheForDev: true, // 파일 시스템 캐싱
    turbopackFileSystemCacheForBuild: true,
  },
};
```

### Server Components로 클라이언트 번들 최소화

React Server Components의 가장 큰 장점은 **서버에서만 실행되는 코드가 클라이언트 번들에 포함되지 않는다**는 것입니다. 데이터 페칭, 무거운 라이브러리 처리, 민감한 로직 모두 서버에서 처리됩니다.

```typescript
// app/products/page.tsx - Server Component (기본값)
import { shiki } from 'shiki'; // 250KB+ 라이브러리, 클라이언트에 전송 안 됨

export default async function ProductsPage() {
  // 직접 DB 접근 - API 라우트 불필요
  const products = await db.products.findMany({
    where: { category: 'skincare', isActive: true },
    orderBy: { popularity: 'desc' },
    take: 20,
  });
  
  // 병렬 데이터 페칭으로 워터폴 방지
  const [categories, promotions] = await Promise.all([
    db.categories.findMany(),
    db.promotions.findActive(),
  ]);
  
  return (
    <>
      <CategoryNav categories={categories} />
      <ProductGrid products={products} />
      <PromotionBanner promotions={promotions} />
    </>
  );
}
```

**'use client' 디렉티브는 필수적인 경우에만 사용**합니다:

```typescript
// components/ImageUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <img src={preview} alt="미리보기" className="max-h-64 mx-auto rounded-lg" />
      ) : (
        <p className="text-gray-500">
          이미지를 드래그하거나 클릭하여 AI 분석을 시작하세요
        </p>
      )}
      {uploading && (
        <div className="mt-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-sm text-gray-600">AI 분석 중...</p>
        </div>
      )}
    </div>
  );
}
```

---

## 이미지 최적화: AVIF 우선 전략

### AVIF vs WebP 성능 비교 (2026년 기준)

| 포맷 | 글로벌 지원율 | 한국 시장 추정 | JPEG 대비 압축률 |
|------|--------------|---------------|-----------------|
| **AVIF** | ~94% | ~95%+ | 50% 감소 |
| **WebP** | ~97% | ~98%+ | 30% 감소 |

한국의 높은 스마트폰 보급률과 최신 브라우저 사용 환경을 고려할 때, **AVIF를 1순위로 설정**하고 WebP를 폴백으로 구성하는 것이 최적입니다. 특히 뷰티/웰니스 플랫폼에서 피부 톤과 색상 정확도가 중요한데, AVIF의 10/12비트 색상 깊이가 우수한 품질을 제공합니다.

```typescript
// next.config.ts - 이미지 최적화 설정
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // 한국 모바일 뷰포트에 최적화된 디바이스 크기
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 2678400, // 31일 캐시
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
```

### LCP 최적화: 히어로 이미지 처리

```tsx
// components/HeroImage.tsx
import Image from 'next/image';

export function HeroImage() {
  return (
    <div className="relative w-full aspect-[16/9]">
      <Image
        src="/hero-beauty-analysis.jpg"
        alt="AI 피부 분석 서비스"
        fill
        priority // 프리로드 링크 자동 추가
        fetchPriority="high"
        sizes="100vw"
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
        className="object-cover"
      />
    </div>
  );
}

// 아래 영역 이미지는 lazy loading
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 33vw"
      quality={75}
      className="rounded-lg"
    />
  );
}
```

### 사용자 업로드 이미지 처리 파이프라인

```typescript
// lib/imageProcessor.ts
import sharp from 'sharp';

interface ProcessedImages {
  original: Buffer;
  preview: Buffer;
  thumbnail: Buffer;
  blurDataURL: string;
}

export async function processUserUpload(file: File): Promise<ProcessedImages> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const [original, preview, thumbnail, blurBuffer] = await Promise.all([
    // AI 분석용 원본 (최대 2000px, 고품질 유지)
    sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer(),
    
    // 미리보기용 (800px)
    sharp(buffer)
      .resize(800, 800, { fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer(),
    
    // 썸네일 (200px)
    sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer(),
    
    // 블러 플레이스홀더
    sharp(buffer)
      .resize(32, 32, { fit: 'inside' })
      .blur(10)
      .jpeg({ quality: 10 })
      .toBuffer(),
  ]);
  
  return {
    original,
    preview,
    thumbnail,
    blurDataURL: `data:image/jpeg;base64,${blurBuffer.toString('base64')}`,
  };
}
```

---

## 번들 크기 최적화: 130KB 목표 달성

### JavaScript 예산 설정

Alex Russell(Google)의 연구와 업계 벤치마크에 기반한 권장 번들 크기:

| 번들 유형 | 목표 (gzip) | 비고 |
|----------|------------|------|
| **메인/초기 번들** | ≤130KB | LTE 환경 TTI 5초 이내 |
| **라우트별 번들** | ≤50KB | 코드 스플리팅 적용 시 |
| **서드파티 스크립트** | ≤50KB 합계 | 분석, 추적 도구 포함 |
| **CSS** | ≤20KB | 페이지당 |

### Barrel File 문제 해결

Barrel 파일(index.ts에서 여러 모듈 re-export)은 **트리 셰이킹을 방해**하여 Button 하나를 import해도 255KB+ 번들이 생성될 수 있습니다.

```typescript
// next.config.ts - 패키지 import 최적화
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@headlessui/react',
      'date-fns',
      'lodash-es',
      '@tabler/icons-react',
      // 내부 UI 라이브러리도 추가
      '@yiroom/ui',
    ],
  },
};
```

```typescript
// ❌ 잘못된 방식 - 전체 라이브러리 포함
import { debounce } from 'lodash';           // 73KB (gzip: 25KB)
import { Calendar } from '@/components/ui';

// ✅ 올바른 방식 - 필요한 모듈만 직접 import
import debounce from 'lodash/debounce';      // 7KB (gzip: 2KB)
import { Calendar } from '@/components/ui/Calendar';
```

### Dynamic Import 패턴

```typescript
// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// 무거운 컴포넌트 지연 로딩
const AnalyticsDashboard = dynamic(
  () => import('./AnalyticsDashboard'),
  { 
    loading: () => <DashboardSkeleton />,
    ssr: false // 브라우저 전용 컴포넌트
  }
);

const ReportEditor = dynamic(
  () => import('./ReportEditor'),
  { loading: () => <EditorSkeleton /> }
);

// 라이브러리 동적 로딩 (이벤트 기반)
export function SearchComponent() {
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (query: string) => {
    // 검색 시에만 Fuse.js 로드
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(data, { keys: ['name', 'description'] });
    setResults(fuse.search(query));
  };

  return (
    <input 
      type="search"
      placeholder="제품 검색..."
      onChange={(e) => handleSearch(e.target.value)}
    />
  );
}

// 호버 시 프리로딩으로 UX 향상
export function ProductDetailButton({ productId }: { productId: string }) {
  const preloadModal = () => {
    import('./ProductDetailModal');
  };

  return (
    <button
      onMouseEnter={preloadModal}
      onFocus={preloadModal}
      onClick={() => openModal(productId)}
    >
      상세 보기
    </button>
  );
}
```

### 번들 분석 및 CI/CD 통합

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "size": "npm run build && size-limit",
    "size:check": "npm run build && size-limit --json"
  },
  "size-limit": [
    {
      "path": ".next/static/chunks/main-*.js",
      "limit": "130 kB"
    },
    {
      "path": ".next/static/chunks/pages/_app-*.js",
      "limit": "80 kB"
    },
    {
      "path": ".next/static/css/*.css",
      "limit": "20 kB"
    }
  ]
}
```

```yaml
# .github/workflows/performance.yml
name: Performance Budget Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          build_script: build

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

```json
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "total-byte-weight": ["error", { "maxNumericValue": 500000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

---

## Edge Runtime과 한국 사용자 최적화

### Vercel 서울 리전(icn1) 활용

Vercel은 **서울(icn1)**에 Edge 노드를 보유하고 있어 한국 사용자에게 최적의 레이턴시를 제공합니다.

```typescript
// app/api/analyze/route.ts
export const runtime = 'nodejs'; // Supabase TCP 연결 필요
export const preferredRegion = 'icn1'; // 서울
export const maxDuration = 60; // AI 처리 시간 고려

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get('image') as File;
  
  const result = await analyzeImage(image);
  await saveToSupabase(result);
  
  return Response.json(result, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

### Edge Runtime vs Node.js Runtime 선택 기준

| 사용 사례 | 권장 런타임 | 이유 |
|----------|------------|------|
| 인증/리다이렉트 | Edge | 9배 빠른 콜드 스타트 |
| Supabase 쿼리 | Node.js | TCP 연결 필요 |
| AI 분석 | Node.js | 무거운 연산, 긴 실행 시간 |
| 개인화 응답 | Edge | 빠른 지오 라우팅 |

### Supabase 연결 풀링 설정

서버리스 환경에서 Supabase 연결 관리는 **Supavisor 풀러(포트 6543)**를 사용해야 합니다:

```typescript
// lib/db.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const isProd = process.env.NODE_ENV === 'production';

// Supabase Supavisor 풀러 URL 사용
// postgres://[user].[project]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProd ? 1 : 5, // 서버리스: 인스턴스당 1연결
  idleTimeoutMillis: 5000,
  allowExitOnIdle: true,
});

export const db = drizzle({ client: pool });
```

```env
# .env.local
# 트랜잭션 모드 풀러 (서버리스용)
DATABASE_URL="postgres://[user].[project]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
# 마이그레이션용 직접 연결
DIRECT_URL="postgres://[user].[project]:[password]@aws-0-ap-northeast-2.supabase.co:5432/postgres"
```

---

## 스트리밍과 Suspense를 활용한 점진적 UI 로딩

```typescript
// app/results/[id]/page.tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default function ResultsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  return (
    <div className="container max-w-md mx-auto px-4 py-6">
      {/* 이미지 먼저 표시 */}
      <Suspense fallback={<ImageSkeleton />}>
        <AnalyzedImage params={params} />
      </Suspense>
      
      {/* AI 분석 결과 스트리밍 */}
      <ErrorBoundary fallback={<AnalysisError />}>
        <Suspense fallback={<AnalysisSkeleton />}>
          <AIAnalysisResults params={params} />
        </Suspense>
      </ErrorBoundary>
      
      {/* 추천 제품 마지막으로 스트리밍 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <ProductRecommendations params={params} />
      </Suspense>
    </div>
  );
}

// 각 섹션은 독립적으로 스트리밍
async function AIAnalysisResults({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const analysis = await getAnalysis(id); // 500ms 소요
  
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold mb-4">AI 피부 분석 결과</h2>
      <AnalysisChart data={analysis.metrics} />
      <AnalysisSummary summary={analysis.summary} />
    </section>
  );
}
```

---

## Lighthouse 90+ 달성 체크리스트

### 배포 전 필수 확인 사항

**LCP 최적화 (목표: ≤2.5초)**
- [ ] 히어로 이미지에 `priority` 및 `fetchPriority="high"` 적용
- [ ] LCP 요소에서 `loading="lazy"` 제거
- [ ] AVIF/WebP 포맷 자동 제공 설정
- [ ] 반응형 `sizes` 속성 정확히 설정
- [ ] TTFB 목표: 한국 Edge 서버에서 600ms 이하

**INP 최적화 (목표: ≤200ms)**
- [ ] 50ms 초과 Long Task 분할
- [ ] 터치 이벤트에 `{ passive: true }` 적용
- [ ] 검색/필터에 디바운스 적용
- [ ] 비필수 서드파티 스크립트 `lazyOnload` 처리
- [ ] Server Components로 클라이언트 JS 최소화

**CLS 최적화 (목표: ≤0.1)**
- [ ] 모든 이미지에 `width`/`height` 또는 `aspect-ratio` 적용
- [ ] 동적 콘텐츠용 공간 예약
- [ ] 폰트에 `font-display: optional` 또는 `swap` 사용
- [ ] 애니메이션에 `transform` 사용 (top/left 대신)

**번들 최적화 (목표: 초기 번들 ≤130KB gzip)**
- [ ] `optimizePackageImports` 설정
- [ ] 무거운 컴포넌트 dynamic import
- [ ] 직접 import 패턴 사용 (Barrel 파일 회피)
- [ ] 번들 분석기로 불필요한 의존성 확인
- [ ] CI/CD에 size-limit 통합

**Edge/서버 최적화**
- [ ] `preferredRegion: 'icn1'` 설정
- [ ] Supabase Supavisor 풀러 사용
- [ ] 적절한 Cache-Control 헤더 설정
- [ ] ISR 또는 PPR로 정적/동적 콘텐츠 분리

---

## 성능 모니터링 도구 설정

### 권장 도구 스택

| 도구 | 용도 | 비용 |
|------|------|------|
| **Vercel Analytics** | RUM, Core Web Vitals | Pro 포함 |
| **Vercel Speed Insights** | Lighthouse 자동화 | Pro 포함 |
| **web-vitals 라이브러리** | 커스텀 RUM | 무료 |
| **@next/bundle-analyzer** | 번들 분석 | 무료 |
| **Lighthouse CI** | CI/CD 통합 | 무료 |

### Vercel Analytics 통합

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 커스텀 성능 대시보드 API

```typescript
// app/api/analytics/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  const metrics = await request.json();
  
  await supabase.from('web_vitals').insert({
    ...metrics,
    user_agent: request.headers.get('user-agent'),
    created_at: new Date().toISOString(),
  });
  
  return new Response('OK', { status: 200 });
}
```

---

## 결론: 이룸 플랫폼 성능 전략

이룸 플랫폼의 **3초 이내 로딩 목표**는 다음 전략의 조합으로 달성 가능합니다:

**즉각적인 성과를 위한 우선순위**:
1. PPR 활성화로 정적 셸 즉시 제공
2. 히어로 이미지 `priority` + AVIF 포맷 적용
3. Server Components로 클라이언트 번들 40-60% 감소
4. Supabase 서울 리전(ap-northeast-2) + Vercel icn1 배치

**중장기 최적화**:
- `use cache` 디렉티브로 세분화된 캐싱 전략 구현
- 번들 크기 모니터링 CI/CD 파이프라인 구축
- RUM 기반 성능 대시보드로 실사용자 경험 추적

Next.js 16과 React 19의 최신 성능 기능들은 모바일 중심 AI 플랫폼에 최적화되어 있으며, 올바른 구성과 패턴 적용을 통해 Lighthouse 90+ 점수와 우수한 Core Web Vitals를 동시에 달성할 수 있습니다.