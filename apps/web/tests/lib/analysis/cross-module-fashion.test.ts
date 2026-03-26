import { describe, it, expect } from 'vitest';
import { generateIntegratedFashionRecommendation } from '@/lib/analysis/cross-module';

describe('generateIntegratedFashionRecommendation', () => {
  it('3모듈 조합 추천을 생성한다', () => {
    const result = generateIntegratedFashionRecommendation('spring', 'S', 'dry');
    expect(result.colors.length).toBeGreaterThan(0);
    expect(result.silhouettes.length).toBeGreaterThan(0);
    expect(result.fabrics.length).toBeGreaterThan(0);
    expect(result.avoid.length).toBeGreaterThan(0);
    expect(result.description).toContain('봄 웜톤');
    expect(result.description).toContain('스트레이트');
  });

  it('시즌별 색상이 다르다', () => {
    const spring = generateIntegratedFashionRecommendation('spring', 'S', 'normal');
    const winter = generateIntegratedFashionRecommendation('winter', 'S', 'normal');
    expect(spring.colors).not.toEqual(winter.colors);
  });

  it('체형별 실루엣이 다르다', () => {
    const straight = generateIntegratedFashionRecommendation('spring', 'S', 'normal');
    const wave = generateIntegratedFashionRecommendation('spring', 'W', 'normal');
    expect(straight.silhouettes).not.toEqual(wave.silhouettes);
  });

  it('피부타입별 소재가 다르다', () => {
    const dry = generateIntegratedFashionRecommendation('spring', 'S', 'dry');
    const oily = generateIntegratedFashionRecommendation('spring', 'S', 'oily');
    expect(dry.fabrics).not.toEqual(oily.fabrics);
  });

  it('민감성 피부는 저자극 소재 추천', () => {
    const result = generateIntegratedFashionRecommendation('summer', 'W', 'sensitive');
    expect(
      result.fabrics.some((f) => f.includes('코튼') || f.includes('실크') || f.includes('텐셀'))
    ).toBe(true);
  });

  it('reasoning에 3가지 근거 모두 포함', () => {
    const result = generateIntegratedFashionRecommendation('autumn', 'N', 'combination');
    expect(result.reasoning).toContain('퍼스널컬러');
    expect(result.reasoning).toContain('체형');
    expect(result.reasoning).toContain('피부');
  });

  it('파라미터 없으면 기본값 사용', () => {
    const result = generateIntegratedFashionRecommendation();
    expect(result.colors.length).toBeGreaterThan(0);
    expect(result.description).toBeTruthy();
  });

  it('가을+내추럴+지성 조합', () => {
    const result = generateIntegratedFashionRecommendation('autumn', 'N', 'oily');
    expect(result.colors).toContain('버건디');
    expect(result.silhouettes).toContain('릴렉스드 핏');
    expect(result.fabrics).toContain('린넨');
  });
});
