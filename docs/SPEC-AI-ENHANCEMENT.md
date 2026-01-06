# SPEC: AI 고도화 - 음성 식단 기록 & AI 코치

> Gemini Pro 제외, 음성 인식 기반 식단 기록 + AI 코치 채팅

**Version**: 1.0
**Date**: 2026-01-07
**Status**: Draft
**Author**: Claude Code

---

## 1. 음성 기반 식단 기록

### 목적

"점심에 비빔밥 먹었어" → 자동으로 식단 기록 생성

### 기술 스택

```yaml
음성 인식: Web Speech API (브라우저 내장) / Whisper API (정확도 필요시)
자연어 처리: Gemini Flash (텍스트 → 영양정보 변환)
```

### 사용자 플로우

```
[🎤 버튼 탭]
    ↓
"점심에 비빔밥이랑 된장찌개 먹었어"
    ↓
[Gemini 분석]
    ↓
┌─────────────────────────────────────┐
│ 이렇게 기록할까요?                   │
│                                     │
│ 🍚 비빔밥 (약 600kcal)              │
│ 🥣 된장찌개 (약 80kcal)             │
│                                     │
│ [수정하기]  [확인]                  │
└─────────────────────────────────────┘
```

### API 설계

```typescript
// POST /api/nutrition/voice-record
{
  transcript: "점심에 비빔밥이랑 된장찌개 먹었어",
  mealType?: "lunch" | "breakfast" | "dinner" | "snack" // 자동 추론 가능
}

// Response
{
  success: true,
  parsedItems: [
    {
      name: "비빔밥",
      calories: 600,
      protein: 15,
      carbs: 90,
      fat: 18,
      confidence: 0.85
    },
    {
      name: "된장찌개",
      calories: 80,
      protein: 5,
      carbs: 8,
      fat: 3,
      confidence: 0.90
    }
  ],
  inferredMealType: "lunch",
  inferredTime: "12:30"
}
```

### 구현 파일

| 파일 | 내용 |
|------|------|
| `components/nutrition/VoiceRecordButton.tsx` | 음성 인식 버튼 |
| `hooks/useVoiceRecognition.ts` | Web Speech API 훅 |
| `app/api/nutrition/voice-record/route.ts` | 음성 → 영양정보 API |
| `lib/nutrition/voice-parser.ts` | Gemini 파싱 로직 |

### 예상 작업량

- 컴포넌트: 4h
- API: 3h
- 테스트: 2h
- **총계: 9h**

---

## 2. AI 코치 채팅

### 목적

개인화된 건강/뷰티 조언을 대화형으로 제공

### 기술 스택

```yaml
LLM: Gemini Flash (대화형)
컨텍스트: 사용자 분석 결과 + 기록 히스토리
UI: 채팅 인터페이스 (스트리밍 응답)
```

### 사용자 플로우

```
┌─────────────────────────────────────┐
│ 🤖 AI 코치                          │
├─────────────────────────────────────┤
│                                     │
│ 안녕하세요! 무엇이든 물어보세요.      │
│                                     │
│     ┌──────────────────────────┐    │
│     │ 오늘 운동 뭐 하면 좋을까? │    │
│     └──────────────────────────┘    │
│                                     │
│ 오늘은 하체 운동 날이네요!            │
│ 지난주 스쿼트 기록 보니 50kg으로      │
│ 10회씩 3세트 하셨는데, 오늘은        │
│ 55kg으로 도전해보시는 건 어떨까요?    │
│                                     │
├─────────────────────────────────────┤
│ [메시지 입력...]           [전송]   │
└─────────────────────────────────────┘
```

### 컨텍스트 주입

```typescript
interface CoachContext {
  // 사용자 프로필
  personalColor: PersonalColorResult;
  skinAnalysis: SkinAnalysisResult;
  bodyAnalysis: BodyAnalysisResult;

  // 최근 기록
  recentWorkouts: WorkoutLog[];    // 최근 7일
  recentMeals: MealRecord[];       // 최근 3일

  // 목표
  fitnessGoal: string;
  nutritionGoal: string;
}
```

### API 설계

```typescript
// POST /api/coach/chat
{
  message: "오늘 운동 뭐 하면 좋을까?",
  conversationId?: string  // 대화 이어가기
}

// Response (SSE 스트리밍)
{
  type: "chunk" | "done",
  content: "오늘은 하체 운동 날이네요!",
  conversationId: "conv_123"
}
```

### 구현 파일

| 파일 | 내용 |
|------|------|
| `app/(main)/coach/page.tsx` | 코치 채팅 페이지 |
| `components/coach/ChatInterface.tsx` | 채팅 UI |
| `components/coach/MessageBubble.tsx` | 메시지 버블 |
| `app/api/coach/chat/route.ts` | 스트리밍 채팅 API |
| `lib/coach/context-builder.ts` | 사용자 컨텍스트 수집 |
| `lib/coach/prompts.ts` | 코치 프롬프트 템플릿 |

### 예상 작업량

- UI 컴포넌트: 6h
- 스트리밍 API: 4h
- 컨텍스트 빌더: 3h
- 테스트: 3h
- **총계: 16h**

---

## 시지푸스 판정

| 기능 | 파일 수 | 복잡도 | 판정 |
|------|---------|--------|------|
| 음성 식단 기록 | 4개 | 중간 | ⚠️ 단독 실행 가능 |
| AI 코치 채팅 | 6개 | 높음 | ✅ 시지푸스 필요 |

---

**Status**: Draft (승인 대기)
