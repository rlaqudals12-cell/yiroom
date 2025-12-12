# DB 함수 작성 가이드

> 이룸 프로젝트 Supabase/PostgreSQL 함수 작성 규칙

---

## 1. 기본 원칙

### 필수 규칙
1. **SECURITY INVOKER** 기본 사용 (호출자 권한)
2. **search_path = ''** 설정 (보안)
3. **완전한 스키마명** 사용 (`public.테이블명`)

```sql
-- ✅ 올바른 기본 구조
create or replace function public.함수명()
returns 반환타입
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- 함수 로직
end;
$$;
```

---

## 2. SECURITY INVOKER vs DEFINER

### SECURITY INVOKER (기본 권장)
```sql
-- 호출자의 권한으로 실행
-- RLS 정책이 적용됨
create or replace function public.get_my_profile()
returns json
language plpgsql
security invoker  -- 호출자 권한
set search_path = ''
as $$
begin
  return (
    select row_to_json(u)
    from public.users as u
    where u.clerk_user_id = auth.jwt()->>'sub'
  );
end;
$$;
```

### SECURITY DEFINER (특수한 경우만)
```sql
-- 함수 소유자의 권한으로 실행
-- RLS 우회 가능 → 신중히 사용
-- 사용 시 반드시 이유 주석

/* 
 * SECURITY DEFINER 사용 이유:
 * - 관리자 전용 통계 함수
 * - RLS 우회하여 전체 데이터 집계 필요
 */
create or replace function public.admin_get_total_users()
returns bigint
language plpgsql
security definer  -- ⚠️ 함수 소유자 권한
set search_path = ''
as $$
begin
  return (select count(*) from public.users);
end;
$$;
```

---

## 3. 이룸 프로젝트 함수 패턴

### 3.1 사용자 프로필 조회
```sql
create or replace function public.get_user_profile()
returns table (
  id bigint,
  name text,
  email text,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  select 
    u.id,
    u.name,
    u.email,
    u.created_at
  from public.users as u
  where u.clerk_user_id = auth.jwt()->>'sub';
end;
$$;
```

### 3.2 분석 결과 저장
```sql
create or replace function public.save_skin_analysis(
  p_skin_type text,
  p_moisture_level integer,
  p_oil_level integer
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id bigint;
  v_analysis_id bigint;
begin
  -- 현재 사용자 ID 조회
  select id into v_user_id
  from public.users
  where clerk_user_id = auth.jwt()->>'sub';
  
  if v_user_id is null then
    raise exception '사용자를 찾을 수 없습니다';
  end if;
  
  -- 분석 결과 저장
  insert into public.skin_analyses (
    user_id,
    skin_type,
    moisture_level,
    oil_level,
    analyzed_at
  ) values (
    v_user_id,
    p_skin_type,
    p_moisture_level,
    p_oil_level,
    now()
  )
  returning id into v_analysis_id;
  
  return v_analysis_id;
end;
$$;
```

### 3.3 추천 제품 조회
```sql
create or replace function public.get_recommended_products(
  p_category text default null,
  p_limit integer default 10
)
returns table (
  product_id bigint,
  product_name text,
  brand text,
  score numeric
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id bigint;
begin
  -- 현재 사용자 ID 조회
  select id into v_user_id
  from public.users
  where clerk_user_id = auth.jwt()->>'sub';
  
  return query
  select 
    p.id as product_id,
    p.name as product_name,
    p.brand,
    pr.score
  from public.product_recommendations as pr
  join public.products as p on pr.product_id = p.id
  where pr.user_id = v_user_id
    and (p_category is null or p.category = p_category)
  order by pr.score desc
  limit p_limit;
end;
$$;
```

---

## 4. 트리거 함수

### updated_at 자동 갱신
```sql
-- 트리거 함수
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 트리거 적용
create trigger update_users_updated_at
before update on public.users
for each row
execute function public.update_updated_at();

create trigger update_skin_analyses_updated_at
before update on public.skin_analyses
for each row
execute function public.update_updated_at();
```

### 분석 완료 시 알림 (예시)
```sql
create or replace function public.notify_analysis_complete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- 분석 완료 알림 로직
  -- (실제 구현은 Edge Function이나 외부 서비스 연동)
  
  perform pg_notify(
    'analysis_complete',
    json_build_object(
      'user_id', new.user_id,
      'analysis_type', tg_table_name,
      'analysis_id', new.id
    )::text
  );
  
  return new;
end;
$$;

create trigger notify_skin_analysis_complete
after insert on public.skin_analyses
for each row
execute function public.notify_analysis_complete();
```

---

## 5. 에러 처리

### 기본 패턴
```sql
create or replace function public.safe_update_profile(
  p_name text,
  p_email text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id bigint;
begin
  -- 사용자 확인
  select id into v_user_id
  from public.users
  where clerk_user_id = auth.jwt()->>'sub';
  
  if v_user_id is null then
    raise exception '사용자를 찾을 수 없습니다'
      using errcode = 'P0001';  -- 커스텀 에러 코드
  end if;
  
  -- 이메일 형식 검증
  if p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception '유효하지 않은 이메일 형식입니다'
      using errcode = 'P0002';
  end if;
  
  -- 업데이트 실행
  update public.users
  set 
    name = p_name,
    email = p_email,
    updated_at = now()
  where id = v_user_id;
  
  return true;
  
exception
  when others then
    -- 로깅 (필요 시)
    raise;
end;
$$;
```

### 나눗셈 안전 처리
```sql
create or replace function public.safe_divide(
  numerator numeric,
  denominator numeric
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if denominator = 0 then
    raise exception '0으로 나눌 수 없습니다';
  end if;
  
  return numerator / denominator;
end;
$$;
```

---

## 6. 함수 유형

### IMMUTABLE (불변)
```sql
-- 동일 입력 → 항상 동일 출력
-- 인덱스 생성 가능, 최적화 우수
create or replace function public.format_full_name(
  first_name text,
  last_name text
)
returns text
language sql
security invoker
set search_path = ''
immutable  -- 불변 함수
as $$
  select first_name || ' ' || last_name;
$$;
```

### STABLE (안정)
```sql
-- 트랜잭션 내 동일 출력
-- 테이블 조회하지만 데이터 변경 없음
create or replace function public.get_current_user_id()
returns bigint
language plpgsql
security invoker
set search_path = ''
stable  -- 안정 함수
as $$
begin
  return (
    select id from public.users
    where clerk_user_id = auth.jwt()->>'sub'
  );
end;
$$;
```

### VOLATILE (가변, 기본값)
```sql
-- 매 호출마다 다른 결과 가능
-- 데이터 변경 함수는 반드시 VOLATILE
create or replace function public.create_analysis_record()
returns bigint
language plpgsql
security invoker
set search_path = ''
volatile  -- 가변 함수 (기본값, 생략 가능)
as $$
  -- INSERT, UPDATE, DELETE 수행
end;
$$;
```

---

## 7. 함수 호출 (클라이언트)

### Supabase JS에서 호출
```typescript
// 단순 함수 호출
const { data, error } = await supabase
  .rpc('get_user_profile');

// 파라미터와 함께 호출
const { data, error } = await supabase
  .rpc('save_skin_analysis', {
    p_skin_type: 'oily',
    p_moisture_level: 45,
    p_oil_level: 75
  });

// 결과가 테이블인 경우
const { data, error } = await supabase
  .rpc('get_recommended_products', {
    p_category: 'skincare',
    p_limit: 5
  });
```

---

## 8. 체크리스트

### 함수 작성 전
- [ ] SECURITY INVOKER vs DEFINER 결정
- [ ] 필요한 파라미터 정의
- [ ] 반환 타입 결정 (단일 값 / 테이블)
- [ ] 에러 케이스 식별

### 함수 작성 후
- [ ] `set search_path = ''` 확인
- [ ] 완전한 스키마명 사용 확인
- [ ] 에러 처리 구현 확인
- [ ] RLS 정책과 호환 확인
- [ ] 테스트 실행

---

## 참고 자료

- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html)
