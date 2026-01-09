# Task: DB 마이그레이션 관리 체계 (SDD-DB-MIGRATION-MANAGEMENT)

**Phase**: L-2 (출시 준비)
**작성일**: 2026-01-08
**우선순위**: 중간 (배포 전 필수)
**예상 복잡도**: 35점 (문서화 + SQL 정리)

---

## 1. 개요

### 1.1 목적

- 누락된 마이그레이션 파일 생성
- Supabase 대시보드에서 직접 생성한 테이블의 SQL 문서화
- 배포 환경 간 스키마 일관성 보장

### 1.2 현재 문제점

| 문제                          | 영향                           | 위험도  |
| ----------------------------- | ------------------------------ | ------- |
| 일부 테이블 마이그레이션 누락 | 새 환경 배포 시 수동 작업 필요 | 🔴 높음 |
| 스키마 버전 추적 불가         | 롤백/디버깅 어려움             | 🟡 중간 |
| RLS 정책 파편화               | 보안 일관성 저하               | 🔴 높음 |

---

## 2. 현황 분석

### 2.1 마이그레이션 파일 현황 (60개)

```
supabase/migrations/
├── 00000000000000_setup_schema.sql
├── 00000000000001_setup_storage.sql
├── 00000000000002_phase1_analysis_tables.sql
├── 20251126~202601... (57개 파일)
└── 202601080600_user_agreements.sql (최신)
```

### 2.2 누락 의심 테이블

| 테이블                       | 상태         | 마이그레이션 파일                         |
| ---------------------------- | ------------ | ----------------------------------------- |
| `users`                      | ⚠️ 확인 필요 | 없음 (Clerk 동기화)                       |
| `personal_color_assessments` | ⚠️ 확인 필요 | phase1_analysis_tables.sql에 있을 수 있음 |
| `skin_analyses`              | ✅ 있음      | 202601080300_skin_analyses_extension.sql  |
| `body_analyses`              | ⚠️ 확인 필요 | phase1_analysis_tables.sql에 있을 수 있음 |

---

## 3. 검증 절차

### 3.1 로컬 Supabase와 프로덕션 비교

```bash
# 1. 로컬 Supabase 시작
npx supabase start

# 2. 마이그레이션 적용
npx supabase db reset

# 3. 스키마 덤프
npx supabase db dump -f local_schema.sql

# 4. 프로덕션 스키마 덤프 (대시보드에서)
# Settings > Database > Schema 다운로드

# 5. 비교
diff local_schema.sql production_schema.sql
```

### 3.2 테이블별 검증 쿼리

```sql
-- 모든 테이블 목록
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 인덱스 확인
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 4. 누락 마이그레이션 생성 가이드

### 4.1 users 테이블 (필요시)

```sql
-- 202601090100_users_table.sql
-- Clerk 사용자와 동기화되는 users 테이블

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 4.2 마이그레이션 파일 명명 규칙

```
YYYYMMDDHHMM_<description>.sql

예시:
202601090100_users_table.sql
202601090200_missing_rls_policies.sql
202601090300_add_indexes.sql
```

---

## 5. RLS 정책 통합

### 5.1 표준 패턴

```sql
-- 읽기 (본인 데이터만)
CREATE POLICY "Users can read own data" ON <table_name>
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 쓰기 (본인 데이터만)
CREATE POLICY "Users can insert own data" ON <table_name>
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data" ON <table_name>
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own data" ON <table_name>
  FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 5.2 RLS 누락 테이블 점검

```sql
-- RLS 미적용 테이블 찾기
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  );
```

---

## 6. 구현 체크리스트

| 순서 | 작업                         | 담당   | 상태 |
| ---- | ---------------------------- | ------ | ---- |
| 1    | 로컬 vs 프로덕션 스키마 비교 | 개발자 | ⏳   |
| 2    | 누락 테이블 목록 확정        | 개발자 | ⏳   |
| 3    | 누락 마이그레이션 SQL 작성   | 개발자 | ⏳   |
| 4    | 스테이징 환경 검증           | 개발자 | ⏳   |
| 5    | 프로덕션 적용                | 운영   | ⏳   |

---

## 7. 배포 전 검증

### 7.1 스테이징 환경 테스트

```bash
# 1. 새 Supabase 프로젝트 생성 (스테이징)
# 2. 모든 마이그레이션 적용
npx supabase db push --db-url $STAGING_DB_URL

# 3. 앱 연결 테스트
NEXT_PUBLIC_SUPABASE_URL=$STAGING_URL npm run dev

# 4. 주요 기능 테스트
# - 회원가입/로그인
# - 분석 (PC-1, S-1, C-1)
# - 데이터 저장/조회
```

### 7.2 롤백 계획

```sql
-- 마이그레이션 실패 시 롤백 SQL 준비
-- 각 마이그레이션 파일에 대응하는 down.sql 작성

-- 예: 202601090100_users_table_down.sql
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP TABLE IF EXISTS users;
```

---

## 8. 자동화 권장사항

### 8.1 CI/CD 통합

```yaml
# .github/workflows/db-validate.yml
name: Validate DB Schema

on:
  pull_request:
    paths:
      - 'apps/web/supabase/migrations/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      - name: Start Supabase
        run: npx supabase start
      - name: Apply Migrations
        run: npx supabase db reset
      - name: Verify Schema
        run: npx supabase db lint
```

### 8.2 스키마 문서 자동 생성

```bash
# 스키마 문서 생성 스크립트
npx supabase gen types typescript --local > types/database.types.ts
```

---

## 9. 참고 문서

| 문서                                                      | 설명             |
| --------------------------------------------------------- | ---------------- |
| [DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md)               | 전체 스키마 문서 |
| [DB-FUNCTIONS-GUIDE.md](../DB-FUNCTIONS-GUIDE.md)         | DB 함수 가이드   |
| [Supabase CLI 문서](https://supabase.com/docs/guides/cli) | 공식 CLI 문서    |

---

## 10. 변경 이력

| 버전 | 날짜       | 변경 내용 |
| ---- | ---------- | --------- |
| 1.0  | 2026-01-08 | 최초 작성 |

---

**Version**: 1.0
**Created**: 2026-01-08
