---
paths:
  - '**/gemini*'
  - '**/ai/**'
  - '**/analysis/**'
  - '**/mock/**'
---

# AI 통합 규칙

> Gemini AI 사용 패턴 및 Fallback 전략

## 모델 선택

### 기본 모델: Gemini 3.5 Flash (GA)

```typescript
// lib/gemini/client.ts
model: process.env.GEMINI_MODEL || 'gemini-3.5-flash';
```

> 2026-07-06 마이그레이션: `gemini-3-flash-preview`가 공식 폐기 목록에 올라 GA 승계
> 모델 `gemini-3.5-flash`로 교체 (thinking 파라미터 미사용 → ID 교체만으로 호환).
> 비용 3배(입력 $0.5→$1.5/1M).

### 모듈별 모델 혼합 (2026-07-07 A/B 실측)

| 작업                       | 모델                         | 근거                                                   |
| -------------------------- | ---------------------------- | ------------------------------------------------------ |
| 피부 S-1/S-2 (구조화 추출) | `FAST_MODEL`(3.1-flash-lite) | 판정 5/5 동일·3~7초(3.5는 15~19초)·1/6 가격            |
| 퍼스널컬러 PC (색 판정)    | 기본(3.5-flash)              | lite는 같은 사진에서 winter↔autumn 널뜀 + invalid JSON |
| body/hair/makeup           | 기본(3.5-flash)              | 미검증 — 검증 후 lite 확대                             |

환경변수: `GEMINI_MODEL`(기본), `GEMINI_MODEL_FAST`(경량 오버라이드).

### 사용처

| 모듈 | 용도             |
| ---- | ---------------- |
| PC-1 | 퍼스널 컬러 분석 |
| S-1  | 피부 분석        |
| C-1  | 체형 분석        |
| N-1  | 음식 인식        |
| RAG  | 제품 Q&A         |

## Fallback 전략

> **상세 가이드**: Mock Fallback 전략은 [ADR-007](../../docs/adr/ADR-007-mock-fallback-strategy.md) 참조
> (타임아웃 3초, 재시도 2회, Mock 파일 구조, UI 신뢰도 표시 등)

**핵심 원칙**:

- 모든 AI 호출에 Mock Fallback 필수
- 타임아웃: 3초 / 재시도: 2회
- Mock 사용 시 `isMock: true` + 낮은 `confidence` 반환

## 프롬프트 규칙

> **상세 가이드**: 프롬프트 작성 시 [`prompt-engineering.md`](./prompt-engineering.md) 참조
> (Step-by-Step 분석, 할루시네이션 방지, Few-shot 예시 등)

### 언어 (이룸 표준)

```
프롬프트 본문: 한국어 (도메인 전문성 + 한국 사용자 맥락)
JSON 필드명: 영어 (camelCase)
응답 텍스트: 한국어
```

**예외**: RAG 제품 Q&A는 영어 (제품 데이터 혼재)

### 구조 (이모지 + 평문)

```typescript
const prompt = `
당신은 ${role} 전문가입니다.

⚠️ 분석 전 확인:
${conditions}

📊 분석 기준:
${criteria}

다음 JSON 형식으로만 응답해주세요:
${schema}
`;
```

### 예시 (피부 분석)

```typescript
const prompt = `
당신은 전문 피부과학 기반 AI 분석가입니다.

📊 분석 기준:
- 사용자 연령: ${age}
- 피부 타입: ${skinType}
- 관심사: ${concerns.join(', ')}

다음 JSON 형식으로만 응답해주세요:
{
  "overallScore": [0-100 사이 점수],
  "concerns": ["문제1", "문제2"],
  "recommendations": ["추천1", "추천2"]
}
`;
```

## 비용 최적화

### 컨텍스트 캐싱

동일 프롬프트 반복 시 캐싱 활용:

```typescript
// Gemini 3 Flash는 컨텍스트 캐싱으로 90% 비용 절감 가능
const cachedModel = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
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
GEMINI_MODEL=gemini-3.5-flash

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

---

---

## 원리 기반 프롬프트 전략 (Level 2, 2026-03-26)

### 핵심 원칙

```
이룸의 AI 분석 품질 = 프롬프트 품질 × 서버 검증 품질

프롬프트에 "분석해주세요"만 넣으면 → AI 일반 지식 의존 → 70%
프롬프트에 논문 수치 기준을 넣으면 → 수학적 판단 → 85-90%

따라서: 모든 분석 프롬프트는 docs/principles/ 원리를 주입해야 함
```

### 프롬프트 작성 시 체크리스트

```
□ docs/principles/에 해당 도메인 원리 문서가 있는가?
□ 원리의 핵심 수치가 프롬프트에 포함되었는가? (주관적 설명 ❌ → 객관적 수치 ✅)
□ 한국인 기준값이 있으면 포함했는가?
□ 경계 케이스 처리 규칙이 있는가?
□ 서버 측 교차 검증이 있는가?
□ 크로스 모듈 원리가 해당되면 포함했는가?
```

### 참고

- 상세 Level 체계 → [prompt-engineering.md](./prompt-engineering.md) Level 섹션
- 원리 문서 → `docs/principles/`
- 적용 실적 → `docs/TODO.md` 섹션 9.B

---

**Version**: 1.1 | **Updated**: 2026-03-26 | 원리 기반 프롬프트 전략 추가
