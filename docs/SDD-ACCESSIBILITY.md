# 접근성(a11y) 개선 스펙

> WCAG 2.1 AA 준수를 위한 웹 접근성 개선

## 1. 개요

### 1.1 목표

- WCAG 2.1 Level AA 준수
- 키보드 네비게이션 100% 지원
- 스크린 리더 호환성 확보

### 1.2 범위 (충돌 방지)

- **공통 UI 컴포넌트만** (`components/ui/`)
- 기존 페이지/기능 컴포넌트 제외 (그룹 A 완료 후)

---

## 2. 개선 항목

### 2.1 공통 UI 컴포넌트 접근성

#### Button

```typescript
// components/ui/button.tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        {...props}
      />
    );
  }
);
```

#### Dialog

```typescript
// components/ui/dialog.tsx
// 이미 Radix UI 기반으로 접근성 내장
// 추가 확인 사항:
// - DialogDescription 필수 (VisuallyHidden 가능)
// - 포커스 트랩 동작 확인
// - ESC 키로 닫기 확인

<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <VisuallyHidden asChild>
        <DialogDescription>설명</DialogDescription>
      </VisuallyHidden>
    </DialogHeader>
    {/* ... */}
  </DialogContent>
</Dialog>
```

#### Tabs

```typescript
// components/ui/tabs.tsx
// Radix Tabs 접근성 검증
// - aria-selected 상태
// - 키보드 화살표 네비게이션
// - 포커스 관리

<Tabs defaultValue="tab1">
  <TabsList aria-label="분석 결과 탭">
    <TabsTrigger value="tab1">개요</TabsTrigger>
    <TabsTrigger value="tab2">상세</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">...</TabsContent>
</Tabs>
```

#### Input/Form

```typescript
// components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, 'aria-describedby': ariaDescribedby, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(...)}
        ref={ref}
        id={id}
        aria-describedby={ariaDescribedby}
        {...props}
      />
    );
  }
);

// 사용 예시
<div>
  <Label htmlFor="email">이메일</Label>
  <Input id="email" aria-describedby="email-hint" />
  <p id="email-hint" className="text-sm text-muted-foreground">
    알림을 받을 이메일을 입력하세요
  </p>
</div>
```

### 2.2 이미지 대체 텍스트

```typescript
// 체크리스트: 모든 이미지에 alt 속성 확인
// 장식용 이미지: alt=""
// 정보 이미지: 의미 있는 설명

// 검색 스크립트
// grep -r "<img" --include="*.tsx" | grep -v "alt="
```

### 2.3 색상 대비

```css
/* globals.css 또는 tailwind.config.ts */
/* WCAG AA 기준: 4.5:1 (일반 텍스트), 3:1 (큰 텍스트) */

:root {
  /* 기존 색상 대비 검증 */
  --foreground: 222.2 84% 4.9%; /* 배경 대비 확인 */
  --muted-foreground: 215.4 16.3% 46.9%; /* 최소 4.5:1 확보 */
}
```

### 2.4 포커스 표시

```css
/* globals.css */
/* 키보드 포커스 시 명확한 표시 */

:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* 마우스 클릭 시 outline 제거 */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 2.5 Skip Link

```typescript
// components/common/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md"
    >
      본문으로 건너뛰기
    </a>
  );
}

// app/layout.tsx에 추가
<body>
  <SkipLink />
  <header>...</header>
  <main id="main-content">...</main>
</body>
```

### 2.6 ARIA 랜드마크

```typescript
// app/layout.tsx 구조 확인
<body>
  <header role="banner">
    <nav role="navigation" aria-label="주 메뉴">...</nav>
  </header>
  <main role="main" id="main-content">...</main>
  <footer role="contentinfo">...</footer>
</body>
```

---

## 3. 테스트 도구

### 3.1 자동화 테스트

```typescript
// tests/a11y/accessibility.test.ts
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('접근성', () => {
  test('Button 컴포넌트', async () => {
    const { container } = render(<Button>클릭</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Dialog 컴포넌트', async () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>제목</DialogTitle>
          <DialogDescription>설명</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 3.2 수동 테스트 체크리스트

- [ ] 키보드만으로 모든 기능 사용 가능
- [ ] Tab 순서가 논리적
- [ ] 포커스 표시 명확
- [ ] 스크린 리더로 정보 전달 확인 (VoiceOver/NVDA)
- [ ] 색상만으로 정보 전달하지 않음
- [ ] 200% 확대 시 레이아웃 유지

---

## 4. 파일 구조

```
수정/생성 파일:
├── components/ui/
│   ├── button.tsx         # aria 속성 추가
│   ├── dialog.tsx         # Description 검증
│   ├── tabs.tsx           # aria-label 추가
│   └── input.tsx          # aria-describedby 추가
├── components/common/
│   └── SkipLink.tsx       # 신규
├── app/layout.tsx         # 랜드마크, SkipLink
├── globals.css            # 포커스 스타일
└── tests/a11y/
    └── accessibility.test.ts  # axe 테스트
```

---

## 5. 예상 파일 수

- 수정: 6-8개 (UI 컴포넌트)
- 신규: 2-3개 (SkipLink, 테스트)

---

## 6. WCAG 2.1 AA 체크리스트

### 인지 가능 (Perceivable)

- [ ] 1.1.1 비텍스트 콘텐츠 - alt 텍스트
- [ ] 1.3.1 정보와 관계 - 시맨틱 마크업
- [ ] 1.4.3 대비(최소) - 4.5:1 비율
- [ ] 1.4.4 텍스트 크기 조정 - 200% 확대

### 운용 가능 (Operable)

- [ ] 2.1.1 키보드 - 모든 기능 키보드 접근
- [ ] 2.1.2 키보드 트랩 없음
- [ ] 2.4.1 블록 건너뛰기 - Skip Link
- [ ] 2.4.3 포커스 순서
- [ ] 2.4.7 포커스 표시

### 이해 가능 (Understandable)

- [ ] 3.1.1 페이지 언어 - lang="ko"
- [ ] 3.2.1 포커스 시 - 예측 가능한 동작
- [ ] 3.3.1 오류 식별 - 폼 오류 메시지
- [ ] 3.3.2 레이블 또는 지시문

### 견고함 (Robust)

- [ ] 4.1.1 구문 분석 - 유효한 HTML
- [ ] 4.1.2 이름, 역할, 값 - ARIA 속성

---

**작성일**: 2026-01-10
**작성자**: Claude Code
