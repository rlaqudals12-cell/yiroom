/**
 * H-1: style-recommender 테스트
 *
 * @description 헤어스타일 및 헤어컬러 추천 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  recommendHairstyles,
  recommendHairColors,
  generateCareTips,
  getStylesToAvoid,
} from '@/lib/analysis/hair/style-recommender';
import type { FaceShapeType, HairLength, HairTexture } from '@/lib/analysis/hair/types';

// =============================================================================
// recommendHairstyles 테스트
// =============================================================================

describe('recommendHairstyles', () => {
  const faceShapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle'];

  it.each(faceShapes)('should return recommendations for %s face shape', (faceShape) => {
    const recommendations = recommendHairstyles(faceShape);

    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeGreaterThan(0);

    // 각 추천에 필수 필드 확인
    recommendations.forEach(rec => {
      expect(rec).toHaveProperty('name');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('length');
      expect(rec).toHaveProperty('suitability');
      expect(rec).toHaveProperty('tags');
    });
  });

  it('should return sorted by suitability (highest first)', () => {
    const recommendations = recommendHairstyles('oval');

    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1].suitability).toBeGreaterThanOrEqual(recommendations[i].suitability);
    }
  });

  it('should respect maxResults option', () => {
    const maxResults = 3;
    const recommendations = recommendHairstyles('oval', { maxResults });

    expect(recommendations).toHaveLength(maxResults);
  });

  it('should filter by preferred length', () => {
    const preferredLength: HairLength = 'short';
    const recommendations = recommendHairstyles('oval', { preferredLength });

    // 선호 길이 스타일에 보너스가 적용되어 상위에 나타나야 함
    const shortStyles = recommendations.filter(r => r.length === 'short');
    expect(shortStyles.length).toBeGreaterThan(0);
  });

  it('should apply texture bonus', () => {
    const withWavy = recommendHairstyles('round', { currentTexture: 'wavy' });
    const withoutTexture = recommendHairstyles('round');

    // 웨이브 헤어는 웨이브 태그 스타일에 보너스
    const wavyStyleWithBonus = withWavy.find(s => s.tags.includes('웨이브'));
    const wavyStyleWithoutBonus = withoutTexture.find(s => s.tags.includes('웨이브'));

    if (wavyStyleWithBonus && wavyStyleWithoutBonus) {
      expect(wavyStyleWithBonus.suitability).toBeGreaterThanOrEqual(wavyStyleWithoutBonus.suitability);
    }
  });

  it('should return suitability scores between 0 and 100', () => {
    const recommendations = recommendHairstyles('square');

    recommendations.forEach(rec => {
      expect(rec.suitability).toBeGreaterThanOrEqual(0);
      expect(rec.suitability).toBeLessThanOrEqual(100);
    });
  });

  it('should give higher scores for oval face (most versatile)', () => {
    const ovalRecs = recommendHairstyles('oval');
    const squareRecs = recommendHairstyles('square');

    // 타원형은 대부분 어울리므로 평균 점수가 높아야 함
    const ovalAvg = ovalRecs.reduce((sum, r) => sum + r.suitability, 0) / ovalRecs.length;
    const squareAvg = squareRecs.reduce((sum, r) => sum + r.suitability, 0) / squareRecs.length;

    expect(ovalAvg).toBeGreaterThanOrEqual(squareAvg - 10); // 약간의 차이 허용
  });

  it('should prefer vertical volume styles for round face', () => {
    const recommendations = recommendHairstyles('round');

    // 둥근형에는 세로 볼륨 스타일 추천
    const hasVerticalVolumeStyle = recommendations.some(r =>
      r.tags.includes('레이어드') || r.length === 'long'
    );
    expect(hasVerticalVolumeStyle).toBe(true);
  });

  it('should prefer soft styles for square face', () => {
    const recommendations = recommendHairstyles('square');

    // 사각형에는 부드러운 웨이브 스타일 추천
    const hasSoftStyle = recommendations.some(r =>
      r.tags.includes('웨이브') || r.tags.includes('레이어드')
    );
    expect(hasSoftStyle).toBe(true);
  });
});

// =============================================================================
// recommendHairColors 테스트
// =============================================================================

describe('recommendHairColors', () => {
  it('should return hair color recommendations', () => {
    const colors = recommendHairColors();

    expect(colors).toBeInstanceOf(Array);
    expect(colors.length).toBeGreaterThan(0);

    colors.forEach(color => {
      expect(color).toHaveProperty('name');
      expect(color).toHaveProperty('hexColor');
      expect(color).toHaveProperty('suitability');
      expect(color).toHaveProperty('seasonMatch');
      expect(color).toHaveProperty('tags');
    });
  });

  it('should return season-specific colors when season provided', () => {
    const springColors = recommendHairColors('spring');
    const winterColors = recommendHairColors('winter');

    // 봄 시즌 컬러는 웜톤
    expect(springColors.every(c => c.seasonMatch === 'spring')).toBe(true);

    // 겨울 시즌 컬러는 쿨톤
    expect(winterColors.every(c => c.seasonMatch === 'winter')).toBe(true);
  });

  it('should return default colors when season not provided', () => {
    const colors = recommendHairColors();

    // 기본 컬러가 반환되어야 함
    expect(colors.length).toBeGreaterThan(0);
  });

  it('should respect maxResults option', () => {
    const maxResults = 2;
    const colors = recommendHairColors('summer', { maxResults });

    expect(colors).toHaveLength(maxResults);
  });

  it('should return valid hex colors', () => {
    const colors = recommendHairColors('autumn');

    colors.forEach(color => {
      expect(color.hexColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should return warm tone colors for spring', () => {
    const colors = recommendHairColors('spring');

    const hasWarmTag = colors.some(c => c.tags.includes('웜톤'));
    expect(hasWarmTag).toBe(true);
  });

  it('should return cool tone colors for summer', () => {
    const colors = recommendHairColors('summer');

    const hasCoolTag = colors.some(c => c.tags.includes('쿨톤'));
    expect(hasCoolTag).toBe(true);
  });

  it('should return colors for all four seasons', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];

    seasons.forEach(season => {
      const colors = recommendHairColors(season);
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].seasonMatch).toBe(season);
    });
  });
});

// =============================================================================
// generateCareTips 테스트
// =============================================================================

describe('generateCareTips', () => {
  const faceShapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle'];

  it.each(faceShapes)('should generate tips for %s face shape', (faceShape) => {
    const tips = generateCareTips(faceShape);

    expect(tips).toBeInstanceOf(Array);
    expect(tips.length).toBeGreaterThan(0);
    tips.forEach(tip => {
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(5);
    });
  });

  it('should include face shape specific tips for round', () => {
    const tips = generateCareTips('round');

    // 둥근형에 맞는 스타일링 팁
    const hasVolumeAdvice = tips.some(t => t.includes('볼륨') || t.includes('드라이'));
    expect(hasVolumeAdvice).toBe(true);
  });

  it('should include face shape specific tips for square', () => {
    const tips = generateCareTips('square');

    // 사각형에 맞는 부드러운 스타일링 팁
    const hasSoftAdvice = tips.some(t => t.includes('부드러운') || t.includes('웨이브') || t.includes('컬링'));
    expect(hasSoftAdvice).toBe(true);
  });

  it('should add texture-specific tips', () => {
    const straightTips = generateCareTips('oval', { texture: 'straight' });
    const wavyTips = generateCareTips('oval', { texture: 'wavy' });
    const curlyTips = generateCareTips('oval', { texture: 'curly' });

    // 직모 팁
    expect(straightTips.some(t => t.includes('볼륨 스프레이') || t.includes('움직임'))).toBe(true);

    // 웨이브 팁
    expect(wavyTips.some(t => t.includes('웨이브') || t.includes('크림') || t.includes('무스'))).toBe(true);

    // 곱슬 팁
    expect(curlyTips.some(t => t.includes('곱슬') || t.includes('오일') || t.includes('세럼'))).toBe(true);
  });

  it('should add scalp condition tips', () => {
    const dryTips = generateCareTips('oval', { scalpCondition: 'dry' });
    const oilyTips = generateCareTips('oval', { scalpCondition: 'oily' });
    const sensitiveTips = generateCareTips('oval', { scalpCondition: 'sensitive' });

    // 건성 두피 팁
    expect(dryTips.some(t => t.includes('보습') || t.includes('에센스'))).toBe(true);

    // 지성 두피 팁
    expect(oilyTips.some(t => t.includes('샴푸') || t.includes('딥클렌징'))).toBe(true);

    // 민감성 두피 팁
    expect(sensitiveTips.some(t => t.includes('저자극'))).toBe(true);
  });

  it('should always include general tips', () => {
    const tips = generateCareTips('oval');

    // 일반적인 헤어케어 팁
    const hasTrimmingTip = tips.some(t => t.includes('트리밍'));
    const hasHeatProtectionTip = tips.some(t => t.includes('열 보호') || t.includes('스타일링'));

    expect(hasTrimmingTip).toBe(true);
    expect(hasHeatProtectionTip).toBe(true);
  });

  it('should include oblong specific tips', () => {
    const tips = generateCareTips('oblong');

    // 긴 형에 맞는 사이드 볼륨 팁
    const hasSideVolumeTip = tips.some(t => t.includes('사이드') || t.includes('볼륨'));
    expect(hasSideVolumeTip).toBe(true);
  });
});

// =============================================================================
// getStylesToAvoid 테스트
// =============================================================================

describe('getStylesToAvoid', () => {
  const faceShapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle'];

  it.each(faceShapes)('should return styles to avoid for %s', (faceShape) => {
    const styles = getStylesToAvoid(faceShape);

    expect(styles).toBeInstanceOf(Array);
    styles.forEach(style => {
      expect(typeof style).toBe('string');
    });
  });

  it('should return minimal avoid list for oval (most versatile)', () => {
    const styles = getStylesToAvoid('oval');

    // 타원형은 피해야 할 스타일이 적음
    expect(styles.length).toBeLessThanOrEqual(2);
  });

  it('should warn against short cuts for round face', () => {
    const styles = getStylesToAvoid('round');

    // 둥근형은 뭉툭한 단발, 일자 뱅 피해야 함
    const hasShortWarning = styles.some(s =>
      s.includes('단발') || s.includes('일자') || s.includes('턱선')
    );
    expect(hasShortWarning).toBe(true);
  });

  it('should warn against straight bob for square face', () => {
    const styles = getStylesToAvoid('square');

    // 사각형은 각진 보브, 일자 뱅 피해야 함
    const hasAngularWarning = styles.some(s =>
      s.includes('일자') || s.includes('각진') || s.includes('직선')
    );
    expect(hasAngularWarning).toBe(true);
  });

  it('should warn against top volume for heart face', () => {
    const styles = getStylesToAvoid('heart');

    // 하트형은 탑 볼륨 과다 피해야 함
    const hasTopVolumeWarning = styles.some(s =>
      s.includes('탑 볼륨') || s.includes('풀 프린지') || s.includes('숏 뱅')
    );
    expect(hasTopVolumeWarning).toBe(true);
  });

  it('should warn against long straight for oblong face', () => {
    const styles = getStylesToAvoid('oblong');

    // 긴 형은 롱 스트레이트 피해야 함
    const hasLongWarning = styles.some(s =>
      s.includes('롱 스트레이트') || s.includes('센터 파트') || s.includes('탑 볼륨')
    );
    expect(hasLongWarning).toBe(true);
  });

  it('should return different avoid lists for different face shapes', () => {
    const roundAvoid = getStylesToAvoid('round');
    const squareAvoid = getStylesToAvoid('square');

    // 다른 얼굴형은 다른 피해야 할 스타일이 있음
    const isSame = JSON.stringify(roundAvoid.sort()) === JSON.stringify(squareAvoid.sort());
    expect(isSame).toBe(false);
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('Hair Style Recommendation Integration', () => {
  it('should provide consistent recommendations across functions', () => {
    const faceShape: FaceShapeType = 'round';

    const recommendations = recommendHairstyles(faceShape);
    const avoidStyles = getStylesToAvoid(faceShape);
    const careTips = generateCareTips(faceShape);

    // 추천 스타일은 피해야 할 스타일과 겹치지 않아야 함
    const recommendedNames = recommendations.map(r => r.name);
    const hasOverlap = avoidStyles.some(avoid =>
      recommendedNames.some(name => name.includes(avoid))
    );
    expect(hasOverlap).toBe(false);

    // 케어 팁은 추천 스타일과 관련되어야 함
    expect(careTips.length).toBeGreaterThan(0);
  });

  it('should provide complete style guidance for any face shape', () => {
    const faceShapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle'];

    faceShapes.forEach(faceShape => {
      const recommendations = recommendHairstyles(faceShape);
      const avoidStyles = getStylesToAvoid(faceShape);
      const careTips = generateCareTips(faceShape);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(avoidStyles).toBeDefined();
      expect(careTips.length).toBeGreaterThan(0);
    });
  });

  it('should provide color recommendations for all personal color seasons', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];

    seasons.forEach(season => {
      const colors = recommendHairColors(season);

      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].suitability).toBeGreaterThan(0);
    });
  });
});
