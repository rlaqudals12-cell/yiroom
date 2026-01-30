# Supabase RLS 완벽 가이드: Yiroom을 위한 보안 구현 전략

## 1. 핵심 요약

Supabase Row Level Security(RLS)는 데이터베이스 레벨에서 사용자별 데이터 접근을 제어하는 필수 보안 메커니즘입니다. **Clerk JWT 통합 시 `auth.uid()` 대신 `auth.jwt()->>'sub'`를 사용**해야 하며, 정책 내 함수는 반드시 `(SELECT ...)` 형태로 감싸 성능을 최적화해야 합니다. **PERMISSIVE 정책들은 OR로, RESTRICTIVE 정책들은 AND로 결합**되므로, 민감한 개인 데이터(신체 측정, 피부 분석 등)에는 다층 보안 접근이 필요합니다. RLS가 활성화되지 않은 테이블은 `anon` API 키로 전체 데이터가 노출되는 **치명적 보안 취약점**이 됩니다.

---

## 2. 상세 내용

### 2.1 RLS 정책 설계 패턴

#### USING vs WITH CHECK 핵심 차이

| 절(Clause) | 용도 | 적용 대상 | 동작 방식 |
|-----------|------|----------|----------|
| **USING** | 기존 행 조회 권한 | SELECT, UPDATE, DELETE | 조건 불충족 시 해당 행 숨김(silent) |
| **WITH CHECK** | 새로운/수정된 행 검증 | INSERT, UPDATE | 조건 불충족 시 **에러 발생** |

**중요 규칙**: UPDATE 정책에서 `WITH CHECK`를 생략하면 `USING` 조건이 자동으로 적용됩니다.

```sql
-- SELECT: USING만 사용 (WITH CHECK 불가)
CREATE POLICY "select_own_data" ON profiles FOR SELECT
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

-- INSERT: WITH CHECK만 사용 (USING 불가)
CREATE POLICY "insert_own_data" ON profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- UPDATE: 둘 다 사용 (USING=조회 대상, WITH CHECK=수정 결과 검증)
CREATE POLICY "update_own_data" ON profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- DELETE: USING만 사용
CREATE POLICY "delete_own_data" ON profiles FOR DELETE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);
```

#### PERMISSIVE vs RESTRICTIVE 정책 결합 규칙

**정책 결합 공식**:
```
(RESTRICTIVE 정책1 AND RESTRICTIVE 정책2 AND ...)
AND
(PERMISSIVE 정책1 OR PERMISSIVE 정책2 OR ...)
```

| 정책 유형 | 결합 방식 | 특징 |
|----------|---------|------|
| **PERMISSIVE** (기본값) | OR | 하나라도 통과하면 접근 허용 |
| **RESTRICTIVE** | AND | 모두 통과해야 접근 허용 |

**⚠️ 주의**: RESTRICTIVE 정책만 있으면 **모든 접근이 차단**됩니다. 반드시 PERMISSIVE 정책이 먼저 있어야 합니다.

```sql
-- 민감 데이터에 MFA 요구: PERMISSIVE + RESTRICTIVE 조합
-- 1단계: 기본 접근 권한 부여 (PERMISSIVE)
CREATE POLICY "base_access" ON personal_health_data
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

-- 2단계: MFA 추가 요구 (RESTRICTIVE)
CREATE POLICY "require_mfa" ON personal_health_data
AS RESTRICTIVE
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2');
-- 결과: 소유자이면서 MFA가 활성화된 경우에만 접근 가능
```

#### 정책 명명 규칙 및 조직화

**권장 패턴**: `{action}_{scope}_{condition}` 또는 서술형 문장

```sql
-- 패턴 1: 간결한 명명
CREATE POLICY "select_own_measurements" ON body_measurements ...
CREATE POLICY "insert_authenticated_profiles" ON profiles ...

-- 패턴 2: 서술형 (Supabase 권장)
CREATE POLICY "Users can view their own body measurements" ON body_measurements ...
CREATE POLICY "Only owner can update skin analysis results" ON skin_analysis ...
```

**모범 사례**:
- `FOR ALL` 대신 **작업별 개별 정책** 생성 (디버깅 용이)
- 항상 `TO authenticated` 또는 `TO anon` 명시
- 함수는 반드시 `(SELECT ...)` 로 감싸기 (성능 95%+ 향상)

---

### 2.2 Clerk JWT와 Supabase 통합

#### 네이티브 통합 설정 (2025년 권장 방식)

**Clerk 측 설정**:
1. [Clerk Dashboard → Supabase Integration](https://dashboard.clerk.com/setup/supabase) 이동
2. **Activate Supabase integration** 클릭
3. **Clerk Domain** 복사 (예: `example.clerk.accounts.dev`)

**Supabase 측 설정**:
1. Dashboard → **Authentication → Sign In/Up → Third Party Auth**
2. **Add provider** → **Clerk** 선택
3. Clerk Domain 붙여넣기

**로컬 개발 환경 설정** (`supabase/config.toml`):
```toml
[auth.third_party.clerk]
enabled = true
domain = "example.clerk.accounts.dev"
```

#### Clerk User ID 처리의 핵심 차이

**⚠️ 중요**: Clerk은 **문자열 ID** (`user_2abc123def456` 형식)를 사용하므로 **`auth.uid()`를 사용하면 안 됩니다**.

```sql
-- ❌ 잘못된 방법 - Clerk에서 작동하지 않음
USING (auth.uid() = user_id)  -- auth.uid()는 UUID 반환

-- ✅ 올바른 방법 - Clerk JWT의 sub 클레임 사용
USING ((SELECT auth.jwt()->>'sub') = user_id)
```

**테이블 스키마 설계**:
```sql
-- user_id 컬럼은 UUID가 아닌 TEXT 타입으로!
CREATE TABLE body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',  -- TEXT 타입!
  height_cm numeric,
  weight_kg numeric,
  created_at timestamptz DEFAULT now()
);
```

#### JWT 클레임 접근 방법

| 클레임 | 설명 | 접근 패턴 |
|-------|-----|----------|
| `sub` | 사용자 ID | `auth.jwt()->>'sub'` |
| `org_id` | 조직 ID | `auth.jwt()->>'org_id'` 또는 `auth.jwt()->'o'->>'id'` |
| `org_role` | 조직 역할 | `auth.jwt()->>'org_role'` 또는 `auth.jwt()->'o'->>'rol'` |
| `fva` | 2FA 인증 여부 | `auth.jwt()->'fva'->>1` |

#### Clerk 커스텀 클레임 설정

**Clerk Dashboard → Sessions → Customize session token**:
```json
{
  "subscription_tier": "{{user.public_metadata.subscription_tier}}",
  "onboarding_complete": "{{user.public_metadata.onboardingComplete}}"
}
```

**RLS 정책에서 커스텀 클레임 사용**:
```sql
-- 프리미엄 사용자만 특정 콘텐츠 접근
CREATE POLICY "Premium users only"
ON premium_content FOR SELECT
TO authenticated
USING ((SELECT auth.jwt()->>'subscription_tier') = 'premium');
```

**⚠️ 제한사항**: 커스텀 클레임은 **1.2KB** 이하로 유지 (전체 쿠키 4KB 제한)

#### Next.js 클라이언트 설정

**클라이언트 컴포넌트**:
```typescript
'use client'
import { useSession, useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

export default function Component() {
  const { session } = useSession()

  function createClerkSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null
        },
      },
    )
  }

  const client = createClerkSupabaseClient()
  // client 사용...
}
```

**서버 컴포넌트/Server Actions**:
```typescript
// app/utils/supabase-server.ts
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken()
      },
    },
  )
}

// Server Action 예시
'use server'
export async function addBodyMeasurement(data: MeasurementData) {
  const client = createServerSupabaseClient()
  const { data: result, error } = await client
    .from('body_measurements')
    .insert(data)
  
  if (error) throw new Error(`Failed: ${error.message}`)
  return result
}
```

---

### 2.3 사용자 데이터 격리 정책

#### 민감 데이터 완전 격리 패턴

Yiroom이 다루는 민감 데이터(신체 측정, 피부 분석, 퍼스널 컬러)에 적합한 **완전 격리 패턴**:

```sql
-- 민감 데이터 테이블 생성
CREATE TABLE personal_health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  
  -- 민감 데이터 필드
  body_measurements jsonb,
  skin_analysis_results jsonb,
  personal_color_data jsonb,
  
  -- 메타데이터
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL  -- 소프트 삭제용
);

-- RLS 활성화 (필수!)
ALTER TABLE personal_health_data ENABLE ROW LEVEL SECURITY;

-- 성능을 위한 인덱스
CREATE INDEX idx_health_user_id ON personal_health_data(user_id);
CREATE INDEX idx_health_deleted ON personal_health_data(deleted_at) 
  WHERE deleted_at IS NULL;
```

#### 데이터 가시성 수준 구현

**Private(기본) / Friends-only / Public 패턴**:

```sql
-- 가시성 컬럼이 있는 테이블
CREATE TABLE color_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  results jsonb,
  visibility TEXT NOT NULL DEFAULT 'private' 
    CHECK (visibility IN ('private', 'friends', 'public')),
  created_at timestamptz DEFAULT now()
);

-- Private: 소유자만
CREATE POLICY "Private: owner only"
ON color_analysis FOR SELECT
TO authenticated
USING (
  visibility = 'private' 
  AND (SELECT auth.jwt()->>'sub') = user_id
);

-- Friends: 소유자 또는 친구
CREATE POLICY "Friends: owner or friend"
ON color_analysis FOR SELECT
TO authenticated
USING (
  visibility = 'friends' 
  AND (
    (SELECT auth.jwt()->>'sub') = user_id 
    OR (SELECT auth.jwt()->>'sub') IN (
      SELECT friend_id FROM friendships 
      WHERE user_id = color_analysis.user_id 
      AND status = 'accepted'
    )
  )
);

-- Public: 누구나
CREATE POLICY "Public: anyone can view"
ON color_analysis FOR SELECT
TO authenticated, anon
USING (visibility = 'public');
```

#### Service Role 보안 주의사항

**`service_role` 키는 모든 RLS를 완전히 우회**합니다.

| ✅ DO | ❌ DON'T |
|-------|---------|
| 서버 측 코드에서만 사용 | 프론트엔드/클라이언트 코드에 절대 노출 금지 |
| 환경 변수로 저장 | 버전 관리에 커밋 금지 |
| 관리자 작업, 백그라운드 잡에만 사용 | 브라우저에서 사용 금지 (localhost 포함) |
| 환경별 다른 키 사용 | URL이나 쿼리 파라미터에 포함 금지 |

#### 익명 사용자 처리

```sql
-- 익명 인증 사용자 구분 (Supabase Auth 익명 로그인 사용 시)
CREATE POLICY "Block anonymous from sensitive operations"
ON personal_health_data
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  (SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE
);
```

#### 멀티테넌시 패턴

**⚠️ 중요**: `user_metadata`가 아닌 **`app_metadata`** 사용 (사용자가 수정 불가)

```sql
-- 테넌트 ID 추출 헬퍼 함수
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS TEXT AS $$
  SELECT auth.jwt()->'app_metadata'->>'tenant_id'
$$ LANGUAGE sql STABLE;

-- 테넌트 격리 정책
CREATE POLICY "Tenant isolation"
ON client_data FOR ALL
TO authenticated
USING ((SELECT auth.tenant_id()) = tenant_id)
WITH CHECK ((SELECT auth.tenant_id()) = tenant_id);
```

---

### 2.4 관계 기반 접근 제어 (ReBAC)

#### 관계 테이블 스키마 설계

**친구 관계 테이블**:
```sql
CREATE TABLE public.friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- 성능 최적화 인덱스
CREATE INDEX idx_friendships_user ON friendships(user_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_friend ON friendships(friend_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_composite ON friendships(user_id, friend_id, status);
```

**팀 멤버십 테이블**:
```sql
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'moderator', 'member');

CREATE TABLE public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL,
  role team_role DEFAULT 'member' NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 인덱스
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_role ON team_members(team_id, role);
```

#### SECURITY DEFINER 함수 (성능 핵심)

**친구 확인 함수** (RLS 우회로 성능 향상):
```sql
CREATE OR REPLACE FUNCTION private.are_friends(target_user_id TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = (SELECT auth.jwt()->>'sub') AND friend_id = target_user_id) OR
      (friend_id = (SELECT auth.jwt()->>'sub') AND user_id = target_user_id)
    )
  );
$$;
```

**사용자 팀 목록 함수**:
```sql
CREATE OR REPLACE FUNCTION private.get_user_teams()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id 
  FROM team_members 
  WHERE user_id = (SELECT auth.jwt()->>'sub');
$$;
```

**계층적 역할 확인 함수**:
```sql
CREATE OR REPLACE FUNCTION private.has_team_role(
  target_team_id uuid, 
  required_role team_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN (VALUES 
      ('owner', 4), ('admin', 3), ('moderator', 2), ('member', 1)
    ) AS role_levels(role_name, level) ON tm.role::text = role_levels.role_name
    WHERE tm.team_id = target_team_id
    AND tm.user_id = (SELECT auth.jwt()->>'sub')
    AND role_levels.level >= (
      SELECT level FROM (VALUES 
        ('owner', 4), ('admin', 3), ('moderator', 2), ('member', 1)
      ) AS rl(role_name, level) WHERE rl.role_name = required_role::text
    )
  );
$$;
```

#### ReBAC 정책 예시

**친구 공개 프로필 접근**:
```sql
CREATE POLICY "Friends can view friend profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id  -- 본인
  OR visibility = 'public'                -- 공개
  OR (
    visibility = 'friends' 
    AND (SELECT private.are_friends(user_id))  -- 친구
  )
);
```

**팀 문서 접근 제어**:
```sql
-- 팀원만 조회 가능
CREATE POLICY "Team members can view documents"
ON team_documents FOR SELECT
TO authenticated
USING (team_id IN (SELECT private.get_user_teams()));

-- Admin 이상만 삭제 가능
CREATE POLICY "Team admins can delete documents"
ON team_documents FOR DELETE
TO authenticated
USING ((SELECT private.has_team_role(team_id, 'admin')));
```

---

### 2.5 성능 최적화

#### RLS 성능 영향 데이터

Supabase 테스트 결과 (100K 행 테이블):

| 시나리오 | 최적화 전 | 최적화 후 | 개선율 |
|---------|----------|----------|-------|
| `auth.uid() = user_id` (인덱스 없음) | 171ms | <0.1ms | **1,700배** |
| 함수 사용 정책 | 179ms | 9ms | **20배** |
| `is_admin()` 테이블 조인 | 11,000ms | 7ms | **1,571배** |
| 팀 기반 접근 (1M 행) | >2분 (타임아웃) | 2ms | **60,000배 이상** |

#### 필수 인덱스 전략

```sql
-- 기본: user_id 컬럼 인덱스 (RLS 정책에 사용되는 모든 컬럼)
CREATE INDEX idx_measurements_user_id 
ON body_measurements USING btree (user_id);

-- 복합 인덱스: 다중 조건
CREATE INDEX idx_data_tenant_user 
ON client_data (tenant_id, user_id);

-- GIN 인덱스: 배열 컬럼 (ACL 패턴)
CREATE INDEX idx_resources_access 
ON shared_resources USING GIN (read_access);

-- 부분 인덱스: 일반적인 조건
CREATE INDEX idx_accepted_friendships 
ON friendships(user_id, friend_id) WHERE status = 'accepted';
```

#### 핵심 최적화 기법

**1. 함수를 SELECT로 감싸기 (InitPlan 캐싱)**:
```sql
-- ❌ 느림: 행마다 함수 호출 (11,000ms)
USING (is_admin() OR auth.jwt()->>'sub' = user_id)

-- ✅ 빠름: InitPlan으로 캐싱 (10ms)
USING ((SELECT is_admin()) OR (SELECT auth.jwt()->>'sub') = user_id)
```

**2. 조인 방향 최적화**:
```sql
-- ❌ 느림 (9,000ms): 각 행에서 서브쿼리 실행
USING (
  auth.jwt()->>'sub' IN (
    SELECT user_id FROM team_members 
    WHERE team_members.team_id = documents.team_id
  )
)

-- ✅ 빠름 (20ms): 고정 목록 먼저 계산 후 필터
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = (SELECT auth.jwt()->>'sub')
  )
)
```

**3. 클라이언트 측 필터 추가**:
```typescript
// RLS만 의존하지 말고 명시적 필터 추가 (쿼리 플래너 도움)
const { data } = await supabase
  .from('body_measurements')
  .select('*')
  .eq('user_id', userId)  // 명시적 필터
  .order('created_at', { ascending: false });
```

#### EXPLAIN ANALYZE 사용법

```sql
-- RLS 테스트 환경 설정
SET session role authenticated;
SET request.jwt.claims TO '{"role":"authenticated", "sub":"user_2abc123def456"}';

-- 쿼리 분석
EXPLAIN ANALYZE SELECT * FROM body_measurements;

-- 확인 사항:
-- - "Seq Scan" = 풀 테이블 스캔 (나쁨)
-- - "Index Scan" = 인덱스 사용 (좋음)
-- - "Execution Time" = 핵심 지표

-- 원래 역할로 복원
SET session role postgres;
```

#### 연결 풀링 설정 (Supavisor/PgBouncer)

| 연결 유형 | 포트 | RLS 호환성 |
|----------|-----|-----------|
| Direct | 5432 | ✅ 완전 지원 |
| Supavisor Session | 5432 | ✅ 완전 지원 |
| Supavisor Transaction | 6543 | ✅ 완전 지원 |
| PgBouncer | 6543 | ✅ 완전 지원 |

```toml
# supabase/config.toml
[db.pooler]
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
```

---

## 3. 구현 체크리스트

### 기본 보안 설정
- [ ] 모든 public 스키마 테이블에 RLS 활성화 (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] `USING (true)` 정책이 민감 테이블에 없는지 확인
- [ ] 모든 정책에 `TO authenticated` 또는 `TO anon` 명시
- [ ] Supabase Security Advisor 실행 및 경고 해결

### Clerk 통합
- [ ] Clerk Dashboard에서 Supabase 통합 활성화
- [ ] Supabase Dashboard에서 Third Party Auth로 Clerk 추가
- [ ] `user_id` 컬럼을 **TEXT 타입**으로 설계 (UUID 아님)
- [ ] RLS 정책에서 `auth.jwt()->>'sub'` 사용 (`auth.uid()` 아님)
- [ ] 로컬 개발용 `config.toml`에 Clerk 도메인 설정

### 성능 최적화
- [ ] RLS 정책에 사용되는 모든 컬럼에 인덱스 추가
- [ ] `auth.uid()`, `auth.jwt()`를 `(SELECT ...)` 로 감싸기
- [ ] 관계 테이블 조회용 SECURITY DEFINER 함수 생성
- [ ] 100K+ 행으로 EXPLAIN ANALYZE 테스트

### 민감 데이터 보호
- [ ] 신체 측정, 피부 분석 테이블에 완전 격리 정책 적용
- [ ] MFA 요구 RESTRICTIVE 정책 추가 (선택적)
- [ ] 소프트 삭제 구현 (규정 준수용)
- [ ] 변경 불가 컬럼 보호 트리거 추가 (user_id, created_at)
- [ ] `service_role` 키가 서버 측 코드에만 있는지 확인

### ReBAC (관계 기반 접근)
- [ ] 친구/팀 관계 테이블에 적절한 인덱스 추가
- [ ] 관계 확인용 SECURITY DEFINER 함수 생성
- [ ] 가시성 수준(private/friends/public) 정책 구현
- [ ] 계층적 역할(admin > moderator > user) 로직 구현

### 테스트 및 모니터링
- [ ] 각 역할로 RLS 정책 테스트 (authenticated, anon)
- [ ] 실제 데이터량으로 성능 벤치마크
- [ ] PGAudit 설정으로 민감 데이터 접근 로깅
- [ ] 프로덕션 배포 전 모든 정책 검토

---

## 4. SQL 코드 예시

### 4.1 Yiroom 민감 데이터 테이블 완전 설정

```sql
-- ========================================
-- 신체 측정 데이터 테이블 (Clerk 통합용)
-- ========================================
CREATE TABLE body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  
  -- 측정 데이터
  height_cm numeric,
  weight_kg numeric,
  shoulder_width_cm numeric,
  chest_cm numeric,
  waist_cm numeric,
  hip_cm numeric,
  
  -- 메타데이터
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- RLS 활성화 (필수!)
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- 성능 인덱스
CREATE INDEX idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX idx_body_measurements_active ON body_measurements(user_id, deleted_at) 
  WHERE deleted_at IS NULL;

-- SELECT: 소유자만, 삭제되지 않은 데이터
CREATE POLICY "select_own_measurements"
ON body_measurements FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') IS NOT NULL
  AND (SELECT auth.jwt()->>'sub') = user_id
  AND deleted_at IS NULL
);

-- INSERT: 자신의 데이터만
CREATE POLICY "insert_own_measurements"
ON body_measurements FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt()->>'sub') IS NOT NULL
  AND (SELECT auth.jwt()->>'sub') = user_id
);

-- UPDATE: 소유자만, user_id 변경 불가
CREATE POLICY "update_own_measurements"
ON body_measurements FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id 
  AND deleted_at IS NULL
)
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- DELETE: 비활성화 (소프트 삭제 사용)
-- 하드 삭제 정책 없음 - UPDATE로 deleted_at 설정

-- 보호 트리거: user_id 변경 방지, updated_at 자동 갱신
CREATE OR REPLACE FUNCTION protect_measurement_data()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER measurement_protection
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW EXECUTE FUNCTION protect_measurement_data();
```

### 4.2 피부 분석 데이터 (가시성 수준 포함)

```sql
-- ========================================
-- 피부 분석 결과 테이블
-- ========================================
CREATE TABLE skin_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  
  -- 분석 결과
  skin_type TEXT CHECK (skin_type IN ('dry', 'oily', 'combination', 'sensitive')),
  hydration_level numeric,
  oil_level numeric,
  analysis_data jsonb,
  
  -- 가시성 (기본: 비공개)
  visibility TEXT NOT NULL DEFAULT 'private' 
    CHECK (visibility IN ('private', 'friends', 'public')),
  
  -- 메타데이터
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skin_analysis ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_skin_analysis_user ON skin_analysis(user_id);
CREATE INDEX idx_skin_analysis_visibility ON skin_analysis(visibility);

-- 통합 가시성 정책
CREATE POLICY "visibility_based_select"
ON skin_analysis FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id  -- 소유자는 항상 조회 가능
  OR visibility = 'public'                -- 공개 데이터
  OR (
    visibility = 'friends' 
    AND (SELECT private.are_friends(user_id))  -- 친구 공개
  )
);

-- INSERT/UPDATE/DELETE: 소유자만
CREATE POLICY "owner_insert" ON skin_analysis FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "owner_update" ON skin_analysis FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "owner_delete" ON skin_analysis FOR DELETE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);
```

### 4.3 친구 관계 및 헬퍼 함수

```sql
-- ========================================
-- 친구 관계 테이블
-- ========================================
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_friendships_user ON friendships(user_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_friend ON friendships(friend_id) WHERE status = 'accepted';

-- 친구 관계는 양쪽 모두 조회/관리 가능
CREATE POLICY "view_own_friendships"
ON friendships FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id 
  OR (SELECT auth.jwt()->>'sub') = friend_id
);

-- ========================================
-- SECURITY DEFINER 헬퍼 함수
-- ========================================

-- 친구 여부 확인 (양방향)
CREATE OR REPLACE FUNCTION private.are_friends(target_user_id TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = (SELECT auth.jwt()->>'sub') AND friend_id = target_user_id) OR
      (friend_id = (SELECT auth.jwt()->>'sub') AND user_id = target_user_id)
    )
  );
$$;

-- 사용자의 친구 목록 반환
CREATE OR REPLACE FUNCTION private.get_friend_ids()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN user_id = (SELECT auth.jwt()->>'sub') THEN friend_id
    ELSE user_id
  END
  FROM friendships
  WHERE status = 'accepted'
  AND (user_id = (SELECT auth.jwt()->>'sub') OR friend_id = (SELECT auth.jwt()->>'sub'));
$$;
```

### 4.4 팀 기반 접근 제어

```sql
-- ========================================
-- 팀 및 멤버십 테이블
-- ========================================
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'moderator', 'member');

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role team_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team_role ON team_members(team_id, role);

-- ========================================
-- 팀 접근 헬퍼 함수
-- ========================================
CREATE OR REPLACE FUNCTION private.get_user_teams()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM team_members 
  WHERE user_id = (SELECT auth.jwt()->>'sub');
$$;

CREATE OR REPLACE FUNCTION private.has_team_role(
  target_team_id uuid, 
  required_role team_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = target_team_id
    AND user_id = (SELECT auth.jwt()->>'sub')
    AND CASE role
      WHEN 'owner' THEN 4
      WHEN 'admin' THEN 3
      WHEN 'moderator' THEN 2
      WHEN 'member' THEN 1
    END >= CASE required_role
      WHEN 'owner' THEN 4
      WHEN 'admin' THEN 3
      WHEN 'moderator' THEN 2
      WHEN 'member' THEN 1
    END
  );
$$;

-- ========================================
-- 팀 공유 문서 테이블
-- ========================================
CREATE TABLE team_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_by TEXT,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_team_docs_team ON team_documents(team_id);

-- 팀원 조회 가능
CREATE POLICY "team_members_select"
ON team_documents FOR SELECT
TO authenticated
USING (team_id IN (SELECT private.get_user_teams()));

-- Admin 이상 생성 가능
CREATE POLICY "team_admin_insert"
ON team_documents FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.has_team_role(team_id, 'admin')));

-- 작성자 또는 Admin 수정 가능
CREATE POLICY "author_or_admin_update"
ON team_documents FOR UPDATE
TO authenticated
USING (
  team_id IN (SELECT private.get_user_teams())
  AND (
    created_by = (SELECT auth.jwt()->>'sub')
    OR (SELECT private.has_team_role(team_id, 'admin'))
  )
);

-- Admin만 삭제 가능
CREATE POLICY "team_admin_delete"
ON team_documents FOR DELETE
TO authenticated
USING ((SELECT private.has_team_role(team_id, 'admin')));
```

### 4.5 MFA 요구 정책 (민감 작업용)

```sql
-- ========================================
-- MFA(2FA) 요구 RESTRICTIVE 정책
-- ========================================

-- 민감 데이터 업데이트 시 MFA 필수
CREATE POLICY "require_mfa_for_update"
ON body_measurements
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'aal') = 'aal2'
);

-- Clerk의 경우 fva(factor verification age) 확인
CREATE POLICY "require_2fa_clerk"
ON personal_health_data
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->'fva'->>1) != '-1'
);
```

---

## 5. 참고 자료

### 공식 문서
- [Supabase RLS 가이드](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase + Clerk 통합 문서](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Clerk Supabase 통합 가이드](https://clerk.com/docs/integrations/databases/supabase)
- [PostgreSQL CREATE POLICY 문서](https://www.postgresql.org/docs/current/sql-createpolicy.html)

### 성능 최적화
- [Supabase RLS 성능 최적화 가이드](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [RLS 성능 테스트 레포지토리 (GaryAustin1)](https://github.com/GaryAustin1/RLS-Performance)
- [Supabase 쿼리 최적화 문서](https://supabase.com/docs/guides/database/query-optimization)

### 보안 및 권한
- [Supabase RBAC 커스텀 클레임 가이드](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [Supabase Security Advisor](https://supabase.com/docs/guides/database/database-advisors)
- [Clerk Session Token 커스터마이징](https://clerk.com/docs/backend-requests/custom-session-token)

### 연결 관리
- [Supabase 연결 풀링 문서](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase 연결 관리 가이드](https://supabase.com/docs/guides/database/connection-management)

### 예제 레포지토리
- [Clerk + Supabase Next.js 공식 예제](https://github.com/clerk/clerk-supabase-nextjs)