---
paths:
  - '**/supabase/**'
  - '**/db/**'
  - '**/*supabase*.ts'
  - '**/lib/db*'
  - '**/migrations/**'
---

# Supabase 데이터베이스 규칙

> DB 관련 파일에만 적용

---

## 클라이언트 선택

| 컨텍스트          | 함수                          | 파일              | RLS     |
| ----------------- | ----------------------------- | ----------------- | ------- |
| Client Component  | `useClerkSupabaseClient()`    | `clerk-client.ts` | ✅ 적용 |
| Server/API        | `createClerkSupabaseClient()` | `server.ts`       | ✅ 적용 |
| 관리자 (RLS 우회) | `createServiceRoleClient()`   | `service-role.ts` | ❌ 우회 |

### 사용 예시

```typescript
// Client Component
'use client';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

function MyComponent() {
  const supabase = useClerkSupabaseClient();
  // ...
}

// Server Component / API Route
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClerkSupabaseClient();
  // ...
}

// 관리자 작업 (Cron, Webhook)
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST() {
  const supabase = createServiceRoleClient(); // RLS 우회
  // ...
}
```

---

## RLS 정책 상세 가이드

### 기본 원칙

- **모든 테이블에 RLS 필수** (public 스키마)
- `clerk_user_id` 컬럼 기반 접근 제어
- 성능을 위해 `(SELECT auth.get_user_id())` 사용 (함수 캐싱)

> **상세 원리**: [security-patterns.md](../../docs/principles/security-patterns.md#6-row-level-security-rls) 참조

### RLS 함수

```sql
-- JWT에서 user_id 추출 (Clerk 통합)
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$;
```

**주의**: Clerk은 문자열 ID 사용. `auth.uid()` (UUID) 대신 `auth.get_user_id()` (TEXT) 사용.

---

### 패턴 1: 개인 민감 데이터 (분석 결과)

```sql
-- 테이블 RLS 활성화
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;

-- 본인만 조회
CREATE POLICY "user_select_own" ON skin_analyses
  FOR SELECT
  USING (clerk_user_id = (SELECT auth.get_user_id()));

-- 본인만 삽입
CREATE POLICY "user_insert_own" ON skin_analyses
  FOR INSERT
  WITH CHECK (clerk_user_id = (SELECT auth.get_user_id()));

-- 본인만 수정
CREATE POLICY "user_update_own" ON skin_analyses
  FOR UPDATE
  USING (clerk_user_id = (SELECT auth.get_user_id()));

-- 본인만 삭제
CREATE POLICY "user_delete_own" ON skin_analyses
  FOR DELETE
  USING (clerk_user_id = (SELECT auth.get_user_id()));

-- 서비스 역할 전체 접근 (Cron, Webhook)
CREATE POLICY "service_role_all" ON skin_analyses
  FOR ALL
  USING (current_setting('role', true) = 'service_role');
```

---

### 패턴 2: 소셜 데이터 (양방향 관계)

```sql
-- 친구 관계 테이블
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- 양방향 조회: 요청자 또는 수신자
CREATE POLICY "view_own_friendships" ON friendships
  FOR SELECT
  USING (
    user_id = (SELECT auth.get_user_id())
    OR friend_id = (SELECT auth.get_user_id())
  );

-- 삽입: 본인이 요청자
CREATE POLICY "insert_own_requests" ON friendships
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.get_user_id()));

-- 수정: 양쪽 모두 가능 (상태 변경)
CREATE POLICY "update_own_friendships" ON friendships
  FOR UPDATE
  USING (
    user_id = (SELECT auth.get_user_id())
    OR friend_id = (SELECT auth.get_user_id())
  );
```

---

### 패턴 3: 공개 읽기 + 관리자 쓰기 (제품 DB)

```sql
ALTER TABLE cosmetic_products ENABLE ROW LEVEL SECURITY;

-- 모두 조회 가능 (anon 포함)
CREATE POLICY "public_read" ON cosmetic_products
  FOR SELECT
  USING (true);

-- 관리자만 삽입
CREATE POLICY "admin_insert" ON cosmetic_products
  FOR INSERT
  WITH CHECK (is_admin((SELECT auth.get_user_id())));

-- 관리자만 수정
CREATE POLICY "admin_update" ON cosmetic_products
  FOR UPDATE
  USING (is_admin((SELECT auth.get_user_id())));
```

---

### 패턴 4: 친구 공개 데이터 (프로필)

```sql
-- 본인 + 수락된 친구만 조회 가능
CREATE POLICY "friends_can_view" ON user_profiles
  FOR SELECT
  USING (
    clerk_user_id = (SELECT auth.get_user_id())
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (user_id = (SELECT auth.get_user_id()) AND friend_id = user_profiles.clerk_user_id)
        OR (friend_id = (SELECT auth.get_user_id()) AND user_id = user_profiles.clerk_user_id)
      )
    )
  );
```

---

### 패턴 5: 이미지 무결성 (수정 금지)

```sql
-- 분석 이미지: 생성 후 수정 금지
ALTER TABLE analysis_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own" ON analysis_images
  FOR SELECT USING (clerk_user_id = (SELECT auth.get_user_id()));

CREATE POLICY "user_insert_own" ON analysis_images
  FOR INSERT WITH CHECK (clerk_user_id = (SELECT auth.get_user_id()));

-- UPDATE 정책 없음 = 수정 불가

CREATE POLICY "user_delete_own" ON analysis_images
  FOR DELETE USING (clerk_user_id = (SELECT auth.get_user_id()));
```

---

### 성능 최적화

```sql
-- 느림: 행마다 함수 호출
USING (auth.get_user_id() = clerk_user_id)

-- 빠름: InitPlan 캐싱 (최대 99% 성능 향상)
USING ((SELECT auth.get_user_id()) = clerk_user_id)
```

**필수**: 모든 RLS 정책에서 `(SELECT ...)` 래핑 사용

---

### USING vs WITH CHECK

| 절            | 용도          | 적용 대상                |
| ------------- | ------------- | ------------------------ |
| **USING**     | 기존 행 필터링 | SELECT, UPDATE, DELETE |
| **WITH CHECK** | 새/수정 행 검증 | INSERT, UPDATE          |

```sql
-- UPDATE는 두 가지 모두 필요
CREATE POLICY "update_own" ON data
  FOR UPDATE
  USING (user_id = (SELECT auth.get_user_id()))          -- 기존 행 접근
  WITH CHECK (user_id = (SELECT auth.get_user_id()));    -- 수정 후 행 검증
```

---

### 테이블별 RLS 현황

| 테이블 | RLS | 패턴 | 비고 |
|--------|-----|------|------|
| `skin_analyses` | ✅ | 개인 민감 | 본인만 |
| `personal_color_assessments` | ✅ | 개인 민감 | 본인만 |
| `body_analyses` | ✅ | 개인 민감 | 본인만 |
| `workout_logs` | ✅ | 개인 민감 | 본인만 |
| `friendships` | ✅ | 양방향 소셜 | 양쪽 접근 |
| `cosmetic_products` | ✅ | 공개 읽기 | anon 포함 |
| `audit_logs` | ✅ | 감사 로그 | 관리자만 조회 |
| `user_badges` | ✅ | 개인 데이터 | 본인만 |

---

### 디버깅

```sql
-- 현재 사용자 확인
SELECT auth.get_user_id();

-- 테이블 RLS 상태 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 테이블 정책 확인
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'skin_analyses';
```

---

### 흔한 실수

| 실수 | 증상 | 해결 |
|------|------|------|
| RLS 미활성화 | 모든 데이터 노출 | `ENABLE ROW LEVEL SECURITY` |
| `auth.uid()` 사용 | NULL 반환 | `auth.get_user_id()` 사용 |
| SELECT 래핑 누락 | 느린 쿼리 | `(SELECT auth.get_user_id())` |
| WITH CHECK 누락 | INSERT/UPDATE 실패 | FOR INSERT/UPDATE에 추가 |
| service_role 정책 누락 | Cron 작업 실패 | service_role 정책 추가 |

---

## JSONB 패턴

### JSONB 컬럼 사용 시기

| 사용                  | 예시            |
| --------------------- | --------------- |
| ✅ 유연한 스키마      | 분석 결과, 설정 |
| ✅ 중첩 데이터        | 다단계 추천     |
| ❌ 자주 쿼리하는 필드 | ID, 날짜        |
| ❌ 인덱스 필요        | 검색 조건       |

### JSONB 쿼리

```typescript
// JSONB 필드 접근
const { data } = await supabase
  .from('skin_analyses')
  .select('result->skinType, result->scores')
  .eq('clerk_user_id', userId);

// JSONB 필드 필터
const { data } = await supabase.from('skin_analyses').select('*').eq('result->>skinType', 'oily');

// JSONB 배열 포함
const { data } = await supabase
  .from('skin_analyses')
  .select('*')
  .contains('result->concerns', ['acne']);
```

### JSONB 업데이트

```typescript
// 전체 교체
await supabase.from('user_settings').update({ settings: newSettings }).eq('clerk_user_id', userId);

// 부분 업데이트 (Postgres jsonb_set)
await supabase.rpc('update_user_setting', {
  user_id: userId,
  key: 'theme',
  value: 'dark',
});
```

---

## 인덱스 전략

### 인덱스 유형

| 유형   | 용도              | 예시                          |
| ------ | ----------------- | ----------------------------- |
| B-tree | 기본 (등호, 범위) | `clerk_user_id`, `created_at` |
| GIN    | JSONB, 배열       | `result`, `tags`              |
| BRIN   | 시계열 데이터     | `timestamp`                   |

### 인덱스 생성

```sql
-- 단일 컬럼 (가장 일반적)
CREATE INDEX idx_analyses_user
  ON skin_analyses(clerk_user_id);

-- 복합 인덱스 (선택도 높은 것 먼저)
CREATE INDEX idx_analyses_user_date
  ON skin_analyses(clerk_user_id, created_at DESC);

-- JSONB 인덱스
CREATE INDEX idx_analyses_result
  ON skin_analyses USING GIN (result);

-- 부분 인덱스 (조건부)
CREATE INDEX idx_analyses_active
  ON skin_analyses(clerk_user_id)
  WHERE is_deleted = false;
```

---

## API-스키마 동기화

### 필수 체크리스트

API에서 `.insert()` 또는 `.update()` 시:

1. 삽입/수정하는 컬럼 목록 추출
2. `supabase/migrations/`에서 테이블 스키마 확인
3. 컬럼 존재 여부 검증

### 새 컬럼 추가 순서

```
1. supabase/migrations/ 에 ALTER TABLE 작성
2. npx supabase db push 또는 로컬 적용
3. 그 다음 API 코드 수정
```

---

## 에러 패턴

| 에러 코드 | 메시지                      | 원인             |
| --------- | --------------------------- | ---------------- |
| 42703     | column "xxx" does not exist | 스키마 불일치    |
| 42501     | permission denied           | RLS 정책 누락    |
| 23505     | duplicate key               | 유니크 제약 위반 |
| 23503     | foreign key violation       | FK 참조 오류     |

---

## 마이그레이션 템플릿

```sql
-- Migration: [기능명]
-- Date: YYYY-MM-DD
-- Author: Claude Code

-- 1. 테이블/컬럼 변경
ALTER TABLE [테이블명]
  ADD COLUMN IF NOT EXISTS [컬럼명] [타입];

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_[테이블]_[컬럼]
  ON [테이블]([컬럼]);

-- 3. RLS 정책
CREATE POLICY "[정책명]" ON [테이블]
  FOR [SELECT|INSERT|UPDATE|DELETE]
  USING ([조건]);

-- Rollback:
-- ALTER TABLE [테이블명] DROP COLUMN IF EXISTS [컬럼명];
```

---

## 주요 API-테이블 매핑

| API Route                     | 테이블                       | RLS       |
| ----------------------------- | ---------------------------- | --------- |
| `/api/analyze/personal-color` | `personal_color_assessments` | ✅        |
| `/api/analyze/skin`           | `skin_analyses`              | ✅        |
| `/api/analyze/body`           | `body_analyses`              | ✅        |
| `/api/coach/sessions`         | `coach_sessions`             | ✅        |
| `/api/products/*`             | `cosmetic_products`          | 읽기 공개 |

---

## 쿼리 패턴

```typescript
// 좋은 예: 필요한 컬럼만 선택, limit 적용
const { data } = await supabase
  .from('posts')
  .select('id, title, created_at')
  .eq('clerk_user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

// 관계 쿼리
const { data } = await supabase
  .from('orders')
  .select(
    `
    id,
    created_at,
    items:order_items(
      product_id,
      quantity,
      product:products(name, price)
    )
  `
  )
  .eq('clerk_user_id', userId);

// 나쁜 예: 전체 선택, limit 없음
const { data } = await supabase.from('posts').select('*');
```

---

## 에러 핸들링

```typescript
const { data, error } = await supabase.from('posts').select();

if (error) {
  console.error('[DB] Error:', error.code, error.message);

  // 에러 유형별 처리
  if (error.code === '42501') {
    throw new Error('접근 권한이 없습니다');
  }
  throw new Error('데이터를 불러올 수 없습니다');
}
```

---

## 관련 문서

### 규칙 문서

- [db-migration-rules.md](./db-migration-rules.md) - 마이그레이션 상세 규칙
- [security-checklist.md](./security-checklist.md) - RLS 보안 체크

### 원리 문서

- [security-patterns.md](../../docs/principles/security-patterns.md) - RLS 원리, 다층 방어

### 마이그레이션

- [20260115_complete_rls_policies.sql](../../apps/web/supabase/migrations/20260115_complete_rls_policies.sql) - RLS 정책 구현

---

**Version**: 3.0 | **Updated**: 2026-01-28 | RLS 상세 가이드 대폭 확장 (5개 패턴, 디버깅, 흔한 실수)
