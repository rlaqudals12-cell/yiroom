# QA-3-R1: 웹 성능 최적화 종합 리서치

> 조사일: 2026-01-16
> 출처: Google Web.dev, Next.js 공식 문서, Vercel 성능 가이드, Chrome DevTools 문서

---

## 1. 핵심 요약

- **Core Web Vitals 2024 업데이트**: FID가 **INP(Interaction to Next Paint)**로 대체되어 전체 페이지 상호작용 반응성을 측정하며, LCP < 2.5초, INP < 200ms, CLS < 0.1이 "Good" 기준입니다.
- **Next.js 15/16 성능 혁신**: React Server Components(RSC), Partial Prerendering(PPR), Turbopack 기반 빌드로 초기 JS 번들 최대 90% 감소 가능하며, `next/image` v3의 AVIF 자동 변환과 Blur Placeholder가 LCP를 획기적으로 개선합니다.
- **번들 최적화 3대 원칙**: Tree Shaking 완전 활용(사이드 이펙트 없는 모듈), Dynamic Import로 코드 스플리팅(특히 차트/에디터/지도), 의존성 최적화(lodash-es, date-fns 대신 dayjs)로 초기 번들 200KB 이하 달성이 목표입니다.
- **이미지 최적화 필수 전략**: WebP/AVIF 자동 변환, `sizes` 속성으로 반응형 최적화, Above-the-fold 이미지에 `priority` 속성, Blur Placeholder로 CLS 방지가 핵심입니다.
- **레이지 로딩 황금률**: Viewport 진입 200-300px 전 로드 시작, Intersection Observer API 활용, 스켈레톤 UI로 CLS 0 유지, Critical Path에는 레이지 로딩 금지입니다.

---

## 2. 상세 내용

### 2.1 Core Web Vitals (2024-2026 기준)

#### 지표별 상세 기준

| 지표 | Good | Needs Improvement | Poor | 측정 대상 |
|------|------|-------------------|------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s | 가장 큰 콘텐츠 요소 렌더링 |
| **INP** (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms | 모든 상호작용의 지연 시간 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 | 예상치 못한 레이아웃 이동 |
| **TTFB** (Time to First Byte) | < 800ms | 800ms - 1.8s | > 1.8s | 서버 응답 시작 시간 |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8s - 3s | > 3s | 첫 콘텐츠 렌더링 |

#### FID에서 INP로의 전환 (2024년 3월)

FID(First Input Delay)는 첫 번째 상호작용만 측정했지만, **INP**는 페이지 전체 수명 동안의 모든 클릭, 탭, 키보드 입력을 측정합니다. INP는 가장 긴 상호작용 중 상위 몇 개의 p75 값을 사용하므로 더 현실적인 사용자 경험을 반영합니다.

**INP 개선 핵심 전략**:
- Long Task 분할 (50ms 이상 작업을 `scheduler.yield()` 또는 `requestIdleCallback`으로 분할)
- 이벤트 핸들러 최적화 (불필요한 리렌더링 방지)
- Third-party 스크립트 지연 로딩 (defer, async 속성 활용)
- React 18/19 `useTransition`, `useDeferredValue` 활용

#### LCP 최적화 상세

LCP 요소로 측정되는 대상:
- `<img>` 요소
- `<svg>` 내부의 `<image>`
- CSS `background-image`가 있는 요소
- `<video>` 포스터 이미지
- 텍스트 노드를 포함하는 블록 레벨 요소

**LCP 개선 체크리스트**:
```
1. 서버 응답 시간 최적화 (TTFB < 800ms)
2. 렌더 차단 리소스 제거 (CSS/JS)
3. 리소스 로드 시간 단축 (CDN, 압축, 캐싱)
4. 클라이언트 사이드 렌더링 최소화
```

#### CLS 발생 주요 원인 및 해결

| 원인 | 해결책 |
|------|--------|
| 크기 미지정 이미지/비디오 | `width`, `height` 속성 명시 또는 `aspect-ratio` CSS |
| 동적 삽입 콘텐츠 | 공간 예약 (스켈레톤), `min-height` 설정 |
| 웹폰트 FOUT/FOIT | `font-display: swap` + 폰트 프리로드 |
| 광고/임베드 | 컨테이너에 고정 크기 지정 |

---

### 2.2 Next.js 최적화 (v15/16)

#### App Router 성능 특성

Next.js 15/16의 App Router는 기본적으로 **React Server Components(RSC)**를 사용하여 서버에서 렌더링된 HTML을 스트리밍합니다. 이는 클라이언트로 전송되는 JavaScript 양을 대폭 줄입니다.

**RSC 성능 이점**:
- 컴포넌트 단위 서버 렌더링으로 초기 번들 크기 감소
- 서버에서만 실행되는 코드는 클라이언트 번들에 포함되지 않음
- 데이터 페칭 워터폴 제거 (병렬 실행)
- Streaming SSR로 TTFB 개선

```typescript
// Server Component (기본값) - JS 번들에 포함 안 됨
async function ProductList() {
  const products = await db.products.findMany(); // 서버에서만 실행
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

// Client Component - 필요한 경우에만 'use client'
'use client';
function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  // 상호작용 로직
}
```

#### Partial Prerendering (PPR)

Next.js 15의 실험적 기능으로, 정적 콘텐츠는 빌드 시 생성하고 동적 부분은 스트리밍합니다.

```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
};

// 페이지에서 Suspense로 동적 부분 감싸기
export default function Page() {
  return (
    <main>
      <StaticHeader />  {/* 빌드 시 생성 */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />  {/* 스트리밍 */}
      </Suspense>
    </main>
  );
}
```

#### Turbopack 빌드 최적화

Next.js 15부터 안정화된 Turbopack은 Webpack 대비 최대 10배 빠른 빌드 속도를 제공합니다.

```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build"
  }
}
```

---

### 2.3 Lighthouse 개선

#### Lighthouse 점수 구성 (v12 기준)

| 카테고리 | 핵심 지표 |
|----------|----------|
| **Performance** | LCP(25%), TBT(30%), CLS(25%), FCP(10%), SI(10%) |
| **Accessibility** | 색상 대비, ARIA, 키보드 탐색 |
| **Best Practices** | HTTPS, 콘솔 오류, 취약점 |
| **SEO** | 메타 태그, robots.txt, 모바일 최적화 |

#### 90점 이상 달성 체크리스트

```markdown
Performance (목표: 90+)
- [ ] LCP 요소에 preload 적용
- [ ] 사용하지 않는 CSS/JS 제거
- [ ] 이미지 최적화 (WebP/AVIF)
- [ ] Third-party 스크립트 지연 로딩
- [ ] 폰트 최적화 (font-display: swap, preload)

Accessibility (목표: 100)
- [ ] 모든 이미지에 alt 속성
- [ ] 색상 대비 4.5:1 이상
- [ ] 포커스 표시자 명확
- [ ] ARIA 레이블 완전

Best Practices (목표: 100)
- [ ] HTTPS 사용
- [ ] 콘솔 오류 0
- [ ] 취약한 라이브러리 없음

SEO (목표: 100)
- [ ] 메타 description 존재
- [ ] 구조화된 데이터 (JSON-LD)
- [ ] 모바일 뷰포트 설정
```

---

### 2.4 이미지 최적화

#### next/image v3 사용

```typescript
import Image from 'next/image';

// 기본 사용 (자동 최적화)
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority  // LCP 요소에 필수
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// 반응형 이미지 (fill 모드)
<div className="relative h-[400px]">
  <Image
    src="/product.jpg"
    alt="Product"
    fill
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

#### next.config.js 이미지 설정

```javascript
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    minimumCacheTTL: 86400,
  },
};
```

#### WebP vs AVIF 비교

| 형식 | 압축률 | 브라우저 지원 | 권장 용도 |
|------|--------|--------------|----------|
| JPEG | 기준 | 100% | Fallback |
| WebP | 25-35% 감소 | 97%+ | 범용 |
| AVIF | 50% 감소 | 92%+ | 대형 이미지 |

---

### 2.5 번들 최적화

#### 번들 분석

```bash
ANALYZE=true npm run build
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({});
```

#### 의존성 최적화 권장

| 무거운 패키지 | 경량 대안 | 크기 감소 |
|--------------|----------|----------|
| `moment` (300KB) | `dayjs` (2KB) | 99% |
| `lodash` (70KB) | `lodash-es` + Tree Shaking | 80%+ |
| `axios` (45KB) | `fetch` (네이티브) | 100% |
| `uuid` (9KB) | `crypto.randomUUID()` | 100% |

#### Dynamic Import 패턴

```typescript
import dynamic from 'next/dynamic';

export const Chart = dynamic(
  () => import('./Chart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

---

### 2.6 레이지 로딩

#### Intersection Observer 기반

```typescript
export function useLazyLoad<T extends HTMLElement>({
  rootMargin = '200px',
  threshold = 0,
  triggerOnce = true,
} = {}) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) observer.unobserve(element);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, triggerOnce]);

  return { ref, isInView };
}
```

---

## 3. 현재 vs 권장

| 항목 | 현재 (이룸) | 권장 | 조치 |
|------|------------|------|------|
| Core Web Vitals 목표 | LCP < 2.5s, FID < 100ms | LCP < 2.5s, INP < 200ms | FID→INP 전환 |
| 번들 크기 (Main) | 200KB 목표 | 150KB 이하 | 검토 필요 |
| 이미지 형식 | WebP 지원 | AVIF 우선, WebP 폴백 | AVIF 추가 |
| Dynamic Import | 적용됨 | 유지 | 유지 |
| Lighthouse CI | 미설정 | 90+ 점수 게이트 | 추가 필요 |

---

## 4. 구현 시 필수 사항

- [ ] next.config.js에 AVIF 형식 추가 (`formats: ['image/avif', 'image/webp']`)
- [ ] LCP 요소(Hero 이미지, 메인 타이틀)에 `priority` 속성 확인
- [ ] Lighthouse CI GitHub Action 추가
- [ ] 성능 예산 파일 (`lighthouse-budget.json`) 생성
- [ ] INP 측정을 위한 web-vitals 업데이트 (`onINP` 추가)
- [ ] 번들 분석 스크립트 추가 (`ANALYZE=true npm run build`)

---

## 5. 코드 예시

### Web Vitals 추적 (INP 포함)

```typescript
// lib/analytics/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  const report = {
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${report.name}: ${report.value} (${report.rating})`);
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);  // FID 대체
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

---

## 6. 참고 자료

| 출처 | URL | 핵심 내용 |
|------|-----|----------|
| Google Web.dev | https://web.dev/articles/vitals | Core Web Vitals 정의 |
| Next.js Docs | https://nextjs.org/docs/app/building-your-application/optimizing | 최적화 가이드 |
| web-vitals npm | https://github.com/GoogleChrome/web-vitals | Web Vitals 라이브러리 |
| Lighthouse CI | https://github.com/GoogleChrome/lighthouse-ci | CI/CD 통합 가이드 |

---

**Version**: 1.0 | **Created**: 2026-01-16
