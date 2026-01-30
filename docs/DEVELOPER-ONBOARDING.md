# 새 개발자 온보딩 가이드

> **목표**: 24시간 내 첫 PR 생성
> **Version**: 1.0 | **Created**: 2026-01-23

---

## 목차

1. [개요](#1-개요)
2. [환경 설정](#2-환경-설정)
3. [프로젝트 셋업](#3-프로젝트-셋업)
4. [로컬 실행](#4-로컬-실행)
5. [아키텍처 개요](#5-아키텍처-개요)
6. [개발 워크플로우](#6-개발-워크플로우)
7. [핵심 문서 링크](#7-핵심-문서-링크)
8. [첫 이슈 체크리스트](#8-첫-이슈-체크리스트)

---

## 1. 개요

### 이룸(Yiroom)이란?

- **앱 이름**: 이룸 (Yiroom)
- **슬로건**: "온전한 나는?" / "Know yourself, wholly."
- **핵심 철학**: 사용자의 변화를 돕는 **통합 웰니스 AI 플랫폼**

### 핵심 기능

| Phase | 모듈 | 설명 |
|-------|------|------|
| 1 | PC-1, S-1, C-1 | 퍼스널컬러, 피부, 체형 분석 |
| 2 | W-1, N-1, R-1 | 운동, 영양, 리포트 |
| A-M | 제품DB, 소셜, AI상담 등 | 어필리에이트, 온보딩, 영양고도화 |

### 3대 개발 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지 - `docs/specs/` 확인
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 `typecheck + lint + test` 통과 필수

---

## 2. 환경 설정

### 2.1 필수 도구

| 도구 | 최소 버전 | 설치 확인 |
|------|----------|----------|
| **Node.js** | 18.x+ (권장 20.x) | `node --version` |
| **npm** | 10.x+ | `npm --version` |
| **Git** | 2.40+ | `git --version` |

```bash
# Node.js 설치 (Windows)
# https://nodejs.org/en/download/ 에서 LTS 버전 다운로드

# 또는 nvm 사용 (권장)
nvm install 20
nvm use 20
```

### 2.2 권장 IDE: VS Code

#### 필수 확장

| 확장 | 용도 |
|------|------|
| **ESLint** | 코드 린팅 |
| **Prettier** | 코드 포맷팅 |
| **Tailwind CSS IntelliSense** | Tailwind 자동완성 |
| **TypeScript** | 내장 (최신 버전 권장) |
| **Playwright Test for VSCode** | E2E 테스트 |

#### 권장 확장

| 확장 | 용도 |
|------|------|
| **Error Lens** | 인라인 에러 표시 |
| **GitLens** | Git 히스토리 시각화 |
| **Auto Rename Tag** | HTML/JSX 태그 자동 수정 |
| **Path Intellisense** | 파일 경로 자동완성 |

#### VS Code 설정 (권장)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## 3. 프로젝트 셋업

### 3.1 저장소 클론

```bash
# HTTPS
git clone https://github.com/your-org/yiroom.git

# SSH (권장)
git clone git@github.com:your-org/yiroom.git

cd yiroom
```

### 3.2 의존성 설치

```bash
# 루트에서 실행 (모노레포 전체)
npm install
```

> **참고**: 이 프로젝트는 npm workspaces를 사용합니다. `package.json`의 `workspaces` 설정에 따라 `apps/*`와 `packages/*`의 의존성이 자동으로 설치됩니다.

### 3.3 환경변수 설정

```bash
# 웹 앱 환경변수
cd apps/web
cp .env.example .env.local
```

#### 필수 환경변수 (웹)

`.env.local` 파일을 열고 다음 값을 입력하세요:

```bash
# Clerk 인증 (필수)
# https://dashboard.clerk.com 에서 발급
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase 데이터베이스 (필수)
# https://supabase.com/dashboard 에서 발급
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (Gemini) - AI 분석용 (필수)
# https://aistudio.google.com/apikey 에서 발급
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

#### 선택 환경변수

```bash
# 개발용 설정 (AI 없이 테스트 시)
FORCE_MOCK_AI=true

# Sentry 에러 모니터링 (선택)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

> **Tip**: 개발 환경에서 AI 없이 테스트하려면 `FORCE_MOCK_AI=true`를 설정하세요.

### 3.4 설치 확인

```bash
# 타입 체크
npm run typecheck

# 린트
npm run lint

# 테스트
npm run test
```

---

## 4. 로컬 실행

### 4.1 개발 서버 시작

```bash
# 모든 앱 동시 실행 (루트에서)
npm run dev

# 웹 앱만 실행
npm run dev:web
```

| 앱 | URL |
|-----|-----|
| **웹** | http://localhost:3000 |
| **Storybook** | http://localhost:6006 (별도 실행 필요) |

```bash
# Storybook 실행 (컴포넌트 문서)
cd apps/web
npm run storybook
```

### 4.2 Supabase 로컬 (선택)

> 프로덕션 Supabase를 사용하거나, 로컬 Supabase를 설정할 수 있습니다.

```bash
# Supabase CLI 설치
npm install -g supabase

# 로컬 Supabase 시작
supabase start

# 로컬 Supabase 상태 확인
supabase status

# 마이그레이션 적용
supabase db push
```

### 4.3 개발 중 유용한 명령어

```bash
# 웹 앱 디렉토리에서
cd apps/web

# 단위 테스트 (watch 모드)
npm run test -- --watch

# 특정 테스트 파일 실행
npm run test -- path/to/file.test.ts

# E2E 테스트
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui

# 테스트 커버리지
npm run test:coverage
```

---

## 5. 아키텍처 개요

### 5.1 모노레포 구조

```
yiroom/
├── apps/
│   ├── web/              # Next.js 웹 앱 (메인)
│   └── mobile/           # Expo 모바일 앱
├── packages/
│   └── shared/           # 공통 타입/유틸리티
├── docs/                 # 설계 문서
│   ├── principles/       # 도메인 원리
│   ├── adr/              # 기술 결정 기록
│   └── specs/            # 구현 스펙
└── .claude/              # Claude Code 설정
    ├── rules/            # 코딩 규칙
    ├── agents/           # 전문 에이전트
    └── commands/         # 슬래시 명령어
```

### 5.2 주요 기술 스택

| 영역 | 웹 (apps/web) | 모바일 (apps/mobile) |
|------|---------------|---------------------|
| **Framework** | Next.js 16 + React 19 | Expo SDK 54 + React Native |
| **언어** | TypeScript | TypeScript |
| **스타일링** | Tailwind CSS v4 + shadcn/ui | NativeWind |
| **인증** | Clerk | Clerk |
| **데이터베이스** | Supabase (PostgreSQL) | Supabase |
| **AI** | Google Gemini 3 Flash | - |
| **상태관리** | Zustand | React Context |
| **폼** | React Hook Form + Zod | - |
| **테스팅** | Vitest + Playwright | Jest |

### 5.3 핵심 패턴

#### RLS (Row Level Security)

모든 테이블에 `clerk_user_id` 기반 RLS 정책 필수:

```sql
-- 예시: 본인 데이터만 접근
CREATE POLICY "user_own_data" ON skin_assessments
  FOR ALL
  USING (clerk_user_id = auth.get_user_id());
```

#### Hybrid Data Pattern (Mock Fallback)

모든 AI 호출에 Fallback 필수:

```typescript
try {
  const result = await analyzeWithGemini(input);
  return result;
} catch (error) {
  console.error('[Module] Gemini error, falling back to mock:', error);
  return generateMockResult(input);  // Fallback
}
```

#### Repository 패턴

```
lib/
├── supabase/         # DB 클라이언트
├── api/              # Repository 패턴 (도메인별)
├── products/         # 제품 Repository
└── gemini.ts         # AI 분석 (3초 타임아웃 + 2회 재시도)
```

### 5.4 라우트 구조 (웹)

```
app/
├── (main)/           # 메인 레이아웃 그룹
│   ├── analysis/     # PC-1, S-1, C-1 분석
│   ├── workout/      # W-1 운동
│   ├── nutrition/    # N-1 영양
│   ├── dashboard/    # 대시보드
│   ├── products/     # 제품 추천
│   └── profile/      # 프로필
├── (auth)/           # 인증 관련
├── api/              # API 라우트
└── admin/            # 관리자
```

---

## 6. 개발 워크플로우

### 6.1 브랜치 전략

```
main                    # 프로덕션 (보호됨)
├── feature/xxx         # 기능 개발
├── fix/issue-123       # 버그 수정
├── refactor/xxx        # 리팩토링
└── docs/xxx            # 문서 작업
```

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feature/` | 새 기능 | `feature/coach-chat` |
| `fix/` | 버그 수정 | `fix/skin-analysis-timeout` |
| `refactor/` | 리팩토링 | `refactor/api-structure` |
| `docs/` | 문서 | `docs/onboarding-guide` |
| `hotfix/` | 긴급 수정 | `hotfix/auth-error` |

### 6.2 커밋 컨벤션 (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

#### Types

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 포매팅 (코드 변경 없음) |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드/설정 변경 |

#### 예시

```bash
feat(pc1): 퍼스널컬러 분석 결과 공유 기능 추가
fix(api): 피부 분석 API 429 에러 재시도 로직 수정
docs(onboarding): 신규 개발자 온보딩 가이드 작성
```

### 6.3 PR 프로세스

#### PR 생성 전 체크리스트

```bash
# 1. 최신 main 반영
git fetch origin
git rebase origin/main

# 2. 린트 및 타입 체크
npm run lint
npm run typecheck

# 3. 테스트 실행
npm run test

# 4. 포맷팅
npm run format
```

#### PR 템플릿

```markdown
## 요약
[변경 사항 1-2문장 설명]

## 변경 유형
- [ ] 새 기능 (feat)
- [ ] 버그 수정 (fix)
- [ ] 리팩토링 (refactor)
- [ ] 문서 (docs)

## 테스트
- [ ] 단위 테스트 추가/수정
- [ ] 수동 테스트 완료
- [ ] 기존 테스트 통과

## 스크린샷 (UI 변경 시)
[Before/After 이미지]
```

#### 리뷰 체크리스트

| 항목 | 기준 |
|------|------|
| 코드 스타일 | 린트/타입체크 통과 |
| 테스트 커버리지 | 70% 이상 |
| 보안 | OWASP 체크 |
| 성능 | 번들 크기, API 응답 |

---

## 7. 핵심 문서 링크

### 필독 문서

| 문서 | 설명 | 우선순위 |
|------|------|---------|
| [CLAUDE.md](../CLAUDE.md) | 프로젝트 개요, 개발 명령어 | **1순위** |
| [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md) | 제1원칙 (P0~P8) | **1순위** |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 아키텍처 | **2순위** |
| [apps/web/CLAUDE.md](../apps/web/CLAUDE.md) | 웹 앱 상세 규칙 | **2순위** |

### 참조 문서

| 문서 | 설명 |
|------|------|
| [INDEX.md](./INDEX.md) | 전체 문서 인덱스 |
| [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | DB 스키마, RLS |
| [.claude/rules/](../.claude/rules/) | 코딩 규칙 모음 |
| [.claude/rules/git-workflow.md](../.claude/rules/git-workflow.md) | Git 워크플로우 상세 |
| [.claude/rules/code-style.md](../.claude/rules/code-style.md) | 코드 스타일 가이드 |

### P7 워크플로우 순서

새 기능 구현 전 확인:

```
1. docs/research/         # 리서치 완료?
2. docs/principles/       # 원리 문서화?
3. docs/adr/              # ADR 작성?
4. docs/specs/            # 스펙 확정?
5. 구현                    # 코드 작성
```

---

## 8. 첫 이슈 체크리스트

### Good First Issue 예시

| 유형 | 예시 | 난이도 |
|------|------|--------|
| **문서** | README 오타 수정, 주석 추가 | Easy |
| **테스트** | 누락된 테스트 케이스 추가 | Easy |
| **UI** | 버튼 스타일 수정, 텍스트 변경 | Easy |
| **버그** | 간단한 로직 버그 수정 | Medium |
| **기능** | 작은 컴포넌트 추가 | Medium |

### 첫 PR 체크리스트

```markdown
## 첫 PR 전 확인

- [ ] 환경 설정 완료 (Node.js, npm, VS Code)
- [ ] 저장소 클론 및 의존성 설치
- [ ] 환경변수 설정 (.env.local)
- [ ] 개발 서버 정상 실행 확인
- [ ] CLAUDE.md, FIRST-PRINCIPLES.md 읽기
- [ ] 브랜치 생성 (feature/, fix/ 등)
- [ ] 린트/타입체크 통과
- [ ] 테스트 통과
- [ ] 커밋 메시지 컨벤션 준수
```

### 도움 받기

| 채널 | 용도 |
|------|------|
| GitHub Issues | 버그 리포트, 기능 요청 |
| PR Comments | 코드 리뷰, 질문 |
| 문서 | 대부분의 질문은 `docs/` 참조 |

---

## 부록: 자주 묻는 질문 (FAQ)

### Q: AI 없이 개발하려면?

```bash
# .env.local에 추가
FORCE_MOCK_AI=true
```

### Q: 테스트가 실패하면?

```bash
# 특정 테스트만 실행
npm run test -- path/to/file.test.ts

# 스냅샷 업데이트
npm run test -- -u
```

### Q: 린트 에러 자동 수정

```bash
npm run lint -- --fix
```

### Q: TypeScript 에러 확인

```bash
npm run typecheck
```

### Q: 전체 포맷팅

```bash
npm run format
```

---

**다음 단계**: [CLAUDE.md](../CLAUDE.md)와 [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md)를 읽고, Good First Issue를 찾아 첫 PR을 생성하세요!

---

**Version**: 1.0 | **Created**: 2026-01-23
**Author**: Claude Code
