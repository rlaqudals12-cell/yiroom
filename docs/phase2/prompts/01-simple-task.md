# 🟢 Simple Task 프롬프트 템플릿

> **복잡도**: 낮음  
> **Claude Mode**: 바로 구현 (`Shift+Tab` Auto-accept 권장)  
> **예상 반복**: 1회

---

## 기본 프롬프트

```
Task [ID]를 구현해주세요.

파일: [파일 경로]

요구사항:
- [요구사항 1]
- [요구사항 2]
- [요구사항 3]

수락 기준:
- [Given-When-Then]
```

---

## 예시: UI 컴포넌트

```
Task 1.0: 운동 모듈 레이아웃을 구현해주세요.

파일: app/workout/layout.tsx

요구사항:
- max-width 480px 컨테이너
- 세로 중앙 정렬
- 패딩 적용

수락 기준:
Given: /workout/* 페이지 접근 시
When: 레이아웃 렌더링
Then: 480px 너비 컨테이너로 자식 요소 감싸기
```

---

## 예시: 데이터 타입 정의

```
Task 1.13: 운동 데이터 타입을 정의해주세요.

파일: types/workout.ts

정의할 타입:
- Exercise: 운동 정보
- WorkoutGoal: 운동 목표 (enum)
- WorkoutInput: 입력 데이터
- WorkoutResult: 결과 데이터

각 타입에 JSDoc 주석 추가해주세요.
```

---

## 팁

- `Shift+Tab`으로 Auto-accept 모드 사용
- 80% 완성 후 수동으로 마무리
- 단순 반복 작업에 최적
