/**
 * MediaPipe Pose 33 landmarks test
 */

import { describe, it, expect } from "vitest";
import {
  LANDMARK_INDEX,
  ESSENTIAL_LANDMARKS,
  isReliableLandmark,
  areEssentialLandmarksReliable,
  estimateShoulderWidth,
  estimateHipWidth,
  estimateWaistPosition,
  estimateWaistWidth,
  estimateUpperBodyLength,
  estimateLowerBodyLength,
  estimateTotalHeight,
  calculatePixelToCmRatio,
  estimateHeadSizePixels,
  extractLandmarkMeasurements,
  calculateBodyProportions,
  convertMeasurementsToCm,
} from "@/lib/body";
import type { PoseLandmark } from "@/lib/body";

function createMockLandmark(x: number, y: number, z: number = 0, v: number = 0.9, p: number = 0.9): PoseLandmark {
  return { x, y, z, visibility: v, presence: p };
}

function createMockLandmarks(reliable: boolean = true): PoseLandmark[] {
  const v = reliable ? 0.9 : 0.3;
  const p = reliable ? 0.9 : 0.3;
  return [
    createMockLandmark(0.5, 0.1, 0, v, p), createMockLandmark(0.48, 0.08, 0, v, p), createMockLandmark(0.46, 0.08, 0, v, p),
    createMockLandmark(0.44, 0.08, 0, v, p), createMockLandmark(0.52, 0.08, 0, v, p), createMockLandmark(0.54, 0.08, 0, v, p),
    createMockLandmark(0.56, 0.08, 0, v, p), createMockLandmark(0.4, 0.1, 0, v, p), createMockLandmark(0.6, 0.1, 0, v, p),
    createMockLandmark(0.48, 0.12, 0, v, p), createMockLandmark(0.52, 0.12, 0, v, p),
    createMockLandmark(0.35, 0.25, 0, v, p), createMockLandmark(0.65, 0.25, 0, v, p),
    createMockLandmark(0.3, 0.4, 0, v, p), createMockLandmark(0.7, 0.4, 0, v, p),
    createMockLandmark(0.28, 0.55, 0, v, p), createMockLandmark(0.72, 0.55, 0, v, p),
    createMockLandmark(0.26, 0.58, 0, v, p), createMockLandmark(0.74, 0.58, 0, v, p),
    createMockLandmark(0.27, 0.57, 0, v, p), createMockLandmark(0.73, 0.57, 0, v, p),
    createMockLandmark(0.29, 0.56, 0, v, p), createMockLandmark(0.71, 0.56, 0, v, p),
    createMockLandmark(0.4, 0.5, 0, v, p), createMockLandmark(0.6, 0.5, 0, v, p),
    createMockLandmark(0.4, 0.7, 0, v, p), createMockLandmark(0.6, 0.7, 0, v, p),
    createMockLandmark(0.4, 0.9, 0, v, p), createMockLandmark(0.6, 0.9, 0, v, p),
    createMockLandmark(0.38, 0.92, 0, v, p), createMockLandmark(0.62, 0.92, 0, v, p),
    createMockLandmark(0.42, 0.93, 0, v, p), createMockLandmark(0.58, 0.93, 0, v, p),
  ];
}

describe("LANDMARK_INDEX", () => {
  it("should have 33 landmarks defined", () => {
    expect(Object.values(LANDMARK_INDEX).length).toBe(33);
  });
  it("should have correct key landmark indices", () => {
    expect(LANDMARK_INDEX.LEFT_SHOULDER).toBe(11);
    expect(LANDMARK_INDEX.RIGHT_SHOULDER).toBe(12);
    expect(LANDMARK_INDEX.LEFT_HIP).toBe(23);
    expect(LANDMARK_INDEX.RIGHT_HIP).toBe(24);
  });
});

describe("ESSENTIAL_LANDMARKS", () => {
  it("should contain 8 essential landmarks", () => {
    expect(ESSENTIAL_LANDMARKS.length).toBe(8);
  });
});

describe("isReliableLandmark", () => {
  it("should return true when visibility and presence > 0.5", () => {
    expect(isReliableLandmark(createMockLandmark(0.5, 0.5, 0, 0.9, 0.9))).toBe(true);
  });
  it("should return false when visibility <= 0.5", () => {
    expect(isReliableLandmark(createMockLandmark(0.5, 0.5, 0, 0.3, 0.9))).toBe(false);
  });
});

describe("areEssentialLandmarksReliable", () => {
  it("should return true when all essential landmarks are reliable", () => {
    expect(areEssentialLandmarksReliable(createMockLandmarks(true))).toBe(true);
  });
  it("should return false when any essential landmark is unreliable", () => {
    const landmarks = createMockLandmarks(true);
    landmarks[11] = createMockLandmark(0.35, 0.25, 0, 0.3, 0.3);
    expect(areEssentialLandmarksReliable(landmarks)).toBe(false);
  });
});

describe("estimateShoulderWidth", () => {
  it("should calculate shoulder width correctly", () => {
    expect(estimateShoulderWidth(createMockLandmarks(true))).toBeCloseTo(0.3, 2);
  });
  it("should throw error when landmarks are unreliable", () => {
    expect(() => estimateShoulderWidth(createMockLandmarks(false))).toThrow();
  });
});

describe("estimateHipWidth", () => {
  it("should calculate hip width correctly", () => {
    expect(estimateHipWidth(createMockLandmarks(true))).toBeCloseTo(0.2, 2);
  });
});

describe("estimateWaistPosition", () => {
  it("should calculate waist position at 60% from shoulder to hip", () => {
    const position = estimateWaistPosition(createMockLandmarks(true));
    expect(position.x).toBeCloseTo(0.5, 2);
    expect(position.y).toBeCloseTo(0.4, 2);
  });
});

describe("estimateWaistWidth", () => {
  it("should estimate waist width as 80% of hip width", () => {
    expect(estimateWaistWidth(createMockLandmarks(true))).toBeCloseTo(0.16, 2);
  });
});

describe("estimateUpperBodyLength", () => {
  it("should calculate upper body length correctly", () => {
    expect(estimateUpperBodyLength(createMockLandmarks(true))).toBeCloseTo(0.25, 2);
  });
});

describe("estimateLowerBodyLength", () => {
  it("should calculate lower body length (hip to ankle)", () => {
    expect(estimateLowerBodyLength(createMockLandmarks(true), "left")).toBeCloseTo(0.4, 2);
  });
});

describe("estimateTotalHeight", () => {
  it("should estimate total height with head correction", () => {
    expect(estimateTotalHeight(createMockLandmarks(true))).toBeCloseTo(0.88, 2);
  });
});

describe("calculatePixelToCmRatio", () => {
  it("should calculate ratio based on height", () => {
    expect(calculatePixelToCmRatio({ referenceType: "height", heightCm: 170, totalHeightPixels: 1000 })).toBe(0.17);
  });
  it("should calculate ratio based on head size", () => {
    expect(calculatePixelToCmRatio({ referenceType: "head", headSizePixels: 100, headSizeCm: 22 })).toBe(0.22);
  });
});

describe("estimateHeadSizePixels", () => {
  it("should estimate head size from ear distance", () => {
    expect(estimateHeadSizePixels(createMockLandmarks(true))).toBeCloseTo(0.24, 2);
  });
});

describe("extractLandmarkMeasurements", () => {
  it("should extract all measurements correctly", () => {
    const m = extractLandmarkMeasurements(createMockLandmarks(true));
    expect(m.shoulderWidth).toBeCloseTo(0.3, 2);
    expect(m.hipWidth).toBeCloseTo(0.2, 2);
    expect(m.waistWidth).toBeCloseTo(0.16, 2);
  });
  it("should throw error when essential landmarks are unreliable", () => {
    expect(() => extractLandmarkMeasurements(createMockLandmarks(false))).toThrow();
  });
});

describe("calculateBodyProportions", () => {
  it("should calculate body proportions correctly", () => {
    const p = calculateBodyProportions(createMockLandmarks(true));
    expect(p.shr).toBe(1.5);
    expect(p.upperLowerRatio).toBeCloseTo(0.63, 1);
    expect(p.estimatedWaistHipRatio).toBe(0.8);
  });
});

describe("convertMeasurementsToCm", () => {
  it("should convert pixel measurements to cm", () => {
    const measurements = { shoulderWidth: 300, hipWidth: 200, waistWidth: 160, waistPosition: { x: 500, y: 400 }, upperBodyLength: 250, lowerBodyLength: 400, totalHeight: 880 };
    const cm = convertMeasurementsToCm(measurements, 0.17);
    expect(cm.shoulderWidthCm).toBeCloseTo(51, 0);
    expect(cm.hipWidthCm).toBeCloseTo(34, 0);
  });
});

describe("Integration with WHR/SHR functions", () => {
  it("should provide SHR compatible with classifySHR", () => {
    expect(calculateBodyProportions(createMockLandmarks(true)).shr).toBeGreaterThan(1.1);
  });
  it("should provide estimated WHR for reference", () => {
    expect(calculateBodyProportions(createMockLandmarks(true)).estimatedWaistHipRatio).toBeLessThan(1);
  });
});
