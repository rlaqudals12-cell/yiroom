/**
 * 리더보드 훅
 * 전체/친구 리더보드 및 내 순위 조회
 */

import { useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import { useClerkSupabaseClient } from '../supabase';
import { socialLogger } from '../utils/logger';

import {
  getXpLeaderboard,
  getFriendsLeaderboard,
  getMyRanking,
  type RankingEntry,
  type LeaderboardCategory,
} from './index';

interface UseLeaderboardResult {
  rankings: RankingEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 전체 리더보드 훅
 */
export function useLeaderboard(
  _category: LeaderboardCategory = 'xp',
  limit: number = 50
): UseLeaderboardResult {
  const supabase = useClerkSupabaseClient();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      // 현재는 XP 리더보드만 지원
      const data = await getXpLeaderboard(supabase, limit);
      setRankings(data);
    } catch (err) {
      socialLogger.error(' useLeaderboard error:', err);
      setError('리더보드를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { rankings, isLoading, error, refetch: fetchLeaderboard };
}

interface UseFriendsLeaderboardResult {
  rankings: RankingEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 친구 리더보드 훅
 */
export function useFriendsLeaderboard(
  category: LeaderboardCategory = 'xp'
): UseFriendsLeaderboardResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getFriendsLeaderboard(supabase, user.id, category);
      setRankings(data);
    } catch (err) {
      socialLogger.error(' useFriendsLeaderboard error:', err);
      setError('친구 리더보드를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { rankings, isLoading, error, refetch: fetchLeaderboard };
}

interface UseMyRankingResult {
  rank: number | null;
  totalUsers: number;
  percentile: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * 내 순위 훅
 */
export function useMyRanking(): UseMyRankingResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [rank, setRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);

    try {
      const data = await getMyRanking(supabase, user.id);
      if (data) {
        setRank(data.rank);
        setTotalUsers(data.totalUsers);
      }
    } catch (err) {
      socialLogger.error(' useMyRanking error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // 상위 퍼센트 계산
  const percentile =
    rank && totalUsers > 0 ? Math.round((rank / totalUsers) * 100) : 100;

  return { rank, totalUsers, percentile, isLoading, refetch: fetchRanking };
}
