'use client';

/**
 * Active State: 맥락 기반 오늘의 제안
 *
 * P-UX3: 매번 다른 이유 — 시간대 + 분석결과 기반 개인화 한 줄 제안
 * 8블록 시간대 + 분석 데이터 조합으로 다양한 메시지 생성
 */

import { Sparkles } from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

// 시간대 블록 정의 (8블록)
type TimeBlock =
  | 'late_night'
  | 'dawn'
  | 'early_morning'
  | 'morning'
  | 'lunch'
  | 'afternoon'
  | 'evening'
  | 'night';

function getTimeBlock(hour: number): TimeBlock {
  if (hour < 3) return 'late_night';
  if (hour < 6) return 'dawn';
  if (hour < 8) return 'early_morning';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'lunch';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

// 시간대별 기본 메시지 (피부/컬러 데이터 없을 때)
const BASE_MESSAGES: Record<TimeBlock, string[]> = {
  late_night: ['충분한 수면이 효과적인 스킨케어예요', '잠들기 전 수분크림을 한 번 더 발라보세요'],
  dawn: ['이른 아침, 하루를 위한 준비를 시작해요', '새벽 공기처럼 맑은 피부를 위해 세안부터!'],
  early_morning: [
    '좋은 아침이에요! 오늘의 루틴을 확인해볼까요?',
    '아침 스트레칭으로 혈액 순환을 도와주세요',
  ],
  morning: ['자외선 차단 잊지 마세요!', '아침 식사로 피부에 영양을 공급해요'],
  lunch: ['점심 식사 후 가벼운 산책은 어떨까요?', '수분 섭취를 잊지 마세요!'],
  afternoon: ['오후 미스트로 수분을 보충해주세요', '오후 루틴도 잊지 마세요'],
  evening: ['하루 마무리 스킨케어 루틴을 시작해볼까요?', '클렌징은 피부 관리의 첫걸음이에요'],
  night: [
    '오늘 하루도 수고했어요. 나이트 케어를 시작해요',
    '수면 전 보습이 내일의 피부를 결정해요',
  ],
};

// 피부 점수 기반 메시지
function getSkinScoreMessage(skinScore: number, timeBlock: TimeBlock): string | null {
  if (skinScore < 50) {
    const messages: Partial<Record<TimeBlock, string>> = {
      early_morning: '아침 세안 후 수분 세럼을 꼼꼼히 발라주세요',
      morning: '피부가 건조해요. 보습에 집중해주세요',
      afternoon: '오후에는 미스트로 수분을 보충해주세요',
      evening: '집중 보습 마스크팩으로 피부를 달래주세요',
    };
    return messages[timeBlock] ?? null;
  }
  if (skinScore < 70) {
    const messages: Partial<Record<TimeBlock, string>> = {
      morning: '아침 세안 후 수분 세럼을 꼼꼼히 발라주세요',
      lunch: '피부 컨디션이 보통이에요. 수분 보충에 신경 써주세요',
      afternoon: '미스트로 수분을 보충하면 피부 컨디션이 올라가요',
    };
    return messages[timeBlock] ?? null;
  }
  if (skinScore >= 85) {
    const messages: Partial<Record<TimeBlock, string>> = {
      morning: '피부 컨디션이 좋아요! 오늘의 메이크업을 즐겨보세요',
      evening: '좋은 컨디션을 유지하려면 꾸준한 나이트 케어가 중요해요',
    };
    return messages[timeBlock] ?? null;
  }
  return null;
}

// 퍼스널컬러 기반 메시지
function getSeasonMessage(season: string, timeBlock: TimeBlock): string | null {
  if (timeBlock === 'morning' || timeBlock === 'early_morning') {
    return `${season}에 어울리는 오늘의 메이크업을 확인해보세요`;
  }
  if (timeBlock === 'afternoon') {
    return `${season} 톤에 맞는 오후 터치업 팁을 확인해보세요`;
  }
  return null;
}

// 날짜 기반 다양성 (같은 시간대에도 다른 메시지)
function getDayVariant(): number {
  const today = new Date();
  return (today.getDate() + today.getMonth()) % 2;
}

// 시간대별 인사이트 생성
function generateDailyInsight(analyses: AnalysisSummary[]): string {
  const hour = new Date().getHours();
  const timeBlock = getTimeBlock(hour);
  const season = analyses.find((a) => a.type === 'personal-color')?.summary;
  const skinScore = analyses.find((a) => a.type === 'skin')?.skinScore;
  const variant = getDayVariant();

  // 피부 점수 기반 (우선순위 높음)
  if (skinScore !== undefined) {
    const skinMsg = getSkinScoreMessage(skinScore, timeBlock);
    if (skinMsg) return skinMsg;
  }

  // 퍼스널컬러 기반
  if (season) {
    const seasonMsg = getSeasonMessage(season, timeBlock);
    if (seasonMsg) return seasonMsg;
  }

  // 기본 메시지 (날짜 기반 변형)
  const messages = BASE_MESSAGES[timeBlock];
  return messages[variant % messages.length];
}

interface ActiveDailyInsightProps {
  analyses: AnalysisSummary[];
}

export default function ActiveDailyInsight({ analyses }: ActiveDailyInsightProps) {
  const insight = generateDailyInsight(analyses);

  return (
    <div
      className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl p-5 border border-violet-200/50 dark:border-violet-800/30"
      data-testid="home-active-daily-insight"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Sparkles className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{insight}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analyses.length}개 분석 기반 맞춤 제안
          </p>
        </div>
      </div>
    </div>
  );
}
