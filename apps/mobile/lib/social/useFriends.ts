/**
 * 친구 시스템 훅
 * 친구 목록, 요청, 검색 기능 제공
 */

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';

import { useClerkSupabaseClient } from '../supabase';
import {
  getFriends,
  getReceivedRequests,
  getFriendStats,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  type Friend,
  type FriendRequest,
  type FriendStats,
  type UserSearchResult,
} from './index';

interface UseFriendsResult {
  friends: Friend[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 친구 목록 훅
 */
export function useFriends(): UseFriendsResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getFriends(supabase, user.id);
      setFriends(data);
    } catch (err) {
      console.error('[Mobile] useFriends error:', err);
      setError('친구 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return { friends, isLoading, error, refetch: fetchFriends };
}

interface UseFriendRequestsResult {
  requests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  accept: (friendshipId: string) => Promise<boolean>;
  reject: (friendshipId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * 친구 요청 훅
 */
export function useFriendRequests(): UseFriendRequestsResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getReceivedRequests(supabase, user.id);
      setRequests(data);
    } catch (err) {
      console.error('[Mobile] useFriendRequests error:', err);
      setError('친구 요청을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const accept = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      if (!supabase) return false;

      const result = await acceptFriendRequest(supabase, friendshipId);
      if (result.success) {
        // 목록에서 제거
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
      }
      return result.success;
    },
    [supabase]
  );

  const reject = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      if (!supabase) return false;

      const result = await rejectFriendRequest(supabase, friendshipId);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
      }
      return result.success;
    },
    [supabase]
  );

  return { requests, isLoading, error, accept, reject, refetch: fetchRequests };
}

interface UseFriendStatsResult {
  stats: FriendStats | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * 친구 통계 훅
 */
export function useFriendStats(): UseFriendStatsResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);

    try {
      const data = await getFriendStats(supabase, user.id);
      setStats(data);
    } catch (err) {
      console.error('[Mobile] useFriendStats error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}

interface UseUserSearchResult {
  results: UserSearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  sendRequest: (targetUserId: string) => Promise<boolean>;
  clear: () => void;
}

/**
 * 사용자 검색 훅
 */
export function useUserSearch(): UseUserSearchResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      if (!user?.id || !supabase) return;

      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await searchUsers(supabase, user.id, query);
        setResults(data);
      } catch (err) {
        console.error('[Mobile] useUserSearch error:', err);
        setError('검색에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, supabase]
  );

  const sendRequest = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!user?.id || !supabase) return false;

      const result = await sendFriendRequest(supabase, user.id, targetUserId);
      if (result.success) {
        // 결과 업데이트
        setResults((prev) =>
          prev.map((r) =>
            r.userId === targetUserId ? { ...r, isPending: true } : r
          )
        );
      }
      return result.success;
    },
    [user?.id, supabase]
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, search, sendRequest, clear };
}
