# 성능 가이드라인

> Core Web Vitals 및 이룸 성능 최적화 규칙

## 성능 목표 (SLA)

### Core Web Vitals

| 지표     | 목표    | 경고    | 심각    |
| -------- | ------- | ------- | ------- |
| **LCP**  | < 2.5s  | > 3s    | > 4s    |
| **FID**  | < 100ms | > 150ms | > 300ms |
| **CLS**  | < 0.1   | > 0.15  | > 0.25  |
| **TTFB** | < 800ms | > 1s    | > 2s    |

### API 응답 시간

| 엔드포인트    | 목표 (p95) | 타임아웃 |
| ------------- | ---------- | -------- |
| 일반 API      | < 500ms    | 2s       |
| AI 분석       | < 3s       | 10s      |
| 이미지 업로드 | < 2s       | 30s      |
| DB 쿼리       | < 100ms    | 1s       |

### 번들 크기

| 청크           | 최대 크기 (gzip) |
| -------------- | ---------------- |
| Main bundle    | 200KB            |
| Vendor bundle  | 300KB            |
| 개별 페이지    | 50KB             |
| 전체 초기 로드 | 500KB            |

## 프론트엔드 최적화

### Dynamic Import (코드 스플리팅)

```typescript
// 무거운 컴포넌트는 dynamic import 필수
import dynamic from 'next/dynamic';

// 차트
export const ChartDynamic = dynamic(
  () => import('./Chart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// 모달
export const ModalDynamic = dynamic(
  () => import('./Modal').then(mod => ({ default: mod.Modal })),
  { ssr: false }
);

// 무거운 라이브러리
const HeavyLibrary = dynamic(() => import('heavy-library'), {
  ssr: false,
});
```

### 이미지 최적화

```tsx
import Image from 'next/image';

// next/image 사용 필수 (자동 최적화)
<Image
  src={imageUrl}
  alt="설명"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL={blurHash}
  priority={isAboveFold}  // 첫 화면에 보이면 true
/>

// 반응형 이미지
<Image
  src={imageUrl}
  alt="설명"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover' }}
/>
```

### 메모이제이션

```typescript
// 비용이 큰 계산만 useMemo
const sortedProducts = useMemo(() => {
  return products.filter((p) => p.category === category).sort((a, b) => b.matchRate - a.matchRate);
}, [products, category]);

// 자식에 전달하는 콜백은 useCallback
const handleClick = useCallback(
  (id: string) => {
    router.push(`/product/${id}`);
  },
  [router]
);

// 주의: 과도한 메모이제이션은 오히려 성능 저하
// - 간단한 계산은 메모이제이션 불필요
// - 의존성이 자주 바뀌면 효과 없음
```

### 리스트 가상화

```tsx
// 20개 이상 아이템은 가상화 필수
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 백엔드 최적화

### 데이터베이스 쿼리

```typescript
// 좋은 예: 필요한 필드만 선택
const { data } = await supabase
  .from('products')
  .select('id, name, price, image_url')
  .eq('category', 'skincare')
  .limit(20);

// 나쁜 예: 전체 선택
const { data } = await supabase.from('products').select('*'); // 불필요한 데이터 포함

// 관계 쿼리 최적화
const { data } = await supabase
  .from('orders')
  .select(
    `
    id,
    created_at,
    products:order_items(
      product_id,
      quantity,
      product:products(name, price)
    )
  `
  )
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### 인덱스 가이드

```sql
-- 자주 사용하는 WHERE 절에 인덱스
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- 복합 인덱스: 순서 중요 (선택도 높은 컬럼 먼저)
CREATE INDEX idx_reviews_product_rating
  ON product_reviews(product_id, rating DESC);
```

### 캐싱 전략

```typescript
// React Query 캐싱
const { data } = useQuery({
  queryKey: ['products', category],
  queryFn: () => fetchProducts(category),
  staleTime: 5 * 60 * 1000, // 5분간 fresh
  gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
});

// 서버 응답 캐싱
export async function GET(request: Request) {
  const data = await fetchData();

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
```

## AI 분석 최적화

### 타임아웃 및 재시도

```typescript
const AI_CONFIG = {
  timeout: 3000, // 3초 타임아웃
  maxRetries: 2, // 최대 2회 재시도
  retryDelay: 1000, // 재시도 간격
};

async function analyzeWithTimeout<T>(analyzeFn: () => Promise<T>, fallbackFn: () => T): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

  try {
    const result = await analyzeFn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[AI] Analysis failed, using fallback');
    return fallbackFn();
  }
}
```

### 이미지 전처리

```typescript
// 업로드 전 이미지 최적화
async function preprocessImage(file: File): Promise<string> {
  const MAX_SIZE = 1024; // 최대 1024px
  const QUALITY = 0.8; // 80% 품질

  const img = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));

  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', QUALITY);
}
```

## 모니터링

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: treosh/lighthouse-ci-action@v11
      with:
        urls: |
          https://yiroom.app/
          https://yiroom.app/dashboard
        budgetPath: ./lighthouse-budget.json
```

### 성능 예산

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "image", "budget": 200 },
      { "resourceType": "total", "budget": 700 }
    ],
    "resourceCounts": [
      { "resourceType": "script", "budget": 20 },
      { "resourceType": "image", "budget": 30 }
    ]
  }
]
```

### Web Vitals 추적

```typescript
// lib/analytics/web-vitals.ts
import { onCLS, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

export function reportWebVitals() {
  onCLS((metric) => sendToAnalytics('CLS', metric));
  onFID((metric) => sendToAnalytics('FID', metric));
  onLCP((metric) => sendToAnalytics('LCP', metric));
  onTTFB((metric) => sendToAnalytics('TTFB', metric));
  onINP((metric) => sendToAnalytics('INP', metric));
}

function sendToAnalytics(name: string, metric: Metric) {
  // Vercel Analytics 또는 Sentry로 전송
  console.log(`[Vitals] ${name}:`, metric.value, metric.rating);
}
```

## 체크리스트

### PR 머지 전

- [ ] 새 dynamic import 적용 (무거운 컴포넌트)
- [ ] next/image 사용 (이미지)
- [ ] DB 쿼리에 .limit() 적용
- [ ] 리스트 20개 이상 시 가상화

### 배포 전

- [ ] Lighthouse 점수 90+ 유지
- [ ] 번들 크기 증가 확인
- [ ] 느린 API 엔드포인트 없음

---

**Version**: 1.0 | **Updated**: 2026-01-15
