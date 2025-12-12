# SQL 스타일 가이드

> 이룸 프로젝트 Postgres SQL 작성 규칙

---

## 1. 일반 규칙

### 기본 원칙
- SQL 예약어는 **소문자** 사용
- 일관된 들여쓰기 (2칸 스페이스)
- 날짜는 ISO 8601 형식 (`yyyy-mm-ddThh:mm:ss`)
- 복잡한 로직에는 주석 추가

```sql
-- ✅ 올바른 예시
select id, name, created_at
from public.users
where status = 'active';

-- ❌ 잘못된 예시
SELECT ID, Name, Created_At
FROM PUBLIC.USERS
WHERE Status = 'Active';
```

---

## 2. 명명 규칙

### 테이블
- **snake_case** 사용
- **복수형** 사용
- 접두사 (`tbl_`) 사용 금지

```sql
-- ✅ 올바른 예시
users, skin_analyses, product_recommendations

-- ❌ 잘못된 예시
User, tbl_users, skinAnalyses
```

### 컬럼
- **snake_case** 사용
- **단수형** 사용
- 테이블명과 동일한 컬럼명 피하기

```sql
-- ✅ 올바른 예시
user_id, created_at, skin_type

-- ❌ 잘못된 예시
userId, CreatedAt, users
```

### 외래키 참조
- `테이블명_단수_id` 형식

```sql
-- ✅ 올바른 예시
user_id      -- users 테이블 참조
product_id   -- products 테이블 참조
analysis_id  -- analyses 테이블 참조
```

---

## 3. 테이블 생성

### 기본 구조
```sql
create table public.users (
  -- 기본키: identity 사용
  id bigint generated always as identity primary key,
  
  -- 외래키
  clerk_user_id text not null unique,
  
  -- 데이터 컬럼
  name text not null,
  email text not null,
  
  -- 타임스탬프
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 테이블 설명 (필수)
comment on table public.users is '이룸 서비스 사용자 정보';
```

### 필수 요소
1. `id` 컬럼: `bigint generated always as identity primary key`
2. 스키마 명시: `public.테이블명`
3. 테이블 주석: `comment on table`
4. RLS 활성화 (별도 실행)

---

## 4. 쿼리 작성

### 짧은 쿼리 (한 줄 가능)
```sql
select * from users where id = 1;

update users set name = '홍길동' where id = 1;
```

### 긴 쿼리 (줄바꿈 사용)
```sql
select
  id,
  name,
  email,
  created_at
from public.users
where 
  status = 'active'
  and created_at > '2024-01-01';
```

### 조인
```sql
select
  users.name as user_name,
  skin_analyses.skin_type,
  skin_analyses.analyzed_at
from public.users
join public.skin_analyses 
  on users.id = skin_analyses.user_id
where users.status = 'active';
```

---

## 5. 별칭 (Alias)

### 의미 있는 별칭 사용
```sql
-- ✅ 올바른 예시
select count(*) as total_users
from users
where status = 'active';

select 
  u.name as user_name,
  s.skin_type
from users as u
join skin_analyses as s on u.id = s.user_id;

-- ❌ 잘못된 예시
select count(*) cnt from users;  -- as 키워드 누락
```

---

## 6. CTE (Common Table Expression)

### 복잡한 쿼리는 CTE 사용
```sql
with
  -- 활성 사용자 필터링
  active_users as (
    select id, name
    from public.users
    where status = 'active'
  ),
  
  -- 최근 분석 결과
  recent_analyses as (
    select 
      user_id,
      skin_type,
      analyzed_at
    from public.skin_analyses
    where analyzed_at > now() - interval '30 days'
  )

-- 최종 결과
select
  au.name,
  ra.skin_type,
  ra.analyzed_at
from active_users as au
join recent_analyses as ra on au.id = ra.user_id
order by ra.analyzed_at desc;
```

---

## 7. 마이그레이션 파일

### 파일 명명 규칙
```
YYYYMMDDHHmmss_설명.sql

예시:
20241125143000_create_users_table.sql
20241125144500_add_skin_analyses_table.sql
20241125150000_add_rls_policies.sql
```

### 마이그레이션 파일 구조
```sql
-- ============================================
-- 마이그레이션: 사용자 테이블 생성
-- 작성일: 2024-11-25
-- 목적: 이룸 서비스 사용자 정보 저장
-- 영향 테이블: users (신규)
-- ============================================

-- 1. 테이블 생성
create table public.users (
  id bigint generated always as identity primary key,
  clerk_user_id text not null unique,
  name text,
  email text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. 테이블 설명
comment on table public.users is '이룸 서비스 사용자 정보';

-- 3. 인덱스 생성
create index idx_users_clerk_user_id on public.users(clerk_user_id);
create index idx_users_email on public.users(email);

-- 4. RLS 활성화
alter table public.users enable row level security;

-- 5. RLS 정책 (별도 파일 권장)
-- @see 20241125150000_add_rls_policies.sql
```

---

## 8. 위험한 작업 주석

### 데이터 삭제/변경 시 필수
```sql
-- ⚠️ 위험: 테이블 삭제
-- 영향: 모든 사용자 데이터 손실
-- 롤백: 불가능 (백업 필요)
drop table if exists public.users cascade;

-- ⚠️ 위험: 컬럼 삭제
-- 영향: 기존 skin_type 데이터 손실
-- 롤백: 불가능
alter table public.skin_analyses drop column skin_type;

-- ⚠️ 위험: 데이터 일괄 삭제
-- 영향: 30일 이전 분석 결과 삭제
-- 예상 삭제 건수: 약 1,000건
delete from public.skin_analyses
where analyzed_at < now() - interval '30 days';
```

---

## 9. 이룸 프로젝트 특화

### Clerk 연동 쿼리
```sql
-- Clerk user_id로 사용자 조회
select *
from public.users
where clerk_user_id = 'user_2abc123...';

-- JWT에서 Clerk user_id 추출 (RLS 정책용)
auth.jwt()->>'sub'
```

### 분석 결과 조회
```sql
-- 사용자의 최신 피부 분석 결과
select 
  sa.skin_type,
  sa.moisture_level,
  sa.oil_level,
  sa.analyzed_at
from public.skin_analyses as sa
join public.users as u on sa.user_id = u.id
where u.clerk_user_id = 'user_xxx'
order by sa.analyzed_at desc
limit 1;
```

### 추천 제품 조회
```sql
-- 사용자 맞춤 제품 추천
with user_profile as (
  select 
    u.id as user_id,
    sa.skin_type,
    pc.season_type
  from public.users as u
  left join public.skin_analyses as sa on u.id = sa.user_id
  left join public.personal_color_results as pc on u.id = pc.user_id
  where u.clerk_user_id = 'user_xxx'
)
select 
  p.name,
  p.brand,
  p.category
from public.products as p
join public.product_recommendations as pr on p.id = pr.product_id
join user_profile as up on pr.user_id = up.user_id
where pr.recommendation_type = 'skin_care'
order by pr.score desc
limit 10;
```

---

## 10. 금지 사항

```sql
-- ❌ SELECT * 지양 (필요한 컬럼만 명시)
select * from users;

-- ✅ 필요한 컬럼만
select id, name, email from users;

-- ❌ 하드코딩된 ID
where user_id = 123;

-- ✅ 파라미터 사용
where user_id = $1;

-- ❌ 인라인 SQL 주석 (--) 남발
select id -- 사용자 ID
from users; -- 사용자 테이블

-- ✅ 블록 주석은 쿼리 위에
/* 활성 사용자만 조회 */
select id from users where status = 'active';
```

---

## 참고 자료

- [Supabase SQL 가이드](https://supabase.com/docs/guides/database)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
