# DB 마이그레이션 규칙

> Supabase 스키마 변경 및 마이그레이션 가이드

## 마이그레이션 워크플로우

### 필수 순서

```
1. 마이그레이션 SQL 작성
   ↓
2. 로컬 Supabase에서 테스트
   ↓
3. 관련 API 코드 수정
   ↓
4. 테스트 실행
   ↓
5. PR 생성 및 리뷰
   ↓
6. 프로덕션 배포
```

### 금지 사항

```
❌ API 코드에서 존재하지 않는 컬럼 사용
❌ 마이그레이션 없이 스키마 변경 가정
❌ 데이터 손실 가능한 변경 (컬럼 삭제 등)
❌ 롤백 계획 없는 변경
```

## 마이그레이션 파일 규칙

### 파일명 형식

```
YYYYMMDD_기능명.sql

예시:
20260115_add_user_levels.sql
20260115_create_audit_logs.sql
20260115_add_rls_policies.sql
```

### 파일 템플릿

```sql
-- Migration: [기능명]
-- Purpose: [목적 설명]
-- Date: YYYY-MM-DD
-- Author: Claude Code
-- Issue: [관련 이슈 또는 ADR]
-- Rollback: [롤백 방법 또는 스크립트 참조]

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. 테이블 생성 또는 변경
ALTER TABLE [테이블명]
  ADD COLUMN IF NOT EXISTS [컬럼명] [타입] [제약조건];

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_[테이블]_[컬럼]
  ON [테이블]([컬럼]);

-- 3. RLS 정책 (필수)
ALTER TABLE [테이블] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[정책명]" ON [테이블]
  FOR [SELECT|INSERT|UPDATE|DELETE]
  USING ([조건]);

-- 4. 코멘트
COMMENT ON COLUMN [테이블].[컬럼] IS '[설명]';

-- ============================================
-- 롤백 스크립트 (별도 파일 또는 주석)
-- ============================================
-- ALTER TABLE [테이블] DROP COLUMN IF EXISTS [컬럼];
-- DROP INDEX IF EXISTS idx_[테이블]_[컬럼];
-- DROP POLICY IF EXISTS "[정책명]" ON [테이블];
```

## 변경 유형별 가이드

### 1. 새 테이블 생성

```sql
-- 테이블 생성
CREATE TABLE IF NOT EXISTS [테이블명] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,  -- RLS 필수
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화 (필수)
ALTER TABLE [테이블명] ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책
CREATE POLICY "user_own_data_select" ON [테이블명]
  FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_data_insert" ON [테이블명]
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.get_user_id());

-- 인덱스
CREATE INDEX idx_[테이블명]_user ON [테이블명](clerk_user_id);
```

### 2. 컬럼 추가

```sql
-- NOT NULL 컬럼 추가 시 기본값 필수
ALTER TABLE [테이블명]
  ADD COLUMN IF NOT EXISTS [컬럼명] [타입] DEFAULT [기본값];

-- 또는 NULL 허용
ALTER TABLE [테이블명]
  ADD COLUMN IF NOT EXISTS [컬럼명] [타입];

-- 컬럼 설명
COMMENT ON COLUMN [테이블명].[컬럼명] IS '[용도 설명]';
```

### 3. 컬럼 수정 (주의)

```sql
-- 타입 변경 (데이터 손실 위험)
-- 1단계: 새 컬럼 추가
ALTER TABLE [테이블명]
  ADD COLUMN [컬럼명]_new [새타입];

-- 2단계: 데이터 마이그레이션
UPDATE [테이블명]
  SET [컬럼명]_new = [변환로직]([컬럼명]);

-- 3단계: 기존 컬럼 제거 (별도 마이그레이션)
-- ALTER TABLE [테이블명] DROP COLUMN [컬럼명];
-- ALTER TABLE [테이블명] RENAME COLUMN [컬럼명]_new TO [컬럼명];
```

### 4. 컬럼 삭제 (위험)

```sql
-- 삭제 전 체크리스트
-- 1. [ ] API 코드에서 해당 컬럼 사용 없음
-- 2. [ ] 프론트엔드에서 해당 필드 사용 없음
-- 3. [ ] 기존 데이터 백업 완료

-- 소프트 삭제 (권장)
ALTER TABLE [테이블명]
  RENAME COLUMN [컬럼명] TO [컬럼명]_deprecated;

-- 하드 삭제 (2주 후)
-- ALTER TABLE [테이블명] DROP COLUMN [컬럼명]_deprecated;
```

### 5. 인덱스 추가

```sql
-- 단일 컬럼 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_[테이블]_[컬럼]
  ON [테이블]([컬럼]);

-- 복합 인덱스 (선택도 높은 컬럼 먼저)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_[테이블]_[컬럼1]_[컬럼2]
  ON [테이블]([컬럼1], [컬럼2]);

-- 부분 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_[테이블]_active
  ON [테이블]([컬럼])
  WHERE is_active = true;
```

## RLS 정책 패턴

### 표준 RLS 함수

```sql
-- JWT에서 user_id 추출 함수
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE SQL STABLE;
```

### 정책 유형

```sql
-- 본인 데이터만 접근
CREATE POLICY "user_own_data" ON [테이블]
  FOR ALL
  USING (clerk_user_id = auth.get_user_id());

-- 공개 조회, 본인만 수정
CREATE POLICY "public_read" ON [테이블]
  FOR SELECT
  USING (true);

CREATE POLICY "owner_write" ON [테이블]
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.get_user_id());

-- 관계 기반 접근 (친구 관계 등)
CREATE POLICY "friends_can_view" ON [테이블]
  FOR SELECT
  USING (
    clerk_user_id = auth.get_user_id()
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (user_id = auth.get_user_id() AND friend_id = [테이블].clerk_user_id)
        OR (friend_id = auth.get_user_id() AND user_id = [테이블].clerk_user_id)
      )
    )
  );
```

## 검증 명령어

### 로컬 테스트

```bash
# 로컬 Supabase 시작
npx supabase start

# 마이그레이션 적용
npx supabase db push

# 스키마 차이 확인
npx supabase db diff

# 마이그레이션 상태 확인
npx supabase migration list
```

### 스키마 확인

```bash
# 테이블 구조 확인
grep -r "[테이블명]" supabase/migrations/

# 특정 컬럼 검색
grep -r "[컬럼명]" supabase/migrations/
```

## API-DB 동기화 체크

### PR 머지 전 확인

```markdown
API 코드 변경 시:

1. [ ] `.insert()`, `.update()` 사용 컬럼이 스키마에 존재함
2. [ ] 새 컬럼은 마이그레이션 파일에 포함됨
3. [ ] RLS 정책이 적용됨
4. [ ] 로컬에서 실제 insert/update 테스트 완료
```

### 에러 패턴 인식

```
이런 에러 발생 시 스키마 불일치 의심:

- column "xxx" does not exist
- relation "xxx" does not exist
- permission denied for table "xxx"
```

## 롤백 전략

### 롤백 스크립트 위치

```
supabase/migrations/
├── 20260115_add_feature.sql
└── rollback/
    └── 20260115_add_feature_rollback.sql
```

### 롤백 실행

```bash
# 특정 마이그레이션 롤백
psql $DATABASE_URL -f supabase/migrations/rollback/[파일명].sql

# 또는 Supabase CLI
npx supabase db reset --db-url $DATABASE_URL
```

---

**Version**: 1.1 | **Updated**: 2026-01-28 | ADR-004 보완, 깨진 참조 제거
