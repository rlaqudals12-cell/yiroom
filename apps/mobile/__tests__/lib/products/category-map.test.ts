/**
 * 대분류↔세분류 카테고리 매핑 테스트
 * 대상: lib/products/category-map.ts
 */
import {
  fineCategoriesFor,
  coarseCategoryOf,
  COARSE_TO_FINE_CATEGORIES,
} from '@/lib/products/category-map';

describe('fineCategoriesFor', () => {
  it('skincare 대분류를 세분류 배열로 매핑한다', () => {
    expect(fineCategoriesFor('skincare')).toEqual([
      'cleanser',
      'toner',
      'serum',
      'essence',
      'moisturizer',
      'eye_cream',
      'mask',
      'lip_care',
    ]);
  });

  it('makeup은 [makeup]', () => {
    expect(fineCategoriesFor('makeup')).toEqual(['makeup']);
  });

  it('suncare는 [sunscreen]', () => {
    expect(fineCategoriesFor('suncare')).toEqual(['sunscreen']);
  });

  it('bodycare와 body(slug 별칭)는 동일하게 매핑된다', () => {
    expect(fineCategoriesFor('bodycare')).toEqual(['body_care', 'nail_care']);
    expect(fineCategoriesFor('body')).toEqual(fineCategoriesFor('bodycare'));
  });

  it('haircare와 hair(slug 별칭)는 동일하게 매핑된다', () => {
    expect(fineCategoriesFor('haircare')).toEqual(['hair-treatment', 'shampoo', 'scalp-care']);
    expect(fineCategoriesFor('hair')).toEqual(fineCategoriesFor('haircare'));
  });

  it('매핑에 없는 키(all/supplement 등)는 undefined → 필터 미적용', () => {
    expect(fineCategoriesFor('all')).toBeUndefined();
    expect(fineCategoriesFor('supplement')).toBeUndefined();
  });
});

describe('coarseCategoryOf', () => {
  it.each([
    ['cleanser', 'skincare'],
    ['serum', 'skincare'],
    ['lip_care', 'skincare'],
    ['makeup', 'makeup'],
    ['sunscreen', 'suncare'],
    ['body_care', 'bodycare'],
    ['nail_care', 'bodycare'],
    ['hair-treatment', 'haircare'],
    ['shampoo', 'haircare'],
    ['scalp-care', 'haircare'],
  ])('세분류 %s → 대분류 %s', (fine, coarse) => {
    expect(coarseCategoryOf(fine)).toBe(coarse);
  });

  it('알 수 없는 세분류는 skincare로 폴백한다', () => {
    expect(coarseCategoryOf('unknown')).toBe('skincare');
  });

  it('역방향은 정방향과 일관된다 (skincare 세분류 전부 skincare로 복원)', () => {
    for (const fine of COARSE_TO_FINE_CATEGORIES.skincare) {
      expect(coarseCategoryOf(fine)).toBe('skincare');
    }
  });
});
