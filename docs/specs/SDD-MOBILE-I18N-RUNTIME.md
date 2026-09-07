# SDD: 모바일 i18n 런타임과 화면별 전환

## 1. 범위

- 대상: `apps/mobile/lib/i18n`, 모바일 화면별 정적 UI 문자열, 관련 테스트
- 정본: `apps/web/messages/ko.json`
- 1차 카탈로그: `ko`, `en`
- 공개 앱 locale: `ko`(핵심 여정 영어 QA 전까지)
- 후속 locale: `ja`, `zh-Hans`(영어 검수 뒤)
- 제외: 웹 잔여 하드코딩, AI 동적 응답 번역, 제품 원문 번역

## 2. 공개 인터페이스

```ts
type SupportedLocale = 'ko' | 'en';

function t(key: string, options?: TranslationOptions): string;
function useTranslation(): { t: TFunction; i18n: I18nInstance; locale: SupportedLocale };
function getLocale(): SupportedLocale;
function setLocale(locale: SupportedLocale): Promise<void>;
function initI18n(): Promise<SupportedLocale>;
```

- 기존 호출부 호환을 위해 `TranslationOptions.params`는 i18next interpolation 값으로
  변환한다.
- 기기·저장 locale은 공개 허용 목록으로 별도 검증한다. 카탈로그가 있다는 이유만으로
  부분 번역 locale을 사용자에게 활성화하지 않는다.

## 3. 리소스 구조

```text
apps/mobile/lib/i18n/
├── index.ts
├── runtime.ts
├── provider.tsx
├── types.ts
└── locales/
    ├── ko.ts
    └── en.ts
```

- 모바일 사전은 현재 키화된 화면만 포함한다.
- 화면 키는 기능 문맥을 보존한다. 예: `auth.signIn.emailPlaceholder`.
- 웹 정본에 대응 키가 있으면 같은 의미를 재사용한다. 모바일 전용 문장이 필요하면
  웹 카탈로그의 모바일 namespace에 먼저 추가한다.

## 4. 초기화

1. 단일 i18next 인스턴스를 동기 리소스로 한 번만 초기화한다.
2. 루트 레이아웃은 `initI18n()`으로 저장 locale을 최대 1초 동안 읽는다.
3. 초기화가 끝나기 전에는 기존 font preload와 함께 화면을 열지 않는다. 저장소가 응답하지
   않으면 1초 뒤 기기 locale로 확정해 영구 백지 화면을 막는다.
4. 저장·기기 locale이 공개 허용 목록 밖이면 `ko`로 간다.
5. 영어 화면 테스트는 테스트 안에서 명시적으로 `changeLanguage('en')`을 사용한다.

## 5. 화면 전환 단위

각 단위는 아래를 모두 만족해야 완료다.

1. 화면 파일 한 개(필요 시 화면 전용 하위 컴포넌트 포함)의 가시 한국어를 키로 이동
2. placeholder, Alert, accessibility label 포함
3. 기존 한국어 렌더·행동 테스트 유지
4. 영어 카탈로그 렌더 테스트 1개 이상
5. 해당 화면에 새 한국어 literal이 남지 않았는지 정적 검사

전환된 단위는 `(auth)/sign-in.tsx`부터 가입·비밀번호 복구·기존 계정 연령 확인·연령
제한 안내, `(analysis)/hair/index.tsx` 헤어 분석 입력 화면이다. 각 화면을 독립 테스트와
함께 진행한다. 피부 결과는 통합 결과와 같은 비의료 고지 키를 재사용하며 나머지 결과
문구 전체 전환은 후속 화면 단위로 남긴다.

## 6. 테스트 계약

- `lib/i18n`: 저장 복원, 전역 변경 전파, 한국어 폴백, interpolation, 저장소 1초 timeout과
  늦은 응답 무효화
- 카탈로그: `ko/en` leaf key parity와 placeholder parity
- 정본: 모바일로 투영한 전체 `ko/en` leaf 값이 각각 웹 `messages/ko.json`, `en.json`과 동일
- 화면: 한국어 기본 렌더 + 명시적 영어 카탈로그 렌더
- 회귀: 지원하지 않는 locale 저장값에서 한국어 화면 렌더

## 7. 비기능 계약

- 번역 누락을 사용자에게 key 문자열로 노출하지 않는다. 개발·테스트에서는 누락을
  실패로 드러내고 운영에서는 한국어로 폴백한다.
  `saveMissing` + `missingKeyHandler`로 한국어 폴백에도 없는 키를 즉시 실패시킨다.
  운영에서 한국어 정본에도 없는 키는 `common.translationUnavailable` 한국어 안내로
  대체한다. 누락 키는 리소스에 저장하지 않는다.
- Provider와 어댑터는 공개 `index.ts`에서 내보내고 Provider는 `runtime.ts`만 참조해
  순환 의존성을 만들지 않는다.
- 카탈로그 전체를 네트워크에서 받아오지 않는다. 앱 시작은 오프라인에서도 가능해야 한다.
- locale 변경은 분석 데이터·enum·API payload의 정본 값을 바꾸지 않고 표시 문구만 바꾼다.
- Clerk 오류는 첫 오류의 알려진 `code`만 번역 키에 매핑하고, 미지 코드·잘못된 구조는
  각 작업의 일반 오류 키로 안내한다. 서버 `message` 원문은 Alert에 노출하지 않는다.
- 웹 API의 한국어 `userMessage` 현지화는 영어 공개 활성화 전 별도 완주 조건이다.
