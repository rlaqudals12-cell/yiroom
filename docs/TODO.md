# 프로젝트 파일 구조 TODO

> 프로젝트 디렉토리 및 파일 생성 체크리스트

---

## 설정 파일

- [x] `.env.local` 환경 변수
- [x] `tsconfig.json` 파일
- [x] `eslint.config.mjs` 파일
- [ ] `.prettierrc` 파일
- [ ] `.prettierignore` 파일
- [x] `.gitignore` 파일
- [ ] `.cursorignore` 파일
- [ ] `AGENTS.md` 파일

---

## .cursor/ 디렉토리

- [ ] `rules/` 커서룰
- [ ] `mcp.json` MCP 서버 설정
- [ ] `dir.md` 프로젝트 디렉토리 구조

---

## .github/ 디렉토리

- [ ] GitHub Actions 설정

---

## .husky/ 디렉토리

- [ ] Git hooks 설정

---

## app/ 디렉토리

### 기본 파일
- [x] `layout.tsx` 루트 레이아웃
- [x] `page.tsx` 홈 페이지
- [x] `globals.css` 전역 스타일
- [ ] `favicon.ico` 파일
- [ ] `not-found.tsx` 파일
- [ ] `robots.ts` 파일
- [ ] `sitemap.ts` 파일
- [ ] `manifest.ts` 파일

### 인증 관련
- [x] `(auth)/sign-in/` 로그인 페이지
- [x] `(auth)/sign-up/` 회원가입 페이지

### 메인 기능
- [x] `(main)/analysis/skin/` S-1 피부 분석
  - [x] `page.tsx`
  - [x] `_components/PhotoUpload.tsx`
  - [x] `_components/AnalysisLoading.tsx`
  - [x] `_components/AnalysisResult.tsx`
- [x] `(main)/analysis/body/` C-1 체형 분석
  - [x] `page.tsx`
  - [x] `_components/InputForm.tsx`
  - [x] `_components/PhotoUpload.tsx`
  - [x] `_components/AnalysisLoading.tsx`
  - [x] `_components/AnalysisResult.tsx`
- [x] `(main)/analysis/personal-color/` PC-1 퍼스널 컬러
  - [x] `page.tsx`
  - [x] `_components/Questionnaire.tsx`
  - [x] `_components/PhotoUpload.tsx`
  - [x] `_components/AnalysisLoading.tsx`
  - [x] `_components/AnalysisResult.tsx`
- [x] `(main)/dashboard/` 대시보드
  - [x] `page.tsx`
  - [x] `_components/UserProfile.tsx`
  - [x] `_components/AnalysisCard.tsx`
  - [x] `_components/EmptyState.tsx`
  - [x] `_components/QuickActions.tsx`

### 테스트/개발
- [x] `auth-test/` 인증 테스트 페이지

### API Routes
- [x] `api/sync-user/` 사용자 동기화
- [x] `api/analyze/personal-color/` PC-1 저장/조회
- [x] `api/analyze/skin/` S-1 저장/조회
- [x] `api/analyze/body/` C-1 저장/조회

---

## components/ 디렉토리

- [x] `ui/` shadcn/ui 컴포넌트
- [x] `providers/` Context Providers
- [ ] `analysis/` 분석 관련 컴포넌트
- [ ] `camera/` 카메라 컴포넌트
- [ ] `personal-color/` PC 컴포넌트
- [ ] `ingredient/` 성분 분석 컴포넌트

---

## lib/ 디렉토리

- [x] `utils.ts` 공통 유틸리티
- [x] `supabase/client.ts` Supabase 클라이언트
- [x] `supabase/clerk-client.ts` Clerk 통합 클라이언트
- [x] `supabase/server.ts` 서버 클라이언트
- [x] `supabase/service-role.ts` 서비스 롤 클라이언트
- [x] `mock/skin-analysis.ts` 피부 분석 Mock
- [x] `mock/body-analysis.ts` 체형 분석 Mock
- [x] `mock/personal-color.ts` PC Mock
- [x] `gemini.ts` Gemini AI 연동
- [x] `ingredients.ts` 성분 분석
- [x] `product-recommendations.ts` 제품 추천
- [x] `color-recommendations.ts` 색상 추천

---

## hooks/ 디렉토리

- [x] `use-sync-user.ts` 사용자 동기화 Hook

---

## types/ 디렉토리

- [ ] `index.ts` 공통 타입
- [ ] `personal-color.ts` PC 타입
- [ ] `ingredient.ts` 성분 타입

---

## supabase/ 디렉토리

- [ ] 마이그레이션 파일
- [ ] 시드 데이터

---

## public/ 디렉토리

- [ ] `icons/` 디렉토리
- [ ] `logo.png` 파일
- [ ] `og-image.png` 파일

---

## tests/ 디렉토리

- [x] `setup.ts` 테스트 설정

---

## specs/ 디렉토리

- [x] `features/S-1-skin-analysis-page.md` S-1 스펙
- [x] `features/C-1-body-analysis-page.md` C-1 스펙
- [ ] `features/PC-1-personal-color.md` PC-1 스펙
- [x] `templates/` 스펙 템플릿

---

## docs/ 디렉토리

- [x] `TODO.md` 이 파일
- [x] `PROGRESS.md` 진행 상황
- [x] `DATABASE-SCHEMA.md` DB 스키마
- [x] `SDD-WORKFLOW.md` 개발 워크플로우
- [x] `TECH-STACK.md` 기술 스택
- [x] `HOOK-MODEL.md` Hook 모델
