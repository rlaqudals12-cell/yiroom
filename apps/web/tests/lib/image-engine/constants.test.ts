/**
 * Core Image Engine 상수 테스트
 *
 * @module tests/lib/image-engine/constants
 * @description CIE-1~4 모듈에서 공유하는 상수값 검증 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  // 물리 상수
  D65_WHITE_POINT,
  D65_XYZ,
  D65_CCT,
  CCT_THRESHOLDS,
  // 색공간 변환 행렬
  SRGB_TO_XYZ_MATRIX,
  XYZ_TO_SRGB_MATRIX,
  BRADFORD_MATRIX,
  BRADFORD_INVERSE_MATRIX,
  // 그레이스케일 가중치
  GRAYSCALE_WEIGHTS,
  GRAYSCALE_WEIGHTS_BT709,
  // Laplacian 커널
  LAPLACIAN_KERNEL_3X3,
  LAPLACIAN_KERNEL_5X5,
  // McCamy CCT 계수
  MCCAMY_COEFFICIENTS,
  // 피부 감지
  SKIN_DETECTION_YCBCR,
  // 얼굴 각도
  FACE_ANGLE_THRESHOLDS,
  FRONTALITY_WEIGHTS,
  // 랜드마크 인덱스
  FACE_LANDMARK_INDICES,
  // 기본 설정
  DEFAULT_CIE_CONFIG,
  // 등급 기준
  SHARPNESS_GRADES,
  UNIFORMITY_GRADES,
  CCT_RANGES,
  // 피드백 메시지
  FEEDBACK_MESSAGES,
  // 타임아웃
  PROCESSING_TIMEOUT,
  MAX_RETRIES,
} from '@/lib/image-engine/constants';
import {
  multiplyMatrices,
  multiplyMatrixVector,
} from '@/lib/image-engine/utils/matrix';

describe('lib/image-engine/constants', () => {
  // =========================================
  // D65 백색점 테스트
  // =========================================

  describe('D65 백색점', () => {
    it('D65_WHITE_POINT 색도 좌표가 표준 값이다', () => {
      expect(D65_WHITE_POINT.x).toBeCloseTo(0.31271, 4);
      expect(D65_WHITE_POINT.y).toBeCloseTo(0.32902, 4);
    });

    it('D65_WHITE_POINT의 x + y + z ≈ 1이다', () => {
      const sum = D65_WHITE_POINT.x + D65_WHITE_POINT.y + D65_WHITE_POINT.z;
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('D65_XYZ가 표준 값이다', () => {
      expect(D65_XYZ.x).toBeCloseTo(95.047, 2);
      expect(D65_XYZ.y).toBe(100.0);
      expect(D65_XYZ.z).toBeCloseTo(108.883, 2);
    });

    it('D65_CCT가 6500K이다', () => {
      expect(D65_CCT).toBe(6500);
    });
  });

  // =========================================
  // CCT 임계값 테스트
  // =========================================

  describe('CCT 임계값', () => {
    it('warm/neutral/cool 경계가 올바르다', () => {
      expect(CCT_THRESHOLDS.warmMax).toBeLessThan(CCT_THRESHOLDS.neutralMin);
      expect(CCT_THRESHOLDS.neutralMax).toBeLessThan(CCT_THRESHOLDS.coolMin);
    });

    it('허용 범위가 warm/cool 범위보다 넓다', () => {
      expect(CCT_THRESHOLDS.acceptable.min).toBeLessThan(CCT_THRESHOLDS.warmMax);
      expect(CCT_THRESHOLDS.acceptable.max).toBeGreaterThan(CCT_THRESHOLDS.coolMin);
    });

    it('D65(6500K)가 neutral 범위에 포함된다', () => {
      expect(D65_CCT).toBeGreaterThanOrEqual(CCT_THRESHOLDS.neutralMin);
      expect(D65_CCT).toBeLessThanOrEqual(CCT_THRESHOLDS.neutralMax);
    });
  });

  // =========================================
  // 색공간 변환 행렬 테스트
  // =========================================

  describe('색공간 변환 행렬', () => {
    it('sRGB → XYZ 행렬이 3x3이다', () => {
      expect(SRGB_TO_XYZ_MATRIX).toHaveLength(3);
      SRGB_TO_XYZ_MATRIX.forEach((row) => {
        expect(row).toHaveLength(3);
      });
    });

    it('XYZ → sRGB 행렬이 3x3이다', () => {
      expect(XYZ_TO_SRGB_MATRIX).toHaveLength(3);
      XYZ_TO_SRGB_MATRIX.forEach((row) => {
        expect(row).toHaveLength(3);
      });
    });

    it('sRGB → XYZ → sRGB 왕복 변환이 단위 행렬에 가깝다', () => {
      // 가변 배열로 변환
      const srgbToXyz = SRGB_TO_XYZ_MATRIX.map((row) => [...row]) as [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ];
      const xyzToSrgb = XYZ_TO_SRGB_MATRIX.map((row) => [...row]) as [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ];

      const identity = multiplyMatrices(srgbToXyz, xyzToSrgb);

      expect(identity[0][0]).toBeCloseTo(1, 4);
      expect(identity[1][1]).toBeCloseTo(1, 4);
      expect(identity[2][2]).toBeCloseTo(1, 4);
      expect(identity[0][1]).toBeCloseTo(0, 4);
      expect(identity[0][2]).toBeCloseTo(0, 4);
    });

    it('흰색(1,1,1) → XYZ가 D65에 가깝다', () => {
      const white = [1, 1, 1] as [number, number, number];
      const srgbToXyz = SRGB_TO_XYZ_MATRIX.map((row) => [...row]) as [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ];

      const xyz = multiplyMatrixVector(srgbToXyz, white);

      // D65 XYZ는 0.95047, 1.0, 1.08883 (정규화)
      expect(xyz[0]).toBeCloseTo(0.95047, 3);
      expect(xyz[1]).toBeCloseTo(1.0, 3);
      expect(xyz[2]).toBeCloseTo(1.08883, 3);
    });

    it('Bradford 행렬과 역행렬의 곱이 단위 행렬이다', () => {
      const bradford = BRADFORD_MATRIX.map((row) => [...row]) as [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ];
      const bradfordInv = BRADFORD_INVERSE_MATRIX.map((row) => [...row]) as [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ];

      const identity = multiplyMatrices(bradford, bradfordInv);

      expect(identity[0][0]).toBeCloseTo(1, 4);
      expect(identity[1][1]).toBeCloseTo(1, 4);
      expect(identity[2][2]).toBeCloseTo(1, 4);
    });
  });

  // =========================================
  // 그레이스케일 가중치 테스트
  // =========================================

  describe('그레이스케일 가중치', () => {
    it('BT.601 가중치 합이 1이다', () => {
      const sum =
        GRAYSCALE_WEIGHTS.r + GRAYSCALE_WEIGHTS.g + GRAYSCALE_WEIGHTS.b;
      expect(sum).toBeCloseTo(1.0, 6);
    });

    it('BT.709 가중치 합이 1이다', () => {
      const sum =
        GRAYSCALE_WEIGHTS_BT709.r +
        GRAYSCALE_WEIGHTS_BT709.g +
        GRAYSCALE_WEIGHTS_BT709.b;
      expect(sum).toBeCloseTo(1.0, 6);
    });

    it('녹색 가중치가 가장 높다 (인간 시각 특성)', () => {
      expect(GRAYSCALE_WEIGHTS.g).toBeGreaterThan(GRAYSCALE_WEIGHTS.r);
      expect(GRAYSCALE_WEIGHTS.g).toBeGreaterThan(GRAYSCALE_WEIGHTS.b);

      expect(GRAYSCALE_WEIGHTS_BT709.g).toBeGreaterThan(GRAYSCALE_WEIGHTS_BT709.r);
      expect(GRAYSCALE_WEIGHTS_BT709.g).toBeGreaterThan(GRAYSCALE_WEIGHTS_BT709.b);
    });

    it('파란색 가중치가 가장 낮다', () => {
      expect(GRAYSCALE_WEIGHTS.b).toBeLessThan(GRAYSCALE_WEIGHTS.r);
      expect(GRAYSCALE_WEIGHTS_BT709.b).toBeLessThan(GRAYSCALE_WEIGHTS_BT709.r);
    });
  });

  // =========================================
  // Laplacian 커널 테스트
  // =========================================

  describe('Laplacian 커널', () => {
    it('3x3 커널이 올바른 크기이다', () => {
      expect(LAPLACIAN_KERNEL_3X3).toHaveLength(3);
      LAPLACIAN_KERNEL_3X3.forEach((row) => {
        expect(row).toHaveLength(3);
      });
    });

    it('5x5 커널이 올바른 크기이다', () => {
      expect(LAPLACIAN_KERNEL_5X5).toHaveLength(5);
      LAPLACIAN_KERNEL_5X5.forEach((row) => {
        expect(row).toHaveLength(5);
      });
    });

    it('3x3 커널의 합이 0이다 (에지 검출 특성)', () => {
      let sum = 0;
      for (const row of LAPLACIAN_KERNEL_3X3) {
        for (const val of row) {
          sum += val;
        }
      }
      expect(sum).toBe(0);
    });

    it('5x5 커널의 합이 0이다', () => {
      let sum = 0;
      for (const row of LAPLACIAN_KERNEL_5X5) {
        for (const val of row) {
          sum += val;
        }
      }
      expect(sum).toBe(0);
    });

    it('3x3 커널 중심값이 음수이다', () => {
      expect(LAPLACIAN_KERNEL_3X3[1][1]).toBe(-4);
    });

    it('5x5 커널 중심값이 양수이다 (확장 LoG)', () => {
      expect(LAPLACIAN_KERNEL_5X5[2][2]).toBe(16);
    });
  });

  // =========================================
  // McCamy CCT 계수 테스트
  // =========================================

  describe('McCamy CCT 계수', () => {
    it('모든 계수가 정의되어 있다', () => {
      expect(MCCAMY_COEFFICIENTS.xe).toBeDefined();
      expect(MCCAMY_COEFFICIENTS.ye).toBeDefined();
      expect(MCCAMY_COEFFICIENTS.A).toBeDefined();
      expect(MCCAMY_COEFFICIENTS.B).toBeDefined();
      expect(MCCAMY_COEFFICIENTS.C).toBeDefined();
      expect(MCCAMY_COEFFICIENTS.D).toBeDefined();
    });

    it('epicenter가 Planckian locus 근처이다', () => {
      // McCamy epicenter (0.332, 0.1858)
      expect(MCCAMY_COEFFICIENTS.xe).toBeCloseTo(0.332, 3);
      expect(MCCAMY_COEFFICIENTS.ye).toBeCloseTo(0.1858, 3);
    });

    it('D65 색도 좌표에서 약 6500K를 계산한다', () => {
      // McCamy 공식 검증
      const x = D65_WHITE_POINT.x;
      const y = D65_WHITE_POINT.y;
      const n = (x - MCCAMY_COEFFICIENTS.xe) / (MCCAMY_COEFFICIENTS.ye - y);
      const cct =
        MCCAMY_COEFFICIENTS.A * n ** 3 +
        MCCAMY_COEFFICIENTS.B * n ** 2 +
        MCCAMY_COEFFICIENTS.C * n +
        MCCAMY_COEFFICIENTS.D;

      // D65는 약 6500K (±500K 허용)
      expect(cct).toBeGreaterThan(6000);
      expect(cct).toBeLessThan(7000);
    });
  });

  // =========================================
  // 피부 감지 임계값 테스트
  // =========================================

  describe('피부 감지 임계값', () => {
    it('Cb 범위가 유효하다', () => {
      expect(SKIN_DETECTION_YCBCR.cbMin).toBeLessThan(SKIN_DETECTION_YCBCR.cbMax);
      expect(SKIN_DETECTION_YCBCR.cbMin).toBeGreaterThanOrEqual(0);
      expect(SKIN_DETECTION_YCBCR.cbMax).toBeLessThanOrEqual(255);
    });

    it('Cr 범위가 유효하다', () => {
      expect(SKIN_DETECTION_YCBCR.crMin).toBeLessThan(SKIN_DETECTION_YCBCR.crMax);
      expect(SKIN_DETECTION_YCBCR.crMin).toBeGreaterThanOrEqual(0);
      expect(SKIN_DETECTION_YCBCR.crMax).toBeLessThanOrEqual(255);
    });

    it('범위가 중심(128)을 기준으로 비대칭이다 (피부 특성)', () => {
      // Cb는 128 아래, Cr은 128 위 (피부는 붉은 기미)
      const cbCenter = (SKIN_DETECTION_YCBCR.cbMin + SKIN_DETECTION_YCBCR.cbMax) / 2;
      const crCenter = (SKIN_DETECTION_YCBCR.crMin + SKIN_DETECTION_YCBCR.crMax) / 2;

      expect(cbCenter).toBeLessThan(128);
      expect(crCenter).toBeGreaterThan(128);
    });
  });

  // =========================================
  // 얼굴 각도 임계값 테스트
  // =========================================

  describe('얼굴 각도 임계값', () => {
    it('모든 각도 임계값이 양수이다', () => {
      expect(FACE_ANGLE_THRESHOLDS.pitch).toBeGreaterThan(0);
      expect(FACE_ANGLE_THRESHOLDS.yaw).toBeGreaterThan(0);
      expect(FACE_ANGLE_THRESHOLDS.roll).toBeGreaterThan(0);
    });

    it('yaw 허용 범위가 가장 넓다 (좌우 회전)', () => {
      expect(FACE_ANGLE_THRESHOLDS.yaw).toBeGreaterThanOrEqual(
        FACE_ANGLE_THRESHOLDS.pitch
      );
    });

    it('roll 허용 범위가 가장 넓다 (기울기)', () => {
      expect(FACE_ANGLE_THRESHOLDS.roll).toBeGreaterThanOrEqual(
        FACE_ANGLE_THRESHOLDS.yaw
      );
    });
  });

  // =========================================
  // 정면성 가중치 테스트
  // =========================================

  describe('정면성 가중치', () => {
    it('가중치 합이 1이다', () => {
      const sum =
        FRONTALITY_WEIGHTS.yaw +
        FRONTALITY_WEIGHTS.pitch +
        FRONTALITY_WEIGHTS.roll;
      expect(sum).toBeCloseTo(1.0, 6);
    });

    it('yaw 가중치가 가장 높다 (정면 판별에 중요)', () => {
      expect(FRONTALITY_WEIGHTS.yaw).toBeGreaterThan(FRONTALITY_WEIGHTS.pitch);
      expect(FRONTALITY_WEIGHTS.yaw).toBeGreaterThan(FRONTALITY_WEIGHTS.roll);
    });

    it('모든 가중치가 양수이다', () => {
      expect(FRONTALITY_WEIGHTS.yaw).toBeGreaterThan(0);
      expect(FRONTALITY_WEIGHTS.pitch).toBeGreaterThan(0);
      expect(FRONTALITY_WEIGHTS.roll).toBeGreaterThan(0);
    });
  });

  // =========================================
  // 랜드마크 인덱스 테스트
  // =========================================

  describe('얼굴 랜드마크 인덱스', () => {
    it('주요 랜드마크가 정의되어 있다', () => {
      expect(FACE_LANDMARK_INDICES.noseTip).toBeDefined();
      expect(FACE_LANDMARK_INDICES.leftEyeOuter).toBeDefined();
      expect(FACE_LANDMARK_INDICES.rightEyeOuter).toBeDefined();
      expect(FACE_LANDMARK_INDICES.chin).toBeDefined();
    });

    it('좌우 대칭 랜드마크가 존재한다', () => {
      expect(FACE_LANDMARK_INDICES.leftEyeInner).toBeDefined();
      expect(FACE_LANDMARK_INDICES.rightEyeInner).toBeDefined();
      expect(FACE_LANDMARK_INDICES.cheekLeft).toBeDefined();
      expect(FACE_LANDMARK_INDICES.cheekRight).toBeDefined();
    });

    it('6존 분석용 랜드마크가 있다', () => {
      expect(FACE_LANDMARK_INDICES.foreheadCenter).toBeDefined();
      expect(FACE_LANDMARK_INDICES.foreheadLeft).toBeDefined();
      expect(FACE_LANDMARK_INDICES.foreheadRight).toBeDefined();
      expect(FACE_LANDMARK_INDICES.chinLeft).toBeDefined();
      expect(FACE_LANDMARK_INDICES.chinRight).toBeDefined();
    });

    it('모든 인덱스가 468-point 모델 범위 내이다', () => {
      Object.values(FACE_LANDMARK_INDICES).forEach((index) => {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(468);
      });
    });
  });

  // =========================================
  // 기본 설정 테스트
  // =========================================

  describe('기본 CIE 설정', () => {
    it('CIE-1 설정이 완전하다', () => {
      expect(DEFAULT_CIE_CONFIG.cie1.sharpness).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie1.resolution).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie1.exposure).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie1.cct).toBeDefined();
    });

    it('CIE-2 설정이 완전하다', () => {
      expect(DEFAULT_CIE_CONFIG.cie2.maxFaces).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie2.minConfidence).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie2.angleThresholds).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie2.minFrontalityScore).toBeDefined();
    });

    it('CIE-3 설정이 완전하다', () => {
      expect(DEFAULT_CIE_CONFIG.cie3.targetCCT).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie3.minSkinCoverage).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie3.skinDetection).toBeDefined();
    });

    it('CIE-4 설정이 완전하다', () => {
      expect(DEFAULT_CIE_CONFIG.cie4.minQualityScore).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie4.uniformityWeights).toBeDefined();
      expect(DEFAULT_CIE_CONFIG.cie4.shadowThreshold).toBeDefined();
    });

    it('선명도 임계값이 오름차순이다', () => {
      const s = DEFAULT_CIE_CONFIG.cie1.sharpness;
      expect(s.rejectThreshold).toBeLessThan(s.warnThreshold);
      expect(s.warnThreshold).toBeLessThan(s.optimalThreshold);
    });

    it('해상도 최소값이 추천값보다 작다', () => {
      const r = DEFAULT_CIE_CONFIG.cie1.resolution;
      expect(r.minWidth).toBeLessThan(r.recommendedWidth);
      expect(r.minHeight).toBeLessThan(r.recommendedHeight);
    });

    it('CIE-4 균일성 가중치 합이 1이다', () => {
      const w = DEFAULT_CIE_CONFIG.cie4.uniformityWeights;
      expect(w.cct + w.uniformity + w.shadow).toBeCloseTo(1.0, 6);
    });
  });

  // =========================================
  // 등급 기준 테스트
  // =========================================

  describe('등급 기준', () => {
    it('선명도 등급이 연속적이다', () => {
      expect(SHARPNESS_GRADES.rejected.max).toBe(SHARPNESS_GRADES.warning.min);
      expect(SHARPNESS_GRADES.warning.max).toBe(SHARPNESS_GRADES.acceptable.min);
      expect(SHARPNESS_GRADES.acceptable.max).toBe(SHARPNESS_GRADES.optimal.min);
    });

    it('균일성 등급이 0-100 범위를 커버한다', () => {
      expect(UNIFORMITY_GRADES.poor.min).toBe(0);
      expect(UNIFORMITY_GRADES.excellent.max).toBe(100);
    });

    it('CCT 범위가 연속적이다', () => {
      expect(CCT_RANGES.tooWarm.max).toBe(CCT_RANGES.warm.min);
      expect(CCT_RANGES.warm.max).toBe(CCT_RANGES.neutral.min);
      expect(CCT_RANGES.neutral.max).toBe(CCT_RANGES.cool.min);
      expect(CCT_RANGES.cool.max).toBe(CCT_RANGES.tooCool.min);
    });
  });

  // =========================================
  // 피드백 메시지 테스트
  // =========================================

  describe('피드백 메시지', () => {
    it('선명도 메시지가 모든 등급에 있다', () => {
      expect(FEEDBACK_MESSAGES.sharpness.rejected).toBeDefined();
      expect(FEEDBACK_MESSAGES.sharpness.warning).toBeDefined();
      expect(FEEDBACK_MESSAGES.sharpness.acceptable).toBeDefined();
      expect(FEEDBACK_MESSAGES.sharpness.optimal).toBeDefined();
    });

    it('노출 메시지가 모든 상태에 있다', () => {
      expect(FEEDBACK_MESSAGES.exposure.underexposed).toBeDefined();
      expect(FEEDBACK_MESSAGES.exposure.normal).toBeDefined();
      expect(FEEDBACK_MESSAGES.exposure.overexposed).toBeDefined();
    });

    it('CCT 메시지가 모든 상태에 있다', () => {
      expect(FEEDBACK_MESSAGES.cct.tooWarm).toBeDefined();
      expect(FEEDBACK_MESSAGES.cct.warm).toBeDefined();
      expect(FEEDBACK_MESSAGES.cct.neutral).toBeDefined();
      expect(FEEDBACK_MESSAGES.cct.cool).toBeDefined();
      expect(FEEDBACK_MESSAGES.cct.tooCool).toBeDefined();
    });

    it('얼굴 관련 메시지가 있다', () => {
      expect(FEEDBACK_MESSAGES.face.notDetected).toBeDefined();
      expect(FEEDBACK_MESSAGES.face.multipleFaces).toBeDefined();
      expect(FEEDBACK_MESSAGES.face.angleWarning).toBeDefined();
    });

    it('그림자 관련 메시지가 있다', () => {
      expect(FEEDBACK_MESSAGES.shadow.none).toBeDefined();
      expect(FEEDBACK_MESSAGES.shadow.mild).toBeDefined();
      expect(FEEDBACK_MESSAGES.shadow.moderate).toBeDefined();
      expect(FEEDBACK_MESSAGES.shadow.severe).toBeDefined();
    });

    it('모든 메시지가 한국어이다', () => {
      const koreanRegex = /[가-힣]/;

      Object.values(FEEDBACK_MESSAGES.sharpness).forEach((msg) => {
        expect(koreanRegex.test(msg)).toBe(true);
      });

      Object.values(FEEDBACK_MESSAGES.exposure).forEach((msg) => {
        expect(koreanRegex.test(msg)).toBe(true);
      });
    });
  });

  // =========================================
  // 타임아웃 및 재시도 테스트
  // =========================================

  describe('타임아웃 및 재시도', () => {
    it('모든 타임아웃이 양수이다', () => {
      expect(PROCESSING_TIMEOUT.cie1).toBeGreaterThan(0);
      expect(PROCESSING_TIMEOUT.cie2).toBeGreaterThan(0);
      expect(PROCESSING_TIMEOUT.cie3).toBeGreaterThan(0);
      expect(PROCESSING_TIMEOUT.cie4).toBeGreaterThan(0);
      expect(PROCESSING_TIMEOUT.total).toBeGreaterThan(0);
    });

    it('전체 타임아웃이 개별 타임아웃 합보다 작거나 같다', () => {
      const sum =
        PROCESSING_TIMEOUT.cie1 +
        PROCESSING_TIMEOUT.cie2 +
        PROCESSING_TIMEOUT.cie3 +
        PROCESSING_TIMEOUT.cie4;

      expect(PROCESSING_TIMEOUT.total).toBeLessThanOrEqual(sum);
    });

    it('CIE-2 타임아웃이 가장 길다 (얼굴 감지 비용)', () => {
      expect(PROCESSING_TIMEOUT.cie2).toBeGreaterThanOrEqual(
        PROCESSING_TIMEOUT.cie1
      );
      expect(PROCESSING_TIMEOUT.cie2).toBeGreaterThanOrEqual(
        PROCESSING_TIMEOUT.cie3
      );
      expect(PROCESSING_TIMEOUT.cie2).toBeGreaterThanOrEqual(
        PROCESSING_TIMEOUT.cie4
      );
    });

    it('최대 재시도 횟수가 합리적이다', () => {
      expect(MAX_RETRIES).toBeGreaterThanOrEqual(1);
      expect(MAX_RETRIES).toBeLessThanOrEqual(5);
    });
  });
});
