/**
 * 챌린지 진행 시스템 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateChallengeXp,
  calculateProgress,
  calculateRemainingDays,
  isChallengeExpired,
  determineChallengeStatus,
  getAvailableChallenges,
  getChallengesByDomain,
  buildChallengeView,
  getChallengeRewardXp,
  getChallengeDifficultyStats,
  CHALLENGE_DEFINITIONS,
} from '@/lib/gamification/challenges';
import type { ChallengeDefinition, ChallengeProgress } from '@/lib/gamification/challenges';

const NOW = new Date('2026-03-14T00:00:00Z');

function mockDefinition(overrides: Partial<ChallengeDefinition> = {}): ChallengeDefinition {
  return {
    id: 'test-challenge',
    name: '테스트 챌린지',
    description: '테스트용 챌린지입니다.',
    domain: 'beauty',
    difficulty: 'medium',
    targetCount: 10,
    xpReward: 100,
    minLevel: 1,
    durationDays: 7,
    ...overrides,
  };
}

function mockProgress(overrides: Partial<ChallengeProgress> = {}): ChallengeProgress {
  return {
    challengeId: 'test-challenge',
    currentCount: 0,
    status: 'active',
    startedAt: new Date('2026-03-10T00:00:00Z'), // 4일 전
    completedAt: null,
    ...overrides,
  };
}

describe('challenges', () => {
  // ============================================
  // calculateChallengeXp
  // ============================================
  describe('calculateChallengeXp', () => {
    it('easy = baseXp * 1', () => {
      expect(calculateChallengeXp('easy')).toBe(50);
    });

    it('medium = baseXp * 2', () => {
      expect(calculateChallengeXp('medium')).toBe(100);
    });

    it('hard = baseXp * 3', () => {
      expect(calculateChallengeXp('hard')).toBe(150);
    });

    it('커스텀 baseXp', () => {
      expect(calculateChallengeXp('hard', 100)).toBe(300);
    });
  });

  // ============================================
  // calculateProgress
  // ============================================
  describe('calculateProgress', () => {
    it('0/10 → 0%', () => {
      expect(calculateProgress(0, 10)).toBe(0);
    });

    it('5/10 → 50%', () => {
      expect(calculateProgress(5, 10)).toBe(50);
    });

    it('10/10 → 100%', () => {
      expect(calculateProgress(10, 10)).toBe(100);
    });

    it('초과 달성 → 100%로 캡', () => {
      expect(calculateProgress(15, 10)).toBe(100);
    });

    it('target 0 → 100%', () => {
      expect(calculateProgress(0, 0)).toBe(100);
    });

    it('반올림 처리', () => {
      expect(calculateProgress(1, 3)).toBe(33); // 33.33... → 33
    });
  });

  // ============================================
  // calculateRemainingDays
  // ============================================
  describe('calculateRemainingDays', () => {
    it('무기한 (durationDays=0) → null', () => {
      expect(calculateRemainingDays(NOW, 0, NOW)).toBeNull();
    });

    it('시작 전 (startedAt=null) → durationDays 그대로', () => {
      expect(calculateRemainingDays(null, 7, NOW)).toBe(7);
    });

    it('4일 경과 / 7일 기간 → 3일 남음', () => {
      const started = new Date('2026-03-10T00:00:00Z');
      expect(calculateRemainingDays(started, 7, NOW)).toBe(3);
    });

    it('기간 초과 → 0', () => {
      const started = new Date('2026-03-01T00:00:00Z'); // 13일 전
      expect(calculateRemainingDays(started, 7, NOW)).toBe(0);
    });
  });

  // ============================================
  // isChallengeExpired
  // ============================================
  describe('isChallengeExpired', () => {
    it('무기한 → false', () => {
      expect(isChallengeExpired(NOW, 0, NOW)).toBe(false);
    });

    it('기간 내 → false', () => {
      const started = new Date('2026-03-10T00:00:00Z');
      expect(isChallengeExpired(started, 7, NOW)).toBe(false);
    });

    it('기간 초과 → true', () => {
      const started = new Date('2026-03-01T00:00:00Z');
      expect(isChallengeExpired(started, 7, NOW)).toBe(true);
    });
  });

  // ============================================
  // determineChallengeStatus
  // ============================================
  describe('determineChallengeStatus', () => {
    it('완료됨 → completed', () => {
      const progress = mockProgress({ completedAt: new Date() });
      expect(determineChallengeStatus(progress, mockDefinition(), 10, NOW)).toBe('completed');
    });

    it('레벨 부족 → locked', () => {
      const progress = mockProgress({ completedAt: null });
      expect(determineChallengeStatus(progress, mockDefinition({ minLevel: 20 }), 5, NOW)).toBe(
        'locked'
      );
    });

    it('기간 초과 → expired', () => {
      const progress = mockProgress({
        startedAt: new Date('2026-02-01T00:00:00Z'), // 41일 전
      });
      expect(determineChallengeStatus(progress, mockDefinition({ durationDays: 7 }), 10, NOW)).toBe(
        'expired'
      );
    });

    it('진행 중 → active', () => {
      const progress = mockProgress();
      expect(determineChallengeStatus(progress, mockDefinition(), 10, NOW)).toBe('active');
    });
  });

  // ============================================
  // getAvailableChallenges
  // ============================================
  describe('getAvailableChallenges', () => {
    it('레벨 1 → 레벨 1 이하 챌린지만', () => {
      const available = getAvailableChallenges(1);
      expect(available.every((c) => c.minLevel <= 1)).toBe(true);
      expect(available.length).toBeGreaterThan(0);
    });

    it('높은 레벨 → 더 많은 챌린지', () => {
      const level1 = getAvailableChallenges(1);
      const level10 = getAvailableChallenges(10);
      expect(level10.length).toBeGreaterThanOrEqual(level1.length);
    });

    it('완료된 챌린지 제외', () => {
      const all = getAvailableChallenges(100);
      const withExcluded = getAvailableChallenges(100, ['beauty-first-analysis']);
      expect(withExcluded.length).toBe(all.length - 1);
    });
  });

  // ============================================
  // getChallengesByDomain
  // ============================================
  describe('getChallengesByDomain', () => {
    it('beauty 도메인 챌린지', () => {
      const beautyOnes = getChallengesByDomain('beauty');
      expect(beautyOnes.length).toBeGreaterThan(0);
      expect(beautyOnes.every((c) => c.domain === 'beauty')).toBe(true);
    });

    it('cross 도메인 챌린지', () => {
      const crossOnes = getChallengesByDomain('cross');
      expect(crossOnes.length).toBeGreaterThan(0);
      expect(crossOnes.every((c) => c.domain === 'cross')).toBe(true);
    });

    it('workout 도메인 챌린지', () => {
      const workoutOnes = getChallengesByDomain('workout');
      expect(workoutOnes.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // buildChallengeView
  // ============================================
  describe('buildChallengeView', () => {
    it('진행 중인 챌린지 뷰', () => {
      const def = mockDefinition({ targetCount: 10, durationDays: 7 });
      const progress = mockProgress({ currentCount: 5 });
      const view = buildChallengeView(def, progress, 10, NOW);

      expect(view.progressPercent).toBe(50);
      expect(view.remainingDays).toBe(3);
      expect(view.progress.status).toBe('active');
    });

    it('무기한 챌린지 → remainingDays null', () => {
      const def = mockDefinition({ durationDays: 0 });
      const progress = mockProgress();
      const view = buildChallengeView(def, progress, 10, NOW);

      expect(view.remainingDays).toBeNull();
    });

    it('완료된 챌린지', () => {
      const def = mockDefinition({ targetCount: 5 });
      const progress = mockProgress({
        currentCount: 5,
        completedAt: new Date(),
      });
      const view = buildChallengeView(def, progress, 10, NOW);

      expect(view.progressPercent).toBe(100);
      expect(view.progress.status).toBe('completed');
    });
  });

  // ============================================
  // getChallengeRewardXp
  // ============================================
  describe('getChallengeRewardXp', () => {
    it('기본 보상', () => {
      const def = mockDefinition({ xpReward: 100 });
      expect(getChallengeRewardXp(def, 5)).toBe(100);
    });

    it('레벨 10 이상 → 10% 보너스', () => {
      const def = mockDefinition({ xpReward: 100 });
      expect(getChallengeRewardXp(def, 10)).toBe(110);
    });

    it('레벨 50 → 10% 보너스 (동일)', () => {
      const def = mockDefinition({ xpReward: 200 });
      expect(getChallengeRewardXp(def, 50)).toBe(220);
    });
  });

  // ============================================
  // CHALLENGE_DEFINITIONS 무결성
  // ============================================
  describe('CHALLENGE_DEFINITIONS', () => {
    it('챌린지 11개 이상 존재', () => {
      expect(CHALLENGE_DEFINITIONS.length).toBeGreaterThanOrEqual(11);
    });

    it('모든 챌린지에 필수 필드 존재', () => {
      for (const c of CHALLENGE_DEFINITIONS) {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.description).toBeTruthy();
        expect(c.targetCount).toBeGreaterThan(0);
        expect(c.xpReward).toBeGreaterThan(0);
        expect(c.minLevel).toBeGreaterThanOrEqual(1);
      }
    });

    it('ID 중복 없음', () => {
      const ids = CHALLENGE_DEFINITIONS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('난이도별 분포 확인', () => {
      const stats = getChallengeDifficultyStats();
      expect(stats.easy).toBeGreaterThan(0);
      expect(stats.medium).toBeGreaterThan(0);
      expect(stats.hard).toBeGreaterThan(0);
    });
  });
});
