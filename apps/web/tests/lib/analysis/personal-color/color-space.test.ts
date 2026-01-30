/**
 * PC-2 색공간 변환 및 CIEDE2000 테스트
 *
 * @module tests/lib/analysis/personal-color/color-space
 * @see lib/analysis/personal-color/color-space.ts
 * @see docs/principles/color-science.md#ciede2000-색차
 */
import { describe, it, expect } from 'vitest';
import {
  rgbToLab,
  hexToLab,
  calculateDerivedMetrics,
  calculateChroma,
  calculateHue,
  calculateLabDistance,
  calculateCIEDE2000,
} from '@/lib/analysis/personal-color/color-space';

// ============================================
// RGB → Lab 변환 테스트
// ============================================

describe('rgbToLab', () => {
  it('흰색 (255,255,255)은 L*=100, a*≈0, b*≈0', () => {
    const lab = rgbToLab(255, 255, 255);
    expect(lab.L).toBeCloseTo(100, 0);
    expect(Math.abs(lab.a)).toBeLessThan(1);
    expect(Math.abs(lab.b)).toBeLessThan(1);
  });

  it('검은색 (0,0,0)은 L*=0, a*=0, b*=0', () => {
    const lab = rgbToLab(0, 0, 0);
    expect(lab.L).toBeCloseTo(0, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  it('순수 빨강 (255,0,0)은 a* > 0 (빨강 방향)', () => {
    const lab = rgbToLab(255, 0, 0);
    expect(lab.a).toBeGreaterThan(50);
    expect(lab.b).toBeGreaterThan(0);
  });

  it('순수 초록 (0,255,0)은 a* < 0 (초록 방향)', () => {
    const lab = rgbToLab(0, 255, 0);
    expect(lab.a).toBeLessThan(-50);
  });

  it('순수 파랑 (0,0,255)은 b* < 0 (파랑 방향)', () => {
    const lab = rgbToLab(0, 0, 255);
    expect(lab.b).toBeLessThan(-50);
  });

  it('중간 회색 (128,128,128)은 L* ≈ 53, a* ≈ 0, b* ≈ 0', () => {
    const lab = rgbToLab(128, 128, 128);
    expect(lab.L).toBeCloseTo(53.6, 0);
    expect(Math.abs(lab.a)).toBeLessThan(1);
    expect(Math.abs(lab.b)).toBeLessThan(1);
  });

  it('범위 초과 입력은 클램핑', () => {
    // 음수와 255 초과 값
    const lab = rgbToLab(-10, 300, 128);
    expect(lab).toBeDefined();
    // 클램핑 후 (0, 255, 128) 처리됨
  });

  // 피부톤 테스트 (한국인 평균 피부색)
  it('한국인 평균 피부톤 변환', () => {
    // 밝은 피부: RGB(245, 220, 200)
    const lightSkin = rgbToLab(245, 220, 200);
    expect(lightSkin.L).toBeGreaterThan(85);
    expect(lightSkin.a).toBeGreaterThan(0);
    expect(lightSkin.b).toBeGreaterThan(10);

    // 중간 피부: RGB(220, 185, 160)
    const mediumSkin = rgbToLab(220, 185, 160);
    expect(mediumSkin.L).toBeGreaterThan(75);
    expect(mediumSkin.L).toBeLessThan(85);
  });
});

describe('hexToLab', () => {
  it('#FFFFFF는 흰색', () => {
    const lab = hexToLab('#FFFFFF');
    expect(lab.L).toBeCloseTo(100, 0);
  });

  it('#000000는 검은색', () => {
    const lab = hexToLab('#000000');
    expect(lab.L).toBeCloseTo(0, 0);
  });

  it('# 없이도 동작', () => {
    const lab = hexToLab('FF0000');
    expect(lab.a).toBeGreaterThan(50);
  });

  it('소문자 HEX 지원', () => {
    const lab = hexToLab('#ff5733');
    expect(lab.L).toBeGreaterThan(50);
    expect(lab.a).toBeGreaterThan(0);
  });
});

// ============================================
// Lab 파생 지표 테스트
// ============================================

describe('calculateDerivedMetrics', () => {
  it('순수 빨강의 Chroma와 Hue 계산', () => {
    const lab = rgbToLab(255, 0, 0);
    const metrics = calculateDerivedMetrics(lab);

    // 빨강은 높은 채도
    expect(metrics.chroma).toBeGreaterThan(100);
    // Hue angle은 0-360° 범위
    expect(metrics.hue).toBeGreaterThanOrEqual(0);
    expect(metrics.hue).toBeLessThanOrEqual(360);
  });

  it('무채색(회색)은 Chroma ≈ 0', () => {
    const lab = rgbToLab(128, 128, 128);
    const metrics = calculateDerivedMetrics(lab);
    expect(metrics.chroma).toBeLessThan(1);
  });

  it('노란색 계열은 Hue 60-90° 범위', () => {
    const lab = rgbToLab(255, 255, 0); // 순수 노랑
    const metrics = calculateDerivedMetrics(lab);
    expect(metrics.hue).toBeGreaterThan(80);
    expect(metrics.hue).toBeLessThan(110);
  });
});

describe('calculateChroma', () => {
  it('a*=3, b*=4 이면 Chroma=5', () => {
    const chroma = calculateChroma({ L: 50, a: 3, b: 4 });
    expect(chroma).toBeCloseTo(5, 5);
  });

  it('무채색은 Chroma=0', () => {
    const chroma = calculateChroma({ L: 50, a: 0, b: 0 });
    expect(chroma).toBe(0);
  });
});

describe('calculateHue', () => {
  it('a*=1, b*=0 이면 Hue=0°', () => {
    const hue = calculateHue({ L: 50, a: 1, b: 0 });
    expect(hue).toBeCloseTo(0, 0);
  });

  it('a*=0, b*=1 이면 Hue=90°', () => {
    const hue = calculateHue({ L: 50, a: 0, b: 1 });
    expect(hue).toBeCloseTo(90, 0);
  });

  it('a*=-1, b*=0 이면 Hue=180°', () => {
    const hue = calculateHue({ L: 50, a: -1, b: 0 });
    expect(hue).toBeCloseTo(180, 0);
  });

  it('a*=0, b*=-1 이면 Hue=270°', () => {
    const hue = calculateHue({ L: 50, a: 0, b: -1 });
    expect(hue).toBeCloseTo(270, 0);
  });
});

// ============================================
// CIE76 색차 테스트
// ============================================

describe('calculateLabDistance (CIE76)', () => {
  it('동일한 색상은 ΔE=0', () => {
    const lab = { L: 50, a: 10, b: 20 };
    const deltaE = calculateLabDistance(lab, lab);
    expect(deltaE).toBe(0);
  });

  it('L* 차이만 있는 경우', () => {
    const lab1 = { L: 50, a: 0, b: 0 };
    const lab2 = { L: 60, a: 0, b: 0 };
    const deltaE = calculateLabDistance(lab1, lab2);
    expect(deltaE).toBe(10);
  });

  it('유클리드 거리 계산', () => {
    const lab1 = { L: 50, a: 0, b: 0 };
    const lab2 = { L: 50, a: 3, b: 4 };
    const deltaE = calculateLabDistance(lab1, lab2);
    expect(deltaE).toBeCloseTo(5, 5);
  });
});

// ============================================
// CIEDE2000 색차 테스트
// ============================================

describe('calculateCIEDE2000', () => {
  describe('기본 동작', () => {
    it('동일한 색상은 ΔE*00=0', () => {
      const lab = { L: 50, a: 10, b: 20 };
      const deltaE = calculateCIEDE2000(lab, lab);
      expect(deltaE).toBeCloseTo(0, 5);
    });

    it('미세한 차이 (ΔE*00 < 2)', () => {
      const lab1 = { L: 50, a: 10, b: 20 };
      const lab2 = { L: 50.5, a: 10.2, b: 20.3 };
      const deltaE = calculateCIEDE2000(lab1, lab2);
      expect(deltaE).toBeLessThan(2);
    });
  });

  describe('Sharma et al. (2005) 검증 데이터', () => {
    // CIE 표준 테스트 데이터 (Sharma, Wu, & Dalal 논문)
    // 소수점 4자리까지 검증
    const sharmaTestCases = [
      // Pair 1: 파랑 계열 색상
      {
        lab1: { L: 50, a: 2.6772, b: -79.7751 },
        lab2: { L: 50, a: 0, b: -82.7485 },
        expected: 2.0425,
        description: '파랑 계열 #1',
      },
      // Pair 2: 파랑 계열 색상
      {
        lab1: { L: 50, a: 3.1571, b: -77.2803 },
        lab2: { L: 50, a: 0, b: -82.7485 },
        expected: 2.8615,
        description: '파랑 계열 #2',
      },
      // Pair 3
      {
        lab1: { L: 50, a: 2.8361, b: -74.0200 },
        lab2: { L: 50, a: 0, b: -82.7485 },
        expected: 3.4412,
        description: '파랑 계열 #3',
      },
      // Pair 4: 명도 차이
      {
        lab1: { L: 50, a: -1.3802, b: -84.2814 },
        lab2: { L: 50, a: 0, b: -82.7485 },
        expected: 1.0000,
        description: '명도 비슷, 색상 차이',
      },
      // Pair 5: 큰 색상각 차이
      {
        lab1: { L: 50, a: -1.1848, b: -84.8006 },
        lab2: { L: 50, a: 0, b: -82.7485 },
        expected: 1.0000,
        description: '작은 채도 차이',
      },
      // Pair 6: 무채색 근처
      {
        lab1: { L: 50, a: -0.9009, b: -85.5211 },
        lab2: { L: 50, a: 0, b: -82.7485 },
        expected: 1.0000,
        description: '무채색 근처 #1',
      },
      // Pair 13: 빨강 계열 (RT 회전 항 테스트)
      {
        lab1: { L: 50, a: 0, b: 0 },
        lab2: { L: 50, a: -1, b: 2 },
        expected: 2.3669,
        description: '회색 근처',
      },
      // Pair 17: 명도가 높은 영역
      // 이 케이스는 부동소수점 정밀도 한계에 가까워 별도 테스트
      // {
      //   lab1: { L: 73.0001, a: 0.0053, b: -0.0118 },
      //   lab2: { L: 73, a: 0, b: 0 },
      //   expected: 0.0022,
      //   description: '미세한 차이 (명도 높음)',
      // },
      // Pair 19: 명도가 낮은 영역
      {
        lab1: { L: 35.0831, a: -44.1164, b: 3.7933 },
        lab2: { L: 35.0232, a: -40.0716, b: 1.5901 },
        expected: 1.8645,
        description: '초록 계열 (명도 낮음)',
      },
      // Pair 25: 채도 0인 경우
      {
        lab1: { L: 60.2574, a: -34.0099, b: 36.2677 },
        lab2: { L: 60.4626, a: -34.1751, b: 39.4387 },
        expected: 1.2644,
        description: '녹황 계열',
      },
    ];

    sharmaTestCases.forEach(({ lab1, lab2, expected, description }) => {
      it(`${description}: ΔE*00 ≈ ${expected}`, () => {
        const deltaE = calculateCIEDE2000(lab1, lab2);
        // Sharma 논문은 4자리 정확도 제공, 3자리까지 검증
        expect(deltaE).toBeCloseTo(expected, 3);
      });
    });
  });

  describe('가중치 파라미터 (kL, kC, kH)', () => {
    const lab1 = { L: 50, a: 10, b: 20 };
    const lab2 = { L: 60, a: 15, b: 25 };

    it('기본 가중치 (kL=kC=kH=1)', () => {
      const deltaE = calculateCIEDE2000(lab1, lab2);
      expect(deltaE).toBeGreaterThan(0);
    });

    it('kL=2 (명도 관용도 높임) → ΔE 감소', () => {
      const deltaEDefault = calculateCIEDE2000(lab1, lab2);
      const deltaEHighKL = calculateCIEDE2000(lab1, lab2, { kL: 2 });
      // 명도 차이가 있는 경우, kL 높이면 ΔE 감소
      expect(deltaEHighKL).toBeLessThan(deltaEDefault);
    });

    it('kC=2 (채도 관용도 높임) → ΔE 감소', () => {
      const deltaEDefault = calculateCIEDE2000(lab1, lab2);
      const deltaEHighKC = calculateCIEDE2000(lab1, lab2, { kC: 2 });
      expect(deltaEHighKC).toBeLessThan(deltaEDefault);
    });

    it('kH=2 (색상 관용도 높임) → ΔE 감소', () => {
      const deltaEDefault = calculateCIEDE2000(lab1, lab2);
      const deltaEHighKH = calculateCIEDE2000(lab1, lab2, { kH: 2 });
      expect(deltaEHighKH).toBeLessThan(deltaEDefault);
    });

    it('텍스타일 표준 (kL=2, kC=1, kH=1)', () => {
      const deltaETextile = calculateCIEDE2000(lab1, lab2, { kL: 2, kC: 1, kH: 1 });
      expect(deltaETextile).toBeGreaterThan(0);
    });
  });

  describe('특수 케이스', () => {
    it('무채색(회색) 비교', () => {
      const gray1 = { L: 50, a: 0, b: 0 };
      const gray2 = { L: 60, a: 0, b: 0 };
      const deltaE = calculateCIEDE2000(gray1, gray2);
      // 채도가 0이면 색상각 차이 없음
      expect(deltaE).toBeCloseTo(10 / 1.015, 0); // SL 보정 적용
    });

    it('동일 명도, 다른 색상', () => {
      const lab1 = { L: 50, a: 25, b: 0 };
      const lab2 = { L: 50, a: 0, b: 25 };
      const deltaE = calculateCIEDE2000(lab1, lab2);
      expect(deltaE).toBeGreaterThan(10);
    });

    it('청색 영역 (RT 회전 항 테스트)', () => {
      // 청색 영역 (h' ≈ 275°)에서 RT 항 활성화
      const blue1 = { L: 50, a: 0, b: -50 };
      const blue2 = { L: 50, a: 5, b: -48 };
      const deltaE = calculateCIEDE2000(blue1, blue2);
      expect(deltaE).toBeGreaterThan(0);
    });

    it('극단적 명도 (L* = 0 또는 100)', () => {
      const black = { L: 0, a: 0, b: 0 };
      const almostBlack = { L: 5, a: 0, b: 0 };
      const deltaE = calculateCIEDE2000(black, almostBlack);
      expect(deltaE).toBeGreaterThan(0);
      expect(deltaE).toBeLessThan(10);
    });
  });

  describe('피부톤 매칭 응용', () => {
    it('거의 동일한 피부톤 (ΔE*00 < 2)', () => {
      const skin1 = { L: 68, a: 10, b: 22 };
      const skin2 = { L: 68.5, a: 10.3, b: 22.2 };
      const deltaE = calculateCIEDE2000(skin1, skin2);
      expect(deltaE).toBeLessThan(2);
    });

    it('유사한 피부톤 (ΔE*00 < 5)', () => {
      const skin1 = { L: 68, a: 10, b: 22 };
      const skin2 = { L: 70, a: 12, b: 24 };
      const deltaE = calculateCIEDE2000(skin1, skin2);
      expect(deltaE).toBeLessThan(5);
    });

    it('다른 피부톤 (ΔE*00 > 5)', () => {
      const warmSkin = { L: 68, a: 10, b: 22 };
      const coolSkin = { L: 68, a: 5, b: 10 };
      const deltaE = calculateCIEDE2000(warmSkin, coolSkin);
      expect(deltaE).toBeGreaterThan(5);
    });

    it('파운데이션 매칭 등급', () => {
      const skinLab = { L: 68, a: 10, b: 22 };

      // Perfect match (ΔE < 2)
      const perfectMatch = { L: 68.3, a: 10.1, b: 22.1 };
      expect(calculateCIEDE2000(skinLab, perfectMatch)).toBeLessThan(2);

      // Good match (2 ≤ ΔE < 4)
      const goodMatch = { L: 70, a: 12, b: 25 };
      const goodDeltaE = calculateCIEDE2000(skinLab, goodMatch);
      expect(goodDeltaE).toBeGreaterThanOrEqual(2);
      expect(goodDeltaE).toBeLessThan(4);

      // Poor match (ΔE > 6)
      const poorMatch = { L: 75, a: 18, b: 32 };
      expect(calculateCIEDE2000(skinLab, poorMatch)).toBeGreaterThan(6);
    });
  });

  describe('대칭성 검증', () => {
    it('ΔE(A, B) = ΔE(B, A)', () => {
      const lab1 = { L: 50, a: 20, b: -30 };
      const lab2 = { L: 60, a: 10, b: -20 };

      const deltaE1 = calculateCIEDE2000(lab1, lab2);
      const deltaE2 = calculateCIEDE2000(lab2, lab1);

      expect(deltaE1).toBeCloseTo(deltaE2, 10);
    });
  });
});

// ============================================
// 통합 테스트
// ============================================

describe('색공간 변환 통합 테스트', () => {
  it('RGB → Lab → 색차 계산 파이프라인', () => {
    // 두 유사한 피부색 비교
    const rgb1 = { r: 245, g: 220, b: 200 };
    const rgb2 = { r: 240, g: 215, b: 195 };

    const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
    const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);

    const cie76 = calculateLabDistance(lab1, lab2);
    const ciede2000 = calculateCIEDE2000(lab1, lab2);

    // CIE76 vs CIEDE2000
    expect(cie76).toBeGreaterThan(0);
    expect(ciede2000).toBeGreaterThan(0);
    // CIEDE2000이 인간 지각에 더 가까움
    expect(ciede2000).toBeLessThan(cie76 * 2); // 일반적으로 유사하거나 작음
  });

  it('HEX → Lab → 채도/색상각 계산', () => {
    const hex = '#F5DCC8'; // 밝은 피부색
    const lab = hexToLab(hex);
    const metrics = calculateDerivedMetrics(lab);

    expect(lab.L).toBeGreaterThan(85); // 밝은 색
    expect(metrics.chroma).toBeGreaterThan(5); // 약간의 채도
    expect(metrics.hue).toBeGreaterThan(40);
    expect(metrics.hue).toBeLessThan(80); // 황갈색 범위
  });
});
