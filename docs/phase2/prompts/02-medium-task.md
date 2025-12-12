# 🟡 Medium Task 프롬프트 템플릿

> **복잡도**: 중간  
> **Claude Mode**: Plan → Implement  
> **예상 반복**: 2회  
> **TDD**: 테스트 먼저 작성

---

## 기본 프롬프트

```
Task [ID]를 구현해주세요.

1️⃣ 먼저 Plan Mode로 관련 파일 확인:
- [관련 파일 1]
- [관련 파일 2]

2️⃣ 테스트 먼저 작성 후 구현

파일: [파일 경로]

요구사항:
- [요구사항 1]
- [요구사항 2]

수락 기준:
Given: [조건]
When: [행동]
Then: [결과]
```

---

## 예시: Store 설정

```
Task 1.4: Zustand 운동 입력 Store를 설정해주세요.

1️⃣ 먼저 Plan Mode로 기존 패턴 확인:
- stores/skinStore.ts
- stores/bodyStore.ts

2️⃣ 테스트 먼저 작성 후 구현

파일: stores/workoutInputStore.ts

상태:
- currentStep: number (1-7)
- goals: string[]
- concerns: string[]
- frequency: string
- location: string
- equipment: string[]
- targetWeight?: number
- injuries?: string[]

액션:
- setStep(step)
- setGoals(goals)
- reset()

테스트:
- 초기 상태 확인
- 각 setter 동작 확인
- reset 동작 확인
```

---

## 예시: API 연동

```
Task 2.9: 운동 분석 저장 API를 구현해주세요.

1️⃣ 먼저 Plan Mode로 기존 API 패턴 확인:
- app/api/body/analyze/route.ts
- lib/supabase/client.ts

2️⃣ 테스트 먼저 작성 후 구현

파일: app/api/workout/save/route.ts

요구사항:
- POST 요청 처리
- 인증 필수 (Clerk)
- workout_settings 테이블에 저장
- 에러 핸들링

수락 기준:
Given: 인증된 사용자 + 유효한 데이터
When: POST /api/workout/save
Then: 200 OK + 저장된 ID 반환
```

---

## 반복 개선 체크리스트

- [ ] 1차: 기본 기능 구현
- [ ] 2차: 엣지 케이스 처리 + 리팩토링

---

## 팁

- Plan Mode로 기존 코드 패턴 먼저 파악
- 테스트 작성 → 구현 → 테스트 통과 순서
- 2회 반복으로 품질 향상
