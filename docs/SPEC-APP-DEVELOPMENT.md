# 이룸 앱 개발 종합 스펙

> 2025-12-31 결정사항 문서화

## 1. 플랫폼 전략

### 1.1 핵심 원칙: App-First

```yaml
전략: App-First (앱 중심)
이유:
  - 핵심 기능(카메라 분석)이 앱에 최적화
  - 일일 사용 패턴(트래킹)이 앱에 적합
  - 리텐션/인게이지먼트가 앱이 월등

리소스 배분:
  앱: 70%
  웹: 30%
```

### 1.2 플랫폼별 역할

| 플랫폼 | 역할                           | 우선순위 |
| ------ | ------------------------------ | -------- |
| **앱** | 핵심 경험 (분석, 트래킹, 쇼핑) | 1순위    |
| **웹** | 유입 채널 (SEO, 공유 링크)     | 2순위    |

### 1.3 기능 분배

```
기능은 동일, UX만 최적화

공통 기능:
├── 분석 (PC-1, S-1, C-1, N-1)
├── 트래킹 (W-1, N-1)
├── 쇼핑 (제품 추천)
└── 리포트

앱 강점:
├── 카메라 직접 촬영
├── 푸시 알림
├── 위젯
└── 건강 앱 연동

웹 강점:
├── SEO 유입
├── 상세 제품 비교
├── 공유 링크 랜딩
└── PDF 리포트 출력
```

---

## 2. 코드 공유 아키텍처

### 2.1 전략: 경계 먼저, 실행 점진적 (Coinbase 방식)

```yaml
참고 사례:
  성공: Coinbase
    - UI 아닌 비즈니스 로직만 공유
    - NPM 패키지로 추출
    - GraphQL로 타입 통합

  실패: Airbnb
    - Brownfield(점진적) 접근
    - 경계 없이 시작
    - 복잡도 폭발

이룸 전략:
  - 공유 범위 사전 정의
  - 핵심 로직 먼저 이동
  - 앱 개발 시 shared에서 import
```

### 2.2 공유 범위 정의

| 영역                    | shared | web only   | mobile only  |
| ----------------------- | ------ | ---------- | ------------ |
| **타입 정의**           | ✅     | -          | -            |
| **분석 알고리즘**       | ✅     | -          | -            |
| **계산 함수**           | ✅     | -          | -            |
| **유효성 검사**         | ✅     | -          | -            |
| **상수/설정**           | ✅     | -          | -            |
| **UI 컴포넌트**         | -      | React      | React Native |
| **라우팅**              | -      | Next.js    | Expo Router  |
| **Supabase 클라이언트** | -      | Clerk-Next | Clerk-Expo   |
| **카메라/센서**         | -      | -          | expo-\*      |
| **SSR/SEO**             | -      | ✅         | -            |

### 2.3 이동 대상 (web → shared)

```typescript
// apps/web/lib/ → packages/shared/src/

이동 대상:
├── types/
│   ├── workout.ts (WorkoutType, BodyType, etc.)
│   ├── nutrition.ts
│   └── products.ts
├── workout/
│   ├── classifyWorkoutType.ts (분류 알고리즘)
│   ├── nutritionTips.ts (데이터)
│   └── skinTips.ts (데이터)
├── products/
│   └── matching.ts (매칭 점수 계산)
└── utils/
    └── workoutValidation.ts

유지 (웹 전용):
├── supabase/ (클라이언트 초기화)
├── api/ (Repository 패턴 - fetch 방식 다름)
├── stores/ (일부 웹 전용 상태)
└── rag/ (서버 전용)
```

### 2.4 packages/shared 구조

```
packages/shared/
├── src/
│   ├── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── workout.ts
│   │   ├── nutrition.ts
│   │   ├── analysis.ts
│   │   └── products.ts
│   ├── workout/
│   │   ├── index.ts
│   │   ├── classify.ts
│   │   ├── nutritionTips.ts
│   │   └── skinTips.ts
│   ├── products/
│   │   ├── index.ts
│   │   └── matching.ts
│   └── utils/
│       ├── index.ts
│       ├── validation.ts
│       ├── formatters.ts
│       └── calculations.ts
├── tests/
│   └── (Vitest 테스트)
├── package.json
└── tsconfig.json
```

---

## 3. 기술 결정사항

### 3.1 스타일링: NativeWind

```yaml
결정: NativeWind v4 사용

이유:
  - 웹 Tailwind와 동일한 클래스명
  - 디자인 토큰 공유 가능 (색상, 간격)
  - 장기 유지보수 일관성
  - Expo 54 + NativeWind v4 안정적

설정 필요:
  - nativewind 패키지 설치
  - tailwindcss 설치
  - babel.config.js 수정
  - metro.config.js 수정
  - tailwind.config.js 생성

대안 (불채택):
  - StyleSheet.create(): 웹과 완전히 다른 코드
```

### 3.2 API 레이어: Supabase 직접 (현재 유지)

```yaml
결정: 현재 구조 유지 (Supabase 직접 호출)

이유:
  - 이미 양쪽 플랫폼에서 동작
  - tRPC 추가는 큰 리팩토링
  - MVP에 불필요한 복잡도

현재 구조:
  웹: apps/web/lib/supabase/clerk-client.ts
  앱: apps/mobile/lib/supabase.ts
  공유: packages/shared/src/types/ (타입만)

향후 검토 (Phase 2):
  - tRPC 또는 GraphQL 도입 고려
  - API 추상화 레이어 필요 시
```

### 3.3 Supabase 클라이언트: 하이브리드

```yaml
결정: 클라이언트 분리, 타입만 공유

이유:
  - Clerk 통합 방식이 플랫폼별로 다름
    - 웹: @clerk/nextjs의 useAuth()
    - 앱: @clerk/clerk-expo의 useAuth() + SecureStore
  - 클라이언트 초기화 코드 공유 불가
  - 하지만 타입과 쿼리 패턴은 공유 가능

구조:
  apps/web/lib/supabase/
  ├── clerk-client.ts (웹 전용)
  └── server.ts (웹 전용)

  apps/mobile/lib/
  ├── supabase.ts (앱 전용)
  └── clerk.ts (앱 전용)

  packages/shared/src/types/
  └── database.ts (공유 타입)
```

---

## 4. 앱 구조

### 4.1 5탭 네비게이션

```
┌────────────────────────────────────────┐
│                 콘텐츠                  │
├────────────────────────────────────────┤
│  홈  │  뷰티  │  스타일  │  기록  │  나  │
└────────────────────────────────────────┘

홈 (index.tsx):
  - 대시보드
  - 오늘 할 일
  - 알림 요약

뷰티 (beauty.tsx):
  - PC-1 퍼스널 컬러
  - S-1 피부 분석
  - 화장품/스킨케어 추천

스타일 (style.tsx):
  - C-1 체형 분석
  - 의류/액세서리 추천
  - 스타일 가이드

기록 (track.tsx):
  - W-1 운동 기록
  - N-1 영양 기록
  - 물 섭취 트래킹

나 (profile.tsx):
  - 프로필 설정
  - 분석 히스토리
  - 리포트
```

### 4.2 앱 폴더 구조

```
apps/mobile/
├── app/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # 홈
│   │   ├── beauty.tsx     # 뷰티
│   │   ├── style.tsx      # 스타일
│   │   ├── track.tsx      # 기록
│   │   └── profile.tsx    # 나
│   ├── (auth)/
│   ├── (analysis)/
│   ├── (workout)/
│   └── (nutrition)/
├── components/
│   ├── ui/                # 공통 UI
│   ├── analysis/          # 분석 관련
│   ├── workout/           # 운동 관련
│   └── nutrition/         # 영양 관련
├── lib/
│   ├── clerk.ts           # ✅ 완료
│   ├── supabase.ts        # ✅ 완료
│   ├── gemini.ts          # ✅ 완료
│   ├── notifications.ts   # ✅ 완료
│   └── stores/
└── assets/
```

---

## 5. Claude Code 워크플로우

### 5.1 CLAUDE.md 계층 구조

```
yiroom/
├── CLAUDE.md              # 전체 프로젝트 규칙 (✅ 존재)
├── apps/
│   ├── web/
│   │   └── CLAUDE.md      # 웹 전용 규칙 (✅ 존재)
│   └── mobile/
│       └── CLAUDE.md      # 앱 전용 규칙 (❌ 생성 필요)
└── packages/
    └── shared/
        └── CLAUDE.md      # 공유 패키지 규칙 (❌ 생성 필요)
```

### 5.2 권장 워크플로우

```
Explore → Plan → Code → Commit

1. Explore (탐색)
   "파일 구조와 기존 코드를 분석해줘"
   → 코드 작성 없이 읽기만

2. Plan (계획)
   "think harder: 구현 계획을 세워줘"
   → 상세 계획 수립

3. Code (구현)
   "계획대로 구현해줘"
   → 실제 코드 작성

4. Commit (커밋)
   "변경사항 커밋해줘"
   → PR 생성
```

### 5.3 병렬 개발

```bash
# 터미널 1: 웹
cd apps/web && claude

# 터미널 2: 앱
cd apps/mobile && claude

# 터미널 3: 공유 패키지
cd packages/shared && claude
```

---

## 6. 환경 설정

### 6.1 turbo.json 수정 필요

```json
{
  "globalEnv": [
    // 기존...
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_GOOGLE_AI_API_KEY"
  ]
}
```

### 6.2 앱 환경 변수 (.env)

```bash
# apps/mobile/.env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_AI_API_KEY=AIza...
```

### 6.3 EAS Build 자격 증명 (별도 설정 필요)

```json
// apps/mobile/eas.json - submit 섹션
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "123456789",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 7. 실행 계획

### Phase 0: 환경 정비 (30분)

| 태스크                         | 예상 시간 | 우선순위 |
| ------------------------------ | --------- | -------- |
| 수정된 테스트 파일 커밋        | 5분       | 🔴 필수  |
| turbo.json EXPO*PUBLIC*\* 추가 | 5분       | 🔴 필수  |
| apps/mobile/CLAUDE.md 생성     | 10분      | 🔴 필수  |
| packages/shared/CLAUDE.md 생성 | 10분      | 🔴 필수  |

### Phase 1: 설정 (1시간)

| 태스크                  | 예상 시간 | 우선순위 |
| ----------------------- | --------- | -------- |
| NativeWind 설치 및 설정 | 30분      | 🟡 권장  |
| 앱 환경 변수 설정       | 15분      | 🔴 필수  |
| shared 패키지 구조 정리 | 15분      | 🔴 필수  |

### Phase 2: 코드 이동 (2시간)

| 태스크                      | 예상 시간 | 우선순위 |
| --------------------------- | --------- | -------- |
| 타입 정의 shared로 이동     | 30분      | 🔴 필수  |
| 분석 알고리즘 shared로 이동 | 45분      | 🔴 필수  |
| 유틸리티 함수 shared로 이동 | 30분      | 🔴 필수  |
| 웹에서 shared import 확인   | 15분      | 🔴 필수  |

### Phase 3: 앱 개발 (1주)

| 태스크             | 예상 시간 | 우선순위 |
| ------------------ | --------- | -------- |
| 탭 구조 변경 (5탭) | 1시간     | 🔴 필수  |
| 기본 UI 컴포넌트   | 2시간     | 🔴 필수  |
| 홈 탭 구현         | 3시간     | 🔴 필수  |
| 분석 기능 (카메라) | 1일       | 🔴 필수  |
| 트래킹 기능        | 1일       | 🔴 필수  |
| 쇼핑 기능          | 1일       | 🟡 권장  |

### Phase 4: 배포 준비

| 태스크             | 예상 시간 | 우선순위 |
| ------------------ | --------- | -------- |
| EAS 자격 증명 설정 | 별도      | 🔴 필수  |
| TestFlight 배포    | 1시간     | 🔴 필수  |
| 웹 Vercel 배포     | 30분      | 🔴 필수  |

---

## 8. 경쟁사 분석 요약

### 국내

| 플랫폼   | 카메라 분석 | 이룸 차별점 |
| -------- | ----------- | ----------- |
| 화해     | ❌ 없음     | AI 분석 5종 |
| 글로우픽 | ❌ 없음     | 통합 웰니스 |
| 무신사   | ❌ 없음     | 개인화 추천 |

### 해외 (Sephora)

| 기능      | Sephora | 이룸 |
| --------- | ------- | ---- |
| 피부 분석 | ✅      | ✅   |
| 체형 분석 | ❌      | ✅   |
| 운동 관리 | ❌      | ✅   |
| 영양 관리 | ❌      | ✅   |

---

## 9. 참고 자료 (2025-12-31 조사)

### 9.1 Anthropic / Claude Code

| 자료                       | URL                                                                                                    | 핵심 내용                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Claude Code Best Practices | [anthropic.com](https://www.anthropic.com/engineering/claude-code-best-practices)                      | CLAUDE.md 작성법, Explore→Plan→Code→Commit 워크플로우 |
| Using CLAUDE.md Files      | [claude.com/blog](https://claude.com/blog/using-claude-md-files)                                       | 모노레포 계층 구조, 자동 로딩                         |
| Monorepo CLAUDE.md 정리    | [dev.to](https://dev.to/anvodev/how-i-organized-my-claudemd-in-a-monorepo-with-too-many-contexts-37k7) | 컨텍스트 분리, 10k 단어 이하 권장                     |

**적용 사항:**

- CLAUDE.md 계층화 (root, web, mobile, shared)
- Explore → Plan → Code → Commit 워크플로우
- 터미널 분리로 병렬 작업
- `/clear` 명령으로 컨텍스트 리셋

### 9.2 Cursor AI

| 자료                     | URL                                                                                                                                   | 핵심 내용                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| React Native with Cursor | [medium.com](https://medium.com/@ssshubham660/harnessing-cursor-ai-for-react-native-development-a-comprehensive-guide-88ffffd27dd5)   | 함수형 컴포넌트, hooks 사용 |
| Cursor Rules for RN      | [playbooks.com](https://playbooks.com/rules/react-native)                                                                             | 성능 최적화, FlatList 팁    |
| Building Mobile Apps     | [medium.com](https://medium.com/@wqsbhtt/building-mobile-apps-with-cursor-ai-a-complete-guide-from-beginner-to-advanced-4f8a2462e52d) | 전체 가이드                 |

**적용 사항:**

- 함수형 컴포넌트 + Hooks 사용
- React.memo() 활용
- FlatList 최적화 (removeClippedSubviews, maxToRenderPerBatch)
- TypeScript strict 모드

### 9.3 코드 공유 전략

| 자료                    | URL                                                                                                           | 핵심 내용                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Coinbase RN 전환        | [coinbase.com/blog](https://www.coinbase.com/blog/announcing-coinbases-successful-transition-to-react-native) | UI 아닌 비즈니스 로직만 공유, 40-50% 코드 절감 |
| Expo Monorepo Guide     | [docs.expo.dev](https://docs.expo.dev/guides/monorepos/)                                                      | 공식 모노레포 설정, Metro 자동 구성            |
| Next.js + Expo 모노레포 | [github.com](https://github.com/tao101/nextjs15-expo-monorepo)                                                | Next.js 15 + Expo 예제                         |
| Callstack Monorepo      | [callstack.com](https://www.callstack.com/blog/setting-up-react-native-monorepo-with-yarn-workspaces)         | Yarn Workspaces 설정                           |

**적용 사항:**

- Coinbase 방식: 경계 먼저 정의, 비즈니스 로직만 공유
- Airbnb 실패 교훈: Brownfield 접근 피하기
- 타입/알고리즘은 shared, UI는 플랫폼별 분리

### 9.4 경쟁사 분석

| 플랫폼  | 자료                                                                                                                                                                                                   | 핵심 발견                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 화해    | [blog.hwahae.co.kr](https://blog.hwahae.co.kr/all/tech/14690), [etnews.com](https://www.etnews.com/20241112000353)                                                                                     | 웹 버전 론칭, 글로벌 웹 출시, 카메라 분석 없음 |
| Sephora | [sephora.com](https://www.sephora.com/beauty/skin-analysis-tool), [digitaldefynd.com](https://digitaldefynd.com/IQ/sephora-using-ai-case-study/)                                                       | Smart Skin Scan, Virtual Artist, 웹/앱 통합    |
| 무신사  | [thinkwithgoogle.com](https://www.thinkwithgoogle.com/intl/ko-kr/marketing-strategies/app-and-mobile/), [aws.amazon.com](https://aws.amazon.com/ko/blogs/tech/musinsa-ai-base-product-recommendation/) | PC웹 종료, 모바일 집중, AI 추천                |

**적용 사항:**

- 이룸 차별점: 카메라 기반 AI 분석 (경쟁사에 없음)
- 웹/앱 통합 전략 (Sephora 참고)
- 앱 중심 전환 트렌드 (무신사 참고)

### 9.5 스타일링 (NativeWind)

| 자료              | URL                                                                                                                                          | 핵심 내용                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| NativeWind 공식   | [nativewind.dev](https://www.nativewind.dev/)                                                                                                | Tailwind CSS for React Native |
| AR in Beauty      | [rockpaperreality.com](https://rockpaperreality.com/insights/ar-use-cases/ar-beauty-cosmetics-industry/)                                     | 뷰티 테크 트렌드              |
| Beauty E-Commerce | [peelinsights.com](https://www.peelinsights.com/post/beauty-e-commerce-trends-2024-a-comprehensive-guide-for-founders-and-marketing-leaders) | 개인화 필수, 앱 다운로드 증가 |

**적용 사항:**

- NativeWind v4 선택 (웹 Tailwind와 동일 클래스명)
- 디자인 토큰 공유 가능
- 장기 유지보수 일관성

---

## 10. 저장소 구조 결정 (2026-01-01 추가)

### 10.1 결정: 단일 저장소 (서브모듈 ❌)

```yaml
결정: 서브모듈 → 일반 디렉토리 변환
이유:
  - Expo SDK 52+ 모노레포 자동 감지
  - Turborepo 캐싱 최적화
  - @yiroom/shared import 단순화
  - 커밋/푸시 단일화 (2번 → 1번)
```

### 10.2 변환 방법

```bash
# 서브모듈 제거, 파일 유지
rm -rf apps/mobile/.git
git rm --cached apps/mobile
git add apps/mobile
git commit -m "chore: mobile 서브모듈을 일반 디렉토리로 변환"
```

### 10.3 근거 자료 (2026-01-01 조사)

| 자료                       | URL                                                                                                                                                | 핵심 내용                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Turborepo 2025 Guide       | [medium.com](https://medium.com/better-dev-nextjs-react/setting-up-turborepo-with-react-native-and-next-js-the-2025-production-guide-690478ad75af) | "apps/mobileApp/.git 삭제 후 통합" 권장 |
| Expo Monorepo Docs         | [docs.expo.dev](https://docs.expo.dev/guides/monorepos/)                                                                                           | 공식 모노레포 가이드, 단일 저장소       |
| Cursor Monorepo Rules      | [cursor.directory](https://cursor.directory/rules/monorepo)                                                                                        | Turbo 기반 단일 저장소 권장             |
| Claude Code Best Practices | [anthropic.com](https://www.anthropic.com/engineering/claude-code-best-practices)                                                                  | CLAUDE.md 계층 구조 지원                |

### 10.4 최종 구조

```
yiroom/                    # 단일 Git 저장소
├── .git/                  # 하나의 Git만 존재
├── apps/
│   ├── web/               # Next.js (기존)
│   └── mobile/            # Expo (서브모듈 아님)
├── packages/
│   └── shared/            # 공통 타입/유틸
└── CLAUDE.md
```

---

## 11. 문서 이력

| 버전 | 날짜       | 변경 내용                                      |
| ---- | ---------- | ---------------------------------------------- |
| 1.0  | 2025-12-31 | 초기 작성 - 전체 결정사항 통합                 |
| 1.1  | 2025-12-31 | 참고 자료 섹션 추가 (조사 출처 명시)           |
| 1.2  | 2026-01-01 | 저장소 구조 결정 추가 (서브모듈 → 단일 저장소) |

---

## 관련 문서

- [SPEC-PLATFORM-STRATEGY.md](./SPEC-PLATFORM-STRATEGY.md) - 플랫폼 전략 상세
- [SPEC-MOBILE-APP.md](./SPEC-MOBILE-APP.md) - 앱 개발 기술 스펙
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 규칙

---

**핵심 메시지**: App-First 전략으로 카메라 분석 중심 앱 개발, Coinbase 방식의 코드 공유, NativeWind로 스타일 일관성 유지
