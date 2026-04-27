# 출시 직전 QA 마스터 체크리스트 (2026-04-26)

> ADR-098 정체성 재정의 v2 + 통합 분석 Phase A~G + Phase 1.5 사전 SDD가
> 모두 반영된 시점의 종합 출시 검증 가이드.
>
> 기존 26항목 체크리스트([2026-04-24](./2026-04-24-integrated-analysis-deployment.md))는
> 통합 분석 인프라 중심. 본 문서는 그 위에 ADR-098(Phase 1~4) 정체성 검증과
> Phase G 큐레이션 동작까지 합쳐 **자동 검증 + 사용자 수동 검증**을 한
> 문서에서 진행할 수 있게 구성.

---

## 0. 시작 전 상태 확인 (자동 통과 확인됨 ✅)

이번 세션에서 자동 검증 완료. 사용자가 별도 실행 불필요:

| 검증             | 결과                                                                |
| ---------------- | ------------------------------------------------------------------- |
| Web typecheck    | ✅ 0 errors                                                         |
| Mobile typecheck | ✅ 0 errors                                                         |
| Web lint         | ✅ 변경 파일 0 warnings                                             |
| 영향 영역 테스트 | ✅ 14 파일 168/168 통과 (BottomNav/HomeState/C-1/Beauty/Integrated) |
| `next build`     | ✅ 145+ 라우트 빌드 성공                                            |
| Working tree     | ✅ 깨끗 (origin/main 대비 +252 commits 로컬 보유)                   |

> 사전 깨진 테스트 85건은 i18n mock 미정비 별도 이슈, 출시 블로커 아님.

---

## 1. 사용자 수동 검증 — ADR-098 정체성 재정의

### 1.1 Web — 5축 모델 + W/N 숨김

| #   | 시나리오                           | 페이지/위치                 | 기대                                                      |
| --- | ---------------------------------- | --------------------------- | --------------------------------------------------------- |
| 1   | BottomNav 4탭 구성 (모바일 뷰포트) | 어느 페이지든 모바일 768px↓ | 홈/뷰티/스타일/나 4개. **기록 탭 없음**                   |
| 2   | Navbar 데스크톱 메뉴               | 어느 페이지든 데스크톱      | 분석/제품/캡슐/뱃지만. **영양/운동/리포트 드롭다운 없음** |
| 3   | `/record` 직접 진입                | 주소창 입력                 | `/home`으로 자동 redirect                                 |
| 4   | `/workout` 직접 진입               | 동일                        | `/home`으로 자동 redirect                                 |
| 5   | `/nutrition` 직접 진입             | 동일                        | `/home`으로 자동 redirect                                 |
| 6   | `/reports` 직접 진입               | 동일                        | `/home`으로 자동 redirect                                 |
| 7   | 홈 화면 위젯 (분석 1+개 사용자)    | `/home` Active/Growing      | activity-bar/streak-widget **없음**                       |
| 8   | 환경 조언 카드는 보임              | `/home`                     | 날씨/UV/습도 카드는 정상 노출                             |

### 1.2 Web — C-1 결과 페이지 3섹션 리디자인

| #   | 시나리오                       | 위치                                  | 기대                                                             |
| --- | ------------------------------ | ------------------------------------- | ---------------------------------------------------------------- |
| 9   | C-1 분석 1건 실행 후 결과 진입 | `/analysis/body/result/[id]` basic 탭 | 기존 결과 + **3섹션 블록** (`c1-redesign-sections`)              |
| 10  | 섹션 1 — 스타일링 원칙         | 동일                                  | 체형(S/W/N)별 4개 원칙 + 각 원칙 3요소(타이틀/근거/적용)         |
| 11  | 섹션 2 — 추천 코디             | 동일                                  | 2~3 코디 세트 (체형 × PC 시즌 매칭)                              |
| 12  | 섹션 2 — PC 미분석자           | PC 분석 안 한 상태로 C-1만 분석       | "퍼스널 컬러를 분석하면 더 정확해요" 배너 + Autumn fallback 코디 |
| 13  | 섹션 3 — 옷장 CTA              | 동일                                  | "준비 중" 안내 (CLOSET_INTEGRATION=false 기본)                   |
| 14  | 추천 운동 CTA 숨김             | 동일 페이지 하단 sticky 액션바        | "추천 운동" 버튼 **없음** (WELLNESS_PHASE2=false)                |

### 1.3 Mobile — 5축 모델 + W/N 숨김

> 실기기 또는 emulator에서 검증. APK는 EAS preview 빌드 권장.

| #   | 시나리오                      | 화면                 | 기대                                                                                              |
| --- | ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| 15  | 탭 바                         | 모든 화면 하단       | 홈/뷰티/스타일/나 4개. **기록 탭 없음**                                                           |
| 16  | `/(tabs)/records` 직접 라우팅 | 딥링크 시도          | 진입 차단 (탭에서 `href: null`)                                                                   |
| 17  | 홈 화면 W/N 섹션              | `(tabs)/index`       | "오늘의 요약" StatCard 3개 **없음**, "나의 여정"의 운동/영양 카드 **없음** (제품 추천만 노출)     |
| 18  | 홈 환영 알림                  | 신규 사용자          | "오늘도 이룸과 함께 **나다운** 하루를!" (이전: "건강한")                                          |
| 19  | 온보딩 step3                  | `(onboarding)/step3` | "신체 정보도 알려주세요" 제목 + 키/체중만 (목표 선택 섹션 **없음**)                               |
| 20  | 설정 메뉴                     | `settings/`          | "알림 및 목표" → "알림"으로 단순화. 목표 설정 항목 **없음**. 알림 서브타이틀 "분석 리마인더 알림" |

### 1.4 랜딩 + 메타

| #   | 시나리오                         | 위치                    | 기대                                                        |
| --- | -------------------------------- | ----------------------- | ----------------------------------------------------------- |
| 21  | 랜딩 히어로                      | `/`                     | "셀카 한 장으로 색·피부·체형·헤어 한 번에" + 5축 설명       |
| 22  | 랜딩 모듈 그리드                 | `/`                     | 4축 카드 (PC/S/C/H). 운동 아닌 헤어 AI 카드                 |
| 23  | 랜딩 비주얼 앵커 (데스크톱 우측) | `/` md+ 뷰포트          | 4축 2×2 그리드 (PC/S/C/H 미니 카드)                         |
| 24  | 랜딩 결과 미리보기 (Preview)     | `/` 하단                | 4개 카드 (퍼스널컬러 + 피부 + 체형 + **헤어**)              |
| 25  | i18n 전환 — 영어/일어/중국어     | Navbar 언어 스위처      | 4언어 모두 5축 카피 일관 (8모듈 표현 없음)                  |
| 26  | OG/메타 (`/`)                    | View Source             | `<title>` "이룸 - 셀카 한 장으로 색·피부·체형·헤어 AI 분석" |
| 27  | PWA Manifest                     | `/manifest.webmanifest` | name: "이룸 - 셀카 한 장으로 색·피부·체형·헤어 분석"        |

---

## 2. 사용자 수동 검증 — 통합 분석 Phase A~G

> 기존 [2026-04-24 체크리스트](./2026-04-24-integrated-analysis-deployment.md)
> 26항목 그대로 진행. 본 문서는 항목 26번까지 그대로 차용 + 신규 ADR-098
> 항목들이 27~47번에 추가됨.

| #   | 영역                                             | 참조             |
| --- | ------------------------------------------------ | ---------------- |
| 28  | Supabase Storage 버킷 `integrated-sessions` 생성 | 기존 §1          |
| 29  | DB 마이그레이션 20260423 적용                    | 기존 §2          |
| 30  | DB 마이그레이션 20260424 적용 (persona)          | 기존 §2          |
| 31  | EAS env 변수 등록 + 재빌드                       | 기존 §3          |
| 32  | 웹 통합 분석 입력 → 결과 → 북마크 복귀           | 기존 §4.1        |
| 33  | 모바일 통합 분석 입력 → 결과 → 재시작 복귀       | 기존 §4.2        |
| 34  | Partial Success (PC 실패 등) 시나리오            | 기존 §4.3 (선택) |

### 2.1 Phase F — 비전 완성 (ADR-104)

| #   | 시나리오                              | 기대                                           |
| --- | ------------------------------------- | ---------------------------------------------- |
| 35  | `FORCE_MOCK_AI=false` Vercel env 전환 | 통합 분석 응답 `usedFallback: false` 확인      |
| 36  | PersonaNarrativeCard                  | 자연스러운 페르소나 문장 (Mock 아닌 Gemini)    |
| 37  | ActionPlanCard                        | now/this_week/this_month 3구간 모두 항목 있음  |
| 38  | CrossInsightsCard                     | 축 조합 카드 2개 이상                          |
| 39  | CurationCard                          | 1~3개 큐레이션 카드 (lip/base/skincare/outfit) |
| 40  | 지인 블라인드 테스트 (선택)           | 3~5명 평균 7점 이상                            |

### 2.2 Phase G — 큐레이션 링크 동작

| #   | 시나리오                                                | 진입 URL                                             | 기대                                                        |
| --- | ------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| 41  | 립/베이스 카드 클릭                                     | `/beauty?category=lip&source=integrated&session=XXX` | 통합 배너 + 대분류 "전체" (매핑 불가는 의도)                |
| 42  | 스킨케어 카드 클릭                                      | `/beauty?category=skincare&source=integrated`        | 통합 배너 + 대분류 "스킨케어" 자동 선택                     |
| 43  | Outfit 카드 — 빈 옷장 사용자                            | C-1/통합 결과 → outfit CTA                           | "먼저 옷장 등록하기" → `/closet/add?source=integrated&...`  |
| 44  | Outfit 카드 — 옷장 보유 사용자                          | 동일                                                 | "코디 보러가기" → `/closet/recommend?source=integrated&...` |
| 45  | `/closet/recommend?source=integrated` 빈 옷장 직접 방문 | 직접 URL 입력                                        | "옷장을 먼저 등록해주세요" 맥락형 헤딩                      |
| 46  | 결과 페이지 HTML 검사                                   | View Source                                          | `source=integrated&session={UUID}` 링크 3개+ 포함           |

### 2.3 모바일 — Phase G 포팅 검증

| #   | 시나리오                           | 진입                             | 기대                                                  |
| --- | ---------------------------------- | -------------------------------- | ----------------------------------------------------- |
| 47  | `(tabs)/beauty` 큐레이션 진입      | 모바일에서 통합 결과 → 립 카드   | useLocalSearchParams로 카테고리/맥락 수신             |
| 48  | `(closet)/recommend` 큐레이션 진입 | 모바일에서 outfit 카드           | useHasClosetItems 훅으로 빈/유 분기                   |
| 49  | `(tabs)/index` curation 옵션       | 통합 결과 페이지 진입 후 홈 복귀 | 통합 카드 (재방문) 표시 (IntegratedSessionPromptCard) |

---

## 3. 자동 검증 명령어 (사용자 실행)

이 절은 사용자가 로컬에서 직접 실행해 결과를 확인하는 명령어 모음.

### 3.1 빠른 검증 (5분 이내)

```bash
# 작업 트리 클린 + main 브랜치 확인
cd /c/dev/yiroom
git status -s    # 출력 없어야 함
git log --oneline -10   # 최근 커밋 확인

# Web typecheck
cd apps/web && npx tsc --noEmit
echo "Exit: $?"   # 0 기대

# Mobile typecheck
cd ../mobile && npx tsc --noEmit
echo "Exit: $?"   # 0 기대

# Web lint (변경 가능 영역)
cd ../web && npx eslint --quiet \
  components/BottomNav.tsx \
  components/Navbar.tsx \
  "app/(main)/home/_components/HomeState*.tsx" \
  "app/(main)/{record,workout,nutrition,reports}/layout.tsx" \
  "app/(main)/analysis/body/result/[id]/page.tsx" \
  "components/analysis/body/" \
  "components/analysis/integrated/" \
  app/LandingContent.tsx app/layout.tsx
echo "Exit: $?"   # 0 기대
```

### 3.2 영향 영역 테스트 (10분 이내)

```bash
cd /c/dev/yiroom/apps/web

# ADR-098 + 통합 분석 영향 영역
npx vitest run \
  tests/components/BottomNav.test.tsx \
  tests/components/home/HomeStateActive.test.tsx \
  tests/components/home/HomeStateRouter.test.tsx \
  tests/components/home/IntegratedSessionPromptCard.test.tsx \
  tests/components/analysis/body \
  tests/components/analysis/integrated \
  tests/pages/beauty
# 168/168 통과 기대
```

### 3.3 프로덕션 빌드

```bash
cd /c/dev/yiroom/apps/web
rm -rf .next
npx next build
echo "Exit: $?"   # 0 기대, 145+ 라우트 빌드
```

### 3.4 v2 API deprecation 정합성

```bash
cd /c/dev/yiroom
# v2 라우트가 4개 모두 @deprecated 마커 가지고 있나
grep -l "@deprecated 2026-04-24" \
  apps/web/app/api/analyze/{body,hair,personal-color,skin}-v2/route.ts | wc -l
# 4 기대
```

### 3.5 FEATURE_FLAGS 게이팅 검증

```bash
cd /c/dev/yiroom
grep -rE "FEATURE_FLAGS\.(WELLNESS_PHASE2|CLOSET_INTEGRATION)" \
  apps/web/components apps/web/app apps/mobile/app | wc -l
# 게이팅 사용처 충분히 노출되는지 (>=10 기대)
```

---

## 4. 출시 전 인프라 작업 (사용자 결정 필요)

### 4.1 DB 마이그레이션 (6개 — GFSA 후 적용 보류 중)

| 마이그레이션                                | 워크스트림              | 적용 시점      |
| ------------------------------------------- | ----------------------- | -------------- |
| `20260305_*` 캡슐 에코시스템                | Phase 3 캡슐            | GFSA 종료 후   |
| `20260307_*` ConnectionAwareness            | 내재화 추적             | GFSA 종료 후   |
| `20260309_*` 모더레이션                     | 신고/차단               | GFSA 종료 후   |
| `20260313_*` 위젯 순서                      | 홈 위젯 커스터마이즈    | GFSA 종료 후   |
| `20260423_integrated_analysis_sessions.sql` | 통합 분석 (세션 테이블) | 통합 분석 출시 |
| `20260424_persona_profile_column.sql`       | 통합 분석 (페르소나)    | 통합 분석 출시 |

**적용 명령** (Supabase SQL Editor 또는 CLI):

```bash
# CLI
cd apps/web
npx supabase db push    # 미적용 마이그레이션 자동 감지

# 또는 Dashboard SQL Editor에 파일 내용 복사 → 실행
```

**롤백** (필요 시):

```bash
# 통합 분석 마이그레이션 롤백 스크립트
psql $DATABASE_URL -f apps/web/supabase/migrations/rollback/20260423_drop_integrated.sql
psql $DATABASE_URL -f apps/web/supabase/migrations/rollback/20260424_drop_persona_column.sql
```

### 4.2 Supabase Storage 버킷 생성

| 버킷                       | 용도                       | RLS                                |
| -------------------------- | -------------------------- | ---------------------------------- |
| `integrated-sessions`      | 통합 분석 사진 저장        | 본인만 select, service_role 전체   |
| `closet-items` (Phase 1.5) | 옷장 사진 — Phase 1.5 a 시 | 본인 폴더만 (`auth.get_user_id()`) |

**주의**: `closet-items`는 Phase 1.5 a 단계까지 생성 불필요. 통합 분석
출시엔 `integrated-sessions`만 필요.

### 4.3 모바일 EAS 환경변수

```bash
cd apps/mobile
eas env:create --name EXPO_PUBLIC_YIROOM_API_URL \
  --value https://yiroom.vercel.app \
  --environment production --environment preview
eas env:list   # 등록 확인
```

### 4.4 Vercel 환경변수

```
NEXT_PUBLIC_SITE_URL=https://yiroom.vercel.app
GOOGLE_GENERATIVE_AI_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
FORCE_MOCK_AI=false   # ★ 출시 시 반드시 false 또는 미설정
CRON_SECRET=...
```

### 4.5 Vercel 배포 결정 (현재 보류 중)

옵션 A — **별도 브랜치로 push** (안전):

```bash
git push origin main:release/integrated-2026-04-26
# Vercel이 release/* 브랜치를 preview로 배포 (production 영향 X)
# 별도 PR 생성 → 검토 → 승인 후 main 머지
```

옵션 B — **production 직접** (사용자 출시 결정 시):

```bash
git push origin main
# Vercel이 main을 production으로 자동 배포
# yiroom.vercel.app 즉시 갱신
```

옵션 C — **푸시 보류**: 5/1 출시일까지 로컬 보관, 그 시점에 결정.

---

## 5. EAS APK 빌드 (모바일 실기기 검증용)

```bash
cd apps/mobile

# Preview APK (실기기 QA용 — 스토어 제출 X)
eas build --profile preview --platform android

# Production AAB (스토어 제출용)
eas build --profile production --platform android
eas submit --platform android --profile production
```

빌드 완료 후 Expo CLI에서 APK 다운로드 링크 발급. 안드로이드 기기에 설치 후
§1.3, §2.3 시나리오 진행.

> **Windows에서 `eas build --local` 미지원**. 클라우드 빌드 필수.
> 무료 플랜 30회/월 제한 — Production은 종량제 $1/빌드 권장.

---

## 6. 출시 직전 최종 점검 순서 권장

```
1. (자동) §3 모든 명령 통과 확인 ─ 5~15분
2. (사용자) §1 ADR-098 정체성 검증 ─ 데스크톱 + 모바일 뷰포트 ─ 30분
3. (사용자) §4 인프라 작업 ─ Storage 버킷, DB 마이그, EAS env ─ 1~2시간
4. (자동) §3.3 next build 재실행 ─ 5분
5. (사용자) §2 통합 분석 + Phase G ─ 데스크톱 + 모바일 실기기 ─ 1~2시간
6. (사용자) §2.1 FORCE_MOCK_AI=false 전환 + AI 품질 확인 ─ 30분
7. (사용자) §4.5 Vercel push 결정 (옵션 A 권장)
8. (사용자) §5 EAS production AAB + 스토어 제출
```

총 4~6시간. 인프라 작업과 모바일 빌드 대기 시간이 가장 큰 변수.

---

## 7. 알려진 비-블로커 이슈

이 항목들은 출시 보류 사유가 아님:

| 이슈                                           | 영향 범위                | 처리 시점                   |
| ---------------------------------------------- | ------------------------ | --------------------------- |
| 사전 깨진 테스트 85건 (i18n mock 미정비)       | 페이지 테스트 일부       | 출시 후 점진 정비           |
| Vercel 배포 GFSA용 롤백 상태                   | 프로덕션 도메인          | §4.5에서 결정               |
| Phase 1.5 (나 프로필 카드 / 웹 옷장 UI) 미구현 | 출시 후 4~8주 자연 지연  | SDD는 작성 완료 (이번 세션) |
| W-1/N-1 코드/DB 유지비용                       | typecheck/test 시간 약간 | MAU 10만+ 또는 보류 해제    |

---

## 8. 관련 문서

- [2026-04-24 통합 분석 배포](./2026-04-24-integrated-analysis-deployment.md) — 26항목 인프라
- [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) — 정체성 재정의 v2
- [ADR-099~104](../adr/) — 통합 분석 ADR 시리즈
- [SDD-PROFILE-CARD-PHASE-1.5](../specs/SDD-PROFILE-CARD-PHASE-1.5.md) — 출시 후 R1
- [SDD-CLOSET-INVENTORY-WEB](../specs/SDD-CLOSET-INVENTORY-WEB.md) — 출시 후 옷장 활성화
- 트러블슈팅:
  - [server-debugging](../../.claude/rules/server-debugging.md) — Next.js 16 / Clerk
  - [2026-03-07-clerk-error-1016](./2026-03-07-clerk-error-1016-origin-dns.md) — DNS 차단 대응

---

**Version**: 1.0 | **Created**: 2026-04-26
**대상**: 5/1 또는 그 이후 출시 — 본 체크리스트 통과 시 출시 가능
