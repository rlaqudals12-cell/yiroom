import { describe, it, expect } from 'vitest';
import {
  userLevelRowToUserLevel,
  didLevelUp,
  didTierChange,
  getLevelUpMessage,
} from '@/lib/gamification/levels';
import type { UserLevelRow, LevelUpResult } from '@/types/gamification';

describe('레벨 라이브러리', () => {
  describe('userLevelRowToUserLevel', () => {
    it('DB Row를 UserLevel 객체로 변환', () => {
      const row: UserLevelRow = {
        id: 'level-123',
        clerk_user_id: 'user_abc',
        level: 5,
        current_xp: 250,
        total_xp: 1250,
        tier: 'beginner',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const userLevel = userLevelRowToUserLevel(row);

      expect(userLevel.id).toBe('level-123');
      expect(userLevel.clerkUserId).toBe('user_abc');
      expect(userLevel.level).toBe(5);
      expect(userLevel.currentXp).toBe(250);
      expect(userLevel.totalXp).toBe(1250);
      expect(userLevel.tier).toBe('beginner');
      expect(userLevel.createdAt).toBeInstanceOf(Date);
      expect(userLevel.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('didLevelUp', () => {
    it('레벨이 올랐으면 true', () => {
      const result: LevelUpResult = {
        previousLevel: 5,
        newLevel: 6,
        previousTier: 'beginner',
        newTier: 'beginner',
        tierChanged: false,
        xpGained: 50,
        totalXp: 1500,
      };

      expect(didLevelUp(result)).toBe(true);
    });

    it('레벨이 동일하면 false', () => {
      const result: LevelUpResult = {
        previousLevel: 5,
        newLevel: 5,
        previousTier: 'beginner',
        newTier: 'beginner',
        tierChanged: false,
        xpGained: 10,
        totalXp: 1000,
      };

      expect(didLevelUp(result)).toBe(false);
    });

    it('result가 null이면 false', () => {
      expect(didLevelUp(null)).toBe(false);
    });
  });

  describe('didTierChange', () => {
    it('티어가 바뀌면 true', () => {
      const result: LevelUpResult = {
        previousLevel: 10,
        newLevel: 11,
        previousTier: 'beginner',
        newTier: 'practitioner',
        tierChanged: true,
        xpGained: 100,
        totalXp: 5500,
      };

      expect(didTierChange(result)).toBe(true);
    });

    it('티어가 동일하면 false', () => {
      const result: LevelUpResult = {
        previousLevel: 5,
        newLevel: 6,
        previousTier: 'beginner',
        newTier: 'beginner',
        tierChanged: false,
        xpGained: 100,
        totalXp: 1500,
      };

      expect(didTierChange(result)).toBe(false);
    });

    it('result가 null이면 false', () => {
      expect(didTierChange(null)).toBe(false);
    });
  });

  describe('getLevelUpMessage', () => {
    it('레벨업 메시지 반환', () => {
      const result: LevelUpResult = {
        previousLevel: 5,
        newLevel: 6,
        previousTier: 'beginner',
        newTier: 'beginner',
        tierChanged: false,
        xpGained: 100,
        totalXp: 1500,
      };

      const message = getLevelUpMessage(result);

      expect(message).toContain('레벨 6');
    });

    it('티어 변경 시 티어명 포함', () => {
      const result: LevelUpResult = {
        previousLevel: 10,
        newLevel: 11,
        previousTier: 'beginner',
        newTier: 'practitioner',
        tierChanged: true,
        xpGained: 100,
        totalXp: 5500,
      };

      const message = getLevelUpMessage(result);

      expect(message).toContain('프랙티셔너');
      expect(message).toContain('레벨 11');
    });
  });
});
