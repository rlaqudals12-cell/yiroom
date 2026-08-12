/**
 * 결정론적 시드 기반 난수 유틸리티
 *
 * 왜: 폴백 Mock이 `Math.random()`을 쓰면 같은 사진을 재분석할 때마다
 * 얼굴형·체형 같은 정체성 값이 바뀌어 "재현성"(이룸의 핵심 계약)이 깨진다.
 * 시드(사용자 ID·이미지 식별자 등)로부터 결정론적 시퀀스를 만들어
 * "같은 입력 → 같은 출력"을 보장한다. 시드가 없으면 고정 기본 시드로
 * 항상 동일한 결과를 낸다(무작위 아님).
 *
 * @module lib/utils/seeded-random
 */

/** 시드가 지정되지 않았을 때 사용하는 고정 기본 시드 */
export const DEFAULT_SEED = 'yiroom-mock';

/**
 * 문자열을 32비트 부호없는 정수 시드로 해시 (FNV-1a)
 *
 * @param input - 해시할 문자열
 * @returns 0 이상 2^32 미만의 정수
 */
export function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime(16777619) 곱을 32비트로 유지
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * mulberry32 결정론적 PRNG 생성
 *
 * 같은 시드는 항상 같은 [0, 1) 난수 시퀀스를 반환한다.
 *
 * @param seed - 문자열 또는 숫자 시드
 * @returns 호출할 때마다 0 이상 1 미만 값을 반환하는 함수
 */
export function createSeededRandom(seed: string | number): () => number {
  let state = typeof seed === 'number' ? seed >>> 0 : hashStringToSeed(seed);
  // 상태 0은 mulberry32에서 저품질 시퀀스를 만들 수 있어 보정
  if (state === 0) state = 0x9e3779b9;

  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
