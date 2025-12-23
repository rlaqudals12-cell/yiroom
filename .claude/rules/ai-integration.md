# AI 통합 규칙

> Gemini AI 사용 패턴 및 Fallback 전략

## 모델 선택

### 기본 모델: Gemini 3 Flash
```typescript
// lib/gemini.ts
model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview'
```

### 사용처
| 모듈 | 용도 |
|------|------|
| PC-1 | 퍼스널 컬러 분석 |
| S-1 | 피부 분석 |
| C-1 | 체형 분석 |
| N-1 | 음식 인식 |
| RAG | 제품 Q&A |

## Fallback 전략

### 필수 패턴
모든 AI 호출은 Mock Fallback 필수:

```typescript
try {
  const result = await analyzeWithGemini(input);
  return result;
} catch (error) {
  console.error('[Module] Gemini error, falling back to mock:', error);
  return generateMockResult(input);
}
```

### Mock 파일 위치
```
lib/mock/
├── workout-analysis.ts   # W-1 Mock
├── skin-analysis.ts      # S-1 Mock
├── body-analysis.ts      # C-1 Mock
└── food-analysis.ts      # N-1 Mock
```

## 타임아웃 설정

```typescript
// 권장: 3초 타임아웃 + 2회 재시도
const TIMEOUT_MS = 3000;
const MAX_RETRIES = 2;
```

## 프롬프트 규칙

### 언어
- 프롬프트: 영어 (더 정확한 응답)
- 응답 형식: JSON 요청 시 명시

### 구조
```typescript
const prompt = `
You are a ${role} expert.

Context:
${context}

Task:
${task}

Output format:
Return a JSON object with the following structure:
${schema}
`;
```

### 예시 (피부 분석)
```typescript
const prompt = `
You are a professional dermatologist AI assistant.

Analyze the skin condition based on:
- User age: ${age}
- Skin type: ${skinType}
- Concerns: ${concerns.join(', ')}

Return JSON:
{
  "overallScore": number (0-100),
  "concerns": string[],
  "recommendations": string[]
}
`;
```

## 비용 최적화

### 컨텍스트 캐싱
동일 프롬프트 반복 시 캐싱 활용:

```typescript
// Gemini 3 Flash는 컨텍스트 캐싱으로 90% 비용 절감 가능
const cachedModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
  cachedContent: cachedContext,
});
```

### 토큰 절약
- 불필요한 context 제거
- 간결한 프롬프트 작성
- JSON 응답 시 필요한 필드만 요청

## 환경변수

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# 모델 오버라이드 (선택)
GEMINI_MODEL=gemini-3-flash-preview

# Mock 강제 사용 (개발/테스트)
FORCE_MOCK_AI=true
```

## 에러 로깅

```typescript
// 모듈 식별자 포함 필수
console.error('[S-1] Gemini error:', error);
console.error('[W-1] API timeout, using mock');
console.log('[N-1] Analysis completed');
```
