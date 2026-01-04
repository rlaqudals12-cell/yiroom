# 이룸 모바일 앱 배포 가이드

## TestFlight 배포 (iOS)

### 사전 요구사항

1. **Apple Developer 계정**
   - Apple Developer Program 가입 ($99/년)
   - App Store Connect 접근 권한

2. **Expo EAS 계정**
   - expo.dev 계정 생성
   - EAS CLI 설치: `npm install -g eas-cli`
   - 로그인: `eas login`

3. **환경 변수 설정**
   ```bash
   # EAS Secrets 또는 eas.json에 설정
   EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
   EXPO_PUBLIC_PROJECT_ID=<your-expo-project-id>
   ```

### 설정 단계

#### 1. EAS Project 연결

```bash
cd apps/mobile

# EAS 프로젝트 초기화 (이미 eas.json 있으면 스킵)
eas init

# app.json의 extra.eas.projectId 업데이트됨
```

#### 2. Apple 자격 증명 설정

`eas.json`의 submit.production.ios 섹션 업데이트:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890", // App Store Connect 앱 ID
        "appleTeamId": "ABCD1234" // Apple Developer Team ID
      }
    }
  }
}
```

#### 3. iOS 빌드

```bash
# Preview 빌드 (내부 테스트용)
npm run build:preview:ios

# 또는 Production 빌드
eas build --profile production --platform ios
```

#### 4. TestFlight 제출

```bash
# 빌드 완료 후 TestFlight에 자동 제출
eas submit --platform ios

# 또는 빌드와 제출 동시 실행
eas build --profile production --platform ios --auto-submit
```

### 빌드 프로파일

| 프로파일    | 용도                | 배포 방식              |
| ----------- | ------------------- | ---------------------- |
| development | 개발용 (Dev Client) | 내부 배포              |
| preview     | 베타 테스트         | 내부 배포 + AdHoc      |
| production  | 정식 출시           | App Store / TestFlight |

## Android 배포 (Google Play 내부 테스트)

### 1. Google Play Console 설정

1. Google Play Console에서 앱 생성
2. 서비스 계정 JSON 키 생성
3. `eas.json` 업데이트:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path-to-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 2. Android 빌드 및 제출

```bash
# AAB 빌드 (App Bundle)
eas build --profile production --platform android

# Google Play 제출
eas submit --platform android
```

## 배포 체크리스트

### 배포 전 확인사항

- [ ] 모든 테스트 통과 (`npm test`)
- [ ] TypeScript 오류 없음 (`npm run typecheck`)
- [ ] Lint 오류 없음 (`npm run lint`)
- [ ] app.json 버전 업데이트
- [ ] 환경 변수 확인
- [ ] 프라이버시 정책 URL 설정
- [ ] 앱 아이콘/스플래시 이미지 확인

### iOS 특별 확인사항

- [ ] Info.plist 권한 설명 (카메라, 사진)
- [ ] ATT (App Tracking Transparency) 설정 (필요시)
- [ ] 푸시 알림 인증서 (APNs)

### Android 특별 확인사항

- [ ] AndroidManifest 권한
- [ ] Proguard 규칙 (release 빌드)
- [ ] 앱 서명 키 백업

## EAS Build 명령어

```bash
# 개발용 빌드
npm run build:dev:ios
npm run build:dev:android

# 프리뷰 빌드
npm run build:preview

# 프로덕션 빌드
npm run build:production

# 빌드 상태 확인
eas build:list
```

## 트러블슈팅

### 빌드 실패

1. 로그 확인: `eas build:view <build-id>`
2. 캐시 정리: `npx expo start --clear`
3. 의존성 재설치: `rm -rf node_modules && npm install`

### 제출 실패

1. 자격 증명 확인
2. 앱 ID/번들 ID 일치 확인
3. 버전 번호 충돌 확인

## 연락처

- EAS 문서: https://docs.expo.dev/build/introduction/
- Apple Developer: https://developer.apple.com/
- Google Play Console: https://play.google.com/console/
