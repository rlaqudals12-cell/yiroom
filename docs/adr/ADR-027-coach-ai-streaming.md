# ADR-027: AI 웰니스 코치 스트리밍 아키텍처

## 상태

`accepted`

## 날짜

2026-01-19

## 맥락 (Context)

이룸은 사용자의 분석 결과(PC-1, S-1, C-1, W-1, N-1)를 기반으로 개인화된 웰니스 상담을 제공하는 AI 코치 기능이 필요합니다.

### 요구사항

1. **실시간 응답**: 긴 응답도 즉각적인 피드백 제공
2. **컨텍스트 활용**: 사용자의 분석 결과, 목표, 히스토리 반영
3. **대화 연속성**: 이전 대화 맥락 유지
4. **추천 질문**: 대화 흐름에 맞는 후속 질문 제안

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 실시간 양방향 대화 (WebSocket)
- 음성 입출력 지원 (STT/TTS)
- 멀티모달 이해 (이미지, 차트 분석)
- 감정 인식 및 공감 대화
- 장기 기억 및 개인화 학습
- 프로액티브 코칭 (사용자 행동 기반 자동 개입)
- 전문가 연계 (필요 시 실제 전문가 연결)

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 서버리스 제약 | Vercel WebSocket 미지원 | SSE 사용 |
| AI 응답 지연 | Gemini 첫 청크 0.5초 | 스트리밍으로 체감 감소 |
| 컨텍스트 길이 | 토큰 제한 | 요약 + 최근 대화만 |
| 음성 처리 | 별도 인프라 필요 | 텍스트 우선 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 통신 방식 | 양방향 실시간 | SSE 단방향 스트리밍 |
| 첫 응답 지연 | < 100ms | < 500ms |
| 입력 방식 | 텍스트 + 음성 + 이미지 | 텍스트만 |
| 개인화 | 장기 학습 | 세션 컨텍스트 |
| 코칭 방식 | 프로액티브 | 리액티브 (사용자 질문 시) |
| 전문가 연계 | 실시간 연결 | 없음 |

### 현재 목표

**Phase 1: 45%** (기본 SSE 스트리밍 코치)
- SSE 기반 텍스트 스트리밍
- 세션별 대화 히스토리 관리
- 분석 결과 컨텍스트 주입
- 추천 질문 제안

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| WebSocket | Vercel 서버리스 미지원 | 자체 인프라 구축 시 |
| 음성 입출력 | 인프라 및 비용 | Beta 이후 |
| 멀티모달 입력 | 복잡도 높음 | 코치 안정화 후 |
| 장기 기억 | 저장소 및 프라이버시 | 사용자 동의 체계 구축 후 |
| 프로액티브 코칭 | 푸시 알림 체계 필요 | 알림 시스템 구축 후 |
| 전문가 연계 | 비즈니스 모델 필요 | B2B 진입 시 |

---

## 결정 (Decision)

**SSE(Server-Sent Events) 기반 스트리밍** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                  AI Coach 스트리밍 아키텍처                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  클라이언트                                                   │
│  ├── POST /api/coach/stream                                  │
│  │   └── message, chatHistory                                │
│  └── SSE EventSource로 수신                                  │
│                      ↓                                       │
│  서버                                                        │
│  ├── 1. Clerk 인증 확인                                      │
│  ├── 2. 사용자 컨텍스트 조회                                 │
│  │   └── 분석 결과, 프로필, 목표                             │
│  ├── 3. Gemini 스트리밍 호출                                 │
│  │   └── 시스템 프롬프트 + 컨텍스트 + 히스토리              │
│  └── 4. SSE로 청크 전송                                      │
│                      ↓                                       │
│  클라이언트 수신                                              │
│  ├── type: "chunk" → 텍스트 append                          │
│  ├── type: "done" → 추천 질문 표시                          │
│  └── type: "error" → 에러 처리                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 세션 관리

```typescript
// 세션 구조
interface CoachSession {
  id: string;
  userId: string;
  title?: string;
  messages: CoachMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### 컨텍스트 주입

```typescript
interface UserContext {
  // 분석 결과
  personalColor?: { season: string; confidence: number };
  skinAnalysis?: { skinType: string; concerns: string[] };
  bodyAnalysis?: { bodyType: string; recommendations: string[] };

  // 목표 및 선호
  goals?: string[];
  preferences?: {
    dietaryRestrictions?: string[];
    exercisePreferences?: string[];
  };

  // 프로필
  profile?: {
    age?: number;
    gender?: string;
  };
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| WebSocket | 양방향 통신 | 서버리스 미지원 | `HIGH_COMPLEXITY` - Vercel 제한 |
| Long Polling | 단순 구현 | 지연 시간, 비효율 | `LOW_ROI` - UX 저하 |
| 일반 POST | 가장 단순 | 긴 응답 대기 | `LOW_ROI` - 3초+ 대기 불가 |

## 결과 (Consequences)

### 긍정적 결과

- **즉각적 피드백**: 첫 청크 0.5초 내 표시
- **자연스러운 UX**: 타이핑 효과로 대화 느낌
- **서버리스 호환**: Vercel Edge Functions 지원

### 부정적 결과

- **연결 관리**: 네트워크 끊김 시 재연결 필요
- **상태 동기화**: 클라이언트-서버 상태 불일치 가능

### 리스크

- Gemini 스트리밍 지연 → **타임아웃 + 폴백 메시지**

## 구현 가이드

### 파일 구조

```
app/api/coach/
├── stream/route.ts       # SSE 스트리밍 (현재 구현)
├── chat/route.ts         # 일반 채팅 (폴백)
├── sessions/
│   ├── route.ts          # 세션 목록/생성
│   └── [sessionId]/
│       └── route.ts      # 세션 상세/수정/삭제

lib/coach/
├── index.ts              # 통합 export
├── context.ts            # 컨텍스트 조회
├── streaming.ts          # Gemini 스트리밍
└── prompts.ts            # 시스템 프롬프트
```

### SSE 이벤트 형식

```typescript
// 청크 이벤트
{ type: 'chunk', content: '안녕하세요! ' }

// 완료 이벤트
{
  type: 'done',
  suggestedQuestions: ['운동 추천해줘', '식단 조언해줘']
}

// 에러 이벤트
{ type: 'error', message: '응답 생성 중 오류가 발생했어요.' }
```

### 클라이언트 사용 예시

```typescript
const response = await fetch('/api/coach/stream', {
  method: 'POST',
  body: JSON.stringify({ message, chatHistory }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'chunk') {
        appendMessage(data.content);
      }
    }
  }
}
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - 프롬프트 엔지니어링, 컨텍스트 주입
- [원리: 크로스 도메인 시너지](../principles/cross-domain-synergy.md) - 모듈 간 데이터 연계

### 관련 ADR/스펙
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 3 Flash
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 컨텍스트 데이터 흐름

---

**Author**: Claude Code
**Reviewed by**: -
