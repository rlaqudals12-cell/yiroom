# DB-API 동기화 규칙

> API 코드와 데이터베이스 스키마 간 불일치 방지 규칙

## 배경

2026-01-13: PC-1 API가 존재하지 않는 컬럼(`left_image_url`, `right_image_url`, `images_count`, `analysis_reliability`)에 insert 시도하여 500 에러 발생. 코드는 다각도 분석을 지원하도록 업데이트되었지만, 마이그레이션이 누락됨.

## 필수 체크리스트

### API에서 Supabase Insert/Update 시

**변경 전:**

```typescript
// ❌ 새 컬럼 추가 시 마이그레이션 확인 안 함
const { data, error } = await supabase.from('personal_color_assessments').insert({
  clerk_user_id: userId,
  left_image_url: leftImageUrl, // 새 컬럼
  images_count: imagesCount, // 새 컬럼
});
```

**변경 후:**

```typescript
// ✅ 새 컬럼 추가 전 마이그레이션 먼저 생성
// 1. supabase/migrations/ 에 ALTER TABLE 작성
// 2. npx supabase db push 또는 로컬에서 적용
// 3. 그 다음 API 코드 수정
```

### 검증 순서

1. **API 코드에서 `.insert()` 또는 `.update()` 발견 시:**

   ```
   → 삽입/수정하는 컬럼 목록 추출
   → supabase/migrations/ 에서 해당 테이블 스키마 확인
   → 컬럼 존재 여부 검증
   ```

2. **새 컬럼이 필요한 경우:**
   ```
   → 먼저 마이그레이션 SQL 작성
   → API 코드 수정은 그 다음
   ```

## 컬럼 존재 확인 방법

```bash
# 마이그레이션 파일에서 테이블 스키마 검색
grep -r "테이블명" supabase/migrations/

# 특정 컬럼 검색
grep -r "컬럼명" supabase/migrations/
```

## 주요 API-테이블 매핑

| API Route                     | 테이블                                     |
| ----------------------------- | ------------------------------------------ |
| `/api/analyze/personal-color` | `personal_color_assessments`               |
| `/api/analyze/skin`           | `skin_analyses`                            |
| `/api/analyze/body`           | `body_analyses`                            |
| `/api/products/*`             | `cosmetic_products`, `supplement_products` |
| `/api/reviews/*`              | `product_reviews`, `review_helpful`        |

## 에러 패턴 인식

다음 에러 발생 시 **스키마 불일치** 의심:

```
Database insert error: { code: '42703', message: 'column "xxx" does not exist' }
Failed to save analysis
500 Internal Server Error on POST /api/analyze/*
```

## 마이그레이션 작성 템플릿

```sql
-- Migration: [기능명]
-- Purpose: [목적 설명]
-- Date: YYYY-MM-DD
-- Issue: [관련 이슈/에러 설명]

ALTER TABLE [테이블명]
  ADD COLUMN IF NOT EXISTS [컬럼명] [타입] [제약조건];

COMMENT ON COLUMN [테이블명].[컬럼명] IS '[설명]';
```

## 예방 조치

1. **PR 리뷰 시**: API의 `.insert()`, `.update()` 변경 시 마이그레이션 동반 확인
2. **코드 작성 시**: 새 필드 추가 전 DB 스키마 먼저 확인
3. **테스트 시**: 로컬 Supabase에서 실제 insert 테스트

---

**Version**: 1.0 | **Updated**: 2026-01-13
