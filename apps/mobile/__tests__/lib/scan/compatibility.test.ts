import { analyzeCompatibility, type UserAnalysisData } from '../../../lib/scan/compatibility';

describe('scan color compatibility', () => {
  it('한국어 색상명은 점수 없는 정성 참고로만 남기고 overall을 바꾸지 않는다', async () => {
    const userAnalysis: UserAnalysisData = {
      personalColor: { seasonType: 'spring', tone: 'warm' },
    };
    const result = await analyzeCompatibility([], 'makeup', '코랄 레드', userAnalysis);
    expect(result.colorMatch).toEqual({
      basis: 'qualitative-name',
      colorName: '코랄 레드',
      reason: expect.stringContaining('정확한 HEX 색상 코드가 필요해요'),
      requiresHex: true,
    });
    expect(result.colorMatch).not.toHaveProperty('matchScore');
    expect(result.overallScore).toBe(result.skinCompatibility.score);
  });

  it('영문 색상명도 점수 없는 정성 참고로만 남긴다', async () => {
    const result = await analyzeCompatibility([], 'lip', 'Rose Berry', {
      personalColor: { seasonType: 'summer', tone: 'cool' },
    });
    expect(result.colorMatch).toMatchObject({
      basis: 'qualitative-name',
      colorName: 'Rose Berry',
      requiresHex: true,
    });
    expect(result.overallScore).toBe(result.skinCompatibility.score);
  });

  it('12톤과 HEX가 있으면 웹과 같은 CIEDE2000 판정을 우선한다', async () => {
    const result = await analyzeCompatibility([], 'makeup', '#87CEEB', {
      personalColor: {
        seasonType: 'summer',
        tone: 'cool',
        twelveTone: 'true-summer',
      },
    });
    expect(result.colorMatch).toMatchObject({
      basis: 'ciede2000',
      isRecommended: true,
      matchScore: 95,
      reason: '진단된 12톤에 매우 잘 어울려요.',
    });
    expect(result.overallScore).toBe(result.skinCompatibility.score + 5);
  });

  it('3자리 HEX는 colorMatch와 보너스를 만들지 않는다', async () => {
    const result = await analyzeCompatibility([], 'makeup', '#abc', {
      personalColor: {
        seasonType: 'summer',
        tone: 'cool',
        twelveTone: 'true-summer',
      },
    });
    expect(result.colorMatch).toBeUndefined();
    expect(result.overallScore).toBe(result.skinCompatibility.score);
  });

  it('12톤이 없으면 6자리 HEX라도 colorMatch와 보너스를 만들지 않는다', async () => {
    const result = await analyzeCompatibility([], 'lip', '#87CEEB', {
      personalColor: { seasonType: 'summer', tone: 'cool' },
    });
    expect(result.colorMatch).toBeUndefined();
    expect(result.overallScore).toBe(result.skinCompatibility.score);
  });

  it('색 없음·미분류 색상·비색조 카테고리는 colorMatch를 만들지 않는다', async () => {
    const personalColor: UserAnalysisData = {
      personalColor: {
        seasonType: 'summer',
        tone: 'cool',
        twelveTone: 'true-summer',
      },
    };

    const [missing, unknown, skincare] = await Promise.all([
      analyzeCompatibility([], 'lip', undefined, personalColor),
      analyzeCompatibility([], 'lip', '쥬쥬브 07', personalColor),
      analyzeCompatibility([], 'skincare', '#87CEEB', personalColor),
    ]);

    expect(missing.colorMatch).toBeUndefined();
    expect(unknown.colorMatch).toBeUndefined();
    expect(skincare.colorMatch).toBeUndefined();
  });
});
