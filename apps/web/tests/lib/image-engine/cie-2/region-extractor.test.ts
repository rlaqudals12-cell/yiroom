/**
 * CIE-2 얼굴 영역 추출 모듈 테스트
 *
 * @module tests/lib/image-engine/cie-2/region-extractor
 * @description 얼굴 바운딩 박스 기반 영역 추출 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeBoundingBox,
  extractRegionFromImage,
  getPaddedBoundingBox,
  extractFaceRegion,
  extractSquareFaceRegion,
} from '@/lib/image-engine/cie-2/region-extractor';
import type { RGBImageData, BoundingBox, DetectedFace } from '@/lib/image-engine/types';

// 테스트용 헬퍼 함수
function createMockRGBImageData(
  width: number,
  height: number,
  fillValue = 128
): RGBImageData {
  const channels = 3;
  const data = new Uint8Array(width * height * channels);
  data.fill(fillValue);
  return { data, width, height, channels };
}

function createMockDetectedFace(
  box: BoundingBox,
  landmarksCount = 468
): DetectedFace {
  const points = Array.from({ length: landmarksCount }, (_, i) => ({
    x: box.x + (i % Math.ceil(Math.sqrt(landmarksCount))) * (box.width / Math.sqrt(landmarksCount)),
    y: box.y + Math.floor(i / Math.ceil(Math.sqrt(landmarksCount))) * (box.height / Math.sqrt(landmarksCount)),
    z: 0,
  }));

  return {
    boundingBox: box,
    landmarks: {
      points,
      confidence: 0.95,
    },
    confidence: 0.95,
    angle: { pitch: 0, yaw: 0, roll: 0 },
    frontalityScore: 95,
  };
}

describe('lib/image-engine/cie-2/region-extractor', () => {
  // =========================================
  // normalizeBoundingBox 테스트
  // =========================================

  describe('normalizeBoundingBox', () => {
    it('좌표를 정수로 변환한다', () => {
      const box: BoundingBox = { x: 10.7, y: 20.3, width: 100.5, height: 80.9 };

      const result = normalizeBoundingBox(box, 640, 480);

      expect(Number.isInteger(result.x)).toBe(true);
      expect(Number.isInteger(result.y)).toBe(true);
      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });

    it('음수 좌표를 0으로 클램프한다', () => {
      const box: BoundingBox = { x: -10, y: -20, width: 100, height: 80 };

      const result = normalizeBoundingBox(box, 640, 480);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('이미지 경계를 벗어나지 않도록 클램프한다', () => {
      const box: BoundingBox = { x: 600, y: 450, width: 100, height: 80 };

      const result = normalizeBoundingBox(box, 640, 480);

      expect(result.x + result.width).toBeLessThanOrEqual(640);
      expect(result.y + result.height).toBeLessThanOrEqual(480);
    });

    it('정상 범위의 박스는 변경하지 않는다', () => {
      const box: BoundingBox = { x: 100, y: 100, width: 200, height: 150 };

      const result = normalizeBoundingBox(box, 640, 480);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('소수점 좌표를 floor로 내린다', () => {
      const box: BoundingBox = { x: 10.9, y: 20.9, width: 100, height: 80 };

      const result = normalizeBoundingBox(box, 640, 480);

      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });

    it('소수점 크기를 ceil로 올린다', () => {
      const box: BoundingBox = { x: 10, y: 20, width: 100.1, height: 80.1 };

      const result = normalizeBoundingBox(box, 640, 480);

      expect(result.width).toBe(101);
      expect(result.height).toBe(81);
    });
  });

  // =========================================
  // extractRegionFromImage 테스트
  // =========================================

  describe('extractRegionFromImage', () => {
    it('지정된 영역을 추출한다', () => {
      const imageData = createMockRGBImageData(100, 100);
      const box: BoundingBox = { x: 20, y: 20, width: 50, height: 50 };

      const result = extractRegionFromImage(imageData, box);

      expect(result.width).toBe(50);
      expect(result.height).toBe(50);
    });

    it('채널 수를 유지한다', () => {
      const imageData = createMockRGBImageData(100, 100);
      const box: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };

      const result = extractRegionFromImage(imageData, box);

      expect(result.channels).toBe(3);
    });

    it('데이터 크기가 올바르다', () => {
      const imageData = createMockRGBImageData(100, 100);
      const box: BoundingBox = { x: 10, y: 10, width: 30, height: 40 };

      const result = extractRegionFromImage(imageData, box);

      expect(result.data.length).toBe(30 * 40 * 3);
    });

    it('이미지 전체를 추출할 수 있다', () => {
      const imageData = createMockRGBImageData(100, 100);
      const box: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };

      const result = extractRegionFromImage(imageData, box);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.data.length).toBe(100 * 100 * 3);
    });

    it('경계를 벗어나는 영역을 클램프한다', () => {
      const imageData = createMockRGBImageData(100, 100);
      const box: BoundingBox = { x: 80, y: 80, width: 50, height: 50 };

      const result = extractRegionFromImage(imageData, box);

      expect(result.width).toBeLessThanOrEqual(20);
      expect(result.height).toBeLessThanOrEqual(20);
    });

    it('1x1 영역도 추출할 수 있다', () => {
      const imageData = createMockRGBImageData(100, 100);
      const box: BoundingBox = { x: 50, y: 50, width: 1, height: 1 };

      const result = extractRegionFromImage(imageData, box);

      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
      expect(result.data.length).toBe(3);
    });
  });

  // =========================================
  // getPaddedBoundingBox 테스트
  // =========================================

  describe('getPaddedBoundingBox', () => {
    it('기본 20% 패딩을 적용한다', () => {
      const box: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };

      const result = getPaddedBoundingBox(box, 640, 480);

      // 100 * 0.2 = 20 패딩
      expect(result.x).toBe(80); // 100 - 20
      expect(result.y).toBe(80); // 100 - 20
      expect(result.width).toBe(140); // 100 + 40
      expect(result.height).toBe(140); // 100 + 40
    });

    it('지정된 패딩 비율을 적용한다', () => {
      const box: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };

      const result = getPaddedBoundingBox(box, 640, 480, 0.5);

      // 100 * 0.5 = 50 패딩
      expect(result.x).toBe(50); // 100 - 50
      expect(result.y).toBe(50); // 100 - 50
    });

    it('이미지 경계를 벗어나지 않도록 클램프한다', () => {
      const box: BoundingBox = { x: 10, y: 10, width: 100, height: 100 };

      const result = getPaddedBoundingBox(box, 640, 480, 0.2);

      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + result.width).toBeLessThanOrEqual(640);
      expect(result.y + result.height).toBeLessThanOrEqual(480);
    });

    it('패딩 0은 원본 박스를 반환한다', () => {
      const box: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };

      const result = getPaddedBoundingBox(box, 640, 480, 0);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('비대칭 박스에도 올바르게 패딩을 적용한다', () => {
      const box: BoundingBox = { x: 100, y: 100, width: 200, height: 100 };

      const result = getPaddedBoundingBox(box, 640, 480, 0.2);

      // width 패딩: 200 * 0.2 = 40
      // height 패딩: 100 * 0.2 = 20
      expect(result.x).toBe(60); // 100 - 40
      expect(result.y).toBe(80); // 100 - 20
    });
  });

  // =========================================
  // extractFaceRegion 테스트
  // =========================================

  describe('extractFaceRegion', () => {
    it('얼굴 영역을 추출한다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractFaceRegion(imageData, face);

      expect(result).toHaveProperty('imageData');
      expect(result).toHaveProperty('boundingBox');
      expect(result).toHaveProperty('landmarks');
    });

    it('패딩이 적용된 바운딩 박스를 반환한다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractFaceRegion(imageData, face);

      // 20% 패딩 적용
      expect(result.boundingBox.width).toBeGreaterThan(200);
      expect(result.boundingBox.height).toBeGreaterThan(250);
    });

    it('랜드마크 좌표가 영역 좌표계로 조정된다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractFaceRegion(imageData, face);

      // 랜드마크 좌표가 영역 내 좌표로 변환됨
      result.landmarks.points.forEach((point) => {
        expect(point.x).toBeGreaterThanOrEqual(-100); // 패딩 고려
        expect(point.y).toBeGreaterThanOrEqual(-100);
      });
    });

    it('커스텀 패딩 비율을 적용할 수 있다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractFaceRegion(imageData, face, 0.5);

      // 50% 패딩 적용
      expect(result.boundingBox.width).toBeGreaterThan(250); // 200 + 200*0.5*2 에 근접
    });

    it('신뢰도가 유지된다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractFaceRegion(imageData, face);

      expect(result.landmarks.confidence).toBe(0.95);
    });
  });

  // =========================================
  // extractSquareFaceRegion 테스트
  // =========================================

  describe('extractSquareFaceRegion', () => {
    it('정사각형 영역을 추출한다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractSquareFaceRegion(imageData, face);

      // 정사각형에 가까워야 함 (패딩 적용 후에도)
      const aspectRatio = result.boundingBox.width / result.boundingBox.height;
      expect(aspectRatio).toBeCloseTo(1, 0.5); // 1에 가까움
    });

    it('큰 쪽 차원을 기준으로 정사각형을 만든다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 100, height: 200 });

      const result = extractSquareFaceRegion(imageData, face);

      // height가 크므로 height 기준 정사각형
      // 패딩 적용 전 정사각형 크기는 200
      expect(result.boundingBox.width).toBeGreaterThanOrEqual(200);
    });

    it('랜드마크 좌표가 조정된다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      const result = extractSquareFaceRegion(imageData, face);

      expect(result.landmarks).toBeDefined();
      expect(result.landmarks.points.length).toBe(face.landmarks.points.length);
    });

    it('20% 패딩이 자동 적용된다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 250, y: 150, width: 100, height: 100 });

      const result = extractSquareFaceRegion(imageData, face);

      // 100 * 100 정사각형 + 20% 패딩 = ~140 * 140
      expect(result.boundingBox.width).toBeGreaterThan(100);
    });

    it('이미지 경계를 벗어나지 않는다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 10, y: 10, width: 200, height: 200 });

      const result = extractSquareFaceRegion(imageData, face);

      expect(result.boundingBox.x).toBeGreaterThanOrEqual(0);
      expect(result.boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(result.boundingBox.x + result.boundingBox.width).toBeLessThanOrEqual(640);
      expect(result.boundingBox.y + result.boundingBox.height).toBeLessThanOrEqual(480);
    });
  });

  // =========================================
  // 통합 테스트
  // =========================================

  describe('통합 테스트', () => {
    it('전체 파이프라인: 감지 → 패딩 → 추출', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 200, height: 250 });

      // 1. 패딩된 바운딩 박스 계산
      const paddedBox = getPaddedBoundingBox(
        face.boundingBox,
        imageData.width,
        imageData.height,
        0.2
      );

      // 2. 영역 추출
      const region = extractRegionFromImage(imageData, paddedBox);

      // 3. 검증
      expect(region.width).toBe(paddedBox.width);
      expect(region.height).toBe(paddedBox.height);
      expect(region.data.length).toBe(paddedBox.width * paddedBox.height * 3);
    });

    it('extractFaceRegion이 올바른 영역을 반환한다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const box: BoundingBox = { x: 200, y: 100, width: 200, height: 250 };
      const face = createMockDetectedFace(box);

      const region = extractFaceRegion(imageData, face);

      // 영역 데이터 크기가 바운딩 박스와 일치
      const expectedSize = region.boundingBox.width * region.boundingBox.height * 3;
      expect(region.imageData.data.length).toBe(expectedSize);
    });

    it('정사각형 추출이 AI 모델 입력에 적합하다', () => {
      const imageData = createMockRGBImageData(640, 480);
      const face = createMockDetectedFace({ x: 200, y: 100, width: 150, height: 200 });

      const squareRegion = extractSquareFaceRegion(imageData, face);

      // 정사각형 비율 확인
      const ratio = squareRegion.boundingBox.width / squareRegion.boundingBox.height;
      expect(ratio).toBeGreaterThan(0.8);
      expect(ratio).toBeLessThan(1.2);
    });
  });
});
