'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Palette, Sparkles, User, ArrowRight, Scissors, Heart, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  hasPersonalColor: boolean;
}

// 분석 메뉴 아이템 (텍스트는 컴포넌트 내 t()에서 주입)
const ANALYSIS_ITEMS = [
  {
    id: 'personal-color',
    titleKey: 'quickActions.pcTitle',
    descKey: 'quickActions.pcDesc',
    icon: Palette,
    href: '/analysis/personal-color',
    bgColor: 'bg-gradient-personal-color',
    requiresPC: false,
  },
  {
    id: 'skin',
    titleKey: 'quickActions.skinTitle',
    descKey: 'quickActions.skinDesc',
    icon: Sparkles,
    href: '/analysis/skin',
    bgColor: 'bg-gradient-skin',
    requiresPC: true,
  },
  {
    id: 'body',
    titleKey: 'quickActions.bodyTitle',
    descKey: 'quickActions.bodyDesc',
    icon: User,
    href: '/analysis/body',
    bgColor: 'bg-gradient-body',
    requiresPC: true,
  },
  {
    id: 'hair',
    titleKey: 'quickActions.hairTitle',
    descKey: 'quickActions.hairDesc',
    icon: Scissors,
    href: '/analysis/hair',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
    requiresPC: false,
  },
  {
    id: 'makeup',
    titleKey: 'quickActions.makeupTitle',
    descKey: 'quickActions.makeupDesc',
    icon: Heart,
    href: '/analysis/makeup',
    bgColor: 'bg-gradient-to-br from-rose-400 to-pink-500',
    requiresPC: true,
  },
  {
    id: 'oral-health',
    titleKey: 'quickActions.oralHealthTitle',
    descKey: 'quickActions.oralHealthDesc',
    icon: SmilePlus,
    href: '/analysis/oral-health',
    bgColor: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    requiresPC: false,
  },
];

export default function QuickActions({ hasPersonalColor }: QuickActionsProps) {
  const t = useTranslations('dashboard');
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-4">{t('quickActions.sectionTitle')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ANALYSIS_ITEMS.map((item) => {
          const Icon = item.icon;
          const isLocked = item.requiresPC && !hasPersonalColor;

          return (
            <Link
              key={item.id}
              href={isLocked ? '/analysis/personal-color' : item.href}
              className="block"
            >
              <div
                className={`
                  relative overflow-hidden rounded-xl p-5 h-full
                  ${item.bgColor} text-white
                  hover:shadow-lg transition-shadow
                  ${isLocked ? 'opacity-70' : ''}
                `}
              >
                {/* 잠금 표시 */}
                {isLocked && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/20 rounded-full text-xs">
                    {t('quickActions.pcRequired')}
                  </div>
                )}

                {/* 아이콘 */}
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>

                {/* 텍스트 */}
                <h3 className="font-semibold text-lg mb-1">{t(item.titleKey)}</h3>
                <p className="text-white/80 text-sm mb-4">{t(item.descKey)}</p>

                {/* 버튼 */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  {isLocked ? t('quickActions.pcFirst') : t('quickActions.start')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
