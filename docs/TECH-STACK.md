# 💻 기술 스택 v4.1

**버전**: v4.1
**업데이트**: 2025년 12월 4일
**기준일**: 2025년 12월 4일 최신 버전 반영

---

## 📊 기술 스택 요약

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| **Framework** | Next.js | 16.0.4 | 2025.10.21 출시 |
| **UI Library** | React | 19.2 | React Canary |
| **Language** | TypeScript | 5.3+ | Strict Mode |
| **Styling** | Tailwind CSS | v4 | oklch 색상 포맷 |
| **Components** | shadcn/ui | Latest | Radix 기반 |
| **Database** | Supabase | PostgreSQL 15+ | - |
| **Auth** | Clerk | 5.7+ | 무료 10,000 MAU |
| **AI** | Gemini 3 Pro | Latest | Google AI |
| **State** | Zustand | 5.0 | 전역 상태 |
| **Data Fetching** | TanStack Query | 5.59 | 서버 상태 |
| **Bundler** | Turbopack | Built-in | Next.js 16 기본 |

---

## 🚀 Next.js 16.0.4 (2025.10.21 출시)

### 주요 특징
```yaml
핵심 변화:
  - Turbopack 기본 번들러 (5-10x 빠른 Fast Refresh)
  - Cache Components 도입
  - React 19.2 지원
  - React Compiler 내장 (자동 메모이제이션)

성능 개선:
  - 개발 서버 시작: 2-5x 빠름
  - 빌드 속도: 2-5x 빠름
  - Hot Reload: 5-10x 빠름

새 기능:
  - use cache 디렉티브
  - Partial Pre-Rendering (PPR)
  - Build Adapters API (alpha)
  - 개선된 캐싱 API (updateTag, refresh)
```

### Breaking Changes 대응
```typescript
// ❌ 이전 방식 (Next.js 15-)
export default function Page({ params, searchParams }) {
  console.log(params.id)
}

// ✅ 새로운 방식 (Next.js 16+)
export default async function Page({ params, searchParams }) {
  const { id } = await params
  const query = await searchParams
}
```

### next.config.ts
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack 기본 활성화 (설정 불필요)
  
  // React Compiler 활성화 (선택)
  reactCompiler: true,
  
  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  // 환경 변수
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default nextConfig
```

---

## ⚛️ React 19.2

### 주요 특징
```yaml
새 기능:
  - View Transitions API
  - useEffectEvent() Hook
  - <Activity /> 컴포넌트
  - 개선된 Suspense

React Compiler:
  - 자동 메모이제이션
  - useMemo/useCallback 수동 작성 불필요
  - 성능 자동 최적화
```

### 사용 예시
```typescript
// React Compiler가 자동 최적화
// useMemo/useCallback 불필요

function ProductList({ products }: { products: Product[] }) {
  // 자동으로 메모이제이션됨
  const sortedProducts = products.sort((a, b) => a.price - b.price)
  
  // 자동으로 메모이제이션됨
  const handleClick = (id: string) => {
    console.log('Clicked:', id)
  }
  
  return (
    <ul>
      {sortedProducts.map(product => (
        <li key={product.id} onClick={() => handleClick(product.id)}>
          {product.name}
        </li>
      ))}
    </ul>
  )
}
```

---

## 🗄️ Supabase (PostgreSQL 15+)

### 설정
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          } catch {}
        },
      },
    }
  )
}
```

### 환경 변수
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔐 Clerk (Auth)

### 설정
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### 환경 변수
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### 사용자 정보 조회
```typescript
// Server Component
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = auth()
  const user = await currentUser()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return <div>Hello {user?.firstName}</div>
}

// Client Component
'use client'
import { useUser } from '@clerk/nextjs'

export function UserProfile() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) return <div>Loading...</div>
  
  return <div>Hello {user?.firstName}</div>
}
```

---

## 🤖 Gemini 3 Pro (AI)

### 설정
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-3-pro-vision',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
})

// 이미지 분석 함수
export async function analyzeImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const result = await geminiModel.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    },
    prompt,
  ])
  
  return result.response.text()
}
```

### 환경 변수
```bash
# .env.local
GEMINI_API_KEY=AIza...
```

### 사용 예시 (피부 분석)
```typescript
// lib/gemini/skin-analysis.ts
import { analyzeImage } from '@/lib/gemini'

const SKIN_ANALYSIS_PROMPT = `
이 얼굴 사진을 분석하여 다음 피부 지표를 0-100 점수로 평가해주세요:

1. 수분도 (hydration)
2. 유분도 (oil_level)
3. 모공 상태 (pores)
4. 색소침착 (pigmentation)
5. 주름 (wrinkles)
6. 민감도 (sensitivity)

JSON 형식으로 응답해주세요:
{
  "skin_type": "dry|oily|combination|sensitive|normal",
  "hydration": number,
  "oil_level": number,
  "pores": number,
  "pigmentation": number,
  "wrinkles": number,
  "sensitivity": number,
  "overall_score": number,
  "recommendations": string[]
}
`

export async function analyzeSkin(imageBase64: string) {
  const result = await analyzeImage(imageBase64, SKIN_ANALYSIS_PROMPT)
  return JSON.parse(result)
}
```

---

## 📦 package.json

```json
{
  "name": "yiroom",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.0.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@clerk/nextjs": "^5.7.0",
    "@google/generative-ai": "^0.21.0",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

---

## 🛠️ 개발 환경 설정

### 프로젝트 생성
```bash
# Next.js 16 프로젝트 생성
npx create-next-app@latest yiroom --typescript --tailwind --app

# 의존성 설치
cd yiroom
npm install @supabase/ssr @supabase/supabase-js @clerk/nextjs
npm install @google/generative-ai @tanstack/react-query zustand
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui 초기화
npx shadcn@latest init

# 필수 컴포넌트 추가
npx shadcn@latest add button card input
```

### TypeScript 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 📊 예산 계획

```yaml
Phase 1 비용:
  AI (Gemini 3 Pro):
    베타 테스트: 150회 (50명 × 3모듈)
    개발 테스트: 150회
    총: 300회
    
    비용 계산:
      Input: 106K tokens × 300 × $2.00/1M = $63.60
      Output: 30K tokens × 300 × $12.00/1M = $108.00
      환율: $171.60 × ₩1,300 = ₩4,458
  
  Auth (Clerk):
    무료 티어: 10,000 MAU
    비용: ₩0
  
  Database (Supabase):
    무료 티어: 500MB, 50,000 rows
    비용: ₩0
  
  코딩 (Claude Code Max):
    이미 사용 중
    비용: ₩0
  
  베타 테스트:
    기프티콘: 40명 × ₩5,000 = ₩200,000
    1:1 인터뷰: 10명 × ₩5,000 = ₩50,000
    소계: ₩250,000

Phase 1 총: ₩254,458
```

---

## ✅ 설정 체크리스트

```yaml
환경 설정:
  □ Node.js 20+ 설치
  □ npm/yarn/pnpm 설치
  □ Git 설정

프로젝트 설정:
  □ Next.js 16 프로젝트 생성
  □ TypeScript 설정
  □ Tailwind CSS 설정
  □ shadcn/ui 초기화

외부 서비스:
  □ Supabase 프로젝트 생성
  □ Clerk 앱 생성
  □ Gemini API 키 발급

환경 변수:
  □ .env.local 파일 생성
  □ Supabase URL/Key
  □ Clerk Keys
  □ Gemini API Key

코드 품질:
  □ ESLint 설정
  □ TypeScript strict mode
  □ Prettier 설정 (선택)
```

---

**버전**: v4.1
**최종 업데이트**: 2025년 12월 4일
**상태**: Phase 2 완료 ✅

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v4.1 | 2025-12-04 | Tailwind CSS v4 (oklch), Inter + Noto Sans KR 폰트 |
| v4.0 | 2025-11-25 | 초기 통합완전판 |
