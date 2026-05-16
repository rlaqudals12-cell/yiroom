# 출시 실행 런북 (2026-05-16)

> 2달 공백 복귀 후 정밀 점검 + 출시 실행 가이드.
> **2026-04-26 QA 마스터 체크리스트의 부정확 부분(§4.1 마이그레이션 목록, cron, lint 경로)을 교정**한 실행본.
> 사용자 결정: **동결 해제 → 출시 진행**, **preview 먼저** 시퀀싱, **실행 가이드 제공** 방식.
> 실행 순서: **로컬 웹·앱 검증 → 버셀 복구 → 앱 출시** (§2.5).

---

## 0.5 UX 정밀 감사 + P0/P1 수정 (2026-05-16, yiroom-ui-validator)

로컬 검증 중 `yiroom-ui-validator`로 웹 브랜드/UX 감사 → **ADR-098 P0 위반 6건 발견·수정**.
기술 검증(typecheck/test/build)은 통과했었으나 레거시 화면의 W/N/OH 누수는 미커버였음.

| #    | 위반                                            | 수정                                                          |
| ---- | ----------------------------------------------- | ------------------------------------------------------------- |
| P0-1 | `/analysis` 허브에 구강건강 카드 → 404          | health 카테고리·oral CSS 변수 제거, 정확히 5축만              |
| P0-2 | posture(5축 외) 분석허브·Navbar 노출, →/workout | posture/layout redirect + 진입점 제거 (§2.4.1 ADR)            |
| P0-3 | C-1 결과 ContextLinkingCard → 운동/영양 추천    | body 연결을 5축(PC·헤어)으로 교체, posture/oral 키 제거       |
| P0-4 | C-1 결과 "체형별 추천 운동 기구" 쇼핑           | RecommendedProducts에서 body 케이스·호출 제거                 |
| P0-5 | `/capsule` 9도메인에 영양/운동/구강             | DOMAINS 6개로 축소 + `[domain]` notFound 가드                 |
| P0-6 | 홈 분석요약 oral 6번째 카운트 → "5/6" 고착·404  | useAnalysisStatus oral 전면 제거, TOTAL 6→5, progress total 5 |

P1: 캡슐 "웰니스"→"스타일" 카피, GrowingNextStep Dumbbell→User 아이콘,
ScanningAnimation `tooth` 제거, capsule-daily·og 라벨맵 잔재 정리.

**출시 후 정리(비블로커, typed dead-path)**: `lib/insights/types.ts`·`ActiveInsightCard`의
`AnalysisModule` `'oral_health'` — 데이터 흐름 차단되어 도달 불가, 타입 cascade 회피 위해 보류.

### 0.5.1 반복 재감사로 추가 발견·수정 (2~4차)

| 차수     | 발견                                                                                                                  | 수정                                                                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2차 P0-A | `not-found.tsx` 운동/영양 추천 카드                                                                                   | 피부·헤어(5축) 카드로 교체                                                                                                                                                                                                                             |
| 2차 P0-B | `/products` 탭·전체·검색에 영양제/운동기구/건강식품                                                                   | `search.ts` 화장품 전용(탭 3개·all·search 전부)                                                                                                                                                                                                        |
| 2차 P0-C | `/profile` 활동탭 운동/식단 연속기록                                                                                  | 섹션 `WELLNESS_PHASE2` 게이팅                                                                                                                                                                                                                          |
| 2차 P1   | sitemap `/products/recommended`·운동·영양·기록 색인                                                                   | 색인 제외                                                                                                                                                                                                                                              |
| 3차 P0-F | `/profile` 소셜탭 "영양/운동 순위" 리더보드 링크                                                                      | 두 링크 `WELLNESS_PHASE2` 게이팅                                                                                                                                                                                                                       |
| sweep    | `/leaderboard` 운동/영양 탭(전체순위로 도달)                                                                          | 탭·콘텐츠 게이팅 + grid-cols 동적, `/leaderboard/{workout,nutrition}/layout` redirect                                                                                                                                                                  |
| sweep    | `profile/badges` 빈상태 "운동 시작하기"→/workout                                                                      | "분석 시작하기"→/analysis                                                                                                                                                                                                                              |
| sweep    | `inventory/pantry` "레시피"→/nutrition/recipes                                                                        | `WELLNESS_PHASE2` 게이팅                                                                                                                                                                                                                               |
| 3차 P1-G | `/wellness`(폐기 갈래C) sitemap 색인 + 가드 없음                                                                      | `wellness/layout` redirect + sitemap 제거                                                                                                                                                                                                              |
| 보강     | `/products/recommended` orphan 직접 URL                                                                               | `recommended/layout` redirect 가드                                                                                                                                                                                                                     |
| 4차 P0-H | 온보딩 튜토리얼 기본 스텝에 운동/영양 + "웰니스 플랫폼" 카피 (autoStart, 첫인상)                                      | `DEFAULT_TUTORIAL_STEPS`에서 workout/nutrition 스텝 제거(6→4), welcome/products/complete 카피 5축·슬로건 정렬, JSDoc 갱신                                                                                                                              |
| 5차 P0-I | `/profile/settings` 운동/식사 알림 리마인더 + "운동·영양 기록 공개" 미게이팅 (나 탭 핵심 동선)                        | settings 운동 섹션·식사 섹션·활동공개 항목 `WELLNESS_PHASE2` 게이팅, FEATURE_FLAGS import                                                                                                                                                              |
| 5차 P1-J | `ProgressiveProfilePrompt` body 필드 "운동 추천의 안전성" 카피 (C-1 결과)                                             | description→"체형 분석과 스타일 제안의 정확도", accuracyBoost→"정확한 체형 분석" (데이터 필드 유지)                                                                                                                                                    |
| 6차 P0-K | `/chat` AI코치 `DEFAULT_QUESTIONS`에 "체형 운동 추천"·"단백질 섭취량" 칩 (기능적 W/N 진입)                            | q3·q4를 5축("내 체형에 어울리는 코디"·"퍼스널컬러 메이크업")으로 교체                                                                                                                                                                                  |
| 6차 P2   | `chat/layout` + `leaderboard/page` metadata "웰니스/운동·영양" 카피                                                   | chat metadata 5축 정렬, leaderboard description "웰니스 여정"→"성장 기록과 순위" (재플래그 방지 위해 P2도 선제 정리)                                                                                                                                   |
| 7차 P0-L | `/coach` AI코치 운동/영양 카테고리 탭 + `QUICK_QUESTIONS`/persona/CoachHeader "웰니스·운동·영양" (분석 CTA 경유 도달) | ChatInterface 운동/영양 탭 `WELLNESS_PHASE2` 게이팅, `QUICK_QUESTIONS` 기본질문 5축 교체, system persona "AI 뷰티 코치·5축"으로, CoachHeader 카피 5축. `QUICK_QUESTIONS_BY_CATEGORY` workout/nutrition 키는 탭 게이팅으로 도달불가→데이터 유지(복원용) |

루트 원인: ADR-098 W/N 숨김이 1차 표면(홈/Nav/대시보드/주요 W·N 라우트)엔 적용됐으나
2차 표면(분석허브·캡슐·프로필 서브탭/설정·products·leaderboard·inventory·wellness·badges·온보딩·chat·coach)엔
미적용 + **`DEFAULT_*` 기본 상수 배열에 W/N 항목 시드**(온보딩 STEPS·chat QUESTIONS·coach QUICK_QUESTIONS) →
반복 감사 + 선제 sweep으로 전수 제거. 재감사 수렴: **6→3→1→1→1→1→1→0 (8차 최종)**.
✅ **8차 최종 판정: 출시 가능 — ADR-098 브랜드 감사 승인.** 사용자 도달 가능 전 표면에서
W/N/OH/posture 기능적 진입(링크·칩·토글·스텝·탭) **0건** (WELLNESS_PHASE2 게이팅 또는
redirect 가드). 잔여 P2(leaderboard "웰니스" 탭) 단건만 출시 후 처리, 차단 아님.
※ 감사 스코프 = ADR-098/브랜드 일관성 한정. 일반 UI/UX·성능·a11y·기능동작·사전 i18n
85건은 별도 출시 체크리스트(본 런북 §1~6) 항목.
잔여 P2(leaderboard "웰니스" 탭): wellness 스코어 복합지표·cascade 리스크 → 출시 후 카피 정렬(차단 아님).
**프로필("나") 트리가 반복 누락 표면** (page streak/leaderboard·badges·settings 각각 별도 게이팅 필요했음).
캡슐 daily/gap DOMAIN_COLORS의 W/N 잔재는 `registerAllDomains()` 미호출로 런타임 도달
불가(휴면 서브시스템, 사용자 비노출 확정 — 4차 감사). leaderboard "웰니스" 탭/메타는
복합지표라 순수 W/N 아님 → P2 출시 후 카피 정렬.

검증: web `tsc --noEmit` exit 0, `next build` exit 0, 변경 테스트 신동작 업데이트 통과
(ContextLinkingCard 13/13·search 43/43). 사전 i18n mock 실패 8건은 변경 모듈 미의존
교차확인 → 비블로커(메모리 85건). 4차 재감사로 최종 closure 확인.

---

## 0. 이번 세션 자동 검증 결과 (전부 그린 — 사용자 재실행 불필요)

| 검증                                                    | 결과                                         |
| ------------------------------------------------------- | -------------------------------------------- |
| `npm ci` 클린 설치                                      | ✅ exit 0 (2524 패키지)                      |
| Web/Mobile/Shared `tsc --noEmit`                        | ✅ 4/4, 0 에러 (turbo 캐시 미스 = 실제 실행) |
| 영향 영역 테스트 (BottomNav/Home/C-1/Beauty/Integrated) | ✅ 168/168 (167 pass + 1 skip)               |
| 스코프 lint (출시 핵심 UI)                              | ✅ exit 0                                    |
| `next build`                                            | ✅ exit 0, 전체 라우트 테이블 생성           |
| §3.4 v2 deprecated 라우트                               | ✅ 4/4                                       |
| §3.5 FEATURE_FLAGS 게이팅                               | ✅ 29곳                                      |
| W/N 라우트 redirect('/home')                            | ✅ 4/4 (record/workout/nutrition/reports)    |

→ 4/30 정리 커밋(체크리스트가 검증 못한 +252→+259 구간) **회귀 0건**. 코드는 출시 가능 상태.

---

## 1. 4/26 체크리스트 교정 사항

| 항목                        | 기존 기록                         | 실제 (검증됨)                                          | 조치                                |
| --------------------------- | --------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| Vercel Cron                 | "13→2개 정리 필요"                | 이미 2개 (`soft/hard-delete-users`)                    | **작업 불필요**                     |
| `20260422_drop_oral_health` | "GFSA 후 적용"                    | 마이그레이션 헤더: **"출시 후 4~8주"**                 | **출시 블로커 아님 → 출시 후 작업** |
| 출시 필수 마이그레이션      | "6개"                             | `20260423`+`20260424` 2개                              | 범위 축소                           |
| §3.1 lint 경로              | `components/analysis/integrated/` | `app/(main)/analysis/integrated/`                      | 경로 교정                           |
| FEATURE_FLAGS               | false 기대                        | ✅ `WELLNESS_PHASE2=false`, `CLOSET_INTEGRATION=false` | 정상                                |

링크 정보:

- Supabase 프로젝트: `ihlrjhqyopjmhqvjnnnu` (config.toml Postgres 17)
- Vercel: `.vercel/project.json` → projectId `prj_xY96P6bsGNKpsusF8pZEy4WwJTYu`, project `web`, Git 연동(main→production, release/\*→preview)
- EAS: app.json projectId `0e876253-c0e1-4cbe-a9e1-33207bae230a`, package `com.yiroom.app`, version 1.0.0

---

## 1.5 ⚠️ 실측 발견 — 프로덕션 RLS 패턴 divergence (2026-05-16)

Phase 4-A 실측 결과, **프로덕션 DB는 코드베이스 마이그레이션 가정과 다름**:

| 구분                      | 코드베이스 로컬 마이그레이션            | 프로덕션 DB (실측)                                     |
| ------------------------- | --------------------------------------- | ------------------------------------------------------ |
| RLS user-id 매칭          | `(SELECT auth.get_user_id())` 함수 패턴 | **`(auth.jwt() ->> 'sub'::text)` 직접 추출 (구 패턴)** |
| `auth.get_user_id()` 함수 | 존재 가정                               | **존재하지 않음** (`42883` 에러)                       |

- 프로덕션은 `202601070200_unify_jwt_extraction` 류 RLS 리팩터가 **적용된 적 없음**. 기존 모든 테이블(`skin_analyses` 등)이 구 패턴으로 정상 작동 중, 배포된 앱도 이 상태로 동작.
- **결론**: 프로덕션에 마이그레이션 적용 시 RLS는 반드시 `auth.jwt() ->> 'sub'::text` 로 작성. `auth.get_user_id()` 사용 마이그레이션은 그대로 적용하면 `42883` 실패.
- 이번 launch 범위(`20260423` 1개만 RLS 보유)는 아래 4-B에서 패턴 교체본으로 적용함. 로컬 마이그레이션 파일은 원본 유지(과거 마이그레이션 재작성은 anti-pattern) — divergence는 본 문서로 추적.
- 후속(출시 후): 프로덕션 RLS 표준화 여부 별도 결정 (`auth.get_user_id()` 생성 + 점진 통일 vs 구 패턴 유지). 현재는 범위 외.

---

## 2. Phase 4 — 출시 인프라 (사용자 자격증명 필요)

### 4-A. 실제 적용 마이그레이션 확인 ✅ 완료 (2026-05-16)

CLI 인증 없음 → Dashboard SQL Editor 직접 조회로 진행. 실측 결과:

- `integrated_analysis_sessions` 테이블 **없음**, `persona` 컬럼 **없음** → `20260423`/`20260424` 미적용 (예상대로)
- `oral_health_assessments` **존재** → 3/04 동결 상태 확정, drop 미실행
- `skin_analyses` RLS = `(clerk_user_id = (auth.jwt() ->> 'sub'::text))` → 프로덕션 구 패턴 (위 §1.5)

> 참고: `npx supabase migration list`/`db push`는 `supabase login`(access token) + DB 비번 필요. 미인증이면 본 Dashboard 경로 사용.

### 4-B. 출시 필수 마이그레이션 적용 ✅ 완료 (2026-05-16) — Dashboard SQL Editor 수동

`db push` **사용 안 함** (파괴적 `20260422_drop_oral_health` 끌려옴 + 미인증 + RLS 패턴 불일치).
Dashboard SQL Editor에서 RLS를 **프로덕션 패턴(`auth.jwt() ->> 'sub'::text`)으로 교체**한 `20260423` → `20260424` 순서로 수동 적용.

- `20260423`: 테이블 + 2 인덱스 + RLS 5정책(패턴 교체) + 5개 분석테이블 `session_id` FK + 5 부분인덱스 — **성공**
- `20260424`: `integrated_analysis_sessions.persona JSONB` 컬럼 — (적용 중)
- 검증: `integrated_table=integrated_analysis_sessions`, `persona_col=1`, `rls_policies=5` 기대

> `20260422_drop_oral_health.sql`은 **파괴적(DROP TABLE)** + 헤더 "출시 후 4~8주" → **적용 안 함** (출시 후 작업).
> 롤백: `apps/web/supabase/migrations/rollback/20260423_*_rollback.sql`, `20260424_*_rollback.sql`

### 4-C. Storage 버킷 `integrated-sessions` 생성 ⛔ 사용자 실행 (Dashboard)

업로드 경로 패턴: `{clerkUserId}/{sessionId}/{face|body}.{ext}`, 서버(service_role)에서 업로드.

Supabase Dashboard → Storage → New bucket:

- Name: `integrated-sessions`
- **Public: OFF** (private)

SQL Editor에서 RLS 정책:

```sql
-- 서버(service_role) 전체 접근 (업로드/삭제) — 20260423에서 검증된 표현식 재사용
CREATE POLICY "integrated_sessions_service_all"
ON storage.objects FOR ALL
USING (bucket_id = 'integrated-sessions' AND current_setting('role', true) = 'service_role')
WITH CHECK (bucket_id = 'integrated-sessions' AND current_setting('role', true) = 'service_role');

-- 본인 폴더만 조회 (clerk_user_id = 경로 첫 세그먼트) — ★프로덕션 RLS 구 패턴 (§1.5)
CREATE POLICY "integrated_sessions_owner_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'integrated-sessions'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'::text)
);
```

> ⚠️ `auth.get_user_id()`/`auth.role()` 사용 금지 — 프로덕션에 없음(§1.5). 위는 교정본.

### 4-D. Vercel 환경변수 점검 ⛔ 사용자 실행

Vercel Dashboard → web 프로젝트 → Settings → Environment Variables (Production):

- `FORCE_MOCK_AI` → **'true' 가 아니어야 함** (미설정 또는 `false`). 코드 기본값은 실제 AI 호출.
- 필수: `GOOGLE_GENERATIVE_AI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL=https://yiroom.vercel.app`

### 4-E. EAS 환경변수 ⛔ 사용자 실행

`lib/api/integrated.ts`는 `EXPO_PUBLIC_YIROOM_API_URL`을 fallback 없이 사용 → 미설정 시 통합 분석 모바일 실패.

```bash
cd /c/dev/yiroom/apps/mobile
eas env:create --name EXPO_PUBLIC_YIROOM_API_URL --value https://yiroom.vercel.app \
  --environment production --environment preview
eas env:list
```

---

## 2.5 ⚙️ 실행 순서 재정렬 (2026-05-16, 사용자 결정)

사용자 요청: **로컬에서 웹·앱 다 검증 → 버셀 복구 → 마지막 앱 출시**.

| 단계                      | 내용                                          | 상태                             |
| ------------------------- | --------------------------------------------- | -------------------------------- |
| 4-A/B/C                   | DB 마이그레이션 + Storage 버킷                | ✅ 완료 (프로덕션 Supabase 반영) |
| **A. 웹 로컬 검증**       | `npm run dev` + 통합 분석 플로우 + §1/§2 QA   | 진행                             |
| **B. 앱 에뮬레이터 검증** | Android 에뮬레이터 §1.3/§2.3 (웹 다음)        | 대기                             |
| **C. 버셀 복구**          | 4-D(Vercel env) → 아래 Phase 5 (preview→prod) | 로컬 통과 후                     |
| **D. 앱 출시**            | 4-E(EAS env) → Phase 6 EAS prod → 스토어      | 마지막                           |

→ **4-D / Phase 5(버셀)는 C단계로 보류.** 4-E(EAS env)는 D단계.
로컬 Supabase 인프라(DB/버킷)는 이미 프로덕션 반영돼 로컬 웹에서 통합 분석 실검증 가능.

---

## 3. Phase 5 — 동결 해제 + preview 먼저 배포 (C단계에서 실행)

```bash
cd /c/dev/yiroom
# 1) release 브랜치로 push → Vercel preview 자동 배포
git push origin main:release/launch-2026-05

# 2) Vercel Dashboard에서 preview URL 확인 → 스모크 테스트
#    - 랜딩(/), /home, 통합 분석 입력→결과, /beauty 큐레이션
#    - §1/§2 핵심 항목 (아래 6장)

# 3) preview 통과 시 production
git push origin main          # Vercel이 main → production 자동 배포

# 4) 검증
curl -sI https://yiroom.vercel.app/home | head -3   # 200 기대
```

> Vercel Cron은 이미 2개 → Free 플랜 제한 OK, 추가 정리 불필요.

---

## 4. Phase 6 — 모바일 EAS

```bash
cd /c/dev/yiroom/apps/mobile
# Preview APK (실기기 QA)
eas build --profile preview --platform android   # apk, channel preview

# 실기기 설치 후 §1.3/§2.3 (탭바 4개, W/N 숨김, 통합 분석, 큐레이션) 검증

# 통과 시 Production AAB + 스토어 제출
eas build --profile production --platform android   # app-bundle
eas submit --platform android --profile production   # track: production
```

> Windows `eas build --local` 미지원 → 클라우드 빌드. APK 재설치 시 `adb uninstall` 후 install.

---

## 5. 출시 후 작업 (이번 범위 외)

| 작업                                    | 시점                                |
| --------------------------------------- | ----------------------------------- |
| `20260422_drop_oral_health` 적용        | 출시 후 4~8주 (트래픽 안정화 후)    |
| Phase 1.5 (나 프로필 카드 / 웹 옷장 UI) | 출시 후 4~8주 (SDD 작성 완료)       |
| i18n mock 깨진 테스트 85건 정비         | 출시 후 점진                        |
| 캡슐/CA/모더레이션/위젯 마이그레이션    | 해당 기능 활성화 시 (flag off 상태) |
| `develop` 브랜치 정리                   | 출시 후 (main이 298 앞섬)           |
| 프라이머 29기 지원 (≈6월 모집)          | 출시 후 트랙션 확보하여             |

---

## 6. 사용자 수동 QA 참조 (49항목)

[2026-04-26 체크리스트](./2026-04-26-launch-qa-master-checklist.md) §1(ADR-098 정체성 27항목)·§2(통합 분석 22항목) 그대로 사용.
단 §0/§4.1/§3.1은 본 런북 0·1·2장으로 대체.

---

**Created**: 2026-05-16 | **Supersedes**: 2026-04-26 체크리스트 §0/§3.1/§4.1
