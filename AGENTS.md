# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Next.js 15.5.6** with React 19 and App Router
- **Authentication**: Clerk (with Korean localization)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 (uses `globals.css`, no config file)
- **UI Components**: shadcn/ui (based on Radix UI)
- **Icons**: lucide-react
- **Forms**: react-hook-form + Zod
- **Package Manager**: pnpm
- **Language**: TypeScript (strict typing required)

## Development Commands

```bash
# Development server with turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Project Architecture

### Clerk + Supabase Integration

이 프로젝트는 Clerk와 Supabase의 네이티브 통합 (2025년 4월 이후 권장 방식)을 사용합니다:

1. **인증 흐름**:
   - Clerk가 사용자 인증 처리
   - `SyncUserProvider`가 로그인 시 자동으로 Clerk 사용자를 Supabase `users` 테이블에 동기화
   - Supabase 클라이언트가 Clerk 토큰을 사용하여 인증 (JWT 템플릿 불필요)

2. **Supabase 클라이언트 파일들** (`lib/supabase/`):
   - `clerk-client.ts`: Client Component용 (useClerkSupabaseClient hook)
     - Clerk 세션 토큰으로 인증된 사용자의 데이터 접근
     - RLS 정책이 `auth.jwt()->>'sub'`로 Clerk user ID 확인
   - `server.ts`: Server Component/Server Action용 (createClerkSupabaseClient)
     - 서버 사이드에서 Clerk 인증 사용
   - `service-role.ts`: 관리자 권한 작업용 (SUPABASE_SERVICE_ROLE_KEY 사용)
     - RLS 우회, 서버 사이드 전용
   - `client.ts`: 인증 불필요한 공개 데이터용
     - anon key만 사용, RLS 정책이 `to anon`인 데이터만 접근

3. **사용자 동기화**:
   - `hooks/use-sync-user.ts`: Clerk → Supabase 사용자 동기화 훅
   - `components/providers/sync-user-provider.tsx`: RootLayout에서 자동 실행
   - `app/api/sync-user/route.ts`: 실제 동기화 로직 (API 라우트)

### Directory Convention

프로젝트 파일은 `app` 외부에 저장:

- `app/`: 라우팅 전용 (page.tsx, layout.tsx, route.ts 등만)
- `components/`: 재사용 가능한 컴포넌트
  - `components/ui/`: shadcn 컴포넌트 (자동 생성, 수정 금지)
  - `components/providers/`: React Context 프로바이더들
- `lib/`: 유틸리티 함수 및 클라이언트 설정
  - `lib/supabase/`: Supabase 클라이언트들 (환경별로 분리)
  - `lib/utils.ts`: 공통 유틸리티 (cn 함수 등)
- `hooks/`: 커스텀 React Hook들
- `supabase/`: 데이터베이스 마이그레이션 및 설정
  - `supabase/migrations/`: SQL 마이그레이션 파일들
  - `supabase/config.toml`: Supabase 프로젝트 설정

**예정된 디렉토리** (아직 없지만 필요 시 생성):

- `actions/`: Server Actions (API 대신 우선 사용)
- `types/`: TypeScript 타입 정의
- `constants/`: 상수 값들
- `states/`: 전역 상태 (jotai 사용, 최소화)

### Naming Conventions

- **파일명**: kebab-case (예: `use-sync-user.ts`, `sync-user-provider.tsx`)
- **컴포넌트**: PascalCase (파일명은 여전히 kebab-case)
- **함수/변수**: camelCase
- **타입/인터페이스**: PascalCase

## Database

### Supabase Migrations

마이그레이션 파일 명명 규칙: `YYYYMMDDHHmmss_description.sql`

예시:

```
supabase/migrations/20241030014800_create_users_table.sql
```

**중요**:

- 새 테이블 생성 시 반드시 Row Level Security (RLS) 활성화
- 개발 중에는 RLS를 비활성화할 수 있으나, 프로덕션에서는 활성화 필수
- RLS 정책은 세분화: select, insert, update, delete별로 각각 작성
- `anon`과 `authenticated` 역할별로 별도 정책 작성

### 현재 스키마

#### 데이터베이스 테이블

- `users`: Clerk 사용자와 동기화되는 사용자 정보
  - `id`: UUID (Primary Key)
  - `clerk_id`: TEXT (Unique, Clerk User ID)
  - `name`: TEXT
  - `created_at`: TIMESTAMP
  - RLS: 개발 중 비활성화 (프로덕션에서는 활성화 필요)

#### Storage 버킷

- `uploads`: 사용자 파일 저장소
  - 경로 구조: `{clerk_user_id}/{filename}`
  - RLS 정책:
    - INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
    - SELECT: 인증된 사용자만 자신의 파일 조회 가능
    - DELETE: 인증된 사용자만 자신의 파일 삭제 가능
    - UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
  - 정책은 `auth.jwt()->>'sub'` (Clerk user ID)로 사용자 확인

## Environment Variables

`.env.example` 참고하여 `.env` 파일 생성:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

## Development Guidelines

### Server Actions vs API Routes

**우선순위**: Server Actions > API Routes

- 가능하면 항상 Server Actions 사용 (`actions/` 디렉토리)
- API Routes는 불가피한 경우에만 사용 (웹훅, 외부 API 등)
- 현재 `/api/sync-user`는 기존 구조상 API Route로 구현됨

### UI Components

1. **shadcn/ui 설치 확인**: 사용 전 `/components/ui/` 디렉토리 체크
2. **설치 명령어**: `pnpx shadcn@latest add [component-name]`
3. **아이콘**: lucide-react 사용 (`import { Icon } from 'lucide-react'`)

### Styling

- Tailwind CSS v4 사용 (설정은 `app/globals.css`에만)
- `tailwind.config.js` 파일은 사용하지 않음
- 다크/라이트 모드 지원 고려

### TypeScript

- 모든 코드에 타입 정의 필수
- 인터페이스 우선, 타입은 필요시만
- enum 대신 const 객체 사용
- `satisfies` 연산자로 타입 검증

### React 19 & Next.js 15 Patterns

```typescript
// Async Request APIs (항상 await 사용)
const cookieStore = await cookies();
const headersList = await headers();
const params = await props.params;
const searchParams = await props.searchParams;

// Server Component 우선
// 'use client'는 필요한 경우에만
```

## Key Files

- `middleware.ts`: Clerk 미들웨어 (인증 라우트 보호)
- `app/layout.tsx`: RootLayout with ClerkProvider + SyncUserProvider
- `lib/supabase.ts`: 레거시 Supabase 클라이언트 (사용 지양, 새 파일들 사용)
- `components.json`: shadcn/ui 설정

## Additional Cursor Rules

프로젝트에는 다음 Cursor 규칙들이 있습니다:

- `.cursor/rules/web/nextjs-convention.mdc`: Next.js 컨벤션
- `.cursor/rules/web/design-rules.mdc`: UI/UX 디자인 가이드
- `.cursor/rules/web/playwright-test-guide.mdc`: 테스트 가이드
- `.cursor/rules/supabase/`: Supabase 관련 규칙들

주요 원칙은 이 CLAUDE.md에 통합되어 있으나, 세부사항은 해당 파일들 참고.

## Custom Agents

프로젝트에 특화된 커스텀 Agent들이 `.claude/agents/`에 있습니다:

### 핵심 Agent (6개)

| Agent                       | 파일                       | 역할                                |
| --------------------------- | -------------------------- | ----------------------------------- |
| **korean-beauty-validator** | korean-beauty-validator.md | K-뷰티 트렌드 검증, 제품 추천 검증  |
| **korean-ux-writer**        | korean-ux-writer.md        | 세대별 한국어 UI 문구, 마이크로카피 |
| **yiroom-spec-reviewer**    | yiroom-spec-reviewer.md    | 스펙 문서 검토                      |
| **yiroom-code-quality**     | yiroom-code-quality.md     | 코드 품질 검사                      |
| **yiroom-test-writer**      | yiroom-test-writer.md      | 테스트 코드 작성                    |
| **yiroom-ui-validator**     | yiroom-ui-validator.md     | UI/UX 검증                          |

### Agent 활용 예시

```bash
# K-뷰티 제품 추천 검증
"korean-beauty-validator agent로 이 제품들이 20대 초반에게 적합한지 검증해줘"

# UI 문구 최적화
"korean-ux-writer agent로 이 에러 메시지를 더 친근하게 바꿔줘"

# 스펙 문서 검토
"yiroom-spec-reviewer agent로 PC-1 스펙을 검토해줘"
```

## Specs 폴더 구조

SDD (Spec-Driven Development) 문서는 `specs/`에 관리합니다:

```
specs/
├── features/     # Feature 스펙 (기능 단위)
├── tasks/        # Task 분해 (세부 작업)
├── dev/          # Development 명세 (구현 상세)
└── templates/    # 스펙 템플릿
```

스펙 작성 시 `specs/templates/FEATURE-SPEC-TEMPLATE.md` 참고.

## Custom Commands (Slash Commands)

`.claude/commands/`에 정의된 슬래시 명령어들:

| 명령어            | 설명                  | 사용 예시                 |
| ----------------- | --------------------- | ------------------------- |
| `/create-feature` | SDD 기반 새 기능 생성 | `/create-feature PC-1`    |
| `/review`         | 종합 코드 리뷰        | `/review app/analysis/`   |
| `/test`           | 테스트 실행 및 분석   | `/test --coverage`        |
| `/deploy-check`   | 배포 전 체크리스트    | `/deploy-check`           |
| `/standup`        | 일일 개발 현황 요약   | `/standup`                |
| `/qplan`          | 빠른 계획 검토        | `/qplan 로그인 버튼 추가` |
| `/qcode`          | 빠른 구현 + 검증      | `/qcode`                  |
| `/qcheck`         | 빠른 품질 검사        | `/qcheck`                 |

### Quick Workflow (권장)

```bash
# 1. 계획 검토
/qplan [작업 내용]

# 2. 승인 후 구현
/qcode

# 3. 품질 검사
/qcheck

# 4. 배포 전 최종 확인
/deploy-check
```

## 계층적 CLAUDE.md

프로젝트는 디렉토리별 CLAUDE.md를 사용합니다:

| 위치                   | 역할                      |
| ---------------------- | ------------------------- |
| `CLAUDE.md` (루트)     | 프로젝트 핵심 규칙 (50줄) |
| `app/CLAUDE.md`        | Next.js App Router 규칙   |
| `components/CLAUDE.md` | 컴포넌트 작성 규칙        |
| `tests/CLAUDE.md`      | 테스트 규칙               |
| `supabase/CLAUDE.md`   | DB/Supabase 규칙          |

## 작업 관리 파일

| 파일            | 용도                                        |
| --------------- | ------------------------------------------- |
| `SCRATCHPAD.md` | 진행 중인 작업, To-Do, 메모                 |
| `COMPLETED.md`  | 완료된 작업 기록                            |
| `.mcp.json`     | 외부 도구 연동 설정 (GitHub, PostgreSQL 등) |

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
