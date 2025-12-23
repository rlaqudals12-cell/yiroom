<div align="center">
  <img src="apps/web/public/logo.png" alt="이룸 로고" width="200" />

  <h1>이룸 (Yiroom)</h1>
  <h3>"온전한 나는?" | "Know yourself, wholly."</h3>

  <p>AI 기반 통합 웰니스 플랫폼</p>

  <div>
    <img src="https://img.shields.io/badge/-Next.js_16-black?style=for-the-badge&logo=nextdotjs&color=black" alt="next.js" />
    <img src="https://img.shields.io/badge/-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="tailwind" />
  </div>
  <div>
    <img src="https://img.shields.io/badge/-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="clerk" />
    <img src="https://img.shields.io/badge/-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="supabase" />
    <img src="https://img.shields.io/badge/-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="gemini" />
  </div>

  <br />

  <p>
    <strong>테스트:</strong> 2,776개 통과 |
    <strong>코드 품질:</strong> SRP 95%, Repository 90%
  </p>
</div>

---

## 소개

**이룸(Yiroom)**은 사용자의 변화를 돕는 AI 기반 통합 웰니스 플랫폼입니다.

퍼스널 컬러 진단, 피부 분석, 체형 분석을 시작으로 운동/피트니스, 영양/식단 관리까지 통합된 경험을 제공합니다.

### 핵심 가치

- **타겟**: 10대 후반~30대 초반 (성별 무관)
- **철학**: 개인화된 데이터 기반 웰니스 솔루션
- **기술**: AI 이미지 분석 + RAG 기반 제품 추천

---

## 주요 기능

### Phase 1: 분석 기능

| 모듈 | 설명 |
|------|------|
| **PC-1 퍼스널 컬러** | 10개 문진 + AI 이미지 분석 → 4계절 16톤 진단 |
| **S-1 피부 분석** | 7가지 피부 지표 분석 + 맞춤 스킨케어 루틴 |
| **C-1 체형 분석** | 8가지 체형 분류 + 스타일 추천 |

### Phase 2: 운동/영양

| 모듈 | 설명 |
|------|------|
| **W-1 운동** | 5가지 운동 타입 분류 + 주간 플랜 + 연예인 루틴 매칭 |
| **N-1 영양** | AI 음식 인식 + 신호등 시스템 + 간헐적 단식 타이머 |
| **R-1 리포트** | 주간/월간 통합 리포트 + AI 인사이트 |

### Phase 3+: 고도화

- **제품 추천**: 850+ 제품 DB + 매칭도 계산 + 리뷰 시스템
- **RAG 시스템**: 논문 기반 AI Q&A
- **PWA**: 오프라인 지원 + 푸시 알림

---

## 기술 스택

### 프레임워크

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16+ | App Router, Turbopack |
| React | 19 | UI 라이브러리 |
| TypeScript | 5+ | 타입 안전성 |
| Tailwind CSS | v4 | 스타일링 |

### 백엔드 & AI

| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL + RLS + Storage |
| Clerk | 인증 (clerk_user_id 기반) |
| Gemini 3 Flash | AI 이미지/텍스트 분석 |
| pgvector | RAG 벡터 검색 |

### 테스트 & 품질

| 기술 | 용도 |
|------|------|
| Vitest | 단위/통합 테스트 (2,776개) |
| Playwright | E2E 테스트 |
| ESLint | 코드 린팅 |

---

## 프로젝트 구조

```
yiroom/
├── apps/
│   ├── web/                  # Next.js 웹 앱 (PWA)
│   │   ├── app/              # App Router 페이지
│   │   │   ├── (main)/       # 메인 기능 그룹
│   │   │   │   ├── analysis/ # Phase 1 분석
│   │   │   │   ├── workout/  # W-1 운동
│   │   │   │   ├── nutrition/# N-1 영양
│   │   │   │   ├── products/ # 제품 추천
│   │   │   │   └── reports/  # R-1 리포트
│   │   │   └── admin/        # 관리자 페이지
│   │   ├── components/       # React 컴포넌트
│   │   ├── lib/              # 비즈니스 로직
│   │   └── tests/            # 테스트 파일
│   └── mobile/               # Expo React Native 앱
├── packages/
│   └── shared/               # 공통 타입/유틸리티
├── docs/                     # 설계 문서
└── turbo.json                # Turborepo 설정
```

---

## 시작하기

### 필수 요구사항

- Node.js 18+
- npm 또는 pnpm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 웹 앱만 실행
npm run dev:web

# 테스트 실행
npm run test

# 타입 체크
npm run typecheck
```

### 환경 변수

`.env.local` 파일에 다음 변수를 설정하세요:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=
```

---

## 개발 가이드

### 3대 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: typecheck + lint + test 통과 필수

### 코드 스타일

- ES Modules 전용 (CommonJS 금지)
- 한국어 주석 필수 (복잡한 로직)
- 컴포넌트: PascalCase, 함수/변수: camelCase

### 테스트

```bash
# 전체 테스트
npm run test

# 웹 앱 테스트
cd apps/web && npm run test

# E2E 테스트
cd apps/web && npm run e2e
```

---

## 문서

| 문서 | 내용 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | AI 에이전트용 프로젝트 가이드 |
| [DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md) | DB 스키마 및 RLS 정책 |
| [PROGRESS-ALL.md](docs/PROGRESS-ALL.md) | 전체 개발 진행 상황 |
| [HOOK-MODEL.md](docs/HOOK-MODEL.md) | 사용자 리텐션 모델 |

---

## 라이선스

Private - All rights reserved

---

<div align="center">
  <p>Made with AI by 이룸 팀</p>
</div>
