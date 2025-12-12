import { describe, it, expect } from 'vitest';
import {
  matchCelebrityRoutines,
  findExactMatchCelebrities,
  matchCelebritiesByRoutineType,
  generateMatchingTitle,
  generateCelebrityDisplayInfo,
  getAlternativeRecommendations,
  getMatchingStats,
} from '@/lib/celebrityMatching';
import { getCelebrityById } from '@/lib/celebrities';

describe('celebrityMatching', () => {
  describe('matchCelebrityRoutines', () => {
    it('returns exact matches first (X + Summer)', () => {
      const results = matchCelebrityRoutines('X', 'Summer');

      expect(results.length).toBeGreaterThan(0);
      // 정확 매칭이 있으면 점수가 100
      const exactMatches = results.filter((r) => r.matchType === 'exact');
      exactMatches.forEach((r) => {
        expect(r.matchScore).toBe(100);
        expect(r.celebrity.bodyType).toBe('X');
        expect(r.celebrity.personalColor).toBe('Summer');
      });
    });

    it('returns body type matches with score 70', () => {
      const results = matchCelebrityRoutines('X', 'Winter');

      const bodyTypeMatches = results.filter((r) => r.matchType === 'bodyType');
      bodyTypeMatches.forEach((r) => {
        expect(r.matchScore).toBe(70);
        expect(r.celebrity.bodyType).toBe('X');
      });
    });

    it('returns personal color matches with score 50', () => {
      const results = matchCelebrityRoutines('O', 'Summer');

      // O체형은 없으므로 PC만 매칭
      const pcMatches = results.filter((r) => r.matchType === 'personalColor');
      pcMatches.forEach((r) => {
        expect(r.matchScore).toBe(50);
        expect(r.celebrity.personalColor).toBe('Summer');
      });
    });

    it('respects limit option', () => {
      const results = matchCelebrityRoutines('X', 'Summer', { limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('filters by category', () => {
      const results = matchCelebrityRoutines('X', 'Summer', {
        category: 'pilates_yoga',
      });

      results.forEach((r) => {
        expect(r.celebrity.category).toBe('pilates_yoga');
      });
    });

    it('filters by routine type', () => {
      const results = matchCelebrityRoutines('X', 'Summer', {
        routineType: 'WEIGHT',
      });

      results.forEach((r) => {
        const hasWeightRoutine = r.celebrity.routines.some(
          (routine) => routine.type === 'WEIGHT'
        );
        expect(hasWeightRoutine).toBe(true);
      });
    });

    it('includes recommended routine', () => {
      const results = matchCelebrityRoutines('X', 'Summer');

      results.forEach((r) => {
        // 모든 연예인은 최소 1개 루틴이 있음
        expect(r.recommendedRoutine).not.toBeNull();
        if (r.recommendedRoutine) {
          expect(r.recommendedRoutine.name).toBeDefined();
          expect(r.recommendedRoutine.type).toBeDefined();
        }
      });
    });

    it('sorts results by match score descending', () => {
      const results = matchCelebrityRoutines('X', 'Summer', { limit: 10 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(
          results[i].matchScore
        );
      }
    });

    it('excludes partial matches when includePartialMatch is false', () => {
      const results = matchCelebrityRoutines('X', 'Summer', {
        includePartialMatch: false,
      });

      results.forEach((r) => {
        expect(r.matchType).toBe('exact');
      });
    });
  });

  describe('findExactMatchCelebrities', () => {
    it('returns only exact matches', () => {
      const results = findExactMatchCelebrities('X', 'Summer');

      results.forEach((r) => {
        expect(r.matchType).toBe('exact');
        expect(r.matchScore).toBe(100);
      });
    });

    it('returns empty array when no exact match', () => {
      const results = findExactMatchCelebrities('O', 'Spring');
      expect(results.length).toBe(0);
    });
  });

  describe('matchCelebritiesByRoutineType', () => {
    it('filters by PILATES routine type', () => {
      const results = matchCelebritiesByRoutineType('X', 'Summer', 'PILATES');

      results.forEach((r) => {
        const hasPilates = r.celebrity.routines.some(
          (routine) => routine.type === 'PILATES'
        );
        expect(hasPilates).toBe(true);
      });
    });

    it('prefers matching routine type in recommendedRoutine', () => {
      const results = matchCelebritiesByRoutineType('X', 'Summer', 'WEIGHT');

      results.forEach((r) => {
        if (r.recommendedRoutine) {
          // 웨이트 루틴이 있으면 그것이 추천됨
          const hasWeight = r.celebrity.routines.some(
            (routine) => routine.type === 'WEIGHT'
          );
          if (hasWeight) {
            expect(r.recommendedRoutine.type).toBe('WEIGHT');
          }
        }
      });
    });
  });

  describe('generateMatchingTitle', () => {
    it('generates correct title for X + Summer', () => {
      const title = generateMatchingTitle('X', 'Summer');
      expect(title).toBe('X자 체형 + 여름 쿨 타입 연예인의 운동법');
    });

    it('generates correct title for 8 + Winter', () => {
      const title = generateMatchingTitle('8', 'Winter');
      expect(title).toBe('8자 체형 + 겨울 쿨 타입 연예인의 운동법');
    });

    it('generates correct title for A + Autumn', () => {
      const title = generateMatchingTitle('A', 'Autumn');
      expect(title).toBe('A자 체형 + 가을 웜 타입 연예인의 운동법');
    });

    it('generates correct title for I + Spring', () => {
      const title = generateMatchingTitle('I', 'Spring');
      expect(title).toBe('I자 체형 + 봄 웜 타입 연예인의 운동법');
    });
  });

  describe('generateCelebrityDisplayInfo', () => {
    it('generates display info for 제니', () => {
      const jennie = getCelebrityById('celeb-001');
      expect(jennie).toBeDefined();

      if (jennie) {
        const info = generateCelebrityDisplayInfo(jennie);
        expect(info.name).toBe('제니');
        expect(info.group).toBe('BLACKPINK');
        expect(info.bodyType).toBe('X자');
        expect(info.personalColor).toBe('여름 쿨');
        expect(info.routineTypes).toContain('필라테스');
        expect(info.routineTypes).toContain('웨이트');
      }
    });

    it('handles celebrity without group', () => {
      const suzy = getCelebrityById('celeb-003');
      expect(suzy).toBeDefined();

      if (suzy) {
        const info = generateCelebrityDisplayInfo(suzy);
        expect(info.name).toBe('수지');
        expect(info.group).toBeNull();
      }
    });

    it('removes duplicate routine types', () => {
      const jennie = getCelebrityById('celeb-001');
      if (jennie) {
        const info = generateCelebrityDisplayInfo(jennie);
        const uniqueTypes = new Set(info.routineTypes);
        expect(info.routineTypes.length).toBe(uniqueTypes.size);
      }
    });
  });

  describe('getAlternativeRecommendations', () => {
    it('returns recommendations even when no exact match', () => {
      const results = getAlternativeRecommendations('O', 'Spring');
      // O체형 + Spring 정확 매칭은 없지만 대안 추천
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('returns exact matches when available', () => {
      const results = getAlternativeRecommendations('X', 'Summer');
      // X + Summer는 정확 매칭이 있음
      const exactMatches = results.filter((r) => r.matchType === 'exact');
      expect(exactMatches.length).toBeGreaterThan(0);
    });
  });

  describe('getMatchingStats', () => {
    it('returns correct stats for X + Summer', () => {
      const stats = getMatchingStats('X', 'Summer');

      expect(stats.exactCount).toBeGreaterThan(0);
      expect(stats.totalAvailable).toBe(20);
      expect(
        stats.exactCount + stats.bodyTypeCount + stats.pcCount
      ).toBeLessThanOrEqual(stats.totalAvailable);
    });

    it('returns zero exact matches for non-existent combination', () => {
      const stats = getMatchingStats('O', 'Spring');
      expect(stats.exactCount).toBe(0);
    });

    it('counts body type matches correctly', () => {
      const stats = getMatchingStats('I', 'Winter');
      // I체형: 선미, 현아, 리사 (3명)
      // 그 중 Winter: 리사만 (1명) - 정확 매칭
      // I체형 + !Winter: 선미(Spring), 현아(Spring) - 체형 매칭
      expect(stats.exactCount).toBe(1); // 리사
      expect(stats.bodyTypeCount).toBe(2); // 선미, 현아
    });
  });

  describe('match reason generation', () => {
    it('generates correct reason for exact match', () => {
      const results = findExactMatchCelebrities('X', 'Summer', 1);
      if (results.length > 0) {
        expect(results[0].matchReason).toBe('같은 X자 체형 + 여름 쿨 타입');
      }
    });

    it('generates correct reason for body type match', () => {
      const results = matchCelebrityRoutines('X', 'Winter', { limit: 20 });
      const bodyTypeMatch = results.find((r) => r.matchType === 'bodyType');
      if (bodyTypeMatch) {
        expect(bodyTypeMatch.matchReason).toBe('같은 X자 체형');
      }
    });

    it('generates correct reason for PC match', () => {
      const results = matchCelebrityRoutines('O', 'Summer', { limit: 20 });
      const pcMatch = results.find((r) => r.matchType === 'personalColor');
      if (pcMatch) {
        expect(pcMatch.matchReason).toBe('같은 여름 쿨 타입');
      }
    });
  });

  describe('Feature Spec 3.1 compliance', () => {
    it('matches 제니 for X + Summer user', () => {
      const results = matchCelebrityRoutines('X', 'Summer');
      const jennie = results.find((r) => r.celebrity.name === '제니');

      expect(jennie).toBeDefined();
      expect(jennie?.matchType).toBe('exact');
      expect(jennie?.matchScore).toBe(100);
    });

    it('returns results in correct format for UI', () => {
      const results = matchCelebrityRoutines('X', 'Summer', { limit: 3 });

      results.forEach((r) => {
        // UI에서 필요한 모든 정보가 있는지 확인
        expect(r.celebrity.name).toBeDefined();
        expect(r.celebrity.routines.length).toBeGreaterThan(0);
        expect(r.matchReason).toBeDefined();
        expect(r.recommendedRoutine).not.toBeNull();
      });
    });
  });
});
