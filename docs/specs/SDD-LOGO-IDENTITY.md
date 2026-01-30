# SDD-LOGO-IDENTITY: 이룸 로고 아이덴티티 스펙

> **Version**: 1.0 | **Updated**: 2026-01-24
> **Status**: Draft
> **ADR Reference**: [ADR-057](../adr/ADR-057-design-system-v2.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"Luminous Singularity - Y형 헥사곤 로고"
- Y자 형상으로 YIROOM 브랜드 아이덴티티 표현
- 헥사곤 외곽선으로 안정감과 전문성 표현
- 중앙 펄스 애니메이션으로 생동감 부여
- 화이트→핑크 그라디언트로 YIROOM IDENTITY 테마 연계
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 최소 크기 | 16x16px (해상도 한계) |
| CSS 애니메이션 | 일부 브라우저 미지원 |
| 그라디언트 | SVG ID 충돌 가능 |

### 100점 기준

- 모든 크기에서 선명하게 표시
- 브랜드 색상과 완전 동기화
- 애니메이션 60fps 유지
- 라이트/다크 모드 모두 가시성 확보

### 현재 목표: 90%

- 웹 앱용 SVG 파일 3종 생성
- 파비콘 생성
- 애니메이션 지원

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 3D 로고 | 복잡도 증가 | 리브랜딩 시 |
| 애니메이션 로딩 | 성능 영향 | 최적화 후 |
| 모바일 앱 아이콘 | 별도 가이드라인 | 앱 출시 전 |

---

## 1. 로고 개요

### 1.1 로고명

**Luminous Singularity** (루미너스 싱귤래리티)

### 1.2 디자인 컨셉

| 요소 | 의미 |
|------|------|
| **Y 형상** | YIROOM의 Y, 사용자 여정의 시작점 |
| **헥사곤** | 안정성, 전문성, 연결성 (6각형) |
| **중앙 점** | 사용자 (당신), 싱귤래리티 (특이점) |
| **펄스** | 생동감, 성장, 변화 |
| **그라디언트** | 따뜻함, 친근함, 프리미엄 |

### 1.3 이전 로고와 비교

| 항목 | v1 (이전) | v2 (신규) |
|------|----------|----------|
| **심볼** | 6잎 꽃/별 | Y형 헥사곤 |
| **색상** | 민트→블랙 (#A8D5C2→#2D2D2D) | 화이트→핑크 (#FFFFFF→#FFB6C1) |
| **배경** | 라운드 사각형 (민트) | 투명 |
| **효과** | 없음 | 중앙 펄스 |
| **테마** | 성별 중립 | YIROOM IDENTITY |

---

## 2. 로고 스펙

### 2.1 구성 요소

```
┌─────────────────────────────────────────┐
│                                         │
│          ┌─────────────┐                │
│         ╱               ╲               │
│        ╱                 ╲              │
│       │    ╱─────╲        │             │
│       │   ╱       ╲       │             │
│       │  ╱    ●    ╲      │  ← 중앙 펄스│
│       │ ╱     │     ╲     │             │
│       │       │       │                 │
│       │       │       │                 │
│        ╲      │      ╱                  │
│         ╲     │     ╱                   │
│          ╲────┴────╱                    │
│                                         │
│  ↑ Y 심볼 (스트로크)                     │
│                                         │
│  ╔═══════════════════╗                  │
│  ║   헥사곤 외곽선    ║ ← 0.3 투명도    │
│  ╚═══════════════════╝                  │
│                                         │
└─────────────────────────────────────────┘
```

### 2.2 색상 스펙

#### 그라디언트 (luminousGrad)

```xml
<linearGradient id="luminousGrad" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stopColor="#FFFFFF" />     <!-- 화이트 -->
  <stop offset="50%" stopColor="#FDE6E9" />    <!-- 연핑크 -->
  <stop offset="100%" stopColor="#FFB6C1" />   <!-- 라이트핑크 -->
</linearGradient>
```

#### 색상 코드

| 용도 | HEX | RGB |
|------|-----|-----|
| 그라디언트 시작 | #FFFFFF | rgb(255, 255, 255) |
| 그라디언트 중간 | #FDE6E9 | rgb(253, 230, 233) |
| 그라디언트 끝 | #FFB6C1 | rgb(255, 182, 193) |
| Y 심볼 | #FFFFFF | rgb(255, 255, 255) |
| 중앙 점 | #FFFFFF | rgb(255, 255, 255) |

### 2.3 크기 스펙

| 용도 | 크기 | 스트로크 폭 | 파일 |
|------|------|------------|------|
| 파비콘 | 16x16, 32x32 | 1px | favicon.ico |
| 아이콘 (작음) | 24x24 | 2px | - |
| 아이콘 (기본) | 40x40 | 4px | logo.svg |
| 아이콘 (중간) | 64x64 | 6px | logo-neutral.svg |
| 아이콘 (큰) | 512x512 | 8px | icon-neutral.svg |

### 2.4 여백 규정

```
┌────────────────────────────────┐
│                                │
│   ┌───────────────────────┐    │
│   │                       │    │
│   │      ┌───────┐        │    │
│   │      │ LOGO  │        │    │
│   │      └───────┘        │    │
│   │                       │    │
│   └───────────────────────┘    │
│                                │
│   ↑                            │
│   최소 여백: 로고 높이의 25%    │
│   권장 여백: 로고 높이의 50%    │
│                                │
└────────────────────────────────┘
```

---

## 3. SVG 코드

### 3.1 icon-neutral.svg (512x512)

```xml
<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="luminousGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FDE6E9" />
      <stop offset="100%" stop-color="#FFB6C1" />
    </linearGradient>
  </defs>

  <!-- 헥사곤 외곽선 -->
  <path
    d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z"
    stroke="url(#luminousGrad)"
    stroke-width="0.5"
    fill="none"
    opacity="0.3"
  />

  <!-- Y 심볼 -->
  <path
    d="M26 30C34 37 44 48 50 50C56 48 66 37 74 30M50 50V85"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />

  <!-- 중앙 펄스 -->
  <circle cx="50" cy="50" r="3" fill="white">
    <animate
      attributeName="opacity"
      values="1;0.5;1"
      dur="2s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
```

### 3.2 logo.svg (120x40, 텍스트 포함)

```xml
<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="luminousGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FDE6E9" />
      <stop offset="100%" stop-color="#FFB6C1" />
    </linearGradient>
  </defs>

  <!-- 로고 심볼 (36x36, 중앙 2px 여백) -->
  <g transform="translate(2, 2)">
    <!-- 헥사곤 외곽선 -->
    <path
      d="M18 2L33.6 10.5V27.5L18 36L2.4 27.5V10.5L18 2Z"
      stroke="url(#luminousGrad)"
      stroke-width="0.2"
      fill="none"
      opacity="0.3"
    />

    <!-- Y 심볼 -->
    <path
      d="M9.4 10.8C12.3 13.3 15.9 17.3 18 18C20.1 17.3 23.7 13.3 26.6 10.8M18 18V30.6"
      stroke="white"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />

    <!-- 중앙 점 -->
    <circle cx="18" cy="18" r="1.2" fill="white" />
  </g>

  <!-- 텍스트: 이룸 -->
  <text
    x="46"
    y="24"
    font-family="'Pretendard', 'Apple SD Gothic Neo', sans-serif"
    font-size="14"
    font-weight="600"
    fill="#FFFFFF"
  >이룸</text>

  <!-- 텍스트: YIROOM -->
  <text
    x="75"
    y="24"
    font-family="'Pretendard', 'Inter', sans-serif"
    font-size="11"
    font-weight="500"
    fill="#9CA3AF"
  >YIROOM</text>
</svg>
```

### 3.3 logo-neutral.svg (200x60, 큰 버전)

```xml
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="luminousGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FDE6E9" />
      <stop offset="100%" stop-color="#FFB6C1" />
    </linearGradient>
  </defs>

  <!-- 로고 심볼 (56x56, 중앙 2px 여백) -->
  <g transform="translate(2, 2)">
    <!-- 헥사곤 외곽선 -->
    <path
      d="M28 3L52 17V45L28 57L4 45V17L28 3Z"
      stroke="url(#luminousGrad)"
      stroke-width="0.3"
      fill="none"
      opacity="0.3"
    />

    <!-- Y 심볼 -->
    <path
      d="M14.6 16.8C19.2 20.7 24.6 26.4 28 28C31.4 26.4 36.8 20.7 41.4 16.8M28 28V47.6"
      stroke="white"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />

    <!-- 중앙 점 -->
    <circle cx="28" cy="28" r="1.8" fill="white" />
  </g>

  <!-- 텍스트: 이룸 -->
  <text
    x="72"
    y="35"
    font-family="'Pretendard', 'Apple SD Gothic Neo', sans-serif"
    font-size="22"
    font-weight="600"
    fill="#FFFFFF"
  >이룸</text>

  <!-- 텍스트: YIROOM -->
  <text
    x="120"
    y="35"
    font-family="'Pretendard', 'Inter', sans-serif"
    font-size="18"
    font-weight="500"
    fill="#9CA3AF"
  >YIROOM</text>
</svg>
```

### 3.4 React 컴포넌트

```tsx
// components/common/YiroomLogo.tsx
interface YiroomLogoProps {
  className?: string;
  showPulse?: boolean;
}

export function YiroomLogo({
  className = 'w-12 h-12',
  showPulse = true,
}: YiroomLogoProps) {
  return (
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
        className={showPulse ? 'animate-pulse' : ''}
      />
    </svg>
  );
}
```

---

## 4. 사용 가이드

### 4.1 적합한 사용

| 용도 | 권장 |
|------|------|
| 다크 배경 | 기본 (화이트→핑크) |
| 라이트 배경 | 색상 반전 버전 필요 |
| 헤더/네비게이션 | 40x40px |
| 로딩 화면 | 64x64px + 펄스 |
| 앱 아이콘 | 512x512px |
| 파비콘 | 32x32px |

### 4.2 금지 사용

| 금지 | 이유 |
|------|------|
| 가로세로 비율 변경 | 왜곡 |
| 색상 임의 변경 | 브랜드 일관성 |
| 효과 추가 (그림자, 테두리) | 디자인 의도 훼손 |
| 회전 | 방향성 상실 |
| 저해상도 사용 | 품질 저하 |

### 4.3 배경 조합

| 배경 색상 | 가시성 | 권장 |
|----------|--------|------|
| #0F0F0F (Deep Black) | 최상 | 기본 사용 |
| #1A1A1A (Card) | 상 | 사용 가능 |
| #FFFFFF (White) | 하 | 색상 반전 필요 |
| 그라디언트 | 중 | 검토 필요 |

---

## 5. 파일 목록

### 5.1 생성 파일

| 파일 | 경로 | 크기 | 용도 |
|------|------|------|------|
| icon-neutral.svg | apps/web/public/ | 512x512 | 앱 아이콘 |
| logo.svg | apps/web/public/ | 120x40 | 헤더 로고 |
| logo-neutral.svg | apps/web/public/ | 200x60 | 큰 로고 |
| favicon.ico | apps/web/public/ | 32x32, 16x16 | 파비콘 |

### 5.2 교체 대상

| 파일 | 현재 상태 | 변경 |
|------|----------|------|
| icon-neutral.svg | 민트→블랙 6잎 꽃 | Y형 헥사곤 (화이트→핑크) |
| logo.svg | 민트→블랙 6잎 꽃 + 텍스트 | Y형 헥사곤 + 텍스트 |
| logo-neutral.svg | 민트→블랙 6잎 꽃 + 텍스트 | Y형 헥사곤 + 텍스트 |

---

## 6. 원자적 분해 (P3)

### ATOM-1: SVG 파일 생성 (30분)

- **입력**: 이 스펙 문서
- **출력**: icon-neutral.svg, logo.svg, logo-neutral.svg
- **성공 기준**: SVG 검증 통과, 브라우저 렌더링 정상

### ATOM-2: 파비콘 생성 (15분)

- **입력**: icon-neutral.svg
- **출력**: favicon.ico (32x32, 16x16)
- **성공 기준**: 브라우저 탭에서 정상 표시

### ATOM-3: React 컴포넌트 생성 (30분)

- **입력**: 이 스펙 문서
- **출력**: components/common/YiroomLogo.tsx
- **성공 기준**: 타입체크 통과, 렌더링 정상

### ATOM-4: 기존 파일 교체 (15분)

- **입력**: 생성된 SVG 파일들
- **출력**: apps/web/public/ 파일 교체
- **성공 기준**: 빌드 성공, 시각적 검증

### ATOM-5: 참조 업데이트 (15분)

- **입력**: 로고 사용 컴포넌트 목록
- **출력**: 컴포넌트 import 경로 확인/수정
- **성공 기준**: 모든 로고 정상 표시

---

## 7. 검증 체크리스트

### 7.1 기술 검증

- [ ] SVG 문법 유효성 (W3C Validator)
- [ ] 그라디언트 ID 중복 없음
- [ ] 모든 크기에서 렌더링 정상
- [ ] 애니메이션 60fps 유지

### 7.2 디자인 검증

- [ ] WCAG 2.1 AA 대비 충족 (다크 배경)
- [ ] 16px 최소 크기에서 인식 가능
- [ ] 브랜드 색상 (#F8C8DC) 동기화
- [ ] 여백 규정 준수

### 7.3 브라우저 호환성

- [ ] Chrome (최신)
- [ ] Firefox (최신)
- [ ] Safari (최신)
- [ ] Edge (최신)
- [ ] iOS Safari
- [ ] Chrome Android

---

## 8. 참조

### 8.1 관련 문서

- [ADR-057: 디자인 시스템 v2](../adr/ADR-057-design-system-v2.md)
- [SPEC-DESIGN-REFINEMENT v3](../SPEC-DESIGN-REFINEMENT.md)
- [design-tokens.json](./design-tokens.json)

### 8.2 원본 코드 참조

사용자 제공 YiroomLogo 컴포넌트 기반

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-24 | 초기 스펙 작성 (Luminous Singularity) |

---

**Author**: Claude Code | **ADR**: ADR-057
