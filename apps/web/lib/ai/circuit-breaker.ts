/**
 * AI 서킷 브레이커
 *
 * 연속 실패 시 자동으로 프로바이더를 차단하여
 * 불필요한 요청과 지연을 방지
 *
 * @module lib/ai/circuit-breaker
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 */

import type {
  AIProviderName,
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
} from './types';

/**
 * 기본 서킷 브레이커 설정
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30초
  successThreshold: 2,
};

/**
 * 프로바이더별 서킷 브레이커 인스턴스 저장소
 */
const circuitBreakers = new Map<AIProviderName, AICircuitBreaker>();

/**
 * AI 서킷 브레이커 클래스
 *
 * 상태 흐름:
 * - CLOSED: 정상 동작, 실패 누적 중
 * - OPEN: 차단 상태, 요청 즉시 거부
 * - HALF-OPEN: 테스트 상태, 일부 요청 허용하여 복구 확인
 */
export class AICircuitBreaker {
  private readonly providerName: AIProviderName;
  private readonly config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;

  constructor(providerName: AIProviderName, config?: Partial<CircuitBreakerConfig>) {
    this.providerName = providerName;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      lastSuccess: null,
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
    };
  }

  /**
   * 현재 서킷 상태 조회
   */
  getState(): CircuitState {
    return this.metrics.state;
  }

  /**
   * 전체 메트릭스 조회
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * 요청 실행 가능 여부 확인
   */
  canExecute(): boolean {
    this.updateStateIfNeeded();
    return this.metrics.state !== 'open';
  }

  /**
   * 서킷 브레이커를 통한 함수 실행
   *
   * @param fn 실행할 비동기 함수
   * @returns 함수 실행 결과
   * @throws 서킷이 open 상태이거나 함수 실행 실패 시
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateStateIfNeeded();

    if (this.metrics.state === 'open') {
      throw new CircuitOpenError(this.providerName, this.metrics.lastFailure);
    }

    this.metrics.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * 성공 처리
   */
  private onSuccess(): void {
    this.metrics.lastSuccess = new Date();
    this.metrics.totalSuccesses++;
    this.metrics.failures = 0;

    if (this.metrics.state === 'half-open') {
      // half-open에서 성공하면 closed로 복귀
      this.metrics.state = 'closed';
      console.log(`[CircuitBreaker] ${this.providerName}: half-open -> closed`);
    }
  }

  /**
   * 실패 처리
   */
  private onFailure(): void {
    this.metrics.lastFailure = new Date();
    this.metrics.totalFailures++;
    this.metrics.failures++;

    if (this.metrics.failures >= this.config.failureThreshold) {
      this.metrics.state = 'open';
      console.warn(
        `[CircuitBreaker] ${this.providerName}: OPEN (${this.metrics.failures} failures)`
      );
    }
  }

  /**
   * 상태 업데이트 (시간 기반)
   */
  private updateStateIfNeeded(): void {
    if (this.metrics.state !== 'open') return;

    const now = Date.now();
    const lastFailureTime = this.metrics.lastFailure?.getTime() ?? 0;
    const elapsed = now - lastFailureTime;

    if (elapsed >= this.config.resetTimeoutMs) {
      this.metrics.state = 'half-open';
      console.log(`[CircuitBreaker] ${this.providerName}: open -> half-open (${elapsed}ms elapsed)`);
    }
  }

  /**
   * 서킷 브레이커 수동 리셋
   */
  reset(): void {
    this.metrics = {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      lastSuccess: null,
      totalRequests: this.metrics.totalRequests,
      totalSuccesses: this.metrics.totalSuccesses,
      totalFailures: this.metrics.totalFailures,
    };
    console.log(`[CircuitBreaker] ${this.providerName}: manually reset to closed`);
  }
}

/**
 * 서킷 오픈 에러
 */
export class CircuitOpenError extends Error {
  readonly providerName: AIProviderName;
  readonly lastFailure: Date | null;

  constructor(providerName: AIProviderName, lastFailure: Date | null) {
    super(`Circuit breaker is OPEN for ${providerName}`);
    this.name = 'CircuitOpenError';
    this.providerName = providerName;
    this.lastFailure = lastFailure;
  }
}

// =============================================================================
// 팩토리 함수
// =============================================================================

/**
 * 프로바이더별 서킷 브레이커 인스턴스 가져오기
 *
 * @param providerName 프로바이더 이름
 * @param config 선택적 설정 오버라이드
 * @returns 서킷 브레이커 인스턴스
 */
export function getCircuitBreaker(
  providerName: AIProviderName,
  config?: Partial<CircuitBreakerConfig>
): AICircuitBreaker {
  let breaker = circuitBreakers.get(providerName);

  if (!breaker) {
    breaker = new AICircuitBreaker(providerName, config);
    circuitBreakers.set(providerName, breaker);
  }

  return breaker;
}

/**
 * 모든 서킷 브레이커 상태 조회
 */
export function getAllCircuitStates(): Record<AIProviderName, CircuitState> {
  const states: Record<AIProviderName, CircuitState> = {
    gemini: 'closed',
    claude: 'closed',
    mock: 'closed',
  };

  for (const [name, breaker] of circuitBreakers) {
    states[name] = breaker.getState();
  }

  return states;
}

/**
 * 모든 서킷 브레이커 리셋
 */
export function resetAllCircuitBreakers(): void {
  for (const [name, breaker] of circuitBreakers) {
    breaker.reset();
    console.log(`[CircuitBreaker] Reset: ${name}`);
  }
}

/**
 * 특정 프로바이더 서킷 브레이커 리셋
 */
export function resetCircuitBreaker(providerName: AIProviderName): void {
  const breaker = circuitBreakers.get(providerName);
  if (breaker) {
    breaker.reset();
  }
}
