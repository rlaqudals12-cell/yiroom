/**
 * Andre Walker 텍스처 분류 시스템 테스트
 *
 * @module tests/lib/analysis/hair/texture-classifier
 */

import { describe, it, expect } from 'vitest';
import {
  getTextureInfo,
  classifyTexture,
  getTextureGroupLabel,
  getRecommendedProductCategories,
  getAllTextures,
  getTexturesByGroup,
} from '@/lib/analysis/hair/texture-classifier';
import type { TextureCode, TextureGroup } from '@/lib/analysis/hair/texture-classifier';

// =============================================================================
// getTextureInfo
// =============================================================================

describe('getTextureInfo', () => {
  it('12종 텍스처 모두 유효한 분류 정보를 반환한다', () => {
    const codes: TextureCode[] = [
      '1a',
      '1b',
      '1c',
      '2a',
      '2b',
      '2c',
      '3a',
      '3b',
      '3c',
      '4a',
      '4b',
      '4c',
    ];

    codes.forEach((code) => {
      const info = getTextureInfo(code);
      expect(info).toBeDefined();
      expect(info.code).toBe(code);
      expect(info.group).toBeGreaterThanOrEqual(1);
      expect(info.group).toBeLessThanOrEqual(4);
      expect(['a', 'b', 'c']).toContain(info.subgroup);
      expect(info.label).toBeTruthy();
      expect(info.labelEn).toBeTruthy();
      expect(info.maintenanceLevel).toBeGreaterThanOrEqual(1);
      expect(info.maintenanceLevel).toBeLessThanOrEqual(5);
      expect(info.moistureNeed).toBeGreaterThanOrEqual(1);
      expect(info.moistureNeed).toBeLessThanOrEqual(5);
    });
  });

  it('1a는 매우 가는 직모이다', () => {
    const info = getTextureInfo('1a');
    expect(info.group).toBe(1);
    expect(info.subgroup).toBe('a');
    expect(info.label).toContain('직모');
    expect(info.maintenanceLevel).toBe(1);
    expect(info.moistureNeed).toBe(1);
    expect(info.volumeCharacteristic).toBe('flat');
  });

  it('4c는 가장 촘촘한 코일리이다', () => {
    const info = getTextureInfo('4c');
    expect(info.group).toBe(4);
    expect(info.subgroup).toBe('c');
    expect(info.maintenanceLevel).toBe(5);
    expect(info.moistureNeed).toBe(5);
    expect(info.volumeCharacteristic).toBe('maximum');
  });

  it('그룹이 높을수록 moistureNeed가 높거나 같다', () => {
    const g1 = getTextureInfo('1b').moistureNeed;
    const g2 = getTextureInfo('2b').moistureNeed;
    const g3 = getTextureInfo('3b').moistureNeed;
    const g4 = getTextureInfo('4b').moistureNeed;
    expect(g2).toBeGreaterThanOrEqual(g1);
    expect(g3).toBeGreaterThanOrEqual(g2);
    expect(g4).toBeGreaterThanOrEqual(g3);
  });
});

// =============================================================================
// classifyTexture
// =============================================================================

describe('classifyTexture', () => {
  it('straight + fine → 1a', () => {
    expect(classifyTexture('straight', { thickness: 'fine' })).toBe('1a');
  });

  it('straight + medium → 1b', () => {
    expect(classifyTexture('straight', { thickness: 'medium' })).toBe('1b');
  });

  it('straight + thick → 1c', () => {
    expect(classifyTexture('straight', { thickness: 'thick' })).toBe('1c');
  });

  it('straight 기본값은 1b (medium)', () => {
    expect(classifyTexture('straight')).toBe('1b');
  });

  it('wavy + curlIntensity < 35 → 2a', () => {
    expect(classifyTexture('wavy', { curlIntensity: 20 })).toBe('2a');
  });

  it('wavy + curlIntensity 35-65 → 2b', () => {
    expect(classifyTexture('wavy', { curlIntensity: 50 })).toBe('2b');
  });

  it('wavy + curlIntensity > 65 → 2c', () => {
    expect(classifyTexture('wavy', { curlIntensity: 80 })).toBe('2c');
  });

  it('curly + curlIntensity < 35 → 3a', () => {
    expect(classifyTexture('curly', { curlIntensity: 25 })).toBe('3a');
  });

  it('curly + curlIntensity > 65 → 3c', () => {
    expect(classifyTexture('curly', { curlIntensity: 70 })).toBe('3c');
  });

  it('coily + shrinkageRatio < 0.7 → 4a', () => {
    expect(classifyTexture('coily', { shrinkageRatio: 0.6 })).toBe('4a');
  });

  it('coily + shrinkageRatio 0.7-0.8 → 4b', () => {
    expect(classifyTexture('coily', { shrinkageRatio: 0.75 })).toBe('4b');
  });

  it('coily + shrinkageRatio > 0.8 → 4c', () => {
    expect(classifyTexture('coily', { shrinkageRatio: 0.85 })).toBe('4c');
  });

  it('coily 기본 shrinkageRatio는 0.7 → 4b', () => {
    expect(classifyTexture('coily')).toBe('4b');
  });
});

// =============================================================================
// getTextureGroupLabel
// =============================================================================

describe('getTextureGroupLabel', () => {
  it('4개 그룹 라벨을 반환한다', () => {
    const groups: TextureGroup[] = [1, 2, 3, 4];
    const labels = groups.map(getTextureGroupLabel);

    expect(labels[0]).toContain('Straight');
    expect(labels[1]).toContain('Wavy');
    expect(labels[2]).toContain('Curly');
    expect(labels[3]).toContain('Coily');
  });
});

// =============================================================================
// getRecommendedProductCategories
// =============================================================================

describe('getRecommendedProductCategories', () => {
  it('직모(1a)는 경량 제품을 추천한다', () => {
    const categories = getRecommendedProductCategories('1a');
    expect(categories).toContain('경량 컨디셔너');
    expect(categories).toContain('드라이 샴푸');
  });

  it('곱슬(3b)은 딥 컨디셔너를 추천한다', () => {
    const categories = getRecommendedProductCategories('3b');
    expect(categories).toContain('딥 컨디셔너');
    expect(categories).toContain('컬 디파이닝 젤');
  });

  it('moistureNeed 3인 텍스처는 모이스처 크림을 추천한다', () => {
    const categories = getRecommendedProductCategories('2b');
    expect(categories).toContain('모이스처 크림');
  });
});

// =============================================================================
// getAllTextures / getTexturesByGroup
// =============================================================================

describe('getAllTextures', () => {
  it('12종 텍스처 목록을 반환한다', () => {
    const all = getAllTextures();
    expect(all).toHaveLength(12);
  });
});

describe('getTexturesByGroup', () => {
  it('각 그룹에 3종 텍스처가 있다', () => {
    const groups: TextureGroup[] = [1, 2, 3, 4];
    groups.forEach((g) => {
      expect(getTexturesByGroup(g)).toHaveLength(3);
    });
  });

  it('그룹 3은 곱슬 유형만 포함한다', () => {
    const group3 = getTexturesByGroup(3);
    group3.forEach((t) => {
      expect(t.group).toBe(3);
      expect(t.code.startsWith('3')).toBe(true);
    });
  });
});
