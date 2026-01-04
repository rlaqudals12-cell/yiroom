/**
 * 챌린지 시스템 훅
 */

import { useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import { useClerkSupabaseClient } from '../supabase';

import {
  getActiveChallenges,
  getUserChallenges,
  getUserChallengeStats,
  joinChallenge,
  type Challenge,
  type UserChallenge,
  type ChallengeStats,
} from './index';

interface UseChallengesResult {
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  stats: ChallengeStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 챌린지 목록 훅
 */
export function useChallenges(): UseChallengesResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const allChallenges = await getActiveChallenges(supabase);
      setChallenges(allChallenges);

      if (user?.id) {
        const [myUserChallenges, myStats] = await Promise.all([
          getUserChallenges(supabase, user.id),
          getUserChallengeStats(supabase, user.id),
        ]);
        setUserChallenges(myUserChallenges);
        setStats(myStats);
      }
    } catch (err) {
      console.error('[Mobile] useChallenges error:', err);
      setError('챌린지를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    challenges,
    userChallenges,
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
}

interface UseJoinChallengeResult {
  join: (challengeId: string) => Promise<{ success: boolean; error?: string }>;
  isJoining: boolean;
}

/**
 * 챌린지 참여 훅
 */
export function useJoinChallenge(
  onSuccess?: (userChallenge: UserChallenge) => void
): UseJoinChallengeResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [isJoining, setIsJoining] = useState(false);

  const join = useCallback(
    async (
      challengeId: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id || !supabase) {
        return { success: false, error: '로그인이 필요합니다' };
      }

      setIsJoining(true);

      try {
        const result = await joinChallenge(supabase, user.id, challengeId);

        if (result.success && result.userChallenge && onSuccess) {
          onSuccess(result.userChallenge);
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        console.error('[Mobile] useJoinChallenge error:', err);
        return { success: false, error: '참여에 실패했습니다' };
      } finally {
        setIsJoining(false);
      }
    },
    [user?.id, supabase, onSuccess]
  );

  return { join, isJoining };
}

interface UseActiveChallengesResult {
  activeChallenges: UserChallenge[];
  completedChallenges: UserChallenge[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * 사용자 활성 챌린지 훅
 */
export function useActiveChallenges(): UseActiveChallengesResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);

    try {
      const data = await getUserChallenges(supabase, user.id);
      setUserChallenges(data);
    } catch (err) {
      console.error('[Mobile] useActiveChallenges error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeChallenges = userChallenges.filter(
    (uc) => uc.status === 'in_progress'
  );
  const completedChallenges = userChallenges.filter(
    (uc) => uc.status === 'completed'
  );

  return {
    activeChallenges,
    completedChallenges,
    isLoading,
    refetch: fetchData,
  };
}
