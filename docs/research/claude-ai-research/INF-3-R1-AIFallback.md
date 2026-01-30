# INF-3-R1: AI Fallback 전략 및 Mock 데이터 종합 리서치

## 1. 핵심 요약

AI 서비스 장애 시 사용자 경험을 보장하기 위해 **계층적 Fallback 아키텍처**가 필수입니다. 최적 전략은 **캐시 확인 → Retry with Jitter → 대체 AI → Mock 데이터** 순서의 다단계 접근입니다. 한국인 퍼스널 컬러 분포는 **가을 웜톤 23%, 여름 쿨톤 18%, 봄 웜톤 18%, 겨울 쿨톤 10%** 비율로 Mock 데이터를 설계하며, Fallback 사용 시 **Inline 표시 + 재시도 버튼**으로 투명하게 고지해야 합니다. Circuit Breaker는 **opossum** 또는 **cockatiel** 라이브러리로 구현하고, Fallback 비율 **5% 초과 시 경고, 10% 초과 시 즉시 대응**을 권장합니다.

---

## 2. 상세 내용

### 2.1 Fallback 전략 비교

| 전략 | 장점 | 단점 | 적합 케이스 |
|------|------|------|------------|
| **Mock 데이터** | 즉각 응답 보장, 구현 단순, API 비용 절감 | 개인화 불가, 핵심 가치 상실, 신뢰도 저하 | 개발/테스트 환경, 비핵심 기능, 최후의 수단 |
| **캐시 반환** | 빠른 응답(1-5ms), 부분 개인화 유지, 비용 절감 | 캐시 미스 문제, 데이터 신선도 트레이드오프 | 동일 사용자 반복 요청, 변화 주기 긴 분석 |
| **자동 재시도** | 일시적 장애 극복, 자동 복구, Thundering Herd 방지 | 응답 지연, 영구 장애에 무력 | Rate Limiting(429), 일시적 네트워크 오류 |
| **대체 AI Failover** | 고가용성, 벤더 종속 탈피 | 구현 복잡, 응답 일관성 문제, 비용 급증 위험 | 미션 크리티컬 프로덕션, 글로벌 서비스 |

#### 권장 계층적 아키텍처

최적의 Fallback 전략은 단일 방식이 아닌 **다단계 계층 구조**입니다. 첫 번째로 Redis 또는 Edge Cache에서 기존 결과를 확인하고, 캐시 미스 시 Primary AI(Gemini)를 호출하면서 **Exponential Backoff with Jitter**로 최대 3회 재시도합니다. 모든 재시도 실패 시 Secondary AI(OpenAI/Claude)로 전환하고, 그마저 실패하면 사용자의 이전 분석 결과를 캐시에서 반환합니다. 최종적으로 어떤 캐시도 없을 때만 Mock 데이터와 함께 재시도 안내 메시지를 표시합니다.

#### Stale-While-Revalidate 패턴

캐시 전략의 핵심은 **SWR(Stale-While-Revalidate)** 패턴입니다. `Cache-Control: max-age=60, stale-while-revalidate=3600` 설정으로 60초간 fresh 상태를 유지하고, 이후 1시간까지는 stale 데이터를 즉시 반환하면서 백그라운드에서 갱신합니다. 퍼스널 컬러 분석 결과는 **7-30일 TTL**이 적합하며, 상품 추천은 1-24시간, 시즌 컬러 팔레트는 30-90일을 권장합니다.

#### Exponential Backoff with Jitter 설정

재시도 전략의 핵심 파라미터는 **최대 재시도 3-5회, 초기 대기 100-500ms, 최대 대기 5-30초, Backoff 배수 2x**입니다. AWS가 권장하는 **Full Jitter** 공식 `sleep = random(0, min(cap, base * 2^attempt))`을 적용하면 동시 재시도 트래픽이 효과적으로 분산됩니다. 재시도 가능한 에러 코드는 **429, 500, 502, 503, 504**이며, 400번대 클라이언트 에러는 재시도하지 않습니다.

---

### 2.2 Mock 데이터 생성 규칙

#### 한국인 퍼스널 컬러 실제 분포 (잼페이스 2022년 139만회 테스트 기반)

| 퍼스널 컬러 유형 | 비율 |
|----------------|------|
| 가을 웜 트루 | **22.8%** |
| 여름 쿨 트루 | 18.4% |
| 봄 웜 트루 | 18.2% |
| 겨울 쿨 트루 | 10.4% |
| 기타 세부 톤 | ~30.2% |

한국인은 전체적으로 **웜톤 55-60%, 쿨톤 40-45%** 분포를 보입니다. 가장 흔한 타입은 가을 웜톤(25-30%)이고, 가장 희귀한 타입은 겨울 쿨톤(8-12%)입니다. Mock 데이터 생성 시 이 통계적 분포를 반영해야 사용자가 Fallback 결과를 받더라도 자연스러운 결과로 인식합니다.

#### 한국인 피부톤 통계 (Fitzpatrick Scale)

PubMed 연구에 따르면 동아시아인의 Fitzpatrick 분포는 **Type III 70-75%**, Type II 10-15%, Type IV 10-15%입니다. 피부 언더톤은 **웜 45-50%, 쿨 35-40%, 뉴트럴 15-20%**로 추정됩니다. 동아시아인은 표면에 황색기가 있어 웜톤으로 오해받기 쉬우나, 실제로는 웜/쿨/뉴트럴 모두 존재합니다.

#### Mock 데이터 다양성 보장 알고리즘

결정론적이면서도 다양한 Mock 데이터를 생성하려면 **사용자 ID 기반 시드**를 사용합니다. Mulberry32 PRNG(Pseudo-Random Number Generator)로 사용자 ID를 해시하여 시드를 생성하면, 동일 사용자에게는 항상 같은 Mock 결과가 반환되어 일관성을 유지합니다. 여기에 **가중치 기반 무작위 선택** 알고리즘을 적용하여 실제 분포를 반영합니다.

```typescript
const personalColorWeights = {
  "spring_light": 0.06, "spring_true": 0.07, "spring_vivid": 0.05,
  "summer_light": 0.08, "summer_true": 0.09, "summer_muted": 0.05,
  "autumn_muted": 0.10, "autumn_true": 0.15, "autumn_deep": 0.10,
  "winter_true": 0.10, "winter_vivid": 0.08, "winter_deep": 0.07
};
```

사용자 입력(연령, 피부 고민)에 따라 가중치를 동적으로 조정할 수 있습니다. 예를 들어 색소 고민이 있는 사용자는 가을/겨울 딥 톤 확률을 1.2-1.3배 증가시키고, 20대 사용자는 라이트/비비드 톤 확률을 높입니다.

#### Mock vs 실제 AI 결과 구분

Mock 데이터는 반드시 **명시적 플래그**로 구분해야 합니다. `isMock: true`, `dataSource: 'fallback_mock'`, `confidence: 0.0` 필드를 포함하고, API 응답에 `warnings` 배열로 "이 결과는 AI 분석 결과가 아닌 통계 기반 예상 결과입니다" 메시지를 추가합니다. 신뢰도 0.0은 순수 Mock 데이터를 의미하며, 0.7-1.0은 정상 AI 분석 결과를 나타냅니다.

---

### 2.3 사용자 알림 UX

#### 알림 유형별 적합 케이스

퍼스널 컬러 서비스의 Fallback 상황에는 **Inline 표시**가 가장 적합합니다. 결과 옆에 `[임시 결과]` 배지나 하단에 "⚠️ 임시 분석 결과입니다"라는 문구를 표시합니다. **Banner 알림**은 서비스 전반의 품질 저하 시 페이지 상단에 지속 표시하고, **Toast 알림**은 3-5초 자동 소멸로 간단한 상태 알림에 사용합니다. **Modal**은 완전 분석 실패 시 사용자 결정이 필요할 때만 제한적으로 사용해야 합니다.

#### 한국 AI 기본법 투명성 요구사항 (2026년 1월 22일 시행)

고영향 AI(의료/금융/채용)와 생성형 AI 사용 시 사전 고지 의무가 있으며, 위반 시 **3,000만원 이하 과태료**가 부과됩니다. 퍼스널 컬러 서비스는 고영향 AI에 해당하지 않으나, 서비스명에 "AI"를 명시하면 추가 고지 의무가 경감됩니다. **Fallback/Mock 데이터 자체에 대한 법적 고지 의무는 없으나**, 신뢰 구축을 위해 "임시 결과"임을 명확히 표시하는 것을 권장합니다.

#### Graceful Degradation 단계

Netflix의 "Fail Soft" 전략을 참고하여 단계적 품질 저하를 설계합니다. **Full** 상태에서는 AI 분석 + 개인화 추천 + 상세 설명을 제공하고, **Degraded**에서는 Fallback 결과 + 기본 정보만 표시합니다. **Minimal**에서는 캐시된 결과 또는 일반 가이드를 보여주고, **Bare-bones**에서는 "서비스 일시 불가" 메시지와 재시도 옵션만 제공합니다.

#### 재시도 UX 권장사항

재시도 버튼은 오류 메시지 직후에 **Primary CTA**로 눈에 띄게 배치합니다. 자동 재시도는 일시적 네트워크 오류에만 적용하고, 분석 실패 후에는 수동 "다시 분석하기" 버튼을 제공합니다. 재시도 중에는 로딩 스피너와 함께 "다시 분석 중... (약 10초 소요)" 형태로 예상 시간을 표시하고, 최대 재시도 횟수는 3회로 제한합니다.

---

### 2.4 모니터링 및 임계값

#### Fallback 비율 임계값

| 비율 | 상태 | 권장 대응 |
|------|------|-----------|
| **< 1%** | 정상 | 모니터링 유지 |
| **1-5%** | 경고 | 원인 조사, 대시보드 확인 |
| **5-10%** | 주의 | 팀 Slack 알림, 원인 분석 착수 |
| **10-20%** | 심각 | 즉시 대응, 스케일 조정 검토 |
| **> 20%** | 위기 | PagerDuty 에스컬레이션, 긴급 대응 |

#### Prometheus Metrics 설계

opossum-prometheus 모듈을 사용하면 `circuit_breaker_counter{event}` 메트릭이 자동 생성됩니다. 이벤트 종류는 fire, success, failure, fallback, timeout, reject입니다. Grafana 대시보드에서 **Fallback 비율**은 `sum(rate(circuit_breaker_counter{event="fallback"}[5m])) / sum(rate(circuit_breaker_counter{event="fire"}[5m])) * 100` 쿼리로 시각화합니다.

#### SLO 설정

AI 서비스에는 **99.5% 가용성**(월 3.6시간 다운타임 허용)이 적합합니다. Error Budget 개념을 적용하여 월간 예산을 계산하고, 예산 잔여량 20% 미만 시 경고, 0% 미만 시 즉시 에스컬레이션합니다. SLO 계산 시 **Fallback을 성공으로 포함한 Effective SLO**(사용자 경험)와 **Fallback 제외한 Primary SLO**(시스템 건강도) 두 가지를 모두 추적해야 합니다.

---

### 2.5 Circuit Breaker 패턴

#### 3단계 상태 전환

**Closed**(정상)에서는 모든 요청이 통과하며 실패율을 모니터링합니다. 실패율이 임계값(30%)을 초과하면 **Open**(차단)으로 전환되어 원격 서비스 호출 없이 즉시 Fallback을 반환합니다. `resetTimeout`(60초) 후 **Half-Open**(테스트)으로 전환되어 제한된 요청만 허용하고, 성공 시 Closed로, 실패 시 다시 Open으로 전환됩니다.

#### Node.js 라이브러리 비교

| 특성 | opossum | cockatiel |
|------|---------|-----------|
| npm 주간 다운로드 | ~170,000 | ~268,000 |
| TypeScript 지원 | @types/opossum 별도 설치 | 네이티브 |
| Prometheus 지원 | opossum-prometheus 모듈 | 직접 구현 필요 |
| Retry 통합 | 별도 구현 | 내장 wrap() 함수 |
| 유지보수 | NodeShift (Red Hat) | 개인 개발자 |

**cockatiel**은 TypeScript 프로젝트와 복잡한 정책 조합에 적합하고, **opossum**은 Prometheus 모니터링이 필수인 경우와 엔터프라이즈 지원이 필요할 때 권장합니다.

#### AI 서비스용 권장 임계값

| 파라미터 | 권장값 | 근거 |
|----------|--------|------|
| timeout | **60초** | AI API 응답 대기 특성 |
| errorThresholdPercentage | **30%** | AI 서비스 지연/실패 빈도 고려 |
| resetTimeout | **60초** | 1분 후 Half-Open |
| volumeThreshold | **3개** | 최소 요청 수 후 판단 |
| maxRetries | **3회** | Retry 포함 |
| initialRetryDelay | **1초** | Exponential Backoff 시작 |

---

## 3. 구현 시 필수 사항

- [ ] Circuit Breaker 라이브러리 설치 (opossum 또는 cockatiel)
- [ ] Exponential Backoff with Full Jitter 재시도 로직 구현
- [ ] Redis/Upstash 캐시 설정 (퍼스널 컬러 결과 TTL 7일)
- [ ] Mock 데이터 가중치 테이블 구현 (한국인 퍼스널 컬러 분포 반영)
- [ ] API 응답에 `isMock`, `dataSource`, `confidence` 필드 추가
- [ ] Fallback 시 Inline 표시 + "다시 분석하기" 버튼 UI 구현
- [ ] Prometheus 메트릭 엔드포인트 설정 (`/metrics`)
- [ ] Grafana 대시보드 구성 (Fallback 비율, Circuit 상태, 응답 시간)
- [ ] Slack/PagerDuty 알림 규칙 설정 (Fallback 5%/10% 임계값)
- [ ] AI 기본법 투명성 고지 문구 추가 (서비스명 또는 이용약관)
- [ ] SLO 99.5% 목표 설정 및 Error Budget 모니터링

---

## 4. 코드 예시

```typescript
// lib/ai-resilience.ts - Next.js 16 + React 19 환경
import CircuitBreaker from 'opossum';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Mock 데이터 가중치 (한국인 퍼스널 컬러 분포 기반)
const PERSONAL_COLOR_WEIGHTS = {
  spring_light: 0.06, spring_true: 0.07, spring_vivid: 0.05,
  summer_light: 0.08, summer_true: 0.09, summer_muted: 0.05,
  autumn_muted: 0.10, autumn_true: 0.15, autumn_deep: 0.10,
  winter_true: 0.10, winter_vivid: 0.08, winter_deep: 0.07
};

// Mulberry32 PRNG (결정론적 난수 생성)
function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// 가중치 기반 Mock 데이터 생성
function generateMockPersonalColor(userId: string) {
  const seed = hashUserId(userId);
  const random = mulberry32(seed);
  
  const entries = Object.entries(PERSONAL_COLOR_WEIGHTS);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let threshold = random() * totalWeight;
  
  for (const [type, weight] of entries) {
    threshold -= weight;
    if (threshold <= 0) {
      return {
        seasonType: type,
        confidence: 0.0,
        isMock: true,
        dataSource: 'fallback_mock' as const,
        message: 'AI 분석 서비스가 일시적으로 불가하여 통계 기반 예상 결과를 제공합니다.',
        seedUsed: seed
      };
    }
  }
  return { seasonType: 'autumn_true', confidence: 0.0, isMock: true, dataSource: 'fallback_mock' as const };
}

// Exponential Backoff with Full Jitter
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;
      
      // Full Jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * exponentialDelay;
      await new Promise(resolve => setTimeout(resolve, jitter));
    }
  }
  throw lastError!;
}

// Gemini AI 호출
async function callGeminiAI(imageBase64: string, userId: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: '이 얼굴 사진을 분석하여 퍼스널 컬러 타입을 JSON으로 반환해주세요.' },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }]
      })
    }
  );
  
  if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
  return response.json();
}

// Circuit Breaker 설정
const aiCircuitBreaker = new CircuitBreaker(
  (imageBase64: string, userId: string) => 
    retryWithBackoff(() => callGeminiAI(imageBase64, userId), 3, 1000, 10000),
  {
    name: 'gemini-personal-color',
    timeout: 60000,                  // 60초
    errorThresholdPercentage: 30,    // 30% 실패 시 Open
    resetTimeout: 60000,             // 1분 후 Half-Open
    volumeThreshold: 3               // 최소 3개 요청 후 판단
  }
);

// Fallback 설정
aiCircuitBreaker.fallback(async (imageBase64: string, userId: string) => {
  // 1차: 캐시된 결과 확인
  const cached = await redis.get(`analysis:${userId}:latest`);
  if (cached) {
    return { ...cached, dataSource: 'cached', isStale: true };
  }
  
  // 2차: Mock 데이터 생성
  return generateMockPersonalColor(userId);
});

// 이벤트 모니터링
aiCircuitBreaker.on('open', () => console.error('[Circuit] OPEN - Fallback 활성화'));
aiCircuitBreaker.on('halfOpen', () => console.info('[Circuit] HALF-OPEN - 복구 테스트'));
aiCircuitBreaker.on('close', () => console.info('[Circuit] CLOSED - 정상 복구'));
aiCircuitBreaker.on('fallback', (result) => console.warn('[Fallback] 사용:', result.dataSource));

// API Route Handler (Next.js App Router)
export async function analyzePersonalColor(imageBase64: string, userId: string) {
  const cacheKey = `analysis:${userId}:${hashUserId(imageBase64).toString(16)}`;
  
  // 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return { success: true, data: cached, source: 'cache' };
  }
  
  // Circuit Breaker를 통한 AI 호출
  const result = await aiCircuitBreaker.fire(imageBase64, userId);
  
  // 성공 시 캐시 저장 (7일 TTL)
  if (!result.isMock && !result.isStale) {
    await redis.set(cacheKey, result, { ex: 86400 * 7 });
    await redis.set(`analysis:${userId}:latest`, result, { ex: 86400 * 30 });
  }
  
  return {
    success: true,
    data: result,
    source: result.isMock ? 'mock' : result.isStale ? 'stale_cache' : 'primary',
    warnings: result.isMock ? [{
      code: 'MOCK_DATA',
      message: '이 결과는 AI 분석 결과가 아닌 통계 기반 예상 결과입니다.'
    }] : undefined
  };
}
```

---

## 5. 참고 자료

- AWS Builders' Library: Timeouts, retries and backoff with jitter
- Martin Fowler: Circuit Breaker Pattern
- opossum GitHub (NodeShift/Red Hat)
- cockatiel npm package
- 한국 AI 기본법 시행령 (2026.01.22 시행)
- Carbon Design System: Notification Patterns
- Netflix Engineering: Graceful Degradation
- 잼페이스 퍼스널컬러 통계 (2022, 139만회 테스트)
- PubMed: Skin phototyping in Chinese female population
- Google SRE Workbook: Error Budget Policy