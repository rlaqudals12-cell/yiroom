# 이룸 (Yiroom) 프로젝트

> AI 기반 통합 웰니스 플랫폼

## 🎯 프로젝트 개요

```yaml
서비스명: 이룸 (Yiroom)
의미: "이루다" + "Room" = 아름다움을 이루는 공간
타겟: 한국 10~30대 여성 (1차), 전 연령 (2차)
핵심 가치: 퍼스널 컬러 기반 통합 뷰티/웰니스 추천
```

## 📦 모듈 구성

| 모듈 | 상태 | 설명 |
|------|------|------|
| **PC-1** | ✅ 완료 | 퍼스널 컬러 진단 (통합 온보딩) |
| **S-1** | ✅ 완료 | AI 피부 분석 |
| **C-1** | ✅ 완료 | AI 체형 분석 |
| **W-1** | 🚧 개발중 | AI 운동 추천 |
| **N-1** | 📋 계획 | AI 영양 분석 |

## 🛠 기술 스택

```yaml
Frontend:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript 5.x
  - Tailwind CSS
  - Zustand (상태 관리)

Backend:
  - Supabase (PostgreSQL)
  - Supabase Auth + Clerk
  - Edge Functions

AI:
  - Google Gemini API (Vision + Text)
  - 이미지 분석: gemini-1.5-flash
  - 텍스트 생성: gemini-1.5-pro

Infra:
  - Vercel (배포)
  - Supabase Cloud (DB)
```

## 📁 프로젝트 구조

```
yiroom/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 페이지
│   │   ├── (main)/             # 메인 대시보드
│   │   ├── personal-color/     # PC-1 퍼스널 컬러
│   │   ├── skin/               # S-1 피부 분석
│   │   ├── body/               # C-1 체형 분석
│   │   ├── workout/            # W-1 운동 모듈 ← 현재 개발
│   │   │   ├── onboarding/     # 입력 7단계
│   │   │   ├── result/         # 추천 결과
│   │   │   ├── routine/        # 주간 루틴
│   │   │   └── history/        # 운동 기록
│   │   ├── nutrition/          # N-1 영양 모듈 ← 다음 개발
│   │   └── api/                # API 라우트
│   │       ├── workout/        # W-1 API
│   │       ├── nutrition/      # N-1 API
│   │       └── ai/             # Gemini 통합
│   ├── components/
│   │   ├── ui/                 # 기본 UI (Button, Card, Input)
│   │   ├── common/             # 공통 (Header, Footer, Loading)
│   │   └── [module]/           # 모듈별 컴포넌트
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트
│   │   ├── gemini/             # Gemini API 유틸
│   │   └── utils/              # 공통 유틸
│   ├── stores/                 # Zustand 스토어
│   ├── types/                  # TypeScript 타입
│   └── data/                   # 정적 데이터 (운동 DB 등)
├── supabase/
│   └── migrations/             # DB 마이그레이션
├── docs/                       # 개발 문서
│   ├── W-1-sprint-backlog-v1.4.md
│   └── N-1-sprint-backlog-v1.3.md
└── public/                     # 정적 파일
```

## 📐 코딩 컨벤션

```yaml
파일명:
  - 컴포넌트: PascalCase.tsx (WorkoutCard.tsx)
  - 유틸/훅: camelCase.ts (useWorkout.ts)
  - 페이지: kebab-case (page.tsx in /workout-result/)

변수/함수:
  - 변수: camelCase (userName, exerciseList)
  - 상수: UPPER_SNAKE_CASE (MAX_EXERCISES, API_TIMEOUT)
  - 타입/인터페이스: PascalCase (Exercise, WorkoutPlan)
  - 컴포넌트: PascalCase (WorkoutCard, ExerciseItem)

컴포넌트 구조:
  1. imports
  2. types/interfaces
  3. component function
  4. hooks
  5. handlers
  6. render helpers
  7. return JSX

Git 커밋:
  - feat: 새 기능
  - fix: 버그 수정
  - refactor: 리팩토링
  - docs: 문서
  - style: 스타일링
  - test: 테스트
  - chore: 기타
  예시: "feat(W-1): Task 1.5 C-1 데이터 확인 화면 구현"
```

## 🔗 크로스 모듈 데이터 흐름

```
PC-1 (퍼스널 컬러)
  ├──→ S-1: 피부톤 기반 스킨케어 추천
  ├──→ C-1: 체형 + 컬러 기반 스타일링
  ├──→ W-1: 운동복 색상 추천
  └──→ N-1: (연동 없음)

C-1 (체형)
  ├──→ W-1: 체형 기반 운동 추천 ⭐ 핵심
  └──→ N-1: 키/체중 → BMR/TDEE 계산

S-1 (피부)
  └──→ N-1: 피부 고민 → 피부 친화 음식 추천

W-1 (운동)
  └──→ N-1: 운동 완료 → 단백질 보충 알림
```

## 📊 주요 DB 테이블

```sql
-- 사용자
users (id, clerk_user_id, email, name, gender, birth_date)

-- 분석 결과
personal_color_analyses (user_id, season_type, sub_type, ...)
skin_analyses (user_id, skin_type, concerns, ...)
body_analyses (user_id, body_type, height, weight, ...)

-- W-1 운동 (개발 중)
workout_settings (user_id, goals, frequency, equipment, ...)
workout_sessions (user_id, date, exercises, duration, ...)
exercises (id, name, category, body_parts, difficulty, ...)

-- N-1 영양 (예정)
nutrition_settings (user_id, goal, bmr, tdee, ...)
meal_logs (user_id, date, meal_type, foods, ...)
```

## 🎮 Claude Code 사용 가이드

### 개발 시작 전
```bash
# 1. Plan Mode로 코드베이스 탐색
> /plan 이 프로젝트의 구조를 파악하고 싶어요

# 2. 현재 Sprint 범위 확인
> docs/W-1-sprint-backlog-v1.4.md 파일을 읽고 
> 이번 Sprint의 Task 목록을 정리해주세요
```

### Task 구현 시
```bash
# 복잡도 낮음 (🟢)
> Task 1.14를 구현해주세요. data/exercises/upper-body.json

# 복잡도 중간 (🟡)
> Task 1.5를 구현해주세요.
> 먼저 Plan Mode로 관련 파일을 확인하고,
> 테스트를 먼저 작성한 후 구현해주세요.

# 복잡도 높음 (🔴)
> Task 2.5를 구현해야 합니다. Think hard about:
> 1. Gemini Vision API 최적 프롬프트
> 2. 에러 핸들링 전략
> 3. 기존 S-1 API 패턴과의 일관성
```

### 디버깅
```bash
> [에러 메시지 붙여넣기]
> 코드베이스를 분석하고 문제를 해결해주세요.
```

### 테스트
```bash
> 이 컴포넌트의 테스트를 작성해주세요.
> Given-When-Then 패턴으로 수락 기준을 테스트해주세요.
```

## 📌 주요 참고 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| W-1 Sprint Backlog | `docs/W-1-sprint-backlog-v1.4.md` | 91개 Task 상세 |
| N-1 Sprint Backlog | `docs/N-1-sprint-backlog-v1.3.md` | 59개 Task 상세 |
| DB 스키마 | `docs/Database-스키마-v2.5.md` | 테이블 정의 |
| 기능 스펙 | `docs/W-1-feature-spec-template-v1.1.md` | 상세 기능 명세 |
| 프롬프트 템플릿 | `docs/prompts/` | Task 유형별 프롬프트 |

## ⚠️ 주의사항

```yaml
API 키:
  - Gemini API 키: 환경변수 (GEMINI_API_KEY)
  - Supabase: 환경변수 (SUPABASE_URL, SUPABASE_ANON_KEY)
  - 절대 코드에 하드코딩 금지

성능:
  - Gemini API 호출은 3초 타임아웃
  - 이미지 업로드 최대 5MB
  - 무한 스크롤 페이지네이션 적용

보안:
  - 모든 API 라우트 인증 필수
  - RLS 정책 적용 (user_id 기반)
  - 민감 정보 클라이언트 노출 금지
```

---

**최종 업데이트**: 2025-11-27  
**현재 개발**: Phase 2 - W-1 운동 모듈

---

## ✏️ 커스터마이징 가이드

> 실제 프로젝트에 맞게 이 파일을 수정하세요.

### 필수 수정 항목

```yaml
1. 프로젝트 구조:
   - 📁 프로젝트 구조 섹션의 디렉토리 트리를
   - 실제 프로젝트의 `tree` 명령 결과로 교체

2. 모듈 상태:
   - 📦 모듈 구성 섹션의 상태(✅/🚧/📋)를
   - 실제 개발 진행 상황에 맞게 업데이트

3. DB 테이블:
   - 📊 주요 DB 테이블 섹션을
   - 실제 Supabase 스키마로 교체

4. 문서 경로:
   - 📌 주요 참고 문서 섹션의 경로를
   - 실제 docs/ 폴더 구조에 맞게 수정
```

### 선택 수정 항목

```yaml
5. 코딩 컨벤션:
   - 팀 컨벤션에 맞게 조정
   - ESLint/Prettier 규칙과 동기화

6. 기술 스택:
   - 버전 정보 최신화
   - 추가 라이브러리 명시

7. 크로스 모듈 흐름:
   - 새 모듈 추가 시 업데이트
   - 연동 관계 변경 시 수정
```

### 자동 업데이트 스크립트 (선택)

```bash
# docs/update-claude-md.sh
#!/bin/bash

# 프로젝트 구조 자동 생성
echo "## 📁 프로젝트 구조" > structure.tmp
echo '```' >> structure.tmp
tree -I 'node_modules|.next|.git' -L 3 >> structure.tmp
echo '```' >> structure.tmp

# CLAUDE.md에 삽입 (수동)
echo "structure.tmp 생성 완료. CLAUDE.md에 복사하세요."
```

### 버전 관리

```
CLAUDE.md 변경 시:
- 최종 업데이트 날짜 수정
- 현재 개발 단계 수정
- Git 커밋: "docs: CLAUDE.md 업데이트 (Phase X)"
```
