# DOC-1-R1: DB 스키마 문서화

> 리서치 날짜: 2026-01-16
> 작성자: Claude Code
> 상태: 완료

---

## 1. 핵심 요약

- **테이블 문서화**: 표준 템플릿 기반으로 필드, 타입, 제약조건, RLS 정책, 인덱스를 일관되게 문서화
- **ERD 생성**: DBML(Database Markup Language) + dbdiagram.io 조합이 가장 효과적, Supabase Inspector 플러그인 활용 가능
- **스키마 추출**: Supabase CLI `db dump`, `pg_dump`, 또는 information_schema 쿼리로 자동화
- **변경 추적**: 마이그레이션 파일 + Git 히스토리 + CHANGELOG.md 조합으로 완전한 이력 관리
- **협업**: 스키마 변경은 반드시 마이그레이션 파일 → PR 리뷰 → 문서 자동 업데이트 플로우 준수

---

## 2. 상세 내용

### 2.1 문서화 템플릿

#### 2.1.1 테이블 문서 구조

```markdown
## [테이블명] 테이블

> 설명: [테이블 목적]
> 마이그레이션: `YYYYMMDD_description.sql`
> 모듈: [소속 모듈명]

### SQL 생성문
[CREATE TABLE 문]

### 필드 설명
| 필드명 | 타입 | Nullable | 기본값 | 설명 |
|--------|------|----------|--------|------|

### 인덱스
| 인덱스명 | 컬럼 | 타입 | 용도 |
|----------|------|------|------|

### RLS 정책
| 정책명 | 동작 | 조건 |
|--------|------|------|

### JSONB 필드 구조 (해당시)
```

#### 2.1.2 YAML 기반 간소화 템플릿 (대규모 테이블용)

```yaml
table: users
description: Clerk 사용자 기본 정보
module: core
migration: 20251201_core_schema.sql

fields:
  - name: id
    type: UUID
    pk: true
    default: gen_random_uuid()
  - name: clerk_user_id
    type: TEXT
    unique: true
    required: true

indexes:
  - columns: [clerk_user_id]
    unique: true

rls:
  enabled: true
  policies:
    - name: user_own_data
      for: ALL
      using: "clerk_user_id = JWT.sub"
```

### 2.2 ERD 생성 도구

#### 2.2.1 도구 비교

| 도구 | 특징 | Supabase 연동 | 가격 |
|------|------|---------------|------|
| **dbdiagram.io** | DBML 문법, 웹 기반, 공유 용이 | 수동 추출 필요 | 무료/Pro |
| **DBeaver** | 역공학 ERD, 다양한 DB 지원 | 직접 연결 가능 | 무료 |
| **Supabase Dashboard** | 내장 스키마 시각화 | 네이티브 | 무료 |
| **pgAdmin** | PostgreSQL 전용, 상세 | 직접 연결 가능 | 무료 |

#### 2.2.2 권장: DBML + dbdiagram.io

```dbml
Table users {
  id uuid [pk, default: `gen_random_uuid()`]
  clerk_user_id text [unique, not null]
  email text
  created_at timestamptz [default: `now()`]
}

Table personal_color_assessments {
  id uuid [pk]
  clerk_user_id text [not null]
  season text [not null, note: 'Spring/Summer/Autumn/Winter']
  created_at timestamptz [default: `now()`]
}

Ref: personal_color_assessments.clerk_user_id > users.clerk_user_id
```

### 2.3 Supabase 스키마 추출

#### 2.3.1 Supabase CLI 사용

```bash
# 전체 스키마 덤프
npx supabase db dump -f schema.sql

# 스키마만 덤프
npx supabase db dump -f schema_only.sql --schema-only
```

#### 2.3.2 information_schema 쿼리

```sql
-- 모든 테이블 목록
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public';

-- 테이블별 컬럼 정보
SELECT c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public';

-- RLS 정책 정보
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 2.4 관계/인덱스 문서화

```markdown
## 테이블 관계도

users (1) ──────── (N) personal_color_assessments
  │
  ├──────────────── (N) skin_analyses
  │
  └──────────────── (N) body_analyses

## 인덱스 전략

| 테이블 | 인덱스명 | 컬럼 | 용도 |
|--------|----------|------|------|
| users | idx_users_clerk_user_id | clerk_user_id | 사용자 조회 |
| personal_color_assessments | idx_pc_user_date | (clerk_user_id, created_at DESC) | 최근 분석 조회 |
```

### 2.5 변경 이력 추적

#### 마이그레이션 파일 헤더

```sql
-- Migration: add_user_preferences
-- Date: 2026-01-16
-- Author: Claude Code
-- Description: 사용자 선호도 설정 테이블 추가
-- Rollback: DROP TABLE IF EXISTS user_preferences;
```

#### CHANGELOG.md 형식

```markdown
## [2026-01-16]
### Added
- `user_preferences` 테이블 추가

### Changed
- `users.profile_image_url` 필드 길이 제한 제거
```

### 2.6 협업 패턴

#### 스키마 변경 워크플로우

```
1. 설계 (ADR 작성)
   ↓
2. 마이그레이션 작성
   ↓
3. 로컬 테스트 (npx supabase db push)
   ↓
4. PR 생성 (마이그레이션 + API 코드 + 문서)
   ↓
5. 리뷰 (RLS, 인덱스 검토)
   ↓
6. 머지 및 배포
```

#### PR 체크리스트

- [ ] 마이그레이션 파일명 형식: `YYYYMMDD_description.sql`
- [ ] 새 테이블에 RLS 활성화
- [ ] 인덱스 추가 (자주 조회되는 컬럼)
- [ ] DATABASE-SCHEMA.md 업데이트
- [ ] 로컬 Supabase에서 테스트

---

## 3. 구현 시 필수 사항

- [ ] 모든 테이블에 표준 템플릿 적용
- [ ] DBML 파일 생성 및 ERD 시각화
- [ ] 마이그레이션 파일 헤더 표준화
- [ ] CHANGELOG.md 유지 관리
- [ ] RLS 정책 문서화
- [ ] 스키마 추출 스크립트 구현
- [ ] CI에서 문서 자동 업데이트

---

## 4. 템플릿 예시

### 4.1 테이블 문서 전체 예시

```markdown
## user_preferences 테이블

> 설명: 사용자별 UI 및 앱 설정
> 마이그레이션: `202601050300_user_preferences.sql`
> 모듈: Core

### SQL 생성문

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

### 필드 설명

| 필드명 | 타입 | Nullable | 기본값 | 설명 |
|--------|------|----------|--------|------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| clerk_user_id | TEXT | NOT NULL | - | Clerk 사용자 ID (UK) |
| theme | TEXT | - | 'system' | 테마 (light/dark/system) |
| language | TEXT | - | 'ko' | 언어 (ko/en) |

### RLS 정책

| 정책명 | 동작 | 조건 |
|--------|------|------|
| Users can manage own preferences | ALL | clerk_user_id = JWT.sub |
```

---

## 5. 참고 자료

### 공식 문서
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL System Catalogs](https://www.postgresql.org/docs/current/catalogs.html)
- [DBML Specification](https://dbml.dbdiagram.io/home/)
- [dbdiagram.io](https://dbdiagram.io/)

### 도구
- [DBeaver](https://dbeaver.io/) - 범용 데이터베이스 도구
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL 관리 도구
- [Supabase CLI](https://supabase.com/docs/reference/cli)

### 프로젝트 내 참조 문서
- `docs/DATABASE-SCHEMA.md` - 현재 스키마 문서
- `.claude/rules/db-migration-rules.md` - 마이그레이션 규칙

---

**Version**: 1.0
**Created**: 2026-01-16
**Status**: 완료
