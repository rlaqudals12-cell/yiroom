import { hexToLab } from '../../../lib/color';
import { findNearestOpticalDrape } from '../../../lib/analysis/drape-palette';
import {
  getToneCompatibility,
  resolveTwelveTone,
} from '../../../lib/analysis/personal-color-v2';

describe('personal-color-v2 compatibility mirror', () => {
  it('웹 패리티 fixture: true-summer 스카이블루는 95/perfect다', () => {
    const result = getToneCompatibility('true-summer', hexToLab('#87CEEB'));
    expect(result).toEqual({
      score: 95,
      grade: 'perfect',
      description: '진단된 12톤에 매우 잘 어울려요.',
    });
  });

  it('DB mute 표기를 muted 12톤 키로 정규화한다', () => {
    expect(resolveTwelveTone('summer', 'mute')).toBe('muted-summer');
    expect(resolveTwelveTone('spring', null)).toBeNull();
  });

  it('웹과 동일한 32색 광학 메타에서 nearest reference를 찾는다', () => {
    const reference = findNearestOpticalDrape('#FF8A65');
    expect(reference).toMatchObject({ name: '코랄', reflectance: 0.7, warmth: 0.75 });
  });
});
