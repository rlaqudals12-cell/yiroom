'use client';

import Link from 'next/link';
import { Palette, Sparkles, User, ArrowRight, Scissors, Heart, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  hasPersonalColor: boolean;
}

// 분석 메뉴 아이템
const ANALYSIS_ITEMS = [
  {
    id: 'personal-color',
    title: '퍼스널 컬러 진단',
    description: '나에게 어울리는 색상을 찾아보세요',
    icon: Palette,
    href: '/analysis/personal-color',
    bgColor: 'bg-gradient-personal-color',
    requiresPC: false, // PC 진단 필수 여부
  },
  {
    id: 'skin',
    title: '피부 분석',
    description: '피부 상태를 AI로 분석해보세요',
    icon: Sparkles,
    href: '/analysis/skin',
    bgColor: 'bg-gradient-skin',
    requiresPC: true,
  },
  {
    id: 'body',
    title: '체형 분석',
    description: '체형에 맞는 스타일을 추천받으세요',
    icon: User,
    href: '/analysis/body',
    bgColor: 'bg-gradient-body',
    requiresPC: true,
  },
  {
    id: 'hair',
    title: '헤어 분석',
    description: '두피와 모발 상태를 분석해보세요',
    icon: Scissors,
    href: '/analysis/hair',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
    requiresPC: false,
  },
  {
    id: 'makeup',
    title: '메이크업 분석',
    description: '나에게 어울리는 메이크업을 찾아보세요',
    icon: Heart,
    href: '/analysis/makeup',
    bgColor: 'bg-gradient-to-br from-rose-400 to-pink-500',
    requiresPC: true,
  },
  {
    id: 'oral-health',
    title: '구강건강 분석',
    description: '치아와 잇몸 건강을 체크해보세요',
    icon: SmilePlus,
    href: '/analysis/oral-health',
    bgColor: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    requiresPC: false,
  },
];

export default function QuickActions({ hasPersonalColor }: QuickActionsProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-4">분석 시작하기</h2>

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
                    PC 진단 필요
                  </div>
                )}

                {/* 아이콘 */}
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>

                {/* 텍스트 */}
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-white/80 text-sm mb-4">{item.description}</p>

                {/* 버튼 */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  {isLocked ? 'PC 진단 먼저' : '시작하기'}
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
