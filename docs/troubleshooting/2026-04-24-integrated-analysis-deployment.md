# 통합 분석 플로우 배포 체크리스트 — Phase A~G 배포 준비

> **날짜**: 2026-04-24 (Phase G 보강: 2026-04-24)
> **영향 파일**: Supabase Storage 버킷, DB 마이그레이션, EAS 환경변수, Next.js 런타임, Gemini API 연결
> **심각도**: 중간 (수동 작업 5건 누락 시 통합 분석 또는 큐레이션 체험이 무너짐)
> **상태**: ⏳ 배포 대기

---

## 개요

Phase A~E(ADR-099~103)로 **통합 분석 플로우 전체**가 완성됐지만, 실제 배포를 위해서는 **코드 외 수동 작업 3건**이 필요합니다. 이 문서는 순서대로 수행하면 되는 체크리스트입니다.

**완성된 코드**:

- 웹 `POST /api/analyze/integrated` + 입력/결과 페이지 + CORS
- 모바일 `/(analysis)/integrated/*` + HTTP 클라이언트 + 재방문 훅
- 45 ATOM, 61 tests pass, typecheck/lint 0

**남은 수동 작업**:

1. Supabase Storage 버킷 생성
2. DB 마이그레이션 적용
3. 모바일 환경변수 설정 + EAS 재빌드

---

## 1. Supabase Storage 버킷 생성

### 왜 필요한가

통합 분석 시 얼굴/전신 이미지를 Storage에 업로드 → 서명된 URL로 결과 페이지에서 표시. 버킷 없으면 **첫 분석 요청에서 즉시 실패**.

### 수행 방법

Supabase Dashboard에서 수동 생성 (SQL 마이그레이션으로는 버킷 생성 불가):

1. **Dashboard 진입**: https://supabase.com/dashboard/project/{PROJECT_ID}/storage/buckets
2. **New bucket** 클릭
3. 설정:
   | 항목 | 값 |
   | --- | --- |
   | Bucket name | `integrated-sessions` |
   | Public bucket | ❌ **OFF** (private) |
   | File size limit | `5 MB` |
   | Allowed MIME types | `image/jpeg, image/png, image/webp` |

### 버킷 RLS 정책 (Dashboard Policies 탭)

버킷 생성 후 Storage → Policies에서 다음 정책 추가:

```sql
-- service_role 전체 접근 (API 라우트에서 업로드)
CREATE POLICY "service_role_all_integrated_sessions"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'integrated-sessions'
    AND current_setting('role', true) = 'service_role'
  );

-- 본인 객체만 조회 (서명된 URL 발급을 위해)
CREATE POLICY "user_select_own_integrated_sessions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'integrated-sessions'
    AND (storage.foldername(name))[1] = (SELECT auth.get_user_id())
  );
```

> 경로 패턴: `{clerkUserId}/{sessionId}/face.jpg`, `body.jpg`
> `(storage.foldername(name))[1]`로 첫 번째 폴더(clerkUserId) 기준 접근 제어.

### 검증

```bash
# Service Role 키로 업로드 테스트
curl -X POST "https://{PROJECT_ID}.supabase.co/storage/v1/object/integrated-sessions/test/face.jpg" \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}" \
  -H "Content-Type: image/jpeg" \
  --data-binary @sample.jpg
# 200 OK + 경로 반환 확인

# 업로드 후 삭제
curl -X DELETE "https://{PROJECT_ID}.supabase.co/storage/v1/object/integrated-sessions/test/face.jpg" \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}"
```

---

## 2. DB 마이그레이션 적용

### 왜 필요한가

통합 세션을 저장하는 `integrated_analysis_sessions` 테이블 + 기존 5개 분석 테이블의 `session_id` FK가 없으면 **세션 생성 INSERT가 실패**.

### 대상 파일

```
apps/web/supabase/migrations/20260423_integrated_analysis_sessions.sql
apps/web/supabase/migrations/rollback/20260423_integrated_analysis_sessions_rollback.sql
```

### 수행 방법

**선택 A: Supabase CLI (권장)**

```bash
cd apps/web
npx supabase link --project-ref {PROJECT_ID}  # 최초 1회
npx supabase db push
```

**선택 B: 대시보드 SQL Editor**

1. Supabase Dashboard → SQL Editor
2. `apps/web/supabase/migrations/20260423_integrated_analysis_sessions.sql` 내용 복사 → 실행
3. 에러 없으면 적용 완료

### 검증

```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'integrated_analysis_sessions';

-- session_id FK 컬럼 확인
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'session_id'
  AND table_name IN (
    'personal_color_assessments',
    'skin_analyses',
    'body_analyses',
    'hair_analyses',
    'makeup_analyses'
  );
-- 5행 반환 확인

-- RLS 정책 확인
SELECT policyname FROM pg_policies
WHERE tablename = 'integrated_analysis_sessions';
-- 5개 이상 (select_own, insert_own, update_own, delete_own, service_role_all)
```

### 롤백 (필요 시)

```bash
psql $DATABASE_URL -f apps/web/supabase/migrations/rollback/20260423_integrated_analysis_sessions_rollback.sql
```

### 주의 사항

- **기존 누적 마이그레이션과 함께 적용**: MEMORY에 기록된 다른 대기 마이그레이션(캡슐 `20260305`, ConnectionAwareness `20260307`, 모더레이션 `20260309`, 위젯순서 `20260313`)도 이 시점에 함께 적용해야 함
- **GFSA 심사 기간 후**: 자동 배포 비활성화 상태(2026-03-04 설정) 복원 시 함께 해제

---

## 3. 모바일 환경변수 설정 + EAS 재빌드

### 왜 필요한가

모바일 앱이 웹 API(`/api/analyze/integrated`)를 호출하려면 **base URL**이 필요합니다. 환경변수 없으면 `IntegratedApiError: CONFIG_ERROR`로 앱이 즉시 실패.

### 3.1 로컬 개발 환경

```bash
# apps/mobile/.env
EXPO_PUBLIC_YIROOM_API_URL=http://10.0.2.2:3000  # Android 에뮬레이터가 호스트 머신 localhost 접근
# 또는
EXPO_PUBLIC_YIROOM_API_URL=http://192.168.x.x:3000  # 실기기 (호스트 Wi-Fi IP)
```

### 3.2 프로덕션 (EAS)

```bash
cd apps/mobile

# 프로덕션 프로필에 환경변수 등록
eas env:create \
  --scope project \
  --name EXPO_PUBLIC_YIROOM_API_URL \
  --value "https://yiroom.app" \
  --environment production

# Preview 프로필도 동일
eas env:create \
  --scope project \
  --name EXPO_PUBLIC_YIROOM_API_URL \
  --value "https://yiroom.app" \
  --environment preview

# 환경변수 확인
eas env:list
```

### 3.3 EAS 재빌드

```bash
# 프로덕션 AAB
eas build --profile production --platform android

# 개발 APK (QA)
eas build --profile preview --platform android
```

### 검증

빌드 완료 후 APK 설치 → 앱 실행 → 홈 "5축 한 번에 알아보기" 클릭:

- ✅ 입력 페이지가 정상 표시되면 환경변수 주입 성공
- ❌ "API 서버 주소가 설정되지 않았어요" 에러 메시지 → `eas env:list` 재확인

---

## 4. 최종 E2E 수동 검증

배포 후 프로덕션 환경에서 전체 플로우 검증:

### 4.1 웹 검증

```bash
# 1. Preflight CORS
curl -X OPTIONS https://yiroom.app/api/analyze/integrated -I
# 204 + Access-Control-Allow-Origin: * 확인

# 2. 웹 브라우저 플로우
# - https://yiroom.app 접속
# - "무료 퍼스널컬러 진단 시작" (SignInButton) → 로그인 완료 후 /analysis/integrated 리다이렉트 확인
# - 셀카 업로드 + 자가입력 → 제출 → 10초 내 결과 페이지 진입
# - 결과 페이지 URL 북마크 후 재방문 → 동일 결과 표시 (Server Component 조회)
```

### 4.2 모바일 검증 (실기기)

- 로그인 후 홈 → "5축 한 번에 알아보기 (약 2분)" 탭
- 갤러리에서 얼굴 셀카 선택 → 자가입력 → 제출
- 10초 로딩 → 결과 화면 (5축 요약 카드 + Partial Success 배너 있으면 표시)
- 앱 재시작 후 결과 URL 복귀 (딥링크 또는 재방문) → Supabase 조회로 결과 복원 확인

### 4.3 Partial Success 시나리오 (선택)

일부러 전신 사진 없이 + 자가입력 키/몸무게도 비움으로 제출:

- 결과 페이지에 `PartialSuccessBanner` 표시
- "체형 미완료" 메시지 + "다시 시도" 버튼 노출
- 버튼 클릭 시 `/analysis/integrated` 새 세션 시작

---

## 5. 배포 순서 권장

순서대로 수행하면 리스크 최소화:

```
[1] Supabase Storage 버킷 생성 + RLS 정책
       ↓
[2] DB 마이그레이션 적용 (로컬 먼저 → supabase db diff 검증 → 프로덕션)
       ↓
[3] Vercel 프로덕션 배포 (코드 push + build)
       ↓ (웹만 먼저 검증)
[4] 웹 E2E 수동 검증 (§4.1)
       ↓
[5] 모바일 EAS env 설정 + production 빌드
       ↓
[6] APK Internal Track 업로드 → 실기기 검증 (§4.2)
       ↓
[7] Google Play Production 승격
```

---

## 6. 롤백 계획

### 전체 롤백 (Storage + DB + 코드)

```bash
# 1. Vercel 이전 배포로 롤백
npx vercel rollback {PREV_DEPLOYMENT_URL}

# 2. DB 롤백
psql $DATABASE_URL -f apps/web/supabase/migrations/rollback/20260423_integrated_analysis_sessions_rollback.sql

# 3. Storage 버킷 유지 (삭제 시 데이터 손실) — 보통 롤백 대상 아님
```

### 부분 롤백 (CTA만)

통합 플로우는 유지하되 랜딩/홈 CTA만 원복 시:

- `apps/web/app/LandingContent.tsx` → SignInButton `forceRedirectUrl` 제거
- `apps/web/app/(main)/home/_components/NewUserHero.tsx` → 통합 CTA → PC/S 2개 CTA 복원
- 데이터 영향 없음, Git revert 1개 커밋

---

## 7. Phase F — 비전 완성 기능 수동 검증 (ADR-104 5개 기준)

Phase F에서는 ADR-104 "출시 조건 체크리스트" 5개가 모두 코드로 반영됐습니다. 프로덕션에서는 **안전장치 FORCE_MOCK_AI를 끄고** 실제 Gemini 품질을 검증해야 합니다.

### 7.1 FORCE_MOCK_AI 전환

```bash
# 개발/테스트 기본값
FORCE_MOCK_AI=true  # Mock 결과만 반환 (Gemini 미호출)

# 프로덕션 전환
FORCE_MOCK_AI=false  # 또는 env에서 제거
```

- 위치: `apps/web/.env` → Vercel Project Settings → Environment Variables
- 영향 범위: `axis-adapters.ts` 4개 축 (PC/S/C/H) + `persona-composer.ts`
- 전환 후 반드시 §7.2 품질 검증 수행

### 7.2 비전 완성 5개 기준 검증

| #   | 기준                | 확인 방법                                       | 합격 기준                                               |
| --- | ------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| 1   | 나 프로필 내러티브  | 결과 페이지 최상단 `PersonaNarrativeCard`       | 자연스러운 2-3문장 요약, 축별 결과 반영됨               |
| 2   | 액션 플랜           | `ActionPlanCard` (now/this_week/this_month)     | 3개 구간 각 1개 이상 행동, 축 결과와 연결됨             |
| 3   | 실제 Gemini 호출    | DevTools Network `/api/analyze/integrated` 응답 | `usedFallback: false` for PC/S/C/H 각 축                |
| 4   | 축 간 연결 인사이트 | `CrossInsightsCard`                             | PC×S, PC×M, C×H, S×M, PC×C 조합 중 2개+ 카드 표시       |
| 5   | 통합 큐레이션       | `CurationCard`                                  | 1-3개 카드, 축 결과에 따라 립/베이스/스킨케어/옷장 추천 |

### 7.3 AI 품질 지인 블라인드 테스트 (권장)

ADR-104 기준 #3은 **"분석 결과가 실제로 나를 이해한다고 느끼는가?"** — 측정 방법:

1. 지인 3-5명에게 분석 요청 (본인과 무관한 사람)
2. 결과 공유 후 1-10점 평가 질문:
   - 퍼스널 컬러가 평소 잘 어울리는 색과 일치하나요?
   - 피부 분석이 자신이 느끼는 피부 상태와 가까운가요?
   - 페르소나 내러티브가 "나를 이해하는 말"로 느껴지나요?
3. 평균 7점 이상이면 출시 OK, 이하면 프롬프트 튜닝 또는 FORCE_MOCK_AI 유지

---

## 8. Phase G — 큐레이션 링크 동작 수동 검증

Phase G에서 `/beauty`와 `/closet/recommend`가 큐레이션 URL 파라미터를 파싱하도록 개선됐습니다. 배포 후 실제 동작 확인.

### 8.1 `/beauty` 파라미터 파싱

큐레이션 skincare 카드 클릭 플로우:

1. 결과 페이지 → `CurationCard`의 스킨케어 카드 클릭
2. 이동 URL 예시: `/beauty?category=skincare&focus=oil-control&source=integrated&session={UUID}`
3. 기대 동작:
   - 상단에 **"통합 분석 결과를 바탕으로 추천하는 제품이에요"** 배너 표시
   - 추천 탭 하위 대분류가 자동으로 **"스킨케어"** 선택
   - 추천 제품 그리드가 스킨케어 카테고리로 필터링됨

```bash
# 빠른 확인 (브라우저 콘솔)
window.location.href
# → /beauty?category=skincare&source=integrated&... 포함
# → DOM에 data-testid="beauty-integrated-banner" 존재 확인
```

### 8.2 `/beauty` 라이센스 무시 카테고리 (lip/base)

큐레이션의 `lip`, `base`는 `/beauty`의 mainCategory(cleansing/skincare/suncare/mask)에 매핑되지 않습니다 — 의도적 설계:

1. 립/베이스 카드 클릭 → `/beauty?category=lip&tone=warm&source=integrated&session=...`
2. 기대 동작:
   - 통합 배너는 **표시** (source=integrated 감지됨)
   - 대분류는 **"전체"** (매핑 불가, `all`로 fallback)
   - 카드의 title/reason이 이미 "코랄 립틴트가 어울려요" 등 정보 전달 → 사용자 실망 최소화

### 8.3 `/closet/recommend` 빈 옷장 우회

통합 분석 세션이 있는데 옷장이 비어있는 사용자 시나리오:

1. 결과 페이지 → outfit 카드의 CTA 문구 확인
2. 기대: **"먼저 옷장 등록하기"** (옷장이 있다면 "코디 보러가기")
3. 클릭 → `/closet/add?source=integrated&session={UUID}` 이동
4. `/closet/recommend`를 직접 URL로 방문 시(`?source=integrated&session=...`):
   - 옷장이 비어있으면 **"옷장을 먼저 등록해주세요"** 헤딩
   - CTA: **"먼저 옷장 등록하기"** 버튼이 `/closet/add?source=integrated&...`로 이동

### 8.4 옷장이 있는 사용자 경로

기존 유저로 옷장에 옷이 1벌 이상 등록된 경우:

1. outfit 카드 CTA: **"코디 보러가기"**
2. 이동 URL: `/closet/recommend?body=hourglass&tone=warm&source=integrated&session=...`
3. 기대: 기존 코디 추천 엔진 동작 (파라미터 자체는 아직 미활용, 후속 작업)

### 8.5 세션 추적 파라미터 보존 (어필리에이트 준비)

모든 큐레이션 링크는 `source=integrated&session={UUID}`를 포함. 향후 어필리에이트 기여도 계산에 활용:

```bash
# 결과 페이지 HTML 소스에서 확인
curl -s "https://yiroom.app/analysis/integrated/result/{SESSION_ID}" \
  | grep -o 'href="[^"]*source=integrated[^"]*"' | head -3
```

3개 이상 반환되면 큐레이션 카드 링크에 추적 파라미터 정상 포함.

---

## 9. 관련 문서

- [ADR-099](../adr/ADR-099-integrated-analysis-flow.md) — 통합 API 백엔드
- [ADR-100](../adr/ADR-100-integrated-analysis-ui.md) — 웹 UI
- [ADR-101](../adr/ADR-101-integrated-cta-unification.md) — 웹 CTA 일원화
- [ADR-102](../adr/ADR-102-mobile-integrated-porting.md) — 모바일 포팅
- [ADR-103](../adr/ADR-103-cross-origin-mobile-access.md) — CORS
- [ADR-104](../adr/ADR-104-yiroom-launch-criteria.md) — 출시 조건 5개 기준
- [SDD-INTEGRATED-ANALYSIS](../specs/SDD-INTEGRATED-ANALYSIS.md) — DB 스키마 + 오케스트레이션
- [SDD-INTEGRATED-RESULT-UI](../specs/SDD-INTEGRATED-RESULT-UI.md) — 웹 UI 스펙
- [SDD-MOBILE-INTEGRATED](../specs/SDD-MOBILE-INTEGRATED.md) — 모바일 스펙
- [docs/troubleshooting/2026-03-04-capsule-ecosystem-deployment.md](./2026-03-04-capsule-ecosystem-deployment.md) — GFSA 자동 배포 사고 (선행 교훈)

---

## 체크리스트 (인쇄/복사용)

### 인프라 (Phase A~E)

```
[ ] 1. Supabase Storage 버킷 `integrated-sessions` 생성 (private, 5MB, image/*)
[ ] 2. Storage RLS 정책 2개 추가 (service_role_all, user_select_own)
[ ] 3. `curl` 업로드 테스트 성공
[ ] 4. DB 마이그레이션 20260423 적용 (CLI 또는 SQL Editor)
[ ] 5. `integrated_analysis_sessions` 테이블 + 5개 테이블 `session_id` 컬럼 확인
[ ] 6. DB 마이그레이션 20260424 적용 (persona 컬럼 — Phase F.1에서 추가)
[ ] 7. `eas env:create`로 EXPO_PUBLIC_YIROOM_API_URL 등록 (production + preview)
[ ] 8. `eas env:list` 검증
[ ] 9. EAS production 빌드 성공
[ ] 10. Vercel 프로덕션 배포 (또는 롤백 상태 해제)
[ ] 11. 웹 OPTIONS preflight 검증 (curl)
[ ] 12. 웹 E2E 수동 검증 — 입력 → 결과 → 북마크 복귀
[ ] 13. 모바일 APK 실기기 검증 — 홈 CTA → 입력 → 결과 → 재시작 후 복귀
[ ] 14. Partial Success 시나리오 재현 확인 (선택)
```

### 비전 완성 (Phase F — ADR-104 5개 기준)

```
[ ] 15. FORCE_MOCK_AI=false 로 Vercel env 전환 (또는 변수 제거)
[ ] 16. 통합 분석 1회 실행 → 응답에서 PC/S/C/H `usedFallback: false` 확인 (기준 #3)
[ ] 17. 결과 페이지 `PersonaNarrativeCard` 자연스러운 문장 확인 (기준 #1)
[ ] 18. `ActionPlanCard` now/this_week/this_month 3구간 항목 확인 (기준 #2)
[ ] 19. `CrossInsightsCard` 축 조합 카드 2개+ 확인 (기준 #4)
[ ] 20. `CurationCard` 1-3개 추천 카드 확인 (기준 #5)
[ ] 21. 지인 3-5명 블라인드 테스트 평균 7점 이상 (권장)
```

### 큐레이션 링크 (Phase G)

```
[ ] 22. 립/베이스 카드 클릭 → `/beauty?category=lip&source=integrated`
        → 통합 배너 표시 + 대분류 `전체` (매핑 불가 의도된 동작)
[ ] 23. 스킨케어 카드 클릭 → `/beauty?category=skincare&source=integrated`
        → 통합 배너 표시 + 대분류 자동 `스킨케어` 선택
[ ] 24. outfit 카드 CTA 확인:
        - 옷장 비어있는 유저: "먼저 옷장 등록하기" → `/closet/add?source=integrated&...`
        - 옷장 있는 유저: "코디 보러가기" → `/closet/recommend?source=integrated&...`
[ ] 25. `/closet/recommend?source=integrated` 직접 방문 + 빈 옷장
        → "옷장을 먼저 등록해주세요" 맥락형 헤딩 표시
[ ] 26. 결과 페이지 HTML에 `source=integrated&session={UUID}` 링크 3개+ 포함 확인
```
