/**
 * CIE-4 6존 분석 테스트
 *
 * @module tests/lib/image-engine/cie-4/zone-analyzer
 * @see lib/image-engine/cie-4/zone-analyzer.ts
 */
import { describe, it, expect } from 'vitest';
import {
  FACE_ZONES,
  calculateZoneBrightness,
  analyzeZoneBrightness,
  calculateUniformity,
  calculateLeftRightAsymmetry,
  calculateVerticalGradient,
  uniformityToScore,
} from '@/lib/image-engine/cie-4/zone-analyzer';
import type { RGBImageData, NormalizedRect } from '@/lib/image-engine/types';

// 테스트용 이미지 데이터 생성 헬퍼
function createTestImageData(
  width: number,
  height: number,
  fillBrightness: number
): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fillBrightness;
    data[i * 3 + 1] = fillBrightness;
    data[i * 3 + 2] = fillBrightness;
  }

  return { data, width, height, channels: 3 };
}

describe('FACE_ZONES', () => {
  it('6개 존 정의', () => {
    expect(FACE_ZONES).toHaveLength(6);
  });

  it('존이 전체 영역을 커버', () => {
    // x 방향: 0-0.5, 0.5-1.0
    expect(FACE_ZONES[0].xRatio + FACE_ZONES[0].widthRatio).toBe(0.5);
    expect(FACE_ZONES[1].xRatio).toBe(0.5);

    // y 방향: 0-0.33, 0.33-0.67, 0.67-1.0
    const totalHeight =
      FACE_ZONES[0].heightRatio +
      FACE_ZONES[2].heightRatio +
      FACE_ZONES[4].heightRatio;
    expect(totalHeight).toBeCloseTo(1.0, 2);
  });
});

describe('calculateZoneBrightness', () => {
  it('균일한 이미지의 밝기 계산', () => {
    const imageData = createTestImageData(100, 100, 128);
    const region = { x: 0, y: 0, width: 100, height: 100 };

    const brightness = calculateZoneBrightness(imageData, region);

    expect(brightness).toBeCloseTo(128, 0);
  });

  it('부분 영역의 밝기 계산', () => {
    const imageData = createTestImageData(100, 100, 200);
    const region = { x: 10, y: 10, width: 20, height: 20 };

    const brightness = calculateZoneBrightness(imageData, region);

    expect(brightness).toBeCloseTo(200, 0);
  });

  it('영역이 이미지 경계를 벗어나면 클리핑', () => {
    const imageData = createTestImageData(100, 100, 128);
    const region = { x: 80, y: 80, width: 50, height: 50 }; // 경계 초과

    const brightness = calculateZoneBrightness(imageData, region);

    // 에러 없이 계산 완료
    expect(brightness).toBeGreaterThanOrEqual(0);
    expect(brightness).toBeLessThanOrEqual(255);
  });

  it('빈 영역은 기본값 128 반환', () => {
    const imageData = createTestImageData(100, 100, 200);
    const region = { x: 0, y: 0, width: 0, height: 0 };

    const brightness = calculateZoneBrightness(imageData, region);

    expect(brightness).toBe(128);
  });
});

describe('analyzeZoneBrightness', () => {
  it('6개 존 밝기 배열 반환', () => {
    const imageData = createTestImageData(100, 100, 128);
    const faceRegion: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };

    const brightness = analyzeZoneBrightness(imageData, faceRegion);

    expect(brightness).toHaveLength(6);
    brightness.forEach((b) => {
      expect(b).toBeCloseTo(128, 0);
    });
  });

  it('범위 외 정규화 좌표는 클램핑', () => {
    const imageData = createTestImageData(100, 100, 128);
    const faceRegion: NormalizedRect = { x: -0.5, y: -0.5, width: 2, height: 2 };

    const brightness = analyzeZoneBrightness(imageData, faceRegion);

    expect(brightness).toHaveLength(6);
    // 에러 없이 완료
  });

  it('유효하지 않은 영역은 기본값 128 반환', () => {
    const imageData = createTestImageData(100, 100, 128);
    const faceRegion: NormalizedRect = { x: 0.5, y: 0.5, width: 0, height: 0 };

    const brightness = analyzeZoneBrightness(imageData, faceRegion);

    expect(brightness).toHaveLength(6);
    brightness.forEach((b) => {
      expect(b).toBe(128);
    });
  });
});

describe('calculateUniformity', () => {
  it('동일한 밝기는 완벽한 균일성(1)', () => {
    const zoneBrightness = [128, 128, 128, 128, 128, 128];
    const uniformity = calculateUniformity(zoneBrightness);

    expect(uniformity).toBe(1);
  });

  it('변동이 클수록 낮은 균일성', () => {
    const uniform = calculateUniformity([100, 100, 100, 100, 100, 100]);
    const varied = calculateUniformity([50, 100, 150, 200, 250, 100]);

    expect(uniform).toBeGreaterThan(varied);
  });

  it('빈 배열은 균일성 1 반환', () => {
    const uniformity = calculateUniformity([]);

    expect(uniformity).toBe(1);
  });

  it('균일성은 0-1 범위', () => {
    const uniformity = calculateUniformity([10, 50, 100, 150, 200, 250]);

    expect(uniformity).toBeGreaterThanOrEqual(0);
    expect(uniformity).toBeLessThanOrEqual(1);
  });

  it('평균이 0이면 균일성 1 반환', () => {
    const uniformity = calculateUniformity([0, 0, 0, 0, 0, 0]);

    expect(uniformity).toBe(1);
  });
});

describe('calculateLeftRightAsymmetry', () => {
  it('완벽한 대칭은 비대칭 0', () => {
    // 좌: [0][2][4], 우: [1][3][5]
    const zoneBrightness = [100, 100, 100, 100, 100, 100];
    const asymmetry = calculateLeftRightAsymmetry(zoneBrightness);

    expect(asymmetry).toBe(0);
  });

  it('좌우 차이가 클수록 높은 비대칭', () => {
    // 왼쪽 밝음: [0][2][4] = 200, 오른쪽 어두움: [1][3][5] = 100
    const zoneBrightness = [200, 100, 200, 100, 200, 100];
    const asymmetry = calculateLeftRightAsymmetry(zoneBrightness);

    expect(asymmetry).toBeGreaterThan(0);
    expect(asymmetry).toBeLessThanOrEqual(1);
  });

  it('6개가 아닌 배열은 0 반환', () => {
    const asymmetry = calculateLeftRightAsymmetry([100, 100, 100]);

    expect(asymmetry).toBe(0);
  });

  it('모든 값이 0이면 비대칭 0', () => {
    const asymmetry = calculateLeftRightAsymmetry([0, 0, 0, 0, 0, 0]);

    expect(asymmetry).toBe(0);
  });
});

describe('calculateVerticalGradient', () => {
  it('균일하면 그라디언트 0', () => {
    const zoneBrightness = [100, 100, 100, 100, 100, 100];
    const gradient = calculateVerticalGradient(zoneBrightness);

    expect(gradient).toBe(0);
  });

  it('위가 밝고 아래가 어두우면 음수', () => {
    // top: [0][1] = 200, bottom: [4][5] = 100
    const zoneBrightness = [200, 200, 150, 150, 100, 100];
    const gradient = calculateVerticalGradient(zoneBrightness);

    expect(gradient).toBeLessThan(0);
  });

  it('아래가 밝고 위가 어두우면 양수', () => {
    // top: [0][1] = 100, bottom: [4][5] = 200
    const zoneBrightness = [100, 100, 150, 150, 200, 200];
    const gradient = calculateVerticalGradient(zoneBrightness);

    expect(gradient).toBeGreaterThan(0);
  });

  it('6개가 아닌 배열은 0 반환', () => {
    const gradient = calculateVerticalGradient([100, 100]);

    expect(gradient).toBe(0);
  });
});

describe('uniformityToScore', () => {
  it('완벽한 균일성(1.0)은 100점', () => {
    expect(uniformityToScore(1.0)).toBe(100);
  });

  it('높은 균일성(0.9)은 100점', () => {
    expect(uniformityToScore(0.9)).toBe(100);
  });

  it('좋은 균일성(0.8)은 80점 이상', () => {
    expect(uniformityToScore(0.8)).toBeGreaterThanOrEqual(80);
  });

  it('중간 균일성(0.6)은 50점 이상', () => {
    expect(uniformityToScore(0.6)).toBeGreaterThanOrEqual(50);
  });

  it('낮은 균일성(0.3)은 50점 미만', () => {
    expect(uniformityToScore(0.3)).toBeLessThan(50);
  });

  it('균일성 0은 0점', () => {
    expect(uniformityToScore(0)).toBe(0);
  });
});
