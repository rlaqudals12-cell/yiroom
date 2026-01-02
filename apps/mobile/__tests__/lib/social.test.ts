/**
 * 소셜 모듈 테스트
 */

import {
  Friend,
  FriendRequest,
  FriendStats,
  UserSearchResult,
  RankingEntry,
  getTierLabel,
  getTierColor,
} from '../../lib/social';

describe('Friend 타입', () => {
  it('친구 구조가 올바라야 함', () => {
    const friend: Friend = {
      userId: 'user-123',
      displayName: '테스트 유저',
      avatarUrl: 'https://example.com/avatar.png',
      level: 10,
      tier: 'silver',
      friendshipId: 'fs-123',
      friendSince: new Date(),
    };

    expect(friend.userId).toBeDefined();
    expect(friend.displayName).toBe('테스트 유저');
    expect(friend.level).toBe(10);
    expect(friend.tier).toBe('silver');
    expect(friend.friendSince).toBeInstanceOf(Date);
  });
});

describe('FriendRequest 타입', () => {
  it('친구 요청 구조가 올바라야 함', () => {
    const request: FriendRequest = {
      id: 'req-123',
      requesterId: 'user-456',
      requesterName: '요청자',
      requesterAvatar: null,
      requesterLevel: 5,
      createdAt: new Date(),
    };

    expect(request.id).toBeDefined();
    expect(request.requesterId).toBe('user-456');
    expect(request.requesterName).toBe('요청자');
    expect(request.createdAt).toBeInstanceOf(Date);
  });
});

describe('FriendStats 타입', () => {
  it('통계 구조가 올바라야 함', () => {
    const stats: FriendStats = {
      totalFriends: 15,
      pendingRequests: 3,
      sentRequests: 2,
    };

    expect(stats.totalFriends).toBe(15);
    expect(stats.pendingRequests).toBe(3);
    expect(stats.sentRequests).toBe(2);
  });
});

describe('UserSearchResult 타입', () => {
  it('검색 결과 구조가 올바라야 함', () => {
    const result: UserSearchResult = {
      userId: 'user-789',
      displayName: '검색된 유저',
      avatarUrl: null,
      level: 8,
      tier: 'gold',
      isFriend: false,
      isPending: false,
      isBlocked: false,
    };

    expect(result.userId).toBeDefined();
    expect(result.isFriend).toBe(false);
    expect(result.isPending).toBe(false);
    expect(result.isBlocked).toBe(false);
  });

  it('이미 친구인 경우 isFriend가 true여야 함', () => {
    const result: UserSearchResult = {
      userId: 'user-999',
      displayName: '친구 유저',
      avatarUrl: null,
      level: 12,
      tier: 'platinum',
      isFriend: true,
      isPending: false,
      isBlocked: false,
    };

    expect(result.isFriend).toBe(true);
  });
});

describe('RankingEntry 타입', () => {
  it('랭킹 항목 구조가 올바라야 함', () => {
    const entry: RankingEntry = {
      rank: 1,
      userId: 'user-top',
      displayName: '1등 유저',
      avatarUrl: 'https://example.com/top.png',
      score: 10000,
      level: 50,
      tier: 'master',
    };

    expect(entry.rank).toBe(1);
    expect(entry.score).toBe(10000);
    expect(entry.tier).toBe('master');
  });
});

describe('getTierLabel', () => {
  it('티어 한글 이름을 반환해야 함', () => {
    expect(getTierLabel('beginner')).toBe('초보자');
    expect(getTierLabel('bronze')).toBe('브론즈');
    expect(getTierLabel('silver')).toBe('실버');
    expect(getTierLabel('gold')).toBe('골드');
    expect(getTierLabel('platinum')).toBe('플래티넘');
    expect(getTierLabel('diamond')).toBe('다이아몬드');
    expect(getTierLabel('master')).toBe('마스터');
  });

  it('알 수 없는 티어는 원래 값을 반환해야 함', () => {
    expect(getTierLabel('unknown')).toBe('unknown');
  });
});

describe('getTierColor', () => {
  it('티어별 색상을 반환해야 함', () => {
    expect(getTierColor('beginner')).toBe('#9ca3af');
    expect(getTierColor('bronze')).toBe('#cd7f32');
    expect(getTierColor('silver')).toBe('#c0c0c0');
    expect(getTierColor('gold')).toBe('#ffd700');
    expect(getTierColor('platinum')).toBe('#00d4ff');
    expect(getTierColor('diamond')).toBe('#b9f2ff');
    expect(getTierColor('master')).toBe('#ff6b6b');
  });

  it('알 수 없는 티어는 기본 색상을 반환해야 함', () => {
    expect(getTierColor('unknown')).toBe('#9ca3af');
  });
});
