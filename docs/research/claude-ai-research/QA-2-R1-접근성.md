# QA-2-R1: 접근성 (Web Accessibility)

> 작성일: 2026-01-16
> 상태: 리서치 완료
> 관련 모듈: 전체 웹 앱

---

## 1. 핵심 요약

- **WCAG 2.1 AA**는 웹 접근성의 국제 표준으로, 4가지 원칙(인식 가능, 운용 가능, 이해 가능, 견고함)과 13개 가이드라인, 50개 성공 기준으로 구성됨
- **한국 WA인증**은 KWCAG 2.2 기반으로 24개 검사 항목을 평가하며, 공공기관은 의무, 민간 서비스는 권장 사항
- **자동화 테스트**(vitest-axe, @axe-core/playwright)로 약 30-50%의 접근성 문제 감지 가능, 나머지는 수동 검증 필요
- **색상 대비**는 일반 텍스트 4.5:1, 큰 텍스트 3:1 이상 필수 (AA 기준)
- 이룸 프로젝트는 이미 `vitest-axe`, `@axe-core/playwright` 기반 접근성 테스트 인프라 구축 완료

---

## 2. 상세 내용

### 2.1 WCAG 2.1 AA 기준

#### 2.1.1 WCAG 4대 원칙 (POUR)

| 원칙 | 영문 | 설명 |
|------|------|------|
| **인식 가능** | Perceivable | 정보와 UI를 인식할 수 있어야 함 |
| **운용 가능** | Operable | UI와 네비게이션을 조작할 수 있어야 함 |
| **이해 가능** | Understandable | 정보와 UI 조작이 이해 가능해야 함 |
| **견고함** | Robust | 다양한 보조 기술과 호환되어야 함 |

#### 2.1.2 AA 레벨 주요 성공 기준

**인식 가능 (Perceivable)**

| 기준 | 번호 | 설명 | 이룸 적용 |
|------|------|------|----------|
| 비텍스트 콘텐츠 | 1.1.1 | 모든 이미지에 대체 텍스트 | `alt` 속성 필수 |
| 자막 | 1.2.2 | 동영상에 자막 제공 | 해당 없음 (현재) |
| 색상 대비 | 1.4.3 | 4.5:1 (일반), 3:1 (큰 텍스트) | 디자인 시스템 준수 |
| 텍스트 크기 조절 | 1.4.4 | 200%까지 확대 가능 | rem 단위 사용 |
| 이미지 텍스트 | 1.4.5 | 로고 외 이미지 텍스트 금지 | 준수 |
| 리플로우 | 1.4.10 | 320px에서 가로 스크롤 없음 | 반응형 구현 |
| 비텍스트 대비 | 1.4.11 | UI 요소 3:1 대비 | 버튼, 입력 필드 |
| 텍스트 간격 | 1.4.12 | 줄 높이 1.5배, 문단 간격 2배 | Tailwind 설정 |

**운용 가능 (Operable)**

| 기준 | 번호 | 설명 | 이룸 적용 |
|------|------|------|----------|
| 키보드 | 2.1.1 | 모든 기능 키보드 접근 | tabIndex 관리 |
| 키보드 함정 없음 | 2.1.2 | 포커스 이탈 가능 | 모달 Escape 처리 |
| 건너뛰기 링크 | 2.4.1 | 본문 건너뛰기 제공 | SkipLink 컴포넌트 |
| 페이지 제목 | 2.4.2 | 각 페이지 고유 제목 | `<title>` 설정 |
| 포커스 순서 | 2.4.3 | 논리적 포커스 이동 | DOM 순서 준수 |
| 링크 목적 | 2.4.4 | 링크 텍스트로 목적 파악 | "더 보기" 지양 |
| 포커스 표시 | 2.4.7 | 포커스 시각적 표시 | focus-visible 스타일 |

**이해 가능 (Understandable)**

| 기준 | 번호 | 설명 | 이룸 적용 |
|------|------|------|----------|
| 페이지 언어 | 3.1.1 | `lang` 속성 | `<html lang="ko">` |
| 포커스 시 변경 없음 | 3.2.1 | 포커스만으로 상태 변경 없음 | 준수 |
| 입력 시 변경 없음 | 3.2.2 | 입력만으로 제출 없음 | 준수 |
| 오류 식별 | 3.3.1 | 오류 텍스트로 설명 | `aria-invalid` |
| 레이블 | 3.3.2 | 입력 필드 레이블 | `<label>` 연결 |
| 오류 제안 | 3.3.3 | 오류 수정 방법 안내 | 폼 검증 메시지 |

**견고함 (Robust)**

| 기준 | 번호 | 설명 | 이룸 적용 |
|------|------|------|----------|
| 파싱 | 4.1.1 | HTML 문법 준수 | ESLint HTML |
| 이름/역할/값 | 4.1.2 | ARIA 속성 올바르게 | Radix UI 자동 |
| 상태 메시지 | 4.1.3 | 상태 변경 알림 | aria-live |

### 2.2 한국 WA인증

#### 2.2.1 WA인증 개요

| 항목 | 내용 |
|------|------|
| 인증기관 | 한국웹접근성인증평가원 (웹와치) |
| 기준 | KWCAG 2.2 (한국형 웹 콘텐츠 접근성 지침) |
| 유효기간 | 1년 |
| 적용대상 | 공공기관 의무, 민간 권장 |
| 검사항목 | 24개 항목 |

#### 2.2.2 KWCAG 2.2 검사 항목

| 번호 | 항목 | 설명 |
|------|------|------|
| 1 | 적절한 대체 텍스트 | 이미지에 의미 전달 텍스트 |
| 2 | 자막 제공 | 멀티미디어 자막 |
| 3 | 색에 무관한 콘텐츠 | 색상만으로 정보 전달 금지 |
| 4 | 명확한 지시 사항 | 색, 크기, 위치 외 정보 제공 |
| 5 | 텍스트 콘텐츠 명도 대비 | 4.5:1 이상 |
| 6 | 자동 재생 금지 | 3초 이상 자동 재생 금지 |
| 7 | 콘텐츠 간 구분 | 시각적 구분선/여백 |
| 8 | 키보드 사용 보장 | 모든 기능 키보드 접근 |
| 9 | 초점 이동 | 논리적 순서 |
| 10 | 조작 가능 | 충분한 클릭 영역 |
| 11 | 응답 시간 조절 | 세션 타임아웃 조절 |
| 12 | 정지 기능 제공 | 자동 슬라이드 정지 |
| 13 | 깜빡임과 번쩍임 사용 제한 | 초당 3회 이하 |
| 14 | 반복 영역 건너뛰기 | 본문 바로가기 |
| 15 | 제목 제공 | 페이지 및 프레임 제목 |
| 16 | 적절한 링크 텍스트 | 명확한 링크 목적 |
| 17 | 기본 언어 표시 | `lang` 속성 |
| 18 | 사용자 요구에 따른 실행 | 자동 팝업 금지 |
| 19 | 콘텐츠 선형 구조 | 논리적 순서 |
| 20 | 표의 구성 | 표 제목, 헤더 셀 |
| 21 | 레이블 제공 | 입력 필드 레이블 |
| 22 | 오류 정정 | 오류 안내 및 수정 기회 |
| 23 | 마크업 오류 방지 | HTML 문법 준수 |
| 24 | 웹 애플리케이션 접근성 | ARIA 올바른 사용 |

### 2.3 jest-axe / vitest-axe 테스트

#### 2.3.1 설정 (vitest-axe)

```typescript
// vitest.setup.ts
import 'vitest-axe/extend-expect';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

// 타입 확장
declare module 'vitest' {
  interface Assertion<T> {
    toHaveNoViolations(): void;
  }
}
```

#### 2.3.2 기본 테스트 패턴

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

describe('컴포넌트 접근성', () => {
  it('접근성 위반이 없어야 한다', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### 2.3.3 규칙 설정

```typescript
// 특정 규칙 비활성화
const results = await axe(container, {
  rules: {
    'color-contrast': { enabled: false },  // 테마 변경 시 임시 제외
    'heading-order': { enabled: true },
  },
});

// WCAG 레벨 지정
const results = await axe(container, {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },
});
```

#### 2.3.4 Playwright axe-core 테스트

```typescript
// e2e/a11y/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('페이지 접근성', async ({ page }) => {
  await page.goto('/dashboard');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .disableRules(['color-contrast'])  // 알려진 이슈 제외
    .exclude(['[data-clerk-component]'])  // 외부 컴포넌트 제외
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### 2.4 스크린리더 테스트

#### 2.4.1 주요 스크린리더

| 스크린리더 | 플랫폼 | 브라우저 | 시장점유율 |
|-----------|--------|----------|-----------|
| **NVDA** | Windows | Chrome, Firefox | ~30% |
| **JAWS** | Windows | Chrome, IE/Edge | ~40% |
| **VoiceOver** | macOS, iOS | Safari | ~15% |
| **TalkBack** | Android | Chrome | ~10% |
| **Narrator** | Windows | Edge | ~5% |

#### 2.4.2 테스트 시나리오

```markdown
## 스크린리더 테스트 체크리스트

### 1. 페이지 로드 시
- [ ] 페이지 제목 읽힘 확인
- [ ] 랜드마크(main, nav, header, footer) 인식
- [ ] 건너뛰기 링크 동작

### 2. 네비게이션
- [ ] 메뉴 항목 순차 읽기
- [ ] 현재 페이지 표시 (aria-current)
- [ ] 하위 메뉴 확장/축소 알림

### 3. 폼 입력
- [ ] 레이블 연결 확인 (입력 시 레이블 읽힘)
- [ ] 필수 필드 안내 (aria-required)
- [ ] 오류 메시지 자동 읽힘 (aria-live)
- [ ] 도움말 연결 (aria-describedby)

### 4. 동적 콘텐츠
- [ ] 모달 열릴 때 제목 읽힘
- [ ] 알림/토스트 자동 읽힘
- [ ] 로딩 상태 안내

### 5. 분석 결과 (이룸 특화)
- [ ] 분석 완료 알림
- [ ] 결과 수치 읽기 (차트 대체 텍스트)
- [ ] 추천 항목 목록 순회
```

#### 2.4.3 NVDA 테스트 단축키

| 단축키 | 기능 |
|--------|------|
| `Caps Lock + Space` | NVDA 모드 전환 |
| `H` | 다음 제목 |
| `D` | 다음 랜드마크 |
| `F` | 다음 폼 필드 |
| `B` | 다음 버튼 |
| `K` | 다음 링크 |
| `T` | 다음 테이블 |
| `Ctrl` | 읽기 중단 |
| `Insert + F7` | 요소 목록 |

#### 2.4.4 VoiceOver 테스트 단축키 (macOS)

| 단축키 | 기능 |
|--------|------|
| `Cmd + F5` | VoiceOver 켜기/끄기 |
| `VO + Right/Left` | 다음/이전 요소 |
| `VO + Space` | 요소 활성화 |
| `VO + Cmd + H` | 다음 제목 |
| `VO + Cmd + J` | 다음 폼 컨트롤 |
| `VO + U` | 로터 (요소 목록) |

### 2.5 키보드 네비게이션

#### 2.5.1 필수 키보드 지원

| 키 | 기능 | 구현 |
|----|------|------|
| `Tab` | 다음 포커스 가능 요소 | 자연 순서 |
| `Shift + Tab` | 이전 포커스 요소 | 자연 순서 |
| `Enter` | 버튼/링크 활성화 | 기본 동작 |
| `Space` | 체크박스/버튼 토글 | 기본 동작 |
| `Escape` | 모달/팝오버 닫기 | 이벤트 핸들러 |
| `Arrow Keys` | 탭/라디오/메뉴 내 이동 | ARIA 패턴 |

#### 2.5.2 포커스 관리 패턴

```typescript
// 모달 포커스 트랩
function useFocusTrap(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
}
```

#### 2.5.3 Roving tabindex 패턴 (탭 목록)

```typescript
// 탭 목록에서 방향키 네비게이션
function TabList({ tabs, activeTab, onChange }) {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    onChange(tabs[newIndex].id);
    document.getElementById(`tab-${tabs[newIndex].id}`)?.focus();
  };

  return (
    <div role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
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

#### 2.5.4 포커스 표시 스타일

```css
/* globals.css */
/* 포커스 링 스타일 - 키보드 사용자만 표시 */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* 마우스 클릭 시 숨김 */
*:focus:not(:focus-visible) {
  outline: none;
}

/* 고대비 모드 대응 */
@media (forced-colors: active) {
  *:focus-visible {
    outline: 3px solid CanvasText;
  }
}
```

### 2.6 색상/폰트 기준

#### 2.6.1 색상 대비 기준

| 요소 유형 | AA 기준 | AAA 기준 |
|----------|---------|----------|
| 일반 텍스트 (<18pt, <14pt bold) | 4.5:1 | 7:1 |
| 큰 텍스트 (>=18pt, >=14pt bold) | 3:1 | 4.5:1 |
| UI 컴포넌트 (버튼, 입력 필드 테두리) | 3:1 | - |
| 그래픽 (아이콘, 차트) | 3:1 | - |

#### 2.6.2 대비율 계산

```typescript
// lib/a11y/contrast.ts

/**
 * 상대 휘도(Luminance) 계산
 * WCAG 2.1 공식
 */
function getLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 대비율 계산
 * 결과: 1:1 ~ 21:1
 */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA 충족 여부
 */
export function meetsWcagAA(fg: string, bg: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(fg, bg);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
```

#### 2.6.3 폰트 크기 기준

| 용도 | 최소 크기 | 권장 크기 | 비고 |
|------|----------|----------|------|
| 본문 | 16px (1rem) | 16-18px | 모바일도 동일 |
| 보조 텍스트 | 14px | 14-16px | muted 스타일 |
| 작은 텍스트 | 12px | 12px | 캡션, 메타정보만 |
| 제목 H1 | 24px | 32-40px | 큰 텍스트 기준 적용 |
| 버튼/링크 | 14px | 16px | 터치 영역 48px |

---

## 3. 구현 시 필수 사항

### 3.1 컴포넌트 체크리스트

- [ ] data-testid 속성 (테스트용)
- [ ] 의미 있는 HTML 시맨틱 요소 사용 (button, nav, main 등)
- [ ] 이미지에 alt 속성 (장식용은 alt="")
- [ ] 아이콘 버튼에 aria-label 또는 sr-only 텍스트
- [ ] 키보드 접근 가능 (tabIndex 확인)
- [ ] 포커스 표시 visible (focus-visible 스타일)
- [ ] 터치 영역 최소 44x44px (권장 48x48px)
- [ ] label과 input 연결 (htmlFor, id)
- [ ] 필수 필드 aria-required="true"
- [ ] 오류 시 aria-invalid="true" + aria-describedby
- [ ] 모달 포커스 트랩 + Escape 닫기
- [ ] 텍스트 대비 4.5:1 이상 (AA)

### 3.2 페이지 체크리스트

- [ ] `<html lang="ko">` 설정
- [ ] `<title>` 각 페이지 고유 제목
- [ ] `<main id="main-content">` 본문 영역
- [ ] 제목 계층 순서 (h1 > h2 > h3)
- [ ] SkipLink 컴포넌트 포함
- [ ] Tab 순서 논리적
- [ ] 모든 기능 키보드로 사용 가능

### 3.3 테스트 체크리스트

- [ ] vitest-axe 단위 테스트 통과
- [ ] Playwright axe-core E2E 테스트 통과
- [ ] ESLint jsx-a11y 규칙 통과
- [ ] 키보드만으로 전체 기능 사용
- [ ] 스크린리더(NVDA/VoiceOver)로 주요 플로우 검증
- [ ] 200% 확대에서 레이아웃 깨짐 없음

---

## 4. 코드 예시

### 4.1 vitest-axe 접근성 테스트

```typescript
// tests/a11y/MyComponent.test.tsx
/// <reference types="vitest-axe/extend-expect" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { MyComponent } from '@/components/MyComponent';

expect.extend(matchers);

describe('MyComponent 접근성', () => {
  it('axe 위반이 없어야 한다', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('버튼에 접근 가능한 이름이 있어야 한다', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName();
  });
});
```

### 4.2 접근성 유틸리티 컴포넌트

```typescript
// components/a11y/VisuallyHidden.tsx
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// components/a11y/LiveRegion.tsx
export function LiveRegion({ children, assertive = false }) {
  return (
    <div
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {children}
    </div>
  );
}
```

---

## 5. 참고 자료

### 공식 문서
- [W3C WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [한국웹접근성인증평가원](https://www.wah.or.kr/)

### 테스트 도구
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [vitest-axe](https://github.com/chaance/vitest-axe)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

### 색상 대비 검사
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

### 스크린리더
- [NVDA (무료, Windows)](https://www.nvaccess.org/)
- [VoiceOver 사용 가이드](https://support.apple.com/guide/voiceover/welcome/mac)

---

## 6. 이룸 프로젝트 현재 상태

### 6.1 구현 완료

| 항목 | 상태 | 위치 |
|------|------|------|
| vitest-axe 설정 | 완료 | `tests/a11y/accessibility.test.tsx` |
| Playwright axe 설정 | 완료 | `e2e/a11y/accessibility.spec.ts` |
| SkipLink 컴포넌트 | 완료 | `components/common/SkipLink.tsx` |
| 대비율 유틸리티 | 완료 | `apps/mobile/lib/a11y.ts` |
| Dialog 접근성 | 완료 | Radix UI 자동 |
| jsx-a11y ESLint | 완료 | ESLint 설정 |

### 6.2 개선 필요

| 항목 | 우선순위 | 비고 |
|------|----------|------|
| 색상 대비 검증 | 높음 | 일부 muted 색상 검토 |
| AI 분석 결과 대체 텍스트 | 높음 | 차트/그래프 |
| 폼 오류 aria-live | 중간 | 실시간 알림 |
| 키보드 테스트 자동화 | 중간 | E2E 확장 |

---

**Version**: 1.0 | **Created**: 2026-01-16 | **Category**: QA
