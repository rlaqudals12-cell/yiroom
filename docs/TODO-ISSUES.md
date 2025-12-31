# TODO Issues 정리

> 코드베이스에서 발견된 TODO 주석을 GitHub Issues로 전환하기 위한 문서
> 생성일: 2025-12-31

## 우선순위 정의

- **P0**: 런치 전 필수 (보안, 핵심 기능)
- **P1**: 런치 전 권장 (UX, 성능)
- **P2**: 런치 후 개선 (추가 기능)
- **P3**: 백로그 (Nice-to-have)

---

## 카테고리별 TODO 목록

### 1. Analytics/Stats (P2) - 7건

**파일**: `lib/analytics/stats.ts`

| 라인 | 설명                        | 우선순위 |
| ---- | --------------------------- | -------- |
| 77   | 실제 Supabase 쿼리 구현     | P2       |
| 97   | 실제 Supabase 쿼리 구현     | P2       |
| 117  | 실제 Supabase 쿼리 구현     | P2       |
| 136  | 실제 Supabase 쿼리 구현     | P2       |
| 155  | 실제 Supabase 쿼리 구현     | P2       |
| 170  | 실제 구현 (최근 5분 데이터) | P2       |
| 186  | 실제 Supabase 쿼리 구현     | P2       |

**GitHub Issue 제목**: `[Analytics] Supabase 쿼리 구현 - stats 모듈`

---

### 2. Affiliate 동기화 (P1) - 4건

**파일**: `app/api/affiliate/*/sync/route.ts`

| 파일                  | 라인    | 설명                                 | 우선순위 |
| --------------------- | ------- | ------------------------------------ | -------- |
| iherb/sync/route.ts   | 39      | Partnerize CSV 피드 다운로드 및 파싱 | P1       |
| musinsa/sync/route.ts | 39      | 무신사 큐레이터 API 연동             | P1       |
| coupang/sync/route.ts | 61      | upsert에서 구분 필요                 | P2       |
| coupang/sync/route.ts | 72, 107 | 추가/업데이트 구분 필요              | P2       |

**GitHub Issue 제목**: `[Affiliate] 파트너 API 동기화 구현`

---

### 3. Workout 모듈 (P1) - 5건

| 파일                                           | 라인     | 설명                                         | 우선순위 |
| ---------------------------------------------- | -------- | -------------------------------------------- | -------- |
| components/workout/result/WorkoutStyleCard.tsx | 57       | 분석 이벤트 트래킹 추가 시 platform 파라미터 | P3       |
| app/(main)/workout/result/page.tsx             | 137      | 실제 S-1 분석 데이터 연동                    | P1       |
| app/(main)/workout/result/page.tsx             | 269, 280 | 실제 운동 시간으로 교체                      | P1       |
| app/(main)/workout/history/page.tsx            | 147, 155 | 운동 기록 상세 페이지 구현                   | P2       |

**GitHub Issue 제목**: `[Workout] 실제 데이터 연동 및 상세 페이지 구현`

---

### 4. Nutrition 모듈 (P1) - 3건

| 파일                                    | 라인 | 설명                        | 우선순위 |
| --------------------------------------- | ---- | --------------------------- | -------- |
| components/nutrition/BarcodeScanner.tsx | 174  | 이미지에서 바코드 인식 구현 | P2       |
| app/(main)/nutrition/page.tsx           | 428  | saveAsFavorite 처리 구현    | P1       |
| tests/app/nutrition/page.test.tsx       | 434  | 무한 루프 문제 테스트 수정  | P2       |

**GitHub Issue 제목**: `[Nutrition] 바코드 스캔 및 즐겨찾기 기능 완성`

---

### 5. Style/Beauty 모듈 (P2) - 5건

| 파일                                      | 라인 | 설명                         | 우선순위 |
| ----------------------------------------- | ---- | ---------------------------- | -------- |
| app/(main)/style/page.tsx                 | 116  | 실제 분석 결과 연동          | P2       |
| app/(main)/style/outfit/[id]/page.tsx     | 120  | 실제 데이터 연동             | P2       |
| app/(main)/style/category/[slug]/page.tsx | 70   | 실제 사용자 체형 데이터 연동 | P2       |
| app/(main)/beauty/[productId]/page.tsx    | 114  | 실제 데이터 연동             | P2       |
| app/(main)/beauty/page.tsx                | 224  | 실제 분석 결과 연동          | P2       |

**GitHub Issue 제목**: `[Style/Beauty] 실제 분석 결과 데이터 연동`

---

### 6. 기타 기능 (P2-P3) - 6건

| 파일                                 | 라인 | 설명                                 | 우선순위 |
| ------------------------------------ | ---- | ------------------------------------ | -------- |
| lib/chat/context.ts                  | 55   | 실제 Supabase에서 사용자 데이터 조회 | P2       |
| lib/ingredients.ts                   | 165  | Gemini 연동 구현                     | P3       |
| lib/smart-matching/size-recommend.ts | 372  | 제품별 실측 데이터 보정              | P3       |
| app/api/analytics/events/route.ts    | 39   | 실제 DB 저장 구현                    | P2       |
| app/admin/feedback/page.tsx          | 95   | 서버에서 피드백 목록 조회            | P2       |
| app/(main)/help/faq/page.tsx         | 155  | 피드백 저장 API 호출                 | P2       |

---

### 7. Profile/Dashboard (P1) - 2건

| 파일                                               | 라인 | 설명             | 우선순위 |
| -------------------------------------------------- | ---- | ---------------- | -------- |
| app/(main)/profile/page.tsx                        | 155  | 실제 데이터 연동 | P1       |
| app/(main)/dashboard/\_components/ClosetWidget.tsx | 174  | 날씨 API 연동    | P3       |

**GitHub Issue 제목**: `[Profile] 실제 사용자 데이터 연동`

---

### 8. Products QA (P2) - 1건

| 파일                            | 라인 | 설명                | 우선순위 |
| ------------------------------- | ---- | ------------------- | -------- |
| app/(main)/products/qa/page.tsx | 155  | getProductById 호출 | P2       |

---

### 9. 테스트 파일 마이그레이션 (P3) - 4건

| 파일                                          | 설명                                |
| --------------------------------------------- | ----------------------------------- |
| tests/lib/color-recommendations.test.ts:246   | 배포 전 마이그레이션 파일 작성 필요 |
| tests/lib/product-recommendations.test.ts:327 | 배포 전 마이그레이션 파일 작성 필요 |
| tests/lib/mock/skin-analysis.test.ts:247      | 배포 전 마이그레이션 파일 작성 필요 |
| tests/lib/mock/body-analysis.test.ts:270      | 배포 전 마이그레이션 파일 작성 필요 |

---

## 요약

| 우선순위 | 건수   | 설명                                                  |
| -------- | ------ | ----------------------------------------------------- |
| P0       | 0      | 런치 전 필수                                          |
| P1       | 8      | 런치 전 권장 (Affiliate, Workout, Nutrition, Profile) |
| P2       | 20     | 런치 후 개선                                          |
| P3       | 9      | 백로그                                                |
| **합계** | **37** |                                                       |

---

## GitHub Issues 생성 권장 순서

1. `[Affiliate] 파트너 API 동기화 구현` (P1)
2. `[Workout] 실제 데이터 연동 및 상세 페이지 구현` (P1)
3. `[Nutrition] 바코드 스캔 및 즐겨찾기 기능 완성` (P1)
4. `[Profile] 실제 사용자 데이터 연동` (P1)
5. `[Analytics] Supabase 쿼리 구현 - stats 모듈` (P2)
6. `[Style/Beauty] 실제 분석 결과 데이터 연동` (P2)
