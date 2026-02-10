# 다음 진행 작업 목록

> **업데이트**: 2026-02-10
> **현재 상태**: Phase I/J/K 완료, 어필리에이트 Phase 1 완료, 랜딩 페이지 리디자인 진행 중
> **역할**: Phase 현황의 Single Source of Truth (다른 문서는 이 문서 참조)

---

## 마일스톤 (2026)

| 마일스톤              | 날짜  | D-Day | 상태       | 목표                                |
| --------------------- | ----- | ----- | ---------- | ----------------------------------- |
| **비공개 테스트**     | 02-12 | D-12  | 🔄 진행 중 | 테스트 커버리지 75%, QA 완료        |
| **정식 출시**         | 02-25 | D-25  | 📋 계획    | 테스트 커버리지 85%, Lighthouse 90+ |
| **구글 액셀러레이터** | 02-28 | D-28  | 📋 준비    | 문서 완성, 데모 준비                |

---

## 전체 Phase 현황

> 📌 **이 테이블이 Phase 현황의 단일 진실 원천입니다.**
> 다른 문서 (TODO.md, ROADMAP-\*.md)는 이 문서를 참조합니다.

| Phase   | 설명                                                        | 상태       |
| ------- | ----------------------------------------------------------- | ---------- |
| Phase 1 | PC-1, S-1, C-1 (퍼스널컬러, 피부, 체형 분석)                | ✅ 완료    |
| Phase 2 | W-1, N-1, R-1 (운동, 영양, 리포트)                          | ✅ 완료    |
| Phase 3 | 앱 고도화 (E2E 테스트, 크로스 모듈)                         | ✅ 완료    |
| Phase A | Product DB (850+ 제품, 리뷰, RAG)                           | ✅ 완료    |
| Phase B | React Native (모노레포, Expo 앱, 알림)                      | ✅ 완료    |
| Phase H | 소셜 (웰니스 스코어, 친구, 리더보드)                        | ✅ 완료    |
| Phase I | 어필리에이트 (날씨 코디, 바코드 스캔, 비포애프터, 인벤토리) | ✅ 완료    |
| Phase J | AI 스타일링 (색상 조합, 악세서리, 메이크업)                 | ✅ 완료    |
| Phase K | 종합 업그레이드 (성별 중립화, 패션 확장, 체형 강화, 레시피) | ✅ 완료    |
| Launch  | 배포 및 런칭                                                | ⏳ 진행 중 |

---

## Phase K: 종합 업그레이드 (100% 완료)

> **스펙 문서**: [SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md](../specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md)
> **구현 현황**: K-1 100%, K-2 100%, K-3 100%, K-4 100%, K-5 100% (2026-02-07 코드 기반 검증)

### Sub-Phase 구성

> **최적화**: Phase I 인벤토리 시스템 재사용으로 K-2, K-4 작업량 감소

| Sub-Phase | 영역                 | 설명                                      | 우선순위 | 구현 상태       |
| --------- | -------------------- | ----------------------------------------- | -------- | --------------- |
| K-1       | 성별 중립화          | UI/콘텐츠 성별 중립화, 남성 추천 추가     | 🔴 높음  | ✅ 100% (4/4)   |
| K-2       | 패션 확장            | 스타일 카테고리, Best 10, 옷장 연동       | 🔴 높음  | ✅ 100% (5/5)   |
| K-3       | 체형 분석 강화       | 키/몸무게, BMI, 자세 교정 운동            | 🟠 중간  | ✅ 100% (6/6)   |
| K-4       | 영양/레시피 확장     | 식재료 인벤토리, 레시피 추천, 목표별 옵션 | 🟠 중간  | ✅ 100% (4/4)   |
| K-5       | 관리자/프로필 페이지 | 관리자 대시보드, 사용자 프로필 리디자인   | 🟡 낮음  | ✅ 100% (15/15) |

### K-1: 성별 중립화

| 항목                | 설명                          | 상태 | 구현 파일                                                                 |
| ------------------- | ----------------------------- | ---- | ------------------------------------------------------------------------- |
| 온보딩 성별 선택    | male / female / neutral 선택  | ✅   | `onboarding/gender/page.tsx`, `GenderSelector.tsx`, `gender-provider.tsx` |
| PC-1 남성 추천 추가 | 넥타이, 시계, 벨트 등 추천    | ✅   | `lib/content/gender-adaptive.ts` (시즌별 남성/중립 악세서리)              |
| 텍스트 중립화       | "여성스러운" → 성별 중립 표현 | ✅   | 기존 텍스트 대부분 중립적 (해요체 통일 시 처리)                           |
| 악세서리 분류       | 공용/남성/여성 탭 구분        | ✅   | `GenderAdaptiveAccessories.tsx` (3탭), `ResultCardV2.tsx` (4탭 필터)      |

### K-2: 패션 확장 ✅

> **재사용**: 기존 `closetMatcher.ts` + `CLOTHING_SUB_CATEGORIES` 활용

| 항목            | 설명                                  | 상태 | 구현 파일                                                                                         |
| --------------- | ------------------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| 스타일 카테고리 | 캐주얼, 포멀, 힙합, 미니멀, 스트릿 등 | ✅   | `lib/fashion/style-categories.ts`, `StyleGallery.tsx`                                             |
| Best 10 추천    | 카테고리별 인기 조합 10개             | ✅   | `lib/fashion/best10-generator.ts`, `Best10Card.tsx`, `/api/fashion/best10`                        |
| 사이즈 추천     | 체형 + PC → 핏 가이드                 | ✅   | `lib/fashion/size-recommendation.ts`, `SizeRecommendationCard.tsx`, `/api/fashion/size-recommend` |
| 악세서리/신발   | 시계, 선글라스, 스니커즈, 구두 등     | ✅   | `ShoppingRecommend.tsx`, `TrendCard.tsx`                                                          |
| 옷장 연동 코디  | 보유 의류 기반 추천                   | ✅   | `lib/fashion/wardrobe.ts`, `ClosetIntegration.tsx`, `/api/fashion/personalize`                    |

### K-3: 체형 분석 강화 ✅

| 항목           | 설명                    | 상태 |
| -------------- | ----------------------- | ---- |
| 키/몸무게 입력 | 필수 입력 필드 추가     | ✅   |
| BMI 자동 계산  | 건강 범위 표시          | ✅   |
| 체지방률 입력  | 선택 입력               | ✅   |
| 자세 교정 운동 | 체형별 교정 운동 가이드 | ✅   |

### K-4: 영양/레시피 확장 ✅

> **재사용**: 기존 `user_inventory` (category='pantry') + `PantryMetadata` 활용

| 항목            | 설명                        | 상태 | 구현 파일                                                                                                                |
| --------------- | --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 식재료 스캔     | 바코드/이미지 인식          | ✅   | 기존 `ItemUploader` + `inventory-repository.ts` (pantry 카테고리)                                                        |
| 식재료 인벤토리 | 보유 재료 관리              | ✅   | 기존 `user_inventory` 테이블 재사용 (category='pantry')                                                                  |
| 레시피 추천     | 보유 재료 기반 추천         | ✅   | `recipe-matcher.ts`, `pantry-recipe-matcher.ts`, `/api/recipes/match`, `/api/recipes/[id]/variations`                    |
| 목표별 옵션     | 다이어트/벌크업/린매스/유지 | ✅   | `recipe-matcher.ts` (`calculateGoalBasedMacros`, `calculateAllGoalComparisons`, `mapToFitnessGoal`, `NUTRITION_TARGETS`) |

### K-5: 관리자/프로필 페이지 ✅

| 항목                   | 설명                         | 상태 |
| ---------------------- | ---------------------------- | ---- |
| 관리자 대시보드 개선   | 사용자 통계, 분석 현황       | ✅   |
| 사용자 프로필 리디자인 | 웰니스 스코어, 분석 히스토리 | ✅   |

### AI 도메인 상담 확장 (Cross-cutting)

> **패턴**: Phase D (피부 상담) 패턴을 다른 도메인에 적용
> **재사용**: 기존 AI 코치 인프라 (`lib/coach/*`) 확장

| 도메인     | 데이터 소스     | 예시 질문                           | 상태 | 구현 파일               |
| ---------- | --------------- | ----------------------------------- | ---- | ----------------------- |
| 퍼스널컬러 | PC-1 분석 결과  | "내 시즌에 맞는 립 색상 추천해줘"   | ✅   | `personal-color-rag.ts` |
| 패션       | 옷장 인벤토리   | "내 옷장에서 데이트룩 추천해줘"     | ✅   | `fashion-rag.ts`        |
| 영양       | 냉장고 인벤토리 | "냉장고에 있는 재료로 뭐 해먹을까?" | ✅   | `nutrition-rag.ts`      |
| 운동       | 운동 기록       | "어제 하체 했는데 오늘 뭐 해?"      | ✅   | `workout-rag.ts`        |

---

## 완료: 어필리에이트 Phase 1 — H-1/M-1 제품 추천 확장 (2026-02-10)

> **P7 워크플로우**: 리서치→원리→ADR→스펙→구현 완전 준수
> **스펙**: [SDD-AFFILIATE-INTEGRATION.md v2.0](../specs/SDD-AFFILIATE-INTEGRATION.md)
> **ADR**: [ADR-067](../adr/ADR-067-affiliate-partner-api-strategy.md)
> **원리**: [product-matching.md](../principles/product-matching.md)

### 구현 내용

| 항목                | 설명                                                             | 파일 수 |
| ------------------- | ---------------------------------------------------------------- | ------- |
| 타입 확장           | CosmeticCategory 헤어케어, AffiliateHairType/ScalpType/Undertone | 2       |
| 매칭 알고리즘       | calculateHaircareMatchScore, undertone 보너스 (+15점)            | 1       |
| RecommendedProducts | hair/makeup 분석 타입 + sectionConfig                            | 1       |
| 결과 페이지 임베드  | H-1, M-1 결과 페이지에 추천 제품 위젯                            | 2       |
| PartnerAdapter 패턴 | 인터페이스 + CoupangAdapter 스켈레톤 + 레지스트리                | 3       |
| DB 마이그레이션     | affiliate_products 컬럼 5개 + GIN 인덱스 5개                     | 1       |
| 테스트              | H-1 헤어케어 7개 + M-1 언더톤 3개 (총 44/44 통과)                | 1       |

### 미완료 (Phase 2 예정)

- [ ] DB 마이그레이션 SQL 원격 실행 (`supabase/migrations/20260210_affiliate_h1_m1_columns.sql`)
- [ ] CJ Affiliate 어댑터 구현 (Phase 2)
- [ ] Amazon Associates 어댑터 구현 (Phase 3)
- [ ] 쿠팡 파트너스 API 키 발급 후 실제 연동

---

## 🔥 활성 작업: 랜딩 페이지 리디자인

> **플랜 문서**: `.claude/plans/cheeky-jingling-tome.md` (v17.0)
> **ADR**: [ADR-062: 그라디언트 텍스트 세로 버그 수정](../adr/ADR-062-gradient-text-vertical-bug-fix.md)

### 상태: 🟡 CSS 수정 완료, 브라우저 확인 필요

### 완료된 작업

| 작업                      | 파일          | 상태 |
| ------------------------- | ------------- | ---- |
| 세로 텍스트 버그 수정     | `globals.css` | ✅   |
| ThemeProvider dark 기본값 | `layout.tsx`  | ✅   |
| 히어로 섹션 리디자인      | `page.tsx`    | ✅   |
| 모듈 카드 리디자인        | `page.tsx`    | ✅   |
| 특징 카드 리디자인        | `page.tsx`    | ✅   |
| Footer 다크 테마 동기화   | `Footer.tsx`  | ✅   |
| 순차 등장 애니메이션      | `globals.css` | ✅   |
| 펄스 글로우 애니메이션    | `globals.css` | ✅   |
| 색상 대비 개선 (WCAG AA)  | `globals.css` | ✅   |
| 포커스 표시 개선          | `globals.css` | ✅   |

### 버그 수정 내용

**문제**: `.text-gradient-brand-extended` 클래스에 `display: inline-block; width: 100%;` 속성이 flex-col 컨테이너와 충돌하여 텍스트가 세로로 표시됨

**해결**: `display: inline-block; width: 100%;` 속성 제거

```css
/* 수정 후 */
.text-gradient-brand-extended {
  background: var(--gradient-brand-extended);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 남은 확인 사항

- [ ] 브라우저에서 "온전한 나를 찾는 여정" 가로 표시 확인
- [ ] 브라우저에서 "지금 바로 시작해보세요" 가로 표시 확인
- [ ] 그라디언트 효과 정상 확인 (핑크→보라)

---

## 남은 작업

### 1. 런칭 준비 (Part A - 테스트)

| 항목                            | 상태 | 비고                      |
| ------------------------------- | ---- | ------------------------- |
| Vercel Cron Jobs (4개)          | ✅   | vercel.json에 설정됨      |
| PWA manifest                    | ✅   | manifest.webmanifest      |
| SEO (robots, sitemap)           | ✅   | app/robots.ts, sitemap.ts |
| 기능 점검 (인증/분석/운동/영양) | ✅   | 2025-12-19 완료           |
| 다크모드                        | ✅   | 완료                      |

### 2. 런칭 준비 (Part B - 환경변수)

| 변수명                              | 상태 | 비고                              |
| ----------------------------------- | ---- | --------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ⏳   | 프로덕션 키 대기 (사업자 등록 후) |
| `CLERK_SECRET_KEY`                  | ⏳   | 프로덕션 키 대기                  |
| `NEXT_PUBLIC_SUPABASE_URL`          | ⚠️   | Production 확인 필요              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | ⚠️   | Production 확인 필요              |
| `SUPABASE_SERVICE_ROLE_KEY`         | ⚠️   | Production 확인 필요              |
| `GOOGLE_GENERATIVE_AI_API_KEY`      | ✅   | 설정됨                            |
| `NEXT_PUBLIC_SITE_URL`              | ⚠️   | https://yiroom.app 설정 필요      |
| `CRON_SECRET`                       | ✅   | Vercel 자동 처리                  |

### 3. 브랜드 중립화

| 단계                  | 설명                         | 상태      |
| --------------------- | ---------------------------- | --------- |
| 레퍼런스 리서치       | 성별 중립 웰니스 앱 사례     | ✅ 완료   |
| 심볼 후보 선정        | 3~5개 후보 (나선, 동심원 등) | ✅ 완료   |
| Gemini 3 Pro 프롬프트 | 디자인 요청 프롬프트         | ✅ 준비됨 |
| Figma 제작            | 로고 + 앱 아이콘             | ⏳ 대기   |
| 적용                  | `public/logo.png`, `icons/`  | ⏳ 대기   |

> **리서치 결과**: `docs/research/reviewed/branding-specification.md`

### 4. 도메인 및 최종 배포

| 항목            | 상태 | 비고            |
| --------------- | ---- | --------------- |
| 커스텀 도메인   | ⏳   | yiroom.app 연결 |
| SSL 인증서      | ✅   | Vercel 자동     |
| HTTPS 확인      | ⏳   | 도메인 연결 후  |
| Lighthouse 점수 | ⏳   | 목표: 90+       |

---

## 완료된 작업 요약

### Phase I (2026-01-11 완료)

| 기능                            | 테스트 수 | 커밋    |
| ------------------------------- | --------- | ------- |
| WEATHER-OUTFIT (날씨 기반 코디) | 25개      | 7b374bd |
| BARCODE-SCAN (바코드 스캔)      | 16개      | 7b374bd |
| BEFORE-AFTER (비포애프터 비교)  | 39개      | 7b374bd |
| MY-INVENTORY (내 인벤토리)      | 106개     | 7b374bd |
| **총합**                        | **453개** |         |

### Phase J (2026-01-11 검증 완료)

| 컴포넌트         | 테스트 수 |
| ---------------- | --------- |
| ColorCombination | 15개      |
| AccessoryStyling | 13개      |
| MakeupStyling    | 18개      |
| FullOutfit       | 14개      |
| OutfitShare      | 11개      |
| **총합**         | **71개**  |

### Phase H Sprint 1-4 (이전 완료)

- 게이미피케이션: 배지, 레벨, 스트릭
- 챌린지 시스템: 템플릿, 참여, 진행 상황
- 소셜: 웰니스 스코어, 친구, 리더보드

---

## 테스트 현황

| 영역             | 파일 수 | 테스트 수 | 상태 |
| ---------------- | ------- | --------- | ---- |
| 웹 앱 전체       | 110+    | 2,900+    | ✅   |
| 모바일 앱        | 10+     | 151       | ✅   |
| E2E (Playwright) | 5+      | 20+       | ✅   |

```bash
# 검증 명령어
npm run typecheck && npm run test
```

---

## 런칭 체크리스트

### P0: 비공개 테스트 전 (02-12까지) - Critical

- [x] 모바일 린트 해결 (Hook 의존성 경고 수정) ✅ 2026-01-31
- [x] 테스트 커버리지 75% 달성 ✅ 2026-02-07
  - [x] image-engine 테스트 (18개) ✅ 2026-01-31
  - [x] analysis 테스트 (49 파일, 1,827개) ✅ 2026-02-07
  - [x] coach 테스트 (12 파일, 227개) ✅ 2026-02-07
  - [x] oral-health 테스트 (81개) ✅ 2026-02-07
  - [x] color SSOT 테스트 (ciede2000 + conversions) ✅ 2026-02-07
- [ ] Clerk 프로덕션 키 설정
- [ ] Supabase 프로덕션 확인
- [ ] 핵심 기능 QA (인증, 분석, 운동, 영양)

### P1: 정식 출시 전 (02-25까지) - High

- [x] 테스트 커버리지 85% 달성 ✅ 2026-02-07
  - [x] products 테스트 (13개 파일 100% 커버) ✅
  - [x] nutrition 테스트 (18개 파일) ✅
  - [x] gamification 테스트 (4/5 파일) ✅
- [ ] Lighthouse 90+ 달성
- [ ] Vercel Analytics 활성화
- [ ] Sentry 에러 모니터링 설정 (선택)

### P2: 구글 액셀러레이터 (02-28까지) - Medium

- [ ] 문서 정비 (README, API 문서)
- [ ] 데모 시나리오 준비
- [ ] 추가 E2E 테스트

### 사업자 등록 후

- [ ] Clerk Production Keys 교체 (`pk_live_...`, `sk_live_...`)
- [ ] 최종 테스트 (프로덕션 키로 로그인)
- [ ] 공식 런칭

---

## 참고 문서

| 문서            | 위치                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| 프로젝트 가이드 | [CLAUDE.md](../../CLAUDE.md)                                                          |
| 디자인 시스템   | [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md)                                               |
| 브랜드 스펙     | [branding-specification.md](../research/reviewed/branding-specification.md)           |
| Phase H 로드맵  | [PHASE-H-ROADMAP.md](PHASE-H-ROADMAP.md)                                              |
| Phase I 스펙    | [phase-i/](../phase-i/)                                                               |
| Phase J 스펙    | [specs/SDD-PHASE-J-\*.md](../specs/)                                                  |
| Phase K 스펙    | [SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md](../specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md) |
| Phase K 리서치  | [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md)                                |

### 관련 로드맵 문서

| 문서                                              | 설명             | 이 문서 참조 |
| ------------------------------------------------- | ---------------- | ------------ |
| [TODO.md](../TODO.md)                             | 파일 구조 현황   | Phase 현황   |
| [ROADMAP-PLATFORM.md](../ROADMAP-PLATFORM.md)     | 수익화 로드맵    | 모듈 현황    |
| [ROADMAP-LAUNCH.md](../ROADMAP-LAUNCH.md)         | 런칭 로드맵      | Phase 현황   |
| [ROADMAP-PHASE-NEXT.md](../ROADMAP-PHASE-NEXT.md) | Phase A/B/C 상세 | Phase 현황   |

---

## 변경 이력

| 날짜       | 변경 내용                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| 2026-02-10 | 어필리에이트 Phase 1 완료 (H-1/M-1 추천, PartnerAdapter, 테스트 44개)           |
| 2026-02-07 | Phase K 체크리스트 코드 기반 동기화 (95→97%), H-1 품질 개선 (84→90, B→A)        |
| 2026-02-07 | 런칭 테스트 커버리지 달성 (2,900+), skin API 테스트 수정, ciede2000 테스트 추가 |
| 2026-02-02 | Phase K 구현 현황 반영 (60%), 코드-문서 동기화                                  |
| 2026-01-31 | 모바일 린트 수정, image-engine 테스트 18개 완료                                 |
| 2026-01-12 | Phase K 인벤토리 재사용 전략 반영 (K-2, K-4)                                    |
| 2026-01-11 | Single Source of Truth 패턴 적용, 문서 참조 정리                                |
| 2026-01-11 | Phase K 종합 업그레이드 계획 추가                                               |
| 2026-01-11 | Phase I/J 완료 반영, 문서 전면 재정리                                           |
| 2025-12-19 | Part A 기능 점검 완료                                                           |
| 2025-12-17 | Part C 운동 DB 확장 완료                                                        |
| 2025-12-12 | 4단계 완료 (Dynamic Import 적용)                                                |
| 2025-12-11 | 초기 버전                                                                       |
