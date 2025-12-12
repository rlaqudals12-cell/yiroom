# Phase A-0 + A-1 구현 계획 ✅ 완료

> **목표**: 색상 토큰 적용 + Lite PWA 설정
> **작성일**: 2025-12-04
> **완료일**: 2025-12-04

---

## 현재 상태 분석

### 1. 색상 시스템 (globals.css)
- **현재**: oklch 색상 포맷 (shadcn/ui 표준)
- **Primary**: `oklch(0.205 0 0)` (검정색 계열)
- **Background**: `oklch(1 0 0)` (흰색)

### 2. 폰트 (layout.tsx)
- **현재**: Geist Sans / Geist Mono
- **Stitch**: Inter + Noto Sans

### 3. PWA
- **현재**: 설정 없음
- **manifest.ts**: 없음
- **next-pwa**: 미설치

---

## 구현 계획

### A-0: 디자인 토큰 적용

#### Step 1: 색상 변환 (Stitch hex → oklch)

| Stitch (hex) | 용도 | oklch 변환값 |
|-------------|------|-------------|
| `#2e5afa` | Primary (파란색) | `oklch(0.53 0.23 262)` |
| `#f8f9fc` | Background | `oklch(0.98 0.005 270)` |
| `#0d101c` | Text Primary | `oklch(0.15 0.02 270)` |
| `#475a9e` | Text Secondary | `oklch(0.48 0.12 270)` |
| `#e6e9f4` | Secondary | `oklch(0.93 0.02 270)` |
| `#ced4e9` | Border | `oklch(0.87 0.03 270)` |

#### Step 2: globals.css 수정

```css
:root {
  /* 기존 oklch 값을 Stitch 톤으로 변경 */
  --primary: oklch(0.53 0.23 262);           /* #2e5afa 파란색 */
  --primary-foreground: oklch(0.98 0.005 270); /* 흰색 */
  --background: oklch(0.98 0.005 270);       /* #f8f9fc */
  --foreground: oklch(0.15 0.02 270);        /* #0d101c */
  --secondary: oklch(0.93 0.02 270);         /* #e6e9f4 */
  --border: oklch(0.87 0.03 270);            /* #ced4e9 */
  --muted-foreground: oklch(0.48 0.12 270);  /* #475a9e */
}
```

#### Step 3: 폰트 결정

**권장**: Geist 유지
- 이유: 이미 잘 동작 중, Inter와 유사한 산세리프
- 변경 시 영향 범위가 큼

**대안 (선택사항)**: Inter 추가
```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```

---

### A-1: Lite PWA 설정

#### Step 1: 패키지 설치

```bash
npm install @ducanh2912/next-pwa
```

#### Step 2: app/manifest.ts 생성

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '이룸 - 온전한 나는?',
    short_name: '이룸',
    description: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f9fc',
    theme_color: '#2e5afa',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
```

#### Step 3: next.config.ts 수정

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // 오프라인 미지원 (Lite PWA)
  fallbacks: false,
  cacheOnFrontEndNav: false,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "img.youtube.com" },
      { hostname: "i.ytimg.com" },
      { hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withPWA(nextConfig);
```

#### Step 4: .gitignore 업데이트

```gitignore
# PWA 생성 파일
public/sw.js
public/workbox-*.js
public/sw.js.map
public/workbox-*.js.map
```

---

## 작업 순서

```
1. globals.css 색상 토큰 수정
2. npm install @ducanh2912/next-pwa
3. app/manifest.ts 생성
4. next.config.ts PWA 래핑 추가
5. .gitignore 업데이트
6. npm run build (빌드 테스트)
7. npm run dev로 PWA 설치 테스트
```

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `app/globals.css` | 색상 변수 수정 (6개 변수) |
| `app/manifest.ts` | 새로 생성 |
| `next.config.ts` | withPWA 래핑 추가 |
| `.gitignore` | PWA 캐시 파일 추가 |
| `package.json` | @ducanh2912/next-pwa 추가 (자동) |

---

## 검증 항목

- [x] `npm run typecheck` 통과 ✅
- [x] `npm run build --webpack` 성공 ✅
- [ ] 브라우저에서 색상 변경 확인 (dev 서버에서 확인 필요)
- [ ] Chrome DevTools > Application > Manifest 확인
- [ ] 모바일에서 "홈 화면에 추가" 테스트

---

## 롤백 계획

문제 발생 시:
1. `git checkout app/globals.css` (색상 원복)
2. `npm uninstall @ducanh2912/next-pwa` (PWA 제거)
3. `git checkout next.config.ts` (설정 원복)

---

---

## 추가 수정 사항 (빌드 에러 해결)

구현 중 발견된 기존 코드 이슈 수정:

### 1. Client/Server 모듈 분리
- **문제**: Client Component에서 Server-only 모듈 import
- **해결**: Server Actions 파일 생성

| 파일 | 작업 |
|------|------|
| `app/(main)/workout/actions.ts` | getLatestWorkoutAnalysisAction, getWorkoutStreakAction |
| `app/(main)/workout/session/actions.ts` | saveWorkoutLogAction, getWorkoutStreakAction |
| `app/(main)/workout/page.tsx` | Server Actions 사용으로 변경 |
| `app/(main)/workout/session/page.tsx` | Server Actions 사용으로 변경 |

### 2. 테스트 파일 수정
- `tests/lib/product-recommendations.test.ts`: SkinType import 경로 수정

### 3. Next.js 16 Turbopack 호환
- `next.config.ts`에 `turbopack: {}` 추가 (빈 설정)
