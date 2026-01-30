# ADR-048: 접근성 전략 (Accessibility Strategy)

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"WCAG 2.1 AA 레벨을 완전히 준수하여 시각/청각/운동 장애 사용자를 포함한 모든 사용자가 이룸 앱의 전 기능을 원활하게 이용할 수 있는 상태"

- **색상 대비**: 모든 텍스트 4.5:1 이상, UI 컴포넌트 3:1 이상
- **키보드 접근성**: 모든 기능 100% 키보드 접근 가능
- **스크린 리더**: 모든 요소에 적절한 ARIA 레이블
- **자동화 검증**: axe-core 기반 CI 통합 테스트

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 이미지 분석 | 시각 장애 사용자에게 카메라 촬영 가이드 한계 |
| 실시간 피드백 | 스크린 리더와 실시간 UI 업데이트 동기화 어려움 |
| 비용 | 완전한 접근성 구현 시 개발 시간 20-30% 증가 |
| 테스트 | 실제 보조 기술 사용자 테스트 필요 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| WCAG AA 준수율 | 100% | 60% | axe-core 기준 |
| 색상 대비 통과율 | 100% | 미검증 | 4.5:1/3:1 |
| 키보드 접근성 | 100% | 부분 | 포커스 관리 |
| ARIA 레이블 커버리지 | 100% | 30% | 인터랙티브 요소 |
| 자동화 테스트 | CI 통합 | 없음 | axe-core + Playwright |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| WCAG AAA | AA로 충분, 비용 대비 효과 낮음 (FINANCIAL_HOLD) | 법적 요구 시 |
| 수화 통역 | 영상 콘텐츠 한정 (SCOPE_EXCEED) | 영상 콘텐츠 확대 시 |
| 음성 입력 | 기본 OS 기능 활용 (ALT_SUFFICIENT) | 전용 기능 필요 시 |
| 점자 디스플레이 | 스크린 리더 연동으로 대체 (ALT_SUFFICIENT) | 요청 시 |

## 맥락 (Context)

이룸 앱은 통합 웰니스 AI 플랫폼으로서 다양한 사용자층을 대상으로 합니다. 장애인차별금지법, 정보통신접근성 지침, 그리고 글로벌 표준인 WCAG(Web Content Accessibility Guidelines)에 따라 모든 사용자가 앱을 원활하게 이용할 수 있어야 합니다.

### 접근성이 필요한 이유

| 관점 | 필요성 |
|------|--------|
| **법적 준수** | 장애인차별금지법, 전자정부 웹 접근성 지침 |
| **사용자 확대** | 시각/청각/운동 장애 사용자 포용 |
| **SEO 개선** | 시맨틱 HTML, ARIA로 검색 엔진 최적화 |
| **UX 향상** | 키보드 네비게이션, 고대비 모드 등 일반 사용자에게도 유용 |

### 현재 접근성 수준

| 영역 | 현재 상태 | 문제점 |
|------|----------|--------|
| 색상 대비 | 미검증 | 일부 텍스트 가독성 부족 |
| 키보드 네비게이션 | 부분 지원 | 포커스 표시 불명확 |
| 스크린 리더 | 미지원 | ARIA 레이블 누락 |
| 자동화 테스트 | 없음 | 접근성 회귀 감지 불가 |

## 결정 (Decision)

**WCAG 2.1 AA 레벨을 표준으로 채택**하고, axe-core 기반 자동화 테스트를 CI 파이프라인에 통합합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                     접근성 전략 구조                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  WCAG 2.1 AA 준수                                           │
│       ↓                                                      │
│  ┌────────────────────────────────────┐                     │
│  │  4대 원칙 (POUR)                   │                     │
│  │  ├── Perceivable (인식 가능)       │                     │
│  │  │   └── 색상 대비 4.5:1 이상      │                     │
│  │  ├── Operable (운용 가능)          │                     │
│  │  │   └── 키보드 접근성 100%        │                     │
│  │  ├── Understandable (이해 가능)    │                     │
│  │  │   └── 명확한 오류 메시지        │                     │
│  │  └── Robust (견고성)               │                     │
│  │      └── 보조 기술 호환성          │                     │
│  └────────────────────────────────────┘                     │
│       ↓                                                      │
│  ┌────────────────────────────────────┐                     │
│  │  자동화 검증                        │                     │
│  │  ├── axe-core: 런타임 검사         │                     │
│  │  ├── eslint-plugin-jsx-a11y: 린트  │                     │
│  │  └── Playwright: E2E 접근성 테스트 │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### WCAG 2.1 AA 핵심 요구사항

| 기준 | 요구사항 | 이룸 적용 |
|------|----------|----------|
| **1.4.3** 색상 대비 | 일반 텍스트 4.5:1, 큰 텍스트 3:1 | 모든 UI 컴포넌트 |
| **1.4.11** 비텍스트 대비 | UI 컴포넌트/그래픽 3:1 | 버튼, 아이콘, 차트 |
| **2.1.1** 키보드 | 모든 기능 키보드 접근 가능 | 포커스 관리 |
| **2.4.7** 포커스 표시 | 키보드 포커스 시각적 표시 | 포커스 링 스타일 |
| **4.1.2** 이름/역할/값 | ARIA 레이블 제공 | 모든 인터랙티브 요소 |

### 컴포넌트 접근성 필수 속성

```tsx
// 모든 인터랙티브 컴포넌트 필수 속성
interface AccessibleComponentProps {
  "aria-label"?: string;           // 스크린 리더용 레이블
  "aria-describedby"?: string;     // 추가 설명 참조
  "aria-labelledby"?: string;      // 레이블 요소 참조
  role?: string;                   // 역할 명시
  tabIndex?: number;               // 키보드 포커스 순서
}

// 예시: 분석 결과 카드
<div
  role="article"
  aria-label="피부 분석 결과"
  tabIndex={0}
  data-testid="analysis-result-card"
>
  {/* 내용 */}
</div>
```

### 색상 대비 가이드

```
┌─────────────────────────────────────────────────────────────┐
│                     색상 대비 기준                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  일반 텍스트 (< 18pt)                                        │
│  └── 최소 대비: 4.5:1                                        │
│  └── 권장 대비: 7:1 (AAA)                                    │
│                                                              │
│  큰 텍스트 (>= 18pt 또는 14pt bold)                          │
│  └── 최소 대비: 3:1                                          │
│                                                              │
│  UI 컴포넌트 (버튼, 입력 필드 테두리)                        │
│  └── 최소 대비: 3:1                                          │
│                                                              │
│  이룸 기본 색상 예시:                                        │
│  ├── 텍스트: #1a1a1a on #ffffff = 16.1:1 ✅                 │
│  ├── 보조 텍스트: #6b7280 on #ffffff = 5.0:1 ✅             │
│  └── 민트 브랜드: #10b981 on #ffffff = 3.3:1 ⚠️ (큰 텍스트만) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **WCAG 2.0 A** | 최소 요구사항, 구현 용이 | 모바일 접근성 미흡, 색상 대비 기준 낮음 | `LOW_ROI` - 현대 표준 미달 |
| **WCAG 2.1 AAA** | 최고 수준 접근성 | 구현 비용 높음, 일부 디자인 제약 | `NOT_NEEDED` - AA로 충분한 법적 준수 |
| **수동 테스트만** | 즉시 적용 가능 | 회귀 감지 불가, 일관성 부족 | `LOW_ROI` - 자동화 대비 효율 낮음 |
| **외부 접근성 감사만** | 전문가 검토 가능 | 비용 높음, 지속적 검증 어려움 | `NOT_NEEDED` - 자동화와 병행 필요 |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: 장애인차별금지법, 정보통신접근성 지침 준수
- **사용자 확대**: 장애 사용자 포함 모든 사용자 접근 가능
- **품질 향상**: 시맨틱 HTML, 키보드 접근성은 일반 UX도 개선
- **자동화 검증**: CI/CD 파이프라인에서 접근성 회귀 자동 감지

### 부정적 결과

- **개발 시간 증가**: ARIA 속성, 포커스 관리 등 추가 작업
- **디자인 제약**: 색상 대비 요구사항으로 일부 디자인 수정 필요
- **테스트 시간 증가**: 접근성 테스트 추가로 CI 시간 증가

### 리스크

| 리스크 | 완화 방안 |
|--------|----------|
| 기존 컴포넌트 미준수 | 점진적 마이그레이션, 우선순위 지정 |
| 자동화 오탐/미탐 | 수동 테스트 병행, axe 규칙 커스터마이징 |
| 모바일 접근성 차이 | React Native 접근성 속성 별도 검증 |

## 구현 가이드

### axe-core 테스트 설정

```typescript
// tests/a11y/accessibility.test.tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility Tests", () => {
  it("should have no accessibility violations in AnalysisResultCard", async () => {
    const { container } = render(<AnalysisResultCard result={mockResult} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have no accessibility violations in Dashboard", async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: true },
        "keyboard-access": { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
```

### ESLint 접근성 규칙

```javascript
// eslint.config.mjs
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  {
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
];
```

### Playwright E2E 접근성 테스트

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility E2E", () => {
  test("dashboard should pass accessibility audit", async ({ page }) => {
    await page.goto("/dashboard");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("analysis flow should be keyboard navigable", async ({ page }) => {
    await page.goto("/analysis/skin");

    // Tab으로 모든 인터랙티브 요소 접근 가능 확인
    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).not.toBe("BODY");

    // Enter로 버튼 활성화 확인
    await page.keyboard.press("Enter");
    // 결과 확인...
  });
});
```

### 포커스 스타일 가이드

```css
/* globals.css */

/* 기본 포커스 스타일 */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 버튼 포커스 */
.btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--ring-alpha);
}

/* 입력 필드 포커스 */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: -1px;
  border-color: var(--ring);
}

/* 카드/컨테이너 포커스 */
[tabindex="0"]:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  :focus-visible {
    outline-width: 3px;
  }
}
```

### 접근성 컴포넌트 패턴

```tsx
// components/common/AccessibleButton.tsx
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  "aria-label"?: string;
  isLoading?: boolean;
}

export function AccessibleButton({
  children,
  "aria-label": ariaLabel,
  isLoading,
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="sr-only">로딩 중</span>
          <LoadingSpinner aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

```tsx
// components/common/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      본문으로 바로가기
    </a>
  );
}

// app/layout.tsx에서 사용
<body>
  <SkipLink />
  <Header />
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
</body>
```

### CI 파이프라인 통합

```yaml
# .github/workflows/ci.yml
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run accessibility tests
        run: npm run test:a11y

      - name: Lighthouse accessibility audit
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/dashboard
          budgetPath: ./lighthouse-budget.json
          configPath: ./lighthouserc.json

      - name: Check a11y score
        run: |
          SCORE=$(cat .lighthouseci/lhr-*.json | jq ".categories.accessibility.score")
          if (( $(echo "$SCORE < 0.9" | bc -l) )); then
            echo "Accessibility score is below 90%: $SCORE"
            exit 1
          fi
```

## 마이그레이션 계획

### Phase 1: 기반 구축 (1주)

- [ ] ESLint jsx-a11y 플러그인 추가
- [ ] axe-core 테스트 환경 설정
- [ ] 포커스 스타일 전역 정의
- [ ] SkipLink 컴포넌트 추가

### Phase 2: 핵심 컴포넌트 (2주)

- [ ] Button, Input, Select 접근성 속성 추가
- [ ] Modal, Dialog 포커스 트랩 구현
- [ ] 분석 결과 카드 ARIA 레이블 추가
- [ ] 차트 컴포넌트 대체 텍스트 추가

### Phase 3: 페이지 검증 (2주)

- [ ] 대시보드 접근성 테스트
- [ ] 분석 플로우 키보드 네비게이션 검증
- [ ] 설정 페이지 폼 접근성 검증
- [ ] 모바일 앱 접근성 검증

### Phase 4: 자동화 완성 (1주)

- [ ] CI 파이프라인에 접근성 테스트 통합
- [ ] Lighthouse 접근성 점수 임계값 설정
- [ ] 접근성 회귀 알림 설정

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: 접근성](../principles/accessibility.md) - WCAG 원칙, 색상 대비 계산

### 관련 ADR/스펙

- [ADR-024: AI 투명성](./ADR-024-ai-transparency.md) - AI 결과 접근성 표시
- [ADR-015: 테스트 전략](./ADR-015-testing-strategy.md) - 접근성 테스트 통합

### 외부 참조

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/master/doc/rule-descriptions.md)
- [React Accessibility](https://react.dev/reference/react-dom/components#common-props)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| SDD-ACCESSIBILITY | 계획됨 | 접근성 컴포넌트, 테스트, CI 통합 |

### 핵심 구현 파일

```
apps/web/
├── components/common/
│   ├── SkipLink.tsx          # 본문 바로가기
│   └── AccessibleButton.tsx  # 접근성 버튼
├── tests/a11y/
│   └── accessibility.test.tsx  # axe-core 테스트
├── e2e/
│   └── accessibility.spec.ts   # Playwright 접근성 E2E
└── globals.css                 # 포커스 스타일

.github/workflows/
└── ci.yml                      # 접근성 테스트 통합
```

---

**Author**: Claude Code
**Reviewed by**: -
