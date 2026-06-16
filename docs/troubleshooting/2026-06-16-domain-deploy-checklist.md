# 도메인 구매 → 프로덕션 배포 복붙 체크리스트 (yiroom.app)

> **작성**: 2026-06-16 | **목표**: `yiroom.app` 구매 직후 따라가면 라이브 웹 + Clerk pk_live + 가입 동기화까지 완성
> **전제**: 로컬 main이 origin 대비 262커밋 ahead, `next build` exit0 (코드는 준비됨). 실질 작업 = 도메인·Clerk·env·DB 마이그레이션.
> **임계 리드타임**: Clerk 커스텀 도메인(CNAME) + pk_live 검증 = 최대 24~48h → 도메인 구매는 가장 먼저.

표기: 🙋 = 사용자(대시보드/결제) / 🤖 = 내가 실행 가능 / ⏳ = 외부 검증 대기

---

## 0. 사전 확인 (구매 전 1분)

```bash
# 현재 배포 대상 프로젝트/계정 확인 (메모리상 프로젝트 ID 충돌 → 실측 우선)
vercel whoami
vercel project ls
# → 배포 타깃 프로젝트명/ID를 여기 기록: ____________________
```

---

## STEP 1. 🙋 도메인 구매 (오전, 최우선)

- [ ] 레지스트라에서 `yiroom.app` 구매 (Cloudflare Registrar / Namecheap / 가비아 등)
- [ ] 구매 후 **DNS 관리 콘솔 접근 가능** 확인 (A/CNAME 레코드 추가 권한)
- 비용: ~1.5만원/년. `.app`은 HSTS preload 강제(자동 HTTPS) — 별도 작업 없음.

> 구매만 끝나면 STEP 2~3은 DNS 레코드 추가 → 검증 대기. 그동안 STEP 4(DB)·STEP 6(env) 병행 가능.

---

## STEP 2. Vercel 도메인 연결

- [ ] 🙋 Vercel Dashboard → 배포 프로젝트 → Settings → Domains → `yiroom.app` 추가
- [ ] 🙋 Vercel이 안내하는 레코드를 레지스트라 DNS에 등록:
  - apex(`yiroom.app`): A 레코드 `76.76.21.21` (Vercel 안내값 그대로)
  - `www.yiroom.app`: CNAME → `cname.vercel-dns.com`
- [ ] ⏳ Vercel Domains 화면에 `Valid Configuration` 뜰 때까지 대기 (보통 수분~수십분)

```bash
# 검증 (DNS 전파 확인)
nslookup yiroom.app 8.8.8.8
```

---

## STEP 3. Clerk 프로덕션 인스턴스 (pk_live)

> dev 인스턴스(`pk_test`)는 100명 상한 + dev 배너 → 프로덕션 전환 필수. **커스텀 도메인 필요**.

- [ ] 🙋 Clerk Dashboard → 우상단 환경 전환 → **Production** 인스턴스 생성/선택
- [ ] 🙋 Production → Domains → `yiroom.app` 등록 → Clerk가 주는 **CNAME 레코드 세트**(보통 `clerk`, `accounts`, `clkmail`, `clk._domainkey` 등)를 레지스트라 DNS에 추가
- [ ] ⏳ Clerk가 도메인 `Verified` 표시할 때까지 대기 (최대 24~48h — **이게 임계 경로**)
- [ ] 🙋 Production → API Keys에서 복사:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
  - `CLERK_SECRET_KEY` = `sk_live_...`

### 3-1. Clerk 웹훅 (가입자 → Supabase 동기화, **필수**)

> 누락 시 신규 가입자가 `users` 테이블에 안 들어감 → **가입 지표 깨짐**. 핸들러는 이미 구현됨([route.ts](../../apps/web/app/api/webhooks/clerk/route.ts)).

- [ ] 🙋 Clerk **Production** → Webhooks → Add Endpoint
  - URL: `https://yiroom.app/api/webhooks/clerk`
  - Events: `user.created`, `user.updated`, `user.deleted`
- [ ] 🙋 생성된 **Signing Secret**(`whsec_...`) 복사 → `CLERK_WEBHOOK_SECRET`

```bash
# 웹훅 엔드포인트 헬스체크 (배포 후 — secret 등록되면 configured)
curl -s https://yiroom.app/api/webhooks/clerk
# 기대: {"status":"configured", ...}  (missing_secret이면 env 누락)
```

---

## STEP 4. 🤖 DB — 재생성 필요 (배포 전 필수)

> 🔴 **2026-06-16 정정**: 기존 프로덕션 Supabase `ihlrjhqyopjmhqvjnnnu`가 **삭제됨**(NXDOMAIN, 무료 티어 장기 pause 자동삭제). "기존 DB에 마이그 2개 적용"은 더 이상 유효하지 않음 → **DB를 처음부터 재생성**해야 함.
>
> ❌ 이전 가정(아래)은 폐기: ~~출시 필수 마이그 2개(`20260423`/`20260424`)만 SQL Editor 수동 적용~~ — 적용할 기존 DB 자체가 없음.

- [ ] 🙋 신규 Supabase 프로젝트 생성 (Seoul 리전)
- [ ] 🤖 `apps/web/supabase/migrations/` 87개 전체 적용 (`supabase db push` 또는 SQL Editor 결합)
- [ ] 🤖 블로커 픽스 적용 확인: `00000000000003_auth_get_user_id.sql` (2026-06-16 추가, 클린 적용 보장)
- [ ] 🙋 Clerk third-party auth + JWT 템플릿 `supabase` 연동
- [ ] 🤖 새 URL/anon/service_role 키를 로컬 `.env.local` + Vercel 양쪽 갱신

> **상세 절차 → [2026-06-16-db-recreation-runbook.md](./2026-06-16-db-recreation-runbook.md)** (STEP 1~5, 검증 curl, 완료 게이트)

---

## STEP 5. Vercel 환경변수 등록

> ⚠️ `vercel env add`는 `echo` 사용 시 `\n`이 붙음 → `printf` 사용. Production 스코프로 등록.

```bash
# Clerk (pk_live / sk_live — STEP 3에서 복사)
printf 'pk_live_xxx'  | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
printf 'sk_live_xxx'  | vercel env add CLERK_SECRET_KEY production
printf 'whsec_xxx'    | vercel env add CLERK_WEBHOOK_SECRET production

# 사이트 URL (sitemap/robots/OG에서 사용)
printf 'https://yiroom.app' | vercel env add NEXT_PUBLIC_SITE_URL production

# Cron 인증 (soft/hard delete cron 401 방지)
printf "$(openssl rand -hex 32)" | vercel env add CRON_SECRET production

# AI 실제 호출 (Mock 끄기 — 이미 false면 생략)
printf 'false' | vercel env add FORCE_MOCK_AI production
```

기존 등록 확인 (Supabase·Gemini 키는 이미 있어야 함):

```bash
vercel env ls production
# 필수 6종 체크: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#   SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GENERATIVE_AI_API_KEY
# + 신규 4종: CLERK_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL, CRON_SECRET, FORCE_MOCK_AI
```

---

## STEP 6. 🤖 배포 (preview → 스모크 → prod)

> Clerk `Verified` + DB 마이그레이션 + env 등록 **3개 모두 끝난 뒤** 진행.

```bash
# 1) preview 먼저 (release 브랜치 push → Vercel preview 자동 빌드)
git push origin main:release/launch-2026-06

# 2) preview URL 스모크 (Vercel 대시보드/CLI에서 preview URL 확보)
for r in / /home /sign-in /beauty; do
  echo -n "$r: "; curl -s -o /dev/null -w "%{http_code}\n" "https://<preview-url>$r"
done
# 기대: / /home /beauty = 200, /sign-in = 200

# 3) 이상 없으면 prod 배포
git push origin main

# 4) 프로덕션 스모크
for r in / /home /sign-in /beauty; do
  echo -n "$r: "; curl -s -o /dev/null -w "%{http_code}\n" "https://yiroom.app$r"
done
curl -sI https://yiroom.app/home | grep -i x-clerk   # Clerk 헤더 정상 동작 확인
curl -s  https://yiroom.app/api/webhooks/clerk        # → configured
```

---

## STEP 7. 🙋 실제 가입 플로우 E2E (지표 수집 전 1회)

- [ ] `https://yiroom.app/sign-up`에서 실제 신규 가입 1건
- [ ] Supabase `users` 테이블에 해당 `clerk_user_id` row 생성 확인 (= 웹훅 동작 증명)
- [ ] PC-1 또는 S-1 분석 1회 수행 → 결과 저장 확인 (= FORCE_MOCK_AI=false + DB 정상)

---

## 완료 게이트

```
□ yiroom.app 200 응답 (apex + /home + /beauty)
□ Clerk pk_live 동작 (dev 배너 없음)
□ 신규 가입 → Supabase users 동기화 확인
□ /api/webhooks/clerk → configured
□ 분석 1회 실제 동작 (Mock 아님)
```

이 게이트 통과 = "라이브 웹 + 지표 수집 시작 가능" → 6/18부터 애널리틱스 부착 단계로.

---

## 막힐 때

- Clerk 도메인 Verified 지연: DNS 전파 확인 `nslookup clerk.yiroom.app 8.8.8.8`, Clerk 대시보드 레코드 재확인. 48h 넘으면 Clerk 지원 문의.
- `.dev`/`.app` DNS 차단(SK Broadband): Google DNS(8.8.8.8) 사용 — `.app`은 보통 무관하나 증상 시 참고.
- 빌드 캐시 불일치: `vercel --prod --force`
- Clerk Error 1016: Cloudflare Worker 장애, `curl -4`로 직접 테스트(530이면 Clerk 측 복구 대기)

관련: [2026-05-16-launch-execution-runbook.md](./2026-05-16-launch-execution-runbook.md), [2026-04-26-launch-qa-master-checklist.md](./2026-04-26-launch-qa-master-checklist.md)
