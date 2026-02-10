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
  PersonStanding,
  SmilePlus,
} from 'lucide-react';

/**
 * /analysis 메인 페이지
 * 분석 모듈 메뉴 목록 (카테고리별 그룹화)
 *
 * 색상은 globals.css의 모듈 색상 변수 사용 (하드코딩 금지)
 * @see globals.css --module-* 변수
 */

interface AnalysisModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  /** CSS 변수명 (--module-xxx에서 xxx 부분) */
  moduleVar: string;
}

interface AnalysisCategory {
  id: string;
  title: string;
  modules: AnalysisModule[];
}

const ANALYSIS_CATEGORIES: AnalysisCategory[] = [
  {
    id: 'beauty',
    title: '뷰티',
    modules: [
      {
        id: 'personal-color',
        title: '퍼스널 컬러',
        description: '나에게 어울리는 컬러를 찾아보세요',
        href: '/analysis/personal-color',
        icon: <Palette className="w-6 h-6" />,
        moduleVar: 'personal-color',
      },
      {
        id: 'skin',
        title: '피부 분석',
        description: 'AI가 피부 상태를 정밀 분석해요',
        href: '/analysis/skin',
        icon: <Sparkles className="w-6 h-6" />,
        moduleVar: 'skin',
      },
      {
        id: 'makeup',
        title: '메이크업',
        description: '나에게 어울리는 메이크업을 추천해요',
        href: '/analysis/makeup',
        icon: <Wand2 className="w-6 h-6" />,
        moduleVar: 'makeup',
      },
      {
        id: 'hair',
        title: '헤어 분석',
        description: '두피와 모발 상태를 분석해요',
        href: '/analysis/hair',
        icon: <Scissors className="w-6 h-6" />,
        moduleVar: 'hair',
      },
    ],
  },
  {
    id: 'body',
    title: '바디',
    modules: [
      {
        id: 'face',
        title: '얼굴형 분석',
        description: '얼굴형과 이목구비를 정밀 분석해요',
        href: '/analysis/face',
        icon: <ScanFace className="w-6 h-6" />,
        moduleVar: 'face',
      },
      {
        id: 'body',
        title: '체형 분석',
        description: '체형에 맞는 스타일을 추천해요',
        href: '/analysis/body',
        icon: <Activity className="w-6 h-6" />,
        moduleVar: 'body',
      },
      {
        id: 'posture',
        title: '자세 분석',
        description: '자세를 분석하고 교정 방법을 알려드려요',
        href: '/analysis/posture',
        icon: <PersonStanding className="w-6 h-6" />,
        moduleVar: 'posture',
      },
    ],
  },
  {
    id: 'health',
    title: '건강',
    modules: [
      {
        id: 'oral-health',
        title: '구강 건강',
        description: '구강 상태를 분석하고 관리법을 알려드려요',
        href: '/analysis/oral-health',
        icon: <SmilePlus className="w-6 h-6" />,
        moduleVar: 'oral-health',
      },
    ],
  },
];

export default function AnalysisPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted pb-24" data-testid="analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">AI 분석</h1>
          <p className="text-muted-foreground mt-2">나를 더 잘 알아가는 첫 걸음</p>
        </header>

        {/* 카테고리별 분석 모듈 목록 */}
        {ANALYSIS_CATEGORIES.map((category) => (
          <section key={category.id} className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 px-1">{category.title}</h2>
            <div className="space-y-3">
              {category.modules.map((module) => (
                <Link
                  key={module.id}
                  href={module.href}
                  className="block bg-white dark:bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`analysis-module-${module.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `var(--module-${module.moduleVar}-light)`,
                        color: `var(--module-${module.moduleVar})`,
                      }}
                    >
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* 추가 안내 */}
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            background: `linear-gradient(to right, var(--module-personal-color-light), var(--module-oral-health-light))`,
          }}
        >
          <p className="text-sm text-muted-foreground text-center">
            모든 분석은 AI 기반으로 진행되며,
            <br />
            결과는 참고용으로만 사용해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
