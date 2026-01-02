# TODO Issues 정리

> 코드베이스에서 발견된 TODO 주석을 GitHub Issues로 전환하기 위한 문서
> 생성일: 2025-12-31
> 최종 업데이트: 2026-01-02

## 우선순위 정의

- **P0**: 런치 전 필수 (보안, 핵심 기능)
- **P1**: 런치 전 권장 (UX, 성능)
- **P2**: 런치 후 개선 (추가 기능)
- **P3**: 백로그 (Nice-to-have)

---

## 카테고리별 TODO 목록

### 1. Analytics/Stats (P2) - 7건 ✅ 완료

**파일**: `lib/analytics/stats.ts`

| 라인 | 설명                        | 우선순위 | 상태    |
| ---- | --------------------------- | -------- | ------- |
| 77   | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 97   | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 117  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 136  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 155  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 170  | 실제 구현 (최근 5분 데이터) | P2       | ✅ 완료 |
| 186  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Analytics] Supabase 쿼리 구현 - stats 모듈` - ✅ 완료

---

### 2. Affiliate 동기화 (P1) - 4건 ✅ 완료

**파일**: `app/api/affiliate/*/sync/route.ts`

| 파일                  | 라인 | 설명                                 | 우선순위 | 상태    |
| --------------------- | ---- | ------------------------------------ | -------- | ------- |
| iherb/sync/route.ts   | -    | Partnerize CSV 피드 다운로드 및 파싱 | P1       | ✅ 완료 |
| musinsa/sync/route.ts | -    | 무신사 큐레이터 API 연동             | P1       | ✅ 완료 |
| coupang/sync/route.ts | -    | upsert에서 구분 필요                 | P2       | ✅ 완료 |
| coupang/sync/route.ts | -    | 추가/업데이트 구분 필요              | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Affiliate] 파트너 API 동기화 구현` - ✅ 완료

**환경변수만 설정하면 동작:**

- iHerb: `IHERB_CAMPAIGN_ID`, `IHERB_PUBLISHER_ID`, `IHERB_API_KEY`
- 무신사: `MUSINSA_CURATOR_ID`, `MUSINSA_API_KEY`
- 쿠팡: 이미 구현됨 (환경변수 설정 필요)

---

### 3. Workout 모듈 (P1) - 5건 (4건 완료)

| 파일                                           | 라인     | 설명                                         | 우선순위 | 상태    |
| ---------------------------------------------- | -------- | -------------------------------------------- | -------- | ------- |
| components/workout/result/WorkoutStyleCard.tsx | 57       | 분석 이벤트 트래킹 추가 시 platform 파라미터 | P3       | ✅ 완료 |
| app/(main)/workout/result/page.tsx             | 137      | 실제 S-1 분석 데이터 연동                    | P1       | ✅ 완료 |
| app/(main)/workout/result/page.tsx             | 269, 280 | 실제 운동 시간으로 교체                      | P1       | ✅ 완료 |
| app/(main)/workout/history/page.tsx            | 147, 155 | 운동 기록 상세 페이지 구현                   | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Workout] 실제 데이터 연동 및 상세 페이지 구현`

---

### 4. Nutrition 모듈 (P1) - 3건 ✅ 완료

| 파일                                    | 라인 | 설명                        | 우선순위 | 상태    |
| --------------------------------------- | ---- | --------------------------- | -------- | ------- |
| components/nutrition/BarcodeScanner.tsx | 174  | 이미지에서 바코드 인식 구현 | P2       | ✅ 완료 |
| app/(main)/nutrition/page.tsx           | 428  | saveAsFavorite 처리 구현    | P1       | ✅ 완료 |
| tests/app/nutrition/page.test.tsx       | 434  | 무한 루프 문제 테스트 수정  | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Nutrition] 바코드 스캔 및 즐겨찾기 기능 완성`

---

### 5. Style/Beauty 모듈 (P2) - 5건 ✅ 완료

| 파일                                      | 라인 | 설명                         | 우선순위 | 상태    |
| ----------------------------------------- | ---- | ---------------------------- | -------- | ------- |
| app/(main)/style/page.tsx                 | 116  | 실제 분석 결과 연동          | P2       | ✅ 완료 |
| app/(main)/style/outfit/[id]/page.tsx     | 120  | 실제 데이터 연동             | P2       | ✅ 완료 |
| app/(main)/style/category/[slug]/page.tsx | 70   | 실제 사용자 체형 데이터 연동 | P2       | ✅ 완료 |
| app/(main)/beauty/[productId]/page.tsx    | 114  | 실제 데이터 연동             | P2       | ✅ 완료 |
| app/(main)/beauty/page.tsx                | 224  | 실제 분석 결과 연동          | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Style/Beauty] 실제 분석 결과 데이터 연동` - ✅ 완료

---

### 6. 기타 기능 (P2-P3) - 6건 (5건 완료)

| 파일                                 | 라인 | 설명                                 | 우선순위 | 상태    |
| ------------------------------------ | ---- | ------------------------------------ | -------- | ------- |
| lib/chat/context.ts                  | 55   | 실제 Supabase에서 사용자 데이터 조회 | P2       | ✅ 완료 |
| lib/ingredients.ts                   | 165  | Gemini 연동 구현                     | P3       | ✅ 완료 |
| lib/smart-matching/size-recommend.ts | 372  | 제품별 실측 데이터 보정              | P3       | ✅ 완료 |
| app/api/analytics/events/route.ts    | 39   | 실제 DB 저장 구현                    | P2       | ✅ 완료 |
| app/admin/feedback/page.tsx          | 95   | 서버에서 피드백 목록 조회            | P2       | ✅ 완료 |
| app/(main)/help/faq/page.tsx         | 155  | 피드백 저장 API 호출                 | P2       | ✅ 완료 |

---

### 7. Profile/Dashboard (P1) - 2건 ✅ 완료

| 파일                                               | 라인 | 설명             | 우선순위 | 상태    |
| -------------------------------------------------- | ---- | ---------------- | -------- | ------- |
| app/(main)/profile/page.tsx                        | 155  | 실제 데이터 연동 | P1       | ✅ 완료 |
| app/(main)/dashboard/\_components/ClosetWidget.tsx | 174  | 날씨 API 연동    | P3       | ✅ 완료 |

**GitHub Issue 제목**: `[Profile] 실제 사용자 데이터 연동`

---

### 8. Products QA (P2) - 1건 ✅ 완료

| 파일                            | 라인 | 설명                | 우선순위 | 상태    |
| ------------------------------- | ---- | ------------------- | -------- | ------- |
| app/(main)/products/qa/page.tsx | 155  | getProductById 호출 | P2       | ✅ 완료 |

**참고**: loadProduct 함수가 이미 구현되어 getProductById를 호출함

---

### 9. 테스트 파일 마이그레이션 (P3) - 4건 ✅ 완료

| 파일                                          | 설명                                | 상태    |
| --------------------------------------------- | ----------------------------------- | ------- |
| tests/lib/color-recommendations.test.ts:246   | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |
| tests/lib/product-recommendations.test.ts:327 | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |
| tests/lib/mock/skin-analysis.test.ts:247      | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |
| tests/lib/mock/body-analysis.test.ts:270      | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |

**참고**: 마이그레이션 파일이 이미 존재함 - 테스트 파일의 TODO 주석을 완료 상태로 업데이트

---

## 요약

| 우선순위 | 건수         | 설명                                                     |
| -------- | ------------ | -------------------------------------------------------- |
| P0       | 0            | 런치 전 필수                                             |
| P1       | 8 (8 완료)   | 런치 전 권장 ✅ (Affiliate, Workout, Nutrition, Profile) |
| P2       | 19 (19 완료) | 런치 후 개선 ✅                                          |
| P3       | 9 (9 완료)   | 백로그 ✅                                                |
| **합계** | **36**       | (36건 완료 - 100%)                                       |

---

## 최근 완료 작업 (2026-01-02)

- ✅ `lib/ingredients.ts`: Gemini AI 성분 분석 연동 (DB에 없는 성분 AI 분석)
- ✅ `components/workout/result/WorkoutStyleCard.tsx`: 쇼핑 링크 클릭 이벤트 트래킹 (platform 파라미터 포함)
- ✅ `lib/analytics/tracker.ts`: `trackShoppingClick` 함수 추가
- ✅ `lib/weather/index.ts`: Open-Meteo 날씨 API 연동 (무료, 키 불필요)
- ✅ `app/(main)/dashboard/_components/ClosetWidget.tsx`: 날씨 데이터 TodayOutfitCard 연동
- ✅ `lib/analytics/stats.ts`: Analytics 7개 함수 Supabase 쿼리 구현 (마이그레이션 포함)
- ✅ `lib/chat/context.ts`: 실제 Supabase에서 사용자 데이터 조회 구현
- ✅ 온보딩 간소화 (7단계 → 3단계) - 운동/영양 온보딩 모두 완료
- ✅ 테스트 파일 업데이트 (nutrition step1, BottomNav) - 3단계 구조 반영
- ✅ `app/api/analytics/events/route.ts`: 실제 Supabase DB 저장 구현
- ✅ `app/api/faq/feedback/route.ts`: FAQ 피드백 API 신규 생성
- ✅ `app/(main)/profile/page.tsx`: 실제 Supabase 데이터 연동 (이미 구현됨)
- ✅ `app/(main)/workout/result/page.tsx`: S-1 피부 분석 데이터 연동 (이미 구현됨)
- ✅ `app/(main)/workout/history/[id]/page.tsx`: 운동 기록 상세 페이지 (이미 구현됨)
- ✅ `app/(main)/nutrition/page.tsx`: saveAsFavorite 처리 (이미 구현됨)
- ✅ `app/(main)/beauty/[productId]/page.tsx`: cosmetic_products 테이블 연동
- ✅ `app/(main)/style/outfit/[id]/page.tsx`: lookbook_posts 테이블 연동
- ✅ `app/(main)/style/category/[slug]/page.tsx`: affiliate_products/lookbook_posts 연동
- ✅ `components/nutrition/BarcodeScanner.tsx`: 갤러리 이미지에서 바코드 인식 구현
- ✅ `tests/app/nutrition/page.test.tsx`: 물 섭취 테스트 무한 루프 문제 수정
- ✅ `app/api/affiliate/iherb/sync/route.ts`: Partnerize CSV 피드 파싱 구현 (키 설정만 필요)
- ✅ `app/api/affiliate/musinsa/sync/route.ts`: 큐레이터 API 연동 구현 (키 설정만 필요)
- ✅ `app/api/affiliate/coupang/sync/route.ts`: upsert add/update 구분 로직 구현
- ✅ `lib/smart-matching/size-recommend.ts`: 제품별 실측 데이터 보정 로직 구현 (calibrateWithProductMeasurements)
- ✅ 테스트 파일 마이그레이션 TODO 주석 정리 (4개 파일) - 마이그레이션 파일이 이미 존재함 확인

---

## GitHub Issues 생성 권장 순서

> P0, P1, P2 모두 완료됨! 남은 작업은 P3 백로그만.

### ✅ 완료된 P1 항목

- ~~`[Affiliate] 파트너 API 동기화 구현` (P1)~~ ✅
- ~~`[Workout] 실제 데이터 연동 및 상세 페이지 구현` (P1)~~ ✅
- ~~`[Nutrition] 바코드 스캔 및 즐겨찾기 기능 완성` (P1)~~ ✅
- ~~`[Profile] 실제 사용자 데이터 연동` (P1)~~ ✅
- ~~`[Analytics] Supabase 쿼리 구현 - stats 모듈` (P2)~~ ✅
- ~~`[Style/Beauty] 실제 분석 결과 데이터 연동` (P2)~~ ✅

### P3 백로그 (선택적) - 모두 완료! ✅

1. ~~`[Workout] 이벤트 트래킹 platform 파라미터`~~ ✅
2. ~~`[Ingredients] Gemini 연동 구현`~~ ✅
3. ~~`[Size] 제품별 실측 데이터 보정`~~ ✅
4. ~~`[Dashboard] 날씨 API 연동`~~ ✅
5. ~~`[Test] 마이그레이션 파일 작성 (4건)`~~ ✅
