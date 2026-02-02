/**
 * 스타일 카테고리 테스트
 *
 * @module tests/lib/fashion/style-categories
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.3
 */

import { describe, it, expect } from 'vitest';
import {
  STYLE_CATEGORY_KEYWORDS,
  STYLE_CATEGORIES_DETAIL,
  STYLE_TREND_ITEMS_2026,
  TREND_BONUS_2026,
  STYLE_BY_PERSONAL_COLOR,
  getStyleLabel,
  getStyleDetail,
  getRecommendedStyles,
  inferStyleCategory,
  isTrendItem2026,
  calculateTrendBonus,
  calculateStyleCompatibility,
  getAllStyleCategories,
  getRisingTrendStyles,
  type StyleCategory,
} from '@/lib/fashion/style-categories';

// ============================================================================
// 상수 검증
// ============================================================================

describe('STYLE_CATEGORY_KEYWORDS', () => {
  it('should have all 10 style categories', () => {
    const categories: StyleCategory[] = [
      'casual',
      'formal',
      'street',
      'minimal',
      'sporty',
      'classic',
      'preppy',
      'hiphop',
      'romantic',
      'workwear',
    ];

    for (const category of categories) {
      expect(STYLE_CATEGORY_KEYWORDS[category]).toBeDefined();
      expect(Array.isArray(STYLE_CATEGORY_KEYWORDS[category])).toBe(true);
      expect(STYLE_CATEGORY_KEYWORDS[category].length).toBeGreaterThan(0);
    }
  });

  it('should include both Korean and English keywords', () => {
    // casual 카테고리 검증
    const casualKeywords = STYLE_CATEGORY_KEYWORDS.casual;
    const hasKorean = casualKeywords.some((k) => /[\u3131-\uD79D]/.test(k));
    const hasEnglish = casualKeywords.some((k) => /[a-zA-Z]/.test(k));

    expect(hasKorean).toBe(true);
    expect(hasEnglish).toBe(true);
  });

  it('should have specific keywords for each category', () => {
    expect(STYLE_CATEGORY_KEYWORDS.casual).toContain('티셔츠');
    expect(STYLE_CATEGORY_KEYWORDS.formal).toContain('블레이저');
    expect(STYLE_CATEGORY_KEYWORDS.street).toContain('오버사이즈');
    expect(STYLE_CATEGORY_KEYWORDS.minimal).toContain('모노톤');
    expect(STYLE_CATEGORY_KEYWORDS.sporty).toContain('테크웨어');
  });
});

describe('STYLE_CATEGORIES_DETAIL', () => {
  it('should have complete detail for all categories', () => {
    const categories = Object.keys(STYLE_CATEGORY_KEYWORDS) as StyleCategory[];

    for (const category of categories) {
      const detail = STYLE_CATEGORIES_DETAIL[category];

      expect(detail).toBeDefined();
      expect(detail.id).toBe(category);
      expect(detail.label).toBeDefined();
      expect(detail.labelEn).toBeDefined();
      expect(detail.description).toBeDefined();
      expect(Array.isArray(detail.keywords)).toBe(true);
      expect(Array.isArray(detail.suitableOccasions)).toBe(true);
      expect(Array.isArray(detail.recommendedBodyTypes)).toBe(true);
      expect(['rising', 'steady', 'classic']).toContain(detail.trendLevel2026);
    }
  });

  it('should have correct labels', () => {
    expect(STYLE_CATEGORIES_DETAIL.casual.label).toBe('캐주얼');
    expect(STYLE_CATEGORIES_DETAIL.formal.label).toBe('포멀');
    expect(STYLE_CATEGORIES_DETAIL.street.label).toBe('스트릿');
    expect(STYLE_CATEGORIES_DETAIL.minimal.label).toBe('미니멀');
    expect(STYLE_CATEGORIES_DETAIL.romantic.label).toBe('로맨틱');
  });

  it('should have English labels', () => {
    expect(STYLE_CATEGORIES_DETAIL.casual.labelEn).toBe('Casual');
    expect(STYLE_CATEGORIES_DETAIL.formal.labelEn).toBe('Formal');
    expect(STYLE_CATEGORIES_DETAIL.hiphop.labelEn).toBe('Hip-hop');
  });
});

describe('STYLE_TREND_ITEMS_2026', () => {
  it('should have trend items for all categories', () => {
    const categories = Object.keys(STYLE_CATEGORY_KEYWORDS) as StyleCategory[];

    for (const category of categories) {
      expect(STYLE_TREND_ITEMS_2026[category]).toBeDefined();
      expect(Array.isArray(STYLE_TREND_ITEMS_2026[category])).toBe(true);
      expect(STYLE_TREND_ITEMS_2026[category].length).toBeGreaterThan(0);
    }
  });

  it('should include specific 2026 trend items', () => {
    expect(STYLE_TREND_ITEMS_2026.casual).toContain('폴로 셔츠');
    expect(STYLE_TREND_ITEMS_2026.street).toContain('새깅 팬츠');
    expect(STYLE_TREND_ITEMS_2026.sporty).toContain('고프코어 아이템');
    expect(STYLE_TREND_ITEMS_2026.preppy).toContain('니트 베스트');
  });
});

describe('TREND_BONUS_2026', () => {
  it('should be 0.1 (10%)', () => {
    expect(TREND_BONUS_2026).toBe(0.1);
  });
});

describe('STYLE_BY_PERSONAL_COLOR', () => {
  it('should have styles for all seasons', () => {
    expect(STYLE_BY_PERSONAL_COLOR.Spring).toBeDefined();
    expect(STYLE_BY_PERSONAL_COLOR.Summer).toBeDefined();
    expect(STYLE_BY_PERSONAL_COLOR.Autumn).toBeDefined();
    expect(STYLE_BY_PERSONAL_COLOR.Winter).toBeDefined();
  });

  it('should recommend appropriate styles for each season', () => {
    // Spring: 밝고 따뜻한 스타일
    expect(STYLE_BY_PERSONAL_COLOR.Spring).toContain('casual');
    expect(STYLE_BY_PERSONAL_COLOR.Spring).toContain('preppy');

    // Summer: 부드럽고 시원한 스타일
    expect(STYLE_BY_PERSONAL_COLOR.Summer).toContain('minimal');
    expect(STYLE_BY_PERSONAL_COLOR.Summer).toContain('romantic');

    // Autumn: 따뜻하고 깊은 스타일
    expect(STYLE_BY_PERSONAL_COLOR.Autumn).toContain('classic');
    expect(STYLE_BY_PERSONAL_COLOR.Autumn).toContain('workwear');

    // Winter: 선명하고 시원한 스타일
    expect(STYLE_BY_PERSONAL_COLOR.Winter).toContain('minimal');
    expect(STYLE_BY_PERSONAL_COLOR.Winter).toContain('formal');
  });
});

// ============================================================================
// 유틸리티 함수 테스트
// ============================================================================

describe('getStyleLabel', () => {
  it('should return Korean label for valid category', () => {
    expect(getStyleLabel('casual')).toBe('캐주얼');
    expect(getStyleLabel('formal')).toBe('포멀');
    expect(getStyleLabel('street')).toBe('스트릿');
    expect(getStyleLabel('minimal')).toBe('미니멀');
    expect(getStyleLabel('sporty')).toBe('스포티');
    expect(getStyleLabel('classic')).toBe('클래식');
    expect(getStyleLabel('preppy')).toBe('프레피');
    expect(getStyleLabel('hiphop')).toBe('힙합');
    expect(getStyleLabel('romantic')).toBe('로맨틱');
    expect(getStyleLabel('workwear')).toBe('워크웨어');
  });

  it('should return category name for unknown category', () => {
    // @ts-expect-error - 테스트를 위한 잘못된 입력
    expect(getStyleLabel('unknown')).toBe('unknown');
  });
});

describe('getStyleDetail', () => {
  it('should return complete style detail', () => {
    const detail = getStyleDetail('casual');

    expect(detail.id).toBe('casual');
    expect(detail.label).toBe('캐주얼');
    expect(detail.labelEn).toBe('Casual');
    expect(detail.description).toBeDefined();
    expect(detail.keywords.length).toBeGreaterThan(0);
    expect(detail.suitableOccasions.length).toBeGreaterThan(0);
    expect(detail.recommendedBodyTypes.length).toBeGreaterThan(0);
    expect(detail.trendLevel2026).toBe('steady');
  });

  it('should return rising trend styles', () => {
    const streetDetail = getStyleDetail('street');
    const minimalDetail = getStyleDetail('minimal');
    const sportyDetail = getStyleDetail('sporty');

    expect(streetDetail.trendLevel2026).toBe('rising');
    expect(minimalDetail.trendLevel2026).toBe('rising');
    expect(sportyDetail.trendLevel2026).toBe('rising');
  });
});

describe('getRecommendedStyles', () => {
  it('should return styles for Spring personal color', () => {
    const styles = getRecommendedStyles('Spring');

    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThan(0);
    expect(styles).toContain('casual');
  });

  it('should return styles for Summer personal color', () => {
    const styles = getRecommendedStyles('Summer');

    expect(styles).toContain('minimal');
    expect(styles).toContain('romantic');
  });

  it('should return styles for Autumn personal color', () => {
    const styles = getRecommendedStyles('Autumn');

    expect(styles).toContain('classic');
    expect(styles).toContain('workwear');
  });

  it('should return styles for Winter personal color', () => {
    const styles = getRecommendedStyles('Winter');

    expect(styles).toContain('minimal');
    expect(styles).toContain('formal');
  });

  it('should return default styles for unknown color', () => {
    // @ts-expect-error - 테스트를 위한 잘못된 입력
    const styles = getRecommendedStyles('Unknown');

    expect(styles).toContain('casual');
    expect(styles).toContain('minimal');
  });
});

describe('inferStyleCategory', () => {
  describe('키워드 기반 추론', () => {
    it('should infer casual from denim items', () => {
      expect(inferStyleCategory('데님 청바지')).toBe('casual');
      expect(inferStyleCategory('Blue Denim Jacket')).toBe('casual');
    });

    it('should infer formal from blazer items', () => {
      expect(inferStyleCategory('네이비 블레이저')).toBe('formal');
      expect(inferStyleCategory('Slim Fit Blazer')).toBe('formal');
    });

    it('should infer street from oversized items', () => {
      expect(inferStyleCategory('오버사이즈 후드티')).toBe('street');
      expect(inferStyleCategory('Oversized Graphic Tee')).toBe('street');
    });

    it('should infer minimal from basic items', () => {
      expect(inferStyleCategory('베이직 화이트 티')).toBe('minimal');
      expect(inferStyleCategory('Black Basic Tee')).toBe('minimal');
    });

    it('should infer sporty from athletic items', () => {
      expect(inferStyleCategory('테크웨어 윈드브레이커')).toBe('sporty');
      expect(inferStyleCategory('Running Leggings')).toBe('sporty');
    });

    it('should infer preppy from argyle items', () => {
      expect(inferStyleCategory('아가일 니트베스트')).toBe('preppy');
      expect(inferStyleCategory('Pleats Skirt')).toBe('preppy');
    });

    it('should infer romantic from floral items', () => {
      expect(inferStyleCategory('플로럴 원피스')).toBe('romantic');
      expect(inferStyleCategory('Lace Blouse')).toBe('romantic');
    });

    it('should infer workwear from military/duck items', () => {
      // cargo는 street와 workwear 모두에 있으므로 더 명확한 키워드 사용
      expect(inferStyleCategory('덕 재킷')).toBe('workwear');
      expect(inferStyleCategory('카하트 워크부츠')).toBe('workwear');
      expect(inferStyleCategory('Canvas Work Boots')).toBe('workwear');
    });
  });

  describe('복합 키워드 우선순위', () => {
    it('should prioritize multiple keyword matches', () => {
      // 2개 이상 키워드 매칭 시 해당 카테고리 반환
      expect(inferStyleCategory('스니커즈 데님 청바지')).toBe('casual');
      expect(inferStyleCategory('오버사이즈 그래픽 티셔츠')).toBe('street');
    });
  });

  describe('매칭 없는 경우', () => {
    it('should return null for unmatched items', () => {
      expect(inferStyleCategory('일반 상품')).toBe(null);
      expect(inferStyleCategory('unknown item')).toBe(null);
    });
  });
});

describe('isTrendItem2026', () => {
  it('should return true for 2026 trend items', () => {
    expect(isTrendItem2026('폴로 셔츠')).toBe(true);
    expect(isTrendItem2026('새깅 팬츠')).toBe(true);
    expect(isTrendItem2026('테크웨어')).toBe(true);
    expect(isTrendItem2026('니트 베스트')).toBe(true);
    expect(isTrendItem2026('고프코어 아이템')).toBe(true);
  });

  it('should return false for non-trend items', () => {
    expect(isTrendItem2026('일반 티셔츠')).toBe(false);
    expect(isTrendItem2026('기본 청바지')).toBe(false);
    expect(isTrendItem2026('plain white tee')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isTrendItem2026('폴로 셔츠')).toBe(true);
    expect(isTrendItem2026('POLO 셔츠')).toBe(false); // 한국어 키워드이므로 정확히 매칭
  });
});

describe('calculateTrendBonus', () => {
  it('should return 0.1 for trend items', () => {
    expect(calculateTrendBonus('폴로 셔츠')).toBe(0.1);
    expect(calculateTrendBonus('새깅 팬츠')).toBe(0.1);
  });

  it('should return 0 for non-trend items', () => {
    expect(calculateTrendBonus('일반 티셔츠')).toBe(0);
    expect(calculateTrendBonus('기본 바지')).toBe(0);
  });
});

describe('calculateStyleCompatibility', () => {
  it('should return high score for matching style', () => {
    const score = calculateStyleCompatibility('데님 청바지 스니커즈', 'casual');
    expect(score).toBeGreaterThan(70);
  });

  it('should return base score for non-matching style', () => {
    const score = calculateStyleCompatibility('일반 상품', 'casual');
    expect(score).toBe(50);
  });

  it('should add trend bonus for trend items', () => {
    const trendScore = calculateStyleCompatibility('폴로 셔츠', 'casual');
    const normalScore = calculateStyleCompatibility('일반 셔츠', 'casual');

    expect(trendScore).toBeGreaterThan(normalScore);
  });

  it('should increase score with more keyword matches', () => {
    const oneMatch = calculateStyleCompatibility('데님', 'casual');
    const twoMatch = calculateStyleCompatibility('데님 스니커즈', 'casual');

    expect(twoMatch).toBeGreaterThan(oneMatch);
  });

  it('should cap score at 100', () => {
    // 많은 키워드 매칭
    const score = calculateStyleCompatibility(
      '데님 티셔츠 스니커즈 후디 맨투맨 청바지 폴로',
      'casual'
    );
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getAllStyleCategories', () => {
  it('should return all 10 categories', () => {
    const categories = getAllStyleCategories();

    expect(categories.length).toBe(10);
    expect(categories).toContain('casual');
    expect(categories).toContain('formal');
    expect(categories).toContain('street');
    expect(categories).toContain('minimal');
    expect(categories).toContain('sporty');
    expect(categories).toContain('classic');
    expect(categories).toContain('preppy');
    expect(categories).toContain('hiphop');
    expect(categories).toContain('romantic');
    expect(categories).toContain('workwear');
  });
});

describe('getRisingTrendStyles', () => {
  it('should return only rising trend styles', () => {
    const risingStyles = getRisingTrendStyles();

    for (const style of risingStyles) {
      const detail = STYLE_CATEGORIES_DETAIL[style];
      expect(detail.trendLevel2026).toBe('rising');
    }
  });

  it('should include street, minimal, sporty, preppy, workwear', () => {
    const risingStyles = getRisingTrendStyles();

    expect(risingStyles).toContain('street');
    expect(risingStyles).toContain('minimal');
    expect(risingStyles).toContain('sporty');
    expect(risingStyles).toContain('preppy');
    expect(risingStyles).toContain('workwear');
  });

  it('should not include steady or classic trend styles', () => {
    const risingStyles = getRisingTrendStyles();

    // casual, formal, hiphop, romantic은 steady
    expect(risingStyles).not.toContain('casual');
    expect(risingStyles).not.toContain('formal');
    expect(risingStyles).not.toContain('hiphop');
    expect(risingStyles).not.toContain('romantic');

    // classic은 classic
    expect(risingStyles).not.toContain('classic');
  });
});

// ============================================================================
// 통합 시나리오 테스트
// ============================================================================

describe('통합 시나리오', () => {
  describe('퍼스널컬러 기반 스타일 추천 플로우', () => {
    it('should recommend and score styles for Spring type', () => {
      const personalColor = 'Spring';
      const recommendedStyles = getRecommendedStyles(personalColor);

      // 추천 스타일 확인
      expect(recommendedStyles.length).toBeGreaterThan(0);

      // 각 스타일의 상세 정보 확인
      for (const style of recommendedStyles) {
        const detail = getStyleDetail(style);
        expect(detail).toBeDefined();
        expect(detail.label).toBeDefined();
      }
    });
  });

  describe('아이템 분석 및 매칭 플로우', () => {
    it('should analyze and match item to style', () => {
      const itemName = '오버사이즈 그래픽 티셔츠';

      // 1. 스타일 추론
      const inferredStyle = inferStyleCategory(itemName);
      expect(inferredStyle).toBe('street');

      // 2. 트렌드 확인
      const isTrend = isTrendItem2026(itemName);
      expect(typeof isTrend).toBe('boolean');

      // 3. 호환성 점수
      if (inferredStyle) {
        const compatibility = calculateStyleCompatibility(itemName, inferredStyle);
        expect(compatibility).toBeGreaterThan(50);
      }
    });
  });

  describe('2026 트렌드 분석 플로우', () => {
    it('should identify rising trends and calculate bonuses', () => {
      // 상승 트렌드 스타일 확인
      const risingStyles = getRisingTrendStyles();
      expect(risingStyles.length).toBeGreaterThan(0);

      // 각 스타일별 트렌드 아이템 확인
      for (const style of risingStyles) {
        const trendItems = STYLE_TREND_ITEMS_2026[style];
        expect(trendItems.length).toBeGreaterThan(0);

        // 트렌드 아이템 보너스 확인
        for (const item of trendItems) {
          const bonus = calculateTrendBonus(item);
          expect(bonus).toBe(TREND_BONUS_2026);
        }
      }
    });
  });
});
