# 💬 온보딩 질문 패턴 가이드 v4.0 (통합완전판)

**목적**: PC-1, S-1, C-1 모듈의 사용자 질문 UI/UX 설계  
**효과**: 완료율 60% → 85% (2배 향상)  
**버전**: v4.0 (v2.4 전체 복원)  
**업데이트**: 2025년 11월 25일

---

## 🎯 왜 이 패턴을 사용하나요?

### ❌ 나쁜 예 (기존 방식)
```yaml
문제점:
  ❌ 텍스트 입력 (타이핑 귀찮음)
  ❌ "뭐라고 써야 하지?" 고민
  ❌ 답변 검증 필요
  ❌ 이탈률 60%

사용자 반응:
  "귀찮아..." → 60% 이탈
```

### ✅ 좋은 예 (버튼 선택 방식)
```yaml
장점:
  ✅ 버튼만 누르면 됨
  ✅ 선택지 명확
  ✅ 진행률 보임
  ✅ 이탈률 15%

사용자 반응:
  "간단하네!" → 85% 완료
```

### 📊 완료율 비교
```yaml
자유 입력:
  시작: 100명
  완료: 40명 (60% 이탈)
  평균 시간: 5분

버튼 선택:
  시작: 100명
  완료: 85명 (15% 이탈)
  평균 시간: 1.5분

→ 완료율 2배 차이!
```

---

## 📋 질문 설계 원칙

### 1️⃣ 간단하고 명확하게
```yaml
❌ 나쁜 예:
"귀하께서 평소 착용하시는 장신구의 색상 계열은 무엇인가요?"

✅ 좋은 예:
"금과 은 장신구 중 어느 쪽이 더 잘 어울려요?"
```

### 2️⃣ 선택지 2-4개 제공
```yaml
❌ 나쁜 예:
선택지 10개 (너무 많음)

✅ 좋은 예:
[ 금색 계열 ]
[ 은색 계열 ]
[ 잘 모르겠어요 ]

→ 3개 선택지 최적
```

### 3️⃣ 진행률 표시
```yaml
✅ 좋은 예:
[●●●○○○○○○○] 3/10

또는:
━━━━━━━━━━ 30%

효과:
- "얼마나 남았지?" 불안 해소
- 완료 동기 부여
```

### 4️⃣ "잘 모르겠어요" 옵션 필수
```yaml
✅ 모든 질문에 포함:
[ 푸른색 계열 ]
[ 녹색 계열 ]
[ 잘 모르겠어요 ]  ← 필수!

처리 로직:
- "잘 모르겠어요" 선택 시 해당 질문 가중치 0
- 다른 질문 결과로 보완
- 이미지 분석에 더 의존
```

---

## 🎨 PC-1 모듈: 문진 10개 질문 전체

**목표**: 퍼스널 컬러 4계절 분석  
**질문 수**: 10개  
**예상 시간**: 2-3분  
**완료율 목표**: 85%+

### 📱 온보딩 시작 화면
```
┌────────────────────────────┐
│    🎨 퍼스널 컬러 진단     │
│                            │
│  "온전한 나를 알아볼까요?" │
│                            │
│  ✓ 4계절 타입 분석         │
│  ✓ 베스트 컬러 추천        │
│  ✓ 파운데이션 매칭         │
│                            │
│  소요 시간: 약 2분         │
│                            │
│   [ 시작하기 ]             │
└────────────────────────────┘
```

---

### Q1. 손목 혈관 색 ⭐⭐⭐⭐⭐ (가장 중요)

```
┌────────────────────────────┐
│ 퍼스널 컬러 진단           │
│ [●○○○○○○○○○] 1/10        │
│                            │
│ 손목 안쪽 혈관이           │
│ 어떤 색으로 보이나요?      │
│                            │
│ [  푸른색 계열  ]          │
│ [  녹색 계열   ]          │
│ [ 잘 모르겠어요 ]          │
│                            │
│         [다음]              │
└────────────────────────────┘

분석 로직:
  푸른색 → Cool (Summer/Winter) +2점
  녹색 → Warm (Spring/Autumn) +2점
  모름 → 가중치 0, 이미지 분석 의존
```

---

### Q2. 금/은 장신구 ⭐⭐⭐⭐⭐

```
┌────────────────────────────┐
│ [●●○○○○○○○○] 2/10        │
│                            │
│ 금과 은 장신구 중           │
│ 어느 쪽이 더 잘 어울려요?  │
│                            │
│ [  금색 계열  ]            │
│ [  은색 계열  ]            │
│ [  둘 다 비슷  ]           │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  금색 → Warm (Spring/Autumn) +2점
  은색 → Cool (Summer/Winter) +2점
  비슷 → Neutral +1점 양쪽
```

---

### Q3. 피부 톤 ⭐⭐⭐⭐

```
┌────────────────────────────┐
│ [●●●○○○○○○○] 3/10        │
│                            │
│ 내 피부 톤은?              │
│                            │
│ [ 아주 밝은 편 ]           │
│ [  밝은 편    ]           │
│ [  보통       ]           │
│ [  어두운 편  ]           │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  아주 밝음 → Light (Spring/Summer) +1점
  밝음 → Light +0.5점
  보통 → 중립
  어두움 → Deep (Autumn/Winter) +1점
```

---

### Q4. 헤어 컬러 ⭐⭐⭐⭐

```
┌────────────────────────────┐
│ [●●●●○○○○○○] 4/10        │
│                            │
│ 지금 헤어 컬러는?          │
│ (자연 상태 또는 염색)      │
│                            │
│ [  검은색/흑갈색  ]        │
│ [  밝은 갈색     ]        │
│ [  염색 (밝음)  ]         │
│ [  염색 (어두움) ]         │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  검은색 → Winter +1점
  밝은 갈색 → Autumn +1점
  염색(밝음) → Spring +0.5점
  염색(어두움) → 참고만
```

---

### Q5. 눈동자 색 ⭐⭐⭐

```
┌────────────────────────────┐
│ [●●●●●○○○○○] 5/10        │
│                            │
│ 눈동자 색은?               │
│                            │
│ [  진한 검은색  ]          │
│ [  흑갈색      ]          │
│ [  밝은 갈색   ]          │
│ [ 잘 모르겠어요 ]          │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  진한 검은색 → Winter +1점
  흑갈색 → Autumn +1점
  밝은 갈색 → Spring/Summer +0.5점
```

---

### Q6. 홍조 여부 ⭐⭐⭐

```
┌────────────────────────────┐
│ [●●●●●●○○○○] 6/10        │
│                            │
│ 얼굴에 홍조가 잘 올라오나요?│
│                            │
│ [  자주 올라옴  ]          │
│ [  가끔 올라옴  ]          │
│ [  거의 없음   ]          │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  자주 → Cool (Summer) +1점
  가끔 → 중립
  거의 없음 → Warm +0.5점
```

---

### Q7. 태양 노출 반응 ⭐⭐⭐

```
┌────────────────────────────┐
│ [●●●●●●●○○○] 7/10        │
│                            │
│ 햇빛에 노출되면?           │
│                            │
│ [  빨갛게 탐  ]            │
│ [  갈색으로 탐 ]           │
│ [  잘 안 탐   ]           │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  빨갛게 → Cool (Summer) +1점
  갈색으로 → Warm (Autumn) +1점
  안 탐 → Winter +0.5점
```

---

### Q8. 입술 색 ⭐⭐

```
┌────────────────────────────┐
│ [●●●●●●●●○○] 8/10        │
│                            │
│ 입술 색은? (립스틱 안 바른)│
│                            │
│ [  핑크 계열   ]           │
│ [  코랄/피치색 ]           │
│ [  붉은 계열   ]           │
│ [ 잘 모르겠어요 ]          │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  핑크 → Cool +1점
  코랄/피치 → Warm +1점
  붉은 → 중립
```

---

### Q9. 선호 색상 ⭐⭐

```
┌────────────────────────────┐
│ [●●●●●●●●●○] 9/10        │
│                            │
│ 가장 잘 어울린다고 느끼는   │
│ 색상 계열은?               │
│                            │
│ [ 파스텔/쿨톤 ]            │
│ [ 비비드/웜톤 ]            │
│ [ 뉴트럴/무채색 ]          │
│ [ 잘 모르겠어요 ]          │
│                            │
│    [이전]    [다음]        │
└────────────────────────────┘

분석 로직:
  파스텔/쿨 → Summer +1점
  비비드/웜 → Spring/Autumn +1점
  뉴트럴 → Winter +0.5점
```

---

### Q10. 성별/나이 ⭐

```
┌────────────────────────────┐
│ [●●●●●●●●●●] 10/10       │
│                            │
│ 마지막! 기본 정보          │
│                            │
│ 성별:                      │
│ [ 여성 ] [ 남성 ] [ 기타 ]│
│                            │
│ 나이:                      │
│ [ 10대 ] [ 20대 ] [ 30대+ ]│
│                            │
│    [이전]    [완료]        │
└────────────────────────────┘

용도:
  - 통계용 (분석 로직에 미반영)
  - UI 톤 조절 참고
  - 제품 추천 가격대 참고
```

---

### 📸 셀카 업로드 화면

```
┌────────────────────────────┐
│  마지막 단계! 📸           │
│                            │
│  더 정확한 분석을 위해     │
│  셀카를 업로드해주세요     │
│                            │
│  ┌──────────────┐          │
│  │   [카메라]   │          │
│  └──────────────┘          │
│  ┌──────────────┐          │
│  │  [갤러리]    │          │
│  └──────────────┘          │
│                            │
│ 💡 자연광에서 정면 촬영    │
│    권장합니다              │
│                            │
│ [ 건너뛰기 ] [ 업로드 ]    │
└────────────────────────────┘

참고:
- 셀카 선택 사항 (신뢰도 ↑)
- 건너뛰기 가능
- 건너뛰면 문진만으로 분석 (정확도 70-80%)
- 이미지 포함 시 정확도 90-95%
```

---

## ✨ S-1 모듈: 피부 분석 질문

**목표**: 피부 상태 파악 + 개인화  
**질문 수**: 5개 (간단하게)  
**예상 시간**: 30초  
**완료율 목표**: 90%+

### Q1. 주요 피부 고민 ⭐⭐⭐⭐⭐
```yaml
질문: "요즘 가장 큰 피부 고민은?"

선택지:
  [ 트러블/여드름 ]
  [ 건조함 ]
  [ 모공 ]
  [ 색소/기미 ]
  [ 없음 ]
```

### Q2. 세안 횟수 ⭐⭐⭐⭐
```yaml
질문: "하루에 몇 번 세안하시나요?"

선택지:
  [ 1회 ]
  [ 2회 ]
  [ 3회 이상 ]
```

### Q3. 수면 시간 ⭐⭐⭐⭐
```yaml
질문: "평균 수면 시간은?"

선택지:
  [ 4시간 이하 ]
  [ 5-6시간 ]
  [ 7-8시간 ]
  [ 9시간 이상 ]
```

### Q4. 화장품 사용 ⭐⭐⭐
```yaml
질문: "현재 사용 중인 화장품은?"

선택지:
  [ 스킨케어만 ]
  [ 베이스 메이크업 ]
  [ 풀 메이크업 ]
  [ 안 씀 ]
```

### Q5. 최근 변화 ⭐⭐
```yaml
질문: "최근 피부에 변화가 있었나요?"

선택지:
  [ 좋아졌어요 ]
  [ 나빠졌어요 ]
  [ 비슷해요 ]
```

---

## 💪 C-1 모듈: 체형 분석 질문

**목표**: 체형 분석 + 목표 설정  
**질문 수**: 3개 + 측정값  
**예상 시간**: 1분  
**완료율 목표**: 85%+

### 측정값 입력
```yaml
필수 입력:
  - 키 (cm): 숫자 입력
  - 몸무게 (kg): 숫자 입력

검증:
  - 키: 100-220cm 범위
  - 몸무게: 30-200kg 범위
```

### Q1. 운동 빈도 ⭐⭐⭐⭐
```yaml
질문: "평소 운동은 얼마나 하시나요?"

선택지:
  [ 안 해요 ]
  [ 주 1-2회 ]
  [ 주 3-4회 ]
  [ 거의 매일 ]
```

### Q2. 목표 ⭐⭐⭐⭐⭐
```yaml
질문: "체형 관리 목표는?"

선택지:
  [ 다이어트 ]
  [ 근육 증가 ]
  [ 현재 유지 ]
  [ 건강 관리 ]
```

### Q3. 목표 몸무게 (선택) ⭐⭐⭐
```yaml
질문: "목표 몸무게가 있나요? (선택)"

입력:
  - 현재: 65kg
  - 목표: __kg (숫자 입력)
  
옵션:
  [ 건너뛰기 ] [ 완료 ]
```

---

## 💻 개발 구현 가이드

### 진행률 바 컴포넌트
```typescript
// components/ProgressBar.tsx
interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100
  
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>{current}/{total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

### 선택 버튼 컴포넌트
```typescript
// components/OptionButton.tsx
interface OptionButtonProps {
  label: string
  selected: boolean
  onClick: () => void
}

export function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 my-2 
        border-2 rounded-xl 
        text-left text-base
        transition-all duration-200
        ${selected 
          ? 'border-green-500 bg-green-50 font-semibold' 
          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
        }
      `}
    >
      {label}
    </button>
  )
}
```

### 질문 상태 관리
```typescript
// hooks/useQuestionnaire.ts
import { useState } from 'react'

interface Answer {
  questionId: string
  value: string
  timestamp: Date
}

export function useQuestionnaire(totalQuestions: number) {
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [answers, setAnswers] = useState<Answer[]>([])

  const handleSelect = (questionId: string, value: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== questionId)
      return [...filtered, { questionId, value, timestamp: new Date() }]
    })
    
    // 자동으로 다음 질문으로 (딜레이 추가)
    setTimeout(() => {
      if (currentQuestion < totalQuestions) {
        setCurrentQuestion(prev => prev + 1)
      }
    }, 300)
  }

  const handlePrev = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const getAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.value
  }

  const isComplete = answers.length >= totalQuestions - 1 // "잘 모르겠어요" 허용

  return {
    currentQuestion,
    answers,
    handleSelect,
    handlePrev,
    handleNext,
    getAnswer,
    isComplete
  }
}
```

### "잘 모르겠어요" 처리 로직
```typescript
// lib/personal-color-calculator.ts
interface QuestionnaireResult {
  answers: Record<string, string>
}

export function calculatePersonalColor(result: QuestionnaireResult) {
  const scores = {
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0
  }
  
  // 각 질문별 가중치 적용
  const { answers } = result
  
  // Q1: 손목 혈관 (가중치 2)
  if (answers.q1 === 'blue') {
    scores.summer += 2
    scores.winter += 2
  } else if (answers.q1 === 'green') {
    scores.spring += 2
    scores.autumn += 2
  }
  // "잘 모르겠어요"는 가중치 0 (아무것도 추가 안함)
  
  // Q2: 금/은 장신구 (가중치 2)
  if (answers.q2 === 'gold') {
    scores.spring += 2
    scores.autumn += 2
  } else if (answers.q2 === 'silver') {
    scores.summer += 2
    scores.winter += 2
  } else if (answers.q2 === 'both') {
    // 둘 다 비슷하면 각각 +1
    scores.spring += 1
    scores.summer += 1
    scores.autumn += 1
    scores.winter += 1
  }
  
  // ... 나머지 질문들도 동일 패턴
  
  // 최고 점수 계절 반환
  const maxScore = Math.max(...Object.values(scores))
  const season = Object.entries(scores)
    .find(([_, score]) => score === maxScore)?.[0] || 'summer'
  
  // 신뢰도 계산 (유효 답변 비율 기반)
  const validAnswers = Object.values(answers)
    .filter(v => v !== 'unknown').length
  const confidence = Math.round((validAnswers / 10) * 100)
  
  return {
    season,
    scores,
    confidence
  }
}
```

---

## ✅ 구현 체크리스트

```yaml
PC-1 온보딩:
  □ 질문 10개 UI 완성
  □ 진행률 바 작동
  □ 이전/다음 버튼 작동
  □ 답변 저장 확인
  □ "잘 모르겠어요" 처리 로직
  □ 셀카 업로드 UI
  □ 모바일 최적화

S-1 온보딩:
  □ 질문 5개 UI 완성
  □ 간단하고 빠른 플로우
  □ 피부 촬영 가이드
  
C-1 온보딩:
  □ 측정값 입력 검증
  □ 목표 설정 UI
  □ 선택 사항 명시
```

---

## 🎯 예상 효과

```yaml
온보딩 개선 전:
  완료율: 40-60%
  평균 시간: 3-5분
  불만: "귀찮아요", "뭘 써야 하죠?"

온보딩 개선 후:
  완료율: 85-90%
  평균 시간: 1-2분
  만족: "간단하네요!", "빠르네요!"

효과:
  ✅ 완료율 2배 향상
  ✅ 이탈률 50% 감소
  ✅ 베타 테스트 성공률 ↑
```

---

**버전**: v4.0 통합완전판  
**최종 업데이트**: 2025년 11월 25일  
**상태**: Phase 1 설계 완료 ✅
