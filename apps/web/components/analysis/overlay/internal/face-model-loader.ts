/**
 * P1-0: face-api.js 모델 로딩 싱글턴
 *
 * @description 3모듈(피부/메이크업/헤어)이 공유하는 face-api.js 모델 로딩 유틸
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md P1-0
 *
 * 싱글턴 패턴으로 한 번만 로드, 이후 캐시된 Promise 반환
 * CDN: @vladmandic/face-api/model (jsdelivr)
 */

import type * as faceapi from 'face-api.js';

// CDN URL for face-api.js models
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// 싱글턴 상태
let loadPromise: Promise<void> | null = null;
let isLoaded = false;

/**
 * face-api.js 모델 로드 (싱글턴)
 *
 * TinyFaceDetector + FaceLandmark68Net 로드
 * 여러 컴포넌트에서 호출해도 한 번만 로드됨
 *
 * @returns 로드 완료 Promise
 * @throws CDN 접근 불가 시 에러 (호출자에서 폴백 처리)
 */
export async function loadFaceModels(): Promise<void> {
  if (isLoaded) return;

  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // face-api.js는 dynamic import (클라이언트에서만 사용)
      const faceapiModule = await import('face-api.js');

      await Promise.all([
        faceapiModule.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapiModule.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      ]);

      isLoaded = true;
    } catch (error) {
      // 실패 시 다음 호출에서 재시도할 수 있도록 리셋
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * 모델 로드 상태 확인
 */
export function isFaceModelsLoaded(): boolean {
  return isLoaded;
}

/**
 * 얼굴 감지 + 랜드마크 추출
 *
 * @param imageUrl 분석할 이미지 URL
 * @returns 68-point 랜드마크 배열 또는 null (감지 실패)
 */
export async function detectFaceLandmarks(imageUrl: string): Promise<faceapi.Point[] | null> {
  // 모델이 로드되지 않았으면 먼저 로드
  await loadFaceModels();

  const faceapiModule = await import('face-api.js');

  try {
    const img = await faceapiModule.fetchImage(imageUrl);
    const detection = await faceapiModule
      .detectSingleFace(img, new faceapiModule.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detection) {
      return detection.landmarks.positions;
    }
    return null;
  } catch (error) {
    console.error('[face-model-loader] Face detection failed:', error);
    return null;
  }
}

/**
 * 테스트용: 싱글턴 상태 리셋
 * @internal
 */
export function _resetForTesting(): void {
  loadPromise = null;
  isLoaded = false;
}
