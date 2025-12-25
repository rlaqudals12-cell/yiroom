'use client';

import { Award, Star, Users, Sparkles, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { YearlyStats } from '@/lib/reports/yearlyTypes';

interface TopAchievementsProps {
  stats: YearlyStats;
}

interface AchievementItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

function AchievementItem({ icon, title, description, highlight }: AchievementItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        highlight
          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-800'
          : 'bg-muted/50'
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
          highlight
            ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {highlight && (
        <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      )}
    </div>
  );
}

export function TopAchievements({ stats }: TopAchievementsProps) {
  // 분석 완료 개수 계산
  const analysisCount = [
    stats.analyses.personalColorAnalysis,
    stats.analyses.skinAnalysis,
    stats.analyses.bodyAnalysis,
    stats.analyses.workoutAnalysis,
  ].filter(Boolean).length;

  return (
    <Card data-testid="top-achievements">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="w-5 h-5 text-yellow-500" />
          주요 성취
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 레벨 */}
        <AchievementItem
          icon={<Star className="w-5 h-5" />}
          title={`레벨 ${stats.achievements.currentLevel} 달성`}
          description={
            stats.achievements.levelUps > 0
              ? `올해 ${stats.achievements.levelUps}번 레벨업!`
              : '꾸준히 성장 중이에요'
          }
          highlight={stats.achievements.currentLevel >= 10}
        />

        {/* 뱃지 */}
        {stats.achievements.totalBadges > 0 && (
          <AchievementItem
            icon={<Award className="w-5 h-5" />}
            title={`${stats.achievements.totalBadges}개 뱃지 획득`}
            description="멋진 성과를 인정받았어요!"
            highlight={stats.achievements.totalBadges >= 5}
          />
        )}

        {/* 챌린지 */}
        {stats.achievements.challengesJoined > 0 && (
          <AchievementItem
            icon={<Users className="w-5 h-5" />}
            title={`${stats.achievements.challengesCompleted}/${stats.achievements.challengesJoined} 챌린지 완료`}
            description={
              stats.achievements.challengesCompleted === stats.achievements.challengesJoined
                ? '모든 챌린지를 완주했어요!'
                : '도전을 멈추지 않았어요'
            }
            highlight={stats.achievements.challengesCompleted >= 3}
          />
        )}

        {/* 분석 */}
        {analysisCount > 0 && (
          <AchievementItem
            icon={<Camera className="w-5 h-5" />}
            title={`${analysisCount}가지 AI 분석 완료`}
            description={getAnalysisDescription(stats.analyses)}
            highlight={analysisCount === 4}
          />
        )}

        {/* 소셜 */}
        {stats.social.friendsCount > 0 && (
          <AchievementItem
            icon={<Users className="w-5 h-5" />}
            title={`${stats.social.friendsCount}명의 친구`}
            description={`${stats.social.likesReceived}개의 좋아요를 받았어요`}
          />
        )}

        {/* 요약 뱃지들 */}
        <div className="flex flex-wrap gap-2 pt-2">
          {stats.workout.longestStreak >= 7 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              운동 습관 마스터
            </Badge>
          )}
          {stats.nutrition.longestStreak >= 7 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              식단 기록왕
            </Badge>
          )}
          {stats.achievements.currentLevel >= 5 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              꾸준한 실천가
            </Badge>
          )}
          {stats.social.activitiesShared >= 10 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              활발한 공유러
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getAnalysisDescription(analyses: YearlyStats['analyses']): string {
  const completed: string[] = [];
  if (analyses.personalColorAnalysis) completed.push('퍼스널컬러');
  if (analyses.skinAnalysis) completed.push('피부');
  if (analyses.bodyAnalysis) completed.push('체형');
  if (analyses.workoutAnalysis) completed.push('운동');

  if (completed.length === 4) {
    return '모든 분석을 완료했어요!';
  }
  return `${completed.join(', ')} 분석 완료`;
}
