import { describe, it, expect } from 'vitest';
import { fashionEngine } from '@/lib/capsule/domains/fashion';
import type { BeautyProfile } from '@/lib/capsule/types';
import type { FashionItem } from '@/lib/capsule/domain-types';

// 테스트용 패션 아이템 생성
function createItem(overrides: Partial<FashionItem> = {}): FashionItem {
  return {
    id: 'test-1',
    name: 'Test Item',
    category: 'top',
    color: { name: 'black', hex: '#000000' },
    tags: [],
    ...overrides,
  };
}

// 기본 프로필
function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    personalizationLevel: 2,
    ...overrides,
  } as BeautyProfile;
}

describe('Fashion Engine - BodyType3 체형 반영', () => {
  describe('personalize() 체형 기반 정렬', () => {
    it('체형 정보 없으면 기본 동작 (personalColor도 없으면 원본 반환)', () => {
      const items = [createItem({ id: '1' }), createItem({ id: '2' })];
      const profile = createProfile();
      const result = fashionEngine.personalize(items, profile);
      expect(result).toHaveLength(2);
    });

    it('hourglass(모래시계) → S(스트레이트): straight 실루엣 우선', () => {
      const items = [
        createItem({ id: 'relaxed', silhouette: 'relaxed', category: 'top' }),
        createItem({ id: 'straight', silhouette: 'straight', category: 'top' }),
        createItem({ id: 'fitted', silhouette: 'fitted', category: 'bottom' }),
      ];
      const profile = createProfile({
        body: { shape: 'hourglass', measurements: {} },
      });
      const result = fashionEngine.personalize(items, profile);
      // S 타입은 straight/tailored/structured 실루엣 선호
      // straight 실루엣이 relaxed보다 앞에 와야 함
      const straightIdx = result.findIndex((i) => i.id === 'straight');
      const relaxedIdx = result.findIndex((i) => i.id === 'relaxed');
      expect(straightIdx).toBeLessThan(relaxedIdx);
    });

    it('pear(배형) → W(웨이브): fitted 실루엣 우선', () => {
      const items = [
        createItem({ id: 'oversized', silhouette: 'oversized', category: 'top' }),
        createItem({ id: 'fitted', silhouette: 'fitted', category: 'top' }),
      ];
      const profile = createProfile({
        body: { shape: 'pear', measurements: {} },
      });
      const result = fashionEngine.personalize(items, profile);
      const fittedIdx = result.findIndex((i) => i.id === 'fitted');
      const oversizedIdx = result.findIndex((i) => i.id === 'oversized');
      expect(fittedIdx).toBeLessThan(oversizedIdx);
    });

    it('rectangle(직사각) → N(내추럴): oversized 실루엣 우선', () => {
      const items = [
        createItem({ id: 'tailored', silhouette: 'tailored', category: 'top' }),
        createItem({ id: 'oversized', silhouette: 'oversized', category: 'top' }),
      ];
      const profile = createProfile({
        body: { shape: 'rectangle', measurements: {} },
      });
      const result = fashionEngine.personalize(items, profile);
      const oversizedIdx = result.findIndex((i) => i.id === 'oversized');
      const tailoredIdx = result.findIndex((i) => i.id === 'tailored');
      expect(oversizedIdx).toBeLessThan(tailoredIdx);
    });

    it('알 수 없는 체형은 체형 점수 0 (에러 없이 동작)', () => {
      const items = [createItem({ id: '1' }), createItem({ id: '2' })];
      const profile = createProfile({
        body: { shape: 'unknown_shape', measurements: {} },
      });
      // 에러 없이 동작해야 함
      const result = fashionEngine.personalize(items, profile);
      expect(result).toHaveLength(2);
    });

    it('personalColor + body 모두 있으면 합산 점수로 정렬', () => {
      const items = [
        createItem({
          id: '1',
          color: { name: 'warm', hex: '#ff0000', season: 'spring' },
          silhouette: 'straight',
        }),
        createItem({ id: '2', color: { name: 'cool', hex: '#0000ff' }, silhouette: 'oversized' }),
      ];
      const profile = createProfile({
        personalColor: { season: 'spring', subType: 'light', palette: ['#ff0000'] },
        body: { shape: 'hourglass', measurements: {} }, // S → straight 선호
      });
      const result = fashionEngine.personalize(items, profile);
      // item '1'은 시즌 매칭 + straight 실루엣 → 높은 점수
      expect(result[0].id).toBe('1');
    });
  });
});
