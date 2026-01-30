# Gemini 코드 출력 프롬프트

> **목적**: 이미지 대신 바로 사용 가능한 코드로 디자인 에셋 생성
> **출력 형식**: SVG 코드, React 컴포넌트, Tailwind CSS

---

## 🎯 마스터 컨텍스트 (코드 출력용)

```
MASTER CONTEXT FOR CODE OUTPUT:

Project: Yiroom (이룸) - Korean AI Beauty App
Tech Stack: Next.js 16, React 19, Tailwind CSS v4, TypeScript

Brand Design Tokens:
- Primary Pink: #F8C8DC / oklch(0.85 0.08 350)
- Primary Pink Light: #FFB6C1 / oklch(0.82 0.10 10)
- Background Dark: #0F0F0F / oklch(0.145 0 0)
- Card Dark: #1A1A1A / oklch(0.205 0 0)
- Text Primary: #FFFFFF
- Text Muted: #9CA3AF

Module Colors (oklch):
- Skin: oklch(0.78 0.10 350) - Pink
- Personal Color: oklch(0.68 0.14 300) - Purple
- Body: oklch(0.72 0.12 250) - Blue
- Hair: oklch(0.78 0.14 55) - Amber
- Nutrition: oklch(0.72 0.12 150) - Green
- Workout: oklch(0.82 0.12 45) - Orange

Output Requirements:
- SVG: Inline, optimized, viewBox included
- React: TypeScript, functional component
- Tailwind: Use existing design tokens from globals.css
- Korean text: UTF-8 encoded
```

---

## 1️⃣ SVG 일러스트레이션 코드

### 1.1 Empty State - 첫 분석
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate SVG code for empty state illustration

Design:
- Abstract face silhouette with AI scan lines
- Pink color (#F8C8DC) line art
- Subtle glow effect
- Size: 200x200 viewBox

OUTPUT FORMAT:
- Raw SVG code only
- Optimized paths (minimal points)
- Include viewBox="0 0 200 200"
- Use stroke instead of fill for line art
- Add subtle gradient for glow effect
- No external dependencies

Example structure:
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs><!-- gradients here --></defs>
  <!-- paths here -->
</svg>
```

### 1.2 Empty State - 기록 없음
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate SVG code for "No History" empty state

Design:
- Calendar or timeline with empty slots
- Pink accent (#F8C8DC)
- Dashed lines for future entries
- Size: 180x180 viewBox

OUTPUT: Raw SVG code only, optimized, viewBox="0 0 180 180"
```

### 1.3 Empty State - 제품 추천 없음
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate SVG code for "No Recommendations" empty state

Design:
- Skincare bottle silhouette with question mark
- Pink line art style (#F8C8DC)
- Friendly, inviting mood
- Size: 200x200 viewBox

OUTPUT: Raw SVG code only
```

### 1.4 Empty State - 네트워크 에러
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate SVG code for network error illustration

Design:
- Cute cloud with disconnected wifi symbol
- Pink color (#F8C8DC) with soft gray accents
- Friendly, not frustrating
- Size: 200x200 viewBox

OUTPUT: Raw SVG code only
```

### 1.5 Empty State - 일반 에러
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate SVG code for general error illustration

Design:
- Abstract geometric "oops" shape
- Pink (#F8C8DC) and gray colors
- Light-hearted mood
- Size: 200x200 viewBox

OUTPUT: Raw SVG code only
```

---

## 2️⃣ React 컴포넌트 코드

### 2.1 EmptyState 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React TypeScript component for EmptyState

Component specs:
- Name: EmptyState
- Props:
  - variant: 'first-analysis' | 'no-history' | 'no-recommendations' | 'empty-wishlist' | 'network-error' | 'general-error'
  - title: string
  - description?: string
  - actionLabel?: string
  - onAction?: () => void
- Includes inline SVG illustrations for each variant
- Uses Tailwind CSS classes
- Dark mode compatible
- Accessible (aria labels)

OUTPUT FORMAT:
\`\`\`tsx
'use client';

import * as React from 'react';
// ... complete component code
\`\`\`

Include:
- TypeScript interfaces
- All SVG illustrations inline
- Tailwind classes matching Yiroom design system
- data-testid attribute
```

### 2.2 모듈 아이콘 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React component for Module Icons

Component specs:
- Name: ModuleIcon
- Props:
  - module: 'skin' | 'personal-color' | 'body' | 'hair' | 'nutrition' | 'workout'
  - size?: 'sm' | 'md' | 'lg' (24/32/48px)
  - className?: string
- SVG icons with gradient fills
- Each module has its own color gradient

OUTPUT: Complete TypeScript React component with inline SVGs

Color mappings:
- skin: Pink gradient (oklch 350°)
- personal-color: Purple gradient (oklch 300°)
- body: Blue gradient (oklch 250°)
- hair: Amber gradient (oklch 55°)
- nutrition: Green gradient (oklch 150°)
- workout: Orange gradient (oklch 45°)
```

### 2.3 업적 뱃지 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React component for Achievement Badges

Component specs:
- Name: AchievementBadge
- Props:
  - type: 'first-analysis' | '7-day-streak' | 'beauty-master' | 'share-king'
  - earned?: boolean (grayscale if not earned)
  - size?: 'sm' | 'md' | 'lg'
  - showLabel?: boolean
- Glossy medal/badge style
- Pink primary with gold accents
- Grayscale filter when not earned

OUTPUT: Complete TypeScript React component
```

### 2.4 분석 진행 애니메이션 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React component for Analysis Loading Animation

Component specs:
- Name: AnalysisLoadingAnimation
- Props:
  - progress?: number (0-100)
  - stage?: 'scanning' | 'analyzing' | 'generating'
  - moduleColor?: string (oklch color)
- Animated scanning line effect
- Pulsing glow
- Stage-specific messaging

OUTPUT: Complete TypeScript React component with CSS animations

Include:
- Keyframe animations (inline or Tailwind)
- Smooth transitions
- Accessible (aria-live for progress updates)
```

---

## 3️⃣ 온보딩 화면 컴포넌트

### 3.1 온보딩 일러스트레이션 세트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate SVG illustrations for 3 onboarding screens

Screen 1 - Welcome:
- Abstract face with AI/data visualization elements
- Pink gradient glow
- Size: 280x280 viewBox

Screen 2 - AI Analysis:
- Face with scanning zones marked
- Analysis points highlighted
- Size: 280x280 viewBox

Screen 3 - Personalization:
- Dashboard preview with cards
- Multiple module icons
- Size: 280x280 viewBox

OUTPUT: Three separate SVG code blocks, optimized
```

### 3.2 온보딩 페이지 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React component for Onboarding Flow

Component specs:
- Name: OnboardingFlow
- Multi-step carousel (3 steps)
- Each step has:
  - Illustration (SVG)
  - Title (Korean)
  - Description (Korean)
- Progress dots at bottom
- Skip button (top right)
- Next/Start button (mint gradient)
- Swipe gesture support hint

Steps content:
1. "당신만의 아름다움을 발견하세요" / "AI가 분석하는 맞춤 뷰티 솔루션"
2. "AI 피부 분석" / "사진 한 장으로 피부 타입, 고민, 솔루션까지"
3. "나만의 맞춤 추천" / "분석 결과 기반 제품, 루틴, 영양까지"

OUTPUT: Complete TypeScript React component with:
- useState for step management
- Inline SVG illustrations
- Tailwind classes
- Framer Motion animations (optional)
```

---

## 4️⃣ 결과 화면 컴포넌트

### 4.1 축하 애니메이션 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React component for Celebration/Confetti animation

Component specs:
- Name: CelebrationOverlay
- Props:
  - isVisible: boolean
  - onComplete?: () => void
  - duration?: number (default 3000ms)
- Confetti particles (mint, white, gold colors)
- Fade in/out
- Performance optimized (requestAnimationFrame)

OUTPUT: Complete TypeScript React component

Include:
- Canvas-based or CSS-based confetti
- Customizable particle count
- Auto-cleanup after duration
```

### 4.2 결과 카드 컴포넌트
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate React component for Analysis Result Card

Component specs:
- Name: AnalysisResultCard
- Props:
  - type: 'skin' | 'personal-color' | 'body'
  - title: string
  - score?: number
  - summary: string
  - highlights: string[]
  - onViewDetails: () => void
  - onShare: () => void
- Module-specific accent color
- Score visualization (circular progress if applicable)
- Share and detail buttons

OUTPUT: Complete TypeScript React component with Tailwind
```

---

## 5️⃣ 통합 디자인 시스템 익스포트

### 5.1 전체 일러스트레이션 번들
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate a single file exporting all SVG illustrations as React components

File: illustrations/index.tsx

Include:
- EmptyStateFirstAnalysis
- EmptyStateNoHistory
- EmptyStateNoRecommendations
- EmptyStateEmptyWishlist
- EmptyStateNetworkError
- EmptyStateGeneralError
- OnboardingWelcome
- OnboardingAnalysis
- OnboardingPersonalization

Each as a typed React functional component with:
- Optional className prop
- Optional size prop (width/height)
- Proper viewBox
- Optimized SVG paths

OUTPUT: Single TypeScript file with all exports
```

### 5.2 아이콘 라이브러리 번들
```
[MASTER CONTEXT FOR CODE OUTPUT]

REQUEST: Generate icon library file

File: icons/index.tsx

Include all module icons and UI icons:
- SkinAnalysisIcon
- PersonalColorIcon
- BodyAnalysisIcon
- HairAnalysisIcon
- NutritionIcon
- WorkoutIcon
- BadgeFirstAnalysis
- BadgeStreakIcon
- BadgeMasterIcon
- BadgeShareIcon

Each icon:
- TypeScript functional component
- Props: size, className, color (optional override)
- Optimized inline SVG
- Accessible (aria-hidden or aria-label)

OUTPUT: Single TypeScript file with all icon exports
```

---

## 📋 사용 방법

### Step 1: Gemini에서 코드 생성
1. 원하는 프롬프트 복사
2. Gemini에 붙여넣기
3. 생성된 코드 복사

### Step 2: 프로젝트에 추가
```
apps/web/components/
├── illustrations/
│   ├── empty-states/
│   │   ├── FirstAnalysis.tsx
│   │   ├── NoHistory.tsx
│   │   └── index.ts
│   ├── onboarding/
│   │   ├── Welcome.tsx
│   │   └── index.ts
│   └── index.ts
├── icons/
│   ├── modules/
│   │   ├── SkinIcon.tsx
│   │   └── index.ts
│   ├── badges/
│   │   └── index.ts
│   └── index.ts
└── primitives/
    └── ... (이미 생성됨)
```

### Step 3: Barrel Export 추가
```typescript
// components/illustrations/index.ts
export * from './empty-states';
export * from './onboarding';
```

---

## 🔧 코드 품질 체크리스트

Gemini 출력 후 확인:

- [ ] TypeScript 에러 없음
- [ ] viewBox 속성 포함
- [ ] oklch 색상 사용 (또는 CSS 변수)
- [ ] Tailwind 클래스 유효
- [ ] 접근성 속성 포함 (aria-*)
- [ ] data-testid 포함
- [ ] 불필요한 코드 제거

---

**Document Version**: 1.0
**Last Updated**: 2026-01-21
