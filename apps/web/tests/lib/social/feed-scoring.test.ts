/**
 * 소셜 피드 스코어링 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateRecencyScore,
  calculatePopularityScore,
  calculateAffinityScore,
  getTypeWeight,
  calculateFeedScore,
  rankFeedActivities,
  applyDiversityBoost,
} from '@/lib/social/feed-scoring';
import type { Activity } from '@/lib/social/activity';

const NOW = new Date('2026-03-14T12:00:00Z');

function mockActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    userId: 'user-1',
    userName: '김이룸',
    userAvatar: null,
    type: 'workout_complete',
    title: '운동 완료',
    description: '30분 운동',
    likesCount: 0,
    isLiked: false,
    commentsCount: 0,
    createdAt: new Date('2026-03-14T10:00:00Z'), // 2시간 전
    ...overrides,
  };
}

describe('feed-scoring', () => {
  // ============================================
  // calculateRecencyScore
  // ============================================
  describe('calculateRecencyScore', () => {
    it('방금 생성 → 점수 ~1.0', () => {
      const score = calculateRecencyScore(NOW, NOW);
      expect(score).toBeCloseTo(1.0, 2);
    });

    it('반감기 후 → 점수 ~0.5', () => {
      const created = new Date('2026-03-13T12:00:00Z'); // 24시간 전
      const score = calculateRecencyScore(created, NOW, 24);
      expect(score).toBeCloseTo(0.5, 2);
    });

    it('2 반감기 후 → 점수 ~0.25', () => {
      const created = new Date('2026-03-12T12:00:00Z'); // 48시간 전
      const score = calculateRecencyScore(created, NOW, 24);
      expect(score).toBeCloseTo(0.25, 2);
    });

    it('미래 시간 → 점수 1.0 (음수 age 방지)', () => {
      const created = new Date('2026-03-15T00:00:00Z'); // 미래
      const score = calculateRecencyScore(created, NOW, 24);
      expect(score).toBe(1);
    });

    it('짧은 반감기 → 빠른 감쇠', () => {
      const created = new Date('2026-03-14T06:00:00Z'); // 6시간 전
      const shortHalf = calculateRecencyScore(created, NOW, 6);
      const longHalf = calculateRecencyScore(created, NOW, 24);
      expect(shortHalf).toBeLessThan(longHalf);
    });
  });

  // ============================================
  // calculatePopularityScore
  // ============================================
  describe('calculatePopularityScore', () => {
    it('좋아요/댓글 0 → 점수 0', () => {
      expect(calculatePopularityScore(0, 0)).toBe(0);
    });

    it('좋아요만 있을 때', () => {
      const score = calculatePopularityScore(5, 0);
      expect(score).toBeGreaterThan(0);
    });

    it('댓글이 좋아요보다 가중치 높음', () => {
      const likesOnly = calculatePopularityScore(2, 0);
      const commentsOnly = calculatePopularityScore(0, 1);
      // 댓글 1개(weight 2.0) = 좋아요 2개(weight 1.0*2)
      expect(commentsOnly).toBe(likesOnly);
    });

    it('로그 스케일 (선형 증가 아님)', () => {
      const low = calculatePopularityScore(10, 5);
      const high = calculatePopularityScore(100, 50);
      // 10배 증가해도 점수는 10배 증가하지 않음
      expect(high / low).toBeLessThan(5);
    });
  });

  // ============================================
  // calculateAffinityScore
  // ============================================
  describe('calculateAffinityScore', () => {
    it('본인 활동 → 낮은 점수', () => {
      const score = calculateAffinityScore('user-1', 'user-1');
      expect(score).toBe(0.5);
    });

    it('친한 친구 → 높은 점수', () => {
      const score = calculateAffinityScore('friend-1', 'user-1', ['friend-1']);
      expect(score).toBe(1.5);
    });

    it('일반 친구 → 기본 점수', () => {
      const score = calculateAffinityScore('friend-2', 'user-1', ['friend-1']);
      expect(score).toBe(1.0);
    });
  });

  // ============================================
  // getTypeWeight
  // ============================================
  describe('getTypeWeight', () => {
    it('challenge_complete가 가장 높음', () => {
      expect(getTypeWeight('challenge_complete')).toBe(1.5);
    });

    it('challenge_join이 가장 낮음', () => {
      expect(getTypeWeight('challenge_join')).toBe(0.8);
    });

    it('workout_complete는 기본 1.0', () => {
      expect(getTypeWeight('workout_complete')).toBe(1.0);
    });
  });

  // ============================================
  // calculateFeedScore
  // ============================================
  describe('calculateFeedScore', () => {
    const options = {
      currentUserId: 'me',
      closeFriendIds: ['close-friend'],
    };

    it('기본 점수 계산', () => {
      const result = calculateFeedScore(mockActivity(), options, NOW);
      expect(result.score).toBeGreaterThan(0);
      expect(result.recencyScore).toBeGreaterThan(0);
      expect(result.recencyScore).toBeLessThanOrEqual(1);
    });

    it('최근 활동이 오래된 활동보다 높은 점수', () => {
      const recent = calculateFeedScore(
        mockActivity({ createdAt: new Date('2026-03-14T11:00:00Z') }),
        options,
        NOW
      );
      const old = calculateFeedScore(
        mockActivity({ createdAt: new Date('2026-03-10T00:00:00Z') }),
        options,
        NOW
      );
      expect(recent.score).toBeGreaterThan(old.score);
    });

    it('인기 활동이 비인기보다 높은 점수', () => {
      const popular = calculateFeedScore(
        mockActivity({ likesCount: 20, commentsCount: 10 }),
        options,
        NOW
      );
      const unpopular = calculateFeedScore(
        mockActivity({ likesCount: 0, commentsCount: 0 }),
        options,
        NOW
      );
      expect(popular.score).toBeGreaterThan(unpopular.score);
    });

    it('친한 친구 활동이 더 높은 점수', () => {
      const closeFriend = calculateFeedScore(
        mockActivity({ userId: 'close-friend' }),
        options,
        NOW
      );
      const regular = calculateFeedScore(mockActivity({ userId: 'regular-friend' }), options, NOW);
      expect(closeFriend.score).toBeGreaterThan(regular.score);
    });
  });

  // ============================================
  // rankFeedActivities
  // ============================================
  describe('rankFeedActivities', () => {
    const options = { currentUserId: 'me' };

    it('빈 배열 → 빈 결과', () => {
      expect(rankFeedActivities([], options, NOW)).toHaveLength(0);
    });

    it('점수 내림차순 정렬', () => {
      const activities = [
        mockActivity({
          id: 'old',
          createdAt: new Date('2026-03-10T00:00:00Z'),
        }),
        mockActivity({
          id: 'recent',
          createdAt: new Date('2026-03-14T11:30:00Z'),
        }),
        mockActivity({
          id: 'mid',
          createdAt: new Date('2026-03-13T00:00:00Z'),
        }),
      ];
      const ranked = rankFeedActivities(activities, options, NOW);
      expect(ranked[0].id).toBe('recent');
      expect(ranked[ranked.length - 1].id).toBe('old');
    });

    it('feedScore 포함', () => {
      const activities = [mockActivity()];
      const ranked = rankFeedActivities(activities, options, NOW);
      expect(ranked[0].feedScore).toBeDefined();
      expect(ranked[0].feedScore.score).toBeGreaterThan(0);
    });
  });

  // ============================================
  // applyDiversityBoost
  // ============================================
  describe('applyDiversityBoost', () => {
    const options = { currentUserId: 'me' };

    it('빈 배열 → 빈 결과', () => {
      expect(applyDiversityBoost([])).toHaveLength(0);
    });

    it('짧은 목록 → 변경 없음', () => {
      const activities = rankFeedActivities(
        [mockActivity({ id: 'a' }), mockActivity({ id: 'b' })],
        options,
        NOW
      );
      const result = applyDiversityBoost(activities);
      expect(result).toHaveLength(2);
    });

    it('같은 사용자 연속 3개 이상 → 분산', () => {
      const activities = rankFeedActivities(
        [
          mockActivity({ id: '1', userId: 'user-A', createdAt: new Date('2026-03-14T11:55:00Z') }),
          mockActivity({ id: '2', userId: 'user-A', createdAt: new Date('2026-03-14T11:50:00Z') }),
          mockActivity({ id: '3', userId: 'user-A', createdAt: new Date('2026-03-14T11:45:00Z') }),
          mockActivity({ id: '4', userId: 'user-B', createdAt: new Date('2026-03-14T11:40:00Z') }),
        ],
        options,
        NOW
      );
      const result = applyDiversityBoost(activities, 2);
      // user-A가 연속 3번 나오지 않아야 함
      expect(result).toHaveLength(4);
      // 3번째 위치에 user-B가 와야 함 (user-A 2개 후 다른 사용자)
      const firstThreeUsers = result.slice(0, 3).map((a) => a.userId);
      const allSameUser = firstThreeUsers.every((u) => u === firstThreeUsers[0]);
      expect(allSameUser).toBe(false);
    });

    it('다양한 사용자 → 순서 유지', () => {
      const activities = rankFeedActivities(
        [
          mockActivity({ id: '1', userId: 'A', createdAt: new Date('2026-03-14T11:55:00Z') }),
          mockActivity({ id: '2', userId: 'B', createdAt: new Date('2026-03-14T11:50:00Z') }),
          mockActivity({ id: '3', userId: 'C', createdAt: new Date('2026-03-14T11:45:00Z') }),
        ],
        options,
        NOW
      );
      const result = applyDiversityBoost(activities, 2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });
  });
});
