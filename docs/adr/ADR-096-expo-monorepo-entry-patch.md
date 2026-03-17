# ADR-096: Expo 모노레포 진입점 패치

## 상태

승인됨 (2026-03-17)

## 컨텍스트

NPM Workspaces 모노레포 환경에서 Expo Go 실행 시 `expo/AppEntry.js`의 상대경로 `../../App`이
모노레포 루트를 가리켜 모듈 해석에 실패하는 문제 발생.

## 결정

`node_modules/expo/AppEntry.js`를 직접 수정하여 `expo-router/entry`를 import하도록 변경.
영구 적용은 `patch-package`로 처리.

## 대안 검토

| 대안                            | 결과      | 불채택 이유                              |
| ------------------------------- | --------- | ---------------------------------------- |
| 심볼릭 링크                     | 실패      | Metro가 실제 경로로 해석                 |
| 루트 App.js 생성                | 실패      | Metro projectRoot 범위 밖                |
| package.json main 변경          | 실패      | Expo Go가 main 필드 무시                 |
| metro.config.js resolver 커스텀 | 부분 성공 | AppEntry.js 진입 전에 해석되어 효과 없음 |

## 영향

- `npm install` 시 패치 초기화 → `patch-package` postinstall로 자동 재적용
- EAS Build에서는 `expo-router/entry`가 정상 사용되므로 영향 없음
- Expo Go 개발 환경에서만 해당

## 관련 문서

- [트러블슈팅: Expo 모노레포 AppEntry](../troubleshooting/2026-03-17-expo-monorepo-appentry-resolve.md)
