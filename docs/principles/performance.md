# 성능 최적화 원리

> 이 문서는 웹 성능 최적화의 기반이 되는 기본 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"100점 Core Web Vitals"

- LCP < 2.5s: 최대 콘텐츠 즉시 로드
- FID < 100ms: 사용자 입력 즉시 반응
- CLS < 0.1: 레이아웃 이동 제로
- TTFB < 800ms: 서버 응답 초고속
- 번들 최적화: 코드 스플리팅, 트리쉐이킹 완벽 적용
- 이미지 최적화: WebP/AVIF, 지연 로딩, 반응형
- 캐싱 완벽: 브라우저, CDN, 서버 캐시 계층화
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **네트워크 지연** | 물리적 거리에 따른 RTT 한계 |
| **디바이스 성능** | 저사양 모바일 기기 제약 |
| **번들 최소화** | 기능 유지하면서 크기 축소 한계 |
| **서버 비용** | 고성능 인프라 비용 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **LCP** | < 2.5s (p75) |
| **FID/INP** | < 100ms (p75) |
| **CLS** | < 0.1 (p75) |
| **TTFB** | < 800ms (p75) |
| **Main Bundle** | < 200KB (gzip) |
| **Total Load** | < 500KB (gzip) |
| **Lighthouse Score** | 90+ (Mobile) |

### 현재 목표

**80%** - MVP 성능 최적화

- ✅ Core Web Vitals 목표 설정
- ✅ 성능 예산 정의
- ✅ RAIL 모델 이해
- ✅ Amdahl 법칙 적용
- ✅ Dynamic Import 적용
- ⏳ Lighthouse 90+ 달성 (70%)
- ⏳ 이미지 최적화 완료 (60%)
- ⏳ 번들 예산 준수 (75%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 서비스 워커 PWA | MVP 범위 외 | Phase 3 |
| Edge Computing | 비용, 복잡도 | Phase 4 |
| WebAssembly 최적화 | 사용 사례 제한 | 미정 |

---

## 1. 핵심 개념

### 1.1 Core Web Vitals

Google이 정의한 사용자 경험 핵심 지표:

| 지표 | 측정 대상 | 목표 | 의미 |
|------|----------|------|------|
| **LCP** | Largest Contentful Paint | < 2.5s | 로딩 성능 |
| **FID** | First Input Delay | < 100ms | 상호작용 |
| **CLS** | Cumulative Layout Shift | < 0.1 | 시각적 안정성 |
| **TTFB** | Time to First Byte | < 800ms | 서버 응답 |
| **INP** | Interaction to Next Paint | < 200ms | 응답성 |

### 1.2 성능 예산 (Performance Budget)

```
성능 예산 = 사용자 경험 목표를 달성하기 위한 리소스 제한

예산 초과 = 기능 배포 차단
```

이룸 성능 예산:

| 항목 | 예산 (gzip) |
|------|------------|
| Main bundle | 200KB |
| Vendor bundle | 300KB |
| 개별 페이지 | 50KB |
| 전체 초기 로드 | 500KB |

### 1.3 RAIL 모델

Google의 성능 모델:

```
R - Response: 100ms 이내 응답
A - Animation: 16ms (60fps) 프레임
I - Idle: 50ms 청크로 작업 분할
L - Load: 1000ms 이내 콘텐츠 표시
```

---

## 2. 수학적/물리학적 기반

### 2.1 Amdahl의 법칙

병렬화 가능 부분의 개선 효과:

```
Speedup = 1 / ((1 - P) + P/S)

P = 병렬화 가능 비율
S = 병렬화 속도 향상 배수

예: 80%가 병렬화 가능, 4배 빨라짐
Speedup = 1 / ((1 - 0.8) + 0.8/4) = 2.5배
```

**적용**: 병목 지점 식별 후 최적화

### 2.2 Little의 법칙

```
L = λ × W

L = 시스템 내 평균 요청 수
λ = 요청 도착률
W = 평균 처리 시간

처리 시간 단축 → 동시 처리 요청 감소 → 리소스 효율 증가
```

### 2.3 캐시 적중률과 성능

```
Average Access Time = Hit Rate × Cache Time + Miss Rate × (Cache Time + Main Time)

Hit Rate 90% 가정:
  AAT = 0.9 × 1ms + 0.1 × (1ms + 100ms) = 10.9ms

Hit Rate 99% 가정:
  AAT = 0.99 × 1ms + 0.01 × (1ms + 100ms) = 2.0ms

1% 적중률 향상 = 5배 속도 향상 가능
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

**원리**: 가장 느린 부분이 전체 속도를 결정한다 (Amdahl)

**알고리즘**:

```
1. 병목 측정 (프로파일링)
2. 가장 느린 부분 식별
3. 최적화 적용
4. 측정 반복
```

### 3.2 알고리즘 → 코드

**프론트엔드 최적화**:

```typescript
// 1. 코드 스플리팅 (Dynamic Import)
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    ssr: false,
    loading: () => <Skeleton />,
  }
);

// 2. 이미지 최적화
<Image
  src={imageUrl}
  alt="설명"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL={blurHash}
  priority={isAboveFold}
/>

// 3. 메모이제이션 (비용 큰 계산만)
const sortedProducts = useMemo(() => {
  return products
    .filter(p => p.category === category)
    .sort((a, b) => b.matchRate - a.matchRate);
}, [products, category]);

// 4. 가상화 (20개 이상 리스트)
import { useVirtualizer } from '@tanstack/react-virtual';
```

**백엔드 최적화**:

```typescript
// 1. 필요한 필드만 조회
const { data } = await supabase
  .from('products')
  .select('id, name, price, image_url')  // * 사용 금지
  .eq('category', 'skincare')
  .limit(20);

// 2. N+1 방지 (관계 쿼리)
const { data } = await supabase
  .from('orders')
  .select(`
    id,
    products:order_items(product_id, product:products(name))
  `)
  .eq('user_id', userId);

// 3. 인덱스 활용
// CREATE INDEX idx_products_category ON products(category);
```

---

## 4. 렌더링 전략 원리

### 4.1 Next.js 렌더링 모드

| 모드 | 빌드 시점 | 요청 시점 | 적합 |
|------|----------|----------|------|
| **SSG** | HTML 생성 | 캐시 제공 | 정적 페이지 |
| **SSR** | - | HTML 생성 | 개인화 페이지 |
| **ISR** | HTML 생성 | 재검증 | 준정적 페이지 |
| **CSR** | - | 클라이언트 렌더링 | 대시보드 |

### 4.2 스트리밍 SSR

```tsx
// loading.tsx로 스트리밍 구현
// app/(main)/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}

// Suspense 경계로 점진적 로딩
<Suspense fallback={<ChartSkeleton />}>
  <HeavyChart data={data} />
</Suspense>
```

### 4.3 캐싱 계층

```
┌─────────────────────────────────────────────────────────────┐
│                      캐싱 계층 구조                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   브라우저 캐시 (가장 빠름)                                  │
│       ↓                                                     │
│   CDN 캐시 (Vercel Edge)                                    │
│       ↓                                                     │
│   API 캐시 (React Query / SWR)                              │
│       ↓                                                     │
│   서버 캐시 (Data Cache)                                    │
│       ↓                                                     │
│   데이터베이스 (가장 느림)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 번들 최적화 원리

### 5.1 Tree Shaking

사용하지 않는 코드 제거:

```typescript
// ❌ 나쁜 예: 전체 라이브러리 import
import _ from 'lodash';

// ✅ 좋은 예: 필요한 함수만 import
import debounce from 'lodash/debounce';
```

### 5.2 Code Splitting 전략

```
Route-based: 페이지별 자동 분할
Component-based: dynamic() 수동 분할
Library-based: 대형 라이브러리 분리

분할 기준:
- 초기 로드 불필요한 기능
- 50KB 이상 컴포넌트
- 조건부 렌더링 컴포넌트
```

### 5.3 Import 비용 분석

```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer

# Import 비용 측정 (VSCode 확장)
# "Import Cost" 확장 사용
```

---

## 6. AI 분석 성능 원리

### 6.1 타임아웃 전략

```
AI 응답 시간 분포 (경험적):
  p50: 1.5초
  p90: 2.5초
  p99: 4.0초

타임아웃 설정: 3초 (p90~p95 사이)
  → 대부분 성공하면서 무한 대기 방지
```

### 6.2 Fallback 계층

```typescript
const AI_CONFIG = {
  timeout: 3000,      // 3초
  maxRetries: 2,      // 2회 재시도
  retryDelay: 1000,   // 1초 대기
};

async function analyzeWithFallback<T>(
  analyze: () => Promise<T>,
  generateMock: () => T
): Promise<{ result: T; usedFallback: boolean }> {
  try {
    const result = await Promise.race([
      withRetry(analyze, AI_CONFIG.maxRetries),
      timeout(AI_CONFIG.timeout),
    ]);
    return { result, usedFallback: false };
  } catch {
    return { result: generateMock(), usedFallback: true };
  }
}
```

### 6.3 이미지 전처리

```typescript
// AI 분석 전 이미지 최적화
async function preprocessImage(file: File): Promise<string> {
  const MAX_SIZE = 1024;  // 최대 1024px
  const QUALITY = 0.8;    // 80% 품질

  // 리사이즈 + 압축
  const resized = await resizeImage(file, MAX_SIZE);
  return await compressImage(resized, QUALITY);
}
```

---

## 7. 검증 방법

### 7.1 Core Web Vitals 측정

```typescript
// lib/analytics/web-vitals.ts
import { onCLS, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

export function reportWebVitals() {
  onLCP((metric) => sendToAnalytics('LCP', metric));
  onFID((metric) => sendToAnalytics('FID', metric));
  onCLS((metric) => sendToAnalytics('CLS', metric));
  onTTFB((metric) => sendToAnalytics('TTFB', metric));
  onINP((metric) => sendToAnalytics('INP', metric));
}
```

### 7.2 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: treosh/lighthouse-ci-action@v11
      with:
        urls: |
          https://yiroom.app/
          https://yiroom.app/dashboard
        budgetPath: ./lighthouse-budget.json
```

### 7.3 성능 예산 검증

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "image", "budget": 200 },
      { "resourceType": "total", "budget": 700 }
    ]
  }
]
```

### 7.4 검증 체크리스트

```markdown
## PR 머지 전 성능 체크

- [ ] Lighthouse 점수 90+ 유지
- [ ] 번들 크기 예산 이내
- [ ] LCP < 2.5s
- [ ] FID/INP < 100ms
- [ ] CLS < 0.1
- [ ] API 응답 < 500ms (p95)
```

---

## 8. 성능 안티패턴

### 8.1 피해야 할 패턴

| 안티패턴 | 문제 | 대안 |
|----------|------|------|
| `SELECT *` | 불필요한 데이터 | 필요 필드만 선택 |
| N+1 쿼리 | 쿼리 폭발 | 관계 쿼리 사용 |
| 동기 fetch | 워터폴 | Promise.all |
| 과도한 메모이제이션 | 메모리 낭비 | 비용 큰 계산만 |
| 거대 번들 | 초기 로드 지연 | 코드 스플리팅 |

### 8.2 허용되는 트레이드오프

| 상황 | 성능 비용 | 얻는 가치 |
|------|----------|----------|
| AI 분석 | 3초 대기 | 고품질 결과 |
| 이미지 프리뷰 | 약간의 지연 | UX 개선 |
| 애니메이션 | CPU 사용 | 시각적 피드백 |

---

## 9. 관련 문서

### 규칙
- [performance-guidelines.md](../../.claude/rules/performance-guidelines.md) - 구체적 가이드라인

### ADR
- [ADR-014: 캐싱 전략](../adr/ADR-014-caching-strategy.md)
- [ADR-019: 성능 모니터링 전략](../adr/ADR-019-performance-monitoring.md)

### 스펙
- [SDD-PHASE-K-COMPREHENSIVE-UPGRADE](../specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md)

---

## 10. 참고 자료

- [Web Vitals - Google](https://web.dev/vitals/)
- [RAIL Performance Model](https://web.dev/rail/)
- [Amdahl's Law](https://en.wikipedia.org/wiki/Amdahl%27s_law)
- [Little's Law](https://en.wikipedia.org/wiki/Little%27s_law)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

**Version**: 1.0 | **Created**: 2026-01-21 | **Updated**: 2026-01-21
