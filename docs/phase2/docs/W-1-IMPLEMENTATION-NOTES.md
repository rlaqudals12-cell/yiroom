# W-1 운동 모듈 구현 노트

> 이 문서는 W-1 Feature Spec (v1.1-final)과 실제 구현 사이의 설계 결정 사항을 기록합니다.
> Spec 문서 업데이트 시 참고용으로 사용하세요.

## 개요

온보딩 플로우 구현 과정에서 UX 개선 및 사용자 피드백을 반영한 설계 결정들이 있었습니다.
아래는 Spec과 구현 간의 주요 차이점입니다.

---

## 1. Step 2: 운동 목표 선택

### Spec (v1.1-final)
```yaml
Step 2: 운동 목표 선택 (단일 선택)
  options:
    - 다이어트: 체중 감량
    - 근력 증가: 벌크업
    - 체형 관리: 탄탄한 몸
    - 스트레스 해소: 운동으로 힐링
    - 체력 증진: 심폐 기능
    - 자세 교정: 거북목/라운드숄더
```

### 구현 (step2/page.tsx)
```typescript
// 복수 선택 최대 2개
const MAX_SELECTIONS = 2;

const GOALS = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '건강하게 살 빼기' },
  { id: 'strength', icon: '💪', title: '근력 강화', desc: '근육량 늘리기' },
  { id: 'endurance', icon: '🏃', title: '체력 향상', desc: '지구력 키우기' },
  { id: 'stress', icon: '😌', title: '스트레스 해소', desc: '마음 건강 챙기기' },
  { id: 'posture', icon: '🧘', title: '체형 교정', desc: '바른 자세 만들기' },
];
```

### 변경 사항
| 항목 | Spec | 구현 | 변경 이유 |
|------|------|------|----------|
| 선택 방식 | 단일 선택 | 복수 선택 (최대 2개) | 실제 사용자들은 복합적인 목표를 가지는 경우가 많음 |
| 옵션 개수 | 6개 | 5개 | '체형 관리'와 '자세 교정'을 통합하여 단순화 |
| '근력 증가' | 벌크업 | 근육량 늘리기 | 여성 타겟 사용자에게 더 친화적인 표현 |

### Spec 업데이트 제안
```yaml
Step 2: 운동 목표 선택 (복수 선택, 최대 2개)
  options:
    - 체중 감량: 건강하게 살 빼기
    - 근력 강화: 근육량 늘리기
    - 체력 향상: 지구력 키우기
    - 스트레스 해소: 마음 건강 챙기기
    - 체형 교정: 바른 자세 만들기
```

---

## 2. Step 4: 운동 빈도 선택

### Spec (v1.1-final)
```yaml
Step 4: 운동 빈도 선택
  options:
    - 주 2-3회: 가볍게
    - 주 4-5회: 적극적으로
    - 매일: 열심히
```

### 구현 (step4/page.tsx)
```typescript
const FREQUENCIES = [
  { id: '1-2', title: '주 1-2회', desc: '가볍게 시작하기', icon: '🌱' },
  { id: '3-4', title: '주 3-4회', desc: '규칙적인 운동', icon: '🌿' },
  { id: '5-6', title: '주 5-6회', desc: '적극적인 운동', icon: '🌳' },
  { id: 'daily', title: '매일', desc: '꾸준한 루틴', icon: '🌲' },
];
```

### 변경 사항
| 항목 | Spec | 구현 | 변경 이유 |
|------|------|------|----------|
| 옵션 개수 | 3개 | 4개 | 더 세분화된 선택지 제공 |
| 최소 빈도 | 주 2-3회 | 주 1-2회 | 운동 초보자를 위한 진입 장벽 낮춤 |
| 구간 분리 | 주 2-3회 / 주 4-5회 | 주 1-2회 / 주 3-4회 / 주 5-6회 | 명확한 구간 구분 |

### Spec 업데이트 제안
```yaml
Step 4: 운동 빈도 선택
  options:
    - 주 1-2회: 가볍게 시작하기
    - 주 3-4회: 규칙적인 운동
    - 주 5-6회: 적극적인 운동
    - 매일: 꾸준한 루틴
```

---

## 3. Step 7: 부상/통증 확인

### Spec (v1.1-final)
```yaml
Step 7: 부상/통증 확인 (선택)
  options:
    - 무릎 부상/통증
    - 허리 부상/통증
    - 어깨 부상/통증
    - 기타: ___
    - 없음
```

### 구현 (step7/page.tsx)
```typescript
const INJURIES = [
  { id: 'none', icon: '✅', title: '없음', desc: '특별한 부상이나 통증 없음' },
  { id: 'knee', icon: '🦵', title: '무릎', desc: '무릎 관절 통증' },
  { id: 'back', icon: '🔙', title: '허리', desc: '허리 디스크, 요통' },
  { id: 'shoulder', icon: '💪', title: '어깨', desc: '어깨 통증, 오십견' },
  { id: 'wrist', icon: '🤚', title: '손목', desc: '손목 터널 증후군' },
  { id: 'ankle', icon: '🦶', title: '발목', desc: '발목 염좌, 통증' },
  { id: 'neck', icon: '🦒', title: '목', desc: '거북목, 목 통증' },
];
```

### 변경 사항
| 항목 | Spec | 구현 | 변경 이유 |
|------|------|------|----------|
| 옵션 개수 | 5개 | 7개 | 자주 발생하는 부상 부위 추가 |
| '기타' 옵션 | 있음 (자유 입력) | 없음 | 구조화된 데이터로 운동 필터링 최적화 |
| 추가 부위 | - | 손목, 발목, 목 | 재택근무 증가로 인한 거북목, 손목 터널 증후군 등 현대인 통증 반영 |

### Spec 업데이트 제안
```yaml
Step 7: 부상/통증 확인 (복수 선택, 선택사항)
  options:
    - 없음: 특별한 부상이나 통증 없음
    - 무릎: 무릎 관절 통증
    - 허리: 허리 디스크, 요통
    - 어깨: 어깨 통증, 오십견
    - 손목: 손목 터널 증후군
    - 발목: 발목 염좌, 통증
    - 목: 거북목, 목 통증

  로직:
    - '없음' 선택 시 다른 선택 모두 해제
    - 다른 항목 선택 시 '없음' 자동 해제
```

---

## 4. 기타 구현 세부사항

### SelectionCard 컴포넌트
- `mode` prop: `'single'` | `'multiple'` 로 선택 방식 결정
- Step 2, 3, 7: `mode="multiple"`
- Step 4: `mode="single"`

### ProgressIndicator 컴포넌트
- 형식: `{currentStep}/{totalSteps} 단계`
- 접근성: `role="progressbar"` 속성 포함

### StepNavigation 컴포넌트
- `isLastStep=true` 시 버튼 텍스트: "분석 시작"
- `isLastStep=false` 시 버튼 텍스트: "다음"

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `app/(main)/workout/onboarding/step2/page.tsx` | 목표 선택 |
| `app/(main)/workout/onboarding/step4/page.tsx` | 빈도 선택 |
| `app/(main)/workout/onboarding/step7/page.tsx` | 부상/통증 선택 |
| `components/workout/common/SelectionCard.tsx` | 선택 카드 컴포넌트 |
| `components/workout/common/StepNavigation.tsx` | 네비게이션 버튼 |
| `components/workout/common/ProgressIndicator.tsx` | 진행 표시기 |
| `e2e/workout/onboarding.spec.ts` | E2E 테스트 |

---

**작성일**: 2025-12-04
**작성자**: Claude Code
**버전**: 1.0
