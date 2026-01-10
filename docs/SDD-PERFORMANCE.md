# 성능 최적화 스펙

> Lighthouse 90+ 달성을 위한 웹 성능 최적화

## 1. 개요

### 1.1 목표

- Lighthouse Performance: 90+
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

### 1.2 범위 (충돌 방지)

- 번들 최적화
- 이미지 최적화
- 폰트 최적화
- **기존 컴포넌트 수정 제외** (그룹 B에서 진행)

---

## 2. 최적화 항목

### 2.1 번들 최적화

#### Next.js 설정

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'lodash'],
  },
  modularizeImports: {
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
};

export default withBundleAnalyzer(nextConfig);
```

#### 동적 임포트 검증

```typescript
// 이미 적용된 패턴 확인
// 무거운 컴포넌트들이 dynamic import 되어 있는지 검증

// lib/dynamic-imports.ts
export const HeavyComponents = {
  Chart: dynamic(() => import('@/components/charts/TrendChart')),
  Editor: dynamic(() => import('@/components/editor/RichTextEditor')),
  Map: dynamic(() => import('@/components/maps/LocationMap')),
};
```

### 2.2 이미지 최적화

#### Next/Image 설정

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};
```

#### 정적 이미지 최적화 스크립트

```bash
# scripts/optimize-images.sh
#!/bin/bash

# public/images 폴더의 이미지 최적화
find public/images -name "*.png" -exec pngquant --quality=65-80 --ext .png --force {} \;
find public/images -name "*.jpg" -exec jpegoptim --max=80 {} \;

# WebP 변환
for file in public/images/*.{png,jpg}; do
  cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

### 2.3 폰트 최적화

```typescript
// app/layout.tsx
import { Pretendard } from 'next/font/local';

const pretendard = localFont({
  src: [
    {
      path: '../public/fonts/Pretendard-Regular.subset.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Medium.subset.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Bold.subset.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--font-pretendard',
});
```

#### 폰트 서브셋 생성

```bash
# scripts/subset-fonts.sh
# 한글 + 영문 + 숫자 + 특수문자만 포함
pyftsubset Pretendard-Regular.woff2 \
  --unicodes="U+0020-007E,U+AC00-D7A3,U+1100-11FF" \
  --flavor=woff2 \
  --output-file=Pretendard-Regular.subset.woff2
```

### 2.4 캐싱 전략

```typescript
// middleware.ts (이미 존재하면 수정)
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 정적 자산 캐싱
  if (request.nextUrl.pathname.startsWith('/images/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}
```

---

## 3. 측정 및 모니터링

### 3.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/dashboard
            http://localhost:3000/analysis/skin
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

### 3.2 성능 예산

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "total", "budget": 500 }
    ],
    "resourceCounts": [{ "resourceType": "third-party", "budget": 10 }]
  }
]
```

---

## 4. 파일 구조

```
수정/생성 파일:
├── next.config.ts              # 번들 최적화
├── scripts/
│   ├── optimize-images.sh      # 이미지 최적화
│   └── subset-fonts.sh         # 폰트 서브셋
├── public/fonts/
│   └── *.subset.woff2          # 서브셋 폰트
├── lighthouse-budget.json      # 성능 예산
└── .github/workflows/
    └── lighthouse.yml          # CI
```

---

## 5. 예상 파일 수

- 수정: 2-3개 (next.config.ts, middleware.ts, layout.tsx)
- 신규: 4-5개 (스크립트, 설정 파일)

---

## 6. 검증 체크리스트

- [ ] `npm run build` 번들 사이즈 확인
- [ ] `ANALYZE=true npm run build` 번들 분석
- [ ] Lighthouse 로컬 테스트
- [ ] WebPageTest 외부 테스트
- [ ] Core Web Vitals 통과

---

**작성일**: 2026-01-10
**작성자**: Claude Code
