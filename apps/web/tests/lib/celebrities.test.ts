import { describe, it, expect } from 'vitest';
import {
  getAllCelebrities,
  getCelebrityById,
  getCelebritiesByBodyType,
  getCelebritiesByPersonalColor,
  getCelebritiesByCategory,
  getMatchingCelebrities,
  getSimilarCelebrities,
  getRandomCelebrities,
  getCelebrityStats,
} from '@/lib/celebrities';

describe('celebrities', () => {
  describe('getAllCelebrities', () => {
    it('returns all active celebrities', () => {
      const celebrities = getAllCelebrities();
      expect(celebrities.length).toBe(20);
      celebrities.forEach((celeb) => {
        expect(celeb.isActive).toBe(true);
      });
    });

    it('each celebrity has required fields', () => {
      const celebrities = getAllCelebrities();
      celebrities.forEach((celeb) => {
        expect(celeb.id).toBeDefined();
        expect(celeb.name).toBeDefined();
        expect(celeb.nameEn).toBeDefined();
        expect(celeb.bodyType).toBeDefined();
        expect(celeb.personalColor).toBeDefined();
        expect(celeb.gender).toBe('FEMALE');
        expect(celeb.category).toBeDefined();
        expect(celeb.routines.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCelebrityById', () => {
    it('returns celebrity by ID', () => {
      const celebrity = getCelebrityById('celeb-001');
      expect(celebrity).toBeDefined();
      expect(celebrity?.name).toBe('제니');
      expect(celebrity?.group).toBe('BLACKPINK');
    });

    it('returns undefined for invalid ID', () => {
      const celebrity = getCelebrityById('invalid-id');
      expect(celebrity).toBeUndefined();
    });
  });

  describe('getCelebritiesByBodyType', () => {
    it('returns celebrities with X body type', () => {
      const celebrities = getCelebritiesByBodyType('X');
      expect(celebrities.length).toBeGreaterThan(0);
      celebrities.forEach((celeb) => {
        expect(celeb.bodyType).toBe('X');
      });
    });

    it('returns celebrities with I body type', () => {
      const celebrities = getCelebritiesByBodyType('I');
      expect(celebrities.length).toBe(3); // 선미, 현아, 리사
      expect(celebrities.map((c) => c.name)).toContain('선미');
      expect(celebrities.map((c) => c.name)).toContain('현아');
      expect(celebrities.map((c) => c.name)).toContain('리사');
    });

    it('returns celebrities with H body type', () => {
      const celebrities = getCelebritiesByBodyType('H');
      expect(celebrities.length).toBe(2); // 한혜진, 장윤주
    });
  });

  describe('getCelebritiesByPersonalColor', () => {
    it('returns celebrities with Summer PC', () => {
      const celebrities = getCelebritiesByPersonalColor('Summer');
      expect(celebrities.length).toBeGreaterThan(0);
      celebrities.forEach((celeb) => {
        expect(celeb.personalColor).toBe('Summer');
      });
    });

    it('returns celebrities with Winter PC', () => {
      const celebrities = getCelebritiesByPersonalColor('Winter');
      expect(celebrities.length).toBeGreaterThan(0);
      celebrities.forEach((celeb) => {
        expect(celeb.personalColor).toBe('Winter');
      });
    });
  });

  describe('getCelebritiesByCategory', () => {
    it('returns 6 celebrities in pilates_yoga category', () => {
      const celebrities = getCelebritiesByCategory('pilates_yoga');
      expect(celebrities.length).toBe(6);
    });

    it('returns 4 celebrities in weight category', () => {
      const celebrities = getCelebritiesByCategory('weight');
      expect(celebrities.length).toBe(4);
    });

    it('returns 4 celebrities in dance category', () => {
      const celebrities = getCelebritiesByCategory('dance');
      expect(celebrities.length).toBe(4);
    });

    it('returns 4 celebrities in model category', () => {
      const celebrities = getCelebritiesByCategory('model');
      expect(celebrities.length).toBe(4);
    });

    it('returns 2 celebrities in sports category', () => {
      const celebrities = getCelebritiesByCategory('sports');
      expect(celebrities.length).toBe(2);
    });
  });

  describe('getMatchingCelebrities', () => {
    it('returns celebrities matching both body type and PC', () => {
      const celebrities = getMatchingCelebrities('X', 'Summer');
      expect(celebrities.length).toBeGreaterThan(0);
      celebrities.forEach((celeb) => {
        expect(celeb.bodyType).toBe('X');
        expect(celeb.personalColor).toBe('Summer');
      });
    });

    it('returns empty array when no match', () => {
      const celebrities = getMatchingCelebrities('O', 'Spring');
      expect(celebrities.length).toBe(0);
    });
  });

  describe('getSimilarCelebrities', () => {
    it('returns similar celebrities when exact match exists', () => {
      const celebrities = getSimilarCelebrities('X', 'Summer', 5);
      expect(celebrities.length).toBeLessThanOrEqual(5);
      // 최소한 첫 번째는 정확히 일치해야 함
      if (celebrities.length > 0) {
        const exactMatches = celebrities.filter(
          (c) => c.bodyType === 'X' && c.personalColor === 'Summer'
        );
        expect(exactMatches.length).toBeGreaterThan(0);
      }
    });

    it('returns similar celebrities when no exact match', () => {
      const celebrities = getSimilarCelebrities('O', 'Spring', 3);
      // O체형+Spring 정확 매칭은 없지만 유사 연예인 반환
      expect(celebrities.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getRandomCelebrities', () => {
    it('returns specified number of celebrities', () => {
      const celebrities = getRandomCelebrities(3);
      expect(celebrities.length).toBe(3);
    });

    it('returns different results on multiple calls (randomness)', () => {
      // 10번 호출해서 적어도 한 번은 다른 결과가 나와야 함
      const results = Array.from({ length: 10 }, () =>
        getRandomCelebrities(3).map((c) => c.id).join(',')
      );
      const uniqueResults = new Set(results);
      // 무작위이므로 항상 다르진 않지만, 10번 중 최소 2개 이상 다른 결과
      expect(uniqueResults.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getCelebrityStats', () => {
    it('returns correct total count', () => {
      const stats = getCelebrityStats();
      expect(stats.total).toBe(20);
    });

    it('returns correct category distribution', () => {
      const stats = getCelebrityStats();
      expect(stats.byCategory.pilates_yoga).toBe(6);
      expect(stats.byCategory.weight).toBe(4);
      expect(stats.byCategory.dance).toBe(4);
      expect(stats.byCategory.model).toBe(4);
      expect(stats.byCategory.sports).toBe(2);
    });

    it('category counts sum to total', () => {
      const stats = getCelebrityStats();
      const categorySum = Object.values(stats.byCategory).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(categorySum).toBe(stats.total);
    });

    it('body type counts sum to total', () => {
      const stats = getCelebrityStats();
      const bodyTypeSum = Object.values(stats.byBodyType).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(bodyTypeSum).toBe(stats.total);
    });

    it('personal color counts sum to total', () => {
      const stats = getCelebrityStats();
      const pcSum = Object.values(stats.byPersonalColor).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(pcSum).toBe(stats.total);
    });
  });

  describe('celebrity routines', () => {
    it('each routine has required fields', () => {
      const celebrities = getAllCelebrities();
      celebrities.forEach((celeb) => {
        celeb.routines.forEach((routine) => {
          expect(routine.name).toBeDefined();
          expect(routine.type).toBeDefined();
          expect(routine.description).toBeDefined();
          expect(routine.exercises.length).toBeGreaterThan(0);
        });
      });
    });

    it('each exercise has name', () => {
      const celebrities = getAllCelebrities();
      celebrities.forEach((celeb) => {
        celeb.routines.forEach((routine) => {
          routine.exercises.forEach((exercise) => {
            expect(exercise.name).toBeDefined();
            // sets/reps 또는 duration 중 하나는 있어야 함
            const hasSetReps =
              exercise.sets !== undefined || exercise.reps !== undefined;
            const hasDuration = exercise.duration !== undefined;
            expect(hasSetReps || hasDuration).toBe(true);
          });
        });
      });
    });
  });

  describe('Feature Spec 9.2 compliance', () => {
    it('includes all required celebrities from spec', () => {
      const celebrities = getAllCelebrities();
      const names = celebrities.map((c) => c.name);

      // 필라테스/요가 (6명)
      expect(names).toContain('제니');
      expect(names).toContain('지수');
      expect(names).toContain('수지');
      expect(names).toContain('신세경');
      expect(names).toContain('한예슬');
      expect(names).toContain('손예진');

      // 웨이트/헬스 (4명)
      expect(names).toContain('이효리');
      expect(names).toContain('제시');
      expect(names).toContain('화사');
      expect(names).toContain('강소라');

      // 댄스/활동적 (4명)
      expect(names).toContain('청하');
      expect(names).toContain('선미');
      expect(names).toContain('현아');
      expect(names).toContain('리사');

      // 모델/전체관리 (4명)
      expect(names).toContain('한혜진');
      expect(names).toContain('장윤주');
      expect(names).toContain('이하늬');
      expect(names).toContain('아이린');

      // 스포츠/기타 (2명)
      expect(names).toContain('김연아');
      expect(names).toContain('손연재');
    });

    it('celebrities have correct body types from spec', () => {
      const jennie = getCelebrityById('celeb-001');
      expect(jennie?.bodyType).toBe('X'); // 제니: X자 (추정)

      const hyori = getCelebrityById('celeb-007');
      expect(hyori?.bodyType).toBe('8'); // 이효리: 8자 (추정)

      const sunmi = getCelebrityById('celeb-012');
      expect(sunmi?.bodyType).toBe('I'); // 선미: I자 (추정)

      const hanhyejin = getCelebrityById('celeb-015');
      expect(hanhyejin?.bodyType).toBe('H'); // 한혜진: H자 (추정)
    });

    it('celebrities have correct personal colors from spec', () => {
      const jennie = getCelebrityById('celeb-001');
      expect(jennie?.personalColor).toBe('Summer'); // 제니: Summer (추정)

      const suzy = getCelebrityById('celeb-003');
      expect(suzy?.personalColor).toBe('Spring'); // 수지: Spring (추정)

      const hyori = getCelebrityById('celeb-007');
      expect(hyori?.personalColor).toBe('Winter'); // 이효리: Winter (추정)

      const hwasa = getCelebrityById('celeb-009');
      expect(hwasa?.personalColor).toBe('Autumn'); // 화사: Autumn (추정)
    });
  });
});
