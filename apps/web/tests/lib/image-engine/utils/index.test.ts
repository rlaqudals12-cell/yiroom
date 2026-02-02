/**
 * Image Engine 유틸리티 배럴 익스포트 테스트
 *
 * @module tests/lib/image-engine/utils/index
 * @see docs/adr/ADR-001-core-image-engine.md
 */

import { describe, it, expect } from 'vitest';
import * as UtilsModule from '@/lib/image-engine/utils';

describe('lib/image-engine/utils 배럴 익스포트', () => {
  // ==========================================================================
  // 그레이스케일 유틸리티 익스포트
  // ==========================================================================
  describe('그레이스케일 유틸리티', () => {
    it('toGrayscale이 export된다', () => {
      expect(UtilsModule.toGrayscale).toBeDefined();
      expect(typeof UtilsModule.toGrayscale).toBe('function');
    });

    it('toGrayscaleBT709가 export된다', () => {
      expect(UtilsModule.toGrayscaleBT709).toBeDefined();
      expect(typeof UtilsModule.toGrayscaleBT709).toBe('function');
    });

    it('calculateMeanBrightness가 export된다', () => {
      expect(UtilsModule.calculateMeanBrightness).toBeDefined();
      expect(typeof UtilsModule.calculateMeanBrightness).toBe('function');
    });

    it('calculateStdDev가 export된다', () => {
      expect(UtilsModule.calculateStdDev).toBeDefined();
      expect(typeof UtilsModule.calculateStdDev).toBe('function');
    });

    it('calculateHistogram이 export된다', () => {
      expect(UtilsModule.calculateHistogram).toBeDefined();
      expect(typeof UtilsModule.calculateHistogram).toBe('function');
    });

    it('normalizeHistogram이 export된다', () => {
      expect(UtilsModule.normalizeHistogram).toBeDefined();
      expect(typeof UtilsModule.normalizeHistogram).toBe('function');
    });

    it('extractRegion이 export된다', () => {
      expect(UtilsModule.extractRegion).toBeDefined();
      expect(typeof UtilsModule.extractRegion).toBe('function');
    });

    it('fromCanvasImageData가 export된다', () => {
      expect(UtilsModule.fromCanvasImageData).toBeDefined();
      expect(typeof UtilsModule.fromCanvasImageData).toBe('function');
    });

    it('fromBase64가 export된다', () => {
      expect(UtilsModule.fromBase64).toBeDefined();
      expect(typeof UtilsModule.fromBase64).toBe('function');
    });
  });

  // ==========================================================================
  // 색공간 변환 유틸리티 익스포트
  // ==========================================================================
  describe('색공간 변환 유틸리티', () => {
    it('srgbToLinear가 export된다', () => {
      expect(UtilsModule.srgbToLinear).toBeDefined();
      expect(typeof UtilsModule.srgbToLinear).toBe('function');
    });

    it('linearToSrgb가 export된다', () => {
      expect(UtilsModule.linearToSrgb).toBeDefined();
      expect(typeof UtilsModule.linearToSrgb).toBe('function');
    });

    it('normalizeRGB가 export된다', () => {
      expect(UtilsModule.normalizeRGB).toBeDefined();
      expect(typeof UtilsModule.normalizeRGB).toBe('function');
    });

    it('denormalizeRGB가 export된다', () => {
      expect(UtilsModule.denormalizeRGB).toBeDefined();
      expect(typeof UtilsModule.denormalizeRGB).toBe('function');
    });

    it('rgbToXYZ가 export된다', () => {
      expect(UtilsModule.rgbToXYZ).toBeDefined();
      expect(typeof UtilsModule.rgbToXYZ).toBe('function');
    });

    it('xyzToRGB가 export된다', () => {
      expect(UtilsModule.xyzToRGB).toBeDefined();
      expect(typeof UtilsModule.xyzToRGB).toBe('function');
    });

    it('xyzToChromaticity가 export된다', () => {
      expect(UtilsModule.xyzToChromaticity).toBeDefined();
      expect(typeof UtilsModule.xyzToChromaticity).toBe('function');
    });

    it('rgbToChromaticity가 export된다', () => {
      expect(UtilsModule.rgbToChromaticity).toBeDefined();
      expect(typeof UtilsModule.rgbToChromaticity).toBe('function');
    });

    it('xyzToLMS가 export된다', () => {
      expect(UtilsModule.xyzToLMS).toBeDefined();
      expect(typeof UtilsModule.xyzToLMS).toBe('function');
    });

    it('lmsToXYZ가 export된다', () => {
      expect(UtilsModule.lmsToXYZ).toBeDefined();
      expect(typeof UtilsModule.lmsToXYZ).toBe('function');
    });

    it('vonKriesAdaptation이 export된다', () => {
      expect(UtilsModule.vonKriesAdaptation).toBeDefined();
      expect(typeof UtilsModule.vonKriesAdaptation).toBe('function');
    });

    it('rgbToYCbCr가 export된다', () => {
      expect(UtilsModule.rgbToYCbCr).toBeDefined();
      expect(typeof UtilsModule.rgbToYCbCr).toBe('function');
    });

    it('ycbcrToRGB가 export된다', () => {
      expect(UtilsModule.ycbcrToRGB).toBeDefined();
      expect(typeof UtilsModule.ycbcrToRGB).toBe('function');
    });

    it('estimateCCT가 export된다', () => {
      expect(UtilsModule.estimateCCT).toBeDefined();
      expect(typeof UtilsModule.estimateCCT).toBe('function');
    });

    it('estimateCCTFromRGB가 export된다', () => {
      expect(UtilsModule.estimateCCTFromRGB).toBeDefined();
      expect(typeof UtilsModule.estimateCCTFromRGB).toBe('function');
    });

    it('calculateColorDifference가 export된다', () => {
      expect(UtilsModule.calculateColorDifference).toBeDefined();
      expect(typeof UtilsModule.calculateColorDifference).toBe('function');
    });

    it('calculateAverageRGB가 export된다', () => {
      expect(UtilsModule.calculateAverageRGB).toBeDefined();
      expect(typeof UtilsModule.calculateAverageRGB).toBe('function');
    });
  });

  // ==========================================================================
  // 행렬 연산 유틸리티 익스포트
  // ==========================================================================
  describe('행렬 연산 유틸리티', () => {
    it('multiplyMatrixVector가 export된다', () => {
      expect(UtilsModule.multiplyMatrixVector).toBeDefined();
      expect(typeof UtilsModule.multiplyMatrixVector).toBe('function');
    });

    it('multiplyMatrices가 export된다', () => {
      expect(UtilsModule.multiplyMatrices).toBeDefined();
      expect(typeof UtilsModule.multiplyMatrices).toBe('function');
    });

    it('identityMatrix3x3가 export된다', () => {
      expect(UtilsModule.identityMatrix3x3).toBeDefined();
      expect(typeof UtilsModule.identityMatrix3x3).toBe('function');
    });

    it('transposeMatrix가 export된다', () => {
      expect(UtilsModule.transposeMatrix).toBeDefined();
      expect(typeof UtilsModule.transposeMatrix).toBe('function');
    });

    it('determinant3x3가 export된다', () => {
      expect(UtilsModule.determinant3x3).toBeDefined();
      expect(typeof UtilsModule.determinant3x3).toBe('function');
    });

    it('inverseMatrix3x3가 export된다', () => {
      expect(UtilsModule.inverseMatrix3x3).toBeDefined();
      expect(typeof UtilsModule.inverseMatrix3x3).toBe('function');
    });

    it('scaleMatrix가 export된다', () => {
      expect(UtilsModule.scaleMatrix).toBeDefined();
      expect(typeof UtilsModule.scaleMatrix).toBe('function');
    });

    it('diagonalMatrix가 export된다', () => {
      expect(UtilsModule.diagonalMatrix).toBeDefined();
      expect(typeof UtilsModule.diagonalMatrix).toBe('function');
    });
  });

  // ==========================================================================
  // 벡터 연산 유틸리티 익스포트
  // ==========================================================================
  describe('벡터 연산 유틸리티', () => {
    describe('2D 벡터 연산', () => {
      it('add2D가 export된다', () => {
        expect(UtilsModule.add2D).toBeDefined();
        expect(typeof UtilsModule.add2D).toBe('function');
      });

      it('subtract2D가 export된다', () => {
        expect(UtilsModule.subtract2D).toBeDefined();
        expect(typeof UtilsModule.subtract2D).toBe('function');
      });

      it('scale2D가 export된다', () => {
        expect(UtilsModule.scale2D).toBeDefined();
        expect(typeof UtilsModule.scale2D).toBe('function');
      });

      it('magnitude2D가 export된다', () => {
        expect(UtilsModule.magnitude2D).toBeDefined();
        expect(typeof UtilsModule.magnitude2D).toBe('function');
      });

      it('normalize2D가 export된다', () => {
        expect(UtilsModule.normalize2D).toBeDefined();
        expect(typeof UtilsModule.normalize2D).toBe('function');
      });

      it('dot2D가 export된다', () => {
        expect(UtilsModule.dot2D).toBeDefined();
        expect(typeof UtilsModule.dot2D).toBe('function');
      });

      it('distance2D가 export된다', () => {
        expect(UtilsModule.distance2D).toBeDefined();
        expect(typeof UtilsModule.distance2D).toBe('function');
      });
    });

    describe('3D 벡터 연산', () => {
      it('add3D가 export된다', () => {
        expect(UtilsModule.add3D).toBeDefined();
        expect(typeof UtilsModule.add3D).toBe('function');
      });

      it('subtract3D가 export된다', () => {
        expect(UtilsModule.subtract3D).toBeDefined();
        expect(typeof UtilsModule.subtract3D).toBe('function');
      });

      it('scale3D가 export된다', () => {
        expect(UtilsModule.scale3D).toBeDefined();
        expect(typeof UtilsModule.scale3D).toBe('function');
      });

      it('magnitude3D가 export된다', () => {
        expect(UtilsModule.magnitude3D).toBeDefined();
        expect(typeof UtilsModule.magnitude3D).toBe('function');
      });

      it('normalize3D가 export된다', () => {
        expect(UtilsModule.normalize3D).toBeDefined();
        expect(typeof UtilsModule.normalize3D).toBe('function');
      });

      it('dot3D가 export된다', () => {
        expect(UtilsModule.dot3D).toBeDefined();
        expect(typeof UtilsModule.dot3D).toBe('function');
      });

      it('cross3D가 export된다', () => {
        expect(UtilsModule.cross3D).toBeDefined();
        expect(typeof UtilsModule.cross3D).toBe('function');
      });

      it('distance3D가 export된다', () => {
        expect(UtilsModule.distance3D).toBeDefined();
        expect(typeof UtilsModule.distance3D).toBe('function');
      });

      it('centroid3D가 export된다', () => {
        expect(UtilsModule.centroid3D).toBeDefined();
        expect(typeof UtilsModule.centroid3D).toBe('function');
      });

      it('lerp3D가 export된다', () => {
        expect(UtilsModule.lerp3D).toBeDefined();
        expect(typeof UtilsModule.lerp3D).toBe('function');
      });
    });

    describe('각도 변환', () => {
      it('radiansToDegrees가 export된다', () => {
        expect(UtilsModule.radiansToDegrees).toBeDefined();
        expect(typeof UtilsModule.radiansToDegrees).toBe('function');
      });

      it('degreesToRadians가 export된다', () => {
        expect(UtilsModule.degreesToRadians).toBeDefined();
        expect(typeof UtilsModule.degreesToRadians).toBe('function');
      });

      it('eulerToDegrees가 export된다', () => {
        expect(UtilsModule.eulerToDegrees).toBeDefined();
        expect(typeof UtilsModule.eulerToDegrees).toBe('function');
      });
    });

    describe('얼굴 각도 계산', () => {
      it('calculateFaceNormal이 export된다', () => {
        expect(UtilsModule.calculateFaceNormal).toBeDefined();
        expect(typeof UtilsModule.calculateFaceNormal).toBe('function');
      });

      it('normalToEulerAngles가 export된다', () => {
        expect(UtilsModule.normalToEulerAngles).toBeDefined();
        expect(typeof UtilsModule.normalToEulerAngles).toBe('function');
      });

      it('calculateRollFromEyes가 export된다', () => {
        expect(UtilsModule.calculateRollFromEyes).toBeDefined();
        expect(typeof UtilsModule.calculateRollFromEyes).toBe('function');
      });

      it('calculateFaceEulerAngles가 export된다', () => {
        expect(UtilsModule.calculateFaceEulerAngles).toBeDefined();
        expect(typeof UtilsModule.calculateFaceEulerAngles).toBe('function');
      });

      it('calculateFrontalityScore가 export된다', () => {
        expect(UtilsModule.calculateFrontalityScore).toBeDefined();
        expect(typeof UtilsModule.calculateFrontalityScore).toBe('function');
      });
    });

    describe('보간 및 클램프', () => {
      it('lerp가 export된다', () => {
        expect(UtilsModule.lerp).toBeDefined();
        expect(typeof UtilsModule.lerp).toBe('function');
      });

      it('clamp가 export된다', () => {
        expect(UtilsModule.clamp).toBeDefined();
        expect(typeof UtilsModule.clamp).toBe('function');
      });
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('예상된 exports 수를 가진다', () => {
      const exports = Object.keys(UtilsModule);
      // 최소 40개 이상의 유틸리티 함수가 있어야 함
      expect(exports.length).toBeGreaterThanOrEqual(40);
    });

    it('모든 export가 함수이다', () => {
      const exports = Object.entries(UtilsModule);

      for (const [, value] of exports) {
        // 타입 export는 undefined일 수 있음
        if (value !== undefined) {
          expect(typeof value).toBe('function');
        }
      }
    });
  });
});
