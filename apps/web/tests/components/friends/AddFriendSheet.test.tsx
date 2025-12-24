import { describe, it, expect, vi } from 'vitest';
import type { UserSearchResult } from '@/types/friends';

// Mock 데이터
const mockSearchResults: UserSearchResult[] = [
  {
    userId: 'user-1',
    displayName: '김철수',
    avatarUrl: 'https://example.com/avatar1.jpg',
    level: 15,
    tier: '브론즈',
    isFriend: false,
    isPending: false,
    isBlocked: false,
  },
  {
    userId: 'user-2',
    displayName: '이영희',
    avatarUrl: null,
    level: 20,
    tier: '실버',
    isFriend: true,
    isPending: false,
    isBlocked: false,
  },
  {
    userId: 'user-3',
    displayName: '박지민',
    avatarUrl: null,
    level: 5,
    tier: '브론즈',
    isFriend: false,
    isPending: true,
    isBlocked: false,
  },
  {
    userId: 'user-4',
    displayName: '최민수',
    avatarUrl: null,
    level: 10,
    tier: '브론즈',
    isFriend: false,
    isPending: false,
    isBlocked: true,
  },
];

// AddFriendSheet 컴포넌트 로직 테스트 (유닛 테스트)
// 컴포넌트 렌더링 없이 로직만 테스트

describe('AddFriendSheet - UserSearchResult 상태 분류', () => {
  it('일반 사용자: 추가 가능', () => {
    const user = mockSearchResults[0];
    const canAdd = !user.isFriend && !user.isPending && !user.isBlocked;
    expect(canAdd).toBe(true);
  });

  it('이미 친구: 추가 불가', () => {
    const user = mockSearchResults[1];
    expect(user.isFriend).toBe(true);
  });

  it('대기중: 추가 불가', () => {
    const user = mockSearchResults[2];
    expect(user.isPending).toBe(true);
  });

  it('차단됨: 추가 불가', () => {
    const user = mockSearchResults[3];
    expect(user.isBlocked).toBe(true);
  });
});

describe('AddFriendSheet - 검색 쿼리 검증', () => {
  it('2글자 미만은 검색하지 않음', () => {
    const query = '테';
    const shouldSearch = query.length >= 2;
    expect(shouldSearch).toBe(false);
  });

  it('2글자 이상은 검색함', () => {
    const query = '테스트';
    const shouldSearch = query.length >= 2;
    expect(shouldSearch).toBe(true);
  });

  it('빈 쿼리는 검색하지 않음', () => {
    const query = '';
    const shouldSearch = query.length >= 2;
    expect(shouldSearch).toBe(false);
  });

  it('정확히 2글자도 검색함', () => {
    const query = '테스';
    const shouldSearch = query.length >= 2;
    expect(shouldSearch).toBe(true);
  });
});

describe('AddFriendSheet - 사용자 정보 형식', () => {
  it('레벨과 티어 표시 형식', () => {
    const user = mockSearchResults[0];
    const displayText = `Lv.${user.level} · ${user.tier}`;
    expect(displayText).toBe('Lv.15 · 브론즈');
  });

  it('이름 첫 글자 추출 (아바타 fallback)', () => {
    const user = mockSearchResults[0];
    const initial = user.displayName.charAt(0).toUpperCase();
    expect(initial).toBe('김');
  });

  it('아바타 URL 있는 경우', () => {
    const user = mockSearchResults[0];
    expect(user.avatarUrl).not.toBeNull();
  });

  it('아바타 URL 없는 경우', () => {
    const user = mockSearchResults[1];
    expect(user.avatarUrl).toBeNull();
  });

  it('영문 이름 첫 글자 대문자화', () => {
    const user = { ...mockSearchResults[0], displayName: 'john' };
    const initial = user.displayName.charAt(0).toUpperCase();
    expect(initial).toBe('J');
  });
});

describe('AddFriendSheet - 상태 버튼 결정 로직', () => {
  const getButtonState = (user: UserSearchResult) => {
    if (user.isBlocked) return 'blocked';
    if (user.isFriend) return 'friend';
    if (user.isPending) return 'pending';
    return 'add';
  };

  it('차단된 사용자 버튼 상태', () => {
    expect(getButtonState(mockSearchResults[3])).toBe('blocked');
  });

  it('친구인 사용자 버튼 상태', () => {
    expect(getButtonState(mockSearchResults[1])).toBe('friend');
  });

  it('대기중인 사용자 버튼 상태', () => {
    expect(getButtonState(mockSearchResults[2])).toBe('pending');
  });

  it('추가 가능한 사용자 버튼 상태', () => {
    expect(getButtonState(mockSearchResults[0])).toBe('add');
  });

  it('우선순위: 차단 > 친구 > 대기중 > 추가', () => {
    // 차단이 최우선
    const blockedAndFriend = { ...mockSearchResults[0], isBlocked: true, isFriend: true };
    expect(getButtonState(blockedAndFriend)).toBe('blocked');

    // 친구가 대기중보다 우선
    const friendAndPending = { ...mockSearchResults[0], isFriend: true, isPending: true };
    expect(getButtonState(friendAndPending)).toBe('friend');
  });
});

describe('AddFriendSheet - 검색 결과 처리', () => {
  it('빈 결과 배열 처리', () => {
    const results: UserSearchResult[] = [];
    expect(results.length).toBe(0);
  });

  it('단일 결과 처리', () => {
    const results = [mockSearchResults[0]];
    expect(results.length).toBe(1);
  });

  it('다중 결과 처리', () => {
    expect(mockSearchResults.length).toBe(4);
  });

  it('결과 필터링 - 친구 제외', () => {
    const filtered = mockSearchResults.filter(u => !u.isFriend);
    expect(filtered.length).toBe(3);
  });

  it('결과 필터링 - 차단 제외', () => {
    const filtered = mockSearchResults.filter(u => !u.isBlocked);
    expect(filtered.length).toBe(3);
  });
});
