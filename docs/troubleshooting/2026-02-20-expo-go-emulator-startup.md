# Expo Go 에뮬레이터 실행 트러블슈팅

> **날짜**: 2026-02-20
> **영향 영역**: 모바일 개발 환경 (Expo Go + Android 에뮬레이터)
> **심각도**: 높음 (개발 워크플로우 차단)
> **상태**: ✅ 해결됨

---

## 요약

Android 에뮬레이터에서 Expo Go로 모바일 앱을 실행하는 데 여러 문제가 연쇄적으로 발생.
근본 원인은 3가지: **(1) Expo CLI 버그**, **(2) SDK 버전 불일치**, **(3) 네트워크 설정**.

**빠른 실행 방법**: `scripts/expo-emulator.sh` 스크립트 사용 (아래 참조)

---

## 1. Expo CLI `Body is unusable` 크래시

### 증상

```
TypeError: Body is unusable: Body has already been read
at getNativeModuleVersionsAsync
```

Metro 시작 직후 크래시. `npx expo start`, `npx expo start --android` 모두 동일.

### 원인

`@expo/cli` 내부의 `validateDependenciesVersionsAsync` → `getNativeModuleVersionsAsync`에서
HTTP 응답 body를 두 번 읽으려 해서 발생하는 **Expo CLI 버그** (SDK 54 기준).

코드 위치: `node_modules/@expo/cli/build/src/start/startAsync.js` line 154-155

```js
// line 154: 이 조건을 우회해야 함
if (!_env.env.EXPO_NO_DEPENDENCY_VALIDATION && !settings.webOnly && !options.devClient) {
  await validateDependenciesVersionsAsync(projectRoot, exp, pkg); // 여기서 크래시
}
```

### 해결

```bash
# 환경변수로 의존성 검증 건너뛰기
EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start --go --port 8081
```

### 시도했지만 효과 없었던 방법

| 방법               | 결과                                      |
| ------------------ | ----------------------------------------- |
| `EXPO_NO_DOCTOR=1` | ❌ 다른 검사만 건너뜀, 이 버그에 무효     |
| `--offline` 플래그 | ⚠️ 크래시는 피하지만 매니페스트 서명 불가 |
| `--go` 플래그만    | ❌ 여전히 크래시                          |

---

## 2. SDK 버전 불일치

### 증상

Expo Go에서 "Project is incompatible with this version of Expo Go" 에러.

### 원인

| 항목           | 값                  |
| -------------- | ------------------- |
| 프로젝트 SDK   | **54.0.33**         |
| 설치된 Expo Go | **2.33.4** (SDK 52) |

Expo Go는 **정확히 같은 SDK 메이저 버전**이어야 프로젝트를 로드할 수 있음.

### 해결

```bash
# 기존 Expo Go 삭제
adb uninstall host.exp.exponent

# Expo Go 54 다운로드 (185MB)
# https://github.com/expo/expo-go-releases/releases
curl -L -o expo-go-54.apk \
  "https://github.com/expo/expo-go-releases/releases/download/Expo-Go-54.0.6/Expo-Go-54.0.6.apk"

# 설치
adb install expo-go-54.apk
```

### 확인 방법

Expo Go 앱 실행 후 개발자 메뉴에서 `SDK version: 54.0.0` 확인.

---

## 3. 에뮬레이터 네트워크 (ADB 포트 포워딩)

### 증상

Expo Go에서 `exp://localhost:8081` 입력해도 연결 안 됨.

### 원인

Android 에뮬레이터의 `localhost`는 **에뮬레이터 자체**를 가리킴 (호스트 PC가 아님).

- 에뮬레이터 → 호스트: `10.0.2.2` (특수 주소)
- 하지만 Expo Go는 `exp://10.0.2.2:8081`을 인식하지 못하는 경우가 있음

### 해결

```bash
# ADB reverse: 에뮬레이터의 localhost:8081 → 호스트의 localhost:8081
adb reverse tcp:8081 tcp:8081

# 이후 Expo Go에서 exp://localhost:8081 로 연결 가능
```

---

## 4. Expo Go에서 수동 URL 입력

### 증상

`npx expo start --android` 또는 deep link(`exp://localhost:8081`)가 앱을 자동으로 열지 않음.
`--android` 플래그는 Chrome에서 HTTP URL을 열어버림.

### 해결

Expo Go 앱에서 수동으로 URL 입력:

1. Expo Go 홈 화면에서 **"Enter URL manually"** 탭
2. `exp://localhost:8081` 입력
3. **Connect** 탭

### ADB로 자동화 (스크립트에 포함)

```bash
# Expo Go 실행
adb shell am start -n host.exp.exponent/.experience.HomeActivity
sleep 3

# deep link로 직접 연결 시도
adb shell am start -a android.intent.action.VIEW \
  -d "exp://localhost:8081" host.exp.exponent
```

---

## 5. `--offline` 모드의 한계

### 증상

`--offline` 플래그로 Metro를 시작하면 크래시는 피하지만:

```
Offline and no cached development certificate found, unable to sign manifest
```

### 원인

Expo Go는 서명된 매니페스트가 필요함. `--offline`은 인증서 캐시가 없으면 서명 불가.

### 결론

`--offline` 대신 `EXPO_NO_DEPENDENCY_VALIDATION=1`을 사용해야 함.
이 환경변수는 버그가 있는 코드 경로만 건너뛰고, 나머지 기능(매니페스트 서명 포함)은 정상 동작.

---

## 빠른 실행 가이드

### 전제 조건

- Android 에뮬레이터 실행 중 (`adb devices`로 확인)
- Expo Go 54.x 설치됨

### 실행 명령어 (3줄)

```bash
cd apps/mobile

# 1. ADB 포트 포워딩
adb reverse tcp:8081 tcp:8081

# 2. Metro 시작 (버그 우회)
EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start --go --port 8081
```

그 다음 Expo Go에서:

- "Recently opened" → "이룸" 탭, 또는
- "Enter URL manually" → `exp://localhost:8081` → Connect

### 또는 자동화 스크립트

```bash
bash scripts/expo-emulator.sh
```

---

## 6. Metro가 외부 IP로 연결 시도 → SocketTimeoutException (2026-04-03)

### 증상

에뮬레이터에서 앱 실행 시:

```
java.net.SocketTimeoutException: timeout
at okio.SocketAsyncTimeout.newTimeoutException
```

앱이 "이룸 isn't responding" 다이얼로그를 표시.

### 원인

Expo가 기본적으로 **외부 IP** (예: `211.200.70.199:8081`)를 Metro URL로 사용.
에뮬레이터는 `adb reverse`를 통해 `localhost`만 접근 가능 → **IP 불일치로 타임아웃**.

### 해결

```bash
# --localhost 플래그 + REACT_NATIVE_PACKAGER_HOSTNAME 환경변수 필수
REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 npx expo start --localhost
```

`scripts/expo-emulator.sh`에 이미 적용됨 (2026-04-03 수정).

### 확인 방법

Metro 로그에서 URL 확인:

```
# ✅ 정상: 127.0.0.1
› Opening exp+yiroom://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081

# ❌ 비정상: 외부 IP
› Opening exp+yiroom://expo-development-client/?url=http%3A%2F%2F211.200.70.199%3A8081
```

---

## 7. 개발 빌드 APK 네이티브 모듈 누락 → DevLauncherErrorActivity (2026-04-03)

### 증상

앱이 Metro에 연결은 하지만 번들링이 시작되지 않음.
`adb logcat`에서:

```
ClassNotFoundException: Didn't find class "expo.modules.splashscreen.SplashScreenManager"
```

앱이 `DevLauncherErrorActivity` (에러 화면)를 표시.

### 원인

Expo SDK 업그레이드 후 **개발 빌드 APK를 갱신하지 않아서** 네이티브 모듈이 누락.
`expo-splash-screen` 등 새로 추가된 네이티브 모듈이 기존 APK에 없음.

### 해결

```bash
# 1. EAS 클라우드 빌드로 새 APK 생성 (Windows에서 로컬 빌드 불가)
cd apps/mobile
npx eas build --profile development --platform android --non-interactive

# 2. APK 다운로드 (빌드 완료 후 URL 확인)
curl -L -o build-output.apk "https://expo.dev/artifacts/eas/[BUILD_ID].apk"

# 3. 에뮬레이터에 클린 설치 (⚠️ -r 아닌 완전 재설치 필수)
adb uninstall com.yiroom.app
adb install build-output.apk

# 4. 포트 포워딩 + 앱 실행
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d "exp+yiroom://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" \
  com.yiroom.app
```

### 주의사항

- **`adb install -r` (덮어쓰기)로는 해결 안 됨** — 반드시 `uninstall` 후 `install`
- Windows에서 `eas build --local`은 불가 (macOS/Linux 필요)
- EAS Free 플랜은 빌드 큐 대기 시간 있음 (0~30분)
- 빌드 상태 확인: `npx eas build:list --platform android --limit 1`

---

## 8. react-native-css-interop Metro 크래시 (2026-04-03)

### 증상

Metro 로그에서:

```
TypeError: Cannot read properties of undefined (reading 'getSha1')
    at ensureFileSystemPatched (react-native-css-interop/src/metro/index.ts:377)
```

### 원인

Metro 캐시 손상. `react-native-css-interop`의 파일시스템 패치가 캐시와 충돌.

### 해결

```bash
# Metro 캐시 클리어 후 재시작
npx expo start --clear
```

---

## 교훈

| 교훈                                     | 설명                                                      |
| ---------------------------------------- | --------------------------------------------------------- |
| **Expo Go SDK 버전 = 프로젝트 SDK 버전** | SDK 업그레이드 시 Expo Go APK도 함께 업데이트             |
| **`EXPO_NO_DEPENDENCY_VALIDATION=1`**    | Expo CLI 의존성 검증 버그 우회 환경변수                   |
| **`adb reverse` 필수**                   | 에뮬레이터에서 호스트 Metro에 접근하려면 포트 포워딩 필요 |
| **`--offline` 피하기**                   | 매니페스트 서명 불가 문제 발생. 대신 위 환경변수 사용     |
| **deep link 불안정**                     | `exp://` deep link보다 Expo Go 앱 내 수동 입력이 안정적   |
| **`--localhost` 필수**                   | Expo 기본값이 외부 IP → 에뮬레이터에서 타임아웃 발생      |
| **APK 클린 설치**                        | SDK 업그레이드 후 `uninstall` → `install` 필수            |
| **Metro `--clear`**                      | 캐시 손상 시 `npx expo start --clear`로 초기화            |

---

## 에뮬레이터 실행 체크리스트 (Quick Reference)

문제 발생 시 순서대로 확인:

```
□ 1. 에뮬레이터 실행 중? → adb devices
□ 2. 앱(com.yiroom.app) 설치됨? → adb shell pm list packages | grep yiroom
□ 3. APK가 현재 SDK와 호환? → 안 되면 EAS 빌드 후 uninstall → install
□ 4. adb reverse 설정? → adb reverse tcp:8081 tcp:8081
□ 5. Metro 실행 중? → curl http://localhost:8081/status
□ 6. Metro가 localhost 사용? → 로그에서 127.0.0.1 확인
□ 7. DevLauncherErrorActivity? → adb logcat | grep ClassNotFound
□ 8. Metro 크래시? → npx expo start --clear
```

---

**Updated**: 2026-04-04 | v2.0 — Metro 외부 IP, APK 네이티브 모듈 누락, css-interop 크래시 추가
