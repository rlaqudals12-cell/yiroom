# App Store 제출 체크리스트

> 스토어 카피와 개인정보 답변의 정본은 `apps/mobile/store-metadata.json`입니다.
> 이 문서는 제출 절차를 위한 읽기 쉬운 초안이며, 값이 다르면 JSON 정본을 먼저 갱신합니다.

## 1. 릴리스 정보

| 항목           | 값                             |
| -------------- | ------------------------------ |
| 앱 이름        | 이룸 - 온전한 나는?            |
| 부제목         | AI 퍼스널컬러·피부·스타일 분석 |
| 버전           | 1.0.0                          |
| 기본 카테고리  | Health & Fitness               |
| 보조 카테고리  | Lifestyle                      |
| 최소 이용 연령 | 만 14세                        |
| 번들 ID        | `com.yiroom.app`               |

### 한국어 설명

```text
이룸은 만 14세 이상 사용자를 위한 AI 뷰티 분석 서비스입니다.

• 퍼스널컬러 분석과 색상 가이드
• 피부 상태 분석과 관리 가이드
• 체형 분석과 스타일 가이드
• 헤어 상태 분석과 관리 가이드
• 메이크업 분석과 색상 가이드
• 다섯 분석 결과를 모아 보는 통합 결과

사진을 포함한 분석 정보는 암호화된 연결로 이룸 서버와 Google AI에 전송되어 처리됩니다. 분석 결과는 계정에 저장되며, 원본 분석 이미지는 사용자가 저장에 동의한 경우에만 최대 1년간 보관됩니다.
```

### 영어 설명

```text
Yiroom is an AI beauty analysis service for users age 14 and older.

• Personal color analysis and color guidance
• Skin analysis and care guidance
• Body analysis and style guidance
• Hair analysis and care guidance
• Makeup analysis and color guidance
• An integrated view of all five analysis results

Analysis information, including photos, is sent over encrypted connections to Yiroom servers and Google AI for processing. Analysis results are saved to your account, while original analysis images are retained for up to one year only when you consent to image storage.
```

### 검색·프로모션 문구

- 한국어 키워드: `퍼스널컬러,피부분석,체형분석,헤어분석,메이크업,스타일,AI,뷰티`
- 영어 키워드: `personalcolor,skinanalysis,bodytype,hairanalysis,makeup,style,AI,beauty`
- 프로모션 텍스트: `AI로 나에게 맞는 뷰티 가이드를 확인해보세요.`

## 2. 제출 화면 범위

스크린샷에는 현재 공개된 표면만 사용합니다.

1. 홈 대시보드
2. 퍼스널컬러 결과
3. 피부 분석 결과
4. 체형 분석 결과
5. 헤어 분석 결과
6. 메이크업 분석 결과
7. 통합 분석 결과
8. 뷰티 제품 탐색
9. 내 옷장
10. 설정

| 디바이스     | 해상도      | 정본 수량 |
| ------------ | ----------- | --------- |
| iPhone 6.5형 | 1284 × 2778 | 10장      |
| iPhone 5.5형 | 1242 × 2208 | 10장      |
| iPad 12.9형  | 2048 × 2732 | 10장      |

- [ ] 모든 캡처는 프로덕션과 같은 기능 플래그에서 만들었습니다.
- [ ] 캡처의 결과·제품·계정 정보가 심사용 계정의 실제 데이터와 일치합니다.
- [ ] 스크린샷과 설명에 현재 앱에서 도달할 수 없는 기능을 넣지 않았습니다.

## 3. 심사 접근 정보

자격증명은 저장소와 문서에 평문으로 남기지 않습니다.

1. 수신 가능한 도메인을 확정합니다.
2. `<local>+clerk_test@<confirmed-domain>` 형식의 심사 계정을 프로덕션 Clerk에 생성합니다.
3. 초기화한 기기에서 비밀번호 로그인·추가 인증·만 14세 연령 게이트를 끝까지 재현합니다.
4. 자격증명은 App Store Connect의 App Review Information에만 직접 입력합니다.
5. 지원 연락처는 `<support-local>@<confirmed-domain>`을 실제 수신 확인한 뒤 입력합니다.

### 심사 메모 초안

```text
이 앱은 만 14세 이상 사용자를 위한 AI 뷰티 분석 서비스입니다.
카메라와 사진은 퍼스널컬러·피부·체형·헤어·메이크업 분석에 사용됩니다.
분석 입력은 암호화된 연결로 이룸 서버와 Google AI에 전송되어 처리됩니다.
분석 결과는 계정에 저장되고, 원본 이미지는 별도 저장 동의 시에만 최대 1년 보관됩니다.
저장 동의가 꺼져 있으면 원본 이미지를 보관하지 않습니다.
AI 코치 대화는 답변 생성과 대화 이어보기를 위해 계정에 연결해 서버에 저장되며 앱에서 삭제할 수 있습니다.
```

## 4. 권한 정합

### iOS 생성 설정

| 키                               | 사용 이유                             |
| -------------------------------- | ------------------------------------- |
| `NSCameraUsageDescription`       | 5축 분석 사진 촬영                    |
| `NSPhotoLibraryUsageDescription` | 5축 분석과 AI 아바타용 기존 사진 선택 |

다음 키는 앱에 해당 기능이 없어 생성 설정에 존재하면 안 됩니다.

- [ ] `NSMicrophoneUsageDescription` 없음
- [ ] `NSPhotoLibraryAddUsageDescription` 없음

제출 빌드 직전 `npx expo config --type introspect`와 실제 Archive의 Info.plist를 모두 확인합니다.

### Android

- 요청 권한: `android.permission.CAMERA`
- 차단 권한: `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `WRITE_EXTERNAL_STORAGE`
- 사진 선택은 시스템 선택기를 사용합니다.

## 5. Apple Privacy Nutrition Label 초안

모든 항목의 Tracking 답변은 `No`입니다. 아래 목적은 App Store Connect에서 선택할 값입니다.

| Data Type             | Item                         | Linked to You | Used for Tracking | Purpose                            | 조건·설명                                |
| --------------------- | ---------------------------- | ------------- | ----------------- | ---------------------------------- | ---------------------------------------- |
| Contact Info          | Email Address                | Yes           | No                | App Functionality                  | 계정 인증·관리                           |
| Other Data            | Birth Date                   | Yes           | No                | App Functionality                  | 만 14세 이상 이용 자격 확인              |
| Health & Fitness      | Health                       | Yes           | No                | App Functionality, Personalization | 사용자가 입력한 키·체중과 체형 분석 정보 |
| User Content          | Photos or Videos             | Yes           | No                | App Functionality, Personalization | 분석을 위해 서버와 Google AI로 전송      |
| User Content          | Other User Content           | Yes           | No                | App Functionality                  | AI 코치 대화 저장·이어보기·삭제          |
| Sensitive Info        | Sensitive Info               | Yes           | No                | App Functionality                  | 얼굴·체형 분석 입력을 계정에 연결해 처리 |
| Identifiers > User ID | User ID                      | Yes           | No                | App Functionality                  | 계정과 분석 결과 연결                    |
| Usage Data            | Product Interaction          | Yes           | No                | Analytics, Personalization         | 분석 수집 동의가 켜진 경우만 전송        |
| Diagnostics           | Crash Data, Performance Data | Yes           | No                | App Functionality                  | 오류·성능 모니터링                       |

> 저장 동의 OFF: 분석 입력은 결과 생성을 위해 전송·처리되지만 원본 이미지는 보관하지 않습니다.
> 저장 동의 ON: 원본 이미지는 최대 1년 보관하며, 동의 철회·삭제 요청·회원 탈퇴 시 먼저 파기합니다.

## 6. 처리자·URL

- Google AI는 앱 기능 제공을 위한 서비스 제공자(수탁자)로 처리합니다.
- 제출 전 프로덕션 프로젝트의 유료 Cloud Billing과 Data Processing Addendum 적용을 확인합니다.
- 개인정보처리방침: `https://yiroom.vercel.app/privacy`
- 지원: `https://yiroom.vercel.app/help`
- 마케팅: `https://yiroom.vercel.app`

- [ ] 세 URL을 비로그인 네트워크에서 열어 200 응답과 최종 콘텐츠를 확인했습니다.
- [ ] 개인정보처리방침의 보유·삭제 조건이 위 라벨과 일치합니다.

## 7. 제출 전 최종 확인

### 앱 동작

- [ ] 새 기기에서 설치 → 가입 → 연령 확인 → 첫 분석 → 결과 → 재방문을 완료했습니다.
- [ ] 카메라 거부·사진 선택 취소·오프라인·서버 오류 상태를 확인했습니다.
- [ ] 계정 삭제와 이미지 저장 동의 철회가 앱 안에서 완료됩니다.
- [ ] AI 생성 코치 메시지·분석 결과·AI 아바타를 앱 안에서 신고할 수 있습니다.

### 제출 산출물

- [ ] 1024 × 1024 아이콘과 요구 해상도 스크린샷을 준비했습니다.
- [ ] App Store Connect의 설명·키워드·버전이 `store-metadata.json`과 일치합니다.
- [ ] Privacy Nutrition Label을 위 초안과 실제 프로덕션 흐름으로 다시 대조했습니다.
- [ ] 심사 계정 자격증명을 App Review Information에만 입력했습니다.
- [ ] 프로덕션 Archive의 Info.plist와 권한 요청 시점을 실기기에서 확인했습니다.
