/**
 * Mock Factory — 분석 모듈 Mock 생성기 중앙 레지스트리
 *
 * API 핸들러의 AI 폴백에서 사용. 개별 mock 파일을 직접 import하는 대신
 * factory를 통해 통합 접근할 수 있다.
 *
 * @example
 * import { getMock, hasMock } from '@/lib/mock';
 * const result = getMock<SkinResult>('skin-v2');
 *
 * @see ADR-007 Mock Fallback 전략
 */

type MockGenerator<T = any> = (...args: any[]) => T;

const registry = new Map<string, MockGenerator>();

/**
 * Mock 생성기 등록
 * @param type 분석 모듈 식별자 (e.g., 'skin', 'personal-color', 'body')
 * @param generator Mock 데이터 생성 함수
 */
export function registerMock<T>(type: string, generator: MockGenerator<T>): void {
  if (registry.has(type)) {
    console.warn(`[MockFactory] '${type}' 이미 등록됨, 덮어쓰기`);
  }
  registry.set(type, generator);
}

/**
 * 등록된 Mock 생성기로 데이터 생성
 * @param type 분석 모듈 식별자
 * @param args 생성기에 전달할 인자
 * @returns 생성된 Mock 데이터
 * @throws 미등록 타입인 경우
 */
export function getMock<T>(type: string, ...args: unknown[]): T {
  const generator = registry.get(type);
  if (!generator) {
    throw new Error(`[MockFactory] '${type}' Mock 생성기가 등록되지 않았습니다.`);
  }
  return generator(...args) as T;
}

/**
 * Mock 생성기 등록 여부 확인
 */
export function hasMock(type: string): boolean {
  return registry.has(type);
}

/**
 * 등록된 모든 Mock 타입 목록
 */
export function getRegisteredTypes(): string[] {
  return Array.from(registry.keys());
}

/**
 * 레지스트리 초기화 (테스트 용도)
 * @internal
 */
export function clearRegistry(): void {
  registry.clear();
}
