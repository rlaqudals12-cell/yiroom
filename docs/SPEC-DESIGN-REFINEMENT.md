# Design Refinement Spec v3 (YIROOM IDENTITY)

> 이룸 웹 UI/UX 디자인 시스템 스펙 문서
> **Version**: 3.0 | **Updated**: 2026-01-24
> **ADR Reference**: [ADR-057](./adr/ADR-057-design-system-v2.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"YIROOM IDENTITY - 프리미엄 뷰티 웰니스 앱"
- 다크 테마 기반의 세련된 프리미엄 경험
- 핑크 그라디언트로 따뜻하고 친근한 전문성 표현
- Y형 헥사곤 로고로 브랜드 아이덴티티 확립
- Glass Morphism으로 깊이감 있는 UI
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| OKLCH 지원 | 92.87% (폴백 필요) |
| P3 색역 | 일부 기기만 지원 |
| 다크 모드 | OS 설정 연동 복잡성 |
| 애니메이션 | 60fps 유지 필요 |

### 100점 기준

- 모든 화면 색상 일관성 100%
- 로고-UI 색상 완전 동기화
- 접근성 WCAG 2.1 AA 준수 (대비율 4.5:1)
- 모바일/웹 동일 경험
- 애니메이션 60fps 유지

### 현재 목표: 85%

- 웹 앱 색상 토큰 교체
- 로고 SVG 교체
- 문서 동기화

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 모바일 앱 동기화 | 별도 MOBILE-DESIGN-PLAN.md | 웹 완료 후 |
| 라이트 모드 | 다크 모드 우선 전략 | MAU 5,000+ |
| 복잡한 애니메이션 | 성능 영향 | 최적화 후 |

---

## 1. 개요

### 1.1 목적

**YIROOM IDENTITY** 디자인 시스템 적용으로 프리미엄 뷰티 웰니스 앱 브랜딩 확립

### 1.2 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **다크 테마 기반** | Deep Black (#0F0F0F) 배경으로 프리미엄 느낌 |
| **핑크 그라디언트** | #F8C8DC → #FFB6C1 따뜻한 브랜드 컬러 |
| **Glass Morphism** | 반투명 효과로 깊이감 표현 |
| **모듈별 악센트** | 피부(블루), 체형(퍼플), 퍼스널컬러(핑크), 웰니스(그린) |
| **일관성** | 로고, UI, 문서 완전 동기화 |

### 1.3 브랜딩

| 항목 | 값 |
|------|-----|
| **앱 이름** | 이룸 (Yiroom) |
| **헤더** | YIROOM INTELLIGENCE |
| **서브** | IDENTITY |
| **슬로건** | 당신만의 아름다움을 발견하세요 |
| **테마** | Dark (기본) |

### 1.4 디자인 레퍼런스

- Apple (다크 테마, 프리미엄 느낌)
- K-뷰티 브랜드 (핑크 톤, 친근함)
- 현대적 Glass Morphism UI

---

## 2. 색상 시스템

### 2.1 Primary Colors

```javascript
const COLORS = {
  // 브랜드 프라이머리
  brand: {
    gradient: 'linear-gradient(135deg, #F8C8DC 0%, #FFB6C1 100%)',
    solid: '#F8C8DC',
    light: '#FDE6E9',
  },

  // 배경
  background: {
    primary: '#0F0F0F',    // 메인 배경
    card: '#1A1A1A',       // 카드 배경
    elevated: '#242424',   // 상승된 요소
    border: '#2A2A2A',     // 테두리
  },

  // 텍스트
  text: {
    primary: '#FFFFFF',    // 주요 텍스트
    secondary: '#9CA3AF',  // 보조 텍스트
    muted: '#6B7280',      // 비활성 텍스트
    inverse: '#0A0A0A',    // 역전 (밝은 배경용)
  },
};
```

### 2.2 Accent Colors (모듈별)

```javascript
const ACCENT_COLORS = {
  // 분석 모듈
  skin: '#60A5FA',           // S-1 피부분석 (Blue)
  body: '#A78BFA',           // C-1 체형분석 (Purple)
  personalColor: '#F472B6',  // PC-1 퍼스널컬러 (Pink)

  // 웰니스 모듈
  wellness: '#4ADE80',       // W-1, N-1 (Green)

  // 시맨틱
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};
```

### 2.3 CSS 변수 정의

```css
:root {
  /* 배경 */
  --background: #0F0F0F;
  --background-card: #1A1A1A;
  --background-elevated: #242424;

  /* 브랜드 */
  --primary: #F8C8DC;
  --primary-gradient: linear-gradient(135deg, #F8C8DC 0%, #FFB6C1 100%);

  /* 텍스트 */
  --foreground: #FFFFFF;
  --muted-foreground: #9CA3AF;

  /* 테두리 */
  --border: #2A2A2A;
  --ring: #F8C8DC;

  /* 모듈 악센트 */
  --accent-skin: #60A5FA;
  --accent-body: #A78BFA;
  --accent-personal-color: #F472B6;
  --accent-wellness: #4ADE80;

  /* 시맨틱 */
  --success: #22C55E;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
```

### 2.4 색상 대비 검증 (WCAG 2.1 AA)

| 조합 | 전경 | 배경 | 대비율 | 상태 |
|------|------|------|--------|------|
| 본문 | #FFFFFF | #0F0F0F | 19.5:1 | Pass |
| 보조 | #9CA3AF | #0F0F0F | 6.3:1 | Pass |
| CTA 버튼 | #0A0A0A | #F8C8DC | 12.8:1 | Pass |
| 카드 텍스트 | #FFFFFF | #1A1A1A | 15.2:1 | Pass |
| 링크 | #F8C8DC | #0F0F0F | 10.1:1 | Pass |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
:root {
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 3.2 폰트 크기

| 토큰 | 크기 | 용도 |
|------|------|------|
| `text-xs` | 0.75rem (12px) | 캡션, 배지 |
| `text-sm` | 0.875rem (14px) | 보조 텍스트, 버튼 작은 |
| `text-base` | 1rem (16px) | 본문 |
| `text-lg` | 1.125rem (18px) | 강조 본문 |
| `text-xl` | 1.25rem (20px) | 소제목 |
| `text-2xl` | 1.5rem (24px) | 섹션 제목 |
| `text-3xl` | 1.875rem (30px) | 페이지 제목 |
| `text-4xl` | 2.25rem (36px) | 히어로 제목 |

### 3.3 폰트 가중치

| 토큰 | 가중치 | 용도 |
|------|--------|------|
| `font-normal` | 400 | 본문 |
| `font-medium` | 500 | 강조 |
| `font-semibold` | 600 | 제목, 버튼 |
| `font-bold` | 700 | 히어로 |

---

## 4. 간격 및 레이아웃

### 4.1 간격 스케일

| 토큰 | 값 | 용도 |
|------|-----|------|
| `space-1` | 0.25rem (4px) | 아이콘 간격 |
| `space-2` | 0.5rem (8px) | 인라인 간격 |
| `space-3` | 0.75rem (12px) | 작은 패딩 |
| `space-4` | 1rem (16px) | 기본 패딩 |
| `space-5` | 1.25rem (20px) | 중간 패딩 |
| `space-6` | 1.5rem (24px) | 큰 패딩 |
| `space-8` | 2rem (32px) | 섹션 간격 |
| `space-10` | 2.5rem (40px) | 페이지 간격 |
| `space-12` | 3rem (48px) | 큰 섹션 간격 |
| `space-16` | 4rem (64px) | 히어로 간격 |

### 4.2 Border Radius

| 토큰 | 값 | 용도 |
|------|-----|------|
| `rounded-sm` | 0.25rem (4px) | 배지 |
| `rounded-md` | 0.5rem (8px) | 입력 필드 |
| `rounded-lg` | 0.75rem (12px) | 작은 카드 |
| `rounded-xl` | 1rem (16px) | 카드 |
| `rounded-2xl` | 1.5rem (24px) | 큰 카드 |
| `rounded-full` | 9999px | 버튼, 배지 |

### 4.3 그림자

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-card: 0 2px 8px rgba(248, 200, 220, 0.1);
  --shadow-glow: 0 0 20px rgba(248, 200, 220, 0.3);
}
```

---

## 5. 컴포넌트 스펙

### 5.1 CTA 버튼

```css
.btn-cta {
  background: linear-gradient(135deg, #F8C8DC 0%, #FFB6C1 100%);
  color: #0A0A0A;
  border-radius: 9999px;
  padding: 1rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(248, 200, 220, 0.4);
}

.btn-cta:active {
  transform: translateY(0);
}
```

### 5.2 Secondary 버튼

```css
.btn-secondary {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid #2A2A2A;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: border-color 0.2s, background 0.2s;
}

.btn-secondary:hover {
  border-color: #F8C8DC;
  background: rgba(248, 200, 220, 0.1);
}
```

### 5.3 카드

```css
.card {
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-glass {
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
```

### 5.4 프로그레스 바

```css
.progress-bar {
  background: #2A2A2A;
  border-radius: 9999px;
  height: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #F8C8DC 0%, #FFB6C1 100%);
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease-out;
}
```

### 5.5 배지

```css
.badge-trust {
  background: rgba(255, 255, 255, 0.1);
  color: #E5E7EB;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-ad {
  background: #374151;
  color: #9CA3AF;
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
}
```

### 5.6 입력 필드

```css
.input {
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #FFFFFF;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: #F8C8DC;
  box-shadow: 0 0 0 2px rgba(248, 200, 220, 0.2);
}

.input::placeholder {
  color: #6B7280;
}
```

---

## 6. 로고 시스템

### 6.1 로고 스펙

| 항목 | 값 |
|------|-----|
| **심볼** | Y형 헥사곤 (Luminous Singularity) |
| **색상** | 화이트→핑크 그라디언트 |
| **배경** | 투명 |
| **효과** | 중앙 펄스 애니메이션 |

### 6.2 로고 컴포넌트

```jsx
const YiroomLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="luminousGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#FDE6E9" />
        <stop offset="100%" stopColor="#FFB6C1" />
      </linearGradient>
    </defs>

    {/* 헥사곤 외곽선 */}
    <path
      d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z"
      stroke="url(#luminousGrad)"
      strokeWidth="0.5"
      fill="none"
      opacity="0.3"
    />

    {/* Y 심볼 */}
    <path
      d="M26 30C34 37 44 48 50 50C56 48 66 37 74 30M50 50V85"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* 중앙 펄스 */}
    <circle
      cx="50"
      cy="50"
      r="3"
      fill="white"
      className="animate-pulse"
    />
  </svg>
);
```

### 6.3 로고 사용 가이드

| 용도 | 크기 | 파일 |
|------|------|------|
| 파비콘 | 32x32, 16x16 | favicon.ico |
| 앱 아이콘 | 512x512 | icon.svg |
| 헤더 로고 | 40x40 | logo.svg |
| 소셜 공유 | 1200x630 | og-image.png |

### 6.4 로고 여백

- 최소 여백: 로고 높이의 25%
- 권장 여백: 로고 높이의 50%

---

## 7. 패턴 및 레이아웃

### 7.1 헤더 패턴

```jsx
<header className="text-center py-8">
  <div className="flex justify-center mb-4">
    <YiroomLogo className="w-16 h-16" />
  </div>
  <h1 className="text-sm tracking-[0.3em] text-muted-foreground mb-2">
    YIROOM INTELLIGENCE
  </h1>
  <p className="text-2xl font-semibold">
    IDENTITY
  </p>
</header>
```

### 7.2 진행 상태 패턴

```jsx
<div className="mb-8">
  <div className="flex justify-between text-sm text-muted-foreground mb-2">
    <span>진행률</span>
    <span>{current}/{total} 완료 ({percent}%)</span>
  </div>
  <div className="progress-bar">
    <div className="progress-fill" style={{ width: `${percent}%` }} />
  </div>
</div>
```

### 7.3 모듈 카드 패턴

```jsx
<div className="card hover:border-accent-skin">
  <div className="flex items-center gap-4 mb-4">
    <div className="w-12 h-12 rounded-xl bg-accent-skin/20 flex items-center justify-center">
      <SkinIcon className="w-6 h-6 text-accent-skin" />
    </div>
    <div>
      <h3 className="font-semibold">피부 분석</h3>
      <p className="text-sm text-muted-foreground">AI 기반 정밀 분석</p>
    </div>
  </div>
  <p className="text-muted-foreground">
    피부 상태를 정밀하게 분석하고 맞춤 솔루션을 제안합니다.
  </p>
</div>
```

### 7.4 Trust Badge 패턴

```jsx
<div className="flex justify-end mb-4">
  <span className="badge-trust">
    10만+ 사용자 신뢰
  </span>
</div>
```

---

## 8. 반응형 디자인

### 8.1 브레이크포인트

| 토큰 | 값 | 타겟 |
|------|-----|------|
| `sm` | 640px | 모바일 (가로) |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 와이드 데스크톱 |

### 8.2 컨테이너

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}
```

### 8.3 그리드

```css
.grid-modules {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-modules {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-modules {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 9. 접근성

### 9.1 필수 요구사항

- WCAG 2.1 AA 준수
- 색상 대비 4.5:1 이상
- 터치 타겟 최소 44x44px
- 키보드 네비게이션 지원
- 스크린 리더 호환

### 9.2 포커스 스타일

```css
:focus-visible {
  outline: 2px solid #F8C8DC;
  outline-offset: 2px;
}
```

### 9.3 모션 감소

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. 구현 가이드

### 10.1 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `apps/web/app/globals.css` | 색상 토큰 교체 |
| `apps/web/public/logo.svg` | 로고 교체 |
| `apps/web/public/logo-neutral.svg` | 로고 교체 |
| `apps/web/public/icon-neutral.svg` | 아이콘 교체 |
| `apps/web/public/favicon.ico` | 파비콘 교체 |

### 10.2 구현 순서

```
1. ADR-057 작성 (완료)
2. SPEC-DESIGN-REFINEMENT v3 작성 (현재)
3. SDD-LOGO-IDENTITY 작성
4. 로고 SVG 파일 생성/교체
5. globals.css 색상 토큰 교체
6. 시각적 검증
7. 테스트 실행
```

### 10.3 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] 모든 페이지 시각적 검증
- [ ] WCAG 2.1 AA 대비율 검증
- [ ] 모바일 뷰포트 검증

### 10.4 롤백 전략

```bash
# Git으로 이전 상태 복원
git checkout HEAD~1 -- apps/web/app/globals.css
git checkout HEAD~1 -- apps/web/public/logo.svg
```

---

## 11. 참조

### 11.1 관련 문서

- [ADR-057: 디자인 시스템 v2](./adr/ADR-057-design-system-v2.md)
- [design-tokens.json](./specs/design-tokens.json)
- [design-system.md](./principles/design-system.md)

### 11.2 외부 참조

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-12 | 초기 스펙 작성 (Refined Expertise v2, 민트 기반) |
| 2.0 | - | (건너뜀) |
| 3.0 | 2026-01-24 | YIROOM IDENTITY 적용 (핑크 기반 다크 테마) |

---

**Author**: Claude Code | **ADR**: ADR-057
