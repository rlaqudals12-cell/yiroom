'use client';

import Link from 'next/link';
import { Palette, Sparkles, User, ChevronRight, Scissors, Heart, SmilePlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';

// 상대 시간 포맷팅 헬퍼 함수 (t 함수를 인자로 받음)
function formatRelativeTime(
  date: Date,
  locale: string,
  t: (key: string, values?: Record<string, unknown>) => string
): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('time.justNow');
  if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
  if (diffDays < 30) return t('time.weeksAgo', { count: Math.floor(diffDays / 7) });
  return date.toLocaleDateString(getDateLocale(locale));
}

interface AnalysisSummary {
  id: string;
  type: 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup' | 'oral-health';
  createdAt: Date;
  summary: string;
  seasonType?: string;
  skinScore?: number;
  bodyType?: string;
  hairScore?: number;
  hairType?: string;
  undertone?: string;
}

interface AnalysisCardProps {
  analysis: AnalysisSummary;
}

// 분석 타입별 설정 (title은 컴포넌트 내 t()에서 주입)
const ANALYSIS_CONFIG = {
  'personal-color': {
    titleKey: 'analysisTypes.personalColor',
    icon: Palette,
    baseHref: '/analysis/personal-color',
    bgColor: 'bg-module-personal-color-light',
    borderColor: 'border-module-personal-color/30',
    iconColor: 'text-module-personal-color',
  },
  skin: {
    titleKey: 'analysisTypes.skinAnalysis',
    icon: Sparkles,
    baseHref: '/analysis/skin',
    bgColor: 'bg-module-skin-light',
    borderColor: 'border-module-skin/30',
    iconColor: 'text-module-skin',
  },
  body: {
    titleKey: 'analysisTypes.bodyAnalysis',
    icon: User,
    baseHref: '/analysis/body',
    bgColor: 'bg-module-body-light',
    borderColor: 'border-module-body/30',
    iconColor: 'text-module-body',
  },
  hair: {
    titleKey: 'analysisTypes.hairAnalysis',
    icon: Scissors,
    baseHref: '/analysis/hair',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200/50',
    iconColor: 'text-amber-600',
  },
  makeup: {
    titleKey: 'analysisTypes.makeupAnalysis',
    icon: Heart,
    baseHref: '/analysis/makeup',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200/50',
    iconColor: 'text-rose-500',
  },
  'oral-health': {
    titleKey: 'analysisTypes.oralHealth',
    icon: SmilePlus,
    baseHref: '/analysis/oral-health',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200/50',
    iconColor: 'text-cyan-600',
  },
};

// 분석 결과가 있으면 결과 페이지로, 없으면 분석 페이지로
function getAnalysisHref(type: AnalysisSummary['type'], id: string): string {
  return `${ANALYSIS_CONFIG[type].baseHref}/result/${id}`;
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const config = ANALYSIS_CONFIG[analysis.type];
  const Icon = config.icon;
  // 분석 결과가 있으므로 결과 페이지로 바로 이동
  const href = getAnalysisHref(analysis.type, analysis.id);

  // 시간 포맷팅 (한국어 상대 시간)
  const timeAgo = formatRelativeTime(analysis.createdAt, locale, t);

  return (
    <Link href={href}>
      <div
        className={`
          ${config.bgColor} ${config.borderColor}
          rounded-xl border p-5
          hover:shadow-md transition-shadow cursor-pointer
          group
        `}
      >
        {/* 상단: 아이콘 + 타이틀 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-card/70 ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground">{t(config.titleKey)}</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {/* 결과 요약 */}
        <p className="text-lg font-medium text-foreground mb-2">{analysis.summary}</p>

        {/* 시간 정보 */}
        <p className="text-sm text-muted-foreground">{timeAgo}</p>
      </div>
    </Link>
  );
}
