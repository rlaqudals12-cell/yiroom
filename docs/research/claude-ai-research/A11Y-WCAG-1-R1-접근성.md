# 웹 접근성 (WCAG 2.2)

> **ID**: A11Y-WCAG
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// 현재 구현
✅ 기본 시맨틱 HTML
✅ ESLint jsx-a11y 플러그인
✅ Radix UI (접근성 내장)

// 개선 필요 항목
❌ WCAG 2.2 AA 준수 검증
❌ 키보드 네비게이션 완성
❌ 스크린 리더 테스트
❌ 색상 대비 검증
❌ 포커스 관리
```

---

## 2. WCAG 2.2 개요

### 2.1 핵심 원칙 (POUR)

| 원칙 | 설명 | 이룸 적용 |
|------|------|----------|
| **Perceivable** | 인지 가능 | 대체 텍스트, 색상 대비 |
| **Operable** | 조작 가능 | 키보드 접근, 충분한 시간 |
| **Understandable** | 이해 가능 | 명확한 레이블, 일관성 |
| **Robust** | 견고함 | 보조 기술 호환 |

### 2.2 WCAG 2.2 신규 기준 (9개)

| 기준 | 레벨 | 설명 |
|------|------|------|
| Focus Not Obscured (Min) | AA | 포커스 가려지면 안 됨 |
| Focus Not Obscured (Enhanced) | AAA | 포커스 완전히 보여야 함 |
| Focus Appearance | AA | 포커스 표시 명확 |
| Dragging Movements | AA | 드래그 대체 제공 |
| Target Size (Minimum) | AA | 최소 24×24px |
| Consistent Help | A | 도움말 일관된 위치 |
| Redundant Entry | A | 중복 입력 최소화 |
| Accessible Authentication | AA | 인지 테스트 대체 |
| Accessible Authentication (Enhanced) | AAA | 인증 부담 최소화 |

---

## 3. 시맨틱 HTML

### 3.1 올바른 구조

```tsx
// ❌ 비시맨틱
<div className="header">
  <div className="nav">
    <div onClick={handleClick}>메뉴</div>
  </div>
</div>

// ✅ 시맨틱
<header>
  <nav aria-label="메인 메뉴">
    <button onClick={handleClick}>메뉴</button>
  </nav>
</header>
```

### 3.2 헤딩 계층

```tsx
// ✅ 올바른 헤딩 계층
<main>
  <h1>피부 분석 결과</h1>

  <section>
    <h2>피부 타입</h2>
    <p>복합성 피부입니다.</p>

    <h3>T존</h3>
    <p>유분이 많습니다.</p>

    <h3>U존</h3>
    <p>건조합니다.</p>
  </section>

  <section>
    <h2>추천 제품</h2>
    {/* ... */}
  </section>
</main>
```

### 3.3 랜드마크 영역

```tsx
// 완전한 페이지 구조
<>
  <a href="#main-content" className="skip-link">
    본문으로 건너뛰기
  </a>

  <header role="banner">
    <nav role="navigation" aria-label="메인">
      {/* 메인 네비게이션 */}
    </nav>
  </header>

  <main id="main-content" role="main">
    {/* 주요 콘텐츠 */}
  </main>

  <aside role="complementary">
    {/* 보조 콘텐츠 */}
  </aside>

  <footer role="contentinfo">
    {/* 푸터 */}
  </footer>
</>
```

---

## 4. 키보드 접근성

### 4.1 포커스 관리

```tsx
// components/ui/focus-trap.tsx
'use client';

import { useEffect, useRef } from 'react';

export function FocusTrap({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
```

### 4.2 포커스 표시

```css
/* globals.css */

/* 기본 포커스 스타일 */
:focus-visible {
  outline: 2px solid var(--focus-color, #2563eb);
  outline-offset: 2px;
}

/* 포커스 스타일 제거하지 않기 */
/* ❌ *:focus { outline: none; } */

/* 버튼/링크 포커스 */
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 입력 필드 포커스 */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 0;
  border-color: var(--focus-color);
}

/* 스킵 링크 */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  padding: 1rem;
  background: var(--background);
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 4.3 키보드 네비게이션

```tsx
// 커스텀 컴포넌트 키보드 지원
export function TabList({ tabs, activeTab, onChange }) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex: number;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    onChange(tabs[newIndex].id);
  };

  return (
    <div role="tablist" aria-label="분석 결과 탭">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 5. ARIA 패턴

### 5.1 필수 ARIA 속성

```tsx
// 이미지
<Image
  src={url}
  alt="봄 웜톤 퍼스널컬러 팔레트 - 코랄, 피치, 아이보리 계열"
  // 장식용 이미지는 alt=""
/>

// 버튼
<button
  aria-label="분석 시작"
  aria-disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? <Spinner /> : '분석하기'}
</button>

// 링크
<a
  href="/dashboard"
  aria-current={isCurrentPage ? 'page' : undefined}
>
  대시보드
</a>

// 입력
<input
  id="email"
  type="email"
  aria-label="이메일 주소"
  aria-describedby="email-hint email-error"
  aria-invalid={hasError}
  aria-required
/>
<span id="email-hint">example@email.com 형식</span>
<span id="email-error" role="alert">{errorMessage}</span>
```

### 5.2 Live Region

```tsx
// 동적 콘텐츠 알림
export function AnalysisStatus({ status }: { status: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {status}
    </div>
  );
}

// 에러 알림
export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}

// 로딩 상태
export function LoadingIndicator({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading ? '분석 중입니다...' : '분석 완료'}
    </div>
  );
}
```

### 5.3 모달/다이얼로그

```tsx
// 접근성 준수 모달
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-content">
          <h2 id={titleId}>{title}</h2>

          {children}

          <button
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </div>
    </FocusTrap>
  );
}
```

---

## 6. 색상 및 대비

### 6.1 대비율 기준

| 텍스트 크기 | AA 기준 | AAA 기준 |
|------------|---------|---------|
| 일반 텍스트 | 4.5:1 | 7:1 |
| 큰 텍스트 (18pt+) | 3:1 | 4.5:1 |
| UI 컴포넌트 | 3:1 | - |

### 6.2 색상 시스템

```css
/* 접근성 준수 색상 팔레트 */
:root {
  /* 텍스트 */
  --text-primary: #1a1a1a;       /* 배경 대비 12:1 */
  --text-secondary: #525252;     /* 배경 대비 7:1 */
  --text-muted: #737373;         /* 배경 대비 4.5:1 */

  /* 배경 */
  --background: #ffffff;
  --background-muted: #f5f5f5;

  /* 액센트 */
  --primary: #2563eb;            /* 흰색 배경 대비 4.5:1 */
  --primary-foreground: #ffffff;

  /* 상태 */
  --success: #059669;            /* 대비 4.5:1 */
  --warning: #d97706;            /* 대비 4.5:1 */
  --error: #dc2626;              /* 대비 4.5:1 */

  /* 포커스 */
  --focus-color: #2563eb;
}

/* 다크 모드 */
.dark {
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --background: #0a0a0a;
  /* ... */
}
```

### 6.3 색상만으로 정보 전달 금지

```tsx
// ❌ 색상만으로 상태 표시
<span style={{ color: status === 'error' ? 'red' : 'green' }}>
  {status}
</span>

// ✅ 색상 + 아이콘/텍스트
<span className={cn(
  status === 'error' ? 'text-red-600' : 'text-green-600'
)}>
  {status === 'error' ? '❌ 오류' : '✓ 성공'}
</span>
```

---

## 7. 폼 접근성

### 7.1 레이블 연결

```tsx
// ✅ 명시적 레이블
<div>
  <label htmlFor="skin-type">피부 타입</label>
  <select id="skin-type" name="skinType">
    <option value="">선택하세요</option>
    <option value="dry">건성</option>
    <option value="oily">지성</option>
  </select>
</div>

// 그룹 레이블
<fieldset>
  <legend>알림 설정</legend>
  <div>
    <input type="checkbox" id="email-notify" />
    <label htmlFor="email-notify">이메일 알림</label>
  </div>
  <div>
    <input type="checkbox" id="push-notify" />
    <label htmlFor="push-notify">푸시 알림</label>
  </div>
</fieldset>
```

### 7.2 에러 처리

```tsx
// 접근성 준수 폼 에러
export function FormField({
  label,
  error,
  hint,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>

      {hint && <span id={hintId}>{hint}</span>}

      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': [
          hint && hintId,
          error && errorId,
        ].filter(Boolean).join(' ') || undefined,
      })}

      {error && (
        <span id={errorId} role="alert" className="text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
```

---

## 8. 테스트

### 8.1 자동화 도구

```bash
# ESLint
npm install eslint-plugin-jsx-a11y --save-dev

# axe-core
npm install @axe-core/react --save-dev
```

```typescript
// eslint.config.mjs
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
    },
  },
];
```

### 8.2 컴포넌트 테스트

```typescript
// tests/a11y/components.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('Button should have no a11y violations', async () => {
    const { container } = render(
      <Button>클릭하세요</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Form should have proper labels', async () => {
    const { container } = render(
      <LoginForm />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 8.3 수동 테스트 체크리스트

```markdown
## 키보드 테스트
- [ ] Tab으로 모든 인터랙티브 요소 접근 가능
- [ ] Shift+Tab으로 역순 탐색 가능
- [ ] Enter/Space로 버튼/링크 활성화
- [ ] Escape로 모달/드롭다운 닫기
- [ ] 포커스 표시가 항상 보임

## 스크린 리더 테스트 (VoiceOver/NVDA)
- [ ] 모든 이미지에 대체 텍스트
- [ ] 폼 레이블 읽힘
- [ ] 에러 메시지 알림
- [ ] 동적 콘텐츠 변경 알림
- [ ] 랜드마크로 탐색 가능

## 시각 테스트
- [ ] 200% 확대에서 콘텐츠 손상 없음
- [ ] 색상 대비 4.5:1 이상
- [ ] 색상만으로 정보 전달하지 않음
- [ ] 포커스 표시 명확
```

---

## 9. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 스킵 링크 추가
- [ ] 이미지 alt 텍스트 검토
- [ ] 폼 레이블 연결 확인
- [ ] 포커스 스타일 설정

### 단기 적용 (P1)

- [ ] axe-core 테스트 추가
- [ ] 키보드 네비게이션 완성
- [ ] 색상 대비 검증

### 장기 적용 (P2)

- [ ] 스크린 리더 테스트
- [ ] WCAG 2.2 AA 인증
- [ ] 접근성 가이드 문서화

---

## 10. 참고 자료

- [WCAG 2.2 Complete Guide](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025)
- [React Accessibility Docs](https://legacy.reactjs.org/docs/accessibility.html)
- [React Aria](https://react-spectrum.adobe.com/react-aria/accessibility.html)
- [Next.js Accessibility Guide](https://bejamas.com/hub/guides/next-js-and-accessibility)

---

**Version**: 1.0 | **Priority**: P0 Critical
