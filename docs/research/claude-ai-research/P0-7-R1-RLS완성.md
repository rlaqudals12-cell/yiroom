# P0-7-R1: Supabase RLS 테이블별 정책 완성

## 1. 핵심 요약

이룸(Yiroom) 서비스의 **Clerk + Supabase + Next.js 16** 스택에서 RLS 정책 설계 시 가장 중요한 사항은 **`auth.uid()` 대신 `auth.jwt()->>'sub'`을 사용**해야 한다는 점입니다. Clerk 인증은 Supabase Auth와 다르게 동작하므로 JWT claims에서 사용자 ID를 추출해야 합니다.

모든 테이블에 **RLS 활성화는 필수**이며, 성능 최적화를 위해 함수 호출을 `(SELECT auth.jwt()->>'sub')` 형태로 래핑하고, user_id 컬럼에 인덱스를 추가해야 합니다. **USING 절**은 기존 행 필터링(SELECT/UPDATE/DELETE)에, **WITH CHECK 절**은 새 행 검증(INSERT/UPDATE)에 사용됩니다.

공유 기능은 **UUID 토큰 기반 공유 링크**와 **만료 시간 설정**으로 구현하며, 감사 로그는 **INSERT만 service_role로 허용**하고 UPDATE/DELETE를 차단하여 무결성을 보장합니다.

---

## 2. 상세 내용

### 2.1 테이블별 RLS 정책 매트릭스

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| **users** | 본인만 | 본인만 | 본인만 | 금지 |
| **user_preferences** | 본인만 | 본인만 | 본인만 | 본인만 |
| **skin_analyses** | 본인/공유대상 | 본인만 | 본인만 | 본인만 |
| **color_diagnoses** | 본인/공유대상/공개 | 본인만 | 본인만 | 본인만 |
| **face_features** | 본인만 | 본인만 | 본인만 | 본인만 |
| **analysis_images** | 본인만 | 본인만 | 금지 | 본인만 |
| **analysis_history** | 본인만 | 시스템만 | 금지 | 금지 |
| **products** | 공개(anon) | 관리자만 | 관리자만 | 관리자만 |
| **product_categories** | 공개(anon) | 관리자만 | 관리자만 | 관리자만 |
| **product_colors** | 공개(anon) | 관리자만 | 관리자만 | 관리자만 |
| **recommendations** | 본인만 | 시스템만 | 금지 | 금지 |
| **user_favorites** | 본인만 | 본인만 | 금지 | 본인만 |
| **shared_results** | 소유자/공유대상 | 본인만 | 본인만 | 본인만 |
| **share_links** | 유효토큰/소유자 | 본인만 | 본인만 | 본인만 |
| **audit_logs** | 관리자만 | 시스템만 | 금지 | 금지 |
| **admin_actions** | 관리자만 | 시스템만 | 금지 | 금지 |
| **system_settings** | 인증사용자 | 관리자만 | 관리자만 | 금지 |
| **feature_flags** | 공개(anon) | 관리자만 | 관리자만 | 관리자만 |
| **api_usage_logs** | 관리자만 | 시스템만 | 금지 | 금지 |

### 2.2 Clerk + Supabase 통합 핵심 설정

**2025년 4월부터 JWT Template 방식은 deprecated**되었습니다. Supabase Third-Party Auth를 통한 네이티브 통합이 권장됩니다.

Clerk 사용 시 핵심적인 차이점은 **user_id 컬럼을 TEXT 타입**으로 생성해야 하며, `auth.uid()` 대신 `auth.jwt()->>'sub'`를 사용해야 한다는 것입니다. 기본 소유자 확인 패턴은 `(SELECT auth.jwt()->>'sub') = user_id` 형태입니다.

USING 절과 WITH CHECK 절의 사용 구분이 중요합니다. **SELECT는 USING만**, **INSERT는 WITH CHECK만**, **UPDATE는 둘 다**, **DELETE는 USING만** 필요합니다. UPDATE에서 WITH CHECK을 생략하면 USING 조건이 자동 적용됩니다.

### 2.3 분석 결과 테이블 정책

분석 결과 테이블은 **민감한 개인 데이터**를 다루므로 기본적으로 본인만 접근 가능해야 합니다. 공유 기능 구현 시에는 `is_public` 플래그, `shared_with` UUID 배열, 그리고 별도의 `share_links` 테이블을 조합하여 사용합니다.

**공유 링크 기반 익명 접근**은 UUID v4 토큰을 생성하고, Security Definer 함수를 통해 토큰 유효성을 검증한 후 데이터를 반환하는 방식으로 구현합니다. 만료 시간, 최대 조회 횟수, 일회성 토큰 등의 제한을 설정할 수 있습니다.

analysis_images 테이블은 **UPDATE 정책을 생성하지 않음**으로써 이미지 수정을 원천 차단합니다. 이미지 변경이 필요한 경우 기존 이미지를 삭제하고 새로 업로드하는 방식을 사용해야 합니다.

### 2.4 제품 DB 정책

제품 정보는 **anon 역할에도 SELECT를 허용**하여 비로그인 사용자도 조회할 수 있게 합니다. 단, `is_active = true` 조건을 추가하여 비활성화된 제품은 노출되지 않도록 합니다. 관리자는 모든 제품(비활성 포함)을 조회할 수 있습니다.

캐싱과 RLS의 관계에서 중요한 점은 **RLS가 쿼리 레벨에서 동작**하므로 캐시된 데이터가 RLS를 우회할 수 없다는 것입니다. 공개 제품 정보는 CDN/Edge에서 안전하게 캐싱할 수 있지만, 사용자별 데이터는 서버사이드 캐싱만 권장됩니다.

### 2.5 감사 로그 정책

감사 로그의 **무결성 보장**이 핵심입니다. UPDATE와 DELETE 정책을 생성하지 않아 모든 수정/삭제를 차단하고, INSERT는 service_role(RLS 우회)을 통해서만 가능하게 합니다. 관리자만 SELECT할 수 있으며, PostgreSQL Trigger를 통해 자동 로깅을 구현합니다.

`supa_audit` 확장을 활용할 수 있으나, 쓰기 처리량이 **3,000 ops/초 이상**인 테이블에는 권장되지 않습니다. 고트래픽 환경에서는 커스텀 Trigger 기반 로깅이 더 적합합니다.

### 2.6 Admin Role 구현

관리자 권한 체크는 **Custom Access Token Hook**을 통해 JWT claims에 role을 추가하는 방식이 권장됩니다. `user_roles` 테이블에서 역할을 조회하여 JWT에 `user_role` claim을 추가하면, RLS 정책에서 `auth.jwt()->>'user_role' = 'admin'`으로 확인할 수 있습니다.

Security Definer 함수로 `is_admin()` 헬퍼를 만들어 정책에서 재사용하면 코드 중복을 줄이고 유지보수성을 높일 수 있습니다.

### 2.7 테스트 및 디버깅

**pgTAP + supabase_test_helpers** 조합이 RLS 테스트의 표준입니다. `tests.create_supabase_user()`로 테스트 사용자를 생성하고, `tests.authenticate_as()`로 해당 사용자로 인증한 후, `is_empty()`, `throws_ok()`, `results_eq()` 등의 assertion 함수로 정책을 검증합니다.

SQL Editor에서 수동 테스트 시에는 `SET LOCAL ROLE authenticated`와 `SET LOCAL "request.jwt.claims"`를 사용하여 특정 사용자 컨텍스트를 시뮬레이션합니다. **auth.uid() 모킹**은 JWT claims의 `sub` 필드를 설정하여 구현합니다.

성능 최적화의 핵심은 **함수를 SELECT로 래핑**하는 것입니다. `auth.jwt()->>'sub'`를 `(SELECT auth.jwt()->>'sub')`로 감싸면 쿼리당 한 번만 평가되어 **최대 99% 성능 향상**이 가능합니다. user_id 컬럼에 B-tree 인덱스를 추가하는 것도 필수입니다.

---

## 3. 구현 시 필수 사항

- [ ] 모든 public 스키마 테이블에 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 실행
- [ ] Clerk 통합 시 user_id 컬럼을 **TEXT 타입**으로 생성 (UUID 아님)
- [ ] 모든 RLS 정책에서 `auth.jwt()->>'sub'` 사용 (auth.uid() 아님)
- [ ] 함수 호출을 `(SELECT ...)` 로 래핑하여 성능 최적화
- [ ] RLS에 사용되는 모든 컬럼에 인덱스 생성
- [ ] 모든 정책에 `TO authenticated` 또는 `TO anon` 명시
- [ ] SELECT/INSERT/UPDATE/DELETE 별도 정책 생성 (`FOR ALL` 지양)
- [ ] 민감 테이블(analysis_images)에 UPDATE 정책 미생성으로 수정 차단
- [ ] 감사 로그 테이블에 UPDATE/DELETE 정책 미생성으로 무결성 보장
- [ ] `is_admin()` Security Definer 함수 생성 및 활용
- [ ] pgTAP + supabase_test_helpers로 정책 테스트 자동화
- [ ] CI/CD 파이프라인에 `supabase test db` 통합
- [ ] 환경별(dev/staging/prod) 마이그레이션 관리 체계 구축

---

## 4. 코드 예시

### 4.1 기본 설정 및 헬퍼 함수

```sql
-- =============================================
-- 0. Clerk용 사용자 ID 추출 함수
-- =============================================
CREATE OR REPLACE FUNCTION auth.clerk_uid()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT auth.jwt()->>'sub'),
    ''
  );
$$ LANGUAGE SQL STABLE;

-- =============================================
-- 1. 관리자 체크 함수 (Security Definer)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt()->>'user_role') = 'admin',
    false
  );
END;
$$;

-- =============================================
-- 2. 사용자 역할 테이블 및 JWT Hook
-- =============================================
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

CREATE TABLE public.user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,  -- Clerk user ID (TEXT)
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom Access Token Hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims JSONB;
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role 
  FROM public.user_roles 
  WHERE user_id = (event->>'user_id');
  
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', 
    to_jsonb(COALESCE(user_role::text, 'user')));
  
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

### 4.2 사용자 관련 테이블

```sql
-- =============================================
-- users 테이블
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()->>'sub') = clerk_id);

CREATE POLICY "users_insert_own" ON public.users
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = clerk_id);

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()->>'sub') = clerk_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = clerk_id);

-- DELETE 정책 없음 = 삭제 불가

CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);
```

### 4.3 분석 결과 테이블 (공유 기능 포함)

```sql
-- =============================================
-- color_diagnoses 테이블 (공유 기능 포함)
-- =============================================
CREATE TABLE public.color_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Clerk user ID
  season_type VARCHAR(50),
  sub_type VARCHAR(50),
  best_colors JSONB,
  avoid_colors JSONB,
  is_public BOOLEAN DEFAULT false,
  shared_with TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.color_diagnoses ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인, 공개, 또는 공유 대상
CREATE POLICY "color_diagnoses_select" ON public.color_diagnoses
FOR SELECT TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
  OR is_public = true
  OR (SELECT auth.jwt()->>'sub') = ANY(shared_with)
);

-- anon도 공개된 진단 조회 가능
CREATE POLICY "color_diagnoses_select_public" ON public.color_diagnoses
FOR SELECT TO anon
USING (is_public = true);

CREATE POLICY "color_diagnoses_insert" ON public.color_diagnoses
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "color_diagnoses_update" ON public.color_diagnoses
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "color_diagnoses_delete" ON public.color_diagnoses
FOR DELETE TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

CREATE INDEX idx_color_diagnoses_user_id ON public.color_diagnoses(user_id);
CREATE INDEX idx_color_diagnoses_public ON public.color_diagnoses(is_public) WHERE is_public = true;

-- =============================================
-- analysis_images 테이블 (민감 데이터, UPDATE 금지)
-- =============================================
CREATE TABLE public.analysis_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  analysis_id UUID,
  analysis_type VARCHAR(50),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analysis_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_images_select_own" ON public.analysis_images
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "analysis_images_insert_own" ON public.analysis_images
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- UPDATE 정책 없음 = 수정 불가 (무결성 보장)

CREATE POLICY "analysis_images_delete_own" ON public.analysis_images
FOR DELETE TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

CREATE INDEX idx_analysis_images_user_id ON public.analysis_images(user_id);
```

### 4.4 공유 링크 시스템

```sql
-- =============================================
-- share_links 테이블
-- =============================================
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ,
  is_one_time BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- 소유자는 자신의 링크 관리
CREATE POLICY "share_links_owner_all" ON public.share_links
FOR ALL TO authenticated
USING ((SELECT auth.jwt()->>'sub') = owner_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = owner_id);

-- 유효한 토큰으로 조회 (anon 포함)
CREATE POLICY "share_links_valid_token" ON public.share_links
FOR SELECT TO anon, authenticated
USING (
  (expires_at IS NULL OR expires_at > now())
  AND (is_one_time = false OR used_at IS NULL)
  AND (max_views IS NULL OR view_count < max_views)
);

CREATE INDEX idx_share_links_token ON public.share_links(share_token);
CREATE INDEX idx_share_links_owner ON public.share_links(owner_id);

-- =============================================
-- 공유 링크로 데이터 조회 함수 (Security Definer)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_shared_diagnosis(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link RECORD;
  v_result JSONB;
BEGIN
  -- 유효한 링크 확인 및 잠금
  SELECT * INTO v_link
  FROM public.share_links
  WHERE share_token = p_token
    AND resource_type = 'color_diagnosis'
    AND (expires_at IS NULL OR expires_at > now())
    AND (is_one_time = false OR used_at IS NULL)
    AND (max_views IS NULL OR view_count < max_views)
  FOR UPDATE;
  
  IF v_link IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired link');
  END IF;
  
  -- 조회 카운트 업데이트
  UPDATE public.share_links 
  SET view_count = view_count + 1,
      used_at = CASE WHEN is_one_time THEN now() ELSE used_at END
  WHERE id = v_link.id;
  
  -- 진단 데이터 조회
  SELECT jsonb_build_object(
    'id', cd.id,
    'season_type', cd.season_type,
    'sub_type', cd.sub_type,
    'best_colors', cd.best_colors,
    'created_at', cd.created_at
  ) INTO v_result
  FROM public.color_diagnoses cd
  WHERE cd.id = v_link.resource_id;
  
  RETURN COALESCE(v_result, jsonb_build_object('error', 'Resource not found'));
END;
$$;

-- anon 역할에 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.get_shared_diagnosis TO anon;
```

### 4.5 제품 테이블 (공개 읽기)

```sql
-- =============================================
-- products 테이블
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  price DECIMAL(10,2),
  category_id UUID,
  color_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 공개 조회 (활성 제품만)
CREATE POLICY "products_public_select" ON public.products
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- 관리자는 모든 제품 조회
CREATE POLICY "products_admin_select_all" ON public.products
FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));

-- 관리자만 CUD
CREATE POLICY "products_admin_insert" ON public.products
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "products_admin_update" ON public.products
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "products_admin_delete" ON public.products
FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_category ON public.products(category_id);
```

### 4.6 감사 로그 (무결성 보장)

```sql
-- =============================================
-- audit_logs 테이블
-- =============================================
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));

-- INSERT/UPDATE/DELETE 정책 없음 = service_role만 가능

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING BRIN(created_at);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- =============================================
-- 자동 로깅 Trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  record_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    record_id := COALESCE(OLD.id::TEXT, 'unknown');
  ELSE
    record_id := COALESCE(NEW.id::TEXT, 'unknown');
  END IF;
  
  INSERT INTO public.audit_logs (
    user_id, user_email, table_name, record_id, action, old_data, new_data
  ) VALUES (
    auth.jwt()->>'sub',
    auth.jwt()->>'email',
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    record_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 감사 대상 테이블에 트리거 적용
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_changes();

CREATE TRIGGER audit_color_diagnoses
  AFTER INSERT OR UPDATE OR DELETE ON public.color_diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.log_changes();
```

### 4.7 RLS 테스트 예시 (pgTAP)

```sql
-- supabase/tests/01-rls-policies.sql
BEGIN;
  SELECT plan(8);
  
  -- 테스트 사용자 생성
  SELECT tests.create_supabase_user('owner_user', 'owner@test.com');
  SELECT tests.create_supabase_user('other_user', 'other@test.com');
  
  -- 테스트 데이터 삽입 (service_role로)
  SELECT tests.authenticate_as_service_role();
  
  INSERT INTO public.color_diagnoses (id, user_id, season_type, is_public)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 
     tests.get_supabase_uid('owner_user'), 'Spring', false),
    ('22222222-2222-2222-2222-222222222222', 
     tests.get_supabase_uid('owner_user'), 'Summer', true);
  
  -- Test 1: 소유자는 자신의 비공개 데이터 조회 가능
  SELECT tests.authenticate_as('owner_user');
  SELECT results_eq(
    $$ SELECT COUNT(*) FROM public.color_diagnoses $$,
    $$ VALUES(2::bigint) $$,
    'Owner can see all their diagnoses'
  );
  
  -- Test 2: 다른 사용자는 공개 데이터만 조회 가능
  SELECT tests.authenticate_as('other_user');
  SELECT results_eq(
    $$ SELECT COUNT(*) FROM public.color_diagnoses $$,
    $$ VALUES(1::bigint) $$,
    'Other user can only see public diagnoses'
  );
  
  -- Test 3: 다른 사용자는 비공개 데이터 수정 불가
  SELECT is_empty(
    $$ UPDATE public.color_diagnoses 
       SET season_type = 'Hacked' 
       WHERE id = '11111111-1111-1111-1111-111111111111'
       RETURNING id $$,
    'Other user cannot update private diagnosis'
  );
  
  -- Test 4: anon 사용자도 공개 데이터 조회 가능
  SELECT tests.clear_authentication();
  SELECT results_eq(
    $$ SELECT COUNT(*) FROM public.color_diagnoses $$,
    $$ VALUES(1::bigint) $$,
    'Anonymous user can see public diagnoses'
  );
  
  -- Test 5: anon 사용자는 INSERT 불가
  SELECT throws_ok(
    $$ INSERT INTO public.color_diagnoses (user_id, season_type) 
       VALUES ('anon-user', 'Winter') $$,
    '42501',
    'Anonymous user cannot insert'
  );
  
  -- Test 6: analysis_images UPDATE 차단 확인
  SELECT tests.authenticate_as_service_role();
  INSERT INTO public.analysis_images (id, user_id, storage_path)
  VALUES ('33333333-3333-3333-3333-333333333333', 
          tests.get_supabase_uid('owner_user'), '/test/image.jpg');
  
  SELECT tests.authenticate_as('owner_user');
  SELECT is_empty(
    $$ UPDATE public.analysis_images 
       SET storage_path = '/hacked/path.jpg' 
       RETURNING id $$,
    'Image update is blocked'
  );
  
  -- Test 7: 제품은 anon도 조회 가능
  SELECT tests.authenticate_as_service_role();
  INSERT INTO public.products (id, name, is_active)
  VALUES ('44444444-4444-4444-4444-444444444444', 'Test Product', true);
  
  SELECT tests.clear_authentication();
  SELECT results_eq(
    $$ SELECT COUNT(*) FROM public.products $$,
    $$ VALUES(1::bigint) $$,
    'Anonymous user can see products'
  );
  
  -- Test 8: 비관리자는 제품 수정 불가
  SELECT tests.authenticate_as('owner_user');
  SELECT is_empty(
    $$ UPDATE public.products SET name = 'Hacked' RETURNING id $$,
    'Non-admin cannot update products'
  );
  
  SELECT * FROM finish();
ROLLBACK;
```

### 4.8 Next.js 클라이언트 설정 (Clerk 통합)

```typescript
// lib/supabase/client.ts
'use client'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useSupabaseClient() {
  const { session } = useSession()
  
  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null
        },
      }
    )
  }, [session])
}

// lib/supabase/server.ts
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function createServerSupabaseClient() {
  const { getToken } = await auth()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return await getToken()
      },
    }
  )
}

// lib/supabase/admin.ts (Service Role - 서버 전용)
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // RLS 우회
)
```

---

## 5. 참고 자료

**Supabase 공식 문서**
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- RLS Performance Best Practices: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Custom Claims & RBAC: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- Third-Party Auth (Clerk): https://supabase.com/docs/guides/auth/third-party/clerk
- pgTAP Testing: https://supabase.com/docs/guides/local-development/testing/pgtap-extended

**Clerk 공식 문서**
- Supabase Integration: https://clerk.com/docs/guides/development/integrations/databases/supabase

**커뮤니티 리소스**
- Supabase Test Helpers: https://github.com/usebasejump/supabase-test-helpers
- RLS Performance Tests: https://github.com/GaryAustin1/RLS-Performance
- Clerk + Supabase Next.js 예제: https://github.com/clerk/clerk-supabase-nextjs