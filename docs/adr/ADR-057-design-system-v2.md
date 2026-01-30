# ADR-057: 디자인 시스템 v2 (YIROOM IDENTITY)

> **Status**: Accepted
> **Date**: 2026-01-24
> **Deciders**: 창업자
> **Tags**: design, branding, UI/UX

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"YIROOM IDENTITY ✨"
- 다크 테마 기반의 프리미엄 뷰티 앱
- 핑크 그라디언트로 따뜻하고 친근한 전문성 표현
- Y형 헥사곤 로고로 브랜드 아이덴티티 확립
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| OKLCH 지원 | 92.87% (폴백 필요) |
| P3 색역 | 일부 기기만 지원 |
| 다크 모드 | OS 설정 연동 복잡성 |

### 100점 기준

- 모든 화면 색상 일관성 100%
- 로고-UI 색상 완전 동기화
- 접근성 WCAG 2.1 AA 준수 (대비율 4.5:1)
- 모바일/웹 동일 경험

### 현재 목표: 85%

- 웹 앱 색상 토큰 교체
- 로고 SVG 교체
- 문서 동기화

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 모바일 앱 동기화 | 별도 MOBILE-DESIGN-PLAN.md | 웹 완료 후 |
| 라이트 모드 | 다크 모드 우선 전략 | MAU 5,000+ |
| 애니메이션 고도화 | 성능 영향 | 최적화 후 |

---

## 1. 컨텍스트

### 1.1 현재 상태

이룸 프로젝트에 두 가지 디자인 방향이 혼재:

| 문서/파일 | 색상 체계 | 스타일 |
|----------|----------|--------|
| SPEC-DESIGN-REFINEMENT.md | 민트 (oklch 0.45 0.12 155) | Refined Expertise v2 |
| design-tokens.json | 핑크 (#F8C8DC) | YIROOM IDENTITY ✨ |
| 현재 로고 SVG | 민트→블랙 그라디언트 | 6잎 꽃/별 |
| 제공된 UI 코드 | 핑크 (#F8C8DC) | 다크 + Glass Morphism |

### 1.2 문제점

1. **불일치**: 문서, 로고, UI 코드 간 색상 체계 불일치
2. **브랜드 혼란**: 민트 vs 핑크 방향성 미확정
3. **구현 지연**: 스펙 확정 없이 구현 불가

### 1.3 요구사항

- 단일 디자인 방향 확정
- 문서, 로고, UI 코드 동기화
- P7 워크플로우 준수 (원리 → ADR → 스펙 → 구현)

---

## 2. 결정

### 2.1 선택: YIROOM IDENTITY ✨ (핑크 기반 다크 테마)

```
v1: 민트→블랙 (성별 중립화)     → 폐기
v2: Refined Expertise (민트)   → 폐기
v3: YIROOM IDENTITY (핑크)     → 채택 ✅
```

### 2.2 핵심 색상 체계

```javascript
const TOKENS = {
  colors: {
    bg: '#0A0A0B',           // 배경 (Deep Black)
    brand: 'linear-gradient(135deg, #F8C8DC 0%, #FFB6C1 100%)',
    brandSolid: '#F8C8DC',   // Primary Solid
    skinBlue: '#3B82F6',     // S-1 피부분석
    bodyPurple: '#A855F7',   // C-1 체형분석
    textMain: '#E4E4E7',     // 본문
    textMuted: '#71717A',    // 보조 텍스트
  }
};
```

### 2.3 로고 변경

| 항목 | v1 (현재) | v3 (신규) |
|------|----------|----------|
| **심볼** | 6잎 꽃/별 | Y형 헥사곤 (Luminous Singularity) |
| **색상** | 민트→블랙 | 화이트→핑크 그라디언트 |
| **배경** | 라운드 사각형 | 없음 (투명) |
| **효과** | 없음 | 중앙 펄스 애니메이션 |

### 2.4 브랜딩

| 항목 | 값 |
|------|-----|
| **헤더** | "YIROOM INTELLIGENCE" |
| **서브** | "IDENTITY ✨" |
| **슬로건** | "당신만의 아름다움을 발견하세요" |

---

## 3. 대안 검토

### 3.1 Option A: 민트 기반 유지 (기각)

**장점**:
- 성별 중립적
- 기존 로고와 일관성

**단점**:
- 타겟층(20-35 여성) 선호도 낮음
- UI 코드와 불일치
- "뷰티 앱" 인식 약함

**결론**: 기각 - 타겟층 어필 부족

### 3.2 Option B: 핑크 기반 채택 (채택)

**장점**:
- 타겟층 선호도 높음
- 프리미엄 뷰티 앱 포지셔닝
- 이미 작성된 design-tokens.json과 일치
- 제공된 UI 코드 활용 가능

**단점**:
- 로고 재작업 필요
- 일부 문서 갱신 필요

**결론**: 채택 - 타겟층 어필 + 기존 토큰 활용

### 3.3 Option C: 하이브리드 (민트 로고 + 핑크 UI) (기각)

**장점**:
- 변경 최소화

**단점**:
- 브랜드 일관성 훼손
- 사용자 혼란

**결론**: 기각 - 일관성 부족

---

## 4. 영향 분석

### 4.1 수정 필요 파일

| 유형 | 파일 | 작업 |
|------|------|------|
| **로고** | `apps/web/public/logo.svg` | 교체 |
| **로고** | `apps/web/public/logo-neutral.svg` | 교체 |
| **로고** | `apps/web/public/icon-neutral.svg` | 교체 |
| **CSS** | `apps/web/app/globals.css` | 색상 토큰 교체 |
| **스펙** | `docs/SPEC-DESIGN-REFINEMENT.md` | v3 갱신 |
| **프롬프트** | `docs/design/GEMINI-DESIGN-PROMPTS.md` | 색상 갱신 |

### 4.2 영향 없는 파일

| 유형 | 파일 | 이유 |
|------|------|------|
| **토큰** | `docs/specs/design-tokens.json` | 이미 핑크 기반 |
| **원리** | `docs/principles/design-system.md` | OKLCH 원리 유지 |

### 4.3 구현 우선순위

```
P0: 문서 동기화 (ADR, 스펙)
P1: 로고 SVG 교체
P2: globals.css 색상 토큰 교체
P3: 컴포넌트 스타일 확인
```

---

## 5. 원자적 분해 (P3)

### ATOM-1: ADR-057 작성 (1시간)

- 입력: 디자인 요구사항, 기존 문서
- 출력: ADR-057-design-system-v2.md
- 성공 기준: P0-P8 원칙 준수, 대안 검토 포함

### ATOM-2: SPEC-DESIGN-REFINEMENT v3 갱신 (2시간)

- 입력: ADR-057, design-tokens.json, 제공된 UI 코드
- 출력: SPEC-DESIGN-REFINEMENT.md v3
- 성공 기준: 색상 토큰 명세, 컴포넌트 스펙 포함

### ATOM-3: SDD-LOGO-IDENTITY 작성 (1시간)

- 입력: 제공된 로고 코드, 브랜딩 요구사항
- 출력: docs/specs/SDD-LOGO-IDENTITY.md
- 성공 기준: SVG 코드, 색상 명세, 사용 가이드

### ATOM-4: 로고 SVG 파일 생성 (30분)

- 입력: SDD-LOGO-IDENTITY 스펙
- 출력: logo.svg, logo-neutral.svg, icon-neutral.svg
- 성공 기준: 스펙 일치, 다양한 크기 지원

### ATOM-5: globals.css 색상 토큰 교체 (30분)

- 입력: design-tokens.json
- 출력: apps/web/app/globals.css
- 성공 기준: 모든 색상 변수 교체, 빌드 성공

---

## 6. 참조

### 6.1 원리 문서

- [design-system.md](../principles/design-system.md) - OKLCH, 토큰 아키텍처

### 6.2 스펙 문서

- [design-tokens.json](../specs/design-tokens.json) - 디자인 토큰 (핑크 기반)
- [SPEC-DESIGN-REFINEMENT.md](../SPEC-DESIGN-REFINEMENT.md) - UI/UX 스펙 (갱신 예정)

### 6.3 관련 ADR

- [ADR-026](./ADR-026-color-space-hsl-decision.md) - 색상 공간 결정
- [ADR-051](./ADR-051-2026-ux-trends.md) - 2026 UX 트렌드

---

**Version**: 1.0 | **Created**: 2026-01-24 | **Author**: Claude Code
