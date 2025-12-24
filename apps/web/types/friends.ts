// ============================================================
// 친구 시스템 타입 정의
// Phase H Sprint 2
// ============================================================

// 친구 관계 상태
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

// 친구 관계
export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 친구 정보 (사용자 정보 포함)
export interface Friend {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  totalXp: number;
  tier: string;
  friendshipId: string;
  friendSince: Date;
}

// 친구 요청
export interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string | null;
  requesterLevel: number;
  createdAt: Date;
}

// 사용자 검색 결과
export interface UserSearchResult {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  tier: string;
  isFriend: boolean;
  isPending: boolean;
  isBlocked: boolean;
}

// 친구 통계
export interface FriendStats {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
}

// DB Row 타입
export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

// DB Row → Friendship 변환
export function toFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// 친구 관계 확인 헬퍼
export function isFriend(friendship: Friendship): boolean {
  return friendship.status === 'accepted';
}

export function isPending(friendship: Friendship): boolean {
  return friendship.status === 'pending';
}

export function isBlocked(friendship: Friendship): boolean {
  return friendship.status === 'blocked';
}

// 상태별 라벨
export function getFriendshipStatusLabel(status: FriendshipStatus): string {
  const labels: Record<FriendshipStatus, string> = {
    pending: '대기 중',
    accepted: '친구',
    rejected: '거절됨',
    blocked: '차단됨',
  };
  return labels[status];
}

// 상태별 색상
export function getFriendshipStatusColor(status: FriendshipStatus): string {
  const colors: Record<FriendshipStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    accepted: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100',
    blocked: 'text-gray-600 bg-gray-100',
  };
  return colors[status];
}
