# 궁극의 UI/UX 전략 (Ultimate UI Strategy)

> **목표**: 이룸 앱의 궁극적 형태 달성
> **기준**: 100점 만점 디자인 시스템 완성
> **원칙**: P1 (궁극의 형태 정의) 준수

---

## 현재 진행률: 40%

```
궁극의 형태 달성도
████████░░░░░░░░░░░░ 40%

✅ 완료: 디자인 토큰, 기본 프롬프트
🚧 진행: 컴포넌트 라이브러리
⏳ 대기: 상태별 변형, 애니메이션
```

---

## Phase 0: 디자인 토큰 (✅ 완료)

- [x] 컬러 시스템 정의
- [x] 타이포그래피 정의
- [x] 간격/라운딩 정의
- [x] 기본 UI 패턴 정의

---

## Phase 1: 컴포넌트 라이브러리 (🔴 추가 필요)

### 1.1 Atomic Design 계층

```
Atoms (원자)
├── Button (Primary/Secondary/Ghost/Danger)
├── Input (Text/Password/Search/Number)
├── Badge (Status/Trust/AD/New)
├── Icon (24x24, 32x32, 48x48)
├── Avatar (Small/Medium/Large)
├── Checkbox/Radio/Toggle
├── Progress (Bar/Circle/Steps)
└── Skeleton (Text/Card/Image)

Molecules (분자)
├── FormField (Label + Input + Error)
├── Card (Basic/Product/Analysis/Stat)
├── ListItem (Icon + Text + Action)
├── Toast (Success/Error/Warning/Info)
├── Modal (Basic/Confirm/BottomSheet)
├── Tab (Basic/Pill/Underline)
└── Chip (Filter/Tag/Selection)

Organisms (유기체)
├── Header (Basic/WithBack/WithMenu)
├── Navigation (BottomTab/Sidebar)
├── ProductGrid (2col/3col/List)
├── AnalysisCard (PC/Skin/Body)
├── CoachChat (Message/Input/Typing)
└── CalendarView (Month/Week/Day)

Templates (템플릿)
├── AuthLayout (Login/Signup)
├── DashboardLayout (Main)
├── AnalysisLayout (Camera/Result)
├── SettingsLayout (Form/List)
└── ModalLayout (Center/Bottom)
```

### 1.2 컴포넌트별 요청 프롬프트

```markdown
## Request: Component Library - Atoms

각 컴포넌트에 대해:
1. **Variants**: 모든 변형 (size, color, state)
2. **States**: default, hover, active, disabled, loading
3. **Specs**: padding, margin, fontSize 수치
4. **Code**: Tailwind CSS 클래스

### Button Variants
- Primary: 핑크 그라디언트, 흰 텍스트
- Secondary: 투명, 흰 테두리, 흰 텍스트
- Ghost: 투명, 테두리 없음, 흰 텍스트
- Danger: 빨강 배경, 흰 텍스트

### Button Sizes
- sm: h-8, text-sm, px-3
- md: h-10, text-base, px-4
- lg: h-12, text-lg, px-6
- xl: h-14, text-xl, px-8

### Button States
- default: 기본
- hover: opacity-90
- active: scale-95
- disabled: opacity-50, cursor-not-allowed
- loading: spinner + "처리 중..."
```

---

## Phase 2: 상태별 화면 변형 (🔴 추가 필요)

### 2.1 모든 화면의 4가지 상태

```
각 화면별 필수 상태:

1. Loading State
   - Skeleton UI
   - 로딩 메시지
   - 취소 버튼 (필요 시)

2. Empty State
   - 일러스트 또는 아이콘
   - 설명 메시지
   - CTA 버튼 ("시작하기", "추가하기")

3. Error State
   - 에러 아이콘
   - 에러 메시지 (사용자 친화적)
   - 재시도 버튼
   - 도움말 링크

4. Success State
   - 체크 아이콘 또는 애니메이션
   - 축하 메시지
   - 다음 단계 버튼
```

### 2.2 상태별 요청 프롬프트

```markdown
## Request: Screen States - Dashboard

Dashboard 화면의 4가지 상태를 디자인해주세요.

### 1. Loading State
- 전체 화면 스켈레톤
- 카드 영역: 회색 펄스 애니메이션
- Progress 영역: 스켈레톤 바

### 2. Empty State (첫 방문)
- 중앙: 환영 일러스트
- "분석을 시작해보세요!"
- "첫 분석 시작하기" CTA 버튼

### 3. Error State (네트워크 오류)
- 중앙: Wi-Fi 오류 아이콘
- "연결을 확인해주세요"
- "다시 시도" 버튼

### 4. Success State (분석 완료)
- 축하 애니메이션 (컨페티)
- "분석이 완료되었습니다!"
- "결과 보기" 버튼
```

---

## Phase 3: 반응형 디자인 (🔴 추가 필요)

### 3.1 Breakpoints

```css
/* Mobile First */
375px  - Mobile (기본)
768px  - Tablet
1024px - Desktop
1280px - Wide Desktop
```

### 3.2 반응형 요청 프롬프트

```markdown
## Request: Responsive Layouts

각 핵심 화면의 4가지 브레이크포인트 레이아웃:

### Dashboard
- Mobile (375px): 1열 카드 스택
- Tablet (768px): 2열 그리드
- Desktop (1024px): 사이드바 + 2열
- Wide (1280px): 사이드바 + 3열

### Analysis Result
- Mobile: 풀스크린 세로 스크롤
- Tablet: 좌측 결과 + 우측 추천
- Desktop: 3분할 (결과/상세/추천)

### Product Grid
- Mobile: 2열 그리드
- Tablet: 3열 그리드
- Desktop: 4열 그리드 + 필터 사이드바
```

---

## Phase 4: Light Mode 변형 (🟡 선택)

### 4.1 Light Mode 컬러

```css
/* Light Mode */
--background: #FFFFFF;
--card-background: #F9FAFB;
--card-border: #E5E7EB;
--text-primary: #111827;
--text-secondary: #6B7280;
```

### 4.2 Light Mode 요청 프롬프트

```markdown
## Request: Light Mode Variants

Dark Mode 기준 디자인을 Light Mode로 변환:

### 변환 규칙
- Background: #0F0F0F → #FFFFFF
- Card: #1A1A1A → #F9FAFB
- Text Primary: #FFFFFF → #111827
- 핑크 그라디언트: 유지
- 아이콘 컬러: 동일 유지

### 요청 화면
1. Dashboard (Light)
2. Analysis Hub (Light)
3. Product Detail (Light)
4. Settings (Light)
```

---

## Phase 5: Micro-interactions (🟡 고급)

### 5.1 애니메이션 유형

```
1. Page Transitions
   - 슬라이드 (좌→우, 아래→위)
   - 페이드
   - 스케일

2. Component Animations
   - Button press: scale(0.95)
   - Card hover: translateY(-2px), shadow
   - Toggle: spring animation
   - Progress: ease-out fill

3. Loading Animations
   - Skeleton pulse
   - Spinner rotation
   - Progress bar fill

4. Feedback Animations
   - Success checkmark
   - Error shake
   - Confetti celebration
```

### 5.2 애니메이션 요청 프롬프트

```markdown
## Request: Micro-interactions

### Button Press
- 0ms: scale(1)
- 50ms: scale(0.95)
- 150ms: scale(1)
- Easing: ease-out

### Card Tap
- Touch start: opacity(0.8)
- Touch end: ripple effect from touch point

### Analysis Complete
- 0ms: 결과 카드 scale(0.8), opacity(0)
- 200ms: scale(1.05), opacity(1)
- 400ms: scale(1)
- 500ms: 컨페티 파티클 시작
```

---

## Phase 6: 접근성 (🔴 필수)

### 6.1 WCAG 2.1 AA 체크리스트

```
색상 대비
- [ ] 일반 텍스트: 4.5:1 이상
- [ ] 큰 텍스트 (18px+): 3:1 이상
- [ ] UI 컴포넌트: 3:1 이상

터치 타겟
- [ ] 최소 44x44px
- [ ] 인접 요소 간격 8px+

텍스트
- [ ] 최소 14px (모바일)
- [ ] 줄 높이 1.5 이상
- [ ] 단락 간격 명확

포커스 표시
- [ ] 명확한 포커스 링
- [ ] 키보드 네비게이션

스크린 리더
- [ ] 의미 있는 alt 텍스트
- [ ] aria-label 필요 시
- [ ] heading 계층 구조
```

### 6.2 접근성 요청 프롬프트

```markdown
## Request: Accessibility Audit

각 화면에서 접근성 검증:

1. 색상 대비 체크
   - 모든 텍스트 조합의 대비 비율 표시
   - 미달 항목 하이라이트

2. 터치 타겟 체크
   - 44px 미만 요소 표시
   - 인접 거리 표시

3. 포커스 순서
   - 논리적 탭 순서 다이어그램
   - 포커스 상태 시각화
```

---

## 요청 순서 권장

### 최소 MVP (40개 요청)
```
1. Phase 1: 페이지 (50화면, 5 requests)
2. Phase 2: Atoms/Molecules (2 requests)
3. Phase 3: 핵심 화면 상태 (3 requests)
   합계: 10 requests
```

### 완전한 버전 (80개 요청)
```
1. Phase 1: 페이지 (50화면, 5 requests)
2. Phase 2: 전체 컴포넌트 (4 requests)
3. Phase 3: 모든 상태 (10 requests)
4. Phase 4: Tablet/Desktop (5 requests)
5. Phase 5: Light Mode (3 requests)
6. Phase 6: 애니메이션 (3 requests)
   합계: 30 requests
```

### 궁극의 버전 (150+ 산출물)
```
1. 위 모든 것
2. 디자인 시스템 문서
3. Figma/Sketch 파일
4. 애니메이션 프로토타입
5. 접근성 감사 리포트
6. 개발자 핸드오프 가이드
```

---

## 품질 게이트

### G1: 컴포넌트 완성도
- [ ] 모든 Atom 정의됨
- [ ] 모든 Molecule 정의됨
- [ ] 상태별 변형 존재

### G2: 화면 완성도
- [ ] 50개 기본 화면
- [ ] Loading/Empty/Error 상태
- [ ] 반응형 레이아웃

### G3: 일관성
- [ ] 디자인 토큰 100% 준수
- [ ] 컴포넌트 재사용 90%+
- [ ] 브랜딩 일관성 100%

### G4: 접근성
- [ ] 색상 대비 통과
- [ ] 터치 타겟 통과
- [ ] 스크린 리더 호환

---

## 예상 산출물 목록

### 이미지/목업 (150+)
```
screens/
├── pages/                 # 50개 기본 화면
│   ├── 01-splash.png
│   ├── 02-onboarding-1.png
│   └── ...
├── states/                # 상태별 변형
│   ├── dashboard-loading.png
│   ├── dashboard-empty.png
│   └── ...
├── components/            # 컴포넌트 라이브러리
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
├── responsive/            # 반응형
│   ├── tablet/
│   └── desktop/
└── light-mode/            # 라이트 모드
```

### 문서
```
docs/
├── design-tokens.json
├── component-specs.md
├── animation-guide.md
├── accessibility-report.md
└── handoff-guide.md
```

---

## 다음 단계 권장

### 즉시 실행 (이번 세션)
1. ✅ Phase 0 완료 (디자인 토큰)
2. 🔄 Phase 1 실행 (기본 50화면)

### 다음 세션
3. Phase 2 컴포넌트 라이브러리
4. Phase 3 상태별 변형

### 고도화 세션
5. Phase 4 반응형
6. Phase 5 Light Mode
7. Phase 6 애니메이션

---

**Document Version**: 1.0
**Created**: 2026-01-21
**Goal**: 궁극의 이룸 UI/UX 완성
