# 접근성 원리 (Accessibility Principles)

> 이 문서는 이룸 플랫폼의 접근성(Accessibility) 기반 원리를 설명한다.
>
> **소스 리서치**: WCAG 2.1 AA, WAI-ARIA 1.2, Apple HIG, Material Design, ADA, 장애인차별금지법

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 디지털 포용 플랫폼"

- 100% WCAG 2.1 AAA 준수: 모든 성공 기준 충족
- 완벽한 스크린 리더 호환: VoiceOver, NVDA, JAWS 100% 지원
- 완전한 키보드 네비게이션: 마우스 없이 모든 기능 사용 가능
- 인지 접근성: 단순하고 일관된 UX로 인지 장애 사용자 지원
- 다국어 접근성: 한국어/영어 스크린 리더 네이티브 지원
- 자동화된 접근성 검증: CI/CD 파이프라인에서 자동 접근성 테스트
- 접근성 문화: 모든 팀원이 접근성 우선 개발 실천
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **이미지 분석 설명** | AI 생성 이미지에 대한 완벽한 대체 텍스트 자동 생성 불가 |
| **색상 기반 정보** | 퍼스널컬러 분석 결과를 색맹 사용자에게 완벽히 전달하기 어려움 |
| **복잡한 시각화** | 그래프/차트의 완벽한 비시각적 대안 제공 한계 |
| **AAA 일부 기준** | 특정 AAA 기준은 현실적으로 달성 어려움 (예: 수어 통역) |
| **써드파티 컴포넌트** | 외부 라이브러리의 접근성 완전 제어 불가 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **WCAG 2.1 AA 준수율** | 모든 성공 기준 100% 충족 |
| **색상 대비** | 텍스트 4.5:1, 대형 텍스트 3:1, UI 컴포넌트 3:1 |
| **키보드 접근성** | 모든 인터랙티브 요소 Tab/Enter/Space로 조작 가능 |
| **포커스 관리** | 명확한 포커스 표시기, 논리적 포커스 순서 |
| **ARIA 사용** | 모든 커스텀 위젯에 적절한 ARIA 역할/상태 |
| **폼 접근성** | 모든 폼 필드에 레이블, 에러 메시지 연결 |
| **터치 타겟** | 최소 44×44px (모바일) |
| **애니메이션 제어** | prefers-reduced-motion 완전 지원 |
| **스크린 리더 테스트** | VoiceOver, NVDA 수동 테스트 통과 |
| **자동화 테스트** | axe-core 0건 위반 |

### 현재 목표

**80%** - WCAG 2.1 AA 기본 준수

- ✅ 색상 대비 4.5:1 (텍스트)
- ✅ 키보드 네비게이션 기본 지원
- ✅ 시맨틱 HTML 사용
- ✅ 폼 레이블 및 에러 연결
- ✅ 이미지 alt 텍스트
- ✅ 포커스 표시기
- ⏳ ARIA 완전 적용 (70%)
- ⏳ 스크린 리더 수동 테스트 (60%)
- ⏳ CI/CD 자동화 테스트 (50%)
- ⏳ 모바일 접근성 (65%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| WCAG 2.1 AAA 완전 준수 | 일부 기준 현실적 달성 어려움 | Phase 4 |
| 수어 통역 제공 | 비디오 콘텐츠 부재, 비용 | 미정 |
| 인지 접근성 전문 UX | 전문 연구 필요 | Phase 3 |
| 웹 접근성 인증마크 | MVP 범위 외 | Phase 2 |

---

## 1. 개요

### 1.1 접근성의 정의

**접근성(Accessibility, a11y)**은 장애 유무에 관계없이 모든 사용자가 정보와 서비스에 동등하게 접근할 수 있도록 보장하는 것이다.

| 용어 | 정의 | 범위 |
|------|------|------|
| **웹 접근성** | 장애인, 고령자 등이 웹 콘텐츠에 접근 가능 | 시각, 청각, 운동, 인지 장애 |
| **디지털 접근성** | 모든 디지털 제품/서비스의 접근성 | 웹, 모바일, 키오스크 등 |
| **유니버설 디자인** | 처음부터 모두를 위한 설계 | 장애 여부 불문 |

**접근성의 4대 장애 유형**:

| 장애 유형 | 영향받는 사용자 | 주요 접근성 요구사항 |
|----------|----------------|---------------------|
| **시각 장애** | 전맹, 저시력, 색각 이상 | 스크린 리더, 확대, 색상 대비 |
| **청각 장애** | 농인, 난청 | 자막, 수어, 시각적 알림 |
| **운동 장애** | 지체 장애, 떨림, 근육 약화 | 키보드 접근, 큰 터치 타겟 |
| **인지 장애** | 학습 장애, ADHD, 치매 | 단순 언어, 일관된 네비게이션 |

### 1.2 법적 근거

#### 1.2.1 대한민국: 장애인차별금지법

**장애인차별금지 및 권리구제 등에 관한 법률 (2008년 시행)**:

| 조항 | 내용 | 적용 |
|------|------|------|
| **제21조 (정보접근권)** | 장애인의 정보접근을 보장해야 함 | 웹사이트, 모바일 앱 |
| **제24조 (문화예술활동)** | 문화/예술 접근 보장 | 콘텐츠 접근성 |
| 시행령 제14조 | 웹 접근성 준수 의무 | 공공기관 필수, 민간 권장 |

**국가표준 (KWCAG)**:
- **KWCAG 2.2** (2024년): WCAG 2.1 기반 한국 웹 접근성 지침
- 공공기관: 법적 준수 의무
- 민간 기업: 권장 (점진적 의무화 추세)

**웹 접근성 인증마크**:
- 한국정보화진흥원(NIA) 주관
- 1년 유효, 매년 갱신
- WA (Web Accessibility) 마크

#### 1.2.2 미국: ADA (Americans with Disabilities Act)

**ADA Title III (1990년, 2010년 개정)**:

| 항목 | 내용 | 판례 적용 |
|------|------|----------|
| **적용 범위** | 공공시설 및 상업시설 | 웹사이트도 포함 (판례) |
| **합리적 편의** | 장애인에게 합리적 편의 제공 | WCAG 2.0 AA 기준 적용 |
| **소송 위험** | 접근성 미준수 시 소송 가능 | Domino's, Target 판례 |

**주요 판례**:
- **Robles v. Domino's Pizza (2019)**: 웹/앱 접근성 필수 확정
- **Gil v. Winn-Dixie (2017)**: 웹사이트는 ADA 적용 대상

#### 1.2.3 국제: WCAG (W3C)

**Web Content Accessibility Guidelines**:

| 버전 | 연도 | 특징 |
|------|------|------|
| WCAG 2.0 | 2008 | 기본 접근성 기준, ISO 40500 |
| **WCAG 2.1** | 2018 | 모바일, 저시력, 인지장애 추가 |
| WCAG 2.2 | 2023 | 인지/학습 장애 강화, 드래그 대안 |

**이룸 적용 기준**: **WCAG 2.1 Level AA**

### 1.3 접근성의 비즈니스 가치

| 가치 | 설명 | 데이터 |
|------|------|-------|
| **시장 확대** | 전 세계 장애인 인구 10억+ | 구매력 $8조/년 |
| **SEO 향상** | 시맨틱 마크업 = 검색 최적화 | 접근성 좋은 사이트 순위 상승 |
| **법적 리스크 감소** | 소송/과태료 방지 | ADA 소송 연간 10,000건+ (미국) |
| **UX 향상** | 모든 사용자에게 좋은 UX | 자막은 비장애인도 활용 |

---

## 2. POUR 원칙 상세

**WCAG의 4가지 핵심 원칙** (Principles):

### 2.1 인지 가능 (Perceivable)

> "정보와 사용자 인터페이스 구성 요소는 사용자가 인지할 수 있는 방식으로 제시되어야 한다."

#### 2.1.1 학술적 근거

**다중 감각 이론 (Multi-Sensory Theory)**:
- 정보는 여러 감각 채널로 제공되어야 모든 사용자가 접근 가능
- 시각 장애인: 청각/촉각 대안 필요
- 청각 장애인: 시각 대안 필요

**정보 처리 모델**:
```
정보 입력 → 감각 등록 → 지각 → 인지 → 응답

감각 등록 단계에서 정보를 수신하지 못하면
나머지 단계 진행 불가
→ 대체 감각 채널 필수
```

#### 2.1.2 기술적 적용

| 지침 | WCAG 기준 | 이룸 적용 |
|------|----------|----------|
| **1.1 대체 텍스트** | 이미지에 텍스트 대안 | `alt` 속성 필수 |
| **1.2 시간 기반 미디어** | 자막, 오디오 설명 | 동영상 자막 |
| **1.3 적응 가능** | 구조 유지 정보 제공 | 시맨틱 HTML |
| **1.4 구별 가능** | 배경과 전경 구분 | 색상 대비 4.5:1 |

**구현 예시**:

```tsx
// 1.1.1 비텍스트 콘텐츠 - 대체 텍스트
<img
  src="/analysis/skin-result.png"
  alt="피부 분석 결과: 복합성 피부, 수분 65점, 유분 45점"
/>

// 장식용 이미지
<img
  src="/decorative-line.svg"
  alt=""
  role="presentation"
/>

// 1.3.1 정보와 관계 - 시맨틱 구조
<article>
  <header>
    <h1>퍼스널컬러 분석 결과</h1>
  </header>
  <main>
    <section aria-labelledby="season-title">
      <h2 id="season-title">계절 타입</h2>
      <p>가을 웜 트루</p>
    </section>
  </main>
</article>
```

### 2.2 운용 가능 (Operable)

> "사용자 인터페이스 구성 요소와 네비게이션은 운용 가능해야 한다."

#### 2.2.1 학술적 근거

**운동 제어 이론 (Motor Control Theory)**:
- 사용자의 운동 능력에 관계없이 인터페이스 조작 가능해야 함
- **Fitts의 법칙**: 타겟 크기↑, 거리↓ = 접근 용이

```
T = a + b * log2(D/W + 1)

T = 이동 시간
D = 시작점에서 타겟까지 거리
W = 타겟 너비

결론:
- 큰 버튼 = 빠른 클릭
- 가까운 요소 = 쉬운 접근
- 44px 최소 터치 타겟 권장
```

**Hick의 법칙 (선택 시간)**:
```
RT = a + b * log2(n + 1)

RT = 반응 시간
n = 선택지 수

결론:
- 선택지↑ = 결정 시간↑
- 메뉴 항목 7±2개 권장
- 중첩 메뉴 최소화
```

#### 2.2.2 기술적 적용

| 지침 | WCAG 기준 | 이룸 적용 |
|------|----------|----------|
| **2.1 키보드 접근성** | 키보드로 모든 기능 접근 | Tab, Enter, Space, Escape |
| **2.2 충분한 시간** | 시간 제한 조절 가능 | 세션 타임아웃 경고 |
| **2.3 발작 방지** | 깜빡임 3회/초 미만 | 애니메이션 제한 |
| **2.4 네비게이션 가능** | 콘텐츠 찾기/이동 도움 | Skip Link, 제목 구조 |
| **2.5 입력 방식** | 다양한 입력 지원 | 포인터, 모션 대안 |

**키보드 인터랙션 패턴**:

```typescript
// 키보드 이벤트 처리 표준
const KEYBOARD_PATTERNS = {
  // 포커스 이동
  Tab: '다음 포커스 가능 요소로',
  'Shift+Tab': '이전 포커스 가능 요소로',

  // 활성화
  Enter: '버튼/링크 활성화',
  Space: '버튼/체크박스 활성화',

  // 네비게이션
  ArrowUp: '이전 항목',
  ArrowDown: '다음 항목',
  ArrowLeft: '탭/트리 축소',
  ArrowRight: '탭/트리 확장',

  // 취소/닫기
  Escape: '모달/드롭다운 닫기',

  // 특수
  Home: '첫 번째 항목',
  End: '마지막 항목',
};
```

### 2.3 이해 가능 (Understandable)

> "정보와 사용자 인터페이스 운용은 이해할 수 있어야 한다."

#### 2.3.1 학술적 근거

**인지 부하 이론 (Cognitive Load Theory)**:
- 작업 기억의 용량은 제한적 (Miller의 법칙: 7±2 항목)
- 외적 인지 부하를 최소화해야 함
- 일관성과 예측 가능성이 핵심

**스키마 이론 (Schema Theory)**:
- 사용자는 기존 정신 모델에 기반해 인터페이스 해석
- 일관된 디자인 = 쉬운 학습
- 예상치 못한 동작 = 혼란

```
정신 모델 일치도:
- 높음: "이 버튼은 내가 예상한 대로 동작한다"
- 낮음: "왜 이렇게 되지? 이해가 안 된다"

→ 일관된 UI 패턴 필수
```

#### 2.3.2 기술적 적용

| 지침 | WCAG 기준 | 이룸 적용 |
|------|----------|----------|
| **3.1 가독성** | 텍스트 이해 가능 | 한국어 lang="ko", 명확한 언어 |
| **3.2 예측 가능성** | 일관된 동작 | 동일 기능 = 동일 라벨 |
| **3.3 입력 지원** | 오류 방지/수정 | 에러 메시지, 제안 |

**에러 처리 패턴**:

```tsx
// 3.3.1 오류 식별 - 명확한 에러 메시지
<FormField
  label="이메일"
  error={errors.email && "올바른 이메일 형식을 입력해주세요. 예: name@example.com"}
  aria-invalid={!!errors.email}
  aria-describedby="email-error"
/>

// 3.3.3 오류 제안 - 수정 방법 제시
{errors.password && (
  <p id="password-error" role="alert">
    비밀번호는 8자 이상이어야 합니다.
    현재 {password.length}자를 입력하셨습니다.
  </p>
)}

// 3.3.4 오류 예방 - 확인 단계
<ConfirmDialog
  title="정말 삭제하시겠습니까?"
  description="이 작업은 취소할 수 없습니다."
  confirmLabel="삭제"
  cancelLabel="취소"
/>
```

### 2.4 견고함 (Robust)

> "콘텐츠는 보조 기술을 포함한 다양한 사용자 에이전트가 해석할 수 있을 만큼 견고해야 한다."

#### 2.4.1 학술적 근거

**상호운용성 원칙 (Interoperability)**:
- 다양한 브라우저, 디바이스, 보조 기술과 호환
- 표준 준수 = 넓은 호환성
- 독점 기술 의존 = 접근성 저하

**점진적 향상 (Progressive Enhancement)**:
```
기본 기능 (HTML)
   ↓ + CSS
   ↓ + JavaScript
   ↓ + ARIA
최적화된 경험

각 단계에서 기본 기능 유지
→ 최신 기술 미지원 환경에서도 동작
```

#### 2.4.2 기술적 적용

| 지침 | WCAG 기준 | 이룸 적용 |
|------|----------|----------|
| **4.1 호환성** | 보조 기술과 호환 | 유효한 HTML, ARIA |
| **4.1.1 파싱** | 유효한 마크업 | HTML 검증 |
| **4.1.2 이름, 역할, 값** | 프로그래밍적 결정 가능 | 적절한 ARIA |
| **4.1.3 상태 메시지** | 상태 변경 알림 | aria-live |

---

## 3. 색상 대비 원리

### 3.1 과학적 근거: 인간 시각 시스템

#### 3.1.1 시력과 대비 감도

**대비 감도 함수 (Contrast Sensitivity Function, CSF)**:

```
인간의 시각 시스템은 특정 공간 주파수에서 대비 감도가 최대.
- 최적 주파수: 약 3 cycles/degree
- 고주파수(미세 디테일): 대비 감도 낮음
- 저주파수(큰 영역): 대비 감도 적당

실용적 의미:
- 작은 텍스트 = 높은 대비 필요 (4.5:1)
- 큰 텍스트 = 낮은 대비 허용 (3:1)
```

**연령에 따른 대비 감도 변화**:

| 연령대 | 대비 감도 | 권장 대비율 |
|--------|----------|------------|
| 20대 | 기준 (100%) | 4.5:1 |
| 40대 | 약 80% | 5:1+ |
| 60대 | 약 50% | 7:1+ |
| 70대+ | 약 30% | 10:1+ |

**임상 근거**:
- 저시력 사용자 (Visual Acuity 20/200 이하): 높은 대비 필수
- 백내장: 대비 감도 50% 이상 감소
- 황반변성: 중심 시야 손상, 고대비 필요

#### 3.1.2 색각 이상 (Color Vision Deficiency)

**색각 이상 유형**:

| 유형 | 영향받는 색상 | 인구 비율 (남성) |
|------|-------------|-----------------|
| **제1색맹 (Protanopia)** | 빨강 미인지 | 1.0% |
| **제2색맹 (Deuteranopia)** | 초록 미인지 | 1.1% |
| **제3색맹 (Tritanopia)** | 파랑 미인지 | 0.01% |
| **색약 (Anomalous Trichromacy)** | 색상 구분 어려움 | 6.0% |

**색각 이상 대응**:

```typescript
// 색상만으로 정보를 전달하지 않음
// ❌ 잘못된 예
<div className="bg-red-500">에러</div>  // 빨간색만으로 에러 표시

// ✅ 올바른 예
<div className="bg-red-500 flex items-center gap-2">
  <AlertCircle aria-hidden="true" />  {/* 아이콘 추가 */}
  <span>에러: 이메일 형식이 올바르지 않습니다</span>  {/* 텍스트 추가 */}
</div>
```

**색각 이상자를 위한 색상 선택**:

| 권장 조합 | 이유 |
|----------|------|
| 파랑 + 주황 | 대부분의 색각 이상에서 구분 가능 |
| 파랑 + 빨강 | Deuteranopia에서 구분 가능 |
| **패턴/텍스처 병용** | 색상 의존도 감소 |

### 3.2 WCAG 대비율 공식

**상대 휘도 (Relative Luminance) 계산**:

```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B

여기서 R, G, B는 선형화된 값:
if (sRGB <= 0.04045)
  Linear = sRGB / 12.92
else
  Linear = ((sRGB + 0.055) / 1.055) ^ 2.4
```

**계수의 의미**:
- 0.2126 (R): 빨강의 휘도 기여
- 0.7152 (G): 초록의 휘도 기여 (가장 높음 - 인간 눈의 민감도)
- 0.0722 (B): 파랑의 휘도 기여

**대비율 공식**:

```
대비율 = (L1 + 0.05) / (L2 + 0.05)

L1 = 밝은 색상의 상대 휘도
L2 = 어두운 색상의 상대 휘도
0.05 = 흑색 보정 상수 (완전 흑색의 반사 고려)
```

### 3.3 WCAG 2.1 AA 대비 기준

| 텍스트 유형 | 최소 대비율 | 정의 |
|------------|-----------|------|
| **일반 텍스트** | **4.5:1** | < 18pt 또는 < 14pt bold |
| **큰 텍스트** | **3:1** | >= 18pt 또는 >= 14pt bold |
| **UI 컴포넌트** | **3:1** | 아이콘, 테두리, 포커스 링 |
| **비장식 요소** | 해당 없음 | 순수 장식 목적 |

**pt와 px 변환**:
```
18pt = 24px (96dpi 기준)
14pt = 18.67px ≈ 19px

∴ 큰 텍스트 = 24px+ 또는 19px+ bold
```

### 3.4 대비율 계산 구현

```typescript
/**
 * WCAG 2.1 색상 대비율 계산
 *
 * @reference WCAG 2.1 Success Criterion 1.4.3
 */

/**
 * sRGB 값을 선형 RGB로 변환
 * IEC 61966-2-1:1999 표준
 */
function srgbToLinear(srgb: number): number {
  const normalized = srgb / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * RGB 색상의 상대 휘도 계산
 * ITU-R BT.709 표준 계수
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // ITU-R BT.709 계수
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * 두 색상 간의 대비율 계산
 * @returns 대비율 (1:1 ~ 21:1)
 */
function getContrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const L1 = getRelativeLuminance(...rgb1);
  const L2 = getRelativeLuminance(...rgb2);

  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  // WCAG 공식: 0.05는 흑색 보정 상수
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 AA 기준 충족 여부 확인
 */
function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * WCAG 2.1 AAA 기준 충족 여부 확인
 */
function meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}
```

### 3.5 이룸 색상 토큰 대비 검증

| 전경 | 배경 | 대비율 | AA | 용도 |
|------|------|--------|-----|------|
| `--foreground` | `--background` | 15.8:1 | PASS | 본문 |
| `--primary-foreground` | `--primary` | 8.2:1 | PASS | 버튼 |
| `--muted-foreground` | `--background` | 4.6:1 | PASS | 보조 텍스트 |
| `--destructive-foreground` | `--destructive` | 5.3:1 | PASS | 에러 버튼 |

---

## 4. 키보드 접근성 원리

### 4.1 대상 사용자

#### 4.1.1 운동 장애 사용자

| 장애 유형 | 영향 | 키보드 대안 |
|----------|------|------------|
| **지체 장애** | 마우스 정밀 제어 어려움 | 키보드 네비게이션 |
| **떨림 (진전)** | 작은 타겟 클릭 어려움 | 키보드 + 큰 포커스 영역 |
| **근육 약화** | 지속적인 마우스 조작 어려움 | 단축키, 순차 접근 |
| **반복성 긴장 장애 (RSI)** | 마우스 과사용 회피 | 키보드 전용 조작 |

#### 4.1.2 시각 장애 사용자

| 사용자 유형 | 키보드 의존 이유 |
|------------|-----------------|
| **전맹** | 화면 미확인, 스크린 리더 + 키보드 필수 |
| **저시력** | 커서 추적 어려움, 키보드 선호 |
| **터널 시야** | 좁은 시야로 마우스 비효율 |

### 4.2 키보드 인터랙션 패턴

#### 4.2.1 표준 키 매핑

```typescript
/**
 * ARIA Authoring Practices Guide 준수 키보드 패턴
 */
const KEYBOARD_INTERACTIONS = {
  // 기본 네비게이션
  navigation: {
    Tab: '다음 포커스 가능 요소로 이동',
    'Shift+Tab': '이전 포커스 가능 요소로 이동',
  },

  // 활성화
  activation: {
    Enter: '링크/버튼 활성화',
    Space: '버튼/체크박스 토글',
  },

  // 위젯 네비게이션
  widget: {
    ArrowUp: '이전 옵션 (메뉴, 리스트)',
    ArrowDown: '다음 옵션 (메뉴, 리스트)',
    ArrowLeft: '이전 탭, 트리 축소',
    ArrowRight: '다음 탭, 트리 확장',
    Home: '첫 번째 항목으로',
    End: '마지막 항목으로',
  },

  // 취소/닫기
  dismiss: {
    Escape: '모달/드롭다운/팝오버 닫기',
  },
};
```

#### 4.2.2 컴포넌트별 키보드 패턴

**버튼**:
```tsx
// 기본 버튼 - Enter/Space로 활성화
<button onClick={handleClick}>
  저장
</button>

// div를 버튼으로 사용 시 (권장하지 않음, 불가피할 때만)
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  저장
</div>
```

**탭 (Tabs)**:
```tsx
// WAI-ARIA Tabs 패턴
<div role="tablist" aria-label="분석 결과 탭">
  <button
    role="tab"
    aria-selected={activeTab === 0}
    aria-controls="panel-0"
    tabIndex={activeTab === 0 ? 0 : -1}  // 선택된 탭만 Tab 접근
    onKeyDown={handleTabKeyDown}  // Arrow 키로 탭 간 이동
  >
    요약
  </button>
  {/* ... */}
</div>

function handleTabKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowRight':
      focusNextTab();
      break;
    case 'ArrowLeft':
      focusPrevTab();
      break;
    case 'Home':
      focusFirstTab();
      break;
    case 'End':
      focusLastTab();
      break;
  }
}
```

**모달 (Dialog)**:
```tsx
// 포커스 트랩: 모달 내에서만 Tab 순환
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 모달 열릴 때 첫 포커스 가능 요소로 이동
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    // Escape 키로 닫기
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
}
```

### 4.3 포커스 관리

#### 4.3.1 포커스 순서 (Tab Order)

```
논리적 읽기 순서 = 포커스 순서

일반적인 순서:
1. Skip Link (건너뛰기 링크)
2. 헤더/네비게이션
3. 메인 콘텐츠
4. 사이드바 (있으면)
5. 푸터

DOM 순서를 따름 (tabindex 조작 최소화)
```

**tabindex 사용 규칙**:

| 값 | 의미 | 사용 |
|----|------|------|
| `tabindex="0"` | 자연 순서로 포커스 가능 | 비인터랙티브 요소를 포커스 가능하게 |
| `tabindex="-1"` | 프로그래밍적으로만 포커스 | 스크립트로 포커스 이동 시 |
| `tabindex="1+"` | **사용 금지** | Tab 순서 혼란 유발 |

#### 4.3.2 포커스 표시 (Focus Indicator)

```css
/* 포커스 인디케이터 - WCAG 2.4.7 */
:focus-visible {
  outline: 2px solid oklch(0.65 0.15 240);  /* 2px 이상 */
  outline-offset: 2px;  /* 요소와 분리 */
}

/* 마우스 클릭 시 포커스 링 숨김 (선택적) */
:focus:not(:focus-visible) {
  outline: none;
}

/* 고대비 모드 */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}
```

### 4.4 Skip Link

```tsx
/**
 * 키보드 사용자가 반복 콘텐츠를 건너뛸 수 있도록 함
 * WCAG 2.4.1 블록 건너뛰기
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
    >
      본문 바로가기
    </a>
  );
}

// 메인 콘텐츠에 id 부여
<main id="main-content" tabIndex={-1}>
  {/* 콘텐츠 */}
</main>
```

---

## 5. 스크린리더 원리

### 5.1 스크린리더 작동 원리

**접근성 트리 (Accessibility Tree)**:

```
DOM Tree → Accessibility Tree → 스크린리더

Accessibility Tree 구성요소:
- Role: 요소의 역할 (button, link, heading 등)
- Name: 접근 가능한 이름 (label, aria-label 등)
- State: 현재 상태 (checked, expanded 등)
- Value: 현재 값 (input의 입력값 등)
```

**스크린리더 탐색 모드**:

| 모드 | 설명 | 사용 상황 |
|------|------|----------|
| **브라우즈 모드** | 화살표로 콘텐츠 탐색 | 문서 읽기 |
| **폼 모드** | 키보드로 폼 입력 | 입력 필드 |
| **어플리케이션 모드** | 앱과 직접 상호작용 | 커스텀 위젯 |

### 5.2 시맨틱 HTML의 중요성

**시맨틱 HTML = 내장 접근성**:

```html
<!-- ❌ 비시맨틱: 스크린리더가 역할을 모름 -->
<div class="button" onclick="submit()">제출</div>

<!-- ✅ 시맨틱: 자동으로 버튼 역할 인식 -->
<button type="submit">제출</button>
```

**시맨틱 요소별 기본 역할**:

| HTML 요소 | 암시적 Role | 스크린리더 출력 |
|-----------|------------|----------------|
| `<button>` | button | "제출 버튼" |
| `<a href>` | link | "링크, 홈으로 이동" |
| `<h1>`-`<h6>` | heading | "레벨 1 제목, 분석 결과" |
| `<nav>` | navigation | "네비게이션" |
| `<main>` | main | "메인 콘텐츠" |
| `<article>` | article | "기사" |
| `<aside>` | complementary | "보조 콘텐츠" |
| `<form>` | form | "양식" |
| `<input type="text">` | textbox | "텍스트 입력" |
| `<input type="checkbox">` | checkbox | "체크박스, 선택됨/선택 안 됨" |

### 5.3 ARIA (Accessible Rich Internet Applications)

#### 5.3.1 ARIA의 역할

**ARIA 사용 원칙 (ARIA Authoring Practices)**:

```
1. 네이티브 HTML 우선
   - ARIA 없이 해결 가능하면 사용하지 않음
   - <button> > <div role="button">

2. 역할 변경 주의
   - 기존 시맨틱을 무시하지 않음
   - <h1 role="button"> 금지

3. 모든 인터랙티브 요소는 키보드 접근 필수
   - role="button" → 키보드 이벤트 핸들러 필수

4. 포커스 가능 요소 숨기지 않음
   - aria-hidden="true" + tabindex="0" 조합 금지

5. 접근 가능한 이름 필수
   - 모든 인터랙티브 요소는 이름 필요
```

#### 5.3.2 핵심 ARIA 속성

**이름과 설명**:

```tsx
// aria-label: 직접 이름 제공
<button aria-label="메뉴 닫기">
  <X aria-hidden="true" />
</button>

// aria-labelledby: 다른 요소 참조
<dialog aria-labelledby="dialog-title">
  <h2 id="dialog-title">분석 결과 확인</h2>
</dialog>

// aria-describedby: 추가 설명
<input
  type="password"
  aria-describedby="password-hint"
/>
<p id="password-hint">8자 이상, 영문+숫자 포함</p>
```

**상태와 속성**:

```tsx
// aria-expanded: 확장/축소 상태
<button aria-expanded={isOpen} aria-controls="menu">
  메뉴
</button>
<ul id="menu" hidden={!isOpen}>
  {/* 메뉴 항목 */}
</ul>

// aria-selected: 선택 상태 (탭, 리스트)
<div role="tablist">
  <button role="tab" aria-selected="true">탭 1</button>
  <button role="tab" aria-selected="false">탭 2</button>
</div>

// aria-checked: 체크 상태
<div role="checkbox" aria-checked="mixed">
  일부 선택됨
</div>

// aria-disabled: 비활성 상태
<button aria-disabled="true">
  로딩 중...
</button>

// aria-invalid: 유효성 검증 실패
<input aria-invalid="true" aria-describedby="error-msg" />
<p id="error-msg" role="alert">이메일 형식이 올바르지 않습니다</p>
```

**라이브 리전 (동적 업데이트 알림)**:

```tsx
// aria-live: 동적 콘텐츠 변경 알림
// "polite": 현재 읽기 완료 후 알림
// "assertive": 즉시 알림 (긴급)

<div aria-live="polite" aria-atomic="true">
  {status}  {/* "분석이 완료되었습니다" */}
</div>

// role="alert": 자동으로 assertive
<div role="alert">
  오류가 발생했습니다!
</div>

// role="status": 자동으로 polite
<div role="status">
  저장되었습니다.
</div>
```

#### 5.3.3 핵심 ARIA Role

| Role | 용도 | 예시 |
|------|------|------|
| `button` | 버튼 동작 | 클릭 가능한 요소 |
| `link` | 링크 동작 | 네비게이션 |
| `dialog` | 모달 대화상자 | 확인 모달 |
| `alert` | 중요 알림 | 에러 메시지 |
| `status` | 상태 업데이트 | 저장 완료 |
| `tablist/tab/tabpanel` | 탭 UI | 탭 컴포넌트 |
| `menu/menuitem` | 메뉴 | 드롭다운 메뉴 |
| `progressbar` | 진행률 | 로딩 바 |
| `region` | 랜드마크 | 구역 구분 |

### 5.4 이룸 AI 분석 결과 접근성

```tsx
/**
 * AI 분석 결과의 접근 가능한 설명 제공
 */
function SkinAnalysisResult({ result }: { result: SkinAnalysis }) {
  return (
    <section aria-labelledby="result-title">
      <h2 id="result-title">피부 분석 결과</h2>

      {/* 시각적 차트 + 텍스트 대안 */}
      <div aria-hidden="true">
        <RadarChart data={result.scores} />
      </div>

      {/* 스크린리더용 텍스트 요약 */}
      <div className="sr-only">
        <p>피부 타입: {result.skinType}</p>
        <p>수분 점수: {result.scores.hydration}점 (100점 만점)</p>
        <p>유분 점수: {result.scores.oiliness}점 (100점 만점)</p>
        <p>민감도 점수: {result.scores.sensitivity}점 (100점 만점)</p>
      </div>

      {/* 권장사항 - 리스트로 구조화 */}
      <section aria-labelledby="recommendations-title">
        <h3 id="recommendations-title">권장사항</h3>
        <ul>
          {result.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
```

---

## 6. 모바일 접근성

### 6.1 터치 타겟 크기

#### 6.1.1 과학적 근거

**Fitts의 법칙 + 터치 정확도 연구**:

```
터치 정확도는 손가락 크기에 의존:
- 성인 검지 손가락 폭: 평균 16-20mm
- 손가락 끝 접촉면: 약 10mm

MIT Touch Lab 연구 (2003):
- 평균 손가락 끝 너비: 8-10mm
- 오류 없는 터치 최소 크기: 9.6mm

Apple 연구 (iPhone HIG):
- 권장 터치 타겟: 44pt (약 7.7mm @163ppi)

Google 연구 (Material Design):
- 권장 터치 타겟: 48dp (약 9mm @mdpi)
```

**터치 오류율 vs 타겟 크기**:

| 타겟 크기 | 오류율 | 권장 |
|----------|--------|------|
| 32px | 15-20% | 부적합 |
| 40px | 8-10% | 최소 |
| **44px** | 5% | WCAG 권장 |
| **48px** | 2-3% | 권장 |
| 56px | <1% | 최적 |

#### 6.1.2 플랫폼별 가이드라인

| 플랫폼 | 최소 크기 | 권장 크기 | 단위 |
|--------|----------|----------|------|
| **WCAG 2.1 AA** | 44x44 | - | CSS px |
| **Apple HIG** | 44x44 | 48x48 | pt |
| **Material Design** | 48x48 | 56x56 | dp |
| **이룸 표준** | **44x44** | **48x48** | px |

#### 6.1.3 구현

```typescript
/**
 * 터치 타겟 크기 상수
 */
const TOUCH_TARGET = {
  MIN_SIZE: 44,        // WCAG 2.1 AA 최소
  RECOMMENDED: 48,     // 권장 크기
  COMFORTABLE: 56,     // 여유 있는 크기
  MIN_SPACING: 8,      // 타겟 간 최소 간격
} as const;

/**
 * 시각적 크기 유지하면서 터치 영역 확장
 */
function TouchableArea({ children, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minWidth: TOUCH_TARGET.MIN_SIZE,
        minHeight: TOUCH_TARGET.MIN_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      // 터치 영역 확장 (시각적 크기보다 큼)
      hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      }}
    >
      {children}
    </Pressable>
  );
}
```

```css
/* CSS로 터치 영역 확장 */
.touch-target {
  position: relative;
  /* 시각적 크기 */
  width: 24px;
  height: 24px;
}

.touch-target::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* 실제 터치 영역 */
  min-width: 44px;
  min-height: 44px;
}
```

### 6.2 제스처 대안

#### 6.2.1 WCAG 2.1 요구사항

**2.5.1 포인터 제스처 (Level A)**:
- 경로 기반 제스처(스와이프, 드래그)에 대한 단일 포인터 대안 필요
- 멀티포인트 제스처(핀치 줌)에 대한 단일 포인터 대안 필요

**2.5.2 포인터 취소 (Level A)**:
- Down 이벤트에서 실행 금지 (Up 또는 Click에서 실행)
- 실행 전 취소 가능해야 함

**2.5.4 모션 활성화 (Level A)**:
- 기기 모션(흔들기, 기울이기)에 대한 대안 필요
- 모션 비활성화 옵션 필요

#### 6.2.2 제스처 대안 패턴

```tsx
/**
 * 스와이프 삭제 → 버튼 대안
 */
function SwipeableItem({ item, onDelete }: Props) {
  return (
    <View>
      {/* 스와이프 가능 (주 인터랙션) */}
      <Swipeable
        renderRightActions={() => (
          <DeleteButton onPress={() => onDelete(item.id)} />
        )}
      >
        <ItemContent item={item} />
      </Swipeable>

      {/* 버튼 대안 (접근성) */}
      <Button
        aria-label={`${item.name} 삭제`}
        onPress={() => onDelete(item.id)}
      >
        삭제
      </Button>
    </View>
  );
}

/**
 * 핀치 줌 → 버튼 대안
 */
function ZoomableImage({ src, alt }: Props) {
  const [zoom, setZoom] = useState(1);

  return (
    <View>
      {/* 핀치 줌 가능 */}
      <PinchZoomView zoom={zoom} onZoomChange={setZoom}>
        <Image src={src} alt={alt} />
      </PinchZoomView>

      {/* 버튼 대안 */}
      <View style={styles.zoomControls}>
        <Button
          aria-label="축소"
          onPress={() => setZoom(z => Math.max(1, z - 0.5))}
        >
          -
        </Button>
        <Text aria-live="polite">{Math.round(zoom * 100)}%</Text>
        <Button
          aria-label="확대"
          onPress={() => setZoom(z => Math.min(3, z + 0.5))}
        >
          +
        </Button>
      </View>
    </View>
  );
}

/**
 * 드래그 앤 드롭 → 버튼 대안
 */
function ReorderableList({ items, onReorder }: Props) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={item.id}>
          {/* 드래그 핸들 */}
          <DragHandle />

          <ItemContent item={item} />

          {/* 버튼 대안 */}
          <View style={styles.reorderButtons}>
            <Button
              aria-label={`${item.name}을(를) 위로 이동`}
              disabled={index === 0}
              onPress={() => onReorder(index, index - 1)}
            >
              위로
            </Button>
            <Button
              aria-label={`${item.name}을(를) 아래로 이동`}
              disabled={index === items.length - 1}
              onPress={() => onReorder(index, index + 1)}
            >
              아래로
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}
```

### 6.3 모션 감소

```css
/* prefers-reduced-motion 지원 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// React Native에서 모션 감소 확인
import { AccessibilityInfo } from 'react-native';

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => listener.remove();
  }, []);

  return reduceMotion;
}

// 사용
function AnimatedComponent() {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      style={{
        // 모션 감소 시 애니메이션 비활성화
        transform: reduceMotion ? [] : [{ translateY: animatedValue }],
      }}
    />
  );
}
```

### 6.4 스크린 리더 지원 (VoiceOver / TalkBack)

```tsx
// React Native 접근성 속성
<TouchableOpacity
  accessible={true}
  accessibilityLabel="피부 분석 시작"
  accessibilityHint="카메라로 얼굴을 촬영하여 피부 상태를 분석합니다"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
>
  <Text>분석 시작</Text>
</TouchableOpacity>

// 이미지 접근성
<Image
  source={{ uri: resultImage }}
  accessible={true}
  accessibilityLabel="피부 분석 결과: 복합성 피부, 수분 65점"
/>

// 동적 콘텐츠 알림
<View
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
>
  <Text>{statusMessage}</Text>
</View>
```

---

## 7. 검증 방법

### 7.1 자동화 테스트

```typescript
// tests/a11y/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('접근성 테스트', () => {
  it('분석 결과 페이지가 접근성 기준을 충족해야 함', async () => {
    const { container } = render(<AnalysisResultPage />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('색상 대비가 WCAG AA 기준을 충족해야 함', () => {
    const primaryOnWhite = analyzeContrast('#6366f1', '#ffffff');
    expect(primaryOnWhite.meetsAA).toBe(true);
  });

  it('터치 타겟이 최소 크기를 충족해야 함', () => {
    const { getByRole } = render(<Button>클릭</Button>);
    const button = getByRole('button');
    const rect = button.getBoundingClientRect();

    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  });
});
```

### 7.2 수동 테스트 체크리스트

```markdown
## 키보드 테스트
- [ ] Tab 키로 모든 인터랙티브 요소 접근 가능
- [ ] Tab 순서가 논리적
- [ ] 포커스 인디케이터가 명확히 보임
- [ ] Escape 키로 모달/팝업 닫기 가능
- [ ] Enter/Space로 버튼 활성화 가능

## 스크린 리더 테스트 (VoiceOver/NVDA)
- [ ] 모든 이미지에 적절한 대체 텍스트
- [ ] 제목 구조가 논리적 (h1 > h2 > h3)
- [ ] 폼 라벨이 입력 필드와 연결됨
- [ ] 버튼/링크의 목적이 명확
- [ ] 동적 콘텐츠 변경 시 알림

## 색상/시각 테스트
- [ ] 색상만으로 정보를 전달하지 않음
- [ ] 대비율 4.5:1 이상 (일반 텍스트)
- [ ] 대비율 3:1 이상 (큰 텍스트, UI)
- [ ] 색각 이상 시뮬레이션 확인

## 모바일 테스트
- [ ] 터치 타겟 최소 44x44px
- [ ] 제스처에 버튼 대안 제공
- [ ] 모션 감소 설정 준수
```

---

## 8. 구현 체크리스트

### 8.1 인지 가능 (Perceivable)

- [ ] 모든 이미지에 의미 있는 `alt` 텍스트
- [ ] 장식용 이미지는 `alt=""` 또는 `aria-hidden="true"`
- [ ] 색상만으로 정보 전달하지 않음
- [ ] 텍스트 대비율 4.5:1 이상
- [ ] 큰 텍스트 대비율 3:1 이상
- [ ] 비디오에 자막 제공 (해당 시)

### 8.2 운용 가능 (Operable)

- [ ] 모든 기능 키보드로 접근 가능
- [ ] Skip Link 제공
- [ ] 포커스 순서가 논리적
- [ ] 포커스 인디케이터 명확
- [ ] 터치 타겟 최소 44x44px
- [ ] 제스처에 버튼 대안 제공

### 8.3 이해 가능 (Understandable)

- [ ] 페이지 언어 지정 (`<html lang="ko">`)
- [ ] 일관된 네비게이션
- [ ] 일관된 식별 (동일 기능 = 동일 라벨)
- [ ] 폼 에러 식별 및 설명
- [ ] 에러 수정 방법 제안

### 8.4 견고함 (Robust)

- [ ] 유효한 HTML
- [ ] 적절한 ARIA 사용
- [ ] 이름, 역할, 값 프로그래밍적으로 결정 가능
- [ ] 상태 변경 알림 (`aria-live`)

---

## 9. 관련 문서

| 문서 | 설명 |
|------|------|
| [design-system.md](./design-system.md) | 디자인 시스템, 색상 토큰 |
| [color-science.md](./color-science.md) | 색채학, 대비율 원리 |
| [legal-compliance.md](./legal-compliance.md) | 장애인차별금지법 준수 |
| `.claude/rules/security-checklist.md` | 접근성 포함 체크리스트 |

---

## 10. 참고 자료

### 10.1 공식 문서

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) - W3C 웹 콘텐츠 접근성 지침
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) - 접근성 리치 인터넷 애플리케이션
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - ARIA 패턴 가이드

### 10.2 법률/표준

- [장애인차별금지법](https://www.law.go.kr/법령/장애인차별금지및권리구제등에관한법률) - 대한민국
- [ADA.gov](https://www.ada.gov/) - 미국 장애인법
- [ISO 40500:2012](https://www.iso.org/standard/58625.html) - WCAG 2.0 국제 표준

### 10.3 플랫폼 가이드

- [Apple Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Material Design - Accessibility](https://m3.material.io/foundations/accessible-design)

### 10.4 도구

- [axe DevTools](https://www.deque.com/axe/) - 브라우저 확장
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome 내장
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/) - 대비율 검사

### 10.5 학술 자료

- Fitts, P. M. (1954). "The information capacity of the human motor system in controlling the amplitude of movement." - 터치 타겟 크기 원리
- MIT Touch Lab (2003). "Human Fingertip Size and Touch Mechanics"
- ISO 9241-171:2008 - 소프트웨어 접근성 가이드라인

---

## 11. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| (예정) | 접근성 테스트 전략 | axe-core, Lighthouse CI |

---

**Version**: 2.0 | **Created**: 2026-01-23 | **Updated**: 2026-01-23
**소스 리서치**: WCAG 2.1 AA, WAI-ARIA 1.2, Apple HIG, Material Design, ADA, 장애인차별금지법
**변경 이력**: v2.0 - 법적 근거, POUR 학술 근거, 색맹 과학적 근거, 키보드/스크린리더 원리, 모바일 제스처 대안 추가
