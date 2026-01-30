# Supabase RLS 심화

> **ID**: DB-RLS-ADVANCED
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/supabase/migrations/

---

## 1. 현재 구현 분석

### 현재 상태

```sql
-- 구현된 패턴:
✅ auth.get_user_id() 통합 함수
✅ 모든 주요 테이블 RLS 활성화
✅ Service Role 풀 액세스 정책
✅ 테이블별 CRUD 정책 분리
```

### 개선 필요 항목

```
❌ 인덱스 최적화 (RLS 성능)
❌ SELECT 함수 래핑 (캐싱)
❌ 복잡한 조인 쿼리 최적화
❌ Security Definer 함수 활용
❌ RLS 테스트 자동화
```

---

## 2. RLS 성능 최적화

### 2.1 인덱스 필수 (100배 이상 개선)

```sql
-- RLS 정책에서 사용하는 모든 컬럼에 인덱스 필수
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id
  ON users(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_skin_analyses_clerk_user_id
  ON skin_analyses(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_body_analyses_clerk_user_id
  ON body_analyses(clerk_user_id);

-- 복합 인덱스 (정렬 + 필터링)
CREATE INDEX IF NOT EXISTS idx_skin_analyses_user_created
  ON skin_analyses(clerk_user_id, created_at DESC);
```

### 2.2 SELECT 함수 래핑 (캐싱)

```sql
-- ❌ 비효율적: 행마다 함수 호출
CREATE POLICY "bad_policy" ON table_name
  FOR SELECT
  USING (auth.get_user_id() = clerk_user_id);

-- ✅ 효율적: initPlan으로 1회만 실행
CREATE POLICY "good_policy" ON table_name
  FOR SELECT
  USING ((SELECT auth.get_user_id()) = clerk_user_id);
```

### 2.3 Security Definer 함수

```sql
-- 조인 테이블의 RLS를 우회하여 성능 개선
CREATE OR REPLACE FUNCTION auth.get_user_teams()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM team_members
  WHERE user_id = auth.get_user_id();
$$;

-- 정책에서 사용
CREATE POLICY "team_access_optimized" ON team_resources
  FOR SELECT
  USING (team_id = ANY(SELECT auth.get_user_teams()));
```

---

## 3. 복잡한 정책 패턴

### 3.1 친구 관계 기반 접근

```sql
-- ✅ 효율적 (SELECT 래핑 + 리스트 캐싱)
CREATE POLICY "view_friends_data" ON wellness_scores
  FOR SELECT
  USING (
    clerk_user_id = (SELECT auth.get_user_id())
    OR clerk_user_id = ANY(
      SELECT friend_id FROM friendships
      WHERE user_id = (SELECT auth.get_user_id())
      AND status = 'accepted'
    )
  );
```

### 3.2 팀/조직 기반 접근

```sql
-- ✅ 효율적 (EXISTS 사용)
CREATE POLICY "team_access" ON team_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_resources.team_id
      AND tm.user_id = (SELECT auth.get_user_id())
    )
  );
```

---

## 4. 정책 패턴 라이브러리

### 4.1 기본 CRUD 정책 함수

```sql
CREATE OR REPLACE FUNCTION create_user_crud_policies(
  table_name TEXT
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE POLICY "Users can select own data" ON %I
     FOR SELECT USING (clerk_user_id = (SELECT auth.get_user_id()))',
    table_name
  );

  EXECUTE format(
    'CREATE POLICY "Users can insert own data" ON %I
     FOR INSERT WITH CHECK (clerk_user_id = (SELECT auth.get_user_id()))',
    table_name
  );

  EXECUTE format(
    'CREATE POLICY "Users can update own data" ON %I
     FOR UPDATE USING (clerk_user_id = (SELECT auth.get_user_id()))',
    table_name
  );

  EXECUTE format(
    'CREATE POLICY "Users can delete own data" ON %I
     FOR DELETE USING (clerk_user_id = (SELECT auth.get_user_id()))',
    table_name
  );
END;
$$ LANGUAGE plpgsql;

-- 사용
SELECT create_user_crud_policies('skin_analyses');
```

---

## 5. 성능 측정

### 5.1 EXPLAIN ANALYZE 활용

```sql
-- 세션에서 사용자 컨텍스트 설정
SET request.jwt.claims = '{"sub": "user_123"}';

EXPLAIN ANALYZE
SELECT * FROM skin_analyses
WHERE clerk_user_id = 'user_123'
ORDER BY created_at DESC
LIMIT 10;

-- 확인 포인트:
-- 1. Index Scan 사용 여부
-- 2. RLS 정책으로 인한 SubPlan 수
-- 3. 실행 시간
```

---

## 6. 테스트 전략

### 6.1 Jest 통합 테스트

```typescript
// tests/integration/rls/skin-analyses.test.ts
describe('Skin Analyses RLS', () => {
  test('user can view own data', async () => {
    const { data, error } = await user1Client
      .from('skin_analyses')
      .select('*')
      .eq('clerk_user_id', 'user_1');

    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(0);
  });

  test('user cannot view other user data', async () => {
    const { data } = await user1Client
      .from('skin_analyses')
      .select('*')
      .eq('clerk_user_id', 'user_2');

    expect(data?.length).toBe(0);
  });
});
```

---

## 7. 일반적인 실수 방지

### 7.1 anon 역할 처리

```sql
-- ❌ 위험: auth.uid()만으로 anon 제외 안됨
CREATE POLICY "bad" ON secret_data
  FOR SELECT
  USING (owner_id = auth.uid());

-- ✅ 안전: 명시적으로 authenticated 확인
CREATE POLICY "good" ON secret_data
  FOR SELECT
  TO authenticated  -- 역할 지정
  USING (owner_id = (SELECT auth.uid()));
```

### 7.2 LIMIT/OFFSET 성능

```sql
-- ❌ 느림: 모든 행 검사 후 LIMIT
SELECT * FROM large_table
ORDER BY created_at
LIMIT 10 OFFSET 1000;

-- ✅ 빠름: 커서 기반 페이지네이션
SELECT * FROM large_table
WHERE created_at < :last_created_at
ORDER BY created_at DESC
LIMIT 10;
```

---

## 8. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 모든 RLS 컬럼에 인덱스 추가
- [ ] 정책에 `(SELECT auth.get_user_id())` 래핑 적용
- [ ] Security Advisor 경고 해결

### 단기 적용 (P1)

- [ ] 복잡한 조인 정책 Security Definer 함수로 최적화
- [ ] RLS 테스트 추가
- [ ] 성능 기준선 측정

---

## 9. 참고 자료

- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database Advisors | Supabase Docs](https://supabase.com/docs/guides/database/database-advisors)

---

**Version**: 1.0 | **Priority**: P0 Critical
