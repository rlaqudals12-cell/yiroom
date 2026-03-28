'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Palette, Sparkles, User, Scissors, Heart, SmilePlus, Lightbulb } from 'lucide-react';

// 분석 카드 아이템 정의 (텍스트는 컴포넌트 내 t()에서 주입)
const ANALYSIS_CARDS = [
  {
    id: 'personal-color',
    titleKey: 'analysisTypes.personalColor',
    descKey: 'analysisTypes.personalColorDesc',
    icon: Palette,
    href: '/analysis/personal-color',
    gradient: 'from-violet-500 to-purple-600',
    recommended: true,
  },
  {
    id: 'skin',
    titleKey: 'analysisTypes.skin',
    descKey: 'analysisTypes.skinDesc',
    icon: Sparkles,
    href: '/analysis/skin',
    gradient: 'from-rose-400 to-pink-500',
    recommended: false,
  },
  {
    id: 'body',
    titleKey: 'analysisTypes.body',
    descKey: 'analysisTypes.bodyDesc',
    icon: User,
    href: '/analysis/body',
    gradient: 'from-blue-400 to-indigo-500',
    recommended: false,
  },
  {
    id: 'hair',
    titleKey: 'analysisTypes.hair',
    descKey: 'analysisTypes.hairDesc',
    icon: Scissors,
    href: '/analysis/hair',
    gradient: 'from-amber-400 to-orange-500',
    recommended: false,
  },
  {
    id: 'makeup',
    titleKey: 'analysisTypes.makeup',
    descKey: 'analysisTypes.makeupDesc',
    icon: Heart,
    href: '/analysis/makeup',
    gradient: 'from-pink-400 to-rose-500',
    recommended: false,
  },
  {
    id: 'oral-health',
    titleKey: 'analysisTypes.oralHealth',
    descKey: 'analysisTypes.oralHealthDesc',
    icon: SmilePlus,
    href: '/analysis/oral-health',
    gradient: 'from-cyan-400 to-blue-500',
    recommended: false,
  },
];

/**
 * 신규 사용자용 분석 시작 유도 섹션
 * - 분석이 0개인 사용자에게 표시
 * - 눈에 띄는 CTA로 분석 시작 유도
 * - 퍼스널 컬러 분석 권장 표시
 */
export default function AnalysisPromptSection() {
  const t = useTranslations('dashboard');
  return (
    <section
      className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl border border-border/50 p-6"
      data-testid="analysis-prompt-section"
    >
      {/* 섹션 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">{t('prompt.journeyTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('prompt.journeyDesc')}</p>
      </div>

      {/* 분석 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {ANALYSIS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              href={card.href}
              className="group relative"
              data-testid={`analysis-card-${card.id}`}
            >
              <div
                className={`
                  relative overflow-hidden rounded-xl p-4 h-full
                  bg-gradient-to-br ${card.gradient} text-white
                  hover:shadow-lg hover:scale-[1.02] transition-all duration-200
                  ${card.recommended ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background' : ''}
                `}
              >
                {/* 추천 배지 */}
                {card.recommended && (
                  <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-sm">
                    {t('prompt.recommended')}
                  </div>
                )}

                {/* 아이콘 */}
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>

                {/* 텍스트 */}
                <h3 className="font-semibold text-sm mb-1">{t(card.titleKey)}</h3>
                <p className="text-white/80 text-xs">{t(card.descKey)}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">{t('prompt.pcFirstTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('prompt.pcFirstHint')}</p>
        </div>
      </div>
    </section>
  );
}
