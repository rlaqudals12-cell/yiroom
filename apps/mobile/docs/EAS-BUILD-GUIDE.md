# EAS 빌드 가이드

> 이룸 모바일 앱 빌드 및 배포 가이드

## 사전 준비

### 1. EAS CLI 설치

```bash
npm install -g eas-cli
eas login
```

### 2. 프로젝트 설정

```bash
cd apps/mobile
eas init
```

### 3. 환경변수 설정

```bash
# .env.local 파일 생성 (.env.example 참조)
cp .env.example .env.local

# 환경변수 입력
# - EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY
# - EXPO_PUBLIC_GEMINI_API_KEY
```

### 4. EAS Secrets 설정 (민감 정보)

```bash
# 프로덕션 빌드용 시크릿 설정
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "your-token"
eas secret:create --scope project --name GOOGLE_PLAY_SERVICE_ACCOUNT --value "$(cat credentials/google-play-key.json)"
```

---

## 빌드 프로파일

### Development (개발)

```bash
# iOS + Android 동시 빌드
npm run build:dev

# 개별 플랫폼
npm run build:dev:ios
npm run build:dev:android

# 로컬 빌드 (Android만 지원)
npm run build:local:android
```

**용도**: 개발 및 디버깅

- Dev Client 활성화
- 디버그 모드
- 내부 배포

### Preview (미리보기)

```bash
npm run build:preview
npm run build:preview:android
```

**용도**: 테스터 배포

- 프로덕션과 유사한 설정
- TestFlight / Firebase App Distribution

### Production (프로덕션)

```bash
npm run build:production
```

**용도**: 앱 스토어 제출

- 릴리스 모드
- 코드 사이닝
- App Bundle (Android)

---

## 플랫폼별 설정

### iOS

#### 인증서 관리

```bash
# Apple 개발자 계정 로그인
eas credentials

# 인증서 생성 (자동)
eas build:configure
```

#### App Store Connect 연동

1. [App Store Connect](https://appstoreconnect.apple.com)에서 앱 생성
2. `eas.json`에 정보 입력:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

### Android

#### 서명 키 관리

```bash
# 키스토어 생성 (첫 빌드 시 자동)
eas credentials

# 기존 키스토어 업로드
eas credentials --platform android
```

#### Google Play Console 연동

1. [Google Play Console](https://play.google.com/console)에서 앱 생성
2. 서비스 계정 키 생성
3. `eas.json`에 정보 입력:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./credentials/google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 제출 (Submit)

### iOS (App Store)

```bash
# 빌드 후 제출
eas submit --platform ios --latest

# 특정 빌드 제출
eas submit --platform ios --id BUILD_ID
```

### Android (Google Play)

```bash
# 내부 테스트 트랙
eas submit --platform android --latest

# 프로덕션 트랙
eas submit --platform android --latest --track production
```

---

## 트러블슈팅

### 빌드 실패

```bash
# 빌드 로그 확인
eas build:view

# 캐시 클리어
eas build --clear-cache
```

### 인증서 문제 (iOS)

```bash
# 인증서 초기화
eas credentials --platform ios

# 프로비저닝 프로파일 재생성
eas build:configure
```

### 버전 충돌

```bash
# 버전 자동 증가
# eas.json에서 autoIncrement: true 설정됨

# 수동 버전 설정
eas build --auto-submit --non-interactive
```

---

## 체크리스트

### 빌드 전

- [ ] 환경변수 확인 (`.env.local`)
- [ ] `app.json` 버전 확인
- [ ] TypeScript 에러 없음 (`npm run typecheck`)
- [ ] E2E 테스트 통과 (`npm run test:e2e`)

### 제출 전

- [ ] 앱 아이콘 (1024x1024)
- [ ] 스플래시 화면
- [ ] 스크린샷 (iPhone, iPad, Android)
- [ ] 앱 설명 (한국어, 영어)
- [ ] 개인정보 처리방침 URL
- [ ] 마케팅 URL (선택)

---

## 명령어 요약

| 명령어                          | 설명                  |
| ------------------------------- | --------------------- |
| `npm run build:dev`             | 개발 빌드 (양 플랫폼) |
| `npm run build:preview`         | 미리보기 빌드         |
| `npm run build:production`      | 프로덕션 빌드         |
| `eas submit --platform ios`     | iOS 제출              |
| `eas submit --platform android` | Android 제출          |
| `eas credentials`               | 인증서 관리           |
| `eas secret:list`               | 시크릿 목록           |
