# 모바일 i18n 라이브러리 선정 조사 (2026-09-05)

## 질문

Expo Router 기반 React Native 앱에서 웹의 `next-intl` 카탈로그 계약을 이어가면서,
화면 단위로 점진 전환할 i18n 런타임은 무엇이어야 하는가?

## 저장소 실측

- `apps/mobile`에는 `expo-localization`이 이미 설치되어 있다.
- `apps/mobile/lib/i18n`의 기존 손제작 구현은 실제 화면 소비처가 0개다.
- 기존 구현은 전역 mutable locale과 훅별 로컬 state를 함께 사용한다. 한 컴포넌트의
  언어 변경이 다른 컴포넌트를 다시 렌더링한다는 보장이 없고, 훅마다 AsyncStorage를
  다시 읽는다.
- 기존 사전은 `ko/en`만 있고, 숨김 모듈인 운동·영양 중심의 과거 문구가 포함되어 있다.
- 웹은 `apps/web/messages/ko.json`을 정본으로 `next-intl`을 사용한다.

## 공식 문서 확인

1. Expo의 Localization 가이드는 기기 언어 감지에 `expo-localization`을 사용하고,
   번역 런타임은 별도 라이브러리에 맡기도록 안내한다. 같은 문서가
   `react-i18next`를 “stable, well-maintained” 선택지로 명시한다.
   - https://docs.expo.dev/guides/localization/
   - https://docs.expo.dev/versions/latest/sdk/localization/
2. Expo 문서에 따르면 `getLocales()`는 사용자 선호 순서의 locale 목록을 반환한다.
   Android에서는 앱 실행 중 시스템 언어가 바뀔 수 있어 AppState 복귀 시 재확인이
   필요할 수 있다.
3. react-i18next 공식 문서는 React와 React Native를 지원하며, `initReactI18next`가
   context를 통해 번역 인스턴스를 컴포넌트에 제공한다고 설명한다.
   - https://react.i18next.com/
   - https://react.i18next.com/guides/quick-start
4. i18next 공식 설정은 `resources`, `supportedLngs`, `fallbackLng`를 명시적으로
   고정할 수 있다.
   - https://www.i18next.com/overview/configuration-options
5. FormatJS의 React Native 경로는 `Intl` 런타임·폴리필 조건을 별도로 관리해야 한다.
   현재 필요한 기능보다 초기 설정과 테스트 표면이 넓다.
   - https://formatjs.github.io/docs/react-intl/
   - https://formatjs.github.io/docs/guides/react-native-hermes/

## 비교

| 후보                        | 장점                                                              | 현재 이룸에서의 비용                                               | 판정           |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| `i18next` + `react-i18next` | RN 공식 지원, React 전역 갱신, 보간·복수형·폴백, 화면별 점진 전환 | 의존성 2개                                                         | 채택           |
| `i18n-js`                   | Expo 예제가 단순하고 작음                                         | React 반응성/provider를 직접 만들어야 해 손제작 기반 문제가 반복됨 | 기각           |
| `react-intl`                | ICU 중심 포맷이 강함                                              | RN 런타임·폴리필 및 ESM 테스트 설정 표면이 더 큼                   | 이번 단계 기각 |
| 현행 손제작 모듈            | 새 의존성 없음                                                    | 소비처 0, 언어 변경 전파 불완전, 훅별 저장소 조회, plural 미구현   | 기각           |

## 결론

- 런타임: `i18next` + `react-i18next`
- locale 감지: 기존 `expo-localization`
- 사용자 선택 저장: 기존 AsyncStorage 키 `@yiroom/locale` 유지
- 정본: 웹 `messages/ko.json`; 모바일은 화면별 필요한 키만 런타임 사전으로
  투영하고 계약 테스트로 정본과 일치시킨다.
- 폴백: 미지원 locale과 누락 키 모두 한국어. 영어를 임의 기본값으로 삼지 않는다.
- 전환: 한 번에 전체 치환하지 않고 화면 1개 + 해당 테스트를 하나의 검증 단위로 한다.

## 한계

- 이번 선공개 단계에는 `ko/en` 카탈로그 기반을 만들되 공개 앱 locale은 `ko`만 연다.
  부분 영문 화면과 한국어 API 오류가 섞이지 않도록 첫 사용자 핵심 여정의 영어 QA 뒤
  `en`을 활성화한다. `ja/zh-Hans`는 영어 검수 후 같은 구조로 추가한다.
- 앱의 동적 AI 결과와 제품 원문 번역은 UI 정적 문자열 전환과 별도 문제다.
- 웹의 잔여 하드코딩 문자열은 이번 작업 범위가 아니다.
