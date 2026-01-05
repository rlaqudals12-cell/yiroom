# 이룸 프로젝트 진행 상황

> **마지막 업데이트**: 2026-01-06
> **현재 버전**: v2.4 (등급 시스템 + 인벤토리 확장)

---

## 전체 진행률

### Phase 1: 기초 분석 (Week 0-6) ✅

| Week   | 목표             | 상태    | 완료일     |
| ------ | ---------------- | ------- | ---------- |
| Week 0 | 학습             | ✅ 완료 | -          |
| Week 1 | S-1 피부 Mock    | ✅ 완료 | 2025-11-26 |
| Week 2 | C-1 체형 Mock    | ✅ 완료 | 2025-11-26 |
| Week 3 | PC-1 퍼스널 컬러 | ✅ 완료 | 2025-11-26 |
| Week 4 | Clerk + DB       | ✅ 완료 | 2025-11-26 |
| Week 5 | Gemini S-1, C-1  | ✅ 완료 | 2025-11-26 |
| Week 6 | PC-1 + 성분 분석 | ✅ 완료 | 2025-11-26 |

### Phase 2-3: 확장 모듈 ✅

| Phase   | 모듈   | 설명                    | 상태    |
| ------- | ------ | ----------------------- | ------- |
| Phase 2 | W-1    | 운동 분석 + 플랜 생성   | ✅ 완료 |
| Phase 2 | N-1    | 영양 기록 + AI 분석     | ✅ 완료 |
| Phase 2 | R-1    | 통합 리포트             | ✅ 완료 |
| Phase 3 | 고도화 | E2E 테스트, 크로스 모듈 | ✅ 완료 |

### Phase A-I: 고급 기능

| Phase   | 모듈         | 설명                   | 상태       |
| ------- | ------------ | ---------------------- | ---------- |
| Phase A | Product DB   | 850+ 제품, 리뷰, 추천  | ✅ 완료    |
| Phase B | React Native | 모노레포, Expo 앱      | 🔄 진행 중 |
| Phase H | 소셜         | 친구, 리더보드, 챌린지 | ✅ 완료    |
| Phase I | 어필리에이트 | iHerb, 쿠팡, 무신사    | ✅ 완료    |
| Phase L | i18n         | 4개 언어 (한/영/일/중) | ✅ 완료    |
| Launch  | 출시 준비    | 온보딩, 도움말, 알림   | ✅ 완료    |
| Phase V | Visual       | S-1+/PC-1+ 시각 분석   | ✅ 완료    |
| Phase P | Preferences  | 통합 선호/기피 시스템  | ✅ 완료    |

---

## Phase P: User Preferences System ✅ (2026-01-05)

### 개요

사용자의 **선호(Favorites)**와 **기피(Avoids)** 항목을 도메인별로 통합 관리.
i18n 친화적 AvoidLevel 설계 (의료 용어 대신 일상 표현).

### 완료 항목

```yaml
[x] types/preferences.ts: 핵심 타입 정의
    - AvoidLevel: dislike | avoid | cannot | danger
    - AvoidReason: 12가지 카테고리
    - UserPreference 인터페이스

[x] lib/preferences: 비즈니스 로직
    - repository.ts: Supabase CRUD (9개 함수)
    - labels.ts: 5개 언어 i18n (ko, en, ja, zh_CN, zh_TW)
    - converters.ts: allergies/injuries 변환

[x] API Routes:
    - GET/POST /api/preferences
    - PATCH/DELETE /api/preferences/[id]
    - GET /api/preferences/summary

[x] 프론트엔드:
    - useUserPreferences 훅
    - PreferenceManager 컴포넌트
    - AvoidLevelBadge 컴포넌트
    - QuickAddSheet 컴포넌트

[x] 기존 모듈 연동 (Dual Write):
    - N-1: allergies[] → user_preferences (온보딩)
    - W-1: injuries[] → user_preferences (온보딩)
    - Beauty: IngredientFavoriteFilterV2

[x] 읽기 로직 통합 (Phase 3):
    - lib/preferences/helpers.ts: 추천 API 헬퍼
    - /api/nutrition/suggest: user_preferences 우선 조회
    - /api/workout/recommend: user_preferences 우선 조회
    - Fallback 지원으로 완전한 호환성 보장

[x] 테스트: 115개 통과
    - converters: 11개
    - helpers: 10개
    - repository: 15개
    - hooks: 10개
    - integration: 69개
```

### 관련 문서

- [SDD-USER-PREFERENCES.md](./SDD-USER-PREFERENCES.md)

---

## Phase V: Visual Analysis Engine ✅ (2026-01-04)

### 개요

피부 분석(S-1)과 퍼스널컬러 분석(PC-1)의 시각적 결과 표현을 강화하는 엔진.
MediaPipe Face Mesh 기반 얼굴 랜드마크 추출 및 Canvas 렌더링.

### 완료 항목

```yaml
[x] lib/analysis: 핵심 모듈 9개
    - device-capability: 기기 성능 감지 및 적응형 처리
    - face-landmark: MediaPipe 468점 랜드마크 추출
    - skin-heatmap: 멜라닌/헤모글로빈 히트맵
    - drape-reflectance: 드레이프 색상 반사율 분석
    - synergy-insight: S-1→PC-1 시너지 인사이트
    - memory-manager: Canvas 메모리 최적화
    - mediapipe-loader: CDN 로딩 + Mock Fallback
    - canvas-utils: 이미지/Canvas 유틸리티

[x] components/analysis/visual: UI 컴포넌트 8개
    - VisualAnalysisTab: 피부 분석 상세 시각화 탭
    - DrapingSimulationTab: 퍼스널컬러 드레이핑 시뮬레이션
    - SkinHeatmapCanvas: 광원모드별 히트맵 렌더링
    - LightModeTab: 일반광/편광/UV/피지 모드 전환
    - DrapeSimulator: 실시간 드레이프 미리보기
    - DrapeColorPalette: 128색 팔레트 (적응형)
    - SynergyInsightCard: 피부-컬러 연계 인사이트

[x] 결과 페이지 탭 UI 통합
    - skin/result/[id]: 기본 분석 + 상세 시각화 탭
    - personal-color/result/[id]: 기본 분석 + 드레이핑 탭

[x] 테스트
    - 단위 테스트: 94개
    - E2E 테스트: 10개
```

### 주요 기술

- MediaPipe Face Mesh (468 랜드마크)
- Canvas 2D API (히트맵 렌더링)
- 적응형 성능 조절 (high/medium/low 티어)
- Mock Fallback 전략 (CDN 장애 대응)

### 관련 문서

- [SDD-VISUAL-ANALYSIS-ENGINE.md](./SDD-VISUAL-ANALYSIS-ENGINE.md)
- [TECH-STACK-VISUAL-ANALYSIS.md](./TECH-STACK-VISUAL-ANALYSIS.md)

---

## Week 0: 학습 ✅

```yaml
[x] Next.js 공식 튜토리얼 완료
[x] TypeScript 기본 문법 이해
[x] Supabase 프로젝트 생성
[x] Clerk 계정 생성 및 앱 설정
[x] Claude Code Max 준비
[x] 보일러플레이트 다운로드
```

---

## Week 1: S-1 피부 ✅

```yaml
[x] S-1 페이지 UI 완성
    - app/(main)/analysis/skin/page.tsx
[x] 카메라/갤러리 업로드 구현
    - _components/PhotoUpload.tsx
[x] Mock AI 응답 구현
    - lib/mock/skin-analysis.ts
[x] 로딩 화면 + 팁 순환
    - _components/AnalysisLoading.tsx
[x] 결과 화면 디자인
    - _components/AnalysisResult.tsx
[x] 반응형 확인
[x] 성분 분석 UI 추가 (Week 6에서 완료)
```

**상세 스펙**: [specs/features/S-1-skin-analysis-page.md](../specs/features/S-1-skin-analysis-page.md)

---

## Week 2: C-1 체형 ✅

```yaml
[x] C-1 페이지 UI 완성
    - app/(main)/analysis/body/page.tsx
[x] 카메라/갤러리 업로드 구현
    - _components/PhotoUpload.tsx
[x] Mock AI 응답 구현
    - lib/mock/body-analysis.ts
[x] 로딩 화면 + 팁 순환
    - _components/AnalysisLoading.tsx
[x] 결과 화면 디자인
    - _components/AnalysisResult.tsx
[x] 반응형 확인 (max-w-lg mx-auto px-4 적용됨)
```

**상세 스펙**: [specs/features/C-1-body-analysis-page.md](../specs/features/C-1-body-analysis-page.md)

---

## Week 3: PC-1 퍼스널 컬러 ✅

```yaml
[x] 문진 시스템 UI 완성
    - app/(main)/analysis/personal-color/_components/Questionnaire.tsx
[x] 10개 질문 구현
    - lib/mock/personal-color.ts (ONBOARDING_QUESTIONS)
[x] 이미지 업로드 구현
    - _components/PhotoUpload.tsx (공통 컴포넌트 재사용)
[x] Mock 결과 화면
    - _components/AnalysisResult.tsx
[x] 4계절 디자인
    - Spring/Summer/Autumn/Winter 컬러 팔레트
[x] 로딩 화면
    - _components/AnalysisLoading.tsx
[x] 데이터 저장 로직 (Week 4에서 완료)
```

**상세 스펙**: [specs/templates/PC-1-feature-spec-template.md](../specs/templates/PC-1-feature-spec-template.md)

---

## Week 4: Clerk + Database ✅

```yaml
[x] Clerk 설치 및 설정
[x] 로그인/회원가입 페이지
[x] Clerk + Supabase 네이티브 통합
    - lib/supabase/clerk-client.ts (Client Component)
    - lib/supabase/server.ts (Server Component)
    - lib/supabase/service-role.ts (API Route용)
[x] users 테이블 생성 (clerk_user_id 기준)
[x] personal_color_assessments 테이블
[x] skin_analyses 테이블 (성분 필드 포함)
[x] body_analyses 테이블 (PC 필드 포함)
[x] Storage 버킷 3개 생성
    - personal-color-images
    - skin-images
    - body-images
[x] API Routes 구현
    - api/sync-user/ (사용자 동기화)
    - api/analyze/personal-color/ (PC-1 저장/조회)
    - api/analyze/skin/ (S-1 저장/조회, PC 자동 연동)
    - api/analyze/body/ (C-1 저장/조회, PC 자동 연동)
[x] 분석 페이지 DB 저장 연동
    - PC-1, S-1, C-1 결과 자동 저장
    - 이미지 Storage 업로드
[x] Dashboard 완성
    - app/(main)/dashboard/page.tsx
    - _components/UserProfile.tsx (사용자 프로필)
    - _components/AnalysisCard.tsx (분석 결과 카드)
    - _components/EmptyState.tsx (빈 상태 UI)
    - _components/QuickActions.tsx (분석 시작 CTA)
[x] 랜딩 페이지 이룸 브랜딩 적용
[x] Navbar 네비게이션 추가
```

---

## Week 5: Gemini S-1, C-1 ✅

```yaml
[x] Gemini API 키 확인 (.env.local)
[x] @google/generative-ai SDK 설치
[x] lib/gemini.ts 구현
    - analyzeSkin() - S-1 피부 분석
    - analyzeBody() - C-1 체형 분석
    - JSON 프롬프트 엔지니어링
    - Mock 폴백 지원
[x] S-1 Real AI 연동
    - app/api/analyze/skin/route.ts 업데이트
    - 클라이언트 API 호출 방식으로 변경
    - 에러 발생 시 Mock 자동 폴백
[x] C-1 Real AI 연동
    - app/api/analyze/body/route.ts 업데이트
    - userInput (키/몸무게) 전달
    - BMI 계산 및 체형 정보 보완
[x] 에러 처리 추가
    - AI 실패 시 Mock 폴백
    - 클라이언트 에러 메시지 표시
[x] FORCE_MOCK_AI 환경변수 지원
```

**구현 파일**:

- [lib/gemini.ts](../lib/gemini.ts) - Gemini AI 클라이언트
- [app/api/analyze/skin/route.ts](../app/api/analyze/skin/route.ts) - S-1 API (Real AI)
- [app/api/analyze/body/route.ts](../app/api/analyze/body/route.ts) - C-1 API (Real AI)

---

## Week 6: PC-1 + 성분 분석 ✅

```yaml
[x] PC-1 Real AI 연동 ✅
    - lib/gemini.ts에 analyzePersonalColor() 추가
    - GeminiPersonalColorResult 타입 정의
    - 문진 + 이미지 통합 프롬프트
    - app/api/analyze/personal-color/route.ts 업데이트
    - Real AI + Mock 폴백 지원
    - image_analysis, celebrityMatch, insight 저장
[x] 문진 + 이미지 통합 알고리즘 ✅
    - 문진 응답을 프롬프트에 통합
    - 이미지 우선, 문진은 참고용으로 처리
[x] 성분 분석 시스템 구현 ✅
    - ingredients 테이블 생성 (20개 시드 데이터)
    - 하이브리드 분석 로직 (DB 우선 + AI 폴백 예정)
    - API Route 구현 (/api/analyze/ingredients)
    - 피부 타입별 경고 레벨 시스템
    - aliases(별칭) 검색 기능 추가
    - updated_at 자동 업데이트 트리거 추가
[x] S-1 성분 분석 통합 ✅
    - 피부 타입별 주의 성분 자동 조회
    - ingredient_warnings JSONB 저장
    - 피부 타입 결정 로직 개선 (민감도 포함)
    - API 응답에 ingredientWarnings 포함
    - normal 피부 타입 warning level 계산 로직 추가
    - foundation_recommendation 필드 추가 (PC 기반)
[x] 제품 추천 강화 ✅
    - lib/product-recommendations.ts 구현
    - 피부 타입별 기초 루틴 추천 (5단계)
    - 고민별 특화 제품 추천 (6가지 고민)
    - 퍼스널 컬러 기반 메이크업 추천
    - S-1 API products 필드 저장
    - API 응답에 productRecommendations 포함
    - 가격대별 정렬 로직 추가 (스펙 3.2 #5)
    - 아침/저녁 루틴 구분 (morning_routine, evening_routine)
    - 주간 케어 + 라이프스타일 팁 추가 (weekly_care, lifestyle_tips)
[x] C-1 퍼스널 컬러 통합 ✅
    - lib/color-recommendations.ts 구현
    - 퍼스널 컬러 시즌별 상/하의 색상 팔레트
    - 체형별 색상 배치 전략 (밝은 색/어두운 색)
    - 최적 색상 조합 자동 생성 (bestCombinations)
    - 악세서리 추천
    - 체형별 색상 팁 (colorTips)
    - C-1 API color_recommendations JSONB 저장
    - API 응답에 colorRecommendations, colorTips 포함
    - BodyAnalysisResult 타입에 colorRecommendations 필드 추가
    - AnalysisResult.tsx 색상 추천 UI 섹션 추가
    - page.tsx에서 API 응답 → 결과 컴포넌트 연동 완료
[x] 전체 통합 테스트 ✅
    - PC-1, S-1, C-1 API 코드 검증 완료
    - API 간 연동 흐름 확인 (PC → S-1/C-1)
    - TypeScript 타입 체크 통과
    - ESLint 에러 없음 (경고 1건 - unused import)
    - S-1 클라이언트 UI 연동 완료
        - SkinAnalysisResult 타입에 ingredientWarnings, productRecommendations 추가
        - page.tsx에서 API 응답 연동
        - AnalysisResult.tsx에 성분 경고/제품 추천/파운데이션 추천 UI 추가
    - C-1 클라이언트 UI 연동 완료
        - BodyAnalysisResult 타입에 colorRecommendations 추가
        - page.tsx에서 API 응답 연동
        - AnalysisResult.tsx에 색상 추천 UI 추가
    - PC-1 클라이언트 UI 검증 완료 (기존 구현 정상)
```

**구현 파일**:

- [lib/gemini.ts](../lib/gemini.ts) - analyzePersonalColor() 추가
- [app/api/analyze/personal-color/route.ts](../app/api/analyze/personal-color/route.ts) - PC-1 API (Real AI)
- [app/(main)/analysis/personal-color/page.tsx](<../app/(main)/analysis/personal-color/page.tsx>) - API 호출 방식으로 변경
- [lib/ingredients.ts](../lib/ingredients.ts) - 성분 분석 하이브리드 로직
- [app/api/analyze/ingredients/route.ts](../app/api/analyze/ingredients/route.ts) - 성분 분석 API
- [supabase/migrations/20251126_ingredients_table.sql](../supabase/migrations/20251126_ingredients_table.sql) - ingredients 테이블 + 시드 데이터
- [app/api/analyze/skin/route.ts](../app/api/analyze/skin/route.ts) - S-1 API (성분 분석 + 제품 추천 통합)
- [lib/product-recommendations.ts](../lib/product-recommendations.ts) - 제품 추천 로직
- [lib/color-recommendations.ts](../lib/color-recommendations.ts) - 퍼스널 컬러 + 체형 기반 색상 추천
- [app/api/analyze/body/route.ts](../app/api/analyze/body/route.ts) - C-1 API (PC 연동 통합)
- [lib/mock/skin-analysis.ts](../lib/mock/skin-analysis.ts) - S-1 타입에 ingredientWarnings, productRecommendations 추가
- [lib/mock/body-analysis.ts](../lib/mock/body-analysis.ts) - C-1 타입에 colorRecommendations 추가
- [app/(main)/analysis/skin/page.tsx](<../app/(main)/analysis/skin/page.tsx>) - S-1 API 응답 연동
- [app/(main)/analysis/skin/\_components/AnalysisResult.tsx](<../app/(main)/analysis/skin/_components/AnalysisResult.tsx>) - S-1 성분경고/제품추천 UI
- [app/(main)/analysis/body/page.tsx](<../app/(main)/analysis/body/page.tsx>) - C-1 API 응답 연동
- [app/(main)/analysis/body/\_components/AnalysisResult.tsx](<../app/(main)/analysis/body/_components/AnalysisResult.tsx>) - C-1 색상추천 UI

---

## Week 7-8: 배포 준비 ✅

```yaml
[x] 베타 배포 환경 준비
    - Vercel 배포 설정 완료
    - 보안 헤더 설정 (X-Frame-Options, CSP 등)
    - Cron 작업 설정 (가격 업데이트)
[x] 피드백 시스템 구현
    - /help/feedback 페이지
    - /api/feedback API
    - /admin/feedback 관리자 페이지
[x] UX 개선 완료 (SPEC-UX-IMPROVEMENT-V2)
    - P0-1: 분석 결과 → 제품 바로 연결 ✅
    - P0-2: 온보딩 단계 축소 (7→3단계) ✅
    - P1: 결과 공유 카드 이미지 ✅
    - P1: 닮은 스타일 예시 컴포넌트 ✅
    - P2-1: 축하 애니메이션 & 햅틱 ✅
    - P2-2: 홈 화면 정보 밀도 최적화 ✅
```

---

## Phase 2: 운동/영양 모듈 ✅

### W-1 운동 분석

```yaml
[x] 운동 온보딩 (목표, 고민, 빈도, 장소, 장비)
[x] AI 운동 타입 분석 (5가지: Toner, Builder, Athlete, etc.)
[x] 맞춤 운동 플랜 생성
[x] 운동 기록 시스템 (세트, 렙, 무게)
[x] 운동 스트릭 + 게이미피케이션 (XP, 배지)
[x] 운동 상세 페이지 (운동별 가이드)
```

### N-1 영양 분석

```yaml
[x] 영양 온보딩 (목표, 식단 스타일)
[x] 식사 기록 시스템 (아침/점심/저녁/간식)
[x] AI 음식 인식 (Gemini Vision)
[x] 바코드 스캔 기능
    - Open Food Facts API 연동
    - 식품안전나라 API 연동 (한국 제품)
    - 수동 등록 기능
[x] 영양소 추적 (칼로리, 단백질, 탄수화물, 지방)
[x] 물 섭취 기록
[x] 일일 영양 요약
```

### R-1 리포트

```yaml
[x] 주간/월간 리포트 생성
[x] 운동/영양 통합 분석
[x] 트렌드 차트 (Chart.js)
[x] PDF 다운로드
```

---

## Phase 3: 앱 고도화 ✅

```yaml
[x] E2E 테스트 확장 (Playwright)
[x] 프로덕션 빌드 최적화 (40s 내)
[x] 성능 최적화 (Lighthouse 90+)
[x] 크로스 모듈 연동 (PC → S-1, C-1)
[x] PWA 설정 (오프라인 캐시)
```

---

## Phase A: Product DB ✅

```yaml
[x] 제품 DB 설계 (4개 카테고리)
    - cosmetic_products (화장품)
    - supplement_products (영양제)
    - workout_equipment (운동 장비)
    - health_foods (건강식품)
[x] 850+ 제품 시드 데이터
[x] 제품 추천 시스템 (피부/체형/퍼스널컬러 기반)
[x] 제품 리뷰 시스템
[x] 제품 상세 페이지
[x] 성분 상호작용 경고
```

---

## Phase H: 소셜 시스템 ✅

```yaml
[x] 친구 시스템
    - 친구 요청/수락/거절
    - 친구 검색
    - 친구 목록
[x] 리더보드
    - 전체 랭킹
    - 친구 랭킹
    - 운동/영양별 분류
[x] 웰니스 스코어
    - 통합 건강 점수 (0-100)
    - 구성 요소별 점수
[x] 챌린지 시스템
    - 개인 챌린지
    - 팀 챌린지
    - 챌린지 참여/진행/완료
[x] 게이미피케이션
    - XP 시스템
    - 레벨 시스템
    - 배지 시스템 (50+ 배지)
```

---

## Phase I: 어필리에이트 ✅

```yaml
[x] 파트너 연동
    - iHerb API
    - 쿠팡 파트너스 API
    - 무신사 어필리에이트
[x] 딥링크 생성 시스템
[x] 클릭 트래킹
[x] 어필리에이트 통계 대시보드
[x] A/B 테스트 시스템
```

---

## Phase L: i18n ✅

```yaml
[x] 다국어 지원 인프라 (next-intl)
[x] 한국어 (ko) - 기본
[x] 영어 (en)
[x] 일본어 (ja)
[x] 중국어 간체 (zh)
```

---

## Launch 준비 ✅

```yaml
[x] 온보딩 플로우
    - 앱 소개 캐러셀
    - 분석 모듈 선택
    - 건너뛰기 옵션
[x] 도움말 시스템
    - FAQ 페이지 (카테고리별)
    - 피드백 페이지
    - 공지사항 페이지
[x] 알림 시스템 (구조 설계)
```

---

## 최근 업데이트 (2026-01-06)

```yaml
[x] 등급 시스템 구현 (챌린지 대체)
    - 압박감 없는 누적 기반 레벨 시스템 도입
    - 5단계 등급: 레벨 1(0) → 2(30) → 3(100) → 4(300) → 5(1000)
    - 등급 하락 없음 (영구 유지)
    - 성별 중립적 미니멀 원형 아이콘 + 색상 그라디언트
    - 활동 추적: 식단, 물, 운동 기록 시 자동 카운트
    - 프로필 페이지에 등급 뱃지 및 진행률 표시
    - 스펙 문서: docs/SPEC-LEVEL-SYSTEM.md

[x] 인벤토리 페이지 확장 (5개 카테고리)
    - 옷장, 화장대, 운동장비, 영양제, 냉장고 카테고리
    - 카테고리별 아이템 CRUD API
    - 아이콘 기반 카드 UI

[x] AI 기능 및 챌린지 자동화
    - 날씨 기반 코디 추천 API (weather-outfit)
    - 이미지 질문 답변 API (image-question)
    - 챌린지 CRUD API
    - 만료 챌린지 자동 처리 Cron

[x] CI/CD 개선
    - GitHub Actions CI 워크플로우 정리
    - Dependabot 설정 추가

[x] 코드 품질 및 호환성 개선
    - 제품 성분 분석 동적 로딩 개선
    - user_preferences 마이그레이션 스크립트 추가
    - API 라우트 Next.js 16 호환성 개선
```

---

## 최근 업데이트 (2026-01-05)

```yaml
[x] Mobile App Affiliate 모듈 테스트 완료
    - Week 6-1: 단위 테스트 추가
        - __tests__/lib/affiliate/products.test.ts (24 tests)
        - __tests__/lib/affiliate/clicks.test.ts (13 tests)
        - __tests__/lib/affiliate/utils.test.ts (35 tests)
    - Week 6-2: Utils 모듈 구현
        - lib/affiliate/utils.ts (유틸리티 함수)
            - formatPrice() - 가격 포맷팅 (₩1,000)
            - getSeasonLabel() - 시즌 한글 라벨
            - getCategoryLabel/Emoji() - 카테고리 변환
            - calculateProductMatchScore() - 매칭 점수 계산
            - calculateDiscountRate() - 할인율 계산
            - sortProducts() - 제품 정렬 (인기순/가격순/별점순)
        - lib/affiliate/index.ts - Utils export 추가
    - Week 6-3: E2E 테스트 (Maestro)
        - .maestro/products/02-affiliate-click.yaml
        - 제품 브라우징 + 어필리에이트 클릭 흐름
    - Week 6-4: 배포 문서화
        - DEPLOYMENT.md (TestFlight/Google Play 가이드)
        - eas.json 빌드 프로파일 설정 완료

[x] 코드 품질 검증 완료 (시지푸스)
    - TypeScript: ✅ 모든 패키지 통과 (shared, web, mobile)
    - Lint: ✅ 0 오류, 68 경고 (허용 수준)
    - 테스트: ✅ 436 passed, 2 skipped

[x] SDD↔구현 일치 검증 (시지푸스)
    - SDD-BEAUTY-UX-IMPROVEMENTS: 95% 구현
    - SDD-INGREDIENT-ANALYSIS: 85% 구현
    - SDD-VISUAL-ANALYSIS-ENGINE: ✅ 100% 구현 완료 (2026-01-05)
    - ✅ Tabs UI 이슈 해결: SDD에 구현 노트 추가 (스크롤 방식 채택 사유 명시)

[x] AI Fallback 패턴 분석 (시지푸스)
    - 모범 사례: lib/products/services/ingredient-analysis.ts
    - 개선 필요: lib/gemini.ts (Mock Fallback 누락)
    - 권장 개선: 타임아웃/재시도 일관성 강화

[x] Storybook 설정 및 스토리 작성
    - .storybook/main.ts, preview.ts 설정
    - Visual Analysis 컴포넌트 스토리 2개
        - BeforeAfterSlider.stories.tsx (10개 스토리)
        - HistoryCompare.stories.tsx (10개 스토리)
    - 버전 충돌 이슈 (8.x/10.x 혼재) - 추후 해결 예정

[x] Ingredient 모듈 완성
    - scripts/seed-ingredients.ts - 시드 삽입 스크립트
    - 마이그레이션 추가: 202601050200_cosmetic_ingredients_unique.sql
    - Repository 테스트 50개 추가
        - tests/types/ingredient.test.ts (15 tests)
        - tests/lib/products/repositories/ingredients.test.ts (14 tests)
        - tests/lib/products/services/ingredient-analysis.test.ts (21 tests)
    - SDD-INGREDIENT-ANALYSIS: 85% → 95% 완료

[x] 코드 품질 개선
    - Lint 경고 8개 → 0개 수정
    - TypeScript 전체 통과 유지
```

---

## Phase B: React Native Mobile App 🔄

### 진행 현황

```yaml
[x] Week 1: 모노레포 설정
    - Turborepo 구성 (apps/web, apps/mobile, packages/shared)
    - packages/shared 공통 타입/유틸리티 분리
    - 워크스페이스 스크립트 설정

[x] Week 2: Expo 초기 설정
    - Expo SDK 54 + React Native
    - Expo Router 파일 기반 라우팅
    - NativeWind (Tailwind for RN)
    - Clerk Expo 인증 연동

[x] Week 3: 핵심 화면 구현
    - (tabs)/ 5탭 네비게이션 (홈/운동/영양/기록/프로필)
    - (analysis)/ AI 분석 플로우
    - (workout)/ 운동 세션
    - (nutrition)/ 식단 기록

[x] Week 4: AI 분석 연동
    - Gemini API 연동 (피부/체형/퍼스널컬러)
    - Mock Fallback 패턴 적용
    - 카메라/갤러리 이미지 처리

[x] Week 5: 어필리에이트 모듈
    - lib/affiliate/products.ts (제품 Repository)
    - lib/affiliate/clicks.ts (클릭 트래킹)
    - lib/affiliate/deeplink.ts (딥링크 생성)
    - useAffiliateProducts, useAffiliateClick 훅

[x] Week 6: 테스트 + 배포 준비
    - 단위 테스트: 72개 (products + clicks + utils)
    - E2E 테스트: Maestro 시나리오 2개
    - DEPLOYMENT.md 작성 (TestFlight/Google Play)
    - eas.json 빌드 프로파일 설정

[ ] Week 7: TestFlight 배포 (키 연동 대기 중)
    - Apple Developer 계정 설정
    - EAS 프로젝트 연결
    - 내부 테스트 빌드
```

### 테스트 현황

| 분류        | 파일 수 | 테스트 수  | 상태       |
| ----------- | ------- | ---------- | ---------- |
| 단위 테스트 | 21      | 151+       | ✅ 통과    |
| E2E 테스트  | 2       | 2 시나리오 | ✅ Maestro |

### 주요 파일

```yaml
apps/mobile/
├── app/
│   ├── (tabs)/          # 5탭 네비게이션
│   ├── (analysis)/      # AI 분석
│   ├── (workout)/       # 운동
│   ├── (nutrition)/     # 영양
│   ├── products/        # 제품 추천
│   └── settings/        # 설정
├── lib/
│   ├── affiliate/       # 어필리에이트 모듈
│   │   ├── products.ts  # Repository
│   │   ├── clicks.ts    # 트래킹
│   │   ├── deeplink.ts  # 딥링크
│   │   ├── utils.ts     # 유틸리티
│   │   └── index.ts     # 통합 export
│   ├── monitoring/      # Sentry, Analytics
│   └── offline/         # 오프라인 캐시
├── __tests__/
│   └── lib/affiliate/   # 테스트
├── .maestro/            # E2E 테스트
└── DEPLOYMENT.md        # 배포 가이드
```

---

## 최근 업데이트 (2026-01-04)

```yaml
[x] 화장품 성분 분석 시스템 (화해 스타일) - Phase 1~3 완료
    - Phase 1: DB 스키마 + 타입 정의 + 시드 데이터
        - types/ingredient.ts (CosmeticIngredient, EWG 타입)
        - supabase/migrations/202601040100_cosmetic_ingredients.sql
        - data/cosmetic-ingredients-seed.json (100개 성분)
    - Phase 2: UI 컴포넌트 8개 + 제품 상세 페이지 통합
        - components/products/ingredients/IngredientAnalysisSection.tsx (메인)
        - components/products/ingredients/IngredientEWGBadge.tsx (EWG 배지)
        - components/products/ingredients/IngredientCautionAlert.tsx (주의 알림)
        - components/products/ingredients/IngredientFilterTabs.tsx (필터 탭)
        - components/products/ingredients/IngredientCard.tsx (개별 카드)
        - components/products/ingredients/IngredientList.tsx (성분 목록)
        - components/products/ingredients/IngredientFunctionChart.tsx (기능 차트)
        - components/products/ingredients/SkinTypeAnalysis.tsx (피부타입 분석)
        - lib/products/repositories/ingredients.ts (Repository)
    - Phase 3: AI 분석 + 시각화
        - lib/products/services/ingredient-analysis.ts (Gemini AI + Mock Fallback)
        - components/products/ingredients/AIIngredientSummary.tsx (AI 요약 UI)
        - 핵심 키워드, 한줄 요약, 추천/주의 포인트, 피부타입별 추천도
    - 제품 상세 페이지 통합
        - app/(main)/beauty/[productId]/page.tsx 연동
[x] 시지푸스 자동 실행 활성화
    - .claude/agents/sisyphus-adaptive.md PROACTIVE 트리거 추가
    - 4개+ 파일, 아키텍처 변경, 리스크 요소 시 자동 실행
[x] Beauty UX 개선 - 경쟁사 분석 기반 5개 항목
    - #1 리뷰 AI 요약 키워드 (화해 스타일)
        - components/products/reviews/ReviewAIKeywords.tsx
        - 긍정/부정 키워드 TOP 5 추출
        - AI 요약 문장, 추천/주의 포인트
    - #2 긍정/부정 리뷰 필터 (글로우픽 스타일)
        - components/products/reviews/ReviewSentimentFilter.tsx
        - 전체/긍정/부정/포토 필터링
    - #3 타임딜/특가 섹션 (화해/올리브영 스타일)
        - components/beauty/TimeDealSection.tsx
        - 실시간 카운트다운, 재고 소진율 표시
    - #4 리뷰 작성 포인트 시스템 (언니의파우치 스타일)
        - components/products/reviews/ReviewPointsBadge.tsx
        - 포인트 정책 상세, 첫 리뷰 보너스
    - #5 SNS형 피드 강화 (올리브영 셔터 스타일)
        - components/beauty/BeautyFeed.tsx
        - 좋아요/댓글/저장, 연관 제품 태그
[x] ReviewSection 통합
    - AI 키워드, 감성 필터, 포인트 배지 통합
[x] Beauty 페이지 통합
    - TimeDealSection, BeautyFeed 배치
[x] 스펙 문서 작성
    - docs/SDD-BEAUTY-UX-IMPROVEMENTS.md
    - docs/SDD-INGREDIENT-ANALYSIS.md
```

---

## 최근 업데이트 (2025-12-30)

```yaml
[x] 바코드 스캔 기능 완성
    - 식품안전나라 API 연동 (한국 제품용)
    - 데이터 소스 배지 표시
    - 3단계 fallback (로컬 DB → OFF → FSK)
[x] 미사용 코드 정리 (9개 파일 삭제)
[x] 피드백 페이지 구현 (/help/feedback)
[x] 문서 업데이트
    - SDD-BARCODE-SCAN.md 구현 완료 표시
    - PROGRESS.md 대규모 업데이트
```

---

## Phase 1 테스트 ✅ (2025-12-04 추가)

### 테스트 파일 구성

```yaml
[x] tests/lib/mock/personal-color.test.ts (25 tests)
    - generateMockPersonalColorResult() 테스트
    - calculateSeasonType() 알고리즘 테스트
    - 상수 데이터 검증 (SEASON_INFO, BEST_COLORS 등)
    - 유틸리티 함수 테스트

[x] tests/lib/mock/skin-analysis.test.ts (24 tests)
    - generateMockAnalysisResult() 테스트
    - 7가지 피부 지표 검증
    - 상태 결정 로직 테스트
    - 유틸리티 함수 테스트

[x] tests/lib/mock/body-analysis.test.ts (21 tests)
    - generateMockBodyAnalysis() 테스트
    - 8가지 체형 타입 검증
    - BMI 계산 및 카테고리 테스트
    - 체형별 측정값 범위 테스트

[x] tests/lib/product-recommendations.test.ts (28 tests)
    - getRoutineForSkinType() 테스트
    - getProductsForConcerns() 테스트
    - getMakeupRecommendations() 테스트
    - extractConcernsFromMetrics() 테스트
    - generateProductRecommendations() 통합 테스트

[x] tests/lib/color-recommendations.test.ts (42 tests)
    - generateColorRecommendations() 테스트
    - 4계절별 색상 팔레트 검증
    - 체형별 색상 필터링 테스트
    - getColorTipsForBodyType() 테스트
```

**테스트 실행**: `npm run test -- tests/lib/ --run`
**총 테스트**: 140개 (모두 통과)

---

## 배포 전 TODO ⚠️

### DB 마이그레이션 파일 작성 필요

```yaml
[ ] Phase 1 테이블 마이그레이션 파일 생성
    - supabase/migrations/ 디렉토리에 SQL 파일 추가
    - 현재 테이블은 Supabase 대시보드에서 직접 생성됨
    - 배포 전 마이그레이션 파일로 정리 필요

[ ] 테이블별 마이그레이션:
    - users 테이블 (Clerk 연동)
    - personal_color_assessments 테이블 (PC-1)
    - skin_analyses 테이블 (S-1)
    - body_analyses 테이블 (C-1)
    - ingredients 테이블 (성분 DB) - 기존 파일 존재

[ ] RLS 정책 마이그레이션:
    - clerk_user_id 기반 RLS 정책
    - 각 테이블별 정책 설정

[ ] Storage 버킷 설정:
    - personal-color-images
    - skin-images
    - body-images
    - 버킷별 액세스 정책
```

**참고**: 각 테스트 파일 하단에 해당 모듈 관련 마이그레이션 TODO가 주석으로 기록되어 있음

---

## 추가 완료 항목

### 인프라 설정

```yaml
[x] .env.local 환경 변수 설정
[x] Supabase 프로젝트 연결
[x] Clerk 앱 설정
[x] Gemini API 키 등록
```

### 인증 테스트

```yaml
[x] /auth-test 페이지 구현
[x] Clerk → Supabase 사용자 동기화
[x] RLS 정책 테스트
```

---

## Gemini AI 모델 계획

### 현재 설정 (개발/테스트)

```yaml
모델: gemini-2.5-flash
설정 파일: lib/gemini.ts
환경변수: GEMINI_MODEL (선택적 오버라이드)
```

### MVP 완성 시 업그레이드 예정

```yaml
[ ] Gemini 3 Pro 업그레이드
    - 모델 ID: gemini-3-pro (출시 후 확인 필요)
    - 예상 시점: 베타 테스트 완료 후
    - 필요 작업: Google Cloud Billing 활성화
```

### Gemini 모델 비교

| 모델             | 용도           | 비용      | 성능     |
| ---------------- | -------------- | --------- | -------- |
| gemini-2.5-flash | 현재 (개발)    | 무료/저가 | 빠름     |
| gemini-2.5-pro   | 고성능 필요 시 | 유료      | 높음     |
| **gemini-3-pro** | **MVP 완성본** | **유료**  | **최고** |

### 환경변수 설정 예시

```bash
# .env.local

# 개발 중 (현재)
GEMINI_MODEL=gemini-2.5-flash

# MVP 완성 후 (예정)
# GEMINI_MODEL=gemini-3-pro

# Mock 모드 (AI 비용 절약)
FORCE_MOCK_AI=true
```

### 업그레이드 체크리스트

```yaml
[ ] Google Cloud Billing 활성화
[ ] Gemini 3 Pro API 접근 권한 확인
[ ] .env.local GEMINI_MODEL 변경
[ ] 프롬프트 최적화 (필요시)
[ ] 응답 품질 테스트
[ ] 비용 모니터링 설정
```

---

## 참조 문서

| 문서            | 위치                                                        |
| --------------- | ----------------------------------------------------------- |
| 마스터 플랜     | `3-phase1-docs/마스터-프로젝트-플랜-v2.4-Updated.md`        |
| Week 가이드     | `3-phase1-docs/Week-0-7-Phase1-완전가이드-v2.4-Hook버전.md` |
| 개발 체크리스트 | `3-phase1-docs/개발전-최종-검토-체크리스트-v2.4-Updated.md` |
| 프로젝트 TODO   | `docs/TODO.md`                                              |

---

**상태 범례**:

- ✅ 완료
- 🔄 진행 중
- ⏳ 대기
- ❌ 중단/취소
