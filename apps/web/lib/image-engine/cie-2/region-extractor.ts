/**
 * CIE-2: 얼굴 영역 추출 모듈
 *
 * @module lib/image-engine/cie-2/region-extractor
 * @description 얼굴 바운딩 박스 기반 영역 추출
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 */

import type {
  RGBImageData,
  BoundingBox,
  FaceLandmarks,
  FaceRegion,
  DetectedFace,
} from '../types';

/**
 * 바운딩 박스를 정수 좌표로 변환
 *
 * @param box - 원본 바운딩 박스
 * @param imageWidth - 이미지 너비
 * @param imageHeight - 이미지 높이
 * @returns 정수 좌표 바운딩 박스
 */
export function normalizeBoundingBox(
  box: BoundingBox,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const width = Math.min(imageWidth - x, Math.ceil(box.width));
  const height = Math.min(imageHeight - y, Math.ceil(box.height));

  return { x, y, width, height };
}

/**
 * 이미지에서 영역 추출
 *
 * @param imageData - 원본 RGB 이미지
 * @param box - 추출할 바운딩 박스
 * @returns 추출된 RGB 이미지
 */
export function extractRegionFromImage(
  imageData: RGBImageData,
  box: BoundingBox
): RGBImageData {
  const { data, width, height, channels } = imageData;
  const normalizedBox = normalizeBoundingBox(box, width, height);
  const { x, y, width: regionWidth, height: regionHeight } = normalizedBox;

  const regionData = new Uint8Array(regionWidth * regionHeight * channels);

  for (let row = 0; row < regionHeight; row++) {
    for (let col = 0; col < regionWidth; col++) {
      const srcIdx = ((y + row) * width + (x + col)) * channels;
      const dstIdx = (row * regionWidth + col) * channels;

      for (let c = 0; c < channels; c++) {
        regionData[dstIdx + c] = data[srcIdx + c];
      }
    }
  }

  return {
    data: regionData,
    width: regionWidth,
    height: regionHeight,
    channels,
  };
}

/**
 * 패딩이 적용된 얼굴 영역 추출
 *
 * @param imageData - 원본 RGB 이미지
 * @param box - 얼굴 바운딩 박스
 * @param paddingRatio - 패딩 비율 (0-1)
 * @returns 패딩이 적용된 바운딩 박스
 */
export function getPaddedBoundingBox(
  box: BoundingBox,
  imageWidth: number,
  imageHeight: number,
  paddingRatio = 0.2
): BoundingBox {
  const paddingX = box.width * paddingRatio;
  const paddingY = box.height * paddingRatio;

  const x = Math.max(0, box.x - paddingX);
  const y = Math.max(0, box.y - paddingY);
  const width = Math.min(imageWidth - x, box.width + paddingX * 2);
  const height = Math.min(imageHeight - y, box.height + paddingY * 2);

  return { x, y, width, height };
}

/**
 * DetectedFace에서 FaceRegion 생성
 *
 * @param imageData - 원본 RGB 이미지
 * @param face - 감지된 얼굴
 * @param paddingRatio - 패딩 비율
 * @returns FaceRegion
 */
export function extractFaceRegion(
  imageData: RGBImageData,
  face: DetectedFace,
  paddingRatio = 0.2
): FaceRegion {
  const paddedBox = getPaddedBoundingBox(
    face.boundingBox,
    imageData.width,
    imageData.height,
    paddingRatio
  );

  const regionImageData = extractRegionFromImage(imageData, paddedBox);

  // 랜드마크 좌표 조정 (영역 좌표계로)
  const adjustedLandmarks: FaceLandmarks = {
    points: face.landmarks.points.map((p) => ({
      x: p.x - paddedBox.x,
      y: p.y - paddedBox.y,
      z: p.z,
    })),
    confidence: face.landmarks.confidence,
  };

  return {
    imageData: regionImageData,
    boundingBox: paddedBox,
    landmarks: adjustedLandmarks,
  };
}

/**
 * 정사각형 얼굴 영역 추출 (AI 모델 입력용)
 *
 * @param imageData - 원본 RGB 이미지
 * @param face - 감지된 얼굴
 * @param targetSize - 목표 크기 (정사각형)
 * @returns 정사각형 FaceRegion
 */
export function extractSquareFaceRegion(
  imageData: RGBImageData,
  face: DetectedFace,
  _targetSize = 256
): FaceRegion {
  const { boundingBox } = face;

  // 정사각형으로 확장
  const maxDim = Math.max(boundingBox.width, boundingBox.height);
  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;

  const squareBox: BoundingBox = {
    x: centerX - maxDim / 2,
    y: centerY - maxDim / 2,
    width: maxDim,
    height: maxDim,
  };

  // 패딩 추가 (20%)
  const paddedBox = getPaddedBoundingBox(
    squareBox,
    imageData.width,
    imageData.height,
    0.2
  );

  const regionImageData = extractRegionFromImage(imageData, paddedBox);

  // 랜드마크 좌표 조정
  const adjustedLandmarks: FaceLandmarks = {
    points: face.landmarks.points.map((p) => ({
      x: p.x - paddedBox.x,
      y: p.y - paddedBox.y,
      z: p.z,
    })),
    confidence: face.landmarks.confidence,
  };

  return {
    imageData: regionImageData,
    boundingBox: paddedBox,
    landmarks: adjustedLandmarks,
  };
}
