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

/** 이미지 지문에 사용할 조각 길이(문자) — 앞·중간·뒤 각각 */
const FINGERPRINT_SLICE = 256;

/**
 * 이미지(base64)의 안정적 지문 문자열
 *
 * 왜 전체를 해싱하지 않나: base64 이미지는 수 MB라 문자 단위 순회 비용이 크다.
 * 길이 + 앞·중간·뒤 조각만 해싱해도 "같은 파일 → 항상 같은 지문"은 그대로 성립하고,
 * 서로 다른 사진이 길이와 세 조각까지 모두 같을 확률은 무시할 수준이다.
 *
 * @param imageBase64 - data URL 또는 base64 문자열 (없으면 'no-image')
 * @returns 같은 이미지면 항상 동일한 짧은 문자열
 */
export function hashImageFingerprint(imageBase64?: string | null): string {
  if (!imageBase64) return 'no-image';

  const len = imageBase64.length;
  const half = FINGERPRINT_SLICE / 2;
  const midStart = Math.max(0, Math.floor(len / 2) - half);
  const head = imageBase64.slice(0, FINGERPRINT_SLICE);
  const mid = imageBase64.slice(midStart, midStart + FINGERPRINT_SLICE);
  const tail = imageBase64.slice(Math.max(0, len - FINGERPRINT_SLICE));
  const sample = `${head}|${mid}|${tail}`;

  return `${len}-${hashStringToSeed(sample).toString(36)}`;
}

/**
 * 폴백 Mock 시드 조립 — "같은 사용자 + 같은 축 + 같은 사진 = 같은 폴백 결과"
 *
 * 왜 이 재료인가: 재분석해도 값이 그대로여야 재현성 계약이 지켜진다.
 * 세션 ID·타임스탬프처럼 회차마다 바뀌는 값은 시드 재료로 쓰지 않는다
 * (같은 사진을 다시 올렸는데 얼굴형이 바뀌는 현상의 원인이 된다).
 *
 * @param userId - Clerk 사용자 ID
 * @param axis - 축 식별자 (예: 'body', 'hair', 'skin')
 * @param imageBase64 - 분석 대상 이미지 (없으면 이미지 없는 축으로 취급)
 */
export function buildFallbackSeed(
  userId: string,
  axis: string,
  imageBase64?: string | null
): string {
  return `${userId}:${axis}:${hashImageFingerprint(imageBase64)}`;
}
