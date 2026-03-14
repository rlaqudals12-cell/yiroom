import { describe, it, expect } from 'vitest';
import {
  CROSS_REACTIVITY_GROUPS,
  CONTRAINDICATION_RULES,
  AGE_RESTRICTIONS,
  INTERACTION_RULES,
  getEWGBaseScore,
  ACTION_PENALTIES,
} from '@/lib/safety/rules';

describe('CROSS_REACTIVITY_GROUPS', () => {
  it('5개의 교차반응 그룹이 정의되어 있다', () => {
    expect(CROSS_REACTIVITY_GROUPS).toHaveLength(5);
  });

  it('각 그룹에 id, name, nameKo, members가 있다', () => {
    for (const group of CROSS_REACTIVITY_GROUPS) {
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('nameKo');
      expect(group).toHaveProperty('members');
      expect(group.id).toBeTruthy();
      expect(group.members.length).toBeGreaterThan(0);
    }
  });

  it('견과류 그룹에 almond, walnut이 포함되어 있다', () => {
    const treeNuts = CROSS_REACTIVITY_GROUPS.find((g) => g.id === 'tree-nuts');
    expect(treeNuts).toBeDefined();
    expect(treeNuts!.members).toContain('almond');
    expect(treeNuts!.members).toContain('walnut');
    expect(treeNuts!.nameKo).toBe('견과류');
  });

  it('라텍스-과일 증후군 그룹에 latex, avocado가 포함되어 있다', () => {
    const latexFruit = CROSS_REACTIVITY_GROUPS.find((g) => g.id === 'latex-fruit');
    expect(latexFruit).toBeDefined();
    expect(latexFruit!.members).toContain('latex');
    expect(latexFruit!.members).toContain('avocado');
  });

  it('국화과 그룹에 chamomile, arnica가 포함되어 있다', () => {
    const asteraceae = CROSS_REACTIVITY_GROUPS.find((g) => g.id === 'asteraceae');
    expect(asteraceae).toBeDefined();
    expect(asteraceae!.members).toContain('chamomile');
    expect(asteraceae!.members).toContain('arnica');
  });

  it('모든 그룹 ID가 유일하다', () => {
    const ids = CROSS_REACTIVITY_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('CONTRAINDICATION_RULES', () => {
  it('금기사항 규칙이 존재한다', () => {
    expect(CONTRAINDICATION_RULES.length).toBeGreaterThan(0);
  });

  it('각 규칙에 condition, ingredients, reason, level이 있다', () => {
    for (const rule of CONTRAINDICATION_RULES) {
      expect(rule).toHaveProperty('condition');
      expect(rule).toHaveProperty('ingredients');
      expect(rule).toHaveProperty('reason');
      expect(rule).toHaveProperty('level');
      expect(rule.ingredients.length).toBeGreaterThan(0);
      expect(rule.level).toBe(2);
    }
  });

  it('임신 관련 규칙에 retinol이 포함되어 있다', () => {
    const pregnancyRetinol = CONTRAINDICATION_RULES.find(
      (r) => r.condition === 'pregnancy' && r.ingredients.includes('retinol')
    );
    expect(pregnancyRetinol).toBeDefined();
    expect(pregnancyRetinol!.reason).toContain('임신');
  });

  it('아토피 관련 규칙이 존재한다', () => {
    const atopyRules = CONTRAINDICATION_RULES.filter((r) => r.condition === 'atopy');
    expect(atopyRules.length).toBeGreaterThan(0);
  });

  it('로사시아 관련 규칙이 존재한다', () => {
    const rosaceaRules = CONTRAINDICATION_RULES.filter((r) => r.condition === 'rosacea');
    expect(rosaceaRules.length).toBeGreaterThan(0);
  });
});

describe('AGE_RESTRICTIONS', () => {
  it('연령 제한 규칙이 존재한다', () => {
    expect(AGE_RESTRICTIONS.length).toBeGreaterThan(0);
  });

  it('각 규칙에 ingredient, minAge, reason이 있다', () => {
    for (const rule of AGE_RESTRICTIONS) {
      expect(rule).toHaveProperty('ingredient');
      expect(rule).toHaveProperty('minAge');
      expect(rule).toHaveProperty('reason');
      expect(rule.minAge).toBeGreaterThan(0);
    }
  });

  it('레티놀은 16세 이상 제한이다', () => {
    const retinol = AGE_RESTRICTIONS.find((r) => r.ingredient === 'retinol');
    expect(retinol).toBeDefined();
    expect(retinol!.minAge).toBe(16);
  });

  it('AHA는 12세 이상 제한이다', () => {
    const aha = AGE_RESTRICTIONS.find((r) => r.ingredient === 'aha');
    expect(aha).toBeDefined();
    expect(aha!.minAge).toBe(12);
  });
});

describe('INTERACTION_RULES', () => {
  it('성분 상호작용 규칙이 존재한다', () => {
    expect(INTERACTION_RULES.length).toBeGreaterThan(0);
  });

  it('각 규칙에 ingredientA, ingredientB, type, reason, level이 있다', () => {
    for (const rule of INTERACTION_RULES) {
      expect(rule).toHaveProperty('ingredientA');
      expect(rule).toHaveProperty('ingredientB');
      expect(rule).toHaveProperty('type');
      expect(rule).toHaveProperty('reason');
      expect(rule).toHaveProperty('level');
      expect(['pH_conflict', 'oxidative', 'chelation']).toContain(rule.type);
      expect([2, 3]).toContain(rule.level);
    }
  });

  it('비타민C + 나이아신아마이드 pH 충돌 규칙이 있다', () => {
    const vcNiacin = INTERACTION_RULES.find(
      (r) => r.ingredientA === 'vitamin c' && r.ingredientB === 'niacinamide'
    );
    expect(vcNiacin).toBeDefined();
    expect(vcNiacin!.type).toBe('pH_conflict');
  });

  it('레티놀 + 벤조일퍼옥사이드 산화 비호환 규칙이 있다', () => {
    const retBp = INTERACTION_RULES.find(
      (r) => r.ingredientA === 'retinol' && r.ingredientB === 'benzoyl peroxide'
    );
    expect(retBp).toBeDefined();
    expect(retBp!.type).toBe('oxidative');
    expect(retBp!.level).toBe(2);
  });
});

describe('getEWGBaseScore', () => {
  it('EWG 등급 1-2는 100점을 반환한다', () => {
    expect(getEWGBaseScore(1)).toBe(100);
    expect(getEWGBaseScore(2)).toBe(100);
  });

  it('EWG 등급 3-4는 80점을 반환한다', () => {
    expect(getEWGBaseScore(3)).toBe(80);
    expect(getEWGBaseScore(4)).toBe(80);
  });

  it('EWG 등급 5-6은 60점을 반환한다', () => {
    expect(getEWGBaseScore(5)).toBe(60);
    expect(getEWGBaseScore(6)).toBe(60);
  });

  it('EWG 등급 7 이상은 40점을 반환한다', () => {
    expect(getEWGBaseScore(7)).toBe(40);
    expect(getEWGBaseScore(8)).toBe(40);
    expect(getEWGBaseScore(10)).toBe(40);
  });

  describe('경계값 테스트', () => {
    it('등급 0은 100점을 반환한다', () => {
      expect(getEWGBaseScore(0)).toBe(100);
    });
  });
});

describe('ACTION_PENALTIES', () => {
  it('모든 조치 타입에 대한 감점이 정의되어 있다', () => {
    expect(ACTION_PENALTIES).toHaveProperty('ALLERGEN');
    expect(ACTION_PENALTIES).toHaveProperty('CONTRAINDICATION');
    expect(ACTION_PENALTIES).toHaveProperty('pH_conflict');
    expect(ACTION_PENALTIES).toHaveProperty('oxidative');
    expect(ACTION_PENALTIES).toHaveProperty('chelation');
  });

  it('감점은 모두 음수이다', () => {
    for (const value of Object.values(ACTION_PENALTIES)) {
      expect(value).toBeLessThan(0);
    }
  });

  it('ALLERGEN이 가장 큰 감점을 가진다', () => {
    const allergenPenalty = Math.abs(ACTION_PENALTIES.ALLERGEN);
    for (const [key, value] of Object.entries(ACTION_PENALTIES)) {
      if (key !== 'ALLERGEN') {
        expect(allergenPenalty).toBeGreaterThanOrEqual(Math.abs(value));
      }
    }
  });
});
