# 🔧 Debugging 프롬프트 템플릿

> 에러 해결 및 버그 수정용

---

## 기본 프롬프트

```
[에러 메시지 붙여넣기]

이 에러를 해결해주세요.
코드베이스를 분석하고, 문제를 식별하고, 수정을 구현해주세요.
```

---

## 상세 프롬프트

```
다음 에러가 발생합니다:

```
[에러 메시지 전체 붙여넣기]
```

발생 위치: [파일 경로 또는 페이지]
재현 방법: [어떤 동작을 했을 때]

1. 관련 코드를 분석해주세요
2. 에러 원인을 파악해주세요
3. 해결 방법을 제안하고 구현해주세요
```

---

## 예시: 런타임 에러

```
다음 에러가 발생합니다:

```
TypeError: Cannot read properties of undefined (reading 'map')
    at WorkoutList (app/workout/result/page.tsx:45:23)
```

발생 위치: /workout/result 페이지
재현 방법: 운동 추천 결과 페이지 접근 시

1. exercises 데이터가 undefined인 상황 파악
2. API 응답 확인
3. 방어 코드 추가
```

---

## 예시: 빌드 에러

```
빌드 시 다음 에러가 발생합니다:

```
Type 'string' is not assignable to type 'WorkoutGoal'.
  app/workout/onboarding/step2/page.tsx(32,15)
```

1. WorkoutGoal 타입 정의 확인
2. step2 페이지의 타입 사용 확인
3. 타입 불일치 수정
```

---

## 예시: API 에러

```
API 호출 시 500 에러가 발생합니다:

```
POST /api/workout/save 500 (Internal Server Error)
Response: {"error": "relation \"workout_settings\" does not exist"}
```

발생 위치: 운동 설정 저장 시
재현 방법: 온보딩 완료 후 저장 클릭

1. Supabase 테이블 존재 여부 확인
2. 마이그레이션 파일 확인
3. 필요 시 테이블 생성
```

---

## 팁

- 에러 메시지 전체를 붙여넣기
- 발생 위치와 재현 방법 명시
- 관련 파일 경로 제공
- 최근 변경 사항 언급하면 도움됨
