// ============================================================
// 리더보드 상수
// Phase H Sprint 2
// ============================================================

import type { LeaderboardPeriod, LeaderboardCategory } from '@/types/leaderboard';

// 기본 설정
export const DEFAULT_PERIOD: LeaderboardPeriod = 'weekly';
export const DEFAULT_CATEGORY: LeaderboardCategory = 'xp';
export const MAX_RANKINGS_DISPLAY = 100;
export const TOP_RANKINGS_COUNT = 10;

// 기간별 라벨
export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  weekly: '주간',
  monthly: '월간',
  all_time: '전체',
};

// 카테고리별 라벨
export const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  workout: '운동',
  nutrition: '영양',
  wellness: '웰니스',
  xp: '경험치',
  level: '레벨',
};

// 카테고리별 아이콘
export const CATEGORY_ICONS: Record<LeaderboardCategory, string> = {
  workout: '💪',
  nutrition: '🥗',
  wellness: '✨',
  xp: '⭐',
  level: '🏆',
};

// 카테고리별 색상
export const CATEGORY_COLORS: Record<LeaderboardCategory, string> = {
  workout: 'text-orange-500',
  nutrition: 'text-green-500',
  wellness: 'text-purple-500',
  xp: 'text-yellow-500',
  level: 'text-blue-500',
};

// 순위별 배경색
export const RANK_BACKGROUNDS: Record<number, string> = {
  1: 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/10',
  2: 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-800/20',
  3: 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10',
};

// 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간대 기준)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 주간 시작일 계산 (월요일 기준)
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return formatDateLocal(d);
}

// 주간 종료일 계산 (일요일)
export function getWeekEndDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6; // 일요일로 조정
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return formatDateLocal(d);
}

// 월간 시작일 계산
export function getMonthStartDate(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return formatDateLocal(d);
}

// 월간 종료일 계산
export function getMonthEndDate(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return formatDateLocal(d);
}

// 퍼센타일 계산
export function calculatePercentile(rank: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - rank + 1) / total) * 100);
}

// 순위 포맷팅
export function formatRank(rank: number): string {
  if (rank <= 0) return '-';
  return `${rank}위`;
}

// 점수 포맷팅
export function formatScore(score: number, category: LeaderboardCategory): string {
  if (category === 'level') {
    return `Lv.${score}`;
  }
  if (category === 'xp') {
    return `${score.toLocaleString()} XP`;
  }
  return score.toLocaleString();
}
