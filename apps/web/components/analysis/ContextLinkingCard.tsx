'use client';

import Link from 'next/link';
import {
  Palette,
  Sparkles,
  Activity,
  Scissors,
  ChevronRight,
  ScanFace,
  Wand2,
  Dumbbell,
  Apple,
} from 'lucide-react';

/**
 * 컨텍스트 기반 다음 분석 추천 카드
 * 분석 결과 페이지에서 관련 분석으로 자연스럽게 유도
 *
 * @example
 * <ContextLinkingCard currentModule="personal-color" />
 */

interface RelatedModule {
  id: string;
  title: string;
  reason: string;
  href: string;
  icon: React.ReactNode;
  moduleVar: string;
}

interface ContextLinkingCardProps {
  /** 현재 분석 모듈 ID */
  currentModule: string;
  /** 이미 완료한 분석 모듈 ID 배열 (제외 처리) */
  completedModules?: string[];
}

// 모듈 아이콘 매핑
const MODULE_ICONS: Record<string, React.ReactNode> = {
  'personal-color': <Palette className="w-5 h-5" />,
  skin: <Sparkles className="w-5 h-5" />,
  makeup: <Wand2 className="w-5 h-5" />,
  hair: <Scissors className="w-5 h-5" />,
  face: <ScanFace className="w-5 h-5" />,
  body: <Activity className="w-5 h-5" />,
  workout: <Dumbbell className="w-5 h-5" />,
  nutrition: <Apple className="w-5 h-5" />,
};

// 모듈별 추천 연결 (도메인 논리 기반)
const MODULE_CONNECTIONS: Record<string, Omit<RelatedModule, 'icon'>[]> = {
  'personal-color': [
    {
      id: 'makeup',
      title: '메이크업 분석',
      reason: '퍼스널 컬러에 맞는 메이크업을 찾아보세요',
      href: '/analysis/makeup',
      moduleVar: 'makeup',
    },
    {
      id: 'hair',
      title: '헤어 분석',
      reason: '어울리는 헤어 컬러를 추천받아보세요',
      href: '/analysis/hair',
      moduleVar: 'hair',
    },
  ],
  skin: [
    {
      id: 'makeup',
      title: '메이크업 분석',
      reason: '피부 상태에 맞는 메이크업 팁을 받아보세요',
      href: '/analysis/makeup',
      moduleVar: 'makeup',
    },
  ],
  body: [
    {
      id: 'workout',
      title: '운동 추천',
      reason: '체형에 맞는 운동 플랜을 설계해보세요',
      href: '/workout/onboarding/step1',
      moduleVar: 'workout',
    },
    {
      id: 'nutrition',
      title: '영양 분석',
      reason: '체형 목표에 맞는 식단을 설계해보세요',
      href: '/nutrition',
      moduleVar: 'nutrition',
    },
  ],
  face: [
    {
      id: 'hair',
      title: '헤어 분석',
      reason: '얼굴형에 어울리는 헤어스타일을 찾아보세요',
      href: '/analysis/hair',
      moduleVar: 'hair',
    },
    {
      id: 'makeup',
      title: '메이크업 분석',
      reason: '얼굴형을 보완하는 메이크업 팁을 받아보세요',
      href: '/analysis/makeup',
      moduleVar: 'makeup',
    },
  ],
  hair: [
    {
      id: 'personal-color',
      title: '퍼스널 컬러',
      reason: '어울리는 헤어 컬러의 근거를 확인해보세요',
      href: '/analysis/personal-color',
      moduleVar: 'personal-color',
    },
  ],
  makeup: [
    {
      id: 'personal-color',
      title: '퍼스널 컬러',
      reason: '메이크업 컬러 선택의 기준이 되는 분석이에요',
      href: '/analysis/personal-color',
      moduleVar: 'personal-color',
    },
    {
      id: 'skin',
      title: '피부 분석',
      reason: '피부 상태에 맞는 메이크업 제품을 찾아보세요',
      href: '/analysis/skin',
      moduleVar: 'skin',
    },
  ],
};

export function ContextLinkingCard({
  currentModule,
  completedModules = [],
}: ContextLinkingCardProps) {
  const connections = MODULE_CONNECTIONS[currentModule] || [];

  // 완료된 모듈 제외
  const filteredConnections = connections.filter((module) => !completedModules.includes(module.id));

  // 추천할 모듈이 없으면 렌더링하지 않음
  if (filteredConnections.length === 0) {
    return null;
  }

  // 아이콘 추가
  const modulesWithIcons: RelatedModule[] = filteredConnections.map((module) => ({
    ...module,
    icon: MODULE_ICONS[module.id] || <ChevronRight className="w-5 h-5" />,
  }));

  return (
    <section className="mt-8 p-6 bg-muted rounded-xl" data-testid="context-linking-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">다음 분석도 해보세요</h3>
      <div className="space-y-3">
        {modulesWithIcons.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-lg hover:shadow-md transition-shadow"
            data-testid={`context-link-${module.id}`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `var(--module-${module.moduleVar}-light)`,
                color: `var(--module-${module.moduleVar})`,
              }}
            >
              {module.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{module.title}</p>
              <p className="text-sm text-muted-foreground truncate">{module.reason}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ContextLinkingCard;
