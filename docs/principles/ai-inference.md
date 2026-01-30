# AI 추론 원리 (AI Inference)

> 이 문서는 이룸 프로젝트의 AI 분석 모듈 (PC-1, S-1, C-1 등)의 기반이 되는 AI/ML 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 AI 분석 시스템"

- 모든 분석 유형에서 전문가 수준(90%+) 정확도 달성
- 100% 응답 보장 (5단계 폴백으로 무중단 서비스)
- 실시간 신뢰도 계산 및 캘리브레이션 < 0.05
- 모든 피부톤/연령/성별에서 ±5% 이내 편향 차이
- 완전한 설명 가능성 (XAI)으로 결과 근거 제시
- 토큰 비용 최적화로 분석당 $0.001 이하
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| API 레이턴시 | Gemini API 최소 응답 시간 500ms |
| VLM 환각 | 이미지 해석 오류 가능 (특히 조명 불량 시) |
| 비용 구조 | 토큰당 과금으로 복잡한 분석은 비용 증가 |
| 편향 완전 제거 | 학습 데이터 기반 모델의 내재적 한계 |
| 의료 정확도 | 의료기기 인증 없이 진단 수준 도달 불가 |

### 100점 기준

- 단일 요청 타임아웃 3초 이내, 재시도 포함 총 10초 이내
- 캘리브레이션 에러 < 0.1 (신뢰도 vs 실제 정확도)
- 피부톤 그룹 간 정확도 차이 < 5%
- 폴백 발생률 < 3% (정상 시)
- JSON 파싱 성공률 99%+ (다중 전략)
- 프롬프트 버전 관리 및 A/B 테스트 체계
- 비용 예산 대비 실사용 ±10% 이내

### 현재 목표: 85%

- Gemini 3 Flash 기반 VLM 분석 파이프라인
- 3단계 폴백 전략 (재시도→대체모델→Mock)
- 이미지 품질 기반 신뢰도 조정
- 구조화된 프롬프트 템플릿 (5개 섹션)
- Zod 스키마 기반 응답 검증
- 토큰 최적화 (이미지 리사이즈, 프롬프트 압축)
- 피부톤별 보정 계수 적용

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 자체 모델 학습 | 비용/복잡성 대비 효용 낮음 | 사용자 10만 이상 시 |
| Multi-modal RAG | 기술 성숙도 부족 | Gemini 2.0 Pro 출시 시 |
| 실시간 비디오 분석 | 비용 및 레이턴시 문제 | Edge AI 보급 시 |
| 의료기기 인증 | 규제 복잡성, MVP 범위 초과 | 시리즈 B 이후 |
| 완전 자동 편향 교정 | 보정 계수 수동 검증 필요 | 대규모 A/B 테스트 후 |
| Semantic Cache | 구현 복잡성 대비 효용 불명확 | 비용 병목 발생 시 |

---

## 1. 핵심 개념

### 1.1 Vision Language Model (VLM)

이룸은 Google Gemini 3 Flash를 주요 VLM으로 사용한다.

**VLM의 특징:**
- 이미지와 텍스트를 동시에 처리
- 시각적 특성을 자연어로 설명
- 도메인 지식 기반 분석

```
입력: 이미지 + 분석 요청 프롬프트
처리: 멀티모달 인코딩 → 추론 → 디코딩
출력: 구조화된 분석 결과 (JSON)
```

### 1.2 프롬프트 엔지니어링

#### 프롬프트 구조

```
1. 역할 정의 (Role)
   "당신은 전문 피부과 전문의입니다."

2. 맥락 제공 (Context)
   "사용자가 제출한 피부 사진을 분석합니다."

3. 지시사항 (Instructions)
   "다음 항목에 대해 평가해주세요: 1. 피부 유형 2. 수분도 3. 문제 영역"

4. 출력 형식 (Output Format)
   "JSON 형식으로 응답하세요: {skinType: string, hydration: number, ...}"

5. 제약사항 (Constraints)
   "의료 진단이 아닌 일반적인 관찰입니다."
```

#### 프롬프트 패턴

| 패턴 | 용도 | 예시 |
|------|------|------|
| Zero-shot | 기본 분석 | "이 피부 사진을 분석하세요" |
| Few-shot | 일관성 향상 | 예시 결과 3개 포함 |
| Chain-of-Thought | 복잡한 추론 | "단계별로 분석하세요" |
| Self-Consistency | 신뢰도 향상 | 동일 입력 3회 분석 후 통합 |

### 1.3 신뢰도 (Confidence)

AI 분석 결과의 신뢰도를 측정하고 표시하는 것은 사용자 신뢰 구축에 필수적이다.

**신뢰도 요소:**
- 이미지 품질 (선명도, 조명)
- 분석 대상 가시성 (얼굴 인식, 피부 노출)
- 모델 확신도 (출력 확률)
- 입력 일관성 (다중 분석 일치도)

---

## 2. 수학적 기반

### 2.1 신뢰도 계산

```
Confidence = α × Image_Quality + β × Model_Certainty + γ × Consistency
```

- `α, β, γ`: 가중치 (합계 = 1.0)
- `Image_Quality`: 0-1 (sharpness, exposure 기반)
- `Model_Certainty`: 0-1 (모델 출력 확률)
- `Consistency`: 0-1 (다중 분석 일치도)

**권장 가중치:**
```
α = 0.3 (이미지 품질)
β = 0.5 (모델 확신)
γ = 0.2 (일관성)
```

### 2.2 일관성 측정

```typescript
function calculateConsistency(analyses: Analysis[]): number {
  if (analyses.length < 2) return 1.0;

  let agreements = 0;
  let comparisons = 0;

  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      comparisons++;
      if (isSimilar(analyses[i], analyses[j])) {
        agreements++;
      }
    }
  }

  return agreements / comparisons;
}
```

### 2.3 캘리브레이션

모델 확신도와 실제 정확도의 일치도:

```
Calibration Error = Σ |Confidence_bucket - Accuracy_bucket| / n_buckets
```

목표: Calibration Error < 0.1

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

1. **이미지 전처리**
   - 품질 검증 (CIE-1)
   - 정규화 (크기, 색상 보정)

2. **프롬프트 생성**
   - 분석 유형별 템플릿
   - 맥락 정보 주입

3. **모델 호출**
   - 단일 요청 타임아웃: 3초
   - 재시도: 최대 2회 (총 3회 시도)
   - 총 타임아웃 예산: 10초 (3초 × 3회 + 오버헤드)
   - 폴백: 타임아웃/실패 시 Mock 데이터 반환

4. **결과 파싱**
   - JSON 추출
   - 스키마 검증
   - 신뢰도 계산

### 3.2 알고리즘 → 코드

```typescript
interface AnalysisResult<T> {
  data: T;
  confidence: number;
  metadata: {
    model: string;
    latency: number;
    retries: number;
    usedFallback: boolean;
  };
}

async function analyzeWithAI<T>(
  image: string,
  promptTemplate: string,
  schema: z.ZodSchema<T>
): Promise<AnalysisResult<T>> {
  const startTime = Date.now();
  let retries = 0;

  // 1. 이미지 품질 검증
  const imageQuality = await validateImageQuality(image);
  if (imageQuality.score < 0.5) {
    throw new ImageQualityError('이미지 품질이 부족합니다');
  }

  // 2. 프롬프트 생성
  const prompt = buildPrompt(promptTemplate, {
    imageQuality: imageQuality.score,
    timestamp: new Date().toISOString(),
  });

  // 3. 모델 호출 (재시도 포함)
  let response: string | null = null;
  while (retries < MAX_RETRIES) {
    try {
      response = await callGemini(prompt, image, { timeout: 3000 });
      break;
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) {
        // 폴백 처리
        return generateFallbackResult(schema);
      }
    }
  }

  // 4. 결과 파싱 및 검증
  const parsed = parseJsonFromResponse(response);
  const validated = schema.parse(parsed);

  // 5. 신뢰도 계산
  const confidence = calculateConfidence({
    imageQuality: imageQuality.score,
    modelCertainty: parsed._confidence || 0.7,
    consistency: 1.0, // 단일 분석
  });

  return {
    data: validated,
    confidence,
    metadata: {
      model: 'gemini-3-flash',
      latency: Date.now() - startTime,
      retries,
      usedFallback: false,
    },
  };
}
```

### 3.3 폴백 전략

```typescript
const FALLBACK_STRATEGY = {
  level1: {
    name: 'Retry',
    maxAttempts: 2,
    delay: 1000,
  },
  level2: {
    name: 'Alternative Model',
    model: 'gemini-3-flash-lite',
  },
  level3: {
    name: 'Mock Data',
    notify: true,
    message: '분석이 지연되어 예시 결과를 표시합니다.',
  },
};
```

---

## 4. AI 투명성

### 4.1 사용자 고지 요소

| 고지 항목 | 내용 | 표시 위치 |
|----------|------|----------|
| AI 분석 표시 | "AI가 분석한 결과입니다" | 결과 상단 |
| 신뢰도 | "정확도: 85%" | 결과 옆 |
| 면책조항 | "의료 진단이 아닙니다" | 하단 고정 |
| 모델 정보 | "Google Gemini 기반" | 정보 페이지 |

### 4.2 설명 가능성

```typescript
interface ExplanationData {
  summary: string;           // "피부 분석 결과 요약"
  reasoning: string[];       // 분석 근거 목록
  limitations: string[];     // 한계점
  alternatives: string[];    // 다른 해석 가능성
}
```

---

## 5. 주의사항

### 5.1 AI 편향 (Bias)

```
⚠️ 잠재적 편향 영역:

- 피부톤 편향: 다양한 피부톤에서 정확도 차이
- 조명 편향: 특정 조명 조건에서 성능 저하
- 연령 편향: 특정 연령대 데이터 편중
- 문화적 편향: 뷰티 기준의 문화적 차이
```

**완화 전략:**
- 다양한 테스트 데이터셋
- 정기적 편향 감사
- 사용자 피드백 수집

### 5.2 보안 고려사항

```
이미지 데이터 처리:
- 분석 후 즉시 삭제 (세션 내)
- 로깅에 이미지 데이터 제외
- 제3자 모델 전송 시 암호화
- 사용자 동의 기반 처리
```

---

## 6. 검증 방법

### 6.1 원리 준수 검증

| 검증 항목 | 기준 | 방법 |
|----------|------|------|
| 신뢰도 정확성 | 캘리브레이션 < 0.1 | A/B 테스트 |
| 폴백 동작 | 100% 응답 보장 | 장애 주입 테스트 |
| 편향 검사 | 그룹간 정확도 차이 < 5% | 정기 감사 |

### 6.2 성능 테스트

```typescript
describe('AI Analysis', () => {
  it('should complete within 3 seconds', async () => {
    const start = Date.now();
    await analyzeWithAI(testImage, skinPrompt, skinSchema);
    expect(Date.now() - start).toBeLessThan(3000);
  });

  it('should return valid confidence score', async () => {
    const result = await analyzeWithAI(testImage, skinPrompt, skinSchema);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
```

---

## 7. 참고 자료

### 논문
- Wei et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in LLMs"
- Anthropic. (2023). "Constitutional AI: Harmlessness from AI Feedback"

### 가이드라인
- Google. (2024). Gemini API Best Practices
- OpenAI. (2023). GPT Best Practices

### 법규
- EU AI Act (2024)
- 한국 인공지능 윤리기준 (2023)

---

## 8. 고급 프롬프트 엔지니어링

### 8.1 구조화된 프롬프트

```typescript
interface StructuredPrompt {
  system: string;      // 역할 정의
  context: string;     // 배경 정보
  task: string;        // 작업 지시
  format: string;      // 출력 형식
  constraints: string; // 제약사항
}

function buildVLMPrompt(template: StructuredPrompt): string {
  return `
[SYSTEM]
${template.system}

[CONTEXT]
${template.context}

[TASK]
${template.task}

[FORMAT]
${template.format}

[CONSTRAINTS]
${template.constraints}
`;
}
```

### 8.2 토큰 최적화

| 기법 | 절감률 | 설명 |
|------|--------|------|
| 프롬프트 압축 | 35% | 불필요 문구 제거 ("please", "kindly") |
| 이미지 리사이즈 | 57% | 768x768 해상도 (피부 분석) |
| Prefix 캐싱 | 90% | 시스템 프롬프트 캐시 |

```typescript
// 분석 유형별 이미지 설정
const ANALYSIS_IMAGE_CONFIG = {
  skin: { width: 768, height: 768, quality: 0.85 },
  personalColor: { width: 512, height: 512, quality: 0.9 },
  bodyType: { width: 1024, height: 1024, quality: 0.8 },
};
```

### 8.3 프롬프트 버전 관리

```typescript
const PROMPT_VERSION = {
  skin_v3: {
    id: 'skin_v3',
    createdAt: '2026-01-15',
    performance: { accuracy: 0.92, latency: 1.8 },
  },
  skin_v2: {
    id: 'skin_v2',
    deprecated: true,
    redirectTo: 'skin_v3',
  },
};
```

---

## 9. 신뢰도 계산 고도화

### 9.1 불확실성 유형

| 유형 | 설명 | 원인 |
|------|------|------|
| **Aleatoric** | 데이터 고유 불확실성 | 이미지 품질, 조명 |
| **Epistemic** | 모델 지식 불확실성 | 학습 데이터 부족 |

### 9.2 이미지 품질 기반 조정

```typescript
interface ImageQualityMetrics {
  sharpness: number;    // 0-100 (Laplacian variance)
  brightness: number;   // 0-100 (mean luminance)
  contrast: number;     // 0-100 (std deviation)
  faceDetected: boolean;
}

function adjustConfidenceByImageQuality(
  baseConfidence: number,
  quality: ImageQualityMetrics
): number {
  const qualityScore =
    quality.sharpness * 0.4 +
    quality.brightness * 0.3 +
    quality.contrast * 0.3;

  // 품질 낮으면 신뢰도 감소
  const adjustment = Math.min(1, qualityScore / 70);
  return baseConfidence * adjustment;
}
```

### 9.3 신뢰도 레벨 커뮤니케이션

| 레벨 | 점수 범위 | UI 표시 | 조치 |
|------|----------|--------|------|
| High | 80-100 | 녹색 뱃지 | 결과 표시 |
| Medium | 60-79 | 노란색 뱃지 | 주의 문구 |
| Low | 0-59 | 빨간색 뱃지 | 재촬영 권고 |

```tsx
function LowConfidenceWarning({ confidence }: { confidence: number }) {
  if (confidence >= 60) return null;

  return (
    <Alert variant="warning">
      <AlertTitle>분석 정확도가 낮습니다</AlertTitle>
      <AlertDescription>
        더 정확한 결과를 위해 조명이 밝은 곳에서 다시 촬영해주세요.
      </AlertDescription>
      <Button>다시 촬영하기</Button>
    </Alert>
  );
}
```

---

## 10. 복원력 및 Fallback 심화

### 10.1 5단계 Fallback 계층

```
Level 0: 정상 동작
    ↓ (실패)
Level 1: 재시도 (지수 백오프)
    ↓ (실패)
Level 2: 대체 모델 (gemini-flash-lite)
    ↓ (실패)
Level 3: 캐시된 결과 (유사 분석)
    ↓ (실패)
Level 4: Mock 데이터 + 사용자 알림
    ↓ (실패)
Level 5: 서비스 일시 중단 메시지
```

### 10.2 서킷 브레이커

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime?: Date;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > RECOVERY_TIMEOUT) {
        this.state = 'half-open';
      } else {
        throw new CircuitOpenError();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    if (this.failureCount >= FAILURE_THRESHOLD) {
      this.state = 'open';
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }
}
```

### 10.3 Fallback 알림

```tsx
function FallbackNotice({ level }: { level: number }) {
  if (level < 4) return null;

  return (
    <Alert variant="info">
      <span className="ai-badge">AI 예시</span>
      <p>분석이 지연되어 예시 결과를 표시합니다.</p>
      <p className="text-muted">실제 분석은 잠시 후 업데이트됩니다.</p>
    </Alert>
  );
}
```

---

## 11. 비용 최적화

### 11.1 캐싱 전략

| 캐시 유형 | 히트율 | 비용 절감 |
|----------|--------|----------|
| Prefix Cache | ~50% | 90% |
| Semantic Cache | ~30% | 100% |
| Response Cache | ~20% | 100% |

```typescript
class SemanticCache {
  private redis: Redis;
  private embeddingService: EmbeddingService;

  async get(query: string): Promise<CachedResult | null> {
    const embedding = await this.embeddingService.embed(query);
    const similarKeys = await this.findSimilar(embedding, 0.95);

    if (similarKeys.length > 0) {
      return await this.redis.get(similarKeys[0]);
    }
    return null;
  }

  async set(query: string, result: AnalysisResult): Promise<void> {
    const embedding = await this.embeddingService.embed(query);
    const key = `semantic:${hash(embedding)}`;
    await this.redis.setex(key, 86400, JSON.stringify(result));
  }
}
```

### 11.2 모델 라우팅

```typescript
// 복잡도 기반 모델 선택
function selectModel(analysisType: string, imageComplexity: number): string {
  const MODEL_ROUTER = {
    simple: 'gemini-2.0-flash-lite',   // < 0.3 복잡도
    standard: 'gemini-2.0-flash',      // 0.3-0.7
    complex: 'gemini-2.0-pro',         // > 0.7
  };

  const level = imageComplexity < 0.3 ? 'simple'
              : imageComplexity < 0.7 ? 'standard'
              : 'complex';

  return MODEL_ROUTER[level];
}
```

### 11.3 비용 모니터링

```typescript
// 일일 예산 체크
async function checkDailyBudget(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const usage = await redis.get(`token_usage:${today}`);
  const usedUSD = calculateCost(parseInt(usage || '0'));

  if (usedUSD > DAILY_BUDGET * 0.8) {
    await sendAlert('AI 비용 80% 도달');
  }

  return usedUSD < DAILY_BUDGET;
}
```

---

## 12. 응답 파싱 및 검증

### 12.1 다중 파싱 전략

```typescript
async function parseResponse<T>(
  response: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  // 전략 1: 직접 JSON 파싱
  try {
    return schema.parse(JSON.parse(response));
  } catch {}

  // 전략 2: Markdown 코드블록 추출
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return schema.parse(JSON.parse(codeBlockMatch[1]));
    } catch {}
  }

  // 전략 3: JSON 객체 패턴 추출
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return schema.parse(JSON.parse(jsonMatch[0]));
    } catch {}
  }

  // 전략 4: 부분 파싱 + 기본값
  return parsePartialWithDefaults(response, schema);
}
```

### 12.2 검증 파이프라인

```typescript
function validateAndNormalize<T>(data: T, schema: z.ZodSchema<T>): T {
  // 1. 스키마 검증
  const validated = schema.parse(data);

  // 2. 범위 정규화 (0-100)
  const normalized = normalizeRanges(validated);

  // 3. 논리적 일관성 검증
  const consistent = checkConsistency(normalized);

  // 4. 이상치 감지
  const anomalies = detectAnomalies(consistent);
  if (anomalies.length > 0) {
    logWarning('Anomalies detected', anomalies);
  }

  return consistent;
}
```

---

## 13. 설명 가능성 (XAI)

### 13.1 텍스트 설명 생성

```typescript
interface StructuredExplanation {
  summary: string;              // 한 줄 요약
  keyFindings: KeyFinding[];    // 주요 발견
  scoreBreakdown: ScoreItem[];  // 점수 분해
  recommendations: Recommendation[];
  limitations: string[];
}

async function generateExplanation(
  result: AnalysisResult
): Promise<StructuredExplanation> {
  return {
    summary: `피부 타입: ${result.skinType}, 전체 점수: ${result.overallScore}/100`,
    keyFindings: [
      { area: 'T존', finding: '유분 과다', severity: 'high' },
      { area: 'U존', finding: '수분 부족', severity: 'medium' },
    ],
    scoreBreakdown: [
      { name: '수분도', score: 65, meaning: '약간 건조함' },
      { name: '유분도', score: 78, meaning: '다소 높음' },
    ],
    recommendations: [
      { priority: 'high', action: '수분크림 사용 증가', reason: '건조 개선' },
    ],
    limitations: ['조명 조건으로 색상 정확도 제한'],
  };
}
```

### 13.2 시각적 설명

```tsx
// 분석 영역 하이라이트
function AnalysisHighlight({ imageUrl, regions }: HighlightProps) {
  return (
    <div className="relative">
      <img src={imageUrl} alt="분석 이미지" />
      <canvas
        className="absolute inset-0"
        ref={(canvas) => drawHighlights(canvas, regions)}
      />
      <Legend regions={regions} />
    </div>
  );
}

// 점수 시각화
function ScoreVisualization({ scores }: { scores: ScoreItem[] }) {
  return (
    <div className="space-y-4">
      {scores.map((score) => (
        <div key={score.name}>
          <div className="flex justify-between">
            <span>{score.name}</span>
            <span>{score.score}/100</span>
          </div>
          <Progress value={score.score} />
          <p className="text-sm text-muted-foreground">{score.meaning}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 14. 공정성 및 편향 관리

### 14.1 피부톤 분류

| 스케일 | 단계 | 특징 |
|--------|------|------|
| Fitzpatrick | 6단계 (I-VI) | 전통적, 의료 표준 |
| Monk | 10단계 | Google 개발, 더 세분화 |

```typescript
// 이미지에서 피부톤 감지
async function detectSkinTone(image: string): Promise<SkinToneResult> {
  const labValues = await extractLabColorspace(image);
  const lightness = labValues.L;  // 0-100

  // Fitzpatrick 매핑
  const fitzpatrick =
    lightness > 70 ? 'I-II' :
    lightness > 50 ? 'III-IV' :
    'V-VI';

  return { fitzpatrick, lightness };
}
```

### 14.2 편향 테스트

```typescript
interface BiasTestConfig {
  groups: string[];          // ['light', 'medium', 'dark']
  metrics: string[];         // ['accuracy', 'confidence']
  threshold: number;         // 그룹간 차이 허용치 (0.15)
}

async function runBiasTest(config: BiasTestConfig): Promise<BiasReport> {
  const results: GroupMetrics[] = [];

  for (const group of config.groups) {
    const testSet = await getTestDataByGroup(group);
    const metrics = await evaluateOnTestSet(testSet);
    results.push({ group, ...metrics });
  }

  // 그룹간 차이 분석
  const maxDifference = calculateMaxDifference(results);
  const hasBias = maxDifference > config.threshold;

  return {
    results,
    maxDifference,
    hasBias,
    recommendations: hasBias
      ? ['보정 계수 적용 권장', '추가 데이터 수집 필요']
      : [],
  };
}
```

### 14.3 편향 완화 전략

```typescript
// 보정 계수 적용
const SKIN_TONE_CORRECTION = {
  'V-VI': {
    hydration: 1.1,    // +10% 보정
    oiliness: 0.95,    // -5% 보정
  },
  'III-IV': {
    hydration: 1.05,
  },
};

function applyBiasCorrection(
  result: AnalysisResult,
  skinTone: string
): AnalysisResult {
  const corrections = SKIN_TONE_CORRECTION[skinTone];
  if (!corrections) return result;

  return {
    ...result,
    scores: {
      hydration: result.scores.hydration * (corrections.hydration || 1),
      oiliness: result.scores.oiliness * (corrections.oiliness || 1),
    },
    _correctionApplied: true,
  };
}
```

### 14.4 투명성 공개

```typescript
function addUncertaintyDisclosure(
  result: AnalysisResult,
  skinTone: string,
  confidence: number
): AnalysisResult {
  const disclosure: string[] = [];

  if (confidence < 70) {
    disclosure.push('분석 신뢰도가 낮습니다.');
  }

  if (['V', 'VI'].includes(skinTone)) {
    disclosure.push(
      '어두운 피부톤의 경우 일부 지표의 정확도가 제한될 수 있습니다. ' +
      '전문가 상담을 권장드립니다.'
    );
  }

  return { ...result, _disclosure: disclosure };
}
```

---

## 15. 관련 문서

### 아키텍처 결정 (이 원리를 적용하는 ADR)

| ADR | 설명 |
|-----|------|
| [ADR-003-ai-model-selection](../adr/ADR-003-ai-model-selection.md) | Gemini 모델 선택 근거 |
| [ADR-010-ai-pipeline](../adr/ADR-010-ai-pipeline.md) | AI 분석 파이프라인 설계 |
| [ADR-007-mock-fallback-strategy](../adr/ADR-007-mock-fallback-strategy.md) | AI 장애 시 Mock Fallback |
| [ADR-024-ai-transparency](../adr/ADR-024-ai-transparency.md) | AI 투명성 고지 |
| [ADR-055-multi-ai-backup-strategy](../adr/ADR-055-multi-ai-backup-strategy.md) | 다중 AI 백업 전략 |

### 관련 원리 문서

| 문서 | 관계 |
|------|------|
| [security-patterns.md](./security-patterns.md) | AI API 보안, Rate Limiting |
| [legal-compliance.md](./legal-compliance.md) | AI 기본법, 자동화 결정 고지 |
| [color-science.md](./color-science.md) | 퍼스널컬러 분석 원리 |
| [skin-physiology.md](./skin-physiology.md) | 피부 분석 원리 |
| [body-mechanics.md](./body-mechanics.md) | 체형/자세 분석 원리 |
| [rag-retrieval.md](./rag-retrieval.md) | RAG 기반 검색 |

---

## 16. 참고 자료

### 논문

- Wei et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in LLMs"
- Anthropic. (2023). "Constitutional AI: Harmlessness from AI Feedback"
- Buolamwini, J. (2018). "Gender Shades: Intersectional Accuracy Disparities"
- Guo, C. et al. (2017). "On Calibration of Modern Neural Networks"

### 가이드라인

- Google. (2024). Gemini API Best Practices
- OpenAI. (2023). GPT Best Practices
- Google. (2023). Monk Skin Tone Scale

### 법규

- EU AI Act (2024)
- 한국 인공지능 윤리기준 (2023)
- AI 기본법 (2026.1.22 시행)

---

## 17. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-002](../adr/ADR-002-hybrid-data-pattern.md) | 하이브리드 데이터 패턴 | AI 색상 분석 |
| [ADR-003](../adr/ADR-003-ai-model-selection.md) | AI 모델 선택 | Gemini 선택 근거 |
| [ADR-007](../adr/ADR-007-mock-fallback-strategy.md) | Mock Fallback 전략 | VLM 프롬프트 |
| [ADR-010](../adr/ADR-010-ai-pipeline.md) | AI 파이프라인 | AI 추론 |
| [ADR-013](../adr/ADR-013-error-handling.md) | 에러 핸들링 | AI Fallback |
| [ADR-015](../adr/ADR-015-testing-strategy.md) | 테스트 전략 | AI 테스트 |
| [ADR-018](../adr/ADR-018-i18n-architecture.md) | 국제화 아키텍처 | AI 응답 다국어 |
| [ADR-019](../adr/ADR-019-performance-monitoring.md) | 성능 모니터링 | AI 호출 로깅 |
| [ADR-021](../adr/ADR-021-edge-cases-fallback.md) | 엣지 케이스 Fallback | AI Mock Fallback |
| [ADR-027](../adr/ADR-027-coach-ai-streaming.md) | AI 코치 스트리밍 | SSE 스트리밍 |

---

**Version**: 2.0 | **Created**: 2026-01-18 | **Updated**: 2026-01-19
**소스 리서치**: AI-1-R1, AI-2-R1, AI-3-R1, AI-4-R1, AI-5-R1, AI-6-R1, AI-7-R1, AI-8-R1
**관련 모듈**: PC-1, S-1, C-1, N-1, 모든 AI 분석 모듈
