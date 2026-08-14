/**
 * 상품 색상 분류 테스트
 *
 * @see docs/adr/ADR-034-product-color-classification.md
 * @see docs/principles/color-science.md
 */

import { describe, it, expect } from 'vitest';
import {
  rgbToLab,
  labToRgb,
  rgbToHex,
  hexToRgb,
  labDistanceCIE76,
  getChroma,
  getHue,
} from '@/lib/color-classification/color-utils';
import { kMeansClustering, hashPixelsToSeed } from '@/lib/color-classification/extract-colors';
import {
  isBackgroundColor,
  filterBackgroundColors,
  calculateBackgroundRatio,
} from '@/lib/color-classification/background-filter';
import {
  classifyTone,
  classifyToneWithConfidence,
  calculateWarmRatio,
} from '@/lib/color-classification/tone-classifier';
import {
  calculateSeasonMatch,
  getBestSeasonMatch,
  getMatchGrade,
  getSeasonCompatibility,
} from '@/lib/color-classification/season-matcher';
import { classifyFromPixels } from '@/lib/color-classification';
import type { RGBColor, LabColor } from '@/lib/color-classification';
import { createSeededRandom } from '@/lib/utils/seeded-random';

/**
 * 결정론적 픽셀 블롭 생성 (테스트 픽스처)
 *
 * 왜 전역 난수를 쓰지 않나: 픽셀이 실행마다 달라지면 K-means 대표색도 흔들려
 * `seasonMatch.spring > 50` 같은 임계 단언이 경계를 넘나든다
 * (실측: 20회 중 5회 "expected 49 to be greater than 50" 실패).
 * 시드 PRNG로 "항상 같은 픽셀"을 만들어 재현성을 확보한다.
 *
 * 참고: 프로덕션 K-means도 이제 입력 픽셀에서 파생한 시드로 초기화한다
 * (extract-colors.ts `hashPixelsToSeed`). 그래도 블롭 범위는 "어느 클러스터가
 * 대표색이 되어도 판정이 같은" 좁은 영역으로 유지한다 — 판정이 초기화 운에
 * 기대지 않아야 알고리즘 튜닝 시에도 단언이 깨지지 않는다.
 *
 * @param seed - 시드 문자열 (같은 시드 = 같은 픽셀)
 * @param base - 블롭 중심 RGB
 * @param spread - 채널별 반경 (base ± spread)
 * @param count - 픽셀 수
 */
function makePixelBlob(
  seed: string,
  base: RGBColor,
  spread: RGBColor,
  count: number = 100
): RGBColor[] {
  const rand = createSeededRandom(seed);
  const jitter = (radius: number): number => Math.round((rand() - 0.5) * 2 * radius);

  return Array.from({ length: count }, () => ({
    r: base.r + jitter(spread.r),
    g: base.g + jitter(spread.g),
    b: base.b + jitter(spread.b),
  }));
}

describe('Color Classification', () => {
  // ==========================================================================
  // color-utils.ts
  // ==========================================================================
  describe('color-utils', () => {
    describe('rgbToLab / labToRgb', () => {
      it('should convert RGB to Lab correctly', () => {
        // 흰색
        const whiteLab = rgbToLab({ r: 255, g: 255, b: 255 });
        expect(whiteLab.L).toBeCloseTo(100, 0);
        expect(whiteLab.a).toBeCloseTo(0, 0);
        expect(whiteLab.b).toBeCloseTo(0, 0);

        // 검정색
        const blackLab = rgbToLab({ r: 0, g: 0, b: 0 });
        expect(blackLab.L).toBeCloseTo(0, 0);
      });

      it('should roundtrip RGB → Lab → RGB', () => {
        const original: RGBColor = { r: 200, g: 100, b: 50 };
        const lab = rgbToLab(original);
        const restored = labToRgb(lab);

        expect(restored.r).toBeCloseTo(original.r, 0);
        expect(restored.g).toBeCloseTo(original.g, 0);
        expect(restored.b).toBeCloseTo(original.b, 0);
      });
    });

    describe('rgbToHex / hexToRgb', () => {
      it('should convert RGB to Hex', () => {
        expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
        expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
        expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
      });

      it('should convert Hex to RGB', () => {
        const rgb = hexToRgb('#ff8800');
        expect(rgb.r).toBe(255);
        expect(rgb.g).toBe(136);
        expect(rgb.b).toBe(0);
      });
    });

    describe('labDistanceCIE76', () => {
      it('should calculate distance between two Lab colors', () => {
        const lab1: LabColor = { L: 50, a: 0, b: 0 };
        const lab2: LabColor = { L: 50, a: 10, b: 0 };

        const distance = labDistanceCIE76(lab1, lab2);
        expect(distance).toBe(10);
      });

      it('should return 0 for identical colors', () => {
        const lab: LabColor = { L: 50, a: 20, b: 30 };
        expect(labDistanceCIE76(lab, lab)).toBe(0);
      });
    });

    describe('getChroma / getHue', () => {
      it('should calculate chroma correctly', () => {
        const lab: LabColor = { L: 50, a: 30, b: 40 };
        expect(getChroma(lab)).toBe(50); // sqrt(30^2 + 40^2) = 50
      });

      it('should calculate hue angle correctly', () => {
        // a+ 방향 = 0도
        expect(getHue({ L: 50, a: 10, b: 0 })).toBeCloseTo(0, 0);

        // b+ 방향 = 90도
        expect(getHue({ L: 50, a: 0, b: 10 })).toBeCloseTo(90, 0);

        // a- 방향 = 180도
        expect(getHue({ L: 50, a: -10, b: 0 })).toBeCloseTo(180, 0);
      });
    });
  });

  // ==========================================================================
  // extract-colors.ts
  // ==========================================================================
  describe('extract-colors', () => {
    describe('kMeansClustering', () => {
      it('should cluster pixels into k groups', () => {
        const pixels: RGBColor[] = [
          // 빨간색 그룹
          { r: 255, g: 0, b: 0 },
          { r: 250, g: 5, b: 5 },
          { r: 245, g: 10, b: 10 },
          // 파란색 그룹
          { r: 0, g: 0, b: 255 },
          { r: 5, g: 5, b: 250 },
          { r: 10, g: 10, b: 245 },
        ];

        const clusters = kMeansClustering(pixels, { k: 2, iterations: 10 });

        expect(clusters).toHaveLength(2);
        expect(clusters[0].count + clusters[1].count).toBe(6);
      });

      it('should handle empty pixel array', () => {
        const clusters = kMeansClustering([], { k: 3 });
        expect(clusters).toHaveLength(0);
      });

      it('should handle fewer pixels than k', () => {
        const pixels: RGBColor[] = [
          { r: 255, g: 0, b: 0 },
          { r: 0, g: 255, b: 0 },
        ];

        const clusters = kMeansClustering(pixels, { k: 5 });
        expect(clusters).toHaveLength(2);
      });

      // ----------------------------------------------------------------------
      // 결정론 (재현성 계약)
      //
      // 왜 중요한가: 초기 중심점이 실행마다 달라지면 같은 사진의 대표색이 바뀌고,
      // 그 결과 톤·시즌 판정까지 흔들린다. "같은 사진 = 같은 결과"는 이룸의 계약이다.
      // ----------------------------------------------------------------------
      it('같은 입력을 20회 돌려도 클러스터가 완전히 동일해야 함', () => {
        // 초기화 운에 따라 결과가 갈릴 수 있도록 여러 색 덩어리를 섞는다
        const pixels: RGBColor[] = [
          ...makePixelBlob('det-red', { r: 210, g: 60, b: 55 }, { r: 20, g: 20, b: 20 }, 60),
          ...makePixelBlob('det-blue', { r: 60, g: 80, b: 200 }, { r: 20, g: 20, b: 20 }, 60),
          ...makePixelBlob('det-green', { r: 70, g: 190, b: 90 }, { r: 20, g: 20, b: 20 }, 60),
          ...makePixelBlob('det-beige', { r: 220, g: 200, b: 175 }, { r: 15, g: 15, b: 15 }, 60),
        ];

        const baseline = JSON.stringify(kMeansClustering(pixels, { k: 5, iterations: 10 }));

        for (let run = 0; run < 20; run++) {
          expect(JSON.stringify(kMeansClustering(pixels, { k: 5, iterations: 10 }))).toBe(baseline);
        }
      });

      it('빈 클러스터 재초기화 경로에서도 반복 실행이 동일해야 함', () => {
        // 서로 다른 색이 k보다 적으면 빈 클러스터가 생겨 재초기화 경로를 탄다
        const pixels: RGBColor[] = [
          ...Array(30).fill({ r: 200, g: 30, b: 30 }),
          ...Array(30).fill({ r: 30, g: 30, b: 200 }),
        ];

        const baseline = JSON.stringify(kMeansClustering(pixels, { k: 5, iterations: 10 }));

        for (let run = 0; run < 20; run++) {
          expect(JSON.stringify(kMeansClustering(pixels, { k: 5, iterations: 10 }))).toBe(baseline);
        }
      });
    });

    describe('hashPixelsToSeed', () => {
      it('같은 픽셀 배열은 항상 같은 시드를 낸다', () => {
        const pixels = makePixelBlob(
          'seed-same',
          { r: 120, g: 140, b: 160 },
          {
            r: 30,
            g: 30,
            b: 30,
          }
        );
        const copy = pixels.map((p) => ({ ...p }));

        expect(hashPixelsToSeed(copy)).toBe(hashPixelsToSeed(pixels));
      });

      it('픽셀이 하나라도 다르면 다른 시드를 낸다 (초기화 경로 분기)', () => {
        const pixels = makePixelBlob(
          'seed-diff',
          { r: 120, g: 140, b: 160 },
          {
            r: 30,
            g: 30,
            b: 30,
          }
        );
        const mutated = pixels.map((p) => ({ ...p }));
        mutated[42] = { ...mutated[42], r: mutated[42].r + 1 };

        expect(hashPixelsToSeed(mutated)).not.toBe(hashPixelsToSeed(pixels));
      });

      it('앞부분이 같아도 길이가 다르면 다른 시드를 낸다', () => {
        const pixels = makePixelBlob(
          'seed-len',
          { r: 90, g: 100, b: 110 },
          {
            r: 20,
            g: 20,
            b: 20,
          }
        );

        expect(hashPixelsToSeed(pixels.slice(0, 99))).not.toBe(hashPixelsToSeed(pixels));
      });

      it('픽셀 순서가 다르면 다른 시드를 낸다', () => {
        const pixels = makePixelBlob(
          'seed-order',
          { r: 150, g: 90, b: 60 },
          {
            r: 40,
            g: 40,
            b: 40,
          }
        );
        const reversed = [...pixels].reverse();

        expect(hashPixelsToSeed(reversed)).not.toBe(hashPixelsToSeed(pixels));
      });
    });
  });

  // ==========================================================================
  // background-filter.ts
  // ==========================================================================
  describe('background-filter', () => {
    describe('isBackgroundColor', () => {
      it('should detect white background', () => {
        expect(isBackgroundColor({ r: 255, g: 255, b: 255 })).toBe(true);
        expect(isBackgroundColor({ r: 250, g: 250, b: 250 })).toBe(true);
      });

      it('should detect black background', () => {
        expect(isBackgroundColor({ r: 0, g: 0, b: 0 })).toBe(true);
        expect(isBackgroundColor({ r: 10, g: 10, b: 10 })).toBe(true);
      });

      it('should detect gray background', () => {
        expect(isBackgroundColor({ r: 128, g: 128, b: 128 })).toBe(true);
        expect(isBackgroundColor({ r: 130, g: 128, b: 126 })).toBe(true);
      });

      it('should not detect colored pixels as background', () => {
        expect(isBackgroundColor({ r: 255, g: 100, b: 50 })).toBe(false);
        expect(isBackgroundColor({ r: 50, g: 100, b: 200 })).toBe(false);
      });
    });

    describe('filterBackgroundColors', () => {
      it('should filter out background colors', () => {
        const pixels: RGBColor[] = [
          { r: 255, g: 255, b: 255 }, // 흰색 (배경)
          { r: 255, g: 100, b: 50 }, // 오렌지
          { r: 0, g: 0, b: 0 }, // 검정 (배경)
          { r: 50, g: 100, b: 200 }, // 파란색
        ];

        const filtered = filterBackgroundColors(pixels);
        expect(filtered).toHaveLength(2);
      });
    });

    describe('calculateBackgroundRatio', () => {
      it('should calculate correct background ratio', () => {
        const pixels: RGBColor[] = [
          { r: 255, g: 255, b: 255 },
          { r: 255, g: 255, b: 255 },
          { r: 255, g: 100, b: 50 },
          { r: 50, g: 100, b: 200 },
        ];

        const ratio = calculateBackgroundRatio(pixels);
        expect(ratio).toBe(50); // 2/4 = 50%
      });
    });
  });

  // ==========================================================================
  // tone-classifier.ts
  // ==========================================================================
  describe('tone-classifier', () => {
    describe('classifyTone', () => {
      it('should classify warm tone (a > 0, b > 0)', () => {
        const warmLab: LabColor = { L: 60, a: 15, b: 25 };
        expect(classifyTone(warmLab)).toBe('warm');
      });

      it('should classify cool tone (a < 0 or b < 0)', () => {
        const coolLab1: LabColor = { L: 60, a: -10, b: 15 };
        expect(classifyTone(coolLab1)).toBe('cool');

        const coolLab2: LabColor = { L: 60, a: 10, b: -15 };
        expect(classifyTone(coolLab2)).toBe('cool');
      });

      it('should classify neutral tone (both near zero)', () => {
        const neutralLab: LabColor = { L: 60, a: 2, b: 3 };
        expect(classifyTone(neutralLab)).toBe('neutral');
      });
    });

    describe('classifyToneWithConfidence', () => {
      it('should return high confidence for strong warm tone', () => {
        const warmLab: LabColor = { L: 60, a: 25, b: 35 };
        const result = classifyToneWithConfidence(warmLab);

        expect(result.tone).toBe('warm');
        expect(result.confidence).toBeGreaterThan(80);
      });

      it('should return lower confidence for borderline cases', () => {
        const borderlineLab: LabColor = { L: 60, a: 6, b: 6 };
        const result = classifyToneWithConfidence(borderlineLab);

        expect(result.confidence).toBeLessThan(80);
      });
    });

    describe('calculateWarmRatio', () => {
      it('should return high ratio for warm colors', () => {
        const warmLab: LabColor = { L: 60, a: 20, b: 25 };
        const ratio = calculateWarmRatio(warmLab);
        expect(ratio).toBeGreaterThan(70);
      });

      it('should return low ratio for cool colors', () => {
        const coolLab: LabColor = { L: 60, a: -15, b: -10 };
        const ratio = calculateWarmRatio(coolLab);
        expect(ratio).toBeLessThan(30);
      });

      it('should return around 50 for neutral colors', () => {
        const neutralLab: LabColor = { L: 60, a: 0, b: 0 };
        const ratio = calculateWarmRatio(neutralLab);
        expect(ratio).toBeCloseTo(50, -1);
      });
    });
  });

  // ==========================================================================
  // season-matcher.ts
  // ==========================================================================
  describe('season-matcher', () => {
    describe('calculateSeasonMatch', () => {
      it('should calculate season match scores', () => {
        const lab: LabColor = { L: 68, a: 12, b: 28 }; // true-spring 참조값
        const scores = calculateSeasonMatch(lab);

        expect(scores.spring).toBeGreaterThan(scores.winter);
        expect(scores.spring).toBeGreaterThan(scores.summer);
      });

      it('should return all four seasons', () => {
        const lab: LabColor = { L: 60, a: 10, b: 15 };
        const scores = calculateSeasonMatch(lab);

        expect(scores).toHaveProperty('spring');
        expect(scores).toHaveProperty('summer');
        expect(scores).toHaveProperty('autumn');
        expect(scores).toHaveProperty('winter');
      });
    });

    describe('getBestSeasonMatch', () => {
      it('should return the highest scoring season', () => {
        const scores = { spring: 90, summer: 60, autumn: 70, winter: 50 };
        const best = getBestSeasonMatch(scores);

        expect(best.season).toBe('spring');
        expect(best.score).toBe(90);
      });
    });

    describe('getMatchGrade', () => {
      it('should return excellent for score >= 80', () => {
        expect(getMatchGrade(85).grade).toBe('excellent');
      });

      it('should return good for score >= 60', () => {
        expect(getMatchGrade(65).grade).toBe('good');
      });

      it('should return fair for score >= 40', () => {
        expect(getMatchGrade(45).grade).toBe('fair');
      });

      it('should return poor for score < 40', () => {
        expect(getMatchGrade(30).grade).toBe('poor');
      });
    });

    describe('getSeasonCompatibility', () => {
      it('should return 100 for same season', () => {
        expect(getSeasonCompatibility('spring', 'spring')).toBe(100);
        expect(getSeasonCompatibility('winter', 'winter')).toBe(100);
      });

      it('should return higher for same undertone', () => {
        // 웜톤끼리
        const warmToWarm = getSeasonCompatibility('spring', 'autumn');
        // 쿨톤끼리
        const coolToCool = getSeasonCompatibility('summer', 'winter');

        expect(warmToWarm).toBe(70);
        expect(coolToCool).toBe(70);
      });

      it('should return lower for opposite undertone', () => {
        const warmToCool = getSeasonCompatibility('spring', 'winter');
        expect(warmToCool).toBe(30);
      });
    });
  });

  // ==========================================================================
  // classifyFromPixels (통합)
  // ==========================================================================
  describe('classifyFromPixels', () => {
    it('should classify warm-toned pixels', () => {
      // 웜 계열 블롭 r[222,238] g[156,172] b[121,137].
      // 이 범위의 모든 색은 tone=warm이고 spring >= 73이라(SEASON_LAB_RANGES 기준
      // 전수 계산), 대표색이 어느 클러스터로 잡히든 아래 두 단언이 확정적으로 성립한다.
      const warmPixels = makePixelBlob(
        'warm-spring',
        { r: 230, g: 164, b: 129 },
        { r: 8, g: 8, b: 8 }
      );

      const result = classifyFromPixels(warmPixels);

      expect(result.tone).toBe('warm');
      expect(result.seasonMatch.spring).toBeGreaterThan(50);
    });

    it('should classify cool-toned pixels', () => {
      // 쿨 계열 블롭 r[101,129] g[121,149] b[200,254] — 범위 전체가 tone=cool.
      const coolPixels = makePixelBlob(
        'cool-blue',
        { r: 115, g: 135, b: 227 },
        { r: 14, g: 14, b: 27 }
      );

      const result = classifyFromPixels(coolPixels);

      expect(result.tone).toBe('cool');
    });

    it('should return default result for empty pixels', () => {
      const result = classifyFromPixels([]);

      expect(result.tone).toBe('neutral');
      expect(result.confidence).toBe(0);
    });

    it('색이 넓게 퍼진 픽셀도 20회 반복에서 같은 판정을 내야 함', () => {
      // 폭이 넓은 블롭 = 클러스터가 여러 개로 갈라져 "어느 게 대표색이냐"가 결과를 가른다.
      // 초기화가 비결정적이던 시절에는 이런 입력에서 시즌 점수가 크게 흔들렸다.
      const widePixels = makePixelBlob(
        'wide-spread',
        { r: 170, g: 140, b: 120 },
        { r: 70, g: 70, b: 70 },
        200
      );

      const baseline = classifyFromPixels(widePixels);

      for (let run = 0; run < 20; run++) {
        const result = classifyFromPixels(widePixels);

        expect(result.tone).toBe(baseline.tone);
        expect(result.dominantColor.hex).toBe(baseline.dominantColor.hex);
        expect(result.seasonMatch).toEqual(baseline.seasonMatch);
        expect(result.confidence).toBe(baseline.confidence);
      }
    });

    it('should extract dominant color', () => {
      // 대부분 빨간색
      const pixels: RGBColor[] = [
        ...Array(80)
          .fill(null)
          .map(() => ({ r: 200, g: 50, b: 50 })),
        ...Array(20)
          .fill(null)
          .map(() => ({ r: 50, g: 50, b: 200 })),
      ];

      const result = classifyFromPixels(pixels);

      // 대표색이 빨간색에 가까워야 함
      expect(result.dominantColor.rgb.r).toBeGreaterThan(150);
      expect(result.dominantColor.rgb.b).toBeLessThan(100);
    });

    it('should calculate confidence based on color distribution', () => {
      // 단색 (높은 신뢰도)
      const uniformPixels: RGBColor[] = Array(100).fill({ r: 200, g: 100, b: 50 });
      const uniformResult = classifyFromPixels(uniformPixels);

      // 다양한 색상 (낮은 신뢰도)
      const diversePixels: RGBColor[] = [
        ...Array(20).fill({ r: 255, g: 0, b: 0 }),
        ...Array(20).fill({ r: 0, g: 255, b: 0 }),
        ...Array(20).fill({ r: 0, g: 0, b: 255 }),
        ...Array(20).fill({ r: 255, g: 255, b: 0 }),
        ...Array(20).fill({ r: 255, g: 0, b: 255 }),
      ];
      const diverseResult = classifyFromPixels(diversePixels);

      expect(uniformResult.confidence).toBeGreaterThan(diverseResult.confidence);
    });
  });
});
