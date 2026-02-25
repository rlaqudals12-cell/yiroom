import { lookupIngredient, lookupIngredients } from '../../../lib/ingredients/ewg-database';

describe('lookupIngredient', () => {
  describe('안전 성분 (등급 1-2)', () => {
    it('히알루론산을 조회하면 등급 1과 보습 기능을 반환한다', () => {
      const result = lookupIngredient('히알루론산');

      expect(result.name).toBe('히알루론산');
      expect(result.nameKo).toBe('히알루론산');
      expect(result.ewgGrade).toBe(1);
      expect(result.functions).toContain('보습');
      expect(result.functions).toContain('수분 공급');
      expect(result.isCaution).toBeUndefined();
      expect(result.isAllergen).toBeUndefined();
      expect(result.description).toBeDefined();
    });
  });

  describe('보통 주의 성분 (등급 3-6)', () => {
    it('레티놀을 조회하면 등급 4와 주름 개선 기능을 반환한다', () => {
      const result = lookupIngredient('레티놀');

      expect(result.name).toBe('레티놀');
      expect(result.nameKo).toBe('레티놀');
      expect(result.ewgGrade).toBe(4);
      expect(result.functions).toContain('주름 개선');
      expect(result.functions).toContain('세포 재생');
      expect(result.functions).toContain('콜라겐 촉진');
      expect(result.isCaution).toBeUndefined();
      expect(result.isAllergen).toBeUndefined();
    });
  });

  describe('주의 성분 (등급 7+)', () => {
    it('파라벤을 조회하면 등급 7과 isCaution true를 반환한다', () => {
      const result = lookupIngredient('파라벤');

      expect(result.name).toBe('파라벤');
      expect(result.nameKo).toBe('파라벤');
      expect(result.ewgGrade).toBe(7);
      expect(result.functions).toEqual(['방부제']);
      expect(result.isCaution).toBe(true);
      expect(result.isAllergen).toBeUndefined();
    });
  });

  describe('알레르기 유발 성분', () => {
    it('인공 향료를 조회하면 등급 8, isCaution, isAllergen 모두 true를 반환한다', () => {
      const result = lookupIngredient('인공 향료');

      expect(result.name).toBe('인공 향료');
      expect(result.nameKo).toBe('인공 향료');
      expect(result.ewgGrade).toBe(8);
      expect(result.functions).toEqual(['향기']);
      expect(result.isCaution).toBe(true);
      expect(result.isAllergen).toBe(true);
    });
  });

  describe('미등록 성분', () => {
    it('DB에 없는 성분은 등급 없이 빈 functions 배열을 반환한다', () => {
      const result = lookupIngredient('알수없는성분XYZ');

      expect(result.name).toBe('알수없는성분XYZ');
      expect(result.nameKo).toBe('알수없는성분XYZ');
      expect(result.ewgGrade).toBeUndefined();
      expect(result.functions).toEqual([]);
      expect(result.isCaution).toBeUndefined();
      expect(result.isAllergen).toBeUndefined();
      expect(result.description).toBeUndefined();
    });
  });
});

describe('lookupIngredients', () => {
  it('여러 성분을 한 번에 조회하면 각각의 정보를 배열로 반환한다', () => {
    const names = ['히알루론산', '레티놀', '파라벤', '없는성분'];
    const results = lookupIngredients(names);

    expect(results).toHaveLength(4);
    expect(results[0].ewgGrade).toBe(1);
    expect(results[1].ewgGrade).toBe(4);
    expect(results[2].ewgGrade).toBe(7);
    expect(results[3].ewgGrade).toBeUndefined();
  });

  it('빈 배열을 전달하면 빈 배열을 반환한다', () => {
    const results = lookupIngredients([]);

    expect(results).toEqual([]);
  });
});
