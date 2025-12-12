# Phase E: 추가 개선 계획

> **작성일**: 2025-12-11
> **목표**: SEO 최적화 → 코드 품질 → 기능 확장 → AI 고도화

---

## 전체 로드맵

| Phase | 내용 | 예상 기간 | 우선순위 |
|-------|------|----------|----------|
| E-1 | SEO 기본 | 0.5일 | 필수 |
| E-2 | 코드 품질 | 1일 | 권장 |
| E-3 | Product UI 확장 | 2일 | 권장 |
| E-4 | AI 기능 확장 | 3일 | 선택 |

---

## Phase E-1: SEO 기본 (0.5일)

### 목표
검색 엔진 최적화 및 에러 처리 개선

### 작업 목록

| # | 파일 | 설명 | 상태 |
|---|------|------|------|
| 1.1 | `app/robots.ts` | 검색 엔진 크롤링 규칙 | ✅ 완료 |
| 1.2 | `app/sitemap.ts` | 동적 사이트맵 생성 | ✅ 완료 |
| 1.3 | `app/not-found.tsx` | 커스텀 404 페이지 | ✅ 완료 |
| 1.4 | `app/error.tsx` | 커스텀 에러 페이지 | ✅ 완료 |
| 1.5 | `app/global-error.tsx` | 루트 에러 핸들러 | ✅ 완료 |

### 상세 스펙

#### 1.1 robots.ts
```typescript
// 크롤링 허용/차단 규칙
- 공개 페이지: /analysis/*, /products/*, /workout/*, /nutrition/*
- 차단 페이지: /api/*, /auth-test/*, /storage-test/*
- 사이트맵 URL 포함
```

#### 1.2 sitemap.ts
```typescript
// 동적 사이트맵
- 정적 페이지 (/, /products, /products/recommended)
- 제품 상세 페이지 (/products/[type]/[id])
- changeFrequency, priority 설정
```

#### 1.3 not-found.tsx
```typescript
// 404 페이지 디자인
- 이룸 브랜딩 적용
- 홈으로 돌아가기 버튼
- 인기 기능 링크 (분석, 운동, 영양)
```

---

## Phase E-2: 코드 품질 (1일)

### 목표
코드 일관성 및 CI/CD 파이프라인 구축

### 작업 목록

| # | 파일 | 설명 | 상태 |
|---|------|------|------|
| 2.1 | `.prettierrc` | 코드 포맷터 설정 | ✅ 완료 |
| 2.2 | `.prettierignore` | 포맷 제외 파일 | ✅ 완료 |
| 2.3 | `.github/workflows/ci.yml` | CI 파이프라인 | ✅ 완료 |
| 2.4 | `.husky/pre-commit` | 커밋 전 검사 | ✅ 완료 |
| 2.5 | `package.json` | lint-staged 설정 | ✅ 완료 |

### CI 파이프라인 설계
```yaml
on: [push, pull_request]
jobs:
  - typecheck
  - lint
  - test
  - build
```

---

## Phase E-3: Product UI 확장 (2일)

### 목표
사용자 경험 향상 기능 추가

### 작업 목록

| # | 기능 | 파일 | 상태 |
|---|------|------|------|
| 3.1 | 가격 히스토리 차트 | `components/products/detail/PriceHistoryChart.tsx` | ✅ 완료 |
| 3.2 | 위시리스트 DB 테이블 | `supabase/migrations/20251211_wishlist.sql` | ✅ 완료 |
| 3.3 | 위시리스트 API | `lib/wishlist.ts` | ✅ 완료 |
| 3.4 | 위시리스트 UI | `components/products/WishlistButton.tsx` | ✅ 완료 |
| 3.5 | 위시리스트 페이지 | `app/(main)/wishlist/page.tsx` | ✅ 완료 |
| 3.6 | 무한 스크롤 | `components/products/ProductGrid.tsx` 개선 | ⏳ 추후 |

### 데이터베이스 스키마
```sql
CREATE TABLE user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL, -- cosmetic, supplement, workout_equipment, health_food
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, product_type, product_id)
);
```

---

## Phase E-4: AI 기능 확장 (3일)

### 목표
RAG 기반 고급 AI 기능

### 작업 목록

| # | 기능 | 파일 | 상태 |
|---|------|------|------|
| 4.1 | 제품 Q&A | `lib/rag/product-qa.ts` | ✅ 완료 |
| 4.2 | Q&A UI | `components/products/ProductQA.tsx` | ✅ 완료 |
| 4.3 | 성분 충돌 경고 | `lib/nutrition/ingredient-interaction.ts` | ✅ 완료 |
| 4.4 | 충돌 경고 UI | `components/nutrition/InteractionWarning.tsx` | ✅ 완료 |
| 4.5 | 스킨케어 루틴 빌더 | `lib/skincare/routine-builder.ts` | ✅ 완료 |

### RAG Q&A 설계
```typescript
// 사용자 질문 예시
"이 제품 민감성 피부에 괜찮아요?"
"비타민C 세럼이랑 레티놀 같이 써도 돼요?"

// RAG 파이프라인
1. 질문 임베딩 생성
2. research_documents 벡터 검색
3. 관련 문서 + 제품 정보 컨텍스트 구성
4. Gemini로 답변 생성
5. 출처 포함 응답
```

---

## 의존성 관계

```
E-1 (SEO) ──┐
            ├──> E-3 (Product 확장)
E-2 (품질) ──┘
                      │
                      v
               E-4 (AI 확장)
```

---

## 성공 지표

| Phase | 지표 | 목표 |
|-------|------|------|
| E-1 | Google 인덱싱 | 주요 페이지 100% |
| E-2 | CI 성공률 | 95%+ |
| E-3 | 위시리스트 사용률 | 30%+ |
| E-4 | Q&A 만족도 | 4.0/5.0 |

---

**버전**: v1.0
**작성일**: 2025-12-11
