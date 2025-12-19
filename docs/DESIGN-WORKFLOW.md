# 이룸 디자인 워크플로우

> **작성일**: 2025-12-13
> **적용 시점**: 기능 점검 완료 후
> **목적**: Cursor Visual Editor + Gemini 3를 활용한 디자인-코드 통합 워크플로우

---

## 1. 개요

### 배경

기존 디자인 작업 흐름:
```
Figma 디자인 → 수동 코드 변환 → 검토 → 수정 반복
```

새로운 워크플로우:
```
Cursor Visual Editor → AI 자동 코드 생성 → 검증 → 배포
```

### 이룸 프로젝트 호환성

| 항목 | 이룸 스택 | Visual Editor 지원 |
|------|----------|-------------------|
| 프레임워크 | Next.js 16 + React 19 | ✅ React 최적화 |
| 스타일 | Tailwind CSS v4 | ✅ CSS 변수/토큰 지원 |
| 컴포넌트 | shadcn/ui + Radix | ✅ Props 인스펙션 |
| 디자인 토큰 | oklch 기반 CSS 변수 | ✅ 토큰 인식 |

---

## 2. 도구 스택

### 2.1 Cursor Visual Editor

**출시일**: 2025-12-11 (Cursor 2.2)

| 기능 | 설명 | 이룸 활용 예시 |
|------|------|---------------|
| **드래그 앤 드롭** | DOM 요소 직접 이동 | 대시보드 카드 순서 변경 |
| **Props 인스펙션** | 컴포넌트 속성 실시간 수정 | Button, Card variant 조정 |
| **비주얼 스타일 컨트롤** | 슬라이더/색상 피커 | 다크모드 색상 미세 조정 |
| **Point-and-Prompt** | 클릭 후 자연어 명령 | "이 버튼 더 크게" |
| **병렬 프롬프트** | 여러 요소 동시 수정 | 3개 카드 색상 한번에 변경 |
| **디자인 토큰 연동** | CSS 변수 자동 인식 | `--primary`, `--module-workout` |

#### 병렬 프롬프트 활용

Visual Editor의 강력한 기능 중 하나는 **여러 프롬프트 동시 실행**입니다:

```
예시: 대시보드 UI 일괄 수정

1. AnalysisCard 클릭 → "배경색 더 밝게"
2. WorkoutCard 클릭 → "아이콘 크기 20% 증가"
3. NutritionCard 클릭 → "그림자 추가"

→ AI가 3개 요청을 병렬로 처리 (수 초 내 완료)
```

**장점**:
- 일관된 스타일 변경 시 시간 절약
- 여러 컴포넌트 동시 비교 가능
- 변경 사항 한번에 커밋 가능

### 2.2 Gemini 3 Pro

**출시일**: 2025-11 (Google)

| 벤치마크 | 점수 | 의미 |
|----------|------|------|
| LMArena | 1501 Elo | 1위 |
| HumanEval | 84.8% | 코드 생성 우수 |
| 프론트엔드/비주얼 | 상위권 | **디자인 작업 강점** |

**강점**:
- 비주얼 태스크 (UI/UX) 우수
- React/Tailwind 코드 생성 정확도 높음
- Cursor Visual Editor 내장 통합

### 2.3 Claude Code

**역할**: 비즈니스 로직 검증, 테스트, 스펙 문서

| 강점 | 활용 |
|------|------|
| 복잡한 추론 | 비즈니스 로직 구현 |
| 긴 컨텍스트 | 전체 코드베이스 이해 |
| SDD 워크플로우 | 스펙 기반 개발 |

---

## 3. 역할 분배

### AI 도구별 담당 영역

```
┌─────────────────────────────────────────────────────────────┐
│                    이룸 개발 워크플로우                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              UI/디자인 작업                          │   │
│  │                                                     │   │
│  │   Cursor Visual Editor + Gemini 3 Pro              │   │
│  │   ├── 레이아웃 조정 (드래그 앤 드롭)                  │   │
│  │   ├── 색상/스타일 튜닝 (비주얼 컨트롤)               │   │
│  │   ├── 컴포넌트 Props 수정                           │   │
│  │   └── Point-and-Prompt UI 변경                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              로직/품질 검증                          │   │
│  │                                                     │   │
│  │   Claude Code                                       │   │
│  │   ├── 생성된 코드 품질 검토                          │   │
│  │   ├── 비즈니스 로직 구현                             │   │
│  │   ├── 테스트 작성/실행                               │   │
│  │   └── DESIGN-SYSTEM.md 동기화                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 작업 유형별 도구 선택

| 작업 유형 | 권장 도구 | 이유 |
|----------|----------|------|
| 레이아웃 변경 | Visual Editor | 시각적 조작 |
| 색상/스타일 조정 | Visual Editor + Gemini 3 | 실시간 프리뷰 |
| 새 컴포넌트 생성 | Gemini 3 | 코드 생성 강점 |
| 비즈니스 로직 | Claude Code | 복잡한 추론 |
| 테스트 작성 | Claude Code | 전체 컨텍스트 이해 |
| 버그 수정 | Claude Code | 디버깅 강점 |
| 스펙 문서 | Claude Code | SDD 워크플로우 |

---

## 4. 워크플로우

### 4.1 기본 흐름

```
Step 1: 디자인 요구사항 정의
    │
    ▼
Step 2: Cursor Visual Editor로 시각적 조정
    │   └── 드래그 앤 드롭, 스타일 컨트롤
    │
    ▼
Step 3: Gemini 3 Point-and-Prompt (선택)
    │   └── "이 카드 간격 넓히고 그림자 추가"
    │
    ▼
Step 4: 코드 자동 생성/적용
    │
    ▼
Step 5: Claude Code로 검증
    │   ├── 코드 품질 검토
    │   ├── 테스트 실행 (npm run test)
    │   └── DESIGN-SYSTEM.md 업데이트
    │
    ▼
Step 6: 커밋 & 배포
```

### 4.2 시나리오별 예시

#### 시나리오 A: 대시보드 카드 레이아웃 변경

```
1. Cursor Browser에서 대시보드 페이지 열기
2. Visual Editor 활성화
3. AnalysisCard 드래그하여 순서 변경
4. 간격 슬라이더로 gap 조정
5. 변경 사항 코드에 적용
6. npm run test로 검증
```

#### 시나리오 B: 다크모드 색상 미세 조정

```
1. Visual Editor에서 다크모드 활성화
2. 색상 피커로 --module-workout 조정
3. 실시간 프리뷰 확인
4. globals.css에 변경 반영
5. DESIGN-SYSTEM.md 색상표 업데이트
```

#### 시나리오 C: 새 컴포넌트 디자인

```
1. Gemini 3에게 프롬프트:
   "WorkoutTypeCard와 비슷한 스타일로
    NutritionTypeCard 컴포넌트 만들어줘"
2. 생성된 코드 Visual Editor로 미세 조정
3. Claude Code로 Props 타입 검증
4. 테스트 작성
```

---

## 5. 설정 가이드

### 5.1 Gemini 3 API 키 발급

```bash
# 1. Google AI Studio 접속
https://aistudio.google.com/apikey

# 2. API 키 생성 (Gemini 3 Pro 선택)

# 3. 환경 변수에 추가 (로컬)
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 5.2 Cursor 모델 설정

```
1. Cursor 설정 (Cmd/Ctrl + ,)
2. Models → Custom Models
3. Add Model:
   - Name: Gemini 3 Pro
   - Provider: Google AI
   - API Key: (위에서 발급한 키)
4. 기본 모델로 설정 (디자인 작업 시)
```

### 5.3 Visual Editor 활성화

```
1. Cursor Browser 열기 (개발 서버 실행 중)
2. 우측 상단 Visual Editor 아이콘 클릭
3. 또는 Cmd/Ctrl + Shift + V
```

---

## 6. 이룸 컴포넌트 매핑

### Visual Editor로 수정 가능한 주요 컴포넌트

| 컴포넌트 | 위치 | 수정 가능 항목 |
|----------|------|---------------|
| `AnalysisCard` | `app/(main)/dashboard/` | 레이아웃, 색상 |
| `WorkoutTypeCard` | `components/workout/result/` | 아이콘, 색상, 텍스트 |
| `NutrientBarChart` | `components/nutrition/` | 막대 색상, 간격 |
| `CalorieProgressRing` | `components/nutrition/` | 링 색상, 크기 |
| `ExerciseCard` | `components/workout/common/` | 카드 스타일 |
| `MealSection` | `components/nutrition/` | 레이아웃 |
| `StreakBadge` | `components/workout/streak/` | 배지 스타일 |

### 디자인 토큰 (CSS 변수)

Visual Editor에서 자동 인식되는 토큰:

#### 라이트 모드 (기본)

```css
/* 브랜드 색상 */
--primary: oklch(0.53 0.23 262);            /* 이룸 블루 #2e5afa */
--primary-foreground: oklch(0.98 0.005 270);
--secondary: oklch(0.93 0.02 270);          /* #e6e9f4 */

/* 모듈 색상 (기본 | Light | Dark) */
--module-workout: oklch(0.85 0.15 45);           /* 오렌지 */
--module-workout-light: oklch(0.95 0.08 45);
--module-workout-dark: oklch(0.65 0.18 45);

--module-nutrition: oklch(0.75 0.15 150);        /* 그린 */
--module-nutrition-light: oklch(0.92 0.08 150);
--module-nutrition-dark: oklch(0.55 0.18 150);

--module-skin: oklch(0.80 0.12 350);             /* 핑크 */
--module-skin-light: oklch(0.95 0.06 350);
--module-skin-dark: oklch(0.60 0.15 350);

--module-body: oklch(0.75 0.15 250);             /* 퍼플 */
--module-body-light: oklch(0.92 0.08 250);
--module-body-dark: oklch(0.55 0.18 250);

--module-personal-color: oklch(0.70 0.18 300);   /* 마젠타 */
--module-personal-color-light: oklch(0.90 0.10 300);
--module-personal-color-dark: oklch(0.50 0.20 300);

/* 상태 색상 */
--status-success: oklch(0.72 0.17 142);   /* 성공/완료 */
--status-warning: oklch(0.80 0.16 85);    /* 경고/주의 */
--status-error: oklch(0.65 0.22 25);      /* 오류/실패 */
--status-info: oklch(0.70 0.15 230);      /* 정보 */
```

#### 다크 모드

```css
.dark {
  --background: oklch(0.15 0.02 270);
  --foreground: oklch(0.95 0.01 270);
  --primary: oklch(0.60 0.20 262);              /* 다크모드 이룸 블루 */
  --muted: oklch(0.25 0.02 270);
  --muted-foreground: oklch(0.65 0.05 270);
  --border: oklch(0.30 0.02 270);
  --card: oklch(0.18 0.02 270);
}
```

> **참고**: 전체 토큰 목록은 [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) 참조

---

## 7. 주의사항

### 7.1 필수 규칙

| 규칙 | 설명 |
|------|------|
| **DESIGN-SYSTEM.md 동기화** | 색상/토큰 변경 시 문서 업데이트 필수 |
| **SDD 원칙 유지** | 큰 변경은 스펙 문서 먼저 |
| **테스트 필수** | UI 변경 후 `npm run test` 실행 |
| **의미 있는 커밋** | Visual Editor 변경도 단위별 커밋 |

### 7.2 Visual Editor 제한사항

| 항목 | 제한 |
|------|------|
| Server Component | 직접 수정 불가 (클라이언트로 래핑 필요) |
| 복잡한 로직 | 시각적 수정만 가능 |
| 동적 스타일 | 정적 값만 조정 가능 |

### 7.3 Gemini 3 주의점

| 항목 | 권장 |
|------|------|
| 프롬프트 구체성 | 명확한 지시 필요 |
| 코드 검증 | 생성된 코드는 Claude로 검토 |
| 비용 관리 | API 사용량 모니터링 |

### 7.4 롤백 가이드

Visual Editor 작업 중 문제 발생 시 복구 방법:

#### 즉시 롤백 (Cursor 내)

```bash
# Cursor에서 Cmd/Ctrl + Z로 실행 취소
# 여러 변경 사항은 여러 번 실행 취소 필요
```

#### Git 기반 롤백

```bash
# 현재 변경 사항 확인
git status
git diff

# 특정 파일만 롤백
git checkout HEAD -- path/to/component.tsx

# 모든 변경 사항 롤백
git checkout HEAD -- .

# 커밋 후 롤백이 필요한 경우
git revert HEAD  # 새 커밋으로 되돌리기
```

#### 롤백 시나리오별 대응

| 시나리오 | 대응 |
|----------|------|
| 스타일이 깨진 경우 | `git diff`로 변경점 확인 → 문제 부분만 롤백 |
| 테스트 실패 | `npm run test` 실패 파일 확인 → 해당 컴포넌트 롤백 |
| 빌드 오류 | `npm run typecheck` 에러 확인 → 타입 오류 수정 |
| 전체 작업 취소 | `git stash` 후 처음부터 재시작 |

#### 예방 조치

```bash
# 큰 변경 전 브랜치 생성
git checkout -b design/dashboard-update

# 작업 중간중간 커밋
git add -p  # 변경 사항 선택적 스테이징
git commit -m "WIP: 대시보드 카드 레이아웃 조정"

# 문제 없으면 메인에 머지
git checkout main
git merge design/dashboard-update
```

---

## 8. 체크리스트

### 디자인 작업 전 체크리스트

- [ ] 개발 서버 실행 (`npm run dev:web`)
- [ ] Cursor Visual Editor 활성화
- [ ] 변경할 컴포넌트 위치 확인
- [ ] 관련 디자인 토큰 확인 (DESIGN-SYSTEM.md)

### 디자인 작업 후 체크리스트

- [ ] 라이트/다크 모드 모두 확인
- [ ] 모바일 반응형 확인
- [ ] `npm run typecheck` 통과
- [ ] `npm run test` 통과
- [ ] DESIGN-SYSTEM.md 업데이트 (필요시)
- [ ] 의미 있는 커밋 메시지 작성

---

## 9. 참고 자료

### 공식 문서

- [Cursor Visual Editor Blog](https://cursor.com/blog/browser-visual-editor)
- [Gemini 3 개발자 가이드](https://blog.google/technology/developers/gemini-3-developers/)
- [Cursor Changelog](https://cursor.com/changelog)

### 이룸 프로젝트 문서

| 문서 | 내용 |
|------|------|
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | 색상, 폰트, 토큰 정의 |
| [ROADMAP-PHASE-NEXT.md](ROADMAP-PHASE-NEXT.md) | 전체 개발 로드맵 |
| [CLAUDE.md](../CLAUDE.md) | 프로젝트 개발 가이드 |

---

**Version**: 1.1 | **Updated**: 2025-12-13
