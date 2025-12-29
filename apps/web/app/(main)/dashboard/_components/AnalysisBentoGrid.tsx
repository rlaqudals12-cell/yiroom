'use client';

import Link from 'next/link';
import { Palette, Sparkles, User, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisSummary {
  id: string;
  type: 'personal-color' | 'skin' | 'body';
  createdAt: Date;
  summary: string;
  seasonType?: string;
  skinScore?: number;
  bodyType?: string;
}

interface AnalysisBentoGridProps {
  analyses: AnalysisSummary[];
  hasPersonalColor: boolean;
}

// 분석 타입별 설정
const ANALYSIS_CONFIG = {
  'personal-color': {
    icon: Palette,
    title: '퍼스널 컬러',
    href: '/analysis/personal-color',
    gradient: 'from-pink-500 via-rose-500 to-purple-500',
    lightGradient: 'from-pink-50 to-rose-50',
    iconColor: 'text-pink-500',
    badgeColor: 'bg-pink-100 text-pink-700',
  },
  skin: {
    icon: Sparkles,
    title: '피부 분석',
    href: '/analysis/skin',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    lightGradient: 'from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  body: {
    icon: User,
    title: '체형 분석',
    href: '/analysis/body',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    lightGradient: 'from-blue-50 to-indigo-50',
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
};

// 완료된 분석 카드 (큰 카드)
function CompletedCard({ analysis }: { analysis: AnalysisSummary }) {
  const config = ANALYSIS_CONFIG[analysis.type];
  const Icon = config.icon;
  const resultHref = `${config.href}/result/${analysis.id}`;

  return (
    <Link
      href={resultHref}
      className="group relative overflow-hidden rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* 그라데이션 상단 바 */}
      <div className={cn('h-1.5 bg-gradient-to-r', config.gradient)} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2 rounded-xl bg-gradient-to-br', config.lightGradient)}>
            <Icon className={cn('w-5 h-5', config.iconColor)} />
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-1">{config.title}</h3>
        <p className="text-lg font-bold text-foreground mb-2">{analysis.summary}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(analysis.createdAt)}
          </span>
          <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
            결과 보기 <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// 미완료 분석 카드 (작은 카드)
function PendingCard({ type, isLocked }: { type: 'personal-color' | 'skin' | 'body'; isLocked: boolean }) {
  const config = ANALYSIS_CONFIG[type];
  const Icon = config.icon;
  const href = isLocked ? '/analysis/personal-color' : config.href;

  return (
    <Link
      href={href}
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-300',
        isLocked
          ? 'bg-muted/50 opacity-60 hover:opacity-80'
          : 'bg-card hover:shadow-md hover:border-primary/30'
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-xl',
            isLocked ? 'bg-muted' : `bg-gradient-to-br ${config.lightGradient}`
          )}>
            <Icon className={cn('w-4 h-4', isLocked ? 'text-muted-foreground' : config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm">{config.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {isLocked ? 'PC 진단 후 이용 가능' : '진단 시작하기'}
            </p>
          </div>
          {isLocked ? (
            <Clock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          )}
        </div>
      </div>
    </Link>
  );
}

// 날짜 포맷
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/**
 * 벤토 스타일 분석 프로필 그리드
 * - 완료된 분석: 큰 카드로 표시
 * - 미완료 분석: 작은 카드로 CTA
 * - 항상 펼침 상태 (Collapsible 제거)
 */
export default function AnalysisBentoGrid({ analyses, hasPersonalColor }: AnalysisBentoGridProps) {
  // 분석 타입별 완료 여부 확인
  const completedTypes = new Set(analyses.map(a => a.type));
  const allTypes: Array<'personal-color' | 'skin' | 'body'> = ['personal-color', 'skin', 'body'];
  const pendingTypes = allTypes.filter(t => !completedTypes.has(t));

  // 완료된 분석 개수
  const completedCount = analyses.length;
  const totalCount = 3;

  return (
    <section
      className="space-y-4"
      data-testid="analysis-bento-grid"
      aria-label="내 분석 프로필"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">내 분석 프로필</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount === 0
              ? '첫 분석을 시작해보세요'
              : `${completedCount}/${totalCount} 완료`}
          </p>
        </div>
        {/* 진행률 표시 */}
        <div className="flex items-center gap-2">
          {allTypes.map((type) => {
            const isCompleted = completedTypes.has(type);
            const config = ANALYSIS_CONFIG[type];
            return (
              <div
                key={type}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  isCompleted
                    ? `bg-gradient-to-br ${config.lightGradient}`
                    : 'bg-muted'
                )}
                title={`${config.title} ${isCompleted ? '완료' : '미완료'}`}
              >
                <config.icon className={cn(
                  'w-4 h-4',
                  isCompleted ? config.iconColor : 'text-muted-foreground/50'
                )} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 벤토 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 완료된 분석 카드 */}
        {analyses.map((analysis) => (
          <CompletedCard key={analysis.id} analysis={analysis} />
        ))}

        {/* 미완료 분석 카드 */}
        {pendingTypes.map((type) => (
          <PendingCard
            key={type}
            type={type}
            isLocked={type !== 'personal-color' && !hasPersonalColor}
          />
        ))}
      </div>

      {/* 모든 분석 완료 시 축하 메시지 */}
      {completedCount === totalCount && (
        <div className="text-center py-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border border-amber-200">
          <p className="text-sm font-medium text-amber-800">
            모든 분석을 완료했어요! 통합 리포트를 확인해보세요
          </p>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-1"
          >
            리포트 보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}
