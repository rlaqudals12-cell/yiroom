/**
 * Core Image Engine 메인 익스포트 테스트
 *
 * @module tests/lib/image-engine/index
 * @description CIE 모듈 배럴 익스포트 검증
 */
import { describe, it, expect } from 'vitest';
import * as CIE from '@/lib/image-engine';

describe('Core Image Engine - 모듈 익스포트', () => {
  describe('타입 익스포트', () => {
    it('기본 타입이 정의되어야 함', () => {
      // 타입은 런타임에 체크할 수 없으므로 관련 상수/함수로 검증
      expect(CIE.D65_WHITE_POINT).toBeDefined();
      expect(CIE.SRGB_TO_XYZ_MATRIX).toBeDefined();
    });
  });

  describe('상수 익스포트', () => {
    it('D65 백색점 상수', () => {
      expect(CIE.D65_WHITE_POINT).toBeDefined();
      expect(CIE.D65_XYZ).toBeDefined();
      expect(CIE.D65_CCT).toBeDefined();
    });

    it('색공간 변환 행렬', () => {
      expect(CIE.SRGB_TO_XYZ_MATRIX).toBeDefined();
      expect(CIE.XYZ_TO_SRGB_MATRIX).toBeDefined();
      expect(CIE.BRADFORD_MATRIX).toBeDefined();
      expect(CIE.BRADFORD_INVERSE_MATRIX).toBeDefined();
    });

    it('그레이스케일 가중치', () => {
      expect(CIE.GRAYSCALE_WEIGHTS).toBeDefined();
      expect(CIE.GRAYSCALE_WEIGHTS_BT709).toBeDefined();
    });

    it('Laplacian 커널', () => {
      expect(CIE.LAPLACIAN_KERNEL_3X3).toBeDefined();
      expect(CIE.LAPLACIAN_KERNEL_5X5).toBeDefined();
    });

    it('기본 설정', () => {
      expect(CIE.DEFAULT_CIE_CONFIG).toBeDefined();
      expect(CIE.DEFAULT_CIE_CONFIG.cie1).toBeDefined();
      expect(CIE.DEFAULT_CIE_CONFIG.cie2).toBeDefined();
      expect(CIE.DEFAULT_CIE_CONFIG.cie3).toBeDefined();
      expect(CIE.DEFAULT_CIE_CONFIG.cie4).toBeDefined();
    });

    it('피드백 메시지', () => {
      expect(CIE.FEEDBACK_MESSAGES).toBeDefined();
    });

    it('타임아웃/재시도 상수', () => {
      expect(CIE.PROCESSING_TIMEOUT).toBeDefined();
      expect(CIE.MAX_RETRIES).toBeDefined();
    });
  });

  describe('유틸리티 함수 익스포트', () => {
    describe('그레이스케일', () => {
      it('그레이스케일 변환 함수', () => {
        expect(typeof CIE.toGrayscale).toBe('function');
        expect(typeof CIE.toGrayscaleBT709).toBe('function');
      });

      it('밝기 계산 함수', () => {
        expect(typeof CIE.calculateMeanBrightness).toBe('function');
        expect(typeof CIE.calculateStdDev).toBe('function');
      });

      it('히스토그램 함수', () => {
        expect(typeof CIE.calculateHistogram).toBe('function');
        expect(typeof CIE.normalizeHistogram).toBe('function');
      });

      it('영역 추출 함수', () => {
        expect(typeof CIE.extractRegion).toBe('function');
      });

      it('이미지 데이터 변환 함수', () => {
        expect(typeof CIE.fromCanvasImageData).toBe('function');
        expect(typeof CIE.fromBase64).toBe('function');
      });
    });

    describe('색공간', () => {
      it('감마 변환 함수', () => {
        expect(typeof CIE.srgbToLinear).toBe('function');
        expect(typeof CIE.linearToSrgb).toBe('function');
      });

      it('RGB 정규화 함수', () => {
        expect(typeof CIE.normalizeRGB).toBe('function');
        expect(typeof CIE.denormalizeRGB).toBe('function');
      });

      it('XYZ 변환 함수', () => {
        expect(typeof CIE.rgbToXYZ).toBe('function');
        expect(typeof CIE.xyzToRGB).toBe('function');
      });

      it('색도 좌표 함수', () => {
        expect(typeof CIE.xyzToChromaticity).toBe('function');
        expect(typeof CIE.rgbToChromaticity).toBe('function');
      });

      it('LMS 변환 함수', () => {
        expect(typeof CIE.xyzToLMS).toBe('function');
        expect(typeof CIE.lmsToXYZ).toBe('function');
      });

      it('Von Kries 색순응 함수', () => {
        expect(typeof CIE.vonKriesAdaptation).toBe('function');
      });

      it('YCbCr 변환 함수', () => {
        expect(typeof CIE.rgbToYCbCr).toBe('function');
        expect(typeof CIE.ycbcrToRGB).toBe('function');
      });

      it('CCT 추정 함수', () => {
        expect(typeof CIE.estimateCCT).toBe('function');
        expect(typeof CIE.estimateCCTFromRGB).toBe('function');
      });

      it('색차 계산 함수', () => {
        expect(typeof CIE.calculateColorDifference).toBe('function');
        expect(typeof CIE.calculateAverageRGB).toBe('function');
      });
    });

    describe('행렬 연산', () => {
      it('행렬 곱셈 함수', () => {
        expect(typeof CIE.multiplyMatrixVector).toBe('function');
        expect(typeof CIE.multiplyMatrices).toBe('function');
      });

      it('단위 행렬 함수', () => {
        expect(typeof CIE.identityMatrix3x3).toBe('function');
      });

      it('행렬 변환 함수', () => {
        expect(typeof CIE.transposeMatrix).toBe('function');
        expect(typeof CIE.determinant3x3).toBe('function');
        expect(typeof CIE.inverseMatrix3x3).toBe('function');
      });

      it('행렬 스케일 함수', () => {
        expect(typeof CIE.scaleMatrix).toBe('function');
        expect(typeof CIE.diagonalMatrix).toBe('function');
      });
    });

    describe('벡터 연산', () => {
      it('2D 벡터 함수', () => {
        expect(typeof CIE.add2D).toBe('function');
        expect(typeof CIE.subtract2D).toBe('function');
        expect(typeof CIE.scale2D).toBe('function');
        expect(typeof CIE.magnitude2D).toBe('function');
        expect(typeof CIE.normalize2D).toBe('function');
        expect(typeof CIE.dot2D).toBe('function');
        expect(typeof CIE.distance2D).toBe('function');
      });

      it('3D 벡터 함수', () => {
        expect(typeof CIE.add3D).toBe('function');
        expect(typeof CIE.subtract3D).toBe('function');
        expect(typeof CIE.scale3D).toBe('function');
        expect(typeof CIE.magnitude3D).toBe('function');
        expect(typeof CIE.normalize3D).toBe('function');
        expect(typeof CIE.dot3D).toBe('function');
        expect(typeof CIE.cross3D).toBe('function');
        expect(typeof CIE.distance3D).toBe('function');
      });

      it('각도 변환 함수', () => {
        expect(typeof CIE.radiansToDegrees).toBe('function');
        expect(typeof CIE.degreesToRadians).toBe('function');
        expect(typeof CIE.eulerToDegrees).toBe('function');
      });

      it('얼굴 각도 계산 함수', () => {
        expect(typeof CIE.calculateFaceNormal).toBe('function');
        expect(typeof CIE.normalToEulerAngles).toBe('function');
        expect(typeof CIE.calculateRollFromEyes).toBe('function');
        expect(typeof CIE.calculateFaceEulerAngles).toBe('function');
        expect(typeof CIE.calculateFrontalityScore).toBe('function');
      });

      it('보간 함수', () => {
        expect(typeof CIE.centroid3D).toBe('function');
        expect(typeof CIE.lerp).toBe('function');
        expect(typeof CIE.lerp3D).toBe('function');
        expect(typeof CIE.clamp).toBe('function');
      });
    });
  });

  describe('CIE-1 함수 익스포트', () => {
    it('메인 검증 함수', () => {
      expect(typeof CIE.validateImageQuality).toBe('function');
      expect(typeof CIE.validateImageQualityWithTimeout).toBe('function');
    });

    it('종합 점수/판정 함수', () => {
      expect(typeof CIE.calculateOverallScore).toBe('function');
      expect(typeof CIE.calculateOverallConfidence).toBe('function');
      expect(typeof CIE.isAcceptable).toBe('function');
      expect(typeof CIE.determinePrimaryIssue).toBe('function');
      expect(typeof CIE.collectAllIssues).toBe('function');
    });

    it('선명도 분석 함수', () => {
      expect(typeof CIE.analyzeSharpness).toBe('function');
      expect(typeof CIE.analyzeSharpnessFromGray).toBe('function');
      expect(typeof CIE.applyLaplacianFilter).toBe('function');
      expect(typeof CIE.calculateLaplacianVariance).toBe('function');
      expect(typeof CIE.normalizeSharpnessScore).toBe('function');
      expect(typeof CIE.getSharpnessVerdict).toBe('function');
      expect(typeof CIE.getSharpnessFeedback).toBe('function');
    });

    it('노출 분석 함수', () => {
      expect(typeof CIE.analyzeExposure).toBe('function');
      expect(typeof CIE.analyzeExposureFromGray).toBe('function');
      expect(typeof CIE.analyzeExposureDetailed).toBe('function');
      expect(typeof CIE.getExposureVerdict).toBe('function');
      expect(typeof CIE.calculateExposureConfidence).toBe('function');
      expect(typeof CIE.getExposureFeedback).toBe('function');
      expect(typeof CIE.analyzeHistogram).toBe('function');
    });

    it('색온도 분석 함수', () => {
      expect(typeof CIE.analyzeColorTemperature).toBe('function');
      expect(typeof CIE.analyzeColorTemperatureFromRGB).toBe('function');
      expect(typeof CIE.getCCTVerdict).toBe('function');
      expect(typeof CIE.calculateCCTConfidence).toBe('function');
      expect(typeof CIE.getCCTFeedback).toBe('function');
      expect(typeof CIE.calculateImageAverageRGB).toBe('function');
      expect(typeof CIE.calculateBrightRegionAverageRGB).toBe('function');
    });

    it('해상도 검증 함수', () => {
      expect(typeof CIE.validateResolution).toBe('function');
      expect(typeof CIE.validateResolutionDirect).toBe('function');
      expect(typeof CIE.calculateResolutionScore).toBe('function');
      expect(typeof CIE.isSuitableForFaceAnalysis).toBe('function');
      expect(typeof CIE.calculateRecommendedSize).toBe('function');
    });

    it('Fallback 함수', () => {
      expect(typeof CIE.generateCIE1Fallback).toBe('function');
      expect(typeof CIE.generatePartialCIE1Fallback).toBe('function');
      expect(typeof CIE.generateRejectedFallback).toBe('function');
      expect(typeof CIE.generateRandomCIE1Mock).toBe('function');
      expect(typeof CIE.generateSharpnessFallback).toBe('function');
      expect(typeof CIE.generateExposureFallback).toBe('function');
      expect(typeof CIE.generateCCTFallback).toBe('function');
    });
  });

  describe('CIE-2 함수 익스포트', () => {
    it('메인 프로세서', () => {
      expect(typeof CIE.processMediaPipeResults).toBe('function');
      expect(typeof CIE.processMock).toBe('function');
      expect(typeof CIE.isMediaPipeAvailable).toBe('function');
      expect(typeof CIE.generateMockMediaPipeResult).toBe('function');
    });

    it('얼굴 감지 함수', () => {
      expect(typeof CIE.convertLandmarksToPoints).toBe('function');
      expect(typeof CIE.calculateBoundingBoxFromLandmarks).toBe('function');
      expect(typeof CIE.getLandmarkPoint).toBe('function');
      expect(typeof CIE.calculateFaceAngle).toBe('function');
      expect(typeof CIE.calculateFrontalityFromLandmarks).toBe('function');
      expect(typeof CIE.convertToDetectedFace).toBe('function');
      expect(typeof CIE.selectBestFace).toBe('function');
      expect(typeof CIE.validateFaceAngle).toBe('function');
    });

    it('영역 추출 함수', () => {
      expect(typeof CIE.normalizeBoundingBox).toBe('function');
      expect(typeof CIE.extractRegionFromImage).toBe('function');
      expect(typeof CIE.getPaddedBoundingBox).toBe('function');
      expect(typeof CIE.extractFaceRegion).toBe('function');
      expect(typeof CIE.extractSquareFaceRegion).toBe('function');
    });

    it('Fallback 함수', () => {
      expect(typeof CIE.generateCIE2Fallback).toBe('function');
      expect(typeof CIE.generateNoFaceFallback).toBe('function');
      expect(typeof CIE.generateErrorFallback).toBe('function');
      expect(typeof CIE.generateRandomCIE2Mock).toBe('function');
      expect(typeof CIE.generateFrontalityFallback).toBe('function');
    });
  });

  describe('CIE-3 함수 익스포트', () => {
    it('메인 프로세서', () => {
      expect(typeof CIE.processAWBCorrection).toBe('function');
      expect(typeof CIE.processAWBCorrectionWithTimeout).toBe('function');
      expect(typeof CIE.selectAndApplyAWB).toBe('function');
    });

    it('피부 감지 함수', () => {
      expect(typeof CIE.isSkinPixel).toBe('function');
      expect(typeof CIE.detectSkinMask).toBe('function');
      expect(typeof CIE.calculateSkinAverageRGB).toBe('function');
      expect(typeof CIE.calculateNonSkinAverageRGB).toBe('function');
      expect(typeof CIE.hasSufficientSkinCoverage).toBe('function');
      expect(typeof CIE.cleanSkinMask).toBe('function');
    });

    it('AWB 알고리즘 함수', () => {
      expect(typeof CIE.calculateGrayWorldGains).toBe('function');
      expect(typeof CIE.applyGrayWorld).toBe('function');
      expect(typeof CIE.applyVonKries).toBe('function');
      expect(typeof CIE.applySkinAwareAWB).toBe('function');
      expect(typeof CIE.applyGains).toBe('function');
      expect(typeof CIE.calculateAppliedGains).toBe('function');
      expect(typeof CIE.isValidGains).toBe('function');
    });

    it('Fallback 함수', () => {
      expect(typeof CIE.generateCIE3Fallback).toBe('function');
      expect(typeof CIE.generateAWBCorrectionFallback).toBe('function');
      expect(typeof CIE.generateCorrectedFallback).toBe('function');
      expect(typeof CIE.generateErrorCIE3Fallback).toBe('function');
      expect(typeof CIE.generateRandomCIE3Mock).toBe('function');
    });
  });

  describe('CIE-4 함수 익스포트', () => {
    it('메인 프로세서', () => {
      expect(typeof CIE.processLightingAnalysis).toBe('function');
      expect(typeof CIE.processLightingAnalysisWithTimeout).toBe('function');
      expect(typeof CIE.quickLightingCheck).toBe('function');
    });

    it('CCT 분석 함수', () => {
      expect(typeof CIE.calculateRegionAverageRGB).toBe('function');
      expect(typeof CIE.estimateCCTFromForehead).toBe('function');
      expect(typeof CIE.estimateCCTFromFace).toBe('function');
      expect(typeof CIE.estimateCCTFromImage).toBe('function');
      expect(typeof CIE.classifyLightingType).toBe('function');
      expect(typeof CIE.evaluateCCTSuitability).toBe('function');
      expect(typeof CIE.needsCCTCorrection).toBe('function');
    });

    it('6존 분석 함수', () => {
      expect(CIE.FACE_ZONES).toBeDefined();
      expect(typeof CIE.calculateZoneBrightness).toBe('function');
      expect(typeof CIE.analyzeZoneBrightness).toBe('function');
      expect(typeof CIE.calculateUniformity).toBe('function');
      expect(typeof CIE.calculateLeftRightAsymmetry).toBe('function');
      expect(typeof CIE.calculateVerticalGradient).toBe('function');
      expect(typeof CIE.performZoneAnalysis).toBe('function');
      expect(typeof CIE.uniformityToScore).toBe('function');
    });

    it('그림자 감지 함수', () => {
      expect(CIE.SHADOW_THRESHOLDS).toBeDefined();
      expect(typeof CIE.detectShadowDirection).toBe('function');
      expect(typeof CIE.calculateShadowIntensity).toBe('function');
      expect(typeof CIE.calculateDarkAreaRatio).toBe('function');
      expect(typeof CIE.calculateOverexposedRatio).toBe('function');
      expect(typeof CIE.performShadowAnalysis).toBe('function');
      expect(typeof CIE.shadowToScore).toBe('function');
    });

    it('Fallback 함수', () => {
      expect(typeof CIE.generateZoneAnalysisFallback).toBe('function');
      expect(typeof CIE.generateShadowAnalysisFallback).toBe('function');
      expect(typeof CIE.generateCIE4Fallback).toBe('function');
      expect(typeof CIE.generateErrorCIE4Fallback).toBe('function');
      expect(typeof CIE.generateRandomCIE4Mock).toBe('function');
      expect(typeof CIE.generateConditionedCIE4Mock).toBe('function');
    });
  });

  describe('파이프라인 함수 익스포트', () => {
    it('파이프라인 실행 함수', () => {
      expect(typeof CIE.runCIEPipeline).toBe('function');
      expect(typeof CIE.runCIEPipelineWithTimeout).toBe('function');
    });
  });
});

describe('Core Image Engine - 기본 동작 검증', () => {
  describe('상수 값 검증', () => {
    it('D65 백색점 값', () => {
      expect(CIE.D65_WHITE_POINT.x).toBeCloseTo(0.31272, 4);
      expect(CIE.D65_WHITE_POINT.y).toBeCloseTo(0.32903, 4);
    });

    it('D65 XYZ 값', () => {
      expect(CIE.D65_XYZ.x).toBeCloseTo(95.047, 0);
      expect(CIE.D65_XYZ.y).toBeCloseTo(100, 0);
      expect(CIE.D65_XYZ.z).toBeCloseTo(108.883, 0);
    });

    it('D65 CCT 값', () => {
      expect(CIE.D65_CCT).toBeCloseTo(6500, 0);
    });

    it('그레이스케일 가중치 합계', () => {
      const { r, g, b } = CIE.GRAYSCALE_WEIGHTS;
      expect(r + g + b).toBeCloseTo(1, 5);

      const bt709 = CIE.GRAYSCALE_WEIGHTS_BT709;
      expect(bt709.r + bt709.g + bt709.b).toBeCloseTo(1, 5);
    });

    it('타임아웃 값', () => {
      expect(CIE.PROCESSING_TIMEOUT.cie1).toBeGreaterThan(0);
      expect(CIE.PROCESSING_TIMEOUT.cie2).toBeGreaterThan(0);
      expect(CIE.PROCESSING_TIMEOUT.cie3).toBeGreaterThan(0);
      expect(CIE.PROCESSING_TIMEOUT.cie4).toBeGreaterThan(0);
    });

    it('최대 재시도 횟수', () => {
      expect(CIE.MAX_RETRIES).toBeGreaterThanOrEqual(1);
    });
  });

  describe('기본 설정 검증', () => {
    it('CIE-1 설정', () => {
      const { cie1 } = CIE.DEFAULT_CIE_CONFIG;
      expect(cie1.sharpness).toBeDefined();
      expect(cie1.resolution).toBeDefined();
      expect(cie1.exposure).toBeDefined();
      expect(cie1.cct).toBeDefined();
    });

    it('CIE-2 설정', () => {
      const { cie2 } = CIE.DEFAULT_CIE_CONFIG;
      expect(cie2.maxFaces).toBeGreaterThan(0);
      expect(cie2.minConfidence).toBeGreaterThanOrEqual(0);
      expect(cie2.minConfidence).toBeLessThanOrEqual(1);
      expect(cie2.angleThresholds).toBeDefined();
    });

    it('CIE-3 설정', () => {
      const { cie3 } = CIE.DEFAULT_CIE_CONFIG;
      expect(cie3.targetCCT).toBeDefined();
      expect(cie3.minSkinCoverage).toBeGreaterThanOrEqual(0);
      expect(cie3.minSkinCoverage).toBeLessThanOrEqual(1);
      expect(cie3.skinDetection).toBeDefined();
    });

    it('CIE-4 설정', () => {
      const { cie4 } = CIE.DEFAULT_CIE_CONFIG;
      expect(cie4.minQualityScore).toBeGreaterThanOrEqual(0);
      expect(cie4.uniformityWeights).toBeDefined();
      expect(cie4.shadowThreshold).toBeGreaterThanOrEqual(0);
    });
  });
});
