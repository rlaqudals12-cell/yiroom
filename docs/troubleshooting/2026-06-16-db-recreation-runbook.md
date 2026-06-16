# DB 런북 (프로덕션 Supabase 복원 + 갭 적용 / 신규 생성)

> **작성**: 2026-06-16 | **🟢 6/16 갱신**: 프로젝트는 **삭제 아니라 PAUSED였고 복원 완료**(STATUS Healthy, 기존 키·env 그대로 작동). NXDOMAIN은 정지 중 인프라 다운 때문. → **아래 ★실제 경로(복원+갭적용) 사용**. 하단 "신규 생성" 섹션은 완전 유실 시 폴백.
> **전제**: 코드/빌드 그린(`next build` exit0), Gemini·Clerk·Vercel·GitHub 연결 정상.
> **정본 마이그레이션 디렉토리**: `apps/web/supabase/migrations/` (config.toml 위치 + 프로덕션이 실제로 이걸로 마이그됨). root `supabase/migrations/`는 **레거시 별개 세트 → 무시**.

표기: 🙋 사용자(대시보드) · 🤖 내가 실행 · ⏳ 대기

---

## ★ 실제 경로 — 복원 완료 → 갭 적용 (6/16 확정)

복원된 prod DB는 **~Feb12 마이그 + 수동 20260423**까지만 적용된 상태. 정밀 갭 분석(라이브 103테이블 vs 정본 diff) 결과 **정확히 8개 테이블 + 1개 컬럼 누락**, 전부 게이팅 안 된 도달 코드가 사용 → 배포 전 적용 필요:

| 누락                                                                                                  | 출처                                                                          | 쓰는 도달 코드                                                                                       |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `capsules`·`capsule_items`·`daily_capsules`·`rotation_history`·`beauty_profiles`·`cross_domain_rules` | `20260304_capsule_foundation.sql`                                             | 홈 `HomeDailyCapsuleWidget`, capsule 라우트(게이팅 없음), `progressive-profile` API(beauty_profiles) |
| `safety_profiles`                                                                                     | `20260304_safety_profiles.sql`                                                | `lib/safety`, capsule 안전                                                                           |
| `user_shopping_preferences`                                                                           | `202512290300_phase_j_smart_matching.sql` 발췌(파일 drift로 이 테이블만 누락) | `lib/smart-matching/preferences`                                                                     |
| `integrated_analysis_sessions.persona` 컬럼                                                           | `20260424_persona_profile_column.sql`                                         | `lib/analysis/integrated/.../session-store.ts` (ADR-104)                                             |

> `auth.get_user_id()` 함수도 복원 DB에 없음(구 prod는 `auth.jwt()->>'sub'` 사용) → safety_profiles RLS가 이를 참조하므로 함수 정의를 갭 스크립트 [1/5]에 포함. 신규 마이그 `00000000000003_auth_get_user_id.sql`로도 정본화함.

**실행 (🙋 사용자, 1회):**

- [ ] Supabase Dashboard → SQL Editor → **[2026-06-16-gap-apply.sql](./2026-06-16-gap-apply.sql) 전체 붙여넣기 → Run**
  - 전체가 `BEGIN…COMMIT` 트랜잭션 → 실패 시 자동 롤백(부분적용 없음), 재실행 무해
- [ ] 🤖 적용 후 검증(내가 REST로): 8개 테이블 200 + `integrated_analysis_sessions.persona` 200

**검증 명령 (🤖):**

```bash
URL="https://ihlrjhqyopjmhqvjnnnu.supabase.co"; SRK="<service_role>"
for t in capsules capsule_items daily_capsules rotation_history beauty_profiles cross_domain_rules safety_profiles user_shopping_preferences; do
  echo -n "$t -> "; curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: $SRK" -H "Authorization: Bearer $SRK" "$URL/rest/v1/$t?select=*&limit=0"
done
curl -s -o /dev/null -w "persona -> %{http_code}\n" -H "apikey: $SRK" -H "Authorization: Bearer $SRK" "$URL/rest/v1/integrated_analysis_sessions?select=persona&limit=0"
# 전부 200/206 기대
```

> 무료 티어: 복원 후 재방치 시 또 pause → 출시 전 주기적 접속 권장.

---

## (폴백) 완전 신규 생성 — 프로젝트가 진짜 삭제됐을 때만

---

## 사전 감사 결과 (6/16, 87개 마이그레이션 정적 분석)

- ✅ **클린 적용 가능** — 차단 이슈 1건은 **이미 수정 완료**:
  - 🔴→✅ `auth.get_user_id()`가 2개 파일(`20260304_safety_profiles`, `20260423_integrated_analysis_sessions`)에서 쓰이는데 정의가 없었음 → `00000000000003_auth_get_user_id.sql` 추가로 setup 직후 정의 보장.
- ⚠️ 비차단 위생 항목(적용엔 영향 없음, 나중에 정리):
  - `affiliate_clicks` 2개 파일 중복 정의(`202512190100`·`202512290200_affiliate_system.sql`) → IF NOT EXISTS라 두 번째 무시(스키마 드리프트 가능)
  - `saved_outfits` 2개 파일 중복(`202512290100_inventory`·`202601110700_saved_outfits`)
  - 일부 초기 정책 파일은 `DROP POLICY IF EXISTS` 없음 → **부분 실패 후 재시도 시 `db reset` 필수**(개별 재실행 금지)
- 확장: `pg_trgm`·`vector`(pgvector) 각 파일 내 선생성. `gen_random_uuid()`는 빌트인. 문제 없음.
- 스토리지 버킷: `uploads`·`skin-images`·`body-images`·`personal-color-images`·`feed-images` 전부 마이그레이션이 idempotent하게 생성(별도 수동 생성 불필요).
- 인증 방식: **Clerk 네이티브 third-party auth**(`accessToken()` 콜백, `clerk-client.ts`). 코드는 `getToken({template:'supabase'})` 먼저 시도 → 실패 시 기본 토큰. RLS는 `auth.jwt()->>'sub'` / `auth.get_user_id()`로 `clerk_user_id` 매칭.

---

## STEP 1. 🙋 신규 Supabase 프로젝트 생성

- [ ] supabase.com → New Project (무료 티어). 리전 권장: **Northeast Asia (Seoul / ap-northeast-2)**
- [ ] **DB 비밀번호**를 안전히 기록(마이그레이션 push에 필요)
- [ ] 생성 후 Project Settings에서 확보:
  - Project Ref (예: `abcd1234...`) → URL `https://<ref>.supabase.co`
  - `anon` public key
  - `service_role` secret key
- ⚠️ 무료 티어 재pause 방지: 출시 후 cron/트래픽이 주기적으로 DB를 건드리므로 유지됨. 출시 전 공백기엔 주 1회라도 접속 권장.

---

## STEP 2. 🤖 마이그레이션 적용 (둘 중 택1)

### 방법 A — Supabase CLI (권장, 87개 순서 자동)

```bash
# CLI 설치 (현재 미설치)
npm install -g supabase    # 또는 scoop install supabase

cd c:/dev/yiroom/apps/web
supabase login                              # access token 발급/입력
supabase link --project-ref <NEW_REF>       # config.toml의 project_id="saas-template" 갱신됨
supabase db push                            # migrations/ 전체를 파일명 순으로 적용
```

`supabase db push`는 `apps/web/supabase/migrations/`를 사전순으로 적용 → `00000000000000_setup_schema` → `…0003_auth_get_user_id`(블로커 픽스) → … → `20260424_persona_profile_column`. 스토리지 버킷 INSERT·`auth.get_user_id()` 함수 생성 모두 포함.

### 방법 B — Dashboard SQL Editor (CLI 못 쓸 때)

```bash
# 모든 마이그레이션을 사전순으로 하나로 결합
cd c:/dev/yiroom/apps/web/supabase/migrations
ls *.sql | sort | xargs cat > /c/tmp/yiroom-full-schema.sql
wc -l /c/tmp/yiroom-full-schema.sql
```

→ `/c/tmp/yiroom-full-schema.sql` 내용을 Dashboard → SQL Editor에 붙여 실행(한 번에). SQL Editor는 postgres 역할이라 `auth` 스키마 함수·storage 정책 생성 권한 있음.

> 두 방법 모두 **재시도 시엔 반드시 먼저 `db reset`(또는 프로젝트 새로 생성)** — 초기 정책 파일들이 재실행 시 `42710 policy already exists`로 실패함.

### 적용 검증

```bash
# 핵심 테이블/함수 존재 확인 (service_role 키로, <REF>/<SRK> 치환)
URL="https://<NEW_REF>.supabase.co"; SRK="<service_role_key>"
for t in users personal_color_assessments skin_analyses integrated_analysis_sessions safety_profiles; do
  echo -n "$t -> "; curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: $SRK" -H "Authorization: Bearer $SRK" "$URL/rest/v1/$t?select=id&limit=1"
done   # 200/206 기대(빈 테이블도 200). 404면 미생성
# persona_profile 컬럼(20260424)
curl -s -H "apikey: $SRK" -H "Authorization: Bearer $SRK" "$URL/rest/v1/users?select=persona_profile&limit=1"
```

---

## STEP 3. 🙋 Clerk ↔ Supabase 인증 연동

> 코드가 `accessToken()` + `getToken({template:'supabase'})`를 쓰므로 **둘 다** 맞춰야 RLS가 통과함.

- [ ] **Supabase 측**: Dashboard → Authentication → Sign In / Providers → **Third-Party Auth → Add Clerk** → Clerk 도메인(`inviting-lamprey-83.clerk.accounts.dev`) 등록
- [ ] **Clerk 측**: Dashboard → JWT Templates → **`supabase`** 템플릿 존재 확인(없으면 생성). 클레임에 `sub`(=user id) 포함 — 기본 포함됨
- [ ] 검증: 로그인 후 분석 1회 저장 시 RLS 통과(본인 row insert/select 성공)

---

## STEP 4. env 갱신 (로컬 + Vercel)

### 4-1. 🤖 로컬 `.env.local` (현재 2/5 묵음 + 죽은 URL)

`apps/web/.env.local`의 3개 값 교체:

```
NEXT_PUBLIC_SUPABASE_URL=https://<NEW_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new anon>
SUPABASE_SERVICE_ROLE_KEY=<new service_role>
```

(로컬엔 `SAFETY_ENCRYPTION_KEY` 누락 — 캡슐 안전프로필 쓰면 Vercel 값과 동일하게 추가)

### 4-2. 🤖 Vercel (printf로 줄바꿈 방지, 기존 값 rm 후 재등록)

```bash
cd c:/dev/yiroom
for K in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  vercel env rm $K production -y 2>/dev/null
done
printf 'https://<NEW_REF>.supabase.co' | vercel env add NEXT_PUBLIC_SUPABASE_URL production
printf '<new anon>'         | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
printf '<new service_role>' | vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

(Preview/Development 스코프도 쓰면 동일 반복. 배포 전 누락 3종 `CLERK_WEBHOOK_SECRET`·`NEXT_PUBLIC_SITE_URL`·`CRON_SECRET`은 도메인/배포 체크리스트 참조)

---

## STEP 5. 🤖 배포 + 검증

```bash
# 로컬에서 새 DB로 빌드/스모크 (FORCE_MOCK_AI=false로 실제 경로 확인하려면 임시 토글)
cd c:/dev/yiroom/apps/web && npm run build      # exit0 확인
# preview 배포
cd c:/dev/yiroom && git push origin main:release/launch-2026-06
# 스모크 후 prod
git push origin main
# 헬스 확인 (이제 진짜 DB라 정상이면 status ok가 의미 있음)
curl -s "https://yiroom.vercel.app/api/health/db-schema"
```

> ⚠️ `db-schema` 헬스는 에러를 "존재함"으로 간주하는 느슨한 코드라 **DB 죽어도 ok** 반환했었음(6/16 거짓양성 원인). 이제 진짜 DB가 붙으면 신뢰 가능하지만, 확실히 하려면 STEP 2 검증 curl(직접 REST 조회)을 신뢰할 것.

---

## 완료 게이트

```
□ <NEW_REF>.supabase.co REST 200 (users·integrated_analysis_sessions·safety_profiles)
□ users.persona_profile 컬럼 존재
□ Clerk third-party auth + JWT 템플릿 'supabase' 연동
□ 로그인 후 분석 1건 저장 → 본인 row 조회 성공 (RLS 통과)
□ env 로컬+Vercel 새 키로 교체
□ vercel.app 최신(262커밋) 배포 + db-schema 직접검증 통과
```

---

## 후속 (비차단)

- `affiliate_clicks`·`saved_outfits` 중복 마이그레이션 정리(스키마 드리프트 방지)
- 초기 정책 파일에 `DROP POLICY IF EXISTS` 가드 추가(재시도 내성)
- 도메인 `yiroom.app` + pk_live 전환은 별개 트랙 → `2026-06-16-domain-deploy-checklist.md` (도메인 미루면 vercel.app + dev Clerk로 충분)

관련: `2026-06-16-domain-deploy-checklist.md`, `2026-05-16-launch-execution-runbook.md`, 메모리 `prod-infra-state-2026-06-16.md`
