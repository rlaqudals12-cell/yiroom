// ============================================================
// 리더보드 타입 정의
// Phase H Sprint 2
// ============================================================

// 기간 타입
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';

// 카테고리 타입
export type LeaderboardCategory = 'workout' | 'nutrition' | 'wellness' | 'xp' | 'level';

// 개별 랭킹 항목
export interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  change?: number; // 전 기간 대비 변화 (+3, -2 등)
  tier?: string;
  level?: number;
}

// 리더보드 데이터
export interface Leaderboard {
  id: string;
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  startDate: string;
  endDate: string;
  rankings: RankingEntry[];
  totalParticipants: number;
  updatedAt: Date;
}

// 내 순위 정보
export interface MyRanking {
  rank: number;
  score: number;
  percentile: number; // 상위 몇 %
  change?: number;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
}

// DB Row 타입
export interface LeaderboardCacheRow {
  id: string;
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  start_date: string;
  end_date: string;
  rankings: RankingEntry[];
  total_participants: number;
  created_at: string;
  updated_at: string;
}

// DB Row → Leaderboard 변환
export function toLeaderboard(row: LeaderboardCacheRow): Leaderboard {
  return {
    id: row.id,
    period: row.period,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
    rankings: row.rankings || [],
    totalParticipants: row.total_participants,
    updatedAt: new Date(row.updated_at),
  };
}

// 기간 라벨
export function getPeriodLabel(period: LeaderboardPeriod): string {
  const labels: Record<LeaderboardPeriod, string> = {
    weekly: '주간',
    monthly: '월간',
    all_time: '전체',
  };
  return labels[period];
}

// 카테고리 라벨
export function getCategoryLabel(category: LeaderboardCategory): string {
  const labels: Record<LeaderboardCategory, string> = {
    workout: '운동',
    nutrition: '영양',
    wellness: '웰니스',
    xp: '경험치',
    level: '레벨',
  };
  return labels[category];
}

// 카테고리 아이콘
export function getCategoryIcon(category: LeaderboardCategory): string {
  const icons: Record<LeaderboardCategory, string> = {
    workout: '💪',
    nutrition: '🥗',
    wellness: '✨',
    xp: '⭐',
    level: '🏆',
  };
  return icons[category];
}

// 순위 색상 (1-3위)
export function getRankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-foreground';
}

// 순위 배경색 (1-3위)
export function getRankBgColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (rank === 2) return 'bg-gray-100 dark:bg-gray-800/50';
  if (rank === 3) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-background';
}

// 순위 메달 이모지
export function getRankMedal(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

// 변화량 표시
export function formatChange(change: number | undefined): string {
  if (change === undefined || change === 0) return '-';
  if (change > 0) return `+${change}`;
  return `${change}`;
}

export function getChangeColor(change: number | undefined): string {
  if (change === undefined || change === 0) return 'text-muted-foreground';
  if (change > 0) return 'text-green-500';
  return 'text-red-500';
}
