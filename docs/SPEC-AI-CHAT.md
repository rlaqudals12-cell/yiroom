# SPEC-AI-CHAT: AI 상담 채팅 시스템

> 사용자의 피부, 건강, 제품 관련 질문에 AI가 맞춤 답변을 제공하는 채팅 시스템

## 1. 개요

### 1.1 목적
- 분석 결과에 대한 추가 질문 답변
- 개인 맞춤형 피부/건강 조언 제공
- 제품 추천 및 성분 정보 안내
- 시스템에서 제공하지 않는 상세 정보 보완

### 1.2 핵심 가치
- **개인화**: 사용자의 분석 결과를 컨텍스트로 활용
- **전문성**: 피부과학/영양학 기반 정확한 정보
- **연결성**: 제품 추천과 어필리에이트 시스템 연동

### 1.3 AI 모델
- **Gemini 3 Flash** (기존 분석 시스템과 동일)
- 컨텍스트 캐싱으로 비용 최적화

## 2. 기능 범위

### 2.1 지원 주제

| 카테고리 | 예시 질문 |
|----------|----------|
| **피부 분석** | "내 피부 타입에 맞는 세안제는?", "수분 부족 개선 방법" |
| **퍼스널컬러** | "봄 웜톤에 어울리는 립 색상", "피해야 할 컬러" |
| **체형/운동** | "내 체형에 맞는 운동", "어깨 넓히는 운동 추천" |
| **영양** | "단백질 섭취 권장량", "비타민 D 부족 증상" |
| **제품** | "세라마이드 성분 효과", "○○ 제품 리뷰" |
| **일반 건강** | "수면 개선 방법", "스트레스 관리" |

### 2.2 제한 범위

| 제외 항목 | 이유 |
|----------|------|
| 의료 진단 | 의료법 준수 |
| 처방약 조언 | 의료 행위 금지 |
| 질병 치료 | 전문의 상담 필요 |
| 타 서비스 비교 | 경쟁사 언급 회피 |

## 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Chat UI    │────▶│  Chat API    │────▶│  Gemini AI  │
│  (Client)   │◀────│  (Server)    │◀────│  (Flash)    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │  Context     │
       │            │  Builder     │
       │            └──────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│  Message    │     │  User Data   │
│  History    │     │  (Analyses)  │
└─────────────┘     └──────────────┘
```

### 3.2 컨텍스트 구성

```typescript
// 시스템 프롬프트 + 사용자 컨텍스트
const context = {
  system: SYSTEM_PROMPT,           // 캐싱 (고정)
  userProfile: {                   // 동적
    skinAnalysis: {...},           // 피부 분석 결과
    personalColor: {...},          // 퍼스널컬러 결과
    bodyAnalysis: {...},           // 체형 분석 결과
    workoutPlan: {...},            // 운동 계획
    nutritionGoals: {...},         // 영양 목표
  },
  recentProducts: [...],           // 최근 본 제품
  conversationHistory: [...],      // 대화 기록 (최근 10개)
};
```

## 4. 데이터 구조

### 4.1 TypeScript 타입

```typescript
// types/chat.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    productRecommendations?: ProductRecommendation[];
    relatedAnalysis?: string;  // 참조한 분석 유형
  };
}

export interface ChatSession {
  id: string;
  clerkUserId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  reason: string;
  affiliateUrl?: string;
}

export interface ChatContext {
  skinAnalysis?: SkinAnalysisResult;
  personalColor?: PersonalColorResult;
  bodyAnalysis?: BodyAnalysisResult;
  workoutPlan?: WorkoutPlan;
  recentProducts?: Product[];
}

export interface ChatRequest {
  message: string;
  sessionId?: string;  // 기존 세션 계속
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  productRecommendations?: ProductRecommendation[];
}
```

### 4.2 Supabase 테이블 (선택적)

```sql
-- 대화 세션 저장 (선택적, 히스토리 유지 시)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  context_snapshot JSONB,  -- 대화 시작 시점 분석 결과
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions"
  ON chat_sessions FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_chat_sessions_user ON chat_sessions(clerk_user_id);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at DESC);
```

## 5. API 설계

### 5.1 채팅 API

```
POST /api/chat
```

**Request:**
```json
{
  "message": "내 피부에 맞는 보습제 추천해줘",
  "sessionId": "sess_abc123"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg_xyz789",
      "role": "assistant",
      "content": "회원님의 피부 분석 결과를 보니...",
      "timestamp": "2025-01-01T12:00:00Z",
      "metadata": {
        "productRecommendations": [
          {
            "productId": "prod_123",
            "productName": "세라마이드 보습크림",
            "reason": "건성 피부에 적합한 세라마이드 함유"
          }
        ],
        "relatedAnalysis": "skin"
      }
    },
    "sessionId": "sess_abc123"
  }
}
```

### 5.2 세션 조회 API (선택적)

```
GET /api/chat/sessions
GET /api/chat/sessions/:sessionId
DELETE /api/chat/sessions/:sessionId
```

## 6. 프롬프트 설계

### 6.1 시스템 프롬프트

```typescript
const SYSTEM_PROMPT = `
당신은 이룸(Yiroom)의 AI 웰니스 상담사입니다.

## 역할
- 사용자의 피부, 건강, 운동, 영양에 대한 질문에 친절하고 전문적으로 답변
- 사용자의 분석 결과를 참고하여 개인 맞춤형 조언 제공
- 적절한 제품이 있다면 자연스럽게 추천

## 답변 원칙
1. 친근하고 정중한 존댓말 사용
2. 의학적 진단이나 처방은 절대 하지 않음
3. "~일 수 있어요", "~를 권장드려요" 등 부드러운 표현 사용
4. 확실하지 않은 정보는 "전문가 상담을 권장드려요"로 안내
5. 답변은 간결하게 (200자 내외), 필요시 항목별 정리

## 제품 추천 시
- 사용자의 분석 결과와 연관된 제품만 추천
- 추천 이유를 간단히 설명
- [PRODUCT:product_id:product_name] 형식으로 표시

## 금지 사항
- 의료 진단 및 처방
- 경쟁 서비스 언급
- 부정적이거나 불안을 조성하는 표현
- 개인정보 요청
`;
```

### 6.2 컨텍스트 주입 예시

```typescript
const userContext = `
## 사용자 분석 결과

### 피부 분석 (2025-01-15)
- 피부 타입: 복합성 (T존 지성, U존 건성)
- 수분도: 42% (낮음)
- 주요 고민: 모공, 건조함
- 추천 성분: 히알루론산, 나이아신아마이드

### 퍼스널컬러
- 시즌: 봄 웜톤 (Spring Warm)
- 베스트 컬러: 코랄, 피치, 아이보리

### 최근 관심 제품
- 세라마이드 토너
- 비타민C 세럼
`;
```

## 7. UI 설계

### 7.1 페이지 구조

```
/chat
├── ChatHeader.tsx        # 헤더 (새 대화, 설정)
├── ChatMessages.tsx      # 메시지 목록
├── ChatInput.tsx         # 입력창
├── ProductCard.tsx       # 제품 추천 카드
└── SuggestedQuestions.tsx # 추천 질문
```

### 7.2 UI 와이어프레임

```
┌─────────────────────────────────────────────┐
│  AI 상담                        [새 대화]   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🤖 안녕하세요! 피부, 건강, 제품에   │   │
│  │    대해 궁금한 점을 물어보세요.     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 내 피부에 맞는 보습제 추천해줘   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🤖 회원님의 피부 분석 결과를 보니   │   │
│  │    복합성 피부에 수분이 부족한      │   │
│  │    상태예요. 세라마이드 성분이      │   │
│  │    들어간 보습제를 추천드려요.      │   │
│  │                                     │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │ 🛍️ 세라마이드 보습크림       │  │   │
│  │  │    건성 피부 진정에 효과적   │  │   │
│  │  │    [자세히 보기]             │  │   │
│  │  └──────────────────────────────┘  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 💡 추천 질문                        │   │
│  │ • 세라마이드와 히알루론산 차이는?   │   │
│  │ • 아침저녁 다른 제품 써도 될까?     │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [메시지를 입력하세요...]          [전송]   │
└─────────────────────────────────────────────┘
```

## 8. 구현 계획

### Phase 1: 기본 인프라
- [ ] types/chat.ts 타입 정의
- [ ] lib/chat/prompt.ts 프롬프트 빌더
- [ ] lib/chat/context.ts 컨텍스트 수집기
- [ ] lib/chat/gemini.ts Gemini 호출 래퍼

### Phase 2: API
- [ ] POST /api/chat 채팅 API
- [ ] 제품 추천 파싱 및 연동

### Phase 3: UI
- [ ] /chat 페이지
- [ ] ChatMessages 컴포넌트
- [ ] ChatInput 컴포넌트
- [ ] ProductCard 컴포넌트

### Phase 4: 테스트
- [ ] lib/chat 유닛 테스트
- [ ] API 테스트
- [ ] 컴포넌트 테스트

### Phase 5: 최적화
- [ ] 컨텍스트 캐싱 적용
- [ ] 스트리밍 응답 (선택적)
- [ ] 대화 히스토리 저장 (선택적)

## 9. 비용 추정

### Gemini 3 Flash 가격

| 항목 | 가격 |
|------|------|
| Input | $0.10 / 1M tokens |
| Output | $0.40 / 1M tokens |

### 1회 대화 비용

```
Input:  시스템 프롬프트 300 + 컨텍스트 500 + 대화 200 = 1,000 tokens
Output: 응답 300 tokens

비용 = (1,000 × $0.10 + 300 × $0.40) / 1,000,000
     = $0.00022 (약 0.3원)
```

### 월간 예상 (컨텍스트 캐싱 적용)

| 사용자 | 월 대화 | 비용 |
|--------|--------|------|
| 1,000명 | 5,000회 | 약 500원 |
| 10,000명 | 50,000회 | 약 5,000원 |
| 50,000명 | 250,000회 | 약 25,000원 |

## 10. 고려사항

### 10.1 안전성
- 의료 조언 면책 문구 표시
- 민감 질문 필터링
- 부적절 응답 모니터링

### 10.2 사용자 경험
- 타이핑 인디케이터 표시
- 스트리밍 응답으로 체감 속도 향상
- 오프라인/에러 시 안내 메시지

### 10.3 확장성
- 멀티턴 대화 지원
- 이미지 업로드 질문 (추후)
- 음성 입력 (추후)

---

**Version**: 1.0
**Created**: 2025-12-29
**Status**: Draft
