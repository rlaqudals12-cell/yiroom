# RLS (Row Level Security) 정책 가이드

> 이룸 프로젝트용 Supabase RLS 정책 작성 가이드

---

## 1. 기본 원칙

### RLS란?
Row Level Security는 데이터베이스 레벨에서 행(row) 단위로 접근을 제어하는 보안 기능입니다.
**모든 테이블에 RLS를 활성화**하는 것이 원칙입니다.

### 이룸의 인증 구조
```
이룸: Clerk 인증 → Supabase 데이터베이스
     clerk_user_id를 기준으로 RLS 정책 적용
```

---

## 2. 작업별 정책 규칙

| 작업 | USING | WITH CHECK | 설명 |
|------|-------|------------|------|
| **SELECT** | ✅ 필수 | ❌ 사용 안 함 | 읽기 권한 |
| **INSERT** | ❌ 사용 안 함 | ✅ 필수 | 생성 권한 |
| **UPDATE** | ✅ 대부분 필요 | ✅ 필수 | 수정 권한 |
| **DELETE** | ✅ 필수 | ❌ 사용 안 함 | 삭제 권한 |

### ⚠️ 중요: FOR ALL 사용 금지
```sql
-- ❌ 잘못된 예시
CREATE POLICY "bad_policy" ON users FOR ALL ...

-- ✅ 올바른 예시: 작업별 분리
CREATE POLICY "select_policy" ON users FOR SELECT ...
CREATE POLICY "insert_policy" ON users FOR INSERT ...
CREATE POLICY "update_policy" ON users FOR UPDATE ...
CREATE POLICY "delete_policy" ON users FOR DELETE ...
```

---

## 3. 이룸 RLS 정책 패턴

### 3.1 사용자 본인 데이터 접근

```sql
-- users 테이블: 본인 데이터만 조회
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING ( clerk_user_id = auth.jwt()->>'sub' );

-- users 테이블: 본인 데이터만 수정
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING ( clerk_user_id = auth.jwt()->>'sub' )
WITH CHECK ( clerk_user_id = auth.jwt()->>'sub' );
```

### 3.2 분석 결과 접근 (skin_analyses, body_analyses 등)

```sql
-- 본인의 분석 결과만 조회
CREATE POLICY "Users can view own skin analyses"
ON public.skin_analyses
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_user_id = auth.jwt()->>'sub'
  )
);

-- 본인의 분석 결과만 생성
CREATE POLICY "Users can create own skin analyses"
ON public.skin_analyses
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_user_id = auth.jwt()->>'sub'
  )
);
```

### 3.3 공개 데이터 (제품 정보 등)

```sql
-- 모든 인증 사용자가 조회 가능
CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING ( true );

-- 관리자만 수정 가능 (향후 구현)
CREATE POLICY "Only admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING ( 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE clerk_user_id = auth.jwt()->>'sub' 
    AND role = 'admin'
  )
)
WITH CHECK ( true );
```

---

## 4. 성능 최적화

### 4.1 인덱스 추가
RLS 정책에 사용되는 컬럼에 인덱스를 추가합니다.

```sql
-- clerk_user_id 인덱스
CREATE INDEX idx_users_clerk_user_id 
ON public.users(clerk_user_id);

-- user_id 외래키 인덱스
CREATE INDEX idx_skin_analyses_user_id 
ON public.skin_analyses(user_id);
```

### 4.2 함수 캐싱 (select 래핑)

```sql
-- ❌ 비효율적: 행마다 함수 호출
USING ( auth.jwt()->>'sub' = clerk_user_id );

-- ✅ 효율적: 함수 결과 캐싱
USING ( clerk_user_id = (SELECT auth.jwt()->>'sub') );
```

### 4.3 조인 최소화

```sql
-- ❌ 비효율적: 조인 사용
USING (
  (SELECT auth.jwt()->>'sub') IN (
    SELECT clerk_user_id FROM users 
    WHERE users.id = skin_analyses.user_id
  )
);

-- ✅ 효율적: 서브쿼리로 ID 목록 생성
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
  )
);
```

---

## 5. 역할(Role) 지정

### Supabase 역할
- `anon`: 비인증 사용자
- `authenticated`: 인증된 사용자

```sql
-- 인증 사용자만 접근
CREATE POLICY "Auth users only"
ON public.users
FOR SELECT
TO authenticated  -- 역할 명시
USING ( ... );

-- 비인증 사용자도 접근 가능 (공개 데이터)
CREATE POLICY "Public access"
ON public.product_categories
FOR SELECT
TO anon, authenticated
USING ( true );
```

### ⚠️ 역할 미지정 시 문제
```sql
-- ❌ 역할 미지정: 불필요한 정책 평가
CREATE POLICY "bad" ON users USING ( ... );

-- ✅ 역할 지정: anon 사용자는 정책 평가 스킵
CREATE POLICY "good" ON users TO authenticated USING ( ... );
```

---

## 6. 이룸 테이블별 RLS 체크리스트

### 사용자 관련
| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| users | 본인만 | Clerk webhook | 본인만 | ❌ |
| user_preferences | 본인만 | 본인만 | 본인만 | 본인만 |

### 분석 결과
| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| skin_analyses | 본인만 | 본인만 | ❌ | ❌ |
| body_analyses | 본인만 | 본인만 | ❌ | ❌ |
| personal_color_results | 본인만 | 본인만 | ❌ | ❌ |

### 추천/제품
| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| products | 인증 사용자 | 관리자 | 관리자 | 관리자 |
| recommendations | 본인만 | 시스템 | ❌ | ❌ |

---

## 7. 정책 명명 규칙

```sql
-- 형식: "주체 can 동작 대상"
CREATE POLICY "Users can view own profile" ...
CREATE POLICY "Users can update own preferences" ...
CREATE POLICY "Authenticated users can view products" ...
CREATE POLICY "Only admins can delete products" ...
```

---

## 8. 디버깅 팁

### 정책 확인
```sql
-- 테이블의 모든 정책 조회
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### 개발 중 RLS 임시 비활성화
```sql
-- ⚠️ 개발 환경에서만 사용
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 프로덕션 전 반드시 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

## 9. PERMISSIVE vs RESTRICTIVE

### 기본: PERMISSIVE (권장)
```sql
-- 여러 정책 중 하나라도 통과하면 접근 허용
CREATE POLICY "permissive_policy" 
ON users AS PERMISSIVE ...
```

### RESTRICTIVE (특수한 경우)
```sql
-- 모든 정책을 통과해야 접근 허용
-- MFA 강제 등 추가 보안 레이어에 사용
CREATE POLICY "require_mfa"
ON sensitive_data AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING ( (SELECT auth.jwt()->>'aal') = 'aal2' );
```

**권장**: 대부분 PERMISSIVE 사용, RESTRICTIVE는 신중하게

---

## 참고 자료

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres RLS 문서](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
