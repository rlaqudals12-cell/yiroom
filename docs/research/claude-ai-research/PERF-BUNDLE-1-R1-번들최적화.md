# 번들 최적화

> **ID**: PERF-BUNDLE
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// 현재 구현
✅ next/dynamic 일부 사용
✅ 이미지 최적화 (next/image)
✅ 폰트 최적화 (next/font)

// 개선 필요 항목
❌ Bundle Analyzer 설정
❌ 대용량 라이브러리 최적화
❌ Tree Shaking 검증
❌ Code Splitting 전략
❌ 번들 크기 예산
```

---

## 2. Bundle Analyzer 설정

### 2.1 설치 및 설정

```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기존 설정
};

module.exports = withBundleAnalyzer(nextConfig);
```

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "analyze:server": "ANALYZE=true BUNDLE_ANALYZE=server npm run build",
    "analyze:client": "ANALYZE=true BUNDLE_ANALYZE=browser npm run build"
  }
}
```

### 2.2 분석 실행

```bash
# 전체 분석
npm run analyze

# 결과: .next/analyze/ 폴더에 HTML 리포트 생성
```

---

## 3. Tree Shaking 최적화

### 3.1 패키지 임포트 최적화

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',      // 아이콘
      'date-fns',          // 날짜
      'lodash',            // 유틸리티
      '@radix-ui/react-*', // UI 컴포넌트
      'recharts',          // 차트
    ],
  },
};
```

### 3.2 올바른 임포트 패턴

```typescript
// ❌ 전체 라이브러리 임포트 (번들 크기 증가)
import _ from 'lodash';
import * as Icons from 'lucide-react';

// ✅ 필요한 함수/컴포넌트만 임포트
import { debounce, throttle } from 'lodash';
import { Home, User, Settings } from 'lucide-react';

// ❌ date-fns 전체 임포트
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// ✅ 서브패스 임포트 (더 효율적)
import format from 'date-fns/format';
import ko from 'date-fns/locale/ko';
```

### 3.3 Side Effects 명시

```json
// package.json (라이브러리 작성 시)
{
  "sideEffects": false
}

// 또는 특정 파일만 side effects 있음
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

---

## 4. Code Splitting

### 4.1 Dynamic Import

```typescript
// components/HeavyComponent.tsx
import dynamic from 'next/dynamic';

// 클라이언트 전용 + 로딩 UI
const HeavyChart = dynamic(
  () => import('@/components/charts/AnalysisChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

// 모달/다이얼로그 (필요할 때만 로드)
const ConfirmModal = dynamic(
  () => import('@/components/modals/ConfirmModal'),
  { ssr: false }
);

// 조건부 로딩
const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  { ssr: false }
);

export function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      <HeavyChart data={data} />
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### 4.2 라우트 기반 분할

```typescript
// Next.js App Router는 자동으로 라우트별 분할
// 추가 최적화: 페이지 내 무거운 컴포넌트 분리

// app/analysis/skin/page.tsx
import dynamic from 'next/dynamic';

// 결과 섹션은 lazy load
const AnalysisResult = dynamic(
  () => import('@/components/analysis/SkinAnalysisResult'),
  { loading: () => <ResultSkeleton /> }
);

// 추천 제품은 더 나중에 로드
const ProductRecommendations = dynamic(
  () => import('@/components/products/Recommendations'),
  { loading: () => <ProductsSkeleton /> }
);
```

### 4.3 React.lazy + Suspense

```typescript
// 클라이언트 컴포넌트에서
'use client';

import { lazy, Suspense } from 'react';

const HeavyFeature = lazy(() => import('./HeavyFeature'));

export function Feature() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyFeature />
    </Suspense>
  );
}
```

---

## 5. 대용량 라이브러리 최적화

### 5.1 라이브러리 대체

| 기존 | 크기 | 대체 | 크기 | 절감 |
|------|------|------|------|------|
| moment.js | ~300KB | date-fns | ~30KB | 90% |
| lodash | ~70KB | lodash-es (필요한 것만) | ~5KB | 93% |
| chart.js | ~200KB | recharts (필요한 것만) | ~50KB | 75% |

### 5.2 Lodash 최적화

```typescript
// ❌ 전체 lodash
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ 개별 함수 임포트
import debounce from 'lodash/debounce';
debounce(fn, 300);

// 또는 lodash-es 사용
import { debounce } from 'lodash-es';
```

### 5.3 Date 라이브러리 최적화

```typescript
// ❌ moment.js (deprecated, 큼)
import moment from 'moment';
moment().format('YYYY-MM-DD');

// ✅ date-fns (작고 tree-shakeable)
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');

// 또는 네이티브 Intl API
new Intl.DateTimeFormat('ko-KR').format(new Date());
```

### 5.4 아이콘 최적화

```typescript
// ❌ 전체 아이콘 세트
import * as Icons from 'lucide-react';

// ✅ 필요한 아이콘만
import { Home, User, Settings, ChevronRight } from 'lucide-react';

// 아이콘 배럴 파일 (프로젝트 내)
// components/icons/index.ts
export { Home, User, Settings, ChevronRight } from 'lucide-react';

// 사용
import { Home, User } from '@/components/icons';
```

---

## 6. Webpack 설정

### 6.1 splitChunks 커스터마이징

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // 기본 vendor 청크
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // UI 라이브러리 분리
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            name: 'ui-vendors',
            priority: 20,
          },
          // 차트 라이브러리 분리
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'chart-vendors',
            priority: 20,
          },
          // 공통 모듈
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
          },
        },
      };
    }
    return config;
  },
};
```

### 6.2 외부 모듈 제외

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 서버 전용 모듈 클라이언트 번들에서 제외
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};
```

---

## 7. 번들 크기 예산

### 7.1 크기 제한 설정

```json
// bundlewatch.config.json
{
  "files": [
    {
      "path": ".next/static/chunks/main-*.js",
      "maxSize": "100KB"
    },
    {
      "path": ".next/static/chunks/framework-*.js",
      "maxSize": "150KB"
    },
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "maxSize": "50KB"
    },
    {
      "path": ".next/static/css/**/*.css",
      "maxSize": "30KB"
    }
  ],
  "ci": {
    "trackBranches": ["main", "develop"],
    "repoBranchBase": "main"
  }
}
```

### 7.2 CI 통합

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size

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
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Check Bundle Size
        run: npx bundlewatch --config bundlewatch.config.json
        env:
          BUNDLEWATCH_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CI_COMMIT_SHA: ${{ github.event.pull_request.head.sha }}
```

### 7.3 Size Limit

```json
// package.json
{
  "size-limit": [
    {
      "path": ".next/static/chunks/main-*.js",
      "limit": "100 KB"
    },
    {
      "path": ".next/static/chunks/pages/index-*.js",
      "limit": "30 KB"
    }
  ],
  "scripts": {
    "size": "size-limit",
    "size:why": "size-limit --why"
  }
}
```

---

## 8. 이미지 최적화

### 8.1 next/image 설정

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
  },
};
```

### 8.2 이미지 사용 패턴

```typescript
import Image from 'next/image';

// LCP 이미지에 priority
<Image
  src="/hero.webp"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL={blurHash}
/>

// 반응형 이미지
<Image
  src="/product.webp"
  alt="Product"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover' }}
/>
```

---

## 9. 폰트 최적화

### 9.1 next/font 설정

```typescript
// app/layout.tsx
import { Noto_Sans_KR } from 'next/font/google';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-noto-sans-kr',
});

export default function RootLayout({ children }) {
  return (
    <html className={notoSansKR.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### 9.2 로컬 폰트

```typescript
import localFont from 'next/font/local';

const pretendard = localFont({
  src: [
    {
      path: '../fonts/Pretendard-Regular.woff2',
      weight: '400',
    },
    {
      path: '../fonts/Pretendard-Medium.woff2',
      weight: '500',
    },
    {
      path: '../fonts/Pretendard-Bold.woff2',
      weight: '700',
    },
  ],
  display: 'swap',
  variable: '--font-pretendard',
});
```

---

## 10. 모니터링

### 10.1 번들 크기 추적

```typescript
// scripts/report-bundle-size.js
const fs = require('fs');
const path = require('path');

function getBundleSizes() {
  const buildDir = path.join(process.cwd(), '.next/static/chunks');
  const files = fs.readdirSync(buildDir);

  const sizes = files
    .filter(f => f.endsWith('.js'))
    .map(f => ({
      name: f,
      size: fs.statSync(path.join(buildDir, f)).size,
    }))
    .sort((a, b) => b.size - a.size);

  console.table(sizes.slice(0, 10).map(s => ({
    file: s.name,
    size: `${(s.size / 1024).toFixed(2)} KB`,
  })));
}

getBundleSizes();
```

---

## 11. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Bundle Analyzer 설정
- [ ] optimizePackageImports 설정
- [ ] lodash/date-fns 임포트 최적화

### 단기 적용 (P1)

- [ ] Dynamic Import 확대
- [ ] 번들 크기 예산 설정
- [ ] CI 번들 체크

### 장기 적용 (P2)

- [ ] splitChunks 커스터마이징
- [ ] 지속적 모니터링
- [ ] 라이브러리 대체 검토

---

## 12. 참고 자료

- [Next.js Package Bundling](https://nextjs.org/docs/app/guides/package-bundling)
- [Bundle Analyzer Guide](http://www.catchmetrics.io/blog/reducing-nextjs-bundle-size-with-nextjs-bundle-analyzer)
- [Tree-Shaking Guide](https://deepwiki.com/vercel/next.js/2.4-tree-shaking-and-code-optimization)
- [JavaScript Bundle Optimization](https://medium.com/@jajibhee/the-complete-guide-to-javascript-bundle-optimization-code-splitting-and-tree-shaking-7ddbdcbd7957)

---

**Version**: 1.0 | **Priority**: P0 Critical
