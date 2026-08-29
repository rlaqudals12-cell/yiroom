# 이룸 모바일 앱 빌드 계획

> **작성일**: 2026-02-04
> **목표**: Android APK 배포 (Google Play) → GFSA 지원
> **우선순위**: Android > iOS (iOS는 Apple Developer 계정 확보 후)
> **전략**: PWA 기능 검증 → Expo 테스트 → EAS 빌드 → 스토어 제출

---

## 빠른 시작 (다음 대화용)

```bash
# 1. 문서 확인
cat apps/mobile/docs/MOBILE-BUILD-PLAN.md

# 2. 현재 Phase 확인 후 해당 작업 진행

# Phase 0: PWA 기능 검증 (웹)
cd apps/web && npm run dev
# http://localhost:3000 에서 기능 테스트

# Phase 1: 로컬 테스트 (모바일)
cd apps/mobile && npx expo start

# Phase 2: EAS 빌드
npx eas build --platform android --profile development --non-interactive
```

---

## Phase 0: PWA 기능 검증 (~ 02.05) ✨ 신규

> **목적**: 공통 비즈니스 로직 사전 검증, EAS 빌드 전 버그 발견

### 0.1 개발 서버 실행

```bash
cd apps/web
npm run dev
# http://localhost:3000
```

### 0.2 핵심 기능 테스트

| ID   | 기능                | 테스트 항목                         | 상태 | 비고       |
| ---- | ------------------- | ----------------------------------- | ---- | ---------- |
| P0.1 | **인증**            | Clerk 로그인/로그아웃               | ⏳   | /sign-in   |
| P0.2 | **퍼스널컬러 분석** | 이미지 업로드 → AI 분석 → 결과 표시 | ⏳   | /analysis  |
| P0.3 | **피부 분석**       | 이미지 업로드 → AI 분석 → 결과 표시 | ⏳   | /analysis  |
| P0.4 | **체형 분석**       | 이미지 업로드 → AI 분석 → 결과 표시 | ⏳   | /analysis  |
| P0.5 | **대시보드**        | 분석 결과 요약 표시                 | ⏳   | /dashboard |
| P0.6 | **네비게이션**      | 페이지 간 이동 정상 동작            | ⏳   | 전체       |
| P0.7 | **반응형 UI**       | 모바일 뷰포트에서 레이아웃 확인     | ⏳   | 375px 기준 |

### 0.3 PWA vs Mobile 공유 로직

| 영역             | 공유 여부 | 비고                               |
| ---------------- | --------- | ---------------------------------- |
| AI 분석 API 호출 | ✅ 공유   | lib/gemini, lib/analysis           |
| Supabase 연동    | ✅ 공유   | lib/supabase                       |
| Clerk 인증       | ✅ 공유   | @clerk/nextjs vs @clerk/clerk-expo |
| 비즈니스 로직    | ✅ 공유   | 점수 계산, 추천 로직               |
| UI 컴포넌트      | ❌ 별도   | React vs React Native              |
| 카메라/이미지    | ❌ 별도   | Web API vs expo-camera             |

### 0.4 Phase 0 완료 기준

- [ ] 모든 분석 기능 정상 동작 (퍼스널컬러, 피부, 체형)
- [ ] 인증 플로우 정상 동작
- [ ] 발견된 버그 수정 완료
- [ ] 모바일 뷰포트에서 UI 깨짐 없음

---

## Phase 1: 로컬 기능 테스트 (02.05 ~ 02.06)

### 1.1 개발 환경 테스트

| ID   | 작업                        | 상태 | 비고                   |
| ---- | --------------------------- | ---- | ---------------------- |
| T1.1 | `npx expo start` 실행 확인  | ⏳   | 개발 서버 정상 시작    |
| T1.2 | Expo Go 앱에서 QR 스캔 연결 | ⏳   | iOS/Android 실기기     |
| T1.3 | 핫 리로드 동작 확인         | ⏳   | 코드 변경 시 자동 반영 |

### 1.2 핵심 기능 테스트

| ID   | 기능                | 테스트 항목                         | 상태 |
| ---- | ------------------- | ----------------------------------- | ---- |
| T2.1 | **인증**            | Clerk 로그인/로그아웃               | ⏳   |
| T2.2 | **카메라**          | 권한 요청, 촬영, 이미지 반환        | ⏳   |
| T2.3 | **이미지 피커**     | 갤러리 접근, 이미지 선택            | ⏳   |
| T2.4 | **퍼스널컬러 분석** | 이미지 업로드 → AI 분석 → 결과 표시 | ⏳   |
| T2.5 | **피부 분석**       | 이미지 업로드 → AI 분석 → 결과 표시 | ⏳   |
| T2.6 | **체형 분석**       | 이미지 업로드 → AI 분석 → 결과 표시 | ⏳   |
| T2.7 | **대시보드**        | 분석 결과 요약 표시                 | ⏳   |
| T2.8 | **네비게이션**      | 탭/스택 네비게이션 정상 동작        | ⏳   |

### 1.3 테스트 환경 설정

```bash
# 환경 변수 확인 (apps/mobile/.env.local)
EXPO_PUBLIC_CLERK_PUBLISHABLE=pk_test_...
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON=eyJ...

# 테스트 실행 명령
cd apps/mobile
npx expo start

# 실기기 테스트 (Expo Go)
# 1. iOS: App Store에서 Expo Go 설치
# 2. Android: Play Store에서 Expo Go 설치
# 3. QR 코드 스캔하여 연결
```

### 1.4 Expo Go 제한사항

| 기능                 | Expo Go | Development Build |
| -------------------- | ------- | ----------------- |
| 기본 UI/네비게이션   | ✅      | ✅                |
| Clerk 인증           | ✅      | ✅                |
| 카메라               | ✅      | ✅                |
| 푸시 알림            | ❌      | ✅                |
| 커스텀 네이티브 모듈 | ❌      | ✅                |

> **참고**: 대부분 기능은 Expo Go에서 테스트 가능. 푸시 알림은 Development Build 필요.

---

## Phase 2: EAS 빌드 오류 해결 (02.05 ~ 02.07)

### 2.1 현재 상태

| 항목              | 상태    | 비고                                   |
| ----------------- | ------- | -------------------------------------- |
| EAS 프로젝트 연결 | ✅ 완료 | projectId 설정됨                       |
| 아카이브 크기     | ✅ 해결 | 1.8GB → 163MB                          |
| Android Keystore  | ✅ 완료 | EAS 자동 관리                          |
| 빌드 실행         | ❌ 실패 | "Unknown error in Build complete hook" |

### 2.2 오류 분석

**오류 메시지**:

```
🤖 Android build failed:
Unknown error. See logs of the Build complete hook build phase for more information.
```

**시도한 해결책**:
| 시도 | 결과 | 비고 |
|------|------|------|
| @sentry/react-native 플러그인 제거 | ❌ 실패 | app.json에서 제거 |
| expo-notifications 플러그인 제거 | ❌ 실패 | app.json에서 제거 |
| runtimeVersion → updates.enabled: false | ❌ 실패 | expo-updates 비활성화 |
| --clear-cache 옵션 | ❌ 실패 | 캐시 초기화 |

**추정 원인**:

1. 모노레포 `@yiroom/shared` 패키지 해석 문제
2. metro.config.js의 monorepoRoot 경로가 EAS 서버에서 다르게 해석
3. 일부 네이티브 모듈 호환성 문제

**실패한 빌드 로그** (Expo 대시보드에서 확인):

- `0880eabf-d7c4-48b1-bb8b-9d8898449531`
- `9fe8b0fc-7258-441a-a612-4e948c04b48e`
- `e6f123d5-c2a8-479f-ad14-dd6942c5dd41`
- `5b028666-cb39-4a59-81b6-687703929a64`
- `f57f8758-9066-4e87-846d-8c08e24d8ceb`

```bash
# 빌드 상세 확인
npx eas build:view <BUILD_ID>

# Expo 대시보드
# https://expo.dev/accounts/rlaqudals12/projects/yiroom/builds/<BUILD_ID>
```

**미해결 의존성 문제**:

- `@sentry/react-native` - app.json에서 플러그인 제거했으나 package.json에 여전히 존재
- 완전 제거 필요: `npm uninstall @sentry/react-native`

### 2.3 다음 시도할 해결책

| ID  | 해결책                                 | 우선순위 | 예상 시간 |
| --- | -------------------------------------- | -------- | --------- |
| F1  | `@yiroom/shared` 의존성 제거 후 테스트 | 높음     | 1h        |
| F2  | metro.config.js 모노레포 설정 단순화   | 높음     | 1h        |
| F3  | EAS 로그 직접 확인 (Expo 대시보드)     | 높음     | 30m       |
| F4  | preview 프로필로 빌드 시도             | 중간     | 30m       |
| F5  | production 프로필로 빌드 시도          | 중간     | 30m       |
| F6  | 로컬 빌드 시도 (`--local` 옵션)        | 낮음     | 2h        |

---

## Phase 3: Android 빌드 및 배포 (02.07 ~ 02.10)

### 3.1 빌드 원자 단계

```
[A1] EAS 빌드 오류 해결
     ↓
[A2] Development APK 빌드 성공
     ↓
[A3] 실기기 APK 설치 테스트
     ↓
[A4] Preview APK 빌드
     ↓
[A5] 베타 테스터 배포 (내부 테스트)
     ↓
[A6] Production AAB 빌드
     ↓
[A7] Google Play Console 등록
     ↓
[A8] 내부 테스트 트랙 출시
     ↓
[A9] 프로덕션 출시
```

### 3.2 Google Play 출시 준비물

| 항목                       | 상태 | 비고               |
| -------------------------- | ---- | ------------------ |
| Google Play Developer 계정 | ⏳   | $25 일회성         |
| 앱 아이콘 (512x512)        | ✅   | assets/icon.png    |
| 기능 그래픽 (1024x500)     | ⏳   | 스토어 배너        |
| 스크린샷 (최소 2장)        | ⏳   | 폰/태블릿          |
| 앱 설명 (한국어)           | ⏳   | 4000자 이내        |
| 개인정보처리방침 URL       | ✅   | yiroom.app/privacy |
| 연령 등급 설문             | ⏳   | Play Console에서   |

---

## Phase 3.5: 프로덕션 환경 설정 (EAS 빌드 성공 후)

> **시점**: EAS Development 빌드 성공 후, 스토어 제출 전
> **목적**: Mock 데이터 → 실제 API 전환, 보안 키 관리

### 3.5.1 환경별 데이터 사용

| 환경         | 빌드 프로필 | 데이터 소스         | 용도            |
| ------------ | ----------- | ------------------- | --------------- |
| 개발         | development | Mock 가능           | 기능 검증       |
| 미리보기     | preview     | 실제 API (스테이징) | 내부 테스터     |
| **프로덕션** | production  | **실제 API 필수**   | **스토어 심사** |

> **중요**: Google Play/App Store 심사 시 **실제 기능이 동작**해야 함. Mock 데이터만 보여주면 리젝 가능.

### 3.5.2 EAS Secrets 설정 (권장)

```bash
# 프로덕션 API 키 등록 (암호화 저장)
# Google AI 키는 모바일 EAS가 아니라 웹 서버(Vercel) 환경에만 등록합니다.
eas secret:create --scope project --name SUPABASE_URL --value "실제_URL"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "실제_키"
eas secret:create --scope project --name CLERK_PUBLISHABLE_KEY --value "실제_키"

# 등록된 시크릿 확인
eas secret:list
```

### 3.5.3 eas.json 환경 변수 설정

```json
// eas.json - production 프로필에 추가
"production": {
  "extends": "base",
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "@SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON": "@SUPABASE_ANON_VALUE",
    "EXPO_PUBLIC_CLERK_PUBLISHABLE": "@CLERK_PUBLISHABLE_VALUE"
  }
}
```

### 3.5.4 환경 설정 체크리스트

| 항목                   | 상태 | 비고                |
| ---------------------- | ---- | ------------------- |
| EAS Secrets 등록       | ⏳   | 4개 키              |
| eas.json env 설정      | ⏳   | production 프로필   |
| 실제 API 테스트        | ⏳   | Preview 빌드로 검증 |
| Mock fallback 비활성화 | ⏳   | 프로덕션 전용       |

### 3.5.5 API 키 관리 원칙

| 방법              | 보안    | 권장 환경               |
| ----------------- | ------- | ----------------------- |
| `.env.local` 직접 | ⚠️ 낮음 | 로컬 개발만             |
| **EAS Secrets**   | ✅ 높음 | **Preview, Production** |
| 하드코딩          | ❌ 금지 | 절대 사용 금지          |

---

## Phase 4: iOS 빌드 (02.10 이후, 선택)

### 4.1 필수 준비물

| 항목                   | 상태 | 비고               |
| ---------------------- | ---- | ------------------ |
| Apple Developer 계정   | ⏳   | $99/년             |
| App Store Connect 설정 | ⏳   | 계정 확보 후       |
| Provisioning Profile   | ⏳   | EAS 자동 생성 가능 |

### 4.2 iOS 빌드 명령

```bash
# Development (테스트용)
npx eas build --platform ios --profile development

# Production (App Store)
npx eas build --platform ios --profile production

# TestFlight 제출
npx eas submit --platform ios
```

---

## iOS vs Android 비교

### 빌드 시간 차이 이유

| 요소          | Android              | iOS                           |
| ------------- | -------------------- | ----------------------------- |
| **컴파일러**  | Gradle (Java/Kotlin) | Xcode (Swift/Obj-C)           |
| **빌드 환경** | Linux VM             | macOS VM (비용 높음)          |
| **코드 서명** | 단순 (Keystore)      | 복잡 (Provisioning Profile)   |
| **아키텍처**  | 단일 APK             | 여러 아키텍처 (arm64, x86_64) |
| **예상 시간** | 10-15분              | 15-20분                       |

### 코드 동일성

- **99% 동일**: React Native 코드는 플랫폼 공유
- **플랫폼별 분기**: `Platform.OS === 'ios'` 또는 `*.ios.tsx` / `*.android.tsx`
- **현재 이룸**: 플랫폼별 코드 거의 없음 (공통 코드로 충분)

---

## Plan B: PWA 대안

EAS 빌드가 계속 실패할 경우 PWA로 우선 배포 가능.

### PWA 장점

- 스토어 심사 불필요
- 즉시 배포 가능
- 웹앱 (`apps/web`)은 이미 PWA 지원

### PWA 단점

- 푸시 알림 제한 (iOS Safari)
- 일부 네이티브 기능 제한
- 홈 화면 추가 필요

### PWA 배포 명령

```bash
cd apps/web
npm run build
# Vercel에 자동 배포됨
```

---

## 환경 정보

```yaml
Expo SDK: 54.0.0
EAS CLI: >= 16.0.0
Node.js: 20.18.0
React Native: 0.81.5
TypeScript: 5.9.2

# 주요 의존성
@clerk/clerk-expo: ^2.19.8
expo-camera: ~17.0.9
expo-image-picker: ~17.0.8
expo-router: ^6.0.15
nativewind: ^4.2.1
react-native-reanimated: ^4.2.1
```

---

## 파일 변경 이력

| 날짜  | 파일       | 변경 내용                               |
| ----- | ---------- | --------------------------------------- |
| 02-04 | .easignore | 패턴 개선 (apps/web 604MB 제외)         |
| 02-04 | app.json   | @sentry/react-native 플러그인 제거      |
| 02-04 | app.json   | expo-notifications 플러그인 제거        |
| 02-04 | app.json   | runtimeVersion → updates.enabled: false |

---

## 참고 링크

- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [Expo 모노레포 가이드](https://docs.expo.dev/guides/monorepos/)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer](https://developer.apple.com/)

---

**Version**: 1.1 | **Updated**: 2026-02-05 | Phase 3.5 환경 설정 섹션 추가
