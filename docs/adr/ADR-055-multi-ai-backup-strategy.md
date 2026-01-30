# ADR-055: Multi-AI 백업 전략

## 상태

`accepted`

## 날짜

2026-01-24

## 맥락 (Context)

### 현재 상황

이룸은 **Gemini 3 Flash 단일 AI 모델**에 의존하고 있습니다:

```
현재 아키텍처:
┌─────────────────────────────────────────────────────────────┐
│                     AI 분석 파이프라인                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [사용자 요청]                                               │
│       ↓                                                      │
│  [Gemini 3 Flash] ← 단일 의존점 (Single Point of Failure)   │
│       ↓                                                      │
│  [성공 or 타임아웃]                                          │
│       ↓                                                      │
│  [Mock Fallback] ← 현재 유일한 대안                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 문제점

| 문제 | 영향 | 빈도 추정 |
|------|------|----------|
| **Gemini API 장애** | 전체 분석 기능 중단 | 월 1-2회 (30분-2시간) |
| **Rate Limiting** | 사용자별 분석 차단 | 피크타임 발생 가능 |
| **지역 장애** | 한국 사용자 전체 영향 | 분기 1회 미만 |
| **가격 정책 변경** | 운영 비용 급등 | 예측 불가 |

### 현재 대응책 (ADR-007, ADR-021)

- **Mock Fallback**: AI 실패 시 사전 정의된 Mock 데이터 반환
- **3초 타임아웃 + 2회 재시도**: 일시적 장애 대응
- **Feature Flag**: Mock 강제 활성화 가능

**한계**: Mock은 개인화된 분석 결과가 아닌 일반적인 결과이므로 사용자 가치 저하

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- AI 서비스 가용성 99.999% (5-nines)
- 무중단 자동 장애 조치 (Zero-downtime failover)
- 모든 AI 프로바이더 간 완벽한 응답 일관성
- 비용 최적화 자동 라우팅
- 실시간 성능 모니터링 및 자동 스케일링
- 지역별 최적 AI 선택

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 프로바이더 간 응답 차이 | 프롬프트/모델 차이 | Zod 스키마 표준화 |
| 비용 증가 | Secondary 사용 시 추가 비용 | 실패 시만 Secondary |
| 구현 복잡도 | 다중 프로바이더 관리 | 추상화 레이어 |
| 프롬프트 유지보수 | 2개 모델 대응 | 공통 템플릿 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 가용성 | 99.999% | 99.99% |
| Fallback 비율 | 0.1% 미만 | 5% 미만 |
| 응답 일관성 | 100% | 95% |
| 비용 효율 | 최적화 자동화 | 수동 모니터링 |
| 장애 복구 시간 | 1초 미만 | 5초 미만 |

### 현재 목표

**Phase 1: 60%** (2-tier Fallback)
- Primary: Gemini 3 Flash
- Secondary: Claude 3.5 Haiku
- Tertiary: Mock Fallback
- 서킷 브레이커 패턴
- 기본 모니터링

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| 자체 모델 호스팅 | 인프라 비용, MVP 범위 초과 | Series A 이후 |
| 3개+ AI 프로바이더 | 복잡도 증가 | 장애 빈도 증가 시 |
| 지역별 라우팅 | 글로벌 트래픽 부재 | 글로벌 확장 시 |
| 비용 자동 최적화 | 트래픽 패턴 미확정 | MAU 10K+ |

---

## 결정 (Decision)

### Multi-AI Fallback Chain 도입

```
┌─────────────────────────────────────────────────────────────┐
│                   Multi-AI Fallback Chain                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [사용자 요청]                                               │
│       ↓                                                      │
│  ┌───────────────────────────────────────────────┐          │
│  │ Level 1: Primary AI (Gemini 3 Flash)           │          │
│  │ - 타임아웃: 3초                                 │          │
│  │ - 재시도: 2회                                   │          │
│  │ - 비용: $0.02/req                              │          │
│  └─────────────────┬─────────────────────────────┘          │
│                    ↓ (실패 시)                               │
│  ┌───────────────────────────────────────────────┐          │
│  │ Level 2: Secondary AI (Claude 3.5 Haiku)       │          │
│  │ - 타임아웃: 4초                                 │          │
│  │ - 재시도: 1회                                   │          │
│  │ - 비용: $0.025/req                             │          │
│  └─────────────────┬─────────────────────────────┘          │
│                    ↓ (실패 시)                               │
│  ┌───────────────────────────────────────────────┐          │
│  │ Level 3: Mock Fallback                         │          │
│  │ - 즉시 반환                                    │          │
│  │ - 비용: $0                                     │          │
│  │ - 사용자 알림 필수                             │          │
│  └───────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### AI 모델 선택

| 순위 | 모델 | 역할 | 선택 이유 |
|------|------|------|----------|
| **1st** | Gemini 3 Flash | Primary | 속도, 비용, 한국어 (ADR-003) |
| **2nd** | Claude 3.5 Haiku | Secondary | 빠른 응답, 합리적 비용, 높은 가용성 |
| **3rd** | Mock | Fallback | 최후 수단, 서비스 연속성 |

### Secondary AI 선택 근거: Claude 3.5 Haiku

| 기준 | Claude 3.5 Haiku | GPT-4o-mini | 선택 |
|------|-----------------|-------------|------|
| **속도** | 1-2초 | 2-3초 | Haiku |
| **비용** | $0.025/1K | $0.015/1K | GPT-4o-mini |
| **이미지 분석** | 우수 | 우수 | 동등 |
| **한국어** | 90%+ | 85%+ | Haiku |
| **가용성** | 99.9%+ | 99.9%+ | 동등 |
| **벤더 다양성** | Anthropic | OpenAI | Haiku (Google 아님) |

**결론**: 벤더 다양성(Google 아닌 서비스) + 한국어 품질로 **Claude 3.5 Haiku** 선택

### 구현 아키텍처

```typescript
// lib/ai/multi-provider.ts
export interface AIProvider {
  name: string;
  analyze: (input: AnalysisInput) => Promise<AnalysisResult>;
  timeout: number;
  maxRetries: number;
  priority: number;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'gemini',
    analyze: analyzeWithGemini,
    timeout: 3000,
    maxRetries: 2,
    priority: 1,
  },
  {
    name: 'claude',
    analyze: analyzeWithClaude,
    timeout: 4000,
    maxRetries: 1,
    priority: 2,
  },
];

export async function analyzeWithMultiAI<T>(
  input: AnalysisInput,
  generateMock: () => T
): Promise<{ result: T; provider: string; usedFallback: boolean }> {
  for (const provider of AI_PROVIDERS) {
    if (!isProviderEnabled(provider.name)) continue;

    try {
      const result = await withTimeout(
        withRetry(() => provider.analyze(input), { maxRetries: provider.maxRetries }),
        provider.timeout
      );

      return { result, provider: provider.name, usedFallback: false };
    } catch (error) {
      console.error(`[AI] ${provider.name} failed:`, error);
      // 다음 provider로 시도
    }
  }

  // 모든 AI 실패 시 Mock
  console.error('[AI] All providers failed, using mock');
  return {
    result: generateMock(),
    provider: 'mock',
    usedFallback: true,
  };
}
```

### Feature Flag 통합

```typescript
// lib/feature-flags/ai-flags.ts
export const aiFlags = {
  // Primary AI 활성화
  enableGemini: true,

  // Secondary AI 활성화
  enableClaude: true,

  // Secondary AI 사용 조건
  useSecondaryOnPrimaryFailure: true,

  // 에러율 임계값 (% 초과 시 자동 스위칭)
  primaryErrorThreshold: 10,

  // 강제 Mock 모드
  forceMock: false,
};
```

### 서킷 브레이커 패턴

```typescript
// lib/ai/circuit-breaker.ts
interface CircuitState {
  failures: number;
  lastFailure: Date | null;
  state: 'closed' | 'open' | 'half-open';
}

export class AICircuitBreaker {
  private state: CircuitState = {
    failures: 0,
    lastFailure: null,
    state: 'closed',
  };

  private readonly FAILURE_THRESHOLD = 5;
  private readonly RESET_TIMEOUT_MS = 30000; // 30초

  async execute<T>(
    provider: AIProvider,
    fn: () => Promise<T>
  ): Promise<T> {
    if (this.state.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state.state = 'half-open';
      } else {
        throw new Error(`Circuit open for ${provider.name}`);
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

  private onSuccess(): void {
    this.state = { failures: 0, lastFailure: null, state: 'closed' };
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = new Date();

    if (this.state.failures >= this.FAILURE_THRESHOLD) {
      this.state.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.state.lastFailure) return true;
    const elapsed = Date.now() - this.state.lastFailure.getTime();
    return elapsed >= this.RESET_TIMEOUT_MS;
  }
}
```

## 대안 (Alternatives Considered)

### 대안 1: OpenAI GPT-4o-mini as Secondary

| 장점 | 단점 |
|------|------|
| 더 저렴한 비용 ($0.015/1K) | 한국어 품질 낮음 |
| 높은 안정성 | 벤더 다양성 없음 (Big 3 중 2개) |

**제외 사유**: `ALT_SUFFICIENT` - 한국어 품질과 벤더 다양성 우선

### 대안 2: 자체 모델 호스팅 (e.g., LLaMA, Mistral)

| 장점 | 단점 |
|------|------|
| 완전한 제어 | 인프라 비용/복잡도 |
| 커스터마이징 가능 | 성능 튜닝 필요 |
| 장기적 비용 절감 | MVP 범위 초과 |

**제외 사유**: `HIGH_COMPLEXITY` - MVP 단계에서 ROI 낮음

### 대안 3: 단일 AI + 강화된 Mock

| 장점 | 단점 |
|------|------|
| 구현 간단 | 개인화된 분석 불가 |
| 비용 없음 (Mock) | 사용자 가치 저하 |

**제외 사유**: `LOW_ROI` - 핵심 가치인 AI 분석 품질 저하

### 대안 4: Multi-Region Gemini

| 장점 | 단점 |
|------|------|
| 지역 장애 대응 | 동일 벤더 의존 |
| 구현 간단 | 글로벌 장애 시 무용 |

**제외 사유**: `PREREQ_MISSING` - 벤더 다양성 확보 안됨

## 결과 (Consequences)

### 긍정적 결과

| 결과 | 효과 |
|------|------|
| **가용성 향상** | 99.9% → 99.99% 예상 (2개 독립 서비스) |
| **벤더 리스크 분산** | Google 장애 시에도 서비스 지속 |
| **사용자 경험 개선** | Mock 대신 실제 AI 분석 제공 |
| **협상력 확보** | 벤더별 가격 협상 여지 |

### 부정적 결과

| 결과 | 완화 방안 |
|------|----------|
| **비용 증가** | Secondary 사용은 Primary 실패 시만 |
| **구현 복잡도** | 추상화 레이어로 관리 |
| **프롬프트 유지보수** | 공통 프롬프트 템플릿 사용 |
| **응답 일관성** | 출력 스키마 표준화 (Zod) |

### 비용 분석

```
시나리오: MAU 10,000, 월 50,000 분석 요청

현재 (Gemini only):
- 정상: 50,000 × $0.02 = $1,000/월
- 장애 시: Mock (비용 $0, 가치 저하)

제안 (Multi-AI):
- 정상 (95%): 47,500 × $0.02 = $950
- Secondary (5%): 2,500 × $0.025 = $62.50
- 총 비용: $1,012.50/월 (+1.25%)

결론: 월 $12.50 추가로 가용성 10배 향상
```

### 모니터링 지표

```typescript
// lib/monitoring/ai-metrics.ts
export const aiMetrics = {
  // Provider별 성공률
  providerSuccessRate: {
    gemini: 0,
    claude: 0,
    mock: 0,
  },

  // Provider별 평균 응답시간
  providerLatency: {
    gemini: 0,
    claude: 0,
  },

  // Fallback 발생률
  fallbackRate: 0,

  // 서킷 브레이커 상태
  circuitState: {
    gemini: 'closed',
    claude: 'closed',
  },
};
```

## 구현 계획

### Phase 1: 기반 구축 (1주)

- [ ] `lib/ai/providers/` 디렉토리 구조 생성
- [ ] `AIProvider` 인터페이스 정의
- [ ] Gemini 어댑터 리팩토링

### Phase 2: Secondary 통합 (1주)

- [ ] Claude API 클라이언트 구현
- [ ] 프롬프트 호환성 검증
- [ ] Fallback 체인 구현

### Phase 3: 안정화 (1주)

- [ ] 서킷 브레이커 구현
- [ ] Feature Flag 통합
- [ ] 모니터링 대시보드 구축
- [ ] 알림 설정 (Slack/PagerDuty)

## 환경변수

```bash
# .env.local
# Primary AI
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GEMINI_MODEL=gemini-3-flash-preview

# Secondary AI
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-latest

# Feature Flags
ENABLE_SECONDARY_AI=true
AI_PRIMARY_ERROR_THRESHOLD=10
```

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: AI 추론](../principles/ai-inference.md) - 멀티 프로바이더, 서킷 브레이커

### 관련 ADR

- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 선택 근거
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - 기존 Fallback
- [ADR-021: 엣지 케이스 및 폴백 전략](./ADR-021-edge-cases-fallback.md) - 3단계 폴백
- [ADR-010: AI 파이프라인 아키텍처](./ADR-010-ai-pipeline.md)

### 관련 규칙

- [AI Integration Rules](../../.claude/rules/ai-integration.md)
- [Feature Flags Rules](../../.claude/rules/feature-flags.md)

---

**Author**: Claude Code
**Reviewed by**: -
