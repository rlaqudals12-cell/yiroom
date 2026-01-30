/**
 * CIE-2: 얼굴 감지 통합 프로세서
 *
 * @module lib/image-engine/cie-2/processor
 * @description 얼굴 감지, 랜드마크 추출, 정면성 검증 통합
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 *
 * ## 아키텍처 개요
 *
 * MediaPipe Face Mesh는 브라우저 환경에서만 동작하므로,
 * 이 모듈은 두 가지 모드를 지원합니다:
 *
 * 1. **실제 처리 (Production)**
 *    - 브라우저에서 MediaPipe Face Mesh 초기화
 *    - 결과를 `processMediaPipeResults()`에 전달
 *
 * 2. **Mock 처리 (Development/Test)**
 *    - Node.js 환경(테스트, SSR)에서 MediaPipe 사용 불가
 *    - `processMock()` 또는 `generateMockMediaPipeResult()` 사용
 *    - Mock은 정면 얼굴 기준 468개 랜드마크 생성
 *
 * ## Mock 데이터 한계
 *
 * - 실제 얼굴 특징 반영 안 됨 (단순 원형 분포)
 * - 각도/정면성 계산은 실제와 다를 수 있음
 * - 파이프라인 테스트 및 개발 용도로만 사용
 *
 * ## 사용 예시
 *
 * ```typescript
 * // 브라우저 환경 (실제)
 * if (isMediaPipeAvailable()) {
 *   const mpResults = await faceMesh.detectFaces(image);
 *   const output = processMediaPipeResults(imageData, mpResults);
 * }
 *
 * // 테스트 환경 (Mock)
 * const output = processMock(imageData);
 * ```
 */

import type {
  RGBImageData,
  CIE2Output,
  DetectedFace,
  FrontalityResult,
} from '../types';
import { DEFAULT_CIE_CONFIG, FEEDBACK_MESSAGES } from '../constants';
import {
  MediaPipeFaceResult,
  convertToDetectedFace,
  selectBestFace,
  validateFaceAngle,
} from './face-detector';
import { extractFaceRegion } from './region-extractor';
import { generateCIE2Fallback } from './fallback';
import { eulerToDegrees } from '../utils';

/**
 * 정면성 검증 결과 생성
 *
 * @param face - 감지된 얼굴
 * @returns FrontalityResult
 */
function createFrontalityResult(face: DetectedFace): FrontalityResult {
  const anglesDeg = eulerToDegrees(face.angle);
  const { isValid, feedback } = validateFaceAngle(face.angle);

  return {
    score: face.frontalityScore,
    isValid,
    angleDeviations: {
      pitch: Math.abs(anglesDeg.pitch),
      yaw: Math.abs(anglesDeg.yaw),
      roll: Math.abs(anglesDeg.roll),
    },
    feedback,
  };
}

/**
 * MediaPipe 결과로 CIE-2 처리
 * (실제 MediaPipe 호출은 브라우저 환경에서 별도 처리)
 *
 * @param imageData - RGB 이미지 데이터
 * @param mpResults - MediaPipe Face Mesh 결과 배열
 * @param config - CIE-2 설정
 * @returns CIE-2 출력
 */
export function processMediaPipeResults(
  imageData: RGBImageData,
  mpResults: MediaPipeFaceResult[],
  partialConfig: Partial<typeof DEFAULT_CIE_CONFIG.cie2> = {}
): CIE2Output {
  const config = { ...DEFAULT_CIE_CONFIG.cie2, ...partialConfig };
  const startTime = performance.now();

  try {
    // 1. 얼굴 미감지
    if (mpResults.length === 0) {
      return {
        success: true,
        faceDetected: false,
        faceCount: 0,
        validation: {
          isAngleValid: false,
          angleFeedback: FEEDBACK_MESSAGES.face.notDetected,
          frontalityResult: {
            score: 0,
            isValid: false,
            angleDeviations: { pitch: 0, yaw: 0, roll: 0 },
            feedback: FEEDBACK_MESSAGES.face.notDetected,
          },
        },
        metadata: {
          processingTime: performance.now() - startTime,
          modelVersion: 'mediapipe-face-mesh-468',
          confidence: 0,
        },
      };
    }

    // 2. MediaPipe 결과를 DetectedFace로 변환
    const faces: DetectedFace[] = mpResults
      .map((result) =>
        convertToDetectedFace(
          result,
          imageData.width,
          imageData.height,
          0.9 // 기본 신뢰도
        )
      )
      .filter((face) => face.confidence >= config.minConfidence);

    // 3. 최적의 얼굴 선택
    const selectedFace = selectBestFace(faces, imageData.width, imageData.height);

    if (!selectedFace) {
      return {
        success: true,
        faceDetected: false,
        faceCount: mpResults.length,
        validation: {
          isAngleValid: false,
          angleFeedback: FEEDBACK_MESSAGES.face.lowConfidence,
          frontalityResult: {
            score: 0,
            isValid: false,
            angleDeviations: { pitch: 0, yaw: 0, roll: 0 },
            feedback: FEEDBACK_MESSAGES.face.lowConfidence,
          },
        },
        metadata: {
          processingTime: performance.now() - startTime,
          modelVersion: 'mediapipe-face-mesh-468',
          confidence: 0,
        },
      };
    }

    // 4. 정면성 검증
    const frontalityResult = createFrontalityResult(selectedFace);
    const { isValid, feedback } = validateFaceAngle(selectedFace.angle);

    // 5. 얼굴 영역 추출
    const faceRegion = extractFaceRegion(imageData, selectedFace);

    // 6. 다중 얼굴 경고
    let angleFeedback = feedback;
    if (mpResults.length > 1) {
      angleFeedback = `${FEEDBACK_MESSAGES.face.multipleFaces} ${angleFeedback}`;
    }

    return {
      success: true,
      faceDetected: true,
      faceCount: mpResults.length,
      selectedFace,
      faceRegion,
      validation: {
        isAngleValid: isValid && frontalityResult.score >= config.minFrontalityScore,
        angleFeedback,
        frontalityResult,
      },
      metadata: {
        processingTime: performance.now() - startTime,
        modelVersion: 'mediapipe-face-mesh-468',
        confidence: selectedFace.confidence,
      },
    };
  } catch (error) {
    console.error('[CIE-2] Processing error:', error);
    return generateCIE2Fallback(performance.now() - startTime);
  }
}

/**
 * 브라우저 환경에서 MediaPipe 초기화 여부 확인
 */
export function isMediaPipeAvailable(): boolean {
  // 브라우저 환경 체크
  if (typeof window === 'undefined') return false;

  // MediaPipe 전역 객체 체크 (런타임에 로드됨)
  return typeof (window as unknown as { FaceMesh?: unknown }).FaceMesh !== 'undefined';
}

/**
 * CIE-2 처리를 위한 Mock MediaPipe 결과 생성
 *
 * ## 용도
 * - **테스트 환경**: Node.js에서 MediaPipe 사용 불가 시
 * - **개발 환경**: 파이프라인 통합 테스트
 * - **SSR 폴백**: 서버 사이드에서 CIE-2 호출 시
 *
 * ## Mock 데이터 특성
 * - 468개 랜드마크 (MediaPipe Face Mesh 표준)
 * - 정면 얼굴 기준 (yaw=0, pitch=0, roll=0)
 * - 이미지 중앙에 40% x 50% 크기의 얼굴
 * - 단순 원형 분포 (실제 얼굴 구조와 다름)
 *
 * ## 한계
 * - 실제 얼굴 특징점 위치와 다름
 * - 각도 계산 결과가 실제와 다를 수 있음
 * - 정면성 점수는 참고용으로만 사용
 *
 * ## 관련 ADR
 * @see docs/adr/ADR-007-mock-fallback.md
 *
 * @param imageWidth - 이미지 너비 (픽셀, 미사용)
 * @param imageHeight - 이미지 높이 (픽셀, 미사용)
 * @returns Mock MediaPipe 결과 (정규화된 좌표 0-1)
 *
 * @example
 * ```typescript
 * // 테스트에서 사용
 * const mockResult = generateMockMediaPipeResult(640, 480);
 * const output = processMediaPipeResults(imageData, [mockResult]);
 * expect(output.faceDetected).toBe(true);
 * ```
 */
export function generateMockMediaPipeResult(
  _imageWidth: number,
  _imageHeight: number
): MediaPipeFaceResult {
  // 468개 랜드마크 생성 (정면 얼굴 기준, MediaPipe Face Mesh 호환)
  const landmarks: Array<{ x: number; y: number; z: number }> = [];

  // 중앙 기준 랜드마크 (정규화된 좌표, 0-1)
  const centerX = 0.5;
  const centerY = 0.5;
  const faceWidth = 0.4; // 얼굴 너비 (이미지의 40%)
  const faceHeight = 0.5; // 얼굴 높이 (이미지의 50%)

  for (let i = 0; i < 468; i++) {
    // 간단한 원형 분포로 랜드마크 생성
    const angle = (i / 468) * 2 * Math.PI;
    const radius = 0.1 + (i % 50) / 500; // 변형된 반경

    landmarks.push({
      x: centerX + Math.cos(angle) * radius * faceWidth,
      y: centerY + Math.sin(angle) * radius * faceHeight,
      z: Math.sin(angle * 2) * 0.01, // 작은 깊이 변화
    });
  }

  return {
    landmarks,
    boundingBox: {
      xMin: centerX - faceWidth / 2,
      yMin: centerY - faceHeight / 2,
      width: faceWidth,
      height: faceHeight,
    },
  };
}

/**
 * Mock 데이터로 CIE-2 처리 (개발/테스트용)
 *
 * ## 용도
 * - **단위 테스트**: CIE-2 출력을 소비하는 코드 테스트
 * - **통합 테스트**: 전체 파이프라인 흐름 검증
 * - **개발 환경**: MediaPipe 없이 UI/UX 개발
 *
 * ## 동작
 * 1. `generateMockMediaPipeResult()`로 Mock MediaPipe 결과 생성
 * 2. `processMediaPipeResults()`로 실제 처리 로직 실행
 * 3. 정상적인 CIE2Output 반환 (faceDetected: true)
 *
 * ## 한계
 * - 반환되는 얼굴 각도/정면성 점수는 실제와 다름
 * - 항상 얼굴 1개 감지, 정면 기준 결과 반환
 * - 실제 이미지 품질이나 내용과 무관한 결과
 *
 * ## 관련 문서
 * @see {@link generateMockMediaPipeResult} Mock 데이터 생성 상세
 * @see docs/adr/ADR-007-mock-fallback.md Mock Fallback 전략
 *
 * @param imageData - RGB 이미지 데이터 (Mock에서는 width/height만 사용)
 * @returns CIE-2 출력 (항상 faceDetected: true, 정면 기준)
 *
 * @example
 * ```typescript
 * // 테스트에서 CIE-2 결과 소비 코드 검증
 * const imageData = createTestRGBImageData(640, 480);
 * const output = processMock(imageData);
 *
 * expect(output.success).toBe(true);
 * expect(output.faceDetected).toBe(true);
 * expect(output.selectedFace).toBeDefined();
 * ```
 */
export function processMock(imageData: RGBImageData): CIE2Output {
  const mockResult = generateMockMediaPipeResult(imageData.width, imageData.height);
  return processMediaPipeResults(imageData, [mockResult]);
}
