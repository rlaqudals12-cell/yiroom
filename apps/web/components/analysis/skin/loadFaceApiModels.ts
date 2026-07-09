import * as faceapi from 'face-api.js';

/**
 * face-api.js 모델 로더 (CDN) — 타임아웃 포함.
 *
 * 왜 타임아웃이 필요한가: 모델은 jsDelivr CDN에서 받는데, 네트워크가 느리거나
 * CDN이 차단되면 loadFromUri Promise가 영원히 pending 상태로 남아 시각화 탭에
 * "AI 모델 로딩 중…" 스피너가 무한 지속됐다(2026-07-10 창업자 피드백).
 * Promise.race로 상한을 두어 실패로 떨어뜨리고, 호출부가 정직한 폴백을 보이게 한다.
 */

// CDN URL for face-api.js models
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

/** 모델 로딩 상한 (ms) — 초과 시 reject */
export const FACE_API_MODEL_TIMEOUT_MS = 10_000;

/**
 * tinyFaceDetector + faceLandmark68Net 로드.
 * @param timeoutMs 상한(ms). 초과 시 'FACE_API_MODEL_TIMEOUT' 에러로 reject.
 * @throws 로드 실패 또는 타임아웃 시 Error
 */
export async function loadFaceApiModels(
  timeoutMs: number = FACE_API_MODEL_TIMEOUT_MS
): Promise<void> {
  const load = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
  ]);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('FACE_API_MODEL_TIMEOUT')), timeoutMs);
  });

  try {
    await Promise.race([load, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
