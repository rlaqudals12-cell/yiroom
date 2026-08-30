# ADR-121: 프리런치 제품 결정 6건 (소셜 로그인·성별·남성 신호·신뢰 문구·미성년·문진 고민)

- **Status**: proposed (창업자 최종 확정 대기 — 각 결정의 방향은 리서치·적대 검증 완료)
- **Date**: 2026-08-31
- **근거 리서치**: 6항목 × (문서 정독 + 코드 파일:라인 실측 + 웹 원문 확인) + 항목별 적대 검증 통과.
  워크플로 12 에이전트, 원 질문 = 8/30 페르소나 캡슐 감사의 제품결정 분류분.

## 요약 표

| #   | 결정                            | 판정                                                               | 시점           |
| --- | ------------------------------- | ------------------------------------------------------------------ | -------------- |
| 1   | 소셜 로그인                     | 지금 기각 → 도메인·Clerk prod 전환 직후 구글 1종, 카카오 2차       | 출시 직후      |
| 2   | 성별 필수 수집                  | 축별 차등 — 판정 엔진 주입 0곳 실증, 가입 필수 해제·추천용 선택화  | 출시 전 권장   |
| 3   | 랜딩 남성 신호 1줄              | 조건부 채택 — 모바일 남성 분기 배선(현재 0줄) 선행 필수            | 배선 후        |
| 4   | 신뢰 밴드 "저장 기본 꺼짐" 문구 | 조건부 채택 — 퍼컬 pre-checked 동의·30일 오기 수리 선행            | 수리 후        |
| 5   | 법정대리인 동의 절차            | 신설 기각(법적 의무 아님 — 만14세 미만 한정) + 약관 간주 조항 교체 | 문구만 출시 전 |
| 6   | 문진 피부 고민 칩               | 지금 기각(소비처 0건) → SKIN_GOALS 모바일 패리티가 진짜 갭         | 출시 후        |

---

# 1. 소셜 로그인 — 도메인 이후·구글 먼저 (지금 도입 기각)

## 결정: 소셜 로그인은 "도메인 이후, 구글 먼저" — Play 제출 전 도입 기각

### 결정

1. **Play ko 선공개(1.0.0) 범위에서 소셜 로그인을 제외한다.** 현행 이메일+비밀번호 단독 유지.
2. **yiroom.app 구매 → Clerk 프로덕션 인스턴스(pk_live) 전환이 완료된 직후**, 첫 배치로 **Google OAuth 1종만** 도입한다.
3. **카카오는 2차 배치**로 미룬다. 도입 시 Clerk 커스텀 OIDC 프로바이더(`https://kauth.kakao.com/.well-known/openid-configuration`)로 연결하고, 그 전에 비즈 앱 전환 + 동의항목 검수(영업일 3~5일)를 선행한다.
4. **iOS 제출을 계획하는 시점에는 Sign in with Apple을 Google과 동일 배치로 묶어 구현한다.**

### 근거

- **Clerk dev/prod 경계가 절대 제약**: prod 인스턴스는 커스텀 도메인과 자체 OAuth 자격증명을 요구하고, dev 인스턴스는 100명 하드 캡 + **인스턴스 간 사용자 데이터 이전 불가**다. 도메인 전에 소셜 로그인을 붙이는 것은 "버릴 유저를 더 빨리 모으는 일"이다.
- **웹은 이미 준비 완료, 모바일만 작업**: 웹은 Clerk prebuilt `<SignIn/>`/`<SignUp/>`을 쓰므로 대시보드 토글만으로 소셜 버튼이 렌더된다. 모바일은 커스텀 UI지만 `useSSO`·`expo-web-browser`·`expo-auth-session`·`scheme: "yiroom"`이 모두 갖춰져 있어 신규 의존성 없이 2파일 배선으로 끝난다.
- **구글이 카카오보다 먼저인 이유**: `openid/email/profile`은 non-sensitive scope라 Google 앱 검증 대상이 아니다(0일). 반면 카카오는 이메일 동의항목이 검수 대상이고 비즈 앱 전환·비즈니스 정보 심사가 선행되어 영업일 3~5일(반려 시 배수)이 걸린다. 출시 주간에 외부 심사를 얹지 않는다.
- **연령 게이트는 이미 안전하다**: 전역 `AgeVerificationGate`가 deny-by-default(면제 화이트리스트 방식)로 동작하고, `users.birth_date` 부재·조회 실패를 모두 fail-closed로 `complete-profile`에 착지시킨다. 소셜 가입자가 만 14세 게이트를 우회할 경로가 없다. 이는 도입 판단을 "가능/불가능"이 아니라 "언제"의 문제로 만든다.

### 대안과 트레이드오프

| 대안                                  | 장점                                                  | 단점                                                                                                                       | 판정          |
| ------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **A. 지금(pk_test) 도입**             | 가입 마찰 즉시 완화, Play 제출 전 스크린샷에 반영     | 동의화면 `accounts.dev` 노출로 신뢰 훼손, 100명 캡, **prod 전환 시 계정 전량 소실**, iOS 4.8 부채 조기 발생                | **기각**      |
| **B. 도메인+prod 전환 직후 구글 1종** | 검수 0일, 웹은 코드 0줄, 모바일 2파일, 유저 손실 없음 | 도메인 구매·DNS(≤48h)에 종속                                                                                               | **채택**      |
| **C. 카카오 우선**                    | 한국 유저 전환율은 카카오가 상위                      | Clerk 네이티브 미지원(커스텀 OIDC), 검수 3~5일, 이메일 claim이 선택값이라 식별자 공백 리스크, ADR-004 기재가 사실과 불일치 | **연기(2차)** |
| **D. 영구 미도입**                    | Apple 4.8 면제 유지, 유지보수 0                       | 한국 시장 가입 이탈 방치                                                                                                   | 기각          |

### 결과 (Consequences)

- **긍정**: 도메인 잠금해제 시 Awin·pk_live·법적 이메일과 **같은 배치**로 소셜 로그인까지 함께 열린다 — 별도 일정이 생기지 않는다.
- **부정**: 선공개 초기 사용자는 이메일+비밀번호 가입만 가능해 이탈률이 다소 높다. 다만 초기 유저는 어차피 dev 인스턴스 캡·이전 불가 이슈로 "실유저"가 아니다.
- **부채 적립**: 구글 도입 시점에 ⓐ 모바일 `privacy-policy.tsx:175-177` 및 웹 `PrivacyContent.tsx`의 필수 수집항목 문구 분기(비밀번호 미수집 명시), ⓑ Play Data safety 폼 재확인, ⓒ iOS 로드맵상 Sign in with Apple 동시 구현이 필수 동반 작업으로 발생한다.

### 후속 조치 (문서 정합)

- **ADR-004 정정 필요**: "소셜 로그인 확장 (2026-03-09)" 섹션이 카카오·네이버를 Clerk Dashboard의 기본 Social connection으로 기술하고 있으나 사실과 다르다(둘 다 커스텀 OIDC 프로바이더 경로). 도입 전 정정한다.
- `apps/mobile/app/(auth)/gender.tsx`는 진입 경로가 없는 고아 화면 — 고아 처분 백로그에 편입.

### 적대 검증 보강 노트

치명적 오류 없음 — 결론("도메인 → Clerk prod 전환 직후 → 구글 먼저, 카카오 나중")은 유지. 코드 file:line 12건 전수 실측 일치, 외부 근거 4건 원문 확인. 다만 4건 보강 필요.

■ 1. 🔴 유일한 실질 오류: "웹 CSP 추가 작업도 사실상 없음"은 틀림 (proxy.ts 실측)
`clerk.yiroom.app`은 repo 전체에서 **script-src(:42-43)에만** 존재. grep 결과 apps/web 내 CSP 정의는 proxy.ts 단일:

- connect-src(:51) = `'self' ... https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.dev https://clerk-telemetry.com ...` → **clerk.yiroom.app 없음**
- frame-src(:55) = `'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://nid.naver.com https://tawk.to` → **clerk.yiroom.app 없음**
  prod 커스텀 도메인 전환 시 Clerk FAPI(clerk.yiroom.app/v1/_)로 가는 XHR이 connect-src에 막힌다. `_.clerk.com` 와일드카드는 clerk.yiroom.app을 커버하지 못함. 즉 CSP 수정은 "없는 작업"이 아니라 **prod 전환과 동시에 반드시 해야 하는 작업**(권고 순서의 임계경로 위). 참고로 카카오/네이버 도메인이 CSP에 이미 있는 건 소셜 로그인 대비가 아니라 공유 기능(kakaocdn)·과거 배선 잔재이므로 "준비됨" 근거로 쓰면 안 됨.

■ 2. Google 검증 — 방향 맞으나 두 가지 누락
(a) non-sensitive scope 면제는 사실이나("If your app utilizes only non-sensitive scopes, it is not mandatory for your app to complete the app verification process"), 동의화면에 **앱 이름·로고를 띄우려면 brand verification(경량 심사)이 별도 필요**. 무심사로 가면 미검증 형태 화면을 감수해야 함 → 첫인상/전환율 이슈라 이룸엔 무시 못 할 항목.
(b) Search Console 소유확인은 반드시 **Domain property(DNS 레벨)** 여야 함. URL prefix/Site 속성으로 확인하면 Google OAuth 검증 시스템이 소유권을 인정하지 않음(실패 빈발 지점). 도메인 구매 시 Cloudflare DNS와 함께 처리할 것.

■ 3. 카카오/네이버 — "Clerk 네이티브 아님" 판정은 옳으나 난이도가 비대칭
Clerk 문서 실측: kakao·naver 프로바이더 페이지 둘 다 HTTP 404(LINE은 전용 페이지 존재) → ADR-004:51-52 "Clerk Dashboard → Social connections" 기재는 확정 오류. 다만 대안 경로가 다름:

- **카카오 = 가능**. Clerk custom provider는 OIDC 호환을 요구하는데, kauth.kakao.com/.well-known/openid-configuration 실측 결과 정상 OIDC discovery 문서 반환(issuer/authorize/token/userinfo/jwks, PKCE S256, RS256) → custom OIDC로 붙일 수 있음.
- **네이버 = 불투명·아마 불가**. 네이버는 OIDC discovery 문서가 없고 자체 프로필 API(openapi.naver.com/v1/nid/me) 기반 OAuth2 전용이라 Clerk custom OIDC 요건에 안 맞을 가능성이 높음(nid.naver.com 직접 fetch는 차단되어 미확정 — 착수 전 실측 필요). 네이버를 로드맵에 "카카오와 동급"으로 넣지 말 것.
- 추가 게이트: 카카오 `account_email` 동의항목은 **비즈 앱 전환**(사업자등록번호 등록 또는 전화 본인인증)이 선행돼야 함. Clerk는 이메일로 계정을 식별/연결하므로 이건 선택이 아니라 필수 관문 → "검수 3~5영업일"보다 이 전환 조건이 실제 병목.

■ 4. 사소한 정밀도
설치본 2.19.24는 맞으나 위치가 apps/mobile/node_modules가 아니라 **모노레포 루트 c:\dev\yiroom\node_modules**(hoisting). 경로 표기만 정정.

---

# 2. 성별 수집 — 축별 차등 (판정=무관·추천=선택)

## 결정: 가입 관문의 성별 필수 수집을 해제하고 축별 차등으로 전환

### 결정

성별은 **판정에서 완전 배제, 추천에서만 선택 입력**으로 확정한다. 구체적으로:

1. **가입 관문(agreement)에서 성별 필수를 해제한다.** `apps/web/app/api/agreement/route.ts:117-124`의 400 반환을 제거하고, 성별은 전달되면 저장·없으면 무시한다. `apps/mobile/lib/api/agreement.ts:101-104`의 게이트 조건에서 성별을 뺀다. 필수 동의 3종(약관·개인정보·생체정보)은 그대로 유지한다.
2. **게이트 UI의 성별 선택지를 3값으로 통일한다.** `agreement/page.tsx:169-193`와 `apps/mobile/app/(analysis)/integrated/index.tsx:874-884`에 '선택 안 함'을 추가하고 필수 마커(\*)를 제거한다. 앱 내 다른 모든 표면(프로필·설정·조명가이드·문진)이 이미 3값이므로 이는 정합화다.
3. **성별을 묻는 정본 위치는 통합분석 문진으로 한다.** `QuestionnaireForm.tsx:141-160`이 이미 "추천 맞춤 (선택) — 성별 (추천 제안에만 사용해요)"로 구현돼 있다. 가치 전달 직전에 맥락과 함께 묻는다.
4. **판정 무주입 규칙을 ADR 수준으로 승격한다.** `lib/analysis/integrated/types.ts:61-66`의 주석 규칙("분석 판정에는 절대 주입하지 않는다")을 정식 결정으로 못박아, 향후 어떤 축도 프롬프트에 성별을 넣지 않는다.
5. **개인정보처리방침을 동반 수정한다.** 성별을 필수→선택으로, 목적을 "맞춤 분석"→"추천 개인화"로 정정한다(`apps/mobile/app/privacy-policy.tsx:176`, `apps/web/app/privacy/PrivacyContent.tsx:447`, 대응 테스트 포함).
6. **헤어 카탈로그에 성별 적합도 태그를 추가한다**(별도 작업). 이것이 성별의 유일한 실질 품질 갭이다.

### 근거

- 5축 판정 엔진(personal-color-v2·skin-v2·hair·makeup·body-v2)에 성별 참조가 **0건**이다. 프롬프트 디렉터리도 0건. 따라서 성별 없이 분석해도 판정 열화는 **0%**다.
- 라이브 체형 분류기는 `classifyBodyType(ratios)`로 성별 파라미터가 없다(`type-classifier.ts:110`). 성별을 받는 체형 함수(classifyWHR·classifyBodyTypeFromRatios·checkAbdominalObesity)는 `lib/body/` 밖 호출자가 0건인 고아 코드다.
- 도메인 원리도 성별 필수를 지지하지 않는다. `body-mechanics.md:156`은 WHtR이 "성별/연령/민족 관계없이 동일 기준"임을 명시하고, `color-science.md:244-251`의 성별 보정은 L\* ±2로 조명 편차보다 작으며 미구현이다.
- 미선택 처리 비용이 **0**이다. `?? 'neutral'` 폴백이 모든 소비처에 이미 있고(action-plan.ts:268, curation.ts:251, product-matcher.ts:141, AnalysisResult.tsx:1268), DB도 NULL·'neutral'을 허용한다(20260710_users_gender_neutral.sql). ADR-084에서 K-1 중립화가 100% 완료됐다.
- 법적으로 현행 구성은 방어가 어렵다. 개인정보 보호법 제16조 3항은 최소수집 외 항목에 미동의했다는 이유로 서비스 제공을 거부하는 것을 금지하고(3천만원 이하 과태료), 1항은 **최소성 입증책임을 처리자에게** 지운다. 현재 게이트는 400으로 서비스를 전면 차단하는데, 최소성 입증을 자사 코드가 반증한다.
- 최초 수집 근거였던 BMR(마이그레이션 20251128_add_user_profile_fields.sql:11 "BMR 계산용")은 영양 모듈이 런치 IA(오늘/뷰티/물어보기/스타일/나)에서 제외되어 소멸했다.

### 고려한 대안

**대안 1: 필수 유지 (창업자 초기 직관)**

- 논거: 남성에게 립틴트를 첫 액션으로 주는 이탈을 막으려면 성별을 확보해야 한다.
- 기각 이유: 그 이탈은 실재하나(types.ts:62에 문서화) 이미 **추천 시점 분기**로 해결돼 있다. 게이트 수집이 추가로 만들어내는 품질 이득은 0인 반면, 제16조 3항 노출과 가입 퍼널 마찰은 확정 비용이다. 또한 게이트가 이분(male/female)이라 논바이너리·미선택 사용자를 배제하는데, 앱의 나머지 전 표면은 3값이므로 자체 모순이다.

**대안 2: 전면 삭제 (성별 수집 자체를 없앰)**

- 기각 이유: 남성 사용자의 추천 문구 열화가 실재한다. `curation.ts:104`·`action-plan.ts:72`·`product-matcher.ts:141`의 그루밍 분기는 실제 가치가 있고, 이를 잃으면 남성 사용자 경험이 후퇴한다. 또 영양 모듈 재노출 시 BMR에 생물학적 성별이 필요하다.

**대안 3: 사진에서 성별 추론**

- 기각 이유: 추론된 성별도 개인정보이며, 생체정보 기반 성별 추론은 오히려 규제 부담을 키운다. 오분류 시 사용자 모욕 리스크도 크다. 현재 엔진이 성별을 전혀 추론하지 않는 상태를 유지한다.

### 트레이드오프 (의도적 수용)

| 항목                 | 감수하는 것                                         | 이유                                                                         |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| 남성 추천 정확도     | 문진에서 성별을 건너뛴 남성은 여성 기본 문구를 받음 | 게이트 강제보다 문진 노출 강화로 대응. 강제 수집의 법적 비용이 더 큼         |
| 성별 데이터 커버리지 | 신규 사용자 상당수가 NULL                           | 추천 분기는 neutral 폴백이 이미 완비. 계측에서 '미선택'을 별도 코호트로 기록 |
| 배포 복잡도          | 웹·모바일 계약 동시 변경 필요                       | 서버 완화를 먼저 배포하면 구버전 앱도 안전(400이 사라질 뿐)                  |
| 영양 모듈            | 재노출 시 별도 수집 단계 추가 필요                  | ADR-084 2-Layer 원칙 유지 — 과학계산 레이어에서만 생물학적 성별 요구         |

### 결과 (기대)

- 가입 관문 필수 항목이 동의 3종으로 축소 → 퍼널 마찰 감소, 제16조 3항 노출 해소.
- 판정 결과는 **비트 단위로 불변**(엔진이 성별을 안 쓰므로) — 회귀 위험 없음.
- 앱 전체가 성별 3값·선택으로 정합화 → 논바이너리 사용자 배제 해소.
- 남은 실질 과제는 헤어 카탈로그 성별 태깅으로 이전(수집 문제가 아니라 콘텐츠 문제로 정확히 재정의).

### 적대 검증 보강 노트

## 검증 결과: 핵심 주장 전부 재현됨 (치명적 오류 0)

**직접 실측으로 확인된 것 (인용 정확)**

- `apps/web/lib/analysis/**`에서 gender 매치 파일은 `integrated/` 5개(types·action-plan·curation·product-matcher·index)뿐. PC-v2·skin-v2·hair·makeup·body-v2 엔진 0건 — 확인.
- `apps/web/lib/gemini/` 디렉터리 전체 0건 — 확인.
- `integrated/types.ts` "분석 판정(사진 기반)에는 절대 주입하지 않는다" 주석 원문 일치(실제 62–67행).
- `action-plan.ts:63,72 / 201,203`, `curation.ts:95,104,124`, `product-matcher.ts:141`, `AnalysisResult.tsx:1269–1277` 모두 실재.
- `app/api/analyze/body-v2/route.ts:146` → `classifyBodyType(bodyRatios)`, `body-v2/type-classifier.ts:110` 시그니처에 성별 파라미터 없음 — 확인(모바일 동일).
- 구 `app/api/analyze/body/route.ts:48` gender optional, `lib/mock/body-analysis.ts:33–36` UserBodyInput = {height, weight} — 확인.
- `docs/principles/color-science.md:244–251` 성별 보정표(L\* ±2) 미구현, `:257–265` Hue Angle 판정은 성별 무관 — 확인. `body-mechanics.md:130–133`(남 0.90/여 0.85) 및 `:156` "성별/연령/민족 관계없이 동일 기준" — 확인. `personal-color-v2/classify.ts:264 applyKoreanAdjustment` = 인종 보정 — 확인.
- `hair/style-recommender.ts:562` `recommendHairstyles(faceShape, options)` 성별 파라미터 없음 — 확인.
- ADR-084 설계원칙 4 "체형 분류 v2는 gender-free — `classifyBodyType(ratios)`" — 확인.
- **필수·이분 게이트 실재**: `app/agreement/page.tsx:21` `type Gender='male'|'female'`, `:60` `requiredAllChecked = agreementsOk && gender !== null`, `:84` 토스트. 서버도 `app/api/agreement/route.ts:117–124`에서 gender 없으면 **400 "성별을 선택해주세요"**. `app/(main)/layout.tsx` → `components/agreement/AgreementGuard.tsx:60`이 미동의자를 `/agreement`로 강제 리디렉션 ⇒ 성별 미제출 시 서비스 전체 진입 불가 = "제공 거부" 구조 성립.
- **법령 확인(원문)**: 개인정보 보호법 제16조제3항(최소한의 정보 외 수집 미동의를 이유로 재화·서비스 제공 거부 금지) 위반 → **제75조제2항제1호, 3천만원 이하 과태료**. 인용 정확.

## 보강 (결론은 불변, 표현·범위 정정)

1. **"AI 프롬프트 주입 0건"은 5축 한정으로 읽혀야 함.** `apps/web/lib/gemini.ts:1265`가 W-1 운동 추천 프롬프트에 `성별: ${input.gender === 'female' ? '여성' : '남성'}`를 실제 주입한다. 검증이 `lib/gemini/` **디렉터리**만 봤고 `lib/gemini.ts` **파일**을 놓쳤다. W-1은 숨김 모듈이라 5축 결론은 그대로지만, "코드베이스 전체 0건"으로 확장 인용하면 반례가 존재한다. 같은 맥락에서 `lib/nutrition/bmr-calculator.ts`·`calculateBMR.ts`는 성별로 값이 달라지는 실계산(N-1, 숨김)이다.

2. **"실소비처 6곳"은 과소집계.** 최소 4곳 누락: `components/providers/gender-provider.tsx`(`useGender` 컨텍스트, `users.gender` 로드), `components/onboarding/GenderSelector.tsx`, `components/analysis/GenderAdaptiveAccessories.tsx`, `components/analysis/personal-color/ResultCardV2.tsx`, 그리고 `app/(main)/profile/my-info/page.tsx`. `AnalysisResult.tsx` 하나만 봐도 `isMale` 분기가 11곳(394·424·431·772·855·1064·1269·1388·1432·1441…). **전부 콘텐츠/표현 레이어라 "판정 미주입" 명제는 유지**되나, "6곳뿐"이라는 수치는 틀렸고 제거 비용 추정에 영향을 준다.

3. **"성별 받는 체형 함수는 lib/body/ 밖 호출자 0건" — 프로덕션 한정으로 참.** `tests/lib/body/ratios.test.ts`·`classify.test.ts`·`korean-standards.test.ts`가 `classifyWHR`·`classifyBodyTypeFromRatios`·`getStandardWHR`를 호출하고, `lib/body/index.ts:60,67,75,165`가 넷 다 공개 export 중이다. 삭제 시 테스트·배럴 동시 정리 필요.

4. **⭐ 검증이 놓친, 결론을 오히려 강화하는 사실 — 처리방침 불일치.** `apps/web/app/privacy/PrivacyContent.tsx:90–91`은 성별을 **"필수 항목"**으로, 수집 목적을 **"맞춤 분석 목적"**으로 명시한다. 그런데 코드상 성별은 분석 판정에 0건 주입이고 추천 문구 분기 전용이다. 따라서 노출은 제16조3항 하나가 아니라 **① 제16조3항(필수화·거부) + ② 처리방침 기재 목적과 실제 처리의 불일치(제30조 기재사항·제15조제1항제1호 동의 목적 범위)** 2중이다. 정정 시 코드뿐 아니라 처리방침 문구도 함께 고쳐야 한다.

5. **게이트만 유일하게 이분이라는 점을 명시하면 권고가 더 강해짐.** 나머지 전 계층은 이미 3값이다 — `users.gender_preference` DB 제약 `CHECK IN ('male','female','neutral') DEFAULT 'neutral'`(`supabase/migrations/20260202_users_gender_preference.sql:15–16`), `users.gender`는 코드 주석상 male/female/other/neutral 허용(`gender-provider.tsx:108–111`), `QuestionnaireForm.tsx:37–41`은 '선택 안 함' 제공 + 재클릭 시 undefined 해제, `profile/my-info` 3옵션('중립'). **즉 가입 게이트만 이분·필수이고, 사용자는 가입 직후 설정에서 neutral로 바꿀 수 있다** — 게이트의 품질 근거가 없다는 논증의 결정타. 수정 범위도 작다: `agreement/page.tsx`의 `gender !== null` 조건과 `api/agreement/route.ts:117–124` 검증 제거 + neutral 허용.

6. **또 하나의 죽은 수집:** `app/(main)/body/weight-goal/page.tsx:109·193`의 남/여 토글은 어떤 계산에도 들어가지 않는다(호출은 `calculateBMI(h, w)`뿐, 파일 내 gender 참조가 상태·onClick·스타일 3곳). 수집 UI만 있고 효과 0.

7. **사소한 행번호/표현 오차:** types.ts 주석은 61–66이 아니라 **62–67**, `skin-physiology.md`의 "연령/성별 보정 적용" 체크박스는 1123이 아니라 **1122**, product-matcher는 139–142가 아니라 **141**, AnalysisResult는 1268이 아니라 **1269**부터. 또 구 body 라우트의 gender는 파일 내 참조가 48행 스키마 **단 1곳**이라 "응답에 echo만 된다"는 서술은 `userInput` 통째 반환 시에만 성립 — "검증 후 완전 미사용"이 더 정확하다.

---

# 3. 랜딩 남성 신호 1줄 — 모바일 남성 분기 배선 선행 조건부 채택

## 결정: 남성 신호 노출은 모바일 성별 배선 수리 이후에만 (조건부 승인)

### 배경

웹은 성별을 필수 수집(`/agreement`)해 `users.gender`에 저장하고, 통합 결과의 액션 플랜·큐레이션·제품 매칭·퍼스널컬러 액세서리까지 남성 분기를 실제로 태운다(ADR-084의 2-Layer 모델 준수). 그러나 Play ko 선공개 대상인 모바일 앱은 동일하게 성별을 **필수**로 수집하면서도(`app/(analysis)/integrated/index.tsx:875-895`) 추천 조립기에 전혀 전달하지 않아, 남성 사용자가 "코랄 계열 립틴트"를 첫 행동으로 받는다. 즉 "남성도 사용 가능"은 현재 출시본에서 **거짓**이다.

### 결정

1. **선행 조건(필수)**: 모바일 성별 배선을 수리한다.
   - `apps/web/app/api/agreement/route.ts` GET 응답에 `gender` 필드 추가(현재 `hasAgreed`만 반환 — 모바일이 되읽을 경로 자체가 없음).
   - `apps/mobile/lib/integrated/action-plan.ts` — `composeActionPlan(axes, gender?)`, `pcActions`·`makeupActions`에 웹(`apps/web/lib/analysis/integrated/action-plan.ts:71-84, 201-213`)과 동일한 남성 분기 이식.
   - `apps/mobile/lib/integrated/curation.ts` — `ComposeCurationOptions`에 `gender` 추가, 웹 `curation.ts:104-111, 124`와 동일 분기 이식.
   - `apps/mobile/components/analysis/integrated/IntegratedResultReport.tsx:55, 57` — gender 전달.
   - 고아 처분: `apps/mobile/app/(auth)/gender.tsx`(진입 라우트 0·저장 없음) 삭제, `apps/mobile/lib/content/index.ts`(임포터 0) 삭제 또는 실배선.
2. **선행 조건 충족 후**: 웹 랜딩에 남성 신호 1줄을 추가한다. 위치는 신뢰 밴드(`LandingContent.tsx:230-248`) 또는 5축 그리드 하단 캡션. 성별 단어를 감성 카피가 아니라 **기능 사실**로 진술해 E+ 여성 우선 톤(ADR-120)을 건드리지 않는다.
3. **Play 리스팅(`store-metadata.json`)은 변경하지 않는다** — 이미 성별 중립 기술이며, 스토어 카피에 성별 언급을 넣을 실익이 없다.
4. **타깃 명문화**: "여성 우선 + 남성 배제 표현 금지"를 계약으로 승격한다. 여성 우선은 디자인·톤·큐레이션 기본값에 적용되고, 남성은 성별 선택 시 그루밍 분기로 동등하게 서비스된다.

### 문구 시안

- **시안 A (권장 — 신뢰 밴드 캡션, 13px MUTED, 체크 아이콘)**

  > "남성은 립·베이스 대신 그루밍 추천으로 바뀌어요"

  근거: 밴드의 나머지 4개(재현성·5축·무료·인증 리테일러)와 동일한 "검증 가능한 사실" 레지스터라 톤 충돌이 없다. 감정 호소·포용 선언이 아니라 기능 진술이므로 여성 독자에게는 노이즈가 아닌 정보로 읽힌다.

- **시안 B (대안 — 5축 모듈 그리드 하단 단독 캡션, 중앙 정렬)**

  > "성별을 고르면 추천이 바뀝니다 — 남성은 선크림·눈썹·액세서리 기준으로."

  근거: "메이크업 AI" 카드 바로 아래에 놓여, 남성의 최대 이탈 지점(`module4Title`)을 그 자리에서 해소한다. 밴드 2열 그리드의 홀수 칸 문제도 회피한다.

### 고려한 대안

- **대안 1 — 지금 바로 랜딩 1줄만 추가**: 기각. 모바일이 약속을 즉시 깨므로 이탈을 줄이는 게 아니라 **실망을 앞당긴다**. Play 초기 리뷰 훼손 비용이 카피 이득을 초과한다.
- **대안 2 — 남성 신호 영구 미노출(현행 유지)**: 기각. ADR-084(남성 사용자 확보)와 배치되고, 웹에 이미 존재하는 남성 분기(액세서리 16종·그루밍 큐레이션·제품 필터) 전체가 사용자에게 발견되지 않는 매몰 자산이 된다.
- **대안 3 — 남성 전용 랜딩/온보딩 분기 신설**: 기각(P4 단순화 위반). 시장 규모가 국내 남성 화장품 약 1조원대로 여성 시장의 보조 수준이고, 별도 지면 유지비가 이탈 방지 이득을 초과한다.
- **대안 4 — 메이크업 축을 남성에게 미노출**: 보류. 5축 정체성(ADR-098)의 완결성을 깨고, 남성 색조 소비(톤업 선크림·컬러 립밤) 확대 추세와도 어긋난다. 축은 유지하고 **출력 문구만** 그루밍으로 분기하는 현행 웹 방식이 옳다.

### 트레이드오프

- **얻는 것**: 남성 이탈 방지(ADR-076의 "남성 60% 이탈" 전례 재발 차단), 이미 구현된 웹 남성 분기의 발견 가능성 확보, 수집한 성별의 목적 정합(개인정보 최소수집 방어), 올리브영 남성 첫 구매 30%·+40% YoY 흐름에 대한 최소 대응.
- **내주는 것**: 랜딩 신뢰 밴드에 항목 1개 추가(2열 그리드 홀수 칸 처리 필요), 모바일 수리 공수(파일 4개 + API 필드 1개 + 테스트), 여성 우선 지면에 성별 단어가 처음 등장하는 톤 비용.
- **명시적으로 포기**: 남성 전용 지면·남성 전용 온보딩·스토어 카피 성별 언급. 남성은 **"동등하게 작동하는 이차 사용자"**이지 별도 트랙이 아니다.

### 후속 확인 (수리 시 동반)

- `product-matcher.ts:139-144`에서 male 필터 적용 후 eligible이 0이 되지 않는지 실카운트 검증(남성만 제품 카드가 사라지는 역차별 방지).
- 실기기 스모크에 **"남성 선택 → 통합 분석 1회 → 첫 액션이 립틴트가 아닌지"** 1건 추가.

### 적대 검증 보강 노트

전량 실측 결과 — 인용된 file:line은 웹·모바일 모두 정확히 일치했습니다(오탐 0). 확인된 것: 웹 agreement page.tsx:33-34/60/83-84/166-195/222(male·female 2택 필수), api/agreement/route.ts:117-118 검증·:162 users.gender update·:45-68 GET에 gender 미포함, gender-provider.tsx:90-107(users.gender 조회), integrated/page.tsx:205·503, QuestionnaireForm.tsx:37-41/86/113, result/[sessionId]/page.tsx:524·585·624·633, action-plan.ts:71-84·201-213, curation.ts:104-111·124, product-matcher.ts:141, PC result page.tsx:765, gender-adaptive.ts 남성 액세서리 16종(26-165)·320-340·346, beauty/page.tsx:34(sunscreen→suncare). 모바일도 전부 확인: integrated/index.tsx:252·874-908(성별 \* 필수)·296-297(ALL_AXES), lib/api/agreement.ts:101-104, lib/integrated/action-plan.ts:32-41·136-142·149(gender 파라미터 없음), curation.ts:88-92·107-114·130-137, IntegratedResultReport.tsx:55·57(gender 미전달), lib/content/index.ts는 **tests**/lib/content.test.ts만 참조 = UI 미배선(죽은 코드 판정 맞음).

정정 1 (표현 과장 — 반박당할 문장). "모바일 앱에는 남성 분기가 단 한 줄도 없습니다"는 문자 그대로는 거짓입니다. 모바일에도 gender 분기 코드는 존재합니다: lib/body/index.ts:101-103(WHR 임계 0.85/0.9)·:176·:183, lib/fashion/index.ts:184-212·269, lib/nutrition/bmr-calculator.ts:132(±5/−161), lib/content/index.ts:27-72(용어 치환·카테고리 제외). 수집 화면도 3곳 더 있습니다 — app/(auth)/gender.tsx(4택을 받고 handleContinue가 저장 없이 router.push만 = 값 폐기), app/(onboarding)/step2.tsx:43-76(male/female/neutral, 진입 라우팅 없음 = 고아), app/settings/my-info.tsx:80-84·GENDER_OPTIONS(users.gender 직접 read/write). 정확한 주장은 "모바일의 **통합 추천 조립 경로**(action-plan·curation·결과 화면)에 gender가 0이고, 존재하는 분기는 전부 숨김/고아 모듈에 갇혀 있다"입니다. 결론은 그대로 서지만 문장은 좁혀야 합니다.

정정 2 (모바일 고유 결함 아님). "메이크업 축은 첫 분석에서 항상 실행 → 남성도 풀메이크업 진단지를 그대로 받습니다"는 웹도 동일합니다. skipMakeup은 orchestrator.ts:287·types.ts:172·테스트에만 존재하고 웹 UI 어디서도 true로 세팅하지 않으며(전수 grep), 웹 결과 페이지도 gender와 무관하게 makeup 축 요약을 렌더합니다(result page:675). 즉 웹↔모바일 실제 격차는 ①액션 첫 줄 문구 ②큐레이션 카드 ③product-matcher 카테고리 필터(:141) 세 곳뿐이고, 메이크업 진단지 노출은 크로스플랫폼 현행 동작입니다(별도 제품 결정 사안). 참고로 모바일은 index.tsx:448에서 skipMakeup:false를 하드코딩하고 있어 스킵 레버는 이미 한 줄로 존재합니다.

정정 3 (수리 처방이 틀림 — 실행 순서에 영향). "모바일이 저장된 성별을 되읽을 API 자체가 없습니다 → 파일 4개+**API 필드 1개**"에서 API 신설은 불필요합니다. (a) 서버 계약에 이미 questionnaire.gender가 있습니다 — apps/web/lib/analysis/integrated/types.ts:142(z.enum(RECOMMENDATION_GENDERS).optional())이고 orchestrator.ts:442가 questionnaire 전체를 세션에 저장하며, **main(=prod 배포본)에도 존재**합니다(git show main:.../types.ts:116). 모바일이 안 보낼 뿐입니다(lib/api/integrated.ts:46-51의 questionnaire에 gender 필드 없음). (b) 되읽기도 API가 필요 없습니다 — 모바일 결과 화면은 hooks/useIntegratedSession.ts가 integrated_analysis_sessions를 Clerk-Supabase RLS로 **직접 조회**하므로 select에 questionnaire만 추가하면 되고, users.gender 직접 조회 선례도 이미 모바일에 있습니다(settings/my-info.tsx:80-84, 웹 gender-provider.tsx:93-99과 동일 패턴). 따라서 실제 수리 범위 = 모바일 전용 5파일(lib/api/integrated.ts 타입+제출 payload, lib/integrated/action-plan.ts, lib/integrated/curation.ts, components/analysis/integrated/IntegratedResultReport.tsx, hooks/useIntegratedSession.ts), 웹 배포 0건. 이건 결론을 오히려 강화합니다 — Vercel 소프트블록으로 웹 배포가 막힌 지금도 EAS 재빌드만으로 출하 가능하므로 "먼저 고치라"는 순서에 비용 핑계가 없습니다.

보강 4 (배선 시 함정). 웹의 taxonomy가 2곳에서 다릅니다: /agreement는 male/female 2택 필수(page.tsx:166-195)지만, 추천 분기의 실제 입력인 통합 문진은 female/male/neutral 3택이고 같은 칩을 다시 누르면 해제되어 undefined가 됩니다(QuestionnaireForm.tsx:37-41·153 → action-plan.ts:268 `?? 'neutral'`). 즉 웹에서도 남성이 문진에서 성별을 해제하면 "코랄 립틴트" 문구로 되돌아갑니다. 모바일 배선 시 기본값을 users.gender로 채우되 neutral 폴백 계약(웹 action-plan.ts:268·curation.ts:251과 동일)을 그대로 미러해야 웹/모바일 결과가 갈리지 않습니다.

---

# 4. 랜딩 신뢰 밴드 저장 문구 — 선행 수리 후 교체

## ADR-120 개정 — 신뢰 밴드 4항목의 구성 변경 (R5-trust-band)

### 맥락

랜딩 신뢰 밴드는 사진·후기 자산 없이 "정직한 사실 4개"로 신뢰를 세우는 장치다(ADR-120 §3, `LandingContent.tsx:229-248`). 프리런치 검토에서 "원본 사진 저장은 선택·기본 꺼짐"을 밴드에 추가하자는 제안이 나왔다. 생체이미지를 다루는 제품에서 이는 경쟁사가 말하지 못하는 차별 사실이며, 밴드의 다른 3줄과 성격이 겹치지 않는다.

동시에 코드 실측에서 이 문장이 **현재 전 경로에서 참이 아님**이 드러났다. 통합 분석은 클라이언트·서버·모바일 3중으로 기본 꺼짐이 보장되나(`QuestionnaireForm.tsx:96`, `types.ts:140`, `storage-uploader.ts:135`, `apps/mobile/app/(analysis)/integrated/index.tsx:169`), 퍼스널컬러 단독 진단은 저장 동의 체크박스가 미리 켜져 있다(`personal-color/_components/LightingGuide.tsx:18` `useState(true)` → `page.tsx:242-249` `saveConsent(true)`). 랜딩 모듈 그리드가 이 경로로 직결한다(`LandingContent.tsx:50`).

### 결정

**1. 문구는 채택하되, 코드 정합이 선행 조건이다.** 다음 3건을 먼저 수리한다.

- `personal-color/_components/LightingGuide.tsx:18` `useState(true)` → `useState(false)` (opt-out → opt-in 전환)
- PC·skin LightingGuide의 "30일간 저장" → "1년간" (실제 `api/consent/route.ts:172-174` 및 방침 `PrivacyContent.tsx:145`와 일치)
- `PrivacyContent.tsx:149` "별도의 필수 동의 항목" → "별도의 선택 동의 항목"

**2. 밴드는 4항목을 유지한다.** trust2(5축 통합 분석)를 프라이버시 문장으로 교체한다. 5줄 확장은 기각.

**3. 이 문구는 랜딩 밴드에만 둔다.** 촬영 가이드·업로드 직전 화면으로 확산시키지 않는다.

### 대안과 기각 근거

| 대안                                           | 판정     | 근거                                                                                                                                                                                                                                 |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5줄로 확장                                     | 기각     | ADR-120 §3의 "신뢰 밴드 4" 계약 위반. 2열 그리드에서 5개는 3행째 고아 1개를 만들어 타이포·여백-포워드 문법(이솝·설화수 축)을 파손한다. 고아 아이템은 AI-slop 신호다.                                                                 |
| trust1(재현성) 교체                            | 기각     | 재현성은 제품의 1순위 차별점이며 경쟁 리뷰에서 최대 불만 지점이다. 프라이버시보다 우선순위가 높다.                                                                                                                                   |
| trust3(영원히 무료)·trust4(인증 리테일러) 교체 | 기각     | 수익 모델 신뢰(광고 배제)와 유통 신뢰는 각각 대체 불가한 사실이다.                                                                                                                                                                   |
| **trust2(5축) 교체**                           | **채택** | 5축은 바로 아래 모듈 태그 5개(`:251-261`)와 5축 그리드(`:352-365`)가 이미 두 번 말한다. promiseBanner가 "신뢰 밴드와 중복"으로 제거된 전례(`:154-155` 주석)와 동일 논리. 중복 1건 제거 + 미보유 정보 1건 추가 = 밴드 정보 밀도 순증. |
| 코드는 두고 문구만 게시                        | 기각     | 허위 고지. 스크린샷 1장으로 반증된다.                                                                                                                                                                                                |
| 문구 자체를 포기                               | 기각     | 생체이미지 제품에서 opt-in 기본값은 경쟁사가 말하지 못하는 사실이고, 밴드의 나머지 3줄과 성격이 겹치지 않는다. 코드 1줄로 참이 되므로 포기할 이유가 없다.                                                                            |

### 트레이드오프

- **얻는 것**: 밴드의 중복 제거. 생체정보 프라이버시라는 미보유 신뢰 축 확보. 부수 효과로 PC-1이 opt-out→opt-in으로 바뀌어 PIPA 민감정보 처리의 기본값이 보수적으로 정렬되고, 보관기간 고지 오기(30일↔1년)와 방침 자기모순이 함께 해소된다.
- **잃는 것**: 밴드에서 "5축"이라는 제품 범위 신호가 사라진다 — 단, 같은 화면 아래에 두 번 남아 있어 실질 손실은 없다. PC-1 기본값 전환으로 드레이핑 이용 가능 사용자 비율이 낮아진다(사용자가 능동적으로 켜야 함). 이는 데이터 정직성의 대가로 수용한다(ADR-120 §"목업의 정보 밀도 일부는 포기 — 데이터 정직성이 우선"과 동일 판단).
- **연구상의 잔여 위험**: 프라이버시 문구의 salience는 데이터 요청 직전에 놓일 때 공개 회피를 키운다(Balebako·Adjerid·Acquisti). 랜딩은 업로드에서 여러 화면 떨어진 "지연이 있는 공지" 위치라 역효과가 약하다. 이것이 결정 3(랜딩 밴드에만 한정)의 근거다.

### 적용 범위

`apps/web/messages/{ko,en,ja,zh}.json:703` 4언어 동시 교체. `LandingContent.tsx:231`의 키 배열은 불변이므로 컴포넌트 변경 0줄. `apps/web/tests/app/LandingContent.test.tsx`에 trust 문자열 assertion이 없어 테스트 영향 없음.

### 적대 검증 보강 노트

실측 결과 핵심 결론(지금 넣으면 거짓 → 선행수리 필요)과 인용 라인 대부분이 정확히 확인됨. 다만 처방 범위에 중대한 누락 1건 + 보강 9건.

■ 누락 (가장 큰 정정) — "코드 1줄"은 부족하다. 미리 체크된 저장 동의 체크박스는 퍼컬 단독뿐이 아니다

- apps/web/app/(main)/analysis/skin/\_components/LightingGuide.tsx:32 — `const [consentToSaveImage, setConsentToSaveImage] = useState(true)` (퍼컬과 동일 패턴, :210에 동일한 "30일간 저장" 오기)
- 단, 이 체크박스는 **죽은 UI**다: 인터페이스가 `onContinue: () => void`(:20), 버튼이 `onClick={onContinue}`(:230), 수신부도 `handleGuideComplete = useCallback(() => {...})`(skin/page.tsx:237)로 인자를 안 받는다 → 체크 상태는 `checked=` 외에 아무 데서도 읽히지 않는다. 실제 게이트는 ImageConsentModal(skin/page.tsx:304·524)이고 `let imageStorageAllowed = false`(:318)로 시작한다.
- 게다가 skin 가이드는 프로필에 성별이 있으면 useEffect(:36-41)에서 `onContinue()`로 자동 스킵돼 체크박스가 렌더조차 안 되는 경우가 많다.
  → 즉 연구의 "skin = 사실상 참(모달 opt-in)" 판정은 **저장 결과 기준으로는 맞다**(퍼컬 1줄만 고치면 문구는 데이터상 참이 됨). 그러나 화면 기준으로는 랜딩 "기본 꺼짐"과 정면으로 모순돼 보이는 두 번째 표면이 남는다. 처방은 최소 4곳: pc:18 플립, skin:32 플립 또는 죽은 체크박스 삭제, pc:192·skin:210 "30일"→"1년" 카피.

■ 보강

1. "30일"은 완전한 허구가 아니다 — cleanup-images/route.ts:39 `INACTIVE_DAYS_THRESHOLD = 30`(30일 미접속 익명화)에서 온 숫자다. 다만 활성 사용자 보유는 1년(api/consent/route.ts:172-174 `setFullYear(+1)`)이라 고지로서는 여전히 오기. 정답 문안이 이미 저장소에 있다 — QuestionnaireForm.tsx:340-345 "보관 1년이 되면 일일 파기 작업으로 삭제를 시작…". 이 문장을 그대로 이식하면 된다.
2. 메모리의 "파기 크론 미등록"은 stale이며 연구 결론에 유리하다 — vercel.json crons에는 soft/hard-delete-users 2개뿐이나, hard-delete-users/route.ts:240-256 `runMergedDailyCleanups`가 cleanup-consents·cleanup-images·cleanup-audit-logs를 병합 실행하고 :265에서 consents를 선행 호출한다. 1년 파기는 실제로 매일 돈다 → "실제는 1년" 주장이 더 강해짐.
3. 경로 정정 — LandingContent.tsx는 `apps/web/app/LandingContent.tsx`다((main)/\_components 아님). 인용 행번호 :50(href '/analysis/personal-color')·:306·:429는 정확.
4. trust2 교체는 코드 수정이 아니라 4개 언어 메시지 수정 — 밴드는 LandingContent.tsx:231의 하드코딩 튜플 `['trust1'..'trust4']`로 렌더되고 문안은 messages/{ko,en,ja,zh}.json:703에 있다. ko만 고치면 en/ja/zh가 5축 중복인 채로 남는다. "4줄 유지" 자체는 성립.
5. 회귀 가드 없음 — tests/pages/analysis/personal-color.test.tsx:90-108이 LightingGuide를 통째로 mock하고 `onContinue(false)`를 하드코딩한다. 기본값 true/false 어느 쪽도 테스트가 못 잡는다(플립해도 안 깨지지만, 되돌아가는 것도 못 막는다). tests/pages/analysis/skin-consent.test.tsx 선례대로 기본 OFF 단언 추가 권장.
6. 제품 부작용 명시 필요 — pc LightingGuide:17 주석이 "기본값: 체크됨 (드레이핑 기능 활성화)", :194가 "미동의 시 드레이핑 기능을 사용할 수 없습니다". 플립하면 드레이핑이 전 사용자 기본 OFF. 정직 비용이지만 제품 결정으로 명시해야 한다.
7. 뉘앙스 — 미로그인 방문자는 모듈 카드 클릭 시 proxy 보호 라우트라 sign-in 경유 후 가이드에 도달한다. "1클릭"은 로그인 사용자 기준(결론엔 영향 없음).
8. 모바일 패리티(연구 미언급, 결론 강화) — apps/mobile/app/(analysis)/personal-color/에는 저장 동의 UI가 아예 없다. imageStorageConsent는 integrated에만 있고 :169 기본 false. 웹 퍼컬만 켜져 있으므로 플립하면 웹·모바일이 일치한다.
9. 행번호 미세 오차 — version-check.ts `isImageConsentActive`는 16-32(33 아님), 모듈 그리드는 351-367(352-365), hair `runAnalysis(false)`는 268행. 그 외 types.ts:140, storage-uploader.ts:132·135(`imageStorageConsent !== true` 엄격 비교 확인), image-consent.ts:263-269·276-282, QuestionnaireForm:96·330·341, mobile integrated:169, skin:318, hair:232, makeup:226, consent route:172-174·176-181, pc page:95·242·570, LightingGuide:18·180·192, PrivacyContent:145·149·163은 전부 실측 일치. 방침 자기모순(:149 "필수" vs :163 "동의 안 해도 이용 가능" vs 구현=축별 선택)도 확인됨.

---

# 5. 법정대리인 동의 절차 — 신설 기각 (약관 간주 조항 교체 조건)

## 결정 (Decision) — ADR-022 보강: 만 14~19세 법정대리인 동의 절차 미도입 확정

**만 14~19세 이용자에 대한 법정대리인 동의 수집 절차를 신설하지 않는다.** 대신 이를 사실대로 반영하도록 이용약관 제5조를 개정한다.

### 근거

1. **법적 의무 부존재**: 개인정보보호법 제22조의2의 법정대리인 동의·확인 의무는 **만 14세 미만 한정**이다. 개보위 「아동·청소년 개인정보 보호 가이드라인」(2022.7.22)도 만 14세 이상 18세 미만 청소년 구간의 법적 의무를 ①눈높이 고지 ②맞춤형 광고 별도 동의 ③권리행사 지원 3가지로 한정하며 법정대리인 동의를 포함하지 않는다.
2. **민감정보 특칙 부존재**: 제23조는 민감정보(생체인식정보 포함)에 대해 "다른 처리 동의와 별도의 동의"만 요구하고 연령 특칙을 두지 않는다. 이룸은 가입 관문에서 `biometric` 필수 별도 항목으로 이미 충족(ADR-119 §1).
3. **플랫폼 요구 부존재**: Google Play Families 정책은 타깃에 아동이 포함될 때만 발동한다. `store-metadata.json`이 Teen/13+·`minimumUserAge 14`로 선언하므로 미발동이며, Play·Apple 모두 청소년에 대한 보호자 동의를 요구하지 않는다.
4. **업계 표준 일치**: 올리브영·화해·무신사·캐시워크 등 동종 뷰티/패션 앱은 14세 미만 차단만 운영하고 14~19세 별도 절차가 없다.
5. **P0(요구사항 의심)·P4(단순화)**: 요구의 출처를 추적한 결과 법령·감독기관·플랫폼 어디에도 근거가 없다. 본인인증 연동 비용과 이탈을 감수할 이유가 없다.

### 개정 대상 — 이용약관 제5조 (미성년자의 이용)

현행 ②항의 "이용자는 가입 시 이에 동의한 것으로 봅니다"는 **약관의 규제에 관한 법률 제12조 제1호(의사표시의 의제)**에 해당한다. 동호 단서의 예외("상당한 기한 내 미표시 시 의제된다는 뜻을 명확하게 따로 고지")를 충족하지 못하며, 나아가 계약 당사자가 아닌 법정대리인의 의사표시를 미성년자의 가입 행위로 간주하므로 보호자에 대한 효력이 없다. 현행 ④항의 법정대리인 책임 전가도 비당사자 구속이라 집행력이 없고 약관법 제6조·제7조 심사 위험이 있다.

**개정안:**

> **제5조 (미성년자의 이용)**
> ① 서비스는 만 14세 이상인 자만 이용할 수 있으며, 만 14세 미만의 아동은 서비스 가입 및 이용이 제한됩니다. _(유지)_
> ② 회사는 만 14세 미만 아동의 개인정보를 수집하지 않으므로, 개인정보 보호법 제22조의2에 따른 법정대리인 동의 절차를 별도로 운영하지 않습니다. 만 14세 이상 만 19세 미만의 이용자는 서비스 이용 전 법정대리인과 상의할 것을 권장합니다.
> ③ 회사는 이용자가 만 14세 미만임을 확인한 경우 해당 계정의 이용을 제한하거나 관련 정보를 지체 없이 파기할 수 있습니다. _(유지)_
> ④ 만 19세 미만 이용자의 법정대리인은 해당 이용자의 개인정보에 대하여 열람·정정·삭제·처리정지 및 회원 탈퇴를 요청할 수 있으며, 회사는 관련 법령에 따라 지체 없이 처리합니다. _(기존 책임전가 조항 대체)_

동일 문구가 웹(`apps/web/app/(main)/terms/page.tsx:50~54`)과 모바일(`apps/mobile/app/terms.tsx:61~65`) 2곳에 중복되므로 **동시 수정**하고, 문구를 고정하는 테스트(`apps/web/tests/pages/legal/TermsPage.test.tsx:76`, `apps/mobile/__tests__/app/terms.test.tsx:70`)를 함께 갱신한다. 약관 개정일자·부칙(제16조 상당)에도 개정 사실을 기재한다.

### 대안 (Alternatives Considered)

| 대안                                            | 장점                         | 단점                                                                                                | 기각 사유                                                                                                             |
| ----------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 14~19세 보호자 휴대폰 본인인증 동의 플로우 신설 | 취소권 리스크 원천 차단      | 건당 50~100원, 청소년 이탈 대폭, 보호자 정보(성명·연락처) 신규 수집 = 개인정보 최소수집 원칙에 역행 | `NO_LEGAL_BASIS` — 법적 의무 없음. 리스크 감축 대비 비용·복잡도 과다(P0/P4). 수집 안 해도 될 개인정보를 늘리는 역효과 |
| 만 19세 미만 전면 차단                          | 취소권·청소년 이슈 완전 소거 | 핵심 타깃(10대 후반 뷰티 관심층) 상실, 업계 관행 이탈                                               | `PRODUCT_LOSS` — 뷰티 앱 주요 사용층 제거는 제품 자해                                                                 |
| 현행 간주 조항 유지                             | 변경 0                       | 약관법 제12조 무효 소지 + 보호자 무구속 + ADR-022 기록과 상충하는 허위 외관                         | `LEGAL_RISK` — 보호 효과 0인데 리스크만 보유                                                                          |
| 유료화까지 결정 보류                            | 즉시 작업 0                  | 무효 소지 조항을 안고 Play 출시                                                                     | `DEFER_INVALID` — 문구 교체는 2파일 편집으로 끝나므로 보류 실익 없음                                                  |

### 결과 (Consequences)

- **긍정**: 약관 문구가 실제 구현(만 14세 fail-closed 차단, 보호자 동의 미수집)과 일치해 허위고지 소지 해소. 보호자 권리행사 채널이 명문화되어 개보위 가이드라인 권장사항 일부 충족. 개발 비용 0(문구 2파일 + 테스트 2파일).
- **부정/잔존 리스크**: 민법 제5조 취소권은 그대로 존속한다. 무료인 동안은 원상회복 대상이 없어 실손해가 없으나, **유료 기능(Tier B 이미지 크레딧) 도입 시 미성년자 결제 취소·환불 정책을 반드시 신설**해야 한다 — 본 ADR의 재검토 트리거로 명시한다.
- **후속 백로그(비차단)**: ①미국 출시 시 Texas/Utah/Louisiana App Store Accountability Act 대응(법정 4구간 연령등급 제출 + 스토어 연령·보호자동의 시그널 소비 시스템, 목적외 사용 금지·암호화·사용 후 삭제) ②생체정보 동의 문구의 청소년 눈높이 병기(가이드라인 권장) ③만 14세 미만 판정 후 생년월일 변경 재시도 차단(자가신고 통제장치 보강).

### 적대 검증 보강 노트

결론(법정대리인 동의 절차 신설 기각 + 간주 조항 문구 교체)은 검증 통과. 반박 시도 결과 핵심 논리를 뒤집는 사실은 없었음. 다만 5건 정정/보강.

■ 검증 통과 (반박 실패)

- PIPA 제22조의2 ①: "만 14세 미만 아동" 한정 확인(law.go.kr/CaseNote 원문). 14세 이상 법정대리인 동의 강제 조문은 PIPA·정보통신망법 어디에도 없음. (참고로 위치정보법 제25조②도 "14세 미만"으로 동일 — 이 앱은 위치 게이트가 있으나 역시 14~19 특칙 없음.)
- 약관법 제12조 제1호 + 단서 문언 일치 확인. 제5조②는 단서의 "명확하게 따로 고지" 요건 미충족 → 무효 소지 판단 타당.
- 민법 제5조 조문 일치. 무료 구간 실손해 0 / 유료화가 진짜 트리거라는 분석도 타당.
- PIPA 제23조에 연령 특칙 없음, 시행령 제18조3호의 "특정 개인을 알아볼 목적" 한정 지적도 정확(법적 하한은 더 낮다는 뜻).
- 코드 실측: 웹 apps/web/app/(main)/terms/page.tsx:52, 모바일 apps/mobile/app/terms.tsx:63 — 인용 라인 정확. AGREEMENT_ITEMS는 terms·privacy·biometric(필수)·marketing 4종이며 보호자 항목 없음, biometric description에 미국 Google 전송·보관기간·철회권 명시 — 전부 사실.

■ 정정 1 (인용 오귀속 — 유일하게 사실이 틀린 부분)
"어필리에이트 수수료 회수 리스크를 ADR-054:157이 인지"는 오독. 해당 라인은 "1회 구매 법적 요구사항(전자상거래법)" 표의 행 `| 미성년자 | 법정대리인 동의 없이 취소 가능 | 나이 확인 또는 결제 한도 |`로, **이룸이 직접 파는 1회 구매 디지털 상품**에 관한 것이지 어필리에이트 clawback이 아님. ADR-054 전체에 clawback·수수료 회수 언급 없음(grep 0건). → 오히려 이 라인은 "유료화 시점이 진짜 트리거"라는 ③ 결론을 **직접 뒷받침**하므로, 근거를 어필리에이트가 아니라 ③ 문단으로 옮겨 재인용할 것.

■ 정정 2 (가이드라인의 법적 성격 — "법적 의무 3가지" 표현 과장)
개보위 가이드라인(2022.7.22)은 정책브리핑·김·장 원문 확인 결과 **"자율점검용 안내서"**로, 청소년 구간 3항목은 법적 의무가 아니라 권고/자율점검 항목. 또 법률상 "이해하기 쉬운 고지" 의무는 제22조의2 ③이 **만 14세 미만에만** 부과하고, (b) 별도 동의·(c) 열람·정정·삭제·처리정지는 제22조·제35~37조가 **전 정보주체에 적용**하는 일반 의무라 청소년 특칙이 아님. 결론(보호자 동의 불요)은 동일하나, 문서에 "법적 의무 3가지"로 적으면 후속 세션이 규범을 오인함 — "가이드라인 권고 3항목"으로 표기 교체 권장. (원문 내부에서도 (a)를 의무로 열거해놓고 뒤에서 "권고 수준"이라 해 자기모순.)

■ 정정 3 (수리 범위 과소 — 실행 시 반드시 반영)
"웹·모바일 2파일"은 파일 수는 맞으나 **문자열은 4개**. 영문판이 각 파일에 존재:

- apps/web/app/(main)/terms/page.tsx:52(ko), :181(en)
- apps/mobile/app/terms.tsx:63(ko), :193(en)
  영문은 "Minors aged 14 to 18 … are deemed to have obtained such consent upon registration" — ①간주 문구 동일 결함, ②한글 "만 19세 미만"과 **연령 범위 드리프트(14–18 vs 14–19)**. 교체 시 en 2곳 동시 수정 + 범위 통일 필요.
  추가로 회귀 테스트 2곳이 문구를 단언: apps/web/tests/pages/legal/TermsPage.test.tsx:76 `/법정대리인\(부모 등\)의 동의를 받아야/`, apps/mobile/**tests**/app/terms.test.tsx:79 `/법정대리인\(부모 등\)의 동의/`. "법정대리인(부모 등)의 동의" 어구를 유지한 채 간주절만 제거하면 그린 유지, 어구까지 갈아엎으면 테스트 2파일도 수정 대상.

■ 보강 4 (스토어 정책 — "Play·Apple도 요구하지 않는다"는 KR 선공개 한정으로만 참)
일반 명제로는 이미 거짓. 미국 App Store Accountability Act(텍사스 SB2420, 2026-01-01 시행 — 제5순회 예비적 금지 정지로 실제 발효, 유타·루이지애나 동종법)은 앱스토어에 **18세 미만 전원에 대한 검증가능한 부모 동의**를 의무화하고, 개발자에게는 Apple Declared Age Range API / Google Play Age Signals API로 그 신호를 수신·적용할 의무를 부과. apps/mobile/store-metadata.json이 `ageRating "13+"`, `contentRating "Teen"`, `minimumUserAge 14`로 선언돼 있어 **미국 배포 시 정면 대상**. 다만 동의 취득 주체는 앱스토어이고 개발자 몫은 신호 소비이므로, "자체 보호자 동의 플로우 신설 기각"이라는 결론 자체는 미국에서도 유지됨. ko 단독 선공개 확정 상태에서는 비차단 이슈이나, 글로벌 확장(어필리에이트·미국 홍보) 시 백로그로 등록 필요.

■ 보강 5 (사소한 라인 인용 오차)
types.ts의 AGREEMENT_ITEMS는 31~70이 아니라 **34~63**, biometric 항목은 47~53이 아니라 **47~55**(description 52~55). 내용 판단에는 영향 없음.
또 "(c)는 계정 삭제·이미지 삭제 경로로 커버"는 과소평가 — apps/web/app/privacy/PrivacyContent.tsx:297~300에 열람·정정·삭제·처리정지 4권리가 모두 고지돼 있어 실제 커버 범위가 더 넓음. 반대로 (b) 관련해서는 개인정보처리방침에 행태정보·맞춤형 광고 언급이 0건이라 "광고 배제" 전제도 문서상 일관됨(확인 완료).

---

# 6. 문진 피부 고민 칩 — 지금 기각 (SKIN_GOALS 모바일 패리티로 대체)

## 결정: 통합 문진 피부 고민 칩 — 출시 후로 연기, 추가 시 '추천 전용' 원칙 고정

### 결정

1. **Play ko 선공개 전에는 통합 문진(`QuestionnaireForm.tsx` / 모바일 `integrated/index.tsx`)에 피부 고민 칩을 추가하지 않는다.** `questionnaire.skin.concerns`는 `[]` 하드코딩 상태를 유지하되, 스키마와 저장 경로(`axis-adapters.ts:401` → `skin_analyses.recommendations.selfReported`)는 그대로 보존한다(감사·후속 배선 대비).

2. **진짜 갭은 문진이 아니라 모바일 목표 편집 부재로 재정의한다.** ADR-117 v2 "명시적 목표 선택 UI"는 웹에 이미 착륙했고(`SkinGoalChips` → `/api/user/skin-goals` → `beauty_profiles.skin.userGoals` → `daily-routine.ts` 병합), 모바일은 `/api/routine/daily`가 내려준 목표를 **읽기만** 한다(`skin/routine.tsx:134-137`). 출시 후 우선 작업 = 모바일 칩 토글 + `/api/user/skin-goals`에 CORS/OPTIONS 추가(`routine/daily/route.ts:38·43·181` 패턴 복제).

3. **자가신고 비주입 원칙을 명문화한다 (전 축 적용).** 문진·성별·상황 등 사용자 자가신고 값은 **AI 진단 프롬프트에 주입하지 않는다.** 사진 기반 판정은 사진만으로 하고, 자가신고는 (a) DB 원본 적재, (b) 루틴 개인화(`mergeGoalsIntoConcerns`), (c) 제품·추천 큐레이션, (d) 액션 플랜 문구에만 쓴다. `types.ts:62-66`의 성별 주석을 전 자가신고 항목으로 확장한 것이다.

4. **훗날 문진 칩을 추가할 때의 계약**(선반영 금지, 착수 시 준수):
   - 칩 id는 `SKIN_GOAL_IDS` 7종을 **그대로 재사용**한다(별도 taxonomy 신설 금지). `types.ts:39`의 `z.array(z.string())`을 같은 enum으로 타이트닝한다.
   - 선택값은 분석 성공 후 `beauty_profiles.skin.userGoals`에 **병합**(덮어쓰기 금지)한다. 루틴 페이지에서 고른 목표가 재분석으로 리셋되면 안 된다.
   - `questionnaire.skin.concerns`는 "그때 그렇게 말했다"는 회차별 감사 기록으로만 남기고, 정본 목표는 언제나 `userGoals` 한 곳이다.

### 대안과 트레이드오프

- **지금 칩만 추가 (기각)**: 반나절이면 되지만 선택값을 읽는 코드가 0건이라 체감 효과가 없다. 이미 긴 통합 문진을 늘려 이탈만 키우고, "물어보고 안 쓰는 앱"이 된다 — P0(삭제 가능한가)·P4(단순화) 위반.
- **칩 + 프롬프트 주입으로 정확도 개선 (기각)**: VLM 시각 sycophancy 실증(사용자 진술 방향 스윙 최대 40%p, arXiv 2603.18373 / 2606.02578)상 판정이 자가신고를 추종하게 되어 재현성 계약이 깨지고, "중립 AI 뷰티 애널리스트" 포지셔닝의 근거가 사라진다. 정확도 개선처럼 보이지만 실제로는 사용자 입력의 되풀이다.
- **칩 + userGoals 풀 배선 (출시 후 후보)**: 1~1.5일. 가치는 실재하나 Play 제출 직전 핵심 전환 퍼널을 건드리는 회귀 리스크가 이득을 초과한다.
- **모바일 목표 토글 패리티만 (채택, 출시 후 우선)**: 반나절. 엔진·API·저장이 이미 있어 신규 로직 0, 웹/모바일 기능 격차 해소 효과는 가장 크다.

### 수용하는 한계

- 출시 시점 통합 분석은 사용자의 주관적 고민을 반영하지 않는다 — 루틴 개인화는 지표 파생(`deriveConcernsFromScores`, 임계 ≤40)만으로 동작한다. 목표를 반영하고 싶은 사용자는 웹 `/analysis/skin/routine`에서 칩을 고를 수 있고, 모바일에서는 (패리티 작업 전까지) 결과 확인만 가능하다.
- ADR-117 본문이 코드보다 stale하다("명시적 목표 선택 UI = v2"로 적혀 있으나 웹은 이미 구현). 본 결정과 함께 ADR-117에 현행 상태를 반영한다(doc-sync).

### 적대 검증 보강 노트

검증 결과: 코드 사실 주장은 전수 실측에서 **전부 일치**(치명적 오류 0). 결론(지금 칩 추가 안 함 / 프롬프트 주입 금지)은 유지. 다만 외부 인용 수치 1건이 틀렸고, 코드 서술 정밀도 2건 + 누락 근거 1건 보강 필요.

■ 실측 확인된 것(모두 참 — 재조사 불필요)

- ADR-117: 37줄·Accepted 2026-07-10 ✓ / 결정 #3 ":18" = "v1의 '목표 반영' = 지표 파생 관심사" ✓ / v2 로드맵 ":24"에 "명시적 목표 선택 UI" 명시 연기 ✓
- `apps/web/lib/skincare/skin-goals.ts` — SKIN_GOALS 7종 :37-45 ✓, SKIN_GOAL_IDS :26-34 ✓, GOAL_TO_CONCERN :57-66 ✓, mergeGoalsIntoConcerns :75-88 ✓ / 테스트 `tests/lib/skincare/skin-goals.test.ts:17-18`(동기화 + toHaveLength(7)) ✓
- 빈 배열 하드코딩: `QuestionnaireForm.tsx:100` ✓, `apps/mobile/app/(analysis)/integrated/index.tsx:443` ✓ (두 곳 리터럴 동일)
- 스키마 `lib/analysis/integrated/types.ts:39` = `z.array(z.string()).max(5).default([])` — 자유 문자열, enum 아님 ✓
- **"소비처 1곳뿐" 확정**: 전 저장소 grep에서 `selfReported`(≠selfReportedType)는 `axis-adapters.ts:401` **단 1건**. 즉 쓰기만 하고 되읽는 코드가 0건 — "DB에만 쌓인다"가 실측으로 성립. (참고: `apps/mobile/lib/scan/verdict.ts:203`·`lib/insights/generator.ts:243`의 `skin.concerns`는 **분석 산출 concerns**(skin_analyses 컬럼/번들)라 문진값과 무관 — 재검토 시 오탐 금지)
- 주입 금지 관례: `types.ts:65` 성별 명문 ✓ / `analyzeSkinV2WithGemini(imageBase64, priorHint, locale, fallbackSeed, deadline)` 실제 시그니처 `v2-analysis.ts:343-348`로 확인 — 문진 인자 없음 ✓ / hair :674-679 ✓, hair 문진값은 DB 컬럼만 :707-708 ✓ / `lib/gemini/**`에 `자가|문진|selfReport` 0건 ✓, `관심사` 문자열도 0건 ✓
- 웹 목표 파이프라인 실재 ✓: `components/skincare/SkinGoalChips.tsx`+`useSkinGoals.ts` → `analysis/skin/routine/page.tsx:347` 렌더 / `app/api/user/skin-goals/route.ts` GET·PATCH → `beauty_profiles.skin.userGoals` / 소비 `daily-routine.ts:88-91`·`care-phase.ts:45-74`·`capsule/daily.ts:608`
- "모바일 읽기 전용" ✓ (표현 정확): 모바일 전체에 `SkinGoal|userGoals|skin-goals` 참조 0건이지만, `apps/mobile/lib/api/routine.ts:114`가 `goals?: GoalData[]`로 웹 응답을 받고 `apps/mobile/app/(analysis)/skin/routine.tsx:135-137`에서 표시만 함 = 선택 UI·PATCH 클라이언트 부재.

■ 정정 1 (필수) — arXiv 수치 오류
논문 자체는 실재하고 ID·제목 정확: [arXiv 2603.18373 "To See or To Please: Uncovering Visual Sycophancy and Split Beliefs in VLMs"](https://arxiv.org/abs/2603.18373) (Rui Hong, Shuxue Quan). 트리거가 **텍스트 지시(사용자 질문 프레이밍)**라는 점도 맞아 방향성은 지지됨. 그러나 **"스윙 폭 최대 40%p"는 논문에 없다.** 실제 보고치: Visual Sycophancy 69.6%(vs Language Shortcut 23.3%·Perceptual Blindness 7.1%), Robust Refusal 0%, 선택예측 +9.5pp(72.1→81.6). 최대 스윙은 7B→72B 스케일링에서 Visual Sycophancy 72.4%→95.3% = **↑22.9pp**(Language Shortcut ↓22.8pp). 또한 측정 대상은 "시각 증거가 없거나 충돌해도 질문에 답해버림"이지 "사용자 자가신고 방향으로 판정이 끌려감"과 정확히 같지는 않음. → **40%p는 삭제**하고 "69.6% Visual Sycophancy·0% Robust Refusal(최대 22.9pp 스윙)"으로 교체. 이 인용은 이미 코드로 입증된 결론의 보조 근거라 결론에는 영향 없음.

■ 보강 2 — "목표를 파생보다 앞에 병합"은 루틴 경로에 적용 안 됨
`mergeGoalsIntoConcerns`(목표 우선 정렬)의 **프로덕션 호출부는 `lib/capsule/daily.ts:608` 하나뿐**이며 그마저 `isBarrier`가 아닐 때만 탄다. 정작 루틴 정본 `lib/skincare/daily-routine.ts`는 :69에 **자체 로컬 `goalsToConcerns`**를 따로 두고 :89-91에서 `Array.from(new Set([...derived, ...goalsToConcerns(goals)])).sort()` — 알파벳 `.sort()`가 목표 우선순위를 지운다. 더해 `components/skincare/routine-v2-contract.ts:206`에 GOAL_TO_CONCERN **세 번째 사본**이 존재. 결론(칩 보류)엔 영향 없으나, 나중에 목표 파이프라인을 손댈 때 "목표 우선 반영됨"(`step-spec.ts:33` 주석)이 루틴에선 사실이 아님을 알고 들어가야 함.

■ 보강 3 — stale 문서가 하나 더 있다 (주입 금지 근거 강화)
`ai-integration.md`의 `관심사: ${concerns.join(', ')}` 외에, **`docs/adr/ADR-099-integrated-analysis-flow.md:258`이 `analyzeSkin(input.faceImage, input.questionnaire.skin, userId, session.id)`로 문진을 분석기에 넘기도록 적어놨다**(실제 코드는 `axis-adapters.ts:344-350`로 미전달). 스펙 문서 두 곳이 "주입해도 된다"로 오독될 수 있으므로, 칩을 결국 붙일 때의 doc-sync 대상은 ADR-117 하나가 아니라 **ADR-117 + ADR-099:258 + ai-integration.md 예시** 3건.

■ 검증 불가(사실 주장 아님)
"출시 후 반나절짜리 패리티 작업" = 공수 추정치, 반박·확증 대상 아님.

---

**작성**: Claude Fable 5 (리서치 워크플로 wf_326f84d3) | 확정 시 Status를 accepted로 갱신하고 결정 변경분은 본문에 기록
