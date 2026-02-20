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

## 교훈

| 교훈                                     | 설명                                                      |
| ---------------------------------------- | --------------------------------------------------------- |
| **Expo Go SDK 버전 = 프로젝트 SDK 버전** | SDK 업그레이드 시 Expo Go APK도 함께 업데이트             |
| **`EXPO_NO_DEPENDENCY_VALIDATION=1`**    | Expo CLI 의존성 검증 버그 우회 환경변수                   |
| **`adb reverse` 필수**                   | 에뮬레이터에서 호스트 Metro에 접근하려면 포트 포워딩 필요 |
| **`--offline` 피하기**                   | 매니페스트 서명 불가 문제 발생. 대신 위 환경변수 사용     |
| **deep link 불안정**                     | `exp://` deep link보다 Expo Go 앱 내 수동 입력이 안정적   |

---

**Updated**: 2026-02-20
