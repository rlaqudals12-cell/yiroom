/**
 * WCAG 체크리스트 유틸리티 테스트
 *
 * @see lib/a11y/wcag-checklist.ts
 */
import { describe, it, expect } from 'vitest';
import {
  WCAG_CHECKLIST,
  ANALYSIS_MODULE_CHECKLIST,
  CATEGORY_LABELS,
  LEVEL_DESCRIPTIONS,
  calculateCheckResult,
  filterByCategory,
  filterByLevel,
  getModuleChecklist,
  getCheckItemById,
  type WCAGCheckItem,
} from '@/lib/a11y/wcag-checklist';

describe('wcag-checklist', () => {
  describe('WCAG_CHECKLIST', () => {
    it('should have at least 20 items for AA compliance', () => {
      expect(WCAG_CHECKLIST.length).toBeGreaterThanOrEqual(20);
    });

    it('should have all required fields for each item', () => {
      WCAG_CHECKLIST.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.criterion).toBeTruthy();
        expect(item.level).toMatch(/^(A|AA|AAA)$/);
        expect(item.category).toMatch(/^(perceivable|operable|understandable|robust)$/);
        expect(item.description).toBeTruthy();
        expect(item.howToTest).toBeTruthy();
      });
    });

    it('should include key WCAG 2.1 AA criteria', () => {
      const ids = WCAG_CHECKLIST.map((item) => item.id);
      expect(ids).toContain('1.1.1'); // 텍스트 대체
      expect(ids).toContain('1.4.3'); // 명암 대비
      expect(ids).toContain('2.1.1'); // 키보드
      expect(ids).toContain('2.4.7'); // 포커스 표시
      expect(ids).toContain('4.1.2'); // 이름, 역할, 값
    });

    it('should have Level A items', () => {
      const levelA = WCAG_CHECKLIST.filter((item) => item.level === 'A');
      expect(levelA.length).toBeGreaterThan(0);
    });

    it('should have Level AA items', () => {
      const levelAA = WCAG_CHECKLIST.filter((item) => item.level === 'AA');
      expect(levelAA.length).toBeGreaterThan(0);
    });
  });

  describe('ANALYSIS_MODULE_CHECKLIST', () => {
    it('should have personal-color module specific items', () => {
      expect(ANALYSIS_MODULE_CHECKLIST['personal-color']).toBeDefined();
      expect(ANALYSIS_MODULE_CHECKLIST['personal-color'].length).toBeGreaterThan(0);
    });

    it('should have skin module specific items', () => {
      expect(ANALYSIS_MODULE_CHECKLIST['skin']).toBeDefined();
      expect(ANALYSIS_MODULE_CHECKLIST['skin'].length).toBeGreaterThan(0);
    });

    it('should have body module specific items', () => {
      expect(ANALYSIS_MODULE_CHECKLIST['body']).toBeDefined();
      expect(ANALYSIS_MODULE_CHECKLIST['body'].length).toBeGreaterThan(0);
    });

    it('should have custom ID prefixes for module items', () => {
      ANALYSIS_MODULE_CHECKLIST['personal-color'].forEach((item) => {
        expect(item.id).toMatch(/^PC-/);
      });
      ANALYSIS_MODULE_CHECKLIST['skin'].forEach((item) => {
        expect(item.id).toMatch(/^SK-/);
      });
    });
  });

  describe('calculateCheckResult', () => {
    it('should calculate correct totals', () => {
      const items: WCAGCheckItem[] = [
        { ...WCAG_CHECKLIST[0], status: 'pass' },
        { ...WCAG_CHECKLIST[1], status: 'pass' },
        { ...WCAG_CHECKLIST[2], status: 'fail' },
        { ...WCAG_CHECKLIST[3], status: 'warning' },
        { ...WCAG_CHECKLIST[4], status: 'not-applicable' },
      ];

      const result = calculateCheckResult(items);

      expect(result.totalItems).toBe(5);
      expect(result.passed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.warnings).toBe(1);
      expect(result.notApplicable).toBe(1);
    });

    it('should calculate score excluding not-applicable items', () => {
      const items: WCAGCheckItem[] = [
        { ...WCAG_CHECKLIST[0], status: 'pass' },
        { ...WCAG_CHECKLIST[1], status: 'pass' },
        { ...WCAG_CHECKLIST[2], status: 'not-applicable' },
        { ...WCAG_CHECKLIST[3], status: 'not-applicable' },
      ];

      const result = calculateCheckResult(items);

      // 2 passed out of 2 applicable = 100%
      expect(result.score).toBe(100);
    });

    it('should return 100 score when all items are not-applicable', () => {
      const items: WCAGCheckItem[] = [
        { ...WCAG_CHECKLIST[0], status: 'not-applicable' },
      ];

      const result = calculateCheckResult(items);
      expect(result.score).toBe(100);
    });

    it('should include items in result', () => {
      const items: WCAGCheckItem[] = [
        { ...WCAG_CHECKLIST[0], status: 'pass' },
      ];

      const result = calculateCheckResult(items);
      expect(result.items).toEqual(items);
    });
  });

  describe('filterByCategory', () => {
    it('should filter perceivable items', () => {
      const items = filterByCategory('perceivable');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.category).toBe('perceivable');
      });
    });

    it('should filter operable items', () => {
      const items = filterByCategory('operable');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.category).toBe('operable');
      });
    });

    it('should filter understandable items', () => {
      const items = filterByCategory('understandable');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.category).toBe('understandable');
      });
    });

    it('should filter robust items', () => {
      const items = filterByCategory('robust');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.category).toBe('robust');
      });
    });
  });

  describe('filterByLevel', () => {
    it('should return only Level A items for A', () => {
      const items = filterByLevel('A');
      items.forEach((item) => {
        expect(item.level).toBe('A');
      });
    });

    it('should return Level A and AA items for AA', () => {
      const items = filterByLevel('AA');
      items.forEach((item) => {
        expect(['A', 'AA']).toContain(item.level);
      });
    });

    it('should include Level A items in AA filter', () => {
      const itemsA = filterByLevel('A');
      const itemsAA = filterByLevel('AA');
      expect(itemsAA.length).toBeGreaterThan(itemsA.length);
    });

    it('should return all items for AAA', () => {
      const items = filterByLevel('AAA');
      items.forEach((item) => {
        expect(['A', 'AA', 'AAA']).toContain(item.level);
      });
    });
  });

  describe('getModuleChecklist', () => {
    it('should include base AA checklist', () => {
      const baseChecklist = filterByLevel('AA');
      const moduleChecklist = getModuleChecklist('personal-color');

      baseChecklist.forEach((baseItem) => {
        expect(moduleChecklist.some((item) => item.id === baseItem.id)).toBe(true);
      });
    });

    it('should include module-specific items', () => {
      const moduleChecklist = getModuleChecklist('personal-color');
      const moduleSpecificItems = ANALYSIS_MODULE_CHECKLIST['personal-color'];

      moduleSpecificItems.forEach((specificItem) => {
        expect(moduleChecklist.some((item) => item.id === specificItem.id)).toBe(true);
      });
    });

    it('should return base checklist for unknown module', () => {
      const baseChecklist = filterByLevel('AA');
      // Record<string, ...> 타입이므로 unknown-module도 유효한 string
      const moduleChecklist = getModuleChecklist('unknown-module');

      expect(moduleChecklist.length).toBe(baseChecklist.length);
    });
  });

  describe('getCheckItemById', () => {
    it('should find item by id', () => {
      const item = getCheckItemById('1.1.1');
      expect(item).toBeDefined();
      expect(item?.id).toBe('1.1.1');
      expect(item?.criterion).toBe('텍스트 대체');
    });

    it('should return undefined for non-existent id', () => {
      const item = getCheckItemById('non-existent');
      expect(item).toBeUndefined();
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have Korean labels for all categories', () => {
      expect(CATEGORY_LABELS.perceivable).toBe('인식의 용이성');
      expect(CATEGORY_LABELS.operable).toBe('운용의 용이성');
      expect(CATEGORY_LABELS.understandable).toBe('이해의 용이성');
      expect(CATEGORY_LABELS.robust).toBe('견고성');
    });
  });

  describe('LEVEL_DESCRIPTIONS', () => {
    it('should have Korean descriptions for all levels', () => {
      expect(LEVEL_DESCRIPTIONS.A).toBeTruthy();
      expect(LEVEL_DESCRIPTIONS.AA).toBeTruthy();
      expect(LEVEL_DESCRIPTIONS.AAA).toBeTruthy();
    });

    it('should indicate AA is required', () => {
      expect(LEVEL_DESCRIPTIONS.AA).toContain('법적');
    });
  });
});
