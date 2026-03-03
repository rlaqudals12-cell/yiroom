/**
 * 시각 효과 유틸리티 테스트
 * coloredShadow, iconGradientShadow 함수 검증
 */

import { Platform } from 'react-native';

import { borderGlow, coloredShadow, iconGradientShadow } from '../../../lib/theme/effects';
import { brand, moduleColors } from '../../../lib/theme/tokens';

describe('borderGlow', () => {
  it('pink, purple, subtle 3종이 정의되어야 한다', () => {
    expect(borderGlow.pink).toBeDefined();
    expect(borderGlow.purple).toBeDefined();
    expect(borderGlow.subtle).toBeDefined();
  });
});

describe('coloredShadow', () => {
  const testColor = moduleColors.skin.base;

  it('sm 크기에서 올바른 스타일을 반환해야 한다', () => {
    const result = coloredShadow(testColor, 'sm');

    if (Platform.OS === 'ios') {
      expect(result).toEqual({
        shadowColor: testColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      });
    } else if (Platform.OS === 'android') {
      expect(result).toEqual({ elevation: 2 });
    }
  });

  it('md 크기에서 올바른 스타일을 반환해야 한다', () => {
    const result = coloredShadow(testColor, 'md');

    if (Platform.OS === 'ios') {
      expect(result).toEqual({
        shadowColor: testColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      });
    } else if (Platform.OS === 'android') {
      expect(result).toEqual({ elevation: 4 });
    }
  });

  it('lg 크기에서 올바른 스타일을 반환해야 한다', () => {
    const result = coloredShadow(testColor, 'lg');

    if (Platform.OS === 'ios') {
      expect(result).toEqual({
        shadowColor: testColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      });
    } else if (Platform.OS === 'android') {
      expect(result).toEqual({ elevation: 6 });
    }
  });

  it('size 미지정 시 md가 기본값이어야 한다', () => {
    const result = coloredShadow(testColor);
    const resultMd = coloredShadow(testColor, 'md');
    expect(result).toEqual(resultMd);
  });

  it('모든 모듈 색상에서 정상 동작해야 한다', () => {
    const modules = Object.keys(moduleColors) as (keyof typeof moduleColors)[];
    for (const mod of modules) {
      const result = coloredShadow(moduleColors[mod].base, 'sm');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    }
  });

  it('brand.primary 색상에서도 동작해야 한다', () => {
    const result = coloredShadow(brand.primary, 'sm');
    expect(result).toBeDefined();
  });
});

describe('iconGradientShadow', () => {
  it('iOS에서 opacity 0.3의 강한 글로우를 반환해야 한다', () => {
    const result = iconGradientShadow(moduleColors.skin.base);

    if (Platform.OS === 'ios') {
      expect(result).toEqual({
        shadowColor: moduleColors.skin.base,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      });
    } else if (Platform.OS === 'android') {
      expect(result).toEqual({ elevation: 4 });
    }
  });

  it('모든 모듈 색상에서 정상 동작해야 한다', () => {
    const modules = Object.keys(moduleColors) as (keyof typeof moduleColors)[];
    for (const mod of modules) {
      const result = iconGradientShadow(moduleColors[mod].base);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    }
  });
});
