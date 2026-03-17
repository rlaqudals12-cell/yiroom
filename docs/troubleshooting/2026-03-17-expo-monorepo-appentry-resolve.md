# Expo Go 모노레포 AppEntry.js 모듈 해석 실패

> **날짜**: 2026-03-17
> **증상**: `Unable to resolve module ../../App from node_modules/expo/AppEntry.js`
> **환경**: NPM Workspaces 모노레포, Expo SDK 54, Expo Go

## 증상

에뮬레이터에서 Expo Go 실행 시 빨간 에러 화면:

```
The development server returned response error code: 500
UnableToResolveError
originModulePath: C:\dev\yiroom\node_modules\expo\AppEntry.js
targetModuleName: ../../App
```

## 근본 원인

### NPM Workspaces 호이스팅 + Expo AppEntry.js 상대경로

1. **NPM Workspaces**가 `expo` 패키지를 루트 `node_modules/`로 호이스팅
2. `expo/AppEntry.js`의 코드:
   ```javascript
   import App from '../../App';
   ```
3. 경로 해석: `node_modules/expo/` → `../../` = 모노레포 루트 (`c:/dev/yiroom/`)
4. `c:/dev/yiroom/App.js`가 존재하지 않음 → **UnableToResolveError**

### 정상 환경에서의 동작

단일 프로젝트에서는:

- `node_modules/expo/` → `../../` = 프로젝트 루트
- 프로젝트 루트에 `App.js` 또는 `expo-router/entry`가 있으므로 정상

모노레포에서는:

- `apps/mobile/node_modules/expo` 가 없음 (루트로 호이스팅)
- `node_modules/expo/` → `../../` = 모노레포 루트 (앱 루트가 아님)

## 시도한 해결책

### ❌ 실패한 방법들

| 방법                                      | 실패 이유                                                             |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `metro.config.js`에 `projectRoot` 명시    | Metro 해석에만 영향, Expo Go 진입점은 변경 안 됨                      |
| 심볼릭 링크 (`mklink /D`)                 | Metro가 심볼릭 링크를 실제 경로로 해석하여 여전히 루트 참조           |
| `apps/mobile/App.js` 생성                 | Metro projectRoot 외부의 App.js를 참조하여 무시됨                     |
| 루트 `App.js` 생성                        | Metro projectRoot가 `apps/mobile/`이라 루트 파일 범위 밖              |
| `package.json` main을 `./index.js`로 변경 | Expo Go가 `package.json` main을 무시하고 `expo/AppEntry.js` 직접 사용 |

### ✅ 성공한 방법

**`node_modules/expo/AppEntry.js` 직접 수정:**

```javascript
// Before (원본):
import registerRootComponent from 'expo/src/launch/registerRootComponent';
import App from '../../App';
registerRootComponent(App);

// After (수정):
import 'expo-router/entry';
```

## 영구 적용 (patch-package)

`npm install` 시 수정이 초기화되므로, `patch-package`로 영구 적용:

```bash
# 1. patch-package 설치
npm install patch-package --save-dev

# 2. 패치 생성
npx patch-package expo --patch-dir apps/mobile/patches

# 3. package.json에 postinstall 추가
"scripts": {
  "postinstall": "patch-package --patch-dir apps/mobile/patches"
}
```

## 추가 설정

### metro.config.js 강화

```javascript
config.projectRoot = projectRoot; // 명시적 projectRoot 설정
```

### app.json splash 배경색

```json
// 다크모드 통일
"splash": { "backgroundColor": "#0A0A0A" }
"adaptiveIcon": { "backgroundColor": "#0A0A0A" }
```

## 키워드

expo, monorepo, npm workspaces, AppEntry.js, Unable to resolve module, ../../App, hoisting
