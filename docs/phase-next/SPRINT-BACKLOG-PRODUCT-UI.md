# P-1 Product UI Sprint Backlog v1.0

> **작성일**: 2025-12-09
> **모듈명**: P-1 (Product UI)
> **예상 기간**: 2주 (Sprint 1-2)
> **우선순위**: Step 5 추가 기능

---

## 0. Claude Code 사전 검토 항목

### 검토 1: 기존 Product DB 구조

```bash
# 확인 파일 (v3.0 Repository 패턴 적용)
- lib/products.ts (re-export)
- lib/products/index.ts (통합 export)
- lib/products/repositories/ (도메인별 CRUD)
  - cosmetic.ts, supplement.ts, equipment.ts, healthfood.ts, price-history.ts
- lib/products/services/search.ts (통합 검색)
- lib/products/matching.ts (매칭 로직)
- types/product.ts (타입 정의)
- supabase/migrations/20251204_product_tables.sql
- supabase/migrations/20251204_product_db_v2.sql
```

### 검토 2: 기존 분석 모듈 연동

```bash
# 연동 데이터
- personal_color_assessments (PC-1)
- skin_analyses (S-1)
- body_analyses (C-1)
- workout_analyses (W-1)
- nutrition_settings (N-1)
```

### 검토 3: 기존 UI 패턴

```bash
# 참고 컴포넌트
- components/workout/common/ (카드, 필터 패턴)
- components/nutrition/ (리스트 패턴)
- app/(main)/workout/result/ (추천 결과 UI)
```

---

## 1. Sprint 문장화

### Sprint 1 (Week 1)

> "이룸 사용자가 850개 제품을 **카테고리별로 탐색**하고,
> **필터링/검색**을 통해 원하는 제품을 찾을 수 있도록
> **제품 목록 페이지**를 완성한다."

### Sprint 2 (Week 2)

> "이룸 사용자가 **개인 분석 결과 기반 추천**을 받고,
> **제품 상세 정보**와 **매칭도**를 확인하여
> **구매 결정**까지 이어질 수 있도록 한다."

---

## 2. MVP 우선순위 분류

### Must (필수)

| # | 기능 | 설명 |
|---|------|------|
| 1 | 제품 목록 페이지 | `/products` 라우트 |
| 2 | 카테고리 탭 | 화장품/영양제/운동기구/건강식품 |
| 3 | 기본 필터링 | 카테고리, 가격대 |
| 4 | 제품 카드 | 이미지, 이름, 가격, 평점 |
| 5 | 제품 상세 페이지 | `/products/[type]/[id]` |
| 6 | 기본 정보 표시 | 성분, 설명, 가격 |
| 7 | 구매 링크 | 외부 링크 연결 |

### Should (권장)

| # | 기능 | 설명 |
|---|------|------|
| 8 | 개인화 추천 | PC-1/S-1 연동 필터 |
| 9 | 매칭도 표시 | 매칭 점수 (%) |
| 10 | 고급 필터 | 피부타입, 고민, 퍼스널컬러 |
| 11 | 검색 기능 | 제품명/브랜드 검색 |
| 12 | 정렬 옵션 | 추천순, 가격순, 평점순 |

### Later (향후)

| # | 기능 | 설명 | 상태 |
|---|------|------|------|
| 13 | 무한 스크롤 | 페이지네이션 → 무한 스크롤 | ⏳ 추후 |
| 14 | 위시리스트 | 찜하기 기능 | ✅ Phase E-3 |
| 15 | 가격 히스토리 | 가격 변동 차트 | ✅ Phase E-3 |
| 16 | 성분 충돌 경고 | 영양제 상호작용 | ✅ Phase E-4 |

---

## 3. Sprint 1 (Week 1): 제품 목록

### Task 1.1: 제품 타입 확장

| 항목 | 내용 |
|------|------|
| **파일** | `types/product.ts` |
| **시간** | 0.5d |
| **우선순위** | Must |
| **의존성** | 없음 |

**작업 내용:**
- `ProductWithMatch<T>` 제네릭 타입 추가 (개인화 매칭 결과)
- `MatchReason` 타입 추가 (매칭 사유)
- `ProductSearchOptions` 인터페이스 추가 (통합 검색/정렬)
- 참고: `CosmeticProductFilter` 등 기존 필터 타입 활용

**수락 기준:**
```
Given: types/product.ts 파일
When: 새 타입 정의 추가
Then: TypeScript 에러 없음 + lib/products.ts에서 import 가능
```

---

### Task 1.2: 제품 API 확장

| 항목 | 내용 |
|------|------|
| **파일** | `lib/products.ts` |
| **시간** | 1d |
| **우선순위** | Must |
| **의존성** | Task 1.1 |

**작업 내용:**
- `getAllProducts(filters)` 통합 조회 함수
- `searchProducts(query)` 검색 함수
- `getProductsByCategory(category, filters)` 카테고리별 조회
- 필터 적용 로직 (가격대, 피부타입 등)

**수락 기준:**
```
Given: getAllProducts({ category: 'skincare', priceRange: 'mid' })
When: 함수 호출
Then: 해당 조건의 제품 배열 반환 (priceRange = 'mid' AND category = 'skincare')
```

---

### Task 1.3: 제품 카드 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/ProductCard.tsx` |
| **시간** | 0.5d |
| **우선순위** | Must |
| **의존성** | Task 1.1 |

**작업 내용:**
- 제품 이미지 (next/image, fallback)
- 브랜드명, 제품명
- 가격 표시 (₩ 포맷)
- 평점 (⭐) + 리뷰 수
- 매칭도 배지 (옵션)

**수락 기준:**
```
Given: ProductCard에 화장품 데이터 전달
When: 렌더링
Then: 이미지, 브랜드, 제품명, 가격, 평점 모두 표시
      이미지 없으면 플레이스홀더 표시
```

---

### Task 1.4: 제품 목록 페이지 기본

| 항목 | 내용 |
|------|------|
| **파일** | `app/(main)/products/page.tsx` |
| **시간** | 1d |
| **우선순위** | Must |
| **의존성** | Task 1.2, 1.3 |

**작업 내용:**
- 페이지 레이아웃
- 카테고리 탭 (전체/스킨케어/메이크업/영양제/운동기구/건강식품)
- 제품 그리드 (2열 모바일, 3열 태블릿, 4열 데스크탑)
- 로딩 스켈레톤
- 빈 상태 UI

**수락 기준:**
```
Given: /products 페이지 접속
When: 페이지 로드
Then: 카테고리 탭 표시 + 전체 제품 그리드 표시 (최대 20개)
      탭 클릭 시 해당 카테고리 제품만 표시
```

---

### Task 1.5: 필터 컴포넌트 (기본)

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/ProductFilters.tsx` |
| **시간** | 1d |
| **우선순위** | Must |
| **의존성** | Task 1.1 |

**작업 내용:**
- 필터 버튼 (모바일: Sheet, 데스크탑: Popover)
- 가격대 필터 (budget/mid/premium)
- 브랜드 필터 (체크박스)
- 필터 초기화 버튼
- 적용된 필터 배지 표시

**수락 기준:**
```
Given: 필터 버튼 클릭
When: 가격대 "mid" 선택 후 적용
Then: URL에 ?priceRange=mid 반영 + 제품 목록 필터링
```

---

### Task 1.6: 정렬 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/ProductSort.tsx` |
| **시간** | 0.5d |
| **우선순위** | Should |
| **의존성** | Task 1.4 |

**작업 내용:**
- Select 드롭다운
- 정렬 옵션: 추천순, 인기순, 가격 낮은순, 가격 높은순, 평점순
- URL 파라미터 연동

**수락 기준:**
```
Given: 정렬 드롭다운에서 "가격 낮은순" 선택
When: 선택
Then: URL에 ?sortBy=priceAsc 반영 + 제품 목록 재정렬
```

---

### Task 1.7: 검색 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/ProductSearch.tsx` |
| **시간** | 0.5d |
| **우선순위** | Should |
| **의존성** | Task 1.2 |

**작업 내용:**
- 검색 입력창
- Debounce (300ms)
- 검색 결과 카운트 표시
- 검색어 하이라이트 (옵션)

**수락 기준:**
```
Given: 검색창에 "히알루론" 입력
When: 300ms 후
Then: URL에 ?search=히알루론 반영 + 해당 제품만 표시
```

---

### Task 1.8: 제품 목록 컴포넌트 index

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/index.ts` |
| **시간** | 0.25d |
| **우선순위** | Must |
| **의존성** | Task 1.3, 1.5, 1.6, 1.7 |

**작업 내용:**
- 모든 컴포넌트 export 통합

---

## 4. Sprint 2 (Week 2): 상세 & 개인화

### Task 2.1: 제품 상세 페이지 기본

| 항목 | 내용 |
|------|------|
| **파일** | `app/(main)/products/[type]/[id]/page.tsx` |
| **시간** | 1d |
| **우선순위** | Must |
| **의존성** | Task 1.2 |

**작업 내용:**
- 동적 라우트 설정
- 제품 이미지 (대)
- 기본 정보 (브랜드, 이름, 가격, 평점)
- 탭 구조 (상세/성분/구매)
- 뒤로가기 버튼

**수락 기준:**
```
Given: /products/cosmetic/[uuid] 접속
When: 페이지 로드
Then: 해당 제품 상세 정보 표시
      존재하지 않는 ID면 404 페이지
```

---

### Task 2.2: 제품 상세 정보 탭

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/detail/ProductDetailTabs.tsx` |
| **시간** | 0.5d |
| **우선순위** | Must |
| **의존성** | Task 2.1 |

**작업 내용:**
- 상세 탭: 설명, 용량, 사용법
- 성분 탭: 주요 성분 리스트 + 설명
- 구매 탭: 구매 링크 버튼

**수락 기준:**
```
Given: 제품 상세 페이지
When: "성분" 탭 클릭
Then: keyIngredients 배열 표시 (camelCase)
```

---

### Task 2.3: 매칭도 계산 로직

| 항목 | 내용 |
|------|------|
| **파일** | `lib/products/matching.ts` |
| **시간** | 1d |
| **우선순위** | Should |
| **의존성** | Task 1.1 |

**작업 내용:**
- `calculateMatchScore(product, userProfile)` 함수
- 피부 타입 매칭 (0-30점)
- 피부 고민 매칭 (0-30점)
- 퍼스널 컬러 매칭 (0-20점)
- 목표 매칭 (0-20점)
- `getMatchReasons(product, userProfile)` 함수

**수락 기준:**
```
Given: Summer 타입 + 건성 피부 사용자
When: Summer 지원 + 건성 적합 화장품에 매칭도 계산
Then: 80점 이상 반환 + "Summer 타입에 어울려요", "건성 피부에 적합" 이유 반환
```

---

### Task 2.4: 매칭도 카드 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/detail/ProductMatchCard.tsx` |
| **시간** | 0.5d |
| **우선순위** | Should |
| **의존성** | Task 2.3 |

**작업 내용:**
- 종합 매칭도 (%) 표시
- 매칭 이유 리스트 (체크/X 아이콘)
- 미로그인 시 "로그인하고 매칭도 확인하기" CTA

**수락 기준:**
```
Given: 제품 상세 + 로그인 사용자 (PC-1, S-1 완료)
When: 매칭 카드 렌더링
Then: 매칭도 92% + 매칭 이유 3개 표시
```

---

### Task 2.5: 고급 필터 (개인화)

| 항목 | 내용 |
|------|------|
| **파일** | `components/products/ProductFilters.tsx` (확장) |
| **시간** | 1d |
| **우선순위** | Should |
| **의존성** | Task 1.5, 2.3 |

**작업 내용:**
- 피부 타입 필터 (건성/지성/복합성/민감성/정상)
- 피부 고민 필터 (모공/주름/트러블/색소침착/수분 등)
- 퍼스널 컬러 필터 (Spring/Summer/Autumn/Winter)
- "내 분석 결과 적용" 버튼 (자동 필터 설정)

**수락 기준:**
```
Given: S-1 완료 사용자 (건성, 모공 고민)
When: "내 분석 결과 적용" 클릭
Then: skinTypes=dry, concerns=pore 자동 선택 + 필터링
```

---

### Task 2.6: 개인화 추천 페이지

| 항목 | 내용 |
|------|------|
| **파일** | `app/(main)/products/recommended/page.tsx` |
| **시간** | 1d |
| **우선순위** | Should |
| **의존성** | Task 2.3 |

**작업 내용:**
- 추천 섹션 5개 (피부/메이크업/영양제/운동기구/건강식품)
- 각 섹션 수평 스크롤 캐러셀
- 분석 미완료 시 해당 섹션 잠금 + CTA

**수락 기준:**
```
Given: PC-1 + S-1 완료 사용자
When: /products/recommended 접속
Then: "내 피부에 맞는 스킨케어" + "내 퍼스널컬러에 맞는 메이크업" 섹션 표시
      각 섹션에 매칭도 높은 순 5개 제품
```

---

### Task 2.7: 네비게이션 연동

| 항목 | 내용 |
|------|------|
| **파일** | `components/layout/Navbar.tsx`, `BottomNav.tsx` |
| **시간** | 0.5d |
| **우선순위** | Must |
| **의존성** | Task 2.6 |

**작업 내용:**
- 네비게이션에 "제품" 또는 "추천" 링크 추가
- 대시보드에 추천 제품 위젯 추가 (옵션)

**수락 기준:**
```
Given: 메인 네비게이션
When: 확인
Then: "제품" 메뉴 존재 + 클릭 시 /products 이동
```

---

### Task 2.8: 테스트 작성

| 항목 | 내용 |
|------|------|
| **파일** | `tests/lib/products/*.test.ts`, `tests/components/products/*.test.tsx` |
| **시간** | 1d |
| **우선순위** | Must |
| **의존성** | 전체 |

**작업 내용:**
- `getAllProducts` 필터 테스트
- `calculateMatchScore` 로직 테스트
- `ProductCard` 렌더링 테스트
- `ProductFilters` 상호작용 테스트

**수락 기준:**
```
Given: npm run test
When: 실행
Then: 신규 테스트 전체 통과
```

---

## 5. 전체 일정 요약

| Sprint | 주차 | Task | 예상 시간 |
|--------|------|------|----------|
| Sprint 1 | Week 1 | Task 1.1 ~ 1.8 | 5.25d |
| Sprint 2 | Week 2 | Task 2.1 ~ 2.8 | 6.5d |
| **합계** | - | **16개 Task** | **11.75d** |

### 주별 배치

#### Week 1 (Sprint 1)
- Day 1: Task 1.1 (타입), Task 1.3 (카드)
- Day 2-3: Task 1.2 (API)
- Day 4: Task 1.4 (목록 페이지)
- Day 5: Task 1.5 (필터), Task 1.6 (정렬), Task 1.7 (검색), Task 1.8 (index)

#### Week 2 (Sprint 2)
- Day 1: Task 2.1 (상세 페이지)
- Day 2: Task 2.2 (탭), Task 2.3 (매칭 로직)
- Day 3: Task 2.4 (매칭 카드), Task 2.5 (고급 필터)
- Day 4: Task 2.6 (추천 페이지), Task 2.7 (네비게이션)
- Day 5: Task 2.8 (테스트)

---

## 6. 산출물 체크리스트

### 코드

- [x] `types/product.ts` (확장)
- [x] `lib/products.ts` (re-export)
- [x] `lib/products/index.ts` (통합 export)
- [x] `lib/products/repositories/` (도메인별 CRUD - 5개 파일)
- [x] `lib/products/services/search.ts` (통합 검색)
- [x] `lib/products/matching.ts` (매칭 로직)
- [x] `components/products/ProductCard.tsx`
- [x] `components/products/ProductFilters.tsx`
- [x] `components/products/ProductSort.tsx`
- [x] `components/products/ProductSearch.tsx`
- [x] `components/products/detail/ProductDetailTabs.tsx`
- [x] `components/products/detail/ProductMatchCard.tsx`
- [x] `components/products/index.ts`
- [x] `app/(main)/products/page.tsx`
- [x] `app/(main)/products/[type]/[id]/page.tsx`
- [x] `app/(main)/products/recommended/page.tsx`

### 테스트

- [x] `tests/lib/products/matching.test.ts`
- [x] `tests/components/products/ProductCard.test.tsx`
- [x] `tests/components/products/ProductFilters.test.tsx`

---

## 7. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-12-09 | 초안 작성 |
| v1.1 | 2025-12-09 | Step 5 구현 완료 - 전체 체크리스트 완료 표시 |
| v1.2 | 2025-12-09 | Repository 패턴 리팩토링 - lib/products/ 구조 분리 |

---

**문서 버전**: v1.2
**최종 수정일**: 2025-12-09
