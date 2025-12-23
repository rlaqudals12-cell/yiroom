# 이룸 전체 진행 상황

> **마지막 업데이트**: 2025-12-23
> **총 테스트**: 2,686개 통과 (메모리 최적화 완료)
> **코드 품질**: SRP 95%, Repository 90%

---

## 한눈에 보기

```
Phase 1 (분석 기능)     ████████████████████ 100% ✅
Phase 2 (운동/영양)     ████████████████████ 100% ✅
Phase 3 (앱 고도화)     ████████████████████ 100% ✅
Phase A (PWA/디자인)    ████████████████████ 100% ✅
Phase B (React Native)  ████████████████░░░░  83% 🔄 (B-6: 2026/01/17 대기)
Phase C (RAG/제품DB)    ████████████████████ 100% ✅
Phase D (앱 개선)       ████████████████████ 100% ✅
Phase E (추가 개선)     ████████████████████ 100% ✅
Phase F (운영 준비)     ██████████████████░░  90% 🔄 (F-1~F-5 완료, F-6 보안 진행 중)
Phase G (Product v3)    ████████████████████ 100% ✅ (Sprint 1-3 완료, 2025-12-19)
```

---

## Phase 1: 분석 기능 ✅ 완료

> **완료일**: 2025-11-26 | **테스트**: 140개

### 모듈별 상태

| 모듈 | 설명 | 상태 | 테스트 |
|------|------|------|--------|
| PC-1 | 퍼스널 컬러 진단 | ✅ 완료 | 25개 |
| S-1 | 피부 분석 | ✅ 완료 | 52개 |
| C-1 | 체형 분석 | ✅ 완료 | 21개 |
| 성분 분석 | 화장품 성분 경고 | ✅ 완료 | - |
| 제품 추천 | 피부타입별 추천 | ✅ 완료 | 70개 |

### 주요 기능

```yaml
PC-1 퍼스널 컬러:
  [x] 10개 문진 질문 + 이미지 분석
  [x] 4계절 16톤 시스템 (Spring/Summer/Autumn/Winter)
  [x] 퍼스널 컬러 팔레트 표시
  [x] 연예인 매칭
  [x] Gemini AI 연동

S-1 피부 분석:
  [x] 카메라/갤러리 이미지 업로드
  [x] 7가지 피부 지표 분석 (수분, 유분, 모공 등)
  [x] 피부 타입 결정 (건성/지성/복합/민감/정상)
  [x] 성분 경고 시스템 (ingredients 테이블)
  [x] 루틴 제품 추천 (5-7단계)
  [x] 퍼스널 컬러 기반 파운데이션 추천

C-1 체형 분석:
  [x] 키/체중 입력 + 이미지 분석
  [x] 8가지 체형 분류 (Rectangle, Triangle 등)
  [x] BMI 계산 및 표시
  [x] 퍼스널 컬러 연동 색상 추천
  [x] 체형별 핏/실루엣 추천
```

---

## Phase 2: 운동/영양 ✅ 완료

> **완료일**: 2025-12-03 | **테스트**: 1,938개

### 모듈별 상태

| 모듈 | 설명 | Sprint | 상태 | 테스트 |
|------|------|--------|------|--------|
| W-1 | 운동/피트니스 | 4개 완료 | ✅ 완료 | 703개 |
| N-1 | 영양/식단 | 3개 완료 | ✅ 완료 | 680개 |
| R-1 | 주간/월간 리포트 | 2개 완료 | ✅ 완료 | 67개 |

### W-1 운동/피트니스

```yaml
온보딩 (7단계):
  [x] Step 1: C-1 체형 데이터 확인
  [x] Step 2: 운동 목표 선택
  [x] Step 3: 신체 고민 선택
  [x] Step 4: 운동 빈도
  [x] Step 5: 운동 장소/장비
  [x] Step 6: 목표 설정 (체중/기간)
  [x] Step 7: 부상/통증 확인

분석 & 결과:
  [x] 5가지 운동 타입 분류 (toner/builder/burner/mover/flexer)
  [x] AI 기반 운동 추천
  [x] 주간 운동 플랜 생성
  [x] 연예인 루틴 매칭 (20명 DB)
  [x] 운동 상세 (자세 가이드 + YouTube 영상)

운동 기록:
  [x] 운동 세션 시작/완료
  [x] 세트/횟수/무게 트래킹
  [x] 휴식 타이머
  [x] 칼로리 소모량 계산 (MET 기반)
  [x] 운동 히스토리 (주간 캘린더)
  [x] Streak 시스템 (연속 기록 + 배지)

연동 기능:
  [x] PC-1 → 운동복 스타일 추천
  [x] S-1 → 운동 후 피부 관리 팁
  [x] N-1 → 운동 후 영양 가이드
  [x] 쇼핑 연동 (무신사/나이키/아디다스/룰루레몬)
```

### N-1 영양/식단

```yaml
온보딩 (7단계):
  [x] Step 1: 식사 목표 선택
  [x] Step 2: 기본 정보 (C-1 연동)
  [x] Step 3: 선호 식사 스타일
  [x] Step 4: 요리 스킬 레벨
  [x] Step 5: 예산 선택
  [x] Step 6: 알레르기/기피 음식
  [x] Step 7: 식사 횟수

AI 음식 분석:
  [x] Gemini Vision 음식 인식
  [x] 신호등 시스템 (눔 방식 칼로리 밀도)
  [x] 영양소 자동 분석 (탄단지/칼로리)

식단 기록:
  [x] 식사 기록 (아침/점심/저녁/간식)
  [x] 음식 직접 검색/입력
  [x] 수분 섭취 트래킹
  [x] 간헐적 단식 타이머 (16:8, 18:6 등)
  [x] 즐겨찾기 음식

대시보드:
  [x] 일일 칼로리 프로그레스 링
  [x] 영양소 바 차트
  [x] BMR/TDEE 계산
  [x] 식단 Streak

연동 기능:
  [x] C-1 → BMR 자동 계산, 체형 기반 칼로리 조정
  [x] W-1 → 운동 칼로리 차감 (순 칼로리)
  [x] S-1 → 피부 수분 → 수분 권장량 조정
```

### R-1 주간/월간 리포트

```yaml
주간 리포트:
  [x] 주간 영양 요약 (평균 칼로리/탄단지)
  [x] 주간 운동 요약 (횟수/시간/칼로리)
  [x] 칼로리 트렌드 차트
  [x] Streak 정보

월간 리포트:
  [x] 월간 통합 통계
  [x] 주간 비교 차트
  [x] AI 인사이트 생성
  [x] 목표 진행률
  [x] 체중 변화 추적 (C-1 연동)
```

---

## Phase 3: 앱 고도화 ✅ 완료

> **완료일**: 2025-12-04 | **추가 테스트**: 110개

### Sprint별 상태

| Sprint | 내용 | 상태 |
|--------|------|------|
| Sprint 1 | 네비게이션 개선 | ✅ 완료 |
| Sprint 2 | UI/UX 개선 | ✅ 완료 |
| Sprint 3 | 운동 기록 활성화 | ✅ 완료 |
| Sprint 4 | E2E 테스트 | ✅ 완료 |
| Sprint 5 | 크로스 모듈 연동 | ✅ 완료 |

```yaml
네비게이션:
  [x] Navbar (데스크탑)
  [x] BottomNav (모바일)
  [x] 운동/영양/리포트 링크

UI/UX:
  [x] 대시보드 리포트 위젯
  [x] Phase 2 모듈 상태 섹션
  [x] 빈 상태 UI (EmptyStateCard)
  [x] 온보딩 체크 로직

운동 기록:
  [x] 세션 완료 시 DB 저장
  [x] 에러 핸들링/재시도 로직
  [x] 히스토리 실제 데이터 연동
  [x] 리포트 운동 데이터 반영

크로스 모듈:
  [x] 칼로리 초과 → 운동 유도 알림
  [x] 운동 후 → 식단 추천
  [x] 통합 알림 시스템 (CrossModuleAlert)

E2E 테스트:
  [x] Playwright 설정
  [x] 인증 플로우 테스트 (Clerk)
  [x] 운동 온보딩 E2E
  [x] 영양 기록 E2E
  [x] 리포트 조회 E2E
```

---

## Phase A: PWA + 디자인 ✅ 완료

> **완료일**: 2025-12-11

### A-0: 디자인 토큰 ✅ 완료

| 항목 | 상태 |
|------|------|
| globals.css 색상 변환 | ✅ #2e5afa → oklch(0.53 0.23 262) |
| 폰트 설정 | ✅ Inter + Noto Sans KR (한국어 지원) |
| 빌드 테스트 | ✅ 통과 |

### A-1: Lite PWA ✅ 완료

| 항목 | 상태 |
|------|------|
| @ducanh2912/next-pwa 설치 | ✅ |
| app/manifest.ts 생성 | ✅ |
| next.config.ts PWA 래핑 | ✅ |
| .gitignore 업데이트 | ✅ |
| PWA 아이콘 (public/icons/) | ✅ 이룸 브랜딩 적용 |
| 로고 교체 | ✅ public/logo.png |
| OG 이미지 교체 | ✅ public/og-image.png |
| 파비콘 | ✅ favicon-16x16.png, favicon-32x32.png |
| manifest.json | ✅ public/manifest.json |

### A-2: Product DB v1 ✅ 완료

| 항목 | 상태 |
|------|------|
| cosmetic_products 테이블 | ✅ `supabase/migrations/20251204_product_tables.sql` |
| supplement_products 테이블 | ✅ |
| TypeScript 타입 | ✅ `types/product.ts` |
| API 유틸리티 | ✅ `lib/products.ts` |
| RLS 정책 | ✅ 공개 읽기 + Service Role 쓰기 |
| 시드 데이터 (화장품 135개) | ✅ `data/seeds/cosmetic-products.json` |
| 시드 데이터 (영양제 30개) | ✅ `data/seeds/supplement-products.json` |
| 시드 스크립트 | ✅ `scripts/seed-products.ts` |
| 데이터 입력 가이드 | ✅ `docs/PRODUCT-DATA-GUIDE.md` |
| 총 165개 제품 데이터 | ✅ 완료 |

### A-0 디자인 토큰

```yaml
[x] globals.css Stitch 색상 적용
[x] oklch 색상 포맷 변환 (#2e5afa → oklch)
[x] CSS 변수 통합 (--primary, --background 등)
[x] 빌드 테스트 통과
```

### A-1 Lite PWA

```yaml
[x] @ducanh2912/next-pwa 설치
[x] app/manifest.ts 생성 (이룸 브랜딩)
[x] next.config.ts PWA 래핑
[x] .gitignore PWA 캐시 파일 추가
[x] public/icons/ 아이콘 4종 (192~512px) - 이룸 브랜딩
[x] 브랜딩 아이콘 적용 (이룸 꽃 아이콘)
[x] 로고/OG 이미지 적용 (2025-12-11)
[x] 파비콘 생성 (16x16, 32x32)
[x] public/manifest.json PWA 매니페스트
```

### A-2 Product DB v1

```yaml
[x] cosmetic_products 테이블 (`supabase/migrations/20251204_product_tables.sql`)
[x] supplement_products 테이블
[x] GIN 인덱스 (skin_types, concerns, benefits)
[x] RLS 정책 (공개 읽기 + Service Role 쓰기)
[x] TypeScript 타입 (`types/product.ts`)
[x] API 유틸리티 (`lib/products.ts`)
[x] 초기 데이터 입력 (165개)
    - [x] 클렌저 20개
    - [x] 토너 20개
    - [x] 세럼/에센스 25개
    - [x] 수분크림 20개
    - [x] 선크림 15개
    - [x] 마스크 2개
    - [x] 메이크업 33개
    - [x] 영양제 30개
```

---

## Phase B: React Native 🔄 진행 중

> **목표**: iOS/Android 네이티브 앱
> **기술**: Expo SDK 54 / Turborepo 모노레포
> **시작일**: 2025-12-04

### 전체 진행률

| Sprint | 내용 | Task | 상태 |
|--------|------|------|------|
| B-1 | 모노레포 설정 | 5개 | ✅ 완료 |
| B-2 | 인증 & 데이터 | 5개 | ✅ 완료 |
| B-3 | Phase 1 포팅 | 6개 | ✅ 완료 |
| B-4 | Phase 2 포팅 | 6개 | ✅ 완료 |
| B-5 | 배포 준비 | 7개 | ✅ 완료 |
| B-6 | 정식 배포 | 8개 | 🔒 2026/01/17 이후 |

### B-1 모노레포 설정 ✅ 완료

```yaml
[x] Turborepo 초기화 (turbo.json, 루트 package.json)
[x] 디렉토리 구조 (apps/web, apps/mobile, packages/shared)
[x] packages/shared 공통 타입 (@yiroom/shared)
[x] Expo SDK 54 프로젝트 생성 (@yiroom/mobile)
[x] 기본 네비게이션 구조 (Expo Router + 5개 탭)
```

### B-2 인증 & 데이터 ✅ 완료

```yaml
[x] Clerk React Native SDK 설치 (@clerk/clerk-expo, expo-secure-store)
[x] Clerk Provider + Token Cache 설정 (lib/clerk.ts)
[x] Supabase 클라이언트 Clerk JWT 통합 (lib/supabase.ts)
[x] Zustand 스토어 재사용 (@yiroom/shared 타입 연동)
[x] 인증 화면 (sign-in.tsx, sign-up.tsx)
```

### B-3 Phase 1 포팅 ✅ 완료

```yaml
[x] 로그인/회원가입 화면 (B-2에서 완료)
[x] 대시보드 화면 (홈 탭 + 분석 탭)
[x] PC-1 퍼스널 컬러 (expo-camera) - 문진 + 카메라 + 결과
[x] S-1 피부 분석 (expo-camera) - 가이드 + 카메라 + 결과
[x] C-1 체형 분석 (expo-image-picker) - 입력 + 갤러리 + 결과
[x] Gemini AI 분석 모듈 (lib/gemini.ts + Mock Fallback)
```

### B-4 Phase 2 포팅 ✅ 완료

```yaml
[x] W-1 운동 온보딩/결과 (3단계: 목표/빈도/결과)
[x] W-1 운동 세션/타이머 (4단계 상태: ready/exercising/resting/completed)
[x] N-1 영양 대시보드 (칼로리 링 + 영양소 바 차트)
[x] N-1 음식 기록 (빠른 추가 + 촬영 준비)
[x] R-1 리포트 화면 (통합 분석 결과 + 운동/영양 현황)
[x] 푸시 알림 (운동/식단 리마인더) - B-5에서 완료
```

### B-5 배포 준비 ✅ 완료 (사업자 등록 전)

> **참고**: 사업자 등록 전까지 스토어 배포 불가 (2026/01/17 이후 예정)

```yaml
[x] EAS Build 설정 (eas.json + 개발/프리뷰/프로덕션 프로필)
[x] Development Build 설정 (expo-dev-client)
[x] Android APK 빌드 스크립트 (build:local:android)
[x] 앱 스토어 메타데이터 (store-metadata.json)
[x] 프라이버시 정책 페이지 (/privacy)
[x] 이용약관 페이지 (/terms)
[x] 푸시 알림 설정 (expo-notifications + lib/notifications.ts)
```

### B-6 정식 배포 (2026/01/17 이후)

> **전제조건**: 사업자 등록 완료

```yaml
[ ] Apple Developer Program 가입 ($99/년)
[ ] Google Play Developer 등록 ($25)
[ ] iOS TestFlight 베타 배포
[ ] Android 내부 테스트 트랙 배포
[ ] 베타 테스터 피드백 수집 (2주)
[ ] App Store 심사 제출
[ ] Google Play 심사 제출
[ ] 정식 출시
```

---

## Phase C: RAG + Product DB v2 🔄 진행 중

> **목표**: 논문 기반 AI 추천 + 제품 DB 확장
> **기술**: pgvector / OpenAI Embeddings
> **시작일**: 2025-12-04

### 전체 진행률

| Sprint | 내용 | Task | 상태 |
|--------|------|------|------|
| C-1 | RAG 인프라 | 5개 | ✅ 완료 |
| C-2 | 문서 임베딩 | 6개 | ✅ 완료 (150개) |
| C-3 | Product DB v2 | 6개 | ✅ 완료 |

### C-1 RAG 인프라 ✅ 완료

```yaml
[x] pgvector 확장 활성화 (supabase/migrations/20251204_pgvector_rag.sql)
[x] research_documents 테이블 생성 (+ document_chunks 청크 테이블)
[x] 벡터 인덱스 (ivfflat, 1536차원, lists=100)
[x] 임베딩 생성 함수 (OpenAI text-embedding-ada-002)
[x] 벡터 검색 API 구현 (lib/rag.ts)
    - search_documents: 코사인 유사도 검색
    - hybrid_search_documents: 벡터 + 텍스트 하이브리드
    - search_document_chunks: 청크 단위 검색
    - generateRAGResponse: Gemini 기반 RAG 응답
```

### C-2 문서 임베딩 ✅ 완료

```yaml
[x] 시드 데이터 구조 및 스크립트 생성
    - data/seeds/research-skincare.json (50개)
    - data/seeds/research-nutrition.json (50개)
    - data/seeds/research-fitness.json (50개)
    - scripts/seed-research-documents.ts
[x] 문서 수집 가이드 작성 (docs/RESEARCH-DATA-GUIDE.md)
[x] 피부과학 연구 문서 수집 (50개)
[x] 영양학 연구 문서 수집 (50개)
[x] 운동생리학 연구 문서 수집 (50개)
```

### C-3 Product DB v2 ✅ 완료

```yaml
DB 스키마 & 인프라:
  [x] workout_equipment 테이블 (supabase/migrations/20251204_product_db_v2.sql)
  [x] health_foods 테이블
  [x] product_price_history 테이블 (가격 추적용)
  [x] 기존 테이블에 affiliate_url 컬럼 추가
  [x] RLS 정책 (공개 읽기 + Service Role 쓰기)

API & 타입:
  [x] TypeScript 타입 확장 (types/product.ts v2)
      - WorkoutEquipment, HealthFood 인터페이스
      - Filter, Row 타입
      - toWorkoutEquipment, toHealthFood 변환 함수
  [x] API 유틸리티 확장 (lib/products.ts v2)
      - getWorkoutEquipment, getWorkoutEquipmentById
      - getRecommendedEquipment
      - getHealthFoods, getHealthFoodById
      - getRecommendedHealthFoods, getHighProteinFoods
      - 브랜드 조회 함수

시드 데이터:
  [x] 운동 기구 시드 (data/seeds/products-workout-equipment.json) - 50개
  [x] 건강식품 시드 (data/seeds/products-health-foods.json) - 100개
  [x] 시드 스크립트 (scripts/seed-product-db-v2.ts)

데이터 확장:
  [x] 화장품 확장 (500/500개) - 2025-12-05 +315 ✅
  [x] 영양제 확장 (200/200개) - 2025-12-05 +150 ✅
  [x] 운동 기구 확장 (50/50개) - 2025-12-05 +30 ✅
  [x] 건강식품 확장 (100/100개) - 2025-12-05 +80 ✅
  [x] 가격 실시간 업데이트 (크롤링) - 2025-12-09 ✅
      - lib/crawler/ 모듈 구현
      - 4개 소스 지원:
        - Mock (테스트/개발용)
        - Naver Shopping API
        - Coupang Partners API (HMAC 인증)
        - OliveYoung (화장품 전용 스크래핑)
      - 제품 타입별 우선순위 자동 선택
        - 화장품: oliveyoung → naver → coupang
        - 영양제/운동기구/건강식품: naver → coupang
      - /api/admin/price-update 관리자 API
      - /api/cron/update-prices Vercel Cron (매일 3시)
      - 44개 테스트 통과
```

---

## Phase D: 앱 개선 ✅ 완료

> **목표**: 테스트 커버리지 확대 + 코드 품질 개선 + 성능 최적화 + 추가 기능
> **완료일**: 2025-12-11

### 전체 진행률

| Step | 내용 | 상태 |
|------|------|------|
| Step 1 | 테스트 커버리지 확대 | ✅ 완료 |
| Step 2 | 코드 품질 개선 | ✅ 완료 |
| Step 3 | 성능 최적화 | ✅ 완료 |
| Step 4 | 디자인 에셋 교체 | ✅ 완료 |
| Step 5 | 추가 기능 구현 | ✅ 완료 |
| Step 6 | UI 개선 (공유/애니메이션) | ✅ 완료 |

### Step 1: 테스트 커버리지 확대 ✅ 완료

```yaml
테스트 추가:
  [x] 리포트 컴포넌트 테스트 (67개)
      - CalorieTrendChart.test.tsx
      - WeeklyComparisonChart.test.tsx
      - ReportHeader.test.tsx
      - NutritionSummaryCard.test.tsx
      - WorkoutSummaryCard.test.tsx
      - InsightCard.test.tsx
      - StreakBadge.test.tsx
      - BodyProgressCard.test.tsx
      - GoalProgressCard.test.tsx
  [x] 크롤러 모듈 테스트 (44개)
      - mock-source.test.ts
      - naver-source.test.ts
      - coupang-source.test.ts
      - oliveyoung-source.test.ts
      - price-update-service.test.ts

결과:
  - 이전: 2,048개 → 현재: 2,491개 (+443개)
  - 모든 테스트 통과 ✅
```

### Step 2: 코드 품질 개선 ✅ 완료

```yaml
린트 수정:
  [x] ESLint 경고 0개 달성
  [x] TypeScript strict 모드 호환
  [x] 미사용 import 제거
  [x] 코드 일관성 개선

파일 정리:
  [x] 중복 코드 제거
  [x] 타입 정의 통합
```

### Step 3: 성능 최적화 ✅ 완료

```yaml
번들 최적화:
  [x] @next/bundle-analyzer 설치 및 설정
  [x] recharts Dynamic Import (components/reports/dynamic.tsx)
      - CalorieTrendChartDynamic
      - WeeklyComparisonChartDynamic
      - ~200KB 번들 크기 감소
  [x] 리포트 페이지 Dynamic Import 적용
      - app/(main)/reports/weekly/[weekStart]/page.tsx
      - app/(main)/reports/monthly/[month]/page.tsx
  [x] 추가 Dynamic Import 적용 (2025-12-19)
      - components/nutrition/dynamic.tsx
        - ManualFoodInputSheetDynamic, WaterInputSheetDynamic
        - FastingTimerDynamic
        - SkinInsightCardDynamic, WorkoutInsightCardDynamic, BodyInsightCardDynamic
        - ~150KB 번들 크기 감소 (추정)
      - components/products/dynamic.tsx
        - ProductFiltersDynamic
        - ~50KB 번들 크기 감소 (추정)
      - components/products/detail/dynamic.tsx
        - PriceHistoryChartDynamic (recharts)
        - ~100KB 번들 크기 감소 (추정)

아이콘 라이브러리 통합:
  [x] react-icons → lucide-react 마이그레이션
      - app/auth-test/page.tsx
      - app/storage-test/page.tsx
  [x] react-icons 의존성 제거
  [x] 번들 사이즈 감소 (tree-shaking 최적화)

빌드 스크립트:
  [x] "build:analyze": "ANALYZE=true next build" 추가

Lighthouse 최적화 (2025-12-19):
  [x] Preconnect 힌트 추가 (app/layout.tsx)
      - fonts.googleapis.com, fonts.gstatic.com
      - clerk.com, img.clerk.com, supabase.co
  [x] PWA manifest 활성화 (middleware에서 제외 확인)
  [x] loading.tsx 7개 페이지 적용 (이전 완료)
  [x] 이미지 최적화 (AVIF/WebP) 적용
  [x] 폰트 최적화 (next/font) 적용
```

### Step 4: 디자인 에셋 교체 ✅ 완료

```yaml
적용된 에셋:
  [x] PWA 아이콘 4종 (192~512px) - 이룸 꽃 아이콘
  [x] 앱 로고 (public/logo.png) - 이룸 브랜드 로고
  [x] OG 이미지 (public/og-image.png) - "온전한 나를 찾아가는 여정"
  [x] 파비콘 (favicon-16x16.png, favicon-32x32.png)
  [x] PWA 매니페스트 (public/manifest.json)

완료일: 2025-12-11
```

### Step 4b: 브랜딩 중립화 🔄 진행 중

```yaml
문제점:
  - 현재 로고: 꽃 아이콘 + 핑크/라벤더 그라데이션
  - 여성 타겟 연상 → 타겟(성별 무관)과 불일치

리서치 완료 (2025-12-19):
  [x] 벤치마크 분석 (Calm, Headspace, Nike Training)
  [x] 심볼 후보 선정: 나선/스파이럴, 동심원
  [x] 브랜딩 스펙 문서 작성
      - docs/research/reviewed/branding-specification.md

대기 작업:
  [ ] Figma 디자인 (로고 + 앱 아이콘)
  [ ] 에셋 제작 (PNG 각 크기)
  [ ] public/ 파일 교체

참고 자료:
  - 99designs, DesignRush, VistaPrint 웰니스 로고 트렌드
  - Headspace: 오렌지 색상으로 친근함 표현
  - Calm: 블루 계열 + 미니멀 디자인
```

### Step 5: 추가 기능 구현 ✅ 완료

```yaml
문서 작성:
  [x] Feature Spec (docs/phase-next/FEATURE-SPEC-PRODUCT-UI.md)
  [x] Sprint Backlog (docs/phase-next/SPRINT-BACKLOG-PRODUCT-UI.md)

구현 완료:
  [x] Product DB 사용자 UI (제품 탐색/필터/검색)
      - /products 페이지 (카테고리 탭, 그리드)
      - ProductFilters (가격대/피부타입/피부고민/퍼스널컬러)
      - ProductSearch (검색)
      - ProductSort (정렬)
  [x] 개인화 추천 (PC-1/S-1/C-1 연동)
      - /products/recommended 페이지
      - 5개 섹션 (스킨케어/메이크업/영양제/운동기구/건강식품)
      - 분석 미완료 시 잠금 섹션
  [x] 제품 상세 페이지
      - /products/[type]/[id] 동적 라우트
      - ProductDetailTabs (상세/성분/구매)
      - ProductMatchCard (매칭도 카드)
  [x] 매칭도 계산 및 표시
      - lib/products/matching.ts
      - calculateMatchScore, addMatchInfo 함수
      - 테스트 44개 (matching 11 + ProductCard 15 + ProductFilters 18)
  [x] Repository 패턴 리팩토링
      - lib/products.ts (1,214줄) → lib/products/ 구조 분리
      - repositories/ (5개 파일): cosmetic, supplement, equipment, healthfood, price-history
      - services/search.ts: 통합 검색/정렬
      - 기존 API 호환 유지 (re-export)

완료일: 2025-12-09
```

### Step 6: UI 개선 (공유/애니메이션) ✅ 완료

```yaml
공유 기능:
  [x] html-to-image, canvas-confetti 패키지 설치
  [x] lib/share/imageGenerator.ts (HTML → 이미지 캡처)
  [x] lib/share/shareUtils.ts (Web Share API + 다운로드 폴백)
  [x] components/share/ShareButton.tsx (공유 버튼)
  [x] components/share/ShareableCard.tsx (공유용 카드 래퍼)
  [x] hooks/useShare.ts (ref 기반 공유 훅)

와우 모먼트 애니메이션:
  [x] globals.css 커스텀 keyframes (fade-in-up, scale-in)
  [x] components/animations/FadeInUp.tsx (순차 등장)
  [x] components/animations/ScaleIn.tsx (스케일 등장)
  [x] components/animations/Confetti.tsx (축하 효과)
  [x] components/animations/CountUp.tsx (숫자 카운트업)
  [x] prefers-reduced-motion 접근성 지원

결과 화면 적용:
  [x] SessionCompletionCard useShare 연동
  [x] AnalysisResult ShareButton 적용

완료일: 2025-12-11
```

---

## Phase E: 추가 개선 ✅ 완료

> **목표**: SEO 최적화 + 코드 품질 + Product UI 확장 + AI 기능
> **완료일**: 2025-12-11

### 전체 진행률

| Step | 내용 | 상태 |
|------|------|------|
| E-1 | SEO 기본 | ✅ 완료 |
| E-2 | 코드 품질 | ✅ 완료 |
| E-3 | Product UI 확장 | ✅ 완료 |
| E-4 | AI 기능 확장 | ✅ 완료 |

### E-1: SEO 기본 ✅ 완료

```yaml
[x] app/robots.ts - 검색 엔진 크롤링 규칙
[x] app/sitemap.ts - 동적 사이트맵 생성
[x] app/not-found.tsx - 커스텀 404 페이지
[x] app/error.tsx - 커스텀 에러 페이지
[x] app/global-error.tsx - 루트 에러 핸들러
```

### E-2: 코드 품질 ✅ 완료

```yaml
[x] .prettierrc - 코드 포맷터 설정
[x] .prettierignore - 포맷 제외 파일
[x] .github/workflows/ci.yml - CI 파이프라인
[x] .husky/pre-commit - 커밋 전 검사
[x] package.json - lint-staged 설정
```

### E-3: Product UI 확장 ✅ 완료

```yaml
[x] components/products/detail/PriceHistoryChart.tsx - 가격 히스토리 차트
[x] supabase/migrations/20251211_wishlist.sql - 위시리스트 DB
[x] lib/wishlist.ts - 위시리스트 API
[x] components/products/WishlistButton.tsx - 위시리스트 버튼
[x] app/(main)/wishlist/page.tsx - 위시리스트 페이지
```

### E-4: AI 기능 확장 ✅ 완료

```yaml
[x] lib/rag/product-qa.ts - RAG 기반 제품 Q&A
[x] components/products/ProductQA.tsx - Q&A UI 컴포넌트
[x] lib/nutrition/ingredient-interaction.ts - 성분 상호작용 분석
[x] components/nutrition/InteractionWarning.tsx - 상호작용 경고 UI
[x] lib/skincare/routine-builder.ts - 스킨케어 루틴 빌더
```

---

## Phase F: 운영 준비 🔄 진행 중

> **목표**: 관리자 페이지 + UI/UX 개선 + 모니터링 + 배포
> **시작일**: 2025-12-11

### 전체 진행률

| Step | 내용 | 상태 |
|------|------|------|
| F-1 | 관리자 페이지 | ✅ 완료 |
| F-2 | UI/UX 개선 | ✅ 완료 |
| F-3 | E2E 테스트 확장 | ✅ 완료 |
| F-4 | Analytics/모니터링 | ✅ 완료 |
| F-5 | 배포 + 피드백 | 🔄 테스트 중 (기능 점검 완료) |

### F-1: 관리자 페이지 ✅ 완료

```yaml
DB 마이그레이션:
  [x] supabase/migrations/20251211_admin_features.sql
      - feature_flags 테이블 (12개 초기 플래그)
      - admin_logs 테이블
      - RLS 정책

라이브러리:
  [x] lib/admin/auth.ts - 관리자 권한 체크 (Clerk 메타데이터)
  [x] lib/admin/feature-flags.ts - Feature Flags CRUD
  [x] lib/admin/stats.ts - 대시보드 통계
  [x] lib/admin/index.ts - 통합 export

관리자 페이지:
  [x] app/admin/layout.tsx - 레이아웃 + 권한 체크
  [x] app/admin/page.tsx - 대시보드 (통계 카드)
  [x] app/admin/products/page.tsx - 제품 목록
  [x] app/admin/products/new/page.tsx - 새 제품 추가
  [x] app/admin/users/page.tsx - 사용자 관리
  [x] app/admin/system/page.tsx - 시스템 현황
  [x] app/admin/system/features/page.tsx - Feature Flags ON/OFF
  [x] app/admin/system/crawler/page.tsx - 크롤러 관리

컴포넌트:
  [x] app/admin/_components/AdminSidebar.tsx - 네비게이션
  [x] app/admin/_components/StatCard.tsx - 통계 카드

API 라우트:
  [x] app/api/admin/features/route.ts - Feature Flags GET/PATCH

완료일: 2025-12-11
```

### F-2: UI/UX 개선 ✅ 완료

```yaml
[x] 색상/테마 리뉴얼 (globals.css 모듈별 CSS 변수)
[x] 홈 페이지 개선 (Next/Image, CTA 애니메이션)
[x] 네비게이션 개선 (BottomNav/Navbar CSS 변수화)
[x] 반응형 개선 (패딩 통일, BottomNav 간격)
[x] 다크모드 토글 + 모듈 색상
[x] 접근성 개선 (Skip-to-main, ARIA)
완료일: 2025-12-12
```

### F-3: E2E 테스트 확장 ✅ 완료

```yaml
[x] 제품 탐색 플로우 (e2e/products/products.spec.ts)
[x] 위시리스트 플로우 (e2e/wishlist.spec.ts)
[x] 관리자 플로우 (e2e/admin/admin.spec.ts)
[x] 모바일 반응형 (e2e/mobile.spec.ts)
완료일: 2025-12-12
```

### F-4: Analytics/모니터링 ✅ 완료

```yaml
[x] Vercel Analytics 설치 (@vercel/analytics, @vercel/speed-insights)
[x] Sentry 설치 (@sentry/nextjs)
[x] 에러 바운더리 연동 (error.tsx, global-error.tsx)
완료일: 2025-12-12
```

### F-5: 배포 + 피드백 🔄 테스트 중

```yaml
[x] Vercel 프로젝트 설정 (vercel.json)
[x] 프로덕션 배포 완료
[x] 기능 점검 완료 (2025-12-19)
[ ] Clerk 프로덕션 키 교체 (2026-01-20 이후)
[ ] 피드백 수집 채널 설정
```

### F-6: 프로덕션 보안 체크리스트 🔄 진행 중

```yaml
DB 보안 (RLS): ✅ 완료 (2025-12-22)
  [x] Phase 1 테이블 RLS 활성화
      - personal_color_assessments
      - skin_analyses
      - body_analyses
  [x] users 테이블 RLS 정책 추가
  [x] 마이그레이션 파일 생성: 202512220100_phase1_rls_policies.sql
  [x] 로컬 DB reset으로 RLS 15개 정책 검증 완료

테스트 & 빌드: ✅ 완료 (2025-12-22)
  [x] @clerk/nextjs 6.35.6 → 6.36.5 업데이트 (Turbopack 호환성)
  [x] Vitest 메모리 최적화 (pool: forks, maxForks: 4)
  [x] 2,620개 테스트 통과 확인

인증 보안: ⏳ 2026/01 배포 전
  [ ] Clerk 프로덕션 키 교체
  [ ] JWT 시크릿 검증
  [ ] API Rate Limiting 설정

환경 변수: ⏳ 2026/01 배포 전
  [ ] 프로덕션 Supabase URL/Key 설정
  [ ] Sentry DSN 프로덕션용 설정
  [ ] 민감정보 .env 검토

최종 검토:
  [ ] 보안 스캔 (npm audit)
  [ ] HTTPS 강제 확인
  [ ] CORS 설정 검토
```

---

## Phase G: Product DB v3 (Sprint 1-3) ✅ 완료

> **목표**: 리뷰 시스템 + 성분 상호작용 + 어필리에이트
> **완료일**: 2025-12-19
> **테스트**: 56개 추가

### 전체 진행률

| Sprint | 내용 | Task | 상태 |
|--------|------|------|------|
| Sprint 1 | 리뷰 시스템 | 6개 | ✅ 완료 |
| Sprint 2 | 성분 상호작용 | 5개 | ✅ 완료 |
| Sprint 3 | 어필리에이트 | 4개 | ✅ 완료 |

### Sprint 1: 리뷰 시스템 ✅ 완료

```yaml
타입 정의:
  [x] types/review.ts
      - ProductReview, Rating, ReviewSortBy
      - CreateReviewInput, ReviewSummary
      - ReviewRow, toProductReview 변환 함수

서비스:
  [x] lib/products/services/reviews.ts
      - getRatingText, getRatingColor
      - toProductReview, calculateReviewSummary

컴포넌트:
  [x] components/products/reviews/
      - StarRating.tsx (별점 입력/표시)
      - ReviewSummary.tsx (평점 요약)
      - ReviewCard.tsx (개별 리뷰)
      - ReviewList.tsx (목록 + 정렬)
      - ReviewForm.tsx (작성 폼)
      - ReviewSection.tsx (통합 섹션)

DB 마이그레이션:
  [x] supabase/migrations/20251219_product_reviews.sql
      - product_reviews 테이블
      - review_helpful 테이블
      - RLS 정책 + 트리거

테스트:
  [x] tests/lib/products/services/reviews.test.ts (18개)
```

### Sprint 2: 성분 상호작용 ✅ 완료

```yaml
타입 정의:
  [x] types/interaction.ts
      - IngredientInteraction, InteractionType
      - Severity, ProductInteractionWarning

서비스:
  [x] lib/products/services/interactions.ts
      - toIngredientInteraction
      - getInteractionTypeLabel/Color
      - getSeverityLabel/Color
      - summarizeInteractions
      - filterWarningsOnly, filterSynergiesOnly

컴포넌트:
  [x] components/products/interactions/
      - InteractionWarning.tsx (충돌 경고 배지)
      - InteractionDetail.tsx (상세 모달)

DB 마이그레이션:
  [x] supabase/migrations/20251219_ingredient_interactions.sql
      - ingredient_interactions 테이블
      - 초기 시드 데이터 (금기/주의/시너지/시간분리)
      - 공개 읽기 전용 RLS

테스트:
  [x] tests/lib/products/services/interactions.test.ts (26개)
```

### Sprint 3: 어필리에이트 ✅ 완료

```yaml
타입 정의:
  [x] types/affiliate.ts
      - AffiliateProductType, AffiliateClick
      - DailyClickStats, AffiliateClickRow
      - toAffiliateProductType, toAffiliateClick
      - toDailyClickStats

서비스:
  [x] lib/products/affiliate.ts
      - 클릭 추적 유틸리티
      - 일일 통계 조회

컴포넌트:
  [x] components/products/PurchaseButton.tsx
      - 구매 버튼 (클릭 추적)

DB 마이그레이션:
  [x] supabase/migrations/20251219_affiliate_system.sql
      - affiliate_clicks 테이블
      - 일일 통계 뷰

테스트:
  [x] tests/lib/products/affiliate.test.ts (12개)
```

### 추가 작업 (2025-12-19)

```yaml
운동 데이터:
  [x] data/exercises/pilates.json (20개)
  [x] data/exercises/stretching.json (22개)
  [x] data/exercises/yoga.json (18개)

UI 컴포넌트:
  [x] components/ui/Breadcrumb.tsx
  [x] components/ui/alert-dialog.tsx
  [x] components/ui/collapsible.tsx
  [x] components/ui/dropdown-menu.tsx
  [x] components/ui/scroll-area.tsx

코드 품질:
  [x] ESLint 경고 수정 (12개 → 4개)
  [x] 다크모드 개선 (100+ 파일)
  [x] 접근성 개선 (ARIA)
```

### 추가 작업 (2025-12-22)

```yaml
AI 업그레이드:
  [x] Gemini 2.5 Flash → 3 Flash 업그레이드
      - 무료 티어 (AI Studio)
      - lib/gemini.ts 모델 ID 변경
  [x] TOOL-INTEGRATION-PLAN.md 문서 추가

제품 매칭 개선:
  [x] 리뷰 평점 기반 매칭 보너스 추가
      - 평점 4.5+ & 리뷰 100개+: +10점
      - 평점 4.0+ & 리뷰 50개+: +7점
      - 평점 3.5+ & 리뷰 20개+: +4점
  [x] MatchReasonType에 'rating' 타입 추가

분석 UI 개선:
  [x] 체형/피부 분석 결과에 공유 기능 추가
  [x] 분석 완료 시 축하 효과 (Confetti)

운동 모듈 확장:
  [x] RecommendedEquipmentCard - 운동 기구 추천
  [x] RecommendedSupplementCard - 영양제 추천
  [x] 운동 결과 페이지에 추천 섹션 통합

대시보드 개선:
  [x] CombinedStreakWidget - 운동/영양 스트릭 통합 위젯
  [x] 테스트 12개 추가

기타:
  [x] 애니메이션 딜레이 클래스 확장 (900-1200ms)
  [x] Switch UI 컴포넌트 추가 (@radix-ui/react-switch)

보안 (F-6):
  [x] vercel.json 보안 헤더 5개 추가
      - X-Frame-Options: DENY
      - X-Content-Type-Options: nosniff
      - Referrer-Policy: strict-origin-when-cross-origin
      - X-XSS-Protection
      - Permissions-Policy (카메라 self만)
  [x] npm audit 확인: 6 moderate (dev only)

신규 기능 모듈:
  [x] products/qa - 제품 Q&A 채팅 페이지 (RAG 기반)
  [x] settings - 설정 페이지
  [x] notifications - 브라우저 푸시 알림 시스템
  [x] checkin - 일일 체크인 모달 (기분/에너지/피부)
  [x] ProductQASection - 제품 상세 Q&A 섹션
  [x] lib/rag/product-qa.ts - AI Q&A 답변 생성

데이터베이스:
  [x] daily_checkins 테이블 마이그레이션
  [x] DATABASE-SCHEMA.md v4.5 업데이트

정리:
  [x] Supabase 임시 파일 gitignore 추가
  [x] N1_combined_migration.sql.bak 삭제
```

### 추가 작업 (2025-12-23)

```yaml
개발 효율화:
  [x] .claude/rules/ 코딩 표준 문서 생성
      - coding-standards.md: 코드 스타일, 네이밍, 테스트 규칙
      - project-structure.md: 디렉토리 구조 가이드
      - ai-integration.md: Gemini AI 사용 패턴

Supabase 마이그레이션:
  [x] 로컬 DB reset으로 28개 마이그레이션 적용
  [x] daily_checkins 테이블 로컬 적용 확인

모바일 앱 (Phase B):
  [x] 홈 화면 대시보드 스타일 개선
      - 사용자 인사말 + Clerk 연동
      - 오늘의 요약 카드 (운동/식단/체크인)
      - 퀵 액션 버튼 (PC/피부/체형 분석)
      - 모듈 카드 (운동/영양)
  [x] 47개 파일 커밋 (기존 스켈레톤 포함)
  [x] typecheck 통과

접근성 개선:
  [x] DialogContent 접근성 경고 수정
      - ProductQASection.tsx
      - InteractionDetail.tsx
```

---

## Hook Model (사용자 리텐션)

> **프레임워크**: Nir Eyal's Hook Model
> **목표**: 7일 리텐션 50%+, 모듈 간 전환율 60%+

### 4단계 사이클

```
Trigger (계기) → Action (행동) → Reward (보상) → Investment (투자) → 다시 Trigger...
```

### 모듈별 Hook 설계

#### PC-1 퍼스널 컬러 (Entry Point)

| 단계 | 내용 | 구현 |
|------|------|------|
| Trigger | "내 퍼스널 컬러가 뭘까?" | ✅ 랜딩 CTA |
| Action | 10개 문진 + 사진 1장 | ✅ 간단한 온보딩 |
| Reward | 4계절 진단 + 연예인 매칭 + 컬러 팔레트 | ✅ 시각적 결과 |
| Investment | 결과 저장, S-1/C-1 연동 유도 | ✅ 크로스 모듈 CTA |

#### S-1 피부 분석

| 단계 | 내용 | 구현 |
|------|------|------|
| Trigger | "내 피부 상태는?" / PC 완료 후 유도 | ✅ |
| Action | 사진 1장 업로드 | ✅ |
| Reward | 7가지 지표 + 제품 추천 + PC 연동 파운데이션 | ✅ |
| Investment | 성분 경고 저장, N-1 수분 연동 유도 | ✅ |

#### C-1 체형 분석

| 단계 | 내용 | 구현 |
|------|------|------|
| Trigger | "내 체형에 맞는 옷은?" / PC 완료 후 유도 | ✅ |
| Action | 키/체중 입력 + 사진 1장 | ✅ |
| Reward | 8가지 체형 + PC 연동 색상 추천 | ✅ |
| Investment | W-1 운동 연동, N-1 칼로리 연동 | ✅ |

#### W-1 운동/피트니스

| 단계 | 내용 | 구현 |
|------|------|------|
| Trigger | "오늘 운동 뭐하지?" / 아침 알림 | ✅ |
| Action | 운동 세션 시작 | ✅ |
| Reward | 칼로리 소모 + Streak 배지 + 연예인 루틴 | ✅ |
| Investment | 운동 기록, 연속 기록 유지, N-1 영양 유도 | ✅ |

#### N-1 영양/식단

| 단계 | 내용 | 구현 |
|------|------|------|
| Trigger | "오늘 뭐 먹었지?" / 식사 시간 알림 | ✅ |
| Action | 음식 사진 촬영 | ✅ |
| Reward | 신호등 시스템 + 영양 분석 + 칼로리 트래킹 | ✅ |
| Investment | 식단 기록, Streak, W-1 운동 유도 (칼로리 초과 시) | ✅ |

### 크로스 모듈 시너지

```yaml
Phase 1 연동:
  PC-1 → S-1: "퍼스널 컬러에 맞는 파운데이션 추천받기"
  PC-1 → C-1: "체형에 맞는 색상 조합 확인하기"
  S-1 → N-1: "피부 수분에 맞는 수분 섭취량 안내"

Phase 2 연동:
  C-1 → W-1: "체형에 맞는 운동 추천"
  C-1 → N-1: "키/체중 기반 BMR/TDEE 계산"
  W-1 → N-1: "운동 칼로리 → 순 칼로리 반영"
  W-1 → N-1: "운동 후 단백질 섭취 유도"
  N-1 → W-1: "칼로리 초과 → 운동 유도 알림"

Phase 3 연동:
  W-1 + N-1 → R-1: "주간/월간 통합 리포트"
  통합 알림: CrossModuleAlert 시스템
```

### 리텐션 메트릭 목표

| 지표 | 목표 | 구현 |
|------|------|------|
| Day 1 리텐션 | 70%+ | ✅ PC-1 완료 후 S-1/C-1 유도 |
| Day 7 리텐션 | 50%+ | ✅ Streak 시스템 |
| 모듈 전환율 | 60%+ | ✅ 크로스 모듈 CTA |
| 주간 재방문 | 2-3회 | ✅ 운동/식단 알림 |

---

## 기술 스택 현황

### 프레임워크 & 라이브러리

| 항목 | 버전 | 용도 |
|------|------|------|
| Next.js | 16+ | App Router, Turbopack |
| React | 19 | UI 라이브러리 |
| TypeScript | 5+ | 타입 안전성 |
| Tailwind CSS | v4 | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 |

### 백엔드 & 인증

| 항목 | 용도 |
|------|------|
| Supabase | PostgreSQL + Storage + RLS |
| Clerk | 인증 (clerk_user_id 기반) |
| Gemini 2.5 Flash | AI 분석 (이미지/텍스트) |

### 테스트

| 항목 | 용도 | 테스트 수 |
|------|------|----------|
| Vitest | 단위/통합 테스트 | 2,491개 |
| React Testing Library | 컴포넌트 테스트 | - |
| Playwright | E2E 테스트 | 47개 |

---

## 데이터베이스 테이블

### Phase 1 (4개 + 1개)

| 테이블 | 설명 |
|--------|------|
| users | 사용자 정보 (Clerk 연동) |
| personal_color_assessments | PC-1 진단 결과 |
| skin_analyses | S-1 피부 분석 |
| body_analyses | C-1 체형 분석 |
| ingredients | 화장품 성분 DB |

### Phase 2 W-1 (4개)

| 테이블 | 설명 |
|--------|------|
| workout_analyses | 운동 타입 분석 결과 |
| workout_plans | 주간 운동 플랜 |
| workout_logs | 운동 기록 |
| workout_streaks | 연속 운동 기록 |

### Phase 2 N-1 (8개)

| 테이블 | 설명 |
|--------|------|
| nutrition_settings | 영양 설정 |
| foods | 음식 DB (500종) |
| meal_records | 식단 기록 |
| water_records | 수분 섭취 기록 |
| daily_nutrition_summary | 일일 영양 요약 |
| favorite_foods | 즐겨찾기 음식 |
| fasting_records | 간헐적 단식 기록 |
| nutrition_streaks | 식단 연속 기록 |

### Phase A Product DB (2개)

| 테이블 | 설명 |
|--------|------|
| cosmetic_products | 화장품 제품 DB (스킨케어 + 메이크업) |
| supplement_products | 영양제/건강기능식품 제품 DB |

### Phase C RAG + Product DB v2 (5개)

| 테이블 | 설명 |
|--------|------|
| research_documents | 연구 문서 + 임베딩 (RAG 소스) |
| document_chunks | 문서 청크 (긴 문서용) |
| workout_equipment | 운동 기구/장비 DB |
| health_foods | 건강식품/스포츠 영양 DB |
| product_price_history | 제품 가격 히스토리 |

---

## 파일 구조

```
app/
├── (main)/
│   ├── analysis/          # Phase 1 분석
│   │   ├── personal-color/ # PC-1
│   │   ├── skin/           # S-1
│   │   └── body/           # C-1
│   ├── workout/            # W-1 운동
│   │   ├── onboarding/     # 7단계
│   │   ├── result/         # 결과
│   │   ├── exercise/[id]/  # 상세
│   │   ├── session/        # 운동 기록
│   │   ├── history/        # 히스토리
│   │   └── plan/           # 주간 플랜
│   ├── nutrition/          # N-1 영양
│   │   ├── onboarding/     # 7단계
│   │   ├── result/         # 결과
│   │   ├── dashboard/      # 대시보드
│   │   ├── fasting/        # 간헐적 단식
│   │   └── history/        # 히스토리
│   ├── reports/            # R-1 리포트
│   │   ├── weekly/[weekStart]/
│   │   └── monthly/[month]/
│   └── dashboard/          # 메인 대시보드
├── api/                    # API Routes
└── manifest.ts             # PWA (A-1)

components/
├── ui/                     # shadcn/ui
├── workout/                # W-1 컴포넌트
├── nutrition/              # N-1 컴포넌트
├── reports/                # R-1 컴포넌트
└── common/                 # 공통 컴포넌트

lib/
├── supabase/               # DB 클라이언트
├── gemini/                 # AI 클라이언트
├── workout/                # W-1 로직
├── nutrition/              # N-1 로직
├── reports/                # R-1 로직
├── stores/                 # Zustand 스토어
├── mock/                   # Mock 데이터
├── products.ts             # re-export (기존 API 호환)
└── products/               # Product DB Repository (v3.0)
    ├── index.ts            # 통합 export
    ├── repositories/       # 도메인별 CRUD
    ├── services/           # 통합 검색
    └── matching.ts         # 매칭 로직

types/
├── workout.ts              # W-1 타입
├── nutrition.ts            # N-1 타입
├── report.ts               # R-1 타입
└── product.ts              # Product DB 타입 (A-2)

data/
├── exercises/              # 운동 DB (100개)
├── celebrities/            # 연예인 DB (20명)
├── foods/                  # 음식 DB (500개)
└── seeds/                  # 제품 시드 데이터 (A-2)
```

---

## 참조 문서

| 문서 | 설명 |
|------|------|
| [PROGRESS.md](PROGRESS.md) | Phase 1 상세 |
| [PROGRESS-PHASE2.md](PROGRESS-PHASE2.md) | Phase 2 상세 |
| [phase3/PROGRESS-PHASE3.md](phase3/PROGRESS-PHASE3.md) | Phase 3 상세 |
| [ROADMAP-PHASE-NEXT.md](ROADMAP-PHASE-NEXT.md) | Phase A/B/C 로드맵 |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Stitch 디자인 토큰 |
| [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md) | DB 스키마 v4.2 (Product DB v2 포함) |
| [PRODUCT-DATA-GUIDE.md](PRODUCT-DATA-GUIDE.md) | Product DB 데이터 입력 가이드 |
| [HOOK-MODEL.md](HOOK-MODEL.md) | 사용자 리텐션 모델 |
| [phase-next/FEATURE-SPEC-PRODUCT-UI.md](phase-next/FEATURE-SPEC-PRODUCT-UI.md) | Step 5 Product UI 기능 스펙 |
| [phase-next/SPRINT-BACKLOG-PRODUCT-UI.md](phase-next/SPRINT-BACKLOG-PRODUCT-UI.md) | Step 5 Product UI 스프린트 백로그 |

---

**상태 범례**:
- ✅ 완료
- 🔄 진행 중
- ⏳ 대기
