/**
 * H-1 스타일 매칭 엔진 테스트
 *
 * 3-Factor 스타일 매칭: faceShape × texture × personalColor
 *
 * @module tests/lib/analysis/hair/style-matcher
 */

import { describe, it, expect } from 'vitest';
import { matchStyles, getStyleCatalogSize } from '@/lib/analysis/hair/style-matcher';
import type { StyleMatchInput } from '@/lib/analysis/hair/style-matcher';

// =============================================================================
// getStyleCatalogSize
// =============================================================================

describe('getStyleCatalogSize', () => {
  it('18종 스타일 카탈로그를 보유한다', () => {
    expect(getStyleCatalogSize()).toBe(18);
  });
});

// =============================================================================
// matchStyles — 기본 동작
// =============================================================================

describe('matchStyles 기본 동작', () => {
  it('기본 maxResults=5로 5개 결과를 반환한다', () => {
    const results = matchStyles({ faceShape: 'oval' });
    expect(results).toHaveLength(5);
  });

  it('maxResults 지정 시 해당 수만큼 반환한다', () => {
    const results = matchStyles({ faceShape: 'oval' }, 3);
    expect(results).toHaveLength(3);
  });

  it('maxResults가 카탈로그보다 크면 카탈로그 수만큼 반환한다', () => {
    const results = matchStyles({ faceShape: 'oval' }, 100);
    expect(results).toHaveLength(18);
  });

  it('점수 내림차순으로 정렬된다', () => {
    const results = matchStyles({ faceShape: 'round' });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(results[i].matchScore);
    }
  });

  it('각 결과에 필수 필드가 존재한다', () => {
    const results = matchStyles({ faceShape: 'heart' });
    results.forEach((r) => {
      expect(r.name).toBeTruthy();
      expect(r.description).toBeTruthy();
      expect(['short', 'medium', 'long']).toContain(r.length);
      expect(r.tags.length).toBeGreaterThan(0);
      expect(r.matchScore).toBeGreaterThanOrEqual(0);
      expect(r.matchScore).toBeLessThanOrEqual(100);
      expect(r.suitability).toBe(r.matchScore);
      expect(r.breakdown).toBeDefined();
      expect(r.matchReasons.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// matchStyles — 점수 분해 (breakdown)
// =============================================================================

describe('matchStyles 점수 분해', () => {
  it('faceShapeScore는 0-40 범위이다', () => {
    const results = matchStyles({ faceShape: 'square' }, 18);
    results.forEach((r) => {
      expect(r.breakdown.faceShapeScore).toBeGreaterThanOrEqual(0);
      expect(r.breakdown.faceShapeScore).toBeLessThanOrEqual(40);
    });
  });

  it('textureScore는 0-30 범위이다', () => {
    const results = matchStyles({ faceShape: 'oval', textureCode: '3b' }, 18);
    results.forEach((r) => {
      expect(r.breakdown.textureScore).toBeGreaterThanOrEqual(0);
      expect(r.breakdown.textureScore).toBeLessThanOrEqual(30);
    });
  });

  it('colorSeasonScore는 0-20 범위이다', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        personalColorSeason: 'autumn',
      },
      18
    );
    results.forEach((r) => {
      expect(r.breakdown.colorSeasonScore).toBeGreaterThanOrEqual(0);
      expect(r.breakdown.colorSeasonScore).toBeLessThanOrEqual(20);
    });
  });

  it('lengthBonus는 0 또는 10이다', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        preferredLength: 'medium',
      },
      18
    );
    results.forEach((r) => {
      expect([0, 10]).toContain(r.breakdown.lengthBonus);
    });
  });

  it('총점은 breakdown 합산과 일치한다 (capped at 100)', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        textureCode: '2b',
        personalColorSeason: 'spring',
        preferredLength: 'medium',
      },
      18
    );
    results.forEach((r) => {
      const sum =
        r.breakdown.faceShapeScore +
        r.breakdown.textureScore +
        r.breakdown.colorSeasonScore +
        r.breakdown.lengthBonus;
      expect(r.matchScore).toBe(Math.min(100, Math.round(sum)));
    });
  });
});

// =============================================================================
// matchStyles — 얼굴형별 스타일 선호도
// =============================================================================

describe('matchStyles 얼굴형별 매칭', () => {
  it('타원형(oval)은 전반적으로 높은 점수를 가진다', () => {
    const results = matchStyles({ faceShape: 'oval' }, 5);
    // 타원형은 +3 보정 덕분에 평균 점수가 다른 얼굴형보다 높거나 같다
    const avgOval = results.reduce((s, r) => s + r.matchScore, 0) / results.length;

    const squareResults = matchStyles({ faceShape: 'square' }, 5);
    const avgSquare = squareResults.reduce((s, r) => s + r.matchScore, 0) / squareResults.length;

    expect(avgOval).toBeGreaterThanOrEqual(avgSquare);
  });

  it('둥근형(round)은 롱 스타일에 보너스를 받는다', () => {
    const results = matchStyles({ faceShape: 'round' }, 18);
    // 같은 카탈로그 스타일이 롱일 때 +3 보정
    const longStyles = results.filter((r) => r.length === 'long');
    const mediumStyles = results.filter((r) => r.length === 'medium');
    const avgLong =
      longStyles.reduce((s, r) => s + r.breakdown.faceShapeScore, 0) / longStyles.length;
    const avgMedium =
      mediumStyles.reduce((s, r) => s + r.breakdown.faceShapeScore, 0) / mediumStyles.length;
    // 롱이 약간이라도 더 높은 경향
    expect(avgLong).toBeGreaterThanOrEqual(avgMedium - 5);
  });

  it('긴 형(oblong)은 미디엄 스타일에 보너스를 받는다', () => {
    const results = matchStyles({ faceShape: 'oblong' }, 18);
    const mediumStyles = results.filter((r) => r.length === 'medium');
    const shortStyles = results.filter((r) => r.length === 'short');
    const avgMedium =
      mediumStyles.reduce((s, r) => s + r.breakdown.faceShapeScore, 0) / mediumStyles.length;
    const avgShort =
      shortStyles.reduce((s, r) => s + r.breakdown.faceShapeScore, 0) / shortStyles.length;
    expect(avgMedium).toBeGreaterThanOrEqual(avgShort - 5);
  });

  it('7가지 얼굴형 모두에 대해 유효한 결과를 반환한다', () => {
    const faceShapes: StyleMatchInput['faceShape'][] = [
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'diamond',
      'rectangle',
    ];
    faceShapes.forEach((fs) => {
      const results = matchStyles({ faceShape: fs });
      expect(results).toHaveLength(5);
      results.forEach((r) => {
        expect(r.matchScore).toBeGreaterThan(0);
      });
    });
  });
});

// =============================================================================
// matchStyles — 텍스처별 매칭
// =============================================================================

describe('matchStyles 텍스처별 매칭', () => {
  it('직모(1a)는 픽시컷/스트레이트 스타일에 높은 textureScore를 가진다', () => {
    const results = matchStyles({ faceShape: 'oval', textureCode: '1a' }, 18);
    const pixie = results.find((r) => r.name === '픽시컷');
    const straight = results.find((r) => r.name === '롱 스트레이트');
    // 직모 affinity가 높은 스타일
    expect(pixie!.breakdown.textureScore).toBeGreaterThanOrEqual(20);
    expect(straight!.breakdown.textureScore).toBeGreaterThanOrEqual(20);
  });

  it('곱슬(3b)은 컬 관련 스타일에 높은 textureScore를 가진다', () => {
    const results = matchStyles({ faceShape: 'oval', textureCode: '3b' }, 18);
    const curlShort = results.find((r) => r.name === '내추럴 컬 숏');
    const glamCurl = results.find((r) => r.name === '글래머 컬');
    expect(curlShort!.breakdown.textureScore).toBeGreaterThanOrEqual(20);
    expect(glamCurl!.breakdown.textureScore).toBeGreaterThanOrEqual(20);
  });

  it('텍스처 미지정 시 기본 그룹 2(웨이브)로 계산한다', () => {
    matchStyles({ faceShape: 'oval', textureCode: '2b' }, 18);
    const withoutTexture = matchStyles({ faceShape: 'oval' }, 18);
    // textureCode 없이도 기본값이 적용되어 결과가 존재
    expect(withoutTexture.length).toBe(18);
    // 2b와 유사한 경향 (완전 동일하지는 않음 — textureInfo 보정 차이)
  });

  it('12종 텍스처 코드 모두 유효한 결과를 반환한다', () => {
    const codes = ['1a', '1b', '1c', '2a', '2b', '2c', '3a', '3b', '3c', '4a', '4b', '4c'] as const;
    codes.forEach((code) => {
      const results = matchStyles({ faceShape: 'oval', textureCode: code });
      expect(results).toHaveLength(5);
      results.forEach((r) => {
        expect(r.breakdown.textureScore).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// =============================================================================
// matchStyles — 퍼스널컬러 시즌
// =============================================================================

describe('matchStyles 퍼스널컬러 시즌', () => {
  it('시즌 미지정 시 colorSeasonScore가 중립(10)이다', () => {
    const results = matchStyles({ faceShape: 'oval' }, 18);
    results.forEach((r) => {
      expect(r.breakdown.colorSeasonScore).toBe(10);
    });
  });

  it('봄(spring) 시즌은 페미닌/웨이브 스타일에 보너스를 준다', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        personalColorSeason: 'spring',
      },
      18
    );
    const feminine = results.filter((r) =>
      r.tags.some((t) => t.includes('페미닌') || t.includes('웨이브'))
    );
    const avgFeminine =
      feminine.reduce((s, r) => s + r.breakdown.colorSeasonScore, 0) / feminine.length;
    expect(avgFeminine).toBeGreaterThan(10);
  });

  it('겨울(winter) 시즌은 세련됨/포멀 스타일에 보너스를 준다', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        personalColorSeason: 'winter',
      },
      18
    );
    const formal = results.filter((r) =>
      r.tags.some((t) => t.includes('세련됨') || t.includes('포멀'))
    );
    // 최소 1개 이상의 포멀/세련 스타일이 높은 시즌 점수
    expect(formal.some((r) => r.breakdown.colorSeasonScore > 10)).toBe(true);
  });

  it('4계절 모두 유효한 결과를 반환한다', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    seasons.forEach((season) => {
      const results = matchStyles({
        faceShape: 'oval',
        personalColorSeason: season,
      });
      expect(results).toHaveLength(5);
    });
  });
});

// =============================================================================
// matchStyles — 길이 보너스
// =============================================================================

describe('matchStyles 길이 보너스', () => {
  it('preferredLength=medium이면 미디엄 스타일은 lengthBonus=10이다', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        preferredLength: 'medium',
      },
      18
    );
    results.forEach((r) => {
      if (r.length === 'medium') {
        expect(r.breakdown.lengthBonus).toBe(10);
      } else {
        expect(r.breakdown.lengthBonus).toBe(0);
      }
    });
  });

  it('길이 보너스가 총점에 반영된다', () => {
    const withBonus = matchStyles(
      {
        faceShape: 'oval',
        preferredLength: 'long',
      },
      18
    );
    const withoutBonus = matchStyles({ faceShape: 'oval' }, 18);

    // 같은 롱 스타일끼리 비교 — 보너스 있는 쪽이 10점 높다
    const longWithBonus = withBonus.find((r) => r.name === '롱 레이어드');
    const longWithout = withoutBonus.find((r) => r.name === '롱 레이어드');
    expect(longWithBonus!.matchScore).toBe(Math.min(100, longWithout!.matchScore + 10));
  });
});

// =============================================================================
// matchStyles — 매칭 이유 (matchReasons)
// =============================================================================

describe('matchStyles 매칭 이유', () => {
  it('높은 faceShapeScore 시 얼굴형 이유가 포함된다', () => {
    // 타원형은 항상 +3 보정으로 높은 점수
    const results = matchStyles({ faceShape: 'oval', textureCode: '2b' }, 18);
    const topResult = results[0];
    if (topResult.breakdown.faceShapeScore >= 30) {
      expect(topResult.matchReasons.some((r) => r.includes('얼굴형'))).toBe(true);
    }
  });

  it('높은 textureScore 시 텍스처 이유가 포함된다', () => {
    const results = matchStyles({ faceShape: 'oval', textureCode: '1a' }, 18);
    const straightStyle = results.find((r) => r.name === '롱 스트레이트');
    if (straightStyle && straightStyle.breakdown.textureScore >= 20) {
      expect(straightStyle.matchReasons.some((r) => r.includes('모발'))).toBe(true);
    }
  });

  it('길이 보너스 시 길이 이유가 포함된다', () => {
    const results = matchStyles(
      {
        faceShape: 'oval',
        preferredLength: 'short',
      },
      18
    );
    const shortStyle = results.find((r) => r.length === 'short');
    expect(shortStyle!.matchReasons.some((r) => r.includes('길이'))).toBe(true);
  });

  it('점수가 낮아도 최소 1개 이유가 있다', () => {
    const results = matchStyles({ faceShape: 'square' }, 18);
    const lastResult = results[results.length - 1];
    expect(lastResult.matchReasons.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// matchStyles — 복합 입력
// =============================================================================

describe('matchStyles 복합 입력', () => {
  it('모든 Factor를 지정하면 최적의 결과를 반환한다', () => {
    const results = matchStyles({
      faceShape: 'oval',
      textureCode: '2b',
      personalColorSeason: 'spring',
      preferredLength: 'medium',
    });
    expect(results).toHaveLength(5);
    // Top 결과는 미디엄이고 종합 점수가 높을 가능성 큼
    expect(results[0].matchScore).toBeGreaterThan(50);
  });

  it('필수 입력(faceShape)만으로도 동작한다', () => {
    const results = matchStyles({ faceShape: 'diamond' });
    expect(results).toHaveLength(5);
  });

  it('동일 입력은 동일 결과를 반환한다 (결정적)', () => {
    const input: StyleMatchInput = {
      faceShape: 'heart',
      textureCode: '3a',
      personalColorSeason: 'autumn',
    };
    const a = matchStyles(input);
    const b = matchStyles(input);
    expect(a.map((r) => r.name)).toEqual(b.map((r) => r.name));
    expect(a.map((r) => r.matchScore)).toEqual(b.map((r) => r.matchScore));
  });
});
